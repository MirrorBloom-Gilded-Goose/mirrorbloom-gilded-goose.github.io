/* ==========================================================================
   FESTIVALS
   Loaded by site.js only while a festival from CONFIG.seasons is on (or
   previewed with ?season=<id>). Dresses the site for it and shows a small
   note that can be put away for the rest of the year.

   Looks (the effect field in CONFIG.seasons):
     lights     strings of bulbs under the header, lanterns drifting up
     fireworks  fireworks over the page
     marks      glowing marks surfacing in the Mana Field behind the page
     unity      bunting, and the two worlds' colors trade places
     veil       Umbrasol close to the glass: red moons, mist, bats
   ========================================================================== */
(function () {
  var S = window.MB_SEASON; if (!S || window.__mbSeason) return; window.__mbSeason = true;
  var root = document.documentElement;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function isAbove() { return root.getAttribute('data-theme') === 'solance'; }
  function esc(s) { return window.MBSite ? MBSite.esc(s) : String(s); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }

  var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'assets/seasons.css'; document.head.appendChild(css);

  var layer = document.createElement('div'); layer.className = 'season-layer fx-' + S.effect; layer.setAttribute('aria-hidden', 'true');
  var sky = document.querySelector('.sky');
  if (sky) sky.parentNode.insertBefore(layer, sky.nextSibling); else document.body.insertBefore(layer, document.body.firstChild);
  var header = document.getElementById('site-header');

  /* ---------- a canvas behind the page, paused while the tab is hidden ---------- */
  function canvas(draw) {
    var cv = document.createElement('canvas'); cv.className = 'season-cv'; layer.appendChild(cv);
    var ctx = cv.getContext('2d'), dpr = Math.min(1.5, window.devicePixelRatio || 1), W = 0, H = 0, last = 0, on = false;
    function size() { W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); addEventListener('resize', size);
    var api = { ctx: ctx, get W() { return W; }, get H() { return H; } };
    function frame(t) {
      if (document.hidden) { on = false; return; }
      var dt = Math.min(50, t - (last || t)); last = t;
      draw(api, dt, t); requestAnimationFrame(frame);
    }
    function start() { if (!on && !reduce) { on = true; last = 0; requestAnimationFrame(frame); } }
    document.addEventListener('visibilitychange', start); start();
    return api;
  }

  /* ---------- a garland hanging from the bottom of the header ---------- */
  function garland(kind) {
    if (!header) return;
    var g = document.createElement('div'); g.className = 'season-garland g-' + kind; g.setAttribute('aria-hidden', 'true'); header.appendChild(g);
    var COLORS = kind === 'lights' ? ['#F6C766', '#F08A7E', '#9EC5FF', '#A9D98F', '#F3E3B5'] : null;
    function paint() {
      var w = header.offsetWidth, span = w < 600 ? 70 : 96, n = Math.ceil(w / span) + 1, sag = kind === 'lights' ? 12 : 10, out = '';
      out += '<svg width="' + w + '" height="34" viewBox="0 0 ' + w + ' 34">';
      var wire = 'M0 1';
      for (var i = 0; i < n; i++) wire += ' Q' + (i * span + span / 2) + ' ' + (1 + sag * 2) + ' ' + ((i + 1) * span) + ' 1';
      out += '<path class="g-wire" d="' + wire + '" fill="none"/>';
      for (i = 0; i < n; i++) {
        var per = kind === 'lights' ? 3 : 4;
        for (var k = 1; k <= per; k++) {
          var tt = k / (per + 1), x = i * span + tt * span, y = 1 + 2 * (1 - tt) * tt * sag * 2;
          if (x > w + 10) continue;
          if (kind === 'lights') {
            var c = COLORS[(i * per + k) % COLORS.length];
            out += '<g class="bulb" style="--c:' + c + ';--d:' + (-Math.random() * 3).toFixed(2) + 's"><rect x="' + (x - 2) + '" y="' + (y - 1) + '" width="4" height="4" rx="1" class="cap"/><ellipse cx="' + x + '" cy="' + (y + 7) + '" rx="3.6" ry="5" fill="' + c + '"/></g>';
          } else {
            var flag = (i * per + k) % 2 ? 'a' : 'b';
            out += '<path class="flag ' + flag + '" d="M' + (x - 8) + ' ' + (y - 1) + ' L' + (x + 8) + ' ' + (y - 1) + ' L' + x + ' ' + (y + 15) + 'Z"/>';
          }
        }
      }
      g.innerHTML = out + '</svg>';
    }
    paint(); var rt = 0; addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(paint, 150); });
  }

  /* ---------- the looks ---------- */
  var action = null;   /* [label, function] for the note's button */

  function lights() {
    garland('lights');
    var lanterns = [];
    function add(x, y) { lanterns.push({ x: x, y: y, s: rnd(9, 16), v: rnd(0.012, 0.028), p: rnd(0, 6.28), a: 0 }); }
    var cv = canvas(function (c, dt, t) {
      var ctx = c.ctx; ctx.clearRect(0, 0, c.W, c.H);
      if (lanterns.length < (c.W < 600 ? 7 : 13) && Math.random() < 0.02) add(rnd(0, c.W), c.H + 30);
      var above = isAbove();
      lanterns = lanterns.filter(function (l) {
        l.y -= l.v * dt; l.a = Math.min(1, l.a + dt / 1500);
        var x = l.x + Math.sin(t / 1400 + l.p) * 14, y = l.y, s = l.s, fade = Math.min(1, (y + 40) / (c.H * 0.35));
        var alpha = l.a * fade * (above ? 0.5 : 0.75);
        var glow = ctx.createRadialGradient(x, y, 0, x, y, s * 3.2);
        glow.addColorStop(0, 'rgba(255,190,90,' + (alpha * 0.55).toFixed(3) + ')'); glow.addColorStop(1, 'rgba(255,170,70,0)');
        ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, s * 3.2, 0, 6.283); ctx.fill();
        ctx.fillStyle = 'rgba(255,' + (above ? 160 : 186) + ',96,' + alpha.toFixed(3) + ')';
        ctx.beginPath(); ctx.moveTo(x - s * 0.55, y - s * 0.7); ctx.lineTo(x + s * 0.55, y - s * 0.7); ctx.lineTo(x + s * 0.42, y + s * 0.7); ctx.lineTo(x - s * 0.42, y + s * 0.7); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,240,200,' + (alpha * 0.9).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(x, y + s * 0.25, s * 0.18, 0, 6.283); ctx.fill();
        return y > -60;
      });
    });
    for (var i = 0; i < 5; i++) add(rnd(0, innerWidth), rnd(innerHeight * 0.3, innerHeight));
    action = ['Light a lantern', function (e) { var r = e.currentTarget.getBoundingClientRect(); add(r.left + r.width / 2, r.top); }];
    return cv;
  }

  function fireworks() {
    var bursts = [], rockets = [], next = 600;
    var PAL = { below: ['#F1D7A4', '#CF4A58', '#8FA6D6', '#F6C766', '#ffffff'], above: ['#B8862C', '#A3324A', '#3D5F99', '#3F6B30', '#C9761E'] };
    function launch(x, ty) {
      var H = innerHeight;
      rockets.push({ x: x == null ? rnd(innerWidth * 0.1, innerWidth * 0.9) : x, y: H + 10, ty: ty == null ? rnd(H * 0.12, H * 0.42) : ty, v: rnd(0.55, 0.8), c: pick(PAL[isAbove() ? 'above' : 'below']) });
    }
    function explode(r) {
      var n = Math.round(rnd(38, 64)), c2 = Math.random() < 0.4 ? pick(PAL[isAbove() ? 'above' : 'below']) : r.c;
      for (var i = 0; i < n; i++) {
        var a = i / n * 6.283 + rnd(-0.05, 0.05), sp = rnd(0.06, 0.2);
        bursts.push({ x: r.x, y: r.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: rnd(900, 1500), c: i % 3 ? r.c : c2 });
      }
    }
    var cv = canvas(function (c, dt) {
      var ctx = c.ctx;
      ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0,0,0,' + Math.min(0.5, dt / 90).toFixed(3) + ')'; ctx.fillRect(0, 0, c.W, c.H);
      ctx.globalCompositeOperation = isAbove() ? 'source-over' : 'lighter';
      next -= dt; if (next <= 0) { launch(); next = rnd(900, 2300); }
      rockets = rockets.filter(function (r) {
        r.y -= r.v * dt; ctx.fillStyle = r.c; ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.arc(r.x, r.y, 1.6, 0, 6.283); ctx.fill();
        if (r.y <= r.ty) { explode(r); return false; } return true;
      });
      bursts = bursts.filter(function (p) {
        p.life += dt; p.vy += 0.00009 * dt; p.vx *= 0.995; p.vy *= 0.995; p.x += p.vx * dt; p.y += p.vy * dt;
        var k = 1 - p.life / p.max; if (k <= 0) return false;
        ctx.globalAlpha = Math.max(0, k) * (isAbove() ? 0.55 : 0.9); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, 1.7, 0, 6.283); ctx.fill();
        return true;
      });
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    });
    action = ['Launch one', function () { launch(); }];
    return cv;
  }

  function marks() {
    var list = [], next = 300;
    function sigil(x, y, size) {
      var pts = [], segs = [], n = Math.round(rnd(3, 5));
      for (var i = 0; i < 9; i++) pts.push([x + ((i % 3) - 1) * size * 0.45, y + (Math.floor(i / 3) - 1) * size * 0.45]);
      var at = Math.floor(rnd(0, 9));
      for (i = 0; i < n; i++) { var to = Math.floor(rnd(0, 9)); if (to === at) to = (to + 4) % 9; segs.push([pts[at], pts[to]]); at = to; }
      return { x: x, y: y, r: size * 0.72, segs: segs, life: 0, max: rnd(5200, 8000) };
    }
    function add(x, y) { list.push(sigil(x == null ? rnd(30, innerWidth - 30) : x, y == null ? rnd(innerHeight * 0.15, innerHeight - 30) : y, rnd(26, 54))); }
    var cv = canvas(function (c, dt) {
      var ctx = c.ctx; ctx.clearRect(0, 0, c.W, c.H);
      next -= dt; if (next <= 0 && list.length < (c.W < 600 ? 4 : 8)) { add(); next = rnd(1200, 2600); }
      var col = isAbove() ? '142,96,12' : '241,215,164';
      list = list.filter(function (m) {
        m.life += dt; var t = m.life / m.max; if (t >= 1) return false;
        var draw = Math.min(1, t / 0.3), alpha = (t < 0.75 ? 1 : (1 - t) / 0.25) * (isAbove() ? 0.45 : 0.55);
        ctx.strokeStyle = 'rgba(' + col + ',' + alpha.toFixed(3) + ')'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
        ctx.shadowColor = 'rgba(' + col + ',' + (alpha * 0.9).toFixed(3) + ')'; ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(m.x, m.y, m.r, -1.57, -1.57 + 6.283 * draw); ctx.stroke();
        var shown = draw * m.segs.length;
        m.segs.forEach(function (s, i) {
          var f = Math.max(0, Math.min(1, shown - i)); if (!f) return;
          ctx.beginPath(); ctx.moveTo(s[0][0], s[0][1]); ctx.lineTo(s[0][0] + (s[1][0] - s[0][0]) * f, s[0][1] + (s[1][1] - s[0][1]) * f); ctx.stroke();
        });
        ctx.shadowBlur = 0; return true;
      });
    });
    action = ['Leave a mark', function (e) { var r = e.currentTarget.getBoundingClientRect(); add(Math.min(innerWidth - 40, r.left + r.width / 2), r.top - 50); }];
    return cv;
  }

  function unity() {
    garland('bunting');
    action = ['Trade back', function (e) {
      var on = root.classList.toggle('unity-off');
      e.currentTarget.textContent = on ? 'Trade places' : 'Trade back';
    }];
  }

  function veil() {
    layer.innerHTML = '<div class="mist m1"></div><div class="mist m2"></div><div class="vignette"></div>';
    function bat(delay) {
      var b = document.createElement('div'); b.className = 'bat';
      b.innerHTML = '<svg viewBox="0 0 64 32"><path d="M32 9c-1.2 0-2 .6-2.6 1.6L28 7.5l-.6 4.2C24 9 18 6.6 10.5 7.2c2.6 1.6 4.4 3.8 4.6 6.6-3.6-1.4-8.4-1-13.1 1.4 5.2.4 9.6 2.6 12.4 6.2 2.2-1.8 5.6-2.4 8.4-1 1.6 1.6 3 4.4 3.6 7.8.8-2.6 2.2-4.2 5.6-4.2s4.8 1.6 5.6 4.2c.6-3.4 2-6.2 3.6-7.8 2.8-1.4 6.2-.8 8.4 1 2.8-3.6 7.2-5.8 12.4-6.2-4.7-2.4-9.5-2.8-13.1-1.4.2-2.8 2-5 4.6-6.6C46 6.6 40 9 36.6 11.7L36 7.5l-1.4 3.1C34 9.6 33.2 9 32 9Z"/></svg>';
      layer.appendChild(b);
      var W = innerWidth, H = innerHeight, ltr = Math.random() < 0.5, y0 = rnd(H * 0.08, H * 0.6), sc = rnd(0.55, 1.1), steps = [];
      for (var i = 0; i <= 8; i++) {
        var f = i / 8, x = ltr ? -80 + f * (W + 160) : W + 80 - f * (W + 160), y = y0 + Math.sin(f * 9 + y0) * 36 - f * rnd(20, 80);
        steps.push({ transform: 'translate(' + x.toFixed(0) + 'px,' + y.toFixed(0) + 'px) scale(' + (ltr ? sc : -sc).toFixed(2) + ',' + sc.toFixed(2) + ')' });
      }
      var anim = b.animate(steps, { duration: rnd(6000, 9500), delay: delay || 0, easing: 'linear' });
      anim.onfinish = function () { b.remove(); };
    }
    function flock(n) { for (var i = 0; i < n; i++) bat(i * rnd(150, 500)); }
    if (!reduce) {
      setTimeout(function () { flock(2); }, 1800);
      (function loop() { setTimeout(function () { if (!document.hidden) flock(Math.round(rnd(1, 3))); loop(); }, rnd(9000, 17000)); })();
    }
    action = ['Look closer', function () {
      var m = document.querySelector('.moons');
      root.classList.add('veil-flare'); setTimeout(function () { root.classList.remove('veil-flare'); }, 2600);
      if (m) { m.classList.add('blink'); setTimeout(function () { m.classList.remove('blink'); }, 260); }
      if (!reduce) flock(5);
    }];
  }

  var LOOKS = { lights: lights, fireworks: fireworks, marks: marks, unity: unity, veil: veil };
  (LOOKS[S.effect] || function () {})();

  /* ---------- the note ---------- */
  var now = new Date(), year = now.getFullYear();
  if (S.from && S.to && S.from > S.to && (('0' + (now.getMonth() + 1)).slice(-2) + '-' + ('0' + now.getDate()).slice(-2)) <= S.to) year--;
  var KEY = 'mb-season-' + S.id + '-' + year, put = false;
  try { put = localStorage.getItem(KEY) === 'away'; } catch (e) {}
  if (put && !S.preview) return;
  var note = document.createElement('aside'); note.className = 'season-note'; note.setAttribute('aria-label', 'Festival');
  var name = S.name || 'Your autumn festival';
  note.innerHTML = '<span class="sn-mark" aria-hidden="true"></span><div class="sn-body"><p class="sn-name">' + esc(name) + (S.preview ? ' <small>preview</small>' : '') + '</p>' +
    (S.note ? '<p class="sn-text">' + esc(S.note) + '</p>' : '') +
    '<p class="sn-acts">' + (action && !(reduce && S.effect !== 'unity') ? '<button type="button" class="sn-do">' + esc(action[0]) + '</button>' : '') +
    (S.link ? '<a href="' + esc(S.link) + '">About it</a>' : '') + '</p></div>' +
    '<button type="button" class="sn-x" aria-label="Put this away">' + (window.MBSite ? MBSite.icon.close : '&times;') + '</button>';
  document.body.appendChild(note);
  setTimeout(function () { note.classList.add('in'); }, reduce ? 0 : 900);
  var doBtn = note.querySelector('.sn-do'); if (doBtn) doBtn.addEventListener('click', function (e) { action[1](e); });
  note.querySelector('.sn-x').addEventListener('click', function () {
    try { localStorage.setItem(KEY, 'away'); } catch (e) {}
    note.classList.remove('in'); setTimeout(function () { note.remove(); }, 300);
  });
})();
