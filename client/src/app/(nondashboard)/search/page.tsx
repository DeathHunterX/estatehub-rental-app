"use client";

// Libraries
import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, useSyncExternalStore } from "react";

// Components
import SearchPageSkeleton from "@/features/search/components/search-page-skeleton";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import FiltersBar from "./_components/filters-bar";
import FiltersFull from "./_components/filters-full";
import Listings from "./_components/listings";
import Map from "./_components/map";

// State
import { setViewMode } from "@/states";
import { setFiltersFullOpen } from "@/states";
import { useAppDispatch, useAppSelector } from "@/states/store";

// Constants
import { NAVBAR_HEIGHT } from "@/constants";

// Libs
import {
    resolveSearchViewMode,
    searchViewHref,
    canonicalLocationSearch,
} from "@/features/search/lib/search-view";

const subscribeCompact = (notify: () => void) => {
    const media = window.matchMedia("(max-width: 1023px)");
    media.addEventListener("change", notify);
    return () => media.removeEventListener("change", notify);
};
const getCompact = () => window.matchMedia("(max-width: 1023px)").matches;

const SearchPageContent = () => {
    const [mapAreaFilter, setMapAreaFilter] = useState<{
        queryKey: string;
        ids: number[];
    } | null>(null);
    const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(
        null
    );
    const [focusRequest, setFocusRequest] = useState({
        id: null as number | null,
        sequence: 0,
    });
    const [showMapPrices, setShowMapPrices] = useState(true);
    const isCompact = useSyncExternalStore(
        subscribeCompact,
        getCompact,
        () => false
    );
    const selectProperty = (id: number) => {
        setSelectedPropertyId(id);
        setFocusRequest((current) => ({ id, sequence: current.sequence + 1 }));
        if (isCompact && viewMode !== "map") {
            dispatch(setViewMode("map"));
            router.replace(
                searchViewHref(
                    new URLSearchParams(searchParams.toString()),
                    "map"
                ),
                { scroll: false }
            );
        }
    };
    const isFiltersFullOpen = useAppSelector(
        (state) => state.global.isFiltersFullOpen
    );
    const viewMode = useAppSelector((state) => state.global.viewMode);
    const dispatch = useAppDispatch();
    const router = useRouter();
    const searchParams = useSearchParams();
    const requestedView = searchParams.get("view");
    const filterParams = new URLSearchParams(searchParams.toString());
    filterParams.delete("view");
    const queryKey = filterParams.toString();
    // A map-area selection belongs to the filter query that produced it.
    const activeMapAreaIds =
        mapAreaFilter?.queryKey === queryKey ? mapAreaFilter.ids : null;

    useEffect(() => {
        const preferredView = resolveSearchViewMode(
            requestedView,
            null,
            isCompact
        );
        dispatch(setViewMode(preferredView));
        if (requestedView !== preferredView) {
            router.replace(
                searchViewHref(
                    new URLSearchParams(searchParams.toString()),
                    preferredView
                ),
                { scroll: false }
            );
        }
    }, [dispatch, requestedView, router, searchParams, isCompact]);

    useEffect(() => {
        const canonical = canonicalLocationSearch(window.location.search);
        if (canonical !== null) {
            window.history.replaceState(
                null,
                "",
                `${window.location.pathname}?${canonical}${window.location.hash}`
            );
        }
    }, [searchParams]);

    return (
        <div
            className="w-full min-h-0 mx-auto px-4 sm:px-5 flex flex-col bg-background text-foreground"
            style={{
                height: `calc(100vh - ${NAVBAR_HEIGHT}px)`,
            }}
        >
            <FiltersBar
                showMapPrices={showMapPrices}
                onShowMapPricesChange={setShowMapPrices}
            />
            <Dialog
                open={isCompact && isFiltersFullOpen}
                onOpenChange={(open) => dispatch(setFiltersFullOpen(open))}
            >
                <DialogContent className="flex max-h-[min(90dvh,850px)] w-[min(960px,calc(100vw-2rem))] max-w-[calc(100vw-2rem)] flex-col gap-0 overflow-hidden rounded-2xl border-border bg-card p-0 text-card-foreground sm:max-w-5xl">
                    <DialogTitle className="sr-only">All filters</DialogTitle>
                    <DialogDescription className="sr-only">
                        Choose a location, property details and a price range.
                    </DialogDescription>
                    <FiltersFull />
                </DialogContent>
            </Dialog>
            <div className="relative flex min-h-0 justify-between flex-1 flex-col overflow-hidden gap-3 mb-5 lg:flex-row">
                {!isCompact && isFiltersFullOpen && (
                    <aside
                        aria-label="All filters panel"
                        className="absolute inset-y-0 left-0 z-40 flex w-[min(500px,calc(100%-1rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-2xl"
                    >
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Close all filters"
                            onClick={() => dispatch(setFiltersFullOpen(false))}
                            className="absolute right-3 top-3 z-10"
                        >
                            <X className="size-4" />
                        </Button>
                        <FiltersFull />
                    </aside>
                )}
                {viewMode !== "grid" && (!isCompact || viewMode === "map") && (
                    <Map
                        compact={isCompact}
                        selectedPropertyId={selectedPropertyId}
                        focusRequest={focusRequest}
                        onSelectProperty={selectProperty}
                        showPrices={showMapPrices}
                        onSearchArea={(ids) => {
                            setMapAreaFilter({ queryKey, ids });
                            if (isCompact) {
                                dispatch(setViewMode("list"));
                                router.replace(
                                    searchViewHref(
                                        new URLSearchParams(
                                            searchParams.toString()
                                        ),
                                        "list"
                                    ),
                                    { scroll: false }
                                );
                            }
                        }}
                    />
                )}
                <div
                    className={
                        viewMode === "grid" ||
                        (isCompact && viewMode === "list")
                            ? "min-h-0 overflow-y-auto basis-full"
                            : isCompact
                              ? "hidden"
                              : "min-h-0 overflow-y-auto basis-full lg:basis-4/12"
                    }
                >
                    <Listings
                        selectedPropertyId={selectedPropertyId}
                        onSelectProperty={selectProperty}
                        mapAreaIds={activeMapAreaIds}
                        onClearMapArea={() => setMapAreaFilter(null)}
                    />
                </div>
            </div>
        </div>
    );
};

export default function SearchPage() {
    return (
        <Suspense fallback={<SearchPageSkeleton />}>
            <SearchPageContent />
        </Suspense>
    );
}
