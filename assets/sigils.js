/* ==========================================================================
   MIRRORBLOOM — sigils
   One emblem per god and Archfey aspect, drawn in line so they take the
   color of whichever world you are standing in. Each shadow aspect is its
   bright twin reflected across the waterline and spoiled on the way down.

   Use in a page:  <span data-sigil="dawnward_king"></span>
   Add data-draw to have it ink itself in when the page opens.
   ========================================================================== */
(function () {
  function P(n) { return Math.round(n * 10) / 10; }
  function rays(cx, cy, r1, r2, from, to, count, extra) {
    var out = '';
    for (var i = 0; i < count; i++) {
      var a = (from + (to - from) * (count === 1 ? 0.5 : i / (count - 1))) * Math.PI / 180;
      out += '<line x1="' + P(cx + Math.cos(a) * r1) + '" y1="' + P(cy + Math.sin(a) * r1) + '" x2="' + P(cx + Math.cos(a) * r2) + '" y2="' + P(cy + Math.sin(a) * r2) + '"' + (extra || '') + '/>';
    }
    return out;
  }
  function ring(cx, cy, r1, r2, count, offset) {
    var out = '';
    for (var i = 0; i < count; i++) {
      var a = (offset + 360 * i / count) * Math.PI / 180;
      out += '<line x1="' + P(cx + Math.cos(a) * r1) + '" y1="' + P(cy + Math.sin(a) * r1) + '" x2="' + P(cx + Math.cos(a) * r2) + '" y2="' + P(cy + Math.sin(a) * r2) + '"/>';
    }
    return out;
  }
  function eye(x, y, w, h, rot) {
    var t = rot ? ' transform="rotate(' + rot + ' ' + x + ' ' + y + ')"' : '';
    return '<g' + t + '><path d="M' + P(x - w) + ' ' + y + ' Q' + x + ' ' + P(y - h) + ' ' + P(x + w) + ' ' + y + ' Q' + x + ' ' + P(y + h) + ' ' + P(x - w) + ' ' + y + 'Z"/><circle cx="' + x + '" cy="' + y + '" r="' + P(h * 0.42) + '" fill="currentColor" stroke="none"/></g>';
  }
  function star(x, y, r) {
    return '<path d="M' + x + ' ' + P(y - r) + ' Q' + P(x + r * 0.18) + ' ' + P(y - r * 0.18) + ' ' + P(x + r) + ' ' + y + ' Q' + P(x + r * 0.18) + ' ' + P(y + r * 0.18) + ' ' + x + ' ' + P(y + r) + ' Q' + P(x - r * 0.18) + ' ' + P(y + r * 0.18) + ' ' + P(x - r) + ' ' + y + ' Q' + P(x - r * 0.18) + ' ' + P(y - r * 0.18) + ' ' + x + ' ' + P(y - r) + 'Z" fill="currentColor" stroke="none"/>';
  }
  function petal(cx, cy, len, wid, ang) {
    return '<path d="M' + cx + ' ' + cy + ' C' + P(cx - wid) + ' ' + P(cy - len * 0.35) + ' ' + P(cx - wid * 0.6) + ' ' + P(cy - len) + ' ' + cx + ' ' + P(cy - len) + ' C' + P(cx + wid * 0.6) + ' ' + P(cy - len) + ' ' + P(cx + wid) + ' ' + P(cy - len * 0.35) + ' ' + cx + ' ' + cy + 'Z" transform="rotate(' + ang + ' ' + cx + ' ' + cy + ')"/>';
  }

  var S = {};

  /* ---- the two gods ---- */
  S.great_hope = '<circle cx="60" cy="60" r="21"/><circle cx="60" cy="60" r="7" fill="currentColor" stroke="none" opacity=".85"/>' +
    ring(60, 60, 28, 45, 8, -90) + ring(60, 60, 28, 37, 8, -67.5) +
    '<circle cx="60" cy="60" r="52" stroke-dasharray="1.5 6" opacity=".8"/>';
  S.great_despair = '<circle cx="60" cy="64" r="27" fill="currentColor" fill-opacity=".14"/>' +
    eye(60, 52, 6, 3.4) + eye(48, 62, 5, 2.8, -12) + eye(72, 62, 5, 2.8, 12) + eye(52, 76, 4.2, 2.4, -6) + eye(68, 76, 4.2, 2.4, 8) + eye(60, 66, 3.6, 2) +
    '<path d="M33 31 L38 14 L45 27 L51 20 L56 27 L60 9 L64 27 L68 23 L72 27 L78 17 L82 24 L87 31" stroke-linejoin="miter"/><path d="M33 31 H87"/>' +
    '<path d="M28 98 l6 -9 M92 98 l-6 -9 M60 108 v-10 M20 70 h9 M100 70 h-9"/>';

  /* ---- Dawnward / Duskward: first light, last light ---- */
  S.dawnward_king = '<path d="M14 76 H106"/><path d="M38 76 A22 22 0 0 1 82 76"/>' +
    rays(60, 76, 29, 45, -160, -20, 7) + star(60, 17, 6) + '<path d="M30 88 H90 M44 98 H76" opacity=".55"/>';
  S.duskward_king = '<path d="M14 44 H106"/><path d="M38 44 A22 22 0 0 0 82 44"/>' +
    rays(60, 44, 29, 41, 20, 160, 7) +
    (function () { var o = ''; for (var i = 0; i < 7; i++) { var a = (20 + 140 * i / 6) * Math.PI / 180; o += '<circle cx="' + P(60 + Math.cos(a) * 45) + '" cy="' + P(44 + Math.sin(a) * 45) + '" r="1.6" fill="currentColor" stroke="none"/>'; } return o; })() +
    '<path d="M40 14 V32 M47 14 V32 M54 14 V32 M61 14 V32 M36 30 L65 16"/><path d="M74 16 V32 M81 16 V32" opacity=".5"/>';

  /* ---- Verdant / Bloated: the garden and what growth becomes ---- */
  S.verdant_lady = '<path d="M60 110 V64"/><path d="M60 96 C46 96 36 88 33 76 C47 75 57 84 60 96Z"/><path d="M60 84 C74 84 84 76 87 64 C73 63 63 72 60 84Z"/>' +
    petal(60, 40, 27, 14, 0) + petal(60, 40, 27, 14, 72) + petal(60, 40, 27, 14, 144) + petal(60, 40, 27, 14, 216) + petal(60, 40, 27, 14, 288) +
    '<circle cx="60" cy="40" r="6" fill="currentColor" stroke="none"/>';
  S.bloated_lady = '<g transform="translate(0 118) scale(1 -1)"><path d="M60 110 V64"/><path d="M60 96 C44 97 33 88 30 74 C46 73 57 83 60 96Z"/><path d="M60 86 C76 86 88 77 90 62 C74 62 63 71 60 86Z"/>' +
    '<g fill="currentColor" fill-opacity=".16">' + petal(60, 40, 30, 19, 0) + petal(60, 40, 25, 15, 68) + petal(60, 40, 33, 20, 140) + petal(60, 40, 22, 14, 214) + petal(60, 40, 29, 18, 290) + '</g>' +
    '<circle cx="60" cy="40" r="8" fill="currentColor" fill-opacity=".5"/></g>' +
    '<circle cx="47" cy="88" r="2.4" fill="currentColor" stroke="none"/><circle cx="74" cy="70" r="2" fill="currentColor" stroke="none"/><circle cx="69" cy="95" r="1.6" fill="currentColor" stroke="none"/><circle cx="40" cy="70" r="1.6" fill="currentColor" stroke="none"/>' +
    '<path d="M52 106 V112 M78 100 V107"/><circle cx="52" cy="115.5" r="1.7" fill="currentColor" stroke="none"/><circle cx="78" cy="110.5" r="1.5" fill="currentColor" stroke="none"/>';

  /* ---- Revel / Mocking: the borrowed face and the face that cannot move ---- */
  S.revel_king = '<path d="M30 62 Q30 40 16 30 Q38 30 46 52 Q52 32 60 16 Q68 32 74 52 Q82 30 104 30 Q90 40 90 62 Z"/>' +
    '<circle cx="16" cy="28" r="4"/><circle cx="60" cy="13" r="4"/><circle cx="104" cy="28" r="4"/>' +
    '<path d="M30 70 Q60 62 90 70 Q88 84 72 84 Q64 84 60 78 Q56 84 48 84 Q32 84 30 70Z"/>' +
    '<path d="M38 74 Q44 70 50 74 Q44 78 38 74Z M70 74 Q76 70 82 74 Q76 78 70 74Z" fill="currentColor" stroke="none"/>' +
    '<path d="M44 96 Q60 108 76 96"/>';
  S.mocking_king = '<path d="M30 58 Q30 80 16 90 Q38 90 46 68 Q52 88 60 104 Q68 88 74 68 Q82 90 104 90 Q90 80 90 58 Z"/>' +
    '<circle cx="16" cy="92" r="4"/><circle cx="60" cy="107" r="4"/><circle cx="104" cy="92" r="4"/>' +
    '<path d="M30 50 Q60 58 90 50 Q88 36 72 36 Q64 36 60 42 Q56 36 48 36 Q32 36 30 50Z" fill="currentColor" fill-opacity=".15"/>' +
    '<path d="M39 44 H50 M70 44 H81"/>' +
    '<path d="M36 22 Q60 30 84 22"/><path d="M42 18 L46 28 M50 20 L53 30 M58 21 L60 31 M66 21 L66 31 M74 20 L72 30 M80 18 L77 27"/>';

  /* ---- Dreaming / Waking: the shape sleep takes and the eyes that will not close ---- */
  S.lady_of_dreaming = '<path d="M68 22.8 A38 38 0 1 0 68 97.2 A44 44 0 0 1 68 22.8Z" fill="currentColor" fill-opacity=".14"/>' +
    star(84, 36, 7) + star(96, 58, 4.5) + star(82, 80, 5.5) +
    '<path d="M36 60 Q36 48 46 48 Q54 48 54 56 Q54 62 48 62 Q44 62 44 58" opacity=".7"/>';
  S.lady_of_waking = '<path d="M52 22.8 A38 38 0 1 1 52 97.2 A44 44 0 0 0 52 22.8Z" fill="currentColor" fill-opacity=".14"/>' +
    eye(80, 38, 6, 3.6, -10) + eye(88, 60, 5, 3, 6) + eye(78, 82, 5.5, 3.2, 12) + eye(64, 58, 3.4, 2) + eye(28, 34, 4, 2.4, -14) + eye(20, 62, 4.6, 2.6, 4) + eye(34, 92, 3.4, 2, 16);

  /* ---- Hearthkeeper / Hollow Host: the open door and the same warm welcome ---- */
  S.hearthkeeper = '<path d="M26 102 H94"/><path d="M38 102 V56 A22 22 0 0 1 82 56 V102"/>' +
    '<path d="M82 102 L99 96 V54 L82 56" opacity=".75"/>' +
    '<path d="M60 64 C67 73 71 80 66 90 C64 95 56 95 54 90 C49 80 53 73 60 64Z" fill="currentColor" fill-opacity=".25"/>' +
    '<path d="M60 78 C63 82 63 86 60 89 C57 86 57 82 60 78Z" fill="currentColor" stroke="none"/>' +
    '<path d="M60 22 V30 M46 26 L49 32 M74 26 L71 32" opacity=".6"/>';
  S.hollow_host = '<path d="M26 18 H94"/><path d="M38 18 V64 A22 22 0 0 0 82 64 V18Z" fill="currentColor" fill-opacity=".2"/>' +
    '<path d="M82 18 L99 24 V66 L82 64" opacity=".75"/>' +
    '<path d="M41 62 l4 -5 l3 6 l4 -5 l3 6 l5 -6 l5 6 l3 -6 l4 5 l3 -6 l4 5" stroke-linejoin="miter"/>' +
    '<ellipse cx="60" cy="38" rx="12" ry="4"/><path d="M42 30 V44 M78 30 V44 M74 30 V36 M82 30 V36"/>' +
    '<path d="M60 98 V90 M46 94 L49 88 M74 94 L71 88" opacity=".6"/>';

  /* ---- Hunter / Stalking: the fair chase and the chase that never ends ---- */
  S.hunter_king = '<circle cx="60" cy="64" r="11"/>' +
    '<path d="M53 55 C45 41 40 31 26 22 M41 37 L28 40 M35 30 L37 15 M33 28 L18 24"/>' +
    '<path d="M67 55 C75 41 80 31 94 22 M79 37 L92 40 M85 30 L83 15 M87 28 L102 24"/>' +
    '<path d="M14 90 H104"/><path d="M104 90 L95 84.5 M104 90 L95 95.5"/><path d="M14 90 L9 84.5 M14 90 L9 95.5 M21 90 L16 84.5 M21 90 L16 95.5"/>';
  S.stalking_king = '<circle cx="60" cy="54" r="11" fill="currentColor" fill-opacity=".35"/>' +
    '<circle cx="56" cy="54" r="1.8" fill="currentColor" stroke="none"/><circle cx="64" cy="54" r="1.8" fill="currentColor" stroke="none"/>' +
    '<path d="M54 62 C48 74 44 82 34 90 M44 80 L34 78 M40 86 L41 94 M38 87 L29 91"/>' +
    '<path d="M66 62 C72 74 76 82 86 90 M76 80 L86 78 M80 86 L79 95 M82 87 L91 90"/>' +
    '<path d="M60 22 C84 22 98 36 98 54 C98 72 84 82 70 80" /><path d="M70 80 L77 76 M70 80 L76 86"/>' +
    '<path d="M60 22 C40 22 26 32 22 46" stroke-dasharray="2 5"/>';

  var INFO = {
    great_hope:       { name: 'The Great Hope', epithet: 'She Who Does Not Know', twin: 'great_despair', above: true },
    great_despair:    { name: 'The Great Despair', epithet: 'The Uncrowned Queen', twin: 'great_hope', above: false },
    dawnward_king:    { name: 'The Dawnward King', epithet: 'First Light', twin: 'duskward_king', above: true },
    duskward_king:    { name: 'The Duskward King', epithet: 'Last Light', twin: 'dawnward_king', above: false },
    verdant_lady:     { name: 'The Verdant Lady', epithet: 'The Garden Unbroken', twin: 'bloated_lady', above: true },
    bloated_lady:     { name: 'The Bloated Lady', epithet: 'What Growth Becomes', twin: 'verdant_lady', above: false },
    revel_king:       { name: 'The Revel King', epithet: 'A Thousand Faces, Each One Borrowed', twin: 'mocking_king', above: true },
    mocking_king:     { name: 'The Mocking King', epithet: 'The Smile That Cannot Move', twin: 'revel_king', above: false },
    lady_of_dreaming: { name: 'The Lady of Dreaming', epithet: 'The Shape Sleep Takes', twin: 'lady_of_waking', above: true },
    lady_of_waking:   { name: 'The Lady of Waking', epithet: 'The Eyes That Will Not Close', twin: 'lady_of_dreaming', above: false },
    hearthkeeper:     { name: 'The Hearthkeeper', epithet: 'The Open Door', twin: 'hollow_host', above: true },
    hollow_host:      { name: 'The Hollow Host', epithet: 'The Same Warm Welcome', twin: 'hearthkeeper', above: false },
    hunter_king:      { name: 'The Hunter King', epithet: 'The Fair Chase', twin: 'stalking_king', above: true },
    stalking_king:    { name: 'The Stalking King', epithet: 'The Chase That Never Ends', twin: 'hunter_king', above: false }
  };

  function svg(id, cls) {
    var body = S[id]; if (!body) return '';
    return '<svg class="sigil ' + (cls || '') + '" viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="Sigil of ' + INFO[id].name + '">' + body + '</svg>';
  }

  function measure(el) {
    el.querySelectorAll('path, circle, line, ellipse, polyline').forEach(function (p) {
      try { p.style.setProperty('--len', Math.ceil(p.getTotalLength()) + 1); } catch (e) {}
    });
  }

  function render(scope) {
    (scope || document).querySelectorAll('[data-sigil]').forEach(function (host) {
      if (host.dataset.sigilDone) return;
      var id = host.getAttribute('data-sigil');
      host.innerHTML = svg(id, host.hasAttribute('data-draw') ? 'draw' : '');
      host.dataset.sigilDone = '1';
      if (host.hasAttribute('data-draw')) measure(host);
    });
  }

  window.MBSigils = { svg: svg, info: INFO, render: render, ids: Object.keys(INFO) };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { render(); }); else render();
})();
