"use client";

// Libraries
import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { LocateFixed, MapPin } from "lucide-react";
import mapboxgl from "mapbox-gl";

// Hooks
import { useSearchFilter } from "@/features/search/hooks/use-search-filter";

// Components
import PropertyPhotoLightbox from "@/features/properties/components/property-photo-lightbox";

// Libs
import {
    chooseMapStart,
    type SavedMapView,
} from "@/features/search/lib/map-start";
import {
    requestBrowserPosition,
    requestIpPosition,
} from "@/features/search/lib/nearby-location";

import {
    buildMapFeatures,
    pickVisiblePriceIds,
} from "@/features/search/lib/map-display";
import { propertyImageSrc } from "@/features/properties/lib/property-image";

// Types
import { FiltersState } from "@/states";
import { Property } from "@/types/prisma";

// APIs
import { useGetPropertiesQuery } from "@/lib/api/api";

// Others
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN as string;

type MapProps = {
    compact: boolean;
    selectedPropertyId: number | null;
    focusRequest: { id: number | null; sequence: number };
    onSelectProperty: (id: number) => void;
    showPrices: boolean;
    onSearchArea: (ids: number[]) => void;
};

const monthlyPrice = (value: number) =>
    new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
    }).format(value);

const createMarker = (
    property: Property,
    map: mapboxgl.Map,
    onSelect: (id: number) => void,
    onHover: (id: number | null) => void,
    onOpenPhoto: (image: string, title: string) => void
) => {
    const element = document.createElement("div");
    element.className = "property-map-marker";
    element.dataset.propertyId = String(property.id);

    const pin = document.createElement("button");
    pin.type = "button";
    pin.className = "property-map-marker-pin";
    pin.setAttribute(
        "aria-label",
        `${property.name}, ${monthlyPrice(property.pricePerMonth)} per month`
    );
    const dot = document.createElement("span");
    dot.className = "property-map-marker-dot";
    const price = document.createElement("span");
    price.className = "property-map-marker-price";
    price.textContent = monthlyPrice(property.pricePerMonth);
    pin.append(dot, price);
    pin.addEventListener("click", (event) => {
        event.stopPropagation();
        onHover(property.id);
        onSelect(property.id);
    });

    const card = document.createElement("div");
    card.className = "property-map-hover-card";
    card.inert = true;
    const photoButton = document.createElement("button");
    photoButton.type = "button";
    photoButton.className = "property-map-hover-photo-button";
    photoButton.setAttribute(
        "aria-label",
        `View full-size photo of ${property.name}`
    );
    photoButton.addEventListener("click", (event) => {
        event.stopPropagation();
        onOpenPhoto(
            photo.getAttribute("src") ||
                propertyImageSrc(property.photoUrls?.[0]),
            property.name
        );
    });
    const photo = document.createElement("img");
    photo.className = "property-map-hover-photo";
    photo.src = propertyImageSrc(property.photoUrls?.[0]);
    photo.alt = "";
    photo.loading = "lazy";
    photo.decoding = "async";
    photo.addEventListener("error", () => {
        if (!photo.src.endsWith("/placeholder.jpg"))
            photo.src = "/placeholder.jpg";
    });
    photoButton.append(photo);
    const title = document.createElement("a");
    title.href = `/search/${property.id}`;
    title.className = "property-map-hover-title";
    title.textContent = property.name;
    const address = document.createElement("p");
    address.className = "property-map-hover-address";
    address.textContent = [property.location?.address, property.location?.city]
        .filter(Boolean)
        .join(", ");
    const details = document.createElement("p");
    details.className = "property-map-hover-details";
    details.textContent = `${monthlyPrice(property.pricePerMonth)}/mo · ${property.beds} ${property.beds === 1 ? "bed" : "beds"} · ${property.baths} ${property.baths === 1 ? "bath" : "baths"}`;
    card.append(photoButton, title, address, details);
    element.append(pin, card);

    element.addEventListener("mouseenter", () => onHover(property.id));
    element.addEventListener("mouseleave", () => onHover(null));
    element.addEventListener("focusin", () => onHover(property.id));
    element.addEventListener("focusout", (event) => {
        if (!element.contains(event.relatedTarget as Node | null))
            onHover(null);
    });

    const marker = new mapboxgl.Marker({ element, anchor: "center" })
        .setLngLat([
            property.location.coordinates.longitude,
            property.location.coordinates.latitude,
        ])
        .addTo(map);
    element.setAttribute("role", "group");
    element.setAttribute("aria-label", property.name);
    return { marker, element };
};

