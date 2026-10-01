type Coordinates = { latitude: number; longitude: number };

export type DestinationListing = {
    location: {
        city: string;
        state: string;
        country: string;
        coordinates: Coordinates;
    };
    photoUrls?: string[];
};

export type Destination = {
    city: string;
    state: string;
    country: string;
    count: number;
    photoUrl?: string;
    distanceKm: number | null;
};

export const destinationSearchHref = (destination: Pick<Destination, "city" | "state" | "country">) =>
    `/search?location=${encodeURIComponent([destination.city, destination.state, destination.country].filter(Boolean).join(", "))}`;

const distanceKm = (a: Coordinates, b: Coordinates) => {
    const radians = (degrees: number) => degrees * Math.PI / 180;
    const dLat = radians(b.latitude - a.latitude);
    const dLng = radians(b.longitude - a.longitude);
    const scale = Math.sin(dLat / 2) ** 2 +
        Math.cos(radians(a.latitude)) * Math.cos(radians(b.latitude)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(scale), Math.sqrt(1 - scale));
};

export const rankDestinations = (
    listings: DestinationListing[],
    currentLocation: Coordinates | null,
    limit = 4
): Destination[] => {
    const grouped = new Map<string, Destination>();
    for (const listing of listings) {
        const { city, state, country, coordinates } = listing.location;
        if (!city?.trim()) continue;
        const key = [city, state, country].map((value) => value?.trim().toLowerCase()).join("|");
        const existing = grouped.get(key);
        if (existing) {
            existing.count += 1;
            if (!existing.photoUrl && listing.photoUrls?.[0]) existing.photoUrl = listing.photoUrls[0];
        } else {
            grouped.set(key, {
                city: city.trim(),
                state: state?.trim() ?? "",
                country: country?.trim() ?? "",
                count: 1,
                photoUrl: listing.photoUrls?.[0],
                distanceKm: currentLocation && Number.isFinite(coordinates?.latitude) && Number.isFinite(coordinates?.longitude)
                    ? distanceKm(currentLocation, coordinates)
                    : null,
            });
        }
    }
    const destinations = [...grouped.values()];
    destinations.sort((a, b) => {
        if (currentLocation) {
            const aNearby = (a.distanceKm ?? Infinity) <= 250;
            const bNearby = (b.distanceKm ?? Infinity) <= 250;
            if (aNearby !== bNearby) return aNearby ? -1 : 1;
            if (aNearby) return b.count - a.count || (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
            return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity) || b.count - a.count;
        }
        return b.count - a.count ||
            a.city.localeCompare(b.city);
    });
    return destinations.slice(0, limit);
};
