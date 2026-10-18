/* ==========================================================================
   WRITER'S DESK: MUSIC
   Every mood is a little composer that runs in the browser. It picks chords
   and melodies as it goes, so it never loops the same way twice, needs no
   internet and costs nothing. Your own YouTube or Spotify links sit beside.

   EDIT HERE: each mood in MOODS has a name, a line about it, a tempo and
   a level (its loudness next to the others).
   ========================================================================== */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  function load(k, d) { try { var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function chance(p) { return Math.random() < p; }
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  var ST = Object.assign({ mood: 'quiet', vol: 0.6, brk: true, real: true, links: [] }, load('desk-music', {}));
  function saveST() { save('desk-music', ST); }

  /* ======================= the sound engine ======================= */
  var ac = null, master, duck, verbIn, NOISE, BROWN;
  function noiseBuf(kind, secs) {
    var len = Math.floor(ac.sampleRate * secs), b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0), last = 0;
    for (var i = 0; i < len; i++) {
      var w = Math.random() * 2 - 1;
      if (kind === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w;
    }
    return b;
  }
  function impulse(secs, decay) {
    var len = Math.floor(ac.sampleRate * secs), b = ac.createBuffer(2, len, ac.sampleRate);
    for (var c = 0; c < 2; c++) { var d = b.getChannelData(c); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay); }
    return b;
  }
  function build(ctx) {
    ac = ctx;
    var comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 8; comp.ratio.value = 3; comp.attack.value = 0.008; comp.release.value = 0.3;
    master = ac.createGain(); master.gain.value = 0;
    duck = ac.createGain(); duck.gain.value = 1;
    var lim = ac.createDynamicsCompressor();
    lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.002; lim.release.value = 0.12;
    master.connect(duck); duck.connect(comp); comp.connect(lim); lim.connect(ac.destination);
    var verb = ac.createConvolver(); verb.buffer = impulse(3.4, 2.8);
    verbIn = ac.createGain(); verbIn.gain.value = 0.9; verbIn.connect(verb); verb.connect(master);
    NOISE = noiseBuf('white', 2); BROWN = noiseBuf('brown', 4);
  }

  /* every voice goes to its mood's bus, and some of it to the reverb */
  function out(V, node, wet) {
    node.connect(V.dry);
    if (wet) { var w = ac.createGain(); w.gain.value = wet; node.connect(w); w.connect(V.wet); }
  }
  function osc(type, f, t, end, det) { var o = ac.createOscillator(); o.type = type; o.frequency.value = f; if (det) o.detune.value = det; o.start(t); o.stop(end); return o; }
  function noise(t, dur, buf) { var s = ac.createBufferSource(); s.buffer = buf || NOISE; s.start(t, rnd(0, 1.2), dur); return s; }

  var VOICE = {
    /* soft felt piano */
    piano: function (V, m, t, v) {
      var f = mtof(m), g = ac.createGain(), lp = ac.createBiquadFilter(), end = t + 3.4;
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(7000, f * 7), t); lp.frequency.exponentialRampToValueAtTime(Math.max(400, f * 1.6), t + 1.6);
      [[1, 'triangle', 1], [2, 'sine', 0.22], [3, 'sine', 0.07]].forEach(function (h) { var o = osc(h[1], f * h[0], t, end, rnd(-3, 3)), og = ac.createGain(); og.gain.value = h[2]; o.connect(og); og.connect(lp); });
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.006); g.gain.exponentialRampToValueAtTime(v * 0.3, t + 0.4); g.gain.exponentialRampToValueAtTime(0.0005, t + 3.2);
      lp.connect(g); out(V, g, 0.5);
    },
    /* warm pad, for chords */
    pad: function (V, ms, t, dur, v, bright) {
      var lp = ac.createBiquadFilter(), g = ac.createGain(), end = t + dur + 3, a = Math.min(1.6, dur * 0.4);
      lp.type = 'lowpass'; lp.frequency.value = bright || 900; lp.Q.value = 0.4;
      ms.forEach(function (m) { [-7, 7].forEach(function (d) { osc('sawtooth', mtof(m), t, end, d + rnd(-2, 2)).connect(lp); }); });
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v / ms.length, t + a); g.gain.setValueAtTime(v / ms.length, t + dur); g.gain.setTargetAtTime(0, t + dur, 0.6);
      lp.connect(g); out(V, g, 0.6);
    },
    /* short bowed notes, for ostinatos */
    stac: function (V, m, t, len, v) {
      var lp = ac.createBiquadFilter(), g = ac.createGain(), end = t + len + 0.4;
      lp.type = 'lowpass'; lp.frequency.value = 2400; lp.Q.value = 0.8;
      osc('sawtooth', mtof(m), t, end, -6).connect(lp); osc('sawtooth', mtof(m), t, end, 6).connect(lp);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.008); g.gain.setTargetAtTime(0, t + len * 0.55, 0.035);
      lp.connect(g); out(V, g, 0.25);
    },
    /* brass: chords and heroic lines */
    brass: function (V, ms, t, dur, v, top) {
      var lp = ac.createBiquadFilter(), g = ac.createGain(), end = t + dur + 0.8;
      lp.type = 'lowpass'; lp.Q.value = 1.2;
      lp.frequency.setValueAtTime(320, t); lp.frequency.linearRampToValueAtTime(top || 2600, t + 0.07); lp.frequency.setTargetAtTime((top || 2600) * 0.55, t + 0.08, 0.2);
      ms.forEach(function (m) { osc('sawtooth', mtof(m), t, end, rnd(-5, 5)).connect(lp); osc('sawtooth', mtof(m), t, end, rnd(-12, 12)).connect(lp); });
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v / ms.length, t + 0.045); g.gain.setTargetAtTime(v / ms.length * 0.75, t + 0.06, 0.15); g.gain.setTargetAtTime(0, t + dur, 0.09);
      lp.connect(g); out(V, g, 0.35);
    },
    bass: function (V, m, t, dur, v, grit) {
      var lp = ac.createBiquadFilter(), g = ac.createGain(), end = t + dur + 0.6;
      lp.type = 'lowpass'; lp.frequency.value = grit ? 520 : 300;
      osc('triangle', mtof(m), t, end).connect(lp); if (grit) { var s = osc('sawtooth', mtof(m), t, end), sg = ac.createGain(); sg.gain.value = 0.5; s.connect(sg); sg.connect(lp); }
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.012); g.gain.setTargetAtTime(0, t + dur, 0.07);
      lp.connect(g); out(V, g, 0.05);
    },
    /* plucked strings: harp and lute */
    pluck: function (V, m, t, v, dec) {
      var f = mtof(m), lp = ac.createBiquadFilter(), g = ac.createGain(), d = dec || 1.2, end = t + d + 0.2;
      lp.type = 'lowpass'; lp.frequency.setValueAtTime(Math.min(9000, f * 9), t); lp.frequency.exponentialRampToValueAtTime(Math.max(300, f * 1.3), t + d * 0.4);
      osc('sawtooth', f, t, end, rnd(-4, 4)).connect(lp); osc('triangle', f, t, end).connect(lp);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0005, t + d);
      lp.connect(g); out(V, g, 0.35);
    },
    /* fiddle, with a little vibrato */
    fiddle: function (V, m, t, dur, v) {
      var f = mtof(m), lp = ac.createBiquadFilter(), g = ac.createGain(), end = t + dur + 0.3;
      lp.type = 'lowpass'; lp.frequency.value = 3200; lp.Q.value = 1.5;
      var o = osc('sawtooth', f, t, end), lfo = osc('sine', 5.6, t, end), lg = ac.createGain();
      lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(12, t + Math.min(0.25, dur)); lfo.connect(lg); lg.connect(o.detune);
      o.connect(lp);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.025); g.gain.setTargetAtTime(0, t + dur * 0.85, 0.05);
      lp.connect(g); out(V, g, 0.3);
    },
    /* a cold bell, for the dark */
    bell: function (V, m, t, v, dec) {
      var f = mtof(m), d = dec || 4, end = t + d + 0.2, c = osc('sine', f, t, end), mod = osc('sine', f * 2.76, t, end), mg = ac.createGain(), g = ac.createGain();
      mg.gain.setValueAtTime(f * 2.2, t); mg.gain.exponentialRampToValueAtTime(f * 0.05, t + d * 0.6); mod.connect(mg); mg.connect(c.frequency);
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0004, t + d);
      c.connect(g); out(V, g, 0.75);
    },
    /* drums */
    kick: function (V, t, v, f0, f1, dec, wet) {
      var o = osc('sine', f0, t, t + dec + 0.1), g = ac.createGain();
      o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dec * 0.45);
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0005, t + dec); o.connect(g); out(V, g, wet || 0.15);
      var n = noise(t, 0.05), lp = ac.createBiquadFilter(), ng = ac.createGain(); lp.type = 'lowpass'; lp.frequency.value = 1400;
      ng.gain.setValueAtTime(v * 0.35, t); ng.gain.exponentialRampToValueAtTime(0.0005, t + 0.045); n.connect(lp); lp.connect(ng); out(V, ng, 0.1);
    },
    taiko: function (V, t, v) {
      VOICE.kick(V, t, v, 150, 46, 0.75, 0.3);
      var n = noise(t, 0.3), lp = ac.createBiquadFilter(), g = ac.createGain(); lp.type = 'lowpass'; lp.frequency.value = 500;
      g.gain.setValueAtTime(v * 0.6, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.25); n.connect(lp); lp.connect(g); out(V, g, 0.3);
    },
    snare: function (V, t, v) {
      var n = noise(t, 0.25), hp = ac.createBiquadFilter(), g = ac.createGain(); hp.type = 'highpass'; hp.frequency.value = 1500;
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.2); n.connect(hp); hp.connect(g); out(V, g, 0.25);
      var o = osc('triangle', 200, t, t + 0.15), og = ac.createGain(); o.frequency.exponentialRampToValueAtTime(150, t + 0.1);
      og.gain.setValueAtTime(v * 0.6, t); og.gain.exponentialRampToValueAtTime(0.0005, t + 0.12); o.connect(og); out(V, og, 0.1);
    },
    hat: function (V, t, v, len) {
      var n = noise(t, 0.1), hp = ac.createBiquadFilter(), g = ac.createGain(); hp.type = 'highpass'; hp.frequency.value = 7500;
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0005, t + (len || 0.045)); n.connect(hp); hp.connect(g); out(V, g, 0.1);
    },
    crash: function (V, t, v) {
      var n = noise(t, 2), hp = ac.createBiquadFilter(), g = ac.createGain(); hp.type = 'highpass'; hp.frequency.value = 4500;
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 1.8); n.connect(hp); hp.connect(g); out(V, g, 0.4);
    },
    frame: function (V, t, v) {
      VOICE.kick(V, t, v, 115, 68, 0.32, 0.2);
      var n = noise(t, 0.08), bp = ac.createBiquadFilter(), g = ac.createGain(); bp.type = 'bandpass'; bp.frequency.value = 1100; bp.Q.value = 1.2;
      g.gain.setValueAtTime(v * 0.25, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.07); n.connect(bp); bp.connect(g); out(V, g, 0.2);
    },
    tap: function (V, t, v) {
      var n = noise(t, 0.05), bp = ac.createBiquadFilter(), g = ac.createGain(); bp.type = 'bandpass'; bp.frequency.value = 1800; bp.Q.value = 1.5;
      g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.04); n.connect(bp); bp.connect(g); out(V, g, 0.15);
    }
  };

  /* ======================= real instruments =======================
     Recorded notes from the FluidR3 GM soundfont by Frank Wen (CC BY 3.0), every
     third note, in assets/music/<instrument>/<midi note>.mp3. A note between two
     recordings is the nearest one, played a little faster or slower.
     [lowest, highest, step, seconds kept, loudness trim, holds a long note] */
  var INST = {
    piano: [38, 89, 3, 3.1, 2.07, 0], strings: [33, 84, 3, 3.1, 1.78, 1], harp: [40, 88, 3, 2.6, 1.22, 0], horn: [45, 78, 3, 3.1, 0.81, 1],
    flute: [60, 93, 3, 3.1, 0.83, 1], timpani: [36, 57, 3, 2.4, 1.51, 0], taiko: [36, 54, 6, 1.3, 1.01, 0], brass: [38, 77, 3, 3.1, 1.11, 1],
    trumpet: [57, 84, 3, 3.1, 1.07, 1], trombone: [36, 66, 3, 3.1, 0.64, 1], bass: [28, 55, 3, 3.1, 1.05, 1], cello: [36, 69, 3, 3.1, 1.29, 1],
    fiddle: [55, 93, 3, 3.1, 1.1, 1], lute: [40, 79, 3, 2.4, 0.97, 0], recorder: [60, 93, 3, 3.1, 0.76, 1], musicbox: [60, 96, 3, 3.1, 0.95, 0],
    bells: [55, 84, 3, 3.1, 0.97, 0], choir: [41, 80, 3, 3.1, 1.35, 1], organ: [29, 77, 3, 3.1, 0.86, 1], glock: [72, 99, 3, 2.4, 1.24, 0],
    pizz: [36, 75, 3, 1.6, 0.88, 0]
  };
  var RAW = {};
  function fetchNote(name, m) {
    var u = 'assets/music/' + name + '/' + m + '.mp3';
    return RAW[u] || (RAW[u] = fetch(u).then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).catch(function (e) { delete RAW[u]; throw e; }));
  }
  function eachNote(name, f) { var I = INST[name]; for (var m = I[0]; m <= I[1]; m += I[2]) f(m); }
  function prefetch(names) { names.forEach(function (n) { eachNote(n, function (m) { fetchNote(n, m).catch(function () {}); }); }); }
  function loadInst(name) {
    var bank = ac.__bank || (ac.__bank = {}); if (bank[name]) return bank[name].ready;
    var ctx = ac, B = bank[name] = { buf: {}, notes: [] }, jobs = [];
    eachNote(name, function (m) {
      jobs.push(fetchNote(name, m).then(function (ab) {
        return new Promise(function (ok, no) { ctx.decodeAudioData(ab.slice(0), ok, no); });
      }).then(function (b) { B.buf[m] = b; B.notes.push(m); }, function () {}));
    });
    B.ready = Promise.all(jobs).then(function () { B.notes.sort(function (a, b) { return a - b; }); B.ok = B.notes.length > 0; B.done = true; if (!B.ok) delete bank[name]; });
    return B.ready;
  }
  function has(name) { var b = ST.real && ac.__bank && ac.__bank[name]; return !!(b && b.ok); }
  /* o: v volume, dur how long it is held (leave out to let it ring), a attack, r release, wet reverb */
  function samp(V, name, m, t, o) {
    if (!has(name)) return false;
    var B = ac.__bank[name], I = INST[name], near = B.notes[0];
    for (var k = 1; k < B.notes.length; k++) if (Math.abs(B.notes[k] - m) < Math.abs(near - m)) near = B.notes[k];
    var buf = B.buf[near], rate = Math.pow(2, (m - near) / 12), v = (o.v == null ? 0.5 : o.v) * I[4];
    var a = o.a || 0.004, r = o.r || 0.25, dur = o.dur, g = ac.createGain();
    var natural = (buf.duration - 0.1) / rate, endT = dur ? t + dur + r : t + natural;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + a);
    if (dur) { var hold = t + Math.max(a, dur); g.gain.setValueAtTime(v, hold); g.gain.setTargetAtTime(0, hold, r / 3); }
    if (I[5] && dur && endT > t + natural) {
      /* a long held note: overlap fresh copies of the sustained middle of the recording */
      var cursor = t, off = 0, X = 0.3;
      while (cursor < endT) {
        var seg = (buf.duration - 0.1 - off) / rate, s = ac.createBufferSource(), sg = ac.createGain(), segEnd = cursor + seg;
        s.buffer = buf; s.playbackRate.value = rate; s.connect(sg); sg.connect(g);
        if (off) { sg.gain.setValueAtTime(0, cursor); sg.gain.linearRampToValueAtTime(1, cursor + X); }
        if (segEnd < endT) { sg.gain.setValueAtTime(1, segEnd - X); sg.gain.linearRampToValueAtTime(0, segEnd); }
        s.start(cursor, off); s.stop(Math.min(segEnd, endT + 0.05));
        cursor = segEnd - X; off = 0.9;
      }
    } else {
      var src = ac.createBufferSource(); src.buffer = buf; src.playbackRate.value = rate; src.connect(g);
      src.start(t); src.stop(Math.min(endT + 0.05, t + natural + 0.05));
    }
    out(V, g, o.wet == null ? 0.35 : o.wet);
    return true;
  }
  /* a recorded note if the instrument is ready, otherwise the synth stand-in */
  function N(V, name, m, t, o, fb) { if (!samp(V, name, m, t, o) && fb) fb(); }
  function NC(V, name, ms, t, o, fb) {
    if (!has(name)) { if (fb) fb(); return; }
    ms.forEach(function (m, k) { samp(V, name, m, t + (o.strum || 0) * k, o); });
  }

  /* scales and chords */
  var MAJOR = [0, 2, 4, 5, 7, 9, 11], MINOR = [0, 2, 3, 5, 7, 8, 10], MIXO = [0, 2, 4, 5, 7, 9, 10], PHRYG = [0, 1, 3, 5, 7, 8, 10];
  function deg(root, sc, d) { var n = sc.length, o = Math.floor(d / n); return root + 12 * o + sc[((d % n) + n) % n]; }
  function chord(root, sc, d, size) { var out = []; for (var i = 0; i < (size || 3); i++) out.push(deg(root, sc, d + i * 2)); return out; }
  function isChordTone(p, c) { var k = (((p - c) % 7) + 7) % 7; return k === 0 || k === 2 || k === 4; }
  function snap(p, c) { if (isChordTone(p, c)) return p; return isChordTone(p - 1, c) ? p - 1 : p + 1; }
  function walk(p, lo, hi, leap) {
    var step = pick(leap ? [-3, -2, -1, -1, 1, 1, 2, 3] : [-2, -1, -1, 0, 1, 1, 2]); p += step;
    if (p < lo) p = lo + (lo - p); if (p > hi) p = hi - (p - hi); return p;
  }

  /* ======================= the moods ======================= */
  var MOODS = {
    quiet: { name: 'Quiet desk', note: 'Slow piano over soft strings. For most writing.', level: 1.9, synth: 1.25, beat: 60 / 64 / 2, uses: ['piano', 'strings', 'bass'], make: function () {
      var R = 50, sc = MAJOR, P = [[0, 5, 3, 4], [0, 4, 5, 3], [5, 3, 0, 4], [3, 4, 2, 5], [0, 2, 3, 4]], prog = P[0], p = 7, c = 0;
      return { step: function (V, i, t, dt) {
        var s = i % 8, bar = Math.floor(i / 8), ph = bar % 8;
        if (s === 0) {
          if (bar % 4 === 0) prog = pick(P);
          c = prog[bar % 4];
          var ch = chord(R, sc, c, 4), lo = deg(R - 12, sc, c);
          NC(V, 'strings', ch, t, { v: 0.26, dur: dt * 8 + 0.3, a: 0.9, r: 1.4, wet: 0.6 }, function () { VOICE.pad(V, ch, t, dt * 8 + 0.4, 0.07, 1000); });
          N(V, 'bass', lo, t, { v: 0.3, dur: dt * 7.5, a: 0.4, r: 1, wet: 0.3 }, function () { VOICE.bass(V, lo, t, dt * 7, 0.07); });
          N(V, 'piano', lo, t + 0.01, { v: 0.32, wet: 0.5 });
        }
        var prob = s === 0 ? 0.75 : s % 2 === 0 ? 0.4 : 0.14;
        if (ph >= 6) prob *= 0.55; if (ph === 7 && s > 2) prob = 0;
        if (chance(prob)) {
          p = walk(p, 2, 13); if (s % 4 === 0) p = snap(p, c);
          var m = deg(R + 12, sc, p), tt = t + rnd(0, 0.012), vv = rnd(0.45, 0.7);
          N(V, 'piano', m, tt, { v: vv, wet: 0.5 }, function () { VOICE.piano(V, m, tt, vv * 0.16); });
        }
        if (s === 4 && chance(0.35)) { var l = deg(R, sc, c + 4); N(V, 'piano', l, t + 0.01, { v: 0.28, wet: 0.5 }, function () { VOICE.piano(V, l, t + 0.01, 0.045); }); }
      } };
    } },

    road: { name: 'On the road', note: 'Walking pace: harp, horns and flute. Travel and discovery.', level: 1.45, synth: 1.05, beat: 60 / 96 / 2, uses: ['harp', 'strings', 'horn', 'flute', 'pizz', 'timpani'], make: function () {
      var R = 55, sc = MAJOR, P = [[0, 4, 5, 3], [0, 3, 4, 0], [5, 3, 0, 4], [0, 4, 3, 4], [3, 0, 4, 5]], prog = P[0], p = 0, c = 0, arp = [0, 2, 4, 7, 4, 2, 4, 2];
      return { step: function (V, i, t, dt) {
        var s = i % 8, bar = Math.floor(i / 8), ph = bar % 8, lo;
        if (s === 0) {
          if (bar % 4 === 0) prog = pick(P);
          c = prog[bar % 4];
          var ch = chord(R - 12, sc, c);
          NC(V, 'strings', ch, t, { v: 0.2, dur: dt * 8, a: 0.5, r: 0.8, wet: 0.5 }, function () { VOICE.pad(V, ch, t, dt * 8 + 0.2, 0.045, 1300); });
          N(V, 'timpani', deg(R - 12, sc, c), t, { v: 0.45, wet: 0.3 }, function () { VOICE.kick(V, t, 0.32, 120, 50, 0.4); });
        }
        lo = deg(R - 12, sc, c);
        if (s === 0 || s === 4) N(V, 'pizz', lo, t, { v: 0.7, wet: 0.2 }, function () { VOICE.bass(V, lo, t, dt * 3.6, 0.09); });
        if (s === 4) VOICE.frame(V, t, 0.12);
        if (s % 2 === 1) VOICE.hat(V, t, 0.015, 0.03);
        var h = deg(R, sc, c + arp[s]), hv = s % 4 === 0 ? 0.6 : 0.42;
        N(V, 'harp', h, t, { v: hv, wet: 0.4 }, function () { VOICE.pluck(V, h, t, hv * 0.08, 0.9); });
        if (ph < 4 || (ph >= 4 && bar % 16 >= 8)) {
          if ((s === 0 || s === 3 || s === 4 || s === 6) && chance(s === 0 ? 0.9 : 0.45)) {
            p = walk(p, -3, 6); if (s === 0 || s === 4) p = snap(p, c);
            var m = deg(R + 12, sc, p), d = dt * (s === 3 || s === 6 ? 1.6 : 2.6);
            N(V, 'horn', m, t, { v: 0.5, dur: d, a: 0.05, r: 0.3, wet: 0.4 }, function () { VOICE.brass(V, [m], t, d, 0.075, 1700); });
            if (bar % 16 >= 8) N(V, 'flute', m + 12, t, { v: 0.3, dur: d, a: 0.06, r: 0.3, wet: 0.4 });
          }
        }
      } };
    } },

    festival: { name: 'Festival', note: 'Bright and warm: flutes, bells, a trumpet fanfare. Celebrations and the Illuminance.', level: 1.45, synth: 1, beat: 60 / 116 / 2, uses: ['lute', 'pizz', 'flute', 'glock', 'trumpet', 'bells', 'strings'], make: function () {
      var R = 55, sc = MAJOR, P = [[0, 3, 4, 0], [0, 5, 3, 4], [3, 4, 0, 0], [0, 4, 5, 3], [0, 3, 0, 4]], prog = P[0], c = 0, p = 4, tune = true, FAN = [0, 2, 4, 7];
      return { step: function (V, i, t, dt) {
        var s = i % 8, bar = Math.floor(i / 8), ph = bar % 8, fanfare = ph === 0 && s < 4;
        if (s === 0) {
          if (bar % 4 === 0) prog = pick(P);
          if (ph === 0) tune = chance(0.85);
          c = prog[bar % 4];
          var ch = chord(R, sc, c);
          NC(V, 'strings', ch, t, { v: 0.13, dur: dt * 8, a: 0.3, r: 0.5, wet: 0.5 }, function () { VOICE.pad(V, ch, t, dt * 8, 0.03, 1600); });
          if (ph === 0) N(V, 'bells', deg(R + 12, sc, 0), t, { v: 0.45, wet: 0.6 }, function () { VOICE.bell(V, deg(R + 12, sc, 0), t, 0.05, 3); });
        }
        var lo = deg(R - 12, sc, c), up = deg(R, sc, c + (s === 2 ? 2 : 4));
        if (s === 0 || s === 4) N(V, 'pizz', s === 0 ? lo : lo + 7, t, { v: 0.75, wet: 0.2 }, function () { VOICE.bass(V, lo, t, dt * 1.5, 0.09); });
        if (s === 2 || s === 6) N(V, 'pizz', up, t, { v: 0.42, wet: 0.2 }, function () { VOICE.pluck(V, up, t, 0.03, 0.4); });
        if (s === 0 || s === 3 || s === 4 || s === 6) {
          var sv = s === 0 ? 0.45 : s === 4 ? 0.38 : 0.28, ch2 = chord(R, sc, c);
          NC(V, 'lute', ch2, t, { v: sv, wet: 0.3, strum: 0.012 }, function () { ch2.forEach(function (m, k) { VOICE.pluck(V, m, t + k * 0.012, sv * 0.09, 0.6); }); });
        }
        if (s === 0) VOICE.frame(V, t, 0.22); else if (s === 4) VOICE.frame(V, t, 0.16);
        if (s === 2 || s === 6) VOICE.hat(V, t, 0.03, 0.09); else VOICE.hat(V, t, 0.012, 0.03);
        if (fanfare) {
          var fm = deg(R + 12, sc, c + FAN[s]), fd = s === 3 ? dt * 3 : dt * 0.9;
          N(V, 'trumpet', fm, t, { v: 0.45, dur: fd, a: 0.02, r: 0.15, wet: 0.4 }, function () { VOICE.brass(V, [fm], t, fd, 0.08, 2600); });
        } else if (tune && chance(s % 2 === 0 ? 0.85 : 0.55)) {
          p = walk(p, 0, 9); if (s === 0 || s === 4) p = snap(p, c);
          var m = deg(R + 12, sc, p), d = dt * (chance(0.25) ? 2 : 1) * 0.95;
          N(V, 'flute', m, t, { v: 0.42, dur: d, a: 0.02, r: 0.1, wet: 0.3 }, function () { VOICE.fiddle(V, m, t, d, 0.045); });
          if ((s === 0 || s === 4) && chance(0.5)) N(V, 'glock', m + 12, t, { v: 0.3, wet: 0.4 });
        }
      } };
    } },

    tavern: { name: 'Tavern', note: 'A lively jig on fiddle, recorder and lute. Banter and downtime.', level: 1.08, synth: 1.15, beat: 0.2, uses: ['lute', 'fiddle', 'recorder', 'cello'], make: function () {
      var R = 50, sc = MIXO, P = [[0, 6, 0, 4], [0, 3, 0, 4], [0, 6, 3, 4], [3, 0, 6, 0]], prog = P[0], c = 0, p = 7, tune = true;
      return { step: function (V, i, t, dt) {
        var s = i % 6, bar = Math.floor(i / 6), ph = bar % 12;
        if (s === 0) {
          if (bar % 4 === 0) prog = pick(P);
          if (bar % 12 === 0) tune = true; else if (bar % 12 === 8) tune = chance(0.6);
          c = prog[bar % 4];
          if (bar % 2 === 0) {
            N(V, 'cello', R, t, { v: 0.24, dur: dt * 11.5, a: 0.3, r: 0.6, wet: 0.3 }, function () { VOICE.bass(V, R - 12, t, dt * 11, 0.05); });
            N(V, 'cello', R + 7, t, { v: 0.16, dur: dt * 11.5, a: 0.3, r: 0.6, wet: 0.3 });
          }
        }
        if (s === 0 || s === 3) {
          var ch = chord(R, sc, c);
          NC(V, 'lute', ch, t, { v: s === 0 ? 0.5 : 0.4, wet: 0.3, strum: 0.016 }, function () { ch.forEach(function (m, k) { VOICE.pluck(V, m - (k ? 0 : 12), t + k * 0.014, 0.045, 0.7); }); });
        } else if (chance(0.7)) { var l = deg(R, sc, c + pick([0, 2, 4])); N(V, 'lute', l, t, { v: 0.3, wet: 0.3 }, function () { VOICE.pluck(V, l, t, 0.028, 0.45); }); }
        if (s === 0) VOICE.frame(V, t, 0.26); else if (s === 3) VOICE.frame(V, t, 0.18); else VOICE.tap(V, t, s === 2 || s === 5 ? 0.05 : 0.025);
        if (tune && chance(s === 0 || s === 3 ? 0.95 : 0.78)) {
          p = walk(p, 3, 12); if (s === 0 || s === 3) p = snap(p, c);
          var m = deg(R + 12, sc, p), d = dt * (chance(0.2) ? 2 : 1) * 0.95;
          N(V, ph < 8 ? 'fiddle' : 'recorder', m, t, { v: 0.45, dur: d, a: 0.015, r: 0.08, wet: 0.3 }, function () { VOICE.fiddle(V, m, t, d, 0.05); });
        }
      } };
    } },

    battle: { name: 'Battle', note: 'Fast drums, driving strings, brass. For fights and chases.', level: 1.35, synth: 0.62, beat: 60 / 150 / 4, uses: ['strings', 'cello', 'bass', 'taiko', 'timpani', 'brass', 'horn', 'trumpet'], make: function () {
      var R = 50, sc = MINOR, P = [[0, 5, 6, 0], [0, 5, 3, 4], [0, 3, 5, 6], [5, 6, 0, 0], [0, 6, 5, 4]], prog = P[0], c = 0, p = 4, hero = false;
      var OST = [0, 0, 12, 0, 7, 0, 12, 0, 0, 0, 12, 0, 7, 12, 10, 7];
      var ACC = { 0: 1, 3: 1, 6: 1, 10: 1, 12: 1 };
      function ch(d) { return d % 7 === 4 ? [R + 7, R + 11, R + 14] : chord(R, sc, d); }
      return { step: function (V, i, t, dt) {
        var s = i % 16, bar = Math.floor(i / 16), ph = bar % 8, root;
        if (s === 0) {
          if (bar % 4 === 0) { prog = pick(P); hero = chance(0.55); }
          c = prog[bar % 4];
          var low = ch(c).map(function (m) { return m - 12; });
          NC(V, 'strings', low, t, { v: 0.16, dur: dt * 16, a: 0.2, r: 0.4, wet: 0.4 }, function () { VOICE.pad(V, low, t, dt * 16, 0.04, 1500); });
          N(V, 'timpani', ch(c)[0] - 12, t, { v: 0.8, wet: 0.3 });
          if (ph === 0) VOICE.crash(V, t, 0.09);
        }
        root = ch(c)[0] - 12;
        var o = root + 12 + OST[s], ov = ACC[s] ? 0.5 : 0.32;
        N(V, 'strings', o, t, { v: ov, dur: dt * 0.85, a: 0.004, r: 0.06, wet: 0.2 }, function () { VOICE.stac(V, o, t, dt * 0.9, ACC[s] ? 0.06 : 0.038); });
        if (ACC[s]) N(V, 'cello', root + OST[s], t, { v: 0.4, dur: dt * 0.9, a: 0.004, r: 0.06, wet: 0.15 });
        if (s % 2 === 0) N(V, 'bass', root, t, { v: 0.5, dur: dt * 1.5, a: 0.004, r: 0.06, wet: 0.05 }, function () { VOICE.bass(V, root, t, dt * 1.6, 0.11, true); });
        if (s === 0 || s === 8) N(V, 'taiko', 36, t, { v: 1, wet: 0.3 }, function () { VOICE.taiko(V, t, 0.5); });
        else if (s === 3 || s === 6 || s === 11 || s === 14) N(V, 'taiko', 48, t, { v: 0.55, wet: 0.25 }, function () { VOICE.taiko(V, t, 0.22); });
        if (s === 4 || s === 12) VOICE.snare(V, t, 0.2);
        if (s % 2 === 0) VOICE.hat(V, t, s % 4 === 0 ? 0.028 : 0.016);
        if (ph === 7 && s >= 12) N(V, 'timpani', root + (s - 12) * 2, t, { v: 0.5 + (s - 12) * 0.12, wet: 0.3 }, function () { VOICE.kick(V, t, 0.35, 220 - (s - 12) * 25, 90, 0.3, 0.3); });
        if (s === 0) NC(V, 'brass', ch(c), t, { v: 0.5, dur: dt * 3, a: 0.01, r: 0.12, wet: 0.3 }, function () { VOICE.brass(V, ch(c), t, dt * 3, 0.1); });
        if (s === 10 && chance(0.6)) NC(V, 'brass', ch(c), t, { v: 0.38, dur: dt * 2, a: 0.01, r: 0.1, wet: 0.3 }, function () { VOICE.brass(V, ch(c), t, dt * 2, 0.07); });
        if (hero && (s === 0 || s === 6 || s === 12) && bar % 8 >= 4) {
          p = walk(p, 0, 9, true); if (s === 0) p = snap(p, c);
          var hi = deg(R + 12, sc, p), d = dt * (s === 12 ? 3.5 : 5.5);
          N(V, 'trumpet', hi, t + 0.005, { v: 0.45, dur: d, a: 0.03, r: 0.2, wet: 0.35 }, function () { VOICE.brass(V, [hi, hi - 12], t + 0.005, d, 0.09, 2800); });
          N(V, 'horn', hi - 12, t + 0.005, { v: 0.45, dur: d, a: 0.04, r: 0.2, wet: 0.35 });
        }
      } };
    } },

    boss: { name: 'Boss fight', note: 'Bigger and darker than Battle: choir, organ, pounding drums.', level: 1.36, synth: 0.6, beat: 60 / 132 / 4, uses: ['choir', 'organ', 'trombone', 'strings', 'taiko', 'timpani', 'horn', 'trumpet', 'bass'], make: function () {
      var R = 50, CH = { i: [0, 3, 7], VI: [-4, 0, 3], II: [1, 5, 8], V: [7, 11, 14], iv: [5, 8, 12], VII: [-2, 2, 5] };
      var P = [['i', 'VI', 'II', 'V'], ['i', 'iv', 'VI', 'V'], ['i', 'II', 'i', 'V'], ['VI', 'VII', 'i', 'i'], ['i', 'VI', 'iv', 'V']];
      var MOT = [[7, 0, 1, 0], [12, 10, 8, 7], [0, 3, 1, 0], [7, 8, 7, 1], [3, 2, 0, 1]];
      var TB = [1, 0, 1, 1, 0, 1, 1, 0];
      var prog = P[0], c = 'i', organ = false, motif = false, mot = MOT[0];
      function at(k, base) { return CH[k].map(function (x) { return base + x; }); }
      return { step: function (V, i, t, dt) {
        var s = i % 16, bar = Math.floor(i / 16), ph = bar % 8, rt;
        if (s === 0) {
          if (bar % 4 === 0) { prog = pick(P); organ = chance(0.5); motif = chance(0.65); mot = pick(MOT); }
          c = prog[bar % 4];
          var vox = at(c, R).concat([R + 12 + CH[c][0]]);
          NC(V, 'choir', vox, t, { v: 0.3, dur: dt * 16, a: 0.15, r: 0.5, wet: 0.6 }, function () { VOICE.pad(V, at(c, R), t, dt * 16, 0.06, 1100); });
          if (organ) NC(V, 'organ', at(c, R - 12), t, { v: 0.2, dur: dt * 16, a: 0.05, r: 0.4, wet: 0.5 });
          rt = R - 12 + CH[c][0];
          N(V, 'bass', rt, t, { v: 0.45, dur: dt * 15, a: 0.05, r: 0.3, wet: 0.1 }, function () { VOICE.bass(V, rt, t, dt * 15, 0.09, true); });
          N(V, 'timpani', rt, t, { v: 0.9, wet: 0.35 });
          if (ph === 0) VOICE.crash(V, t, 0.1);
        }
        rt = R - 12 + CH[c][0];
        if (s === 0 || s === 10) N(V, 'taiko', 36, t, { v: 1, wet: 0.35 }, function () { VOICE.taiko(V, t, 0.55); });
        if (s === 3 || s === 6 || s === 14) N(V, 'taiko', 42, t, { v: 0.6, wet: 0.3 }, function () { VOICE.taiko(V, t, 0.25); });
        if (s === 8) { VOICE.snare(V, t, 0.3); N(V, 'taiko', 54, t, { v: 0.6, wet: 0.3 }); }
        if (s % 2 === 0) VOICE.hat(V, t, 0.018);
        if (ph === 7 && s >= 8) N(V, 'taiko', s % 2 ? 48 : 54, t, { v: 0.45 + (s - 8) * 0.07, wet: 0.3 }, function () { VOICE.kick(V, t, 0.3, 200, 80, 0.25, 0.3); });
        if (s % 2 === 0 && TB[s / 2]) N(V, 'trombone', rt, t, { v: 0.45, dur: dt * 1.6, a: 0.01, r: 0.08, wet: 0.2 }, function () { VOICE.brass(V, [rt], t, dt * 1.6, 0.07, 1400); });
        var tr = at(c, R + 12)[s % 3];
        N(V, 'strings', tr, t, { v: 0.17, dur: dt * 0.9, a: 0.004, r: 0.05, wet: 0.3 }, function () { VOICE.stac(V, tr, t, dt * 0.9, 0.025); });
        if (motif && bar % 8 >= 4 && (s === 0 || s === 8)) {
          var k = ((bar % 2) * 2 + s / 8) % 4, mm = R + mot[k], d = dt * 7;
          N(V, 'horn', mm, t, { v: 0.5, dur: d, a: 0.04, r: 0.25, wet: 0.4 }, function () { VOICE.brass(V, [mm + 12, mm], t, d, 0.09, 2400); });
          N(V, 'trumpet', mm + 12, t, { v: 0.32, dur: d, a: 0.04, r: 0.25, wet: 0.4 });
        }
      } };
    } },

    below: { name: 'Below the glass', note: 'Drones, a cold music box, distant choir, a slow heartbeat. Dread and Umbrasol.', level: 1.3, synth: 1.2, beat: 0.25, uses: ['choir', 'musicbox', 'bells', 'timpani'], make: function () {
      var R = 38, sc = PHRYG, nodes = [];
      return {
        start: function (V, t) {
          var lp = ac.createBiquadFilter(), g = ac.createGain(), lfo = osc('sine', 0.05, t, t + 36000), lg = ac.createGain();
          lp.type = 'lowpass'; lp.frequency.value = 240; lg.gain.value = 120; lfo.connect(lg); lg.connect(lp.frequency);
          [[R - 12, -6], [R, 5], [R + 7, -3]].forEach(function (d) { nodes.push(osc('sawtooth', mtof(d[0]), t, t + 36000, d[1])); nodes[nodes.length - 1].connect(lp); });
          g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.055, t + 4); lp.connect(g); out(V, g, 0.4);
          var n = ac.createBufferSource(); n.buffer = BROWN; n.loop = true; n.start(t);
          var bp = ac.createBiquadFilter(), wl = osc('sine', 0.03, t, t + 36000), wg = ac.createGain(), ng = ac.createGain();
          bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 3; wg.gain.value = 300; wl.connect(wg); wg.connect(bp.frequency);
          ng.gain.value = 0.18; n.connect(bp); bp.connect(ng); out(V, ng, 0.5);
          nodes.push(lfo, n, wl);
        },
        stop: function (t) { nodes.forEach(function (n) { try { n.stop(t); } catch (e) {} }); },
        step: function (V, i, t, dt) {
          var s = i % 16, bar = Math.floor(i / 16);
          if (s === 0 && bar % 2 === 0) {
            var c = pick([0, 0, 1, 5, 3]), ch = chord(R + 12, sc, c);
            NC(V, 'choir', ch, t, { v: 0.2, dur: dt * 28, a: 2.5, r: 2.5, wet: 0.7 }, function () { VOICE.pad(V, chord(R, sc, c), t, dt * 30, 0.045, 520); });
            if (chance(0.2)) { var cl = [R + 24, R + 25, R + 30]; NC(V, 'choir', cl, t + dt * 8, { v: 0.12, dur: dt * 18, a: 3, r: 3, wet: 0.8 }, function () { VOICE.pad(V, [R + 12, R + 13, R + 18], t + dt * 8, dt * 20, 0.025, 700); }); }
          }
          if (chance(0.05)) { var b = deg(R + 36, sc, Math.floor(rnd(0, 9))), bv = rnd(0.3, 0.5); N(V, 'musicbox', b, t, { v: bv, wet: 0.75 }, function () { VOICE.bell(V, b, t, bv * 0.12, rnd(3, 6)); }); }
          if (chance(0.008)) N(V, 'bells', deg(R + 24, sc, pick([0, 4])), t, { v: 0.4, wet: 0.7 });
          if (bar % 4 === 2 && (s === 8 || s === 9)) N(V, 'timpani', R, t, { v: s === 8 ? 0.7 : 0.5, wet: 0.3 }, function () { VOICE.kick(V, t, s === 8 ? 0.35 : 0.24, 70, 38, 0.4, 0.3); });
        }
      };
    } },

    rain: { name: 'Rain and fire', note: 'No music. Rain on the window and a crackling fire.', level: 1.1, beat: 0.05, uses: [], make: function () {
      var nodes = [];
      return {
        start: function (V, t) {
          var n = ac.createBufferSource(); n.buffer = NOISE; n.loop = true; n.start(t);
          var hp = ac.createBiquadFilter(), lp = ac.createBiquadFilter(), g = ac.createGain();
          hp.type = 'highpass'; hp.frequency.value = 800; lp.type = 'lowpass'; lp.frequency.value = 6500; g.gain.value = 0.05;
          n.connect(hp); hp.connect(lp); lp.connect(g); out(V, g, 0);
          var b = ac.createBufferSource(); b.buffer = BROWN; b.loop = true; b.start(t);
          var bl = ac.createBiquadFilter(), bg = ac.createGain(); bl.type = 'lowpass'; bl.frequency.value = 500; bg.gain.value = 0.25;
          b.connect(bl); bl.connect(bg); out(V, bg, 0);
          nodes.push(n, b);
        },
        stop: function (t) { nodes.forEach(function (n) { try { n.stop(t); } catch (e) {} }); },
        step: function (V, i, t) {
          if (chance(0.3)) { var d = noise(t, 0.04), bp = ac.createBiquadFilter(), g = ac.createGain(); bp.type = 'bandpass'; bp.frequency.value = rnd(2000, 6500); bp.Q.value = 5;
            g.gain.setValueAtTime(rnd(0.02, 0.07), t); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.03); d.connect(bp); bp.connect(g); out(V, g, 0); }
          if (chance(0.07)) for (var k = 0, n = chance(0.3) ? 2 : 1; k < n; k++) {
            var tt = t + k * rnd(0.015, 0.05), c = noise(tt, 0.03), hp = ac.createBiquadFilter(), cg = ac.createGain(); hp.type = 'highpass'; hp.frequency.value = rnd(1200, 3500);
            cg.gain.setValueAtTime(rnd(0.05, 0.16), tt); cg.gain.exponentialRampToValueAtTime(0.0005, tt + rnd(0.006, 0.022)); c.connect(hp); hp.connect(cg); out(V, cg, 0.05);
          }
          if (chance(0.0004)) { var th = noise(t, 6, BROWN), tl = ac.createBiquadFilter(), tg = ac.createGain(); tl.type = 'lowpass'; tl.frequency.value = 140;
            tg.gain.setValueAtTime(0, t); tg.gain.linearRampToValueAtTime(0.9, t + 0.8); tg.gain.exponentialRampToValueAtTime(0.001, t + 5.5); th.connect(tl); tl.connect(tg); out(V, tg, 0.3); }
        }
      };
    } }
  };
  var ORDER = ['quiet', 'road', 'festival', 'tavern', 'battle', 'boss', 'below', 'rain'];

  /* ======================= playing ======================= */
  var cur = null, playing = false, timer = 0, pausedForBreak = false, loading = null;
  function begin(id, at) {
    var M = MOODS[id], t = at != null ? at : ac.currentTime + 0.08, bus = ac.createGain(), wet = ac.createGain();
    var lv = needs(id).length && needs(id).every(has) ? M.level : (M.synth || M.level);
    bus.gain.setValueAtTime(0, t); bus.gain.linearRampToValueAtTime(lv, t + 1.2);
    wet.gain.setValueAtTime(0, t); wet.gain.linearRampToValueAtTime(lv, t + 1.2);
    bus.connect(master); wet.connect(verbIn);
    var V = { dry: bus, wet: wet }, inst = M.make();
    if (inst.start) inst.start(V, t);
    return { id: id, V: V, bus: bus, wet: wet, inst: inst, i: 0, next: t, dt: M.beat };
  }
  function end(c, now) {
    if (!c) return; var t = now != null ? now : ac.currentTime;
    c.bus.gain.cancelScheduledValues(t); c.bus.gain.setValueAtTime(c.bus.gain.value, t); c.bus.gain.linearRampToValueAtTime(0, t + 1);
    c.wet.gain.cancelScheduledValues(t); c.wet.gain.setValueAtTime(c.wet.gain.value, t); c.wet.gain.linearRampToValueAtTime(0, t + 1.5);
    if (c.inst.stop) c.inst.stop(t + 1.6);
    setTimeout(function () { try { c.bus.disconnect(); c.wet.disconnect(); } catch (e) {} }, 6000);
  }
  function schedule(c, until) {
    if (c.next < ac.currentTime - 0.2) c.next = ac.currentTime + 0.05;   /* fell behind: skip ahead rather than pile notes up */
    while (c.next < until) { c.inst.step(c.V, c.i, c.next, c.dt); c.i++; c.next += c.dt; }
  }
  function tick() {
    if (!cur || !playing) return;
    schedule(cur, ac.currentTime + (document.hidden ? 2 : 0.3));
    /* duck while the Desk is reading aloud or listening for dictation */
    var dict = $('dictBtn') && $('dictBtn').getAttribute('aria-pressed') === 'true', talk = window.speechSynthesis && speechSynthesis.speaking;
    var want = dict ? 0.12 : talk ? 0.3 : 1;
    if (duck._to !== want) { duck._to = want; duck.gain.setTargetAtTime(want, ac.currentTime, 0.25); }
  }
  function vol() { return Math.pow(ST.vol, 1.6) * 0.9; }

  function needs(id) { return ST.real ? (MOODS[id].uses || []) : []; }
  function ready(id) { var b = ac.__bank || {}; return needs(id).every(function (n) { return b[n] && b[n].done; }); }
  function play(id) {
    stopLink();
    if (!ac) {
      var AC = window.AudioContext || window.webkitAudioContext, ctx;
      try { ctx = new AC({ sampleRate: 32000 }); } catch (e) { ctx = new AC(); }   /* 32 kHz is plenty for these recordings and halves the memory */
      build(ctx);
    }
    if (ac.state === 'suspended') ac.resume();
    id = MOODS[id] ? id : ST.mood; ST.mood = id; saveST(); pausedForBreak = false;
    if (ready(id)) { loading = null; return start(id); }
    /* first time for this mood: fetch its instruments, keep the old mood going meanwhile */
    loading = id; paint();
    var go = function () { if (loading === id) { loading = null; start(id); } };
    Promise.all(needs(id).map(loadInst)).then(go, go); setTimeout(go, 9000);
  }
  function start(id) {
    if (ac.state === 'suspended') ac.resume();
    var now = ac.currentTime;
    master.gain.cancelScheduledValues(now); master.gain.setValueAtTime(master.gain.value, now); master.gain.linearRampToValueAtTime(vol(), now + 0.4);
    if (!cur || cur.id !== id) {
      end(cur, now); cur = begin(id);
      /* only the playing mood's instruments stay unpacked in memory; the downloads stay cached */
      var keep = needs(id), bank = ac.__bank || {};
      Object.keys(bank).forEach(function (n) { if (keep.indexOf(n) < 0 && bank[n].done) delete bank[n]; });
    }
    playing = true; clearInterval(timer); timer = setInterval(tick, 60); tick();
    paint();
  }
  function pause() {
    if (!ac) return;
    loading = null;
    if (!playing) { paint(); return; }
    playing = false; clearInterval(timer);
    var now = ac.currentTime; master.gain.cancelScheduledValues(now); master.gain.setValueAtTime(master.gain.value, now); master.gain.linearRampToValueAtTime(0, now + 0.5);
    setTimeout(function () { if (!playing && ac.state === 'running') { ac.suspend(); } }, 650);
    paint();
  }
  function toggle() { if (playing || loading) pause(); else if (linkOn != null) pauseLink(!linkPaused); else play(ST.mood); }

  /* ======================= your own music: YouTube and Spotify ======================= */
  var linkOn = null, linkPaused = false;
  function embedOf(url) {
    url = (url || '').trim(); var m, list = (url.match(/[?&]list=([\w-]+)/) || [])[1];
    if ((m = url.match(/(?:youtube\.com\/(?:watch\?(?:[^#]*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/)))
      return { kind: 'yt', src: 'https://www.youtube-nocookie.com/embed/' + m[1] + '?autoplay=1&enablejsapi=1&rel=0' + (list ? '&list=' + list : '') };
    if (list && /youtube\.com/.test(url)) return { kind: 'yt', src: 'https://www.youtube-nocookie.com/embed/videoseries?list=' + list + '&autoplay=1&enablejsapi=1&rel=0' };
    if ((m = url.match(/open\.spotify\.com\/(?:intl-[\w-]+\/)?(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/)))
      return { kind: 'sp', src: 'https://open.spotify.com/embed/' + m[1] + '/' + m[2] };
    return null;
  }
  function playLink(i) {
    var L = ST.links[i], e = L && embedOf(L.url); if (!e) return;
    pause(); stopLink(); linkOn = i; linkPaused = false;
    var box = $('muEmbed'); box.hidden = false; box.className = 'mu-embed ' + e.kind;
    box.innerHTML = '<iframe src="' + esc(e.src) + '" title="' + esc(L.name || 'Your music') + '" allow="autoplay; encrypted-media; clipboard-write; fullscreen; picture-in-picture" loading="eager"></iframe>';
    paint();
  }
  function ytCmd(func) { var f = $('muEmbed').querySelector('iframe'); if (f && f.contentWindow) f.contentWindow.postMessage(JSON.stringify({ event: 'command', func: func, args: [] }), '*'); }
  function pauseLink(on) {
    if (linkOn == null) return; linkPaused = on;
    var L = ST.links[linkOn], e = L && embedOf(L.url);
    if (e && e.kind === 'yt') ytCmd(on ? 'pauseVideo' : 'playVideo');
    paint();
  }
  function stopLink() { if (linkOn == null) return; linkOn = null; linkPaused = false; var box = $('muEmbed'); if (box) { box.innerHTML = ''; box.hidden = true; } }

  /* ======================= the tab ======================= */
  function paint() {
    var moods = $('muMoods'); if (!moods) return;
    var on = playing && cur ? cur.id : null;
    moods.querySelectorAll('[data-mood]').forEach(function (b) { b.classList.toggle('on', b.dataset.mood === on); b.classList.toggle('wait', b.dataset.mood === loading); b.setAttribute('aria-pressed', b.dataset.mood === on ? 'true' : 'false'); });
    $('muLinks').querySelectorAll('[data-link]').forEach(function (b) { b.classList.toggle('on', +b.dataset.link === linkOn); });
    var M = MOODS[loading || ST.mood], L = linkOn != null ? ST.links[linkOn] : null;
    $('muTitle').textContent = L ? (L.name || 'Your music') : M.name;
    $('muSub').textContent = L ? (linkPaused ? 'Paused' : 'Playing your link') : loading ? 'Tuning the instruments…' : playing ? 'Playing' : pausedForBreak ? 'Paused for your break' : 'Paused';
    var isOn = playing || !!loading || (linkOn != null && !linkPaused);
    $('muPlay').classList.toggle('on', isOn); $('muPlay').setAttribute('aria-label', isOn ? 'Pause' : 'Play');
    $('muPlay').innerHTML = isOn ? '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6.5" y="5" width="4" height="14" rx="1"/><rect x="13.5" y="5" width="4" height="14" rx="1"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>';
    var btn = $('muBtn'); btn.classList.toggle('on', isOn); btn.title = isOn ? 'Music: ' + (L ? L.name || 'your link' : M.name) + ' (click to pause)' : 'Music';
  }
  function renderMoods() {
    $('muMoods').innerHTML = ORDER.map(function (id) {
      var M = MOODS[id];
      return '<button type="button" class="mu-mood m-' + id + '" data-mood="' + id + '" aria-pressed="false"><span class="mu-eq" aria-hidden="true"><i></i><i></i><i></i></span><b>' + esc(M.name) + '</b><span>' + esc(M.note) + '</span></button>';
    }).join('');
  }
  function renderLinks() {
    var ul = $('muLinks');
    ul.innerHTML = ST.links.length ? ST.links.map(function (L, i) {
      var e = embedOf(L.url);
      return '<li><button type="button" class="mu-link" data-link="' + i + '"><span class="mu-src ' + (e ? e.kind : '') + '">' + (e && e.kind === 'sp' ? 'Spotify' : 'YouTube') + '</span>' + esc(L.name || L.url) + '</button><button type="button" class="mu-x" data-del="' + i + '" aria-label="Remove ' + esc(L.name || 'link') + '">&times;</button></li>';
    }).join('') : '<li class="muted small">Nothing saved yet.</li>';
    paint();
  }

  function init() {
    if (!$('muMoods')) return;
    renderMoods(); renderLinks();
    $('muVol').value = ST.vol; $('muBrk').checked = ST.brk; $('muReal').checked = ST.real;
    $('muReal').addEventListener('change', function () {
      ST.real = this.checked; saveST();
      if (ST.real && ac && cur) needs(cur.id).forEach(loadInst);
    });
    /* start fetching a mood's instruments as soon as you point at it */
    $('muMoods').addEventListener('pointerover', function (e) { var b = e.target.closest('[data-mood]'); if (b && ST.real) prefetch(MOODS[b.dataset.mood].uses || []); });
    var tabBtn = document.querySelector('.p-tabs [data-tab="music"]');
    if (tabBtn) tabBtn.addEventListener('click', function () { if (ST.real) prefetch(MOODS[ST.mood].uses || []); });
    $('muMoods').addEventListener('click', function (e) {
      var b = e.target.closest('[data-mood]'); if (!b) return;
      if (playing && ST.mood === b.dataset.mood) pause(); else play(b.dataset.mood);
    });
    $('muPlay').addEventListener('click', toggle);
    $('muVol').addEventListener('input', function () {
      ST.vol = +this.value; saveST();
      if (ac && playing) { master.gain.cancelScheduledValues(ac.currentTime); master.gain.setTargetAtTime(vol(), ac.currentTime, 0.05); }
    });
    $('muBrk').addEventListener('change', function () { ST.brk = this.checked; saveST(); });
    $('muBtn').addEventListener('click', function () {
      if (!playing && linkOn == null && !ST.used) { ST.used = true; saveST(); if (window.DeskPanel) DeskPanel('music'); }
      toggle();
    });
    $('muAdd').addEventListener('submit', function (e) {
      e.preventDefault(); var url = $('muUrl').value.trim(), name = $('muName').value.trim();
      if (!embedOf(url)) { $('muErr').textContent = 'That doesn\'t look like a YouTube or Spotify link.'; return; }
      var e2 = embedOf(url), what = (url.match(/spotify\.com\/(?:intl-[\w-]+\/)?(\w+)/) || [])[1];
      if (!name) name = e2.kind === 'sp' ? 'Spotify ' + (what || 'link') : /list=/.test(url) ? 'YouTube playlist' : 'YouTube video';
      $('muErr').textContent = ''; ST.links.push({ url: url, name: name }); saveST(); $('muUrl').value = ''; $('muName').value = ''; renderLinks();
    });
    $('muLinks').addEventListener('click', function (e) {
      var d = e.target.closest('[data-del]'), l = e.target.closest('[data-link]');
      if (d) { var i = +d.dataset.del; if (linkOn === i) stopLink(); else if (linkOn > i) linkOn--; ST.links.splice(i, 1); saveST(); renderLinks(); return; }
      if (l) { var j = +l.dataset.link; if (linkOn === j) pauseLink(!linkPaused); else playLink(j); }
    });
    document.addEventListener('desk:break', function (e) {
      if (!ST.brk) return;
      if (e.detail.on) {
        if (playing) { pause(); pausedForBreak = true; paint(); }
        else if (linkOn != null && !linkPaused) { pauseLink(true); pausedForBreak = true; }
      } else if (pausedForBreak) {
        pausedForBreak = false;
        if (linkOn != null) pauseLink(false); else play(ST.mood);
      }
    });
    paint();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

  /* for testing: render a mood offline and return its loudness */
  function swap(v) { var was = [ac, master, duck, verbIn, NOISE, BROWN]; if (v) { ac = v[0]; master = v[1]; duck = v[2]; verbIn = v[3]; NOISE = v[4]; BROWN = v[5]; } return was; }
  window.DeskMusic = {
    moods: MOODS, play: play, pause: pause, get playing() { return playing; }, get mood() { return cur ? cur.id : ST.mood; }, get loading() { return loading; },
    render: function (id, secs) {
      var sr = 22050, ctx = new OfflineAudioContext(1, sr * secs, sr), keep = swap();
      build(ctx); master.gain.value = 0.9 * Math.pow(0.6, 1.6);
      var mine = swap(keep);
      var prev = swap(mine), wait = Promise.all(needs(id).map(loadInst)); swap(prev);
      return wait.then(function () {
        var p2 = swap(mine), c = begin(id, 0); schedule(c, secs); swap(p2);
        return ctx.startRendering();
      }).then(function (buf) {
        var d = buf.getChannelData(0), sum = 0, peak = 0, from = Math.floor(sr * 2), silent = 0, win = Math.floor(sr * 0.5), wsum = 0;
        for (var i = from; i < d.length; i++) { var x = d[i]; sum += x * x; if (Math.abs(x) > peak) peak = Math.abs(x); wsum += x * x; if ((i - from) % win === win - 1) { if (Math.sqrt(wsum / win) < 0.002) silent++; wsum = 0; } }
        return { rms: Math.sqrt(sum / (d.length - from)), peak: peak, silentHalfSeconds: silent, real: needs(id).length };
      });
    }
  };
})();
