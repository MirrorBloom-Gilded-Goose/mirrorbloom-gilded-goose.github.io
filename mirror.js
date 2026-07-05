/* Mirrorbloom mirror-crossing: flips the site between Umbrasol (dark) and Solance (light) */
(function () {
  var t = null;
  try { t = localStorage.getItem('mb-theme'); } catch (e) {}
  if (t === 'solance') document.documentElement.setAttribute('data-theme', 'solance');

  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  ready(function () {
    var b = document.getElementById('mirrorToggle');
    if (!b) return;
    function paint() {
      var s = document.documentElement.getAttribute('data-theme') === 'solance';
      b.innerHTML = s ? '&#9790;' : '&#9788;';
      b.title = s ? 'Cross below \u2014 view in Umbrasol' : 'Cross above \u2014 view in Solance';
    }
    paint();
    b.addEventListener('click', function () {
      var s = document.documentElement.getAttribute('data-theme') === 'solance';
      if (s) {
        document.documentElement.removeAttribute('data-theme');
        try { localStorage.setItem('mb-theme', 'umbrasol'); } catch (e) {}
      } else {
        document.documentElement.setAttribute('data-theme', 'solance');
        try { localStorage.setItem('mb-theme', 'solance'); } catch (e) {}
      }
      paint();
    });
  });
})();
