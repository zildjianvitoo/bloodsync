const CACHE_NAME = "bloodsync-ticket-v1";
const STATIC_ASSETS = [
  "/",
  "/ticket",
  "/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  const isTicketView = url.pathname.startsWith("/ticket");
  const isKioskView = url.pathname.startsWith("/kiosk");
  const isStaticAsset =
    ["script", "style", "font", "image"].includes(request.destination);

  if (isTicketView || isKioskView) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (isStaticAsset) {
    event.respondWith(staleWhileRevalidate(request));
  }
});

function networkFirst(request) {
  return fetch(request)
    .then((response) => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      return response;
    })
    .catch(() => caches.match(request));
}

function staleWhileRevalidate(request) {
  return caches.match(request).then((cached) => {
    const networkFetch = fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => cached);

    return cached ?? networkFetch;
  });
}

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
