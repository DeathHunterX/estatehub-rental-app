import type { FeatureCollection, Point } from "geojson";

type MapPointListing = {
    id: number;
    pricePerMonth: number;
    location: { coordinates: { longitude: number; latitude: number } };
};

export const buildMapFeatures = (listings: MapPointListing[]): FeatureCollection<Point, { id: number }> => ({
    type: "FeatureCollection",
    features: listings.flatMap((listing) => {
        const { longitude, latitude } = listing.location.coordinates;
        if (!Number.isFinite(longitude) || !Number.isFinite(latitude) || Math.abs(longitude) > 180 || Math.abs(latitude) > 90) return [];
        return [{
            type: "Feature" as const,
            id: listing.id,
            properties: { id: listing.id },
            geometry: { type: "Point" as const, coordinates: [longitude, latitude] },
        }];
    }),
});

type PriceCandidate = {
    id: number;
    priority: number;
    rect: { left: number; top: number; right: number; bottom: number };
};

export const pickVisiblePriceIds = (candidates: PriceCandidate[], gap = 6, blocked: PriceCandidate["rect"][] = []): Set<number> => {
    // Prefer hovered/selected prices, then reject labels that collide with clusters or earlier labels.
    const visible = new Set<number>();
    const occupied: PriceCandidate["rect"][] = [...blocked];
    for (const candidate of [...candidates].sort((a, b) => b.priority - a.priority || a.id - b.id)) {
        const collides = occupied.some((rect) =>
            candidate.rect.left < rect.right + gap && candidate.rect.right + gap > rect.left &&
            candidate.rect.top < rect.bottom + gap && candidate.rect.bottom + gap > rect.top
        );
        if (collides) continue;
        visible.add(candidate.id);
        occupied.push(candidate.rect);
    }
    return visible;
};

export const filterMapAreaListings = <T extends { id: number }>(listings: T[], ids: number[] | null): T[] => {
    if (ids === null) return listings;
    const allowed = new Set(ids);
    return listings.filter((listing) => allowed.has(listing.id));
};
