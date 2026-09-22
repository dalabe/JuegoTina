window.JT = window.JT || {};

/*
 * Sprites dibujados por código (sin archivos de imagen) para que el juego funcione
 * igual abriendo index.html directamente (file://) o desde un servidor.
 *
 *  Bella: niña de piel trigueña, cabello negro, largo y rizado, top rosado sin tiras,
 *         collar dorado, pantalón negro y tenis blancos.
 *  Tina:  gata siamés "seal point": cuerpo crema, máscara/orejas/cola café oscuro,
 *         patitas blancas y ojos azules.
 */
JT.Sprites = (function () {
  const RES = 2; // resolución interna (se muestra a escala 1/RES)

  const BELLA = {
    W: 40, H: 60,
    skin: '#c78a64', skinShade: '#a86f4e',
    hair: '#1b120d', hairHi: '#3a271c',
    top: '#f6cdd8', topShade: '#e3aebd',
    pants: '#1d1d24', pantsHi: '#34343f',
    shoe: '#f4f4f4', gold: '#e2b43b',
    eye: '#2a1a12', lip: '#b8545e', blush: 'rgba(230,120,130,0.35)'
  };

  const TINA = {
    W: 40, H: 36,
    cream: '#f1e6d2', fawn: '#d2b893', point: '#3b2a22', pointMid: '#6b4f3f',
    white: '#ffffff', eye: '#76c1ff', pink: '#e8a4a4'
  };

  function ellipse(ctx, x, y, rx, ry, fill) {
    ctx.beginPath();
    ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
  }
  function rrect(ctx, x, y, w, h, r, fill) {
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, r); else ctx.rect(x, y, w, h);
    ctx.fillStyle = fill;
    ctx.fill();
  }
  function curls(ctx, pts, r, fill, hi) {
    for (const [x, y, s] of pts) {
      ellipse(ctx, x, y, r * (s || 1), r * (s || 1), fill);
      if (hi) {
        ctx.beginPath();
        ctx.arc(x - 0.6, y - 0.6, r * (s || 1) * 0.55, Math.PI * 1.1, Math.PI * 1.7);
        ctx.strokeStyle = hi; ctx.lineWidth = 0.7; ctx.stroke();
      }
    }
  }

  // ─────────── Bella ───────────
  // dir: 0 abajo, 1 arriba, 2 izquierda, 3 derecha ; step: -1..1 (fase de caminar)
  function drawBella(ctx, dir, step, bob) {
    const C = BELLA, cx = C.W / 2;
    ctx.save();
    // Sombra
    ellipse(ctx, cx, 56.5, 11, 3.2, 'rgba(0,0,0,0.28)');
    ctx.translate(0, bob);

    if (dir === 3) { ctx.translate(C.W, 0); ctx.scale(-1, 1); dir = 2; }

    if (dir === 0 || dir === 1) {
      const back = dir === 1;
      // Cabello de fondo (largo y rizado) — detrás del cuerpo en vista frontal
      if (!back) {
        ellipse(ctx, cx, 27, 13, 15, C.hair);
        curls(ctx, [[8.5, 30], [31.5, 30], [9, 37], [31, 37], [10.5, 42], [29.5, 42]], 3.2, C.hair, C.hairHi);
      }
      // Piernas
      const l = step * 3, r = -step * 3;
      rrect(ctx, 14, 40 + Math.max(0, -l) * 0.4, 5.6, 13 - Math.abs(l) * 0.3, 2, C.pants);
      rrect(ctx, 20.4, 40 + Math.max(0, -r) * 0.4, 5.6, 13 - Math.abs(r) * 0.3, 2, C.pants);
      ellipse(ctx, 16.8, 53.5 - Math.max(0, l) * 0.5, 3.6, 2.2, C.shoe);
      ellipse(ctx, 23.2, 53.5 - Math.max(0, r) * 0.5, 3.6, 2.2, C.shoe);
      // Brazos
      rrect(ctx, 8.6, 28 + step * 1.5, 3.8, 12, 2, C.skin);
      rrect(ctx, 27.6, 28 - step * 1.5, 3.8, 12, 2, C.skin);
      // Hombros / torso
      rrect(ctx, 11.5, 26, 17, 6, 3, C.skin);
      rrect(ctx, 12, 30, 16, 11, 3, C.top);
      ctx.fillStyle = C.topShade; ctx.fillRect(12, 38.5, 16, 2.5);
      if (!back) {
        ctx.beginPath(); ctx.moveTo(12.5, 30.4); ctx.quadraticCurveTo(20, 31.8, 27.5, 30.4);
        ctx.strokeStyle = C.topShade; ctx.lineWidth = 0.8; ctx.stroke();
      }
      // Cuello
      rrect(ctx, 17.5, 22, 5, 5, 1.5, C.skinShade);
      if (!back) {
        // Collar
        ctx.beginPath(); ctx.arc(cx, 23.5, 5.2, Math.PI * 0.2, Math.PI * 0.8);
        ctx.strokeStyle = C.gold; ctx.lineWidth = 0.8; ctx.stroke();
        ellipse(ctx, cx, 28.6, 0.9, 0.9, C.gold);
        // Cara
        ellipse(ctx, cx, 15.5, 8.6, 9.4, C.skin);
        // Cabello superior con raya al medio
        ctx.beginPath();
        ctx.moveTo(11, 17);
        ctx.quadraticCurveTo(10.5, 5, 20, 5.2);
        ctx.quadraticCurveTo(29.5, 5, 29, 17);
        ctx.quadraticCurveTo(27, 10, 20.3, 8.6);
        ctx.quadraticCurveTo(13, 10, 11, 17);
        ctx.fillStyle = C.hair; ctx.fill();
        // Mechones rizados enmarcando la cara
        curls(ctx, [[10.8, 16, 1], [10.2, 21, 1.05], [11.2, 26, 1], [29.2, 16, 1], [29.8, 21, 1.05], [28.8, 26, 1]], 2.8, C.hair, C.hairHi);
        // Cejas
        ctx.strokeStyle = C.hair; ctx.lineWidth = 1.1; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(14.6, 13.2); ctx.quadraticCurveTo(16.5, 12.2, 18.4, 13); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(21.6, 13); ctx.quadraticCurveTo(23.5, 12.2, 25.4, 13.2); ctx.stroke();
        // Ojos
        ellipse(ctx, 16.6, 15.8, 1.3, 1.6, C.eye);
        ellipse(ctx, 23.4, 15.8, 1.3, 1.6, C.eye);
        ellipse(ctx, 17, 15.2, 0.45, 0.45, '#fff');
        ellipse(ctx, 23.8, 15.2, 0.45, 0.45, '#fff');
        // Mejillas y sonrisa
        ellipse(ctx, 14.6, 19, 1.8, 1.1, C.blush);
        ellipse(ctx, 25.4, 19, 1.8, 1.1, C.blush);
        ctx.beginPath(); ctx.moveTo(17.6, 20.4); ctx.quadraticCurveTo(20, 22.4, 22.4, 20.4);
        ctx.strokeStyle = C.lip; ctx.lineWidth = 1; ctx.stroke();
        ctx.beginPath(); ctx.moveTo(19.5, 17.5); ctx.lineTo(19.2, 18.8);
        ctx.strokeStyle = C.skinShade; ctx.lineWidth = 0.7; ctx.stroke();
      } else {
        // De espaldas: la melena rizada cubre cabeza y espalda
        ellipse(ctx, cx, 15, 9.5, 10, C.hair);
        ellipse(ctx, cx, 28, 12.5, 12, C.hair);
        curls(ctx, [
          [10, 14], [30, 14], [9, 21], [31, 21], [9.5, 28], [30.5, 28], [11, 35], [29, 35],
          [14, 39], [20, 40], [26, 39], [15, 8], [25, 8], [20, 6.5]
        ], 3.3, C.hair, C.hairHi);
        curls(ctx, [[16, 24], [24, 24], [20, 31], [15, 32], [25, 32], [20, 17]], 2.6, C.hair, C.hairHi);
      }
    } else {
      // ── Perfil (mirando a la izquierda) ──
      // Cabello detrás
      ellipse(ctx, 23, 26, 9, 15, C.hair);
      curls(ctx, [[27, 20], [28, 27], [27, 34], [25, 40], [21, 38]], 3.3, C.hair, C.hairHi);
      // Piernas (zancada)
      const s = step * 4;
      ctx.save(); ctx.translate(19, 41); ctx.rotate(s * 0.09);
      rrect(ctx, -2.8, 0, 5.6, 12.5, 2, C.pantsHi); ellipse(ctx, -1.5, 12.5, 3.8, 2.1, C.shoe); ctx.restore();
      ctx.save(); ctx.translate(19, 41); ctx.rotate(-s * 0.09);
      rrect(ctx, -2.8, 0, 5.6, 12.5, 2, C.pants); ellipse(ctx, -1.5, 12.5, 3.8, 2.1, C.shoe); ctx.restore();
      // Torso
      rrect(ctx, 14, 26, 11, 6, 3, C.skin);
      rrect(ctx, 14, 30, 11, 11, 3, C.top);
      ctx.fillStyle = C.topShade; ctx.fillRect(14, 38.5, 11, 2.5);
      // Brazo
      ctx.save(); ctx.translate(19.5, 28); ctx.rotate(-step * 0.35);
      rrect(ctx, -2, 0, 4, 12, 2, C.skinShade); ctx.restore();
      // Cuello y cabeza
      rrect(ctx, 16.5, 22, 5, 5, 1.5, C.skinShade);
      ellipse(ctx, 18, 15.5, 8.2, 9.2, C.skin);
      ellipse(ctx, 10.3, 16.8, 1.2, 1.4, C.skin); // nariz
      // Cabello superior
      ctx.beginPath();
      ctx.moveTo(12, 10);
      ctx.quadraticCurveTo(17, 4, 24.5, 7);
      ctx.quadraticCurveTo(28, 12, 26, 22);
      ctx.quadraticCurveTo(22, 14, 17, 11);
      ctx.quadraticCurveTo(14, 10.5, 12, 10);
      ctx.fillStyle = C.hair; ctx.fill();
      curls(ctx, [[25, 11], [26.5, 17], [25.5, 23]], 2.8, C.hair, C.hairHi);
      // Oreja + arete dorado
      ellipse(ctx, 21.5, 16.5, 1.4, 2, C.skinShade);
      ellipse(ctx, 21.5, 19.2, 0.7, 0.7, C.gold);
      // Ceja, ojo, sonrisa
      ctx.strokeStyle = C.hair; ctx.lineWidth = 1; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(12.5, 12.8); ctx.lineTo(15.5, 12.5); ctx.stroke();
      ellipse(ctx, 14, 15.5, 1.1, 1.5, C.eye);
      ellipse(ctx, 13.7, 14.9, 0.4, 0.4, '#fff');
      ellipse(ctx, 14.5, 19, 1.6, 1, C.blush);
      ctx.beginPath(); ctx.moveTo(11.4, 20.2); ctx.quadraticCurveTo(12.8, 21.3, 14.2, 20.6);
      ctx.strokeStyle = C.lip; ctx.lineWidth = 0.9; ctx.stroke();
    }
    ctx.restore();
  }

  // ─────────── Tina ───────────
  // pose: 'sit' | 'swish' | 'blink' | 'happy'
  function drawTina(ctx, pose) {
    const C = TINA, cx = 20;
    ctx.save();
    ellipse(ctx, cx, 33, 12, 3, 'rgba(0,0,0,0.3)');

    // Cola café oscuro
    ctx.beginPath();
    const tailUp = pose === 'swish' ? -6 : 0;
    ctx.moveTo(28, 31);
    ctx.quadraticCurveTo(38, 30, 36, 20 + tailUp);
    ctx.quadraticCurveTo(35.5, 16 + tailUp, 33.5, 17 + tailUp);
    ctx.lineWidth = 3.6; ctx.lineCap = 'round';
    const tg = ctx.createLinearGradient(28, 31, 34, 17);
    tg.addColorStop(0, C.pointMid); tg.addColorStop(1, C.point);
    ctx.strokeStyle = tg; ctx.stroke();

    // Cuerpo (sentada, forma de pera) con sombreado beige
    const bg = ctx.createRadialGradient(cx - 2, 22, 2, cx, 25, 13);
    bg.addColorStop(0, C.cream); bg.addColorStop(0.7, C.cream); bg.addColorStop(1, C.fawn);
    ctx.beginPath();
    ctx.moveTo(cx - 6, 14);
    ctx.bezierCurveTo(cx - 13, 18, cx - 13, 32, cx - 8, 32.5);
    ctx.lineTo(cx + 8, 32.5);
    ctx.bezierCurveTo(cx + 13, 32, cx + 13, 18, cx + 6, 14);
    ctx.closePath();
    ctx.fillStyle = bg; ctx.fill();

    // Patas delanteras oscuras con "botitas" blancas
    rrect(ctx, cx - 5.8, 22, 4, 10, 2, C.pointMid);
    rrect(ctx, cx + 1.8, 22, 4, 10, 2, C.pointMid);
    ellipse(ctx, cx - 3.8, 31.6, 2.6, 1.8, C.white);
    ellipse(ctx, cx + 3.8, 31.6, 2.6, 1.8, C.white);
    // Pecho claro
    ellipse(ctx, cx, 20, 4, 5, '#fbf5ea');

    // Cabeza
    const hy = 11;
    // Orejas
    ctx.fillStyle = C.point;
    ctx.beginPath(); ctx.moveTo(cx - 9, hy - 1); ctx.lineTo(cx - 8.5, hy - 11); ctx.lineTo(cx - 2.5, hy - 5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + 9, hy - 1); ctx.lineTo(cx + 8.5, hy - 11); ctx.lineTo(cx + 2.5, hy - 5); ctx.fill();
    ctx.fillStyle = 'rgba(232,164,164,0.55)';
    ctx.beginPath(); ctx.moveTo(cx - 7.5, hy - 3); ctx.lineTo(cx - 7.6, hy - 8.4); ctx.lineTo(cx - 4, hy - 5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(cx + 7.5, hy - 3); ctx.lineTo(cx + 7.6, hy - 8.4); ctx.lineTo(cx + 4, hy - 5); ctx.fill();
    // Cara crema con máscara café
    ellipse(ctx, cx, hy, 9.5, 8, C.fawn);
    const mg = ctx.createRadialGradient(cx, hy + 2, 0.5, cx, hy + 1, 8);
    mg.addColorStop(0, C.point); mg.addColorStop(0.55, C.point); mg.addColorStop(0.8, C.pointMid); mg.addColorStop(1, 'rgba(107,79,63,0)');
    ellipse(ctx, cx, hy + 1, 8.5, 7.5, mg);

    // Ojos azules
    if (pose === 'blink') {
      ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(cx - 6, hy); ctx.lineTo(cx - 2.2, hy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx + 2.2, hy); ctx.lineTo(cx + 6, hy); ctx.stroke();
    } else if (pose === 'happy') {
      ctx.strokeStyle = C.eye; ctx.lineWidth = 1.1;
      ctx.beginPath(); ctx.arc(cx - 4, hy + 0.8, 2, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx + 4, hy + 0.8, 2, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
    } else {
      ellipse(ctx, cx - 4, hy - 0.2, 2.3, 1.9, C.eye);
      ellipse(ctx, cx + 4, hy - 0.2, 2.3, 1.9, C.eye);
      ellipse(ctx, cx - 4, hy - 0.2, 0.7, 1.6, '#0d0d12');
      ellipse(ctx, cx + 4, hy - 0.2, 0.7, 1.6, '#0d0d12');
      ellipse(ctx, cx - 4.6, hy - 0.9, 0.5, 0.5, '#fff');
      ellipse(ctx, cx + 3.4, hy - 0.9, 0.5, 0.5, '#fff');
    }
    // Nariz y boca
    ctx.fillStyle = '#1a1210';
    ctx.beginPath(); ctx.moveTo(cx - 1.2, hy + 3.2); ctx.lineTo(cx + 1.2, hy + 3.2); ctx.lineTo(cx, hy + 4.4); ctx.fill();
    ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(cx, hy + 4.4); ctx.quadraticCurveTo(cx - 1.4, hy + 6, cx - 2.6, hy + 5); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, hy + 4.4); ctx.quadraticCurveTo(cx + 1.4, hy + 6, cx + 2.6, hy + 5); ctx.stroke();
    // Bigotes
    ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.45;
    for (const s of [-1, 1]) {
      for (const k of [-1, 0, 1]) {
        ctx.beginPath(); ctx.moveTo(cx + s * 3, hy + 4); ctx.lineTo(cx + s * 12, hy + 3 + k * 1.6); ctx.stroke();
      }
    }
    ctx.restore();
  }

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w * RES; c.height = h * RES;
    return c;
  }

  /* Registra las texturas en Phaser */
  function register(scene) {
    const tex = scene.textures;
    if (tex.exists('bella')) return;

    // Bella: 4 direcciones x 4 cuadros
    const B = BELLA, cols = 4, rows = 4;
    const bc = makeCanvas(B.W * cols, B.H * rows);
    const bx = bc.getContext('2d');
    const steps = [0, 1, 0, -1];
    const bobs = [0, -0.8, 0, -0.8];
    for (let d = 0; d < rows; d++) {
      for (let f = 0; f < cols; f++) {
        bx.save();
        bx.scale(RES, RES);
        bx.translate(f * B.W, d * B.H);
        drawBella(bx, d, steps[f], bobs[f]);
        bx.restore();
      }
    }
    const bt = tex.addCanvas('bella', bc);
    for (let d = 0; d < rows; d++)
      for (let f = 0; f < cols; f++)
        bt.add(`b${d}_${f}`, 0, f * B.W * RES, d * B.H * RES, B.W * RES, B.H * RES);

    // Tina: 4 poses
    const T = TINA, poses = ['sit', 'swish', 'blink', 'happy'];
    const tc = makeCanvas(T.W * poses.length, T.H);
    const tx = tc.getContext('2d');
    poses.forEach((p, i) => {
      tx.save(); tx.scale(RES, RES); tx.translate(i * T.W, 0); drawTina(tx, p); tx.restore();
    });
    const tt = tex.addCanvas('tina', tc);
    poses.forEach((p, i) => tt.add(`t_${p}`, 0, i * T.W * RES, 0, T.W * RES, T.H * RES));

    // Corazón
    const hc = makeCanvas(16, 16), hx = hc.getContext('2d');
    hx.scale(RES, RES);
    hx.fillStyle = '#ff4d79';
    hx.beginPath(); hx.moveTo(8, 14);
    hx.bezierCurveTo(-2, 7, 3, -1, 8, 4.5);
    hx.bezierCurveTo(13, -1, 18, 7, 8, 14); hx.fill();
    tex.addCanvas('heart', hc);

    // Luz (niebla con agujero suave)
    const L = 512, lc = document.createElement('canvas');
    lc.width = lc.height = L;
    const lx = lc.getContext('2d');
    const a = JT.CONFIG.FOG_ALPHA;
    const g = lx.createRadialGradient(L / 2, L / 2, 0, L / 2, L / 2, L / 2);
    g.addColorStop(0, 'rgba(8,10,20,0)');
    g.addColorStop(0.5, 'rgba(8,10,20,0)');
    g.addColorStop(0.72, `rgba(8,10,20,${a * 0.45})`);
    g.addColorStop(1, `rgba(8,10,20,${a})`);
    lx.fillStyle = g; lx.fillRect(0, 0, L, L);
    tex.addCanvas('light', lc);

    // Anillo del radar
    const rc = document.createElement('canvas'); rc.width = rc.height = 128;
    const rx = rc.getContext('2d');
    rx.strokeStyle = 'rgba(255,255,255,0.9)'; rx.lineWidth = 6;
    rx.beginPath(); rx.arc(64, 64, 58, 0, Math.PI * 2); rx.stroke();
    tex.addCanvas('ring', rc);
  }

  return { register, drawBella, drawTina, RES, BELLA, TINA };
})();
