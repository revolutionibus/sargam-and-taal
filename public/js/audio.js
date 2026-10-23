// Audio engine: sample loading, retuning to the chosen Sa, per-channel buses,
// and small synthesized fallbacks used when a sample file is missing.
(function (root) {
  'use strict';
  const D = root.Data;
  const BUSES = ['taal', 'dayan', 'bayan', 'manjeera', 'lehra', 'tanpura', 'swar', 'sargam'];
  const LEGATO_OFFSET = 0.3;  // seconds into the sample a legato note starts
  const LEGATO_FADE = 0.04;   // its fade-in, in place of the attack
  const RELEASE = { harmonium: 0.12, piano: 0.25, violin: 0.2 };   // default fade after a melodic note
  // Vibrato added to an instrument's samples: rate (Hz), depth (cents either
  // side), and how long the note stays straight before it fades in over rise (s).
  const VIBRATO = { violin: { rate: 5.6, cents: 16, delay: 0.25, rise: 0.45 } };
  // Meend curves: how far through the slide the pitch is (0 to 1, in
  // semitones) at each point of its time (0 to 1). 'even' is an exponential ramp.
  const MEEND_CURVES = {
    smooth: (x) => x * x * (3 - 2 * x),   // eases out of one swar and into the next
    late: (x) => x * x * x,               // lingers on the first swar, then falls in
    early: (x) => 1 - Math.pow(1 - x, 3), // leaves at once, settles into the next
  };

  class Engine {
    constructor() {
      this.ctx = null;
      this.buffers = new Map();   // file name -> AudioBuffer
      this.missing = new Set();   // file names that failed to load
      this.loading = new Map();   // file name -> Promise
      this.lastVariant = {};
      this.saSemis = 0;           // Sa relative to C#4, in semitones (fractional)
      this.tablaFine = 0;         // extra dayan tuning, semitones
      this.meendCurve = 'even';   // 'even' or a key of MEEND_CURVES
      this.vol = { master: 0.8, taal: 0.9, dayan: 1, bayan: 1, manjeera: 0.5,
                   lehra: 0.6, tanpura: 0.6, swar: 0.5, sargam: 0.7 };
      this.session = null;
      this.preview = null;
      this.onSamplesChanged = null;
    }

    ensure() {
      if (!this.ctx) {
        const Ctx = root.AudioContext || root.webkitAudioContext;
        this.ctx = new Ctx({ latencyHint: 'interactive' });
        this.comp = this.ctx.createDynamicsCompressor();
        this.comp.threshold.value = -10;
        this.comp.ratio.value = 4;
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = this.vol.master;
        this.masterGain.connect(this.comp).connect(this.ctx.destination);
        this.noise = this.makeNoise();
        this.preview = this.makeSession();
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return this.ctx;
    }

    get now() { return this.ctx ? this.ctx.currentTime : 0; }

    // ── Sessions & volume ────────────────────────────────────────────────
    makeSession() {
      const c = this.ctx;
      const s = { out: c.createGain() };
      s.out.connect(this.masterGain);
      for (const b of BUSES) s[b] = c.createGain();
      s.taal.connect(s.out);
      s.dayan.connect(s.taal); s.bayan.connect(s.taal); s.manjeera.connect(s.taal);
      s.lehra.connect(s.out); s.tanpura.connect(s.out); s.swar.connect(s.out); s.sargam.connect(s.out);
      this.applyVolumes(s);
      s.voices = {};
      return s;
    }

    applyVolumes(s) {
      if (!s) return;
      const t = this.ctx.currentTime;
      for (const b of BUSES) s[b].gain.setTargetAtTime(this.vol[b], t, 0.02);
    }

    setVolume(name, v) {
      this.vol[name] = v;
      if (!this.ctx) return;
      if (name === 'master') this.masterGain.gain.setTargetAtTime(v, this.ctx.currentTime, 0.02);
      else { this.applyVolumes(this.session); this.applyVolumes(this.preview); }
    }

    startSession() {
      this.ensure();
      this.session = this.makeSession();
      return this.session;
    }

    stopSession(fade, s = this.session) {
      if (!s) return;
      if (s === this.session) this.session = null;
      const t = this.ctx.currentTime;
      const len = fade ? 1.2 : 0.04;
      s.out.gain.setValueAtTime(s.out.gain.value, t);
      s.out.gain.linearRampToValueAtTime(0, t + len);
      setTimeout(() => s.out.disconnect(), (len + 0.2) * 1000);
    }

    // ── Tuning ───────────────────────────────────────────────────────────
    // key: 0..11 (C..B), cents: -100..100. Picks the octave closest to C#.
    setSa(key, cents) {
      let s = key - 1 + cents / 100;
      while (s >= 6) s -= 12;
      while (s < -6) s += 12;
      this.saSemis = s;
    }
    saFrequency(octaveOffset = 0) {
      return 440 * Math.pow(2, (D.SAMPLE_BASE_MIDI + this.saSemis - 69) / 12 + octaveOffset);
    }

    // ── Sample loading ──────────────────────────────────────────────────
    filesForGroup(group) {
      const n = D.SAMPLE_GROUPS[group];
      if (!n) return [group + '.wav'];
      return Array.from({ length: n }, (_, i) => `${group}_${i + 1}.wav`);
    }

    load(files) {
      this.ensure();
      return Promise.all(files.map((f) => this.loadFile(f)));
    }

    loadFile(file) {
      if (this.buffers.has(file) || this.missing.has(file)) return Promise.resolve();
      if (this.loading.has(file)) return this.loading.get(file);
      const p = this.readSample(file)
        .then((ab) => new Promise((res, rej) => this.ctx.decodeAudioData(ab, res, rej)))
        .then((buf) => { this.buffers.set(file, buf); })
        .catch(() => { this.missing.add(file); })
        .finally(() => {
          this.loading.delete(file);
          if (this.onSamplesChanged) this.onSamplesChanged();
        });
      this.loading.set(file, p);
      return p;
    }

    // The standalone build (build_standalone.py) opens from file://, where
    // fetch is blocked: there each sample is a script that sets
    // TaalSamples[file] to its base64 bytes.
    readSample(file) {
      if (!root.TAAL_STANDALONE) {
        return fetch('sounds/' + file)
          .then((r) => { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); });
      }
      return new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'sounds/' + file.replace(/\.wav$/, '.js');
        s.onload = () => {
          const b64 = (root.TaalSamples || {})[file];
          delete root.TaalSamples[file];
          s.remove();
          if (!b64) { rej(new Error('empty')); return; }
          const bin = atob(b64), bytes = new Uint8Array(bin.length);
          for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          res(bytes.buffer);
        };
        s.onerror = () => { s.remove(); rej(new Error('missing')); };
        document.head.appendChild(s);
      });
    }

    // Random variant of a group, avoiding immediate repeats. variant (1-based)
    // asks for that recording, wrapping round when the group has fewer.
    pickBuffer(group, variant) {
      const all = this.filesForGroup(group);
      if (variant && all.length > 1) {
        const f = all[(variant - 1) % all.length];
        if (this.buffers.has(f)) return this.buffers.get(f);
      }
      const files = all.filter((f) => this.buffers.has(f));
      if (!files.length) return null;
      let i = Math.floor(Math.random() * files.length);
      if (files.length > 1 && files[i] === this.lastVariant[group]) i = (i + 1) % files.length;
      this.lastVariant[group] = files[i];
      return this.buffers.get(files[i]);
    }

    // legato: start past the sample's attack and fade in, so the note comes
    // in without a new strike.
    // loop: [start, end] (s) repeated while a note with a dur is held.
    // vibrato: see VIBRATO; a legato note picks it up sooner.
    // glides: meend, [{ at, end, semis }] in seconds (see rampPitch).
    playBuffer(buf, time, bus, { semis = 0, vel = 1, pan = 0, dur = 0, release = 0.25, legato = false,
                                 loop = null, vibrato = null, glides = null } = {}) {
      const c = this.ctx;
      const src = c.createBufferSource();
      src.buffer = buf;
      const rate = Math.pow(2, semis / 12);
      src.playbackRate.value = rate;
      if (glides) this.rampPitch(src.playbackRate, glides.map((g) => ({ at: g.at, end: g.end, value: Math.pow(2, g.semis / 12) })));
      if (loop && dur > 0) {
        src.loop = true;
        [src.loopStart, src.loopEnd] = loop;
      }
      if (vibrato) {
        const lfo = c.createOscillator();
        lfo.frequency.value = vibrato.rate * (0.95 + Math.random() * 0.1);
        const depth = c.createGain();
        const full = rate * (Math.pow(2, vibrato.cents / 1200) - 1);
        const delay = legato ? 0.05 : vibrato.delay;
        const rise = legato ? 0.2 : vibrato.rise;
        depth.gain.setValueAtTime(0, time);
        depth.gain.setValueAtTime(0, time + delay);
        depth.gain.linearRampToValueAtTime(full, time + delay + rise);
        lfo.connect(depth).connect(src.playbackRate);
        lfo.start(time);
        src.onended = () => lfo.stop();
      }
      const g = c.createGain();
      g.gain.value = vel;
      if (legato) {
        g.gain.setValueAtTime(0, time);
        g.gain.linearRampToValueAtTime(vel, time + LEGATO_FADE);
      }
      let node = src.connect(g);
      if (pan && c.createStereoPanner) {
        const p = c.createStereoPanner();
        p.pan.value = pan;
        node = node.connect(p);
      }
      node.connect(bus);
      src.start(time, legato ? LEGATO_OFFSET : 0);
      if (dur > 0) {
        g.gain.setValueAtTime(vel, time + dur);
        g.gain.linearRampToValueAtTime(0, time + dur + release);
        src.stop(time + dur + release + 0.05);
      }
      return { src, gain: g };
    }

    // Meend: glide a pitch param (frequency or playback rate) through
    // [{ at, end, value }], holding each value until the next glide starts.
    // Even: exponential, so the pitch moves evenly through the swars in
    // between; the other curves (meendCurve) are drawn as value curves.
    rampPitch(param, glides) {
      const shape = MEEND_CURVES[this.meendCurve];
      let v = param.value, last = -Infinity;
      for (const g of glides) {
        if (!shape) {
          param.setValueAtTime(v, g.at);
          param.exponentialRampToValueAtTime(v = g.value, g.end);
          continue;
        }
        // A curve may not overlap the one before it (that throws): in a chain at
        // full meend length a slide starts where the last one ends, and
        // rounding can put it a hair earlier.
        const at = Math.max(g.at, last + 1e-6);
        if (g.end <= at) { param.setValueAtTime(v = g.value, at); continue; }
        const from = v, ratio = g.value / v, curve = new Float32Array(32);
        for (let i = 0; i < curve.length; i++) curve[i] = from * Math.pow(ratio, shape(i / (curve.length - 1)));
        param.setValueCurveAtTime(curve, at, g.end - at);
        v = g.value;
        last = g.end;
      }
    }

    // ── Percussion ──────────────────────────────────────────────────────
    stroke(group, time, vel, bus, extraSemis = 0, variant = 0) {
      if (!group) return;
      const pitched = !D.UNPITCHED.has(group);
      const semis = pitched ? this.saSemis + this.tablaFine + extraSemis : 0;
      const v = vel * (0.92 + Math.random() * 0.12);
      const buf = this.pickBuffer(group, variant);
      if (buf) this.playBuffer(buf, time, bus, { semis, vel: v });
      else if (this.filesForGroup(group).every((f) => this.missing.has(f))) {
        this.synthStroke(group, time, v, bus);
      }
    }

    // ── Melodic ─────────────────────────────────────────────────────────
    // semi: semitones relative to Sa (0 = madhya Sa). Uses the sample nearest
    // the sounding pitch, so the key's transposition is kept small.
    // release: fade after dur (default depends on the instrument).
    // legato: no new attack (see playBuffer).
    // glides: meend, [{ at, end, semi }] (seconds; semi as above).
    melodic(instrument, semi, time, dur, vel, bus, release, legato = false, glides = null) {
      const set = D.MELODIC[instrument];
      let best = null;
      for (const [file, off, loop] of set) {
        const f = file + '.wav';
        if (!this.buffers.has(f)) continue;
        const d = Math.abs(this.saSemis + semi - off);
        if (!best || d < Math.abs(this.saSemis + semi - best[1])) best = [f, off, loop];
      }
      if (!best) {
        if (set.every(([f]) => this.missing.has(f + '.wav'))) this.synthMelodic(instrument, semi, time, dur, vel, bus, glides);
        return null;
      }
      return this.playBuffer(this.buffers.get(best[0]), time, bus,
        { semis: this.saSemis + semi - best[1], vel, dur,
          release: release ?? RELEASE[instrument] ?? 0.6, legato,
          loop: best[2], vibrato: VIBRATO[instrument],
          glides: glides && glides.map((g) => ({ at: g.at, end: g.end, semis: this.saSemis + g.semi - best[1] })) });
    }

    melodicFiles(instrument) {
      return D.MELODIC[instrument].map(([f]) => f + '.wav');
    }

    // Tanpura string: semi relative to tabla Sa (madhya tanpura Sa = -12).
    tanpuraFiles(tone) {
      return Object.keys(D.TANPURA_ROLE_SEMI).map((r) => `tanpura_${tone}_${r}.wav`);
    }

    tanpuraString(tone, semi, preferRole, time, vel, pan, bus, voiceKey) {
      let role = preferRole;
      if (!role || D.TANPURA_ROLE_SEMI[role] === undefined) {
        role = 'sa';
        for (const r of ['pa', 'sa', 'sa_low']) {
          if (Math.abs(semi - D.TANPURA_ROLE_SEMI[r]) < Math.abs(semi - D.TANPURA_ROLE_SEMI[role])) role = r;
        }
      }
      const file = `tanpura_${tone}_${role}.wav`;
      const s = this.session || this.preview;
      // A new pluck damps the previous note on the same string.
      const prev = s.voices[voiceKey];
      if (prev) {
        prev.gain.gain.cancelScheduledValues(time);
        prev.gain.gain.setTargetAtTime(0, time, 0.12);
        try { prev.src.stop(time + 1); } catch (e) { /* already stopped */ }
      }
      let v = null;
      if (this.buffers.has(file)) {
        v = this.playBuffer(this.buffers.get(file), time, bus,
          { semis: this.saSemis + semi - D.TANPURA_ROLE_SEMI[role], vel, pan });
      } else if (this.missing.has(file)) {
        v = this.synthTanpura(semi, time, vel, pan, bus);
      }
      if (v) s.voices[voiceKey] = v;
    }

    // ── Synthesized fallbacks ───────────────────────────────────────────
    makeNoise() {
      const c = this.ctx;
      const b = c.createBuffer(1, c.sampleRate, c.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      return b;
    }

    tone(freq, time, amp, decay, bus, type = 'sine') {
      const c = this.ctx;
      const o = c.createOscillator();
      o.type = type;
      o.frequency.value = freq;
      const g = c.createGain();
      g.gain.setValueAtTime(0, time);
      g.gain.linearRampToValueAtTime(amp, time + 0.003);
      g.gain.setTargetAtTime(0, time + 0.003, decay);
      o.connect(g).connect(bus);
      o.start(time);
      o.stop(time + decay * 7 + 0.05);
      return o;
    }

    noiseBurst(time, amp, decay, bus, filterType, freq, q = 1) {
      const c = this.ctx;
      const src = c.createBufferSource();
      src.buffer = this.noise;
      const f = c.createBiquadFilter();
      f.type = filterType;
      f.frequency.value = freq;
      f.Q.value = q;
      const g = c.createGain();
      g.gain.setValueAtTime(amp, time);
      g.gain.setTargetAtTime(0, time, decay);
      src.connect(f).connect(g).connect(bus);
      src.start(time, Math.random() * 0.5);
      src.stop(time + decay * 7 + 0.05);
    }

    synthStroke(group, t, v, bus) {
      const f = this.saFrequency() * Math.pow(2, this.tablaFine / 12);
      const ring = (amps, decays, click) => {
        amps.forEach((a, i) => this.tone(f * (i + 1), t, a * v * 0.5, decays[i], bus));
        this.noiseBurst(t, click * v, 0.004, bus, 'highpass', 3000);
      };
      const bayanGe = (bend) => {
        const o = this.tone(f * 0.36, t, v, 0.45, bus);
        o.frequency.setValueAtTime(f * 0.34, t);
        o.frequency.exponentialRampToValueAtTime(f * 0.36 * bend, t + 0.12);
        this.noiseBurst(t, 0.5 * v, 0.015, bus, 'lowpass', 300);
      };
      switch (group) {
        case 'na': case 'ne': ring([0.35, 0.8, 0.55, 0.35, 0.2], [0.35, 0.45, 0.3, 0.2, 0.12], 0.5); break;
        case 'sur': case 'tin': ring([0.6, 0.7, 0.35, 0.15, 0.1], [0.5, 0.4, 0.25, 0.15, 0.1], 0.3); break;
        case 'tun': case 'din': case 'soft_din': ring([1, 0.35, 0.12, 0.05], [0.9, 0.5, 0.3, 0.2], 0.15); break;
        case 'ti': case 'te': case 'ra': case 'tra':
          this.tone(f, t, 0.25 * v, 0.05, bus);
          this.noiseBurst(t, 0.6 * v, 0.03, bus, 'bandpass', group === 'ra' ? 1400 : 1800);
          if (group === 'tra') this.noiseBurst(t + 0.035, 0.45 * v, 0.03, bus, 'bandpass', 1400);
          break;
        case 'ki': case 'thap': case 'tichki': case 'closed_ge':
          this.noiseBurst(t, 0.9 * v, 0.035, bus, 'bandpass', 500, 0.8);
          this.tone(f * 0.5, t, 0.4 * v, 0.04, bus);
          break;
        case 'manjeera_open':
          [2840, 3970, 5190, 6380].forEach((fr, i) => this.tone(fr, t, 0.12 * v, 0.9 - i * 0.15, bus));
          this.noiseBurst(t, 0.3 * v, 0.02, bus, 'highpass', 5000);
          break;
        case 'manjeera_closed':
          this.noiseBurst(t, 0.5 * v, 0.03, bus, 'highpass', 4000);
          break;
        default:
          if (group.startsWith('pk_')) ring([0.8, 0.3, 0.1], [0.4, 0.25, 0.15], 0.2);
          else bayanGe(group.includes('sliding') ? 1.25 : 1.08);
      }
    }

    synthMelodic(instrument, semi, t, dur, vel, bus, glides) {
      const c = this.ctx;
      const freq = (s) => this.saFrequency() * Math.pow(2, s / 12);
      const f = freq(semi);
      const glide = (o, mul) => glides && this.rampPitch(o.frequency, glides.map((g) => ({ at: g.at, end: g.end, value: freq(g.semi) * mul })));
      if (instrument === 'harmonium' || instrument === 'violin') {
        const lp = c.createBiquadFilter();
        lp.type = 'lowpass'; lp.frequency.value = 2200;
        const g = c.createGain();
        g.gain.setValueAtTime(0, t);
        g.gain.linearRampToValueAtTime(0.18 * vel, t + 0.03);
        g.gain.setValueAtTime(0.18 * vel, t + dur);
        g.gain.linearRampToValueAtTime(0, t + dur + 0.1);
        lp.connect(g).connect(bus);
        for (const [type, mul] of [['sawtooth', 1], ['square', 1.003]]) {
          const o = c.createOscillator();
          o.type = type; o.frequency.value = f * mul;
          glide(o, mul);
          o.connect(lp); o.start(t); o.stop(t + dur + 0.15);
        }
      } else {
        glide(this.tone(f, t, 0.4 * vel, instrument === 'santoor' ? 0.6 : 1.2, bus, 'triangle'), 1);
        glide(this.tone(f * 2, t, 0.1 * vel, 0.3, bus), 2);
      }
    }

    synthTanpura(semi, t, vel, pan, bus) {
      const c = this.ctx;
      const f = this.saFrequency() * Math.pow(2, semi / 12);
      const o = c.createOscillator();
      o.type = 'sawtooth'; o.frequency.value = f;
      const lp = c.createBiquadFilter();
      lp.type = 'bandpass'; lp.Q.value = 1.5;
      lp.frequency.setValueAtTime(f * 3, t);
      lp.frequency.exponentialRampToValueAtTime(f * 14, t + 1.2);
      lp.frequency.exponentialRampToValueAtTime(f * 4, t + 5);
      const g = c.createGain();
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.35 * vel, t + 0.02);
      g.gain.setTargetAtTime(0, t + 0.02, 2.2);
      let node = o.connect(lp).connect(g);
      if (pan && c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = pan; node = node.connect(p); }
      node.connect(bus);
      o.start(t); o.stop(t + 10);
      return { src: o, gain: g };
    }
  }

  root.Engine = Engine;
})(this);
