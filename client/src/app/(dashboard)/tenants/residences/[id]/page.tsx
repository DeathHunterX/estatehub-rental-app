"use client";

import PaymentMethod from "@/app/(dashboard)/tenants/residences/[id]/_components/payment-method";
import ResidenceCard from "@/components/shared/card/residence-card";
import {
    useGetAuthCurrentUserQuery,
    useGetLeasesQuery,
    useGetPaymentsQuery,
    useGetPropertyQuery,
} from "@/states/api";
import { useParams } from "next/navigation";
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
    const { data: payments, isLoading: paymentsLoading } = useGetPaymentsQuery(
        (leases?.[0]?.id as number) || 0,
        { skip: !(leases?.[0]?.id as number) }
    );

    if (propertyLoading || leasesLoading || paymentsLoading)
        return <div>Loading...</div>;
    if (!property || propertyError) return <div>Error loading property</div>;
    if (!leases || !payments)
        return <div>Error loading leases or payments</div>;

    const currentLease = leases?.find(
        (lease) => lease.propertyId === property.id
    );

    return (
        <div className="dashboard-container">
            <div className="w-full mx-auto">
                <div className="md:flex gap-10">
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
