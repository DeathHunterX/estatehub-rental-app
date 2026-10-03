// Libraries
import { SearchX } from "lucide-react";

// Components
import SearchResultsSkeleton from "@/features/search/components/search-results-skeleton";
import PropertyCardCompact from "@/features/properties/components/property-card-compact";
import { Button } from "@/components/ui/button";
import PropertyCard from "../../../../features/properties/components/property-card";

// Hooks
import { useSearchFilter } from "@/features/search/hooks/use-search-filter";

// APIs
import {
    useAddFavoritePropertyMutation,
    useGetAuthCurrentUserQuery,
    useGetPropertiesQuery,
    useGetTenantQuery,
    useRemoveFavoritePropertyMutation,
} from "@/lib/api/api";

// State
import { FiltersState } from "@/states";
import { useAppSelector } from "@/states/store";

// Libs
import { canLoadTenantProfile } from "@/features/search/lib/search-filter-behavior";
import { filterMapAreaListings } from "@/features/search/lib/map-display";

// Types
import { Property } from "@/types/prisma";

const Listings = ({
    selectedPropertyId,
    onSelectProperty,
    mapAreaIds,
    onClearMapArea,
}: {
    selectedPropertyId: number | null;
    onSelectProperty: (id: number) => void;
    mapAreaIds: number[] | null;
    onClearMapArea: () => void;
}) => {
    const accessToken = useAppSelector((state) => state.auth.accessToken);
    const { data: authUser } = useGetAuthCurrentUserQuery(undefined, {
        skip: !accessToken,
    });
    const isTenant = canLoadTenantProfile(authUser?.user.role);
    const { data: tenant } = useGetTenantQuery(authUser?.user.id || "", {
        skip: !isTenant || !authUser?.user.id,
    });

    const [addFavoriteProperty] = useAddFavoritePropertyMutation();
    const [removeFavoriteProperty] = useRemoveFavoritePropertyMutation();

    const viewMode = useAppSelector((state) => state.global.viewMode);
    const [queryParams, setQueryParams] = useSearchFilter();

    const {
        data: properties,
        isLoading,
        isError,
    } = useGetPropertiesQuery(queryParams as FiltersState);
    const favoriteIds = new Set(tenant?.favorites?.map((favorite: Property) => favorite.id));

    const handleFavoriteToggle = async (propertyId: number) => {
        if (!isTenant || !tenant?.id) return;

        const isFavorite = favoriteIds.has(propertyId);

        if (isFavorite) {
            await removeFavoriteProperty({
                tenantId: tenant.id,
                propertyId,
            });
        } else {
            await addFavoriteProperty({
                tenantId: tenant.id,
                propertyId,
            });
        }
    };

    if (isLoading) return <SearchResultsSkeleton viewMode={viewMode} />;
    if (isError || !properties) {
        return (
            <div className="m-4 rounded-2xl border border-border bg-card p-8 text-card-foreground">
                <h2 className="text-lg font-semibold">
                    Properties could not be loaded
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Please try again in a moment.
                </p>
            </div>
        );
    }

    const hasFilters = Boolean(
        queryParams.location ||
        queryParams.latitude ||
        queryParams.propertyType !== "any" ||
        queryParams.beds !== "any" ||
        queryParams.baths !== "any" ||
        queryParams.amenities?.length ||
        queryParams.priceRange?.some((value) => value !== null) ||
        queryParams.squareFeet?.some((value) => value !== null) ||
        queryParams.availableFrom !== "any"
    );
    const displayedProperties = filterMapAreaListings(properties, mapAreaIds);

    return (
        <div className="w-full">
            <div className="px-4 pb-2 pt-4">
                <h1 className="text-xl font-semibold text-foreground">
                    Search results
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {mapAreaIds === null
                        ? `${properties.length} ${properties.length === 1 ? "place" : "places"}${queryParams.location ? ` in ${queryParams.location}` : " across all locations"}`
                        : `${displayedProperties.length} of ${properties.length} places in this map area`}
                </p>
                {mapAreaIds !== null && (
                    <button
                        type="button"
                        onClick={onClearMapArea}
                        className="mt-2 text-sm font-medium text-primary hover:underline"
                    >
                        Show all results
                    </button>
                )}
            </div>

            {properties.length === 0 && (
                <div className="mx-4 mt-5 rounded-2xl border border-border bg-card p-7 text-card-foreground sm:p-10">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                        <SearchX className="size-6" />
                    </div>
                    <h2 className="mt-5 text-xl font-semibold">
                        {hasFilters
                            ? "No homes match these filters"
                            : "No properties are listed yet"}
                    </h2>
                    <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                        {hasFilters
                            ? "Try a different location or remove some filters to see more homes."
                            : "New rentals will appear here when managers add them. You can still explore the search tools and check back later."}
                    </p>
                    {hasFilters && (
                        <Button
                            className="mt-6"
                            onClick={() => setQueryParams(null)}
                        >
                            Clear all filters
                        </Button>
                    )}
                    <div className="mt-7 grid gap-3 border-t border-border pt-6 text-sm text-muted-foreground sm:grid-cols-3">
                        <span>Search by city or neighborhood</span>
                        <span>Adjust your price range</span>
                        <span>Switch between grid and map view</span>
                    </div>
                </div>
            )}

            {mapAreaIds !== null && displayedProperties.length === 0 && (
                <div className="mx-4 mt-5 rounded-2xl border border-border bg-card p-7 text-card-foreground">
                    <h2 className="text-lg font-semibold">
                        No homes in this map area
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Move the map or show all results to explore other
                        locations.
                    </p>
                </div>
            )}

            {displayedProperties.length > 0 && (
                <div className="flex">
                    <div
                        className={
                            viewMode === "grid"
                                ? "p-4 w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 content-start"
                                : "p-4 w-full"
                        }
                    >
                        {displayedProperties.map((property, index) =>
                            viewMode === "grid" ? (
                                <PropertyCard
                                    key={property.id}
                                    property={property}
                                    eagerImage={index < 3}
                                    isFavorite={favoriteIds.has(property.id)}
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
                                    eagerImage={index < 3}
                                    isFavorite={favoriteIds.has(property.id)}
                                    onFavoriteToggle={() =>
                                        handleFavoriteToggle(property.id)
                                    }
                                    showFavoriteButton={!!tenant}
                                    propertyLink={`/search/${property.id}`}
                                    selected={
                                        selectedPropertyId === property.id
                                    }
                                    onFocusMap={() =>
                                        onSelectProperty(property.id)
                                    }
                                />
                            )
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Listings;
