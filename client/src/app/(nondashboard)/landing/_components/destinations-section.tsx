"use client";

// Libraries
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, LocateFixed, MapPin } from "lucide-react";

// Libs
import { usablePropertyPhotos } from "@/features/properties/lib/property-image";
import {
    Destination,
    destinationSearchHref,
    rankDestinations,
} from "@/lib/destinations";

// APIs
import { useGetPropertiesQuery } from "@/lib/api/api";

type LocationStatus = "idle" | "locating" | "ready" | "unavailable";

const DestinationCards = ({
    destinations,
}: {
    destinations: Destination[];
}) => (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {destinations.map((destination, index) => {
            const photo = destination.photoUrl
                ? usablePropertyPhotos([destination.photoUrl])[0]
                : null;
            return (
                <Link
                    key={`${destination.city}-${destination.state}-${destination.country}`}
                    href={destinationSearchHref(destination)}
                    className="group relative flex min-h-60 flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-sm transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/60 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-ring"
                >
                    {photo ? (
                        <>
                            <Image
                                src={photo}
                                alt=""
                                fill
                                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                className="object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />
                        </>
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-card to-secondary/20" />
                    )}
                    <div
                        className={`relative flex items-start justify-between ${photo ? "text-white" : "text-card-foreground"}`}
                    >
                        <span className="rounded-full border border-current/25 bg-background/25 p-2.5">
                            <MapPin className="size-5" />
                        </span>
                        <ArrowUpRight className="size-5 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </div>
                    <div
                        className={`relative ${photo ? "text-white" : "text-card-foreground"}`}
                    >
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] opacity-80">
                            Destination {String(index + 1).padStart(2, "0")}
                        </p>
                        <h3 className="text-2xl font-semibold tracking-tight">
                            {destination.city}
                        </h3>
                        <p className="mt-1 text-sm opacity-80">
                            {[destination.state, destination.country]
                                .filter(Boolean)
                                .join(", ")}
                        </p>
                        <p className="mt-4 text-xs font-semibold">
                            {destination.count}{" "}
                            {destination.count === 1 ? "home" : "homes"}{" "}
                            available
                            {destination.distanceKm !== null
                                ? ` · ${Math.round(destination.distanceKm)} km away`
                                : ""}
                        </p>
                    </div>
                </Link>
            );
        })}
    </div>
);

const DestinationsSection = () => {
    const {
        data: properties = [],
        isLoading,
        isError,
    } = useGetPropertiesQuery({ silent: true });
    const [location, setLocation] = useState<{
        latitude: number;
        longitude: number;
    } | null>(null);
    const [locationStatus, setLocationStatus] =
        useState<LocationStatus>("idle");
    const popular = rankDestinations(properties, null);
    const nearby = location
        ? rankDestinations(properties, location).filter(
              (destination) =>
                  destination.distanceKm !== null &&
                  destination.distanceKm <= 250
          )
        : [];

    const locate = () => {
        if (!navigator.geolocation) {
            setLocationStatus("unavailable");
            return;
        }
        setLocationStatus("locating");
        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                setLocation({
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                });
                setLocationStatus("ready");
            },
            () => setLocationStatus("unavailable"),
            { enableHighAccuracy: false, maximumAge: 300_000, timeout: 10_000 }
        );
    };

    return (
        <section
            id="destinations"
            className="bg-background px-6 py-20 text-foreground sm:px-8 lg:py-28"
        >
            <div className="mx-auto max-w-7xl space-y-20">
                <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                        Explore by location
                    </p>
                    <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                        Popular places to explore
                    </h2>
                    <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
                        Discover the cities with the most available homes.
                    </p>
                    {isLoading ? (
                        <div
                            className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
                            aria-label="Loading destinations"
                        >
                            {[0, 1, 2, 3].map((item) => (
                                <div
                                    key={item}
                                    className="h-60 animate-pulse rounded-2xl bg-muted"
                                />
                            ))}
                        </div>
                    ) : isError || popular.length === 0 ? (
                        <div className="mt-10 rounded-2xl border border-border bg-card px-6 py-10 text-card-foreground">
                            <h3 className="text-lg font-semibold">
                                {isError
                                    ? "Destinations are temporarily unavailable"
                                    : "New destinations are on their way"}
                            </h3>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {isError
                                    ? "We could not load available homes right now."
                                    : "Cities will appear here as soon as homes are listed."}
                            </p>
                            <Link
                                href="/search"
                                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                            >
                                Browse all homes{" "}
                                <ArrowUpRight className="size-4" />
                            </Link>
                        </div>
                    ) : (
                        <div className="mt-10">
                            <DestinationCards destinations={popular} />
                        </div>
                    )}
                </div>
                <div
                    id="nearby-destinations"
                    className="border-t border-border pt-14"
                >
                    <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                                Around you
                            </p>
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                                Places to explore near you
                            </h2>
                            <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">
                                Choose to share your location and explore
                                available homes within 250 km.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={locate}
                            disabled={locationStatus === "locating"}
                            className="inline-flex w-fit items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold text-card-foreground transition-colors hover:border-primary/60 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-wait disabled:opacity-60"
                        >
                            <LocateFixed className="size-4" />
                            {locationStatus === "locating"
                                ? "Finding your location..."
                                : locationStatus === "ready"
                                  ? "Update my location"
                                  : "Use my location"}
                        </button>
                    </div>
                    <div className="mt-10 min-h-60" aria-live="polite">
                        {locationStatus === "ready" && nearby.length > 0 ? (
                            <DestinationCards destinations={nearby} />
                        ) : (
                            <div className="flex min-h-60 flex-col justify-center rounded-2xl border border-dashed border-border bg-card px-6 py-8 text-card-foreground">
                                <h3 className="text-lg font-semibold">
                                    {locationStatus === "ready"
                                        ? "No listed homes nearby yet"
                                        : locationStatus === "unavailable"
                                          ? "Location is unavailable"
                                          : "Find places close to you"}
                                </h3>
                                <p className="mt-2 text-sm text-muted-foreground">
                                    {locationStatus === "ready"
                                        ? "Explore popular destinations above while new homes are listed nearby."
                                        : locationStatus === "unavailable"
                                          ? "Permission was declined or your browser could not find your location. Popular destinations remain available above."
                                          : "Use your location to reveal nearby destinations here. The popular places above will stay in place."}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DestinationsSection;
