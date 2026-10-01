"use client";

import { Skeleton } from "@/components/ui/skeleton";
import type { SearchViewMode } from "../lib/search-view";

export default function SearchResultsSkeleton({ viewMode }: { viewMode: SearchViewMode }) {
    const grid = viewMode === "grid";

    return <div className="w-full" role="status" aria-busy="true" aria-live="polite">
        <span className="sr-only">Loading search results</span>
        <div aria-hidden="true">
            <div className="space-y-2 px-4 pb-2 pt-4">
                <Skeleton className="h-7 w-40" />
                <Skeleton className="h-4 w-56 max-w-full" />
            </div>
            <div className={grid ? "grid w-full grid-cols-1 content-start gap-4 p-4 md:grid-cols-2 xl:grid-cols-3" : "w-full space-y-4 p-4"}>
                {Array.from({ length: grid ? 6 : 4 }, (_, index) => (
                    <div key={index} className={grid ? "overflow-hidden rounded-xl border border-border bg-card shadow-lg" : "flex min-h-44 w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm"}>
                        <Skeleton className={grid ? "h-48 w-full rounded-none" : "min-h-44 w-1/3 shrink-0 rounded-none"} />
                        <div className={grid ? "space-y-4 p-4" : "flex min-w-0 flex-1 flex-col justify-between gap-5 p-4"}>
                            <div className="space-y-2">
                                <div className="flex items-start justify-between gap-3"><Skeleton className="h-6 w-3/4" /><Skeleton className="size-7 shrink-0 rounded-full" /></div>
                                <Skeleton className="h-4 w-4/5" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                            <div className={grid ? "space-y-4" : "space-y-3"}>
                                <Skeleton className="h-5 w-28" />
                                <div className="flex gap-3 border-t border-border pt-3"><Skeleton className="h-4 w-14" /><Skeleton className="h-4 w-14" /><Skeleton className="h-4 w-14" /></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>;
}
