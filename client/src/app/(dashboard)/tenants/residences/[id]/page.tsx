"use client";

import { useParams } from "next/navigation";
import PageSkeleton from "@/components/shared/page-skeleton";

import PaymentMethod from "@/app/(dashboard)/tenants/residences/[id]/_components/payment-method";
import ResidenceCard from "@/components/shared/card/residence-card";
import Header from "@/components/shared/header";
import {
    useGetAuthCurrentUserQuery,
    useGetLeasesQuery,
    useGetPaymentsQuery,
    useGetPropertyQuery,
} from "@/lib/api/api";
import BillingHistory from "./_components/billing-history";

const ResidencePage = () => {
    const { id } = useParams();

    const { data: authUser } = useGetAuthCurrentUserQuery();

    const {
        data: property,
        isLoading: propertyLoading,
        error: propertyError,
    } = useGetPropertyQuery(Number(id));

    const { data: leases, isLoading: leasesLoading } = useGetLeasesQuery(
        authUser?.user.id || "",
        { skip: !authUser?.user.id }
    );
    const currentLease = leases?.find(
        (lease) => lease.propertyId === Number(id)
    );
    const { data: payments, isLoading: paymentsLoading } = useGetPaymentsQuery(
        currentLease?.id || 0,
        { skip: !currentLease?.id }
    );

    if (propertyLoading || leasesLoading || paymentsLoading)
        return <PageSkeleton variant="detail" />;
    if (!property || propertyError)
        return (
            <div className="dashboard-container text-destructive">
                Could not load this residence.
            </div>
        );
    if (!currentLease)
        return (
            <div className="dashboard-container text-muted-foreground">
                You do not have a lease for this property.
            </div>
        );

    return (
        <div className="dashboard-container">
            <Header
                title="Residence Details"
                subtitle="Your lease and payment records"
            />
            <div className="w-full mx-auto">
                <div className="flex flex-col gap-6 lg:flex-row">
                    {currentLease && (
                        <ResidenceCard
                            property={property}
                            currentLease={currentLease}
                        />
                    )}
                    <PaymentMethod />
                </div>
                <BillingHistory payments={payments || []} />
            </div>
        </div>
    );
};

export default ResidencePage;
