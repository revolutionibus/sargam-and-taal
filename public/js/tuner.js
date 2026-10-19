// Microphone pitch detection (normalized autocorrelation with parabolic
// interpolation). Calls onPitch(freq | null) about 30 times a second.
(function (root) {
  'use strict';

  class Tuner {
    constructor(engine, onPitch) {
      this.engine = engine;
      this.onPitch = onPitch;
      this.stream = null;
    }

    get running() { return !!this.stream; }

    async start() {
      const ctx = this.engine.ensure();
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
      });
      this.source = ctx.createMediaStreamSource(this.stream);
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 4096;
      this.source.connect(this.analyser);
      this.buf = new Float32Array(this.analyser.fftSize);
      this.timer = setInterval(() => this.onPitch(this.detect()), 30);
    }

    stop() {
      clearInterval(this.timer);
      if (this.source) this.source.disconnect();
      if (this.stream) this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }

    detect() {
      const a = this.analyser;
      const buf = this.buf;
      a.getFloatTimeDomainData(buf);
      const sr = this.engine.ctx.sampleRate;
      // Use the most recent samples (end of the buffer) for low latency.
      const start = buf.length - 2048 - Math.floor(sr / 60) - 1;
      if (start > 0) buf.copyWithin(0, start);
      let rms = 0;
      for (let i = 0; i < 2048; i++) rms += buf[i] * buf[i];
      rms = Math.sqrt(rms / 2048);
      if (rms < 0.01) return null;

      const minLag = Math.floor(sr / 1200);
      const maxLag = Math.floor(sr / 60);
      const n = Math.min(2048, buf.length - maxLag);
      const corr = new Float32Array(maxLag + 1);
      for (let lag = minLag; lag <= maxLag; lag++) {
        let sum = 0, e1 = 0, e2 = 0;
        for (let i = 0; i < n; i++) {
          const x = buf[i], y = buf[i + lag];
          sum += x * y; e1 += x * x; e2 += y * y;
        }
        corr[lag] = sum / Math.sqrt(e1 * e2 + 1e-12);
      }
      // First peak above 90% of the global maximum avoids octave errors.
      let max = 0;
      for (let l = minLag; l <= maxLag; l++) max = Math.max(max, corr[l]);
      if (max < 0.8) return null;
      let lag = -1;
      for (let l = minLag + 1; l < maxLag; l++) {
        if (corr[l] >= 0.9 * max && corr[l] >= corr[l - 1] && corr[l] >= corr[l + 1]) { lag = l; break; }
      }
      if (lag < 0) return null;
      const y0 = corr[lag - 1], y1 = corr[lag], y2 = corr[lag + 1];
      const shift = (y0 - y2) / (2 * (y0 - 2 * y1 + y2) || 1);
      return sr / (lag + shift);
    }
  }

  root.Tuner = Tuner;
})(this);
