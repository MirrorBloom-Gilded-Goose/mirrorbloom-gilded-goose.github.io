/* ==========================================================================
   THE TABLE — the players' side
   Join with the DM's code, see the map through the fog, move your character,
   cast spells, roll dice. With #screen it is the DM's TV view instead.
   ========================================================================== */
(function () {
  var T = window.MBTable, esc = MBSite.esc;
  function $(id) { return document.getElementById(id); }
  function load(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  var screenMode = location.hash === '#screen';
  var S = null, net = null, view = null, mine = {}, myName = '', mode = 'select', aimSpell = null, measure = null, bgKey = null, lastSend = 0, fitted = null;

  /* ---------- the view ---------- */
  function setup() {
    view = new T.View($('cv'), {
      role: 'player', tool: function () { return mode === 'select' ? 'select' : mode; },
      showNames: function () { return S && S.settings && S.settings.showNames; },
      canMove: function (t) {
        if (!mine[t.id] || !S || !S.settings.playersMove) return false;
        if (S.settings.turnOnly && S.init.active && (S.init.hiddenTurn || S.init.order[S.init.turn] !== t.id)) return false;
        return true;
      },
      onMove: function (t, x, y, final) {
        var now = performance.now();
        if (final || now - lastSend > 50) { lastSend = now; net.send({ type: 'move', id: t.id, x: x, y: y, final: !!final }); }
      },
      onTool: function (phase, w) {
        if (mode === 'aim' && phase === 'down') return castAt(w);
        if (mode === 'ping' && phase === 'down') { net.send({ type: 'ping', x: w.x, y: w.y }); setMode('select'); return; }
        if (mode === 'ruler') { measure = phase === 'up' ? null : { a: measure && phase !== 'down' ? measure.a : w, b: w }; view.dirty = true; }
      },
      onTap: function (w, e, t) {
        if (t && !mine[t.id] && S && S.settings.playersMove && Object.keys(mine).length === 0) openDrawer('choose');
      },
      onDouble: function (w) { if (net) net.send({ type: 'ping', x: w.x, y: w.y }); },
      drawOverlay: function (x, z) {
        if (measure) {
          var a = { x: Math.floor(measure.a.x) + .5, y: Math.floor(measure.a.y) + .5 }, b = { x: Math.floor(measure.b.x) + .5, y: Math.floor(measure.b.y) + .5 };
          x.strokeStyle = '#ffd76b'; x.lineWidth = 3 / z; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke();
          T.pill(x, z, b.x, b.y - .6, Math.max(Math.abs(b.x - a.x), Math.abs(b.y - a.y)) * 5 + ' ft');
        }
        if (mode === 'aim' && aimSpell && view.mouse) {
          var sp = T.spell(aimSpell), g = geom(sp, view.mouse), me = myToken();
          if (me && sp.range) { x.strokeStyle = 'rgba(255,255,255,.25)'; x.lineWidth = 1.5 / z; x.setLineDash([3 / z, 5 / z]); x.beginPath(); x.arc(g.ox, g.oy, sp.range / 5 + .5, 0, 7); x.stroke(); x.setLineDash([]); }
          if (sp.shape === 'target' || sp.shape === 'teleport') { x.strokeStyle = sp.color; x.lineWidth = 2 / z; x.beginPath(); x.moveTo(g.ox, g.oy); x.lineTo(g.x, g.y); x.stroke(); x.beginPath(); x.arc(g.x, g.y, .45, 0, 7); x.stroke(); }
          else T.drawArea(x, sp, g, z);
        }
      }
    });
  }
  function exposeView() { window.__mbPlayerView = view; }
  function myToken() { if (!S) return null; for (var i = 0; i < S.tokens.length; i++) if (mine[S.tokens[i].id]) return S.tokens[i]; return null; }
  function setMode(m) {
    mode = m; measure = null; if (m !== 'aim') aimSpell = null;
    $('btnMeasure').setAttribute('aria-pressed', m === 'ruler' ? 'true' : 'false'); $('btnPing').setAttribute('aria-pressed', m === 'ping' ? 'true' : 'false');
    var h = m === 'aim' ? 'Tap where your spell lands.' : m === 'ruler' ? 'Drag to measure.' : m === 'ping' ? 'Tap the map to point at something.' : '';
    $('hint').hidden = !h; $('hint').textContent = h; view.dirty = true;
  }
  $('btnMeasure').addEventListener('click', function () { setMode(mode === 'ruler' ? 'select' : 'ruler'); });
  $('btnPing').addEventListener('click', function () { setMode(mode === 'ping' ? 'select' : 'ping'); });
  $('btnFind').addEventListener('click', function () { var t = myToken(); if (t) { view.cam.z = Math.max(view.cam.z, 44); view.centerOn(t.x + .5, t.y + .5); } else view.fit(); });
  $('zIn').addEventListener('click', function () { view.zoomAt(view.w / 2, view.h / 2, 1.25); });
  $('zOut').addEventListener('click', function () { view.zoomAt(view.w / 2, view.h / 2, 0.8); });
  $('zFit').addEventListener('click', function () { view.fit(); });
  $('zFull').addEventListener('click', function () { var el = document.documentElement; if (document.fullscreenElement) document.exitFullscreen(); else if (el.requestFullscreen) el.requestFullscreen().catch(function () {}); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setMode('select'); closeDrawer(); } });

  /* ---------- messages ---------- */
  function onMessage(m) {
    if (!m) return;
    if (m.type === 'welcome') { myName = m.name; $('jStatus').textContent = ''; showPlay(); }
    else if (m.type === 'state') applyState(m.s);
    else if (m.type === 'bg') { bgKey = m.key; var im = new Image(); im.onload = function () { view.setBg(im); }; im.src = m.data; }
    else if (m.type === 'move') { var t = view.find(m.id); if (t && !(view.drag && view.drag.id === m.id)) { t.x = m.x; t.y = m.y; view.dirty = true; } }
    else if (m.type === 'fx') view.play(m.spell, m.g);
    else if (m.type === 'ping') view.ping(m.x, m.y, m.color, m.name);
    else if (m.type === 'log') { if (S) { S.log.push(m.entry); S.log = S.log.slice(-30); } renderLog(); popRoll(m.entry); }
    else if (m.type === 'toast') toast(m.text);
  }
  function applyState(s) {
    var firstMap = !S || S.map.id !== s.map.id;
    S = s; mine = {}; (s.mine || []).forEach(function (id) { mine[id] = true; }); view.mine = mine;
    if (!s.map.bg) view.setBg(null);
    var drag = view.drag && view.drag.kind === 'token' ? view.find(view.drag.id) : null;
    view.setState({ map: s.map, tokens: s.tokens, init: { active: s.init.active && !s.init.hiddenTurn, order: s.init.order, turn: s.init.turn }, templates: s.templates });
    if (drag) { var nt = view.find(drag.id); if (nt) { nt.x = drag.x; nt.y = drag.y; } }
    if (firstMap || fitted !== s.map.id) { fitted = s.map.id; setTimeout(function () { view.fit(); }, 30); }
    var me = myToken();
    if (me && centered !== me.id) { centered = me.id; setTimeout(function () { if (view.w < 760 || view.cam.z < 26) { view.cam.z = Math.max(view.cam.z, 40); } view.centerOn(me.x + .5, me.y + .5); }, 60); }
    renderTop(); renderInit(); renderLog(); if (!$('drawer').hidden) renderDrawer();
    if (!screenMode && !s.mine.length && s.party.length && $('drawer').hidden && !chosePrompted) { chosePrompted = true; openDrawer('choose'); }
  }
  var chosePrompted = false, centered = null;

  /* ---------- top bar ---------- */
  function chip(t) { return '<span class="cr-dot" style="background:' + esc(t.color) + '">' + (t.img ? '<img src="' + esc(t.img) + '" alt="">' : esc((t.glyph || t.name || '?').slice(0, 2))) + '</span>'; }
  function renderTop() {
    if (screenMode) return;
    var t = myToken(), p = S.party.filter(function (x) { return mine[x.id]; })[0];
    $('me').innerHTML = p ? chip(p) + '<span><b>' + esc(p.name) + '</b>' + (t && t.maxHp ? '<small>' + t.hp + ' / ' + t.maxHp + ' HP</small>' : '<small>not on the map yet</small>') + '</span>' : '<span><b>' + esc(myName) + '</b><small>Choose your character</small></span>';
  }
  $('me').addEventListener('click', function () { openDrawer(Object.keys(mine).length ? 'sheet' : 'choose'); });
  function renderInit() {
    var I = S.init, el = $('initStrip');
    if (!I.active || !I.order.length) { el.innerHTML = ''; el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = '<span class="round">Round ' + I.round + '</span>' + I.order.map(function (id, i) {
      var n = S.initNames[id] || { name: '?' }; return '<span class="ini' + (!I.hiddenTurn && i === I.turn ? ' now' : '') + (mine[id] ? ' me' : '') + '" title="' + esc(n.name) + '">' + chip(n) + '<em>' + esc(n.name) + '</em></span>';
    }).join('');
    var now = el.querySelector('.now'); if (now) now.scrollIntoView({ inline: 'center', block: 'nearest' });
  }

  /* ---------- drawers ---------- */
  var drawer = null, TITLES = { choose: 'Your character', spells: 'Spells', dice: 'Dice', sheet: 'Your sheet' };
  function openDrawer(d) { drawer = d; $('drawer').hidden = false; $('drTitle').textContent = TITLES[d]; document.querySelectorAll('.dr-body').forEach(function (b) { b.hidden = b.dataset.d !== d; }); renderDrawer(); }
  function closeDrawer() { $('drawer').hidden = true; drawer = null; }
  $('drClose').addEventListener('click', closeDrawer);
  document.querySelectorAll('[data-drawer]').forEach(function (b) { b.addEventListener('click', function () { if (drawer === b.dataset.drawer) closeDrawer(); else openDrawer(b.dataset.drawer === 'sheet' && !Object.keys(mine).length ? 'choose' : b.dataset.drawer); }); });
  function renderDrawer() {
    if (!S) return;
    if (drawer === 'choose') {
      $('partyList').innerHTML = S.party.length ? S.party.map(function (p) {
        var taken = p.owner && p.owner !== myName;
        return '<button type="button" class="cr' + (mine[p.id] ? ' on' : '') + (taken ? ' off' : '') + '" data-claim="' + p.id + '"' + (taken ? ' disabled' : '') + '>' + chip(p) + '<span class="cr-main"><b>' + esc(p.name) + '</b>' + (p.owner ? '<i class="own">' + esc(p.owner === myName ? 'you' : p.owner) + '</i>' : '') + '</span></button>';
      }).join('') + (Object.keys(mine).length ? '<p><button type="button" class="linklike" id="release">Stop playing this character</button></p>' : '') : '<p class="muted">The DM has not added any player characters yet.</p>';
    } else if (drawer === 'spells') {
      var me = myToken();
      $('spellNote').textContent = me ? 'Casting as ' + me.name + '. Pick a spell, then tap the map. The DM handles the damage.' : 'Your character needs to be on the map to cast.';
      $('spellGrid').innerHTML = T.SPELLS.map(function (s) { return '<button type="button" class="spell" data-spell="' + s.id + '" style="--sc:' + s.color + '"' + (me ? '' : ' disabled') + '><b>' + esc(s.name) + '</b><small>' + (s.lvl ? 'Level ' + s.lvl : 'Cantrip') + (s.dmg ? ' · ' + s.dmg : s.heal ? ' · heals ' + s.heal : '') + '</small></button>'; }).join('');
    } else if (drawer === 'dice') renderLog();
    else if (drawer === 'sheet') renderSheet();
  }
  $('partyList').addEventListener('click', function (e) {
    var b = e.target.closest('[data-claim]'); if (b) { net.send({ type: 'claim', id: b.dataset.claim }); closeDrawer(); return; }
    if (e.target.id === 'release') { net.send({ type: 'release' }); }
  });

  /* spells */
  function geom(sp, w) {
    var me = myToken(), o = me ? T.center(me) : { x: w.x, y: w.y };
    if (sp.shape === 'sphere') return { ox: o.x, oy: o.y, x: Math.round(w.x), y: Math.round(w.y) };
    if (sp.shape === 'target' || sp.shape === 'teleport') { var tt = view.tokenAt(w.x, w.y), c = tt ? T.center(tt) : { x: Math.floor(w.x) + .5, y: Math.floor(w.y) + .5 }; return { ox: o.x, oy: o.y, x: c.x, y: c.y, target: tt && tt.id }; }
    if (sp.shape === 'aura') return { ox: o.x, oy: o.y, x: o.x, y: o.y };
    return { ox: o.x, oy: o.y, x: w.x, y: w.y };
  }
  $('spellGrid').addEventListener('click', function (e) {
    var b = e.target.closest('[data-spell]'); if (!b) return; var sp = T.spell(b.dataset.spell), me = myToken(); if (!me) return;
    closeDrawer();
    if (sp.shape === 'aura') { net.send({ type: 'cast', id: me.id, spell: sp.id, g: geom(sp, T.center(me)) }); return; }
    aimSpell = sp.id; setMode('aim');
  });
  function castAt(w) { var me = myToken(), sp = T.spell(aimSpell); if (!me || !sp) return setMode('select'); net.send({ type: 'cast', id: me.id, spell: sp.id, g: geom(sp, w) }); setMode('select'); }

  /* dice */
  ['d4', 'd6', 'd8', 'd10', 'd12', 'd20', 'd100'].forEach(function (d) { $('diceRow').insertAdjacentHTML('beforeend', '<button type="button" class="die" data-die="1' + d + '">' + d + '</button>'); });
  function dmode() { return (document.querySelector('input[name="dmode"]:checked') || {}).value || ''; }
  $('diceRow').addEventListener('click', function (e) { var b = e.target.closest('[data-die]'); if (b) net.send({ type: 'roll', expr: b.dataset.die, mode: dmode() }); });
  $('diceForm').addEventListener('submit', function (e) { e.preventDefault(); var v = $('diceExpr').value.trim(); if (v) net.send({ type: 'roll', expr: v, mode: dmode() }); });
  function renderLog() {
    if (!S) return;
    $('log').innerHTML = S.log.slice().reverse().map(function (e) { return '<li class="' + (e.crit ? 'crit' : '') + (e.fumble ? ' fumble' : '') + '"><span class="lw">' + esc(e.who) + '</span> ' + esc(e.text) + (e.total != null ? ' <b class="lt">' + e.total + '</b><small>' + esc(e.detail || '') + '</small>' : '') + '</li>'; }).join('');
  }
  var popT = 0;
  function popRoll(e) {
    if (e.total == null) { toast(e.who + ' ' + e.text); return; }
    var p = $('rollPop'); p.innerHTML = '<span>' + esc(e.who) + ' · ' + esc(e.text) + '</span><b>' + e.total + '</b><small>' + esc(e.detail || '') + '</small>';
    p.className = 'roll-pop' + (e.crit ? ' crit' : '') + (e.fumble ? ' fumble' : ''); p.hidden = false; void p.offsetWidth; p.classList.add('in');
    clearTimeout(popT); popT = setTimeout(function () { p.classList.remove('in'); setTimeout(function () { p.hidden = true; }, 300); }, 3200);
  }

  /* sheet */
  function renderSheet() {
    var t = myToken(); var el = $('sheet');
    if (!t) { el.innerHTML = '<p class="muted">Your character is not on the map yet. The DM places them.</p>'; return; }
    var slots = '';
    for (var lv = 1; lv <= 9; lv++) { var sl = (t.slots || {})[lv]; if (!sl || !sl[1]) continue; slots += '<span class="slot" data-lv="' + lv + '"><small>' + lv + '</small>'; for (var i = 0; i < sl[1]; i++) slots += '<button type="button" class="pip' + (i < sl[0] ? ' used' : '') + '" data-pip="' + i + '" aria-label="Level ' + lv + ' slot"></button>'; slots += '</span>'; }
    el.innerHTML = '<div class="sh-top">' + chip(t) + '<b class="sh-name">' + esc(t.name) + '</b></div>' +
      '<p class="sh-big"><b>' + t.hp + '</b> / ' + t.maxHp + ' HP · AC ' + (t.ac || '?') + ' · Speed ' + (t.speed || 30) + ' ft</p>' +
      '<div class="sh-hp"><button type="button" class="btn small" data-hp="-">Damage</button><input type="number" id="hpAmt" min="0" placeholder="0" aria-label="Amount"><button type="button" class="btn small" data-hp="+">Heal</button></div>' +
      (slots ? '<h5>Spell slots <small>(tap to spend)</small></h5><div class="slots">' + slots + '</div>' : '') +
      '<h5>Conditions</h5><div class="conds">' + T.CONDITIONS.map(function (c) { return '<button type="button" class="cond' + ((t.conditions || []).indexOf(c) > -1 ? ' on' : '') + '" data-cond="' + c + '" style="--cc:' + T.COND_COLOR[c] + '">' + c + '</button>'; }).join('') + '</div>';
  }
  $('sheet').addEventListener('click', function (e) {
    var t = myToken(), b = e.target.closest('button'); if (!t || !b) return;
    if (b.dataset.hp) { var a = Math.abs(+$('hpAmt').value || 0); if (!a) { $('hpAmt').focus(); return; } net.send({ type: 'sheet', id: t.id, hp: Math.max(0, Math.min(t.maxHp, t.hp + (b.dataset.hp === '-' ? -a : a))) }); return; }
    if (b.dataset.cond) { var c = (t.conditions || []).slice(), i = c.indexOf(b.dataset.cond); if (i > -1) c.splice(i, 1); else c.push(b.dataset.cond); net.send({ type: 'sheet', id: t.id, conditions: c }); return; }
    if (b.dataset.pip != null) { var lv = b.closest('[data-lv]').dataset.lv, slots = JSON.parse(JSON.stringify(t.slots || {})), sl = slots[lv], idx = +b.dataset.pip; sl[0] = idx < sl[0] ? idx : idx + 1; net.send({ type: 'sheet', id: t.id, slots: slots }); }
  });

  /* ---------- toast ---------- */
  var toastT = 0;
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.hidden = false; t.classList.remove('out'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.hidden = true; }, 300); }, 2600); }

  /* ---------- joining ---------- */
  function showPlay() { $('join').hidden = true; $('play').hidden = false; document.documentElement.classList.add('at-table'); setTimeout(function () { view.resize(); if (S) view.fit(); }, 30); }
  function conn(s, cls) { $('conn').textContent = s; $('conn').className = 'pl-conn ' + (cls || ''); }
  function joinGame(code, name) {
    $('jStatus').textContent = 'Finding the table…';
    try {
      net = MBNet.join(code, {
        onOpen: function () { conn('Connected', 'ok'); net.send({ type: 'hello', name: name }); },
        onMessage: onMessage,
        onClose: function () { conn('Reconnecting…', 'warn'); },
        onError: function (e) {
          if (e.type === 'nohost') { $('jStatus').textContent = 'No game with that code right now. Check the code, or ask your DM to press Invite players. Still trying…'; conn('Waiting for the DM…', 'warn'); }
          else if (e.type === 'gone') { $('jStatus').textContent = 'Could not reach the game.'; conn('Disconnected', 'bad'); }
          else if (e.type === 'network' || e.type === 'server-error' || e.type === 'socket-error') { conn('Connection service unreachable. Retrying…', 'warn'); $('jStatus').textContent = 'The connection service is unreachable. Check your internet.'; }
        }
      });
    } catch (e) { $('jStatus').textContent = e.message; }
  }
  $('joinForm').addEventListener('submit', function (e) {
    e.preventDefault();
    var code = $('jCode').value.trim().toUpperCase(), name = $('jName').value.trim();
    if (code.length !== 5) { $('jStatus').textContent = 'The code has five letters and numbers.'; return; }
    save('mb-table-name', name); save('mb-table-code', code); history.replaceState(null, '', location.pathname + location.search + '#' + code);
    joinGame(code, name);
  });

  setup(); exposeView();
  if (screenMode) {
    document.documentElement.classList.add('at-table', 'table-screen');
    $('join').hidden = true; $('play').hidden = false; myName = 'screen';
    net = MBNet.localJoin({ onMessage: onMessage, onOpen: function () { conn('Player screen', 'ok'); } });
    setTimeout(function () { view.resize(); }, 50);
  } else {
    var hash = location.hash.replace('#', '').toUpperCase();
    $('jCode').value = /^[A-Z0-9]{5}$/.test(hash) ? hash : load('mb-table-code', '');
    $('jName').value = load('mb-table-name', '');
    ($('jCode').value ? $('jName') : $('jCode')).focus();
  }
})();
window.MBTablePlayer = { view: function () { return document.getElementById('cv') && window.__mbPlayerView; } };
