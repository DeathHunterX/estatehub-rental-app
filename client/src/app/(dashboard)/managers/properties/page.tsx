"use client";

import PropertyCard from "@/components/shared/card/property-card";
import Header from "@/components/shared/header";
import {
    useGetAuthCurrentUserQuery,
    useGetManagerPropertiesQuery,
} from "@/states/api";

const PropertiesPage = () => {
    const { data: authUser } = useGetAuthCurrentUserQuery();
    const {
        data: managerProperties,
        isLoading,
        error,
    } = useGetManagerPropertiesQuery(authUser?.user.id || "", {
        skip: !authUser?.user.id,
    });

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error loading manager properties</div>;

    return (
        <div className="dashboard-container">
            <Header
                title="My Properties"
                subtitle="View and manage your property listings"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {managerProperties?.map((property) => (
                    <PropertyCard
                        key={property.id}
                        property={property}
                        isFavorite={false}
                        onFavoriteToggle={() => {}}
                        showFavoriteButton={false}
                        propertyLink={`/managers/properties/${property.id}`}
                    />
                ))}
            </div>
            {(!managerProperties || managerProperties.length === 0) && (
                <p>You don&lsquo;t manage any properties.</p>
            )}
        </div>
    );
};

export default PropertiesPage;
