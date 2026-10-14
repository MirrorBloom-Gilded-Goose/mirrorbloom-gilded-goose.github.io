/* Runs before the page paints: picks the remembered world and marks whether the Sanctum key is present. */
(function () {
  var d = document.documentElement;
  try {
    if (localStorage.getItem('mb-theme') === 'solance') d.setAttribute('data-theme', 'solance');
    if (localStorage.getItem('mb-key') || sessionStorage.getItem('mb-key')) d.classList.add('has-key');
    /* hide the page for a moment while the spoiler shield blurs what this reader hasn't reached */
    if (localStorage.getItem('mb-read-to') != null) { d.classList.add('shield-on'); setTimeout(function () { d.classList.remove('shield-on'); }, 1500); }
  } catch (e) {}
  d.classList.add('js');
})();
