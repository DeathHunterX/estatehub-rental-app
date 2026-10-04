type Coordinates = { latitude: number; longitude: number };

export type Destination = {
    city: string;
    state: string;
    country: string;
    count: number;
    photoUrl?: string;
    distanceKm: number | null;
};

export type DestinationSummary = Omit<Destination, "distanceKm"> & {
    coordinates: Coordinates;
};

export const destinationSearchHref = (
    destination: Pick<Destination, "city" | "state" | "country">
) =>
    `/search?location=${encodeURIComponent([destination.city, destination.state, destination.country].filter(Boolean).join(", "))}`;

const distanceKm = (a: Coordinates, b: Coordinates) => {
    const radians = (degrees: number) => (degrees * Math.PI) / 180;
    const dLat = radians(b.latitude - a.latitude);
    const dLng = radians(b.longitude - a.longitude);
    const scale =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(radians(a.latitude)) *
            Math.cos(radians(b.latitude)) *
            Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(scale), Math.sqrt(1 - scale));
};

export const rankDestinationSummaries = (
    summaries: DestinationSummary[],
    currentLocation: Coordinates | null,
    limit = 4
): Destination[] => {
    const destinations = summaries.map(({ coordinates, ...summary }) => ({
        ...summary,
        distanceKm:
            currentLocation &&
            Number.isFinite(coordinates?.latitude) &&
            Number.isFinite(coordinates?.longitude)
                ? distanceKm(currentLocation, coordinates)
                : null,
    }));
    destinations.sort((a, b) => {
        if (currentLocation) {
            const aNearby = (a.distanceKm ?? Infinity) <= 250;
            const bNearby = (b.distanceKm ?? Infinity) <= 250;
            if (aNearby !== bNearby) return aNearby ? -1 : 1;
            if (aNearby)
                return b.count - a.count || (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
            return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) || b.count - a.count;
        }
        return b.count - a.count || a.city.localeCompare(b.city);
    });
    return destinations.slice(0, limit);
};
