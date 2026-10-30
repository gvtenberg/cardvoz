/* CardVoz — service worker gerado por scripts/gerar-sw.mjs. Não edite out/sw.js. */
const CACHE = "cardvoz-__VERSAO__";
const ARQUIVOS = __ARQUIVOS__;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // Um arquivo que falhar não impede guardar os outros
      .then((cache) => Promise.all(ARQUIVOS.map((url) => cache.add(url).catch(() => undefined))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith("cardvoz-") && k !== CACHE).map((k) => caches.delete(k)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  // Só o próprio site: a API é outro endereço e nunca entra no cache
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Arquivos com hash no nome nunca mudam: cache primeiro
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          })
      )
    );
    return;
  }

  // Páginas: rede primeiro (versão mais nova); sem internet, a guardada.
  // ignoreSearch: /baralho/?id=... usa a mesma página /baralho/
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match(request, { ignoreSearch: true })
          .then((cached) => cached || caches.match("/baralhos/"))
      )
    );
    return;
  }

  // Demais arquivos do site (dados das páginas, ícones, manifest): cache, depois rede
  event.respondWith(
    caches.match(request, { ignoreSearch: true }).then((cached) => cached || fetch(request))
  );
});
