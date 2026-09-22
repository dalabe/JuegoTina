window.JT = window.JT || {};

/* Sonidos sintetizados con WebAudio (no requiere archivos de audio). */
JT.Audio = (function () {
  let ctx = null, master = null;

  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.8;
      master.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function out(pan) {
    if (ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan || 0));
      p.connect(master);
      return p;
    }
    return master;
  }

  /* Maullido: volume 0..1, pan -1..1, muffled = suena desde otro piso */
  function meow(volume = 1, pan = 0, muffled = false) {
    if (!ctx || volume <= 0.01) return;
    const t = ctx.currentTime, dur = 0.75;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.18);
    osc.frequency.exponentialRampToValueAtTime(700, t + 0.45);
    osc.frequency.exponentialRampToValueAtTime(430, t + dur);
    const vib = ctx.createOscillator(), vibG = ctx.createGain();
    vib.frequency.value = 7; vibG.gain.value = 18;
    vib.connect(vibG); vibG.connect(osc.frequency);

    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass'; f1.Q.value = 4;
    f1.frequency.setValueAtTime(900, t);
    f1.frequency.linearRampToValueAtTime(1800, t + 0.2);
    f1.frequency.linearRampToValueAtTime(1000, t + dur);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = muffled ? 650 : 5000;

    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5 * volume, t + 0.06);
    g.gain.setValueAtTime(0.5 * volume, t + dur - 0.25);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(f1); f1.connect(lp); lp.connect(g); g.connect(out(pan));
    osc.start(t); vib.start(t);
    osc.stop(t + dur + 0.05); vib.stop(t + dur + 0.05);
  }

  function tone(freq, start, dur, type = 'triangle', vol = 0.25) {
    const t = ctx.currentTime + start;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function win() {
    if (!ctx) return;
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.25));
    setTimeout(() => meow(1, 0), 700);
  }
  function lose() {
    if (!ctx) return;
    [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.2, 0.35, 'sine', 0.22));
  }
  function stairs(up) {
    if (!ctx) return;
    (up ? [440, 554, 659] : [659, 554, 440]).forEach((f, i) => tone(f, i * 0.06, 0.1, 'square', 0.06));
  }
  function tick() {
    if (!ctx) return;
    tone(1200, 0, 0.05, 'square', 0.05);
  }

  return { unlock, meow, win, lose, stairs, tick };
})();
