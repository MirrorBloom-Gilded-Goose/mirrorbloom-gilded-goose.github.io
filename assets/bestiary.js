/* The Bestiary: what serves each power, as silhouettes seen from a safe distance.
   Stat blocks stay in the Sanctum; the link to each one only shows when it is open. */
(function () {
  var host = document.getElementById('bestiary'); if (!host) return;
  var esc = MBSite.esc, S = window.MBSigils;

  /* each silhouette is drawn on a 200 x 200 grid. M(...) cuts holes: anything drawn in it shows the background. */
  function M(id, holes) {
    return '<mask id="m-' + id + '" maskUnits="userSpaceOnUse" x="0" y="0" width="200" height="200"><rect width="200" height="200" fill="#fff"/><g fill="#000" stroke="#000">' + holes + '</g></mask>';
  }
  var ART = {
    butterfly:
      '<circle cx="100" cy="100" r="74" class="glow" opacity=".1"/>' +
      M('butterfly', '<circle cx="62" cy="68" r="7" stroke="none"/><circle cx="138" cy="68" r="7" stroke="none"/><circle cx="74" cy="134" r="5" stroke="none"/><circle cx="126" cy="134" r="5" stroke="none"/>') +
      '<g mask="url(#m-butterfly)">' +
        '<g class="wing-l"><path d="M98 98 C82 58 50 34 32 46 C16 58 30 92 58 102 C72 106 88 104 98 104 Z"/><path d="M98 106 C80 108 58 116 52 136 C48 154 66 162 80 148 C90 138 96 122 98 110 Z"/></g>' +
        '<g class="wing-r"><path d="M102 98 C118 58 150 34 168 46 C184 58 170 92 142 102 C128 106 112 104 102 104 Z"/><path d="M102 106 C120 108 142 116 148 136 C152 154 134 162 120 148 C110 138 104 122 102 110 Z"/></g>' +
      '</g>' +
      '<ellipse cx="100" cy="106" rx="4.5" ry="26"/>' +
      '<path d="M98 82 C94 68 88 60 80 56 M102 82 C106 68 112 60 120 56" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>' +
      '<circle cx="80" cy="56" r="3"/><circle cx="120" cy="56" r="3"/>',

    forgotten:
      M('forgotten', '<ellipse cx="100" cy="74" rx="17" ry="22" stroke="none"/>') +
      '<path mask="url(#m-forgotten)" d="M100 30 C72 30 60 56 62 84 C64 104 56 128 44 156 C38 170 34 180 34 186 L166 186 C166 180 162 170 156 156 C144 128 136 104 138 84 C140 56 128 30 100 30 Z"/>' +
      '<ellipse class="blank" cx="100" cy="74" rx="12.5" ry="17.5" opacity=".38"/>' +
      '<path d="M84 128 C92 134 108 134 116 128 L114 140 C106 144 94 144 86 140 Z" opacity=".5"/>',

    sprite:
      '<g class="trail"><path d="M70 150 l3 -8 l3 8 l-3 8 Z M54 166 l2 -6 l2 6 l-2 6 Z M40 178 l1.6 -5 l1.6 5 l-1.6 5 Z" /></g>' +
      '<g class="bob">' +
        '<g class="wings" opacity=".55"><ellipse cx="78" cy="86" rx="26" ry="9" transform="rotate(-28 78 86)"/><ellipse cx="122" cy="86" rx="26" ry="9" transform="rotate(28 122 86)"/>' +
        '<ellipse cx="82" cy="104" rx="18" ry="6.5" transform="rotate(18 82 104)"/><ellipse cx="118" cy="104" rx="18" ry="6.5" transform="rotate(-18 118 104)"/></g>' +
        '<circle cx="100" cy="78" r="10"/><path d="M100 90 C91 102 92 122 100 134 C108 122 109 102 100 90 Z"/>' +
        '<path d="M96 70 C92 60 88 56 82 54 M104 70 C108 60 112 56 118 54" fill="none" stroke="currentColor" stroke-width="2"/>' +
        '<path d="M100 40 l3 -9 l3 9 l9 3 l-9 3 l-3 9 l-3 -9 l-9 -3 Z" transform="translate(-3 -2) scale(.9)" class="twinkle"/>' +
      '</g>',

    echo:
      '<g transform="translate(12 0)"><g class="echo e2" opacity=".14"><path d="M100 42 C78 42 70 62 70 82 L70 152 C75 162 80 152 85 160 C90 168 95 154 100 162 C105 170 110 154 115 162 C120 168 125 152 130 158 L130 82 C130 62 122 42 100 42 Z"/></g>' +
      '<g class="echo e1" opacity=".3"><path d="M100 42 C78 42 70 62 70 82 L70 152 C75 162 80 152 85 160 C90 168 95 154 100 162 C105 170 110 154 115 162 C120 168 125 152 130 158 L130 82 C130 62 122 42 100 42 Z"/></g>' +
      M('echo', '<ellipse cx="90" cy="80" rx="5" ry="8" stroke="none"/><ellipse cx="110" cy="80" rx="5" ry="8" stroke="none"/><ellipse cx="100" cy="104" rx="6" ry="9" stroke="none"/>') +
      '<path mask="url(#m-echo)" opacity=".85" d="M100 42 C78 42 70 62 70 82 L70 152 C75 162 80 152 85 160 C90 168 95 154 100 162 C105 170 110 154 115 162 C120 168 125 152 130 158 L130 82 C130 62 122 42 100 42 Z"/></g>',

    thorn:
      '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M100 62 C95 92 106 112 98 142" stroke-width="11"/>' +
        '<path d="M98 140 C90 156 84 170 76 188 M98 140 C108 158 114 172 122 188" stroke-width="8"/>' +
        '<path d="M100 76 C82 80 66 92 52 112 M100 76 C120 78 136 70 150 54" stroke-width="7"/>' +
        '<path d="M66 92 L56 82 M136 70 L144 82 M58 104 L48 100 M84 168 L72 164 M116 172 L128 166 M96 118 L84 112 M104 98 L116 94" stroke-width="3.5"/>' +
        '<path d="M86 42 C80 30 92 22 100 30 C108 20 122 28 116 40 C126 46 120 62 108 60 C100 68 86 64 88 56 C78 54 78 44 86 42 Z" stroke-width="5"/>' +
      '</g>' +
      '<path d="M92 50 l4 -3 l1 5 Z M108 44 l5 0 l-2 4 Z M75 120 l-6 -2 l4 -4 Z M118 124 l6 0 l-3 5 Z M88 154 l-5 3 l0 -6 Z" />' +
      '<g class="blooms"><g transform="translate(150 52)">' + petals() + '</g><g transform="translate(52 114)">' + petals() + '</g><g transform="translate(112 32) scale(.8)">' + petals() + '</g></g>',

    crawler:
      '<g class="spores"><circle cx="70" cy="56" r="3"/><circle cx="96" cy="40" r="2.4"/><circle cx="128" cy="50" r="3.2"/><circle cx="148" cy="66" r="2"/></g>' +
      '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M62 136 L42 150 L34 176 M78 146 L66 166 L64 186 M100 150 L100 170 L96 188 M122 146 L134 166 L138 186 M138 136 L158 150 L166 176"/>' +
      '</g>' +
      M('crawler', '<circle cx="80" cy="128" r="4" stroke="none"/><circle cx="92" cy="132" r="3" stroke="none"/><circle cx="74" cy="118" r="2.6" stroke="none"/>') +
      '<ellipse mask="url(#m-crawler)" cx="100" cy="122" rx="54" ry="30"/>' +
      '<path d="M70 102 C68 86 74 78 80 78 C86 78 92 88 90 104 Z"/><ellipse cx="80" cy="78" rx="18" ry="10"/>' +
      '<path d="M108 98 C106 74 112 62 118 62 C124 62 130 76 128 98 Z"/><ellipse cx="118" cy="62" rx="24" ry="13"/>' +
      '<path d="M138 106 C138 94 142 88 146 88 C150 88 152 96 150 108 Z"/><ellipse cx="146" cy="88" rx="12" ry="7"/>',

    courtier:
      '<path d="M100 74 C88 74 84 86 86 96 L64 188 L136 188 L114 96 C116 86 112 74 100 74 Z"/>' +
      '<path d="M76 78 Q82 70 88 78 Q94 70 100 78 Q106 70 112 78 Q118 70 124 78 Q118 88 100 88 Q82 88 76 78 Z"/>' +
      '<circle cx="100" cy="56" r="15"/>' +
      '<path d="M108 40 C112 24 124 16 134 14 C126 22 120 30 116 42 Z M104 40 C104 26 110 16 118 10 C114 20 112 30 112 42 Z"/>' +
      '<g class="mask-hand">' +
        '<path d="M114 96 C128 100 140 92 146 76" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>' +
        '<path d="M146 76 L136 52" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>' +
        M('courtier', '<ellipse cx="114" cy="48" rx="7" ry="4.5" stroke="none" transform="rotate(-12 114 48)"/><ellipse cx="140" cy="44" rx="7" ry="4.5" stroke="none" transform="rotate(10 140 44)"/><path d="M116 60 Q127 70 138 58" fill="none" stroke-width="3"/>') +
        '<path mask="url(#m-courtier)" d="M104 46 C108 34 122 36 127 42 C132 34 148 32 152 42 C156 54 146 66 127 68 C110 68 100 58 104 46 Z"/>' +
      '</g>',

    jester:
      '<g class="bells"><circle cx="34" cy="62" r="7"/><circle cx="100" cy="16" r="7"/><circle cx="166" cy="62" r="7"/></g>' +
      '<path d="M54 98 C48 80 40 70 34 68 C48 66 62 72 72 84 C76 60 88 34 100 22 C112 34 124 60 128 84 C138 72 152 66 166 68 C160 70 152 80 146 98 Z"/>' +
      M('jester', '<path d="M80 112 l12 10 M92 112 l-12 10 M108 112 l12 10 M120 112 l-12 10" fill="none" stroke-width="3.6" stroke-linecap="round"/>' +
        '<path d="M76 140 Q100 160 124 140" fill="none" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M82 136 l-3 9 M92 141 l-1 10 M100 143 l0 10 M108 141 l1 10 M118 136 l3 9" fill="none" stroke-width="2.2" stroke-linecap="round"/>' +
        '<path d="M100 96 l0 6 M100 106 l0 6" fill="none" stroke-width="2.2" stroke-linecap="round"/>') +
      '<path mask="url(#m-jester)" d="M58 96 L142 96 C146 120 138 156 100 166 C62 156 54 120 58 96 Z"/>' +
      '<path d="M66 170 Q100 182 134 170 L150 196 L50 196 Z" opacity=".75"/>',

    notion:
      '<g class="drift">' +
        M('notion', '<path d="M100 102 m0 0 c4 -6 13 -2 11 6 c-2 10 -18 10 -21 -1 c-4 -14 13 -24 26 -15 c14 10 8 34 -12 35" fill="none" stroke-width="4" stroke-linecap="round"/>') +
        '<g mask="url(#m-notion)"><circle cx="78" cy="100" r="26"/><circle cx="104" cy="86" r="30"/><circle cx="130" cy="102" r="24"/><circle cx="102" cy="116" r="24"/></g>' +
        '<path d="M60 116 C46 124 36 136 26 136 C38 140 52 136 64 126 Z M76 126 C70 142 58 154 46 160 C60 160 74 150 84 132 Z" opacity=".6"/>' +
        '<circle cx="36" cy="150" r="3" opacity=".5"/><circle cx="24" cy="164" r="2" opacity=".35"/>' +
      '</g>',

    watcher:
      M('watcher', '<circle cx="86" cy="52" r="11" stroke="none"/><circle cx="114" cy="52" r="11" stroke="none"/>') +
      '<path mask="url(#m-watcher)" d="M100 26 C80 26 70 40 72 58 C73 70 80 78 88 82 L84 92 C66 96 58 108 56 124 L50 188 L66 188 L70 132 L74 188 L126 188 L130 132 L134 188 L150 188 L144 124 C142 108 134 96 116 92 L112 82 C120 78 127 70 128 58 C130 40 120 26 100 26 Z"/>' +
      '<circle class="pupil" cx="86" cy="52" r="3"/><circle class="pupil" cx="114" cy="52" r="3"/>' +
      '<path d="M58 124 C46 140 40 160 38 182 M142 124 C154 140 160 160 162 182" fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"/>',

    setter:
      '<g class="tray">' +
        '<rect x="56" y="62" width="88" height="6" rx="3"/>' +
        '<path d="M74 60 C72 46 80 38 92 38 C104 38 112 46 110 60 Z"/><path d="M110 50 C118 48 122 44 126 38" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M74 46 C66 46 64 56 72 58" fill="none" stroke="currentColor" stroke-width="3.5"/><circle cx="92" cy="34" r="4"/>' +
        '<path d="M124 60 L122 50 L136 50 L134 60 Z"/>' +
        '<path class="steam" d="M90 30 C86 24 94 20 90 12 M130 46 C126 40 134 36 130 28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" opacity=".6"/>' +
      '</g>' +
      '<path d="M78 112 C72 98 64 84 62 68 M122 112 C128 98 136 84 138 68" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>' +
      M('setter', '<circle cx="93" cy="100" r="3.2" stroke="none"/><circle cx="107" cy="100" r="3.2" stroke="none"/><path d="M93 109 Q100 115 107 109" fill="none" stroke-width="2.6" stroke-linecap="round"/>' +
        '<path d="M84 140 L116 140 L120 176 L80 176 Z" stroke="none" opacity=".55"/>') +
      '<g mask="url(#m-setter)"><circle cx="100" cy="104" r="20"/><path d="M100 118 C76 118 68 150 74 182 L126 182 C132 150 124 118 100 118 Z"/></g>',

    guest:
      '<path d="M48 40 C48 30 76 30 76 40 L76 150 L48 150 Z" opacity=".55"/>' +
      '<path class="web" d="M48 40 L96 70 M60 34 L96 70 M48 60 L96 70 M58 46 Q66 56 52 62 M68 40 Q76 54 54 76" fill="none" stroke="currentColor" stroke-width="1.2" opacity=".55"/>' +
      '<circle cx="96" cy="78" r="13"/>' +
      '<path d="M72 92 C80 86 96 86 106 92 C114 98 118 112 120 128 L124 140 L70 140 C66 120 66 102 72 92 Z"/>' +
      '<path d="M112 110 C122 116 132 122 140 128" fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round"/>' +
      '<rect x="30" y="138" width="146" height="8" rx="2"/>' +
      '<path d="M40 146 L44 190 M166 146 L162 190" stroke="currentColor" stroke-width="5"/>' +
      '<path d="M128 134 L132 120 L146 120 L150 134 Z M138 120 L138 110" stroke="currentColor" stroke-width="2"/>' +
      '<rect x="156" y="110" width="7" height="28" rx="2"/><path class="flame" d="M159.5 96 C164 102 164 108 159.5 108 C155 108 155 102 159.5 96 Z"/>',

    hound:
      '<g class="lines" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" opacity=".45"><path d="M10 92 L34 92 M4 106 L30 106 M14 120 L36 120"/></g>' +
      '<g class="run">' +
        '<ellipse cx="98" cy="104" rx="44" ry="15" transform="rotate(-6 98 104)"/><ellipse cx="130" cy="104" rx="17" ry="19"/>' +
        '<path d="M134 96 C142 84 148 78 156 74" fill="none" stroke="currentColor" stroke-width="16" stroke-linecap="round"/>' +
        '<path d="M146 66 C156 60 170 64 188 72 L189 77 C178 81 164 81 152 83 C146 81 143 72 146 66 Z"/>' +
        '<path d="M154 64 C150 56 142 56 136 60 C142 64 148 66 154 70 Z"/>' +
        '<g fill="none" stroke="currentColor" stroke-width="7" stroke-linecap="round">' +
          '<path d="M136 116 C148 124 160 128 176 122 M128 118 C136 132 148 140 162 146"/>' +
          '<path d="M66 110 C56 120 44 126 26 128 M74 114 C68 130 58 140 44 150"/>' +
          '<path d="M56 98 C40 92 30 80 22 68" stroke-width="5"/>' +
        '</g>' +
      '</g>',

    bonehound:
      '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">' +
        '<path d="M46 92 C70 80 110 80 138 96" stroke-width="5"/>' +
        '<path d="M82 86 C78 100 80 112 88 120 M94 84 C90 100 92 114 100 122 M106 85 C104 100 106 114 112 122 M118 88 C118 102 120 112 124 118" stroke-width="3.6"/>' +
        '<path d="M140 98 L150 128 L146 156 L152 178 M128 104 L132 130 L124 156 L130 180" stroke-width="4.5"/>' +
        '<path d="M54 96 L48 128 L60 154 L54 180 M66 96 L66 126 L76 154 L72 180" stroke-width="4.5"/>' +
        '<path d="M46 92 C34 88 26 96 18 92 C12 90 10 84 6 82" stroke-width="3" stroke-dasharray="1 6"/>' +
        '<path d="M138 96 C146 102 152 110 156 118" stroke-width="5"/>' +
      '</g>' +
      '<g><circle cx="150" cy="128" r="3.6"/><circle cx="132" cy="130" r="3.6"/><circle cx="48" cy="128" r="3.6"/><circle cx="66" cy="126" r="3.6"/>' +
      '<circle cx="146" cy="156" r="3.2"/><circle cx="124" cy="156" r="3.2"/><circle cx="60" cy="154" r="3.2"/><circle cx="76" cy="154" r="3.2"/></g>' +
      M('bonehound', '<circle cx="168" cy="118" r="5" stroke="none"/><path d="M172 134 l4 5 l4 -5 l4 5 l4 -5" fill="none" stroke-width="2"/>') +
      '<path mask="url(#m-bonehound)" d="M152 112 C158 104 170 104 178 110 L196 124 C198 128 196 132 192 132 L174 136 C166 140 158 136 154 128 C150 122 150 116 152 112 Z"/>' +
      '<path d="M156 108 L152 96 L164 104 Z"/>' +
      '<circle class="ember" cx="168" cy="118" r="2.4"/>'
  };
  function petals() {
    var p = ''; for (var i = 0; i < 5; i++) { var a = i * 72 * Math.PI / 180; p += '<circle cx="' + (Math.cos(a) * 6).toFixed(1) + '" cy="' + (Math.sin(a) * 6).toFixed(1) + '" r="4.6"/>'; }
    return p + '<circle r="3" opacity=".4"/>';
  }

  var PAIRS = [
    { above: 'great_hope', below: 'great_despair', a: ['butterfly', 'Butterfly of the First Dawn', 'Living embodiments of small, persistent hope, drawn to the Great Hope the way moths are drawn to flame, except gently, and without harm. They are deceptively dangerous when something threatens what they protect.', 'minion-butterfly_first_dawn'],
      b: ['forgotten', 'The Forgotten', 'Once-mortal servants whose names and faces the Great Despair has taken in trade for power. They wear blank, smooth ovals where their features should be, and they serve without complaint because they no longer remember they had a choice.', 'minion-the_forgotten'] },
    { above: 'dawnward_king', below: 'duskward_king', a: ['sprite', 'First-Morning Sprite', "Tiny fragments of new beginnings given wings. They flit around the Dawnward King's court without ever settling, because settling would require remembering where they'd already been.", 'minion-first_morning_sprite'],
      b: ['echo', 'Lingering Echo', 'Translucent remnants of those the Duskward King has outlasted, kept near him not out of cruelty but because he cannot let an ending go. They drift through his court in silence, replaying their final moments forever.', 'minion-lingering_echo'] },
    { above: 'verdant_lady', below: 'bloated_lady', a: ['thorn', 'Bower Thorn', "Humanoid-shaped tangles of bramble and blossom that tend the Greenbower's grounds, gentle until something threatens what they're growing.", 'minion-bower_thorn'],
      b: ['crawler', 'Rotblossom Crawler', "Bloated, fruiting bodies that detach from the Bloated Lady's own form and scuttle off to spread her garden further. Each one is hungry in exactly the way she is.", 'minion-rotblossom_crawler'] },
    { above: 'revel_king', below: 'mocking_king', a: ['courtier', 'Masked Courtier', "Members of the Punchline who never quite stopped laughing at the Revel King's last joke, or perhaps they're laughing at the next one, the one they can already see coming.", 'minion-masked_courtier'],
      b: ['jester', 'Stitched Jester', "What's left of a courtier who lost the Mocking King's favor. Their mask was never removed. It became their face.", 'minion-stitched_jester'] },
    { above: 'lady_of_dreaming', below: 'lady_of_waking', a: ['notion', 'Wandering Notion', "A half-formed thought given just enough shape to drift. It means no harm; it simply doesn't understand that physical creatures can be hurt by what it carries.", 'minion-wandering_notion'],
      b: ['watcher', 'Sleepless Watcher', 'Once a dreamer who wandered too close to her. They no longer remember how to close their eyes, and they have stopped trying.', 'minion-sleepless_watcher'] },
    { above: 'hearthkeeper', below: 'hollow_host', a: ['setter', 'Table Setter', "Small, bustling household spirits who keep the Long Table running. They genuinely want everyone fed and comfortable, and they'll fight to keep it that way.", 'minion-table_setter'],
      b: ['guest', 'The Quiet Guest', "Once someone who accepted the Hollow Host's hospitality. They are still, technically, at the table. They have been for a very long time.", 'minion-quiet_guest'] },
    { above: 'hunter_king', below: 'stalking_king', a: ['hound', 'Hound of the Open Field', 'Loyal, swift, and genuinely sporting: these hounds run down prey with real joy and no malice, and back off the instant the horn sounds.', 'minion-hound_open_field'],
      b: ['bonehound', 'Bone Hound', "What's left of the Hunter King's loyal hounds, after they followed him into the Stalking King's frozen forest and never found their way back out.", 'minion-bone_hound'] }
  ];

  function card(c, power, side) {
    var info = S.info[power];
    return '<article class="beast ' + side + '" id="' + c[3].replace('minion-', '') + '">' +
      '<div class="beast-art"><svg viewBox="0 0 200 200" class="art-' + c[0] + '" role="img" aria-label="Silhouette of ' + esc(c[1]) + '" fill="currentColor">' + ART[c[0]] + '</svg></div>' +
      '<h3>' + esc(c[1]) + '</h3>' +
      '<p class="beast-serves"><span data-sigil="' + power + '"></span>Serves ' + esc(info.name) + '</p>' +
      '<p class="beast-rumor">' + esc(c[2]) + '</p>' +
      '<a class="btn small beast-stat" href="sealed.html#' + c[3] + '">Stat block</a>' +
    '</article>';
  }
  host.innerHTML = PAIRS.map(function (p) {
    return '<section class="beast-pair" aria-label="' + esc(S.info[p.above].name) + ' and ' + esc(S.info[p.below].name) + '">' +
      card(p.a, p.above, 'above') + '<div class="beast-glass" aria-hidden="true"></div>' + card(p.b, p.below, 'below') + '</section>';
  }).join('');
  S.render(host);
  if (window.MBSpoilers) MBSpoilers.apply();
})();
