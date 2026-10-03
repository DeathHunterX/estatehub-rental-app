import { parseIntegerId } from "../utils/utils";
import type { AuthenticatedRequest } from "../types/global";
import { RenewalStatus, UserRole } from "@prisma/client";
import { Response } from "express";
import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from "../errors/http-error";
import prisma from "../lib/prisma";
import { assertLeaseAccess } from "../services/policies/access-policy";
import { completeLocationAddress } from "../utils/location-search";

export const getLeases = async (req: AuthenticatedRequest, res: Response) => {
    const leases = await prisma.lease.findMany({
        where:
            req.user!.role === UserRole.Tenant
                ? { tenantUserId: req.user!.id }
                : { property: { managerUserId: req.user!.id } },
        include: {
            tenant: true,
            property: true,
        },
    });

    return res.status(200).json({
        success: true,
        data: leases,
    });
};

export const getLeasePayments = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const { leaseId } = req.params;
    const lease = await prisma.lease.findUnique({
        where: { id: Number(leaseId) },
        include: { property: { select: { managerUserId: true } } },
    });
    if (!lease) throw new NotFoundError("Lease not found");
    assertLeaseAccess(req.user!, lease);
    const payments = await prisma.payment.findMany({
        where: {
            leaseId: Number(leaseId),
        },
    });

    return res.status(200).json({
        success: true,
        data: payments,
    });
};

export const getLeaseAgreementDraft = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const leaseId = parseIntegerId(
        req.params.leaseId,
        "Invalid lease ID",
        true
    );
    const lease = await prisma.lease.findUnique({
        where: { id: leaseId },
        select: {
            id: true,
            tenantUserId: true,
            startDate: true,
            endDate: true,
            rent: true,
            deposit: true,
            tenant: {
                select: {
                    user: {
                        select: { name: true, email: true, phoneNumber: true },
                    },
                },
            },
            property: {
                select: {
                    name: true,
                    managerUserId: true,
                    location: true,
                    manager: {
                        select: {
                            user: { select: { name: true } },
                            signingProfile: {
                                select: {
                                    legalName: true,
                                    title: true,
                                    agreementNotes: true,
                                },
                            },
                        },
                    },
                },
            },
        },
    });
    if (!lease) throw new NotFoundError("Lease not found");
    assertLeaseAccess(req.user!, lease);
    const profile = lease.property.manager.signingProfile;
    return res.status(200).json({
        success: true,
        data: {
            leaseId: lease.id,
            propertyName: lease.property.name,
            address: completeLocationAddress(lease.property.location),
            tenantName: lease.tenant.user.name,
            tenantEmail: lease.tenant.user.email,
            tenantPhone: lease.tenant.user.phoneNumber ?? undefined,
            managerName: profile?.legalName || lease.property.manager.user.name,
            managerTitle: profile?.title ?? "",
            startDate: lease.startDate,
            endDate: lease.endDate,
            rent: lease.rent,
            deposit: lease.deposit,
            notes: profile?.agreementNotes ?? "",
        },
    });
};

export const requestRenewal = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const id = parseIntegerId(req.params.leaseId, "Invalid lease ID");
    const lease = await prisma.lease.findUnique({
        where: { id },
        include: { property: true },
    });
    if (!lease) throw new NotFoundError("Lease not found");
    if (lease.tenantUserId !== req.user!.id)
        throw new ForbiddenError("Lease access denied");
    const daysLeft = (lease.endDate.getTime() - Date.now()) / 86_400_000;
    if (
        daysLeft < 0 ||
        daysLeft > 60 ||
        lease.renewalStatus === RenewalStatus.Requested
    )
        throw new ConflictError(
            "Renewal can be requested in the final 60 days of a lease"
        );
    const updated = await prisma.$transaction(async (tx) => {
        const claimed = await tx.lease.updateMany({
            where: { id, renewalStatus: { not: RenewalStatus.Requested } },
            data: {
                renewalStatus: RenewalStatus.Requested,
                renewalRequestedAt: new Date(),
                renewalReviewedAt: null,
            },
        });
        if (claimed.count !== 1)
            throw new ConflictError("Renewal has already been requested");
        await tx.notification.create({
            data: {
                userId: lease.property.managerUserId,
                kind: "RenewalRequested",
                title: "Lease renewal requested",
                body: `A tenant requested to renew ${lease.property.name}.`,
                resourceId: id,
            },
        });
        return tx.lease.findUniqueOrThrow({ where: { id } });
    });
    return res.json({ success: true, data: updated });
};

