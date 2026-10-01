import type { GeocodingAddress, Coordinates } from "../types/global";
import axios from "axios";
import { completeLocationAddress } from "../utils/location-search";
import { createHash } from "crypto";
import { RequestError } from "../errors/http-error";

const coordinatesByAddress = new Map<string, Coordinates>();
const pendingByAddress = new Map<string, Promise<Coordinates | null>>();
let requestLane: Promise<void> = Promise.resolve();
let nextRequestAt = 0;

const pacedLookup = (url: string, query: string, userAgent: string) => {
    // Advance the lane even after a failed request, preserving the one-request-per-second cap.
    const turn = requestLane.then(async () => {
        const delay = Math.max(0, nextRequestAt - Date.now());
        if (delay) await new Promise<void>((resolve) => setTimeout(resolve, delay));
        nextRequestAt = Date.now() + 1000;
        return axios.get(url, {
            params: { q: query, format: "json", limit: "1" },
            headers: { "User-Agent": userAgent },
            timeout: 8000,
        });
    });
    requestLane = turn.then(() => undefined, () => undefined);
    return turn;
};

export const geocodePropertyAddress = async (
    location: GeocodingAddress
): Promise<Coordinates | null> => {
    const url = process.env.NOMINATIM_SEARCH_URL;
    const userAgent = process.env.NOMINATIM_USER_AGENT;
    if (!url || !userAgent || !/\S+@\S+/.test(userAgent) || /@[\w.-]+\.example\b/i.test(userAgent))
        throw new RequestError(503, "Address lookup is unavailable. Please try again later.");
    const queries = [
        completeLocationAddress(location),
        completeLocationAddress({ ...location, postalCode: "" }),
    ];
    const cacheKey = createHash("sha256").update(`${url}:${queries[0]}`).digest("hex");
    const cached = coordinatesByAddress.get(cacheKey);
    if (cached) return cached;
    const pending = pendingByAddress.get(cacheKey);
    if (pending) return pending;
    // Concurrent edits of the same address share one lookup; only successful results are cached.
    const lookup = (async () => {
        try {
            for (const query of new Set(queries)) {
                const response = await pacedLookup(url, query, userAgent);
                if (!response.data[0]?.lat || !response.data[0]?.lon) continue;
                const latitude = Number(response.data[0].lat);
                const longitude = Number(response.data[0].lon);
                if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
                    const coordinates = { latitude, longitude };
                    if (coordinatesByAddress.size >= 500) coordinatesByAddress.delete(coordinatesByAddress.keys().next().value!);
                    coordinatesByAddress.set(cacheKey, coordinates);
                    return coordinates;
                }
            }
            return null;
        } catch {
            throw new RequestError(503, "Address lookup failed. Please try again shortly.");
        } finally {
            pendingByAddress.delete(cacheKey);
        }
    })();
    pendingByAddress.set(cacheKey, lookup);
    return lookup;
};
