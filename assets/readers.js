/* ==========================================================================
   Readers: how many people visit, shown in the Sanctum.
   Reads the public counter from GoatCounter. Only counts come back, never
   anything that could identify a person.
   ========================================================================== */
(function () {
  var host = document.getElementById('readersBody'); if (!host) return;
  var code = (MBSite.config.counter || '').trim();
  var esc = MBSite.esc, DAYS = 30, KEY = 'mb-readers-cache';
  var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  if (!code) {
    host.innerHTML =
      '<div class="readers-setup"><p><strong>Readers aren’t being counted yet.</strong> The count runs on GoatCounter, a free counter that never stores IP addresses or uses cookies. To switch it on:</p>' +
      '<ol><li>Make a free account at <a href="https://www.goatcounter.com/signup" target="_blank" rel="noopener">goatcounter.com</a>. When it asks for a code, use <code>mirrorbloom</code>.</li>' +
      '<li>In GoatCounter, open <strong>Settings</strong>, turn on <strong>Allow adding visitor counts on your website</strong>, and save.</li>' +
      '<li>Put the code in <code>counter</code> at the top of <code>assets/site.js</code>, or ask Claude to.</li></ol></div>';
    return;
  }

  var base = 'https://' + code + '.goatcounter.com/counter/' + encodeURIComponent('/readers') + '.json';
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function short(d) { return MONTHS[d.getMonth()] + ' ' + d.getDate(); }
  function num(s) { var n = parseInt(String(s).replace(/[^0-9]/g, ''), 10); return isNaN(n) ? 0 : n; }
  function fmt(n) { return n >= 10000 ? (n / 1000).toFixed(n >= 100000 ? 0 : 1).replace(/\.0$/, '') + 'K' : n.toLocaleString(); }

  function load() { try { var c = JSON.parse(localStorage.getItem(KEY) || 'null'); if (c && c.code === code) return c; } catch (e) {} return { code: code, days: {}, at: {} }; }
  function save(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }

  function get(qs) {
    return fetch(base + qs, { cache: 'no-cache' }).then(function (r) {
      if (r.status === 404) return 0;                       /* nobody counted in that range yet */
      if (!r.ok) throw new Error('status ' + r.status);
      return r.json().then(function (j) { return num(j.count); });
    });
  }
  function pool(tasks, n) {
    var i = 0, out = [];
    function next() { if (i >= tasks.length) return Promise.resolve(); var k = i++; return tasks[k]().then(function (v) { out[k] = v; return next(); }); }
    var runners = []; for (var j = 0; j < Math.min(n, tasks.length); j++) runners.push(next());
    return Promise.all(runners).then(function () { return out; });
  }

  function gather() {
    var cache = load(), now = Date.now(), dates = [];
    for (var k = DAYS - 1; k >= 0; k--) { var d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() - k); dates.push(d); }
    var fresh = 30 * 60 * 1000, need = [];
    dates.forEach(function (d, idx) {
      var key = iso(d), recent = idx >= DAYS - 2;           /* today and yesterday can still change */
      if (cache.days[key] == null || (recent && now - (cache.at[key] || 0) > fresh)) need.push(key);
    });
    var tasks = need.map(function (key) { return function () { return get('?start=' + key + '&end=' + key).then(function (v) { cache.days[key] = v; cache.at[key] = Date.now(); }); }; });
    if (cache.total == null || now - (cache.at.total || 0) > fresh) tasks.push(function () { return get('').then(function (v) { cache.total = v; cache.at.total = Date.now(); }); });
    return pool(tasks, 6).then(function () {
      var cutoff = new Date(); cutoff.setDate(cutoff.getDate() - 60);
      Object.keys(cache.days).forEach(function (k) { if (new Date(k) < cutoff) { delete cache.days[k]; delete cache.at[k]; } });
      save(cache);
      return { dates: dates, values: dates.map(function (d) { return cache.days[iso(d)] || 0; }), total: cache.total || 0 };
    });
  }

  function niceMax(m) { if (m <= 4) return 4; var p = Math.pow(10, Math.floor(Math.log10(m))), f = m / p; return (f <= 2 ? 2 : f <= 5 ? 5 : 10) * p; }

  function render(data) {
    var v = data.values, sum = function (a) { return a.reduce(function (s, x) { return s + x; }, 0); };
    var today = v[v.length - 1], week = sum(v.slice(-7)), month = sum(v);
    var tiles = [['Today', today], ['Last 7 days', week], ['Last 30 days', month], ['All time', Math.max(data.total, month)]];

    var W = 720, H = 190, padL = 34, padB = 26, padT = 10, plotW = W - padL - 6, plotH = H - padB - padT;
    var max = niceMax(Math.max.apply(null, v.concat([1]))), band = plotW / v.length, bw = Math.min(16, band - 4);
    var y = function (val) { return padT + plotH - (val / max) * plotH; };
    var grid = [0, max / 2, max].map(function (t) {
      return '<line class="rd-grid" x1="' + padL + '" x2="' + (W - 6) + '" y1="' + y(t).toFixed(1) + '" y2="' + y(t).toFixed(1) + '"/>' +
             '<text class="rd-tick" x="' + (padL - 8) + '" y="' + (y(t) + 4).toFixed(1) + '" text-anchor="end">' + fmt(t) + '</text>';
    }).join('');
    var bars = v.map(function (val, i) {
      var x = padL + i * band + (band - bw) / 2, top = y(val), h = Math.max(0, padT + plotH - top), r = Math.min(4, h, bw / 2);
      var d = h <= 0 ? '' : 'M' + x.toFixed(1) + ',' + (padT + plotH) + ' V' + (top + r).toFixed(1) + ' Q' + x.toFixed(1) + ',' + top.toFixed(1) + ' ' + (x + r).toFixed(1) + ',' + top.toFixed(1) +
        ' H' + (x + bw - r).toFixed(1) + ' Q' + (x + bw).toFixed(1) + ',' + top.toFixed(1) + ' ' + (x + bw).toFixed(1) + ',' + (top + r).toFixed(1) + ' V' + (padT + plotH) + ' Z';
      var label = short(data.dates[i]) + (i === v.length - 1 ? ' (today)' : '') + ': ' + val.toLocaleString() + (val === 1 ? ' person' : ' people');
      return '<g class="rd-col" tabindex="0" role="img" aria-label="' + esc(label) + '" data-i="' + i + '">' +
        '<rect class="rd-hit" x="' + (padL + i * band).toFixed(1) + '" y="' + padT + '" width="' + band.toFixed(1) + '" height="' + plotH + '"/>' +
        (d ? '<path class="rd-bar' + (i === v.length - 1 ? ' is-today' : '') + '" d="' + d + '"/>' : '') + '</g>';
    }).join('');
    var xt = [0, 7, 14, 21, 29].map(function (i) {
      return '<text class="rd-tick" x="' + (padL + i * band + band / 2).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle">' + (i === 29 ? 'Today' : short(data.dates[i])) + '</text>';
    }).join('');
    var rows = data.dates.map(function (d, i) { return '<tr><td>' + short(d) + '</td><td>' + v[i].toLocaleString() + '</td></tr>'; }).reverse().join('');

    host.innerHTML =
      '<dl class="rd-tiles">' + tiles.map(function (t) { return '<div class="rd-tile"><dt>' + t[0] + '</dt><dd>' + fmt(t[1]) + '</dd></div>'; }).join('') + '</dl>' +
      '<figure class="rd-chart"><figcaption>People each day, last 30 days</figcaption>' +
      '<div class="rd-plot"><svg viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" role="group" aria-label="People each day for the last 30 days">' + grid +
      '<line class="rd-base" x1="' + padL + '" x2="' + (W - 6) + '" y1="' + (padT + plotH) + '" y2="' + (padT + plotH) + '"/>' + bars + xt + '</svg>' +
      '<div class="rd-tip" role="status" aria-live="polite" hidden></div></div></figure>' +
      (month === 0 ? '<p class="muted">No readers counted yet. New visits show up within a few hours.</p>' : '') +
      '<p class="rd-note">Each person counts once a day, so someone who comes back tomorrow counts again tomorrow. GoatCounter updates these numbers every few hours. Your own visits aren’t counted on devices signed in to the Sanctum.</p>' +
      '<details class="rd-table"><summary>Show as a table</summary><div class="table-wrap"><table><thead><tr><th>Day</th><th>People</th></tr></thead><tbody>' + rows + '</tbody></table></div></details>';

    var plot = host.querySelector('.rd-plot'), tip = host.querySelector('.rd-tip'), svg = plot.querySelector('svg');
    function show(g) {
      var i = +g.dataset.i, val = v[i], r = g.querySelector('.rd-hit').getBoundingClientRect(), pr = plot.getBoundingClientRect();
      host.querySelectorAll('.rd-col.on').forEach(function (x) { x.classList.remove('on'); }); g.classList.add('on');
      tip.innerHTML = '<strong>' + val.toLocaleString() + '</strong> ' + (val === 1 ? 'person' : 'people') + '<span>' + short(data.dates[i]) + (i === v.length - 1 ? ', today' : '') + '</span>';
      tip.hidden = false;
      /* sit beside the column, never on top of it */
      var right = i < v.length / 2, x = right ? r.right - pr.left + 8 : r.left - pr.left - 8;
      tip.style.left = x + 'px'; tip.style.transform = right ? 'none' : 'translateX(-100%)';
    }
    function hide() { tip.hidden = true; host.querySelectorAll('.rd-col.on').forEach(function (x) { x.classList.remove('on'); }); }
    svg.addEventListener('pointerover', function (e) { var g = e.target.closest('.rd-col'); if (g) show(g); });
    svg.addEventListener('pointerleave', hide);
    svg.addEventListener('focusin', function (e) { var g = e.target.closest('.rd-col'); if (g) show(g); });
    svg.addEventListener('focusout', hide);
  }

  host.innerHTML = '<p class="muted">Counting readers…</p>';
  gather().then(render).catch(function () {
    host.innerHTML = '<p class="rd-error">The counter didn’t answer. Check that <strong>Allow adding visitor counts on your website</strong> is turned on in GoatCounter’s settings, and that the code <code>' + esc(code) + '</code> is right. If it is, try again in a few minutes.</p>';
  });
})();
