/* ==========================================================================
   THE TABLE — shared engine
   Draws a battle map on a canvas (terrain, props, fog, tokens), handles pan,
   zoom and token dragging, does the 5e area math, rolls dice, and plays the
   spell animations. Used by the DM's table (Sanctum) and the players' page.
   ========================================================================== */
(function () {
  var T = {};
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var FT = 5; /* feet per square */

  /* ---------- terrain ---------- */
  T.TERRAIN = [
    { id: 'floor', name: 'Stone floor', c: '#77716a', d: '#625d57', tex: 'stone' },
    { id: 'path', name: 'Flagstones', c: '#8f8576', d: '#766d61', tex: 'flags' },
    { id: 'wood', name: 'Wood planks', c: '#8b6a48', d: '#6f5236', tex: 'planks' },
    { id: 'carpet', name: 'Carpet', c: '#7a2d3c', d: '#5f2230', tex: 'weave' },
    { id: 'grass', name: 'Grass', c: '#5c7d43', d: '#4a6735', tex: 'grass' },
    { id: 'dirt', name: 'Dirt', c: '#7a6046', d: '#634d37', tex: 'speck' },
    { id: 'sand', name: 'Sand', c: '#cbb27c', d: '#b39a66', tex: 'speck' },
    { id: 'water', name: 'Water', c: '#3f6e98', d: '#335c80', tex: 'waves' },
    { id: 'deep', name: 'Deep water', c: '#24466a', d: '#1b3754', tex: 'waves' },
    { id: 'ice', name: 'Ice', c: '#a9cfe0', d: '#8fb8cb', tex: 'cracks' },
    { id: 'lava', name: 'Lava', c: '#c8481c', d: '#8e2b10', tex: 'lava' },
    { id: 'wall', name: 'Wall', c: '#34303b', d: '#26232b', tex: 'brick' },
    { id: 'void', name: 'Chasm', c: '#0c0a0f', d: '#050407', tex: 'none' }
  ];
  var TER = {}; T.TERRAIN.forEach(function (t) { TER[t.id] = t; });

  function rng(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
  var patterns = {};
  function texture(t) {
    if (patterns[t.id]) return patterns[t.id];
    var N = 64, c = document.createElement('canvas'); c.width = c.height = N; var x = c.getContext('2d'), r = rng(t.id.length * 977 + 13), i;
    x.fillStyle = t.c; x.fillRect(0, 0, N, N);
    function speck(n, col, sz) { x.fillStyle = col; for (i = 0; i < n; i++) x.fillRect(r() * N, r() * N, sz * (0.5 + r()), sz * (0.5 + r())); }
    switch (t.tex) {
      case 'stone': speck(70, 'rgba(0,0,0,.10)', 3); speck(40, 'rgba(255,255,255,.06)', 2); break;
      case 'flags':
        x.strokeStyle = t.d; x.lineWidth = 2; x.strokeRect(1, 1, 30, 30); x.strokeRect(33, 1, 30, 30); x.strokeRect(1, 33, 62, 30); speck(40, 'rgba(0,0,0,.08)', 3); break;
      case 'planks':
        x.strokeStyle = t.d; x.lineWidth = 2; for (i = 0; i < 4; i++) { x.beginPath(); x.moveTo(0, i * 16 + 1); x.lineTo(N, i * 16 + 1); x.stroke(); }
        for (i = 0; i < 4; i++) { var off = (i * 23) % 64; x.beginPath(); x.moveTo(off, i * 16); x.lineTo(off, i * 16 + 16); x.stroke(); }
        x.strokeStyle = 'rgba(0,0,0,.12)'; x.lineWidth = 1; for (i = 0; i < 12; i++) { var yy = r() * N; x.beginPath(); x.moveTo(r() * N, yy); x.lineTo(r() * N, yy + r() * 2); x.stroke(); } break;
      case 'weave': x.strokeStyle = 'rgba(0,0,0,.14)'; x.lineWidth = 1; for (i = 0; i < N; i += 4) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, N); x.stroke(); } x.strokeStyle = 'rgba(255,215,140,.25)'; x.lineWidth = 2; x.strokeRect(5, 5, 54, 54); break;
      case 'grass': for (i = 0; i < 90; i++) { var gx = r() * N, gy = r() * N; x.strokeStyle = r() > .5 ? 'rgba(20,40,10,.35)' : 'rgba(170,210,110,.25)'; x.lineWidth = 1.2; x.beginPath(); x.moveTo(gx, gy); x.lineTo(gx + (r() - .5) * 4, gy - 3 - r() * 4); x.stroke(); } break;
      case 'speck': speck(120, 'rgba(0,0,0,.12)', 2); speck(50, 'rgba(255,255,255,.10)', 1.5); break;
      case 'waves': x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 1.5; for (i = 0; i < 7; i++) { var wy = r() * N, wx = r() * N; x.beginPath(); x.moveTo(wx, wy); x.quadraticCurveTo(wx + 5, wy - 3, wx + 10, wy); x.quadraticCurveTo(wx + 15, wy + 3, wx + 20, wy); x.stroke(); } break;
      case 'cracks': x.strokeStyle = 'rgba(255,255,255,.55)'; x.lineWidth = 1; for (i = 0; i < 5; i++) { x.beginPath(); var cx = r() * N, cy = r() * N; x.moveTo(cx, cy); for (var k = 0; k < 4; k++) { cx += (r() - .5) * 22; cy += (r() - .5) * 22; x.lineTo(cx, cy); } x.stroke(); } break;
      case 'lava': x.fillStyle = '#7d2309'; for (i = 0; i < 9; i++) { x.beginPath(); x.arc(r() * N, r() * N, 5 + r() * 9, 0, 7); x.fill(); } x.strokeStyle = '#ffb347'; x.lineWidth = 1.5; for (i = 0; i < 5; i++) { x.beginPath(); var lx = r() * N, ly = r() * N; x.moveTo(lx, ly); x.lineTo(lx + (r() - .5) * 20, ly + (r() - .5) * 20); x.stroke(); } break;
      case 'brick': x.strokeStyle = 'rgba(0,0,0,.45)'; x.lineWidth = 2; for (i = 0; i < 4; i++) { x.beginPath(); x.moveTo(0, i * 16); x.lineTo(N, i * 16); x.stroke(); for (var b = 0; b < 3; b++) { var bx = (b * 32 + (i % 2) * 16) % N; x.beginPath(); x.moveTo(bx, i * 16); x.lineTo(bx, i * 16 + 16); x.stroke(); } } speck(30, 'rgba(255,255,255,.05)', 3); break;
    }
    patterns[t.id] = c; return c;
  }

  /* ---------- props: small vector drawings, unit square centered at 0,0 ---------- */
  function P(fn) { return fn; }
  T.PROPS = {
    door: { name: 'Door', draw: P(function (x) { x.fillStyle = '#7a5532'; x.fillRect(-.42, -.12, .84, .24); x.strokeStyle = '#3d2814'; x.lineWidth = .04; x.strokeRect(-.42, -.12, .84, .24); x.fillStyle = '#d9b45a'; x.beginPath(); x.arc(.25, 0, .04, 0, 7); x.fill(); }) },
    chest: { name: 'Chest', draw: P(function (x) { x.fillStyle = '#8a5a2b'; rr(x, -.3, -.2, .6, .4, .05); x.fill(); x.strokeStyle = '#d9b45a'; x.lineWidth = .05; x.strokeRect(-.3, -.2, .6, .4); x.beginPath(); x.moveTo(-.3, -.05); x.lineTo(.3, -.05); x.stroke(); x.fillStyle = '#d9b45a'; x.fillRect(-.04, -.08, .08, .1); }) },
    barrel: { name: 'Barrel', draw: P(function (x) { x.fillStyle = '#7d5531'; x.beginPath(); x.arc(0, 0, .3, 0, 7); x.fill(); x.strokeStyle = '#3d2814'; x.lineWidth = .05; x.beginPath(); x.arc(0, 0, .3, 0, 7); x.stroke(); x.beginPath(); x.arc(0, 0, .2, 0, 7); x.stroke(); }) },
    crate: { name: 'Crate', draw: P(function (x) { x.fillStyle = '#a07a4a'; x.fillRect(-.32, -.32, .64, .64); x.strokeStyle = '#5b3f1f'; x.lineWidth = .05; x.strokeRect(-.32, -.32, .64, .64); x.beginPath(); x.moveTo(-.32, -.32); x.lineTo(.32, .32); x.moveTo(.32, -.32); x.lineTo(-.32, .32); x.stroke(); }) },
    table: { name: 'Table', draw: P(function (x) { x.fillStyle = '#8b6a48'; rr(x, -.44, -.3, .88, .6, .06); x.fill(); x.strokeStyle = '#4e3620'; x.lineWidth = .04; x.stroke(); }) },
    bed: { name: 'Bed', draw: P(function (x) { x.fillStyle = '#6b4a2e'; x.fillRect(-.3, -.44, .6, .88); x.fillStyle = '#d8d0c0'; x.fillRect(-.25, -.38, .5, .2); x.fillStyle = '#7a2d3c'; x.fillRect(-.27, -.12, .54, .52); }) },
    shelf: { name: 'Bookcase', draw: P(function (x) { x.fillStyle = '#5b3f1f'; x.fillRect(-.45, -.18, .9, .36); var cols = ['#8b2e2e', '#2e5a8b', '#d9b45a', '#3f7a3a', '#6b3f8b']; for (var i = 0; i < 9; i++) { x.fillStyle = cols[i % 5]; x.fillRect(-.42 + i * .095, -.14, .07, .28); } }) },
    tree: { name: 'Tree', big: true, draw: P(function (x) { x.fillStyle = 'rgba(0,0,0,.25)'; x.beginPath(); x.arc(.08, .08, .48, 0, 7); x.fill(); var g = x.createRadialGradient(-.12, -.12, .05, 0, 0, .5); g.addColorStop(0, '#7fae5a'); g.addColorStop(1, '#2f5222'); x.fillStyle = g; x.beginPath(); for (var i = 0; i < 9; i++) { var a = i / 9 * Math.PI * 2, rr2 = .42 + (i % 2) * .07; x.lineTo(Math.cos(a) * rr2, Math.sin(a) * rr2); } x.closePath(); x.fill(); }) },
    bush: { name: 'Bush', draw: P(function (x) { x.fillStyle = '#3f6a2e'; [[-.12, 0, .2], [.12, -.05, .2], [0, .12, .18]].forEach(function (b) { x.beginPath(); x.arc(b[0], b[1], b[2], 0, 7); x.fill(); }); }) },
    rock: { name: 'Rock', draw: P(function (x) { x.fillStyle = '#8a857d'; x.beginPath(); x.moveTo(-.35, .1); x.lineTo(-.2, -.28); x.lineTo(.18, -.32); x.lineTo(.38, -.02); x.lineTo(.22, .3); x.lineTo(-.2, .3); x.closePath(); x.fill(); x.strokeStyle = '#4d4944'; x.lineWidth = .04; x.stroke(); }) },
    pillar: { name: 'Pillar', draw: P(function (x) { var g = x.createRadialGradient(-.1, -.1, .02, 0, 0, .36); g.addColorStop(0, '#d8d2c6'); g.addColorStop(1, '#77716a'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, .34, 0, 7); x.fill(); x.strokeStyle = '#3e3a35'; x.lineWidth = .04; x.stroke(); }) },
    statue: { name: 'Statue', draw: P(function (x) { x.fillStyle = '#9b958a'; x.fillRect(-.3, -.3, .6, .6); x.fillStyle = '#c9c3b6'; x.beginPath(); x.arc(0, -.05, .14, 0, 7); x.fill(); x.fillRect(-.12, .05, .24, .2); }) },
    stairs: { name: 'Stairs', draw: P(function (x) { for (var i = 0; i < 5; i++) { x.fillStyle = i % 2 ? '#8f8576' : '#a79c8b'; x.fillRect(-.45, -.45 + i * .18, .9, .18); } x.strokeStyle = 'rgba(0,0,0,.4)'; x.lineWidth = .03; x.strokeRect(-.45, -.45, .9, .9); }) },
    torch: { name: 'Torch', glow: '#ffb347', draw: P(function (x) { x.fillStyle = '#5b3f1f'; x.fillRect(-.04, -.05, .08, .3); x.fillStyle = '#ffb347'; x.beginPath(); x.moveTo(0, -.32); x.quadraticCurveTo(.12, -.12, 0, -.04); x.quadraticCurveTo(-.12, -.12, 0, -.32); x.fill(); }) },
    fire: { name: 'Campfire', glow: '#ff8a3c', draw: P(function (x) { x.fillStyle = '#5b3f1f'; x.save(); x.rotate(.6); x.fillRect(-.3, -.05, .6, .1); x.rotate(-1.2); x.fillRect(-.3, -.05, .6, .1); x.restore(); x.fillStyle = '#ff8a3c'; x.beginPath(); x.moveTo(0, -.3); x.quadraticCurveTo(.2, 0, 0, .1); x.quadraticCurveTo(-.2, 0, 0, -.3); x.fill(); x.fillStyle = '#ffd36b'; x.beginPath(); x.moveTo(0, -.15); x.quadraticCurveTo(.1, 0, 0, .06); x.quadraticCurveTo(-.1, 0, 0, -.15); x.fill(); }) },
    altar: { name: 'Altar', draw: P(function (x) { x.fillStyle = '#c9c3b6'; x.fillRect(-.42, -.22, .84, .44); x.strokeStyle = '#6e1e29'; x.lineWidth = .05; x.strokeRect(-.42, -.22, .84, .44); x.fillStyle = '#d9b45a'; x.beginPath(); x.arc(0, 0, .08, 0, 7); x.fill(); }) },
    trap: { name: 'Trap', draw: P(function (x) { x.strokeStyle = '#cf4a58'; x.lineWidth = .05; x.setLineDash([.08, .06]); x.strokeRect(-.4, -.4, .8, .8); x.setLineDash([]); x.fillStyle = '#cf4a58'; for (var i = -1; i <= 1; i++) for (var j = -1; j <= 1; j++) { x.beginPath(); x.moveTo(i * .22 - .05, j * .22 + .05); x.lineTo(i * .22, j * .22 - .07); x.lineTo(i * .22 + .05, j * .22 + .05); x.fill(); } }) },
    web: { name: 'Web', draw: P(function (x) { x.strokeStyle = 'rgba(240,240,240,.75)'; x.lineWidth = .02; for (var i = 0; i < 8; i++) { var a = i / 8 * Math.PI * 2; x.beginPath(); x.moveTo(0, 0); x.lineTo(Math.cos(a) * .48, Math.sin(a) * .48); x.stroke(); } for (var r2 = .12; r2 < .5; r2 += .12) { x.beginPath(); for (i = 0; i <= 8; i++) { a = i / 8 * Math.PI * 2; x.lineTo(Math.cos(a) * r2, Math.sin(a) * r2); } x.stroke(); } }) },
    bones: { name: 'Bones', draw: P(function (x) { x.strokeStyle = '#e8e2d2'; x.lineWidth = .06; x.lineCap = 'round'; x.beginPath(); x.moveTo(-.3, -.2); x.lineTo(.25, .2); x.moveTo(.3, -.25); x.lineTo(-.15, .25); x.stroke(); x.fillStyle = '#e8e2d2'; x.beginPath(); x.arc(-.05, -.25, .1, 0, 7); x.fill(); }) },
    mirror: { name: 'Mirror', draw: P(function (x) { x.fillStyle = '#d9b45a'; x.beginPath(); x.ellipse(0, 0, .26, .38, 0, 0, 7); x.fill(); var g = x.createLinearGradient(-.2, -.3, .2, .3); g.addColorStop(0, '#cfe3f0'); g.addColorStop(.5, '#7a8fa8'); g.addColorStop(1, '#2a2630'); x.fillStyle = g; x.beginPath(); x.ellipse(0, 0, .2, .31, 0, 0, 7); x.fill(); }) }
  };
  function rr(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }

  T.SIZES = [['tiny', 'Tiny', .5], ['small', 'Small', 1], ['medium', 'Medium', 1], ['large', 'Large', 2], ['huge', 'Huge', 3], ['gargantuan', 'Gargantuan', 4]];
  var SZ = {}; T.SIZES.forEach(function (s) { SZ[s[0]] = s[2]; });
  T.footprint = function (tok) { return SZ[tok.size || 'medium'] || 1; };
  T.CONDITIONS = ['blinded', 'charmed', 'deafened', 'frightened', 'grappled', 'incapacitated', 'invisible', 'paralyzed', 'petrified', 'poisoned', 'prone', 'restrained', 'stunned', 'unconscious', 'concentrating', 'blessed', 'hasted'];
  var COND_COLOR = { blinded: '#888', charmed: '#e48ac4', deafened: '#999', frightened: '#9b59b6', grappled: '#c08a4a', incapacitated: '#666', invisible: '#cfe3f0', paralyzed: '#f1c40f', petrified: '#95a5a6', poisoned: '#6ab04c', prone: '#a0522d', restrained: '#c0392b', stunned: '#f39c12', unconscious: '#333', concentrating: '#5dade2', blessed: '#f7dc6f', hasted: '#48c9b0' };
  T.COND_COLOR = COND_COLOR;

  /* ---------- dice ---------- */
  T.roll = function (expr, mode) {
    var clean = String(expr || '').toLowerCase().replace(/\s+/g, '');
    if (!clean) return null;
    var re = /([+-]?)(\d*)d(\d+)|([+-]?)(\d+)/g, m, total = 0, parts = [], any = false;
    while ((m = re.exec(clean))) {
      if (m[3]) {
        var n = Math.min(100, parseInt(m[2] || '1', 10)), sides = parseInt(m[3], 10), sign = m[1] === '-' ? -1 : 1, rolls = [], sum = 0, dropped = null;
        if (!sides) continue;
        var isD20 = n === 1 && sides === 20 && (mode === 'adv' || mode === 'dis');
        for (var i = 0; i < (isD20 ? 2 : n); i++) rolls.push(1 + Math.floor(Math.random() * sides));
        if (isD20) { var keep = mode === 'adv' ? Math.max(rolls[0], rolls[1]) : Math.min(rolls[0], rolls[1]); dropped = rolls[0] === keep ? rolls[1] : rolls[0]; sum = keep; }
        else rolls.forEach(function (r) { sum += r; });
        total += sign * sum; parts.push({ n: n, sides: sides, sign: sign, rolls: rolls, dropped: dropped, sum: sum }); any = true;
      } else if (m[5]) { var k = parseInt(m[5], 10) * (m[4] === '-' ? -1 : 1); total += k; parts.push({ k: k }); any = true; }
    }
    if (!any) return null;
    var nat = parts.length && parts[0].sides === 20 && parts[0].n === 1 ? parts[0].sum : null;
    var text = parts.map(function (p, i) {
      if (p.k != null) return (p.k < 0 ? ' − ' : (i ? ' + ' : '')) + Math.abs(p.k);
      return (p.sign < 0 ? ' − ' : (i ? ' + ' : '')) + '[' + p.rolls.join(', ') + ']' + (p.dropped != null ? '' : '');
    }).join('');
    return { expr: expr, total: total, parts: parts, text: text, nat20: nat === 20, nat1: nat === 1, mode: mode || '' };
  };

  /* ---------- spells ---------- */
  T.SPELLS = [
    { id: 'fireball', name: 'Fireball', lvl: 3, shape: 'sphere', size: 20, range: 150, dmg: '8d6', type: 'fire', save: 'DEX', half: true, color: '#ff7a2f' },
    { id: 'lightning', name: 'Lightning Bolt', lvl: 3, shape: 'line', size: 100, width: 5, dmg: '8d6', type: 'lightning', save: 'DEX', half: true, color: '#9fd8ff' },
    { id: 'coneofcold', name: 'Cone of Cold', lvl: 5, shape: 'cone', size: 60, dmg: '8d8', type: 'cold', save: 'CON', half: true, color: '#bfe6ff' },
    { id: 'burninghands', name: 'Burning Hands', lvl: 1, shape: 'cone', size: 15, dmg: '3d6', type: 'fire', save: 'DEX', half: true, color: '#ff9a3c' },
    { id: 'thunderwave', name: 'Thunderwave', lvl: 1, shape: 'cube', size: 15, dmg: '2d8', type: 'thunder', save: 'CON', half: true, color: '#b9c8ff' },
    { id: 'shatter', name: 'Shatter', lvl: 2, shape: 'sphere', size: 10, range: 60, dmg: '3d8', type: 'thunder', save: 'CON', half: true, color: '#e8e4ff' },
    { id: 'icestorm', name: 'Ice Storm', lvl: 4, shape: 'sphere', size: 20, range: 300, dmg: '2d8+4d6', type: 'cold', save: 'DEX', half: true, color: '#d6f0ff' },
    { id: 'magicmissile', name: 'Magic Missile', lvl: 1, shape: 'target', range: 120, dmg: '3d4+3', type: 'force', save: '', color: '#c98bff' },
    { id: 'eldritch', name: 'Eldritch Blast', lvl: 0, shape: 'target', range: 120, dmg: '1d10', type: 'force', save: '', attack: true, color: '#9b6bff' },
    { id: 'sacredflame', name: 'Sacred Flame', lvl: 0, shape: 'target', range: 60, dmg: '1d8', type: 'radiant', save: 'DEX', color: '#ffe48a' },
    { id: 'guidingbolt', name: 'Guiding Bolt', lvl: 1, shape: 'target', range: 120, dmg: '4d6', type: 'radiant', save: '', attack: true, color: '#fff3b0' },
    { id: 'healingword', name: 'Healing Word', lvl: 1, shape: 'target', range: 60, heal: '1d4+3', color: '#7fe07f' },
    { id: 'curewounds', name: 'Cure Wounds', lvl: 1, shape: 'target', range: 5, heal: '1d8+3', color: '#9df0a0' },
    { id: 'mistystep', name: 'Misty Step', lvl: 2, shape: 'teleport', range: 30, color: '#dfe6f0' },
    { id: 'darkness', name: 'Darkness', lvl: 2, shape: 'sphere', size: 15, range: 60, lasting: true, color: '#000000' },
    { id: 'spiritguardians', name: 'Spirit Guardians', lvl: 3, shape: 'aura', size: 15, dmg: '3d8', type: 'radiant', save: 'WIS', half: true, lasting: true, color: '#ffd76b' },
    { id: 'moonbeam', name: 'Moonbeam', lvl: 2, shape: 'sphere', size: 5, range: 120, dmg: '2d10', type: 'radiant', save: 'CON', half: true, lasting: true, color: '#cfe8ff' },
    { id: 'wildmagic', name: 'Wild Magic Surge', lvl: 0, shape: 'sphere', size: 15, range: 60, color: '#ff5ec4' }
  ];
  var SP = {}; T.SPELLS.forEach(function (s) { SP[s.id] = s; });
  T.spell = function (id) { return SP[id]; };

  /* geometry: everything in squares. g = { ox, oy (origin), x, y (target point) } */
  function tc(tok) { var f = T.footprint(tok); return { x: tok.x + Math.max(f, 1) / 2, y: tok.y + Math.max(f, 1) / 2 }; }
  T.center = tc;
  T.inArea = function (sp, g, px, py) {
    var r = (sp.size || 0) / FT, dx, dy, L, ux, uy, d, along, across;
    if (sp.shape === 'sphere' || sp.shape === 'aura') { dx = px - g.x; dy = py - g.y; return Math.sqrt(dx * dx + dy * dy) <= r + 0.01; }
    dx = g.x - g.ox; dy = g.y - g.oy; L = Math.sqrt(dx * dx + dy * dy) || 1; ux = dx / L; uy = dy / L;
    var vx = px - g.ox, vy = py - g.oy; along = vx * ux + vy * uy; across = Math.abs(-vx * uy + vy * ux);
    if (sp.shape === 'line') return along >= 0 && along <= r + .01 && across <= (sp.width || 5) / FT / 2 + .01;
    if (sp.shape === 'cone') return along > 0 && along <= r + .01 && across <= along / 2 + .01;
    if (sp.shape === 'cube') return along >= 0 && along <= r + .01 && across <= r / 2 + .01;
    return false;
  };
  T.tokensIn = function (sp, g, tokens) {
    return tokens.filter(function (t) {
      if (sp.shape === 'target') return false;
      var f = Math.max(T.footprint(t), 1), hit = false;
      for (var i = 0; i < f && !hit; i++) for (var j = 0; j < f && !hit; j++) if (T.inArea(sp, g, t.x + i + .5, t.y + j + .5)) hit = true;
      return hit;
    });
  };

  /* ---------- the view ---------- */
  function View(canvas, opts) {
    this.c = canvas; this.x = canvas.getContext('2d'); this.o = opts || {};
    this.role = this.o.role || 'player';
    this.state = null; this.bg = null; this.cam = { ox: 40, oy: 40, z: 48 };
    this.fx = []; this.pings = []; this.sel = null; this.hover = null; this.preview = null; this.dirty = true; this.drag = null;
    this.mine = {}; this.showGrid = true;
    var self = this;
    this.resize(); new ResizeObserver(function () { self.resize(); }).observe(canvas.parentNode);
    this.bind();
    (function loop(t) { self.now = t; if (self.dirty || self.animating()) { self.dirty = false; self.render(t); } requestAnimationFrame(loop); })(0);
  }
  T.View = View;
  View.prototype.resize = function () {
    var r = this.c.parentNode.getBoundingClientRect();
    this.w = Math.max(50, r.width); this.h = Math.max(50, r.height);
    this.c.width = Math.round(this.w * DPR); this.c.height = Math.round(this.h * DPR);
    this.c.style.width = this.w + 'px'; this.c.style.height = this.h + 'px';
    this.dirty = true;
  };
  View.prototype.animating = function () {
    if (this.fx.length || this.pings.length || this.drag) return true;
    var s = this.state; if (!s) return false;
    if ((s.templates || []).length) return true;
    if (s.init && s.init.active) return true;
    return (s.map.props || []).some(function (p) { return T.PROPS[p.kind] && T.PROPS[p.kind].glow; });
  };
  View.prototype.setState = function (s) { this.state = s; this.dirty = true; };
  View.prototype.setBg = function (img) { this.bg = img; this.dirty = true; };
  View.prototype.toWorld = function (sx, sy) { return { x: (sx - this.cam.ox) / this.cam.z, y: (sy - this.cam.oy) / this.cam.z }; };
  View.prototype.fit = function () {
    if (!this.state) return; var m = this.state.map, pad = 30;
    var z = Math.min((this.w - pad * 2) / m.cols, (this.h - pad * 2) / m.rows);
    this.cam.z = Math.max(8, Math.min(90, z)); this.cam.ox = (this.w - m.cols * this.cam.z) / 2; this.cam.oy = (this.h - m.rows * this.cam.z) / 2; this.dirty = true;
  };
  View.prototype.centerOn = function (wx, wy) { this.cam.ox = this.w / 2 - wx * this.cam.z; this.cam.oy = this.h / 2 - wy * this.cam.z; this.dirty = true; };
  View.prototype.zoomAt = function (sx, sy, f) {
    var w = this.toWorld(sx, sy), z = Math.max(8, Math.min(140, this.cam.z * f));
    this.cam.z = z; this.cam.ox = sx - w.x * z; this.cam.oy = sy - w.y * z; this.dirty = true;
  };
  View.prototype.revealed = function (cx, cy) { var m = this.state.map; return !m.fogOn || !!(m.fog && m.fog[cx + ',' + cy]); };
  View.prototype.tokenAt = function (wx, wy) {
    var toks = this.visibleTokens();
    for (var i = toks.length - 1; i >= 0; i--) { var t = toks[i], f = Math.max(T.footprint(t), 1); if (wx >= t.x && wx < t.x + f && wy >= t.y && wy < t.y + f) return t; }
    return null;
  };
  View.prototype.visibleTokens = function () {
    var s = this.state; if (!s) return []; var self = this;
    return (s.tokens || []).filter(function (t) { return t.mapId === s.map.id && t.x != null && (self.role === 'dm' || !t.hidden); });
  };

  /* ---------- input ---------- */
  View.prototype.bind = function () {
    var self = this, c = this.c, pts = {}, pinch = null;
    function pos(e) { var r = c.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    c.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    c.addEventListener('pointerdown', function (e) {
      c.setPointerCapture(e.pointerId); var p = pos(e); pts[e.pointerId] = p;
      var ids = Object.keys(pts);
      if (ids.length === 2) { var a = pts[ids[0]], b = pts[ids[1]]; pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2, z: self.cam.z }; self.drag = null; return; }
      var w = self.toWorld(p.x, p.y), tool = self.o.tool ? self.o.tool() : 'select';
      var panBtn = e.button === 1 || e.button === 2 || self.space;
      if (!panBtn && tool !== 'select' && tool !== 'pan' && self.o.onTool) { self.drag = { kind: 'tool', start: w, last: w }; self.o.onTool('down', w, e); self.dirty = true; return; }
      var tok = !panBtn && self.tokenAt(w.x, w.y);
      if (tok && self.o.canMove && self.o.canMove(tok)) {
        self.sel = tok.id; self.drag = { kind: 'token', id: tok.id, dx: w.x - tok.x, dy: w.y - tok.y, sx: tok.x, sy: tok.y, moved: false };
        if (self.o.onSelect) self.o.onSelect(tok); self.dirty = true; return;
      }
      if (tok && self.o.onSelect) { self.sel = tok.id; self.o.onSelect(tok); }
      else if (!tok && self.o.onSelect && e.button === 0) { self.sel = null; self.o.onSelect(null); }
      self.drag = { kind: 'pan', sx: p.x, sy: p.y, ox: self.cam.ox, oy: self.cam.oy, moved: false, w: w };
    });
    c.addEventListener('pointermove', function (e) {
      var p = pos(e); if (pts[e.pointerId]) pts[e.pointerId] = p;
      var ids = Object.keys(pts);
      if (pinch && ids.length === 2) {
        var a = pts[ids[0]], b = pts[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y);
        self.zoomAt((a.x + b.x) / 2, (a.y + b.y) / 2, (pinch.z * d / pinch.d) / self.cam.z); return;
      }
      var w = self.toWorld(p.x, p.y); self.mouse = w;
      if (!self.drag) { var h = self.tokenAt(w.x, w.y); if ((h && h.id) !== self.hover) { self.hover = h && h.id; self.dirty = true; } if (self.o.onHover) self.o.onHover(w); c.style.cursor = h && self.o.canMove && self.o.canMove(h) ? 'grab' : ''; return; }
      if (self.drag.kind === 'pan') { if (Math.abs(p.x - self.drag.sx) + Math.abs(p.y - self.drag.sy) > 4) self.drag.moved = true; self.cam.ox = self.drag.ox + p.x - self.drag.sx; self.cam.oy = self.drag.oy + p.y - self.drag.sy; self.dirty = true; }
      else if (self.drag.kind === 'token') {
        var t = self.find(self.drag.id); if (!t) return;
        t.x = w.x - self.drag.dx; t.y = w.y - self.drag.dy; self.drag.moved = true; c.style.cursor = 'grabbing';
        if (self.o.onMove) self.o.onMove(t, t.x, t.y, false); self.dirty = true;
      } else if (self.drag.kind === 'tool') { self.o.onTool('move', w, e, self.drag.start); self.drag.last = w; self.dirty = true; }
    });
    function up(e) {
      var p = pos(e); delete pts[e.pointerId]; if (pinch) { if (Object.keys(pts).length < 2) pinch = null; self.drag = null; return; }
      var d = self.drag; self.drag = null; if (!d) return;
      var w = self.toWorld(p.x, p.y);
      if (d.kind === 'token') {
        var t = self.find(d.id); if (!t) return;
        if (d.moved) { t.x = Math.round(t.x); t.y = Math.round(t.y); if (self.o.onMove) self.o.onMove(t, t.x, t.y, true, d.sx, d.sy); }
        else if (self.o.onTap) self.o.onTap(w, e, t);
      } else if (d.kind === 'tool') self.o.onTool('up', w, e, d.start);
      else if (d.kind === 'pan' && !d.moved && self.o.onTap) self.o.onTap(w, e, null);
      self.dirty = true; c.style.cursor = '';
    }
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
    c.addEventListener('dblclick', function (e) { var p = pos(e), w = self.toWorld(p.x, p.y); if (self.o.onDouble) self.o.onDouble(w, self.tokenAt(w.x, w.y)); });
    c.addEventListener('wheel', function (e) { e.preventDefault(); var p = pos(e); self.zoomAt(p.x, p.y, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015))); }, { passive: false });
    window.addEventListener('keydown', function (e) { if (e.code === 'Space' && e.target === document.body) { self.space = true; e.preventDefault(); } });
    window.addEventListener('keyup', function (e) { if (e.code === 'Space') self.space = false; });
  };
  View.prototype.find = function (id) { var s = this.state; if (!s) return null; for (var i = 0; i < s.tokens.length; i++) if (s.tokens[i].id === id) return s.tokens[i]; return null; };

  /* ---------- drawing ---------- */
  View.prototype.render = function (now) {
    var x = this.x, s = this.state, z = this.cam.z, self = this;
    x.setTransform(DPR, 0, 0, DPR, 0, 0);
    x.fillStyle = this.o.bgColor || '#0f0c13'; x.fillRect(0, 0, this.w, this.h);
    if (!s) return;
    var m = s.map;
    x.setTransform(DPR * z, 0, 0, DPR * z, DPR * this.cam.ox, DPR * this.cam.oy);
    var v0 = this.toWorld(0, 0), v1 = this.toWorld(this.w, this.h);
    var cx0 = Math.max(0, Math.floor(v0.x)), cy0 = Math.max(0, Math.floor(v0.y)), cx1 = Math.min(m.cols, Math.ceil(v1.x)), cy1 = Math.min(m.rows, Math.ceil(v1.y));
    /* board */
    x.fillStyle = m.paper || '#1d1822'; x.fillRect(0, 0, m.cols, m.rows);
    if (this.bg && m.bg) { x.globalAlpha = m.bg.opacity == null ? 1 : m.bg.opacity; x.drawImage(this.bg, m.bg.x || 0, m.bg.y || 0, m.bg.w || m.cols, m.bg.h || m.rows); x.globalAlpha = 1; }
    /* terrain */
    var cells = m.cells || {}, k, parts;
    for (k in cells) {
      parts = k.split(','); var cx = +parts[0], cy = +parts[1];
      if (cx < cx0 - 1 || cx > cx1 || cy < cy0 - 1 || cy > cy1) continue;
      if (this.role !== 'dm' && !this.revealed(cx, cy)) continue;
      var t = TER[cells[k]]; if (!t) continue;
      x.save(); x.beginPath(); x.rect(cx, cy, 1.003, 1.003); x.clip();
      x.drawImage(texture(t), cx, cy, 1.003, 1.003); x.restore();
    }
    /* wall depth */
    for (k in cells) {
      if (cells[k] !== 'wall') continue; parts = k.split(','); var wx = +parts[0], wy = +parts[1];
      if (wx < cx0 - 1 || wx > cx1 || wy < cy0 - 1 || wy > cy1) continue;
      if (this.role !== 'dm' && !this.revealed(wx, wy)) continue;
      if (cells[wx + ',' + (wy - 1)] !== 'wall') { x.fillStyle = 'rgba(255,255,255,.14)'; x.fillRect(wx, wy, 1, .08); }
      if (cells[wx + ',' + (wy + 1)] !== 'wall') { var g = x.createLinearGradient(0, wy + 1, 0, wy + 1.35); g.addColorStop(0, 'rgba(0,0,0,.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(wx, wy + 1, 1, .35); }
    }
    /* grid */
    if (m.grid !== false && z > 9) {
      x.strokeStyle = m.gridColor || 'rgba(0,0,0,.28)'; x.lineWidth = 1 / z; x.beginPath();
      for (var gx = cx0; gx <= cx1; gx++) { x.moveTo(gx, cy0); x.lineTo(gx, cy1); }
      for (var gy = cy0; gy <= cy1; gy++) { x.moveTo(cx0, gy); x.lineTo(cx1, gy); }
      x.stroke();
    }
    x.strokeStyle = 'rgba(255,255,255,.2)'; x.lineWidth = 2 / z; x.strokeRect(0, 0, m.cols, m.rows);
    /* lasting templates under tokens */
    (s.templates || []).forEach(function (tp) { self.drawTemplate(tp, now); });
    /* props */
    (m.props || []).forEach(function (pr) {
      var def = T.PROPS[pr.kind]; if (!def) return;
      if (self.role !== 'dm' && !self.revealed(Math.floor(pr.x), Math.floor(pr.y))) return;
      var sz = pr.s || 1;
      if (def.glow) { var fl = 0.85 + Math.sin(now / 130 + pr.x * 7) * 0.06 + Math.sin(now / 47 + pr.y) * 0.04; var gg = x.createRadialGradient(pr.x + .5, pr.y + .5, 0, pr.x + .5, pr.y + .5, 2.6 * fl); gg.addColorStop(0, hexA(def.glow, .32)); gg.addColorStop(1, hexA(def.glow, 0)); x.fillStyle = gg; x.fillRect(pr.x - 2.5, pr.y - 2.5, 6, 6); }
      x.save(); x.translate(pr.x + sz / 2, pr.y + sz / 2); x.rotate((pr.r || 0) * Math.PI / 2); x.scale(sz, sz); def.draw(x); x.restore();
    });
    /* labels */
    (m.labels || []).forEach(function (lb) {
      if (self.role !== 'dm' && !self.revealed(Math.floor(lb.x), Math.floor(lb.y))) return;
      x.save(); x.translate(lb.x, lb.y); x.scale(1 / z, 1 / z);
      x.font = 'italic ' + Math.max(11, Math.min(22, z * .38)) + 'px Spectral, Georgia, serif'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.lineWidth = 4; x.strokeStyle = 'rgba(0,0,0,.75)'; x.strokeText(lb.text, 0, 0); x.fillStyle = '#f3ead2'; x.fillText(lb.text, 0, 0); x.restore();
    });
    /* fog */
    if (m.fogOn) {
      var fog = m.fog || {}, dm = this.role === 'dm';
      x.fillStyle = dm ? 'rgba(8,6,12,.55)' : '#050407';
      for (var fy = cy0; fy < cy1; fy++) for (var fx = cx0; fx < cx1; fx++) if (!fog[fx + ',' + fy]) x.fillRect(fx - .002, fy - .002, 1.004, 1.004);
      if (dm) { x.strokeStyle = 'rgba(160,140,200,.10)'; x.lineWidth = 1 / z; x.beginPath(); for (fy = cy0; fy < cy1; fy++) for (fx = cx0; fx < cx1; fx++) if (!fog[fx + ',' + fy]) { x.moveTo(fx, fy + 1); x.lineTo(fx + 1, fy); } x.stroke(); }
    }
    /* tool preview from the page (paint brush, room rectangle, fog brush, ruler, aim) */
    if (this.o.drawOverlay) this.o.drawOverlay(x, z, now);
    /* tokens */
    var toks = this.visibleTokens().filter(function (t) { return self.role === 'dm' || self.revealed(Math.floor(t.x + .01), Math.floor(t.y + .01)) || self.mine[t.id]; });
    var active = s.init && s.init.active ? s.init.order[s.init.turn] : null;
    var dragId = this.drag && this.drag.id;
    toks.sort(function (a, b) { return (a.id === dragId) - (b.id === dragId) || T.footprint(b) - T.footprint(a); });
    toks.forEach(function (t) { self.drawToken(t, now, t.id === active); });
    /* drag distance */
    if (this.drag && this.drag.kind === 'token') {
      var dt = this.find(this.drag.id);
      if (dt) {
        var f = Math.max(T.footprint(dt), 1), dist = Math.max(Math.abs(Math.round(dt.x) - this.drag.sx), Math.abs(Math.round(dt.y) - this.drag.sy)) * FT;
        x.strokeStyle = 'rgba(255,255,255,.6)'; x.setLineDash([.15, .12]); x.lineWidth = .05; x.beginPath(); x.moveTo(this.drag.sx + f / 2, this.drag.sy + f / 2); x.lineTo(dt.x + f / 2, dt.y + f / 2); x.stroke(); x.setLineDash([]);
        x.strokeStyle = 'rgba(255,255,255,.5)'; x.lineWidth = .04; x.strokeRect(Math.round(dt.x), Math.round(dt.y), f, f);
        pill(x, z, dt.x + f / 2, dt.y - .35, dist + ' ft');
      }
    }
    /* effects and pings */
    this.fx = this.fx.filter(function (e) { var p = (now - e.t0) / e.dur; if (p >= 1) return false; if (p >= 0) FX[e.kind](x, Math.max(0, p), e, z, now); return true; });
    this.pings = this.pings.filter(function (pg) {
      var p = (now - pg.t0) / 1600; if (p >= 1) return false;
      for (var i = 0; i < 3; i++) { var q = (p * 1.6 - i * .25); if (q < 0 || q > 1) continue; x.strokeStyle = hexA(pg.color || '#ffd76b', 1 - q); x.lineWidth = .08; x.beginPath(); x.arc(pg.x, pg.y, .2 + q * 1.4, 0, 7); x.stroke(); }
      if (pg.name && p < .8) pill(x, z, pg.x, pg.y - 1.1, pg.name);
      return true;
    });
  };
  function pill(x, z, wx, wy, text) {
    x.save(); x.translate(wx, wy); x.scale(1 / z, 1 / z);
    x.font = '600 12px Spectral, Georgia, serif'; var w = x.measureText(text).width + 12;
    x.fillStyle = 'rgba(10,8,14,.85)'; rr(x, -w / 2, -10, w, 20, 9); x.fill(); x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 0, 1); x.restore();
  }
  T.pill = pill;
  function hexA(hex, a) {
    if (hex.indexOf('rgb') === 0) return hex;
    var h = hex.replace('#', ''); if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + Math.max(0, Math.min(1, a)).toFixed(3) + ')';
  }
  T.hexA = hexA;
  var imgCache = {};
  function portrait(src) { if (!src) return null; if (!imgCache[src]) { var im = new Image(); im.src = src; imgCache[src] = im; } return imgCache[src].complete ? imgCache[src] : null; }
  View.prototype.drawToken = function (t, now, active) {
    var x = this.x, z = this.cam.z, f = T.footprint(t), box = Math.max(f, 1), r = f * .43, cx = t.x + box / 2, cy = t.y + box / 2, self = this;
    var dead = t.maxHp && t.hp <= 0;
    x.save();
    if (t.hidden) x.globalAlpha = .5;
    if (t.conditions && t.conditions.indexOf('invisible') > -1) x.globalAlpha = Math.min(x.globalAlpha, .55);
    if (active) { var pulse = .5 + Math.sin(now / 260) * .5; x.strokeStyle = hexA('#ffd76b', .35 + pulse * .45); x.lineWidth = .09 + pulse * .05; x.beginPath(); x.arc(cx, cy, r + .14, 0, 7); x.stroke(); }
    x.fillStyle = 'rgba(0,0,0,.4)'; x.beginPath(); x.arc(cx + .04, cy + .06, r, 0, 7); x.fill();
    x.fillStyle = t.color || '#888'; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
    var im = portrait(t.img);
    if (im) { x.save(); x.beginPath(); x.arc(cx, cy, r * .86, 0, 7); x.clip(); x.drawImage(im, cx - r * .86, cy - r * .86, r * 1.72, r * 1.72); x.restore(); }
    else {
      x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.arc(cx, cy, r * .82, 0, 7); x.fill();
      x.save(); x.translate(cx, cy); x.scale(1 / z, 1 / z); var fs = Math.max(9, r * z * .95);
      x.font = '600 ' + fs + 'px Spectral, Georgia, serif'; x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.fillText((t.glyph || (t.name || '?').slice(0, 1)).slice(0, 2), 0, fs * .05); x.restore();
    }
    x.strokeStyle = this.sel === t.id ? '#ffffff' : (this.mine[t.id] ? '#ffd76b' : 'rgba(0,0,0,.55)'); x.lineWidth = this.sel === t.id || this.mine[t.id] ? .07 : .04;
    x.beginPath(); x.arc(cx, cy, r, 0, 7); x.stroke();
    if (dead) { x.strokeStyle = 'rgba(207,74,88,.9)'; x.lineWidth = .08; x.beginPath(); x.moveTo(cx - r * .6, cy - r * .6); x.lineTo(cx + r * .6, cy + r * .6); x.moveTo(cx + r * .6, cy - r * .6); x.lineTo(cx - r * .6, cy + r * .6); x.stroke(); }
    /* health: DM sees everyone, players see party bars and a bloodied ring on others */
    var showBar = t.maxHp && (this.role === 'dm' || t.kind === 'pc' || this.mine[t.id]);
    if (showBar) {
      var bw = Math.max(.7, f * .8), frac = Math.max(0, Math.min(1, t.hp / t.maxHp)), by = cy + r + .08;
      x.fillStyle = 'rgba(0,0,0,.6)'; x.fillRect(cx - bw / 2, by, bw, .11);
      x.fillStyle = frac > .5 ? '#6ab04c' : frac > .25 ? '#e0a33a' : '#cf4a58'; x.fillRect(cx - bw / 2, by, bw * frac, .11);
    } else if (t.maxHp && t.hp / t.maxHp <= .5 && !dead) { x.strokeStyle = 'rgba(207,74,88,.85)'; x.lineWidth = .06; x.setLineDash([.12, .08]); x.beginPath(); x.arc(cx, cy, r + .06, 0, 7); x.stroke(); x.setLineDash([]); }
    /* conditions */
    (t.conditions || []).slice(0, 6).forEach(function (cnd, i) {
      var a = -Math.PI / 2 + (i - ((t.conditions.length - 1) / 2)) * .5;
      x.fillStyle = COND_COLOR[cnd] || '#ccc'; x.strokeStyle = 'rgba(0,0,0,.7)'; x.lineWidth = .025;
      x.beginPath(); x.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, .09, 0, 7); x.fill(); x.stroke();
    });
    if (this.hover === t.id || this.sel === t.id || (this.o.showNames && this.o.showNames())) {
      x.globalAlpha = 1; pill(x, z, cx, t.y - .22, t.name || '');
    }
    x.restore();
  };
  View.prototype.drawTemplate = function (tp, now) {
    var x = this.x, sp = SP[tp.spell], r = (tp.size || (sp && sp.size) || 10) / FT, t = now / 1000;
    if (!sp) return;
    if (tp.spell === 'darkness') {
      var g = x.createRadialGradient(tp.x, tp.y, r * .2, tp.x, tp.y, r); g.addColorStop(0, 'rgba(0,0,0,.92)'); g.addColorStop(.85, 'rgba(0,0,0,.85)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.beginPath(); x.arc(tp.x, tp.y, r, 0, 7); x.fill(); return;
    }
    if (tp.spell === 'moonbeam') {
      var p = .6 + Math.sin(t * 2) * .15, g2 = x.createRadialGradient(tp.x, tp.y, 0, tp.x, tp.y, r * 1.4);
      g2.addColorStop(0, 'rgba(230,245,255,' + (.75 * p) + ')'); g2.addColorStop(.7, 'rgba(180,215,255,' + (.35 * p) + ')'); g2.addColorStop(1, 'rgba(180,215,255,0)');
      x.fillStyle = g2; x.beginPath(); x.arc(tp.x, tp.y, r * 1.4, 0, 7); x.fill(); return;
    }
    if (tp.spell === 'spiritguardians') {
      x.strokeStyle = 'rgba(255,215,107,.35)'; x.lineWidth = .05; x.beginPath(); x.arc(tp.x, tp.y, r, 0, 7); x.stroke();
      x.fillStyle = 'rgba(255,215,107,.06)'; x.beginPath(); x.arc(tp.x, tp.y, r, 0, 7); x.fill();
      for (var i = 0; i < 9; i++) { var a = t * .9 + i / 9 * Math.PI * 2, rr2 = r * (.55 + .35 * Math.sin(t * 1.3 + i)); x.fillStyle = 'rgba(255,230,150,.8)'; x.beginPath(); x.arc(tp.x + Math.cos(a) * rr2, tp.y + Math.sin(a) * rr2, .09, 0, 7); x.fill(); }
      return;
    }
    x.strokeStyle = hexA(sp.color, .6); x.fillStyle = hexA(sp.color, .12); x.lineWidth = .05; x.beginPath(); x.arc(tp.x, tp.y, r, 0, 7); x.fill(); x.stroke();
  };

  /* draws an area outline for aiming (the same shapes the math uses) */
  T.drawArea = function (x, sp, g, z, col) {
    var r = (sp.size || 0) / FT; col = col || sp.color || '#fff';
    x.save(); x.fillStyle = hexA(col, .16); x.strokeStyle = hexA(col, .85); x.lineWidth = 2 / z; x.setLineDash([6 / z, 4 / z]);
    if (sp.shape === 'sphere' || sp.shape === 'aura') { x.beginPath(); x.arc(g.x, g.y, r, 0, 7); x.fill(); x.stroke(); }
    else if (sp.shape === 'line' || sp.shape === 'cone' || sp.shape === 'cube') {
      var dx = g.x - g.ox, dy = g.y - g.oy, L = Math.sqrt(dx * dx + dy * dy) || 1, ux = dx / L, uy = dy / L, px = -uy, py = ux;
      x.beginPath();
      if (sp.shape === 'line') { var hw = (sp.width || 5) / FT / 2; x.moveTo(g.ox + px * hw, g.oy + py * hw); x.lineTo(g.ox + ux * r + px * hw, g.oy + uy * r + py * hw); x.lineTo(g.ox + ux * r - px * hw, g.oy + uy * r - py * hw); x.lineTo(g.ox - px * hw, g.oy - py * hw); }
      else if (sp.shape === 'cone') { x.moveTo(g.ox, g.oy); x.lineTo(g.ox + ux * r + px * r / 2, g.oy + uy * r + py * r / 2); x.lineTo(g.ox + ux * r - px * r / 2, g.oy + uy * r - py * r / 2); }
      else { x.moveTo(g.ox + px * r / 2, g.oy + py * r / 2); x.lineTo(g.ox + ux * r + px * r / 2, g.oy + uy * r + py * r / 2); x.lineTo(g.ox + ux * r - px * r / 2, g.oy + uy * r - py * r / 2); x.lineTo(g.ox - px * r / 2, g.oy - py * r / 2); }
      x.closePath(); x.fill(); x.stroke();
    }
    x.restore();
  };

  /* ---------- spell animations ---------- */
  function ease(p) { return 1 - Math.pow(1 - p, 3); }
  function parts(e, n, fn) { if (!e.parts) { var r = rng(Math.floor(e.t0) + n); e.parts = []; for (var i = 0; i < n; i++) e.parts.push(fn(r, i)); } return e.parts; }
  function glowDot(x, px, py, r, col, a) { var g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, hexA('#ffffff', a)); g.addColorStop(.35, hexA(col, a)); g.addColorStop(1, hexA(col, 0)); x.fillStyle = g; x.beginPath(); x.arc(px, py, r, 0, 7); x.fill(); }
  function dirOf(g) { var dx = g.x - g.ox, dy = g.y - g.oy, L = Math.sqrt(dx * dx + dy * dy) || 1; return { ux: dx / L, uy: dy / L, L: L }; }
  var FX = {
    fireball: function (x, p, e) {
      var g = e.g, R = 20 / FT;
      if (p < .22) { var q = p / .22, bx = g.ox + (g.x - g.ox) * ease(q), by = g.oy + (g.y - g.oy) * ease(q); glowDot(x, bx, by, .35, '#ff7a2f', 1); for (var i = 1; i < 6; i++) glowDot(x, bx - (g.x - g.ox) * .04 * i, by - (g.y - g.oy) * .04 * i, .25 - i * .03, '#ff5a1f', .5 - i * .08); return; }
      var t = (p - .22) / .78, er = ease(Math.min(1, t * 1.8));
      var core = x.createRadialGradient(g.x, g.y, 0, g.x, g.y, R * er);
      var a = Math.pow(1 - t, 1.4);
      core.addColorStop(0, 'rgba(255,250,210,' + a + ')'); core.addColorStop(.35, 'rgba(255,170,60,' + a * .95 + ')'); core.addColorStop(.75, 'rgba(220,60,20,' + a * .7 + ')'); core.addColorStop(1, 'rgba(120,20,10,0)');
      x.fillStyle = core; x.beginPath(); x.arc(g.x, g.y, R * er, 0, 7); x.fill();
      x.strokeStyle = 'rgba(255,220,150,' + (1 - t) * .8 + ')'; x.lineWidth = .12 * (1 - t); x.beginPath(); x.arc(g.x, g.y, R * ease(t) * 1.05, 0, 7); x.stroke();
      parts(e, 90, function (r) { return { a: r() * Math.PI * 2, v: .5 + r() * .8, s: .05 + r() * .12, d: r() * .3 }; }).forEach(function (pt) {
        var q = Math.max(0, t - pt.d) / (1 - pt.d), dist = R * pt.v * ease(q) * 1.1; if (q <= 0) return;
        glowDot(x, g.x + Math.cos(pt.a) * dist, g.y + Math.sin(pt.a) * dist, pt.s * (1.4 - q), q < .5 ? '#ffb347' : '#ff5a1f', (1 - q));
      });
      if (t > .35) for (var k = 0; k < 7; k++) { var sa = k / 7 * Math.PI * 2 + 1, sq = (t - .35) / .65, sr = R * (.3 + .6 * sq); x.fillStyle = 'rgba(60,50,55,' + (.35 * (1 - sq)) + ')'; x.beginPath(); x.arc(g.x + Math.cos(sa) * sr * .5, g.y + Math.sin(sa) * sr * .5 - sq * .8, R * .25 * (.5 + sq), 0, 7); x.fill(); }
    },
    lightning: function (x, p, e, z, now) {
      var g = e.g, d = dirOf(g), R = 100 / FT, a = p < .7 ? 1 : (1 - p) / .3, seed = Math.floor(now / 55), r = rng(seed + 7), px = -d.uy, py = d.ux;
      for (var b = 0; b < 2; b++) {
        x.beginPath(); x.moveTo(g.ox, g.oy);
        for (var i = 1; i <= 18; i++) { var t = i / 18, off = i === 18 ? 0 : (r() - .5) * .9; x.lineTo(g.ox + d.ux * R * t + px * off, g.oy + d.uy * R * t + py * off); }
        x.strokeStyle = 'rgba(120,190,255,' + .35 * a + ')'; x.lineWidth = .5; x.stroke();
        x.strokeStyle = 'rgba(230,245,255,' + a + ')'; x.lineWidth = .08; x.stroke();
      }
      glowDot(x, g.ox, g.oy, .6, '#9fd8ff', a);
    },
    cone: function (x, p, e) {
      var g = e.g, sp = SP[e.spell], d = dirOf(g), R = sp.size / FT, cold = sp.type === 'cold', col = sp.color;
      var a = p < .75 ? 1 : (1 - p) / .25;
      var fill = x.createRadialGradient(g.ox, g.oy, 0, g.ox, g.oy, R); fill.addColorStop(0, hexA(cold ? '#e8f6ff' : '#fff2b0', .42 * a)); fill.addColorStop(.6, hexA(col, .16 * a)); fill.addColorStop(1, hexA(col, 0));
      x.fillStyle = fill; x.beginPath(); x.moveTo(g.ox, g.oy); var px = -d.uy, py = d.ux; x.lineTo(g.ox + d.ux * R + px * R / 2, g.oy + d.uy * R + py * R / 2); x.lineTo(g.ox + d.ux * R - px * R / 2, g.oy + d.uy * R - py * R / 2); x.closePath(); x.fill();
      parts(e, 120, function (r) { return { s: (r() - .5), d: r() * .6, v: .6 + r() * .4, sz: .04 + r() * .1 }; }).forEach(function (pt) {
        var q = (p * 1.2 - pt.d); if (q < 0 || q > 1) return; var dist = R * pt.v * q, across = pt.s * dist, cx = g.ox + d.ux * dist + px * across, cy = g.oy + d.uy * dist + py * across;
        if (cold) { x.strokeStyle = 'rgba(235,248,255,' + (1 - q) + ')'; x.lineWidth = .04; x.beginPath(); x.moveTo(cx, cy); x.lineTo(cx - d.ux * pt.sz * 2.5, cy - d.uy * pt.sz * 2.5); x.stroke(); }
        else glowDot(x, cx, cy, pt.sz * 2.2, q < .4 ? '#ffd36b' : '#ff6a2a', 1 - q);
      });
    },
    thunderwave: function (x, p, e) {
      var g = e.g, d = dirOf(g), R = 15 / FT, px = -d.uy, py = d.ux;
      for (var i = 0; i < 3; i++) {
        var q = p * 1.5 - i * .2; if (q < 0 || q > 1) continue; var reach = R * ease(q);
        x.strokeStyle = 'rgba(200,215,255,' + (1 - q) + ')'; x.lineWidth = .12 * (1 - q) + .02;
        x.beginPath(); x.moveTo(g.ox + d.ux * reach + px * R / 2, g.oy + d.uy * reach + py * R / 2); x.lineTo(g.ox + d.ux * reach - px * R / 2, g.oy + d.uy * reach - py * R / 2); x.stroke();
      }
      x.globalAlpha = 1 - p; T.drawArea(x, SP.thunderwave, g, 1000, '#b9c8ff'); x.globalAlpha = 1;
    },
    shatter: function (x, p, e) {
      var g = e.g, R = 10 / FT, q = ease(p);
      x.strokeStyle = 'rgba(240,235,255,' + (1 - p) + ')'; x.lineWidth = .1 * (1 - p); x.beginPath(); x.arc(g.x, g.y, R * q, 0, 7); x.stroke();
      parts(e, 14, function (r) { return { a: r() * 7, j: [r(), r(), r()] }; }).forEach(function (c) {
        x.beginPath(); x.moveTo(g.x, g.y); var cx = g.x, cy = g.y;
        for (var k = 0; k < 3; k++) { cx += Math.cos(c.a + (c.j[k] - .5)) * R * q / 3; cy += Math.sin(c.a + (c.j[k] - .5)) * R * q / 3; x.lineTo(cx, cy); }
        x.strokeStyle = 'rgba(255,255,255,' + (1 - p) * .9 + ')'; x.lineWidth = .04; x.stroke();
      });
      glowDot(x, g.x, g.y, R * .5 * (1 - p), '#e8e4ff', 1 - p);
    },
    icestorm: function (x, p, e) {
      var g = e.g, R = 20 / FT;
      x.fillStyle = 'rgba(214,240,255,' + .18 * (1 - p) + ')'; x.beginPath(); x.arc(g.x, g.y, R, 0, 7); x.fill();
      parts(e, 110, function (r) { var a = r() * 7, d = Math.sqrt(r()) * R; return { x: g.x + Math.cos(a) * d, y: g.y + Math.sin(a) * d, t: r() * .7, s: .05 + r() * .07 }; }).forEach(function (h) {
        var q = (p - h.t) / .25; if (q < 0) return;
        if (q < 1) { var hy = h.y - (1 - q) * 3.5; x.fillStyle = 'rgba(240,250,255,.95)'; x.beginPath(); x.arc(h.x - (1 - q) * .8, hy, h.s, 0, 7); x.fill(); }
        else if (q < 1.8) { var sq = q - 1; x.strokeStyle = 'rgba(240,250,255,' + (1 - sq / .8) + ')'; x.lineWidth = .025; x.beginPath(); x.arc(h.x, h.y, h.s + sq * .3, 0, 7); x.stroke(); }
      });
    },
    missiles: function (x, p, e) {
      var g = e.g, n = 3;
      for (var i = 0; i < n; i++) {
        var q = (p * 1.4 - i * .12); if (q < 0) continue;
        var bend = (i - 1) * 1.6, mx = (g.ox + g.x) / 2 - (g.y - g.oy) * .15 * bend, my = (g.oy + g.y) / 2 + (g.x - g.ox) * .15 * bend;
        if (q <= 1) {
          for (var k = 0; k < 6; k++) { var qq = Math.max(0, q - k * .04), u = 1 - qq, bx = u * u * g.ox + 2 * u * qq * mx + qq * qq * g.x, by = u * u * g.oy + 2 * u * qq * my + qq * qq * g.y; glowDot(x, bx, by, .22 - k * .03, '#c98bff', 1 - k * .15); }
        } else if (q < 1.6) { var s = (q - 1) / .6; for (var j = 0; j < 8; j++) { var a = j / 8 * 7; glowDot(x, g.x + Math.cos(a) * s * .7, g.y + Math.sin(a) * s * .7, .1, '#e2c4ff', 1 - s); } }
      }
    },
    beam: function (x, p, e, z, now) {
      var g = e.g, sp = SP[e.spell], a = p < .6 ? 1 : (1 - p) / .4, r = rng(Math.floor(now / 60));
      x.strokeStyle = hexA(sp.color, .35 * a); x.lineWidth = .4; x.beginPath(); x.moveTo(g.ox, g.oy); x.lineTo(g.x, g.y); x.stroke();
      x.beginPath(); x.moveTo(g.ox, g.oy); for (var i = 1; i <= 10; i++) { var t = i / 10, j = i === 10 ? 0 : (r() - .5) * .3; x.lineTo(g.ox + (g.x - g.ox) * t + j, g.oy + (g.y - g.oy) * t + j); }
      x.strokeStyle = hexA('#ffffff', a); x.lineWidth = .06; x.stroke();
      for (var k = 0; k < 3; k++) { var q = (p * 2 - k * .2); if (q < 0 || q > 1) continue; x.strokeStyle = hexA(sp.color, 1 - q); x.lineWidth = .06; x.beginPath(); x.arc(g.x, g.y, .2 + q * .9, 0, 7); x.stroke(); }
    },
    flame: function (x, p, e) {
      var g = e.g, a = p < .7 ? 1 : (1 - p) / .3, h = 2.8 * ease(Math.min(1, p * 3));
      var gr = x.createLinearGradient(g.x, g.y - h, g.x, g.y + .3); gr.addColorStop(0, 'rgba(255,240,170,0)'); gr.addColorStop(.6, 'rgba(255,225,120,' + .75 * a + ')'); gr.addColorStop(1, 'rgba(255,250,220,' + a + ')');
      x.fillStyle = gr; x.beginPath(); x.moveTo(g.x - .35, g.y + .3); x.quadraticCurveTo(g.x - .2, g.y - h * .6, g.x, g.y - h); x.quadraticCurveTo(g.x + .2, g.y - h * .6, g.x + .35, g.y + .3); x.fill();
      parts(e, 30, function (r) { return { x: (r() - .5) * .7, d: r() * .6, s: .04 + r() * .06 }; }).forEach(function (pt) { var q = p - pt.d; if (q < 0) return; glowDot(x, g.x + pt.x, g.y - q * 3, pt.s * 2, '#ffe48a', Math.max(0, 1 - q * 1.5)); });
    },
    heal: function (x, p, e) {
      var g = e.g, col = SP[e.spell].color;
      glowDot(x, g.x, g.y, .9 * ease(Math.min(1, p * 2)), col, .5 * (1 - p));
      parts(e, 26, function (r) { return { x: (r() - .5) * 1.2, y: (r() - .5) * .6, d: r() * .5, plus: r() > .6 }; }).forEach(function (pt) {
        var q = (p - pt.d) / .5; if (q < 0 || q > 1) return; var px = g.x + pt.x, py = g.y + pt.y - q * 1.3;
        if (pt.plus) { x.strokeStyle = hexA(col, 1 - q); x.lineWidth = .06; x.beginPath(); x.moveTo(px - .1, py); x.lineTo(px + .1, py); x.moveTo(px, py - .1); x.lineTo(px, py + .1); x.stroke(); }
        else glowDot(x, px, py, .08, col, 1 - q);
      });
    },
    mist: function (x, p, e) {
      var g = e.g;
      [[g.ox, g.oy, Math.min(1, p * 2)], [g.x, g.y, Math.max(0, p * 2 - .6)]].forEach(function (pt, k) {
        var q = pt[2]; if (q <= 0 || q >= 1.4) return;
        parts(e, 40, function (r) { return { a: r() * 7, v: .4 + r() * .8, s: .15 + r() * .25 }; }).forEach(function (m, i) {
          if (i % 2 !== k) return; var d = m.v * ease(Math.min(1, q)) * .9; x.fillStyle = 'rgba(225,232,245,' + .45 * (1 - Math.min(1, q)) + ')'; x.beginPath(); x.arc(pt[0] + Math.cos(m.a) * d, pt[1] + Math.sin(m.a) * d, m.s, 0, 7); x.fill();
        });
      });
    },
    gather: function (x, p, e) {
      var g = e.g, sp = SP[e.spell], R = (sp.size || 10) / FT;
      x.globalAlpha = Math.min(1, p * 3) * (1 - Math.max(0, p - .7) / .3);
      if (e.spell === 'darkness') { var gd = x.createRadialGradient(g.x, g.y, 0, g.x, g.y, R * ease(p)); gd.addColorStop(0, 'rgba(0,0,0,.9)'); gd.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = gd; x.beginPath(); x.arc(g.x, g.y, R * ease(p), 0, 7); x.fill(); }
      else { x.strokeStyle = sp.color; x.lineWidth = .06; x.beginPath(); x.arc(g.x, g.y, R * (1.6 - ease(p) * .6), 0, 7); x.stroke(); glowDot(x, g.x, g.y, R * .6 * ease(p), sp.color, .6); }
      x.globalAlpha = 1;
    },
    wild: function (x, p, e) {
      var g = e.g, R = 15 / FT, cols = ['#ff5ec4', '#ffd23f', '#3fd4ff', '#7dff6b', '#b46bff', '#ff8a3c'];
      parts(e, 120, function (r) { return { a: r() * 7, v: .3 + r(), c: cols[Math.floor(r() * 6)], rot: r() * 7, w: r() > .85 }; }).forEach(function (c, i) {
        var q = ease(p), d = R * c.v * q, cx = g.x + Math.cos(c.a) * d, cy = g.y + Math.sin(c.a) * d + p * p * 1.5;
        x.save(); x.translate(cx, cy); x.rotate(c.rot + p * 10); x.globalAlpha = 1 - p;
        if (c.w) { x.fillStyle = c.c; x.beginPath(); x.ellipse(0, -p * 2, .16, .2, 0, 0, 7); x.fill(); x.strokeStyle = 'rgba(255,255,255,.6)'; x.lineWidth = .015; x.beginPath(); x.moveTo(0, -p * 2 + .2); x.lineTo(0, -p * 2 + .5); x.stroke(); }
        else { x.fillStyle = c.c; x.fillRect(-.07, -.03, .14, .06); }
        x.restore();
      });
      x.globalAlpha = 1;
    }
  };
  var KIND = { fireball: 'fireball', lightning: 'lightning', coneofcold: 'cone', burninghands: 'cone', thunderwave: 'thunderwave', shatter: 'shatter', icestorm: 'icestorm',
    magicmissile: 'missiles', eldritch: 'beam', guidingbolt: 'beam', sacredflame: 'flame', healingword: 'heal', curewounds: 'heal', mistystep: 'mist',
    darkness: 'gather', spiritguardians: 'gather', moonbeam: 'gather', wildmagic: 'wild' };
  var DUR = { fireball: 1900, lightning: 1000, cone: 1300, thunderwave: 1000, shatter: 1100, icestorm: 2200, missiles: 1500, beam: 1000, flame: 1400, heal: 1500, mist: 1400, gather: 1300, wild: 2200 };
  View.prototype.play = function (spell, g) {
    var kind = KIND[spell]; if (!kind) return;
    this.fx.push({ kind: kind, spell: spell, g: g, t0: performance.now(), dur: DUR[kind] }); this.dirty = true;
  };
  View.prototype.ping = function (wx, wy, color, name) { this.pings.push({ x: wx, y: wy, color: color, name: name, t0: performance.now() }); this.dirty = true; };

  T.uid = function () { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); };
  T.FT = FT;
  window.MBTable = T;
})();
