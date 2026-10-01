export const MAP_VIEW_STORAGE_KEY = "estatehub.searchMapView.v2";

export type MapCenter = [number, number];
export type SavedMapView = { center: MapCenter; zoom: number };

const validCenter = (value: unknown): value is MapCenter =>
    Array.isArray(value) && value.length === 2 &&
    typeof value[0] === "number" && Number.isFinite(value[0]) && Math.abs(value[0]) <= 180 &&
    typeof value[1] === "number" && Number.isFinite(value[1]) && Math.abs(value[1]) <= 90;

export function parseSavedMapView(raw: string | null): SavedMapView | null {
    if (!raw) return null;
    try {
        const value = JSON.parse(raw) as Partial<SavedMapView>;
        if (!validCenter(value.center) || typeof value.zoom !== "number" || !Number.isFinite(value.zoom)) return null;
        return { center: value.center, zoom: Math.max(4, Math.min(12, value.zoom)) };
    } catch {
        return null;
    }
}

export function chooseMapStart({ search, searchListing, saved, ip, firstListing }: {
    search?: MapCenter | null;
    searchListing?: MapCenter | null;
    saved?: SavedMapView | null;
    ip?: MapCenter | null;
    firstListing?: MapCenter | null;
}): SavedMapView & { source: "search" | "saved" | "ip" | "listing" | "default" } {
    if (validCenter(search)) return { center: search, zoom: 10, source: "search" };
    if (validCenter(searchListing)) return { center: searchListing, zoom: 10, source: "search" };
    if (saved && validCenter(saved.center)) return { center: saved.center, zoom: saved.zoom, source: "saved" };
    if (validCenter(ip)) return { center: ip, zoom: 5, source: "ip" };
    if (validCenter(firstListing)) return { center: firstListing, zoom: 5, source: "listing" };
    return { center: [0, 20], zoom: 2, source: "default" };
}
