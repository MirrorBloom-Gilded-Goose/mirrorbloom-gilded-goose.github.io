/* Builds the Compendium by reading the site's own pages, so it never goes out of date.
   To add a page to the book, add it to PARTS below. */
(function () {
  var PARTS = [
    { name: 'The Mirror', pages: ['cosmology.html', 'magic.html', 'magic-types.html', 'meadow.html', 'iceberg.html', 'courts.html', 'timeline.html'] },
    { name: 'The Gods and the Archfey', pages: ['great_hope.html', 'great_despair.html', 'dawnward_king.html', 'duskward_king.html', 'verdant_lady.html', 'bloated_lady.html', 'revel_king.html', 'mocking_king.html', 'lady_of_dreaming.html', 'lady_of_waking.html', 'hearthkeeper.html', 'hollow_host.html', 'hunter_king.html', 'stalking_king.html'] },
    { name: 'The World', pages: ['world.html', 'empires.html', 'everlast.html', 'kenanism.html', 'yenfin.html', 'travel.html', 'orders.html'] },
    { name: 'The Gilded Goose', pages: ['gilded-goose.html', 'crockett.html', 'cherry.html', 'will.html', 'tom.html', 'sansa.html', 'serial.html'] }
  ];
  var status = document.getElementById('compStatus');
  function clean(node) {
    node.querySelectorAll('script, .rail, .btn-row, .tiles, .waterline, .realm-index, .gauge, canvas, .meadow-grass, .ice-tip, .ice-water, .ice-body, .public-only, .crumbs, .title-ref, .sealed-only .btn').forEach(function (n) { n.remove(); });
    node.querySelectorAll('[id]').forEach(function (n) { n.removeAttribute('id'); });
    node.querySelectorAll('[data-sigil-done]').forEach(function (n) { n.removeAttribute('data-sigil-done'); n.innerHTML = ''; });
    node.querySelectorAll('.draw').forEach(function (n) { n.classList.remove('draw'); });
    node.querySelectorAll('[data-draw]').forEach(function (n) { n.removeAttribute('data-draw'); });
    return node;
  }
  async function grab(href) {
    var html = await (await fetch(href)).text();
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var title = (doc.querySelector('h1') || {}).textContent || href;
    var wrap = document.createElement('section'); wrap.className = 'comp-chapter';
    var head = doc.querySelector('.page-head, .meadow-head, .ice-top .page-head');
    var standfirst = head && head.querySelector('.standfirst');
    var deity = doc.querySelector('.deity-head');
    var parts = [];
    if (deity) parts.push(deity);
    doc.querySelectorAll('main article, main .descent').forEach(function (a) { parts.push(a); });
    wrap.innerHTML = '<h2 class="comp-h">' + MBSite.esc(title.trim()) + '</h2>' + (standfirst && !deity ? '<p class="standfirst">' + standfirst.innerHTML + '</p>' : '');
    parts.forEach(function (p) {
      var c = clean(p.cloneNode(true));
      if (c.classList.contains('deity-head')) { var h = c.querySelector('h1'); if (h) h.remove(); }
      wrap.appendChild(c);
    });
    return { title: title.trim(), node: wrap };
  }
  async function build() {
    var body = document.getElementById('compBody'), toc = document.getElementById('compToc');
    document.getElementById('compDate').textContent = 'Gathered ' + new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
    var tocHtml = '<h2>Contents</h2>', n = 0, total = PARTS.reduce(function (s, p) { return s + p.pages.length; }, 0);
    for (var i = 0; i < PARTS.length; i++) {
      var part = PARTS[i], ph = document.createElement('h2'); ph.className = 'comp-part'; ph.textContent = part.name; body.appendChild(ph);
      tocHtml += '<h3>' + part.name + '</h3><ol>';
      var results = await Promise.all(part.pages.map(function (p) { return grab(p).catch(function () { return null; }); }));
      results.forEach(function (r) {
        if (!r) return; n++;
        r.node.id = 'c' + n; body.appendChild(r.node);
        tocHtml += '<li><a href="#c' + n + '">' + MBSite.esc(r.title) + '</a></li>';
      });
      tocHtml += '</ol>';
      status.textContent = 'Gathered ' + n + ' of ' + total + ' pages…';
    }
    var vault = await MBSite.vaultReady;
    if (vault && vault.pages) {
      var ph2 = document.createElement('h2'); ph2.className = 'comp-part'; ph2.textContent = 'The Sanctum'; body.appendChild(ph2);
      tocHtml += '<h3>The Sanctum</h3><ol>';
      (vault.order || Object.keys(vault.pages)).forEach(function (id) {
        var pg = vault.pages[id]; if (!pg || pg.compendium === false) return; n++;
        var s = document.createElement('section'); s.className = 'comp-chapter'; s.id = 'c' + n;
        s.innerHTML = '<h2 class="comp-h">' + MBSite.esc(pg.title) + '</h2>' + pg.html;
        body.appendChild(s); tocHtml += '<li><a href="#c' + n + '">' + MBSite.esc(pg.title) + '</a></li>';
      });
      tocHtml += '</ol>';
    }
    toc.innerHTML = tocHtml;
    MBSite.renderSeals(); if (vault) MBSite.unseal(vault);
    if (window.MBSigils) MBSigils.render(body);
    status.textContent = 'Ready: ' + n + ' pages.';
  }
  function start() { build().catch(function (e) { status.textContent = 'Some pages could not be gathered. Reload to try again.'; console.error(e); }); }
  MBSite.vaultReady.then(start);
})();
