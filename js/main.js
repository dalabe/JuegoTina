window.JT = window.JT || {};

/* Arranque del juego y manejo de pantallas (inicio / fin). */
JT.Game = (function () {
  const dpr = () => Math.min(window.devicePixelRatio || 1, 2);
  const $ = id => document.getElementById(id);
  // Si la ventana aún no tiene tamaño (pestaña oculta al cargar) se usa un mínimo
  const vw = () => Math.max(320, window.innerWidth || 0);
  const vh = () => Math.max(320, window.innerHeight || 0);
  let game = null;

  function drawPortraits() {
    const b = $('portraitBella').getContext('2d');
    b.scale(4, 4); JT.Sprites.drawBella(b, 0, 0, 0);
    const t = $('portraitTina').getContext('2d');
    t.scale(4, 4); JT.Sprites.drawTina(t, 'sit');
  }

  function start() {
    JT.Audio.unlock();
    $('startScreen').classList.add('hidden');
    $('endScreen').classList.add('hidden');
    $('hud').classList.remove('hidden');
    $('dpad').classList.remove('hidden');
    if (api.scene) {
      api.scene.cameras.main.setZoom(api.scene.baseZoom);
      api.scene.fog.setVisible(true);
      api.scene.fogRects.setVisible(true);
      api.scene.startGame();
    }
  }

  function showEnd(won, seconds, tinaFloorDef) {
    $('dpad').classList.add('hidden');
    $('endEmoji').textContent = won ? '🎉😻' : '⏰🙀';
    $('endTitle').textContent = won ? '¡Bella encontró a Tina!' : '¡Se acabó el tiempo!';
    $('endText').innerHTML = won
      ? `La encontraste en <b>${seconds < 60 ? seconds.toFixed(1) + ' segundos' : JT.formatTime(Math.round(seconds)) + ' minutos'}</b>. ¡Tina está feliz de verte! 💖`
      : `Tina seguía escondida en el <b>${tinaFloorDef.name}</b>. ¡Inténtalo otra vez!`;
    $('endScreen').classList.remove('hidden');
    setTimeout(() => $('btnAgain').focus(), 50);
  }

  function resize() {
    if (!game) return;
    const r = dpr();
    game.scale.setZoom(1 / r);
    game.scale.resize(Math.round(vw() * r), Math.round(vh() * r));
  }

  function toggleFullscreen() {
    const el = document.documentElement;
    if (!document.fullscreenElement) (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el);
    else (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  }

  function boot() {
    JT.Controls.init();
    drawPortraits();
    const secs = JT.CONFIG.GAME_SECONDS;
    $('secs').textContent = secs % 60 === 0 ? `${secs / 60} minuto${secs === 60 ? '' : 's'}` : `${secs} segundos`;
    $('timer').textContent = JT.formatTime(secs);

    const r = dpr();
    game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: 'game',
      backgroundColor: '#141a2b',
      scale: {
        mode: Phaser.Scale.NONE,
        width: Math.round(vw() * r),
        height: Math.round(vh() * r),
        zoom: 1 / r
      },
      render: { antialias: true, powerPreference: 'high-performance' },
      input: { keyboard: false },
      scene: [JT.GameScene]
    });
    api.game = game;

    window.addEventListener('resize', resize);
    window.addEventListener('orientationchange', () => setTimeout(resize, 200));
    $('btnPlay').addEventListener('click', start);
    $('btnAgain').addEventListener('click', start);
    $('btnFull').addEventListener('click', toggleFullscreen);
    window.addEventListener('keydown', e => {
      if (e.code !== 'Enter' && e.code !== 'Space') return;
      const startVisible = !$('startScreen').classList.contains('hidden') && !$('btnPlay').disabled;
      const endVisible = !$('endScreen').classList.contains('hidden');
      if (startVisible || endVisible) { e.preventDefault(); start(); }
    });
  }

  const api = {
    game: null,
    scene: null,
    showEnd,
    onSceneReady() {
      const b = $('btnPlay');
      b.disabled = false;
      b.textContent = '¡Jugar!';
    }
  };

  window.addEventListener('DOMContentLoaded', boot);
  return api;
})();
