import type { Prisma } from "@prisma/client";
import type { ApplicationPaymentTarget } from "../types/global";
import { ConflictError } from "../errors/http-error";

export async function legacyUnpaidLease(
    tx: Prisma.TransactionClient,
    application: ApplicationPaymentTarget
) {
    if (!application.leaseId || application.paidAt) return null;
    const lease = await tx.lease.findUnique({
        where: { id: application.leaseId },
    });
    if (
        !lease ||
        lease.propertyId !== application.propertyId ||
        lease.tenantUserId !== application.tenantUserId ||
        lease.endDate < new Date()
    )
        return null;
    const existingPayment = await tx.payment.findFirst({
        where: { leaseId: lease.id },
        select: { id: true },
    });
    return existingPayment ? null : lease;
}

export async function assertFirstPaymentAvailable(
    tx: Prisma.TransactionClient,
    application: ApplicationPaymentTarget
) {
    if (application.paidAt)
        throw new ConflictError("This application was already marked paid");
    if (!application.leaseId) return null;
    const lease = await legacyUnpaidLease(tx, application);
    if (!lease)
        throw new ConflictError(
            "This lease already has a payment record or is no longer eligible for first payment"
        );
    return lease;
}
