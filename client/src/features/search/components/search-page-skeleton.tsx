"use client";

import { useSyncExternalStore } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from "@/states/store";
import { resolveSearchViewMode } from "../lib/search-view";
import SearchResultsSkeleton from "./search-results-skeleton";

function subscribe(notify: () => void) {
    window.addEventListener("popstate", notify);
    window.addEventListener("resize", notify);
    return () => {
        window.removeEventListener("popstate", notify);
        window.removeEventListener("resize", notify);
    };
}

export default function SearchPageSkeleton() {
    const currentView = useAppSelector((state) => state.global.viewMode);
    const viewMode = useSyncExternalStore(subscribe, () => {
        const compact = window.matchMedia("(max-width: 1023px)").matches;
        return resolveSearchViewMode(new URLSearchParams(window.location.search).get("view"), currentView, compact);
    }, () => currentView);

    return <div className="flex w-full flex-col">
        <div role="status" aria-label="Loading search filters" aria-busy="true" className="flex gap-3 border-b border-border p-4">
            <Skeleton className="h-10 flex-1" /><Skeleton className="h-10 w-24" /><Skeleton className="h-10 w-20" />
        </div>
        <div className="flex min-h-[65vh] gap-3 p-2">
            {viewMode !== "grid" && <div className={viewMode === "map" ? "min-h-[65vh] flex-1" : "hidden min-h-[65vh] lg:block lg:basis-7/12"} role="status" aria-label="Loading map" aria-busy="true"><Skeleton className="h-full min-h-[65vh] rounded-xl" /></div>}
            <div className={viewMode === "grid" ? "w-full" : viewMode === "map" ? "hidden lg:block lg:basis-4/12" : "w-full lg:basis-4/12"}>
                <SearchResultsSkeleton viewMode={viewMode} />
            </div>
        </div>
    </div>;
}
