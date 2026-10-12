/* Shows one sealed page from the vault: sealed.html#page-id */
(function () {
  var GROUPS = { statblocks: ['Stat blocks', 'sanctum.html#statblocks'], bestiary: ['Bestiary', 'sanctum.html#bestiary'], adventures: ['Adventures', 'sanctum.html#adventures'], secrets: ['Secret lore', 'sanctum.html#secrets'], archive: ['Archive', 'sanctum.html#archive'], guide: ['Guide', 'sanctum.html'] };
  function render(v) {
    var id = decodeURIComponent(location.hash.slice(1)), p = v.pages[id];
    var title = document.getElementById('sTitle'), body = document.getElementById('sBody'), nav = document.getElementById('sNav');
    if (!p) {
      title.textContent = 'Nothing sealed here';
      body.innerHTML = '<p>There is no sealed page called “' + MBSite.esc(id) + '”. It may have been renamed in the vault editor.</p><p><a href="sanctum.html">Back to the Sanctum</a></p>';
      nav.innerHTML = ''; return;
    }
    var g = GROUPS[p.group] || ['Sealed', 'sanctum.html'];
    var crumb = document.getElementById('groupCrumb'); crumb.textContent = g[0]; crumb.href = g[1];
    title.textContent = p.title; document.title = p.title + ' — Sanctum — MirrorBloom';
    document.getElementById('sSummary').textContent = p.group === 'statblocks' ? '' : (p.summary || '');
    body.innerHTML = p.html;
    MBSite.renderSeals(); MBSite.unseal(v);
    if (window.MBSigils) MBSigils.render(body);
    var same = (v.order || Object.keys(v.pages)).filter(function (k) { return v.pages[k] && v.pages[k].group === p.group; });
    var i = same.indexOf(id), html = '<a class="btn small" href="' + g[1] + '">Back to ' + MBSite.esc(g[0].toLowerCase()) + '</a>';
    if (i > 0) html += '<a class="btn small" href="#' + same[i - 1] + '">Previous: ' + MBSite.esc(v.pages[same[i - 1]].title) + '</a>';
    if (i >= 0 && i < same.length - 1) html += '<a class="btn small" href="#' + same[i + 1] + '">Next: ' + MBSite.esc(v.pages[same[i + 1]].title) + '</a>';
    nav.innerHTML = html;
    scrollTo(0, 0);
  }
  MBSite.vaultReady.then(function (v) {
    if (!v) return;
    render(v);
    addEventListener('hashchange', function () { render(v); });
  });
})();
