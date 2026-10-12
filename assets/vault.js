/* ==========================================================================
   MIRRORBLOOM — the vault
   Everything sealed lives in vault.enc, encrypted with AES-GCM. The key is
   derived from the passphrase with PBKDF2, so without the passphrase the
   file is noise — even to someone reading the repository on GitHub.
   Remembering a device stores the derived key (never the passphrase).
   ========================================================================== */
(function () {
  var VAULT_URL = 'vault.enc';
  var ITER = 310000;
  var enc = new TextEncoder(), dec = new TextDecoder();
  var cache = null, cachePromise = null;

  function b64(buf) {
    var s = '', bytes = new Uint8Array(buf);
    for (var i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function unb64(str) {
    var bin = atob(str), out = new Uint8Array(bin.length);
    for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  async function pipe(bytes, Stream, mode) {
    var s = new Blob([bytes]).stream().pipeThrough(new Stream(mode));
    return new Uint8Array(await new Response(s).arrayBuffer());
  }
  var canZip = typeof CompressionStream !== 'undefined' && typeof DecompressionStream !== 'undefined';

  async function deriveKey(pass, salt, iter) {
    var base = await crypto.subtle.importKey('raw', enc.encode(pass.normalize('NFC')), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt: salt, iterations: iter || ITER, hash: 'SHA-256' },
      base, { name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  }
  async function importRaw(raw) {
    return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
  }

  function store() {
    try { return localStorage.getItem('mb-key') ? localStorage : (sessionStorage.getItem('mb-key') ? sessionStorage : null); } catch (e) { return null; }
  }
  function savedKey() {
    var s = store(); if (!s) return null;
    try { return JSON.parse(s.getItem('mb-key')); } catch (e) { return null; }
  }

  async function fetchEnvelope() {
    var r = await fetch(VAULT_URL, { cache: 'no-cache' });
    if (!r.ok) throw new Error('The vault file could not be loaded (' + r.status + ').');
    return r.json();
  }

  async function open(envelope, key) {
    var plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(envelope.iv) }, key, unb64(envelope.data));
    var bytes = new Uint8Array(plain);
    if (envelope.z) bytes = await pipe(bytes, DecompressionStream, 'gzip');
    return JSON.parse(dec.decode(bytes));
  }

  async function seal(obj, key, saltB64, iter) {
    var bytes = enc.encode(JSON.stringify(obj));
    var z = 0;
    if (canZip) { bytes = await pipe(bytes, CompressionStream, 'gzip'); z = 1; }
    var iv = crypto.getRandomValues(new Uint8Array(12));
    var ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv: iv }, key, bytes);
    return JSON.stringify({ v: 1, kdf: 'PBKDF2-SHA256', iter: iter || ITER, salt: saltB64, iv: b64(iv), z: z, data: b64(ct) });
  }

  var MBVault = {
    hasKey: function () { return !!savedKey(); },

    /* Try the passphrase. Resolves with the vault on success, rejects on a wrong passphrase. */
    unlock: async function (pass, remember) {
      var env = await fetchEnvelope();
      var key = await deriveKey(pass, unb64(env.salt), env.iter);
      var vault;
      try { vault = await open(env, key); }
      catch (e) { var err = new Error('wrong'); err.code = 'wrong'; throw err; }
      var raw = b64(await crypto.subtle.exportKey('raw', key));
      var rec = JSON.stringify({ k: raw, s: env.salt });
      try {
        localStorage.removeItem('mb-key'); sessionStorage.removeItem('mb-key');
        (remember ? localStorage : sessionStorage).setItem('mb-key', rec);
      } catch (e) {}
      cache = vault; cachePromise = Promise.resolve(vault);
      document.documentElement.classList.add('has-key', 'unlocked');
      return vault;
    },

    /* Open the vault with the remembered key. Resolves with the vault, or null if there is no usable key. */
    load: function () {
      if (cachePromise) return cachePromise;
      var rec = savedKey();
      if (!rec) return (cachePromise = Promise.resolve(null));
      cachePromise = (async function () {
        try {
          var env = await fetchEnvelope();
          if (env.salt !== rec.s) { MBVault.lock(); return null; } /* passphrase was changed */
          var key = await importRaw(unb64(rec.k));
          cache = await open(env, key);
          document.documentElement.classList.add('unlocked');
          return cache;
        } catch (e) {
          if (e && e.name === 'OperationError') MBVault.lock();
          console.warn('[vault]', e);
          return null;
        }
      })();
      return cachePromise;
    },

    lock: function () {
      try { localStorage.removeItem('mb-key'); sessionStorage.removeItem('mb-key'); } catch (e) {}
      cache = null; cachePromise = null;
      document.documentElement.classList.remove('has-key', 'unlocked');
    },

    /* Re-seal an edited vault with the current key (same passphrase). Returns the file text. */
    resealWithCurrentKey: async function (obj) {
      var rec = savedKey(); if (!rec) throw new Error('Not unlocked.');
      var env = await fetchEnvelope();
      return seal(obj, await importRaw(unb64(rec.k)), rec.s, env.iter);
    },

    /* Seal with a brand-new passphrase. Returns the file text. */
    sealWithPassphrase: async function (obj, pass) {
      var salt = crypto.getRandomValues(new Uint8Array(16));
      var key = await deriveKey(pass, salt, ITER);
      return seal(obj, key, b64(salt), ITER);
    },

    canCompress: canZip
  };

  window.MBVault = MBVault;
})();
