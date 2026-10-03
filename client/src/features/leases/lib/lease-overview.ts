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

export function paymentSummaries<T extends PaymentRecord>(payments: T[] | undefined, now = new Date()): Map<number, T> {
    const summaries = new Map<number, T>();
    for (const payment of payments ?? []) {
        const due = new Date(payment.dueDate);
        if (due.getUTCMonth() !== now.getUTCMonth() || due.getUTCFullYear() !== now.getUTCFullYear()) continue;
        const previous = summaries.get(payment.leaseId);
        if (!previous || due.getTime() > new Date(previous.dueDate).getTime()) summaries.set(payment.leaseId, payment);
    }
    return summaries;
}
