export type PropertyAddress = {
    address?: string | null;
    subdistrict?: string | null;
    district?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postalCode?: string | null;
    coordinates?: { latitude: number; longitude: number } | null;
};

export const formatPropertyAddress = (location: PropertyAddress): string => {
    const parts = [location.address, location.subdistrict, location.district, location.city, location.state, location.country, location.postalCode]
        .map((part) => part?.trim())
        .filter((part): part is string => Boolean(part));
    return parts.filter((part, index) => index === 0 || part.toLocaleLowerCase() !== parts[index - 1].toLocaleLowerCase()).join(", ");
};

export const propertyMapHref = (location: PropertyAddress): string => {
    const address = formatPropertyAddress(location);
    const coordinates = location.coordinates;
    const query = address || (coordinates && Number.isFinite(coordinates.latitude) && Number.isFinite(coordinates.longitude)
        ? `${coordinates.latitude},${coordinates.longitude}`
        : "");
    return `https://www.google.com/maps/search/?${new URLSearchParams({ api: "1", query }).toString()}`;
};
