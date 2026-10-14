/* "Leave your mark": reader comments through giscus (GitHub Discussions).
   Switched on from CONFIG.comments in site.js; nothing here needs editing. */
(function () {
  var C = MBSite.config.comments, root = document.documentElement, reader = document.getElementById('reader');
  var main = document.getElementById('main'); if (!main) return;
  function theme() { return root.getAttribute('data-theme') === 'solance' ? 'light' : 'transparent_dark'; }
  function chapterTerm() { var m = location.hash.match(/^#ch-(\d+)$/); return m ? 'Chapter ' + m[1] : null; }

  var sec = document.createElement('section');
  sec.className = 'marks' + (reader ? '' : ' wrap'); sec.id = 'leave-your-mark';
  sec.innerHTML = '<h2>Leave your mark</h2>' +
    '<p class="marks-note">Theories, questions, favourite moments. Sign in with GitHub to post; everything here is public. ' +
    'Not everyone is caught up, so keep later-chapter spoilers out of early pages.</p><div class="giscus"></div>';
  (reader || main).appendChild(sec);

  var loaded = false, term = reader ? chapterTerm() : null;
  function frame() { return sec.querySelector('iframe.giscus-frame'); }
  function send(cfg) { var f = frame(); if (f) f.contentWindow.postMessage({ giscus: { setConfig: cfg } }, 'https://giscus.app'); }
  function load() {
    if (loaded || (reader && !term)) return; loaded = true;
    var a = { 'data-repo': C.repo, 'data-repo-id': C.repoId, 'data-category': C.category, 'data-category-id': C.categoryId,
      'data-mapping': term ? 'specific' : 'pathname', 'data-strict': '1', 'data-reactions-enabled': '1', 'data-emit-metadata': '0',
      'data-input-position': 'top', 'data-theme': theme(), 'data-lang': 'en', 'data-loading': 'lazy' };
    if (term) a['data-term'] = term;
    var s = document.createElement('script'); s.src = 'https://giscus.app/client.js'; s.async = true; s.crossOrigin = 'anonymous';
    Object.keys(a).forEach(function (k) { s.setAttribute(k, a[k]); });
    sec.appendChild(s);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { io.disconnect(); load(); } }, { rootMargin: '600px 0px' });
    io.observe(sec);
  } else load();

  root.addEventListener('mb:crossed', function () { send({ theme: theme() }); });
  if (reader) addEventListener('hashchange', function () {
    var t = chapterTerm(); if (!t || t === term) return; term = t;
    if (loaded) send({ term: t }); else load();
  });
})();
