window.JT = window.JT || {};

JT.GameScene = class GameScene extends Phaser.Scene {
  constructor() {
    super('game');
  }

  create() {
    const C = JT.CONFIG;
    JT.Sprites.register(this);
    this.R = JT.Sprites.RES;

    // Animaciones de Bella (0 abajo, 1 arriba, 2 izquierda, 3 derecha)
    for (let d = 0; d < 4; d++) {
      this.anims.create({
        key: `walk${d}`,
        frames: [0, 1, 2, 3].map(f => ({ key: 'bella', frame: `b${d}_${f}` })),
        frameRate: 9,
        repeat: -1
      });
    }
    this.anims.create({
      key: 'tinaIdle',
      frames: ['sit', 'sit', 'swish', 'sit', 'sit', 'blink', 'sit', 'swish', 'swish', 'sit'].map(p => ({ key: 'tina', frame: `t_${p}` })),
      frameRate: 3,
      repeat: -1
    });

    // Mapas: se calcula la grilla de todas las plantas (sin dibujar) para ubicar a Tina
    this.defs = {};
    this.maps = {};
    JT.FLOORS.forEach(def => {
      this.defs[def.id] = def;
      this.maps[def.id] = JT.MapRenderer.build(def, false);
    });

    // Personajes
    this.bella = this.add.sprite(0, 0, 'bella', 'b0_0').setScale(1.2 / this.R).setOrigin(0.5, 56 / 60);
    this.tina = this.add.sprite(0, 0, 'tina', 't_sit').setScale(1.1 / this.R).setOrigin(0.5, 33 / 36);
    this.tina.play('tinaIdle');

    // Niebla (radio de visión)
    this.fog = this.add.image(0, 0, 'light').setDepth(6000);
    const fogSize = C.LIGHT_RADIUS * 2.6;
    this.fog.setDisplaySize(fogSize, fogSize);
    this.fogRects = this.add.graphics().setDepth(6000);

    // Indicador de dirección del maullido
    this.meowArrow = this.add.text(0, 0, '➤', {
      fontFamily: 'system-ui, sans-serif', fontSize: '34px', color: '#ffd166', stroke: '#3a2a00', strokeThickness: 4
    }).setOrigin(0.5).setDepth(6600).setAlpha(0).setResolution(2);
    this.meowLabel = this.add.text(0, 0, 'miau', {
      fontFamily: 'system-ui, sans-serif', fontSize: '15px', fontStyle: 'bold', color: '#ffd166', stroke: '#3a2a00', strokeThickness: 4
    }).setOrigin(0.5).setDepth(6600).setAlpha(0).setResolution(2);

    this.stairMarkers = [];
    this.vel = { x: 0, y: 0 };
    this.dir = 0;
    this.state = 'ready';
    this.debug = { plan: null, grid: null, on: false };

    this.hud = {
      timer: document.getElementById('timer'),
      floor: document.getElementById('floorName'),
      hint: document.getElementById('hint'),
      stack: document.getElementById('floorStack')
    };
    this.buildFloorStack();

    this.scale.on('resize', this.onResize, this);
    this.onResize();

    this.setupDebugKeys();

    // Fondo de la pantalla de inicio: Piso 1
    this.loadFloor('p1', ...this.maps.p1.spawn);
    this.tina.setVisible(false);

    JT.Game.scene = this;
    JT.Game.onSceneReady && JT.Game.onSceneReady();
  }

  // ───────────────────────── Partida ─────────────────────────
  startGame() {
    const C = JT.CONFIG;
    JT.Controls.reset();
    this.vel = { x: 0, y: 0 };
    this.remaining = C.GAME_SECONDS;
    this.lastTick = Math.ceil(this.remaining);
    this.elapsed = 0;
    this.nextMeow = 2.5;
    JT.Audio.setPurr(0);

    const spawn = this.maps.p1.spawn;
    this.tinaSpot = this.pickTinaSpot();

    this.tina.setFrame('t_sit').play('tinaIdle');
    this.tina.setFlipX(Math.random() < 0.5);
    this.children.list.filter(o => o.getData && o.getData('fx')).forEach(o => o.destroy());

    this.state = 'playing';
    this.loadFloor('p1', ...spawn);
    this.setHint('¡Encuentra a Tina! Escucha sus maullidos 🐾');
    this.updateTimer();
  }

  /*
   * Escondite de Tina con "bolsa barajada":
   *  - recorre TODOS los escondites en orden aleatorio sin repetir ninguno hasta agotarlos;
   *  - nunca usa el mismo piso en dos partidas seguidas (ni al rebarajar);
   *  - la bolsa se guarda en localStorage, así no se repite aunque se recargue la página.
   */
  hideCandidates() {
    const C = JT.CONFIG, spawn = this.maps.p1.spawn, list = [];
    JT.FLOORS.forEach(def => {
      this.maps[def.id].hides.forEach((h, i) => {
        if (def.id === 'p1' && Math.hypot(h[0] - spawn[0], h[1] - spawn[1]) < C.TINA_AVOID_START_FLOOR_RADIUS) return;
        list.push({ key: `${def.id}:${i}`, floor: def.id, x: h[0], y: h[1] });
      });
    });
    return list;
  }

  buildHideBag(candidates, lastFloor) {
    const byFloor = {};
    candidates.forEach(c => (byFloor[c.floor] = byFloor[c.floor] || []).push(c.key));
    Object.values(byFloor).forEach(l => Phaser.Utils.Array.Shuffle(l));
    const bag = [];
    let prev = lastFloor;
    while (Object.values(byFloor).some(l => l.length)) {
      const left = Object.keys(byFloor).filter(f => byFloor[f].length);
      const others = left.filter(f => f !== prev);
      // Prioriza pisos con más escondites pendientes para no quedar atrapado al final
      const pool = others.length ? others : left;
      const max = Math.max(...pool.map(f => byFloor[f].length));
      const heavy = pool.filter(f => byFloor[f].length >= max - 1);
      const f = Phaser.Utils.Array.GetRandom(heavy);
      bag.push(byFloor[f].pop());
      prev = f;
    }
    return bag;
  }

  pickTinaSpot() {
    const candidates = this.hideCandidates();
    const byKey = new Map(candidates.map(c => [c.key, c]));
    let bag = [], last = null;
    try {
      bag = JSON.parse(localStorage.getItem('jt-tina-bag') || '[]');
      last = localStorage.getItem('jt-tina-last');
    } catch (e) { bag = this.hideBag || []; last = this.lastHide || null; }
    // Si floors.js cambió, las claves guardadas pueden no existir: se descartan
    bag = Array.isArray(bag) ? bag.filter(k => byKey.has(k) && k !== last) : [];
    if (!bag.length) {
      const lastFloor = last ? last.split(':')[0] : null;
      bag = this.buildHideBag(candidates.filter(c => c.key !== last), lastFloor);
    }
    const key = bag.shift();
    this.hideBag = bag; this.lastHide = key;
    try {
      localStorage.setItem('jt-tina-bag', JSON.stringify(bag));
      localStorage.setItem('jt-tina-last', key);
    } catch (e) { /* sin almacenamiento: se usa la memoria */ }
    return byKey.get(key);
  }

  endGame(won) {
    if (this.state !== 'playing') return;
    this.state = won ? 'won' : 'lost';
    this.bella.anims.stop();
    this.bella.setFrame(`b${this.dir}_0`);
    JT.Controls.reset();

    const used = Math.min(JT.CONFIG.GAME_SECONDS, this.elapsed);
    if (won) {
      JT.Audio.win();
      JT.Audio.setPurr(1, 0);   // Tina ronronea feliz
      this.time.delayedCall(3200, () => JT.Audio.setPurr(0));
      this.tina.anims.stop();
      this.tina.setFrame('t_happy');
      this.tweens.add({ targets: this.tina, y: this.tina.y - 18, yoyo: true, duration: 220, repeat: 2, ease: 'Quad.easeOut' });
      for (let i = 0; i < 12; i++) {
        const h = this.add.image(this.tina.x, this.tina.y - 20, 'heart')
          .setScale(0.6 / this.R + Math.random() * 0.4).setDepth(7000).setData('fx', true);
        this.tweens.add({
          targets: h,
          x: h.x + Phaser.Math.Between(-90, 90),
          y: h.y - Phaser.Math.Between(60, 160),
          alpha: 0,
          duration: 1400 + Math.random() * 600,
          delay: i * 70,
          ease: 'Sine.easeOut',
          onComplete: () => h.destroy()
        });
      }
      this.cameras.main.zoomTo(this.baseZoom * 1.35, 700, 'Sine.easeInOut');
      this.fog.setVisible(false); this.fogRects.setVisible(false);
      this.setHint('¡Bella encontró a Tina! 💖');
      this.time.delayedCall(1900, () => JT.Game.showEnd(true, used, null));
    } else {
      JT.Audio.lose();
      const def = this.defs[this.tinaSpot.floor];
      this.setHint('⏰ ¡Se acabó el tiempo!');
      this.time.delayedCall(900, () => JT.Game.showEnd(false, used, def));
    }
  }

  // ───────────────────────── Plantas ─────────────────────────
  loadFloor(id, x, y) {
    const def = this.defs[id];
    const map = JT.MapRenderer.build(def, true);
    this.maps[id] = Object.assign(this.maps[id] || {}, map);
    this.map = this.maps[id];
    this.floorId = id;

    // Texturas: se conserva solo la planta actual para ahorrar memoria (móviles)
    if (this.floorImg) this.floorImg.destroy();
    if (this.topImg) this.topImg.destroy();
    ['floorTex', 'topTex'].forEach(k => this.textures.exists(k) && this.textures.remove(k));
    this.textures.addCanvas('floorTex', map.floor);
    this.floorImg = this.add.image(0, 0, 'floorTex').setOrigin(0).setDepth(0);
    if (map.top) {
      this.textures.addCanvas('topTex', map.top);
      this.topImg = this.add.image(0, 0, 'topTex').setOrigin(0).setDepth(5000);
    } else this.topImg = null;
    map.floor = null; map.top = null; // el canvas vive dentro de la textura

    const cam = this.cameras.main;
    const pad = 200;
    cam.setBounds(-pad, -pad, map.W + pad * 2, map.H + pad * 2);
    cam.setBackgroundColor(def.outside || '#1a2233');

    this.bella.setPosition(x, y);
    this.stairLock = true;
    cam.startFollow(this.bella, true, 0.12, 0.12);
    cam.centerOn(x, y);

    const tinaHere = this.tinaSpot && this.tinaSpot.floor === id && this.state !== 'ready';
    this.tina.setVisible(!!tinaHere);
    if (tinaHere) this.tina.setPosition(this.tinaSpot.x, this.tinaSpot.y);

    // Marcadores de escaleras visibles a través de la niebla
    this.stairMarkers.forEach(m => m.destroy());
    this.stairMarkers = [];
    map.stairs.forEach(st => {
      const to = this.defs[st.to];
      const up = st.dir === 'up';
      const t = this.add.text(st.cx, st.cy, `${up ? '▲' : '▼'} P${to ? to.level : '?'}`, {
        fontFamily: 'system-ui, sans-serif', fontSize: '15px', fontStyle: 'bold',
        color: up ? '#ffe08a' : '#a8ecf7', stroke: '#111', strokeThickness: 4
      }).setOrigin(0.5).setDepth(6500).setAlpha(0.85).setResolution(2);
      this.tweens.add({ targets: t, alpha: 0.45, yoyo: true, repeat: -1, duration: 900 });
      this.stairMarkers.push(t);
    });

    if (this.debug.on) this.showDebug(true);
    this.hud.floor.textContent = def.name;
    [...this.hud.stack.children].forEach(el => el.classList.toggle('active', el.dataset.floor === id));
  }

  changeFloor(st) {
    const target = this.maps[st.to];
    if (!target) { console.warn('Planta destino no existe', st); return; }
    const dest = target.stairs.find(s => s.id === st.target);
    if (!dest) { console.warn('Escalera destino no existe', st); return; }
    this.state = 'transition';
    JT.Audio.stairs(st.dir === 'up');
    const cam = this.cameras.main;
    cam.fadeOut(170, 0, 0, 0);
    cam.once('camerafadeoutcomplete', () => {
      this.loadFloor(st.to, dest.ax, dest.ay);
      cam.fadeIn(200, 0, 0, 0);
      this.state = 'playing';
      const def = this.defs[st.to];
      this.setHint(`${st.dir === 'up' ? 'Subiste' : 'Bajaste'} al ${def.name.split('·')[0].trim()}`);
    });
  }

  // ───────────────────────── Bucle ─────────────────────────
  update(time, delta) {
    const C = JT.CONFIG;
    const dt = Math.min(0.05, delta / 1000);

    if (this.state === 'playing') {
      this.elapsed += dt;
      this.remaining -= dt;
      this.updateTimer();
      if (this.remaining <= 0) { this.remaining = 0; this.updateTimer(); this.endGame(false); }
      JT.Audio.setHurry(this.remaining <= C.HURRY_SECONDS);
    }

    const canMove = this.state === 'playing';
    const input = canMove ? JT.Controls.vector() : { x: 0, y: 0 };
    const k = Math.min(1, C.BELLA_ACCEL * dt);
    this.vel.x += (input.x * C.BELLA_SPEED - this.vel.x) * k;
    this.vel.y += (input.y * C.BELLA_SPEED - this.vel.y) * k;
    if (Math.abs(this.vel.x) < 1) this.vel.x = 0;
    if (Math.abs(this.vel.y) < 1) this.vel.y = 0;

    if (canMove) this.moveBella(dt, input);
    this.bella.setDepth(this.bella.y);
    this.tina.setDepth(this.tina.y);

    // Niebla
    const fx = this.bella.x, fy = this.bella.y - 20;
    this.fog.setPosition(fx, fy);
    this.drawFogRects(fx, fy);
    this.meowArrow.setPosition(this.bella.x + this.meowDX * 58, this.bella.y - 22 + this.meowDY * 58);
    this.meowLabel.setPosition(this.meowArrow.x, this.meowArrow.y - 22);

    if (this.state !== 'playing') return;

    // Escaleras
    const st = this.map.stairs.find(s =>
      this.bella.x > s.x && this.bella.x < s.x + s.w && this.bella.y > s.y && this.bella.y < s.y + s.h);
    if (!st) this.stairLock = false;
    else if (!this.stairLock) { this.changeFloor(st); return; }

    // ¿Encontró a Tina?
    if (this.tina.visible) {
      const d = Math.hypot(this.tina.x - this.bella.x, this.tina.y - this.bella.y);
      if (d < C.FIND_DISTANCE) { this.faceTowards(this.tina.x, this.tina.y); this.endGame(true); return; }
    }

    // Ronroneo: se oye cada vez más fuerte al acercarse a Tina (mismo piso)
    const dTina = this.distToTina();
    if (dTina < C.PURR_DISTANCE) {
      const k = 1 - dTina / C.PURR_DISTANCE;
      JT.Audio.setPurr(k * k, (this.tinaSpot.x - this.bella.x) / 500);
    } else JT.Audio.setPurr(0);

    // Maullidos (más seguidos cuando está cerca)
    this.nextMeow -= dt;
    if (this.nextMeow <= 0) {
      const every = dTina < C.NEAR_DISTANCE ? C.MEOW_NEAR_EVERY : C.MEOW_EVERY;
      this.nextMeow = Phaser.Math.FloatBetween(every[0], every[1]);
      this.meow();
    }
  }

  moveBella(dt, input) {
    const b = this.bella;
    const nx = b.x + this.vel.x * dt, ny = b.y + this.vel.y * dt;
    if (this.canStand(nx, b.y)) b.x = nx;
    else if (!this.slide(nx - b.x, 0)) this.vel.x = 0;
    if (this.canStand(b.x, ny)) b.y = ny;
    else if (!this.slide(0, ny - b.y)) this.vel.y = 0;

    const speed = Math.hypot(this.vel.x, this.vel.y);
    if (speed > 25) {
      const vx = input.x || this.vel.x / speed, vy = input.y || this.vel.y / speed;
      const dir = Math.abs(vx) > Math.abs(vy) ? (vx < 0 ? 2 : 3) : (vy < 0 ? 1 : 0);
      if (dir !== this.dir || !b.anims.isPlaying) { this.dir = dir; b.play(`walk${dir}`, true); }
      b.anims.timeScale = Phaser.Math.Clamp(speed / JT.CONFIG.BELLA_SPEED, 0.5, 1.2) * 1.3;
    } else if (b.anims.isPlaying) {
      b.anims.stop();
      b.setFrame(`b${this.dir}_0`);
    }
  }

  // Desliza a lo largo de muros diagonales: si choca, prueba empujar un poco en perpendicular
  slide(dx, dy) {
    const b = this.bella;
    const step = Math.max(Math.abs(dx), Math.abs(dy));
    for (const s of [1, -1]) {
      const px = dy ? s * step : 0, py = dx ? s * step : 0;
      if (this.canStand(b.x + dx + px, b.y + dy + py)) { b.x += dx + px * 0.7; b.y += dy + py * 0.7; return true; }
    }
    return false;
  }

  canStand(x, y) {
    const r = JT.CONFIG.BELLA_RADIUS, m = this.map;
    if (!m.walkable(x, y)) return false;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      if (!m.walkable(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7)) return false;
    }
    return true;
  }

  faceTowards(x, y) {
    const dx = x - this.bella.x, dy = y - this.bella.y;
    this.dir = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 2 : 3) : (dy < 0 ? 1 : 0);
  }

  /* Distancia a Tina si está en este piso (Infinity si no) */
  distToTina() {
    const spot = this.tinaSpot;
    if (!spot || spot.floor !== this.floorId) return Infinity;
    return Math.hypot(spot.x - this.bella.x, spot.y - this.bella.y);
  }

  meow() {
    const spot = this.tinaSpot;
    const here = this.defs[this.floorId], there = this.defs[spot.floor];
    if (spot.floor === this.floorId) {
      const dx = spot.x - this.bella.x, dy = spot.y - this.bella.y;
      const d = Math.hypot(dx, dy);
      const vol = Phaser.Math.Clamp(1 - d / 2200, 0.18, 1);
      // Cerca: maullidos cortos e insistentes; lejos: maullidos largos
      const kinds = d < 350 ? ['short', 'double', 'chirp'] : d < 800 ? ['double', 'long', 'short'] : ['long', 'long', 'yowl'];
      JT.Audio.meow(vol, dx / 700, false, Phaser.Utils.Array.GetRandom(kinds));
      // Flecha aproximada (±20°) hacia el maullido
      const a = Math.atan2(dy, dx) + Phaser.Math.FloatBetween(-0.35, 0.35);
      this.showMeowArrow(a);
      const near = d < 350 ? '¡muy cerca! 😺' : d < 800 ? 'cerca…' : 'lejos, pero en este piso';
      this.setHint(`¡Miau! Tina está ${near}`);
    } else {
      const up = there.level > here.level;
      JT.Audio.meow(0.35, 0, true, Math.random() < 0.3 ? 'yowl' : 'long');
      this.meowDX = 0; this.meowDY = 0;
      const n = Math.abs(there.level - here.level);
      this.setHint(`Se oye un miau lejano… viene de ${up ? 'arriba ⬆' : 'abajo ⬇'}${n > 1 ? ' (varios pisos)' : ''}`);
    }
  }

  showMeowArrow(a) {
    this.meowDX = Math.cos(a); this.meowDY = Math.sin(a);
    this.meowArrow.setRotation(a);
    this.tweens.killTweensOf([this.meowArrow, this.meowLabel]);
    this.meowArrow.setAlpha(1); this.meowLabel.setAlpha(1);
    this.tweens.add({ targets: [this.meowArrow, this.meowLabel], alpha: 0, delay: 1300, duration: 600 });
  }

  drawFogRects(fx, fy) {
    const g = this.fogRects;
    g.clear();
    if (!this.fog.visible) return;
    const v = this.cameras.main.worldView;
    const half = this.fog.displayWidth / 2;
    const L = v.x - 400, T = v.y - 400, Rr = v.right + 400, B = v.bottom + 400;
    const l = fx - half, t = fy - half, r = fx + half, b = fy + half;
    g.fillStyle(0x080a14, JT.CONFIG.FOG_ALPHA);
    g.fillRect(L, T, Rr - L, Math.max(0, t - T));
    g.fillRect(L, b, Rr - L, Math.max(0, B - b));
    g.fillRect(L, t, Math.max(0, l - L), b - t);
    g.fillRect(r, t, Math.max(0, Rr - r), b - t);
  }

  // ───────────────────────── HUD ─────────────────────────
  updateTimer() {
    const s = Math.max(0, Math.ceil(this.remaining));
    this.hud.timer.textContent = JT.formatTime(s);
    this.hud.timer.classList.toggle('warn', s <= 10);
    if (s !== this.lastTick) {
      this.lastTick = s;
      if (s <= 10 && s > 0 && this.state === 'playing') JT.Audio.tick();
    }
  }

  setHint(text) {
    const h = this.hud.hint;
    h.textContent = text;
    h.classList.remove('pop'); void h.offsetWidth; h.classList.add('pop');
  }

  buildFloorStack() {
    const el = this.hud.stack;
    el.innerHTML = '';
    [...JT.FLOORS].sort((a, b) => b.level - a.level).forEach(def => {
      const d = document.createElement('div');
      d.textContent = def.level;
      d.dataset.floor = def.id;
      el.appendChild(d);
    });
  }

  onResize() {
    const cam = this.cameras.main;
    const w = this.scale.width, h = this.scale.height;
    cam.setSize(w, h);
    this.baseZoom = Math.min(w, h) / JT.CONFIG.VIEW_WORLD_SIZE;
    cam.setZoom(this.baseZoom);
    this.meowDX = this.meowDX || 0; this.meowDY = this.meowDY || 0;
  }

  // ───────────────────────── Depuración / edición de mapas ─────────────────────────
  setupDebugKeys() {
    window.addEventListener('keydown', e => {
      if (e.code === 'KeyP') this.togglePlan();
      if (e.code === 'KeyG') this.toggleGrid();
    });
    this.input.on('pointermove', p => {
      if (!this.debug.on) return;
      const def = this.defs[this.floorId];
      const wp = this.cameras.main.getWorldPoint(p.x, p.y);
      const ix = Math.round(wp.x / def.scale + def.origin[0]);
      const iy = Math.round(wp.y / def.scale + def.origin[1]);
      this.hud.hint.textContent = `Plano: x=${ix} y=${iy}  (mundo ${Math.round(wp.x)}, ${Math.round(wp.y)})`;
    });
  }

  togglePlan() {
    this.debug.on = !this.debug.planVisible;
    this.debug.planVisible = !this.debug.planVisible;
    this.showDebug(this.debug.planVisible, 'plan');
  }

  toggleGrid() {
    this.debug.gridVisible = !this.debug.gridVisible;
    this.debug.on = this.debug.gridVisible || this.debug.planVisible;
    this.showDebug(this.debug.gridVisible, 'grid');
  }

  showDebug(on, which) {
    const def = this.defs[this.floorId], map = this.map;
    if (!which || which === 'plan') {
      if (this.debug.plan) { this.debug.plan.destroy(); this.debug.plan = null; }
      if (on && this.debug.planVisible) {
        const key = `plan-${def.id}`;
        const place = () => {
          if (this.debug.plan) this.debug.plan.destroy();
          this.debug.plan = this.add.image(-def.origin[0] * def.scale, -def.origin[1] * def.scale, key)
            .setOrigin(0).setScale(def.scale).setAlpha(0.55).setDepth(4000);
        };
        if (this.textures.exists(key)) place();
        else if (location.protocol === 'file:') this.setHint('Para ver el plano abre el juego con "npm start" (http).');
        else { this.load.image(key, def.plan); this.load.once('complete', place); this.load.start(); }
      }
    }
    if (!which || which === 'grid') {
      if (this.debug.grid) { this.debug.grid.destroy(); this.debug.grid = null; }
      if (this.textures.exists('gridTex')) this.textures.remove('gridTex');
      if (on && this.debug.gridVisible) {
        const c = document.createElement('canvas');
        c.width = map.cols; c.height = map.rows;
        const x = c.getContext('2d'), img = x.createImageData(map.cols, map.rows);
        for (let i = 0; i < map.grid.length; i++) {
          const w = map.grid[i];
          img.data[i * 4] = w ? 0 : 255; img.data[i * 4 + 1] = w ? 200 : 0; img.data[i * 4 + 2] = 0;
          img.data[i * 4 + 3] = 90;
        }
        x.putImageData(img, 0, 0);
        this.textures.addCanvas('gridTex', c).setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.debug.grid = this.add.image(0, 0, 'gridTex').setOrigin(0).setScale(map.CELL).setDepth(4001);
      }
    }
  }
};
