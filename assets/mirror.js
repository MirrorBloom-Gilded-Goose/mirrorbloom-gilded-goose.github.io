/* The mirror: right passphrase cracks and shatters the glass; a wrong one fogs it. */
(function () {
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var params = new URLSearchParams(location.search);
  var next = params.get('next') || 'sanctum.html';
  if (!/^[a-z0-9_\-]+\.html(#[\w\-]*)?$/i.test(next)) next = 'sanctum.html';

  function $(id) { return document.getElementById(id); }

  function crack() {
    var svg = $('cracks'), cx = 50, cy = 46, paths = '';
    for (var i = 0; i < 11; i++) {
      var a = (i / 11) * Math.PI * 2 + (Math.random() - .5) * .4, x = cx, y = cy, d = 'M' + cx + ' ' + cy;
      for (var s = 0; s < 5; s++) {
        var step = 7 + Math.random() * 9; a += (Math.random() - .5) * .5;
        x += Math.cos(a) * step; y += Math.sin(a) * step * 1.25; d += ' L' + x.toFixed(1) + ' ' + y.toFixed(1);
      }
      paths += '<path d="' + d + '" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1;animation:crackdraw .5s ' + (i * 0.02).toFixed(2) + 's ease-out forwards"/>';
    }
    for (var r = 0; r < 2; r++) {
      var rad = 9 + r * 11, ring = '';
      for (var k = 0; k <= 12; k++) { var t = k / 12 * Math.PI * 2; ring += (k ? ' L' : 'M') + (cx + Math.cos(t) * rad * (0.85 + Math.random() * .3)).toFixed(1) + ' ' + (cy + Math.sin(t) * rad * 1.2 * (0.85 + Math.random() * .3)).toFixed(1); }
      paths += '<path d="' + ring + '" pathLength="1" style="stroke-dasharray:1;stroke-dashoffset:1;animation:crackdraw .45s ' + (0.25 + r * .1) + 's ease-out forwards"/>';
    }
    svg.innerHTML = '<style>@keyframes crackdraw{to{stroke-dashoffset:0}}</style>' + paths;
  }

  function shatter() {
    var glass = $('glass'), host = $('shards'), cx = 50, cy = 46, n = 12, pieces = [];
    var angles = []; for (var i = 0; i < n; i++) angles.push((i / n) * 360 + (Math.random() - .5) * 18);
    angles.sort(function (a, b) { return a - b; });
    function pt(a, r) { var t = a * Math.PI / 180; return [cx + Math.cos(t) * r, cy + Math.sin(t) * r * 1.2]; }
    for (var j = 0; j < n; j++) {
      var a1 = angles[j], a2 = angles[(j + 1) % n] + (j === n - 1 ? 360 : 0), mid = 14 + Math.random() * 14;
      var inner = [[cx, cy], pt(a1, mid), pt(a2, mid)];
      var outer = [pt(a1, mid), pt(a1, 120), pt(a2, 120), pt(a2, mid)];
      pieces.push(inner, outer);
    }
    host.innerHTML = '';
    pieces.forEach(function (poly, idx) {
      var el = document.createElement('div'); el.className = 'shard';
      el.style.clipPath = 'polygon(' + poly.map(function (p) { return p[0].toFixed(1) + '% ' + p[1].toFixed(1) + '%'; }).join(',') + ')';
      host.appendChild(el);
      var mx = poly.reduce(function (s, p) { return s + p[0]; }, 0) / poly.length - cx;
      var my = poly.reduce(function (s, p) { return s + p[1]; }, 0) / poly.length - cy;
      var dist = Math.hypot(mx, my) || 1;
      el.animate([
        { transform: 'translate(0,0) rotate(0deg)', opacity: 1 },
        { transform: 'translate(' + (mx / dist * 30).toFixed(0) + 'px,' + (my / dist * 20 + 30).toFixed(0) + 'px) rotate(' + ((Math.random() - .5) * 30).toFixed(0) + 'deg)', opacity: 1, offset: .25 },
        { transform: 'translate(' + (mx / dist * 120 + (Math.random() - .5) * 60).toFixed(0) + 'px,' + (420 + Math.random() * 260).toFixed(0) + 'px) rotate(' + ((Math.random() - .5) * 220).toFixed(0) + 'deg)', opacity: 0 }
      ], { duration: 1300 + Math.random() * 600, delay: idx * 18, easing: 'cubic-bezier(.4,.05,.7,.4)', fill: 'forwards' });
    });
    glass.style.visibility = 'hidden';
    $('cracks').style.visibility = 'hidden';
  }

  function fog(msg) {
    var glass = $('glass'), w = $('whisper');
    glass.classList.remove('fogged'); void glass.offsetWidth; glass.classList.add('fogged');
    w.textContent = msg;
    setTimeout(function () { glass.classList.remove('fogged'); }, 1900);
  }

  function init() {
    if (window.MBVault && MBVault.hasKey()) {
      $('speak').classList.add('hidden');
      $('signedIn').classList.remove('hidden');
      $('forget').addEventListener('click', function () { MBVault.lock(); location.reload(); });
      return;
    }
    $('speak').addEventListener('submit', function (e) {
      e.preventDefault();
      var pass = $('pass').value, btn = e.target.querySelector('button');
      if (!pass) return;
      btn.disabled = true; $('whisper').textContent = 'The glass is listening…';
      MBVault.unlock(pass, $('remember').checked).then(function () {
        $('whisper').textContent = 'It knows you.';
        if (reduce) { location.href = next; return; }
        $('speak').style.transition = 'opacity .3s'; $('speak').style.opacity = '0';
        crack();
        setTimeout(function () { shatter(); document.querySelector('.mirror-scene').classList.add('broken'); }, 650);
        setTimeout(function () { location.href = next; }, 2500);
      }).catch(function (err) {
        btn.disabled = false; $('pass').select();
        if (err && err.code === 'wrong') fog('The glass does not know you. Try the passphrase again.');
        else fog('The mirror could not reach the vault. Check your connection and try again.');
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
