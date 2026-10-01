"use client";

// Libraries
import { RotateCcw, Search } from "lucide-react";
import { useState } from "react";

// Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";

// Hooks
import { useSearchFilter } from "@/features/search/hooks/use-search-filter";

// State
import { FiltersState, setFiltersFullOpen } from "@/states";
import { useAppDispatch } from "@/states/store";

// Constants
import { AmenityIcons, PropertyTypeIcons } from "@/constants";

// Libs
import { sliderRangeToFilter } from "@/features/search/lib/search-filter-behavior";
import { cn, formatEnumString } from "@/lib/utils";

const emptyFilters: FiltersState = {
    location: "",
    beds: "any",
    baths: "any",
    propertyType: "any",
    amenities: [],
    availableFrom: "any",
    priceRange: [null, null],
    squareFeet: [null, null],
    latitude: null,
    longitude: null,
};

const FiltersFull = () => {
    const [queryParams, setQueryParams] = useSearchFilter();
    const dispatch = useAppDispatch();
    // Keep modal edits local until Apply; closing the dialog leaves the URL unchanged.
    const [localFilters, setLocalFilters] = useState<FiltersState>(() => ({
        ...emptyFilters,
        ...queryParams,
        location: queryParams.location ?? "",
        amenities: queryParams.amenities ?? [],
    }));

    const setRangeValue = (
        key: "priceRange" | "squareFeet",
        index: 0 | 1,
        raw: string
    ) => {
        const amount = raw === "" ? null : Math.max(0, Number(raw));
        setLocalFilters((current) => {
            const next: [number | null, number | null] = [...current[key]];
            next[index] = amount;
            return { ...current, [key]: next };
        });
    };
    const rangeInvalid = ([min, max]: [number | null, number | null]) =>
        min !== null && max !== null && min > max;
    const invalidRange =
        rangeInvalid(localFilters.priceRange) ||
        rangeInvalid(localFilters.squareFeet);
    const priceLimit = Math.max(
        10000,
        ...localFilters.priceRange.filter(
            (value): value is number => value !== null
        )
    );
    const areaLimit = Math.max(
        5000,
        ...localFilters.squareFeet.filter(
            (value): value is number => value !== null
        )
    );

    const applyFilters = () => {
        if (invalidRange) return;
        void setQueryParams({
            ...localFilters,
            location: localFilters.location.trim(),
            latitude: null,
            longitude: null,
        });
        dispatch(setFiltersFullOpen(false));
    };
    const resetFilters = () => {
        setLocalFilters(emptyFilters);
        void setQueryParams(null);
        dispatch(setFiltersFullOpen(false));
    };

    return (
        <>
            <div className="border-b border-border px-5 py-5 pr-14 sm:px-7">
                <h2 className="text-xl font-semibold">All filters</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                    Choose a location, property details and a price range that
                    fit your search.
                </p>
            </div>
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    applyFilters();
                }}
                className="flex min-h-0 flex-1 flex-col"
            >
                <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-5 py-6 sm:px-7">
                    <section>
                        <Label
                            htmlFor="full-filter-location"
                            className="text-sm font-semibold"
                        >
                            Location
                        </Label>
                        <div className="mt-3 flex gap-2">
                            <Input
                                id="full-filter-location"
                                placeholder="City, neighborhood or address"
                                value={localFilters.location}
                                onChange={(event) =>
                                    setLocalFilters((current) => ({
                                        ...current,
                                        location: event.target.value,
                                        latitude: null,
                                        longitude: null,
                                    }))
                                }
                                className="min-w-0 flex-1"
                            />
                            <Button
                                type="submit"
                                aria-label="Search with these filters"
                                disabled={invalidRange}
                                className="gap-2"
                            >
                                <Search className="size-4" />
                                <span className="hidden sm:inline">Search</span>
                            </Button>
                        </div>
                    </section>

                    <section>
                        <h3 className="text-sm font-semibold">Property type</h3>
                        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            <button
                                type="button"
                                aria-pressed={
                                    localFilters.propertyType === "any"
                                }
                                onClick={() =>
                                    setLocalFilters((current) => ({
                                        ...current,
                                        propertyType: "any",
                                    }))
                                }
                                className={cn(
                                    "rounded-xl border px-3 py-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                                    localFilters.propertyType === "any"
                                        ? "border-primary bg-primary/10 text-foreground"
                                        : "border-border hover:bg-accent"
                                )}
                            >
                                Any type
                            </button>
                            {Object.entries(PropertyTypeIcons).map(
                                ([type, Icon]) => (
                                    <button
                                        key={type}
                                        type="button"
                                        aria-pressed={
                                            localFilters.propertyType === type
                                        }
                                        onClick={() =>
                                            setLocalFilters((current) => ({
                                                ...current,
                                                propertyType: type,
                                            }))
                                        }
                                        className={cn(
                                            "flex items-center gap-2 rounded-xl border px-3 py-3 text-left text-sm transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                                            localFilters.propertyType === type
                                                ? "border-primary bg-primary/10 text-foreground"
                                                : "border-border hover:bg-accent"
                                        )}
                                    >
                                        <Icon className="size-4 shrink-0" />
                                        {type}
                                    </button>
                                )
                            )}
                        </div>
                    </section>

                    <div className="grid gap-7 lg:grid-cols-2">
                        <section className="space-y-4">
                            <h3 className="text-sm font-semibold">
                                Monthly rent
                            </h3>
                            <Slider
                                min={0}
                                max={priceLimit}
                                step={100}
                                value={[
                                    localFilters.priceRange[0] ?? 0,
                                    localFilters.priceRange[1] ?? priceLimit,
                                ]}
                                onValueChange={(value) =>
                                    setLocalFilters((current) => ({
                                        ...current,
                                        priceRange: sliderRangeToFilter(
                                            value as [number, number],
                                            0,
                                            priceLimit
                                        ),
                                    }))
                                }
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label
                                        htmlFor="price-min"
                                        className="text-xs text-muted-foreground"
                                    >
                                        Minimum ($)
                                    </Label>
                                    <Input
                                        id="price-min"
                                        type="number"
                                        min="0"
                                        placeholder="No minimum"
                                        value={localFilters.priceRange[0] ?? ""}
                                        onChange={(event) =>
                                            setRangeValue(
                                                "priceRange",
                                                0,
                                                event.target.value
                                            )
                                        }
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label
                                        htmlFor="price-max"
                                        className="text-xs text-muted-foreground"
                                    >
                                        Maximum ($)
                                    </Label>
                                    <Input
                                        id="price-max"
                                        type="number"
                                        min="0"
                                        placeholder="No maximum"
                                        value={localFilters.priceRange[1] ?? ""}
                                        onChange={(event) =>
                                            setRangeValue(
                                                "priceRange",
                                                1,
                                                event.target.value
                                            )
                                        }
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </section>
                        <section className="space-y-4">
                            <h3 className="text-sm font-semibold">Area</h3>
                            <Slider
                                min={0}
                                max={areaLimit}
                                step={100}
                                value={[
                                    localFilters.squareFeet[0] ?? 0,
                                    localFilters.squareFeet[1] ?? areaLimit,
                                ]}
                                onValueChange={(value) =>
                                    setLocalFilters((current) => ({
                                        ...current,
                                        squareFeet: sliderRangeToFilter(
                                            value as [number, number],
                                            0,
                                            areaLimit
                                        ),
                                    }))
                                }
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <Label
                                        htmlFor="area-min"
                                        className="text-xs text-muted-foreground"
                                    >
                                        Minimum (sq ft)
                                    </Label>
                                    <Input
                                        id="area-min"
                                        type="number"
                                        min="0"
                                        placeholder="No minimum"
                                        value={localFilters.squareFeet[0] ?? ""}
                                        onChange={(event) =>
                                            setRangeValue(
                                                "squareFeet",
                                                0,
                                                event.target.value
                                            )
                                        }
                                        className="mt-1"
                                    />
                                </div>
                                <div>
                                    <Label
                                        htmlFor="area-max"
                                        className="text-xs text-muted-foreground"
                                    >
                                        Maximum (sq ft)
                                    </Label>
                                    <Input
                                        id="area-max"
                                        type="number"
                                        min="0"
                                        placeholder="No maximum"
                                        value={localFilters.squareFeet[1] ?? ""}
                                        onChange={(event) =>
                                            setRangeValue(
                                                "squareFeet",
                                                1,
                                                event.target.value
                                            )
                                        }
                                        className="mt-1"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>
                    {invalidRange && (
                        <p role="alert" className="text-sm text-destructive">
                            The minimum cannot be greater than the maximum.
                        </p>
                    )}

                    <div className="grid gap-4 sm:grid-cols-3">
                        <div>
                            <Label className="text-sm font-semibold">
                                Bedrooms
                            </Label>
                            <Select
                                value={localFilters.beds || "any"}
                                onValueChange={(value) =>
                                    setLocalFilters((current) => ({
                                        ...current,
                                        beds: value,
                                    }))
                                }
                            >
                                <SelectTrigger className="mt-2 w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">
                                        Any bedrooms
                                    </SelectItem>
                                    {[1, 2, 3, 4].map((value) => (
                                        <SelectItem
                                            key={value}
                                            value={String(value)}
                                        >
                                            {value}+ bedrooms
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label className="text-sm font-semibold">
                                Bathrooms
                            </Label>
                            <Select
                                value={localFilters.baths || "any"}
                                onValueChange={(value) =>
                                    setLocalFilters((current) => ({
                                        ...current,
                                        baths: value,
                                    }))
                                }
                            >
                                <SelectTrigger className="mt-2 w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="any">
                                        Any bathrooms
                                    </SelectItem>
                                    {[1, 2, 3].map((value) => (
                                        <SelectItem
                                            key={value}
                                            value={String(value)}
                                        >
                                            {value}+ bathrooms
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label
                                htmlFor="available-from"
                                className="text-sm font-semibold"
                            >
                                Available on
                            </Label>
                            <Input
                                id="available-from"
                                type="date"
                                value={
                                    localFilters.availableFrom === "any"
                                        ? ""
                                        : localFilters.availableFrom
                                }
                                onChange={(event) =>
                                    setLocalFilters((current) => ({
                                        ...current,
                                        availableFrom:
                                            event.target.value || "any",
                                    }))
                                }
                                className="mt-2 w-full"
                            />
                        </div>
                    </div>

                    <section>
                        <h3 className="text-sm font-semibold">Amenities</h3>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {Object.entries(AmenityIcons).map(
                                ([amenity, Icon]) => {
                                    const selected =
                                        localFilters.amenities.includes(
                                            amenity
                                        );
                                    return (
                                        <button
                                            type="button"
                                            key={amenity}
                                            aria-pressed={selected}
                                            onClick={() =>
                                                setLocalFilters((current) => ({
                                                    ...current,
                                                    amenities: selected
                                                        ? current.amenities.filter(
                                                              (value) =>
                                                                  value !==
                                                                  amenity
                                                          )
                                                        : [
                                                              ...current.amenities,
                                                              amenity,
                                                          ],
                                                }))
                                            }
                                            className={cn(
                                                "inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-ring",
                                                selected
                                                    ? "border-primary bg-primary/10 text-foreground"
                                                    : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                                            )}
                                        >
                                            <Icon className="size-4" />
                                            {formatEnumString(amenity)}
                                        </button>
                                    );
                                }
                            )}
                        </div>
                    </section>
                </div>
                <div className="flex flex-wrap justify-between gap-3 border-t border-border bg-card px-5 py-4 sm:px-7">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={resetFilters}
                        className="gap-2 text-muted-foreground hover:text-foreground"
                    >
                        <RotateCcw className="size-4" /> Reset all
                    </Button>
                    <Button
                        type="submit"
                        disabled={invalidRange}
                        className="min-w-40"
                    >
                        Show results
                    </Button>
                </div>
            </form>
        </>
    );
};

export default FiltersFull;
