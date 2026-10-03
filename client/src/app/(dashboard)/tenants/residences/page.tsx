"use client";

import PageSkeleton from "@/components/shared/page-skeleton";
import Header from "@/components/shared/header";
import PropertyCard from "@/features/properties/components/property-card";

import {
    useGetAuthCurrentUserQuery,
    useGetCurrentResidencesQuery,
} from "@/lib/api/api";

const ResidencesPage = () => {
    const { data: authUser, isLoading: isAuthLoading } =
        useGetAuthCurrentUserQuery();
    const {
        data: currentResidences,
        isLoading,
        error,
    } = useGetCurrentResidencesQuery(authUser?.user?.id || "", {
        skip: !authUser?.user?.id,
    });

    if (isAuthLoading || isLoading)
        return <PageSkeleton variant="cards" />;
    if (error)
        return (
            <div className="dashboard-container text-destructive">
                Could not load residences.
            </div>
        );

    return (
        <div className="dashboard-container">
            <Header
                title="Current Residences"
                subtitle="View and manage your current living spaces"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentResidences?.map((property, index) => (
                    <PropertyCard
                        key={property.id}
                        property={property}
                        eagerImage={index < 4}
                        isFavorite={false}
                        onFavoriteToggle={() => {}}
                        showFavoriteButton={false}
                        propertyLink={`/tenants/residences/${property.id}`}
                    />
                ))}
            </div>
            {(!currentResidences || currentResidences.length === 0) && (
                <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                    You have no current residences.
                </div>
            )}
        </div>
    );
};

export default ResidencesPage;
