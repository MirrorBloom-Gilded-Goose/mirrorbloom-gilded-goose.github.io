/* Shows the depth gauge while you are underwater, and marks the layer you are in. */
(function () {
  var g = document.querySelector('.gauge'); if (!g) return;
  var links = g.querySelectorAll('a'), layers = document.querySelectorAll('.layer'), descent = document.querySelector('.descent');
  function onScroll() {
    var r = descent.getBoundingClientRect();
    g.classList.toggle('show', r.top < innerHeight * 0.5 && r.bottom > innerHeight * 0.5);
    var cur = 0;
    layers.forEach(function (l, i) { if (l.getBoundingClientRect().top < innerHeight * 0.45) cur = i; });
    links.forEach(function (a, i) { a.classList.toggle('on', i === cur); });
  }
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
})();