const Map = ({
    compact,
    selectedPropertyId,
    focusRequest,
    onSelectProperty,
    showPrices,
    onSearchArea,
}: MapProps) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const inMemoryView = useRef<SavedMapView | null>(null);
    const markerElementsRef = useRef<globalThis.Map<number, HTMLDivElement>>(
        new globalThis.Map()
    );
    const refreshMarkersRef = useRef<(() => void) | null>(null);
    const onSelectRef = useRef(onSelectProperty);

    const [hoveredId, setHoveredId] = useState<number | null>(null);
    const [lightbox, setLightbox] = useState<{
        image: string;
        title: string;
    } | null>(null);
    const [locationError, setLocationError] = useState("");
    const [showIpChoice, setShowIpChoice] = useState(false);
    const [viewportIds, setViewportIds] = useState<number[]>([]);
    const [canApplyArea, setCanApplyArea] = useState(false);

    const { resolvedTheme } = useTheme();

    const [queryParams] = useSearchFilter();
    const { latitude, longitude, location } = queryParams;
    const {
        data: properties,
        isLoading,
        isError,
    } = useGetPropertiesQuery(queryParams as FiltersState);
    useEffect(() => {
        onSelectRef.current = onSelectProperty;
    }, [onSelectProperty]);

    useEffect(() => {
        if (!mapContainerRef.current || !mapboxgl.accessToken) return;
        const hasSearchCoordinates = latitude != null && longitude != null;
        const hasLocationSearch = Boolean(location?.trim());
        const firstProperty = properties?.[0];
        const start = chooseMapStart({
            search: hasSearchCoordinates ? [longitude, latitude] : null,
            searchListing:
                hasLocationSearch && firstProperty
                    ? [
                          firstProperty.location.coordinates.longitude,
                          firstProperty.location.coordinates.latitude,
                      ]
                    : null,
            saved: compact ? inMemoryView.current : null,
            firstListing: firstProperty
                ? [
                      firstProperty.location.coordinates.longitude,
                      firstProperty.location.coordinates.latitude,
                  ]
                : null,
        });
        const map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style:
                resolvedTheme === "light"
                    ? "mapbox://styles/mapbox/light-v11"
                    : "mapbox://styles/mapbox/dark-v11",
            projection: "mercator",
            center: start.center,
            zoom: start.zoom,
        });
        mapRef.current = map;
        let userMoved = false;
        map.on("movestart", (event) => {
            if ("originalEvent" in event && event.originalEvent)
                userMoved = true;
        });
        map.on("moveend", () => {
            if (userMoved) {
                userMoved = false;
                const center = map.getCenter();
                inMemoryView.current = {
                    center: [center.lng, center.lat],
                    zoom: map.getZoom(),
                };
                setCanApplyArea(true);
            }
        });
        const bounds = new mapboxgl.LngLatBounds();
        const elements = new globalThis.Map<number, HTMLDivElement>();
        const features = buildMapFeatures(properties ?? []);
        const validIds = new Set(
            features.features.map((feature) => feature.properties.id)
        );
        const propertiesById = new globalThis.Map(
            properties?.map((property) => [property.id, property])
        );
        let clusterPopup: mapboxgl.Popup | null = null;
        const updateViewport = () => {
            const bounds = map.getBounds();
            if (!bounds) return;
            setViewportIds(
                features.features
                    .filter((feature) =>
                        bounds.contains(
                            feature.geometry.coordinates as [number, number]
                        )
                    )
                    .map((feature) => feature.properties.id)
            );
        };
        map.on("moveend", updateViewport);
        properties?.forEach((property) => {
            if (!validIds.has(property.id)) return;
            const { marker, element } = createMarker(
                property,
                map,
                (id) => onSelectRef.current(id),
                setHoveredId,
                (image, title) => setLightbox({ image, title })
            );
            element.style.visibility = "hidden";
            bounds.extend(marker.getLngLat());
            elements.set(property.id, element);
        });
        markerElementsRef.current = elements;
        if (!compact && elements.size > 1 && !hasSearchCoordinates) {
            map.fitBounds(bounds, { padding: 70, maxZoom: 12, duration: 0 });
        }
        const refreshMarkers = () => {
            if (!map.getLayer("search-unclustered-points")) return;
            // Show pins only for rendered features, then suppress overlapping prices.
            const visibleIds = new Set(
                map
                    .queryRenderedFeatures({
                        layers: ["search-unclustered-points"],
                    })
                    .map((feature) => Number(feature.properties?.id))
            );
            const candidates: {
                id: number;
                rect: DOMRect;
                priority: number;
            }[] = [];
            elements.forEach((element, id) => {
                const visible = visibleIds.has(id);
                const visibility = visible ? "visible" : "hidden";
                if (element.style.visibility !== visibility)
                    element.style.visibility = visibility;
            });
            if (map.isMoving()) return;
            if (!mapContainerRef.current?.classList.contains("map-show-prices"))
                return;
            elements.forEach((element, id) => {
                const visible = visibleIds.has(id);
                if (!visible) return;
                element.classList.remove("is-price-hidden");
                const pin = element.querySelector<HTMLElement>(
                    ".property-map-marker-pin"
                );
                if (pin)
                    candidates.push({
                        id,
                        rect: pin.getBoundingClientRect(),
                        priority: element.classList.contains("is-hovered")
                            ? 2
                            : element.classList.contains("is-selected")
                              ? 1
                              : 0,
                    });
            });
            const mapRect = mapContainerRef.current.getBoundingClientRect();
            const clusterRects = map.getLayer("search-property-clusters")
                ? map
                      .queryRenderedFeatures({
                          layers: ["search-property-clusters"],
                      })
                      .flatMap((feature) => {
                          if (feature.geometry.type !== "Point") return [];
                          const point = map.project(
                              feature.geometry.coordinates as [number, number]
                          );
                          const count =
                              Number(feature.properties?.point_count) || 0;
                          const radius =
                              count >= 30 ? 28 : count >= 10 ? 24 : 20;
                          const x = mapRect.left + point.x;
                          const y = mapRect.top + point.y;
                          return [
                              {
                                  left: x - radius,
                                  top: y - radius,
                                  right: x + radius,
                                  bottom: y + radius,
                              },
                          ];
                      })
                : [];
            const visiblePrices = pickVisiblePriceIds(
                candidates,
                6,
                clusterRects
            );
            elements.forEach((element, id) => {
                if (visibleIds.has(id))
                    element.classList.toggle(
                        "is-price-hidden",
                        !visiblePrices.has(id)
                    );
            });
        };
        refreshMarkersRef.current = refreshMarkers;
        map.on("load", () => {
            map.resize();
            updateViewport();
            map.addSource("search-properties", {
                type: "geojson",
                data: features,
                cluster: true,
                clusterRadius: 60,
                clusterMaxZoom: 13,
            });
            map.addLayer({
                id: "search-unclustered-points",
                type: "circle",
                source: "search-properties",
                filter: ["!", ["has", "point_count"]],
                paint: { "circle-radius": 8, "circle-opacity": 0 },
            });
            map.addLayer({
                id: "search-property-clusters",
                type: "circle",
                source: "search-properties",
                filter: ["has", "point_count"],
                paint: {
                    "circle-radius": [
                        "step",
                        ["get", "point_count"],
                        20,
                        10,
                        24,
                        30,
                        28,
                    ],
                    "circle-color":
                        resolvedTheme === "light" ? "#a8434e" : "#d78289",
                    "circle-stroke-color":
                        resolvedTheme === "light" ? "#fff" : "#131722",
                    "circle-stroke-width": 3,
                },
            });
            map.addLayer({
                id: "search-property-cluster-count",
                type: "symbol",
                source: "search-properties",
                filter: ["has", "point_count"],
                layout: {
                    "text-field": ["get", "point_count_abbreviated"],
                    "text-size": 12,
                    "text-font": [
                        "DIN Offc Pro Medium",
                        "Arial Unicode MS Bold",
                    ],
                    "text-allow-overlap": true,
                    "text-ignore-placement": true,
                },
                paint: {
                    "text-color":
                        resolvedTheme === "light" ? "#fff" : "#111521",
                },
            });
            map.on("click", "search-property-clusters", (event) => {
                const feature = event.features?.[0];
                if (!feature || feature.geometry.type !== "Point") return;
                const center = feature.geometry.coordinates as [number, number];
                const clusterId = Number(feature.properties?.cluster_id);
                const source = map.getSource(
                    "search-properties"
                ) as mapboxgl.GeoJSONSource;
                setCanApplyArea(true);
                source.getClusterExpansionZoom(clusterId, (error, zoom) => {
                    if (error || zoom == null) return;
                    if (map.getZoom() >= 13) {
                        const count =
                            Number(feature.properties?.point_count) || 0;
                        source.getClusterLeaves(
                            clusterId,
                            Math.min(count, 50),
                            0,
                            (leavesError, leaves) => {
                                if (leavesError || !leaves?.length) return;
                                const content = document.createElement("div");
                                content.className =
                                    "max-h-60 overflow-y-auto text-white";
                                const heading = document.createElement("p");
                                heading.className =
                                    "mb-2 pr-5 text-sm font-semibold";
                                heading.textContent = `${count} places here`;
                                content.append(heading);
                                leaves.forEach((leaf) => {
                                    const property = propertiesById.get(
                                        Number(leaf.properties?.id)
                                    );
                                    if (!property) return;
                                    const button =
                                        document.createElement("button");
                                    button.type = "button";
                                    button.className =
                                        "block w-full rounded-md px-2 py-2 text-left text-xs text-white hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white";
                                    button.textContent = `${property.name} · ${monthlyPrice(property.pricePerMonth)}/mo`;
                                    button.addEventListener("click", () => {
                                        onSelectRef.current(property.id);
                                        setHoveredId(property.id);
                                        clusterPopup?.remove();
                                    });
                                    content.append(button);
                                });
                                clusterPopup?.remove();
                                clusterPopup = new mapboxgl.Popup({
                                    closeOnClick: false,
                                    maxWidth: "260px",
                                    offset: 18,
                                })
                                    .setLngLat(center)
                                    .setDOMContent(content)
                                    .addTo(map);
                            }
                        );
                        return;
                    }
                    map.easeTo({
                        center,
                        zoom,
                        duration: window.matchMedia(
                            "(prefers-reduced-motion: reduce)"
                        ).matches
                            ? 0
                            : 650,
                    });
                });
            });
            map.on("mouseenter", "search-property-clusters", () => {
                map.getCanvas().style.cursor = "pointer";
            });
            map.on("mouseleave", "search-property-clusters", () => {
                map.getCanvas().style.cursor = "";
            });
            refreshMarkers();
        });
        map.on("render", refreshMarkers);
        map.on("moveend", refreshMarkers);
        const resizeObserver = new ResizeObserver(() => map.resize());
        resizeObserver.observe(mapContainerRef.current);
        return () => {
            resizeObserver.disconnect();
            clusterPopup?.remove();
            markerElementsRef.current = new globalThis.Map();
            refreshMarkersRef.current = null;
            mapRef.current = null;
            map.remove();
        };
    }, [compact, properties, longitude, latitude, location, resolvedTheme]);

    useEffect(() => {
        const map = mapRef.current;
        const property = properties?.find(
            (item) => item.id === focusRequest.id
        );
        if (!map || !property || focusRequest.sequence === 0) return;
        map.flyTo({
            center: [
                property.location.coordinates.longitude,
                property.location.coordinates.latitude,
            ],
            zoom: Math.max(map.getZoom(), 14),
            duration:
                document.documentElement.dataset.reduceMotion === "true" ||
                window.matchMedia("(prefers-reduced-motion: reduce)").matches
                    ? 0
                    : 1700,
            easing: (t) =>
                t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
            essential: false,
        });
    }, [focusRequest, properties, resolvedTheme]);

    useEffect(() => {
        mapContainerRef.current?.classList.toggle(
            "map-has-hover",
            hoveredId !== null
        );
        mapContainerRef.current?.classList.toggle(
            "map-show-prices",
            showPrices
        );
        markerElementsRef.current.forEach((element, id) => {
            element.classList.toggle("is-hovered", id === hoveredId);
            element.classList.toggle("is-selected", id === selectedPropertyId);
            const card = element.querySelector<HTMLElement>(
                ".property-map-hover-card"
            );
            if (card)
                card.inert =
                    id !== hoveredId &&
                    !(
                        window.matchMedia("(max-width: 1023px)").matches &&
                        id === selectedPropertyId
                    );
        });
        refreshMarkersRef.current?.();
    }, [hoveredId, selectedPropertyId, showPrices, properties, resolvedTheme]);

    const locateMe = async () => {
        setLocationError("");
        setShowIpChoice(false);
        try {
            const center = await requestBrowserPosition(
                navigator.geolocation ?? null
            );
            mapRef.current?.jumpTo({ center, zoom: 5 });
            inMemoryView.current = { center, zoom: 5 };
        } catch (error) {
            // Explicit permission denial must not fall back to an IP lookup.
            if (
                typeof error === "object" &&
                error !== null &&
                "code" in error &&
                error.code === 1
            ) {
                setLocationError(
                    "Location permission was declined. Use the map manually or change your browser permission."
                );
            } else {
                setLocationError(
                    "Browser location is unavailable. You can use an approximate IP location instead."
                );
                setShowIpChoice(true);
            }
        }
    };

    const locateByIp = async () => {
        setLocationError("");
        try {
            const center = await requestIpPosition(fetch);
            mapRef.current?.jumpTo({ center, zoom: 5 });
            inMemoryView.current = { center, zoom: 5 };
            setShowIpChoice(false);
        } catch {
            setLocationError(
                "Approximate location is unavailable. Use the map manually."
            );
        }
    };

    if (!mapboxgl.accessToken) {
        return (
            <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl border border-border bg-card p-8 text-center text-card-foreground">
                <MapPin className="mr-2 size-6 text-muted-foreground" />
                Map is unavailable
            </div>
        );
    }

    return (
        <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-border lg:basis-7/12">
            <div
                className="map-container h-full w-full"
                ref={mapContainerRef}
                role="region"
                aria-label="Map of rental properties"
            />
            {isLoading && (
                <div
                    role="status"
                    aria-busy="true"
                    className="pointer-events-none absolute inset-0 flex items-center justify-center bg-muted/80"
                >
                    <span className="sr-only">Loading rental locations</span>
                    <div
                        aria-hidden="true"
                        className="grid w-3/4 grid-cols-3 gap-4 motion-safe:animate-pulse"
                    >
                        {[0, 1, 2, 3, 4, 5].map((item) => (
                            <div
                                key={item}
                                className="h-16 rounded-xl bg-accent"
                            />
                        ))}
                    </div>
                </div>
            )}
            {!!properties?.length && (
                <div className="absolute left-3 top-3 z-10 flex max-w-[calc(100%-4.5rem)] flex-col items-start gap-2">
                    <span className="rounded-lg border border-border bg-card/95 px-3 py-2 text-xs font-medium text-card-foreground shadow-lg">
                        {viewportIds.length} of {properties.length} places in
                        view
                    </span>
                    {canApplyArea && (
                        <button
                            type="button"
                            onClick={() => {
                                onSearchArea(viewportIds);
                                setCanApplyArea(false);
                            }}
                            className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-lg hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            Show results here
                        </button>
                    )}
                </div>
            )}
            {compact && (
                <div className="absolute right-3 top-3 z-10 max-w-[min(17rem,calc(100%-1.5rem))] rounded-lg border border-border bg-card/95 p-2 text-xs text-card-foreground shadow-lg">
                    <button
                        type="button"
                        onClick={() => void locateMe()}
                        className="flex items-center gap-2 font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                        <LocateFixed className="size-4" />
                        Use my nearby location
                    </button>
                    <p className="mt-1 text-muted-foreground">
                        Uses browser location. If unavailable, you may choose to
                        send your IP address to ipapi.co for an approximate
                        location.
                    </p>
                    {locationError && (
                        <p role="alert" className="mt-1 text-foreground">
                            {locationError}
                        </p>
                    )}
                    {showIpChoice && (
                        <button
                            type="button"
                            onClick={() => void locateByIp()}
                            className="mt-1 font-semibold text-primary underline"
                        >
                            Use approximate IP location
                        </button>
                    )}
                </div>
            )}
            {(isLoading || isError || properties?.length === 0) && (
                <div className="pointer-events-none absolute bottom-4 left-4 max-w-[calc(100%-2rem)] rounded-lg border border-border bg-background/90 px-3 py-2 text-xs text-foreground shadow-lg backdrop-blur-sm">
                    {isLoading
                        ? "Loading rental locations..."
                        : isError
                          ? "Property locations could not be loaded."
                          : "No matching property markers for this search."}
                </div>
            )}
            {lightbox && (
                <PropertyPhotoLightbox
                    images={[lightbox.image]}
                    index={0}
                    title={lightbox.title}
                    onChange={() => {}}
                    onClose={() => setLightbox(null)}
                />
            )}
        </div>
    );
};

export default Map;
