// Packages
import { ApplicationStatus, SettlementMethod } from "@prisma/client";
import { Response } from "express";

// Errors
import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "../errors/http-error";

// Data
import prisma from "../lib/prisma";

// Policies
import { assertPaymentWindowOpen } from "../services/policies/payment-policy";
import {
    applicationScope,
    assertPendingApplication,
} from "../services/policies/access-policy";
import {
    activeLeaseWhere,
    canApply,
    quoteAllowed,
} from "../services/policies/rental-policy";
import { isLeaseAgreementSetupComplete } from "../services/policies/signing-profile";

// Services
import { assertFirstPaymentAvailable } from "../services/application-payment.service";

// Utils
import { parseIntegerId } from "../utils/utils";

// Types
import type { AuthenticatedRequest } from "../types/global";

export const listApplications = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const applications = await prisma.application.findMany({
        where: applicationScope(req.user!),
        include: {
            property: {
                include: {
                    location: true,
                    manager: {
                        include: {
                            user: true,
                        },
                    },
                },
            },
            tenant: {
                include: {
                    user: true,
                },
            },
            lease: { include: { payments: { select: { id: true } } } },
        },
    });

    function calculateNextPaymentDate(startDate: Date): Date {
        const today = new Date();
        const nextPaymentDate = new Date(startDate);

        while (nextPaymentDate <= today) {
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);
        }

        return nextPaymentDate;
    }

    const formattedApplications = applications.map((application) => {
        const lease = application.lease;
        return {
            ...application,
            property: {
                ...application.property,
                address: application.property.location.address,
            },
            manager: application.property.manager,
            firstPaymentAvailable:
                application.status === ApplicationStatus.Approved &&
                !application.paidAt &&
                !application.cancellationRequestedAt &&
                (!application.paymentDueAt ||
                    application.paymentDueAt > new Date() ||
                    !!application.tenantConfirmedAt) &&
                (!lease ||
                    (lease.propertyId === application.propertyId &&
                        lease.tenantUserId === application.tenantUserId &&
                        lease.endDate >= new Date() &&
                        lease.payments.length === 0)),
            paymentRecordExists: !!lease?.payments.length,
            lease: lease
                ? {
                      ...lease,
                      payments: undefined,
                      nextPaymentDate: calculateNextPaymentDate(
                          lease.startDate
                      ),
                      renewalAvailable:
                          lease.endDate.getTime() > Date.now() &&
                          lease.endDate.getTime() - Date.now() <=
                              60 * 86_400_000 &&
                          lease.renewalStatus !== "Requested",
                  }
                : null,
        };
    });

    return res.status(200).json({
        success: true,
        data: formattedApplications,
    });
};

