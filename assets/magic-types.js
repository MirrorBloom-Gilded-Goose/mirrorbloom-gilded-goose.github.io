/* Plays each magic animation only while it is on screen. */
(function () {
  var vs = document.querySelectorAll('.vignette');
  if (!('IntersectionObserver' in window)) { vs.forEach(function (v) { v.classList.add('playing'); }); return; }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      e.target.classList.toggle('playing', e.isIntersecting);
      var svg = e.target.querySelector('svg');
      if (svg && svg.pauseAnimations) { if (e.isIntersecting) svg.unpauseAnimations(); else svg.pauseAnimations(); }
    });
  }, { rootMargin: '80px' });
  vs.forEach(function (v) { io.observe(v); });
})();
