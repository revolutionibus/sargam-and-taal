// Look-ahead scheduler: a timer schedules every channel slightly ahead of the
// audio clock, so timing stays sample-accurate even when the UI is busy.
(function (root) {
  'use strict';
  const D = root.Data;
  const N = root.Notation;
  const LOOKAHEAD = 0.15;   // seconds scheduled ahead
  const TICK_MS = 25;
  const LEHRA_INST = 'santoor';   // the lehra always plays on santoor
  const SARGAM_REPEAT_GAP = 0.06;   // seconds of silence between a swar and its repeat

  function compileTaal(t) {
    const p = N.parseBols(t.bols);
    const marks = (t.marks || '').trim().split(/\s+/).filter(Boolean);
    const vibhagStart = new Map();
    let b = 0;
    p.vibhags.forEach((len, i) => { vibhagStart.set(b, marks[i] || ''); b += len; });
    return { ...t, beats: p.beats, vibhags: p.vibhags, cells: p.cells, events: p.events,
             errors: p.errors, marks, vibhagStart };
  }

  function compileLehra(l) {
    const p = N.parseSwars(l.notes);
    return { ...l, beats: p.beats, notes: p.notes, errors: p.errors };
  }

  class Player {
    // opts.settings(): live settings object. opts.findTaal(id), opts.findLehra(id).
    constructor(engine, opts) {
      this.engine = engine;
      this.opts = opts;
      this.playing = false;
      this.visual = [];
      this.timer = null;
      this.taal = null;
      this.lehra = null;
      this.pendingTaal = null;
      this.pendingStop = false;
      this.seq = null;
      this.onEvent = null;       // (type, data) => void, for UI updates
      this.strumUp = true;
      this.sargam = null;
      this.sargamVisual = [];
      this.sargamCount = -1;     // beats since the sargam started (-1 = wait for sam)
    }

    // notes: [{ pos, len, semi | null(rest) }] in beats, from Notation.parseSargam;
    // mode: 'along' | 'call' (alternate avartans: listen, then your turn) | 'silent'.
    setSargam(notes, mode) {
      if (notes && notes.length) {
        const last = notes[notes.length - 1];
        // repeat: the next note is the same swar right after this one, so it
        // gets a small gap to be heard as two notes.
        const repeat = (n, i) => {
          const next = notes[i + 1];
          return n.semi !== null && !!next && next.semi === n.semi && Math.abs(next.pos - (n.pos + n.len)) < 1e-6;
        };
        this.sargam = { notes: notes.map((n, i) => ({ ...n, i, repeat: repeat(n, i) })), mode, total: last.pos + last.len };
      } else {
        this.sargam = null;
      }
      this.sargamCount = -1;
    }

    // One line of the exercise = one avartan; the last line is padded with rests.
    sargamLayout(beats) {
      return { lines: Math.max(1, Math.ceil(this.sargam.total / beats - 1e-9)) };
    }

    get s() { return this.opts.settings(); }

    setTaal(taal) {
      const c = compileTaal(taal);
      if (this.playing && this.taal) this.pendingTaal = c;
      else { this.taal = c; this.beat = Math.min(this.beat || 0, c.beats - 1); }
      return c;
    }

    setLehra(lehra) { this.lehra = lehra ? compileLehra(lehra) : null; }

    // Files needed for the current settings, so they can be loaded before playing.
    neededFiles() {
      const e = this.engine;
      const s = this.s;
      const files = new Set();
      const add = (arr) => arr.forEach((f) => files.add(f));
      const groupsFromTaal = (t) => {
        for (const ev of t.events) {
          if (t.drum === 'pakhawaj') (N.PK_BOLS[ev.bol] || []).forEach(([g]) => add(e.filesForGroup(g)));
          else {
            const b = N.BOLS[ev.bol];
            if (b.r) add(e.filesForGroup(b.r));
            if (b.l) add(e.filesForGroup(b.l));
          }
        }
      };
      if (this.taal) groupsFromTaal(this.taal);
      if (this.seq) this.seq.steps.forEach((st) => { const t = this.opts.findTaal(st.taalId); if (t) groupsFromTaal(compileTaal(t)); });
      add(['manjeera_open.wav', 'manjeera_closed.wav']);
      add(e.melodicFiles(LEHRA_INST));
      add(e.melodicFiles('swarmandal'));
      add(e.tanpuraFiles(s.tanpuraTone));
      add(e.melodicFiles(s.sargamInst));
      return [...files];
    }

    async start({ sequence } = {}) {
      const e = this.engine;
      e.ensure();
      this.seq = sequence ? { ...sequence, i: 0, rep: 0 } : null;
      if (this.seq) this.loadSeqStep(0, true);
      if (this.onEvent) this.onEvent('loading', true);
      await e.load(this.neededFiles());
      if (this.onEvent) this.onEvent('loading', false);
      e.startSession();
      const t0 = e.now + 0.08;
      this.playing = true;
      this.pendingStop = false;
      this.startTime = t0;
      this.nextBeatTime = t0;
      this.beat = this.seq ? 0 : Math.max(0, Math.min(this.s.startBeat - 1, this.taal.beats - 1));
      this.avartan = 0;
      this.absBeat = 0;
      this.tanpura = [
        { next: t0, string: 0 },
        { next: t0 + this.tanpuraCycle() / 2, string: 0 },
      ];
      this.visual = [];
      this.sargamVisual = [];
      this.sargamCount = -1;
      this.timer = setInterval(() => this.tick(), TICK_MS);
      this.tick();
      if (this.onEvent) this.onEvent('state', true);
    }

    // Stop now, or (stopMode 'sam') finish the avartan and end on the sam stroke.
    // A second press while waiting for sam stops immediately.
    stop(immediate) {
      if (!this.playing) return;
      if (!immediate && this.s.stopMode === 'sam' && this.s.taalOn && !this.pendingStop) {
        this.pendingStop = true;
        if (this.onEvent) this.onEvent('pendingStop', true);
        return;
      }
      this.halt();
      this.engine.stopSession(this.s.fadeOut);
      this.visual = [];
      this.sargamVisual = [];
    }

    halt() {
      clearInterval(this.timer);
      this.playing = false;
      this.pendingStop = false;
      this.finishing = false;
      if (this.pendingTaal) this.taal = this.pendingTaal;
      this.pendingTaal = null;
      if (this.onEvent) this.onEvent('state', false);
    }

    // Play the final sam stroke, let it ring, then fade this session out.
    finish(t) {
      this.scheduleBeat(t, true);
      this.visual[this.visual.length - 1].final = true;
      const session = this.engine.session;
      this.halt();
      const ms = Math.max(0, t - this.engine.now) * 1000 + 1500;
      setTimeout(() => this.engine.stopSession(true, session), ms);
    }

    beatDur() { return 60 / this.s.tempo; }

    tick() {
      const e = this.engine;
      const s = this.s;
      const horizon = e.now + LOOKAHEAD;
      while (this.playing && this.nextBeatTime < horizon) {
        if (this.finishing) { this.finish(this.nextBeatTime); return; }
        this.scheduleBeat(this.nextBeatTime);
        this.nextBeatTime += this.beatDur();
        this.advance();
      }
      if (!this.playing) return;
      if (s.tanpuraOn) {
        for (let k = 0; k < s.tanpuraCount; k++) {
          const tp = this.tanpura[k];
          if (tp.next < e.now - 1) tp.next = e.now + 0.05;   // re-enabled after a pause
          while (tp.next < horizon) this.pluckTanpura(k, tp);
        }
      } else {
        for (const tp of this.tanpura) tp.next = e.now + 0.05;
      }
    }

    advance() {
      this.beat++;
      this.absBeat++;
      if (this.beat < this.taal.beats) return;
      // Sam: end of an avartan.
      this.beat = 0;
      this.avartan++;
      if (this.pendingStop) { this.finishing = true; return; }
      if (this.seq) this.advanceSeq();
      if (this.pendingTaal) {
        this.taal = this.pendingTaal;
        this.pendingTaal = null;
        this.sargamCount = -1;   // lines depend on the taal length: restart

        if (this.onEvent) this.onEvent('taalChanged', this.taal);
      }
    }

    advanceSeq() {
      const q = this.seq;
      q.rep++;
      if (q.rep < (q.steps[q.i].repeats || 1)) return;
      let i = q.i + 1;
      if (i >= q.steps.length) {
        if (!q.loop) { this.finishing = true; return; }
        i = 0;
      }
      this.loadSeqStep(i, false);
    }

    loadSeqStep(i, immediate) {
      const q = this.seq;
      q.i = i;
      q.rep = 0;
      const st = q.steps[i];
      const t = this.opts.findTaal(st.taalId);
      if (!t) return;
      const c = compileTaal(t);
      if (immediate) this.taal = c; else this.pendingTaal = c;
      if (st.tempo && this.onEvent) this.onEvent('tempo', st.tempo);
      if (this.onEvent) this.onEvent('seqStep', { i, taal: c });
    }

    // Custom manjeera positions for the current taal (parsed once per change).
    manjeeraHits() {
      const text = (this.s.manjeeraBeats || {})[this.taal.id] || '';
      const key = this.taal.id + '|' + this.taal.beats + '|' + text;
      if (!this._manjeera || this._manjeera.key !== key) {
        this._manjeera = { key, hits: N.parseManjeera(text, this.taal.beats).hits };
      }
      return this._manjeera.hits;
    }

    scheduleBeat(t, samOnly) {
      const s = this.s;
      const e = this.engine;
      const ses = e.session;
      const taal = this.taal;
      const b = this.beat;
      const dur = this.beatDur();

      if (s.taalOn) {
        for (const ev of N.eventsInBeat(taal.events, b)) {
          if (samOnly && ev.pos > b) break;
          const at = t + (ev.pos - b) * dur;
          const accent = s.accentSam && ev.pos === 0 ? 1.12 : 1;
          if (taal.drum === 'pakhawaj') {
            for (const [g, delay] of N.PK_BOLS[ev.bol] || []) e.stroke(g, at + delay, 0.9 * accent, ses.dayan);
          } else {
            const bol = N.BOLS[ev.bol];
            const v = (bol.v || 1) * accent;
            if (bol.r) e.stroke(bol.r, at, 0.85 * v, ses.dayan);
            if (bol.l) e.stroke(bol.l, at, 0.9 * v, ses.bayan);
          }
        }
        if (s.manjeeraOn && s.manjeeraMode === 'custom') {
          for (const h of N.eventsInBeat(this.manjeeraHits(), b)) {
            if (samOnly && h.pos > b) break;
            const at = t + (h.pos - b) * dur;
            if (h.closed) e.stroke('manjeera_closed', at, 0.8, ses.manjeera);
            else e.stroke('manjeera_open', at, h.pos === 0 ? 1 : 0.85, ses.manjeera);
          }
        } else if (s.manjeeraOn) {
          if (taal.vibhagStart.has(b)) {
            const m = taal.vibhagStart.get(b);
            if (m === '0') e.stroke('manjeera_closed', t, 0.9, ses.manjeera);
            else e.stroke('manjeera_open', t, b === 0 ? 1 : 0.8, ses.manjeera);
          } else if (!samOnly) {
            e.stroke('manjeera_closed', t, 0.55, ses.manjeera);
          }
        }
      }

      if (s.lehraOn && this.lehra && this.lehra.beats === taal.beats && !samOnly) {
        for (const n of N.eventsInBeat(this.lehra.notes, b)) {
          const at = t + (n.pos - b) * dur;
          e.melodic(LEHRA_INST, n.semi, at, Math.max(0.05, n.len * dur - 0.02), 0.7, ses.lehra);
        }
      }

      if (b === 0 && s.swarOn && s.swarEvery > 0 && this.avartan % s.swarEvery === 0 && !samOnly) {
        this.strum(t, ses.swar);
      }

      if (!samOnly) this.scheduleSargam(t, b, dur, ses);

      this.visual.push({ time: t, beat: b, avartan: this.avartan, taal,
                         seq: this.seq ? { i: this.seq.i, rep: this.seq.rep } : null });
    }

    // ── Sargam practice ─────────────────────────────────────────────────
    scheduleSargam(t, b, dur, ses) {
      const s = this.s;
      const q = this.sargam;
      if (!s.sargamOn || !q) { this.sargamCount = -1; return; }
      if (this.sargamCount < 0) {
        if (b !== 0) return;          // always begin on sam
        this.sargamCount = 0;
      }
      const beats = this.taal.beats;
      const { lines } = this.sargamLayout(beats);
      const av = Math.floor(this.sargamCount / beats);
      const call = q.mode === 'call';
      const line = (call ? Math.floor(av / 2) : av) % lines;
      const yourTurn = call && av % 2 === 1;
      const lineEnd = (line + 1) * beats;
      const absB = line * beats + (this.sargamCount % beats);   // position in the exercise
      if (b === 0) this.sargamVisual.push({ time: t, kind: 'line', line, yourTurn });
      for (const n of N.eventsInBeat(q.notes, absB)) {
        const at = t + (n.pos - absB) * dur;
        if (n.semi !== null && q.mode !== 'silent' && !yourTurn) {
          // A note running past the avartan is cut at the line end.
          const len = Math.min(n.pos + n.len, lineEnd) - n.pos;
          if (n.repeat) {
            // Stop (incl. a short fade) a little before the repeated swar starts.
            const gap = Math.min(SARGAM_REPEAT_GAP, len * dur * 0.25);
            this.engine.melodic(s.sargamInst, n.semi, at, Math.max(0.03, len * dur - gap - 0.03), 0.75, ses.sargam, 0.03);
          } else {
            this.engine.melodic(s.sargamInst, n.semi, at, Math.max(0.05, len * dur - 0.02), 0.75, ses.sargam);
          }
        }
        this.sargamVisual.push({ time: at, kind: 'note', idx: n.i, line, yourTurn, semi: n.semi });
      }
      // Exercise ended mid-line: the rest of the avartan is padding.
      if (q.total >= absB - 1e-9 && q.total < absB + 1 - 1e-9 && q.total < lineEnd - 1e-9) {
        this.sargamVisual.push({ time: t + (q.total - absB) * dur, kind: 'note', idx: -1, line, yourTurn, semi: null });
      }
      this.sargamCount++;
    }

    // ── Tanpura ─────────────────────────────────────────────────────────
    tanpuraDelays() {
      const s = this.s;
      return s.tanpuraDelays.map((d) => d / s.tanpuraSpeed);
    }
    tanpuraCycle() { return this.tanpuraDelays().reduce((a, b) => a + b, 0); }

    pluckTanpura(k, tp) {
      const s = this.s;
      const e = this.engine;
      const pattern = D.TANPURA_PATTERNS[s.tanpuraPattern] || D.TANPURA_PATTERNS[0];
      const i = tp.string;
      const semi = pattern.strings[i];
      // Middle Sa strings use the two separate Sa recordings; others pick the nearest.
      let role = null;
      if (semi === -12 && i === 1) role = 'sa';
      else if (semi === -12 && i === 2) role = 'sa2';
      else if (semi === -24) role = 'sa_low';
      else if (semi === -17) role = 'pa';
      const detune = k === 1 ? 0.04 : 0;
      const pan = s.tanpuraCount === 2 ? (k === 0 ? -0.35 : 0.35) : 0;
      const vel = (i === 3 ? 0.95 : 0.8) * (s.tanpuraRandom ? 0.9 + Math.random() * 0.15 : 1);
      e.tanpuraString(s.tanpuraTone, semi + detune, role, tp.next, vel, pan,
                      e.session.tanpura, `tp${k}-${i}`);
      let d = this.tanpuraDelays()[i];
      if (s.tanpuraRandom) d *= 0.93 + Math.random() * 0.14;
      tp.next += d;
      tp.string = (i + 1) % 4;
    }

    // ── Swarmandal ──────────────────────────────────────────────────────
    strum(t, bus) {
      const s = this.s;
      const e = this.engine;
      const raga = D.RAGAS.find((r) => r.id === s.swarRaga) || D.RAGAS[0];
      const notes = [];
      for (let o = 0; o <= 24; o += 12) for (const n of raga.scale) if (o + n <= 24) notes.push(o + n);
      if (!this.strumUp) notes.reverse();
      this.strumUp = !this.strumUp;
      const gap = 0.05 / s.swarSpeed;
      notes.forEach((n, i) => {
        e.melodic('swarmandal', n, t + i * gap, 0, 0.35 + Math.random() * 0.15, bus);
      });
    }

    strumNow() {
      const e = this.engine;
      e.ensure();
      const bus = (e.session || e.preview).swar;
      e.load(e.melodicFiles('swarmandal')).then(() => this.strum(e.now + 0.03, bus));
    }
  }

  root.Player = Player;
  root.compileTaal = compileTaal;
  root.compileLehra = compileLehra;
})(this);
