/* ==========================================================================
   MIRRORBLOOM — the spoiler shield
   Readers pick the chapter of Tales of the Gilded Goose they have reached.
   Anything the serial reveals later is blurred, with a tag saying when it is
   revealed and a button to show it anyway. Saved on the reader's device.

   To mark something as a spoiler, either:
     - add data-ch="12" to an element in a page, or
     - add a line to MAP below: [ what to find, chapter ].
       "what to find" is a #section-id, or a few exact words from the passage.
       Start it with ".class|" to blur the whole surrounding block of that class.
   Use 'new' as the chapter for things revealed in chapters still being numbered.
   ========================================================================== */
(function () {
  var MAP = {
    'cosmology.html': [
      ['At the rim of Solance the land simply stops', 14],
      ['.lecture|Most worlds are spheres', 13],
      ['Before it, some scholars argue, the world was round', 2],
      ['The Archfey also do one thing', 18]
    ],
    'magic.html': [
      ['.lecture|History first, fireball later', 2],
      ['#casters', 20], ['#harrow', 15], ['#hopelight', 10],
      ['Right now there is not enough of it', 12],
      ['Biomancy, the magic of flesh, was developed', 4],
      ['Some people, usually on the edge of death', 'new'],
      ['Some people are born able to feel the emotions', 16],
      ['An anomaly is born with talent', 18], ['The first anomaly anyone names', 18], ['The last anomaly to survive into adulthood', 18],
      ['More immortals exist than most people expect', 17], ['Many immortals are believed', 17]
    ],
    'magic-types.html': [
      ['#wizardry', 20], ['#witchcraft', 20], ['#clerical', 20], ['#sorcery', 20],
      ['#biomancy', 4], ['#hopelight', 10], ['Magic and beauty had nothing to do with each other', 27],
      ['For two to three thousand years the', 9], ['Forcing more mana into your body than it can hold', 'new'],
      ['#necromancy', 10], ['#frost', 23], ['#time', 8], ['#wild', 10], ['#empathy', 16], ['#anomalies', 18]
    ],
    'world.html': [
      ['.entry|Ironpeak', 'new'], ['.entry|An empire built around a mana leyline', 9],
      ['.entry|Vaelgard', 23],
      ['A young species, about seven hundred years old', 12],
      ['Few in number and great in influence', 22],
      ['The working class of the Archfey', 25],
      ['An offshoot of the vampires that roams Stillhedge', 'new']
    ],
    'kenanism.html': [
      ['Kenanism shares Solmarch with the Shining Everlast', 9], ['#faith', 9],
      ['Some lines are thousands of years old', 22]
    ],
    'yenfin.html': [
      ['It was founded by Captain Reagan', 24],
      ['who now hunt Despair cultists across the continent, were founded in Yenfin', 7]
    ],
    'orders.html': [
      ['#knights', 24], ['#marauders', 7], ['#foundry', 6], ['#dragon-layer', 19]
    ],
    'everlast.html': [
      ['The Shining Everlast was founded nine thousand years ago', 5], ['.lecture|They remain the true rulers', 5],
      ['Then, about a hundred and twenty years ago', 5],
      ['Not everything is magic for its own sake', 27]
    ],
    'meadow.html': [
      ['#arrival', 'new'], ['#sleep', 21], ['Every so often, a soul wakes', 'new'],
      ['#lambs', 21], ['#gorge', 21]
    ],
    'empires.html': [
      ['and now there is not enough of it', 12]
    ],
    'timeline.html': [
      ['.event|The Library of Hope, called different things', 3],
      ['.event|Signs before the Sundering', 11],
      ['.event|The first empires', 24],
      ['.event|The Age of the Warring Kingdoms', 17],
      ['.event|The Brumas', 4],
      ['.event|The Glasswrights', 12],
      ['.event|Native vampires', 22],
      ['.event|Crockett arrives', 2],
      ['.event|The Great Umbrasol Siege', 23],
      ['.event|The Dragon Layer', 19],
      ['.event|Fifty years ago', 10],
      ['.event|The isolation shields', 10],
      ['.event|Harrow', 15],
      ['.event|The current day', 16],
      ['The first anomaly anyone names. Entire fields', 18],
      ['Grand priestess of Hope and the oldest immortal on record', 17],
      ['Bard, dragon diplomat', 19]
    ],
    'gilded-goose.html': [
      ['An older, drunken gentleman with a heart of gold', 11],
      ['A guild member and Hopelight and rune expert', 25],
      ['The old orc who runs', 6],
      ['A human, transformed', 4],
      ['A warrior princess of Vaelgard', 7]
    ],
    'crockett.html': [
      ['Crockett is not from Mirrorbloom', 2], ['#vesper', 8]
    ],
    'cherry.html': [
      ['Cherry was not born the way she looks', 4], ['When Cherry casts, the air changes color', 17]
    ],
    'will.html': [
      ['#craft', 4], ['He stores his own alchemical compounds', 14]
    ],
    'sansa.html': [
      ['When she gets serious, her mutation wakes', 7], ['#home', 6]
    ],
    'great_hope.html': [
      ['Her faithful above call her the All Mother', 24],
      ['where nearly every soul in Mirrorbloom goes to rest, lie within her domain', 24],
      ['She is not only gentle', 18]
    ],
    'great_despair.html': [
      ['Her church teaches of an afterlife called', 21]
    ]
  };

  var KEY = 'mb-read-to', root = document.documentElement;
  var page = location.pathname.split('/').pop() || 'index.html';
  var latest = +(MBSite.config.latestChapter || 28);
  var revealed = new WeakSet();

  function getProgress() { try { var v = localStorage.getItem(KEY); return v == null ? 'all' : v; } catch (e) { return 'all'; } }
  function setProgress(v) { try { if (v === 'all') localStorage.removeItem(KEY); else localStorage.setItem(KEY, v); } catch (e) {} }

  function isHidden(ch, p) {
    if (p === 'all') return false;
    var n = +p;
    if (ch === 'new') return n < latest;
    return +ch > n;
  }
  function label(ch) { return ch === 'new' ? 'Revealed in a recent chapter' : 'Revealed in Chapter ' + ch; }

  var CANDIDATES = 'p, li, dd, blockquote, .lecture, .entry, .event, .kind, .person, .tile, section[id], .note';
  function resolve(spec) {
    var what = spec[0];
    if (what.charAt(0) === '#') return document.querySelector(what);
    var closest = null, i = what.indexOf('|');
    if (i > 0 && (what.charAt(0) === '.' )) { closest = what.slice(0, i); what = what.slice(i + 1); }
    var main = document.getElementById('main') || document.body, best = null;
    main.querySelectorAll(closest || CANDIDATES).forEach(function (el) {
      if (el.textContent.replace(/\s+/g, ' ').indexOf(what) > -1 && (!best || best.contains(el))) best = el;
    });
    return best;
  }
  function tagAll() {
    (MAP[page] || []).forEach(function (spec) { var el = resolve(spec); if (el && !el.hasAttribute('data-ch')) el.setAttribute('data-ch', spec[1]); });
  }

  function apply() {
    var p = getProgress();
    document.querySelectorAll('[data-ch]').forEach(function (el) {
      var hide = isHidden(el.getAttribute('data-ch'), p) && !revealed.has(el);
      var parentHidden = el.parentElement && el.parentElement.closest('.is-spoiler');
      var tag = el.querySelector(':scope > .spoil-tag');
      el.classList.toggle('is-spoiler', hide);
      if (hide && !parentHidden) {
        if (!tag) {
          tag = document.createElement('button'); tag.type = 'button'; tag.className = 'spoil-tag';
          tag.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); revealed.add(el); apply(); });
          el.insertBefore(tag, el.firstChild);
        }
        tag.innerHTML = '<span>' + label(el.getAttribute('data-ch')) + '</span><span class="spoil-show">Show</span>';
        tag.setAttribute('aria-label', label(el.getAttribute('data-ch')) + '. Show it anyway.');
        tag.classList.toggle('is-block', !/^(P|LI|DD|BLOCKQUOTE)$/.test(el.tagName));
      } else if (tag) tag.remove();
    });
    paintButton(p);
    root.classList.remove('shield-on');
  }

  /* ---------- header control ---------- */
  var BOOK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 6.5C10 5 7 4.6 4 5.2v13c3-.6 6-.2 8 1.3 2-1.5 5-1.9 8-1.3v-13c-3-.6-6-.2-8 1.3Z"/><path d="M12 6.5v13"/></svg>';
  var btn, pop;
  function options() {
    var o = '<option value="all">Show everything</option><option value="0">I haven’t started yet</option>';
    for (var i = 1; i <= latest; i++) o += '<option value="' + i + '">Chapter ' + i + '</option>';
    return o;
  }
  function paintButton(p) {
    if (!btn) return;
    var on = p !== 'all';
    btn.classList.toggle('is-on', on);
    btn.querySelector('.badge').textContent = on ? (p === '0' ? '0' : p) : '';
    var t = on ? (p === '0' ? 'Spoiler shield: you haven’t started the serial' : 'Spoiler shield: read up to Chapter ' + p) : 'Spoiler shield: off';
    btn.setAttribute('aria-label', t); btn.title = t;
  }
  function openPop(show) {
    pop.hidden = !show; btn.setAttribute('aria-expanded', show ? 'true' : 'false');
    if (show) { pop.querySelector('select').value = getProgress(); pop.querySelector('select').focus(); }
  }
  function buildControl() {
    var tools = document.querySelector('#site-header .tools'); if (!tools) return;
    btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'icon-btn shield-btn'; btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-controls', 'shield-pop');
    btn.innerHTML = BOOK + '<span class="badge" aria-hidden="true"></span>';
    tools.insertBefore(btn, tools.firstChild);
    pop = document.createElement('div');
    pop.className = 'shield-pop'; pop.id = 'shield-pop'; pop.hidden = true; pop.setAttribute('role', 'dialog'); pop.setAttribute('aria-label', 'Spoiler shield');
    pop.innerHTML = '<p class="shield-h">Reading the serial?</p><p>Pick the last chapter of <em>Tales of the Gilded Goose</em> you’ve read, and anything revealed after it is hidden across the site.</p>' +
      '<label for="shield-sel">I’ve read up to</label><select id="shield-sel">' + options() + '</select>' +
      '<p class="shield-foot">Saved on this device only.</p>';
    document.querySelector('#site-header .bar').appendChild(pop);
    btn.addEventListener('click', function (e) { e.stopPropagation(); openPop(pop.hidden); });
    pop.addEventListener('click', function (e) { e.stopPropagation(); });
    pop.querySelector('select').addEventListener('change', function (e) { setProgress(e.target.value); apply(); root.dispatchEvent(new CustomEvent('mb:progress')); });
    document.addEventListener('click', function () { if (!pop.hidden) openPop(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !pop.hidden) { openPop(false); btn.focus(); } });
    document.querySelectorAll('[data-open-shield]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); scrollTo({ top: 0, behavior: 'smooth' }); openPop(true); });
    });
  }

  window.MBSpoilers = { apply: apply, open: function () { openPop(true); }, progress: getProgress, label: label, isHidden: function (ch) { return isHidden(ch, getProgress()); }, latest: latest };
  function init() { buildControl(); tagAll(); apply(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
