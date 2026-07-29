/* =============================================================
   Tracés routiers réels.

   Le tracé entre deux étapes suit les vraies routes, pas une ligne
   droite. La géométrie vient d'OSRM, le moteur de calcul d'itinéraire
   d'OpenStreetMap, interrogé par le navigateur.

   Comment ça marché :
   1. assets/routes.js peut contenir des tracés déjà figés. S'ils y
      sont, rien n'est demande au reseau, l'application est autonome.
   2. Sinon, chaque tronçon est demande une fois, simplifié, puis
      garde dans le stockage local du téléphone. Les fois suivantes,
      c'est instantané et ça marché sans reseau.
   3. Si le reseau ne répond pas, on retombe sur la ligne repérée par
      les points de passage saisis à la main : moins fidèle, mais
      lisible, et signalée en pointille dans l'application.

   Pour figer les tracés dans le dépôt : onglet Carte, bouton
   "Exporter les tracés", puis remplacer assets/routes.js par le
   fichier téléchargé.
   ============================================================= */

(function (global) {
  'use strict';

  var CACHE_KEY = 'slo2026.routes.v1';
  var ENDPOINT = 'https://router.project-osrm.org/route/v1/driving/';
  var PAUSE = 250;      // ms entre deux appels, pour rester poli
  var EPS = 0.00005;    // simplification, environ 5 m

  var mem = {};
  var pending = false;

  // 1. tracés figés livres avec le dépôt
  if (global.ROUTES) {
    Object.keys(global.ROUTES).forEach(function (k) { mem[k] = global.ROUTES[k]; });
  }
  // 2. tracés déjà recuperes sur cet appareil
  try {
    var stored = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}');
    Object.keys(stored).forEach(function (k) { if (!mem[k]) { mem[k] = stored[k]; } });
  } catch (e) { /* mode privé, navigation restreinte : tant pis */ }

  function key(a, b) {
    return a.lat.toFixed(4) + ',' + a.lon.toFixed(4) + '>' + b.lat.toFixed(4) + ',' + b.lon.toFixed(4);
  }

  function persist() {
    try {
      var out = {};
      Object.keys(mem).forEach(function (k) {
        if (!global.ROUTES || !global.ROUTES[k]) { out[k] = mem[k]; }
      });
      localStorage.setItem(CACHE_KEY, JSON.stringify(out));
    } catch (e) { /* quota plein : le tracé reste en mémoire pour la session */ }
  }

  /* --- Ramer-Douglas-Peucker, pour ne pas stocker 2000 points par tronçon --- */
  function segDist(p, a, b) {
    var x = a[0], y = a[1], dx = b[0] - x, dy = b[1] - y;
    if (dx || dy) {
      var t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) { x = b[0]; y = b[1]; }
      else if (t > 0) { x += dx * t; y += dy * t; }
    }
    dx = p[0] - x; dy = p[1] - y;
    return dx * dx + dy * dy;
  }

  function simplify(pts, eps) {
    if (pts.length < 3) { return pts.slice(); }
    var sq = eps * eps;
    var keep = new Array(pts.length);
    keep[0] = keep[pts.length - 1] = true;
    var stack = [[0, pts.length - 1]];
    while (stack.length) {
      var seg = stack.pop(), first = seg[0], last = seg[1];
      var maxD = 0, idx = -1;
      for (var i = first + 1; i < last; i++) {
        var d = segDist(pts[i], pts[first], pts[last]);
        if (d > maxD) { maxD = d; idx = i; }
      }
      if (maxD > sq && idx > 0) {
        keep[idx] = true;
        stack.push([first, idx], [idx, last]);
      }
    }
    return pts.filter(function (p, i) { return keep[i]; });
  }

  function fetchLeg(a, b) {
    var url = ENDPOINT + a.lon + ',' + a.lat + ';' + b.lon + ',' + b.lat +
      '?overview=full&geometries=geojson&alternatives=false&steps=false';
    return fetch(url, { mode: 'cors' })
      .then(function (r) {
        if (!r.ok) { throw new Error('http ' + r.status); }
        return r.json();
      })
      .then(function (d) {
        if (d.code !== 'Ok' || !d.routes || !d.routes.length) { throw new Error('pas de route'); }
        var coords = d.routes[0].geometry.coordinates;   // [lon, lat]
        var pts = coords.map(function (c) { return [c[1], c[0]]; });
        pts = simplify(pts, EPS).map(function (p) {
          return [Math.round(p[0] * 1e5) / 1e5, Math.round(p[1] * 1e5) / 1e5];
        });
        if (pts.length < 2) { throw new Error('tracé vide'); }
        mem[key(a, b)] = pts;
        return pts;
      });
  }

  var Router = {
    /** Tracé réel entre deux étapes, ou null s'il n'est pas encore connu. */
    get: function (a, b) { return mem[key(a, b)] || null; },

    has: function (a, b) { return !!mem[key(a, b)]; },

    /** Nombre de tronçons encore à récupérer dans la liste donnée. */
    missing: function (pairs) {
      return pairs.filter(function (p) { return !mem[key(p[0], p[1])]; }).length;
    },

    /**
     * Récupéré les tronçons manquants, un par un.
     * onStep(fait, total) est appelé après chaque tronçon obtenu,
     * pour redessiner la carte au fur et à mesure.
     */
    ensure: function (pairs, onStep) {
      if (pending || !global.fetch) { return; }
      var todo = pairs.filter(function (p) { return !mem[key(p[0], p[1])]; });
      if (!todo.length) { return; }

      pending = true;
      var total = todo.length, done = 0;

      function next() {
        if (!todo.length) {
          pending = false;
          persist();
          if (onStep) { onStep(done, total, true); }
          return;
        }
        var p = todo.shift();
        fetchLeg(p[0], p[1])
          .then(function () { done++; if (onStep) { onStep(done, total, false); } })
          .catch(function () { /* on garde la ligne de repli pour ce tronçon */ })
          .then(function () { setTimeout(next, PAUSE); });
      }
      next();
    },

    /** Contenu de assets/routes.js, pour figer les tracés dans le dépôt. */
    exportFile: function () {
      var keys = Object.keys(mem).sort();
      var lines = keys.map(function (k) {
        return '  ' + JSON.stringify(k) + ': ' + JSON.stringify(mem[k]) + ',';
      });
      return '/* =============================================================\n' +
        '   Tracés routiers figés, generes depuis l\'application.\n' +
        '   ' + keys.length + ' tronçons. Géométrie OSRM, données OpenStreetMap (ODbL).\n' +
        '\n' +
        '   Tant que ce fichier est rempli, l\'application n\'a plus besoin\n' +
        '   du reseau pour dessiner les itinéraires.\n' +
        '\n' +
        '   Pour le regenerer : onglet Carte, bouton Exporter les tracés.\n' +
        '   ============================================================= */\n\n' +
        'window.ROUTES = {\n' + lines.join('\n') + '\n};\n';
    },

    count: function () { return Object.keys(mem).length; }
  };

  global.Router = Router;
})(window);
