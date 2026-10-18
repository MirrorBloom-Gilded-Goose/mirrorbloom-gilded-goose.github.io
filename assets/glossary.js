/* ==========================================================================
   HOVER DEFINITIONS
   The first time a lore word appears on a page, it gets a dotted underline;
   point at it (or tap it) for a one line definition and a link.

   EDIT HERE: [ words to find, definition, page to link, chapter it is
   revealed in (or omit) ]. Words are matched whole; capitals matter when
   the first word is capitalized.
   ========================================================================== */
(function () {
  var TERMS = [
    [['Solance'], 'The bright half of the world, on top, where most of the story happens.', 'cosmology.html'],
    [['Umbrasol'], 'The dark half of the world, beneath Solance: its mirror, and its evil twin.', 'cosmology.html'],
    [['Law of Reflection'], 'Every kindness in Mirrorbloom is, somewhere beneath it, paid for. The law reads intent, not deeds.', 'cosmology.html#law'],
    [['Shackle', 'Shackles'], 'The bond between everyone born in Mirrorbloom and their mirror self in the other half.', 'cosmology.html#law'],
    [['Sundering', 'the Breaking', 'The Breaking'], 'The split that broke the world into Solance and Umbrasol.', 'cosmology.html#breaking'],
    [['Great Hope'], 'The goddess of Solance.', 'great_hope.html'],
    [['All Mother'], 'What the faithful above call the Great Hope.', 'great_hope.html', 7],
    [['Great Despair', 'Mistress Despair'], 'The goddess of Umbrasol, the Great Hope’s other half. Her cults are hunted across Solance.', 'great_despair.html'],
    [['Archfey', 'Fey Lords'], 'The twelve Archfey aspects: the everyday pantheon people pray to, swear by and leave offerings for.', 'cosmology.html#archfey'],
    [['Mana Field'], 'The living field of magic that fills the world. It reacts, it remembers, and it is semi-conscious.', 'magic.html#layers'],
    [['personal core', 'personal cores'], 'The magic every living thing makes for itself. It works everywhere and refills on its own.', 'magic.html#layers'],
    [['dead zone', 'dead zones'], 'An anti-magic field with something like awareness, which zaps away cast magic inside it.', 'magic.html#dead-zones'],
    [['Hopelight'], 'The crystal the Shining Everlast runs on: lamps, monorails and power grids.', 'magic.html#hopelight'],
    [['Harrow’s Law', "Harrow's Law"], 'In the capital, casting in public needs a license, and every casting is logged.', 'magic.html#harrow', 15],
    [['Kenanism Empire', 'Kenanism'], 'The empire where mutation is sacred. Its pilgrims are why Mirrorbloom has hundreds of races.', 'kenanism.html', 9],
    [['ley line well', 'ley line wells', 'ley well', 'ley wells'], 'An ancient, wildly dense pocket of mana. Anything living near one mutates. Kenanism guards them.', 'travel.html#ley-wells'],
    [['Shining Everlast', 'Everlast'], 'The largest empire in the world: one city of towers, some fifty million people, governed by a Senate.', 'empires.html'],
    [['Last Shine'], 'The Shining Everlast’s mirror in Umbrasol.', 'empires.html#last-shine'],
    [['Yenfin Empire', 'Yenfin'], 'The first empire. A golden age power in the War, faded now, with a fifteen year old emperor.', 'yenfin.html'],
    [['Vaelgard'], 'A small warrior kingdom with a frost affinity, where everyone trains as a warrior first.', 'world.html#vaelgard', 23],
    [['Kelvarion'], 'The kingdom that flooded out the invaders in the Great Umbrasol Siege, and is still owed for it.', 'world.html#kelvarion'],
    [['Ironpeak'], 'An empire of only the original ten races on the third continent, founded by the elf Von Iron, who is still alive.', 'world.html#ironpeak', 'new'],
    [['Stillhedge'], 'A name some use for the third continent, closed off and low on magic.', 'world.html#third-continent'],
    [['Skyhold Dominion', 'Skyhold'], 'Fifteen islands held up in the sky by one shared ley line well.', 'world.html#skyhold'],
    [['Umbral Crown'], 'The second continent, and part of Solance despite the name.', 'world.html#umbral-crown'],
    [['Solmarch'], 'The first continent, home to the Everlast, Yenfin and Kenanism.', 'world.html#solmarch'],
    [['the Boundary', 'The Boundary'], 'The rim of Solance, where the land simply stops and gravity weakens.', 'cosmology.html#shape', 14],
    [['Gilded Goose'], 'Crockett’s guild, one of the top five in the Shining Everlast. Find it, understand it, share it.', 'gilded-goose.html'],
    [['Elite Four'], 'The guild’s top team: Cherry, Will, Tom and Sansa.', 'gilded-goose.html#elite-four'],
    [['Marauders'], 'Despite the name, an institution that helps people, hunting the cults of Despair across the continent.', 'orders.html#marauders', 7],
    [['Knights of Hope'], 'The All Mother’s personal knights. Almost every one is a famed warrior who died.', 'orders.html#knights', 24],
    [['the Foundry', 'The Foundry'], 'The faction that makes Hopelight and almost everything else. Without it the Everlast stops within days.', 'orders.html#foundry', 6],
    [['Mages College', 'Mages’ College', "Mages' College"], 'The capital’s college of magic, where Professor Linfay used to teach.', 'orders.html#college'],
    [['Dragon Layer'], 'The Everlast’s bard academy. The name is not a misspelling.', 'orders.html#dragon-layer', 19],
    [['Great Umbrasol Siege'], 'The War, about a hundred and twenty years ago, when Umbrasol came up into Solance.', 'timeline.html#fourth'],
    [['Glasswrights', 'Glasswright'], 'A young people, about seven hundred years old, descended from a woman who mutated herself in Kenanism.', 'world.html#peoples', 12],
    [['Venstar'], 'An offshoot of the vampires, born of a Kenanism mutation, that raids by night.', 'world.html#peoples', 'new'],
    [['faeries', 'Faeries', 'faerie'], 'The working class of the Archfey’s realms, now settling in Mirrorbloom and running its businesses.', 'world.html#peoples', 25],
    [['anomaly', 'anomalies', 'Anomaly', 'Anomalies'], 'Someone born with near godlike potential that never plateaus. A taboo subject in many places.', 'magic-types.html#anomalies', 18],
    [['empath', 'empaths', 'Empaths'], 'Someone born able to feel the emotions of others. Even with the oath sworn, often shunned.', 'magic-types.html#empathy', 16],
    [['biomancy', 'Biomancy', 'biomancer'], 'The magic that shapes and heals living bodies. Today a heavily regulated branch of medicine.', 'magic-types.html#biomancy', 4],
    [['Brumas'], 'Cannibal witches who invented biomancy two thousand years ago.', 'magic-types.html#biomancy', 4],
    [['Sleeping Meadows', 'the Meadow'], 'The endless meadow under the stars where nearly every soul goes to rest, waking now and then.', 'meadow.html', 21],
    [['the Gorge', 'The Gorge'], 'Mistress Despair’s afterlife, according to her church.', 'meadow.html#gorge', 21],
    [['leave your mark', 'leaving your mark', 'Leaving your mark', 'Leave your mark'], 'The Everlast’s national dream: great acts leave a permanent trace in the living Mana Field.', 'everlast.html#mark'],
    [['Illuminance'], 'The Everlast’s blazing festival of lights, giving and kindness.', 'everlast.html#festivals'],
    [['Marking Day'], 'The festival where everyone shows off what they built, found or achieved that year.', 'everlast.html#festivals'],
    [['Unity Week'], 'A week when the city’s factions and classes trade places.', 'everlast.html#festivals'],
    [['Founding Day'], 'The anniversary of the Everlast’s founding: fireworks, and the elves come down from their towers.', 'everlast.html#festivals'],
    [['Manamelt'], 'The Hearthside Manamelt, the national dish: a stew where every ingredient is enchanted on its own.', 'everlast.html#food'],
    [['realm walker', 'realm walkers'], 'Someone who crosses between worlds as easily as a street. They avoid Mirrorbloom, and none will say why.', 'cosmology.html#shape', 13]
  ];

  var here = location.pathname.split('/').pop() || 'index.html';
  var b = document.body;
  if (b.hasAttribute('data-sealed-page') || b.hasAttribute('data-table') || b.hasAttribute('data-desk') || here === 'mirror.html' || here === 'compendium.html') return;
  var main = document.getElementById('main'); if (!main) return;
  var SKIP = 'a, button, h1, h2, h3, h4, h5, h6, label, input, textarea, select, code, pre, script, style, svg, nav, .crumbs, .title-ref, .rail, .gl, .seal, .seal-block, .is-spoiler, .spoil-tag, .leaflet-container, .lc-head, .tile strong, .w-ref, [aria-hidden="true"], .hero-word, .world-name, .hero-hint, .card';
  function esc(s) { return MBSite.esc(s); }
  function hidden(ch) { return ch != null && window.MBSpoilers && MBSpoilers.isHidden && MBSpoilers.isHidden(ch); }

  function run() {
    var terms = TERMS.filter(function (t) { return t[2].split('#')[0] !== here && !hidden(t[3]); });
    if (!terms.length) return;
    var used = {}, all = [], idx = {};
    terms.forEach(function (t, i) { t[0].forEach(function (w) { all.push(w); idx[w] = i; }); });
    all.sort(function (a, b) { return b.length - a.length; });
    var re = new RegExp('(^|[^A-Za-z’\'-])(' + all.map(function (w) { return w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')(?![A-Za-z])', 'g');
    var walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT, { acceptNode: function (n) {
      if (!n.nodeValue || n.nodeValue.length < 3) return NodeFilter.FILTER_REJECT;
      var p = n.parentElement; if (!p || p.closest(SKIP)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    } });
    var nodes = [], n; while ((n = walker.nextNode())) nodes.push(n);
    var count = 0;
    nodes.forEach(function (node) {
      if (count > 40) return;
      var text = node.nodeValue, m, last = 0, frag = null; re.lastIndex = 0;
      while ((m = re.exec(text))) {
        var w = m[2], i = idx[w]; if (i == null || used[i]) continue;
        var start = m.index + m[1].length;
        if (w === 'Gilded Goose' && /Tales of the\s*$/.test(text.slice(0, start))) continue;
        if (w === 'Everlast' && /Shining\s*$/.test(text.slice(0, start))) continue;
        used[i] = true; count++;
        frag = frag || document.createDocumentFragment();
        frag.appendChild(document.createTextNode(text.slice(last, start)));
        var s = document.createElement('span'); s.className = 'gl'; s.tabIndex = 0; s.dataset.gl = i; s.textContent = w; s.setAttribute('role', 'button'); s.setAttribute('aria-describedby', 'glTip');
        frag.appendChild(s); last = start + w.length;
      }
      if (frag) { frag.appendChild(document.createTextNode(text.slice(last))); node.parentNode.replaceChild(frag, node); }
    });
    TERMS_LIVE = terms;
  }
  var TERMS_LIVE = [];

  /* the tooltip */
  var tip = document.createElement('div'); tip.className = 'gl-tip'; tip.id = 'glTip'; tip.setAttribute('role', 'tooltip'); tip.hidden = true; document.body.appendChild(tip);
  var cur = null, hideT = 0;
  function show(el) {
    var t = TERMS_LIVE[+el.dataset.gl]; if (!t) return; clearTimeout(hideT); cur = el;
    tip.innerHTML = '<b>' + esc(t[0][0].replace(/^the /, '').replace(/^./, function (c) { return c.toUpperCase(); })) + '</b><span>' + esc(t[1]) + '</span><a href="' + t[2] + '">Read more</a>';
    tip.hidden = false; tip.classList.remove('in');
    var r = el.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    var left = Math.max(8, Math.min(innerWidth - w - 8, r.left + r.width / 2 - w / 2)), top = r.top - h - 10;
    tip.classList.toggle('below', top < 70); if (top < 70) top = r.bottom + 10;
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
    requestAnimationFrame(function () { tip.classList.add('in'); });
  }
  function hide(now) { clearTimeout(hideT); hideT = setTimeout(function () { tip.classList.remove('in'); tip.hidden = true; cur = null; }, now ? 0 : 160); }
  var shownAt = 0;
  document.addEventListener('pointerover', function (e) {
    if (e.pointerType !== 'mouse') return;
    var g = e.target.closest && e.target.closest('.gl'); if (g) { if (g !== cur) { show(g); shownAt = Date.now(); } else clearTimeout(hideT); } else if (cur && e.target.closest('.gl-tip')) clearTimeout(hideT); else if (cur) hide();
  });
  document.addEventListener('focusin', function (e) { var g = e.target.closest && e.target.closest('.gl'); if (g && g !== cur) { show(g); shownAt = Date.now(); } });
  document.addEventListener('focusout', function (e) { if (e.target.closest && e.target.closest('.gl')) hide(); });
  document.addEventListener('click', function (e) {
    var g = e.target.closest('.gl');
    if (g) { e.preventDefault(); if (cur === g && !tip.hidden) { if (Date.now() - shownAt > 400) hide(true); } else { show(g); shownAt = Date.now(); } return; }
    if (!e.target.closest('.gl-tip')) hide(true);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') hide(true); if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('gl')) { e.preventDefault(); var t = TERMS_LIVE[+e.target.dataset.gl]; if (t) location.href = t[2]; } });
  addEventListener('scroll', function () { if (cur) hide(true); }, { passive: true });

  /* run after the spoiler shield has blurred what it needs to, and again if the reader changes chapter */
  function go() { setTimeout(run, 120); }
  if (document.readyState === 'complete') go(); else addEventListener('load', go);
  document.documentElement.addEventListener('mb:progress', function () {
    main.querySelectorAll('.gl').forEach(function (g) { var p = g.parentNode; p.replaceChild(document.createTextNode(g.textContent), g); p.normalize(); });
    hide(true); run();
  });
})();
