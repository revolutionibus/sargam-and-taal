// Writes what is played along with the taal as a sargam line, beat by beat.
// Notes come in as they are played, timed in beats (see app.js); each beat is
// written once nothing played later can change it, on the simplest grid that
// fits it: a whole beat, or 2, 3, 4, 6 or 8 notes to the beat as a group.
(function (root) {
  'use strict';
  const GRIDS = [1, 2, 3, 4, 6, 8];
  // What a finer grid costs, in beats of timing error: a slightly late swar
  // stays on the beat rather than becoming the second of six.
  const GRID_COST = { 1: 0, 2: 0.02, 3: 0.04, 4: 0.05, 6: 0.08, 8: 0.1 };
  const EARLY = 0.25;        // beats: how early a swar may be for the next beat ...
  const EARLY_S = 0.07;      // ... and in seconds (a quarter beat at a slow tempo is a rhythm)
  const REST_GAP = 0.25;     // beats of silence before a gap is written as a rest
  const GRACE_S = 0.08;      // a shorter swar leading into the next is a grace swar
  const GRACE_BEATS = 1 / 12;  // ... if also shorter than this (fast runs stay swars)
  const LEGATO_S = 0.15;     // key still down this long into the next swar: "^"
  const LAG = 1.5;           // beats after a beat starts before it is written
  const SWAR_CHARS = 'SrRgGmMPdDnN';

  function swarText(semi) {
    const oct = Math.floor(semi / 12);
    return '.'.repeat(Math.max(0, -oct)) + SWAR_CHARS[semi - 12 * oct] + "'".repeat(Math.max(0, oct));
  }

  // The grid for one beat's events (fractions of the beat) with the least
  // timing error, a finer grid counting as more error; two swars on one slot
  // rule a grid out unless nothing fits. Returns { g, cost }.
  function pickGrid(ons, rests = []) {
    let best = null;
    for (const g of GRIDS) {
      const slot = (f) => Math.max(0, Math.min(g - 1, Math.round(f * g)));
      const used = ons.map(slot);
      const clash = new Set(used).size < used.length;
      const err = Math.max(0, ...ons.concat(rests).map((f) => Math.abs(f - slot(f) / g)));
      const cost = err + GRID_COST[g] + (clash ? 10 : 0);
      if (!best || cost < best.cost - 1e-9) best = { g, cost };
    }
    return best;
  }

  // "(S-R-)" -> "(SR)", "(S---)" -> "S", "(~-)" -> "~": the coarsest grid
  // that says the same.
  function simplify(parts) {
    let p = parts;
    for (let d = p.length; d > 1; d--) {
      if (p.length % d) continue;
      if (p.every((x, i) => i % d === 0 || x === '-')) { p = p.filter((_, i) => i % d === 0); break; }
    }
    return p.length === 1 ? p[0] : '(' + p.join('') + ')';
  }

  class Transcriber {
    // beats: beats per avartan (one line each); vibhags: their lengths;
    // start: the beat (same count as the positions given) where line 1 starts;
    // lengthMark: add [1] to the first beat, when the text before it may have
    // set another length.
    constructor({ beats, vibhags, start = 0, lengthMark = false }) {
      this.beats = beats;
      this.start = start;
      this.lengthMark = lengthMark;
      this.vibEnds = new Set();
      let b = 0;
      for (const v of vibhags || [beats]) this.vibEnds.add(b += v);
      this.notes = [];         // { id, semi, on, tOn, off, tOff, prev, released }
      this.down = new Map();   // key id -> its note
      this.next = start;       // next beat to write
      this.state = 'rest';     // what sounds at the end of the last beat written
      this.silent = '';        // text of silent beats, held back until a swar follows
      this.closed = true;      // the text written so far ends with "|" (or nothing)
      this.now = { pos: start, time: 0 };
      this.ref = null;         // a recent { pos, time }, to measure seconds per beat
      this.spb = 0.5;
    }

    // Keep the time and the tempo (seconds per beat) up to date.
    clock(pos, time) {
      this.now = { pos, time };
      const r = this.ref;
      if (!r) { this.ref = { pos, time }; return; }
      if (pos - r.pos > 1) {
        this.spb = (time - r.time) / (pos - r.pos);
        if (pos - r.pos > 4) this.ref = { pos, time };
      }
    }

    // pos: beats (from the same zero as start); time: seconds.
    noteOn(id, semi, pos, time) {
      this.clock(pos, time);
      const last = this.notes[this.notes.length - 1];
      const n = { id, semi, on: pos, tOn: time, off: null, tOff: null, prev: null, released: null, spb: this.spb };
      // One swar at a time: a new key ends the swar before it. If that key is
      // still down, the two may be joined ("^"), decided when it comes up.
      if (last && last.off === null) {
        Object.assign(last, { off: pos, tOff: time });
        if (this.down.get(last.id) === last) n.prev = last;
      }
      this.notes.push(n);
      this.down.set(id, n);
    }

    noteOff(id, pos, time) {
      this.clock(pos, time);
      const n = this.down.get(id);
      if (!n) return;
      this.down.delete(id);
      n.released = time;
      if (n.off === null) Object.assign(n, { off: pos, tOff: time });
    }

    // Text for the beats that can no longer change by pos, or for every beat
    // up to the last swar's end when final (playing has stopped).
    take(pos, time, final = false) {
      this.clock(pos, time);
      if (final) for (const n of this.notes) if (n.off === null) Object.assign(n, { off: pos, tOff: time });
      const notes = this.mainNotes();
      const lastEnd = notes.length ? Math.max(...notes.map((n) => n.end)) : this.start;
      const until = final ? Math.ceil(lastEnd - REST_GAP - 1e-9) : Math.floor(pos - LAG + 1e-9) + 1;
      let out = '';
      while (this.next < until) {
        const { text, silent } = this.writeBeat(this.next++, notes, final ? lastEnd : Infinity);
        if (silent) { this.silent += text; continue; }
        out += this.silent + text;
        this.silent = '';
      }
      if (out) this.closed = /\|\s*$/.test(out);
      if (final && !this.closed) { out += ' |'; this.closed = true; }
      return out;
    }

    // Swars with their grace swars folded in, the beat each belongs to, and
    // where each one's sound ends (a short gap before the next swar is no rest:
    // connected playing).
    mainNotes() {
      const all = this.notes;
      const out = [];
      let grace = [];
      for (let i = 0; i < all.length; i++) {
        const n = all[i], next = all[i + 1];
        // A grace swar: very short, leading straight into the next one, and let
        // go as that one starts (a key held on is a chord, not a grace swar).
        if (next && next.tOn - n.tOn < GRACE_S && next.on - n.on < GRACE_BEATS &&
            (n.released ?? this.now.time) - next.tOn < GRACE_S) {
          grace.push(n);
          continue;
        }
        out.push({ ...n, grace: grace.map((g) => g.semi), start: grace.length ? grace[0].on : n.on });
        grace = [];
      }
      for (let i = 0; i < out.length; i++) {
        const m = out[i], next = out[i + 1];
        // end: where its sound ends; rest: silence follows it.
        m.end = m.off === null ? Infinity : m.off;
        m.rest = m.off !== null;
        if (next && next.start - m.end < REST_GAP) Object.assign(m, { end: next.start, rest: false });
        // "^": the swar before sounded on its own (not a chord) and was still
        // held well into this one.
        const p = m.prev;
        m.legato = !!p && !m.grace.length && m.tOn - p.tOn >= GRACE_S &&
          (p.released ?? this.now.time) - m.tOn >= LEGATO_S;
        // Its beat. Late in a beat it may be an early swar of the next one: it
        // is, if it is clearly nearer the next beat than any slot of the grid
        // the rest of this beat is on, and the next beat has no swar of its own
        // on it (played on time or a little early).
        let k = Math.floor(m.on + 1e-9);
        const f = m.on - k;
        if (f > 1 - EARLY && (1 - f) * m.spb < EARLY_S && !out.some((x) => x !== m && x.on > m.on && x.on < k + 1.12)) {
          const { g } = pickGrid(out.filter((x) => x !== m && x.beat === k).map((x) => x.on - k));
          const near = Math.abs(f - Math.min(g - 1, Math.round(f * g)) / g);
          if (1 - f < near - 0.04) k++;
        }
        m.beat = k;
      }
      return out;
    }

    writeBeat(k, notes, cut) {
      // Events in this beat, as fractions of it: swars starting, and rests
      // (a swar ending with silence after it). A rest starting just before a
      // beat is too short to write: it starts on that beat.
      const ons = notes.filter((n) => n.beat === k);
      const rests = notes.filter((n) => n.rest && n.end < cut - 1e-9 && Math.floor(n.end + REST_GAP - 1e-9) === k)
        .map((n) => Math.max(0, n.end - k));
      const { g } = pickGrid(ons.map((n) => n.on - k), rests);
      const slots = new Array(g).fill(null);
      const at = (f) => Math.max(0, Math.min(g - 1, Math.round(f * g)));
      for (const f of rests) if (!slots[at(f)]) slots[at(f)] = '~';
      for (const n of ons) slots[at(n.on - k)] = n;   // a later swar on the same slot wins
      // Silent: no swar sounds in it at all.
      const silent = slots.every((s) => !s || s === '~') && (this.state === 'rest' || slots[0] === '~');
      // Text of each slot; "-" carries on whatever sounds (a swar or a rest).
      const parts = slots.map((s, i) => {
        if (s && s !== '~') {
          this.state = 'swar';
          const grace = s.grace.length ? '<' + s.grace.map(swarText).join('') + '>' : '';
          return grace + (s.legato ? '^' : '') + swarText(s.semi);
        }
        if (s === '~' || (i === 0 && this.state === 'rest')) {
          this.state = 'rest';
          return '~';
        }
        return '-';
      });
      let tok = simplify(parts);
      if (this.lengthMark) { tok += '[1]'; this.lengthMark = false; }
      const inLine = (k - this.start) % this.beats;
      const end = inLine + 1;
      let text = (inLine === 0 ? '' : ' ') + tok;
      if (end === this.beats) text += ' |\n';
      else if (this.vibEnds.has(end)) text += ' |';
      return { text, silent };
    }
  }

  const api = { Transcriber, swarText };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Transcribe = api;
})(this);
