/* Emigrant Croatia Desk — minimal offline shell (no auth/API cache). */
const CACHE_VERSION = "emigrant-shell-v7";
const PRECACHE_URLS = [
  "/offline.html",
  "/manifest.json",
  "/logo.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-192-maskable.png",
  "/icons/icon-512-maskable.png",
];

function isSupabaseOrAuthRequest(url) {
  const host = url.hostname.toLowerCase();
  if (host.includes("supabase.co") || host.includes("supabase.in")) {
    return true;
  }
  if (url.pathname.includes("/auth/v1")) {
    return true;
  }
  return false;
}

function isStaticAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/splash/") ||
    pathname === "/logo.png" ||
    pathname === "/manifest.json" ||
    pathname.endsWith(".css")
  );
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
  }
  return response;
}

async function networkFirstNavigation(request) {
  try {
    return await fetch(request);
  } catch {
    const cache = await caches.open(CACHE_VERSION);
    const offline = await cache.match("/offline.html");
    if (offline) {
      return offline;
    }
    return Response.error();
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_VERSION)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    if (isSupabaseOrAuthRequest(url)) {
      return;
    }
    return;
  }

  if (isStaticAsset(url.pathname) || url.pathname === "/offline.html") {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    return;
  }
});
