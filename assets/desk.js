/* ==========================================================================
   WRITER'S DESK
   A sealed writing room: drafts saved in this browser, a break timer, your
   canon in quick tabs, grammar and house-rule checks, and (with your own
   Claude API key) canon questions and paragraph cleanup.
   ========================================================================== */
(function () {
  var esc = MBSite.esc, C = window.DeskCheck;
  function $(id) { return document.getElementById(id); }
  function load(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
  function today() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function fmtN(n) { return n.toLocaleString(); }

  var root = $('desk'), ta = $('edTa'), back = $('edBack'), scroller = $('edScroll');
  var SET = Object.assign({ autofix: true, names: true, panel: true, tab: 'lore', loreCat: 'cast', work: 5, brk: 3, sound: true, model: 'claude-haiku-5-5', askDraft: true, echo: true, readRate: 1, voice: '' }, load('desk-settings', {}));
  function saveSet() { save('desk-settings', SET); }
  var CANON = null;

  /* ======================= drafts ======================= */
  var Docs = {
    index: function () { return load('desk-docs', []); },
    saveIndex: function (a) { save('desk-docs', a); },
    get: function (id) { return load('desk-doc-' + id, null); },
    put: function (doc) {
      doc.updated = Date.now();
      var ok = save('desk-doc-' + doc.id, doc);
      if (!ok) { trimSnaps(); ok = save('desk-doc-' + doc.id, doc); }
      var idx = Docs.index().filter(function (d) { return d.id !== doc.id; });
      idx.unshift({ id: doc.id, title: doc.title, updated: doc.updated });
      Docs.saveIndex(idx);
      return ok;
    },
    remove: function (id) { try { localStorage.removeItem('desk-doc-' + id); localStorage.removeItem('desk-snap-' + id); } catch (e) {} Docs.saveIndex(Docs.index().filter(function (d) { return d.id !== id; })); },
    create: function (title, text) { var d = { id: uid(), title: title || '', text: text || '', notes: '', checks: {}, goal: 2000, created: Date.now() }; Docs.put(d); return d; }
  };
  function trimSnaps() { Docs.index().forEach(function (d) { var s = load('desk-snap-' + d.id, []); if (s.length > 3) save('desk-snap-' + d.id, s.slice(0, 3)); }); }
  var doc = null, lastSnap = 0, dirty = false;

  function openDoc(id) {
    flushSave();
    doc = Docs.get(id) || Docs.create();
    doc.checks = doc.checks || {}; doc.goal = doc.goal || 2000;
    SET.current = doc.id; saveSet();
    ta.value = doc.text || ''; $('docTitle').value = doc.title || ''; $('docNotes').value = doc.notes || ''; $('goalIn').value = doc.goal;
    var t = load('desk-today', {}); if (t.date !== today()) t = { date: today(), base: {} };
    if (t.base[doc.id] == null) t.base[doc.id] = C.countWords(ta.value); save('desk-today', t);
    lastSnap = Date.now();
    fillPicker(); grow(); refresh(true); renderChecklist(); renderSnaps(); hidePop();
    scroller.scrollTop = 0;
  }
  function fillPicker() {
    var idx = Docs.index();
    $('docPick').innerHTML = idx.map(function (d) { return '<option value="' + d.id + '"' + (doc && d.id === doc.id ? ' selected' : '') + '>' + esc(d.title || 'Untitled chapter') + '</option>'; }).join('');
  }
  var saveT = 0;
  function queueSave() { dirty = true; clearTimeout(saveT); saveT = setTimeout(flushSave, 700); $('saved').textContent = 'Saving…'; }
  function flushSave() {
    if (!doc || !dirty) return; dirty = false;
    doc.text = ta.value; doc.title = $('docTitle').value.trim(); doc.notes = $('docNotes').value;
    var ok = Docs.put(doc);
    $('saved').textContent = ok ? 'Saved ' + new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : 'Not saved: this browser is full. Back up and delete old drafts.';
    if (Date.now() - lastSnap > 10 * 60000) { snapshot(); lastSnap = Date.now(); }
  }
  function snapshot() {
    var s = load('desk-snap-' + doc.id, []);
    if (s[0] && s[0].text === doc.text) return;
    s.unshift({ at: Date.now(), words: C.countWords(doc.text), text: doc.text });
    if (!save('desk-snap-' + doc.id, s.slice(0, 12))) save('desk-snap-' + doc.id, s.slice(0, 4));
    renderSnaps();
  }
  function renderSnaps() {
    var s = load('desk-snap-' + doc.id, []);
    $('snaps').innerHTML = s.length ? s.map(function (x, i) {
      return '<li><span>' + new Date(x.at).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + ' · ' + fmtN(x.words) + ' words</span><button class="linklike" type="button" data-snap="' + i + '">Restore</button></li>';
    }).join('') : '<li class="muted">None yet.</li>';
  }
  $('snaps').addEventListener('click', function (e) {
    var b = e.target.closest('[data-snap]'); if (!b) return;
    var s = load('desk-snap-' + doc.id, []), x = s[+b.dataset.snap]; if (!x) return;
    if (!confirm('Replace this draft with the version from ' + new Date(x.at).toLocaleString() + '? The current text is saved as a version first.')) return;
    lastSnap = 0; dirty = true; flushSave(); snapshot();
    replaceAll(x.text); toast('Version restored. Ctrl Z undoes it.');
  });
  window.addEventListener('beforeunload', flushSave);
  document.addEventListener('visibilitychange', function () { if (document.hidden) flushSave(); });

  /* ======================= editor ======================= */
  function grow() { ta.style.height = 'auto'; ta.style.height = Math.max(ta.scrollHeight, scroller.clientHeight * 0.6) + 'px'; }
  function replaceRange(s, e, rep) {
    ta.focus(); ta.setSelectionRange(s, e);
    var ok = false;
    try { ok = rep === '' ? document.execCommand('delete') : document.execCommand('insertText', false, rep); } catch (x) {}
    if (!ok || ta.value.slice(s, s + rep.length) !== rep) ta.setRangeText(rep, s, e, 'end');
  }
  function replaceAll(text) { ta.focus(); ta.select(); var ok = false; try { ok = document.execCommand('insertText', false, text); } catch (x) {} if (!ok) ta.value = text; afterEdit(); }

  var houseIssues = [], ltList = [], merged = [], nameRe = null, nameMap = {}, renderQueued = false;
  var AMBIG = { Will: 1, Hope: 1, Horse: 1, Penny: 1, Maple: 1, Rob: 1, Tim: 1, Jack: 1, Despair: 1, Steve: 0 };
  function buildNames() {
    nameMap = {}; var list = [];
    (CANON && CANON.entries || []).forEach(function (en, i) {
      [en.name].concat(en.aka || []).forEach(function (n) { if (n.length >= 3 && /^[A-Z]/.test(n) && !/^(The|That) [a-z]/.test(n)) { nameMap[n] = i; list.push(n); } });
    });
    list.sort(function (a, b) { return b.length - a.length; });
    nameRe = list.length ? new RegExp('\\b(' + list.map(function (n) { return n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')(?![A-Za-z])', 'g') : null;
  }
  function nameMarks(text) {
    if (!SET.names || !nameRe) return [];
    var out = [], m; nameRe.lastIndex = 0;
    while ((m = nameRe.exec(text))) {
      if (AMBIG[m[1]]) { var pre = text.slice(Math.max(0, m.index - 3), m.index); if (!pre.trim() || /[.!?"“\n]\s*$/.test(pre) || m.index === 0) continue; }
      out.push({ s: m.index, e: m.index + m[1].length, kind: 'name', name: m[1], entry: nameMap[m[1]] });
    }
    return out;
  }
  var PRI = { read: -1, house: 0, grammar: 1, spelling: 1, style: 2, name: 3 };
  var readMark = null;
  function mergeAll(text) {
    var all = houseIssues.concat(ltList, nameMarks(text), readMark ? [readMark] : []);
    all.sort(function (a, b) { return PRI[a.kind] - PRI[b.kind] || a.s - b.s; });
    var taken = [];
    all.forEach(function (it) {
      if (it.e <= it.s || it.e > text.length) return;
      for (var i = 0; i < taken.length; i++) if (it.s < taken[i].e && it.e > taken[i].s) return;
      taken.push(it);
    });
    taken.sort(function (a, b) { return a.s - b.s; });
    return taken;
  }
  function renderBack() {
    renderQueued = false;
    var text = ta.value, caret = ta.selectionStart, html = '', pos = 0;
    merged = mergeAll(text);
    function piece(a, b) {
      if (caret >= a && caret < b) return esc(text.slice(a, caret)) + '<span class="cm"></span>' + esc(text.slice(caret, b));
      return esc(text.slice(a, b));
    }
    merged.forEach(function (it, k) {
      html += piece(pos, it.s);
      html += '<mark class="k-' + it.kind + '" data-i="' + k + '">' + piece(it.s, it.e) + '</mark>';
      pos = it.e;
    });
    html += piece(pos, text.length) + (caret >= text.length ? '<span class="cm"></span>' : '') + '​\n';
    back.innerHTML = html;
    updateCheckBadge();
  }
  function queueRender() { if (!renderQueued) { renderQueued = true; requestAnimationFrame(renderBack); } }

  var scanT = 0, ltT = 0, sideT = 0;
  function refresh(now) {
    houseIssues = C.scan(ta.value).concat(SET.echo ? C.echoes(ta.value) : []); ltList = C.ltIssues(ta.value);
    renderBack(); counts();
    clearTimeout(ltT); ltT = setTimeout(function () { C.ltWanted(ta.value); }, now ? 300 : 2200);
    clearTimeout(sideT); sideT = setTimeout(renderCheckTab, now ? 0 : 600);
  }
  function afterEdit() {
    grow(); queueSave();
    clearTimeout(scanT); scanT = setTimeout(function () { refresh(false); }, 120);
    queueRender(); counts(); keepCaretInView();
  }
  ta.addEventListener('input', function (e) {
    hidePop();
    if (SET.autofix && !e.isComposing && ((e.inputType === 'insertText' && /^[\s.,!?;:"”'’)\]…]$/.test(e.data || '')) || e.inputType === 'insertLineBreak' || e.inputType === 'insertParagraph')) {
      var caret = ta.selectionStart, f = C.autofix(ta.value, caret);
      if (f && f.e <= caret) {
        var delta = f.rep.length - (f.e - f.s), was = ta.value.slice(f.s, f.e);
        replaceRange(f.s, f.e, f.rep); ta.setSelectionRange(caret + delta, caret + delta);
        toast((f.rep ? was.trim() + ' → ' + f.rep : 'Removed a repeated "' + was.trim() + '"') + '  ·  Ctrl Z to undo');
      }
    }
    afterEdit();
  });
  ['keyup', 'click', 'select'].forEach(function (ev) { ta.addEventListener(ev, function (e) { queueRender(); if (ev === 'click' || (e.key && /Arrow|Home|End|Page/.test(e.key))) setTimeout(maybePop, 0); }); });
  ta.addEventListener('keydown', function (e) { if (e.key === 'Escape') hidePop(); });
  $('docTitle').addEventListener('input', function () { queueSave(); clearTimeout(this._t); this._t = setTimeout(function () { flushSave(); fillPicker(); }, 800); });
  $('docNotes').addEventListener('input', queueSave);
  window.addEventListener('resize', function () { grow(); queueRender(); });
  document.addEventListener('desk:lt', function () { ltList = C.ltIssues(ta.value); queueRender(); clearTimeout(sideT); sideT = setTimeout(renderCheckTab, 200); });

  function keepCaretInView() {
    requestAnimationFrame(function () {
      var cm = back.querySelector('.cm'); if (!cm) return;
      var r = cm.getBoundingClientRect(), sr = scroller.getBoundingClientRect();
      if (r.bottom > sr.bottom - 60) scroller.scrollTop += r.bottom - (sr.bottom - 60);
      else if (r.top < sr.top + 20) scroller.scrollTop -= (sr.top + 20) - r.top;
    });
  }

  /* ======================= word count ======================= */
  function counts() {
    var n = C.countWords(ta.value), t = load('desk-today', {}), base = t.date === today() && t.base ? t.base[doc.id] : null;
    $('wcNum').textContent = fmtN(n);
    var d = base == null ? 0 : n - base;
    $('wcToday').textContent = d > 0 ? '+' + fmtN(d) + ' today' : '';
    var g = doc.goal || 2000, pct = Math.min(100, Math.round(n / g * 100));
    $('goalFill').style.width = pct + '%'; $('goalBar').title = fmtN(n) + ' of ' + fmtN(g) + ' words'; $('goalBar').classList.toggle('done', n >= g);
  }
  $('goalIn').addEventListener('change', function () { doc.goal = Math.max(100, parseInt(this.value, 10) || 2000); dirty = true; flushSave(); counts(); renderCheckTab(); });

  /* ======================= suggestion popover ======================= */
  var pop = $('pop'), popFor = null;
  function issueAt(p) {
    var best = null;
    merged.forEach(function (it, k) { if (p >= it.s && p <= it.e && (!best || (PRI[it.kind] < PRI[best.it.kind]))) best = { it: it, k: k }; });
    return best;
  }
  var LABEL = { house: 'House rule', grammar: 'Grammar', spelling: 'Spelling', style: 'Style', name: 'From your canon' };
  function maybePop() {
    if (ta.selectionStart !== ta.selectionEnd) return hidePop();
    var hit = issueAt(ta.selectionStart); if (!hit) return hidePop();
    showPop(hit.it, back.querySelector('mark[data-i="' + hit.k + '"]'));
  }
  function showPop(it, anchor) {
    popFor = it;
    var html;
    if (it.kind === 'name') {
      var en = CANON.entries[it.entry];
      html = '<p class="pop-k">' + LABEL.name + '</p><p class="pop-t">' + esc(en.name) + '</p><p class="pop-m">' + esc(en.line) + '</p>' +
        '<div class="pop-acts"><button type="button" data-pop="lore">Open in Lore</button></div>';
    } else {
      html = '<p class="pop-k k-' + it.kind + '">' + LABEL[it.kind] + '</p><p class="pop-t">' + esc(it.title) + '</p><p class="pop-m">' + esc(it.msg) + '</p>' +
        (it.reps.length ? '<div class="pop-reps">' + it.reps.map(function (r, i) { return '<button type="button" data-rep="' + i + '">' + (r === '' ? '<em>remove</em>' : r === ' ' ? '<em>space</em>' : esc(r)) + '</button>'; }).join('') + '</div>' : '') +
        '<div class="pop-acts"><button type="button" data-pop="ignore">Ignore</button>' + (it.kind === 'spelling' ? '<button type="button" data-pop="dict">Add "' + esc(ta.value.slice(it.s, it.e)) + '" to my dictionary</button>' : '') + '</div>';
    }
    pop.innerHTML = html; pop.hidden = false;
    var a = anchor && anchor.getBoundingClientRect(), sr = scroller.getBoundingClientRect();
    if (!a) a = (back.querySelector('.cm') || back).getBoundingClientRect();
    var top = a.bottom - sr.top + scroller.scrollTop + 6, left = Math.max(8, Math.min(a.left - sr.left, scroller.clientWidth - pop.offsetWidth - 8));
    pop.style.top = top + 'px'; pop.style.left = left + 'px';
  }
  function hidePop() { pop.hidden = true; popFor = null; }
  pop.addEventListener('mousedown', function (e) { e.preventDefault(); });
  pop.addEventListener('click', function (e) {
    var it = popFor; if (!it) return;
    var r = e.target.closest('[data-rep]'), a = e.target.closest('[data-pop]');
    if (r) { replaceRange(it.s, it.e, it.reps[+r.dataset.rep]); hidePop(); afterEdit(); refresh(false); return; }
    if (!a) return;
    if (a.dataset.pop === 'ignore') { C.ignore(it.key); hidePop(); refresh(false); }
    else if (a.dataset.pop === 'dict') { C.addWord(ta.value.slice(it.s, it.e)); hidePop(); refresh(false); renderDict(); toast('Added to your dictionary.'); }
    else if (a.dataset.pop === 'lore') { openPanel('lore'); showEntry(it.entry); hidePop(); }
  });
  document.addEventListener('mousedown', function (e) { if (!pop.hidden && !pop.contains(e.target) && e.target !== ta) hidePop(); });

  /* ======================= panel and tabs ======================= */
  function openPanel(tab) {
    SET.panel = true; root.classList.remove('panel-off'); $('panelBtn').setAttribute('aria-expanded', 'true');
    if (tab) selectTab(tab); saveSet();
  }
  function selectTab(tab) {
    SET.tab = tab; saveSet();
    document.querySelectorAll('.p-tabs [data-tab]').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.tab === tab ? 'true' : 'false'); });
    document.querySelectorAll('.p-view').forEach(function (v) { v.hidden = v.dataset.view !== tab; });
    if (tab === 'check') renderCheckTab();
    if (tab === 'ask') renderAsk();
  }
  document.querySelector('.p-tabs').addEventListener('click', function (e) { var b = e.target.closest('[data-tab]'); if (b) selectTab(b.dataset.tab); });
  $('panelBtn').addEventListener('click', function () {
    SET.panel = root.classList.contains('panel-off'); root.classList.toggle('panel-off', !SET.panel);
    this.setAttribute('aria-expanded', SET.panel ? 'true' : 'false'); saveSet(); setTimeout(function () { grow(); queueRender(); }, 260);
  });

  /* focus mode */
  function setFocus(on) { document.documentElement.classList.toggle('desk-focus', on); $('focusBtn').classList.toggle('on', on); setTimeout(function () { grow(); queueRender(); }, 50); }
  $('focusBtn').addEventListener('click', function () { setFocus(!document.documentElement.classList.contains('desk-focus')); ta.focus(); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.documentElement.classList.contains('desk-focus') && pop.hidden) setFocus(false);
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openPanel('lore'); $('loreQ').focus(); $('loreQ').select(); }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); dirty = true; flushSave(); }
  });

  /* ======================= menus ======================= */
  function menuToggle(btn, menu) {
    btn.addEventListener('click', function (e) { e.stopPropagation(); var open = menu.hidden; closeMenus(); menu.hidden = !open; btn.setAttribute('aria-expanded', open ? 'true' : 'false'); });
  }
  function closeMenus() { document.querySelectorAll('.desk .menu').forEach(function (m) { m.hidden = true; }); document.querySelectorAll('[aria-controls="menu"],[aria-controls="tmSet"],[aria-controls="readMenu"]').forEach(function (b) { b.setAttribute('aria-expanded', 'false'); }); }
  menuToggle($('menuBtn'), $('menu')); menuToggle($('tmSetBtn'), $('tmSet'));
  document.addEventListener('click', function (e) { if (!e.target.closest('.menu')) closeMenus(); });
  $('docPick').addEventListener('change', function () { openDoc(this.value); });
  $('newDoc').addEventListener('click', function () { var d = Docs.create(''); openDoc(d.id); $('docTitle').focus(); toast('New draft. Write, or paste a chapter from Google Docs.'); });
  function download(name, text, type) { var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500); }
  function safeName(s) { return (s || 'chapter').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() || 'chapter'; }
  $('menu').addEventListener('click', function (e) {
    var b = e.target.closest('[data-do]'); if (!b) return; closeMenus(); flushSave();
    var what = b.dataset.do;
    if (what === 'copy') {
      var text = ta.value, html = text.split('\n').map(function (p) { return '<p>' + (esc(p) || '<br>') + '</p>'; }).join('');
      var done = function () { toast('Copied. Paste it into Google Docs.'); };
      if (navigator.clipboard && window.ClipboardItem) navigator.clipboard.write([new ClipboardItem({ 'text/plain': new Blob([text], { type: 'text/plain' }), 'text/html': new Blob([html], { type: 'text/html' }) })]).then(done, function () { navigator.clipboard.writeText(text).then(done); });
      else if (navigator.clipboard) navigator.clipboard.writeText(text).then(done);
      else { ta.select(); document.execCommand('copy'); done(); }
    } else if (what === 'note') copyNote();
    else if (what === 'txt') download(safeName(doc.title) + '.txt', ta.value, 'text/plain');
    else if (what === 'rename') { var t = prompt('Name this draft', doc.title || ''); if (t != null) { $('docTitle').value = t; dirty = true; flushSave(); fillPicker(); } }
    else if (what === 'delete') {
      if (!confirm('Delete "' + (doc.title || 'Untitled chapter') + '" from this browser? This cannot be undone.')) return;
      Docs.remove(doc.id); doc = null; var idx = Docs.index(); openDoc(idx.length ? idx[0].id : Docs.create('').id); toast('Draft deleted.');
    } else if (what === 'backup') {
      var all = { desk: 1, saved: new Date().toISOString(), docs: Docs.index().map(function (d) { return Docs.get(d.id); }).filter(Boolean) };
      download('writers-desk-backup-' + today() + '.json', JSON.stringify(all, null, 1), 'application/json');
    } else if (what === 'restore') $('restoreFile').click();
  });
  $('restoreFile').addEventListener('change', function () {
    var f = this.files[0]; if (!f) return; var r = new FileReader();
    r.onload = function () {
      try {
        var d = JSON.parse(r.result); if (!d.docs) throw 0; var n = 0;
        d.docs.forEach(function (x) { if (!x || !x.id) return; var cur = Docs.get(x.id); if (cur && cur.updated > x.updated && !confirm('"' + (x.title || 'Untitled') + '" is newer here than in the backup. Replace it with the backup anyway?')) return; Docs.put(x); n++; });
        fillPicker(); toast('Restored ' + n + ' draft' + (n === 1 ? '' : 's') + '.');
      } catch (e) { alert('That file is not a Writer\'s Desk backup.'); }
    };
    r.readAsText(f); this.value = '';
  });

  /* ======================= toast ======================= */
  var toastT = 0;
  function toast(msg) { var t = $('toast'); t.textContent = msg; t.hidden = false; t.classList.remove('out'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.hidden = true; }, 300); }, 2600); }

  /* ======================= break timer ======================= */
  var TM = Object.assign({ phase: 'idle', endsAt: 0, left: 0 }, load('desk-timer', {}));
  function tmSave() { save('desk-timer', TM); }
  function tmDur(phase) { return (phase === 'break' ? SET.brk : SET.work) * 60000; }
  var TIPS = ['Stand up and stretch your arms over your head.', 'Drink some water.', 'Look at something far away for twenty seconds.', 'Roll your shoulders and unclench your jaw.',
    'Walk to another room and back.', 'Shake out your hands.', 'Take three slow breaths.', 'Get a snack if you need one.'];
  var audio = null;
  function chime(up) {
    if (!SET.sound) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      var notes = up ? [523.25, 783.99] : [659.25, 523.25], t0 = audio.currentTime;
      notes.forEach(function (f, i) {
        var o = audio.createOscillator(), g = audio.createGain(); o.type = 'sine'; o.frequency.value = f;
        g.gain.setValueAtTime(0.0001, t0 + i * 0.28); g.gain.exponentialRampToValueAtTime(0.18, t0 + i * 0.28 + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + i * 0.28 + 1.4);
        o.connect(g).connect(audio.destination); o.start(t0 + i * 0.28); o.stop(t0 + i * 0.28 + 1.5);
      });
    } catch (e) {}
  }
  function tmStart(phase, ms) { TM.phase = phase; TM.endsAt = Date.now() + (ms || tmDur(phase)); TM.left = 0; tmSave(); tmTick(); }
  function tmPause() { if (TM.phase === 'idle' || TM.left) return; TM.left = Math.max(0, TM.endsAt - Date.now()); tmSave(); tmTick(); }
  function tmResume() { if (!TM.left) return; TM.endsAt = Date.now() + TM.left; TM.left = 0; tmSave(); tmTick(); }
  function tmReset() { TM = { phase: 'idle', endsAt: 0, left: 0 }; tmSave(); showBreak(false); tmTick(); }
  function mmss(ms) { var s = Math.ceil(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); }
  var title0 = document.title;
  function tmTick() {
    var now = Date.now(), left = TM.left || (TM.phase === 'idle' ? tmDur('work') : TM.endsAt - now);
    if (TM.phase !== 'idle' && !TM.left && left <= 0) {
      if (TM.phase === 'work') { chime(false); tmStart('break'); showBreak(true); return; }
      chime(true); tmStart('work'); showBreak(false); toast('Back to it.'); return;
    }
    var total = tmDur(TM.phase === 'idle' ? 'work' : TM.phase), frac = TM.phase === 'idle' ? 1 : Math.max(0, Math.min(1, left / total));
    $('tmTime').textContent = mmss(Math.max(0, left));
    $('tmLabel').textContent = TM.phase === 'idle' ? 'Start' : TM.left ? 'Paused' : TM.phase === 'break' ? 'Break' : 'Writing';
    $('tmRing').style.strokeDashoffset = (97.4 * (1 - frac)).toFixed(2);
    $('timer').dataset.phase = TM.phase; $('timer').classList.toggle('paused', !!TM.left);
    $('tmMain').title = TM.phase === 'idle' ? 'Start a ' + SET.work + ' minute writing sprint' : TM.left ? 'Resume' : 'Pause';
    if (TM.phase === 'break') { $('brkTime').textContent = mmss(Math.max(0, left)); document.title = 'Break ' + mmss(Math.max(0, left)) + ' · ' + title0; }
    else if (document.title !== title0) document.title = title0;
    if (TM.phase === 'break' && $('brk').hidden && !TM.left) showBreak(true);
  }
  function showBreak(on) {
    var b = $('brk');
    if (on) { $('brkTip').textContent = TIPS[Math.floor(Math.random() * TIPS.length)]; flushSave(); b.hidden = false; requestAnimationFrame(function () { b.classList.add('in'); }); $('brkSkip').focus(); }
    else { b.classList.remove('in'); setTimeout(function () { b.hidden = true; }, 350); if (TM.phase !== 'break') document.title = title0; }
  }
  $('tmMain').addEventListener('click', function () {
    if (TM.phase === 'idle') { tmStart('work'); toast('Writing for ' + SET.work + ' min, then a ' + SET.brk + ' min break.'); }
    else if (TM.left) tmResume(); else tmPause();
    ta.focus();
  });
  $('brkSkip').addEventListener('click', function () { chime(true); tmStart('work'); showBreak(false); ta.focus(); });
  $('brkMore').addEventListener('click', function () { var left = TM.endsAt - Date.now(); TM.phase = 'work'; TM.endsAt = Date.now() + 30000; TM.pending = left; tmSave(); showBreak(false); ta.focus(); toast('Thirty seconds. Then the break.'); });
  $('tmReset').addEventListener('click', function () { tmReset(); closeMenus(); });
  function tmSettings() {
    $('tmWork').value = SET.work; $('tmBrk').value = SET.brk; $('tmSound').checked = SET.sound;
    ['tmWork', 'tmBrk'].forEach(function (id) { $(id).addEventListener('change', function () { var v = Math.max(1, Math.min(120, parseInt(this.value, 10) || 1)); this.value = v; SET[id === 'tmWork' ? 'work' : 'brk'] = v; saveSet(); tmTick(); }); });
    $('tmSound').addEventListener('change', function () { SET.sound = this.checked; saveSet(); if (SET.sound) chime(true); });
  }
  setInterval(tmTick, 500);
  window.addEventListener('storage', function (e) { if (e.key === 'desk-timer') { TM = load('desk-timer', TM); tmTick(); } });

  /* ======================= lore ======================= */
  var CATS = [['cast', 'Cast'], ['places', 'Places'], ['world', 'World'], ['chapters', 'Chapters'], ['snippets', 'Snippets'], ['threads', 'Threads'], ['rules', 'Rules']];
  function chips() {
    $('loreChips').innerHTML = CATS.map(function (c) { return '<button type="button" role="tab" data-cat="' + c[0] + '" aria-selected="' + (SET.loreCat === c[0]) + '">' + c[1] + '</button>'; }).join('');
  }
  $('loreChips').addEventListener('click', function (e) { var b = e.target.closest('[data-cat]'); if (!b) return; SET.loreCat = b.dataset.cat; saveSet(); $('loreQ').value = ''; chips(); renderLore(); });
  function entryCard(en, i, open) {
    return '<article class="lc' + (open ? ' open' : '') + '" data-entry="' + i + '"><button type="button" class="lc-head"><b>' + esc(en.name) + '</b>' + (en.aka && en.aka.length ? '<small>' + esc(en.aka.join(', ')) + '</small>' : '') + '</button>' +
      '<p class="lc-line">' + esc(en.line) + '</p>' +
      (en.notes ? '<ul class="lc-notes">' + en.notes.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul>' : '') +
      (en.link ? '<a class="lc-link" href="' + esc(en.link) + '" target="_blank">Open the page</a>' : '') + '</article>';
  }
  function chLabel(n) { return n === 'new' ? 'New' : 'Ch. ' + n; }
  function renderLore() {
    var list = $('loreList'), q = $('loreQ').value.trim(), D = CANON || {};
    if (!CANON) { list.innerHTML = '<p class="muted">Your canon opens with the Sanctum.</p>'; return; }
    if (q) return search(q);
    var cat = SET.loreCat, html = '';
    if (cat === 'chapters') html = '<ol class="lc-ch">' + D.chapters.map(function (c) {
      return '<li><span class="lc-n">' + chLabel(c[0]) + '</span><div><b>' + esc(c[1] || 'Untitled') + '</b> <small>' + esc(c[2]) + ' · ' + fmtN(c[3]) + '</small><p>' + esc(c[4]) + '</p></div></li>';
    }).join('') + '</ol><p class="lc-foot">' + esc(D.chNotes || '') + '</p>';
    else if (cat === 'snippets') html = '<ol class="lc-ch">' + D.snippets.map(function (s) {
      return '<li><span class="lc-n">#' + s[0] + '</span><div><b>' + esc(s[2]) + '</b> <small>' + (s[1] == null ? 'needs a chapter' : chLabel(s[1])) + '</small><p>' + esc(s[3]) + '</p></div></li>';
    }).join('') + '</ol><p class="lc-foot">' + esc(D.snipNotes || '') + '</p>';
    else if (cat === 'threads') {
      var groups = {}; D.threads.forEach(function (t) { (groups[t[0]] = groups[t[0]] || []).push(t[1]); });
      html = Object.keys(groups).map(function (g) { return '<h4 class="lc-g">' + esc(g) + '</h4><ul class="lc-th">' + groups[g].map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>'; }).join('');
    } else if (cat === 'rules') html = '<dl class="lc-rules">' + D.rules.map(function (r) { return '<dt>' + esc(r[0]) + '</dt><dd>' + esc(r[1]) + '</dd>'; }).join('') + '</dl>';
    else html = D.entries.map(function (en, i) { return en.cat === cat ? entryCard(en, i) : ''; }).join('');
    list.innerHTML = html;
  }
  list_click();
  function list_click() {
    $('loreList').addEventListener('click', function (e) {
      var h = e.target.closest('.lc-head'); if (h) { h.parentNode.classList.toggle('open'); return; }
    });
  }
  function showEntry(i) {
    var en = CANON.entries[i]; if (!en) return;
    $('loreQ').value = ''; SET.loreCat = en.cat; chips(); renderLore();
    var card = $('loreList').querySelector('[data-entry="' + i + '"]');
    if (card) { card.classList.add('open', 'flash'); card.scrollIntoView({ block: 'nearest' }); setTimeout(function () { card.classList.remove('flash'); }, 1200); }
  }
  var siteIndex = null, siteLoading = null;
  var SITE_PAGES = ['cosmology.html', 'magic.html', 'magic-types.html', 'meadow.html', 'iceberg.html', 'courts.html', 'timeline.html', 'world.html', 'empires.html', 'everlast.html',
    'kenanism.html', 'yenfin.html', 'travel.html', 'orders.html', 'gilded-goose.html', 'crockett.html', 'cherry.html', 'will.html', 'tom.html', 'sansa.html', 'players.html',
    'great_hope.html', 'great_despair.html', 'dawnward_king.html', 'duskward_king.html', 'verdant_lady.html', 'bloated_lady.html', 'revel_king.html', 'mocking_king.html',
    'lady_of_dreaming.html', 'lady_of_waking.html', 'hearthkeeper.html', 'hollow_host.html', 'hunter_king.html', 'stalking_king.html'];
  function buildSite() {
    if (siteIndex) return Promise.resolve(siteIndex);
    if (siteLoading) return siteLoading;
    try { var cached = JSON.parse(sessionStorage.getItem('desk-site')); if (cached) { siteIndex = cached; return Promise.resolve(siteIndex); } } catch (e) {}
    siteLoading = Promise.all(SITE_PAGES.map(function (p) {
      return fetch(p).then(function (r) { return r.ok ? r.text() : ''; }).then(function (html) {
        var dom = new DOMParser().parseFromString(html, 'text/html'), out = [], main = dom.querySelector('main'); if (!main) return out;
        var pageTitle = ((dom.querySelector('h1') || {}).textContent || p).trim();
        main.querySelectorAll('script, .rail, .crumbs, .title-ref, .seal, .seal-block').forEach(function (n) { n.remove(); });
        var cur = { t: pageTitle, id: '', x: '' };
        main.querySelectorAll('h2, h3, p, li, dt, dd').forEach(function (n) {
          if (/^H[23]$/.test(n.tagName) || n.tagName === 'DT') { if (cur.x.trim()) out.push({ p: p, page: pageTitle, t: cur.t, id: cur.id, x: cur.x.trim() }); var sec = n.closest('[id]'); cur = { t: n.textContent.trim(), id: n.id || (sec && sec.id) || '', x: '' }; }
          else if (!n.querySelector('p, li')) cur.x += ' ' + n.textContent.replace(/\s+/g, ' ');
        });
        if (cur.x.trim()) out.push({ p: p, page: pageTitle, t: cur.t, id: cur.id, x: cur.x.trim() });
        return out;
      }).catch(function () { return []; });
    })).then(function (parts) {
      siteIndex = [].concat.apply([], parts);
      return MBSite.vaultReady.then(function (v) {
        if (v && v.pages) Object.keys(v.pages).forEach(function (k) {
          var pg = v.pages[k], tmp = document.createElement('div'); tmp.innerHTML = pg.html || '';
          siteIndex.push({ p: 'sealed.html#' + k, page: 'Sanctum', t: pg.title, id: '', x: tmp.textContent.replace(/\s+/g, ' ').trim().slice(0, 4000), sealed: 1 });
        });
        try { sessionStorage.setItem('desk-site', JSON.stringify(siteIndex)); } catch (e) {}
        return siteIndex;
      });
    });
    return siteLoading;
  }
  function hl(text, terms) {
    var h = esc(text); terms.forEach(function (t) { if (t.length > 1) h = h.replace(new RegExp('(^|[^a-z0-9;])(' + esc(t).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'ig'), '$1<mark>$2</mark>'); }); return h;
  }
  function snippetAround(text, terms) {
    var i = -1;
    terms.some(function (t) { var m = new RegExp('(^|[^a-z0-9])' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').exec(text); i = m ? m.index : -1; return i > -1; });
    var s = Math.max(0, i - 80); return (s ? '…' : '') + text.slice(s, s + 220) + (s + 220 < text.length ? '…' : '');
  }
  function search(q) {
    var terms = q.toLowerCase().split(/\s+/).filter(Boolean), D = CANON, html = '';
    var res = terms.map(function (t) { return new RegExp('(^|[^a-z0-9])' + t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'); });
    function has(s) { s = s || ''; return res.every(function (r) { return r.test(s); }); }
    var ents = [];
    D.entries.forEach(function (en, i) {
      var head = (en.name + ' ' + (en.aka || []).join(' ')), body = head + ' ' + en.line + ' ' + (en.notes || []).join(' ');
      if (has(body)) ents.push({ i: i, score: has(head) ? 0 : 1 });
    });
    ents.sort(function (a, b) { return a.score - b.score; });
    if (ents.length) html += '<h4 class="lc-g">Your canon</h4>' + ents.slice(0, 20).map(function (x) { return entryCard(D.entries[x.i], x.i, x.score === 0 && ents.length < 3); }).join('');
    var ch = D.chapters.filter(function (c) { return has(c.join(' ')); });
    if (ch.length) html += '<h4 class="lc-g">Chapters</h4><ol class="lc-ch">' + ch.map(function (c) { return '<li><span class="lc-n">' + chLabel(c[0]) + '</span><div><b>' + esc(c[1] || 'Untitled') + '</b> <small>' + esc(c[2]) + '</small><p>' + hl(c[4], terms) + '</p></div></li>'; }).join('') + '</ol>';
    var sn = D.snippets.filter(function (s) { return has(s.join(' ')); });
    if (sn.length) html += '<h4 class="lc-g">Snippets</h4><ol class="lc-ch">' + sn.map(function (s) { return '<li><span class="lc-n">#' + s[0] + '</span><div><b>' + esc(s[2]) + '</b><p>' + hl(s[3], terms) + '</p></div></li>'; }).join('') + '</ol>';
    var th = D.threads.filter(function (t) { return has(t.join(' ')); }).concat(D.rules.filter(function (r) { return has(r.join(' ')); }).map(function (r) { return ['Rule', r[0] + ': ' + r[1]]; }));
    if (th.length) html += '<h4 class="lc-g">Threads and rules</h4><ul class="lc-th">' + th.map(function (t) { return '<li><small>' + esc(t[0]) + '</small> ' + hl(t[1], terms) + '</li>'; }).join('') + '</ul>';
    html += '<div id="siteRes"><p class="muted small">Searching the site and the Sanctum…</p></div>';
    $('loreList').innerHTML = html || '<p class="muted">Nothing in your notes yet.</p>';
    var mine = q;
    buildSite().then(function (idx) {
      if ($('loreQ').value.trim() !== mine) return;
      var hits = idx.filter(function (s) { return has(s.t + ' ' + s.x); }).slice(0, 15);
      var box = $('siteRes'); if (!box) return;
      box.innerHTML = hits.length ? '<h4 class="lc-g">On the site</h4>' + hits.map(function (s) {
        return '<a class="lc-site" href="' + esc(s.p + (s.id && s.p.indexOf('#') < 0 ? '#' + s.id : '')) + '" target="_blank"><b>' + hl(s.t, terms) + '</b><small>' + esc(s.page) + (s.sealed ? ' · sealed' : '') + '</small><span>' + hl(snippetAround(s.x, terms), terms) + '</span></a>';
      }).join('') : (ents.length || ch.length || sn.length || th.length ? '' : '<p class="muted">Nothing found for "' + esc(mine) + '".</p>');
    });
  }
  var loreT = 0;
  $('loreQ').addEventListener('input', function () { clearTimeout(loreT); loreT = setTimeout(renderLore, 150); });

  /* ======================= check tab ======================= */
  function updateCheckBadge() {
    var n = merged.filter(function (it) { return it.kind !== 'name' && it.kind !== 'read' && it.rule !== 'echo'; }).length;
    $('checkBadge').textContent = n ? n : '';
  }
  var KIND_ORDER = ['house', 'grammar', 'spelling', 'style'];
  function flat(t) { return t.replace(/\s*\n+\s*/g, ' / '); }
  function renderCheckTab() {
    if (SET.tab !== 'check' || !doc) return;
    $('optLt').checked = C.lt.on; $('optFix').checked = SET.autofix; $('optNames').checked = SET.names; $('optEcho').checked = SET.echo;
    $('ckChapter').innerHTML = '<h3>This chapter</h3><ul>' + C.chapterChecks(ta.value, doc.goal).map(function (c) { return '<li class="cc-' + c[0] + '">' + esc(c[1]) + '</li>'; }).join('') + '</ul>';
    var seenEcho = {};
    var items = merged.map(function (it, k) { return { it: it, k: k }; }).filter(function (x) {
      if (x.it.kind === 'name' || x.it.kind === 'read') return false;
      if (x.it.rule === 'echo') { var pk = x.it.key + '@' + ta.value.lastIndexOf('\n', x.it.s); if (seenEcho[pk]) return false; seenEcho[pk] = 1; }
      return true;
    });
    items.sort(function (a, b) { return KIND_ORDER.indexOf(a.it.kind) - KIND_ORDER.indexOf(b.it.kind) || a.it.s - b.it.s; });
    $('ckList').innerHTML = items.length ? items.slice(0, 200).map(function (x) {
      var it = x.it, text = ta.value, ctxS = Math.max(0, it.s - 25), ctxE = Math.min(text.length, it.e + 25);
      return '<button type="button" class="ci k-' + it.kind + '" data-k="' + x.k + '"><span class="ci-t">' + esc(it.title) + (it.reps[0] != null && it.reps.length ? ' <i>→ ' + esc(it.reps[0] === '' ? 'remove' : it.reps[0] === ' ' ? 'space' : it.reps[0]) + '</i>' : '') + '</span>' +
        '<span class="ci-x">' + (ctxS ? '…' : '') + esc(flat(text.slice(ctxS, it.s))) + '<u>' + esc(flat(text.slice(it.s, it.e))) + '</u>' + esc(flat(text.slice(it.e, ctxE))) + '…</span></button>';
    }).join('') : '<p class="muted">' + (ta.value.trim() ? 'Nothing to fix right now.' : 'Suggestions show up here as you write.') + '</p>';
    $('fixAll').disabled = !merged.some(function (it) { return it.fix && it.reps.length; });
    ltStatus(C.lt.status);
  }
  $('ckList').addEventListener('click', function (e) {
    var b = e.target.closest('[data-k]'); if (!b) return; var it = merged[+b.dataset.k]; if (!it) return;
    ta.focus(); ta.setSelectionRange(it.s, it.s); renderBack(); keepCaretInView();
    setTimeout(maybePop, 80);
  });
  $('fixAll').addEventListener('click', function () {
    var fixes = merged.filter(function (it) { return it.fix && it.reps.length; }).sort(function (a, b) { return b.s - a.s; });
    if (!fixes.length) return;
    var text = ta.value; fixes.forEach(function (it) { text = text.slice(0, it.s) + it.reps[0] + text.slice(it.e); });
    replaceAll(text); refresh(false); toast('Fixed ' + fixes.length + ' thing' + (fixes.length === 1 ? '' : 's') + '. Ctrl Z undoes it.');
  });
  function ltStatus(s) {
    var map = { idle: '', checking: 'checking…', ready: 'up to date', paused: 'resting a minute (LanguageTool limit)', offline: 'offline', error: 'could not reach LanguageTool', off: 'off' };
    $('ltStatus').textContent = C.lt.on ? (map[s] != null ? map[s] : '') : 'off';
  }
  C.lt.onStatus(ltStatus);
  $('optLt').addEventListener('change', function () { C.lt.on = this.checked; refresh(true); });
  $('optFix').addEventListener('change', function () { SET.autofix = this.checked; saveSet(); });
  $('optNames').addEventListener('change', function () { SET.names = this.checked; saveSet(); queueRender(); });
  $('optEcho').addEventListener('change', function () { SET.echo = this.checked; saveSet(); refresh(true); });

  /* ======================= notes tab ======================= */
  function renderChecklist() {
    var items = (CANON && CANON.checklist) || [];
    $('checklist').innerHTML = items.map(function (t, i) { return '<li><label class="chk"><input type="checkbox" data-ck="' + i + '"' + (doc.checks[i] ? ' checked' : '') + '> ' + esc(t) + '</label></li>'; }).join('');
  }
  $('checklist').addEventListener('change', function (e) { var c = e.target.closest('[data-ck]'); if (!c) return; doc.checks[c.dataset.ck] = c.checked; dirty = true; flushSave(); });
  function renderDict() {
    var w = C.dictionary();
    $('dict').innerHTML = w.length ? w.map(function (x) { return '<span class="dw">' + esc(x) + '<button type="button" data-w="' + esc(x) + '" aria-label="Remove ' + esc(x) + '">×</button></span>'; }).join('') : '<span class="muted small">Empty.</span>';
  }
  $('dict').addEventListener('click', function (e) { var b = e.target.closest('[data-w]'); if (b) { C.removeWord(b.dataset.w); renderDict(); refresh(false); } });
  $('resetIgnored').addEventListener('click', function () { C.resetIgnored(); refresh(true); toast('Ignored suggestions are back.'); });

  /* ======================= Claude ======================= */
  var PRICE = { 'claude-haiku-5-5': [0.10, 0.50], 'claude-sonnet-5-5': [2, 10] };
  function apiKey() { return load('desk-api-key', ''); }
  function canonText() {
    var D = CANON || {}, out = ['HOUSE RULES'];
    (D.rules || []).forEach(function (r) { out.push('- ' + r[0] + ': ' + r[1]); });
    ['cast', 'places', 'world'].forEach(function (cat) {
      out.push('', cat.toUpperCase());
      (D.entries || []).forEach(function (en) { if (en.cat === cat) out.push('- ' + en.name + (en.aka && en.aka.length ? ' (also: ' + en.aka.join(', ') + ')' : '') + ': ' + en.line + (en.notes ? ' ' + en.notes.join(' ') : '')); });
    });
    out.push('', 'CHAPTERS'); (D.chapters || []).forEach(function (c) { out.push('- ' + chLabel(c[0]) + ' "' + (c[1] || 'Untitled') + '" (' + c[2] + ', ~' + c[3] + ' words): ' + c[4]); });
    out.push(D.chNotes || '', '', 'LINFAY SNIPPETS'); (D.snippets || []).forEach(function (s) { out.push('- #' + s[0] + ' (' + (s[1] == null ? 'unplaced' : chLabel(s[1])) + ') ' + s[2] + ': ' + s[3]); });
    out.push('', 'OPEN THREADS'); (D.threads || []).forEach(function (t) { out.push('- [' + t[0] + '] ' + t[1]); });
    return out.join('\n');
  }
  function callClaude(system, messages, maxTokens) {
    var key = apiKey(); if (!key) return Promise.reject(new Error('No key saved.'));
    var model = SET.model;
    return fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01', 'anthropic-dangerous-direct-browser-access': 'true' },
      body: JSON.stringify({ model: model, max_tokens: maxTokens || 700, system: system, messages: messages })
    }).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (d) {
        if (!r.ok) {
          var msg = (d.error && d.error.message) || ('HTTP ' + r.status);
          if (r.status === 401) msg = 'That key was not accepted. Check it in the Claude Console, then save it again.';
          else if (r.status === 429) msg = 'Too many requests for a moment. Try again in a minute.';
          else if (/credit|billing|balance/i.test(msg)) msg = 'Your Console account needs credit. Add some under Billing.';
          throw new Error(msg);
        }
        var u = d.usage || {}, p = PRICE[model] || [0, 0];
        var cost = ((u.input_tokens || 0) + (u.cache_creation_input_tokens || 0) * 1.25 + (u.cache_read_input_tokens || 0) * 0.1) / 1e6 * p[0] + (u.output_tokens || 0) / 1e6 * p[1];
        var month = new Date().toISOString().slice(0, 7), spend = load('desk-spend', {}); spend[month] = (spend[month] || 0) + cost; save('desk-spend', spend);
        showCost();
        return (d.content || []).filter(function (c) { return c.type === 'text'; }).map(function (c) { return c.text; }).join('\n').trim();
      });
    });
  }
  function showCost() { var s = load('desk-spend', {})[new Date().toISOString().slice(0, 7)] || 0; $('askCost').textContent = 'About $' + (s < 0.01 && s > 0 ? s.toFixed(4) : s.toFixed(2)) + ' this month.'; }

  var chat = [];
  function renderAsk() {
    var has = !!apiKey(); $('askSetup').hidden = has; $('askMain').hidden = !has;
    $('askModel').value = SET.model; $('askDraft').checked = SET.askDraft; showCost(); renderChat();
  }
  function md(t) { return esc(t).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\n{2,}/g, '</p><p>').replace(/\n/g, '<br>'); }
  function renderChat() {
    $('askLog').innerHTML = chat.length ? chat.map(function (m) { return '<div class="msg ' + m.role + (m.err ? ' err' : '') + '"><p>' + md(m.text) + '</p></div>'; }).join('') :
      '<p class="muted small">Ask about names, places, what happened in which chapter, or what a rule says. Answers come from your notes and this draft.</p>';
    $('askLog').scrollTop = 1e9;
  }
  $('keySave').addEventListener('click', function () {
    var k = $('keyIn').value.trim(); if (!/^sk-ant-/.test(k)) { alert('That does not look like a Claude API key. It starts with sk-ant-.'); return; }
    save('desk-api-key', k); $('keyIn').value = ''; renderAsk(); toast('Key saved in this browser.');
  });
  $('keyForget').addEventListener('click', function () { if (confirm('Remove the API key from this browser?')) { try { localStorage.removeItem('desk-api-key'); } catch (e) {} renderAsk(); } });
  $('askClear').addEventListener('click', function () { chat = []; renderChat(); });
  $('askModel').addEventListener('change', function () { SET.model = this.value; saveSet(); });
  $('askDraft').addEventListener('change', function () { SET.askDraft = this.checked; saveSet(); });
  $('askIn').addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('askForm').requestSubmit(); } });
  $('askForm').addEventListener('submit', function (e) {
    e.preventDefault(); var q = $('askIn').value.trim(); if (!q) return;
    $('askIn').value = ''; chat.push({ role: 'user', text: q }); chat.push({ role: 'assistant', text: 'Looking…', wait: true }); renderChat();
    var sys = [
      { type: 'text', text: 'You are the continuity assistant on Nathan\'s Writer\'s Desk for his web serial Tales of the Gilded Goose, set in his world Mirrorbloom. Answer ONLY from his canon notes below' + (SET.askDraft ? ' and the current draft' : '') + '. Be brief: a sentence or a short list. Name where the answer comes from (a chapter, a snippet number, the draft). If the notes do not say, reply "Not in your notes." and stop; never invent canon. Never write story prose, dialogue or plot suggestions for him; he writes every word himself. You may point out a contradiction between the draft and the notes.' },
      { type: 'text', text: 'CANON NOTES\n\n' + canonText(), cache_control: { type: 'ephemeral' } }
    ];
    if (SET.askDraft && ta.value.trim()) sys.push({ type: 'text', text: 'CURRENT DRAFT: "' + ($('docTitle').value || 'Untitled') + '"\n\n' + ta.value.slice(0, 60000) });
    var msgs = chat.filter(function (m) { return !m.wait && !m.err; }).slice(-8).map(function (m) { return { role: m.role, content: m.text }; });
    callClaude(sys, msgs, 600).then(function (txt) { chat.pop(); chat.push({ role: 'assistant', text: txt || '(no answer)' }); renderChat(); },
      function (err) { chat.pop(); chat.push({ role: 'assistant', text: err.message, err: true }); renderChat(); });
  });

  /* paragraph cleanup */
  function paraAt(p) { var t = ta.value, s = t.lastIndexOf('\n', p - 1) + 1, e = t.indexOf('\n', p); if (e < 0) e = t.length; return { s: s, e: e, text: t.slice(s, e) }; }
  function diffWords(a, b) {
    var A = a.split(/(\s+)/), B = b.split(/(\s+)/), n = A.length, m = B.length, dp = [], i, j;
    if (n * m > 400000) return '<del>' + esc(a) + '</del> <ins>' + esc(b) + '</ins>';
    for (i = 0; i <= n; i++) { dp.push(new Uint16Array(m + 1)); }
    for (i = n - 1; i >= 0; i--) for (j = m - 1; j >= 0; j--) dp[i][j] = A[i] === B[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    var out = ''; i = 0; j = 0;
    while (i < n && j < m) { if (A[i] === B[j]) { out += esc(A[i]); i++; j++; } else if (dp[i + 1][j] >= dp[i][j + 1]) { out += '<del>' + esc(A[i]) + '</del>'; i++; } else { out += '<ins>' + esc(B[j]) + '</ins>'; j++; } }
    while (i < n) out += '<del>' + esc(A[i++]) + '</del>'; while (j < m) out += '<ins>' + esc(B[j++]) + '</ins>';
    return out;
  }
  $('polishBtn').addEventListener('click', function () {
    var box = $('polishOut');
    if (!apiKey()) { box.hidden = false; box.innerHTML = '<p class="muted">Add your Claude API key in the Ask tab first.</p>'; return; }
    var para = paraAt(ta.selectionStart);
    if (para.text.trim().length < 3) { box.hidden = false; box.innerHTML = '<p class="muted">Put your cursor in the paragraph you want cleaned up.</p>'; return; }
    box.hidden = false; box.innerHTML = '<p class="muted">Cleaning up…</p>';
    var rules = (CANON && CANON.rules || []).map(function (r) { return '- ' + r[0] + ': ' + r[1]; }).join('\n');
    var names = Object.keys(C.canon.names).join(', ');
    var sys = [{ type: 'text', text: 'You proofread one paragraph of Nathan\'s fantasy serial. Fix ONLY grammar, spelling, punctuation, dropped or swapped letters (his dictation eats letters), and sentences run together. Keep his words, voice, slang, sentence structure, rhythm and dialogue exactly as they are otherwise. Never add, cut or rephrase content. Follow his house rules:\n' + rules + '\nThese names are spelled correctly: ' + names + '.\nReturn only the corrected paragraph, nothing else. If nothing needs fixing, return it unchanged.' }];
    var orig = para.text;
    callClaude(sys, [{ role: 'user', content: orig }], Math.min(4000, 200 + orig.length)).then(function (fixed) {
      fixed = fixed.replace(/^["“]|["”]$/g, function (q) { return orig.trim()[0] === q || orig.trim().slice(-1) === q ? q : ''; }).trim();
      if (fixed === orig.trim()) { box.innerHTML = '<p class="ok">Nothing to fix in that paragraph.</p>'; return; }
      box.innerHTML = '<div class="diff">' + diffWords(orig, fixed) + '</div><div class="btn-row"><button class="btn small primary" type="button" id="polishYes">Use it</button><button class="btn small" type="button" id="polishNo">Keep mine</button></div>';
      $('polishYes').onclick = function () {
        var cur = paraAt(para.s); if (ta.value.slice(para.s, para.s + orig.length) !== orig) { box.innerHTML = '<p class="muted">The paragraph changed while Claude was reading it. Try again.</p>'; return; }
        replaceRange(para.s, para.s + orig.length, fixed); afterEdit(); refresh(false); box.hidden = true; toast('Paragraph cleaned up. Ctrl Z undoes it.'); void cur;
      };
      $('polishNo').onclick = function () { box.hidden = true; };
    }, function (err) { box.innerHTML = '<p class="err">' + esc(err.message) + '</p>'; });
  });

  /* ======================= author's note ======================= */
  function nextFriday() {
    var now = new Date(), z = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', hourCycle: 'h23' }).formatToParts(now), o = {};
    z.forEach(function (p) { o[p.type] = p.value; });
    var wd = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(o.weekday), ahead = (5 - wd + 7) % 7; if (ahead === 0 && +o.hour >= 8) ahead = 7;
    var d = new Date(now.getTime() + ahead * 86400000);
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'America/New_York' });
  }
  function fillNote(tpl) {
    var title = $('docTitle').value.trim(), num = (title.match(/(?:chapter|ch\.?)\s*(\d+)/i) || [])[1] || '';
    return tpl.replace(/\{chapter\}/g, num).replace(/\{title\}/g, title.replace(/^(chapter|ch\.?)\s*\d+\s*[:.\-–—]?\s*/i, '')).replace(/\{next\}/g, nextFriday())
      .replace(/\{words\}/g, fmtN(C.countWords(ta.value))).replace(/\{site\}/g, 'https://mirrorbloom-gilded-goose.github.io/');
  }
  function copyNote() {
    var tpl = load('desk-note-tpl', '');
    if (!tpl.trim()) { openPanel('notes'); $('noteTpl').focus(); toast('Paste your author\'s note template first. It is saved for every chapter.'); return; }
    var text = fillNote(tpl);
    (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(function () { toast('Author\'s note copied, filled in for this chapter.'); }, function () { prompt('Copy your author\'s note:', text); });
  }
  $('noteTpl').value = load('desk-note-tpl', '');
  $('noteTpl').addEventListener('input', function () { save('desk-note-tpl', this.value); });
  $('noteCopy').addEventListener('click', copyNote);

  /* ======================= dictation ======================= */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition, rec = null, dictating = false;
  var SPOKEN = [
    [/\b(new|next) paragraph\b/gi, '\n\n'], [/\bnew line\b/gi, '\n'], [/\bscene break\b/gi, '\n\n— ✦ —\n\n'],
    [/\b(full stop|period)\b/gi, '.'], [/\bcomma\b/gi, ','], [/\bquestion mark\b/gi, '?'], [/\bexclamation (mark|point)\b/gi, '!'],
    [/\bsemi ?colon\b/gi, ';'], [/\bcolon\b/gi, ':'], [/\b(ellipsis|dot dot dot)\b/gi, '...'],
    [/\b(open|begin) quote\b/gi, ' "'], [/\b(close|end) quote\b|\bunquote\b/gi, '"'], [/\b(open|begin) thought\b/gi, " '"], [/\b(close|end) thought\b/gi, "'"]
  ];
  function spoken(t) {
    SPOKEN.forEach(function (r) { t = t.replace(r[0], '\u0001' + r[1] + '\u0001'); });
    return t.replace(/\s*\u0001([.,?!;:"'”]+|\.\.\.)\u0001/g, '$1').replace(/\s*\u0001(\s*["'])\u0001\s*/g, '$1').replace(/\s*\u0001([\s\S]*?)\u0001\s*/g, '$1');
  }
  function insertDictated(raw) {
    var t = spoken(raw.trim()); if (!t) return;
    t = t.replace(/(\.["'”’]?\s+|[!?]\s+|\n\s*)(["'“‘]?)([a-z])/g, function (m, a, q, c) { return a + q + c.toUpperCase(); });
    var p = ta.selectionStart, before = ta.value.slice(0, p), prev = before.slice(-1);
    var startOfSentence = !before.trim() || /[.!?…]["'”’]?\s*$|\n\s*$/.test(before) || /["“'‘]$/.test(before) && /[.!?]\s*["“'‘]$|^\s*["“'‘]$|\n\s*["“'‘]$/.test(before);
    if (startOfSentence) t = t.replace(/^(\s*["'“‘]?)([a-z])/, function (m, a, b) { return a + b.toUpperCase(); });
    if (prev && !/[\s\n"“'‘(]/.test(prev) && /^[A-Za-z0-9"'“‘]/.test(t)) t = ' ' + t;
    if (/^ ?["']/.test(t) && (!prev || /\s/.test(prev))) t = t.replace(/^ /, '');
    replaceRange(p, ta.selectionEnd, t); afterEdit();
  }
  function setDict(on) {
    dictating = on; $('dictBtn').setAttribute('aria-pressed', on ? 'true' : 'false'); $('dictBtn').classList.toggle('on', on);
    $('dictPill').hidden = !on; $('dictText').textContent = 'Listening…';
  }
  function startDict() {
    if (!SR) { toast('Dictation works in Chrome, Edge and Safari. This browser does not support it.'); return; }
    if (readOn) stopRead();
    rec = new SR(); rec.lang = 'en-US'; rec.continuous = true; rec.interimResults = true;
    rec.onresult = function (e) {
      var interim = '';
      for (var i = e.resultIndex; i < e.results.length; i++) {
        var r = e.results[i];
        if (r.isFinal) insertDictated(r[0].transcript); else interim += r[0].transcript;
      }
      $('dictText').textContent = interim ? interim : 'Listening…';
    };
    rec.onerror = function (e) {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') { toast('The microphone is blocked. Allow it for this site in the address bar, then try again.'); setDict(false); }
      else if (e.error === 'network') { toast('Dictation needs the internet (your browser sends speech to its own service).'); setDict(false); }
    };
    rec.onend = function () { if (dictating) { try { rec.start(); } catch (x) { setDict(false); } } };
    try { rec.start(); setDict(true); ta.focus(); } catch (x) { toast('Could not start dictation.'); }
  }
  function stopDict() { setDict(false); if (rec) { try { rec.stop(); } catch (x) {} } }
  $('dictBtn').addEventListener('click', function () { if (dictating) stopDict(); else startDict(); });
  $('dictStop').addEventListener('click', stopDict);
  if (!SR) { $('dictBtn').title = 'Dictation works in Chrome, Edge and Safari'; $('dictBtn').classList.add('off'); }

  /* ======================= read aloud ======================= */
  var synth = window.speechSynthesis, readOn = false, readQueue = [];
  function voices() { return synth ? synth.getVoices().filter(function (v) { return /^en/i.test(v.lang); }) : []; }
  function fillVoices() {
    var vs = voices(); if (!vs.length) return;
    $('readVoice').innerHTML = vs.map(function (v) { return '<option value="' + esc(v.name) + '"' + (v.name === SET.voice ? ' selected' : '') + '>' + esc(v.name.replace(/^(Microsoft|Google) /, '')) + '</option>'; }).join('');
    if (!SET.voice) { var good = vs.filter(function (v) { return /natural|neural|samantha|google us|aria|jenny|guy/i.test(v.name); })[0]; if (good) $('readVoice').value = good.name; }
  }
  if (synth) { fillVoices(); synth.onvoiceschanged = fillVoices; }
  $('readRate').value = SET.readRate;
  $('readRate').addEventListener('input', function () { SET.readRate = +this.value; saveSet(); });
  $('readVoice').addEventListener('change', function () { SET.voice = this.value; saveSet(); });
  menuToggle($('readBtn'), $('readMenu'));
  function stopRead() { readOn = false; readQueue = []; if (synth) synth.cancel(); readMark = null; queueRender(); $('readBtn').classList.remove('on'); }
  function readFrom(start, end) {
    if (!synth) { toast('Reading aloud is not supported in this browser.'); return; }
    if (dictating) stopDict();
    stopRead(); readOn = true; $('readBtn').classList.add('on');
    var t = ta.value, pos = start; readQueue = [];
    while (pos < end) {
      var nl = t.indexOf('\n', pos); if (nl < 0 || nl > end) nl = end;
      if (t.slice(pos, nl).trim()) readQueue.push([pos, nl]);
      pos = nl + 1;
    }
    speakNext();
  }
  function speakNext() {
    if (!readOn) return;
    var seg = readQueue.shift(); if (!seg) { stopRead(); return; }
    var text = ta.value.slice(seg[0], seg[1]).replace(/— ✦ —/g, ' ');
    var u = new SpeechSynthesisUtterance(text); u.rate = SET.readRate || 1;
    var v = voices().filter(function (x) { return x.name === ($('readVoice').value || SET.voice); })[0]; if (v) u.voice = v;
    u.onboundary = function (e) {
      if (e.name && e.name !== 'word') return;
      var s0 = seg[0] + e.charIndex, len = e.charLength || ((ta.value.slice(s0).match(/^[^\s]+/) || [''])[0].length);
      readMark = { s: s0, e: s0 + Math.max(1, len), kind: 'read' }; renderBack();
      var m = back.querySelector('mark.k-read'); if (m) { var r = m.getBoundingClientRect(), sr = scroller.getBoundingClientRect(); if (r.bottom > sr.bottom - 80 || r.top < sr.top + 40) scroller.scrollTop += r.top - sr.top - sr.height / 3; }
    };
    u.onend = function () { readMark = null; speakNext(); };
    u.onerror = function () { stopRead(); };
    synth.speak(u);
  }
  $('readMenu').addEventListener('click', function (e) {
    var b = e.target.closest('[data-read]'); if (!b) return; closeMenus();
    var t = ta.value, p = ta.selectionStart, what = b.dataset.read;
    if (what === 'stop') return stopRead();
    if (ta.selectionEnd > ta.selectionStart && what !== 'all') return readFrom(ta.selectionStart, ta.selectionEnd);
    if (what === 'all') return readFrom(0, t.length);
    var ps = t.lastIndexOf('\n', p - 1) + 1, pe = t.indexOf('\n', p); if (pe < 0) pe = t.length;
    if (what === 'para') return readFrom(ps, pe);
    var sStart = Math.max(ps, t.slice(0, p).search(/[^.!?]*$/)); readFrom(Math.max(ps, sStart), t.length);
  });
  ta.addEventListener('keydown', function (e) { if (readOn && e.key === 'Escape') stopRead(); });

  /* ======================= start ======================= */
  function start(vault) {
    CANON = vault && vault.desk || null;
    C.setCanon(CANON); buildNames();
    var idx = Docs.index();
    var id = SET.current && Docs.get(SET.current) ? SET.current : (idx[0] && idx[0].id);
    if (!id) id = Docs.create('My first chapter').id;
    tmSettings(); chips(); renderLore(); renderDict();
    if (innerWidth <= 900) SET.panel = false;
    root.classList.toggle('panel-off', !SET.panel); $('panelBtn').setAttribute('aria-expanded', SET.panel ? 'true' : 'false');
    openDoc(id); selectTab(SET.tab || 'lore'); tmTick();
    root.classList.remove('is-loading');
    ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); keepCaretInView();
  }
  MBSite.vaultReady.then(function (v) { if (v) start(v); });
})();
