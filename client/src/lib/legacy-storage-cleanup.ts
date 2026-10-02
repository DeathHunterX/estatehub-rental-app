const LEGACY_KEYS = [
    "accessToken",
    "userInfo",
    "estatehub.searchView",
    "estatehub.searchView.compact",
    "estatehub.searchMapView.v2",
];

export const clearLegacyStorage = (
    storage: Pick<Storage, "removeItem">,
    setCookie: (value: string) => void
) => {
    for (const key of LEGACY_KEYS) {
        try {
            storage.removeItem(key);
        } catch {
            /* Browser storage may be unavailable. */
        }
    }
    setCookie("sidebar_state=; path=/; Max-Age=0; SameSite=Lax");
};
