/* Who's your reflection? Five answers in, one Umbrasol twin out, on a card you can save. */
(function () {
  var esc = MBSite.esc, S = window.MBSigils;
  var FEY = [
    ['dawnward_king', 'duskward_king'], ['verdant_lady', 'bloated_lady'], ['revel_king', 'mocking_king'],
    ['lady_of_dreaming', 'lady_of_waking'], ['hearthkeeper', 'hollow_host'], ['hunter_king', 'stalking_king']
  ];
  var VIRTUES = {
    'Kindness': 'cruelty that calls itself honesty', 'Courage': 'recklessness that gets other people killed', 'Honesty': 'lies so good they pass for truth',
    'Loyalty': 'possessiveness that never lets go', 'Curiosity': 'a hunger for forbidden things', 'Generosity': 'hoarding what other people need',
    'Patience': 'spite that knows how to wait', 'Hope': 'despair, worn proudly'
  };
  var CALLINGS = {
    'Inventing and discovering': 'Invents things that should never have been made.',
    'Songs and stories': 'Writes songs that leave whole towns despairing.',
    'Deeds worth retelling': 'Wins fights nobody retells, because nobody survives them.',
    'Keeping the land healthy': 'Quietly lets the land sicken, and is proud of it.',
    'Protecting wild things': 'Hunts the last of every kind.',
    'A whispered legend': 'Is famous, loudly, for every terrible thing.',
    'Spreading faith and joy': 'Preaches for Mistress Despair, and the pews are full.',
    'Pride in my craft': 'Bakes the worst bread in the district, on purpose, and people queue for it.'
  };
  var HOMES = {
    'The Underlevels': 'the Drowned Levels of the Last Shine', 'The Ground Bazaar': 'the Starved Market of the Last Shine',
    'The Foundry Tiers': 'the Grinding Tiers of the Last Shine', 'The Greenbelt Spires': 'the Rootrot Gardens of the Last Shine',
    'The Lamplight Quarter': 'the Gaslight Quarter of the Last Shine', 'The Glass Courts': 'the Cracked Courts of the Last Shine',
    'The Stormreach': 'the Fallreach of the Last Shine', 'The Crownspires': 'the Sunken Crown of the Last Shine',
    'Somewhere else in Solance': 'the reflection of your home town, under two red moons'
  };
  var TELLS = ['a smile that opens far too wide', 'a third eye that never blinks', 'stitches where a face should join', 'teeth that rise like a crown',
    'skin like wet paper', 'eyes that weep black', 'a second shadow that moves a beat late', 'hands with one joint too many', 'a voice like two people speaking at once'];

  function radios(id, name, items, render) {
    document.getElementById(id).innerHTML = items.map(function (v, i) {
      var val = typeof v === 'string' ? v : v[0];
      return '<label class="choice"><input type="radio" name="' + name + '" value="' + esc(val) + '"' + '' + '><span>' + render(v) + '</span></label>';
    }).join('');
  }
  radios('qFey', 'fey', FEY, function (p) {
    var a = S.info[p[0]];
    return '<span class="mini" data-sigil="' + p[0] + '"></span><span class="ch-name">' + esc(a.name) + '<small>' + esc(a.epithet) + '</small></span>';
  });
  radios('qVirtue', 'virtue', Object.keys(VIRTUES), function (v) { return esc(v); });
  radios('qCall', 'call', Object.keys(CALLINGS), function (v) { return esc(v); });
  radios('qHome', 'home', Object.keys(HOMES), function (v) { return esc(v); });
  S.render(document.getElementById('qFey'));

  /* the same answers always give the same reflection */
  function seed(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  function mirrorName(n) {
    return n.trim().split('').reverse().join('').toLowerCase().replace(/(^|[\s-])(\S)/g, function (m, a, b) { return a + b.toUpperCase(); });
  }

  var current = null;
  function build(a) {
    var pair = FEY.filter(function (p) { return p[0] === a.fey; })[0];
    var rnd = seed([a.name.toLowerCase(), a.fey, a.virtue, a.call, a.home].join('|'));
    return {
      name: a.name.trim(), twin: mirrorName(a.name), bright: pair[0], shadow: pair[1],
      serves: S.info[pair[1]].name, vice: VIRTUES[a.virtue], mark: CALLINGS[a.call], home: HOMES[a.home], tell: TELLS[rnd % TELLS.length]
    };
  }

  function showCard(r) {
    var card = document.getElementById('card');
    card.innerHTML =
      '<div class="card-top"><span class="c-sig" data-sigil="' + r.bright + '"></span><p class="c-you">' + esc(r.name) + '</p><p class="c-cap">in Solance, above</p></div>' +
      '<div class="card-line" aria-hidden="true"></div>' +
      '<div class="card-below"><p class="c-cap">and below, in Umbrasol</p><p class="c-twin">' + esc(r.twin) + '</p><span class="c-sig big" data-sigil="' + r.shadow + '"></span>' +
      '<dl><dt>Serves</dt><dd>' + esc(r.serves) + '</dd><dt>Defined by</dt><dd>' + esc(r.vice) + '</dd><dt>Their mark</dt><dd>' + esc(r.mark) + '</dd>' +
      '<dt>Lives in</dt><dd>' + esc(r.home) + '</dd><dt>Umbrasol calls them beautiful for</dt><dd>' + esc(r.tell) + '</dd></dl></div>';
    S.render(card);
    document.getElementById('resultLine').textContent = 'Every time ' + r.name + ' does real good, ' + r.twin + ' grows a little crueler. That is the Law of Reflection, and nobody has ever broken it.';
    var res = document.getElementById('result');
    res.classList.remove('hidden'); card.classList.remove('rise'); void card.offsetWidth; card.classList.add('rise');
    res.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  document.getElementById('quiz').addEventListener('submit', function (e) {
    e.preventDefault();
    var f = e.target, err = document.getElementById('quizError');
    var a = { name: f.querySelector('#qName').value, fey: (f.querySelector('input[name=fey]:checked') || {}).value, virtue: (f.querySelector('input[name=virtue]:checked') || {}).value,
      call: (f.querySelector('input[name=call]:checked') || {}).value, home: (f.querySelector('input[name=home]:checked') || {}).value };
    if (!a.name.trim()) { err.textContent = 'Give the glass a name to reflect.'; f.querySelector('#qName').focus(); return; }
    var missing = ['fey', 'virtue', 'call', 'home'].filter(function (k) { return !a[k]; });
    if (missing.length) { err.textContent = 'Answer every question so the glass has something to reflect.'; return; }
    err.textContent = '';
    current = build(a); showCard(current);
  });
  document.getElementById('again').addEventListener('click', function () { document.getElementById('quiz').scrollIntoView({ behavior: 'smooth' }); });

  /* ---------- the card as an image ---------- */
  function sigilImage(id, color) {
    var svg = S.svg(id).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" ').replace(/currentColor/g, color);
    return new Promise(function (res) { var img = new Image(); img.onload = function () { res(img); }; img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); });
  }
  function wrapText(ctx, text, x, y, maxW, lh) {
    var words = text.split(' '), line = '', lines = [];
    words.forEach(function (w) { var t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { lines.push(line); line = w; } else line = t; });
    if (line) lines.push(line);
    lines.forEach(function (l, i) { ctx.fillText(l, x, y + i * lh); });
    return y + lines.length * lh;
  }
  function fit(ctx, text, size, maxW) {
    do { ctx.font = size + 'px "IM Fell English", Georgia, serif'; size -= 4; } while (ctx.measureText(text).width > maxW && size > 30);
  }
  async function drawCard(r) {
    await Promise.all([document.fonts.load('80px "IM Fell English"'), document.fonts.load('36px "Spectral"'), document.fonts.load('italic 36px "Spectral"')]).catch(function () {});
    var W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; var x = c.getContext('2d');
    var g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#221a2c'); g.addColorStop(0.36, '#1a1322'); g.addColorStop(1, '#0d0910'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    var glow = x.createRadialGradient(W / 2, H, 50, W / 2, H, 700); glow.addColorStop(0, 'rgba(207,74,88,.35)'); glow.addColorStop(1, 'rgba(207,74,88,0)'); x.fillStyle = glow; x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(236,228,242,.18)'; x.lineWidth = 2; x.strokeRect(36, 36, W - 72, H - 72);
    x.textAlign = 'center'; x.fillStyle = '#D9A95B';
    var top = await sigilImage(r.bright, '#D9A95B'); x.drawImage(top, W / 2 - 60, 90, 120, 120);
    fit(x, r.name, 64, W - 200); x.fillText(r.name, W / 2, 272);
    x.font = 'italic 30px "Spectral", Georgia, serif'; x.fillStyle = '#ACA0BF'; x.fillText('in Solance, above', W / 2, 318);
    var lg = x.createLinearGradient(120, 0, W - 120, 0); lg.addColorStop(0, 'rgba(207,74,88,0)'); lg.addColorStop(0.5, 'rgba(207,74,88,1)'); lg.addColorStop(1, 'rgba(207,74,88,0)');
    x.fillStyle = lg; x.fillRect(120, 360, W - 240, 2);
    x.fillStyle = '#ACA0BF'; x.font = 'italic 30px "Spectral", Georgia, serif'; x.fillText('and below, in Umbrasol', W / 2, 420);
    x.fillStyle = '#ECE4F2'; fit(x, r.twin, 112, W - 180); x.fillText(r.twin, W / 2, 540);
    var sh = await sigilImage(r.shadow, '#CF4A58'); x.drawImage(sh, W / 2 - 80, 575, 160, 160);
    var y = 780, rows = [['Serves', r.serves], ['Defined by', r.vice], ['Their mark', r.mark], ['Lives in', r.home], ['Umbrasol calls them beautiful for', r.tell]];
    rows.forEach(function (row) {
      x.fillStyle = '#74688A'; x.font = 'italic 26px "Spectral", Georgia, serif'; x.fillText(row[0], W / 2, y); y += 38;
      x.fillStyle = '#ECE4F2'; x.font = '32px "Spectral", Georgia, serif'; y = wrapText(x, row[1], W / 2, y, W - 260, 40) + 16;
    });
    x.fillStyle = '#ACA0BF'; x.font = '26px "Spectral", Georgia, serif'; x.fillText("Who's your reflection?  mirrorbloom-gilded-goose.github.io", W / 2, H - 60);
    return c;
  }
  document.getElementById('saveCard').addEventListener('click', async function () {
    if (!current) return;
    var btn = this; btn.disabled = true; btn.textContent = 'Drawing…';
    try {
      var c = await drawCard(current);
      var blob = await new Promise(function (res) { c.toBlob(res, 'image/png'); });
      var file = new File([blob], 'reflection-' + current.twin.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '.png', { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] }) && /Mobi|Android|iPhone|iPad/.test(navigator.userAgent)) {
        await navigator.share({ files: [file], title: 'My reflection in Umbrasol' }).catch(function () {});
      } else {
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click();
        setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
      }
    } finally { btn.disabled = false; btn.textContent = 'Save the card'; }
  });
})();
