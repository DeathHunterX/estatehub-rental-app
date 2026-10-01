"use client";

// Libraries
import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { useDispatch } from "react-redux";
import {
    Eye,
    EyeOff,
    Filter,
    Grid,
    Map as MapIcon,
    Search,
} from "lucide-react";

// Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

// Hooks
import { useSearchFilter } from "@/features/search/hooks/use-search-filter";

// State
import { useAppSelector } from "@/states/store";
import { setViewMode, toggleFiltersFullOpen } from "@/states";

// Constants
import { PropertyTypeIcons } from "@/constants";

// Libs
import { cn, formatPriceValue } from "@/lib/utils";
import {
    SearchViewMode,
    searchViewHref,
} from "@/features/search/lib/search-view";
import { updateFilterRange } from "@/features/search/lib/search-filter-behavior";

const FiltersBar = ({
    showMapPrices,
    onShowMapPricesChange,
}: {
    showMapPrices: boolean;
    onShowMapPricesChange: (value: boolean) => void;
}) => {
    const dispatch = useDispatch();

    const searchParams = useSearchParams();
    const router = useRouter();

    const [
        { location, priceRange, beds, baths, propertyType },
        setQueryParams,
    ] = useSearchFilter();

    const isFiltersFullOpen = useAppSelector(
        (state) => state.global.isFiltersFullOpen
    );

    const viewMode = useAppSelector((state) => state.global.viewMode);
    const handleViewChange = (mode: SearchViewMode) => {
        dispatch(setViewMode(mode));
        router.replace(
            searchViewHref(new URLSearchParams(searchParams.toString()), mode),
            { scroll: false }
        );
    };
    const [searchDraft, setSearchDraft] = useState({
        location,
        value: location ?? searchParams.get("location") ?? "",
    });
    // Discard the previous draft when navigation changes the URL location.
    const searchInput =
        searchDraft.location === location
            ? searchDraft.value
            : (location ?? "");
    const setSearchInput = (value: string) =>
        setSearchDraft({ location, value });
    const isMounted = useSyncExternalStore(
        () => () => {},
        () => true,
        () => false
    );

    if (!isMounted) {
        return null;
    }

    const handleFilterChange = (
        key: string,
        value: string | number,
        isMin: boolean | null = null
    ) => {
        switch (key) {
            case "priceRange":
                setQueryParams((prev) => {
                    const current = prev.priceRange ?? [null, null];
                    const newRange =
                        isMin === null
                            ? current
                            : updateFilterRange(
                                  current,
                                  isMin ? 0 : 1,
                                  value === "any" ? null : Number(value)
                              );

                    return {
                        ...prev,
                        priceRange: newRange,
                    };
                });
                break;

            case "squareFeet":
                setQueryParams((prev) => {
                    const current =
                        prev.squareFeet ??
                        ([null, null] as [number | null, number | null]);
                    const newRange =
                        isMin === null
                            ? current
                            : updateFilterRange(
                                  current,
                                  isMin ? 0 : 1,
                                  value === "any" ? null : Number(value)
                              );

                    return {
                        ...prev,
                        squareFeet: newRange,
                    };
                });
                break;

            case "beds":
                setQueryParams((prev) => ({
                    ...prev,
                    beds: value as string,
                }));
                break;

            case "baths":
                setQueryParams((prev) => ({
                    ...prev,
                    baths: value as string,
                }));
                break;

            case "propertyType":
                setQueryParams((prev) => ({
                    ...prev,
                    propertyType: value as string,
                }));
                break;

            case "location":
                setQueryParams((prev) => ({
                    ...prev,
                    location: value as string,
                }));
                break;

            case "viewMode":
                setQueryParams((prev) => ({
                    ...prev,
                    viewMode: value as string,
                }));
                break;

            default:
                console.warn(`Unhandled filter key: ${key}`);
        }
    };

    const handleLocationSearch = () => {
        void setQueryParams((prev) => ({
            ...prev,
            location: searchInput.trim(),
            latitude: null,
            longitude: null,
        }));
    };

    return (
        <div className="flex justify-between items-center py-3 container mx-auto max-w-full">
            {/* Filters */}
            <div className="flex flex-row items-center min-w-0 flex-1 overflow-x-auto">
                {/* All Filters */}
                <Button
                    variant="outline"
                    aria-label="All Filters"
                    className={cn(
                        "gap-2 rounded-xl border-primary-400 hover:bg-primary-500 hover:text-primary-100",
                        isFiltersFullOpen && "bg-primary-700 text-primary-100"
                    )}
                    onClick={() => dispatch(toggleFiltersFullOpen())}
                >
                    <Filter className="size-4" />
                    <span className="max-[359px]:sr-only">All Filters</span>
                </Button>
                <div className="hidden md:flex items-center gap-4 p-2 overflow-x-auto">
                    {/* Search Location */}
                    <div className="flex items-center">
                        <Input
                            aria-label="Search location"
                            placeholder="Search location"
                            value={searchInput}
                            onChange={(e) => {
                                setSearchInput(e.target.value);
                            }}
                            className="w-52 lg:w-36 rounded-l-xl rounded-r-none border-primary-400 border-r-0"
                            onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                    event.preventDefault();
                                    handleLocationSearch();
                                }
                            }}
                        />
                        <Button
                            type="button"
                            aria-label="Search location"
                            onClick={handleLocationSearch}
                            className={`rounded-r-xl rounded-l-none border-l-none border-primary-400 shadow-none 
              border hover:bg-primary-700 hover:text-primary-50`}
                        >
                            <Search className="size-4" />
                        </Button>
                    </div>

                    {/* Price Range */}
                    <div className="hidden gap-1 lg:flex">
                        {/* Minimum Price Selector */}
                        <Select
                            value={priceRange?.[0]?.toString() || "any"}
                            onValueChange={(value) =>
                                handleFilterChange("priceRange", value, true)
                            }
                        >
                            <SelectTrigger className="w-36 rounded-xl border-primary-400">
                                <SelectValue>
                                    {formatPriceValue(
                                        priceRange?.[0] ?? null,
                                        true
                                    )}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-popover text-popover-foreground">
                                <SelectItem value="any">
                                    Any Min Price
                                </SelectItem>
                                {[500, 1000, 1500, 2000, 3000, 5000, 10000].map(
                                    (price) => (
                                        <SelectItem
                                            key={price}
                                            value={price.toString()}
                                        >
                                            ${price / 1000}k+
                                        </SelectItem>
                                    )
                                )}
                            </SelectContent>
                        </Select>

                        {/* Maximum Price Selector */}
                        <Select
                            value={priceRange?.[1]?.toString() || "any"}
                            onValueChange={(value) =>
                                handleFilterChange("priceRange", value, false)
                            }
                        >
                            <SelectTrigger className="w-36 rounded-xl border-primary-400">
                                <SelectValue>
                                    {formatPriceValue(
                                        priceRange?.[1] ?? null,
                                        false
                                    )}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="bg-popover text-popover-foreground">
                                <SelectItem value="any">
                                    Any Max Price
                                </SelectItem>
                                {[1000, 2000, 3000, 5000, 10000].map(
                                    (price) => (
                                        <SelectItem
                                            key={price}
                                            value={price.toString()}
                                        >
                                            &lt;${price / 1000}k
                                        </SelectItem>
                                    )
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Beds and Baths */}
                    <div className="flex gap-1">
                        {/* Beds */}
                        <Select
                            value={beds}
                            onValueChange={(value) =>
                                handleFilterChange("beds", value, null)
                            }
                        >
                            <SelectTrigger className="w-30 rounded-xl border-primary-400 hidden lg:flex">
                                <SelectValue placeholder="Beds" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover text-popover-foreground">
                                <SelectItem value="any">Any Beds</SelectItem>
                                <SelectItem value="1">1+ bed</SelectItem>
                                <SelectItem value="2">2+ beds</SelectItem>
                                <SelectItem value="3">3+ beds</SelectItem>
                                <SelectItem value="4">4+ beds</SelectItem>
                            </SelectContent>
                        </Select>

                        {/* Baths */}
                        <Select
                            value={baths}
                            onValueChange={(value) =>
                                handleFilterChange("baths", value, null)
                            }
                        >
                            <SelectTrigger className="w-30 rounded-xl border-primary-400 hidden lg:flex">
                                <SelectValue placeholder="Baths" />
                            </SelectTrigger>
                            <SelectContent className="bg-popover text-popover-foreground">
                                <SelectItem value="any">Any Baths</SelectItem>
                                <SelectItem value="1">1+ bath</SelectItem>
                                <SelectItem value="2">2+ baths</SelectItem>
                                <SelectItem value="3">3+ baths</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Property Type */}
                    <Select
                        value={propertyType}
                        onValueChange={(value) =>
                            handleFilterChange("propertyType", value, null)
                        }
                    >
                        <SelectTrigger className="w-32 rounded-xl border-primary-400 whitespace-nowrap hidden lg:flex">
                            <SelectValue placeholder="Home Type" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover text-popover-foreground">
                            <SelectItem value="any">
                                Any Property Type
                            </SelectItem>
                            {Object.entries(PropertyTypeIcons).map(
                                ([type, Icon]) => (
                                    <SelectItem key={type} value={type}>
                                        <div className="flex items-center">
                                            <Icon className="size-4 mr-2" />
                                            <span>{type}</span>
                                        </div>
                                    </SelectItem>
                                )
                            )}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* View Mode */}
            <div className="flex justify-between items-center gap-4 p-2 shrink-0">
                {viewMode !== "grid" && (
                    <Button
                        type="button"
                        variant="outline"
                        aria-label={
                            showMapPrices
                                ? "Hide map prices"
                                : "Show map prices"
                        }
                        aria-pressed={showMapPrices}
                        onClick={() => onShowMapPricesChange(!showMapPrices)}
                        className={cn(
                            "gap-2 rounded-xl border-border bg-card text-card-foreground hover:bg-accent hover:text-accent-foreground",
                            viewMode === "list" && "hidden lg:inline-flex"
                        )}
                    >
                        {showMapPrices ? (
                            <Eye className="size-4" />
                        ) : (
                            <EyeOff className="size-4" />
                        )}
                        <span className="hidden sm:inline">
                            {showMapPrices
                                ? "Hide map prices"
                                : "Show map prices"}
                        </span>
                        <span className="sm:hidden max-[359px]:sr-only">
                            Prices
                        </span>
                    </Button>
                )}
                <div className="flex rounded-xl border lg:hidden">
                    <Button
                        type="button"
                        variant="ghost"
                        aria-label="Map view"
                        aria-pressed={viewMode === "map"}
                        className={cn(
                            "gap-1.5 rounded-none rounded-l-xl px-3",
                            viewMode === "map" &&
                                "bg-primary-700 text-primary-50"
                        )}
                        onClick={() => handleViewChange("map")}
                    >
                        <MapIcon className="size-4" />
                        Map
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        aria-label="List view"
                        aria-pressed={viewMode === "list"}
                        className={cn(
                            "gap-1.5 rounded-none rounded-r-xl px-3",
                            viewMode === "list" &&
                                "bg-primary-700 text-primary-50"
                        )}
                        onClick={() => handleViewChange("list")}
                    >
                        <Grid className="size-4" />
                        List
                    </Button>
                </div>
                <div className="hidden rounded-xl border lg:flex">
                    <Button
                        variant="ghost"
                        type="button"
                        aria-label="Map and list view"
                        aria-pressed={viewMode !== "grid"}
                        title="Map and list view"
                        className={cn(
                            "gap-1.5 px-2 py-1 rounded-none rounded-l-xl hover:bg-primary-600 hover:text-primary-50 sm:px-3",
                            viewMode !== "grid"
                                ? "bg-primary-700 text-primary-50"
                                : ""
                        )}
                        onClick={() => handleViewChange("list")}
                    >
                        <MapIcon className="size-4" />
                        <span>Map + list</span>
                    </Button>
                    <Button
                        variant="ghost"
                        type="button"
                        aria-label="Grid view"
                        aria-pressed={viewMode === "grid"}
                        title="Grid view"
                        className={cn(
                            "gap-1.5 px-2 py-1 rounded-none rounded-r-xl hover:bg-primary-600 hover:text-primary-50 sm:px-3",
                            viewMode === "grid"
                                ? "bg-primary-700 text-primary-50"
                                : ""
                        )}
                        onClick={() => handleViewChange("grid")}
                    >
                        <Grid className="size-4" />
                        <span>Grid</span>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default FiltersBar;
