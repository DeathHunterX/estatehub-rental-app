"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Fragment } from "react/jsx-runtime";

type SkeletonVariant =
    | "cards"
    | "detail"
    | "form"
    | "table"
    | "chat"
    | "search"
    | "landing"
    | "policy"
    | "workspace";

interface PageSkeleton {
    variant?: SkeletonVariant;
    className?: string;
    label?: string;
}

function renderSkeletonContent(variant: SkeletonVariant) {
    switch (variant) {
        case "chat":
            return (
                <div className="space-y-5">
                    {[0, 1, 2, 3].map((item) => (
                        <Skeleton
                            key={item}
                            className={cn(
                                "h-14 w-3/4 rounded-2xl",
                                item % 2 && "ml-auto"
                            )}
                        />
                    ))}
                </div>
            );
        case "form":
            return (
                <div className="max-w-2xl space-y-7 rounded-2xl border border-border bg-card p-6">
                    {[0, 1, 2, 3].map((item) => (
                        <div key={item} className="space-y-3">
                            <Skeleton className="h-4 w-28" />
                            <Skeleton className="h-11 w-full" />
                        </div>
                    ))}
                    <Skeleton className="h-11 w-36" />
                </div>
            );
        case "table":
            return (
                <div className="overflow-hidden rounded-2xl border border-border bg-card p-5">
                    <div className="mb-6 grid grid-cols-3 gap-4">
                        {[0, 1, 2].map((item) => (
                            <Skeleton key={item} className="h-24" />
                        ))}
                    </div>
                    {[0, 1, 2, 3, 4].map((item) => (
                        <div
                            key={item}
                            className="flex gap-5 border-t border-border py-5"
                        >
                            <Skeleton className="h-5 w-1/3" />
                            <Skeleton className="h-5 w-1/4" />
                            <Skeleton className="ml-auto h-5 w-16" />
                        </div>
                    ))}
                </div>
            );
        case "policy":
            return (
                <div className="max-w-3xl space-y-8 rounded-2xl border border-border bg-card p-6">
                    {[0, 1, 2, 3].map((item) => (
                        <div key={item} className="space-y-3">
                            <Skeleton className="h-6 w-1/2" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-4/5" />
                        </div>
                    ))}
                </div>
            );
        case "detail":
            return (
                <Fragment>
                    <Skeleton className="h-64 w-full rounded-2xl sm:h-96" />
                    <div className="grid gap-7 md:grid-cols-[2fr_1fr]">
                        <div className="space-y-4">
                            <Skeleton className="h-7 w-2/3" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-4/5" />
                            <Skeleton className="h-36 w-full" />
                        </div>
                        <Skeleton className="h-64 rounded-2xl" />
                    </div>
                </Fragment>
            );
        default:
            return (
                <Fragment>
                    {variant === "landing" && (
                        <Skeleton className="h-80 w-full rounded-3xl sm:h-[28rem]" />
                    )}
                    {(variant === "search" || variant === "workspace") && (
                        <div className="flex gap-3">
                            <Skeleton className="h-11 flex-1" />
                            <Skeleton className="h-11 w-24" />
                            <Skeleton className="h-11 w-24" />
                        </div>
                    )}
                    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                        {[0, 1, 2, 3, 4, 5].map((item) => (
                            <div
                                key={item}
                                className="overflow-hidden rounded-2xl border border-border bg-card"
                            >
                                <Skeleton className="h-44 w-full rounded-none" />
                                <div className="space-y-3 p-5">
                                    <Skeleton className="h-6 w-3/4" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-1/2" />
                                    <Skeleton className="h-8 w-28" />
                                </div>
                            </div>
                        ))}
                    </div>
                </Fragment>
            );
    }
}

const PageSkeleton = ({
    variant = "cards",
    className,
    label = "Loading page",
}: PageSkeleton) => {
    return (
        <div
            role="status"
            aria-live="polite"
            aria-busy="true"
            className={cn(
                "mx-auto w-full max-w-7xl space-y-7 p-5 sm:p-8",
                className
            )}
        >
            <span className="sr-only">{label}</span>
            <div aria-hidden="true" className="space-y-7">
                <div className="space-y-3">
                    <Skeleton className="h-8 w-48 max-w-full" />
                    <Skeleton className="h-4 w-72 max-w-full" />
                </div>

                {renderSkeletonContent(variant)}
            </div>
        </div>
    );
};

export default PageSkeleton;
