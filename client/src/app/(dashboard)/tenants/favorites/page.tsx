"use client";

import PageSkeleton from "@/components/shared/page-skeleton";


import PropertyCard from "@/features/properties/components/property-card";
import Header from "@/components/shared/header";
import {
    useGetAuthCurrentUserQuery,
    useGetPropertiesQuery,
    useGetTenantQuery,
    useRemoveFavoritePropertyMutation,
} from "@/lib/api/api";

const FavoritesPage = () => {
    const { data: authUser, isLoading: isAuthLoading } = useGetAuthCurrentUserQuery();
    const { data: tenant, isLoading: isTenantLoading } = useGetTenantQuery(authUser?.user?.id || "", {
        skip: !authUser?.user?.id,
    });
    const [removeFavorite] = useRemoveFavoritePropertyMutation();

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

    if (isAuthLoading || isTenantLoading || isLoading) return <PageSkeleton variant="cards" />;
    if (isError) return <div className="dashboard-container text-destructive">Could not load favorites.</div>;

    return (
        <div className="dashboard-container">
            <Header
                title="Favorite Properties"
                subtitle="Browse and manage your saved property listings"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {favoriteProperties?.map((property) => (
                    <PropertyCard
                        key={property.id}
                        property={property}
                        isFavorite={true}
                        onFavoriteToggle={() => removeFavorite({ tenantId: tenant.id, propertyId: property.id })}
                        showFavoriteButton={true}
                        propertyLink={`/search/${property.id}`}
                    />
                ))}
            </div>
            {(!favoriteProperties || favoriteProperties.length === 0) && (
                <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                    You have no saved properties yet.
                </div>
            )}
        </div>
    );
};

export default FavoritesPage;
