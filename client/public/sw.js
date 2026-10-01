/* Only this public document is cached. App pages and API data stay network-only. */
const OFFLINE_CACHE = "estatehub-offline-v1";
const OFFLINE_DOCUMENT = "/offline.html";

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches
            .open(OFFLINE_CACHE)
            .then((cache) => cache.add(OFFLINE_DOCUMENT))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter(
                            (key) =>
                                key.startsWith("estatehub-offline-") &&
                                key !== OFFLINE_CACHE
                        )
                        .map((key) => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const url = new URL(event.request.url);
    if (
        event.request.method !== "GET" ||
        event.request.mode !== "navigate" ||
        url.origin !== self.location.origin ||
        url.pathname === "/api" ||
        url.pathname.startsWith("/api/")
    )
        return;
    event.respondWith(
        fetch(event.request).catch(async () => {
            const cached = await (
                await caches.open(OFFLINE_CACHE)
            ).match(OFFLINE_DOCUMENT);
            return (
                cached ||
                new Response(
                    "EstateHub is temporarily unavailable. Try again in a moment.",
                    {
                        status: 503,
                        headers: {
                            "Content-Type": "text/plain; charset=utf-8",
                        },
                    }
                )
            );
        })
    );
});
