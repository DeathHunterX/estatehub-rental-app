import { ApplicationStatus } from "@prisma/client";
import prisma from "../lib/prisma";

export const processApplicationDeadlines = async (now = new Date()) => {
    // A tenant cash claim blocks expiry; scheduled manager cancellations run on their own deadline.
    const candidates = await prisma.application.findMany({
        where: {
            status: ApplicationStatus.Approved,
            tenantConfirmedAt: null,
            paidAt: null,
            leaseId: null,
            OR: [
                { cancellationExecuteAt: { lte: now } },
                { paymentDueAt: { lte: now }, cancellationRequestedAt: null },
            ],
        },
        select: { id: true, propertyId: true },
    });

    for (const candidate of candidates) {
        try {
            await prisma.$transaction(async (tx) => {
                // Recheck under the property lock because payment may have completed since selection.
                await tx.$queryRaw`SELECT id FROM "Property" WHERE id = ${candidate.propertyId} FOR UPDATE`;
                const application = await tx.application.findUnique({
                    where: { id: candidate.id },
                    include: {
                        property: {
                            select: { name: true, managerUserId: true },
                        },
                    },
                });
                if (
                    !application ||
                    application.status !== ApplicationStatus.Approved ||
                    application.leaseId ||
                    application.paidAt ||
                    application.tenantConfirmedAt
                )
                    return;

                const managerCancellationDue =
                    !!application.cancellationExecuteAt &&
                    application.cancellationExecuteAt <= now;
                const paymentOverdue =
                    !application.cancellationRequestedAt &&
                    !!application.paymentDueAt &&
                    application.paymentDueAt <= now;
                if (!managerCancellationDue && !paymentOverdue) return;

                const denialReason = managerCancellationDue
                    ? `Manager cancellation: ${application.cancellationReason || "The rental agreement could not proceed."}`
                    : "Payment deadline passed without a tenant cash handover confirmation.";
                const claimed = await tx.application.updateMany({
                    where: {
                        id: application.id,
                        status: ApplicationStatus.Approved,
                        paidAt: null,
                        leaseId: null,
                        tenantConfirmedAt: null,
                    },
                    data: { status: ApplicationStatus.Denied, denialReason },
                });
                if (claimed.count !== 1) return;
                await tx.notification.createMany({
                    data: [
                        {
                            userId: application.tenantUserId,
                            kind: "ApplicationDenied",
                            title: "Application declined",
                            body: `${application.property.name}: ${denialReason}`,
                            resourceId: application.id,
                        },
                        {
                            userId: application.property.managerUserId,
                            kind: "ApplicationDenied",
                            title: "Application closed",
                            body: `${application.property.name}: ${denialReason}`,
                            resourceId: application.id,
                        },
                    ],
                });
            });
        } catch (error) {
            console.error(
                `Application deadline processing failed for application ${candidate.id}`,
                error
            );
        }
    }
};
