/* ==========================================================================
   THE STORY SO FAR — where the cast of Tales of the Gilded Goose is, chapter
   by chapter, on the world map. Only shows up to the chapter the reader has
   reached (the spoiler shield).

   EDIT HERE: each person has steps; a step says where they are from that
   chapter on. ch: 'new' means a chapter that is still being numbered.
   place: a key from PLACES below. note: one short line, no big spoilers.
   ========================================================================== */
(function () {
  var PLACES = {
    everlast: { x: 545, y: 495, at: 'in the Shining Everlast' },
    road: { x: 468, y: 572, at: 'on the road south' },
    dig: { x: 385, y: 655, at: 'at the dig site in the Yenfin Empire' },
    belowYenfin: { x: 398, y: 700, below: true, at: 'in Umbrasol, beneath Yenfin' },
    belowVaelgard: { x: 450, y: 372, below: true, at: 'in Umbrasol’s Vaelgard' },
    ironpeak: { x: 1020, y: 815, at: 'in Ironpeak' },
    hope: { off: true, at: 'in the All Mother’s realm, off the map' },
    unknown: { off: true, at: 'somewhere unknown' }
  };
  var CAST = [
    { name: 'Crockett', g: 'C', color: '#d9a95b', page: 'crockett.html', steps: [
      [1, 'everlast', 'At the Gilded Goose, running the guild.'], [10, 'road', 'Leading the convoy south.'], [13, 'dig', 'Digging into what lies under Yenfin.'],
      [21, 'hope', 'Carrying something precious into the All Mother’s realm.'], [24, 'unknown', 'Gone from the City of Wonder in a flash.'], ['new', 'ironpeak', 'Calling on an old acquaintance in Ironpeak.'] ] },
    { name: 'Cherry', g: 'Ch', color: '#e84393', page: 'cherry.html', steps: [
      [1, 'everlast', 'At the guild, causing trouble.'], [10, 'road', 'With the convoy.'], [13, 'dig', 'At the dig site.'],
      [17, 'dig', 'Caught in the Fall.'], [20, 'belowYenfin', 'Landed in Umbrasol.'], [23, 'belowVaelgard', 'At a court in Umbrasol.'] ] },
    { name: 'Will', g: 'W', color: '#6ab04c', page: 'will.html', steps: [
      [1, 'everlast', 'At the guild.'], [10, 'road', 'With the convoy.'], [13, 'dig', 'At the dig site.'],
      [17, 'dig', 'Caught in the Fall.'], [20, 'belowYenfin', 'Landed in Umbrasol.'], [23, 'belowVaelgard', 'At a court in Umbrasol.'] ] },
    { name: 'Tom', g: 'T', color: '#8a8f98', page: 'tom.html', steps: [
      [1, 'everlast', 'At the guild.'], [10, 'road', 'With the convoy.'], [13, 'dig', 'At the dig site.'],
      [17, 'dig', 'Caught in the Fall.'], [20, 'belowYenfin', 'Landed in Umbrasol.'], [23, 'belowVaelgard', 'In the shadows of a court in Umbrasol.'] ] },
    { name: 'Sansa', g: 'Sa', color: '#5dade2', page: 'sansa.html', steps: [
      [1, 'everlast', 'At the guild.'], [10, 'road', 'With the convoy.'], [13, 'dig', 'At the dig site.'],
      [17, 'dig', 'Caught in the Fall, and suddenly in charge.'], [20, 'belowYenfin', 'Landed in Umbrasol, still in charge.'], [23, 'belowVaelgard', 'Home, after a fashion.'] ] },
    { name: 'Sandy', g: 'Sy', color: '#f1c40f', page: 'gilded-goose.html#council', steps: [
      [1, 'everlast', 'Running the guild’s business in the capital.'] ] },
    { name: 'Gerald', g: 'G', color: '#c0703a', page: 'gilded-goose.html#council', steps: [
      [10, 'road', 'With the convoy, and uneasy about the job.'], [13, 'dig', 'Keeping the camp in line.'], [18, 'dig', 'Holding the dig site.'] ] },
    { name: 'Linfay', g: 'L', color: '#9b59b6', page: 'gilded-goose.html#council', steps: [
      [8, 'everlast', 'At the guild.'], [10, 'road', 'With the convoy.'], [13, 'dig', 'At the dig site.'],
      [18, 'road', 'Hurrying back to the capital.'], [25, 'everlast', 'Back at the guild.'] ] },
    { name: 'Evelyn', g: 'E', color: '#fff0b8', page: '', steps: [
      [21, 'hope', 'With the Knights of Hope.'], ['new', 'unknown', 'Gone from the All Mother’s realm.'] ] }
  ];

  var W = window.MBWorldMap, panel = document.getElementById('storyPanel');
  if (!W || !panel || !window.MBSpoilers) return;
  var esc = MBSite.esc, latest = MBSpoilers.latest || 28, layer = L.layerGroup(), shown = true;
  function chNum(c) { return c === 'new' ? latest + 0.5 : +c; }
  function maxAllowed() { var p = MBSpoilers.progress(); return p === 'all' ? latest + 0.5 : Math.max(0, +p); }
  function at(person, ch) { var s = null; person.steps.forEach(function (st) { if (chNum(st[0]) <= ch) s = st; }); return s; }

  var slider = document.getElementById('storyCh'), out = document.getElementById('storyChOut'), list = document.getElementById('storyCast');
  function chLabel(v) { return v > latest ? 'The newest chapters' : v < 1 ? 'Before Chapter 1' : 'Chapter ' + v; }
  function setRange() {
    var cap = maxAllowed();
    slider.max = String(cap > latest ? latest + 1 : cap); slider.min = '1';
    if (+slider.value > +slider.max || !slider.dataset.touched) slider.value = slider.max;
    document.getElementById('storyCap').textContent = MBSpoilers.progress() === 'all' ? 'You can see every chapter.' : 'Showing up to the chapter you have reached.';
  }
  function draw() {
    var ch = +slider.value > latest ? latest + 0.5 : +slider.value;
    out.textContent = chLabel(+slider.value);
    layer.clearLayers();
    var groups = {}, rows = [];
    CAST.forEach(function (p) {
      var st = at(p, ch); if (!st) return;
      var pl = PLACES[st[1]];
      rows.push({ p: p, st: st, pl: pl });
      if (pl.off) return;
      (groups[st[1]] = groups[st[1]] || []).push({ p: p, st: st, pl: pl });
    });
    Object.keys(groups).forEach(function (k) {
      var g = groups[k], n = g.length;
      g.forEach(function (it, i) {
        var a = n === 1 ? 0 : (i / n) * Math.PI * 2 - Math.PI / 2, r = n === 1 ? 0 : 10 + n * 2.4, dx = Math.cos(a) * r, dy = Math.sin(a) * r;
        var icon = L.divIcon({ className: 'mb-cast' + (it.pl.below ? ' below' : ''), iconSize: [26, 26], iconAnchor: [13 - dx, 13 - dy],
          html: '<span style="--c:' + it.p.color + '">' + esc(it.p.g) + '</span>' });
        var m = L.marker(W.ll(it.pl.x, it.pl.y), { icon: icon, title: it.p.name, keyboard: true, zIndexOffset: 500 });
        m.bindPopup('<p class="pop-kind">' + (it.pl.below ? 'Below the glass' : 'The story so far') + '</p><h3>' + esc(it.p.name) + '</h3><p>' + esc(it.st[2]) + '</p><p class="muted">' + esc(it.pl.at.charAt(0).toUpperCase() + it.pl.at.slice(1)) + ', as of ' + esc(chLabel(it.st[0] === 'new' ? latest + 1 : it.st[0])) + '.</p>' + (it.p.page ? '<p><a href="' + it.p.page + '">About ' + esc(it.p.name) + '</a></p>' : ''));
        it.marker = m; layer.addLayer(m);
      });
    });
    list.innerHTML = rows.length ? rows.map(function (r, i) {
      return '<li><button type="button" data-i="' + i + '"' + (r.pl.off ? ' disabled' : '') + '><span class="chip" style="--c:' + r.p.color + '">' + esc(r.p.g) + '</span><span><b>' + esc(r.p.name) + '</b> ' + esc('is ' + r.pl.at + '.') + '<small>' + esc(r.st[2]) + '</small></span></button></li>';
    }).join('') : '<li class="muted">The story hasn’t started yet.</li>';
    list.onclick = function (e) { var b = e.target.closest('[data-i]'); if (!b) return; var r = rows[+b.dataset.i]; var grp = groups[r.st[1]]; var it = grp && grp.filter(function (x) { return x.p === r.p; })[0]; if (it && it.marker) { W.map.flyTo(it.marker.getLatLng(), Math.max(W.map.getZoom(), 0), { duration: .6 }); setTimeout(function () { it.marker.openPopup(); }, 650); } };
  }
  slider.addEventListener('input', function () { slider.dataset.touched = 1; draw(); });
  document.getElementById('storyOn').addEventListener('change', function () { shown = this.checked; if (shown) layer.addTo(W.map); else W.map.removeLayer(layer); });
  document.documentElement.addEventListener('mb:progress', function () { delete slider.dataset.touched; setRange(); draw(); });
  layer.addTo(W.map); setRange(); draw();
})();
