"use client";

import PropertyCard from "@/components/shared/card/property-card";
import Header from "@/components/shared/header";
import {
    useGetAuthCurrentUserQuery,
    useGetPropertiesQuery,
    useGetTenantQuery,
} from "@/states/api";

const FavoritesPage = () => {
    const { data: authUser } = useGetAuthCurrentUserQuery();
    const { data: tenant } = useGetTenantQuery(authUser?.user?.id);

    const {
        data: favoriteProperties,
        isLoading,
        isError,
    } = useGetPropertiesQuery(
        {
            favoriteIds: tenant?.favorites?.map(
                (favorite: { id: number }) => favorite.id
            ),
        },
        {
            skip: !tenant?.favorites || tenant?.favorites.length === 0,
        }
    );

    if (isLoading) return <div>Loading...</div>;
    if (isError) return <div>Error loading favorites</div>;

    return (
        <div className="dashboard-container">
            <Header
                title="Favorites Properties"
                subtitle="Browse and manage your saved property listings"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {favoriteProperties?.map((property) => (
                    <PropertyCard
                        key={property.id}
                        property={property}
                        isFavorite={true}
                        onFavoriteToggle={() => {}}
                        showFavoriteButton={false}
                        propertyLink={`/tenants/residences/${property.id}`}
                    />
                ))}
            </div>
            {(!favoriteProperties || favoriteProperties.length === 0) && (
                <p className="text-center text-gray-500">
                    You don&lsquo;t have any favorited properties
                </p>
            )}
        </div>
    );
};

export default FavoritesPage;
