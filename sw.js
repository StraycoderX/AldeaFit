/**
 * AldeaFit service worker.
 *
 * Offline-first for a gym basement with no signal. Deliberately simple and
 * conservative:
 *
 *  - Only same-origin requests are handled. Anything cross-origin is passed
 *    straight to the network and never cached, so an opaque third-party response
 *    can never be served back as if it were ours.
 *  - Only GET is cached. A non-GET request is never intercepted.
 *  - The cache name is versioned; activating a new worker deletes every older
 *    cache, so a stale build cannot linger.
 *  - Navigations use network-first with a cache fallback, so a deployed update
 *    is picked up as soon as there is a connection.
 *  - Static assets use cache-first, since Vite fingerprints their filenames.
 *
 * The build stamps CACHE_VERSION at deploy time; the literal below is the
 * development default.
 */

const CACHE_VERSION = 'aldeafit-105a799a';
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './fonts/inter-latin.woff2',
  './fonts/anton-latin.woff2',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      // `addAll` rejects the whole batch if any single request fails, which
      // would leave the worker uninstalled. Cache each entry independently.
      .then((cache) =>
        Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(new Request(url, { cache: 'reload' })))),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Never touch anything that isn't a plain same-origin GET.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigations: network first so updates land, cache as the offline fallback.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put('./index.html', copy));
          return response;
        })
        .catch(() =>
          caches
            .match('./index.html')
            .then((cached) => cached ?? new Response('Offline', { status: 503 })),
        ),
    );
    return;
  }

  // Static assets: cache first, filling the cache on a miss.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;

      return fetch(request).then((response) => {
        // Only store genuinely successful, non-opaque same-origin responses.
        if (response.ok && response.type === 'basic') {
          const copy = response.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    }),
  );
});
