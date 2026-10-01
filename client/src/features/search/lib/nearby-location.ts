import type { MapCenter } from "./map-start";

export const requestBrowserPosition = (geolocation: Pick<Geolocation, "getCurrentPosition"> | null): Promise<MapCenter> =>
    new Promise((resolve, reject) => {
        if (!geolocation) {
            reject(new Error("Browser location is unavailable"));
            return;
        }
        geolocation.getCurrentPosition(
            (position) => resolve([position.coords.longitude, position.coords.latitude]),
            reject,
            { timeout: 8000, maximumAge: 600000 }
        );
    });

export const requestIpPosition = async (fetcher: typeof fetch): Promise<MapCenter> => {
    const response = await fetcher("https://ipapi.co/json/");
    if (!response.ok) throw new Error("Approximate location is unavailable");
    const data = await response.json() as { latitude?: number; longitude?: number };
    const longitude = data.longitude;
    const latitude = data.latitude;
    if (typeof longitude !== "number" || !Number.isFinite(longitude) || Math.abs(longitude) > 180 ||
        typeof latitude !== "number" || !Number.isFinite(latitude) || Math.abs(latitude) > 90)
        throw new Error("Approximate location is unavailable");
    return [longitude, latitude];
};