export const createApplication = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const { propertyId, name, email, phoneNumber, message } = req.body;

    if (message != null && typeof message !== "string") {
        throw new BadRequestError("Application message must be text");
    }
    const applicationMessage =
        typeof message === "string" ? message.trim() : "";
    const messageWordCount = applicationMessage
        ? applicationMessage.split(/\s+/u).length
        : 0;
    if (
        (typeof message === "string" && message.length > 1000) ||
        messageWordCount > 150
    ) {
        throw new BadRequestError(
            "Application message must be 150 words and 1,000 characters or fewer"
        );
    }

    const parsedPropertyId = Number(propertyId);
    if (!Number.isInteger(parsedPropertyId) || parsedPropertyId <= 0) {
        throw new BadRequestError("Invalid property ID");
    }
    const newApplication = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT id FROM "Property" WHERE id = ${parsedPropertyId} FOR UPDATE`;
        const property = await tx.property.findUnique({
            where: { id: parsedPropertyId },
        });
        if (!property) throw new NotFoundError("Property not found");
        const occupied = await tx.lease.findFirst({
            where: { propertyId: parsedPropertyId, ...activeLeaseWhere() },
            select: { id: true },
        });
        if (!canApply(property, !!occupied))
            throw new ConflictError(
                "This property is not accepting applications"
            );
        const existing = await tx.application.findFirst({
            where: {
                propertyId: parsedPropertyId,
                tenantUserId: req.user!.id,
                status: {
                    in: [ApplicationStatus.Pending, ApplicationStatus.Approved],
                },
            },
        });
        if (existing)
            throw new ConflictError(
                "You already have an active application for this property"
            );
        return tx.application.create({
            data: {
                applicationDate: new Date(),
                status: ApplicationStatus.Pending,
                name,
                email,
                phoneNumber,
                message: applicationMessage || null,
                originalMonthlyRent: property.pricePerMonth,
                agreedMonthlyRent: property.pricePerMonth,
                originalDeposit: property.securityDeposit,
                property: { connect: { id: parsedPropertyId } },
                tenant: { connect: { userId: req.user!.id } },
            },
            include: { property: true, tenant: true, lease: true },
        });
    });

    return res.status(201).json({
        success: true,
        data: newApplication,
    });
};

export const updateApplication = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const { id } = req.params;
    const { status } = req.body;
    const reason =
        typeof req.body.reason === "string" ? req.body.reason.trim() : "";
    if (req.body.reason != null && typeof req.body.reason !== "string")
        throw new BadRequestError("Reason must be text");
    if (reason.length > 500)
        throw new BadRequestError("Reason must be 500 characters or fewer");
    if (
        status === ApplicationStatus.Denied &&
        req.body.reason != null &&
        reason.length < 10
    )
        throw new BadRequestError("Reason must be at least 10 characters");
    if (
        status !== ApplicationStatus.Approved &&
        status !== ApplicationStatus.Denied
    ) {
        throw new BadRequestError("Invalid application status");
    }
    const paymentDueDays =
        req.body.paymentDueDays === undefined ? 14 : req.body.paymentDueDays;
    if (
        status === ApplicationStatus.Approved &&
        (!Number.isInteger(paymentDueDays) ||
            paymentDueDays < 7 ||
            paymentDueDays > 21)
    ) {
        throw new BadRequestError(
            "Payment deadline must be 7–21 days after approval"
        );
    }

    const updatedApplication = await prisma.$transaction(async (tx) => {
        const seed = await tx.application.findUnique({
            where: { id: Number(id) },
            include: { property: true },
        });
        if (!seed) throw new NotFoundError("Application not found");
        if (seed.property.managerUserId !== req.user!.id) {
            throw new ForbiddenError("Application access denied");
        }
        // Serialize approvals per property so two applicants cannot win the same listing.
        await tx.$queryRaw`SELECT id FROM "Property" WHERE id = ${seed.propertyId} FOR UPDATE`;
        const application = await tx.application.findUniqueOrThrow({
            where: { id: seed.id },
            include: { property: true },
        });
        assertPendingApplication(application.status);
        if (status === ApplicationStatus.Approved) {
            const signingProfile = await tx.managerSigningProfile.findUnique({
                where: { managerUserId: req.user!.id },
            });
            if (!isLeaseAgreementSetupComplete(signingProfile)) {
                throw new ForbiddenError(
                    "Complete lease agreement setup before approving applications"
                );
            }
            const listing = await tx.property.findUniqueOrThrow({
                where: { id: application.propertyId },
            });
            if (!canApply(listing, false))
                throw new ConflictError("This property is closed");
            const otherApproved = await tx.application.findFirst({
                where: {
                    propertyId: application.propertyId,
                    id: { not: application.id },
                    status: ApplicationStatus.Approved,
                    leaseId: null,
                },
                select: { id: true },
            });
            if (otherApproved)
                throw new ConflictError(
                    "Another application is already awaiting payment"
                );
            const occupied = await tx.lease.findFirst({
                where: {
                    propertyId: application.propertyId,
                    ...activeLeaseWhere(),
                },
                select: { id: true },
            });
            if (occupied)
                throw new ConflictError(
                    "This property already has an active lease"
                );
        }

        const approvedAt =
            status === ApplicationStatus.Approved ? new Date() : null;
        const paymentDueAt = approvedAt
            ? new Date(approvedAt.getTime() + paymentDueDays * 86_400_000)
            : null;
        const claimed = await tx.application.updateMany({
            // The status condition rejects a review that raced with this transaction.
            where: { id: application.id, status: application.status },
            data: {
                status,
                denialReason:
                    status === ApplicationStatus.Denied ? reason || null : null,
                ...(approvedAt ? { approvedAt, paymentDueAt } : {}),
            },
        });
        if (claimed.count !== 1)
            throw new ConflictError("Application has already been reviewed");

        if (status === ApplicationStatus.Denied) {
            await tx.notification.create({
                data: {
                    userId: application.tenantUserId,
                    kind: "ApplicationDenied",
                    title: "Application declined",
                    body: `Your application for ${application.property.name} was declined.${reason ? ` Reason: ${reason}` : ""}`,
                    resourceId: application.id,
                },
            });
        } else {
            await tx.notification.create({
                data: {
                    userId: application.tenantUserId,
                    kind: "ApplicationApproved",
                    title: "Application approved",
                    body: `Your application for ${application.property.name} was approved. Confirm payment by ${paymentDueAt!.toLocaleDateString()}.`,
                    resourceId: application.id,
                },
            });
        }

        return tx.application.findUnique({
            where: { id: application.id },
            include: { property: true, tenant: true, lease: true },
        });
    });

    return res.status(200).json({
        success: true,
        data: updatedApplication,
    });
};

export const scheduleLegacyPaymentDeadline = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const id = Number(req.params.id);
    const paymentDueDays = req.body.paymentDueDays;
    if (!Number.isInteger(id) || id <= 0)
        throw new BadRequestError("Invalid application ID");
    if (
        !Number.isInteger(paymentDueDays) ||
        paymentDueDays < 7 ||
        paymentDueDays > 21
    ) {
        throw new BadRequestError(
            "Payment deadline must be 7–21 days from today"
        );
    }

    const updatedApplication = await prisma.$transaction(async (tx) => {
        // Legacy approvals get one deadline only if no payment or cancellation has begun.
        const seed = await tx.application.findUnique({
            where: { id },
            include: { property: true },
        });
        if (!seed) throw new NotFoundError("Application not found");
        if (seed.property.managerUserId !== req.user!.id)
            throw new ForbiddenError("Application access denied");
        await tx.$queryRaw`SELECT id FROM "Property" WHERE id = ${seed.propertyId} FOR UPDATE`;
        const application = await tx.application.findUnique({
            where: { id },
            include: { property: true },
        });
        if (
            !application ||
            application.status !== ApplicationStatus.Approved ||
            application.leaseId ||
            application.paidAt ||
            application.approvedAt ||
            application.paymentDueAt ||
            application.tenantConfirmedAt ||
            application.managerConfirmedAt ||
            application.cancellationRequestedAt
        ) {
            throw new ConflictError(
                "Only an approved legacy application without a lease or payment can receive a new deadline"
            );
        }
        const approvedAt = new Date();
        const paymentDueAt = new Date(
            approvedAt.getTime() + paymentDueDays * 86_400_000
        );
        const claimed = await tx.application.updateMany({
            where: {
                id,
                status: ApplicationStatus.Approved,
                leaseId: null,
                paidAt: null,
                approvedAt: null,
                paymentDueAt: null,
                tenantConfirmedAt: null,
                managerConfirmedAt: null,
                cancellationRequestedAt: null,
            },
            data: { approvedAt, paymentDueAt },
        });
        if (claimed.count !== 1)
            throw new ConflictError(
                "This application has changed; refresh and try again"
            );
        await tx.notification.create({
            data: {
                userId: application.tenantUserId,
                kind: "ApplicationApproved",
                title: "Payment deadline set",
                body: `${application.property.name}: please confirm your first payment by ${paymentDueAt.toLocaleDateString()}.`,
                resourceId: id,
            },
        });
        return tx.application.findUniqueOrThrow({ where: { id } });
    });
    return res.status(200).json({ success: true, data: updatedApplication });
};

export const requestApplicationCancellation = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const id = Number(req.params.id);
    const reason =
        typeof req.body.reason === "string" ? req.body.reason.trim() : "";
    if (
        !Number.isInteger(id) ||
        id <= 0 ||
        reason.length < 10 ||
        reason.length > 500
    ) {
        throw new BadRequestError(
            "Give a cancellation reason of 10–500 characters"
        );
    }
    // Record the irreversible 48-hour cancellation window without denying the application yet.
    const updated = await prisma.$transaction(async (tx) => {
        const seed = await tx.application.findUnique({
            where: { id },
            select: { propertyId: true },
        });
        if (!seed) throw new NotFoundError("Application not found");
        await tx.$queryRaw`SELECT id FROM "Property" WHERE id = ${seed.propertyId} FOR UPDATE`;
        const application = await tx.application.findUnique({
            where: { id },
            include: { property: true },
        });
        if (!application) throw new NotFoundError("Application not found");
        if (application.property.managerUserId !== req.user!.id)
            throw new ForbiddenError("Application access denied");
        if (
            application.status !== ApplicationStatus.Approved ||
            application.leaseId ||
            application.paidAt ||
            application.cancellationRequestedAt ||
            application.tenantConfirmedAt ||
            application.managerConfirmedAt ||
            (application.paymentDisputedAt &&
                !application.paymentDisputeResolvedAt)
        ) {
            throw new ConflictError(
                "This application cannot be cancelled at its current payment stage"
            );
        }
        if (application.paymentDueAt && application.paymentDueAt <= new Date())
            throw new ConflictError(
                "The payment deadline has passed; automatic expiry will handle this application"
            );
        const cancellationRequestedAt = new Date();
        const cancellationExecuteAt = new Date(
            cancellationRequestedAt.getTime() + 48 * 3_600_000
        );
        const result = await tx.application.update({
            where: { id },
            data: {
                cancellationRequestedAt,
                cancellationExecuteAt,
                cancellationReason: reason,
            },
        });
        await tx.notification.createMany({
            data: [
                {
                    userId: application.tenantUserId,
                    kind: "ApplicationCancellationScheduled",
                    title: "Application cancellation scheduled",
                    body: `The manager requested cancellation of ${application.property.name}. Reason: ${reason}. The application will be declined on ${cancellationExecuteAt.toLocaleString()}.`,
                    resourceId: id,
                },
                {
                    userId: application.property.managerUserId,
                    kind: "ApplicationCancellationScheduled",
                    title: "Cancellation confirmed by the system",
                    body: `Cancellation of ${application.property.name} is locked and scheduled for ${cancellationExecuteAt.toLocaleString()}.`,
                    resourceId: id,
                },
            ],
        });
        return result;
    });
    return res.json({ success: true, data: updated });
};

export const updateApplicationQuote = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const id = Number(req.params.id);
    const monthlyRent = Number(req.body.monthlyRent);
    if (!Number.isInteger(id) || !Number.isFinite(monthlyRent))
        throw new BadRequestError("Invalid monthly rent");
    const updated = await prisma.$transaction(async (tx) => {
        const application = await tx.application.findUnique({
            where: { id },
            include: { property: true },
        });
        if (!application) throw new NotFoundError("Application not found");
        if (application.property.managerUserId !== req.user!.id)
            throw new ForbiddenError("Application access denied");
        await tx.$queryRaw`SELECT id FROM "Property" WHERE id = ${application.propertyId} FOR UPDATE`;
        const latest = await tx.application.findUniqueOrThrow({
            where: { id },
            include: { property: true },
        });
        if (
            latest.tenantConfirmedAt ||
            latest.managerConfirmedAt ||
            (latest.paymentDisputedAt && !latest.paymentDisputeResolvedAt)
        ) {
            throw new ConflictError(
                "The offer cannot change after a payment claim or dispute"
            );
        }
        assertPaymentWindowOpen(latest);
        const original =
            latest.originalMonthlyRent ?? latest.property.pricePerMonth;
        const current = latest.agreedMonthlyRent ?? original;
        if (
            !quoteAllowed(latest.status, original, monthlyRent, current) ||
            latest.leaseId
        ) {
            throw new ConflictError(
                "This monthly rent cannot be changed at this stage"
            );
        }
        return tx.application.update({
            where: { id },
            data: {
                agreedMonthlyRent: monthlyRent,
                transferReference: null,
            },
        });
    });
    return res.json({ success: true, data: updated });
};

export const chooseSettlementMethod = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const id = Number(req.params.id);
    const method = req.body.method;
    if (!Number.isInteger(id) || method !== SettlementMethod.Cash)
        throw new BadRequestError("Only cash payment is available right now");
    const updated = await prisma.$transaction(async (tx) => {
        const seed = await tx.application.findUnique({
            where: { id },
            select: { propertyId: true },
        });
        if (!seed) throw new NotFoundError("Application not found");
        await tx.$queryRaw`SELECT id FROM "Property" WHERE id = ${seed.propertyId} FOR UPDATE`;
        const application = await tx.application.findUnique({
            where: { id },
            include: { property: true },
        });
        if (!application) throw new NotFoundError("Application not found");
        if (application.tenantUserId !== req.user!.id)
            throw new ForbiddenError("Application access denied");
        if (application.status !== ApplicationStatus.Approved)
            throw new ConflictError("Application is not awaiting payment");
        assertPaymentWindowOpen(application);
        await assertFirstPaymentAvailable(tx, application);
        if (
            application.tenantConfirmedAt ||
            application.managerConfirmedAt ||
            (application.paymentDisputedAt &&
                !application.paymentDisputeResolvedAt)
        )
            throw new ConflictError(
                "Cash handover selection cannot change after a claim or dispute"
            );
        return tx.application.update({
            where: { id },
            data: {
                settlementMethod: method,
                tenantConfirmedAt: null,
                managerConfirmedAt: null,
                transferReference: null,
            },
        });
    });
    return res.json({ success: true, data: updated });
};

export const confirmCashSettlement = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const id = Number(req.params.id);
    const confirmedAmount = Number(req.body.amount);
    if (
        !Number.isInteger(id) ||
        !Number.isFinite(confirmedAmount) ||
        !Number.isSafeInteger(Math.round(confirmedAmount * 100)) ||
        Math.abs(confirmedAmount * 100 - Math.round(confirmedAmount * 100)) >
            0.000001
    )
        throw new BadRequestError("Invalid payment amount");
    const updated = await prisma.$transaction(async (tx) => {
        const seed = await tx.application.findUnique({
            where: { id },
            select: { propertyId: true },
        });
        if (!seed) throw new NotFoundError("Application not found");
        await tx.$queryRaw`SELECT id FROM "Property" WHERE id = ${seed.propertyId} FOR UPDATE`;
        const application = await tx.application.findUnique({
            where: { id },
            include: { property: true },
        });
        if (!application) throw new NotFoundError("Application not found");
        const tenant = application.tenantUserId === req.user!.id;
        const manager = application.property.managerUserId === req.user!.id;
        if (!tenant && !manager)
            throw new ForbiddenError("Application access denied");
        if (
            application.status !== ApplicationStatus.Approved ||
            application.settlementMethod !== SettlementMethod.Cash
        ) {
            throw new ConflictError("Application is not awaiting cash payment");
        }
        assertPaymentWindowOpen(application);
        const legacyLease = await assertFirstPaymentAvailable(tx, application);
        if (
            application.paymentDisputedAt &&
            !application.paymentDisputeResolvedAt
        )
            throw new ConflictError(
                "Payment is disputed; it cannot be confirmed"
            );
        if (tenant && application.tenantConfirmedAt)
            throw new ConflictError("Cash handover was already confirmed");
        if (manager && !application.tenantConfirmedAt)
            throw new ConflictError(
                "Wait for the tenant to confirm cash handover first"
            );
        if (manager && application.managerConfirmedAt)
            throw new ConflictError("Cash receipt was already confirmed");
        const rent =
            legacyLease?.rent ??
            application.agreedMonthlyRent ??
            application.originalMonthlyRent ??
            application.property.pricePerMonth;
        const deposit =
            legacyLease?.deposit ??
            application.originalDeposit ??
            application.property.securityDeposit;
        const total = rent + deposit;
        if (Math.round(total * 100) !== Math.round(confirmedAmount * 100))
            throw new BadRequestError(
                "Confirmed amount must match rent plus deposit"
            );
        const now = new Date();
        const tenantConfirmedAt = tenant ? now : application.tenantConfirmedAt;
        const managerConfirmedAt = manager
            ? now
            : application.managerConfirmedAt;
        // The tenant's claim only notifies the manager; the lease and payment wait for both sides.
        if (!tenantConfirmedAt || !managerConfirmedAt) {
            const claimed = await tx.application.update({
                where: { id },
                data: { tenantConfirmedAt, managerConfirmedAt },
            });
            if (tenant)
                await tx.notification.create({
                    data: {
                        userId: application.property.managerUserId,
                        kind: "CashHandoverClaimed",
                        title: "Tenant reported cash handed over",
                        body: `The tenant reported handing over cash for ${application.property.name}. Confirm receipt only after you receive the full amount.`,
                        resourceId: id,
                    },
                });
            return claimed;
        }
        // Create the lease and paid record together after the manager confirms receipt.
        let lease = legacyLease;
        if (!lease) {
            const occupied = await tx.lease.findFirst({
                where: {
                    propertyId: application.propertyId,
                    ...activeLeaseWhere(now),
                },
                select: { id: true },
            });
            if (occupied)
                throw new ConflictError(
                    "This property already has an active lease"
                );
            const endDate = new Date(now);
            endDate.setFullYear(endDate.getFullYear() + 1);
            lease = await tx.lease.create({
                data: {
                    startDate: now,
                    endDate,
                    rent,
                    deposit,
                    propertyId: application.propertyId,
                    tenantUserId: application.tenantUserId,
                },
            });
        }
        await tx.payment.create({
            data: {
                amountDue: total,
                amountPaid: total,
                dueDate: now,
                paymentDate: now,
                paymentStatus: "Paid",
                leaseId: lease.id,
            },
        });
        await tx.property.update({
            where: { id: application.propertyId },
            data: {
                tenants: { connect: { userId: application.tenantUserId } },
            },
        });
        const settled = await tx.application.update({
            where: { id },
            data: {
                status: ApplicationStatus.Paid,
                paidAt: now,
                leaseId: lease.id,
                tenantConfirmedAt,
                managerConfirmedAt,
            },
        });
        const otherPending = await tx.application.findMany({
            where: {
                propertyId: application.propertyId,
                id: { not: id },
                status: ApplicationStatus.Pending,
            },
            select: { id: true, tenantUserId: true },
        });
        await tx.application.updateMany({
            where: { id: { in: otherPending.map((item) => item.id) } },
            data: { status: ApplicationStatus.Denied },
        });
        await tx.notification.createMany({
            data: [
                {
                    userId: application.tenantUserId,
                    kind: "PaymentConfirmed",
                    title: "Payment confirmed",
                    body: `Your lease for ${application.property.name} is active.`,
                    resourceId: id,
                },
                ...otherPending.map((item) => ({
                    userId: item.tenantUserId,
                    kind: "ApplicationDenied",
                    title: "Property no longer available",
                    body: `${application.property.name} has been rented to another applicant.`,
                    resourceId: item.id,
                })),
            ],
        });
        return settled;
    });
    return res.json({ success: true, data: updated });
};

export const reportCashNotReceived = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const id = Number(req.params.id);
    const reason =
        typeof req.body.reason === "string" ? req.body.reason.trim() : "";
    if (!Number.isInteger(id) || reason.length < 10 || reason.length > 500)
        throw new BadRequestError(
            "Explain the missing payment in 10–500 characters"
        );
    // A missing-cash report freezes confirmation until the dispute is resolved or retracted.
    const updated = await prisma.$transaction(async (tx) => {
        const seed = await tx.application.findUnique({
            where: { id },
            select: { propertyId: true },
        });
        if (!seed) throw new NotFoundError("Application not found");
        await tx.$queryRaw`SELECT id FROM "Property" WHERE id = ${seed.propertyId} FOR UPDATE`;
        const application = await tx.application.findUnique({
            where: { id },
            include: { property: true },
        });
        if (!application) throw new NotFoundError("Application not found");
        if (application.property.managerUserId !== req.user!.id)
            throw new ForbiddenError("Application access denied");
        if (
            application.status !== ApplicationStatus.Approved ||
            application.settlementMethod !== SettlementMethod.Cash ||
            !application.tenantConfirmedAt ||
            application.managerConfirmedAt
        ) {
            throw new ConflictError(
                "There is no unresolved tenant cash claim to report"
            );
        }
        await assertFirstPaymentAvailable(tx, application);
        if (
            application.paymentDisputedAt &&
            !application.paymentDisputeResolvedAt
        )
            throw new ConflictError(
                "Payment has already been reported as disputed"
            );
        const result = await tx.application.update({
            where: { id },
            data: {
                paymentDisputedAt: new Date(),
                paymentDisputeResolvedAt: null,
                paymentDisputeReason: reason,
            },
        });
        await tx.notification.create({
            data: {
                userId: application.tenantUserId,
                kind: "PaymentDisputed",
                title: "Cash payment not received",
                body: `The manager reported that cash for ${application.property.name} was not received. Your payment claim is on hold; contact the manager if you disagree.`,
                resourceId: id,
            },
        });
        return result;
    });
    return res.json({ success: true, data: updated });
};

export const resolveCashDispute = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const id = Number(req.params.id);
    const reason =
        typeof req.body.reason === "string" ? req.body.reason.trim() : "";
    if (!Number.isInteger(id) || reason.length < 10 || reason.length > 500)
        throw new BadRequestError(
            "Explain the resolution in 10–500 characters"
        );
    const updated = await prisma.$transaction(async (tx) => {
        const seed = await tx.application.findUnique({
            where: { id },
            select: { propertyId: true },
        });
        if (!seed) throw new NotFoundError("Application not found");
        await tx.$queryRaw`SELECT id FROM "Property" WHERE id = ${seed.propertyId} FOR UPDATE`;
        const application = await tx.application.findUnique({
            where: { id },
            include: { property: true },
        });
        if (!application) throw new NotFoundError("Application not found");
        if (application.property.managerUserId !== req.user!.id)
            throw new ForbiddenError("Application access denied");
        if (
            application.status !== ApplicationStatus.Approved ||
            !application.tenantConfirmedAt ||
            application.managerConfirmedAt ||
            !application.paymentDisputedAt ||
            application.paymentDisputeResolvedAt
        ) {
            throw new ConflictError(
                "There is no active missing-cash report to resolve"
            );
        }
        await assertFirstPaymentAvailable(tx, application);
        const result = await tx.application.update({
            where: { id },
            data: { paymentDisputeResolvedAt: new Date() },
        });
        await tx.notification.create({
            data: {
                userId: application.tenantUserId,
                kind: "PaymentDisputeResolved",
                title: "Cash report resolved",
                body: `The manager marked the cash report for ${application.property.name} resolved. Reason: ${reason}`,
                resourceId: id,
            },
        });
        return result;
    });
    return res.json({ success: true, data: updated });
};

export const retractCashConfirmation = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const id = parseIntegerId(req.params.id, "Invalid application ID");
    const updated = await prisma.$transaction(async (tx) => {
        const seed = await tx.application.findUnique({
            where: { id },
            select: { propertyId: true },
        });
        if (!seed) throw new NotFoundError("Application not found");
        await tx.$queryRaw`SELECT id FROM "Property" WHERE id = ${seed.propertyId} FOR UPDATE`;
        const application = await tx.application.findUnique({
            where: { id },
            include: { property: true },
        });
        if (!application) throw new NotFoundError("Application not found");
        if (application.tenantUserId !== req.user!.id)
            throw new ForbiddenError("Application access denied");
        if (
            application.status !== ApplicationStatus.Approved ||
            !application.tenantConfirmedAt ||
            application.managerConfirmedAt
        ) {
            throw new ConflictError("Cash claim can no longer be retracted");
        }
        await assertFirstPaymentAvailable(tx, application);
        const result = await tx.application.update({
            where: { id },
            data: {
                tenantConfirmedAt: null,
                paymentDisputeResolvedAt: application.paymentDisputedAt
                    ? new Date()
                    : application.paymentDisputeResolvedAt,
            },
        });
        await tx.notification.create({
            data: {
                userId: application.property.managerUserId,
                kind: "CashClaimRetracted",
                title: "Cash claim retracted",
                body: `The tenant retracted their cash handover confirmation for ${application.property.name}.`,
                resourceId: id,
            },
        });
        return result;
    });
    return res.json({ success: true, data: updated });
};

export const withdrawApplication = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const id = parseIntegerId(req.params.id, "Invalid application ID");
    const updated = await prisma.$transaction(async (tx) => {
        const seed = await tx.application.findUnique({
            where: { id },
            select: { propertyId: true },
        });
        if (!seed) throw new NotFoundError("Application not found");
        await tx.$queryRaw`SELECT id FROM "Property" WHERE id = ${seed.propertyId} FOR UPDATE`;
        const application = await tx.application.findUnique({
            where: { id },
            include: { property: true },
        });
        if (!application) throw new NotFoundError("Application not found");
        if (application.tenantUserId !== req.user!.id)
            throw new ForbiddenError("Application access denied");
        if (
            (application.status !== ApplicationStatus.Pending &&
                application.status !== ApplicationStatus.Approved) ||
            application.leaseId ||
            application.cancellationRequestedAt ||
            (application.status === ApplicationStatus.Approved &&
                application.paymentDueAt &&
                application.paymentDueAt <= new Date()) ||
            application.tenantConfirmedAt ||
            application.managerConfirmedAt ||
            (application.paymentDisputedAt &&
                !application.paymentDisputeResolvedAt)
        ) {
            throw new ConflictError(
                "This application cannot be withdrawn during payment or after the lease starts"
            );
        }
        const result = await tx.application.update({
            where: { id },
            data: { status: ApplicationStatus.Withdrawn },
        });
        await tx.notification.create({
            data: {
                userId: application.property.managerUserId,
                kind: "ApplicationWithdrawn",
                title: "Application withdrawn",
                body: `The tenant withdrew their application for ${application.property.name}.`,
                resourceId: id,
            },
        });
        return result;
    });
    return res.json({ success: true, data: updated });
};
