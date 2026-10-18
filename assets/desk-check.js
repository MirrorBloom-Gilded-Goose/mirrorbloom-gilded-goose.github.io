/* ==========================================================================
   WRITER'S DESK — the checker
   House rules for Tales of the Gilded Goose (checked instantly, on this device),
   grammar from LanguageTool (sent paragraph by paragraph, only when switched on),
   and the small safe fixes made as you type.
   ========================================================================== */
(function () {
  /* ---------- word lists ---------- */
  var BRIT = {};
  function addForms(uk, us, forms) { forms.forEach(function (f) { BRIT[uk + f] = us + f; }); }
  ['colo', 'flavo', 'hono', 'humo', 'labo', 'neighbo', 'behavio', 'favo', 'armo', 'harbo', 'rumo', 'vapo', 'savo', 'valo', 'vigo', 'odo', 'splendo', 'clamo', 'endeavo', 'parlo', 'cando', 'ranco']
    .forEach(function (r) { addForms(r + 'ur', r + 'r', ['', 's', 'ed', 'ing', 'ful', 'less', 'able', 'ite', 'ites', 'ably', 'hood', 'ly', 'ers']); });
  BRIT.saviour = 'savior'; BRIT.saviours = 'saviors';
  ['real', 'recogn', 'organ', 'apolog', 'emphas', 'critic', 'priorit', 'memor', 'sympath', 'summar', 'character', 'material', 'special', 'visual', 'util', 'final',
    'minim', 'maxim', 'author', 'civil', 'colon', 'fertil', 'harmon', 'hypnot', 'ideal', 'jeopard', 'legal', 'mesmer', 'mobil', 'modern', 'neutral', 'normal', 'optim',
    'patron', 'penal', 'person', 'polar', 'popular', 'revital', 'romantic', 'scrutin', 'standard', 'stabil', 'steril', 'symbol', 'terror', 'theor', 'traumat', 'trivial', 'vandal', 'vapor']
    .forEach(function (r) { addForms(r + 'is', r + 'iz', ['e', 'ed', 'es', 'ing', 'ation', 'ations', 'er', 'ers']); });
  addForms('analys', 'analyz', ['e', 'ed', 'es', 'ing']); addForms('paralys', 'paralyz', ['e', 'ed', 'es', 'ing']);
  ['travel', 'cancel', 'label', 'spiral', 'signal', 'model', 'level', 'fuel', 'marshal', 'channel', 'tunnel', 'quarrel', 'shovel', 'snorkel', 'swivel', 'total', 'counsel', 'duel', 'grovel', 'jewel', 'dial', 'rival', 'yodel', 'shrivel', 'unravel']
    .forEach(function (r) { BRIT[r + 'led'] = r + 'ed'; BRIT[r + 'ling'] = r + 'ing'; BRIT[r + 'ler'] = r + 'er'; BRIT[r + 'lers'] = r + 'ers'; });
  Object.assign(BRIT, { centre: 'center', centres: 'centers', centred: 'centered', metre: 'meter', metres: 'meters', theatre: 'theater', theatres: 'theaters',
    defence: 'defense', defences: 'defenses', offence: 'offense', offences: 'offenses', licence: 'license', marvellous: 'marvelous', jewellery: 'jewelry', whilst: 'while',
    amongst: 'among', learnt: 'learned', spelt: 'spelled', plough: 'plow', sceptical: 'skeptical', sceptic: 'skeptic', mould: 'mold', mouldy: 'moldy', smoulder: 'smolder',
    smouldering: 'smoldering', moustache: 'mustache', pyjamas: 'pajamas', programme: 'program', catalogue: 'catalog', enrol: 'enroll', fulfil: 'fulfill', skilful: 'skillful',
    wilful: 'willful', instalment: 'installment', ageing: 'aging', manoeuvre: 'maneuver', manoeuvres: 'maneuvers', aeroplane: 'airplane', sombre: 'somber', lustre: 'luster',
    sabre: 'saber', sabres: 'sabers', spectre: 'specter', spectres: 'specters', fibre: 'fiber', fibres: 'fibers', calibre: 'caliber', meagre: 'meager', sceptre: 'scepter',
    sceptres: 'scepters', tyre: 'tire', kerb: 'curb', woollen: 'woolen', practise: 'practice', practised: 'practiced', practising: 'practicing', judgement: 'judgment',
    acknowledgement: 'acknowledgment', cosy: 'cozy' });

  var TYPO = { teh: 'the', hte: 'the', adn: 'and', nad: 'and', taht: 'that', thta: 'that', recieve: 'receive', recieved: 'received', wierd: 'weird', seperate: 'separate',
    seperated: 'separated', definately: 'definitely', alot: 'a lot', untill: 'until', occured: 'occurred', begining: 'beginning', beleive: 'believe', beleived: 'believed',
    freind: 'friend', freinds: 'friends', thier: 'their', becuase: 'because', becasue: 'because', tommorow: 'tomorrow', tomorow: 'tomorrow', accross: 'across', wich: 'which',
    truely: 'truly', arguement: 'argument', goverment: 'government', enviroment: 'environment', publically: 'publicly', existance: 'existence', independant: 'independent',
    neccessary: 'necessary', occassion: 'occasion', posession: 'possession', threshhold: 'threshold', dissapear: 'disappear', dissapeared: 'disappeared', embarass: 'embarrass',
    embarassed: 'embarrassed', harrass: 'harass', millenium: 'millennium', noticable: 'noticeable', persue: 'pursue', refered: 'referred', sieze: 'seize', tounge: 'tongue',
    acheive: 'achieve', acheived: 'achieved', agressive: 'aggressive', apparantly: 'apparently', basicly: 'basically', calender: 'calendar', concious: 'conscious',
    enemys: 'enemies', finaly: 'finally', foriegn: 'foreign', gaurd: 'guard', gaurds: 'guards', grammer: 'grammar', happend: 'happened', immediatly: 'immediately',
    knowlege: 'knowledge', liason: 'liaison', mischievious: 'mischievous', mispell: 'misspell', peice: 'piece', realy: 'really', remeber: 'remember', rember: 'remember',
    sentance: 'sentence', suprise: 'surprise', suprised: 'surprised', tatoo: 'tattoo', theif: 'thief', vaccum: 'vacuum', wouldnt: "wouldn't", couldnt: "couldn't",
    shouldnt: "shouldn't", didnt: "didn't", doesnt: "doesn't", isnt: "isn't", wasnt: "wasn't", dont: "don't", ive: "I've", youre: "you're", theyre: "they're" };

  var SMALL = { the: 1, a: 1, an: 1, to: 1, of: 1, and: 1, in: 1, is: 1, it: 1, i: 1, was: 1, for: 1, on: 1, at: 1, with: 1, my: 1, her: 1, his: 1, their: 1, be: 1, as: 1, but: 1, or: 1 };

  /* names are filled in by the desk from the vault */
  var CANON = { misspell: {}, names: {}, nameList: [] };
  var DICT = load('desk-dict', {}), IGNORE = load('desk-ignore', {});
  function load(k, d) { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }

  function setCanon(desk) {
    CANON.misspell = (desk && desk.misspell) || {};
    var names = {};
    ((desk && desk.names) || []).forEach(function (n) { names[n] = 1; });
    ((desk && desk.entries) || []).forEach(function (en) {
      [en.name].concat(en.aka || []).forEach(function (n) { n.split(/[\s.]+/).forEach(function (w) { if (/^[A-Z]/.test(w)) names[w.replace(/'s$/, '')] = 1; }); names[n] = 1; });
    });
    CANON.names = names;
    CANON.nameList = Object.keys(names).filter(function (n) { return n.length >= 3; });
  }

  function keepCase(src, rep) {
    if (rep == null) return rep;
    if (src === src.toUpperCase() && src.length > 1) return rep.toUpperCase();
    if (src[0] === src[0].toUpperCase()) return rep[0].toUpperCase() + rep.slice(1);
    return rep;
  }
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 2) return 9;
    var p = [], i, j; for (j = 0; j <= b.length; j++) p[j] = j;
    for (i = 1; i <= a.length; i++) { var prev = p[0]; p[0] = i; for (j = 1; j <= b.length; j++) { var t = p[j]; p[j] = Math.min(p[j] + 1, p[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; } }
    return p[b.length];
  }
  function nearName(w) {
    var best = null, bd = 9;
    for (var i = 0; i < CANON.nameList.length; i++) { var n = CANON.nameList[i]; if (n.indexOf(' ') > -1) continue; var d = lev(w, n); if (d < bd) { bd = d; best = n; } }
    var limit = w.length >= 8 ? 2 : 1;
    return bd > 0 && bd <= limit ? best : null;
  }

  /* ---------- house rules: returns issues {s, e, kind, title, msg, reps, rule, fix} ---------- */
  var DASH_LINE = '— ✦ —';
  function scan(text) {
    var out = [], m, re;
    function add(s, e, kind, title, msg, reps, rule, fix) {
      var key = rule + ':' + text.slice(s, e).toLowerCase();
      if (IGNORE[key]) return;
      out.push({ s: s, e: e, kind: kind, title: title, msg: msg, reps: reps || [], rule: rule, key: key, fix: !!fix, src: 'house' });
    }
    /* scene breaks and lines that look like them */
    re = /^[ \t]*([-—–*✦✧~_ ]{3,}|[—–-]+ *✦ *[—–-]+|✦)[ \t]*$/gm;
    var breaks = [];
    while ((m = re.exec(text))) {
      var line = m[0].trim(); breaks.push([m.index, m.index + m[0].length]);
      if (line !== DASH_LINE) add(m.index, m.index + m[0].length, 'house', 'Scene break', 'Scene breaks are exactly — ✦ — on their own line.', [DASH_LINE], 'scene', true);
    }
    function inBreak(a, b) { for (var k = 0; k < breaks.length; k++) if (a < breaks[k][1] && b > breaks[k][0]) return true; return false; }
    /* stutters with hyphens: Y-yes */
    re = /\b([A-Za-z])-(?=\1)/gi;
    while ((m = re.exec(text))) if (!inBreak(m.index, m.index + 2)) add(m.index, m.index + 2, 'house', 'Stutter', 'Stutters use ellipses: "Y... yes".', [m[1] + '... '], 'stutter', true);
    /* hyphenated compounds */
    re = /([A-Za-z0-9])-(?=[A-Za-z0-9])/g;
    while ((m = re.exec(text))) {
      var at = m.index + 1;
      if (/\b([A-Za-z])$/.test(text.slice(Math.max(0, at - 2), at)) && text[at + 1] && text[at + 1].toLowerCase() === text[at - 1].toLowerCase() && !/[A-Za-z]/.test(text[at - 2] || '')) continue;
      add(at, at + 1, 'house', 'No hyphens', 'Compounds stay open: "shell shocked", "all nighter".', [' '], 'hyphen', true);
    }
    /* dashes outside the scene break */
    re = /\s?[—–]\s?|\s--?\s|(?<=\w)--(?=\w)/g;
    while ((m = re.exec(text))) {
      if (inBreak(m.index, m.index + m[0].length)) continue;
      add(m.index, m.index + m[0].length, 'house', 'Dash', 'The only dash in the book is the scene break. Try a comma, an ellipsis or a full stop.', [', ', '... ', '. '], 'dash');
    }
    /* British spellings */
    re = /\b[A-Za-z]+\b/g;
    while ((m = re.exec(text))) {
      var w = m[0], lw = w.toLowerCase();
      if (BRIT[lw]) add(m.index, m.index + w.length, 'house', 'American spelling', 'You write American spelling.', [keepCase(w, BRIT[lw])], 'brit', true);
      else if (TYPO[lw]) add(m.index, m.index + w.length, 'spelling', 'Typo', 'Common typo.', [keepCase(w, TYPO[lw])], 'typo', true);
      else if (w === 'i' && /[\s"“'‘(]|^/.test(text[m.index - 1] || ' ') && /[\s,.!?'’"”]|$/.test(text[m.index + 1] || ' ')) add(m.index, m.index + 1, 'grammar', 'Capital I', '"I" is always capitalized.', ['I'], 'lower-i', true);
    }
    /* canon slips: known misspellings of names */
    Object.keys(CANON.misspell).forEach(function (bad) {
      var r = new RegExp('\\b' + bad.replace(/[.*+?^${}()|[\]\\']/g, function (c) { return c === "'" ? "['’]" : '\\' + c; }) + '\\b', 'g');
      while ((m = r.exec(text))) add(m.index, m.index + m[0].length, 'house', 'Name check', 'In your canon this is ' + CANON.misspell[bad] + '.', [CANON.misspell[bad]], 'canon-slip');
    });
    /* doubled words */
    re = /\b(\w+)(\s+)\1\b/gi;
    while ((m = re.exec(text))) {
      if (m[2].indexOf('\n') > -1) continue;
      var small = SMALL[m[1].toLowerCase()];
      add(m.index + m[1].length, m.index + m[0].length, 'grammar', 'Repeated word', 'The word "' + m[1] + '" appears twice.', [''], 'double', !!small);
    }
    /* missing space after a full stop: "end.Start" */
    re = /([a-z,])([.!?,])([A-Z])/g;
    while ((m = re.exec(text))) add(m.index + 1, m.index + 2, 'grammar', 'Missing space', 'Two sentences may have run together.', [m[2] + ' '], 'nospace', m[2] !== ',');
    /* double spaces between words */
    re = /(\S)( {2,})(?=\S)/g;
    while ((m = re.exec(text))) add(m.index + 1, m.index + 1 + m[2].length, 'style', 'Extra space', 'Two spaces between words.', [' '], 'space2', true);
    /* quotes, paragraph by paragraph */
    var pos = 0;
    text.split('\n').forEach(function (para) {
      var base = pos; pos += para.length + 1;
      if (!para.trim()) return;
      var dq = [], i, c;
      for (i = 0; i < para.length; i++) { c = para[i]; if (c === '"' || c === '“' || c === '”') dq.push(i); }
      var curly = para.indexOf('“') > -1 || para.indexOf('”') > -1;
      if (curly) {
        var open = 0, lastOpen = -1;
        for (i = 0; i < para.length; i++) { if (para[i] === '“') { open++; lastOpen = i; } else if (para[i] === '”' && open > 0) open--; }
        if (open > 0) add(base + lastOpen, base + lastOpen + 1, 'house', 'Unclosed dialogue', 'This quote opens and never closes in this paragraph.', [], 'dq');
      } else if (dq.length % 2) add(base + dq[dq.length - 1], base + dq[dq.length - 1] + 1, 'house', 'Unclosed dialogue', 'An odd number of quote marks in this paragraph.', [], 'dq');
      /* single quote thoughts: openers after a space, closers before a space/punctuation, contractions skipped */
      var openers = [];
      for (i = 0; i < para.length; i++) {
        c = para[i]; if (c !== "'" && c !== '‘' && c !== '’') continue;
        var before = para[i - 1] || ' ', after = para[i + 1] || ' ';
        var isOpen = (c === '‘' || c === "'") && /[\s"“(—]/.test(before) && /[A-Za-z0-9.…]/.test(after);
        var isClose = /[^\s]/.test(before) && !/[A-Za-z0-9]/.test(after) && (c === '’' || c === "'");
        if (isOpen) openers.push(i);
        else if (isClose && openers.length) openers.pop();
      }
      if (openers.length) { var o = openers[openers.length - 1]; add(base + o, base + o + 1, 'house', 'Unclosed thought', 'A single quote opens a thought here and never closes, so the rest of the paragraph reads as thought.', [], 'sq'); }
    });
    return out;
  }

  /* ---------- echoes: the same distinctive word too often in one paragraph, or twice within a breath ---------- */
  var STOP = {};
  ('about above after again against almost along also although always among another anything around away back because been before being below between both came cannot could does doing done down during each either else even ever every from further gets give goes going gone good gotta great have having here hers herself himself into itself just know like little look looks made make many more most much must myself near need never next nothing once only other others ours over own really right said same says seem seems shall should since some something still such sure take than that their theirs them themselves then there these they thing things think this those though through thus till time today together too toward under until upon very want wants well were what when where whether which while whole whom whose will with within without would your yours yourself yeah okay just even back down still eyes face hand hands head voice turn turns turned look looking looks smile smiles feel feels felt know knows going come comes',
   'one two three four five first last long ever away again').split(/\s+/).forEach(function (w) { STOP[w] = 1; });
  function stem(w) { return w.toLowerCase().replace(/['’]s$/, '').replace(/(ing|ed|es|s|ly)$/, '').replace(/(.)\1$/, '$1'); }
  function echoes(text) {
    var out = [], pos = 0;
    text.split('\n').forEach(function (para) {
      var base = pos; pos += para.length + 1;
      if (para.trim().length < 40) return;
      var re = /[A-Za-z][A-Za-z’']+/g, m, byStem = {}, words = [];
      while ((m = re.exec(para))) {
        var w = m[0], lw = w.toLowerCase().replace(/['’]s$/, '');
        if (lw.length < 4 || STOP[lw] || CANON.names[w] || CANON.names[w.replace(/['’]s$/, '')]) continue;
        var st = stem(w); if (st.length < 3) continue;
        var item = { s: base + m.index, e: base + m.index + w.length, w: w, i: words.length };
        words.push(item); (byStem[st] = byStem[st] || []).push(item);
      }
      Object.keys(byStem).forEach(function (st) {
        var list = byStem[st], flag = [];
        if (list.length >= 3) flag = list;
        else if (list.length === 2 && list[0].w.length >= 6) {
          var gap = para.slice(list[0].e - base, list[1].s - base).split(/\s+/).length;
          if (gap <= 22) flag = list;
        }
        flag.forEach(function (it, k) {
          var key = 'echo:' + st;
          if (IGNORE[key]) return;
          out.push({ s: it.s, e: it.e, kind: 'style', title: 'Echo', msg: '"' + list[0].w + '" appears ' + (list.length === 2 ? 'twice close together' : list.length + ' times') + ' in this paragraph. Fine if it is on purpose.', reps: [], rule: 'echo', key: key, src: 'house' });
        });
      });
    });
    return out;
  }

  /* chapter level checks for the Check tab */
  function chapterChecks(text, goal) {
    var res = [], trimmed = text.replace(/^\s+/, ''), words = countWords(text);
    if (!trimmed) return res;
    if (trimmed[0] === '[') {
      var close = trimmed.indexOf(']');
      if (close < 0) res.push(['warn', 'The Linfay snippet opens with [ but never closes with ].']);
      else {
        var block = trimmed.slice(0, close + 1), paras = block.split(/\n\s*\n/), lastPara = paras[paras.length - 1].replace(/[\[\]]/g, '').trim();
        var afterBlock = trimmed.slice(close + 1).replace(/^[ \t]*\n/, '');
        var attribAfter = /^\s*\n?[ \t]*\[?[^\n\]]{3,140}\]?[ \t]*(\n|$)/.test(afterBlock) && /recording|teaching|linfay|professor|mages college/i.test(afterBlock.split('\n')[0]);
        if (paras.length > 1 && lastPara.length < 160) res.push(['ok', 'Snippet attribution line found, with a blank line above it: "' + lastPara.slice(0, 80) + '"']);
        else if (attribAfter) res.push(['ok', 'Snippet attribution line found after the brackets.']);
        else res.push(['warn', 'Snippet found, but no attribution line at the bottom with a blank line above it. (Reminder!)']);
      }
    } else res.push(['info', 'No bracketed Linfay snippet at the top. Fine for Chapter 1; every other chapter opens with one.']);
    var br = (text.match(/^[ \t]*— ✦ —[ \t]*$/gm) || []).length;
    if (br) res.push(['ok', br + ' scene break' + (br > 1 ? 's' : '') + ' (— ✦ —).']);
    var pov = text.match(/^[ \t]*[A-Z][a-z]+ Pov[ \t]*$/gm);
    if (pov) res.push(['ok', 'POV headers: ' + pov.map(function (p) { return p.trim(); }).join(', ')]);
    if (goal) res.push([words >= goal ? 'ok' : 'info', words.toLocaleString() + ' of ' + goal.toLocaleString() + ' words' + (words >= goal ? '. Target reached.' : '.')]);
    var past = (text.match(/\b(said|walked|looked|turned|asked|smiled|grabbed|pulled|stood|felt|knew|thought)\b/g) || []).length;
    var present = (text.match(/\b(say|says|walk|walks|look|looks|turn|turns|ask|asks|smile|smiles|grab|grabs|pull|pulls|stand|stands|feel|feels|know|knows|think|thinks)\b/g) || []).length;
    if (words > 300 && past > present * 0.6 && past > 8) res.push(['warn', 'Lots of past tense verbs (' + past + ' like said, walked, looked). The book is present tense, unless this is a flashback section.']);
    return res;
  }
  function countWords(t) { var m = t.match(/[A-Za-z0-9’']+(?:[-’'][A-Za-z0-9]+)*/g); return m ? m.length : 0; }

  /* ---------- safe fixes as you type: look at the word just finished ---------- */
  function autofix(text, caret) {
    var before = text.slice(0, caret);
    var m = before.match(/(^|[^A-Za-z’'-])([A-Za-z]+(?:-[A-Za-z]+)*)([^A-Za-z]{1,2})$/);
    if (!m) return null;
    var word = m[2], start = caret - m[3].length - word.length, lw = word.toLowerCase();
    var st = word.match(/^([A-Za-z])-(\1[a-z]*)$/i);
    if (st) return { s: start, e: start + word.length, rep: st[1] + '... ' + st[2], label: 'stutter' };
    if (word.indexOf('-') > -1 && !/^[A-Z]-/.test(word)) return { s: start, e: start + word.length, rep: word.replace(/-/g, ' '), label: 'open compound' };
    if (BRIT[lw]) return { s: start, e: start + word.length, rep: keepCase(word, BRIT[lw]), label: 'American spelling' };
    if (TYPO[lw]) return { s: start, e: start + word.length, rep: keepCase(word, TYPO[lw]), label: 'typo' };
    if (word === 'i' && /^[\s"“'‘(]?$/.test(m[1]) && /^[\s,.!?'’"”]/.test(m[3])) return { s: start, e: start + 1, rep: 'I', label: 'capital I' };
    var dbl = before.slice(0, start).match(/(?:^|[^A-Za-z])([A-Za-z]+)( )$/);
    if (dbl && dbl[1].toLowerCase() === lw && SMALL[lw]) return { s: start - 1, e: start + word.length, rep: '', label: 'repeated word' };
    if (CANON.misspell[word] && /^[A-Z]/.test(word) && ['Grog', 'Mavrick', 'Jester King'].indexOf(word) < 0) return { s: start, e: start + word.length, rep: CANON.misspell[word], label: 'name' };
    return null;
  }

  /* ---------- LanguageTool, paragraph by paragraph ---------- */
  var LT = { on: load('desk-lt', true), cache: new Map(), queue: [], busy: false, last: 0, backoff: 0, status: 'idle', listeners: [] };
  var DROP = { EN_QUOTES: 1, DASH_RULE: 1, ELLIPSIS: 1, EN_UNPAIRED_QUOTES: 1, EN_UNPAIRED_BRACKETS: 1, WHITESPACE_RULE: 1, CONSECUTIVE_SPACES: 1, EN_COMPOUNDS: 1,
    PUNCTUATION_PARAGRAPH_END: 1, WORD_REPEAT_BEGINNING_RULE: 1, ENGLISH_WORD_REPEAT_RULE: 1, MORFOLOGIK_RULE_EN_GB: 1, TWO_HYPHENS: 1, HYPHEN_TO_EN: 1 };
  function ltIssue(match, base, para) {
    var rid = match.rule && match.rule.id || '';
    if (DROP[rid] || /HYPHEN|COMPOUND|DASH|QUOTE/.test(rid)) return null;
    var word = para.substr(match.offset, match.length);
    var type = match.rule && match.rule.issueType || '';
    var kind = type === 'misspelling' ? 'spelling' : (type === 'style' || type === 'locale-violation' || type === 'uncategorized' || type === 'register') ? 'style' : 'grammar';
    if (kind === 'spelling') {
      var bare = word.replace(/['’]s$/, '');
      if (CANON.names[bare] || DICT[bare.toLowerCase()] || CANON.names[word]) return null;
    }
    var reps = (match.replacements || []).map(function (r) { return r.value; }).filter(function (v) { return v.indexOf('-') < 0 && v.indexOf('—') < 0; });
    if (!reps.length && (match.replacements || []).length) return null;
    reps.sort(function (a, b) { return (/ed$/.test(a) ? 1 : 0) - (/ed$/.test(b) ? 1 : 0); });
    if (kind === 'spelling' && /^[A-Z]/.test(word)) { var nn = nearName(word.replace(/['’]s$/, '')); if (nn) reps.unshift(nn + (/['’]s$/.test(word) ? word.slice(-2) : '')); }
    var key = rid + ':' + word.toLowerCase();
    if (IGNORE[key]) return null;
    reps = reps.filter(function (r, i) { return reps.indexOf(r) === i; });
    return { s: base + match.offset, e: base + match.offset + match.length, kind: kind, title: match.shortMessage || (kind === 'spelling' ? 'Spelling' : 'Grammar'),
      msg: match.message, reps: reps.slice(0, 5), rule: rid, key: key, src: 'lt' };
  }
  function ltIssues(text) {
    if (!LT.on) return [];
    var out = [], pos = 0;
    text.split('\n').forEach(function (para) {
      var base = pos; pos += para.length + 1;
      var hit = LT.cache.get(para);
      if (hit) hit.forEach(function (mt) { var is = ltIssue(mt, base, para); if (is) out.push(is); });
    });
    return out;
  }
  function ltWanted(text) {
    if (!LT.on) return;
    var seen = {};
    text.split('\n').forEach(function (p) { if (p.trim().length > 3 && !LT.cache.has(p) && !seen[p]) { seen[p] = 1; LT.queue.push(p); } });
    LT.queue = LT.queue.filter(function (p, i, a) { return a.indexOf(p) === i && text.indexOf(p) > -1; });
    pump();
  }
  function setStatus(s) { LT.status = s; LT.listeners.forEach(function (f) { f(s); }); }
  function pump() {
    if (LT.busy || !LT.queue.length || !LT.on) { if (!LT.queue.length && !LT.busy && LT.status === 'checking') setStatus('ready'); return; }
    var wait = Math.max(LT.last + 3500, LT.backoff) - Date.now();
    if (wait > 0) { clearTimeout(LT.t); LT.t = setTimeout(pump, wait); setStatus(LT.backoff > Date.now() ? 'paused' : 'checking'); return; }
    var batch = [], size = 0;
    while (LT.queue.length && size + LT.queue[0].length < 12000) { var p = LT.queue.shift(); batch.push(p); size += p.length + 2; }
    if (!batch.length) batch.push(LT.queue.shift().slice(0, 12000));
    LT.busy = true; LT.last = Date.now(); setStatus('checking');
    var joined = batch.join('\n\n'), starts = [], acc = 0;
    batch.forEach(function (p) { starts.push(acc); acc += p.length + 2; });
    var body = new URLSearchParams({ text: joined, language: 'en-US', enabledOnly: 'false', level: 'default' });
    fetch('https://api.languagetool.org/v2/check', { method: 'POST', body: body, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
      .then(function (r) { if (r.status === 429) throw { rate: true }; if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        var per = batch.map(function () { return []; });
        (d.matches || []).forEach(function (mt) {
          for (var i = batch.length - 1; i >= 0; i--) if (mt.offset >= starts[i]) {
            if (mt.offset + mt.length <= starts[i] + batch[i].length) { var c = Object.assign({}, mt); c.offset = mt.offset - starts[i]; per[i].push(c); }
            break;
          }
        });
        batch.forEach(function (p, i) { LT.cache.set(p, per[i]); if (LT.cache.size > 3000) LT.cache.delete(LT.cache.keys().next().value); });
        LT.busy = false; setStatus(LT.queue.length ? 'checking' : 'ready');
        document.dispatchEvent(new CustomEvent('desk:lt'));
        pump();
      })
      .catch(function (err) {
        LT.busy = false;
        LT.queue = batch.concat(LT.queue);
        if (err && err.rate) { LT.backoff = Date.now() + 60000; setStatus('paused'); }
        else { LT.backoff = Date.now() + 20000; setStatus(navigator.onLine === false ? 'offline' : 'error'); }
        clearTimeout(LT.t); LT.t = setTimeout(pump, Math.max(1000, LT.backoff - Date.now()));
      });
  }

  window.DeskCheck = {
    scan: scan, echoes: echoes, chapterChecks: chapterChecks, autofix: autofix, countWords: countWords, setCanon: setCanon,
    ltIssues: ltIssues, ltWanted: ltWanted, ltHas: function (para) { return para.trim().length <= 3 || LT.cache.has(para); },
    lt: { get on() { return LT.on; }, set on(v) { LT.on = !!v; save('desk-lt', LT.on); if (v) setStatus('checking'); else { LT.queue = []; setStatus('off'); } },
      get status() { return LT.status; }, onStatus: function (f) { LT.listeners.push(f); } },
    ignore: function (key) { IGNORE[key] = 1; save('desk-ignore', IGNORE); },
    addWord: function (w) { DICT[w.toLowerCase().replace(/['’]s$/, '')] = 1; save('desk-dict', DICT); },
    dictionary: function () { return Object.keys(DICT).sort(); },
    removeWord: function (w) { delete DICT[w]; save('desk-dict', DICT); },
    resetIgnored: function () { IGNORE = {}; save('desk-ignore', IGNORE); },
    canon: CANON, _brit: BRIT
  };
})();
