const CACHE_NAME = "jeju-map-prototype-v9";
const APP_SHELL_ASSETS = [
  "./",
  "./map-image.html",
  "./map-image-test.html",
  "./styles.css",
  "./scripts/map-image.js",
  "./scripts/services/jeju-solar.js",
  "./manifest.webmanifest"
];

function isSuccessfulCacheableResponse(response) {
  return Boolean(response) && response.status === 200 && response.type === "basic";
}

function normalizePath(pathname) {
  if (!pathname || pathname === "/") {
    return "./";
  }

  return pathname.startsWith("/") ? `.${pathname}` : pathname;
}

function isAppShellRequest(request) {
  const url = new URL(request.url);
  const normalizedPath = normalizePath(url.pathname);

  return request.mode === "navigate" || APP_SHELL_ASSETS.includes(normalizedPath);
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (isSuccessfulCacheableResponse(response)) {
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, response.clone());
  }

  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (isSuccessfulCacheableResponse(response)) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) {
      return cached;
    }

    return Response.error();
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  if (isAppShellRequest(event.request)) {
    event.respondWith(networkFirst(event.request));
    return;
  }

  event.respondWith(cacheFirst(event.request));
});
