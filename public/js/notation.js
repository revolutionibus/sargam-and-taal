// Parsing of bol (tabla) and swar (melody) notation.
//
// Bol notation: beats are separated by whitespace, vibhags by "|".
// A beat may hold several bols written together ("TiRaKiTa", "DhaGe"),
// which split the beat evenly. "-" is a rest / sustain.
// After a bol, digits pick that recording ("Dha2"), "#" accents it and "*"
// plays it softly. "(TraKa)[1]" fits a group into 1 beat, its strokes
// sharing it evenly; "-" inside a group takes no time, so "(Tra#Ka---)[1]"
// is Tra and Ka half a beat each, while "~" is a silent stroke that does take
// its share: "(Dha~TraKa)[1]" is Dha, a gap, Tra, Ka a quarter beat each. The [n] length carries on to later tokens,
// as in sargam lines. "(Dha#|Dha2#)" plays one of the choices at random each
// time round.
//
// Swar notation: same beat/vibhag layout. Swars are S r R g G m M P d D n N
// (lowercase = komal, M = tivra Ma). Prefix "." for mandra (lower) octave,
// suffix "'" for taar (upper) octave. "-" sustains the previous swar.

(function (root) {
  'use strict';
  const t = (text, vars) => (root.I18n ? root.I18n.t(text, vars) : text);

  // Each bol maps to a right-hand (dayan) stroke and/or left-hand (bayan)
  // stroke, named by sample group (see Data.SAMPLE_GROUPS). v = velocity.
  const BOLS = {
    dha:  { r: 'na',       l: 'ge_for_dha' },
    dhin: { r: 'sur',      l: 'ge_for_dhin' },
    dhi:  { r: 'sur',      l: 'ge_for_dhin' },
    din:  { r: 'sur',      l: 'ge_for_dhin' },
    di:   { r: 'soft_din', l: 'ge_for_dhin', v: 0.85 },
    dhe:  { r: 'te',       l: 'pressed_ge' },
    dhum: { r: 'tun',      l: 'first_closed_then_open_ge' },
    na:   { r: 'na' },
    ne:   { r: 'ne' },
    ta:   { r: 'na' },
    tin:  { r: 'sur', l: 'thap' },
    sur:  { r: 'sur' },
    tun:  { r: 'tun' },
    tu:   { r: 'tun' },
    ti:   { r: 'ti' },
    te:   { r: 'te' },
    ra:   { r: 'ra' },
    re:   { r: 'ra' },
    tr:   { r: 'tra' },
    tra:  { r: 'tra' },
    ge:   { l: 'open_ge' },
    ghe:  { l: 'open_ge' },
    ga:   { l: 'open_ge' },
    gi:   { l: 'open_ge' },
    gin:  { l: 'gin' },
    ke:   { l: 'ki' },
    ka:   { l: 'ki' },
    ki:   { l: 'ki' },
    kat:  { l: 'tichki', v: 1.1 },
  };

  // Pakhawaj: one sample per bol (both hands are in the recording).
  // Entries are [sample, delaySeconds].
  const PK_BOLS = {
    dha: [['pk_dha', 0]], dhin: [['pk_dhin', 0]], dhi: [['pk_dhin', 0]],
    din: [['pk_dhin', 0]], di: [['pk_din', 0]], dhe: [['pk_dhe', 0]],
    dhum: [['pk_open_dhin', 0]],
    na: [['pk_na', 0]], ne: [['pk_pressed_na', 0]], ta: [['pk_na', 0]],
    tin: [['pk_tin', 0]], sur: [['pk_tin', 0]], tun: [['pk_tun', 0]], tu: [['pk_tun', 0]],
    ti: [['pk_ti', 0]], te: [['pk_tta', 0]], ra: [['pk_ra', 0]], re: [['pk_ra', 0]],
    tr: [['pk_ti', 0], ['pk_ra', 0.035]], tra: [['pk_ti', 0], ['pk_ra', 0.035]],
    ge: [['pk_normal_ge', 0]], ghe: [['pk_normal_ge', 0]], ga: [['pk_normal_ge', 0]],
    gi: [['pk_normal_ge', 0]], gin: [['pk_open_ge', 0]],
    ke: [['pk_ki', 0]], ka: [['pk_ki', 0]], ki: [['pk_ki', 0]], kat: [['pk_thap', 0]],
  };
  const BOL_KEYS = Object.keys(BOLS).sort((a, b) => b.length - a.length);
  const REST = new Set(['-', '_', '~']);
  const ACCENT_VEL = 1.25;
  const SOFT_VEL = 0.6;

  // Stroke modifiers written after a bol, e.g. "2#": { variant: 2, vel: 1.25 }.
  function parseMods(mods) {
    const out = {};
    const d = mods.match(/\d+/);
    if (d && Number(d[0]) > 0) out.variant = Number(d[0]);
    if (mods.includes('#')) out.vel = ACCENT_VEL;
    else if (mods.includes('*')) out.vel = SOFT_VEL;
    return out;
  }

  // Split a beat token like "TiRaKiTa" into known bols. Longest match first,
  // backtracking so that e.g. "KaTa" -> Ka, Ta rather than failing on "Kat"+"a".
  function splitBols(token) {
    const s = token.toLowerCase();
    const memo = new Map();
    function go(i) {
      if (i === s.length) return [];
      if (memo.has(i)) return memo.get(i);
      let res = null;
      if (REST.has(s[i])) {
        const rest = go(i + 1);
        if (rest) res = [{ text: token[i], bol: null, rest: true, gap: s[i] === '~' }, ...rest];
      } else {
        for (const k of BOL_KEYS) {
          if (s.startsWith(k, i)) {
            const mods = s.slice(i + k.length).match(/^[\d#*]*/)[0];
            const end = i + k.length + mods.length;
            const rest = go(end);
            if (rest) {
              res = [{ text: token.substring(i, end), bol: k, ...parseMods(mods) }, ...rest];
              break;
            }
          }
        }
      }
      memo.set(i, res);
      return res;
    }
    return go(0);
  }

  // Shared layout parser (swars): returns { beats: [token...], vibhags: [len...] }.
  function splitLayout(text) {
    const vibhags = [];
    const beats = [];
    for (const part of text.split('|')) {
      const toks = part.trim().split(/\s+/).filter(Boolean);
      if (toks.length) {
        vibhags.push(toks.length);
        beats.push(...toks);
      }
    }
    return { beats, vibhags };
  }

  // Split bol text into vibhags of tokens. Inside "(...)" spaces are dropped
  // and "|" separates choices instead of vibhags.
  function splitBolTokens(text) {
    const vibhags = [[]];
    let tok = '';
    let depth = 0;
    const flush = () => { if (tok) vibhags[vibhags.length - 1].push(tok); tok = ''; };
    for (const c of text) {
      if (c === '(') depth++;
      else if (c === ')') depth--;
      if (depth > 0 && /\s/.test(c)) continue;
      if (depth <= 0 && /\s/.test(c)) flush();
      else if (depth <= 0 && c === '|') { flush(); vibhags.push([]); }
      else tok += c;
    }
    flush();
    return vibhags.filter((v) => v.length);
  }

  // Parse a bol composition. Returns { beats, vibhags, cells, events, choices,
  // errors } where events = [{ pos, len, bol, text, variant?, vel?, alt? }] in
  // beat units (pos fractional). An event with alt = { group, k } plays only
  // when choice k of that group is picked; choices = [{ start, n }] lists the
  // groups, each picked again when its start beat comes round.
  function parseBols(text) {
    const errors = [];
    const events = [];
    const choices = [];
    const tokens = [];   // { pos, text, error } for the grid
    const vibhags = [];
    let pos = 0;
    let len = 1;
    let vibhagEnd = 0;
    splitBolTokens(text || '').forEach((toks, vi) => {
      for (const tok of toks) {
        const m = tok.match(/^(?:\(([^()]*)\)|([^()[\]]+))(?:\[([^\]]*)\])?$/);
        const beat = Math.floor(pos + 1e-9) + 1;
        const fail = (msg) => {
          errors.push({ beat: beat - 1, token: tok, msg: t('{msg} in beat {beat}', { msg, beat }) });
          tokens.push({ pos, text: tok, error: true });
        };
        if (!m) { fail(t('Bad "{tok}"', { tok })); continue; }
        if (m[3] !== undefined) {
          const v = Number(m[3]);
          if (!(v > 0 && v <= 64)) { fail(t('Bad length [{v}]', { v: m[3] })); continue; }
          len = v;
        }
        const isGroup = m[1] !== undefined;
        const alts = (isGroup ? m[1] : m[2]).split('|');
        // In a group "-" only marks a ringing stroke and "~" is a silent
        // stroke; "(---)" is a silent group.
        const parsed = alts.map((a) => {
          const parts = splitBols(a);
          return parts && isGroup ? parts.filter((p) => !p.rest || p.gap) : parts;
        });
        const bad = alts.find((a, i) => !parsed[i] || (!parsed[i].length && !/^[-_~]+$/.test(a)));
        if (bad !== undefined) { fail(t('Unknown bol "{bol}"', { bol: bad })); pos = round(pos + len); continue; }
        const group = alts.length > 1 ? { start: Math.floor(pos + 1e-9), n: alts.length } : null;
        if (group) choices.push(group);
        parsed.forEach((parts, k) => {
          const each = len / parts.length;
          parts.forEach((p, j) => {
            if (p.rest) return;
            const { rest, ...ev } = p;
            events.push({ ...ev, pos: round(pos + j * each), len: round(each), ...(group && { alt: { group, k } }) });
          });
        });
        tokens.push({ pos, text: alts.join('/\u200b') });   // break point for narrow cells
        pos = round(pos + len);
      }
      if (Math.abs(pos - Math.round(pos)) > 1e-6) {
        errors.push({ beat: Math.floor(pos), msg: t('Vibhag {n} ends partway through a beat ({pos} beats)', { n: vi + 1, pos }) });
      }
      const end = Math.ceil(pos - 1e-6);
      if (end > vibhagEnd) { vibhags.push(end - vibhagEnd); vibhagEnd = end; }
    });
    events.sort((a, b) => a.pos - b.pos);
    // One grid cell per beat, listing the tokens that start in it.
    const cells = Array.from({ length: vibhagEnd }, () => ({ text: '', error: false }));
    for (const t of tokens) {
      const c = cells[Math.min(Math.floor(t.pos + 1e-9), cells.length - 1)];
      if (!c) continue;
      c.text = c.text ? c.text + ' ' + t.text : t.text;
      c.error = c.error || !!t.error;
    }
    return { beats: vibhagEnd, vibhags, cells, events, choices, errors };
  }

  const SWAR_SEMI = { S: 0, r: 1, R: 2, g: 3, G: 4, m: 5, M: 6, P: 7, d: 8, D: 9, n: 10, N: 11 };

  // sargam: allow "^" (join: legato into the next swar), "/" (meend: slide
  // into the next swar) and "<PM>" (grace swars before the next swar, as
  // { grace: [semi, ...] }); only sargam lines have them.
  function parseSwarToken(tok, sargam = false) {
    const out = [];
    let i = 0;
    while (i < tok.length) {
      const c = tok[i];
      if (c === '-' || c === '_') { out.push({ sustain: true }); i++; continue; }
      if (c === '^' && sargam) { out.push({ join: '^' }); i++; continue; }
      if (c === '/' && sargam) { out.push({ join: '/' }); i++; continue; }
      if (c === '<' && sargam) {
        const end = tok.indexOf('>', i);
        const inner = end < 0 ? null : parseSwarToken(tok.slice(i + 1, end));
        if (!inner || !inner.length || inner.some((p) => p.semi === undefined)) return null;
        out.push({ grace: inner.map((p) => p.semi) });
        i = end + 1;
        continue;
      }
      if (c === '~') { out.push({ rest: true }); i++; continue; }
      if (c === ',') { i++; continue; }
      let oct = 0;
      while (tok[i] === '.') { oct--; i++; }
      const sw = tok[i];
      if (!(sw in SWAR_SEMI)) return null;
      i++;
      while (tok[i] === "'") { oct++; i++; }
      out.push({ swar: sw, semi: SWAR_SEMI[sw] + 12 * oct });
    }
    return out;
  }

  // Parse a lehra / melody. Returns { beats, vibhags, notes, errors } where
  // notes = [{ pos, len, semi }]; sustains extend the previous note.
  function parseSwars(text) {
    const { beats, vibhags } = splitLayout(text || '');
    const errors = [];
    const notes = [];
    let last = null;
    beats.forEach((tok, bi) => {
      const parts = parseSwarToken(tok);
      if (!parts || !parts.length) {
        errors.push({ beat: bi, token: tok, msg: t('Bad swar "{tok}" in beat {beat}', { tok, beat: bi + 1 }) });
        return;
      }
      const n = parts.length;
      parts.forEach((p, k) => {
        if (p.sustain) {
          if (last) last.len += 1 / n;
        } else if (p.rest) {
          last = null;
        } else {
          last = { pos: bi + k / n, len: 1 / n, semi: p.semi };
          notes.push(last);
        }
      });
    });
    // Let the last note ring into the loop point only up to the cycle end.
    return { beats: beats.length, vibhags, notes, errors };
  }

  // Sargam timeline: notes = [{ pos, len, semi }] in beats; semi null = rest.
  const round = (x) => Math.round(x * 1e6) / 1e6;

  // Equal-length notes (alankars): slots = [semi | null(sustain)].
  function slotsToNotes(slots, len) {
    const notes = [];
    let pos = 0;
    for (const s of slots) {
      if (s === null && notes.length) notes[notes.length - 1].len = round(notes[notes.length - 1].len + len);
      else notes.push({ pos: round(pos), len, semi: s });
      pos += len;
    }
    return notes;
  }

  // Sargam line: "S R G - M P", with lengths "S[0.5] R G M[2] ~[1]", and
  // groups "S R (GM) P (DNS')".
  // Each swar lasts defaultLen beats until a [beats] suffix sets a new length,
  // which carries on to the following swars. A (group) shares one length
  // between its swars: "(GM)" = two half-length notes, "(DNS')[2]" = three
  // notes in 2 beats. "-" extends the previous swar, "~" is a rest; "|" is
  // ignored. "^" joins swars: in "G^R", R comes in legato (no new strike).
  // G gets ringOn: true; R gets slur: true. "/" is a meend: in "G/R", G holds
  // its pitch, slides to R over the last part of its last step (meend: the
  // fraction, a third by default), and R is where the slide lands (no new
  // strike). G gets glideTo (the target semi) and glideAt (when the slide
  // starts, in beats from its start); R gets glideIn: true.
  // "<P>G" plays P as a quick grace swar at the start of G; G gets grace: [semi, ...].
  // Returns { notes, total, errors }.
  function parseSargam(text, defaultLen, meend = 1 / 3) {
    const notes = [];
    const errors = [];
    let pos = 0;
    let len = defaultLen;
    let last = null;
    let joinFrom = null; // { note, sym }: note before a "^" or "/", waiting for the next swar
    let lastStep = 0;    // length of the last step of `last`
    let grace = null;    // "<…>" swars waiting for the swar they lead into
    const src = (text || '').replace(/\|/g, ' ')
      .replace(/\(([^)]*)\)/g, (_, inner) => '(' + inner.replace(/\s+/g, '') + ')')    // "(S R)" = "(SR)"
      .replace(/<([^>]*)>\s*/g, (_, inner) => '<' + inner.replace(/\s+/g, '') + '>');    // "<P M> G" = "<PM>G"
    for (const tok of src.split(/\s+/).filter(Boolean)) {
      const m = tok.match(/^(\(?)([^[\]()]*)(\)?)(?:\[([^\]]*)\])?$/);
      if (!m || m[1] !== (m[3] && '(')) { errors.push(t('Bad "{tok}"', { tok })); continue; }
      const group = !!m[1];
      if (!m[2]) { errors.push(t('"{tok}" has no swar', { tok })); continue; }
      if (m[4] !== undefined) {
        const v = Number(m[4]);
        if (!(v > 0 && v <= 64)) { errors.push(t('Bad length [{v}] in "{tok}"', { v: m[4], tok })); continue; }
        len = v;
      }
      const parts = parseSwarToken(m[2], true);
      const steps = parts && parts.filter((p) => !p.join && !p.grace).length;
      if (!parts || !parts.length) { errors.push(t('Bad swar "{tok}"', { tok })); continue; }
      const each = group ? len / (steps || 1) : len;
      for (const p of parts) {
        if (p.grace) {
          grace = (grace || []).concat(p.grace);
          continue;
        }
        if (grace && (p.sustain || p.rest)) {
          errors.push(t('"<…>" must be followed by a swar, not "{tok}"', { tok }));
          grace = null;
        }
        if (p.join) {
          const sym = p.join;
          if (!last || last.semi === null || joinFrom) errors.push(t('"{sym}" in "{tok}" needs a swar before it', { sym, tok }));
          else joinFrom = { note: last, sym, step: lastStep };
          continue;
        }
        if (joinFrom && (p.sustain || p.rest)) {
          errors.push(t('"{sym}" must be followed by a swar, not "{tok}"', { sym: joinFrom.sym, tok }));
          joinFrom = null;
        }
        if (p.sustain && last) last.len = round(last.len + each);
        else {
          last = { pos: round(pos), len: round(each), semi: p.sustain || p.rest ? null : p.semi };
          if (joinFrom && joinFrom.sym === '^') {
            joinFrom.note.ringOn = true;
            last.slur = true;
          } else if (joinFrom) {
            const from = joinFrom.note;
            Object.assign(from, { glideTo: last.semi, glideAt: round(from.len - joinFrom.step * meend) });
            last.glideIn = true;
          }
          joinFrom = null;
          if (grace) { last.grace = grace; grace = null; }
          notes.push(last);
        }
        lastStep = each;
        pos += each;
      }
    }
    if (joinFrom) errors.push(t('"{sym}" at the end needs a swar after it', { sym: joinFrom.sym }));
    if (grace) errors.push(t('"<…>" at the end needs a swar after it'));
    return { notes, total: round(pos), errors };
  }

  // Display info for a semitone value: name, komal/tivra, octave.
  // Per language: full names, and the short forms used when notes are packed.
  const SWAR_NAMES = {
    en: { name: ['Sa', 'Re', 'Re', 'Ga', 'Ga', 'Ma', 'Ma', 'Pa', 'Dha', 'Dha', 'Ni', 'Ni'],
          short: ['S', 'R', 'R', 'G', 'G', 'M', 'M', 'P', 'D', 'D', 'N', 'N'],
          komal: 'komal ', tivra: 'tivra ' },
    bn: { name: ['সা', 'ঋা', 'রা', 'জ্ঞা', 'গা', 'মা', 'হ্ম', 'পা', 'দা', 'ধা', 'ণা', 'না'],
          short: ['স', 'ঋ', 'র', 'জ্ঞ', 'গ', 'ম', 'হ্ম', 'প', 'দ', 'ধ', 'ণ', 'ন'],
          komal: 'কোমল ', tivra: 'তীব্র ' },
  };
  function swarLabel(semi, lang = 'bn') {
    const pc = ((semi % 12) + 12) % 12;
    const names = SWAR_NAMES[lang] || SWAR_NAMES.en;
    return {
      name: names.name[pc],
      short: names.short[pc],
      fullName: (pc === 6 ? names.tivra : [1, 3, 8, 10].includes(pc) ? names.komal : '') + names.name[pc],
      komal: [1, 3, 8, 10].includes(pc),
      tivra: pc === 6,
      octave: Math.floor(semi / 12),
    };
  }

  // Manjeera positions: "1 5 9 13", fractional "2.5" (halfway through beat 2),
  // suffix "c" for a closed stroke: "1 3c 5 7c". Beats are 1-based and must
  // lie in the taal. Returns { hits: [{ pos, closed }] sorted by pos, errors }.
  function parseManjeera(text, beats) {
    const hits = [];
    const errors = [];
    for (const tok of (text || '').replace(/[|,]/g, ' ').split(/\s+/).filter(Boolean)) {
      const m = tok.match(/^(\d+(?:\.\d+)?)([oc]?)$/i);
      const beat = m ? Number(m[1]) : NaN;
      if (!m || beat < 1 || beat >= beats + 1) { errors.push(t('Bad position "{tok}"', { tok })); continue; }
      hits.push({ pos: beat - 1, closed: m[2].toLowerCase() === 'c' });
    }
    hits.sort((a, b) => a.pos - b.pos);
    return { hits, errors };
  }

  // Events whose start falls in [b, b+1). Events must be sorted by pos.
  function eventsInBeat(events, b) {
    const out = [];
    for (const e of events) {
      if (e.pos >= b + 1 - 1e-9) break;
      if (e.pos >= b - 1e-9) out.push(e);
    }
    return out;
  }

  const api = { BOLS, PK_BOLS, splitBols, parseBols, parseSwars, parseSargam, parseManjeera, slotsToNotes,
                swarLabel, eventsInBeat, SWAR_SEMI };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Notation = api;
})(this);