export const reviewRenewal = async (
    req: AuthenticatedRequest,
    res: Response
) => {
    const id = Number(req.params.leaseId);
    const approved = req.body.status === RenewalStatus.Approved;
    const months = Number(req.body.months ?? 12);
    if (
        !Number.isInteger(id) ||
        ![RenewalStatus.Approved, RenewalStatus.Denied].includes(
            req.body.status
        ) ||
        (approved && (!Number.isInteger(months) || months < 1 || months > 24))
    )
        throw new BadRequestError("Invalid renewal decision");
    const updated = await prisma.$transaction(async (tx) => {
        const seed = await tx.lease.findUnique({
            where: { id },
            select: { propertyId: true },
        });
        if (!seed) throw new NotFoundError("Lease not found");
        await tx.$queryRaw`SELECT id FROM "Property" WHERE id = ${seed.propertyId} FOR UPDATE`;
        const lease = await tx.lease.findUnique({
            where: { id },
            include: { property: true },
        });
        if (!lease) throw new NotFoundError("Lease not found");
        if (lease.property.managerUserId !== req.user!.id)
            throw new ForbiddenError("Lease access denied");
        if (lease.renewalStatus !== RenewalStatus.Requested)
            throw new ConflictError("There is no renewal request to review");
        const endDate = new Date(lease.endDate);
        if (approved) endDate.setMonth(endDate.getMonth() + months);
        if (approved) {
            const overlapping = await tx.lease.findFirst({
                where: {
                    propertyId: lease.propertyId,
                    id: { not: id },
                    startDate: { lte: endDate },
                    endDate: { gte: lease.endDate },
                },
                select: { id: true },
            });
            if (overlapping)
                throw new ConflictError(
                    "Another lease now occupies the requested renewal period"
                );
            const approvedUnpaid = await tx.application.findFirst({
                where: {
                    propertyId: lease.propertyId,
                    status: "Approved",
                    leaseId: null,
                },
                select: { id: true },
            });
            if (approvedUnpaid)
                throw new ConflictError(
                    "Resolve the approved unpaid application before renewing this lease"
                );
        }
        const result = await tx.lease.update({
            where: { id },
            data: {
                renewalStatus: req.body.status,
                renewalReviewedAt: new Date(),
                renewalMonths: approved ? months : null,
                ...(approved ? { endDate } : {}),
            },
        });
        await tx.notification.create({
            data: {
                userId: lease.tenantUserId,
                kind: approved ? "RenewalApproved" : "RenewalDenied",
                title: approved
                    ? "Lease renewal approved"
                    : "Lease renewal declined",
                body: approved
                    ? `Your lease for ${lease.property.name} now ends ${endDate.toLocaleDateString()}.`
                    : `Your renewal request for ${lease.property.name} was declined.`,
                resourceId: id,
            },
        });
        if (approved) {
            const pending = await tx.application.findMany({
                where: { propertyId: lease.propertyId, status: "Pending" },
                select: { id: true, tenantUserId: true },
            });
            if (pending.length) {
                await tx.application.updateMany({
                    where: { id: { in: pending.map((item) => item.id) } },
                    data: { status: "Denied" },
                });
                await tx.notification.createMany({
                    data: pending.map((item) => ({
                        userId: item.tenantUserId,
                        kind: "ApplicationDenied",
                        title: "Property lease renewed",
                        body: `${lease.property.name} is no longer available because the current lease was renewed.`,
                        resourceId: item.id,
                    })),
                });
            }
        }
        return result;
    });
    return res.json({ success: true, data: updated });
};
