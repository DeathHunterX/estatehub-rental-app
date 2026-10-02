import type { Lease, Payment } from "@/types/prisma";

export const csvCell = (value: string | number) => {
    const text = String(value);
    const safeText = /^\s*[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${safeText.replaceAll('"', '""')}"`;
};

const saveText = (filename: string, content: string, type: string) => {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
};

export const downloadLeaseSummary = (
    lease: Lease,
    propertyName: string,
    tenantName?: string
) => {
    const lines = [
        "EstateHub lease summary",
        `Lease ID: ${lease.id}`,
        `Property: ${propertyName}`,
        ...(tenantName ? [`Tenant: ${tenantName}`] : []),
        `Start date: ${new Date(lease.startDate).toLocaleDateString()}`,
        `End date: ${new Date(lease.endDate).toLocaleDateString()}`,
        `Monthly rent: $${lease.rent.toFixed(2)}`,
        `Security deposit: $${lease.deposit.toFixed(2)}`,
        "",
        "This is a record summary, not a signed rental agreement.",
    ];
    saveText(
        `lease-${lease.id}-summary.txt`,
        lines.join("\n"),
        "text/plain;charset=utf-8"
    );
};

export const downloadLeasesCsv = (leases: Lease[], propertyName: string) => {
    const rows = [
        [
            "Lease ID",
            "Property",
            "Tenant",
            "Start date",
            "End date",
            "Monthly rent",
        ],
        ...leases.map((lease) => [
            lease.id,
            propertyName,
            lease.tenant?.user?.name || lease.tenantUserId,
            new Date(lease.startDate).toISOString().slice(0, 10),
            new Date(lease.endDate).toISOString().slice(0, 10),
            lease.rent,
        ]),
    ];
    saveText(
        "leases.csv",
        rows.map((row) => row.map(csvCell).join(",")).join("\n"),
        "text/csv;charset=utf-8"
    );
};

export const downloadPaymentsCsv = (payments: Payment[]) => {
    const rows = [
        [
            "Payment ID",
            "Lease ID",
            "Due date",
            "Payment date",
            "Amount due",
            "Amount paid",
            "Status",
        ],
        ...payments.map((payment) => [
            payment.id,
            payment.leaseId,
            new Date(payment.dueDate).toISOString().slice(0, 10),
            new Date(payment.paymentDate).toISOString().slice(0, 10),
            payment.amountDue,
            payment.amountPaid,
            payment.paymentStatus,
        ]),
    ];
    saveText(
        "payment-history.csv",
        rows.map((row) => row.map(csvCell).join(",")).join("\n"),
        "text/csv;charset=utf-8"
    );
};

export const downloadPaymentRecord = (payment: Payment) => {
    saveText(
        `payment-${payment.id}.txt`,
        [
            "EstateHub payment record",
            `Payment ID: ${payment.id}`,
            `Lease ID: ${payment.leaseId}`,
            `Due date: ${new Date(payment.dueDate).toLocaleDateString()}`,
            `Payment date: ${new Date(payment.paymentDate).toLocaleDateString()}`,
            `Amount due: $${payment.amountDue.toFixed(2)}`,
            `Amount paid: $${payment.amountPaid.toFixed(2)}`,
            `Status: ${payment.paymentStatus}`,
        ].join("\n"),
        "text/plain;charset=utf-8"
    );
};
