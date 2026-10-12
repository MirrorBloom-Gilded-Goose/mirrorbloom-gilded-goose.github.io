/* The Sanctum: lists the sealed pages and runs the table tools. */
(function () {
  var esc = function (s) { return MBSite.esc(s == null ? '' : s); };
  function store(key, val) {
    try { if (val === undefined) return JSON.parse(localStorage.getItem(key) || 'null'); localStorage.setItem(key, JSON.stringify(val)); } catch (e) { return null; }
  }
  function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }

  function lists(v) {
    var order = v.order || Object.keys(v.pages);
    var sb = '', best = '', adv = '', sec = '', arc = '';
    var TWIN = MBSigils.info;
    order.forEach(function (id) {
      var p = v.pages[id]; if (!p) return;
      var link = 'sealed.html#' + id;
      if (p.group === 'statblocks') {
        var sid = id.replace('statblock-', ''), info = TWIN[sid] || {};
        sb += '<a class="coin sb-coin" href="' + link + '"><div class="coin-face-wrap"><div class="coin-face ' + (info.above ? 'top' : 'shadow') + '"><span data-sigil="' + sid + '"></span></div></div><div class="coin-names"><span><span class="n">' + esc(p.title) + '</span><span class="e">' + esc(p.summary) + '</span></span></div></a>';
      } else {
        var row = '<div class="entry"><h3><a href="' + link + '">' + esc(p.title) + '</a></h3><div><p>' + esc(p.summary || '') + '</p></div></div>';
        if (p.group === 'bestiary') best += row;
        else if (p.group === 'adventures') adv += row;
        else if (p.group === 'secrets') sec += row;
        else if (p.group === 'archive') arc += row;
        else if (p.group !== 'guide') sec += row;
      }
    });
    document.getElementById('sbList').innerHTML = sb;
    document.getElementById('bestList').innerHTML = best;
    document.getElementById('advList').innerHTML = adv || '<p class="muted">No adventures sealed yet.</p>';
    document.getElementById('secList').innerHTML = sec;
    document.getElementById('arcList').innerHTML = arc || '<p class="muted">Nothing archived.</p>';
    MBSigils.render(document.getElementById('sbList'));
  }

  /* ---------- the Mirror Self ---------- */
  var ALIGN = { 'Lawful good': 'Chaotic evil', 'Neutral good': 'Neutral evil', 'Chaotic good': 'Lawful evil', 'Lawful neutral': 'Chaotic neutral', 'Neutral': 'Neutral, and hungry', 'Chaotic neutral': 'Lawful neutral', 'Lawful evil': 'Chaotic good', 'Neutral evil': 'Neutral good', 'Chaotic evil': 'Lawful good' };
  var CALL = {
    'Artificer': 'a maker of beautiful cages', 'Barbarian': 'a berserker who never quite comes back', 'Bard': 'a satirist whose songs ruin people', 'Cleric': 'a priest of Mistress Despair',
    'Druid': 'a keeper of the rot', 'Fighter': 'a duelist who fights for the pleasure of it', 'Monk': 'an ascetic of pain, theirs and other people’s', 'Paladin': 'an oathkeeper whose oath is cruelty',
    'Ranger': 'a poacher of the last of everything', 'Rogue': 'a thief who steals what cannot be replaced', 'Sorcerer': 'a vessel overflowing with stolen power', 'Warlock': 'bound to a shadow Archfey, and grateful for it',
    'Wizard': 'a ritualist chasing the knowledge that is outlawed for a reason', 'Commoner': 'the same trade, practiced for the opposite reasons'
  };
  var VIRTUE = { 'Kindness': 'cruelty that calls itself honesty', 'Courage': 'recklessness that gets other people killed', 'Honesty': 'lies so good they pass for truth', 'Loyalty': 'possessiveness', 'Curiosity': 'a hunger for forbidden things', 'Generosity': 'hoarding', 'Patience': 'spite that knows how to wait', 'Humility': 'contempt', 'Hope': 'despair, worn proudly', 'Mercy': 'vengeance' };
  var TELLS = ['a smile that opens far too wide', 'a third eye that never blinks', 'stitches where a face should join', 'teeth that rise like a crown', 'skin like wet paper', 'eyes that weep black', 'a second shadow that moves a beat late', 'hands with one too many joints'];
  var HOOKS = [
    '{M} has been looking for {N} for years.', '{M} does not know {N} exists, yet.', '{M} sends gifts. They arrive broken.', '{M} has heard of {N}’s good deeds, and has felt every one of them.',
    '{M} is the only person in Umbrasol who prays for {N} to fail.', '{M} owes a debt to the Hollow Host and plans to pay it with {N}.', '{M} keeps a diary of everything {N} has ever done right.'
  ];
  var ZONES = ['the Drowned Levels', 'the Starved Market', 'the Grinding Tiers', 'the Rootrot Gardens', 'the Gaslight Quarter', 'the Cracked Courts', 'the Fallreach', 'the Sunken Crown'];
  function mirrorName(n) { var r = n.trim().split('').reverse().join('').toLowerCase(); return r.charAt(0).toUpperCase() + r.slice(1); }
  function initMirror() {
    var a = document.getElementById('msAlign'), c = document.getElementById('msCall'), vv = document.getElementById('msVirtue');
    a.innerHTML = Object.keys(ALIGN).map(function (k) { return '<option' + (k === 'Chaotic good' ? ' selected' : '') + '>' + k + '</option>'; }).join('');
    c.innerHTML = Object.keys(CALL).map(function (k) { return '<option' + (k === 'Fighter' ? ' selected' : '') + '>' + k + '</option>'; }).join('');
    vv.innerHTML = Object.keys(VIRTUE).map(function (k) { return '<option>' + k + '</option>'; }).join('');
    document.getElementById('mirrorForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var N = document.getElementById('msName').value.trim() || 'Wren', M = mirrorName(N);
      var home = document.getElementById('msHome').value.trim();
      var lives = /everlast/i.test(home) ? 'the Last Shine, in ' + rnd(ZONES) : (home ? 'the reflection of ' + home : 'somewhere below the glass');
      var out = document.getElementById('msOut');
      out.innerHTML = '<p class="kicker">Below the glass</p><h4>' + esc(M) + '</h4>' +
        '<dl class="facts"><dt>Alignment</dt><dd>' + esc(ALIGN[a.value]) + '</dd><dt>Calling</dt><dd>' + esc(CALL[c.value]) + '</dd><dt>Defined by</dt><dd>' + esc(VIRTUE[vv.value]) + '</dd>' +
        '<dt>Umbrasol calls them beautiful for</dt><dd>' + esc(rnd(TELLS)) + '</dd><dt>Lives in</dt><dd>' + esc(lives) + '</dd></dl>' +
        '<p>' + esc(rnd(HOOKS).replace(/\{M\}/g, M).replace(/\{N\}/g, N)) + ' Every time ' + esc(N) + ' does real good, ' + esc(M) + ' grows a little crueler.</p>' +
        '<p class="btn-row"><button class="btn small" type="button" id="msAgain">Look again</button></p>';
      out.classList.remove('hidden'); out.classList.remove('flip'); void out.offsetWidth; out.classList.add('flip');
      document.getElementById('msAgain').addEventListener('click', function () { document.getElementById('mirrorForm').requestSubmit(); });
    });
  }

  /* ---------- initiative ---------- */
  function initInitiative() {
    var st = store('mb-initiative') || { list: [], turn: 0, round: 1 };
    var body = document.getElementById('initBody');
    function save() { store('mb-initiative', st); }
    function draw() {
      st.list.sort(function (a, b) { return b.init - a.init; });
      body.innerHTML = st.list.map(function (c, i) {
        return '<tr class="' + (i === st.turn ? 'is-turn' : '') + '"><td>' + c.init + '</td><td>' + esc(c.name) + '</td><td><input class="hp" type="number" data-i="' + i + '" value="' + (c.hp == null ? '' : c.hp) + '" aria-label="Hit points for ' + esc(c.name) + '"></td><td>' + (c.ac == null ? '' : c.ac) + '</td><td><button class="btn small" type="button" data-rm="' + i + '" aria-label="Remove ' + esc(c.name) + '">Remove</button></td></tr>';
      }).join('') || '<tr><td colspan="5" class="muted">Add combatants to begin.</td></tr>';
      document.getElementById('roundLbl').textContent = 'Round ' + st.round;
    }
    document.getElementById('initForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var n = document.getElementById('inName'), i = document.getElementById('inInit'), h = document.getElementById('inHp'), a = document.getElementById('inAc');
      st.list.push({ name: n.value, init: +i.value, hp: h.value === '' ? null : +h.value, ac: a.value === '' ? null : +a.value });
      n.value = i.value = h.value = a.value = ''; n.focus(); save(); draw();
    });
    body.addEventListener('click', function (e) {
      var b = e.target.closest('[data-rm]'); if (!b) return;
      st.list.splice(+b.dataset.rm, 1); if (st.turn >= st.list.length) st.turn = 0; save(); draw();
    });
    body.addEventListener('change', function (e) {
      if (!e.target.classList.contains('hp')) return;
      st.list[+e.target.dataset.i].hp = e.target.value === '' ? null : +e.target.value; save();
    });
    document.getElementById('nextTurn').addEventListener('click', function () {
      if (!st.list.length) return;
      st.turn++; if (st.turn >= st.list.length) { st.turn = 0; st.round++; } save(); draw();
    });
    document.getElementById('clearInit').addEventListener('click', function () { st = { list: [], turn: 0, round: 1 }; save(); draw(); });
    draw();
  }

  /* ---------- encounters ---------- */
  function initEncounters(v) {
    var t = v.tables || [], sel = document.getElementById('encRealm'), list = document.getElementById('encList');
    sel.innerHTML = t.map(function (r, i) { return '<option value="' + i + '">' + esc(r.realm) + ' (' + esc(r.owner) + ')</option>'; }).join('');
    function show() {
      var r = t[+sel.value]; if (!r) return;
      list.innerHTML = r.rows.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('');
      list.setAttribute('data-die', 'd' + r.rows.length);
    }
    sel.addEventListener('change', show);
    document.getElementById('encRoll').addEventListener('click', function () {
      var items = list.querySelectorAll('li'); if (!items.length) return;
      items.forEach(function (li) { li.classList.remove('rolled'); });
      var pick = items[Math.floor(Math.random() * items.length)]; void pick.offsetWidth; pick.classList.add('rolled');
    });
    show();
  }

  /* ---------- threads ---------- */
  function initThreads(v) {
    var saved = store('mb-threads');
    var threads = saved || (v.threads || []).map(function (x) { return { t: x.t, s: x.s, n: x.n }; });
    var ul = document.getElementById('threadList'), CYCLE = ['open', 'brewing', 'resolved'];
    function draw() {
      ul.innerHTML = threads.map(function (x, i) {
        return '<li class="thread is-' + x.s + '"><button type="button" class="status" data-i="' + i + '" aria-label="Status: ' + x.s + '. Click to change.">' + x.s + '</button><div><strong>' + esc(x.t) + '</strong>' + (x.n ? '<span>' + esc(x.n) + '</span>' : '') + '</div></li>';
      }).join('');
    }
    ul.addEventListener('click', function (e) {
      var b = e.target.closest('.status'); if (!b) return;
      var x = threads[+b.dataset.i]; x.s = CYCLE[(CYCLE.indexOf(x.s) + 1) % CYCLE.length]; store('mb-threads', threads); draw();
    });
    document.getElementById('threadForm').addEventListener('submit', function (e) {
      e.preventDefault(); var i = document.getElementById('thTitle');
      threads.unshift({ t: i.value, s: 'open', n: '' }); i.value = ''; store('mb-threads', threads); draw();
    });
    draw();
  }

  MBSite.vaultReady.then(function (v) {
    if (!v) return;
    lists(v); initMirror(); initInitiative(); initEncounters(v); initThreads(v);
    document.getElementById('lockBtn').addEventListener('click', function () { MBVault.lock(); location.href = 'index.html'; });
    if (location.hash) { var el = document.querySelector(location.hash); if (el) el.scrollIntoView(); }
  });
})();
