/* ==========================================================================
   THE TABLE — connections
   The DM's browser hosts the game; players connect straight to it by a short
   code (peer to peer, through the free PeerJS service). A "player screen" on
   the DM's own computer (for a TV) talks through the browser instead.
   ========================================================================== */
(function () {
  var PREFIX = 'mirrorbloom-table-';
  var ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  function code() { var s = ''; for (var i = 0; i < 5; i++) s += ALPHA[Math.floor(Math.random() * ALPHA.length)]; return s; }
  function opts() {
    var q = new URLSearchParams(location.search).get('peer'); /* testing: ?peer=localhost:9000 */
    if (!q) return { debug: 1 };
    var hp = q.split(':'); return { host: hp[0], port: +hp[1] || 9000, path: '/', secure: false, debug: 1 };
  }
  function need() { if (!window.Peer) throw new Error('The connection library did not load. Check your internet connection and reload.'); }

  /* ---------- host (DM) ---------- */
  function host(h, wanted) {
    need();
    var api = { code: wanted || code(), conns: {}, ready: false }, peer, retries = 0;
    function start() {
      peer = new Peer(PREFIX + api.code.toLowerCase(), opts());
      peer.on('open', function () { api.ready = true; retries = 0; h.onReady && h.onReady(api.code); });
      peer.on('connection', function (conn) {
        conn.on('open', function () { api.conns[conn.peer] = conn; h.onJoin && h.onJoin(conn.peer); });
        conn.on('data', function (d) { h.onMessage && h.onMessage(conn.peer, d); });
        conn.on('close', function () { delete api.conns[conn.peer]; h.onLeave && h.onLeave(conn.peer); });
        conn.on('error', function () { delete api.conns[conn.peer]; h.onLeave && h.onLeave(conn.peer); });
      });
      peer.on('disconnected', function () { if (!api.closed) setTimeout(function () { try { peer.reconnect(); } catch (e) {} }, 1500); });
      peer.on('error', function (e) {
        if (e.type === 'unavailable-id' && retries++ < 4) { api.code = code(); try { peer.destroy(); } catch (x) {} start(); return; }
        if (e.type === 'peer-unavailable') return;
        h.onError && h.onError(e);
      });
    }
    start();
    api.send = function (id, msg) { var c = api.conns[id]; if (c && c.open) try { c.send(msg); } catch (e) {} };
    api.each = function (fn) { Object.keys(api.conns).forEach(fn); };
    api.close = function () { api.closed = true; Object.keys(api.conns).forEach(function (k) { try { api.conns[k].close(); } catch (e) {} }); try { peer.destroy(); } catch (e) {} };
    return api;
  }

  /* ---------- player ---------- */
  function join(c, h) {
    need();
    var api = { open: false }, peer, conn, tries = 0, closed = false;
    function connect() {
      if (closed) return;
      conn = peer.connect(PREFIX + c.toLowerCase(), { reliable: true });
      var opened = false;
      conn.on('open', function () { opened = true; tries = 0; api.open = true; h.onOpen && h.onOpen(); });
      conn.on('data', function (d) { h.onMessage && h.onMessage(d); });
      conn.on('close', function () { api.open = false; h.onClose && h.onClose(); retry(); });
      setTimeout(function () { if (!opened && !closed) { try { conn.close(); } catch (e) {} retry(); } }, 9000);
    }
    function retry() { if (closed) return; tries++; if (tries > 40) { h.onError && h.onError({ type: 'gone' }); return; } setTimeout(function () { if (peer.disconnected) try { peer.reconnect(); } catch (e) {} connect(); }, Math.min(8000, 1500 * tries)); }
    peer = new Peer(opts());
    peer.on('open', connect);
    peer.on('error', function (e) { if (e.type === 'peer-unavailable') { h.onError && h.onError({ type: 'nohost' }); retry(); } else h.onError && h.onError(e); });
    peer.on('disconnected', function () { if (!closed) setTimeout(function () { try { peer.reconnect(); } catch (e) {} }, 1500); });
    api.send = function (m) { if (conn && conn.open) try { conn.send(m); } catch (e) {} };
    api.close = function () { closed = true; try { peer.destroy(); } catch (e) {} };
    return api;
  }

  /* ---------- the player screen on the DM's computer ---------- */
  function localHost(h) {
    var bc = new BroadcastChannel('mirrorbloom-table'), api = { conns: {} };
    bc.onmessage = function (e) {
      var d = e.data; if (!d || d.to !== 'host') return;
      if (d.hello) { api.conns[d.from] = 1; h.onJoin && h.onJoin(d.from); }
      else if (d.bye) { delete api.conns[d.from]; h.onLeave && h.onLeave(d.from); }
      else h.onMessage && h.onMessage(d.from, d.msg);
    };
    api.send = function (id, msg) { bc.postMessage({ to: id, msg: msg }); };
    api.each = function (fn) { Object.keys(api.conns).forEach(fn); };
    api.close = function () { bc.close(); };
    return api;
  }
  function localJoin(h) {
    var bc = new BroadcastChannel('mirrorbloom-table'), me = 'screen-' + Math.random().toString(36).slice(2, 8), api = { open: true };
    bc.onmessage = function (e) { var d = e.data; if (d && d.to === me) h.onMessage && h.onMessage(d.msg); else if (d && d.to === 'all-screens') { bc.postMessage({ to: 'host', from: me, hello: 1 }); } };
    api.send = function (m) { bc.postMessage({ to: 'host', from: me, msg: m }); };
    api.close = function () { bc.postMessage({ to: 'host', from: me, bye: 1 }); bc.close(); };
    bc.postMessage({ to: 'host', from: me, hello: 1 });
    addEventListener('beforeunload', api.close);
    setTimeout(function () { h.onOpen && h.onOpen(); }, 0);
    return api;
  }
  function pokeScreens() { try { var bc = new BroadcastChannel('mirrorbloom-table'); bc.postMessage({ to: 'all-screens' }); bc.close(); } catch (e) {} }

  window.MBNet = { host: host, join: join, localHost: localHost, localJoin: localJoin, pokeScreens: pokeScreens, PREFIX: PREFIX };
})();
