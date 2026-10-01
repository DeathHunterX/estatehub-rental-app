export type SearchViewMode = "grid" | "list" | "map";

export const SEARCH_VIEW_STORAGE_KEY = "estatehub.searchView";
export const SEARCH_COMPACT_VIEW_STORAGE_KEY = "estatehub.searchView.compact";
export const searchViewStorageKey = (compact: boolean) => compact ? SEARCH_COMPACT_VIEW_STORAGE_KEY : SEARCH_VIEW_STORAGE_KEY;

function isSearchViewMode(value: string | null): value is SearchViewMode {
    return value === "grid" || value === "list" || value === "map";
}

export function resolveSearchViewMode(urlMode: string | null, savedMode: string | null, compact = false): SearchViewMode {
    const preferred = isSearchViewMode(urlMode) ? urlMode : isSearchViewMode(savedMode) ? savedMode : compact ? "list" : "grid";
    return compact && preferred === "grid" ? "list" : preferred;
}

export function searchViewHref(searchParams: URLSearchParams, mode: SearchViewMode): string {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set("view", mode);
    return `/search?${nextParams.toString()}`;
}

export function canonicalLocationSearch(search: string): string | null {
    const raw = search.startsWith("?") ? search.slice(1) : search;
    const location = /(?:^|&)location=([^&]*)/.exec(raw);
    if (!location?.[1].includes(",")) return null;
    return new URLSearchParams(raw).toString();
}
