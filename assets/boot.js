/* Runs before the page paints: picks the remembered world and marks whether the Sanctum key is present. */
(function () {
  var d = document.documentElement;
  try {
    if (localStorage.getItem('mb-theme') === 'solance') d.setAttribute('data-theme', 'solance');
    if (localStorage.getItem('mb-key') || sessionStorage.getItem('mb-key')) d.classList.add('has-key');
  } catch (e) {}
  d.classList.add('js');
})();
