//  service-worker.js  //
// Version del cache (cambiala cada vez que actualices el sitio)
const CACHE_NAME = "rutasdr-v2";

// Archivos a cachear
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./css/styles.css",
  "./js/app.js",
  "./data/barrios.json",
  "./data/rutas.json",
  "./data/alerts.json",
  "./data/i18n.json",
  "./manifest.json",
];

// Instalacion: cachear los archivos iniciales
self.addEventListener("install", (event) => {
  console.log("[SW] Instalando y cacheando archivos...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting(); // activa el SW inmediatamente
});

// Activacion: eliminar versiones viejas del cache
self.addEventListener("activate", (event) => {
  console.log("[SW] Activando nuevo Service Worker...");
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[SW] Eliminando caché viejo:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim(); // controla las paginas inmediatamente
});

// Fetch: primero intenta desde la red, luego usa cache como respaldo
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Si la respuesta es valida, guarda una copia en cache
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
