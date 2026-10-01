type LeaseTerm = { startDate: Date | string; endDate: Date | string };
type PaymentRecord = { leaseId: number; dueDate: Date | string };

export type LeaseStatus = "Pending" | "Active" | "Expired";

export function leaseStatus(lease: LeaseTerm, now = new Date()): LeaseStatus {
    const start = new Date(lease.startDate);
    const end = new Date(lease.endDate);
    if (start.getTime() > now.getTime()) return "Pending";
    end.setUTCHours(23, 59, 59, 999);
    return end.getTime() < now.getTime() ? "Expired" : "Active";
}

export function paymentSummary<T extends PaymentRecord>(payments: T[] | undefined, leaseId: number, now = new Date()): T | null {
    return payments
        ?.filter((payment) => {
            const due = new Date(payment.dueDate);
            return payment.leaseId === leaseId && due.getUTCMonth() === now.getUTCMonth() && due.getUTCFullYear() === now.getUTCFullYear();
        })
        .sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime())[0] ?? null;
}
