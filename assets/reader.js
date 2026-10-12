/* The on-site chapter reader. Chapters are added in chapters.js (instructions are at the top of that file). */
(function () {
  function init() {
    var chapters = (window.CHAPTERS || []).filter(function (c) { return !/Replace Me/i.test(c.title); });
    var listView = document.getElementById('listView'), reader = document.getElementById('reader'), chList = document.getElementById('chList');
    function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function format(text) {
      return esc(text.trim()).split(/\n\s*\n/).map(function (p) {
        p = p.trim();
        var flat = p.replace(/\s+/g, '');
        if (/^[—–-]*[✦✧*][—–✦✧*-]*$/.test(flat)) return '<p class="scene-break">— ✦ —</p>';
        p = p.replace(/"([^"\n]+)"/g, '<strong>"$1"</strong>');
        p = p.replace(/(^|[\s(—])'([^\n]+?)'(?![A-Za-z])/g, '$1<em>‘$2’</em>');
        return '<p>' + p.replace(/\n/g, '<br>') + '</p>';
      }).join('\n');
    }
    if (!chapters.length) document.getElementById('chEmpty').classList.remove('hidden');
    chList.innerHTML = chapters.map(function (ch, i) {
      return '<li><a href="#ch-' + (i + 1) + '"><span>' + esc(ch.title) + '</span><span class="muted">' + esc(ch.date || '') + '</span></a></li>';
    }).join('');
    function show(i) {
      if (i < 0 || i >= chapters.length) return showList();
      var ch = chapters[i];
      document.getElementById('chTitle').textContent = ch.title;
      document.getElementById('chDate').textContent = ch.date || '';
      document.getElementById('chBody').innerHTML = format(ch.text || '');
      var prev = document.getElementById('prevLink'), next = document.getElementById('nextLink');
      prev.href = '#ch-' + i; next.href = '#ch-' + (i + 2);
      prev.classList.toggle('hidden', i === 0); next.classList.toggle('hidden', i === chapters.length - 1);
      listView.classList.add('hidden'); reader.classList.remove('hidden');
      scrollTo(0, 0);
      document.title = ch.title + ' — Tales of the Gilded Goose';
    }
    function showList() { listView.classList.remove('hidden'); reader.classList.add('hidden'); document.title = 'Chapters — MirrorBloom'; }
    function route() { var m = location.hash.match(/^#ch-(\d+)$/); if (m) show(parseInt(m[1], 10) - 1); else showList(); }
    document.getElementById('backLink').addEventListener('click', function (e) { e.preventDefault(); history.pushState('', '', location.pathname); showList(); });
    addEventListener('hashchange', route); route();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
