/* Sends links to the old site's pages to where that content lives now. */
(function () {
  var page = location.pathname.split('/').pop();
  var MOVED = {
    'jester_king.html': 'revel_king.html',
    'dm-tools.html': 'sanctum.html',
    'oneshot-two-doors.html': 'sealed.html#oneshot-two-doors',
    'statblock-jester_king.html': 'sealed.html#statblock-revel_king'
  };
  var to = MOVED[page];
  if (!to) {
    var m = page.match(/^statblock-([a-z_]+)\.html$/); if (m) to = 'sealed.html#statblock-' + m[1];
    m = page.match(/^minion-([a-z_]+)\.html$/); if (m) to = 'sealed.html#minion-' + m[1];
  }
  if (to) {
    var base = location.pathname.slice(0, location.pathname.lastIndexOf('/') + 1);
    location.replace(base + to);
  }
})();
