"use client";
import { useSearchFilter } from "@/hooks/use-search-filter";
import { FiltersState } from "@/states";
import { useGetPropertiesQuery } from "@/states/api";
import { Property } from "@/types/prisma";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef } from "react";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string;

const Map = () => {
    const mapContainerRef = useRef(null);
    const [queryParams] = useSearchFilter();
    const [{ latitude, longitude }] = useSearchFilter();
    const {
        data: properties,
        isLoading,
        isError,
    } = useGetPropertiesQuery(queryParams as FiltersState);

    useEffect(() => {
        if (isLoading || isError || !properties) return;

        const map = new mapboxgl.Map({
            container: mapContainerRef.current!,
            center: (longitude && latitude
                ? [longitude, latitude]
                : [-74.5, 40]) as [number, number],
            zoom: 16,
        });

        properties.forEach((property) => {
            const marker = createPropertyMarker(property, map);
            const markerElement = marker.getElement();
            const path = markerElement.querySelector("path[fill='#3FB1CE']");
            if (path) path.setAttribute("fill", "#000000");
        });

        const resizeMap = () => {
            if (map) setTimeout(() => map.resize(), 700);
        };
        resizeMap();

        return () => map.remove();
    }, [isLoading, isError, properties, longitude, latitude]);

    if (isLoading) return <>Loading...</>;
    if (isError || !properties) return <div>Failed to fetch properties</div>;

    return (
        <div className="relative rounded-xl md:basis-5/12 md:grow">
            <div
                className="map-container rounded-xl"
                ref={mapContainerRef}
                style={{
                    height: "100%",
                    width: "100%",
                }}
            />
        </div>
    );
};

const createPropertyMarker = (property: Property, map: mapboxgl.Map) => {
    const marker = new mapboxgl.Marker()
        .setLngLat([
            property.location.coordinates.longitude,
            property.location.coordinates.latitude,
        ])
        .setPopup(
            new mapboxgl.Popup().setHTML(
                `
                    <div class="marker-popup">
                        <div class="marker-popup-image"></div>
                        <div>
                            <a href="/search/${property.id}" target="_blank" class="marker-popup-title">${property.name}</a>
                            <p class="marker-popup-price">
                            $${property.pricePerMonth}
                            <span class="marker-popup-price-unit"> / month</span>
                            </p>
                        </div>
                    </div>
                `
            )
        )
        .addTo(map);
    return marker;
};

export default Map;
