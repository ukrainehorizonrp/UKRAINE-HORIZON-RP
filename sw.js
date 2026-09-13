const CACHE_VERSION = "v1.1.18";
const CACHE_NAME = "crimearp-cache-" + CACHE_VERSION;

const PRECACHE_URLS = [
  "./",
  "./index.html",
  "./style.css",
  "./adaptive.css",
  "./script.js",
  "./правила/rules-data.js",
  "./додати/staff-data.js",
  "./додати/licenses-data.js",
  "./додати/reviews-data.js",
  "./правила/organs-data.js",
  "./правила/codes-data.js",
  "./програма/manifest.json"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

function isHTMLRequest(request) {
  return request.mode === "navigate" ||
    (request.headers.get("accept") || "").includes("text/html");
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;


  if (isHTMLRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) =>
          cached || new Response("", { status: 503, statusText: "Offline" })
        ))
    );
    return;
  }


  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request)
          .then((response) => {
            cache.put(event.request, response.clone());
            return response;
          })
          .catch(() => cached || new Response("", { status: 503, statusText: "Offline" }));

        return cached || networkFetch;
      })
    )
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") {
    self.skipWaiting();
  }
});