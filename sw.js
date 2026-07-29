/* =============================================================
   Service worker : rendre l'application utilisable sans réseau.

   Deux caches séparés :

   - SHELL : les fichiers de l'application. Mis en cache à
     l'installation, servis en priorité depuis le cache, et
     rafraîchis en arrière-plan quand le réseau répond.

   - TUILES : les images de fond de carte. Mises en cache au fur et
     à mesure de la consultation, et servies depuis le cache en
     priorité. Une tuile déjà vue reste visible sans réseau.

   L'application peut aussi demander un téléchargement groupé des
   tuiles qui couvrent l'itinéraire, via un message PRECACHE.

   Note sur les serveurs de tuiles : ils sont gracieusement mis à
   disposition. Le téléchargement groupé est volontairement limité
   au corridor du voyage, plafonné, et lancé à la demande, une fois.
   ============================================================= */

// A incrementer a chaque livraison : sans ca, le telephone continue de
// servir l'ancienne feuille de style depuis son cache.
const VERSION = 'slo2026-v2';
const SHELL = VERSION + '-shell';
// Le cache des tuiles ne porte pas la version : une mise a jour de
// l'application ne doit pas effacer la carte telechargee hors ligne.
const TUILES = 'slo2026-tuiles';

const A_PRECHARGER = [
  './',
  './index.html',
  './manifest.webmanifest',
  './assets/app.css',
  './assets/data.js',
  './assets/routes.js',
  './assets/router.js',
  './assets/map.js',
  './assets/app.js',
  './assets/icon-180.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-32.png'
];

const HOTES_TUILES = [
  'tile.openstreetmap.org',
  'tile.opentopomap.org',
  'server.arcgisonline.com'
];

const PLAFOND_TUILES = 4000;   // au-delà, on efface les plus anciennes

function estUneTuile(url) {
  return HOTES_TUILES.some(function (h) { return url.hostname.endsWith(h); });
}

self.addEventListener('install', function (ev) {
  ev.waitUntil(
    caches.open(SHELL)
      .then(function (c) { return c.addAll(A_PRECHARGER); })
      .then(function () { return self.skipWaiting(); })
      .catch(function () { /* un fichier manquant ne doit pas bloquer l'installation */ })
  );
});

self.addEventListener('activate', function (ev) {
  ev.waitUntil(
    caches.keys().then(function (noms) {
      return Promise.all(noms.map(function (n) {
        if (n !== SHELL && n !== TUILES) { return caches.delete(n); }
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (ev) {
  const req = ev.request;
  if (req.method !== 'GET') { return; }

  let url;
  try { url = new URL(req.url); } catch (e) { return; }

  /* --- tuiles de carte : le cache d'abord --- */
  if (estUneTuile(url)) {
    ev.respondWith(
      caches.open(TUILES).then(function (cache) {
        return cache.match(req).then(function (hit) {
          if (hit) { return hit; }
          return fetch(req).then(function (rep) {
            if (rep && (rep.ok || rep.type === 'opaque')) {
              cache.put(req, rep.clone());
              elaguer(cache);
            }
            return rep;
          }).catch(function () {
            // pas de réseau et pas en cache : le fond uni prend le relais
            return new Response('', { status: 504, statusText: 'hors ligne' });
          });
        });
      })
    );
    return;
  }

  /* --- le calcul d'itinéraire n'est jamais mis en cache ici :
         Router garde déjà les tracés dans le stockage local --- */
  if (url.hostname.indexOf('project-osrm.org') >= 0) { return; }

  /* --- fichiers de l'application : cache d'abord, mise à jour en fond --- */
  if (url.origin === self.location.origin) {
    ev.respondWith(
      caches.open(SHELL).then(function (cache) {
        return cache.match(req, { ignoreSearch: true }).then(function (hit) {
          const reseau = fetch(req).then(function (rep) {
            if (rep && rep.ok) { cache.put(req, rep.clone()); }
            return rep;
          }).catch(function () { return hit; });
          return hit || reseau;
        });
      })
    );
  }
});

/* --- élagage simple : on retiré les plus anciennes entrées --- */
let elagageEnCours = false;
function elaguer(cache) {
  if (elagageEnCours) { return; }
  elagageEnCours = true;
  cache.keys().then(function (cles) {
    if (cles.length <= PLAFOND_TUILES) { elagageEnCours = false; return; }
    const trop = cles.length - PLAFOND_TUILES;
    Promise.all(cles.slice(0, trop).map(function (k) { return cache.delete(k); }))
      .then(function () { elagageEnCours = false; });
  }).catch(function () { elagageEnCours = false; });
}

/* --- messages venus de l'application --- */
self.addEventListener('message', function (ev) {
  const msg = ev.data || {};

  if (msg.type === 'PRECACHE') {
    ev.waitUntil(precharger(msg.urls || [], ev.source));
  }

  if (msg.type === 'ETAT_CACHE') {
    ev.waitUntil(
      caches.open(TUILES).then(function (c) { return c.keys(); })
        .then(function (k) { repondre(ev.source, { type: 'ETAT_CACHE', tuiles: k.length }); })
        .catch(function () { repondre(ev.source, { type: 'ETAT_CACHE', tuiles: 0 }); })
    );
  }

  if (msg.type === 'VIDER') {
    ev.waitUntil(
      caches.delete(TUILES)
        .then(function () { repondre(ev.source, { type: 'ETAT_CACHE', tuiles: 0 }); })
    );
  }
});

function repondre(client, data) {
  if (client && client.postMessage) { client.postMessage(data); }
}

function precharger(urls, client) {
  return caches.open(TUILES).then(function (cache) {
    let fait = 0, index = 0, echecs = 0;
    const total = urls.length;
    const FRONTS = 4;   // peu de requêtes en parallèle, pour rester poli

    function suivant() {
      if (index >= urls.length) { return Promise.resolve(); }
      const u = urls[index++];
      return cache.match(u).then(function (hit) {
        if (hit) { return null; }
        return fetch(u, { mode: 'no-cors' }).then(function (rep) {
          if (rep) { return cache.put(u, rep); }
        }).catch(function () { echecs++; });
      }).then(function () {
        fait++;
        if (fait % 10 === 0 || fait === total) {
          repondre(client, { type: 'PRECACHE_AVANCEE', fait: fait, total: total });
        }
        return suivant();
      });
    }

    const fronts = [];
    for (let i = 0; i < FRONTS; i++) { fronts.push(suivant()); }
    return Promise.all(fronts).then(function () {
      return cache.keys().then(function (k) {
        repondre(client, { type: 'PRECACHE_FINI', fait: fait, total: total, echecs: echecs, tuiles: k.length });
      });
    });
  });
}
