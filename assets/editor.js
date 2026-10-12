/* Vault editor: edit sealed pages and snippets, then download a newly sealed vault.enc. */
(function () {
  var V = null, cur = null, dirty = false;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return MBSite.esc(s == null ? '' : s); };
  function status(t) { $('edStatus').textContent = t; }
  function mark(d) { dirty = d; status(d ? 'You have changes that are not sealed yet. Download the sealed vault to keep them.' : 'The vault is open. Nothing has changed.'); }
  addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });

  function list() {
    var f = ($('edFilter').value || '').toLowerCase(), html = '';
    var groups = {};
    (V.order || Object.keys(V.pages)).forEach(function (id) { var p = V.pages[id]; if (!p) return; (groups[p.group] = groups[p.group] || []).push(id); });
    Object.keys(groups).forEach(function (g) {
      var items = groups[g].filter(function (id) { return !f || id.indexOf(f) > -1 || (V.pages[id].title || '').toLowerCase().indexOf(f) > -1; });
      if (!items.length) return;
      html += '<h3>' + esc(g) + '</h3><ul>' + items.map(function (id) { return '<li><a href="#" data-kind="page" data-id="' + esc(id) + '"' + (cur && cur.id === id ? ' class="on"' : '') + '>' + esc(V.pages[id].title) + '</a></li>'; }).join('') + '</ul>';
    });
    var sn = Object.keys(V.snippets || {}).filter(function (k) { return !f || k.indexOf(f) > -1; }).sort();
    if (sn.length) html += '<h3>snippets</h3><ul>' + sn.map(function (k) { return '<li><a href="#" data-kind="snippet" data-id="' + esc(k) + '"' + (cur && cur.id === k ? ' class="on"' : '') + '>' + esc(k) + '</a></li>'; }).join('') + '</ul>';
    $('edEntries').innerHTML = html;
  }
  function open(kind, id) {
    cur = { kind: kind, id: id, isNew: !id };
    $('edForm').classList.remove('hidden'); $('edEmpty').classList.add('hidden');
    document.querySelectorAll('.page-only').forEach(function (el) { el.classList.toggle('hidden', kind !== 'page'); });
    $('edKind').textContent = kind === 'page' ? 'Sealed page: appears in the Sanctum' : 'Snippet: sealed text inside a public page, used with data-seal="key"';
    var p = kind === 'page' ? (V.pages[id] || { title: '', group: 'secrets', summary: '', html: '' }) : null;
    $('edId').value = id || '';
    $('edTitle').value = p ? p.title : ''; $('edGroup').value = p ? p.group : 'secrets'; $('edSummary').value = p ? (p.summary || '') : '';
    $('edComp').checked = !p || p.compendium !== false;
    $('edHtml').value = kind === 'page' ? (p.html || '') : (V.snippets[id] || '');
    $('edOpen').href = kind === 'page' ? 'sealed.html#' + (id || '') : 'sanctum.html';
    $('edOpen').classList.toggle('hidden', kind !== 'page' || !id);
    preview(); list();
  }
  function preview() {
    var pv = $('edPreview'); pv.innerHTML = $('edHtml').value;
    pv.querySelectorAll('script').forEach(function (s) { s.remove(); });
    MBSite.renderSeals(); MBSite.unseal(V); if (window.MBSigils) MBSigils.render(pv);
  }
  function download(name, text, type) {
    var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: type || 'application/octet-stream' })); a.download = name;
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  function init(v) {
    V = JSON.parse(JSON.stringify(v)); V.snippets = V.snippets || {}; V.order = V.order || Object.keys(V.pages);
    mark(false); list();
    $('edEntries').addEventListener('click', function (e) { var a = e.target.closest('a[data-id]'); if (!a) return; e.preventDefault(); open(a.dataset.kind, a.dataset.id); });
    $('edFilter').addEventListener('input', list);
    $('newPage').addEventListener('click', function () { open('page', ''); $('edId').focus(); });
    $('newSnip').addEventListener('click', function () { open('snippet', ''); $('edId').focus(); });
    $('edHtml').addEventListener('input', function () { clearTimeout(preview.t); preview.t = setTimeout(preview, 250); });
    $('edForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var id = $('edId').value.trim();
      if (!/^[a-z0-9\-_]+$/.test(id)) { status('Keys use lowercase letters, numbers and dashes only.'); return; }
      if (cur.kind === 'page') {
        if (cur.id && cur.id !== id) { delete V.pages[cur.id]; V.order = V.order.map(function (k) { return k === cur.id ? id : k; }); }
        V.pages[id] = { title: $('edTitle').value.trim() || id, group: $('edGroup').value, summary: $('edSummary').value.trim(), html: $('edHtml').value };
        if (!$('edComp').checked) V.pages[id].compendium = false;
        if (V.order.indexOf(id) < 0) V.order.push(id);
      } else {
        if (cur.id && cur.id !== id) delete V.snippets[cur.id];
        V.snippets[id] = $('edHtml').value;
      }
      cur.id = id; mark(true); list(); open(cur.kind, id); status('Saved "' + id + '". Download the sealed vault when you are done.');
    });
    $('edDelete').addEventListener('click', function () {
      if (!cur || !cur.id) return;
      if (!confirm('Delete "' + cur.id + '" from the vault? This takes effect when you download the sealed vault.')) return;
      if (cur.kind === 'page') { delete V.pages[cur.id]; V.order = V.order.filter(function (k) { return k !== cur.id; }); } else delete V.snippets[cur.id];
      cur = null; $('edForm').classList.add('hidden'); $('edEmpty').classList.remove('hidden'); mark(true); list();
    });
    $('dlSealed').addEventListener('click', function () {
      V.meta = V.meta || {}; V.meta.updated = new Date().toISOString().slice(0, 10);
      status('Sealing…');
      MBVault.resealWithCurrentKey(V).then(function (txt) { download('vault.enc', txt); mark(false); status('Downloaded vault.enc. Upload it to the repository on GitHub, replacing the old one.'); })
        .catch(function (e) { status('Could not seal the vault: ' + e.message); });
    });
    $('dlPlain').addEventListener('click', function () {
      if (!confirm('This file is NOT sealed. Anyone who opens it can read every secret. Keep it somewhere private, and never upload it to the repository.')) return;
      download('mirrorbloom-vault-backup.json', JSON.stringify(V, null, 1), 'application/json');
    });
    $('showImport').addEventListener('click', function () { $('importErr').textContent = ''; $('importDlg').showModal(); });
    $('importForm').addEventListener('submit', function (e) {
      if (e.submitter && e.submitter.value === 'cancel') return;
      try {
        var d = JSON.parse($('importText').value), n = 0;
        Object.keys(d.pages || {}).forEach(function (k) { var p = d.pages[k]; V.pages[k] = { title: p.title || k, group: p.group || 'secrets', summary: p.summary || '', html: p.html || '' }; if (V.order.indexOf(k) < 0) V.order.push(k); n++; });
        Object.keys(d.snippets || {}).forEach(function (k) { V.snippets[k] = d.snippets[k]; n++; });
        mark(true); list(); status('Imported ' + n + ' entries. Download the sealed vault to keep them.'); $('importText').value = '';
      } catch (err) { e.preventDefault(); $('importErr').textContent = 'That is not valid JSON: ' + err.message; }
    });
    $('showPass').addEventListener('click', function () { $('passErr').textContent = ''; $('passDlg').showModal(); });
    $('passForm').addEventListener('submit', function (e) {
      if (e.submitter && e.submitter.value === 'cancel') return;
      var a = $('pass1').value, b = $('pass2').value;
      if (a.length < 10) { e.preventDefault(); $('passErr').textContent = 'Use at least 10 characters. Four random words works well.'; return; }
      if (a !== b) { e.preventDefault(); $('passErr').textContent = 'The two passphrases do not match.'; return; }
      MBVault.sealWithPassphrase(V, a).then(function (txt) {
        download('vault.enc', txt); mark(false); $('pass1').value = $('pass2').value = '';
        status('Downloaded vault.enc sealed with your new passphrase. Upload it, then sign in again with the new one.');
      });
    });
  }
  MBSite.vaultReady.then(function (v) { if (v) init(v); });
})();
