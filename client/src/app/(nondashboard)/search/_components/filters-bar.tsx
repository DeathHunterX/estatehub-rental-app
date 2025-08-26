"use client";
import { useAppSelector } from "@/states/store";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { PropertyTypeIcons } from "@/constants";
import { cn, formatPriceValue } from "@/lib/utils";
import { setViewMode, toggleFiltersFullOpen } from "@/states";

import { useSearchFilter } from "@/hooks/use-search-filter";
import { Filter, Grid, List, Search } from "lucide-react";

const FiltersBar = () => {
    const dispatch = useDispatch();

    const searchParams = useSearchParams();

    const [
        { location, priceRange, beds, baths, propertyType },
        setQueryParams,
    ] = useSearchFilter();

    const isFiltersFullOpen = useAppSelector(
        (state) => state.global.isFiltersFullOpen
    );

    const viewMode = useAppSelector((state) => state.global.viewMode);
    const [searchInput, setSearchInput] = useState<string>(
        location ?? searchParams.get("location") ?? ""
    );
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

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
                    const newRange: [number | null, number | null] = [
                        ...current,
                    ];

                    if (isMin !== null) {
                        const index = isMin ? 0 : 1;
                        newRange[index] =
                            value === "any" ? null : Number(value);
                    }

                    return {
                        ...prev,
                        priceRange: newRange, // ✅ return full object with updated field
                    };
                });
                break;

            case "squareFeet":
                setQueryParams((prev) => {
                    const current =
                        prev.squareFeet ??
                        ([null, null] as [number | null, number | null]);
                    const newRange: [number | null, number | null] = [
                        current[0],
                        current[1],
                    ];

                    if (isMin !== null) {
                        const index = isMin ? 0 : 1;
                        newRange[index] =
                            value === "any" ? null : Number(value);
                    }

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

    const handleLocationSearch = async () => {
        try {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
                    searchInput
                )}.json?access_token=${
                    process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
                }&fuzzyMatch=true`
            );
            const data = await response.json();
            console.log(data);

            if (data.features && data.features.length > 0) {
                const [lng, lat] = data.features[0].center;
                setQueryParams((prev) => ({
                    ...prev,
                    location: searchInput,
                    latitude: lat,
                    longitude: lng,
                }));
            }
        } catch (err) {
            console.error("Error search location:", err);
        }
    };

    return (
        <div className="flex justify-between items-center py-3 container mx-auto max-w-full">
            {/* Filters */}
            <div className="flex flex-row items-center min-w-0 flex-1 overflow-x-auto">
                {/* All Filters */}
                <Button
                    variant="outline"
                    className={cn(
                        "gap-2 rounded-xl border-primary-400 hover:bg-primary-500 hover:text-primary-100",
                        isFiltersFullOpen && "bg-primary-700 text-primary-100"
                    )}
                    onClick={() => dispatch(toggleFiltersFullOpen())}
                >
                    <Filter className="size-4" />
                    <span>All Filters</span>
                </Button>
                <div className="hidden md:flex items-center gap-4 p-2 overflow-x-auto">
                    {/* Search Location */}
                    <div className="flex items-center">
                        <Input
                            placeholder="Search location"
                            value={searchInput}
                            onChange={(e) => {
                                setSearchInput(e.target.value);
                            }}
                            className="w-52 lg:w-36 rounded-l-xl rounded-r-none border-primary-400 border-r-0"
                        />
                        <Button
                            onClick={handleLocationSearch}
                            className={`rounded-r-xl rounded-l-none border-l-none border-primary-400 shadow-none 
              border hover:bg-primary-700 hover:text-primary-50`}
                        >
                            <Search className="size-4" />
                        </Button>
                    </div>

                    {/* Price Range */}
                    <div className="flex gap-1">
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
                            <SelectContent className="bg-white">
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
                            <SelectContent className="bg-white">
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
                            <SelectContent className="bg-white">
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
                            <SelectContent className="bg-white">
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
                        <SelectContent className="bg-white">
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
                <div className="flex border rounded-xl">
                    <Button
                        variant="ghost"
                        className={cn(
                            "px-3 py-1 rounded-none rounded-l-xl hover:bg-primary-600 hover:text-primary-50",
                            viewMode === "list"
                                ? "bg-primary-700 text-primary-50"
                                : ""
                        )}
                        onClick={() => dispatch(setViewMode("list"))}
                    >
                        <List className="size-5" />
                    </Button>
                    <Button
                        variant="ghost"
                        className={cn(
                            "px-3 py-1 rounded-none rounded-r-xl hover:bg-primary-600 hover:text-primary-50",
                            viewMode === "grid"
                                ? "bg-primary-700 text-primary-50"
                                : ""
                        )}
                        onClick={() => dispatch(setViewMode("grid"))}
                    >
                        <Grid className="size-5" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default FiltersBar;
