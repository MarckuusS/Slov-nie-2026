/* =============================================================
   Moteur de carte minimal, sans aucune dependance.

   Tuiles raster en projection Web Mercator, overlay SVG pour le
   trace et les marqueurs numerotes. Gestes tactiles : glisser,
   pincer, double tap. Molette au bureau.

   Quatre fonds : Plan (OpenStreetMap), Relief (OpenTopoMap),
   Satellite (Esri) et Fond uni. Le fond uni n'est pas une panne,
   c'est un choix : le trace y est plus lisible, et c'est ce qui
   reste quand il n'y a pas de reseau dans une vallee.
   ============================================================= */

(function (global) {
  'use strict';

  var TILE = 256;

  var STYLES = [
    {
      key: 'plan', name: 'Plan',
      url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      max: 18,
      credit: 'OpenStreetMap', creditUrl: 'https://www.openstreetmap.org/copyright'
    },
    {
      key: 'relief', name: 'Relief',
      url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
      sub: ['a', 'b', 'c'], max: 16,
      credit: 'OpenTopoMap, CC-BY-SA', creditUrl: 'https://opentopomap.org/'
    },
    {
      key: 'satellite', name: 'Satellite',
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      max: 18,
      credit: 'Esri, Maxar, Earthstar Geographics', creditUrl: 'https://www.esri.com/'
    },
    {
      key: 'uni', name: 'Fond uni',
      url: null, max: 18,
      credit: null, creditUrl: null
    }
  ];

  function styleOf(key) {
    for (var i = 0; i < STYLES.length; i++) { if (STYLES[i].key === key) { return STYLES[i]; } }
    return STYLES[0];
  }

  function project(lat, lon, z) {
    var s = TILE * Math.pow(2, z);
    var sin = Math.sin(lat * Math.PI / 180);
    sin = Math.max(-0.9999, Math.min(0.9999, sin));
    return [
      (lon + 180) / 360 * s,
      (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * s
    ];
  }

  function unproject(x, y, z) {
    var s = TILE * Math.pow(2, z);
    var n = Math.PI - 2 * Math.PI * y / s;
    return [
      180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))),
      x / s * 360 - 180
    ];
  }

  function el(tag, cls) {
    var e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    if (cls) { e.setAttribute('class', cls); }
    return e;
  }

  var ICON = {
    fit: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15"/></svg>',
    layer: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5 21 8l-9 4.5L3 8z"/><path d="M3 12.5 12 17l9-4.5"/></svg>',
    full: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>'
  };

  function MiniMap(container, opts) {
    opts = opts || {};
    this.box = container;
    this.minZoom = opts.minZoom || 6;
    this.maxZoom = opts.maxZoom || 16;
    this.z = opts.zoom || 9;
    this.onPick = opts.onPick || function () {};
    this.onFull = opts.onFull || null;
    this.styleKey = opts.style || 'plan';

    this.box.classList.add('mm');
    this.box.innerHTML = '';
    this.box.setAttribute('data-style', this.styleKey);

    this.inner = document.createElement('div');
    this.inner.className = 'mm-inner';
    this.box.appendChild(this.inner);

    this.tileLayer = document.createElement('div');
    this.tileLayer.className = 'mm-tiles';
    this.inner.appendChild(this.tileLayer);

    this.svg = el('svg', 'mm-svg');
    this.svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    this.inner.appendChild(this.svg);

    this.gRoutes = el('g', 'mm-routes');
    this.gMarks = el('g', 'mm-marks');
    this.svg.appendChild(this.gRoutes);
    this.svg.appendChild(this.gMarks);

    this.attrib = document.createElement('a');
    this.attrib.className = 'mm-attrib';
    this.attrib.target = '_blank';
    this.attrib.rel = 'noopener';
    this.box.appendChild(this.attrib);

    this.ctrl = document.createElement('div');
    this.ctrl.className = 'mm-ctrl';
    this.ctrl.innerHTML =
      '<button type="button" data-mm="in" aria-label="Zoomer">+</button>' +
      '<button type="button" data-mm="out" aria-label="Dezoomer">-</button>' +
      '<button type="button" data-mm="fit" aria-label="Recadrer sur le trace">' + ICON.fit + '</button>' +
      '<button type="button" data-mm="layer" aria-label="Changer de fond de carte" aria-expanded="false">' + ICON.layer + '</button>' +
      (this.onFull ? '<button type="button" data-mm="full" aria-label="Carte en plein ecran">' + ICON.full + '</button>' : '');
    this.box.appendChild(this.ctrl);

    this.menu = document.createElement('div');
    this.menu.className = 'mm-styles';
    this.menu.hidden = true;
    this.menu.innerHTML = STYLES.map(function (st) {
      return '<button type="button" data-style="' + st.key + '">' + st.name + '</button>';
    }).join('');
    this.box.appendChild(this.menu);

    this.tiles = {};
    this.pointers = {};
    this.routes = [];
    this.marks = [];
    this.cx = 0; this.cy = 0;
    this.renderOX = 0; this.renderOY = 0;

    this._bind();
    this.setStyle(this.styleKey, true);
    this.setCenter(46.25, 14.0, this.z);
  }

  /* ---------- fonds de carte ---------- */

  MiniMap.prototype.setStyle = function (key, quiet) {
    var st = styleOf(key);
    this.styleKey = st.key;
    this.box.setAttribute('data-style', st.key);
    this.maxZoom = Math.min(this.maxZoom, st.max);
    if (this.z > st.max) { this.z = st.max; }

    if (st.credit) {
      this.attrib.hidden = false;
      this.attrib.href = st.creditUrl;
      this.attrib.textContent = 'Fond ' + st.credit;
    } else {
      this.attrib.hidden = true;
    }

    Array.prototype.forEach.call(this.menu.children, function (b) {
      b.setAttribute('aria-pressed', String(b.dataset.style === st.key));
    });

    // on repart de zero : les tuiles de l'ancien fond ne sont pas reutilisables
    this.tileLayer.innerHTML = '';
    this.tiles = {};
    if (!quiet) { this.render(); }
  };

  MiniMap.prototype._tileUrl = function (st, z, x, y) {
    var u = st.url.replace('{z}', z).replace('{x}', x).replace('{y}', y);
    if (st.sub) { u = u.replace('{s}', st.sub[(x + y) % st.sub.length]); }
    return u;
  };

  /* ---------- geometrie ---------- */

  MiniMap.prototype._size = function () {
    var r = this.box.getBoundingClientRect();
    this.W = Math.max(1, Math.round(r.width));
    this.H = Math.max(1, Math.round(r.height));
    return r;
  };

  MiniMap.prototype.setCenter = function (lat, lon, z) {
    if (z != null) { this.z = Math.max(this.minZoom, Math.min(this.maxZoom, Math.round(z))); }
    var p = project(lat, lon, this.z);
    this.cx = p[0]; this.cy = p[1];
    this.render();
  };

  MiniMap.prototype.setRoutes = function (routes) { this.routes = routes || []; this.draw(); };
  MiniMap.prototype.setMarks = function (marks) { this.marks = marks || []; this.draw(); };

  MiniMap.prototype.bounds = function () {
    var pts = [];
    this.routes.forEach(function (r) { r.points.forEach(function (p) { pts.push(p); }); });
    this.marks.forEach(function (m) { pts.push([m.lat, m.lon]); });
    if (!pts.length) { return null; }
    var la1 = 90, la2 = -90, lo1 = 180, lo2 = -180;
    pts.forEach(function (p) {
      la1 = Math.min(la1, p[0]); la2 = Math.max(la2, p[0]);
      lo1 = Math.min(lo1, p[1]); lo2 = Math.max(lo2, p[1]);
    });
    return [la1, lo1, la2, lo2];
  };

  MiniMap.prototype.fit = function (pad) {
    var b = this.bounds();
    if (!b) { return; }
    this._size();
    pad = pad == null ? 46 : pad;
    var W = Math.max(40, this.W - pad * 2), H = Math.max(40, this.H - pad * 2);
    var z = this.maxZoom;
    for (; z > this.minZoom; z--) {
      var a = project(b[0], b[1], z), c = project(b[2], b[3], z);
      if (Math.abs(c[0] - a[0]) <= W && Math.abs(c[1] - a[1]) <= H) { break; }
    }
    this.z = z;
    var m1 = project(b[0], b[1], z), m2 = project(b[2], b[3], z);
    this.cx = (m1[0] + m2[0]) / 2;
    this.cy = (m1[1] + m2[1]) / 2;
    this.render();
  };

  /* ---------- rendu ---------- */

  MiniMap.prototype.render = function () {
    this._size();
    this.renderOX = this.cx - this.W / 2;
    this.renderOY = this.cy - this.H / 2;
    this.inner.style.transform = '';
    this.tileLayer.style.transform = '';
    this._tiles();
    this.draw();
  };

  MiniMap.prototype._tiles = function () {
    var st = styleOf(this.styleKey);
    if (!st.url) {
      this.tileLayer.innerHTML = '';
      this.tiles = {};
      return;
    }
    var z = this.z, n = Math.pow(2, z);
    var ox = this.renderOX, oy = this.renderOY;
    var x0 = Math.floor(ox / TILE) - 1, x1 = Math.floor((ox + this.W) / TILE) + 1;
    var y0 = Math.floor(oy / TILE) - 1, y1 = Math.floor((oy + this.H) / TILE) + 1;
    var need = {}, self = this;

    for (var x = x0; x <= x1; x++) {
      for (var y = y0; y <= y1; y++) {
        if (y < 0 || y >= n) { continue; }
        var tx = ((x % n) + n) % n;
        var key = st.key + '/' + z + '/' + tx + '/' + y + '/' + x;
        need[key] = 1;
        if (!this.tiles[key]) {
          var img = new Image();
          img.className = 'mm-tile';
          img.alt = '';
          img.decoding = 'async';
          img.style.left = (x * TILE - ox) + 'px';
          img.style.top = (y * TILE - oy) + 'px';
          img.addEventListener('load', function () { this.classList.add('is-on'); });
          img.addEventListener('error', function () { this.classList.add('is-dead'); });
          img.src = this._tileUrl(st, z, tx, y);
          this.tileLayer.appendChild(img);
          this.tiles[key] = img;
        } else {
          this.tiles[key].style.left = (x * TILE - ox) + 'px';
          this.tiles[key].style.top = (y * TILE - oy) + 'px';
        }
      }
    }
    Object.keys(this.tiles).forEach(function (k) {
      if (!need[k]) {
        var t = self.tiles[k];
        if (t && t.parentNode) { t.parentNode.removeChild(t); }
        delete self.tiles[k];
      }
    });
  };

  MiniMap.prototype.draw = function () {
    if (!this.W) { this._size(); }
    var z = this.z, self = this;
    this.svg.setAttribute('width', this.W);
    this.svg.setAttribute('height', this.H);
    this._viewBox();

    this.gRoutes.innerHTML = '';
    this.gMarks.innerHTML = '';

    this.routes.forEach(function (r) {
      if (!r.points || r.points.length < 2) { return; }
      var d = r.points.map(function (p, i) {
        var q = project(p[0], p[1], z);
        return (i ? 'L' : 'M') + q[0].toFixed(1) + ' ' + q[1].toFixed(1);
      }).join(' ');

      var halo = el('path', 'mm-halo');
      halo.setAttribute('d', d);
      self.gRoutes.appendChild(halo);

      var line = el('path', 'mm-line' + (r.dim ? ' is-dim' : '') + (r.rough ? ' is-rough' : ''));
      line.setAttribute('d', d);
      line.setAttribute('stroke', r.color || '#0C7367');
      self.gRoutes.appendChild(line);
    });

    this.marks.forEach(function (m, i) {
      var q = project(m.lat, m.lon, z);
      var g = el('g', 'mm-mark' + (m.active ? ' is-active' : '') + (m.dim ? ' is-dim' : ''));
      g.setAttribute('transform', 'translate(' + q[0].toFixed(1) + ',' + q[1].toFixed(1) + ')');
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', m.label ? (m.label + '. ' + m.name) : m.name);

      var ring = el('circle', 'mm-ring');
      ring.setAttribute('r', m.active ? 15 : 12);
      ring.setAttribute('fill', m.color || '#0C7367');
      g.appendChild(ring);

      if (m.label) {
        var t = el('text', 'mm-num');
        t.setAttribute('y', 4);
        t.setAttribute('text-anchor', 'middle');
        t.textContent = m.label;
        g.appendChild(t);
      }

      var hit = el('circle', 'mm-hit');
      hit.setAttribute('r', 22);
      g.appendChild(hit);

      g.addEventListener('click', function (ev) { ev.stopPropagation(); self.onPick(m, i); });
      g.addEventListener('keydown', function (ev) {
        if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); self.onPick(m, i); }
      });
      self.gMarks.appendChild(g);
    });
  };

  MiniMap.prototype._viewBox = function () {
    var ox = this.cx - this.W / 2, oy = this.cy - this.H / 2;
    this.svg.setAttribute('viewBox', ox + ' ' + oy + ' ' + this.W + ' ' + this.H);
  };

  MiniMap.prototype._pan = function () {
    var ox = this.cx - this.W / 2, oy = this.cy - this.H / 2;
    this.tileLayer.style.transform =
      'translate3d(' + (this.renderOX - ox) + 'px,' + (this.renderOY - oy) + 'px,0)';
    this._viewBox();
  };

  MiniMap.prototype.zoomAt = function (dz, px, py) {
    var nz = Math.max(this.minZoom, Math.min(this.maxZoom, this.z + dz));
    if (nz === this.z) { return; }
    var ox = this.cx - this.W / 2, oy = this.cy - this.H / 2;
    var ll = unproject(ox + px, oy + py, this.z);
    this.z = nz;
    var q = project(ll[0], ll[1], nz);
    this.cx = q[0] - px + this.W / 2;
    this.cy = q[1] - py + this.H / 2;
    this.render();
  };

  /* ---------- gestes et commandes ---------- */

  MiniMap.prototype.closeMenu = function () {
    this.menu.hidden = true;
    var b = this.ctrl.querySelector('[data-mm="layer"]');
    if (b) { b.setAttribute('aria-expanded', 'false'); }
  };

  MiniMap.prototype._bind = function () {
    var self = this;
    var mode = null, last = null, pinch = null, tapT = 0, tapX = 0, tapY = 0, moved = 0;

    function local(ev) {
      var r = self.box.getBoundingClientRect();
      return [ev.clientX - r.left, ev.clientY - r.top];
    }
    function inChrome(ev) {
      return ev.target.closest && ev.target.closest('.mm-ctrl, .mm-attrib, .mm-styles');
    }

    this.box.addEventListener('pointerdown', function (ev) {
      if (inChrome(ev)) { return; }
      self.closeMenu();
      self.box.setPointerCapture(ev.pointerId);
      self.pointers[ev.pointerId] = local(ev);
      var ids = Object.keys(self.pointers);
      if (ids.length === 1) {
        mode = 'pan'; last = self.pointers[ev.pointerId]; moved = 0;
      } else if (ids.length === 2) {
        var a = self.pointers[ids[0]], b = self.pointers[ids[1]];
        pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), mx: (a[0] + b[0]) / 2, my: (a[1] + b[1]) / 2, s: 1 };
        mode = 'pinch';
        self.inner.style.transformOrigin = pinch.mx + 'px ' + pinch.my + 'px';
      }
    });

    this.box.addEventListener('pointermove', function (ev) {
      if (!self.pointers[ev.pointerId]) { return; }
      self.pointers[ev.pointerId] = local(ev);
      if (mode === 'pan') {
        var p = self.pointers[ev.pointerId];
        var dx = p[0] - last[0], dy = p[1] - last[1];
        moved += Math.abs(dx) + Math.abs(dy);
        self.cx -= dx; self.cy -= dy;
        last = p;
        self._pan();
      } else if (mode === 'pinch') {
        var ids = Object.keys(self.pointers);
        if (ids.length < 2) { return; }
        var a = self.pointers[ids[0]], b = self.pointers[ids[1]];
        var d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        pinch.s = Math.max(0.4, Math.min(3.2, d / pinch.d));
        self.inner.style.transform = 'scale(' + pinch.s + ')';
      }
    });

    function end(ev) {
      if (!self.pointers[ev.pointerId]) { return; }
      delete self.pointers[ev.pointerId];
      var ids = Object.keys(self.pointers);

      if (mode === 'pinch' && ids.length < 2) {
        var dz = Math.round(Math.log(pinch.s) / Math.LN2);
        self.inner.style.transform = '';
        mode = null;
        if (dz) { self.zoomAt(dz, pinch.mx, pinch.my); } else { self.render(); }
        return;
      }

      if (mode === 'pan' && ids.length === 0) {
        mode = null;
        var p = local(ev), now = Date.now();
        if (moved < 12) {
          if (now - tapT < 300 && Math.hypot(p[0] - tapX, p[1] - tapY) < 32) {
            tapT = 0;
            self.zoomAt(1, p[0], p[1]);
            return;
          }
          tapT = now; tapX = p[0]; tapY = p[1];
        }
        self.render();
      }
    }

    this.box.addEventListener('pointerup', end);
    this.box.addEventListener('pointercancel', end);

    this.box.addEventListener('wheel', function (ev) {
      ev.preventDefault();
      var p = local(ev);
      self.zoomAt(ev.deltaY < 0 ? 1 : -1, p[0], p[1]);
    }, { passive: false });

    this.ctrl.addEventListener('click', function (ev) {
      var b = ev.target.closest('button');
      if (!b) { return; }
      var a = b.dataset.mm;
      if (a === 'in') { self.closeMenu(); self.zoomAt(1, self.W / 2, self.H / 2); }
      if (a === 'out') { self.closeMenu(); self.zoomAt(-1, self.W / 2, self.H / 2); }
      if (a === 'fit') { self.closeMenu(); self.fit(); }
      if (a === 'full') { self.closeMenu(); self.onFull(); }
      if (a === 'layer') {
        self.menu.hidden = !self.menu.hidden;
        b.setAttribute('aria-expanded', String(!self.menu.hidden));
      }
    });

    this.menu.addEventListener('click', function (ev) {
      var b = ev.target.closest('button');
      if (!b) { return; }
      self.setStyle(b.dataset.style);
      self.closeMenu();
      if (self.onStyle) { self.onStyle(b.dataset.style); }
    });

    var t = null;
    window.addEventListener('resize', function () {
      clearTimeout(t);
      t = setTimeout(function () { self.render(); }, 150);
    });
  };

  MiniMap.prototype.styles = function () { return STYLES; };

  global.MiniMap = MiniMap;
})(window);
