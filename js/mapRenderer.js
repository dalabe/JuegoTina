window.JT = window.JT || {};

/*
 * Convierte la definición de una planta (js/data/floors.js) en:
 *   - un canvas con el piso dibujado (texture 'floor')
 *   - un canvas con elementos que van ENCIMA de los personajes (copas de árboles)
 *   - una grilla de colisión (1 = caminable)
 */
JT.MapRenderer = (function () {
  const SOLID = new Set(['tree', 'plant', 'planter', 'bench', 'sculpture', 'column', 'desk', 'table', 'seats', 'panel', 'block']);
  const WALL_COLOR = '#3b3733';
  const WALL_W = 7;

  function build(def, draw = true) {
    const s = def.scale, [ox, oy] = def.origin;
    const W = Math.round(def.size[0] * s), H = Math.round(def.size[1] * s);
    const P = (x, y) => [(x - ox) * s, (y - oy) * s];
    const L = v => v * s;

    const shapePath = (ctx, sh) => {
      ctx.beginPath();
      if (sh.rect) {
        const [x, y] = P(sh.rect[0], sh.rect[1]);
        ctx.rect(x, y, L(sh.rect[2]), L(sh.rect[3]));
      } else if (sh.poly) {
        sh.poly.forEach((p, i) => { const [x, y] = P(p[0], p[1]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
        ctx.closePath();
      } else if (sh.r !== undefined) {
        const [x, y] = P(sh.x, sh.y);
        ctx.arc(x, y, L(sh.r), 0, Math.PI * 2);
      }
    };
    const wallPath = (ctx, pts) => {
      ctx.beginPath();
      pts.forEach((p, i) => { const [x, y] = P(p[0], p[1]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    };

    // ───────── Canvas del piso ─────────
    let floor = null, top = null;
    if (draw) {
    floor = document.createElement('canvas');
    floor.width = W; floor.height = H;
    const ctx = floor.getContext('2d');
    drawOutside(ctx, W, H, def);

    (def.decor || []).forEach(d => {
      ctx.save(); shapePath(ctx, d); ctx.clip();
      fillMaterial(ctx, d.mat, W, H);
      ctx.restore();
      if (d.label) {
        const b = bounds(d, P, L);
        ctx.save();
        ctx.fillStyle = 'rgba(255,255,255,0.35)';
        ctx.font = `600 ${Math.max(16, Math.min(34, b.w / 18))}px system-ui, sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(d.label, b.x + b.w / 2, b.y + b.h / 2);
        ctx.restore();
      }
    });

    // Muros exteriores automáticos: trazo grueso + relleno encima
    ctx.lineJoin = 'round';
    def.areas.forEach(a => {
      shapePath(ctx, a);
      ctx.strokeStyle = WALL_COLOR; ctx.lineWidth = WALL_W * 2; ctx.stroke();
    });
    def.areas.forEach(a => {
      ctx.save(); shapePath(ctx, a); ctx.clip();
      fillMaterial(ctx, a.mat, W, H);
      ctx.restore();
    });

    // Sombra suave interior junto a muros
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.10)'; ctx.lineWidth = 10; ctx.lineCap = 'round';
    def.walls.forEach(w => { wallPath(ctx, w); ctx.stroke(); });
    ctx.restore();
    // Muros interiores
    ctx.strokeStyle = WALL_COLOR; ctx.lineWidth = WALL_W; ctx.lineCap = 'round';
    def.walls.forEach(w => { wallPath(ctx, w); ctx.stroke(); });

    // Objetos
    const hasTop = def.props.some(p => p.type === 'tree');
    let tctx = null;
    if (hasTop) {
      top = document.createElement('canvas');
      top.width = W; top.height = H;
      tctx = top.getContext('2d');
    }
    def.props.forEach(p => drawProp(ctx, tctx, p, P, L, shapePath));
    }

    // Escaleras
    const stairs = (def.stairs || []).map(st => {
      const [x, y] = P(st.rect[0], st.rect[1]);
      const w = L(st.rect[2]), h = L(st.rect[3]);
      if (draw) drawStair(floor.getContext('2d'), x, y, w, h, st.dir);
      return Object.assign({}, st, { x, y, w, h, cx: x + w / 2, cy: y + h / 2 });
    });

    // ───────── Grilla de colisión ─────────
    const CELL = JT.CONFIG.CELL;
    const cols = Math.ceil(W / CELL), rows = Math.ceil(H / CELL);
    const m = document.createElement('canvas');
    m.width = cols; m.height = rows;
    const mc = m.getContext('2d', { willReadFrequently: true });
    mc.scale(1 / CELL, 1 / CELL);
    mc.fillStyle = '#000'; mc.fillRect(0, 0, W, H);
    mc.fillStyle = '#fff';
    // El trazo blanco evita "costuras" por antialiasing entre áreas vecinas
    mc.strokeStyle = '#fff'; mc.lineWidth = CELL * 0.6; mc.lineJoin = 'round';
    def.areas.forEach(a => { shapePath(mc, a); mc.fill(); mc.stroke(); });
    mc.fillStyle = '#000'; mc.strokeStyle = '#000';
    mc.lineWidth = WALL_W + 5; mc.lineCap = 'round'; mc.lineJoin = 'round';
    def.walls.forEach(w => { wallPath(mc, w); mc.stroke(); });
    def.props.forEach(p => {
      if (!SOLID.has(p.type)) return;
      if (p.type === 'tree') {
        const [x, y] = P(p.x, p.y);
        mc.beginPath(); mc.arc(x, y, Math.max(10, L(p.r) * 0.2), 0, Math.PI * 2); mc.fill();
      } else {
        shapePath(mc, p); mc.fill();
      }
    });
    const img = mc.getImageData(0, 0, cols, rows).data;
    const grid = new Uint8Array(cols * rows);
    for (let i = 0; i < grid.length; i++) grid[i] = img[i * 4] > 200 ? 1 : 0;

    const map = {
      def, W, H, P, L, floor, top, grid, cols, rows, CELL, stairs,
      walkable(x, y) {
        const c = Math.floor(x / CELL), r = Math.floor(y / CELL);
        if (c < 0 || r < 0 || c >= cols || r >= rows) return false;
        return grid[r * cols + c] === 1;
      },
      nearestWalkable(x, y, maxR = 200) {
        if (this.walkable(x, y)) return [x, y];
        for (let rad = CELL; rad <= maxR; rad += CELL) {
          for (let a = 0; a < 24; a++) {
            const t = (a / 24) * Math.PI * 2;
            const px = x + Math.cos(t) * rad, py = y + Math.sin(t) * rad;
            if (this.walkable(px, py) && this.walkable(px + 12, py) && this.walkable(px - 12, py) &&
                this.walkable(px, py + 12) && this.walkable(px, py - 12)) return [px, py];
          }
        }
        return [x, y];
      }
    };
    map.hides = (def.hides || []).map(h => map.nearestWalkable(...P(h[0], h[1])));
    map.spawn = def.spawn ? map.nearestWalkable(...P(def.spawn[0], def.spawn[1])) : null;
    map.stairs.forEach(st => {
      const [x, y] = map.nearestWalkable(st.cx, st.cy, 120);
      st.ax = x; st.ay = y;
    });
    return map;
  }

  function bounds(sh, P, L) {
    if (sh.rect) { const [x, y] = P(sh.rect[0], sh.rect[1]); return { x, y, w: L(sh.rect[2]), h: L(sh.rect[3]) }; }
    const pts = sh.poly.map(p => P(p[0], p[1]));
    const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]);
    const x = Math.min(...xs), y = Math.min(...ys);
    return { x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y };
  }

  // Semilla determinista para que el mapa se vea igual siempre
  function rng(seed) {
    let s = seed >>> 0;
    return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  }

  function drawOutside(ctx, W, H, def) {
    ctx.fillStyle = def.outside || '#223';
    ctx.fillRect(0, 0, W, H);
    const r = rng(def.level * 999);
    if (def.level === 1) {
      // Calles y vegetación alrededor
      ctx.fillStyle = 'rgba(255,255,255,0.05)';
      for (let i = 0; i < 400; i++) ctx.fillRect(r() * W, r() * H, 3, 3);
    } else {
      // Vista de la ciudad desde lo alto: luces
      for (let i = 0; i < 260; i++) {
        ctx.fillStyle = r() > 0.5 ? 'rgba(255,214,120,0.35)' : 'rgba(170,200,255,0.25)';
        ctx.fillRect(r() * W, r() * H, 2 + r() * 3, 2 + r() * 3);
      }
    }
  }

  function fillMaterial(ctx, mat, W, H) {
    const M = JT.MATERIALS[mat] || JT.MATERIALS.gallery;
    ctx.fillStyle = M.base; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = M.line; ctx.lineWidth = 1;
    const sz = M.size || 30;
    const r = rng(mat.length * 7919);
    ctx.beginPath();
    switch (M.pattern) {
      case 'tiles':
        for (let x = 0; x < W; x += sz) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
        for (let y = 0; y < H; y += sz) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
        break;
      case 'bricks':
        for (let y = 0, row = 0; y < H; y += sz, row++) {
          ctx.moveTo(0, y); ctx.lineTo(W, y);
          for (let x = (row % 2) * sz; x < W; x += sz * 2) { ctx.moveTo(x, y); ctx.lineTo(x, y + sz); }
        }
        break;
      case 'planks':
        for (let y = 0; y < H; y += sz) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
        for (let y = 0, row = 0; y < H; y += sz, row++)
          for (let x = (row * 37) % 120; x < W; x += 120) { ctx.moveTo(x, y); ctx.lineTo(x, y + sz); }
        break;
      case 'stripes':
        for (let x = 0; x < W; x += sz) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
        break;
      case 'cross':
        for (let d = -H; d < W; d += 40) { ctx.moveTo(d, 0); ctx.lineTo(d + H, H); ctx.moveTo(d + H, 0); ctx.lineTo(d, H); }
        break;
    }
    ctx.stroke();
    if (M.pattern === 'grass') {
      for (let i = 0; i < W * H / 220; i++) {
        ctx.fillStyle = r() > 0.5 ? 'rgba(40,80,20,0.18)' : 'rgba(200,230,140,0.18)';
        ctx.fillRect(r() * W, r() * H, 2, 5);
      }
    } else if (M.pattern === 'carpet') {
      for (let i = 0; i < W * H / 60; i++) {
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.fillRect(r() * W, r() * H, 2, 2);
      }
    }
  }

  function drawProp(ctx, tctx, p, P, L, shapePath) {
    ctx.save();
    const shade = (fill, sh) => {
      ctx.save(); ctx.translate(3, 4); shapePath(ctx, sh); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fill(); ctx.restore();
      shapePath(ctx, sh); ctx.fillStyle = fill; ctx.fill();
    };
    switch (p.type) {
      case 'tree': {
        const [x, y] = P(p.x, p.y), R = L(p.r);
        ctx.beginPath(); ctx.arc(x, y, Math.max(10, R * 0.2), 0, Math.PI * 2);
        ctx.fillStyle = '#6b4a2f'; ctx.fill();
        // Copa (va encima de los personajes, semitransparente)
        if (!tctx) break;
        tctx.save();
        const g = tctx.createRadialGradient(x - R * 0.3, y - R * 0.3, R * 0.1, x, y, R);
        g.addColorStop(0, 'rgba(120,170,80,0.62)'); g.addColorStop(1, 'rgba(50,100,40,0.62)');
        tctx.fillStyle = g;
        tctx.beginPath();
        for (let i = 0; i < 9; i++) {
          const a = (i / 9) * Math.PI * 2;
          tctx.moveTo(x + Math.cos(a) * R * 0.55 + R * 0.45, y + Math.sin(a) * R * 0.55);
          tctx.arc(x + Math.cos(a) * R * 0.55, y + Math.sin(a) * R * 0.55, R * 0.45, 0, Math.PI * 2);
        }
        tctx.fill();
        tctx.restore();
        break;
      }
      case 'plant': {
        const [x, y] = P(p.x, p.y), R = L(p.r);
        ctx.beginPath(); ctx.arc(x + 3, y + 4, R, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fill();
        ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fillStyle = '#8d6e63'; ctx.fill();
        for (let i = 0; i < 7; i++) {
          const a = (i / 7) * Math.PI * 2;
          ctx.beginPath();
          ctx.ellipse(x + Math.cos(a) * R * 0.45, y + Math.sin(a) * R * 0.45, R * 0.55, R * 0.28, a, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 ? '#4f8f3a' : '#6fb04f'; ctx.fill();
        }
        break;
      }
      case 'planter':
        shade('#7d6a58', p);
        ctx.save(); shapePath(ctx, p); ctx.clip();
        ctx.fillStyle = '#5f8f3e';
        const b = p.rect;
        for (let i = 0; i < 8; i++) {
          const [x, y] = P(b[0] + (b[2] * (i + 0.5)) / 8, b[1] + b[3] / 2);
          ctx.beginPath(); ctx.arc(x, y, L(b[3]) * 0.38, 0, Math.PI * 2); ctx.fill();
        }
        ctx.restore();
        break;
      case 'bench':
        shade('#8b5e3c', p);
        ctx.strokeStyle = '#6d4528'; ctx.lineWidth = 2; shapePath(ctx, p); ctx.stroke();
        break;
      case 'sculpture': {
        shade(p.color || '#aaa', p);
        ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2; shapePath(ctx, p); ctx.stroke();
        ctx.globalAlpha = 0.35; ctx.fillStyle = '#fff';
        if (p.r !== undefined) { const [x, y] = P(p.x, p.y); ctx.beginPath(); ctx.arc(x - L(p.r) * 0.3, y - L(p.r) * 0.3, L(p.r) * 0.35, 0, Math.PI * 2); ctx.fill(); }
        break;
      }
      case 'column':
        shade('#8e8a84', p);
        break;
      case 'desk':
        shade('#d8cbb3', p);
        ctx.strokeStyle = '#a8977a'; ctx.lineWidth = 2; shapePath(ctx, p); ctx.stroke();
        break;
      case 'table':
        shade('#caa472', p);
        ctx.strokeStyle = '#9b7a4e'; ctx.lineWidth = 2; shapePath(ctx, p); ctx.stroke();
        break;
      case 'seats': {
        shapePath(ctx, p); ctx.fillStyle = '#7a1f2b'; ctx.fill();
        const [x, y] = P(p.rect[0], p.rect[1]); const w = L(p.rect[2]), h = L(p.rect[3]);
        ctx.fillStyle = '#a3303f';
        for (let yy = y + 2; yy < y + h - 4; yy += 14) ctx.fillRect(x + 1, yy, w - 2, 10);
        break;
      }
      case 'panel':
        shade('#f7f4ee', p);
        ctx.strokeStyle = '#bdb3a3'; ctx.lineWidth = 2; shapePath(ctx, p); ctx.stroke();
        break;
      case 'block':
        shade(p.color || '#777', p);
        if (p.label) {
          const b = bounds(p, P, L);
          ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = 'bold 13px system-ui, sans-serif';
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(p.label, b.x + b.w / 2, b.y + b.h / 2);
        }
        break;
      case 'painting': {
        const [x1, y1] = P(p.x1, p.y1), [x2, y2] = P(p.x2, p.y2);
        ctx.lineCap = 'butt';
        ctx.strokeStyle = '#2b2b2b'; ctx.lineWidth = 9;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        ctx.strokeStyle = p.color || '#c33'; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
        break;
      }
      case 'stage':
        shapePath(ctx, p); ctx.fillStyle = '#6d4526'; ctx.fill();
        ctx.strokeStyle = '#4a2e18'; ctx.lineWidth = 3; ctx.stroke();
        break;
      case 'steps': {
        const b = bounds(p, P, L);
        ctx.save(); shapePath(ctx, p); ctx.clip();
        ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 2;
        for (let y = b.y; y < b.y + b.h; y += 10) { ctx.beginPath(); ctx.moveTo(b.x, y); ctx.lineTo(b.x + b.w, y); ctx.stroke(); }
        ctx.restore();
        break;
      }
    }
    ctx.restore();
  }

  function drawStair(ctx, x, y, w, h, dir) {
    ctx.save();
    const up = dir === 'up';
    ctx.fillStyle = up ? '#f2c14e' : '#6fc2d0';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 2;
    const vertical = h >= w;
    const n = Math.max(4, Math.floor((vertical ? h : w) / 9));
    for (let i = 1; i < n; i++) {
      ctx.beginPath();
      if (vertical) { const yy = y + (h * i) / n; ctx.moveTo(x, yy); ctx.lineTo(x + w, yy); }
      else { const xx = x + (w * i) / n; ctx.moveTo(xx, y); ctx.lineTo(xx, y + h); }
      ctx.stroke();
    }
    ctx.strokeStyle = '#2c2c2c'; ctx.lineWidth = 3; ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = '#1f1f1f';
    ctx.font = `bold ${Math.min(28, Math.min(w, h) * 0.8)}px system-ui, sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(up ? '▲' : '▼', x + w / 2, y + h / 2);
    ctx.restore();
  }

  return { build };
})();
