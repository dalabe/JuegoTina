window.JT = window.JT || {};

/* Sonidos y música sintetizados con WebAudio (no requiere archivos de audio). */
JT.Audio = (function () {
  let ctx = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;

  const MUSIC_VOL = 0.32;
  let musicOn = true;
  try { musicOn = localStorage.getItem('jt-music') !== 'off'; } catch (e) { /* sin almacenamiento */ }

  function unlock() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.8;
      master.connect(ctx.destination);
      sfxBus = ctx.createGain();
      sfxBus.connect(master);
      musicBus = ctx.createGain();
      musicBus.gain.value = musicOn ? MUSIC_VOL : 0;
      musicBus.connect(master);

      noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

      // Pausa el audio si la pestaña se oculta
      document.addEventListener('visibilitychange', () => {
        if (!ctx) return;
        if (document.hidden) ctx.suspend(); else ctx.resume();
      });
    }
    if (ctx.state === 'suspended') ctx.resume();
  }

  function out(pan, bus = sfxBus) {
    if (ctx.createStereoPanner) {
      const p = ctx.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan || 0));
      p.connect(bus);
      return p;
    }
    return bus;
  }

  function noise() {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf; s.loop = true;
    return s;
  }

  /* Baja la música un momento para que se oiga bien el maullido (es la pista del juego) */
  function duck(dur) {
    if (!musicOn) return;
    const t = ctx.currentTime, g = musicBus.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(g.value, t);
    g.linearRampToValueAtTime(MUSIC_VOL * 0.3, t + 0.05);
    g.setValueAtTime(MUSIC_VOL * 0.3, t + dur);
    g.linearRampToValueAtTime(MUSIC_VOL, t + dur + 0.4);
  }

  // ───────────────────────── Maullidos ─────────────────────────
  /* Una sílaba de maullido. p = { f0, peak, f1, dur, formant } */
  function voice(t, p, volume, pan, muffled) {
    const dur = p.dur;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(p.f0, t);
    osc.frequency.exponentialRampToValueAtTime(p.peak, t + dur * 0.25);
    osc.frequency.exponentialRampToValueAtTime(p.peak * 0.8, t + dur * 0.6);
    osc.frequency.exponentialRampToValueAtTime(p.f1, t + dur);
    const vib = ctx.createOscillator(), vibG = ctx.createGain();
    vib.frequency.value = 6 + Math.random() * 3; vibG.gain.value = p.peak * 0.02;
    vib.connect(vibG); vibG.connect(osc.frequency);

    const f1 = ctx.createBiquadFilter();
    f1.type = 'bandpass'; f1.Q.value = 4;
    f1.frequency.setValueAtTime(p.formant * 0.5, t);
    f1.frequency.linearRampToValueAtTime(p.formant, t + dur * 0.25);
    f1.frequency.linearRampToValueAtTime(p.formant * 0.55, t + dur);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = muffled ? 650 : 5000;

    const g = ctx.createGain(), att = Math.min(0.06, dur * 0.2);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5 * volume, t + att);
    g.gain.setValueAtTime(0.5 * volume, t + dur * 0.65);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    osc.connect(f1); f1.connect(lp); lp.connect(g); g.connect(out(pan));
    osc.start(t); vib.start(t);
    osc.stop(t + dur + 0.05); vib.stop(t + dur + 0.05);
  }

  const r = (a, b) => a + Math.random() * (b - a);
  /* Distintos maullidos para que Tina no suene siempre igual */
  const MEOWS = {
    long:   () => [[0, { f0: r(480, 560), peak: r(820, 940), f1: r(400, 460), dur: r(0.7, 0.9), formant: 1800 }]],
    short:  () => [[0, { f0: r(600, 680), peak: r(950, 1080), f1: r(620, 700), dur: r(0.28, 0.36), formant: 2100 }]],
    double: () => {
      const a = { f0: r(560, 620), peak: r(900, 1000), f1: 600, dur: r(0.26, 0.32), formant: 2000 };
      return [[0, a], [a.dur + 0.1, { f0: r(520, 580), peak: r(860, 960), f1: 470, dur: r(0.45, 0.55), formant: 1800 }]];
    },
    // "Mrrrp": trino corto y agudo, como cuando un gato saluda
    chirp:  () => [[0, { f0: r(700, 760), peak: r(1250, 1400), f1: r(1000, 1100), dur: r(0.16, 0.2), formant: 2600 }],
                   [0.19, { f0: 1000, peak: r(1300, 1450), f1: 900, dur: 0.14, formant: 2600 }]],
    // Quejido largo y dramático
    yowl:   () => [[0, { f0: r(420, 460), peak: r(700, 760), f1: r(330, 370), dur: r(1.1, 1.3), formant: 1500 }]]
  };

  /* Maullido: volume 0..1, pan -1..1, muffled = suena desde otro piso, kind = tipo (ver MEOWS) */
  function meow(volume = 1, pan = 0, muffled = false, kind = 'long') {
    if (!ctx || volume <= 0.01) return;
    const parts = (MEOWS[kind] || MEOWS.long)();
    const t = ctx.currentTime;
    let end = 0;
    parts.forEach(([off, p]) => { voice(t + off, p, volume, pan, muffled); end = Math.max(end, off + p.dur); });
    duck(end);
  }

  // ───────────────────────── Ronroneo ─────────────────────────
  /* Ronroneo continuo cuya intensidad sube cuando Bella se acerca a Tina */
  let purr = null;
  function buildPurr() {
    const src = noise();
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 320; lp.Q.value = 1.5;
    const body = ctx.createOscillator();         // cuerpo grave del ronroneo
    body.type = 'sawtooth'; body.frequency.value = 52;
    const bodyG = ctx.createGain(); bodyG.gain.value = 0.25;
    const bodyLp = ctx.createBiquadFilter(); bodyLp.type = 'lowpass'; bodyLp.frequency.value = 200;

    const am = ctx.createGain(); am.gain.value = 0.5;        // vibración rápida (~26 Hz)
    const lfo = ctx.createOscillator(); lfo.frequency.value = 26;
    const lfoG = ctx.createGain(); lfoG.gain.value = 0.5;
    lfo.connect(lfoG); lfoG.connect(am.gain);

    const breath = ctx.createGain(); breath.gain.value = 0.65; // respiración (inhala/exhala)
    const bLfo = ctx.createOscillator(); bLfo.frequency.value = 0.8;
    const bLfoG = ctx.createGain(); bLfoG.gain.value = 0.35;
    bLfo.connect(bLfoG); bLfoG.connect(breath.gain);

    const vol = ctx.createGain(); vol.gain.value = 0;
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;

    src.connect(lp); lp.connect(am);
    body.connect(bodyLp); bodyLp.connect(bodyG); bodyG.connect(am);
    am.connect(breath); breath.connect(vol);
    if (pan) { vol.connect(pan); pan.connect(sfxBus); } else vol.connect(sfxBus);
    [src, body, lfo, bLfo].forEach(n => n.start());
    purr = { vol, pan };
  }

  /* volume 0..1 (0 = silencio), pan -1..1 */
  function setPurr(volume, pan = 0) {
    if (!ctx) return;
    if (!purr) { if (volume <= 0) return; buildPurr(); }
    const t = ctx.currentTime;
    purr.vol.gain.setTargetAtTime(Math.max(0, volume) * 0.9, t, 0.15);
    if (purr.pan) purr.pan.pan.setTargetAtTime(Math.max(-1, Math.min(1, pan)), t, 0.1);
  }

  // ───────────────────────── Música ─────────────────────────
  /* Canción alegre tipo chiptune en Do mayor (I-vi-IV-V), 8 compases en bucle */
  const N = { C3: 48, D3: 50, E3: 52, F3: 53, G3: 55, A3: 57, B3: 59,
              C4: 60, D4: 62, E4: 64, F4: 65, G4: 67, A4: 69, B4: 71,
              C5: 72, D5: 74, E5: 76, F5: 77, G5: 79 };
  const midi = m => 440 * Math.pow(2, (m - 69) / 12);
  const CHORDS = [
    ['C3', ['C4', 'E4', 'G4']], ['A3', ['A3', 'C4', 'E4']], ['F3', ['F3', 'A3', 'C4']], ['G3', ['G3', 'B3', 'D4']],
    ['C3', ['C4', 'E4', 'G4']], ['A3', ['A3', 'C4', 'E4']], ['F3', ['F3', 'A3', 'C4']], ['G3', ['G3', 'B3', 'D4']]
  ];
  // Melodía en corcheas (8 por compás); '.' = silencio, '-' = sostener la nota anterior
  const MELODY = [
    'E4 G4 C5 G4 A4 G4 E4 .',
    'C4 E4 A4 E4 G4 - E4 .',
    'F4 A4 C5 A4 D5 C5 A4 F4',
    'G4 . B4 D5 - B4 G4 .',
    'E4 E4 G4 C5 . B4 C5 D5',
    'E5 - D5 C5 A4 . C5 .',
    'A4 C5 F5 E5 D5 C5 A4 C5',
    'B4 . G4 . D5 - B4 G4'
  ].map(bar => bar.split(' '));

  const music = { playing: false, timer: null, step: 0, next: 0, bpm: 124, hurry: false };

  function mNote(freq, t, dur, type, vol, cutoff) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(vol * 0.5, t + dur * 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    let node = o;
    if (cutoff) {
      const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = cutoff;
      o.connect(f); node = f;
    }
    node.connect(g); g.connect(musicBus);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function kick(t) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.7, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g); g.connect(musicBus);
    o.start(t); o.stop(t + 0.2);
  }

  function hat(t, vol, dur, freq) {
    const s = noise(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    f.type = 'highpass'; f.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(musicBus);
    s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }

  /* Programa una semicorchea (16 por compás) */
  function scheduleStep(step, t, s16) {
    const bar = Math.floor(step / 16) % 8, i = step % 16;
    const [root, chord] = CHORDS[bar];

    // Batería
    if (i % 8 === 0) kick(t);
    if (i === 4 || i === 12) hat(t, 0.28, 0.12, 1800);        // caja
    if (i % 2 === 1 || music.hurry) hat(t, 0.08, 0.04, 7000); // charles

    // Bajo saltarín: tónica / octava en corcheas
    if (i % 2 === 0) {
      const m = N[root] - 12 + ((i / 2) % 2 ? 12 : 0);
      mNote(midi(m), t, s16 * 1.8, 'triangle', 0.45);
    }
    // Acordes staccato a contratiempo
    if (i % 4 === 2) chord.forEach(n => mNote(midi(N[n]), t, s16 * 1.2, 'square', 0.035, 2200));

    // Melodía
    if (i % 2 === 0) {
      const row = MELODY[bar], k = i / 2, tok = row[k];
      if (tok !== '.' && tok !== '-') {
        let len = 1;
        while (k + len < row.length && row[k + len] === '-') len++;
        const f = midi(N[tok]);
        mNote(f, t, s16 * 2 * len * 0.9, 'square', 0.09, 3200);
        mNote(f * 2, t, s16 * 2 * len * 0.6, 'triangle', 0.03);   // brillo una octava arriba
      }
    }
  }

  function tickMusic() {
    if (!music.playing) return;
    const s16 = 60 / (music.bpm * (music.hurry ? 1.22 : 1)) / 4;
    // Si el temporizador se atrasó (pestaña en segundo plano), no intenta recuperar notas viejas
    if (music.next < ctx.currentTime - 0.1) music.next = ctx.currentTime + 0.05;
    while (music.next < ctx.currentTime + 0.15) {
      scheduleStep(music.step, music.next, s16);
      music.next += s16;
      music.step = (music.step + 1) % (16 * 8);
    }
  }

  function startMusic() {
    if (!ctx || music.playing) return;
    music.playing = true; music.step = 0; music.hurry = false;
    music.next = ctx.currentTime + 0.1;
    musicBus.gain.cancelScheduledValues(ctx.currentTime);
    musicBus.gain.setValueAtTime(musicOn ? MUSIC_VOL : 0, ctx.currentTime);
    music.timer = setInterval(tickMusic, 25);
    tickMusic();
  }

  function stopMusic() {
    if (!music.playing) return;
    music.playing = false;
    clearInterval(music.timer);
    const t = ctx.currentTime;
    musicBus.gain.cancelScheduledValues(t);
    musicBus.gain.setValueAtTime(musicBus.gain.value, t);
    musicBus.gain.linearRampToValueAtTime(0, t + 0.3);
  }

  /* Acelera la música cuando queda poco tiempo */
  function setHurry(on) { music.hurry = !!on; }

  function toggleMusic() {
    musicOn = !musicOn;
    try { localStorage.setItem('jt-music', musicOn ? 'on' : 'off'); } catch (e) { /* sin almacenamiento */ }
    if (ctx) {
      const t = ctx.currentTime;
      musicBus.gain.cancelScheduledValues(t);
      musicBus.gain.setValueAtTime(musicBus.gain.value, t);
      musicBus.gain.linearRampToValueAtTime(musicOn && music.playing ? MUSIC_VOL : 0, t + 0.2);
    }
    return musicOn;
  }
  const isMusicOn = () => musicOn;

  // ───────────────────────── Efectos ─────────────────────────
  function tone(freq, start, dur, type = 'triangle', vol = 0.25) {
    const t = ctx.currentTime + start;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(sfxBus);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function win() {
    if (!ctx) return;
    stopMusic();
    [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.25));
    setTimeout(() => meow(1, 0, false, 'chirp'), 700);
    setTimeout(() => meow(1, 0, false, 'long'), 1150);
  }
  function lose() {
    if (!ctx) return;
    stopMusic();
    setPurr(0);
    [392, 330, 262, 196].forEach((f, i) => tone(f, i * 0.2, 0.35, 'sine', 0.22));
    setTimeout(() => meow(0.6, 0, true, 'yowl'), 900);
  }
  function stairs(up) {
    if (!ctx) return;
    (up ? [440, 554, 659] : [659, 554, 440]).forEach((f, i) => tone(f, i * 0.06, 0.1, 'square', 0.06));
  }
  function tick() {
    if (!ctx) return;
    tone(1200, 0, 0.05, 'square', 0.05);
  }

  return { unlock, meow, setPurr, win, lose, stairs, tick,
           startMusic, stopMusic, setHurry, toggleMusic, isMusicOn };
})();
