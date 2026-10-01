import PageSkeleton from "@/components/shared/page-skeleton";
import { useGetPropertyQuery } from "@/lib/api/api";
import { ExternalLink, MapPin } from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Link from "next/link";
import { formatPropertyAddress, propertyMapHref } from "@/features/properties/lib/property-address";
import { useEffect, useRef } from "react";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string;

const PropertyLocation = ({ propertyId }: PropertyDetailsProps) => {
    const {
        data: property,
        isError,
        isLoading,
    } = useGetPropertyQuery(propertyId);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isLoading || isError || !property || !mapContainerRef.current || !mapboxgl.accessToken) return;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style: "mapbox://styles/mapbox/dark-v11",
            center: [
                property.location.coordinates.longitude,
                property.location.coordinates.latitude,
            ],
            zoom: 14,
        });

        new mapboxgl.Marker({ color: "#eb8686" })
            .setLngLat([
                property.location.coordinates.longitude,
                property.location.coordinates.latitude,
            ])
            .addTo(map);

        map.on("load", () => map.resize());
        const resizeObserver = new ResizeObserver(() => map.resize());
        resizeObserver.observe(mapContainerRef.current);

        return () => {
            resizeObserver.disconnect();
            map.remove();
        };
    }, [property, isError, isLoading]);

    if (isLoading) return <PageSkeleton variant="detail" />;
    if (isError || !property) {
        return <>Property not Found</>;
    }

    return (
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
            <h2 className="text-xl font-semibold">Location</h2>
            <div className="mt-3 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-2">
                    <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                    <span className="min-w-0">Property address: <span className="font-medium text-foreground">
                        {formatPropertyAddress(property.location) || "Address not available"}
                    </span></span>
                </div>
                <Link
                    href={propertyMapHref(property.location)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex shrink-0 items-center gap-2 font-medium text-primary underline-offset-4 hover:underline"
                >
                    <ExternalLink className="size-4" />
                    View on Google Maps
                </Link>
            </div>
            {mapboxgl.accessToken ? (
                <div
                    className="relative mt-5 h-[300px] overflow-hidden rounded-xl border border-border bg-card sm:h-[360px]"
                    ref={mapContainerRef}
                    role="region"
                    aria-label={`Map of ${property.name}`}
                />
            ) : (
                <p className="mt-5 rounded-xl border border-border bg-card p-6 text-muted-foreground">Map is unavailable.</p>
            )}
        </section>
    );
};

export default PropertyLocation;
