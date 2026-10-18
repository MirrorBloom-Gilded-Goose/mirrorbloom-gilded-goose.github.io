/* ==========================================================================
   THE TABLE — the Dungeon Master's side (sealed in the Sanctum)
   Maps, tools, characters, turns, spells and dice; hosts the players.
   Everything is saved in this browser (IndexedDB). Download a map to keep a copy.
   ========================================================================== */
(function () {
  var T = window.MBTable, esc = MBSite.esc;
  function $(id) { return document.getElementById(id); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------- storage ---------- */
  var DB = (function () {
    var dbp = new Promise(function (res, rej) {
      var r = indexedDB.open('mirrorbloom-table', 1);
      r.onupgradeneeded = function () { r.result.createObjectStore('kv'); };
      r.onsuccess = function () { res(r.result); }; r.onerror = function () { rej(r.error); };
    });
    function tx(mode, fn) { return dbp.then(function (db) { return new Promise(function (res, rej) { var t = db.transaction('kv', mode), st = t.objectStore('kv'), out = fn(st); t.oncomplete = function () { res(out && out.result); }; t.onerror = function () { rej(t.error); }; }); }); }
    return { get: function (k) { return tx('readonly', function (s) { return s.get(k); }); }, set: function (k, v) { return tx('readwrite', function (s) { s.put(v, k); }); }, del: function (k) { return tx('readwrite', function (s) { s.delete(k); }); } };
  })();

  function newMap(name, cols, rows) {
    return { id: T.uid(), name: name || 'New map', cols: cols || 30, rows: rows || 20, cells: {}, props: [], labels: [], fog: {}, fogOn: false, grid: true, bg: null };
  }
  function starterMap() {
    var m = newMap('The crossroads inn', 30, 20), x, y;
    for (y = 0; y < 20; y++) for (x = 0; x < 30; x++) m.cells[x + ',' + y] = 'grass';
    for (x = 0; x < 30; x++) { m.cells[x + ',9'] = 'dirt'; m.cells[x + ',10'] = 'dirt'; }
    for (y = 0; y < 20; y++) { m.cells['14,' + y] = 'dirt'; m.cells['15,' + y] = 'dirt'; }
    for (y = 2; y <= 7; y++) for (x = 3; x <= 11; x++) m.cells[x + ',' + y] = (y === 2 || y === 7 || x === 3 || x === 11) ? 'wall' : 'wood';
    m.cells['7,7'] = 'wood'; m.props.push({ id: T.uid(), kind: 'door', x: 7, y: 7, r: 0 });
    m.props.push({ id: T.uid(), kind: 'table', x: 5, y: 4 }, { id: T.uid(), kind: 'table', x: 8, y: 4 }, { id: T.uid(), kind: 'fire', x: 10, y: 3 }, { id: T.uid(), kind: 'barrel', x: 4, y: 6 });
    [[20, 2], [24, 5], [23, 14], [26, 16], [5, 14], [9, 12], [1, 17], [27, 0]].forEach(function (p) { m.props.push({ id: T.uid(), kind: 'tree', x: p[0], y: p[1], s: 2 }); });
    for (y = 13; y <= 16; y++) for (x = 18; x <= 21; x++) m.cells[x + ',' + y] = 'water';
    m.props.push({ id: T.uid(), kind: 'rock', x: 17, y: 15 }); m.labels.push({ id: T.uid(), x: 7.5, y: 1.4, text: 'The Gilded Antler' });
    return m;
  }
  var C = null, saveT = 0;
  function save() { clearTimeout(saveT); saveT = setTimeout(function () { DB.set('campaign', C).catch(function () { toast('Could not save. Is this browser in private mode?'); }); }, 400); }
  function map() { return C.maps.filter(function (m) { return m.id === C.current; })[0] || C.maps[0]; }
  function tok(id) { return C.tokens.filter(function (t) { return t.id === id; })[0]; }
  function onMap(t) { return t.mapId === map().id && t.x != null; }

  /* ---------- view ---------- */
  var tool = 'select', view, sub = { terrain: 'floor', brush: 1, prop: 'door', fog: 'reveal', walls: true }, aim = null, placing = null, preview = {};
  function viewState() { var m = map(); return { map: m, tokens: C.tokens, init: C.init, templates: C.templates.filter(function (t) { return t.mapId === m.id; }) }; }
  function refresh() { view.setState(viewState()); }

  /* ---------- undo for map edits ---------- */
  var undo = [];
  function snapshot() { var m = map(); undo.push({ id: m.id, cells: clone(m.cells), props: clone(m.props), labels: clone(m.labels), fog: clone(m.fog) }); if (undo.length > 40) undo.shift(); }
  function doUndo() {
    var u = undo.pop(); if (!u) { toast('Nothing to undo.'); return; }
    var m = C.maps.filter(function (x) { return x.id === u.id; })[0]; if (!m) return;
    m.cells = u.cells; m.props = u.props; m.labels = u.labels; m.fog = u.fog; changed();
  }

  /* ---------- tools ---------- */
  function cellsIn(w, size) { var out = [], cx = Math.floor(w.x), cy = Math.floor(w.y), o = Math.floor((size - 1) / 2), m = map(); for (var i = 0; i < size; i++) for (var j = 0; j < size; j++) { var x = cx - o + i, y = cy - o + j; if (x >= 0 && y >= 0 && x < m.cols && y < m.rows) out.push([x, y]); } return out; }
  function rectCells(a, b) { var x0 = Math.floor(Math.min(a.x, b.x)), x1 = Math.floor(Math.max(a.x, b.x)), y0 = Math.floor(Math.min(a.y, b.y)), y1 = Math.floor(Math.max(a.y, b.y)); return { x0: x0, x1: x1, y0: y0, y1: y1 }; }
  var stroke = false;
  function onTool(phase, w, e, start) {
    var m = map();
    if (tool === 'paint' || tool === 'erase' || tool === 'fog') {
      if (phase === 'down') { snapshot(); stroke = true; }
      if (phase === 'up') { stroke = false; changed(); return; }
      cellsIn(w, sub.brush).forEach(function (c) {
        var k = c[0] + ',' + c[1];
        if (tool === 'paint') m.cells[k] = sub.terrain;
        else if (tool === 'erase') { delete m.cells[k]; m.props = m.props.filter(function (p) { return !(Math.floor(p.x) === c[0] && Math.floor(p.y) === c[1]); }); }
        else if (sub.fog === 'reveal') m.fog[k] = 1; else delete m.fog[k];
      });
      refresh(); if (tool === 'fog') syncSoon();
      return;
    }
    if (tool === 'room') {
      if (phase === 'up') {
        snapshot(); var r = rectCells(start, w);
        for (var y = r.y0; y <= r.y1; y++) for (var x = r.x0; x <= r.x1; x++) {
          if (x < 0 || y < 0 || x >= m.cols || y >= m.rows) continue;
          var edge = sub.walls && (x === r.x0 || x === r.x1 || y === r.y0 || y === r.y1) && r.x1 - r.x0 > 1 && r.y1 - r.y0 > 1;
          m.cells[x + ',' + y] = edge ? 'wall' : (sub.terrain === 'wall' ? 'floor' : sub.terrain);
        }
        preview.room = null; changed(); return;
      }
      preview.room = { a: start, b: w }; return;
    }
    if (tool === 'ruler') { preview.ruler = phase === 'up' ? null : { a: start, b: w }; if (phase === 'up') view.dirty = true; return; }
    if (phase !== 'down') return;
    var cx = Math.floor(w.x), cy = Math.floor(w.y);
    if (tool === 'props') {
      var hit = m.props.filter(function (p) { return cx >= Math.floor(p.x) && cx < Math.floor(p.x) + (p.s || 1) && cy >= Math.floor(p.y) && cy < Math.floor(p.y) + (p.s || 1); }).pop();
      if (hit) { selProp = hit.id; renderOpts(); view.dirty = true; return; }
      if (cx < 0 || cy < 0 || cx >= m.cols || cy >= m.rows) return;
      snapshot(); var np = { id: T.uid(), kind: sub.prop, x: cx, y: cy, r: 0 }; if (T.PROPS[sub.prop].big) np.s = 2; m.props.push(np); selProp = np.id; renderOpts(); changed();
    } else if (tool === 'label') {
      var near = m.labels.filter(function (l) { return Math.abs(l.x - w.x) < 1.5 && Math.abs(l.y - w.y) < .6; })[0];
      var text = prompt(near ? 'Change the label (leave empty to remove it)' : 'Label text', near ? near.text : '');
      if (text == null) return; snapshot();
      if (near) { if (text.trim()) near.text = text.trim(); else m.labels = m.labels.filter(function (l) { return l !== near; }); }
      else if (text.trim()) m.labels.push({ id: T.uid(), x: w.x, y: w.y, text: text.trim() });
      changed();
    } else if (tool === 'aim') cast(w);
    else if (tool === 'place') {
      var t = tok(placing); if (t) { t.mapId = m.id; t.x = Math.max(0, Math.min(m.cols - 1, cx)); t.y = Math.max(0, Math.min(m.rows - 1, cy)); }
      placing = null; setTool('select'); changed(); renderChars(); if (t) select(t.id);
    }
  }
  var selProp = null;
  function drawOverlay(x, z, now) {
    var w = view.mouse, m = map();
    if (w && (tool === 'paint' || tool === 'erase' || tool === 'fog')) {
      var cs = cellsIn(w, sub.brush); x.strokeStyle = tool === 'erase' ? '#cf4a58' : tool === 'fog' ? '#b9a8ff' : '#ffffff'; x.lineWidth = 2 / z;
      cs.forEach(function (c) { x.strokeRect(c[0], c[1], 1, 1); });
    }
    if (preview.room) { var r = rectCells(preview.room.a, preview.room.b); x.fillStyle = 'rgba(255,255,255,.12)'; x.strokeStyle = '#fff'; x.lineWidth = 2 / z; x.fillRect(r.x0, r.y0, r.x1 - r.x0 + 1, r.y1 - r.y0 + 1); x.strokeRect(r.x0, r.y0, r.x1 - r.x0 + 1, r.y1 - r.y0 + 1); T.pill(x, z, (r.x0 + r.x1 + 1) / 2, r.y0 - .4, ((r.x1 - r.x0 + 1) * 5) + ' × ' + ((r.y1 - r.y0 + 1) * 5) + ' ft'); }
    if (preview.ruler) { drawRuler(x, z, preview.ruler.a, preview.ruler.b); }
    if (tool === 'props' && selProp) { var p = m.props.filter(function (q) { return q.id === selProp; })[0]; if (p) { x.strokeStyle = '#ffd76b'; x.lineWidth = 2 / z; x.setLineDash([4 / z, 3 / z]); x.strokeRect(p.x, p.y, p.s || 1, p.s || 1); x.setLineDash([]); } }
    if (tool === 'aim' && aim && w) {
      var sp = T.spell(aim.spell), g = geom(sp, w);
      if (aim.from && sp.range) { x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 1.5 / z; x.setLineDash([3 / z, 5 / z]); x.beginPath(); x.arc(aim.from.x, aim.from.y, sp.range / 5 + .5, 0, 7); x.stroke(); x.setLineDash([]); }
      if (sp.shape === 'target' || sp.shape === 'teleport') { x.strokeStyle = sp.color; x.lineWidth = 2 / z; x.beginPath(); x.moveTo(g.ox, g.oy); x.lineTo(g.x, g.y); x.stroke(); x.beginPath(); x.arc(g.x, g.y, .45, 0, 7); x.stroke(); }
      else T.drawArea(x, sp, g, z);
      var dist = Math.round(Math.max(Math.abs(g.x - g.ox), Math.abs(g.y - g.oy)) * 5 / 5) * 5;
      if (aim.from) T.pill(x, z, g.x, g.y - (sp.shape === 'sphere' ? sp.size / 5 + .5 : .9), sp.name + (sp.shape === 'sphere' || sp.shape === 'target' || sp.shape === 'teleport' ? ' · ' + dist + ' ft' : ''));
    }
  }
  function drawRuler(x, z, a, b) {
    var ca = { x: Math.floor(a.x) + .5, y: Math.floor(a.y) + .5 }, cb = { x: Math.floor(b.x) + .5, y: Math.floor(b.y) + .5 };
    var ft = Math.max(Math.abs(cb.x - ca.x), Math.abs(cb.y - ca.y)) * 5;
    x.strokeStyle = '#ffd76b'; x.lineWidth = 3 / z; x.beginPath(); x.moveTo(ca.x, ca.y); x.lineTo(cb.x, cb.y); x.stroke();
    x.fillStyle = '#ffd76b'; [ca, cb].forEach(function (p) { x.beginPath(); x.arc(p.x, p.y, .12, 0, 7); x.fill(); });
    T.pill(x, z, cb.x, cb.y - .6, ft + ' ft');
  }

  /* ---------- tool bar ---------- */
  var TOOL_HINT = { select: '', paint: 'Drag to paint. Pick the ground below.', room: 'Drag a rectangle to make a room. Walls go around the edge.', erase: 'Drag to erase ground and objects.',
    props: 'Click an empty square to place the object. Click an object to turn or remove it.', label: 'Click to write a label. Click a label to change it.', fog: 'Turn fog on, then paint to show squares to players.', ruler: 'Drag to measure.' };
  function setTool(t) {
    tool = t; preview = {}; if (t !== 'aim') aim = null;
    document.querySelectorAll('#tools [data-tool]').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.tool === t ? 'true' : 'false'); });
    var h = t === 'aim' ? 'Click where the spell lands. Esc to cancel.' : t === 'place' ? 'Click a square to place the character. Esc to cancel.' : TOOL_HINT[t] || '';
    $('hint').hidden = !h; $('hint').textContent = h;
    renderOpts(); view.dirty = true;
  }
  $('tools').addEventListener('click', function (e) { var b = e.target.closest('[data-tool]'); if (b) setTool(b.dataset.tool); });
  function renderOpts() {
    var o = $('opts'), html = '';
    if (tool === 'paint' || tool === 'room') {
      html = '<div class="swatches">' + T.TERRAIN.map(function (t) { return '<button type="button" class="sw" data-ter="' + t.id + '" title="' + t.name + '" aria-pressed="' + (sub.terrain === t.id) + '" style="--sw:' + t.c + '"><span></span>' + t.name + '</button>'; }).join('') + '</div>';
      if (tool === 'room') html += '<label class="chk"><input type="checkbox" id="optWalls"' + (sub.walls ? ' checked' : '') + '> Walls around the edge</label>';
    }
    if (tool === 'paint' || tool === 'erase' || tool === 'fog') html += '<span class="brush">Brush ' + [1, 2, 3, 5].map(function (n) { return '<button type="button" data-brush="' + n + '" aria-pressed="' + (sub.brush === n) + '">' + n + '</button>'; }).join('') + '</span>';
    if (tool === 'fog') {
      var m = map();
      html = '<label class="chk"><input type="checkbox" id="optFog"' + (m.fogOn ? ' checked' : '') + '> Fog on</label>' +
        '<span class="seg"><button type="button" data-fog="reveal" aria-pressed="' + (sub.fog === 'reveal') + '">Show</button><button type="button" data-fog="hide" aria-pressed="' + (sub.fog === 'hide') + '">Hide</button></span>' + html +
        '<button type="button" class="tb-btn" id="fogParty">Light around the party</button><button type="button" class="tb-btn" id="fogAll">Show everything</button><button type="button" class="tb-btn" id="fogNone">Hide everything</button>';
    }
    if (tool === 'props') {
      html = '<div class="swatches props">' + Object.keys(T.PROPS).map(function (k) { return '<button type="button" class="sw" data-prop="' + k + '" aria-pressed="' + (sub.prop === k) + '"><canvas width="28" height="28" data-icon="' + k + '"></canvas>' + T.PROPS[k].name + '</button>'; }).join('') + '</div>';
      if (selProp) html += '<span class="seg"><button type="button" id="propRot">Turn</button><button type="button" id="propBig">Bigger</button><button type="button" id="propSmall">Smaller</button><button type="button" id="propDel">Remove</button></span>';
    }
    o.innerHTML = html; o.hidden = !html;
    o.querySelectorAll('canvas[data-icon]').forEach(function (c) { var x = c.getContext('2d'); x.setTransform(28, 0, 0, 28, 14, 14); T.PROPS[c.dataset.icon].draw(x); });
    setTimeout(function () { view.resize(); }, 0);
  }
  $('opts').addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return; var m = map(), p;
    if (b.dataset.ter) { sub.terrain = b.dataset.ter; renderOpts(); }
    else if (b.dataset.brush) { sub.brush = +b.dataset.brush; renderOpts(); }
    else if (b.dataset.fog) { sub.fog = b.dataset.fog; renderOpts(); }
    else if (b.dataset.prop) { sub.prop = b.dataset.prop; selProp = null; renderOpts(); }
    else if (b.id === 'fogAll') { snapshot(); for (var y = 0; y < m.rows; y++) for (var x = 0; x < m.cols; x++) m.fog[x + ',' + y] = 1; changed(); }
    else if (b.id === 'fogNone') { snapshot(); m.fog = {}; changed(); }
    else if (b.id === 'fogParty') {
      snapshot(); var R = 6, n = 0;
      C.tokens.filter(function (t) { return onMap(t) && t.kind === 'pc'; }).forEach(function (t) {
        var c = T.center(t);
        for (var yy = Math.floor(c.y - R); yy <= c.y + R; yy++) for (var xx = Math.floor(c.x - R); xx <= c.x + R; xx++) {
          if (xx < 0 || yy < 0 || xx >= m.cols || yy >= m.rows) continue;
          if (Math.hypot(xx + .5 - c.x, yy + .5 - c.y) <= R + .3 && !m.fog[xx + ',' + yy]) { m.fog[xx + ',' + yy] = 1; n++; }
        }
      });
      if (!m.fogOn) { m.fogOn = true; renderOpts(); }
      changed(); toast(n ? 'Lit 30 feet around every player character.' : 'No player characters on this map yet.');
    }
    else if ((p = m.props.filter(function (q) { return q.id === selProp; })[0])) {
      snapshot();
      if (b.id === 'propRot') p.r = ((p.r || 0) + 1) % 4;
      else if (b.id === 'propBig') p.s = Math.min(4, (p.s || 1) + 1);
      else if (b.id === 'propSmall') p.s = Math.max(1, (p.s || 1) - 1);
      else if (b.id === 'propDel') { m.props = m.props.filter(function (q) { return q !== p; }); selProp = null; renderOpts(); }
      changed();
    }
  });
  $('opts').addEventListener('change', function (e) {
    if (e.target.id === 'optWalls') sub.walls = e.target.checked;
    if (e.target.id === 'optFog') { var m = map(); m.fogOn = e.target.checked; if (m.fogOn && !Object.keys(m.fog).length) toast('Everything is hidden from players now. Paint with Show to reveal squares.'); changed(); }
  });

  /* ---------- maps ---------- */
  var bgKeyLoaded = null;
  function loadBg() {
    var m = map(), key = m.bg && m.bg.key;
    if (key === bgKeyLoaded) return; bgKeyLoaded = key;
    if (!key) { view.setBg(null); return; }
    DB.get(key).then(function (data) { if (!data) return; var im = new Image(); im.onload = function () { view.setBg(im); }; im.src = data; });
  }
  function fillMaps() { $('mapPick').innerHTML = C.maps.map(function (m) { return '<option value="' + m.id + '"' + (m.id === C.current ? ' selected' : '') + '>' + esc(m.name) + '</option>'; }).join(''); }
  function switchMap(id) { C.current = id; undo = []; selProp = null; fillMaps(); loadBg(); refresh(); view.fit(); renderChars(); changed(); }
  $('mapPick').addEventListener('change', function () { switchMap(this.value); });
  $('mapNew').addEventListener('click', function () { var name = prompt('Name the new map', 'New map'); if (name == null) return; var m = newMap(name.trim() || 'New map'); C.maps.push(m); switchMap(m.id); setTool('paint'); });
  $('mapSet').addEventListener('click', function () {
    var m = map(), b = m.bg || {};
    $('mName').value = m.name; $('mCols').value = m.cols; $('mRows').value = m.rows; $('mGrid').checked = m.grid !== false;
    $('mBgX').value = b.x || 0; $('mBgY').value = b.y || 0; $('mBgW').value = b.w || m.cols; $('mBgH').value = b.h || m.rows; $('mBgO').value = b.opacity == null ? 1 : b.opacity;
    $('mapDlg').showModal();
  });
  ['mName', 'mCols', 'mRows', 'mGrid', 'mBgX', 'mBgY', 'mBgW', 'mBgH', 'mBgO'].forEach(function (id) {
    $(id).addEventListener('input', function () {
      var m = map();
      m.name = $('mName').value.trim() || 'Map'; m.cols = Math.max(5, Math.min(120, +$('mCols').value || m.cols)); m.rows = Math.max(5, Math.min(120, +$('mRows').value || m.rows)); m.grid = $('mGrid').checked;
      if (m.bg) { m.bg.x = +$('mBgX').value || 0; m.bg.y = +$('mBgY').value || 0; m.bg.w = +$('mBgW').value || m.cols; m.bg.h = +$('mBgH').value || m.rows; m.bg.opacity = +$('mBgO').value; }
      fillMaps(); changed();
    });
  });
  $('mBgFile').addEventListener('change', function () {
    var f = this.files[0]; if (!f) return; this.value = '';
    shrink(f, 2600, 0.85).then(function (data) {
      var m = map(), key = 'img:' + T.uid();
      DB.set(key, data).then(function () {
        var im = new Image(); im.onload = function () {
          var ratio = im.width / im.height; m.bg = { key: key, x: 0, y: 0, w: m.cols, h: Math.round(m.cols / ratio * 4) / 4, opacity: 1 };
          $('mBgW').value = m.bg.w; $('mBgH').value = m.bg.h; bgKeyLoaded = null; loadBg(); changed();
        }; im.src = data;
      });
    });
  });
  $('mBgClear').addEventListener('click', function () { var m = map(); m.bg = null; bgKeyLoaded = null; loadBg(); changed(); });
  $('mDelete').addEventListener('click', function () {
    if (C.maps.length < 2) { toast('Keep at least one map.'); return; }
    if (!confirm('Delete "' + map().name + '"? Characters on it are taken off the board.')) return;
    var id = map().id; C.maps = C.maps.filter(function (m) { return m.id !== id; }); C.tokens.forEach(function (t) { if (t.mapId === id) { t.mapId = null; t.x = null; } });
    $('mapDlg').close(); switchMap(C.maps[0].id);
  });
  $('mExport').addEventListener('click', function () {
    var m = map(), out = { mirrorbloomMap: 1, map: clone(m) };
    var go = function () { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(out)], { type: 'application/json' })); a.download = (m.name || 'map').replace(/[^\w ]+/g, '').replace(/\s+/g, '-').toLowerCase() + '.json'; a.click(); };
    if (m.bg && m.bg.key) DB.get(m.bg.key).then(function (d) { out.bgData = d; go(); }); else go();
  });
  $('mImport').addEventListener('click', function () { $('mImportFile').click(); });
  $('mImportFile').addEventListener('change', function () {
    var f = this.files[0]; if (!f) return; this.value = ''; var r = new FileReader();
    r.onload = function () {
      try {
        var d = JSON.parse(r.result); if (!d.mirrorbloomMap) throw 0; var m = d.map; m.id = T.uid();
        var done = function () { C.maps.push(m); $('mapDlg').close(); switchMap(m.id); toast('Map loaded.'); };
        if (d.bgData) { var key = 'img:' + T.uid(); m.bg.key = key; DB.set(key, d.bgData).then(done); } else { m.bg = null; done(); }
      } catch (e) { alert('That is not a map file from the Table.'); }
    };
    r.readAsText(f);
  });
  function shrink(file, max, q) {
    return new Promise(function (res) {
      var r = new FileReader(); r.onload = function () {
        var im = new Image(); im.onload = function () {
          var s = Math.min(1, max / Math.max(im.width, im.height)); if (s === 1 && file.size < 1.5e6) return res(r.result);
          var c = document.createElement('canvas'); c.width = Math.round(im.width * s); c.height = Math.round(im.height * s); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', q));
        }; im.src = r.result;
      }; r.readAsDataURL(file);
    });
  }

  /* ---------- characters ---------- */
  var COLORS = ['#d9a95b', '#5dade2', '#6ab04c', '#c98bff', '#e67e22', '#e84393', '#1abc9c', '#cf4a58', '#95a5a6', '#f1c40f'];
  function newChar(kind, extra) {
    var n = C.tokens.length;
    return Object.assign({ id: T.uid(), name: kind === 'monster' ? 'Monster' : 'New character', kind: kind || 'pc', color: kind === 'monster' ? '#a33a48' : COLORS[n % COLORS.length], glyph: '', img: null, size: 'medium',
      hp: 10, maxHp: 10, ac: 12, speed: 30, initBonus: 0, initRoll: null, conditions: [], slots: {}, notes: '', hidden: false, mapId: null, x: null, y: null }, extra || {});
  }
  var selected = null;
  function select(id) { selected = id; view.sel = id; renderChars(); renderSheet(); renderCaster(); view.dirty = true; }
  function renderChars() {
    var groups = { pc: 'Players', npc: 'Allies and NPCs', monster: 'Monsters' }, html = '';
    Object.keys(groups).forEach(function (k) {
      var list = C.tokens.filter(function (t) { return t.kind === k; }); if (!list.length) return;
      html += '<h4>' + groups[k] + '</h4>' + list.map(function (t) {
        var pct = t.maxHp ? Math.max(0, Math.min(100, t.hp / t.maxHp * 100)) : 0, here = onMap(t), owner = ownerOf(t.id);
        return '<button type="button" class="cr' + (t.id === selected ? ' on' : '') + (here ? '' : ' off') + '" data-id="' + t.id + '"><span class="cr-dot" style="background:' + esc(t.color) + '">' + (t.img ? '<img src="' + esc(t.img) + '" alt="">' : esc((t.glyph || t.name || '?').slice(0, 2))) + '</span>' +
          '<span class="cr-main"><b>' + esc(t.name) + '</b>' + (t.hidden ? ' <i>hidden</i>' : '') + (owner ? ' <i class="own">' + esc(owner) + '</i>' : '') + '<span class="cr-hp"><span style="width:' + pct + '%"></span></span></span>' +
          '<span class="cr-stat">' + t.hp + '/' + t.maxHp + '<small>AC ' + t.ac + '</small></span></button>';
      }).join('');
    });
    $('charList').innerHTML = html || '<p class="muted small">No characters yet. Add your party, then drop them on the map.</p>';
  }
  $('charList').addEventListener('click', function (e) { var b = e.target.closest('[data-id]'); if (b) select(b.dataset.id); });
  $('charList').addEventListener('dblclick', function (e) { var b = e.target.closest('[data-id]'); if (!b) return; var t = tok(b.dataset.id); if (t && onMap(t)) view.centerOn(t.x + .5, t.y + .5); });
  $('addChar').addEventListener('click', function () { var t = newChar('pc'); C.tokens.push(t); changed(); select(t.id); $('sheet').querySelector('[data-f="name"]').select(); });
  function renderSheet() {
    var t = tok(selected), s = $('sheet'); if (!t) { s.hidden = true; return; }
    s.hidden = false;
    var slotRows = '';
    for (var lv = 1; lv <= 9; lv++) { var sl = t.slots[lv] || [0, 0]; if (!sl[1] && lv > 3 && !(t.slots[lv - 1] || [0, 0])[1]) continue; slotRows += '<span class="slot" data-lv="' + lv + '"><small>' + lv + '</small>' + (function () { var o = ''; for (var i = 0; i < sl[1]; i++) o += '<button type="button" class="pip' + (i < sl[0] ? ' used' : '') + '" data-pip="' + i + '" aria-label="Level ' + lv + ' slot"></button>'; return o; })() + '<button type="button" class="pip-add" data-add="' + lv + '" title="Add a slot">+</button></span>'; }
    s.innerHTML =
      '<div class="sh-top"><span class="cr-dot big" style="background:' + esc(t.color) + '">' + (t.img ? '<img src="' + esc(t.img) + '" alt="">' : esc((t.glyph || t.name || '?').slice(0, 2))) + '</span>' +
      '<input data-f="name" value="' + esc(t.name) + '" aria-label="Name"></div>' +
      '<div class="sh-hp"><button type="button" class="btn small" data-hp="-">Damage</button><input type="number" id="hpAmt" min="0" placeholder="0" aria-label="Amount"><button type="button" class="btn small" data-hp="+">Heal</button></div>' +
      '<div class="sh-grid">' +
      '<label>HP <input type="number" data-f="hp" value="' + t.hp + '"></label><label>Max HP <input type="number" data-f="maxHp" value="' + t.maxHp + '"></label><label>AC <input type="number" data-f="ac" value="' + t.ac + '"></label>' +
      '<label>Speed <input type="number" data-f="speed" value="' + t.speed + '" step="5"></label><label>Init bonus <input type="number" data-f="initBonus" value="' + t.initBonus + '"></label>' +
      '<label>Size <select data-f="size">' + T.SIZES.map(function (z) { return '<option value="' + z[0] + '"' + (t.size === z[0] ? ' selected' : '') + '>' + z[1] + '</option>'; }).join('') + '</select></label>' +
      '<label>Kind <select data-f="kind"><option value="pc"' + (t.kind === 'pc' ? ' selected' : '') + '>Player</option><option value="npc"' + (t.kind === 'npc' ? ' selected' : '') + '>Ally / NPC</option><option value="monster"' + (t.kind === 'monster' ? ' selected' : '') + '>Monster</option></select></label>' +
      '<label>Color <input type="color" data-f="color" value="' + esc(t.color) + '"></label><label>Letters <input data-f="glyph" maxlength="2" value="' + esc(t.glyph || '') + '" placeholder="' + esc((t.name || '?').slice(0, 1)) + '"></label>' +
      '</div>' +
      '<p class="sh-row"><label class="chk"><input type="checkbox" data-f="hidden"' + (t.hidden ? ' checked' : '') + '> Hidden from players</label><button type="button" class="linklike" id="shImg">' + (t.img ? 'Change picture' : 'Add a picture') + '</button>' + (t.img ? ' <button type="button" class="linklike" id="shImgX">Remove picture</button>' : '') + '<input type="file" id="shImgFile" accept="image/*" hidden></p>' +
      '<h5>Conditions</h5><div class="conds">' + T.CONDITIONS.map(function (c) { return '<button type="button" class="cond' + (t.conditions.indexOf(c) > -1 ? ' on' : '') + '" data-cond="' + c + '" style="--cc:' + T.COND_COLOR[c] + '">' + c + '</button>'; }).join('') + '</div>' +
      '<h5>Spell slots</h5><div class="slots">' + slotRows + '</div>' +
      '<h5>Notes</h5><textarea data-f="notes" rows="3" placeholder="Only you see these.">' + esc(t.notes || '') + '</textarea>' +
      '<div class="sh-acts">' + (onMap(t) ? '<button type="button" class="btn small" id="shCenter">Find on map</button><button type="button" class="btn small" id="shOff">Take off the map</button>' : '<button type="button" class="btn small primary" id="shPlace">Place on this map</button>') +
      '<button type="button" class="btn small" id="shCopy">Duplicate</button><button type="button" class="btn small danger" id="shDel">Delete</button></div>';
  }
  $('sheet').addEventListener('input', function (e) {
    var t = tok(selected), f = e.target.dataset.f; if (!t || !f) return;
    var v = e.target.type === 'checkbox' ? e.target.checked : e.target.type === 'number' ? (+e.target.value || 0) : e.target.value;
    t[f] = v; if (f === 'maxHp' && t.hp > v) t.hp = v;
    if (f === 'kind' || f === 'color' || f === 'glyph') renderSheetHead(t);
    changed(); renderChars();
  });
  function renderSheetHead(t) { var d = $('sheet').querySelector('.cr-dot.big'); if (d) { d.style.background = t.color; if (!t.img) d.textContent = (t.glyph || t.name || '?').slice(0, 2); } }
  $('sheet').addEventListener('click', function (e) {
    var t = tok(selected); if (!t) return; var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.hp) { var amt = Math.abs(+$('hpAmt').value || 0); if (!amt) { $('hpAmt').focus(); return; } changeHp(t, b.dataset.hp === '-' ? -amt : amt); $('hpAmt').value = ''; renderSheet(); return; }
    if (b.dataset.cond) { var i = t.conditions.indexOf(b.dataset.cond); if (i > -1) t.conditions.splice(i, 1); else t.conditions.push(b.dataset.cond); b.classList.toggle('on'); changed(); return; }
    if (b.dataset.pip != null) { var lv = b.closest('[data-lv]').dataset.lv, sl = t.slots[lv]; var idx = +b.dataset.pip; sl[0] = idx < sl[0] ? idx : idx + 1; changed(); renderSheet(); return; }
    if (b.dataset.add) { var s2 = t.slots[b.dataset.add] = t.slots[b.dataset.add] || [0, 0]; s2[1] = Math.min(9, s2[1] + 1); changed(); renderSheet(); return; }
    if (b.id === 'shPlace') { placing = t.id; setTool('place'); }
    else if (b.id === 'shOff') { t.mapId = null; t.x = null; t.y = null; changed(); renderSheet(); }
    else if (b.id === 'shCenter') view.centerOn(t.x + .5, t.y + .5);
    else if (b.id === 'shCopy') { var c = clone(t); c.id = T.uid(); c.name = nextName(t.name); c.x = t.x != null ? t.x + 1 : null; C.tokens.push(c); changed(); select(c.id); }
    else if (b.id === 'shDel') { if (!confirm('Delete ' + t.name + '?')) return; C.tokens = C.tokens.filter(function (q) { return q !== t; }); C.init.order = C.init.order.filter(function (id) { return id !== t.id; }); selected = null; changed(); renderChars(); renderSheet(); renderTurns(); }
    else if (b.id === 'shImg') $('shImgFile').click();
    else if (b.id === 'shImgX') { t.img = null; changed(); renderSheet(); renderChars(); }
  });
  $('sheet').addEventListener('change', function (e) {
    if (e.target.id !== 'shImgFile') return; var t = tok(selected), f = e.target.files[0]; if (!t || !f) return;
    var r = new FileReader(); r.onload = function () { var im = new Image(); im.onload = function () { var c = document.createElement('canvas'), s = 128; c.width = c.height = s; var x = c.getContext('2d'), m = Math.min(im.width, im.height); x.drawImage(im, (im.width - m) / 2, (im.height - m) / 2, m, m, 0, 0, s, s); t.img = c.toDataURL('image/jpeg', .85); changed(); renderSheet(); renderChars(); }; im.src = r.result; }; r.readAsDataURL(f);
  });
  function nextName(n) { var m = n.match(/^(.*?)(\d+)$/); return m ? m[1] + (+m[2] + 1) : n + ' 2'; }
  function changeHp(t, delta) {
    t.hp = Math.max(0, Math.min(t.maxHp || 9999, (t.hp || 0) + delta));
    if (t.hp === 0 && delta < 0 && t.conditions.indexOf('unconscious') < 0 && t.kind === 'pc') t.conditions.push('unconscious');
    if (t.hp > 0 && delta > 0) t.conditions = t.conditions.filter(function (c) { return c !== 'unconscious'; });
    changed(); renderChars();
  }

  /* bestiary from the vault */
  var BEASTS = [];
  function parseBeasts(vault) {
    BEASTS = [];
    Object.keys(vault.pages || {}).forEach(function (k) {
      var p = vault.pages[k]; if (!/^(minion-|statblock-)/.test(k)) return;
      var d = document.createElement('div'); d.innerHTML = p.html.replace(/</g, ' <'); var txt = d.textContent.replace(/\s+/g, ' ');
      var ac = +(txt.match(/Armor Class\s*(\d+)/) || [])[1] || 12, hp = +(txt.match(/Hit Points\s*(\d+)/) || [])[1] || 10;
      var size = ((txt.match(/\b(Tiny|Small|Medium|Large|Huge|Gargantuan)\b/) || [])[1] || 'Medium').toLowerCase();
      var dex = (txt.match(/DEX\s*\d+\s*\(([+\-−]\d+)\)/) || [])[1]; var ib = dex ? parseInt(dex.replace('−', '-'), 10) : 0;
      var speed = +(txt.match(/Speed\s*(\d+)/) || [])[1] || 30;
      BEASTS.push({ key: k, name: p.title, ac: ac, hp: hp, size: size, initBonus: ib, speed: speed, god: k.indexOf('statblock-') === 0 });
    });
    $('addBeast').innerHTML = '<option value="">Add from bestiary…</option><optgroup label="Court creatures">' + BEASTS.filter(function (b) { return !b.god; }).map(function (b, i) { return '<option value="' + b.key + '">' + esc(b.name) + ' (HP ' + b.hp + ')</option>'; }).join('') +
      '</optgroup><optgroup label="Gods and Archfey">' + BEASTS.filter(function (b) { return b.god; }).map(function (b) { return '<option value="' + b.key + '">' + esc(b.name) + '</option>'; }).join('') + '</optgroup><option value="__blank">A blank monster</option>';
  }
  $('addBeast').addEventListener('change', function () {
    var v = this.value; this.value = ''; if (!v) return;
    var t;
    if (v === '__blank') t = newChar('monster');
    else { var b = BEASTS.filter(function (x) { return x.key === v; })[0]; if (!b) return; var same = C.tokens.filter(function (q) { return q.name.indexOf(b.name) === 0; }).length; t = newChar('monster', { name: b.name + (same ? ' ' + (same + 1) : ''), hp: b.hp, maxHp: b.hp, ac: b.ac, size: b.size, initBonus: b.initBonus, speed: b.speed, statblock: b.key }); }
    C.tokens.push(t); changed(); select(t.id); placing = t.id; setTool('place');
  });

  /* ---------- turns ---------- */
  function renderTurns() {
    var I = C.init;
    $('roundNo').textContent = I.active ? 'Round ' + I.round : (I.order.length ? 'Ready. Press Next turn to start.' : 'No combat yet');
    $('turnList').innerHTML = I.order.map(function (id, i) {
      var t = tok(id); if (!t) return '';
      return '<li class="' + (I.active && i === I.turn ? 'now' : '') + (t.hp <= 0 && t.maxHp ? ' down' : '') + '" data-id="' + id + '"><span class="cr-dot" style="background:' + esc(t.color) + '">' + esc((t.glyph || t.name).slice(0, 2)) + '</span><b>' + esc(t.name) + '</b>' + (t.hidden ? ' <i>hidden</i>' : '') +
        '<input type="number" value="' + (t.initRoll == null ? '' : t.initRoll) + '" data-init="' + id + '" aria-label="Initiative for ' + esc(t.name) + '"><button type="button" class="x" data-out="' + id + '" title="Remove from combat">×</button></li>';
    }).join('');
  }
  function sortInit() { C.init.order.sort(function (a, b) { var A = tok(a), B = tok(b); return ((B && B.initRoll) || -99) - ((A && A.initRoll) || -99) || ((B && B.initBonus) || 0) - ((A && A.initBonus) || 0); }); }
  $('rollInit').addEventListener('click', function () {
    var here = C.tokens.filter(onMap); if (!here.length) { toast('Put some characters on the map first.'); return; }
    here.forEach(function (t) { if (t.kind !== 'pc' || t.initRoll == null) t.initRoll = T.roll('1d20').total + (t.initBonus || 0); });
    C.init.order = here.map(function (t) { return t.id; }); sortInit(); C.init.turn = 0; C.init.round = 1; C.init.active = true;
    logEntry('Initiative', 'Combat begins. ' + C.init.order.map(function (id) { var t = tok(id); return t.hidden ? null : t.name + ' ' + t.initRoll; }).filter(Boolean).join(', '), null, false);
    renderTurns(); changed(); announceTurn();
  });
  $('turnList').addEventListener('change', function (e) { var id = e.target.dataset.init; if (!id) return; var t = tok(id); t.initRoll = e.target.value === '' ? null : +e.target.value; var cur = C.init.order[C.init.turn]; sortInit(); C.init.turn = Math.max(0, C.init.order.indexOf(cur)); renderTurns(); changed(); });
  $('turnList').addEventListener('click', function (e) {
    var x = e.target.closest('[data-out]'); if (x) { var cur = C.init.order[C.init.turn]; C.init.order = C.init.order.filter(function (id) { return id !== x.dataset.out; }); C.init.turn = Math.max(0, C.init.order.indexOf(cur)); renderTurns(); changed(); return; }
    var li = e.target.closest('li[data-id]'); if (li && e.target.tagName !== 'INPUT') select(li.dataset.id);
  });
  function step(d) {
    var I = C.init; if (!I.order.length) return;
    if (!I.active) { I.active = true; I.turn = 0; I.round = 1; }
    else { I.turn += d; if (I.turn >= I.order.length) { I.turn = 0; I.round++; } if (I.turn < 0) { I.turn = I.order.length - 1; I.round = Math.max(1, I.round - 1); } }
    renderTurns(); changed(); announceTurn();
  }
  function announceTurn() { var t = tok(C.init.order[C.init.turn]); if (t && onMap(t)) { view.centerOn(t.x + .5, t.y + .5); if (!t.hidden) broadcast({ type: 'toast', text: t.name + '\'s turn' }); } }
  $('nextTurn').addEventListener('click', function () { step(1); });
  $('prevTurn').addEventListener('click', function () { step(-1); });
  $('endInit').addEventListener('click', function () { C.init = { order: [], turn: 0, round: 1, active: false }; C.tokens.forEach(function (t) { t.initRoll = null; }); renderTurns(); changed(); });

  /* ---------- spells ---------- */
  function renderCaster() {
    var t = tok(selected);
    $('casterLine').innerHTML = t && onMap(t) ? 'Casting as <b>' + esc(t.name) + '</b>. Pick a spell, then click the map.' : 'Select a character on the map to cast from them, or cast from anywhere.';
  }
  function spellGrid() {
    $('spellGrid').innerHTML = T.SPELLS.map(function (s) {
      return '<button type="button" class="spell" data-spell="' + s.id + '" style="--sc:' + s.color + '"><b>' + esc(s.name) + '</b><small>' + (s.lvl ? 'Level ' + s.lvl : 'Cantrip') + (s.dmg ? ' · ' + s.dmg + ' ' + (s.type || '') : s.heal ? ' · heals ' + s.heal : '') + (s.shape !== 'target' && s.size ? ' · ' + s.size + ' ft ' + s.shape : '') + '</small></button>';
    }).join('');
  }
  $('spellGrid').addEventListener('click', function (e) {
    var b = e.target.closest('[data-spell]'); if (!b) return;
    var t = tok(selected), from = t && onMap(t) ? T.center(t) : null, sp = T.spell(b.dataset.spell);
    if (!from && (sp.shape === 'cone' || sp.shape === 'line' || sp.shape === 'cube' || sp.shape === 'aura' || sp.shape === 'teleport')) { toast('Select the caster on the map first. ' + sp.name + ' starts from them.'); return; }
    aim = { spell: sp.id, from: from, caster: t && t.id };
    if (sp.shape === 'aura') { cast(from); return; }
    setTool('aim');
  });
  function geom(sp, w) {
    var o = aim && aim.from || { x: w.x, y: w.y };
    if (sp.shape === 'sphere') return { ox: o.x, oy: o.y, x: Math.round(w.x), y: Math.round(w.y) };
    if (sp.shape === 'target' || sp.shape === 'teleport') { var tt = view.tokenAt(w.x, w.y); var c = tt ? T.center(tt) : { x: Math.floor(w.x) + .5, y: Math.floor(w.y) + .5 }; return { ox: o.x, oy: o.y, x: c.x, y: c.y, target: tt && tt.id }; }
    if (sp.shape === 'aura') return { ox: o.x, oy: o.y, x: o.x, y: o.y };
    return { ox: o.x, oy: o.y, x: w.x, y: w.y };
  }
  function cast(w, fromPlayer) {
    var sp = T.spell(aim.spell), g = fromPlayer ? w : geom(sp, w), m = map();
    view.play(sp.id, g); broadcast({ type: 'fx', spell: sp.id, g: g });
    var caster = tok(aim.caster);
    if (sp.lasting) { C.templates.push({ id: T.uid(), spell: sp.id, x: g.x, y: g.y, size: sp.size, mapId: m.id }); }
    if (sp.shape === 'teleport' && caster) { setTimeout(function () { caster.x = Math.floor(g.x); caster.y = Math.floor(g.y); changed(); }, 650); }
    logEntry(caster ? caster.name : 'DM', 'casts ' + sp.name, null, false);
    var a = aim; setTool('select'); changed();
    if (sp.dmg || sp.heal) setTimeout(function () { damageDialog(sp, g, a.caster); }, sp.id === 'fireball' ? 1300 : 700);
  }
  function renderLasting() {
    var m = map(), list = C.templates.filter(function (t) { return t.mapId === m.id; });
    $('lastingList').innerHTML = list.length ? list.map(function (t) { return '<li>' + esc(T.spell(t.spell).name) + '<button type="button" class="linklike" data-tpl="' + t.id + '">End it</button></li>'; }).join('') : '<li class="muted small">None. Darkness, Moonbeam and Spirit Guardians stay on the map until you end them.</li>';
  }
  $('lastingList').addEventListener('click', function (e) { var b = e.target.closest('[data-tpl]'); if (!b) return; C.templates = C.templates.filter(function (t) { return t.id !== b.dataset.tpl; }); changed(); });

  var dmgCtx = null;
  function damageDialog(sp, g, casterId) {
    var hits = sp.shape === 'target' ? (g.target ? [tok(g.target)] : []) : T.tokensIn(sp, g, C.tokens.filter(onMap));
    hits = hits.filter(Boolean);
    if (!hits.length) { toast(sp.name + ' hit no one.'); return; }
    dmgCtx = { sp: sp, hits: hits, total: null };
    $('dmgTitle').textContent = sp.name; $('dmgTotal').textContent = ''; $('dmgAmt').value = '';
    $('dmgSub').textContent = sp.heal ? 'Healing ' + sp.heal : (sp.dmg + ' ' + (sp.type || '') + ' damage' + (sp.save ? ', ' + sp.save + ' save for ' + (sp.half ? 'half' : 'none') : sp.attack ? ', on a hit' : ''));
    $('dmgRoll').textContent = sp.heal ? 'Roll healing' : 'Roll damage';
    $('dmgList').innerHTML = hits.map(function (t) {
      return '<li><span class="cr-dot" style="background:' + esc(t.color) + '">' + esc((t.glyph || t.name).slice(0, 2)) + '</span><b>' + esc(t.name) + '</b> <small>' + t.hp + '/' + t.maxHp + '</small>' +
        (sp.save && !sp.heal ? '<label class="chk"><input type="checkbox" data-saved="' + t.id + '"> Saved</label>' : '') + '<label class="chk"><input type="checkbox" data-hit="' + t.id + '" checked> Include</label></li>';
    }).join('');
    $('dmgDlg').showModal();
  }
  $('dmgRoll').addEventListener('click', function () {
    var sp = dmgCtx.sp, r = T.roll(sp.heal || sp.dmg); dmgCtx.total = r.total; $('dmgAmt').value = r.total; $('dmgTotal').textContent = r.text + ' = ' + r.total;
    logEntry('DM', sp.name + (sp.heal ? ' heals ' : ' deals ') + r.total + (sp.heal ? '' : ' ' + (sp.type || '')), r, false);
  });
  $('dmgCancel').addEventListener('click', function () { $('dmgDlg').close(); });
  $('dmgApply').addEventListener('click', function () {
    var amt = +$('dmgAmt').value; if (!amt && amt !== 0) return; var sp = dmgCtx.sp, notes = [];
    dmgCtx.hits.forEach(function (t) {
      if (!$('dmgList').querySelector('[data-hit="' + t.id + '"]').checked) return;
      var saved = $('dmgList').querySelector('[data-saved="' + t.id + '"]'), d = sp.heal ? amt : (saved && saved.checked ? (sp.half ? Math.floor(amt / 2) : 0) : amt);
      changeHp(t, sp.heal ? d : -d); notes.push(t.hidden ? null : t.name + (sp.heal ? ' +' : ' −') + d);
    });
    var shown = notes.filter(Boolean); if (shown.length) logEntry('DM', sp.name + ': ' + shown.join(', '), null, false);
    $('dmgDlg').close(); renderSheet();
  });

  /* ---------- dice and log ---------- */
  ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].forEach(function (d) { $('diceRow').insertAdjacentHTML('beforeend', '<button type="button" class="die" data-die="1' + d + '">' + d + '</button>'); });
  function mode() { return (document.querySelector('input[name="dmode"]:checked') || {}).value || ''; }
  function rollDm(expr) { var r = T.roll(expr, mode()); if (!r) { toast('Try something like 2d6+3.'); return; } logEntry('DM', expr, r, $('dicePrivate').checked); }
  $('diceRow').addEventListener('click', function (e) { var b = e.target.closest('[data-die]'); if (b) rollDm(b.dataset.die); });
  $('diceForm').addEventListener('submit', function (e) { e.preventDefault(); var v = $('diceExpr').value.trim(); if (v) rollDm(v); });
  function logEntry(who, text, r, priv) {
    var en = { id: T.uid(), at: Date.now(), who: who, text: text, total: r ? r.total : null, detail: r ? r.text + (r.mode ? ' (' + (r.mode === 'adv' ? 'advantage' : 'disadvantage') + ')' : '') : '', crit: r && r.nat20, fumble: r && r.nat1, priv: !!priv };
    C.log.push(en); if (C.log.length > 150) C.log.shift();
    renderLog(); save(); if (!priv) broadcast({ type: 'log', entry: en });
    if (SET_TAB !== 'dice') { badge++; $('diceBadge').textContent = badge; }
  }
  var badge = 0, SET_TAB = 'party';
  function renderLog() {
    $('log').innerHTML = C.log.slice().reverse().slice(0, 80).map(function (e) {
      return '<li class="' + (e.priv ? 'priv' : '') + (e.crit ? ' crit' : '') + (e.fumble ? ' fumble' : '') + '"><span class="lw">' + esc(e.who) + '</span> ' + esc(e.text) + (e.total != null ? ' <b class="lt">' + e.total + '</b><small>' + esc(e.detail) + '</small>' : '') + (e.priv ? ' <i>hidden</i>' : '') + '</li>';
    }).join('');
  }

  /* ---------- tabs ---------- */
  document.querySelector('.tb-panel .p-tabs').addEventListener('click', function (e) {
    var b = e.target.closest('[data-tab]'); if (!b) return; SET_TAB = b.dataset.tab;
    document.querySelectorAll('.tb-panel [data-tab]').forEach(function (x) { x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
    document.querySelectorAll('.tb-panel .p-view').forEach(function (v) { v.hidden = v.dataset.view !== SET_TAB; });
    if (SET_TAB === 'dice') { badge = 0; $('diceBadge').textContent = ''; }
    if (SET_TAB === 'spells') { renderCaster(); renderLasting(); }
    if (SET_TAB === 'turns') renderTurns();
  });

  /* ---------- hosting ---------- */
  var host = null, local = null, players = {}, lastMove = 0;
  function ownerOf(id) { var n = null; Object.keys(C.claims || {}).forEach(function (name) { if ((C.claims[name] || []).indexOf(id) > -1) n = name; }); return n; }
  function stateFor(pid) {
    var p = players[pid] || {}, m = map(), fogOn = m.fogOn, fog = m.fog || {}, mine = (C.claims[p.name] || []);
    function vis(x, y) { return !fogOn || fog[Math.floor(x) + ',' + Math.floor(y)]; }
    var cells = {}; Object.keys(m.cells).forEach(function (k) { var xy = k.split(','); if (vis(+xy[0], +xy[1])) cells[k] = m.cells[k]; });
    var pm = { id: m.id, name: m.name, cols: m.cols, rows: m.rows, grid: m.grid, fogOn: fogOn, fog: fogOn ? fog : {}, cells: cells,
      props: m.props.filter(function (q) { return vis(q.x, q.y); }), labels: m.labels.filter(function (q) { return vis(q.x, q.y); }), bg: m.bg ? { key: m.bg.key, x: m.bg.x, y: m.bg.y, w: m.bg.w, h: m.bg.h, opacity: m.bg.opacity } : null };
    var toks = C.tokens.filter(function (t) { return onMap(t) && !t.hidden && (vis(t.x, t.y) || mine.indexOf(t.id) > -1); }).map(function (t) {
      var pub = { id: t.id, name: t.name, color: t.color, glyph: t.glyph, img: t.img, size: t.size, x: t.x, y: t.y, kind: t.kind, mapId: t.mapId, conditions: t.conditions };
      if (t.kind === 'pc' || mine.indexOf(t.id) > -1) { pub.hp = t.hp; pub.maxHp = t.maxHp; } else if (t.maxHp) { pub.maxHp = 4; pub.hp = t.hp <= 0 ? 0 : t.hp / t.maxHp <= .5 ? 2 : 4; }
      if (mine.indexOf(t.id) > -1) { pub.ac = t.ac; pub.speed = t.speed; pub.slots = t.slots; }
      return pub;
    });
    var visIds = {}; toks.forEach(function (t) { visIds[t.id] = 1; });
    var order = C.init.order.filter(function (id) { var t = tok(id); return t && !t.hidden; });
    var cur = C.init.order[C.init.turn], initOut = { active: C.init.active && visIds[cur] ? true : C.init.active, round: C.init.round, order: order, turn: Math.max(0, order.indexOf(cur)), hiddenTurn: C.init.active && !visIds[cur] };
    var party = C.tokens.filter(function (t) { return t.kind === 'pc'; }).map(function (t) { return { id: t.id, name: t.name, color: t.color, glyph: t.glyph, img: t.img, owner: ownerOf(t.id) }; });
    var names = {}; order.forEach(function (id) { var t = tok(id); names[id] = { name: t.name, color: t.color, glyph: t.glyph }; });
    return { map: pm, tokens: toks, init: initOut, initNames: names, templates: C.templates.filter(function (t) { return t.mapId === m.id; }), party: party, mine: mine,
      settings: { playersMove: C.settings.playersMove, turnOnly: C.settings.turnOnly, showNames: C.settings.showNames }, log: C.log.filter(function (e) { return !e.priv; }).slice(-30) };
  }
  var syncT = 0;
  function syncSoon() { clearTimeout(syncT); syncT = setTimeout(syncAll, 70); }
  function each(fn) { if (host) host.each(function (id) { fn(host, id); }); if (local) local.each(function (id) { fn(local, id); }); }
  function syncAll() { each(function (net, id) { sendState(net, id); }); renderLive(); }
  function sendState(net, id) {
    var s = stateFor(id), p = players[id] || (players[id] = { name: '', bg: null });
    net.send(id, { type: 'state', s: s });
    var key = s.map.bg && s.map.bg.key;
    if (key && p.bg !== key) { p.bg = key; DB.get(key).then(function (data) { if (data) net.send(id, { type: 'bg', key: key, data: data }); }); }
  }
  function broadcast(msg) { each(function (net, id) { net.send(id, msg); }); }
  function netHandlers(getNet) {
    return {
      onJoin: function (id) { players[id] = players[id] || { name: id.indexOf('screen-') === 0 ? 'Player screen' : '', bg: null, screen: id.indexOf('screen-') === 0 }; if (players[id].screen) sendState(getNet(), id); renderPlayers(); },
      onLeave: function (id) { var p = players[id]; delete players[id]; if (p && p.name && !p.screen) toast(p.name + ' left the table.'); renderPlayers(); renderLive(); },
      onMessage: function (id, m) { handle(getNet(), id, m || {}); },
      onError: function (e) { $('hostStatus').textContent = e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error' ? 'Lost the connection service. Reconnecting…' : 'Connection problem: ' + (e.type || e.message || e); }
    };
  }
  function canMove(name, t) {
    if (!t || (C.claims[name] || []).indexOf(t.id) < 0 || !C.settings.playersMove) return false;
    if (C.settings.turnOnly && C.init.active && C.init.order[C.init.turn] !== t.id) return false;
    return true;
  }
  function handle(net, id, m) {
    var p = players[id] = players[id] || { name: '', bg: null };
    if (m.type === 'hello') {
      var name = String(m.name || 'Player').slice(0, 30).trim() || 'Player';
      var taken = Object.keys(players).some(function (k) { return k !== id && players[k].name === name; });
      if (taken) name = name + ' 2';
      p.name = name; C.claims[name] = C.claims[name] || [];
      net.send(id, { type: 'welcome', name: name }); sendState(net, id); toast(name + ' joined the table.'); renderPlayers(); renderLive(); save(); return;
    }
    if (!p.name) return;
    var t = m.id ? tok(m.id) : null;
    if (m.type === 'claim' && t && t.kind === 'pc') {
      var owner = ownerOf(t.id); if (owner && owner !== p.name) { net.send(id, { type: 'toast', text: owner + ' is already playing ' + t.name + '.' }); return; }
      C.claims[p.name] = [t.id]; changed(); renderChars(); renderPlayers(); toast(p.name + ' is playing ' + t.name + '.');
    } else if (m.type === 'release') { C.claims[p.name] = []; changed(); renderChars(); renderPlayers(); }
    else if (m.type === 'move' && t) {
      if (!canMove(p.name, t)) { sendState(net, id); if (m.final) net.send(id, { type: 'toast', text: C.settings.turnOnly && C.init.active ? 'Wait for your turn.' : 'The DM has movement locked.' }); return; }
      var mm = map(); t.x = Math.max(0, Math.min(mm.cols - 1, m.final ? Math.round(m.x) : m.x)); t.y = Math.max(0, Math.min(mm.rows - 1, m.final ? Math.round(m.y) : m.y));
      if (m.final) changed(); else { refresh(); each(function (n2, id2) { if (id2 !== id) n2.send(id2, { type: 'move', id: t.id, x: t.x, y: t.y }); }); }
    } else if (m.type === 'cast' && t && (C.claims[p.name] || []).indexOf(t.id) > -1) {
      var sp = T.spell(m.spell); if (!sp || !m.g) return;
      aim = { spell: sp.id, from: T.center(t), caster: t.id }; cast(m.g, true);
    } else if (m.type === 'roll') {
      var r = T.roll(m.expr, m.mode); if (r) logEntry(p.name, (m.label ? m.label + ' ' : '') + m.expr, r, false);
    } else if (m.type === 'ping') {
      var ow = (C.claims[p.name] || [])[0], col = ow && tok(ow) ? tok(ow).color : '#ffd76b'; view.ping(m.x, m.y, col, p.name); broadcast({ type: 'ping', x: m.x, y: m.y, color: col, name: p.name });
    } else if (m.type === 'sheet' && t && (C.claims[p.name] || []).indexOf(t.id) > -1) {
      if (typeof m.hp === 'number') t.hp = Math.max(0, Math.min(t.maxHp, m.hp));
      if (m.slots) t.slots = m.slots;
      if (Array.isArray(m.conditions)) t.conditions = m.conditions.filter(function (c) { return T.CONDITIONS.indexOf(c) > -1; });
      changed(); renderChars(); if (selected === t.id) renderSheet();
    }
  }
  function renderPlayers() {
    var list = Object.keys(players).filter(function (id) { return players[id].name && !players[id].screen; });
    $('playersList').innerHTML = list.length ? list.map(function (id) { var p = players[id], c = (C.claims[p.name] || []).map(function (cid) { var t = tok(cid); return t ? t.name : ''; }).join(', '); return '<li><b>' + esc(p.name) + '</b> ' + (c ? 'playing ' + esc(c) : '<i>choosing a character</i>') + (c ? ' <button type="button" class="linklike" data-free="' + esc(p.name) + '">Unassign</button>' : '') + '</li>'; }).join('') : '<li class="muted">Nobody yet. Share the code.</li>';
  }
  $('playersList').addEventListener('click', function (e) { var b = e.target.closest('[data-free]'); if (b) { C.claims[b.dataset.free] = []; changed(); renderPlayers(); renderChars(); } });
  function renderLive() {
    var n = Object.keys(players).filter(function (id) { return players[id].name && !players[id].screen; }).length;
    $('live').hidden = !host; $('live').innerHTML = host ? '<span class="dot"></span>Code <b>' + esc(host.code) + '</b> · ' + n + ' player' + (n === 1 ? '' : 's') : '';
  }
  $('inviteBtn').addEventListener('click', function () { $('inviteOff').hidden = !!host; $('inviteOn').hidden = !host; $('sMove').checked = C.settings.playersMove; $('sTurn').checked = C.settings.turnOnly; $('sNames').checked = C.settings.showNames; renderPlayers(); $('inviteDlg').showModal(); });
  $('inviteClose').addEventListener('click', function () { $('inviteDlg').close(); });
  $('live').addEventListener('click', function () { $('inviteBtn').click(); });
  $('hostStart').addEventListener('click', function () {
    try {
      $('hostStatus').textContent = 'Opening the table…';
      host = MBNet.host(Object.assign(netHandlers(function () { return host; }), {
        onReady: function (code) {
          C.lastCode = code; save();
          var link = location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, '') + 'table.html#' + code;
          var q = new URLSearchParams(location.search).get('peer'); if (q) link = link.replace('#', '?peer=' + q + '#');
          $('hostCode').textContent = code; $('hostLink').value = link; $('inviteOff').hidden = true; $('inviteOn').hidden = false; $('hostStatus').textContent = '';
          $('qr').innerHTML = ''; if (window.QRCode) new QRCode($('qr'), { text: link, width: 148, height: 148, colorDark: '#15101c', colorLight: '#ffffff' });
          renderLive();
        }
      }), C.lastCode);
    } catch (e) { $('hostStatus').textContent = e.message; host = null; }
  });
  $('hostStop').addEventListener('click', function () { if (!confirm('End the game? Players are disconnected.')) return; if (host) host.close(); host = null; Object.keys(players).forEach(function (k) { if (!players[k].screen) delete players[k]; }); $('inviteDlg').close(); renderLive(); });
  $('copyLink').addEventListener('click', function () { navigator.clipboard.writeText($('hostLink').value).then(function () { toast('Link copied.'); }); });
  ['sMove', 'sTurn', 'sNames'].forEach(function (id) { $(id).addEventListener('change', function () { C.settings.playersMove = $('sMove').checked; C.settings.turnOnly = $('sTurn').checked; C.settings.showNames = $('sNames').checked; changed(); }); });
  $('screenBtn').addEventListener('click', function () {
    var q = new URLSearchParams(location.search).get('peer');
    window.open('table.html' + (q ? '?peer=' + q : '') + '#screen', 'mb-player-screen', 'width=1200,height=800');
  });

  /* ---------- change pipeline ---------- */
  function changed() { refresh(); save(); syncSoon(); renderLasting(); if (SET_TAB === 'turns') renderTurns(); }
  var toastT = 0;
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.hidden = false; t.classList.remove('out'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.hidden = true; }, 300); }, 2600); }

  /* ---------- keys ---------- */
  document.addEventListener('keydown', function (e) {
    if (e.target.closest('input, textarea, select, [contenteditable]')) return;
    var k = e.key.toLowerCase();
    if (e.key === 'Escape') { placing = null; setTool('select'); return; }
    if ((e.ctrlKey || e.metaKey) && k === 'z') { e.preventDefault(); doUndo(); return; }
    var map2 = { v: 'select', b: 'paint', r: 'room', e: 'erase', o: 'props', t: 'label', f: 'fog', m: 'ruler' };
    if (map2[k] && !e.ctrlKey && !e.metaKey) setTool(map2[k]);
    if ((k === 'delete' || k === 'backspace') && tool === 'props' && selProp) { snapshot(); var m = map(); m.props = m.props.filter(function (q) { return q.id !== selProp; }); selProp = null; renderOpts(); changed(); }
  });
  $('undoBtn').addEventListener('click', doUndo);
  $('zIn').addEventListener('click', function () { view.zoomAt(view.w / 2, view.h / 2, 1.25); });
  $('zOut').addEventListener('click', function () { view.zoomAt(view.w / 2, view.h / 2, 0.8); });
  $('zFit').addEventListener('click', function () { view.fit(); });

  /* ---------- start ---------- */
  function start(vault) {
    view = new T.View($('cv'), {
      role: 'dm', tool: function () { return tool; }, onTool: onTool, drawOverlay: drawOverlay, showNames: function () { return C && C.settings.showNames; },
      canMove: function () { return tool === 'select'; },
      onSelect: function (t) { if (t) select(t.id); else if (tool === 'select') { selected = null; view.sel = null; renderChars(); renderSheet(); renderCaster(); } },
      onMove: function (t, x, y, final) {
        if (final) { var m = map(); t.x = Math.max(0, Math.min(m.cols - 1, t.x)); t.y = Math.max(0, Math.min(m.rows - 1, t.y)); changed(); renderSheet(); return; }
        var now = performance.now(); if (now - lastMove > 45 && !t.hidden) { lastMove = now; broadcast({ type: 'move', id: t.id, x: x, y: y }); }
      },
      onDouble: function (w, t) { if (t) { select(t.id); document.querySelector('[data-tab="party"]').click(); } },
      onTap: function (w, e, t) { if (!t && tool === 'select' && e.altKey) { view.ping(w.x, w.y, '#ffd76b', 'DM'); broadcast({ type: 'ping', x: w.x, y: w.y, color: '#ffd76b', name: 'DM' }); } }
    });
    DB.get('campaign').then(function (saved) {
      C = saved || { v: 1, maps: [starterMap()], tokens: [], init: { order: [], turn: 0, round: 1, active: false }, templates: [], log: [], settings: { playersMove: true, turnOnly: false, showNames: false }, claims: {} };
      if (!saved) { C.current = C.maps[0].id; save(); }
      C.claims = C.claims || {}; C.settings = C.settings || { playersMove: true };
      parseBeasts(vault); spellGrid(); fillMaps(); loadBg(); refresh(); view.fit(); renderChars(); renderTurns(); renderLog(); renderCaster(); renderLasting(); setTool('select');
      local = MBNet.localHost(netHandlers(function () { return local; })); MBNet.pokeScreens();
      $('tbl').classList.remove('is-loading');
    });
  }
  MBSite.vaultReady.then(function (v) { if (v) start(v); });
  window.MBTableDM = { get C() { return C; }, view: function () { return view; } };
})();
