// Parsing of bol (tabla) and swar (melody) notation.
//
// Bol notation: beats are separated by whitespace, vibhags by "|".
// A beat may hold several bols written together ("TiRaKiTa", "DhaGe"),
// which split the beat evenly. "-" is a rest / sustain.
//
// Swar notation: same beat/vibhag layout. Swars are S r R g G m M P d D n N
// (lowercase = komal, M = tivra Ma). Prefix "." for mandra (lower) octave,
// suffix "'" for taar (upper) octave. "-" sustains the previous swar.

(function (root) {
  'use strict';

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
    tin: [['pk_tin', 0]], tun: [['pk_tun', 0]], tu: [['pk_tun', 0]],
    ti: [['pk_ti', 0]], te: [['pk_tta', 0]], ra: [['pk_ra', 0]], re: [['pk_ra', 0]],
    tr: [['pk_ti', 0], ['pk_ra', 0.035]], tra: [['pk_ti', 0], ['pk_ra', 0.035]],
    ge: [['pk_normal_ge', 0]], ghe: [['pk_normal_ge', 0]], ga: [['pk_normal_ge', 0]],
    gi: [['pk_normal_ge', 0]], gin: [['pk_open_ge', 0]],
    ke: [['pk_ki', 0]], ka: [['pk_ki', 0]], ki: [['pk_ki', 0]], kat: [['pk_thap', 0]],
  };
  const BOL_KEYS = Object.keys(BOLS).sort((a, b) => b.length - a.length);
  const REST = new Set(['-', '_']);

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
        if (rest) res = [{ text: '-', bol: null, rest: true }, ...rest];
      } else {
        for (const k of BOL_KEYS) {
          if (s.startsWith(k, i)) {
            const rest = go(i + k.length);
            if (rest) {
              res = [{ text: token.substr(i, k.length), bol: k }, ...rest];
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

  // Shared layout parser: returns { beats: [token...], vibhags: [len...] }.
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

  // Parse a bol composition. Returns { beats, vibhags, events, errors } where
  // events = [{ pos, len, bol, text }] in beat units (pos fractional).
  function parseBols(text) {
    const { beats, vibhags } = splitLayout(text || '');
    const errors = [];
    const cells = [];
    const events = [];
    beats.forEach((tok, bi) => {
      const parts = splitBols(tok);
      if (!parts) {
        errors.push({ beat: bi, token: tok, msg: `Unknown bol "${tok}" in beat ${bi + 1}` });
        cells.push({ text: tok, parts: [], error: true });
        return;
      }
      cells.push({ text: tok, parts });
      const n = parts.length;
      parts.forEach((p, k) => {
        if (!p.rest) events.push({ pos: bi + k / n, len: 1 / n, bol: p.bol, text: p.text });
      });
    });
    return { beats: beats.length, vibhags, cells, events, errors };
  }

  const SWAR_SEMI = { S: 0, r: 1, R: 2, g: 3, G: 4, m: 5, M: 6, P: 7, d: 8, D: 9, n: 10, N: 11 };

  function parseSwarToken(tok) {
    const out = [];
    let i = 0;
    while (i < tok.length) {
      const c = tok[i];
      if (c === '-' || c === '_') { out.push({ sustain: true }); i++; continue; }
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
        errors.push({ beat: bi, token: tok, msg: `Bad swar "${tok}" in beat ${bi + 1}` });
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
  // ignored. Returns { notes, total, errors }.
  function parseSargam(text, defaultLen) {
    const notes = [];
    const errors = [];
    let pos = 0;
    let len = defaultLen;
    let last = null;
    const src = (text || '').replace(/\|/g, ' ')
      .replace(/\(([^)]*)\)/g, (_, inner) => '(' + inner.replace(/\s+/g, '') + ')');   // "(S R)" = "(SR)"
    for (const tok of src.split(/\s+/).filter(Boolean)) {
      const m = tok.match(/^(\(?)([^[\]()]*)(\)?)(?:\[([^\]]*)\])?$/);
      if (!m || m[1] !== (m[3] && '(')) { errors.push(`Bad "${tok}"`); continue; }
      const group = !!m[1];
      if (!m[2]) { errors.push(`"${tok}" has no swar`); continue; }
      if (m[4] !== undefined) {
        const v = Number(m[4]);
        if (!(v > 0 && v <= 64)) { errors.push(`Bad length [${m[4]}] in "${tok}"`); continue; }
        len = v;
      }
      const parts = parseSwarToken(m[2]);
      if (!parts || !parts.length) { errors.push(`Bad swar "${tok}"`); continue; }
      const each = group ? len / parts.length : len;
      for (const p of parts) {
        if (p.sustain && last) last.len = round(last.len + each);
        else {
          last = { pos: round(pos), len: round(each), semi: p.sustain || p.rest ? null : p.semi };
          notes.push(last);
        }
        pos += each;
      }
    }
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
  function swarLabel(semi, lang = 'en') {
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
      if (!m || beat < 1 || beat >= beats + 1) { errors.push(`Bad position "${tok}"`); continue; }
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
