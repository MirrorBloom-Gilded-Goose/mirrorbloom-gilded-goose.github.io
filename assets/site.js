/* ==========================================================================
   MIRRORBLOOM — site frame
   Builds the header, contents menu and footer for every page, runs the
   mirror crossing (theme change), the moons, and unseals redacted text
   when the vault is open.

   EDIT HERE to change the menu or the Royal Road link for the whole site.
   ========================================================================== */
(function () {
  var CONFIG = {
    royalRoad: 'https://www.royalroad.com/fictions/search?title=Tales+of+the+Gilded+Goose',
    nav: [
      { key: 'cosmology', label: 'Cosmology', href: 'cosmology.html' },
      { key: 'magic', label: 'Magic', href: 'magic.html' },
      { key: 'world', label: 'World', href: 'world.html' },
      { key: 'map', label: 'Map', href: 'map.html' },
      { key: 'timeline', label: 'Timeline', href: 'timeline.html' },
      { key: 'guild', label: 'Gilded Goose', href: 'gilded-goose.html' },
      { key: 'library', label: 'Library', href: 'lore.html' }
    ],
    contents: [
      { part: 'The Mirror', note: 'How the world is built', items: [
        ['Cosmology', 'cosmology.html'], ['The Archfey', 'cosmology.html#archfey'], ['Courts & Realms', 'courts.html'],
        ['Magic', 'magic.html'], ['The Sleeping Meadows', 'meadow.html'], ['The Knowledge Iceberg', 'iceberg.html'], ['Timeline', 'timeline.html'] ] },
      { part: 'The World', note: 'Nations, roads and orders', items: [
        ['The Thirteen Nations', 'world.html'], ['The Map', 'map.html'], ['The Shining Everlast', 'empires.html'],
        ['Life in the Everlast', 'everlast.html'], ['The Kenanism Empire', 'kenanism.html'], ['The Yenfin Empire', 'yenfin.html'],
        ['Roads, Skies & Tunnels', 'travel.html'], ['Orders & Institutions', 'orders.html'] ] },
      { part: 'The Gilded Goose', note: 'The guild and the serial', items: [
        ['The Guild', 'gilded-goose.html'], ['Crockett', 'crockett.html'], ['Cherry', 'cherry.html'], ['Will', 'will.html'],
        ['Tom', 'tom.html'], ['Sansa', 'sansa.html'], ['Tales of the Gilded Goose', 'serial.html'], ['Read the chapters', 'chapters.html'] ] },
      { part: 'The Library', note: 'Everything gathered', items: [
        ['The Library', 'lore.html'], ['The Compendium', 'compendium.html'] ] },
      { part: 'The Sanctum', note: 'Sealed — for the Dungeon Master', sealed: true, items: [
        ['Sanctum', 'sanctum.html'], ['Stat blocks', 'sanctum.html#statblocks'], ['Bestiary', 'sanctum.html#bestiary'],
        ['Adventures', 'sanctum.html#adventures'], ['Secret lore', 'sanctum.html#secrets'], ['Table tools', 'sanctum.html#tools'],
        ['Vault editor', 'vault-editor.html'] ] }
    ]
  };
  window.MB_CONFIG = CONFIG;

  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function isAbove() { return root.getAttribute('data-theme') === 'solance'; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var here = (location.pathname.split('/').pop() || 'index.html');

  var ICON = {
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.3M12 19.2v2.3M2.5 12h2.3M19.2 12h2.3M5.3 5.3l1.6 1.6M17.1 17.1l1.6 1.6M5.3 18.7l1.6-1.6M17.1 6.9l1.6-1.6"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M19.5 14.6A8 8 0 0 1 9.4 4.5a8 8 0 1 0 10.1 10.1Z"/></svg>',
    mirror: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><ellipse cx="12" cy="8.6" rx="5.6" ry="6.6"/><path d="M12 15.2v6.3M9.6 21.5h4.8M9.4 6.2c.6-1.1 1.6-1.8 2.8-2"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    wax: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2.2c1.4 0 2 .9 3 1.3 1.1.4 2.3.1 3.1 1 .8.8.6 2 1 3.1.4 1 1.3 1.6 1.3 3s-.9 2-1.3 3c-.4 1.1-.1 2.3-1 3.1-.8.8-2 .6-3.1 1-1 .4-1.6 1.3-3 1.3s-2-.9-3-1.3c-1.1-.4-2.3-.1-3.1-1-.8-.8-.6-2-1-3.1-.4-1-1.3-1.6-1.3-3s.9-2 1.3-3c.4-1.1.1-2.3 1-3.1.8-.8 2-.6 3.1-1 1-.4 1.6-1.3 3-1.3Z"/><path fill="none" stroke="var(--bg)" stroke-width="1.3" stroke-linecap="round" d="M12 7.2v9.6M7.8 9.6l8.4 4.8M16.2 9.6l-8.4 4.8"/></svg>'
  };

  /* ---------- header ---------- */
  function buildHeader() {
    var host = document.getElementById('site-header');
    if (!host) { host = document.createElement('header'); host.id = 'site-header'; document.body.insertBefore(host, document.body.firstChild); }
    var section = document.body.getAttribute('data-section') || '';
    var nav = CONFIG.nav.map(function (n) {
      var cur = (n.key === section) ? ' class="is-here"' : '';
      var aria = (n.href === here) ? ' aria-current="page"' : '';
      return '<a href="' + n.href + '"' + cur + aria + '>' + esc(n.label) + '</a>';
    }).join('') + '<a class="nav-sanctum' + (section === 'sanctum' ? ' is-here' : '') + '" href="sanctum.html">Sanctum</a>';

    host.innerHTML =
      '<a class="skip" href="#main">Skip to content</a>' +
      '<div class="bar">' +
        '<a class="wordmark" href="index.html" aria-label="MirrorBloom, home"><span class="w-top">MirrorBloom</span><span class="w-ref" aria-hidden="true"><span>MirrorBloom</span></span></a>' +
        '<nav class="nav" aria-label="Main">' + nav + '</nav>' +
        '<div class="tools">' +
          '<button class="icon-btn mirror-btn" type="button"></button>' +
          '<a class="icon-btn key-btn" href="mirror.html" data-state="closed">' + ICON.mirror + '</a>' +
          '<button class="icon-btn menu-btn" type="button" aria-expanded="false" aria-controls="contents">Contents</button>' +
        '</div>' +
      '</div>';

    var main = document.getElementById('main');
    if (main && !main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');

    paintMirrorButton();
    host.querySelector('.mirror-btn').addEventListener('click', cross);
    paintKey();
    host.querySelector('.menu-btn').addEventListener('click', function () { toggleContents(true); });
  }

  function paintMirrorButton() {
    var b = document.querySelector('.mirror-btn'); if (!b) return;
    var above = isAbove();
    b.innerHTML = above ? ICON.moon : ICON.sun;
    var label = above ? 'Cross below the mirror to Umbrasol' : 'Cross above the mirror to Solance';
    b.setAttribute('aria-label', label); b.title = label;
  }

  function paintKey() {
    var k = document.querySelector('.key-btn'); if (!k) return;
    var open = root.classList.contains('unlocked');
    k.setAttribute('data-state', open ? 'open' : 'closed');
    if (open) { k.href = 'sanctum.html'; k.setAttribute('aria-label', 'Go to the Sanctum'); k.title = 'Sanctum'; }
    else {
      k.href = 'mirror.html?next=' + encodeURIComponent(here + location.hash);
      k.setAttribute('aria-label', 'Speak to the mirror (Dungeon Master sign in)'); k.title = 'Speak to the mirror';
    }
  }

  /* ---------- contents overlay ---------- */
  var contentsEl = null, lastFocus = null;
  function buildContents() {
    contentsEl = document.createElement('div');
    contentsEl.className = 'contents'; contentsEl.id = 'contents';
    contentsEl.setAttribute('role', 'dialog'); contentsEl.setAttribute('aria-modal', 'true'); contentsEl.setAttribute('aria-label', 'Contents');
    var html = '<button class="icon-btn contents-close" type="button" aria-label="Close contents">' + ICON.close + '</button><div class="contents-inner">';
    CONFIG.contents.forEach(function (part) {
      html += '<section' + (part.sealed ? ' class="sealed-part"' : '') + '><h2>' + esc(part.part) + '<small>' + esc(part.note) + '</small></h2><ol>';
      part.items.forEach(function (it) { html += '<li><a href="' + it[1] + '">' + esc(it[0]) + '</a></li>'; });
      html += '</ol></section>';
    });
    contentsEl.innerHTML = html + '</div>';
    document.body.appendChild(contentsEl);
    contentsEl.querySelector('.contents-close').addEventListener('click', function () { toggleContents(false); });
    contentsEl.addEventListener('click', function (e) {
      if (e.target === contentsEl) toggleContents(false);
      if (e.target.closest('a')) toggleContents(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && contentsEl.classList.contains('open')) toggleContents(false);
      if (e.key === 'Tab' && contentsEl.classList.contains('open')) {
        var f = contentsEl.querySelectorAll('a, button'); var vis = Array.prototype.filter.call(f, function (x) { return x.offsetParent !== null; });
        if (!vis.length) return;
        if (e.shiftKey && document.activeElement === vis[0]) { e.preventDefault(); vis[vis.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === vis[vis.length - 1]) { e.preventDefault(); vis[0].focus(); }
      }
    });
  }
  function toggleContents(open) {
    if (!contentsEl) return;
    var btn = document.querySelector('.menu-btn');
    contentsEl.classList.toggle('open', open);
    if (btn) btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) { lastFocus = document.activeElement; setTimeout(function () { contentsEl.querySelector('.contents-close').focus(); }, 30); }
    else if (lastFocus) lastFocus.focus();
  }

  /* ---------- footer ---------- */
  function buildFooter() {
    var f = document.createElement('footer');
    f.className = 'site-foot';
    f.innerHTML = '<div class="wrap"><p>MirrorBloom is a living homebrew world for D&amp;D 5e and the home of <a href="serial.html">Tales of the Gilded Goose</a>.</p>' +
      '<p><a data-rr href="' + CONFIG.royalRoad + '">Read on Royal Road</a></p></div>';
    document.body.appendChild(f);
    document.querySelectorAll('[data-rr]').forEach(function (a) { a.href = CONFIG.royalRoad; });
  }

  /* ---------- the sky: moons below, motes above ---------- */
  function buildSky() {
    var sky = document.createElement('div');
    sky.className = 'sky'; sky.setAttribute('aria-hidden', 'true');
    sky.innerHTML = '<div class="moons"><span class="moon a"></span><span class="moon b"></span></div><canvas class="motes"></canvas>';
    document.body.insertBefore(sky, document.body.firstChild);
    if (reduce) return;

    /* Despair's eyes: the two moons watch the pointer. */
    var moons = sky.querySelector('.moons'), ms = sky.querySelectorAll('.moon');
    var raf = 0, px = innerWidth / 2, py = innerHeight / 2;
    addEventListener('pointermove', function (e) {
      px = e.clientX; py = e.clientY;
      if (!raf) raf = requestAnimationFrame(function () {
        raf = 0; if (isAbove()) return;
        ms.forEach(function (m) {
          var r = m.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          var dx = px - cx, dy = py - cy, d = Math.hypot(dx, dy) || 1, lim = r.width * 0.22;
          m.style.setProperty('--lx', (dx / d * Math.min(lim, d / 30)).toFixed(1) + 'px');
          m.style.setProperty('--ly', (dy / d * Math.min(lim * 0.6, d / 40)).toFixed(1) + 'px');
        });
      });
    }, { passive: true });
    (function blink() {
      setTimeout(function () { if (!isAbove() && !document.hidden) { moons.classList.add('blink'); setTimeout(function () { moons.classList.remove('blink'); }, 220); } blink(); }, 7000 + Math.random() * 14000);
    })();

    /* Solance: a few drifting motes of morning light. */
    var cv = sky.querySelector('.motes'), ctx = cv.getContext('2d'), dots = [], running = false, dpr = Math.min(2, window.devicePixelRatio || 1);
    function size() { cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cv.style.width = innerWidth + 'px'; cv.style.height = innerHeight + 'px'; }
    size(); addEventListener('resize', size);
    for (var i = 0; i < 26; i++) dots.push({ x: Math.random(), y: Math.random(), r: 0.8 + Math.random() * 2.2, s: 0.00006 + Math.random() * 0.00012, p: Math.random() * 6.28 });
    function frame(t) {
      if (!isAbove() || document.hidden) { running = false; ctx.clearRect(0, 0, cv.width, cv.height); return; }
      ctx.clearRect(0, 0, cv.width, cv.height);
      dots.forEach(function (d) {
        d.y -= d.s * 16; if (d.y < -0.05) { d.y = 1.05; d.x = Math.random(); }
        var x = (d.x + Math.sin(t / 3000 + d.p) * 0.012) * cv.width, y = d.y * cv.height;
        var a = 0.25 + 0.25 * Math.sin(t / 900 + d.p);
        ctx.beginPath(); ctx.fillStyle = 'rgba(214,160,60,' + a.toFixed(3) + ')'; ctx.arc(x, y, d.r * dpr, 0, 6.283); ctx.fill();
      });
      requestAnimationFrame(frame);
    }
    function start() { if (!running && isAbove()) { running = true; requestAnimationFrame(frame); } }
    start();
    document.addEventListener('visibilitychange', start);
    root.addEventListener('mb:crossed', start);
  }

  /* ---------- crossing the mirror ---------- */
  function setWorld(above) {
    if (above) root.setAttribute('data-theme', 'solance'); else root.removeAttribute('data-theme');
    try { localStorage.setItem('mb-theme', above ? 'solance' : 'umbrasol'); } catch (e) {}
    paintMirrorButton();
    root.dispatchEvent(new CustomEvent('mb:crossed', { detail: { above: above } }));
  }
  function ripples(x, y, color) {
    if (reduce) return;
    var R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) * 2;
    var layer = document.createElement('div'); layer.className = 'ripple-layer';
    layer.style.setProperty('--ripple', color);
    for (var i = 0; i < 3; i++) { var r = document.createElement('i'); r.style.left = x + 'px'; r.style.top = y + 'px'; r.style.width = r.style.height = R + 'px'; layer.appendChild(r); }
    document.body.appendChild(layer);
    setTimeout(function () { layer.remove(); }, 1700);
  }
  function cross(e) {
    var btn = e.currentTarget, r = btn.getBoundingClientRect();
    var x = r.left + r.width / 2, y = r.top + r.height / 2, goingUp = !isAbove();
    var R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    ripples(x, y, goingUp ? 'rgba(217,169,91,.75)' : 'rgba(207,74,88,.75)');
    if (document.startViewTransition && !reduce) {
      var t = document.startViewTransition(function () { setWorld(goingUp); });
      t.ready.then(function () {
        root.animate({ clipPath: ['circle(0px at ' + x + 'px ' + y + 'px)', 'circle(' + R + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 950, easing: 'cubic-bezier(.3,.6,.15,1)', pseudoElement: '::view-transition-new(root)' });
      }).catch(function () {});
    } else setWorld(goingUp);
  }

  /* ---------- sealed text ---------- */
  function renderSeals() {
    document.querySelectorAll('.seal[data-seal]').forEach(function (s) {
      if (s.dataset.done) return;
      var n = parseInt(s.dataset.len || '60', 10), filler = '';
      while (filler.length < n) filler += 'sealed ';
      s.innerHTML = '<span class="seal-bars" title="Sealed. Known only below the surface.">' + filler.slice(0, n) + '</span><span class="visually-hidden">(sealed text)</span>';
    });
    document.querySelectorAll('.seal-block[data-seal]').forEach(function (b) {
      if (b.dataset.done) return;
      var lines = parseInt(b.dataset.lines || '3', 10), bars = '';
      for (var i = 0; i < lines; i++) bars += '<i style="width:' + (i === lines - 1 ? 35 + Math.round(Math.random() * 30) : 82 + Math.round(Math.random() * 18)) + '%"></i>';
      var label = b.dataset.label || 'Sealed record.';
      b.innerHTML = '<p class="seal-label">' + ICON.wax.replace('<svg', '<svg class="wax"') + '<span>' + esc(label) + ' <a href="mirror.html?next=' + encodeURIComponent(here + location.hash) + '">Open it at the mirror</a>.</span></p><div class="bars" aria-hidden="true">' + bars + '</div>';
    });
  }
  function unseal(vault) {
    var snips = (vault && vault.snippets) || {};
    document.querySelectorAll('.seal[data-seal]').forEach(function (s) {
      var html = snips[s.dataset.seal]; if (html == null) return;
      s.innerHTML = '<span class="unsealed">' + html + '</span>'; s.dataset.done = '1'; s.classList.add('is-open');
    });
    document.querySelectorAll('.seal-block[data-seal]').forEach(function (b) {
      var html = snips[b.dataset.seal]; if (html == null) return;
      var label = b.dataset.openLabel || 'Sealed record, opened.';
      b.innerHTML = '<p class="seal-label">' + ICON.wax.replace('<svg', '<svg class="wax"') + '<span>' + esc(label) + '</span></p><div class="unsealed">' + html + '</div>';
      b.classList.add('unsealed-block'); b.dataset.done = '1';
    });
    root.dispatchEvent(new CustomEvent('mb:unsealed', { detail: vault }));
  }

  /* pages that only make sense with the key */
  function guard() {
    if (!document.body.hasAttribute('data-sealed-page')) return false;
    if (!window.MBVault || !MBVault.hasKey()) {
      location.replace('mirror.html?next=' + encodeURIComponent(here + location.hash));
      return true;
    }
    return false;
  }

  function init() {
    if (guard()) return;
    if (reduce) document.querySelectorAll('animate').forEach(function (a) { a.remove(); });
    buildSky();
    buildHeader();
    buildContents();
    buildFooter();
    renderSeals();
    var ready;
    if (window.MBVault && MBVault.hasKey()) {
      ready = MBVault.load().then(function (v) {
        paintKey();
        if (v) unseal(v);
        else if (document.body.hasAttribute('data-sealed-page')) location.replace('mirror.html?next=' + encodeURIComponent(here + location.hash));
        return v;
      });
    } else ready = Promise.resolve(null);
    resolveReady(ready);
    ready.then(function (v) { root.dispatchEvent(new CustomEvent('mb:vault', { detail: v })); });
  }

  /* MBSite.vaultReady resolves with the opened vault, or null when locked. Use it instead of listening for events. */
  var resolveReady; var vaultReady = new Promise(function (r) { resolveReady = function (p) { p.then(r, function () { r(null); }); }; });

  window.MBSite = { esc: esc, icon: ICON, renderSeals: renderSeals, unseal: unseal, config: CONFIG, vaultReady: vaultReady };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
