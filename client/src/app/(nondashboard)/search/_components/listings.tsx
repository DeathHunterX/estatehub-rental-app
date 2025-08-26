import PropertyCardCompact from "@/components/shared/card/property-card-compact";
import { useSearchFilter } from "@/hooks/use-search-filter";
import { FiltersState } from "@/states";
import {
    useAddFavoritePropertyMutation,
    useGetAuthCurrentUserQuery,
    useGetPropertiesQuery,
    useGetTenantQuery,
    useRemoveFavoritePropertyMutation,
} from "@/states/api";
import { useAppSelector } from "@/states/store";
import { Property } from "@/types/prisma";
import PropertyCard from "../../../../components/shared/card/property-card";

const Listings = () => {
    const { data: authUser } = useGetAuthCurrentUserQuery();
    const { data: tenant } = useGetTenantQuery(authUser?.user.id || "", {
        skip: !authUser?.user.id,
    });

    const [addFavoriteProperty] = useAddFavoritePropertyMutation();
    const [removeFavoriteProperty] = useRemoveFavoritePropertyMutation();

    const viewMode = useAppSelector((state) => state.global.viewMode);
    const [queryParams] = useSearchFilter();

    const {
        data: properties,
        isLoading,
        isError,
    } = useGetPropertiesQuery(queryParams as FiltersState);

    const handleFavoriteToggle = async (propertyId: number) => {
        if (!authUser) return;

        const isFavorite = authUser.favorites.some(
            (favorite: Property) => favorite.id === propertyId
        );

        if (isFavorite) {
            await removeFavoriteProperty({
                tenantId: tenant?.id,
                propertyId,
            });
        } else {
            await addFavoriteProperty({
                tenantId: tenant?.id,
                propertyId,
            });
        }
    };

    if (isLoading) return <div>Loading...</div>;
    if (isError || !properties) return <div>Failed to load properties</div>;

    return (
        <div className="w-full">
            <h3 className="text-sm px-4 font-bold">
                {properties.length}{" "}
                <span className="text-gray-700 font-normal">
                    Places in {queryParams.location}
                </span>
            </h3>

            <div className="flex">
                <div className="p-4 w-full">
                    {properties?.map((property) =>
                        viewMode === "grid" ? (
                            <PropertyCard
                                key={property.id}
                                property={property}
                                isFavorite={
                                    tenant?.favorites?.some(
                                        (fav: Property) =>
                                            fav.id === property.id
                                    ) || false
                                }
                                onFavoriteToggle={() =>
                                    handleFavoriteToggle(property.id)
                                }
                                showFavoriteButton={!!tenant}
                                propertyLink={`/search/${property.id}`}
                            />
                        ) : (
                            <PropertyCardCompact
                                key={property.id}
                                property={property}
                                isFavorite={
                                    tenant?.favorites?.some(
                                        (fav: Property) =>
                                            fav.id === property.id
                                    ) || false
                                }
                                onFavoriteToggle={() =>
                                    handleFavoriteToggle(property.id)
                                }
                                showFavoriteButton={!!authUser}
                                propertyLink={`/search/${property.id}`}
                            />
                        )
                    )}
                </div>
            </div>
        </div>
    );
};

export default Listings;
