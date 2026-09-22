window.JT = window.JT || {};

/*
 * Controles: cruceta virtual (táctil / ratón) + teclado físico (flechas o WASD).
 * Las flechas en pantalla se iluminan también al usar el teclado.
 * JT.Controls.vector() devuelve {x, y} con valores -1..1.
 */
JT.Controls = (function () {
  const keys = { up: false, down: false, left: false, right: false };
  const touch = { up: false, down: false, left: false, right: false };
  let pad, btn = {};
  const pointers = new Map();

  const KEYMAP = {
    ArrowUp: 'up', KeyW: 'up',
    ArrowDown: 'down', KeyS: 'down',
    ArrowLeft: 'left', KeyA: 'left',
    ArrowRight: 'right', KeyD: 'right'
  };

  function init() {
    pad = document.getElementById('dpad');
    ['up', 'down', 'left', 'right'].forEach(d => (btn[d] = pad.querySelector(`[data-dir="${d}"]`)));

    window.addEventListener('keydown', e => {
      const d = KEYMAP[e.code];
      if (d) { keys[d] = true; e.preventDefault(); refresh(); }
    });
    window.addEventListener('keyup', e => {
      const d = KEYMAP[e.code];
      if (d) { keys[d] = false; e.preventDefault(); refresh(); }
    });
    window.addEventListener('blur', () => { Object.keys(keys).forEach(k => (keys[k] = false)); pointers.clear(); updateTouch(); });

    // Toda la cruceta es una zona táctil: la dirección se calcula desde el centro,
    // lo que permite diagonales y deslizar el dedo sin levantarlo.
    pad.addEventListener('pointerdown', e => {
      e.preventDefault();
      try { pad.setPointerCapture(e.pointerId); } catch (_) { /* puntero sintético */ }
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      updateTouch();
    });
    pad.addEventListener('pointermove', e => {
      if (!pointers.has(e.pointerId)) return;
      e.preventDefault();
      pointers.set(e.pointerId, [e.clientX, e.clientY]);
      updateTouch();
    });
    const end = e => { pointers.delete(e.pointerId); updateTouch(); };
    pad.addEventListener('pointerup', end);
    pad.addEventListener('pointercancel', end);
    pad.addEventListener('lostpointercapture', end);
    pad.addEventListener('contextmenu', e => e.preventDefault());
  }

  function updateTouch() {
    Object.keys(touch).forEach(k => (touch[k] = false));
    const r = pad.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    pointers.forEach(([x, y]) => {
      const dx = x - cx, dy = y - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < r.width * 0.1) return; // zona muerta
      const a = Math.atan2(dy, dx); // 8 sectores
      const sector = Math.round(a / (Math.PI / 4));
      const map = {
        0: ['right'], 1: ['right', 'down'], 2: ['down'], 3: ['down', 'left'],
        4: ['left'], '-4': ['left'], '-3': ['left', 'up'], '-2': ['up'], '-1': ['up', 'right']
      };
      (map[sector] || []).forEach(d => (touch[d] = true));
    });
    refresh();
  }

  function state(d) { return keys[d] || touch[d]; }

  function refresh() {
    Object.keys(btn).forEach(d => btn[d] && btn[d].classList.toggle('active', state(d)));
  }

  function vector() {
    let x = (state('right') ? 1 : 0) - (state('left') ? 1 : 0);
    let y = (state('down') ? 1 : 0) - (state('up') ? 1 : 0);
    if (x && y) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
    return { x, y };
  }

  function reset() {
    Object.keys(keys).forEach(k => (keys[k] = false));
    pointers.clear();
    updateTouch();
  }

  return { init, vector, reset };
})();
