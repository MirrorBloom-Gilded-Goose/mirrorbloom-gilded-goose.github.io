/* Stars, drifting sleep pods and a few fireflies over the Sleeping Meadows. */
(function () {
  var cv = document.querySelector('.meadow-canvas'); if (!cv) return;
  var ctx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), W, H;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var stars = [], pods = [], flies = [];
  function size() {
    var r = cv.getBoundingClientRect(); W = r.width; H = r.height;
    cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function seed() {
    stars = []; pods = []; flies = [];
    for (var i = 0; i < Math.round(W * H / 2600); i++) stars.push({ x: Math.random() * W, y: Math.random() * H * 0.75, r: Math.random() * 1.3 + 0.2, p: Math.random() * 6.28, s: 0.4 + Math.random() * 1.2 });
    for (var j = 0; j < 26; j++) {
      var depth = Math.random();                              /* 0 far, 1 near */
      pods.push({ x: Math.random() * W, y: H * (0.72 + depth * 0.22), d: depth, w: 10 + depth * 34, v: 0.04 + depth * 0.16, p: Math.random() * 6.28 });
    }
    pods.sort(function (a, b) { return a.d - b.d; });
    for (var k = 0; k < 18; k++) flies.push({ x: Math.random() * W, y: H * (0.55 + Math.random() * 0.4), p: Math.random() * 6.28, v: 0.2 + Math.random() * 0.4 });
  }
  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    stars.forEach(function (s) {
      var a = 0.35 + 0.65 * Math.abs(Math.sin(t / 1400 * s.s + s.p));
      ctx.fillStyle = 'rgba(235,230,255,' + a.toFixed(2) + ')'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill();
    });
    pods.forEach(function (p) {
      if (!reduce) { p.x += p.v; if (p.x - p.w > W) p.x = -p.w * 2; }
      var bob = Math.sin(t / 2600 + p.p) * (2 + p.d * 4), x = p.x, y = p.y + bob, w = p.w, h = w * 0.42;
      var g = ctx.createRadialGradient(x, y, 0, x, y, w * 1.6);
      g.addColorStop(0, 'rgba(250,226,170,' + (0.18 + p.d * 0.22).toFixed(2) + ')'); g.addColorStop(1, 'rgba(250,226,170,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, w * 1.6, h * 2.2, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(255,240,210,' + (0.35 + p.d * 0.45).toFixed(2) + ')';
      ctx.beginPath(); ctx.ellipse(x, y, w, h, 0, 0, 6.283); ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.2 + p.d * 0.3).toFixed(2) + ')'; ctx.lineWidth = 1; ctx.stroke();
    });
    flies.forEach(function (f) {
      if (!reduce) { f.x += Math.cos(t / 1800 + f.p) * f.v; f.y += Math.sin(t / 2200 + f.p) * f.v * 0.6; }
      var a = 0.2 + 0.8 * Math.max(0, Math.sin(t / 700 + f.p));
      ctx.fillStyle = 'rgba(214,240,140,' + a.toFixed(2) + ')'; ctx.beginPath(); ctx.arc(f.x, f.y, 1.6, 0, 6.283); ctx.fill();
    });
    if (!reduce && !document.hidden) requestAnimationFrame(draw);
  }
  size(); seed(); requestAnimationFrame(draw);
  addEventListener('resize', function () { size(); seed(); if (reduce) requestAnimationFrame(draw); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && !reduce) requestAnimationFrame(draw); });
})();
