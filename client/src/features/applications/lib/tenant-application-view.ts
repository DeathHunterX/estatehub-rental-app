export type TenantApplicationSummary = {
    status: string;
    property: { name: string };
    paymentRecordExists: boolean;
    paidAt: Date | string | null;
};

export function filterTenantApplications<T extends TenantApplicationSummary>(applications: T[], status: string, query: string): T[] {
    const search = query.trim().toLocaleLowerCase();
    return applications.filter((application) =>
        (status === "All" || application.status === status) &&
        (!search || application.property.name.toLocaleLowerCase().includes(search))
    );
}

export function partitionTenantPayments<T extends TenantApplicationSummary>(applications: T[]): { due: T[]; completed: T[] } {
    return {
        due: applications.filter((application) => application.status === "Approved" && !application.paymentRecordExists && !application.paidAt),
        completed: applications.filter((application) => application.status === "Paid" || (application.status === "Approved" && (application.paymentRecordExists || !!application.paidAt))),
    };
}
