/* =============================================================
   Slovénie 2026 - logique de l'application
   ============================================================= */

(function (global) {
  'use strict';

  /* ---------- utilitaires ---------- */

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function eur(n) {
    var v = Math.round(n * 10) / 10;
    return (Math.abs(v - Math.round(v)) < 0.05 ? Math.round(v) : v.toFixed(1).replace('.', ',')) + ' €';
  }

  function hm(mins) {
    mins = Math.max(0, Math.round(mins));
    var h = Math.floor(mins / 60), m = mins % 60;
    if (!h) { return m + ' min'; }
    return h + 'h' + (m ? String(m).padStart(2, '0') : '');
  }

  function clock(mins) {
    mins = ((Math.round(mins) % 1440) + 1440) % 1440;
    return String(Math.floor(mins / 60)).padStart(2, '0') + 'h' + String(mins % 60).padStart(2, '0');
  }

  function parseClock(s) {
    var p = String(s).split(':');
    return parseInt(p[0], 10) * 60 + parseInt(p[1] || '0', 10);
  }

  /* ---------- stockage ---------- */

  var KEY = 'slo2026.dash';
  var db = {};
  try { db = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { db = {}; }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {} }

  /* ---------- couleur de la barre système iOS ---------- */

  function paintThemeColor() {
    var c = getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim();
    var m = document.querySelector('meta[name="theme-color"]');
    if (!m) { m = document.createElement('meta'); m.name = 'theme-color'; document.head.appendChild(m); }
    m.setAttribute('content', c || '#EAF1EC');
  }
  paintThemeColor();
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    if (mq.addEventListener) { mq.addEventListener('change', function () { paintThemeColor(); redrawMaps(); }); }
  }
  new MutationObserver(function () { paintThemeColor(); redrawMaps(); })
    .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  /* ---------- liens externes ---------- */

  function gmaps(stop) {
    return 'https://www.google.com/maps/search/?api=1&query=' +
      encodeURIComponent(stop.name + ', Slovénie');
  }
  function waze(stop) {
    return 'https://www.waze.com/ul?ll=' + stop.lat + '%2C' + stop.lon + '&navigate=yes&zoom=15';
  }
  function tripadvisor(stop) {
    return 'https://www.tripadvisor.fr/Search?q=' + encodeURIComponent(stop.name + ' Slovénie');
  }
  function itineraire(a, b) {
    return 'https://www.google.com/maps/dir/?api=1&origin=' + a.lat + ',' + a.lon +
      '&destination=' + b.lat + ',' + b.lon + '&travelmode=driving';
  }

  var IC = {
    map: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    nav: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11 21 3l-8 18-2-7z"/></svg>',
    star: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z"/></svg>',
    web: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z"/></svg>',
    car: '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 16.5h14M6.5 16.5v2M17.5 16.5v2"/><path d="M4.5 16.5 6 11h12l1.5 5.5z"/><circle cx="8" cy="13.8" r=".6"/><circle cx="16" cy="13.8" r=".6"/></svg>'
  };

  function linkRow(stop) {
    var out = '<div class="links">';
    out += '<a href="' + gmaps(stop) + '" target="_blank" rel="noopener">' + IC.map + 'Fiche Maps</a>';
    out += '<a href="' + waze(stop) + '" target="_blank" rel="noopener">' + IC.nav + 'Waze</a>';
    out += '<a href="' + tripadvisor(stop) + '" target="_blank" rel="noopener">' + IC.star + 'Avis</a>';
    if (stop.site) {
      out += '<a href="' + esc(stop.site) + '" target="_blank" rel="noopener">' + IC.web + 'Site officiel</a>';
    }
    out += '</div>';
    return out;
  }

  /* ---------- état du voyage ---------- */

  var START = new Date(2026, 8, 7);
  var todayIdx = -1;
  (function () {
    var n = new Date();
    var t = new Date(n.getFullYear(), n.getMonth(), n.getDate());
    var off = Math.round((t - START) / 86400000);
    var el = $('#now');
    if (off < 0) { el.textContent = 'J-' + Math.abs(off); }
    else if (off > 6) { el.textContent = 'terminé'; }
    else { todayIdx = off; el.textContent = 'Jour ' + (off + 1) + ' . ' + TRIP.days[off].wd.split(' ')[0]; }
  })();

  /* ---------- calcul d'une journée ---------- */

  function variantOf(day) {
    if (!day.choice) { return null; }
    return db['var' + day.n] || day.choice.options[0].key;
  }
  function isOptOff(day, name) { return !!db['off' + day.n + '|' + name]; }
  function startOf(day) { return db['start' + day.n] != null ? db['start' + day.n] : parseClock(day.start); }

  function build(day) {
    var v = variantOf(day);
    var seq = day.stops.filter(function (s) { return !s.variant || s.variant === v; });

    // Une étape retirée ne casse pas la chaîne : ses deux tronçons sont
    // fusionnés, et le trajet résultant est signalé comme approximatif.
    var items = [], pend = null;
    seq.forEach(function (s, idx) {
      var skipped = !!(s.optional && isOptOff(day, s.name));
      if (!skipped) {
        items.push({ s: s, inLeg: pend });
        pend = null;
      } else if (pend) {
        pend.via = pend.via.concat([[s.lat, s.lon]]);
        pend.merged = true;
      }
      if (s.leg && idx < seq.length - 1) {
        if (!pend) { pend = { km: 0, min: 0, via: [], merged: false }; }
        pend.km += s.leg.km;
        pend.min += s.leg.min;
        pend.via = pend.via.concat(s.leg.via || []);
      }
    });

    var t = startOf(day);
    var rows = [], km = 0, drive = 0, onsite = 0, cost = 0;

    items.forEach(function (it, i) {
      var s = it.s;
      var row = { s: s, arrive: t, depart: t + s.stay };
      onsite += s.stay;
      cost += (s.cost || 0);
      t = row.depart;
      var nxt = items[i + 1];
      if (nxt && nxt.inLeg) {
        row.leg = {
          km: nxt.inLeg.km, min: nxt.inLeg.min, via: nxt.inLeg.via,
          merged: nxt.inLeg.merged, to: nxt.s
        };
        km += nxt.inLeg.km; drive += nxt.inLeg.min; t += nxt.inLeg.min;
      }
      rows.push(row);
    });

    return {
      rows: rows, stops: items.map(function (x) { return x.s; }),
      km: km, drive: drive, onsite: onsite, cost: cost, end: t, variant: v
    };
  }

  // Un objet tracé par tronçon : la vraie géométrie routière si elle est
  // connue, sinon la ligne repérée par les points de passage, signalée
  // en pointille pour que la difference se voie.
  function routesOf(day, dim) {
    var out = [];
    build(day).rows.forEach(function (r) {
      if (!r.leg) { return; }
      var reel = global.Router ? Router.get(r.s, r.leg.to) : null;
      if (reel) {
        out.push({ points: reel, color: day.color, dim: dim, rough: false });
      } else {
        var pts = [[r.s.lat, r.s.lon]]
          .concat(r.leg.via || [])
          .concat([[r.leg.to.lat, r.leg.to.lon]]);
        out.push({ points: pts, color: day.color, dim: dim, rough: true });
      }
    });
    return out;
  }

  function legPairs(day) {
    var out = [];
    build(day).rows.forEach(function (r) { if (r.leg) { out.push([r.s, r.leg.to]); } });
    return out;
  }

  /* ---------- cartes ---------- */

  var dayMap = null, allMap = null, curDay = 0, activeStop = -1;

  function redrawMaps() {
    if (dayMap) { dayMap.draw(); }
    if (allMap) { allMap.draw(); }
  }

  function paintDayMap(garderCadre) {
    if (!dayMap) { return; }
    var day = TRIP.days[curDay];
    var b = build(day);
    dayMap.setRoutes(routesOf(day, false));
    dayMap.setMarks(b.stops.map(function (s, i) {
      return {
        lat: s.lat, lon: s.lon, label: String(i + 1), name: s.name,
        color: day.color, active: i === activeStop, idx: i
      };
    }));
    if (!garderCadre) { dayMap.fit(); }
    majEtatTrace();
  }

  function paintAllMap(garderCadre) {
    if (!allMap) { return; }
    var routes = [], marks = [];
    TRIP.days.forEach(function (day, i) {
      routes = routes.concat(routesOf(day, false));
      var b = build(day);
      var mid = b.stops[Math.min(1, b.stops.length - 1)];
      marks.push({
        lat: mid.lat, lon: mid.lon, label: String(day.n), name: 'Jour ' + day.n + ' : ' + day.title,
        color: day.color, day: i
      });
    });
    allMap.setRoutes(routes);
    allMap.setMarks(marks);
    if (!garderCadre) { allMap.fit(34); }
    majEtatTrace();
  }

  /* ---------- récupération des tracés routiers ---------- */

  function toutesLesPaires() {
    var out = [];
    TRIP.days.forEach(function (d) { out = out.concat(legPairs(d)); });
    return out;
  }

  function majEtatTrace(msg) {
    var el = document.getElementById('maproute');
    if (!el) { return; }
    if (msg) { el.textContent = msg; return; }
    if (!global.Router) { el.textContent = ''; return; }
    var reste = Router.missing(legPairs(TRIP.days[curDay]));
    el.textContent = reste
      ? reste + ' tronçon' + (reste > 1 ? 's' : '') + ' approximatif' + (reste > 1 ? 's' : '')
      : 'Itinéraire routier réel';
  }

  function chercherTraces(pairs, repeindre) {
    if (!global.Router) { return; }
    var reste = Router.missing(pairs);
    if (!reste) { majEtatTrace(); return; }
    majEtatTrace('Calcul des itinéraires, 0/' + reste);
    Router.ensure(pairs, function (fait, total, fini) {
      if (fini) { repeindre(true); majEtatTrace(); }
      else {
        majEtatTrace('Calcul des itinéraires, ' + fait + '/' + total);
        repeindre(true);
      }
    });
  }

  /* ---------- rendu du selecteur de jour ---------- */

  function renderRail() {
    var rail = $('#dayrail');
    rail.innerHTML = TRIP.days.map(function (d, i) {
      return '<button type="button" class="daybtn' + (i === todayIdx ? ' is-today' : '') +
        '" style="--dc:' + d.color + '" data-d="' + i + '" aria-pressed="' + (i === curDay) + '">' +
        '<b>J' + d.n + '</b><span>' + esc(d.wd.split(' ').slice(0, 2).join(' ')) + '</span></button>';
    }).join('');
    rail.addEventListener('click', function (ev) {
      var b = ev.target.closest('.daybtn');
      if (!b) { return; }
      selectDay(parseInt(b.dataset.d, 10));
    });
  }

  function syncRail() {
    $$('#dayrail .daybtn').forEach(function (b) {
      var on = parseInt(b.dataset.d, 10) === curDay;
      b.setAttribute('aria-pressed', String(on));
      if (on) { b.scrollIntoView({ block: 'nearest', inline: 'center' }); }
    });
  }

  /* ---------- rendu d'une journée ---------- */

  function renderDay() {
    var day = TRIP.days[curDay];
    var b = build(day);
    var host = $('#daybody');
    var out = '';

    out += '<div class="dayhead">';
    out += '<p class="kicker"><span class="blaze"></span> Jour ' + day.n + ' . ' + esc(day.wd) +
      (curDay === todayIdx ? " . aujourd'hui" : '') + '</p>';
    out += '<h2>' + esc(day.title) + '</h2>';
    out += '<p class="brief">' + esc(day.brief) + '</p>';

    out += '<div class="daystats">' +
      '<div><b>' + b.km + '</b><span>km</span></div>' +
      '<div><b>' + hm(b.drive) + '</b><span>conduite</span></div>' +
      '<div><b>' + hm(b.onsite) + '</b><span>sur place</span></div>' +
      '<div><b>' + eur(b.cost) + '</b><span>dépense</span></div>' +
      '</div>';

    out += '<div class="startrow"><span class="lab">Départ de la journée<br><small style="color:var(--ink-faint)">Fin estimée ' +
      clock(b.end) + ' . base ' + esc(day.base) + '</small></span>' +
      '<span class="stepper">' +
      '<button type="button" data-start="-15" aria-label="Partir 15 minutes plus tôt">-</button>' +
      '<output>' + clock(startOf(day)) + '</output>' +
      '<button type="button" data-start="15" aria-label="Partir 15 minutes plus tard">+</button>' +
      '</span></div>';

    if (day.warn) { out += '<div class="warnbar">' + esc(day.warn) + '</div>'; }

    if (day.choice) {
      out += '<div class="choice"><span class="lab">' + esc(day.choice.label) + '</span><div class="opts">';
      day.choice.options.forEach(function (o) {
        out += '<button type="button" class="optbtn" data-var="' + o.key + '" aria-pressed="' +
          (b.variant === o.key ? 'true' : 'false') + '"><b>' + esc(o.title) + '</b><span>' + esc(o.detail) + '</span></button>';
      });
      out += '</div></div>';
    }
    out += '</div>';

    /* --- timeline --- */
    out += '<div class="timeline">';
    b.rows.forEach(function (r, i) {
      var s = r.s;
      out += '<div class="stop' + (s.optional ? ' is-opt' : '') + '" data-i="' + i + '">';
      out += '<div class="gutter"><span class="pin" style="background:' + day.color + '">' + (i + 1) + '</span><span class="thread"></span></div>';
      out += '<div class="stopcard' + (i === activeStop ? ' is-active' : '') + '">';

      out += '<div class="stoptop"><span class="stoptime">' + clock(r.arrive) +
        (s.stay ? ' - ' + clock(r.depart) : '') + '</span>';
      if (s.stay) { out += '<span class="stopdur">' + hm(s.stay) + ' sur place</span>'; }
      out += '</div>';

      out += '<div class="stopname">' + esc(s.name) + '</div>';
      if (s.sub) { out += '<div class="stopsub">' + esc(s.sub) + '</div>'; }

      out += '<div class="badges"><span class="badge kind">' + esc(s.kind) + '</span>';
      if (s.free) { out += '<span class="badge">gratuit</span>'; }
      else if (s.cost) { out += '<span class="badge pay">' + eur(s.cost) + '</span>'; }
      if (s.booking) { out += '<span class="badge book">à réserver</span>'; }
      if (s.optional) { out += '<span class="badge">optionnel</span>'; }
      out += '</div>';

      if (s.tip) { out += '<p class="stoptip">' + esc(s.tip) + '</p>'; }

      out += linkRow(s);

      if (s.optional) {
        out += '<div class="links"><button type="button" data-skip="' + esc(s.name) + '">Retirer de la journée</button></div>';
      }
      out += '</div></div>';

      if (r.leg) {
        out += '<div class="leg"><div class="legline"><i></i></div><div class="legbody">' +
          IC.car + (r.leg.merged ? 'environ ' : '') + '<b>' + r.leg.km + ' km</b> . <b>' + hm(r.leg.min) +
          '</b> vers ' + esc(r.leg.to.name) +
          '<a href="' + itineraire(s, r.leg.to) + '" target="_blank" rel="noopener">' + IC.nav + 'Itinéraire</a>' +
          '</div></div>';
      }
    });

    /* étapes optionnelles retirées */
    var removed = day.stops.filter(function (s) {
      return s.optional && isOptOff(day, s.name) && (!s.variant || s.variant === b.variant);
    });
    if (removed.length) {
      out += '<h3>Retiré de cette journée</h3><div class="links">';
      removed.forEach(function (s) {
        out += '<button type="button" data-add="' + esc(s.name) + '">Remettre ' + esc(s.name) + '</button>';
      });
      out += '</div>';
    }
    out += '</div>';

    host.innerHTML = out;
    paintDayMap();
  }

  function onDayClick(ev) {
    var day = TRIP.days[curDay];
    var t;

    if ((t = ev.target.closest('[data-start]'))) {
      var d = parseInt(t.dataset.start, 10);
      db['start' + day.n] = Math.max(4 * 60, Math.min(14 * 60, startOf(day) + d));
      save(); renderDay(); return;
    }
    if ((t = ev.target.closest('[data-var]'))) {
      db['var' + day.n] = t.dataset.var; save(); activeStop = -1; renderDay(); return;
    }
    if ((t = ev.target.closest('[data-skip]'))) {
      db['off' + day.n + '|' + t.dataset.skip] = true; save(); activeStop = -1; renderDay(); return;
    }
    if ((t = ev.target.closest('[data-add]'))) {
      delete db['off' + day.n + '|' + t.dataset.add]; save(); activeStop = -1; renderDay(); return;
    }
    if ((t = ev.target.closest('.stop'))) {
      if (ev.target.closest('à, button')) { return; }
      var i = parseInt(t.dataset.i, 10);
      activeStop = (activeStop === i) ? -1 : i;
      $$('#daybody .stopcard').forEach(function (c, k) { c.classList.toggle('is-active', k === activeStop); });
      if (dayMap && activeStop >= 0) {
        var b = build(day), s = b.stops[activeStop];
        dayMap.setCenter(s.lat, s.lon, Math.max(dayMap.z, 12));
        paintDayMap();
        $('#daymap').scrollIntoView({ block: 'nearest' });
      } else { paintDayMap(); }
    }
  }

  function selectDay(i) {
    curDay = Math.max(0, Math.min(TRIP.days.length - 1, i));
    activeStop = -1;
    db.day = curDay; save();
    syncRail();
    renderDay();
    chercherTraces(legPairs(TRIP.days[curDay]), function () { paintDayMap(true); });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  /* ---------- onglet carte globale ---------- */

  function renderAll() {
    var host = $('#allbody');
    var totalKm = 0, totalDrive = 0, totalCost = 0;
    TRIP.days.forEach(function (d) { var b = build(d); totalKm += b.km; totalDrive += b.drive; totalCost += visitesOf(d); });

    var out = '<div class="block wrap"><h2><span class="blaze"></span> Le circuit complet</h2>' +
      '<p class="sub">Une boucle au départ de Ljubljana. Touchez un numéro sur la carte pour ouvrir la journée.</p>' +
      '<div class="daystats">' +
      '<div><b>' + totalKm + '</b><span>km</span></div>' +
      '<div><b>' + hm(totalDrive) + '</b><span>conduite</span></div>' +
      '<div><b>7</b><span>jours</span></div>' +
      '<div><b>' + eur(totalCost) + '</b><span>visites</span></div>' +
      '</div>';

    out += '<h3>Les sept étapes</h3><div class="tablewrap"><table><thead><tr>' +
      '<th>Jour</th><th>Étape</th><th class="num">km</th><th class="num">Route</th></tr></thead><tbody>';
    TRIP.days.forEach(function (d, i) {
      var b = build(d);
      out += '<tr data-open="' + i + '" style="cursor:pointer">' +
        '<td><span style="display:inline-block;width:.6rem;height:.6rem;border-radius:2px;background:' + d.color + ';margin-right:.4rem"></span>J' + d.n + '</td>' +
        '<td>' + esc(d.title) + '<br><span class="fine">' + esc(d.base) + '</span></td>' +
        '<td class="num">' + b.km + '</td><td class="num">' + hm(b.drive) + '</td></tr>';
    });
    out += '</tbody></table></div>';

    out += '<h3>Distances utiles</h3><div class="tablewrap"><table><tbody>' +
      '<tr><td>Aéroport LJU vers Bled</td><td class="num">35 km . 35 min</td></tr>' +
      '<tr><td>Bled vers lac de Bohinj</td><td class="num">30 km . 35 min</td></tr>' +
      '<tr><td>Bohinj vers Kranjska Gora</td><td class="num">65 km . 1h15</td></tr>' +
      '<tr><td>Kranjska Gora vers sommet du Vrsic</td><td class="num">13 km . 40 min</td></tr>' +
      '<tr><td>Vrsic vers source de la Soca</td><td class="num">12 km . 30 min</td></tr>' +
      '<tr><td>Bovec vers Kobarid</td><td class="num">21 km . 25 min</td></tr>' +
      '<tr><td>Kobarid vers Skocjan</td><td class="num">145 km . 2h20</td></tr>' +
      '<tr><td>Skocjan vers Ljubljana</td><td class="num">75 km . 55 min</td></tr>' +
      '<tr><td>Ljubljana vers aéroport</td><td class="num">26 km . 28 min</td></tr>' +
      '</tbody></table></div>';

    out += '<h3>Les tracés routiers</h3>' +
      '<p class="fine">Les itinéraires suivent les vraies routes. Ils sont calculés une fois par OSRM, ' +
      'le moteur d\'itinéraire d\'OpenStreetMap, puis gardes sur ce téléphone : ensuite ça marché sans reseau. ' +
      'Un tronçon en pointille signifie qu\'il n\'a pas encore été calculé.</p>' +
      '<p class="fine">Pour les figer dans le dépôt et ne plus jamais dépendre du reseau : exportez le fichier, ' +
      'puis remplacez assets/routes.js par celui qui est téléchargé.</p>' +
      '<button class="btn" id="export-routes" type="button">Exporter les tracés</button> ' +
      '<span class="fine" id="export-etat"></span>';

    out += '<h3>Carte hors ligne</h3>' +
      '<p class="fine">Les tuiles déjà affichées sont gardées automatiquement : ce que vous avez regarde ' +
      'reste visible sans reseau. Vous pouvez aussi télécharger d\'un coup tout le corridor du voyage, ' +
      'pour ne pas être aveugles dans la vallée de la Soca ou sur le Vrsic.</p>' +
      '<div class="chips">' +
      '<button type="button" class="chip" data-off="12">Le tracé</button>' +
      '<button type="button" class="chip" data-off="13">Détaillé</button>' +
      '</div>' +
      '<div class="meter" id="off-meter"><i></i></div>' +
      '<p class="fine" id="off-avancee"></p>' +
      '<p class="fine" id="off-etat"></p>' +
      '<button class="btn" id="off-vider" type="button">Vider le cache des tuiles</button>' +
      '<p class="fine" style="margin-top:.8rem">A faire chez vous, en wifi, avant de partir. ' +
      'Le téléchargement se limité au corridor de l\'itinéraire et au fond de carte choisi. ' +
      'Les serveurs de tuiles sont mis à disposition gracieusement : c\'est prévu pour être lance une fois.</p>';

    out += '</div>';

    host.innerHTML = out;
    host.addEventListener('click', function (ev) {
      var tr = ev.target.closest('[data-open]');
      if (tr) {
        selectDay(parseInt(tr.dataset.open, 10));
        showTab('jours');
        return;
      }
      if (ev.target.closest('#export-routes')) { exporterTraces(); return; }
      var off = ev.target.closest('[data-off]');
      if (off) { telechargerHorsLigne(parseInt(off.dataset.off, 10)); return; }
      if (ev.target.closest('#off-vider')) {
        envoyerSW({ type: 'VIDER' });
        $('#off-meter').querySelector('i').style.width = '0%';
        $('#off-avancee').textContent = '';
        return;
      }
    });

    if (swDisponible()) { demanderEtat(); }
    else { var e = $('#off-etat'); if (e) { e.textContent = 'Le cache hors ligne demande une adresse https : ouvrez l\'application depuis GitHub Pages.'; } }

    var leg = $('#maplegend');
    leg.innerHTML = TRIP.days.map(function (d) {
      return '<span><i style="background:' + d.color + '"></i>J' + d.n + '</span>';
    }).join('');
  }

  function exporterTraces() {
    var etat = $('#export-etat');
    if (!global.Router || !Router.count()) {
      etat.textContent = 'Aucun tracé calculé pour l\'instant.';
      return;
    }
    var blob = new Blob([Router.exportFile()], { type: 'text/javascript' });
    var url = URL.createObjectURL(blob);
    var lien = document.createElement('à');
    lien.href = url; lien.download = 'routes.js';
    document.body.appendChild(lien); lien.click(); lien.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    etat.textContent = Router.count() + ' tronçons exportes.';
  }

  /* ---------- carte hors ligne ---------- */

  var sw = null;

  function styleCourant() {
    var k = db.style || 'plan';
    var liste = global.MAP_STYLES || [];
    for (var i = 0; i < liste.length; i++) { if (liste[i].key === k) { return liste[i]; } }
    return liste[0];
  }

  function tuileXY(lat, lon, z) {
    var n = Math.pow(2, z);
    var r = lat * Math.PI / 180;
    return [
      Math.floor((lon + 180) / 360 * n),
      Math.floor((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2 * n)
    ];
  }

  // Échantillonné le tracé tous les ~1 km pour ne pas laisser de trous
  // entre deux points éloignés, puis liste les tuiles du corridor.
  function tuilesDuVoyage(zMax) {
    var st = styleCourant();
    if (!st || !st.url) { return []; }

    var pts = [];
    TRIP.days.forEach(function (d) {
      routesOf(d, false).forEach(function (r) {
        for (var i = 0; i < r.points.length - 1; i++) {
          var a = r.points[i], b = r.points[i + 1];
          var d2 = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]));
          var pas = Math.max(1, Math.ceil(d2 / 0.01));
          for (var k = 0; k < pas; k++) {
            pts.push([a[0] + (b[0] - a[0]) * k / pas, a[1] + (b[1] - a[1]) * k / pas]);
          }
        }
        if (r.points.length) { pts.push(r.points[r.points.length - 1]); }
      });
    });

    var vues = {}, urls = [];
    for (var z = 8; z <= Math.min(zMax, st.max); z++) {
      var marge = z >= 12 ? 1 : 2;
      var n = Math.pow(2, z);
      for (var i = 0; i < pts.length; i++) {
        var t = tuileXY(pts[i][0], pts[i][1], z);
        for (var dx = -marge; dx <= marge; dx++) {
          for (var dy = -marge; dy <= marge; dy++) {
            var x = t[0] + dx, y = t[1] + dy;
            if (y < 0 || y >= n) { continue; }
            x = ((x % n) + n) % n;
            var cle = z + '/' + x + '/' + y;
            if (vues[cle]) { continue; }
            vues[cle] = 1;
            var u = st.url.replace('{z}', z).replace('{x}', x).replace('{y}', y);
            if (st.sub) { u = u.replace('{s}', st.sub[(x + y) % st.sub.length]); }
            urls.push(u);
          }
        }
      }
    }
    return urls;
  }

  function swDisponible() {
    return 'serviceWorker' in navigator &&
      (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  }

  function enregistrerSW() {
    if (!swDisponible()) { return; }
    navigator.serviceWorker.register('sw.js', { scope: './' }).catch(function () {});
    navigator.serviceWorker.ready.then(function (reg) {
      sw = reg.active || reg.waiting || reg.installing;
      demanderEtat();
    }).catch(function () {});
    navigator.serviceWorker.addEventListener('message', function (ev) {
      var m = ev.data || {};
      if (m.type === 'ÉTAT') { majHorsLigne(m.tuiles); }
      if (m.type === 'PRECACHE_AVANCEE') { avanceeHorsLigne(m.fait, m.total); }
      if (m.type === 'PRECACHE_FINI') {
        avanceeHorsLigne(m.total, m.total);
        majHorsLigne(m.tuiles, m.echecs);
      }
    });
  }

  function envoyerSW(msg) {
    var c = navigator.serviceWorker && navigator.serviceWorker.controller;
    if (c) { c.postMessage(msg); return true; }
    if (sw) { sw.postMessage(msg); return true; }
    return false;
  }

  function demanderEtat() { envoyerSW({ type: 'ÉTAT' }); }

  function majHorsLigne(tuiles, echecs) {
    var e = $('#off-etat');
    if (!e) { return; }
    var mo = Math.round(tuiles * 18 / 1024 * 10) / 10;
    e.textContent = tuiles
      ? tuiles + ' tuiles en cache, environ ' + String(mo).replace('.', ',') + ' Mo.' +
        (echecs ? ' ' + echecs + ' non récupérées.' : '')
      : 'Aucune tuile en cache pour l\'instant.';
  }

  function avanceeHorsLigne(fait, total) {
    var m = $('#off-meter');
    if (m) { m.querySelector('i').style.width = (fait / Math.max(1, total) * 100) + '%'; }
    var e = $('#off-avancee');
    if (e) { e.textContent = fait < total ? 'Téléchargement ' + fait + '/' + total : 'Téléchargement terminé.'; }
  }

  function telechargerHorsLigne(zMax) {
    var e = $('#off-avancee');
    if (!swDisponible()) {
      e.textContent = 'Le cache hors ligne demande une adresse https. Ouvrez l\'application depuis GitHub Pages.';
      return;
    }
    var urls = tuilesDuVoyage(zMax);
    if (!urls.length) {
      e.textContent = 'Choisissez d\'abord un fond de carte autre que le fond uni.';
      return;
    }
    if (!envoyerSW({ type: 'PRECACHE', urls: urls })) {
      e.textContent = 'Le cache se préparé, reessayez dans quelques secondes.';
      return;
    }
    e.textContent = 'Téléchargement 0/' + urls.length;
  }

  /* ---------- budget ---------- */

  var sim = db.sim || { nuit: 50, food: 20, car: 250 };
  var LIM = { nuit: [25, 160, 5], food: [8, 60, 2], car: [120, 600, 20] };

  // Les étapes "courses" et "repas" sont déjà couvertes par la ligne
  // nourriture du budget : les compter ici ferait un double comptage.
  var FOOD_KINDS = { courses: 1, repas: 1 };

  function visitesOf(day) {
    var t = 0;
    build(day).stops.forEach(function (s) {
      if (!FOOD_KINDS[s.kind]) { t += (s.cost || 0); }
    });
    return t;
  }

  function visitesBase() {
    var t = 0;
    TRIP.days.forEach(function (d) { t += visitesOf(d); });
    return t;
  }

  function renderBudget() {
    var host = $('#budgetbody');
    var out = '<div class="block wrap"><h2><span class="blaze"></span> Simulateur</h2>' +
      '<p class="sub">Réglez vos hypotheses, le total par personne se recalculé. Hors vol, à deux, tout partage.</p>';

    out += '<div class="field"><span class="lab">Nuit pour deux<small>6 nuits</small></span>' +
      '<span class="stepper"><button type="button" data-sim="nuit" data-d="-5" aria-label="Moins">-</button>' +
      '<output id="o-nuit"></output><button type="button" data-sim="nuit" data-d="5" aria-label="Plus">+</button></span></div>';
    out += '<div class="field"><span class="lab">Nourriture par jour<small>par personne, 7 jours</small></span>' +
      '<span class="stepper"><button type="button" data-sim="food" data-d="-2" aria-label="Moins">-</button>' +
      '<output id="o-food"></output><button type="button" data-sim="food" data-d="2" aria-label="Plus">+</button></span></div>';
    out += '<div class="field"><span class="lab">Voiture pour la semaine<small>pour deux</small></span>' +
      '<span class="stepper"><button type="button" data-sim="car" data-d="-20" aria-label="Moins">-</button>' +
      '<output id="o-car"></output><button type="button" data-sim="car" data-d="20" aria-label="Plus">+</button></span></div>';

    out += '<h3>Les extras</h3><div class="chips" id="extras">';
    BUDGET.extras.forEach(function (x) {
      out += '<label class="chip"><input type="checkbox" data-cost="' + x[2] + '" data-k="' + x[0] + '"> ' +
        esc(x[1]) + ' <span class="price">' + x[2] + ' €</span></label>';
    });
    out += '</div>';

    out += '<div class="readout"><span class="cap">Total par personne, hors vol</span>' +
      '<div class="big" id="b-total"></div><div class="meter" id="b-meter"><i></i></div>' +
      '<p class="verdict ok" id="b-verdict"></p>' +
      '<div class="split">' +
      '<div><span class="k">Fixe</span><span class="v" id="b-fixe"></span></div>' +
      '<div><span class="k">Hébergement</span><span class="v" id="b-lit"></span></div>' +
      '<div><span class="k">Nourriture</span><span class="v" id="b-food"></span></div>' +
      '<div><span class="k">Visites et extras</span><span class="v" id="b-vis"></span></div>' +
      '</div></div>';
    out += '<p class="fine" style="margin-top:.8rem">Base fixe : ' +
      BUDGET.fixe.map(function (f) { return f[0].toLowerCase() + ' ' + f[1] + ' €'; }).join(', ') +
      '. Les visites viennent de l\'itinéraire : si vous retirez une étape, le budget suit.</p>';
    out += '</div>';

    /* dépenses */
    out += '<div class="block wrap"><h2><span class="blaze"></span> Dépenses réelles</h2>' +
      '<p class="sub">A remplir chaque soir. Enregistre sur ce téléphone.</p><div class="spend" id="spend">';
    TRIP.days.forEach(function (d) {
      out += '<div class="row"><span class="lab">Jour ' + d.n + '<small>' + esc(d.wd) + '</small></span>' +
        '<input type="number" inputmode="decimal" step="0.5" min="0" placeholder="0" data-k="s' + d.n +
        '" aria-label="Dépenses du jour ' + d.n + '"></div>';
    });
    out += '<div class="row"><span class="lab">Paye avant le départ<small>voiture, hébergements</small></span>' +
      '<input type="number" inputmode="decimal" step="0.5" min="0" placeholder="0" data-k="spre" aria-label="Paye avant le départ"></div>';
    out += '</div><div class="readout"><span class="cap">Dépense par personne</span>' +
      '<div class="big" id="s-total"></div><div class="meter" id="s-meter"><i></i></div>' +
      '<p class="verdict ok" id="s-verdict"></p></div>' +
      '<button class="btn" id="s-reset" type="button">Remettre à zero</button></div>';

    /* tables */
    out += '<div class="block wrap"><h2><span class="blaze"></span> Ce qu\'on laisse de côté</h2><div class="tablewrap"><table>' +
      '<thead><tr><th>Site</th><th class="num">Prix</th><th>Pourquoi</th></tr></thead><tbody>';
    BUDGET.ecartes.forEach(function (r) {
      out += '<tr><td>' + esc(r[0]) + '</td><td class="num">' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>';
    });
    out += '</tbody></table></div><h3>Frais courants</h3><div class="tablewrap"><table><tbody>';
    BUDGET.reference.forEach(function (r) {
      out += '<tr><td>' + esc(r[0]) + '</td><td class="num">' + esc(r[1]) + '</td></tr>';
    });
    out += '</tbody></table></div></div>';

    host.innerHTML = out;

    $$('#extras input').forEach(function (x) {
      if (db[x.dataset.k]) { x.checked = true; }
      x.parentNode.classList.toggle('is-on', x.checked);
      x.addEventListener('change', function () {
        db[x.dataset.k] = x.checked; save();
        x.parentNode.classList.toggle('is-on', x.checked);
        computeBudget();
      });
    });

    host.addEventListener('click', function (ev) {
      var t = ev.target.closest('[data-sim]');
      if (t) {
        var k = t.dataset.sim, l = LIM[k];
        sim[k] = Math.max(l[0], Math.min(l[1], sim[k] + parseInt(t.dataset.d, 10)));
        db.sim = sim; save(); computeBudget();
      }
      if (ev.target.closest('#s-reset')) {
        $$('#spend input').forEach(function (i) { i.value = ''; delete db[i.dataset.k]; });
        save(); computeSpend();
      }
    });

    $$('#spend input').forEach(function (i) {
      if (db[i.dataset.k] != null) { i.value = db[i.dataset.k]; }
      i.addEventListener('input', function () { db[i.dataset.k] = i.value; save(); computeSpend(); });
    });

    computeBudget();
    computeSpend();
  }

  function computeBudget() {
    var fixeOther = BUDGET.fixe.reduce(function (a, f) { return a + f[1]; }, 0);
    var fixe = sim.car / 2 + fixeOther;
    var lit = (sim.nuit * 6) / 2;
    var food = sim.food * 7;
    var vis = visitesBase();
    $$('#extras input').forEach(function (x) { if (x.checked) { vis += parseFloat(x.dataset.cost); } });
    var total = fixe + lit + food + vis;

    $('#o-nuit').textContent = eur(sim.nuit);
    $('#o-food').textContent = eur(sim.food);
    $('#o-car').textContent = eur(sim.car);
    $('#b-total').textContent = eur(total);
    $('#b-fixe').textContent = eur(fixe);
    $('#b-lit').textContent = eur(lit);
    $('#b-food').textContent = eur(food);
    $('#b-vis').textContent = eur(vis);

    var m = $('#b-meter');
    m.querySelector('i').style.width = Math.min(100, total / BUDGET.cible * 100) + '%';
    m.classList.toggle('over', total > BUDGET.cible);
    var v = $('#b-verdict');
    if (total > BUDGET.cible) {
      v.className = 'verdict over';
      v.textContent = eur(total - BUDGET.cible) + ' au-dessus de la cible. Coupez un extra, ou une nuit en auberge.';
    } else {
      v.className = 'verdict ok';
      v.textContent = 'Il reste ' + eur(BUDGET.cible - total) + ' de marge sur les 600 €.';
    }
  }

  function computeSpend() {
    var sum = 0;
    $$('#spend input').forEach(function (i) {
      var n = parseFloat(String(i.value).replace(',', '.'));
      if (!isNaN(n) && n > 0) { sum += n; }
    });
    $('#s-total').textContent = eur(sum);
    var m = $('#s-meter');
    m.querySelector('i').style.width = Math.min(100, sum / BUDGET.cible * 100) + '%';
    m.classList.toggle('over', sum > BUDGET.cible);
    var v = $('#s-verdict');
    if (sum > BUDGET.cible) {
      v.className = 'verdict over';
      v.textContent = eur(sum - BUDGET.cible) + ' au-dessus de l\'enveloppe.';
    } else {
      v.className = 'verdict ok';
      v.textContent = 'Il reste ' + eur(BUDGET.cible - sum) + ' sur l\'enveloppe.';
    }
  }

  /* ---------- guide ---------- */

  function acc(title, body, open) {
    return '<details class="acc"' + (open ? ' open' : '') + '><summary>' + esc(title) + '</summary>' +
      '<div class="accbody">' + body + '</div></details>';
  }

  function renderGuide() {
    var out = '<div class="block wrap"><h2><span class="blaze"></span> Le guide</h2>' +
      '<p class="sub">Tout ce qui ne tient pas dans une journée. Touchez une section pour l\'ouvrir.</p>';

    var sos = '<div class="sos">' + GUIDE.urgences.map(function (u) {
      return '<a href="tel:' + u.tel + '"><span class="n">' + u.n + '</span><span class="l">' + esc(u.l) + '</span></a>';
    }).join('') + '</div><p class="fine" style="margin-top:.7rem">Le 112 fonctionne sans reseau ni carte SIM et répond en anglais. ' +
      'Ambassade de France à Ljubljana : <a href="tel:+38614790400">+386 1 479 04 00</a>.</p>';
    out += acc('Urgences', sos, true);

    out += acc('Conduire en Slovénie', '<div class="cards">' + GUIDE.conduite.map(function (c) {
      return '<div class="card"><span class="k">' + esc(c.k) + '</span><div class="v">' + esc(c.v) + '</div></div>';
    }).join('') + '</div>');

    out += acc('Randonnées', '<div class="tablewrap"><table><thead><tr><th>Rando</th><th>Durée</th>' +
      '<th class="num">Deniv.</th><th class="num">Prix</th></tr></thead><tbody>' +
      GUIDE.randos.map(function (r) {
        return '<tr><td><b>' + esc(r.nom) + '</b><br><span class="fine">' + esc(r.lieu) + ' . ' + esc(r.note) + '</span></td>' +
          '<td>' + esc(r.duree) + '<br><span class="fine">' + esc(r.diff) + '</span></td>' +
          '<td class="num">' + esc(r.deniv) + '</td><td class="num">' + esc(r.prix) + '</td></tr>';
      }).join('') + '</tbody></table></div>');

    out += acc('Où dormir', '<div class="cards">' + GUIDE.hebergements.map(function (h) {
      return '<div class="card"><span class="k">' + esc(h.base) + ' . nuits ' + esc(h.nuits) + '</span>' +
        '<div class="v"><strong>' + esc(h.prix) + '</strong> la chambre double. ' + esc(h.note) + '</div></div>';
    }).join('') + '</div>');

    out += acc('Manger et boire', '<div class="tablewrap"><table><tbody>' + GUIDE.manger.map(function (m) {
      return '<tr><td><b>' + esc(m.p) + '</b><br><span class="fine">' + esc(m.d) + '</span></td>' +
        '<td class="num">' + esc(m.prix) + '</td></tr>';
    }).join('') + '</tbody></table></div>' +
      '<p class="fine" style="margin-top:.7rem">Les supermarches (Hofer, Lidl, Mercator, Spar) ferment le samedi entre 13h et 17h et ' +
      'sont fermés le dimanche. Faites les courses du week-end le samedi 12 avant 17h.</p>');

    out += acc('Météo de septembre', '<div class="tablewrap"><table><thead><tr><th>Zone</th>' +
      '<th class="num">Jour</th><th class="num">Nuit</th><th class="num">Eau</th></tr></thead><tbody>' +
      GUIDE.meteo.map(function (m) {
        return '<tr><td>' + esc(m.z) + '</td><td class="num">' + esc(m.j) + '</td>' +
          '<td class="num">' + esc(m.n) + '</td><td class="num">' + esc(m.e) + '</td></tr>';
      }).join('') + '</tbody></table></div>' +
      '<p class="fine" style="margin-top:.7rem">Environ 12 jours de pluie sur le mois. Le brouillard de fond de vallée se leve entre 9h et 11h. ' +
      'Météo officielle de montagne : <a href="https://meteo.arso.gov.si/met/en/" target="_blank" rel="noopener">ARSO Vreme</a>. ' +
      'État des routes et du col du Vrsic : <a href="https://www.promet.si/en/" target="_blank" rel="noopener">promet.si</a>.</p>');

    out += acc('S\'il pleut', '<div class="tablewrap"><table><thead><tr><th>Ce que vous voyez</th><th>Ce que vous faites</th></tr></thead><tbody>' +
      GUIDE.pluie.map(function (p) {
        return '<tr><td>' + esc(p.v) + '</td><td>' + esc(p.f) + '</td></tr>';
      }).join('') + '</tbody></table></div>');

    out += acc('Slovène de survie', '<div class="lex">' + GUIDE.mots.map(function (m) {
      return '<div><span class="sl">' + esc(m[0]) + (m[1] ? '<small>' + esc(m[1]) + '</small>' : '') +
        '</span><span class="fr">' + esc(m[2]) + '</span></div>';
    }).join('') + '</div><h3>Prononciation</h3><div class="cards">' +
      GUIDE.prononciation.map(function (p) {
        return '<div class="card"><span class="k">' + esc(p[0]) + '</span><div class="v">' + esc(p[1]) + '</div></div>';
      }).join('') + '</div>');

    out += '</div>';
    $('#guidebody').innerHTML = out;
  }

  /* ---------- valise ---------- */

  function renderPack() {
    var out = '<div class="block wrap"><h2><span class="blaze"></span> Le sac</h2>' +
      '<p class="sub">Un sac cabine et un sac à dos de journée chacune. Les cases restent cochees sur ce téléphone.</p>' +
      '<div class="progress"><b id="p-count"></b><span>préparé</span></div><div class="meter" id="p-meter"><i></i></div>';

    PACK.forEach(function (g) {
      out += '<h3>' + esc(g.titre) + '</h3><div class="check">';
      g.items.forEach(function (it) {
        out += '<label><input type="checkbox" data-k="' + it[0] + '"><span>' + esc(it[1]) + '</span></label>';
      });
      out += '</div>';
    });

    out += '<button class="btn" id="p-reset" type="button">Tout decocher</button>';
    out += '<footer><p>Carnet de terrain, Slovénie, 7 au 13 septembre 2026.</p>' +
      '<p>Prix relevés en juillet 2026. Revoyez Vintgar, Skocjan et Tolmin sur leurs sites officiels avant de partir.</p>' +
      '<p>Coordonnées indicatives, à quelques centaines de mètres pres : elles servent au tracé et à lancer la navigation. ' +
      'Les liens Maps et Tripadvisor partent du nom du lieu.</p>' +
      '<p>Fond de carte <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>, ' +
      'sous licence ODbL. Sur iPhone : bouton Partager, puis "Sur l\'écran d\'accueil".</p></footer></div>';

    var host = $('#packbody');
    host.innerHTML = out;

    var boxes = $$('#packbody input[type="checkbox"]');
    boxes.forEach(function (b) {
      if (db[b.dataset.k]) { b.checked = true; }
      b.addEventListener('change', function () { db[b.dataset.k] = b.checked; save(); countPack(boxes); });
    });
    $('#p-reset').addEventListener('click', function () {
      boxes.forEach(function (b) { b.checked = false; delete db[b.dataset.k]; });
      save(); countPack(boxes);
    });
    countPack(boxes);
  }

  function countPack(boxes) {
    var n = boxes.filter(function (b) { return b.checked; }).length;
    $('#p-count').textContent = n + '/' + boxes.length;
    $('#p-meter').querySelector('i').style.width = (n / boxes.length * 100) + '%';
  }

  /* ---------- pli et plein écran de la carte ---------- */

  function majBoutonPli() {
    var plie = $('#mapwrap').classList.contains('is-folded');
    var b = $('#mapfold');
    b.setAttribute('aria-expanded', String(!plie));
    b.querySelector('span').textContent = plie ? 'Afficher' : 'Replier';
    b.classList.toggle('is-folded', plie);
  }

  function plierDeplier(sel, mode, carte) {
    var w = $(sel);
    var on = !w.classList.contains('is-' + mode);
    w.classList.toggle('is-' + mode, on);
    document.body.classList.toggle('has-full', on);
    if (on) { w.classList.remove('is-folded'); }
    if (sel === '#mapwrap') { majBoutonPli(); }
    setTimeout(function () {
      carte.render();
      if (carte === dayMap) { paintDayMap(true); } else { paintAllMap(true); }
    }, 40);
  }

  /* ---------- onglets ---------- */

  var TABS = ['jours', 'carte', 'budget', 'guide', 'sac'];

  function showTab(name) {
    if (TABS.indexOf(name) < 0) { name = 'jours'; }
    TABS.forEach(function (k) {
      $('#p-' + k).classList.toggle('is-active', k === name);
      $('#t-' + k).setAttribute('aria-selected', String(k === name));
    });
    db.tab = name; save();
    try { history.replaceState(null, '', '#' + name); } catch (e) {}
    window.scrollTo(0, 0);

    if (name === 'carte') {
      if (!allMap) {
        allMap = new MiniMap($('#allmap'), {
          minZoom: 7, maxZoom: 14,
          style: db.style || 'plan',
          onFull: function () { plierDeplier('#allwrap', 'full', allMap); },
          onPick: function (m) { if (m.day != null) { selectDay(m.day); showTab('jours'); } }
        });
        allMap.onStyle = function (k) { db.style = k; save(); if (dayMap) { dayMap.setStyle(k); } };
      }
      paintAllMap();
      chercherTraces(toutesLesPaires(), function () { paintAllMap(true); });
    }
    if (name === 'jours' && dayMap) {
      setTimeout(function () { dayMap.render(); paintDayMap(true); }, 30);
      chercherTraces(legPairs(TRIP.days[curDay]), function () { paintDayMap(true); });
    }
  }

  /* ---------- démarrage ---------- */

  function boot() {
    enregistrerSW();
    renderRail();
    renderAll();
    renderBudget();
    renderGuide();
    renderPack();

    dayMap = new MiniMap($('#daymap'), {
      minZoom: 8, maxZoom: 16,
      style: db.style || 'plan',
      onFull: function () { plierDeplier('#mapwrap', 'full', dayMap); },
      onPick: function (m) {
        activeStop = m.idx;
        $$('#daybody .stopcard').forEach(function (c, k) { c.classList.toggle('is-active', k === activeStop); });
        var card = $$('#daybody .stop')[activeStop];
        if (card) { card.scrollIntoView({ block: 'center' }); }
        paintDayMap(true);
      }
    });
    dayMap.onStyle = function (k) { db.style = k; save(); if (allMap) { allMap.setStyle(k); } };

    // replier la carte pour lire l'itinéraire en plus grand
    if (db.folded) { $('#mapwrap').classList.add('is-folded'); }
    majBoutonPli();
    $('#mapfold').addEventListener('click', function () {
      var w = $('#mapwrap');
      w.classList.toggle('is-folded');
      db.folded = w.classList.contains('is-folded'); save();
      majBoutonPli();
      if (!db.folded) { setTimeout(function () { dayMap.render(); paintDayMap(true); }, 30); }
    });

    curDay = (todayIdx >= 0) ? todayIdx : (db.day != null ? db.day : 0);
    $('#daybody').addEventListener('click', onDayClick);
    syncRail();
    renderDay();

    $$('.tabbar button').forEach(function (b) {
      b.addEventListener('click', function () { showTab(b.dataset.tab); });
    });

    var h = (location.hash || '').replace('#', '');
    showTab(TABS.indexOf(h) >= 0 ? h : (db.tab || 'jours'));
    window.addEventListener('hashchange', function () {
      var x = (location.hash || '').replace('#', '');
      if (TABS.indexOf(x) >= 0) { showTab(x); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else { boot(); }
})(window);
