/* The world map: Leaflet on a flat picture, with layers that switch on and off and a pin mode for placing things. */
(function () {
  var D = window.MB_MAP, W = D.width, H = D.height;
  var root = document.documentElement, esc = function (s) { return MBSite.esc(s || ''); };
  function above() { return root.getAttribute('data-theme') === 'solance'; }
  function ll(x, y) { return [H - y, x]; }
  var map = L.map('worldmap', { crs: L.CRS.Simple, minZoom: -1.4, maxZoom: 1.5, zoomSnap: 0.25, attributionControl: false });
  var bounds = [[0, 0], [H, W]];
  var img = L.imageOverlay(above() ? 'assets/map-solance.svg?v=4' : 'assets/map-umbrasol.svg?v=4', bounds).addTo(map);
  map.fitBounds(bounds);
  map.setMaxBounds([[-200, -200], [H + 200, W + 200]]);

  function pop(o, kind) {
    var below = !above() && !o.deep;
    var name = below ? 'The reflection of ' + o.name.replace(/^The /, 'the ') : o.name;
    return '<p class="pop-kind">' + esc(kind) + '</p><h3>' + esc(name) + '</h3><p>' + esc(o.note) + '</p>' + (o.page ? '<p><a href="' + o.page + '">Read the entry</a></p>' : '');
  }
  function icon(cls, label) {
    return L.divIcon({ className: 'mb-pin ' + cls, html: '<span class="dot"></span>' + (label ? '<span class="lbl">' + esc(label) + '</span>' : ''), iconSize: [14, 14], iconAnchor: [7, 7] });
  }
  var layers = {
    nations: L.layerGroup(D.nations.map(function (n) { return L.marker(ll(n.x, n.y), { icon: icon(n.deep ? 'deep' : 'nation', n.name), keyboard: true, title: n.name }).bindPopup(function () { return pop(n, n.deep ? 'Nation beneath the sea' : 'Nation'); }); })
      .concat(D.kingdoms.map(function (k) { return L.marker(ll(k.x, k.y), { icon: icon('kingdom', k.name), title: k.name }).bindPopup(function () { return pop(k, 'Kingdom'); }); }))
      .concat(D.places.map(function (p) { return L.marker(ll(p.x, p.y), { icon: icon('place', p.name), title: p.name }).bindPopup(function () { return pop(p, 'Place'); }); }))),
    currents: L.layerGroup(D.currents.map(function (c) { return L.polyline(c.map(function (p) { return ll(p[0], p[1]); }), { className: 'mb-current', weight: 2.5, smoothFactor: 1 }); })),
    tunnels: L.layerGroup(D.tunnels.map(function (t) { return L.polyline(t.map(function (p) { return ll(p[0], p[1]); }), { className: 'mb-tunnel', weight: 3 }); })),
    wells: L.layerGroup(D.wells.map(function (w) { return L.marker(ll(w.x, w.y), { icon: icon('well', ''), title: 'Ley line well' }).bindPopup('<p class="pop-kind">Ley line well</p><p>' + esc(w.note) + '</p><p><a href="travel.html#ley-wells">About the wells</a></p>'); }))
  };
  Object.keys(layers).forEach(function (k) { layers[k].addTo(map); });
  document.querySelectorAll('[data-layer]').forEach(function (cb) {
    cb.addEventListener('change', function () { var l = layers[cb.dataset.layer]; if (cb.checked) l.addTo(map); else map.removeLayer(l); });
  });
  document.getElementById('labelsToggle').addEventListener('change', function (e) { document.getElementById('worldmap').classList.toggle('no-labels', !e.target.checked); });

  window.MBWorldMap = { map: map, ll: ll };
  root.addEventListener('mb:crossed', function () { img.setUrl(above() ? 'assets/map-solance.svg?v=4' : 'assets/map-umbrasol.svg?v=4'); map.closePopup(); });

  /* pin mode: click to read a position for map-data.js */
  var pinOn = false, out = document.getElementById('pinOut');
  document.getElementById('pinMode').addEventListener('change', function (e) {
    pinOn = e.target.checked; document.getElementById('worldmap').classList.toggle('pinning', pinOn);
    out.textContent = pinOn ? 'Click the map to read a position.' : '';
  });
  map.on('click', function (e) {
    if (!pinOn) return;
    var x = Math.round(e.latlng.lng), y = Math.round(H - e.latlng.lat), txt = 'x: ' + x + ', y: ' + y;
    out.textContent = txt + ' (copied)';
    try { navigator.clipboard.writeText(txt); } catch (err) { out.textContent = txt; }
    L.popup().setLatLng(e.latlng).setContent('<p class="pop-kind">Position</p><h3>' + txt + '</h3>').openOn(map);
  });
})();
