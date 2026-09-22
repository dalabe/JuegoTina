window.JT = window.JT || {};

/* Ajustes generales del juego. Cambia estos valores para modificar la dificultad. */
JT.CONFIG = {
  GAME_SECONDS: 300,       // duración de la partida (5 minutos)
  BELLA_SPEED: 290,        // píxeles de mundo por segundo
  BELLA_ACCEL: 12,         // suavizado de aceleración (más alto = más reactivo)
  BELLA_RADIUS: 11,        // radio de colisión (pies)
  FIND_DISTANCE: 46,       // distancia para "encontrar" a Tina
  LIGHT_RADIUS: 250,       // radio de visión de Bella (niebla)
  FOG_ALPHA: 0.86,         // oscuridad fuera del radio de visión
  CELL: 6,                 // tamaño de celda de la grilla de colisión (px de mundo)
  MEOW_EVERY: [5, 8],      // Tina maúlla cada 5-8 segundos (pista sonora)
  MEOW_NEAR_EVERY: [2, 3.5], // ...y más seguido cuando Bella está cerca
  NEAR_DISTANCE: 450,      // distancia a la que Tina se considera "cerca"
  PURR_DISTANCE: 550,      // a esta distancia empieza a oírse el ronroneo
  HURRY_SECONDS: 60,       // la música se acelera cuando queda este tiempo
  TINA_AVOID_START_FLOOR_RADIUS: 700, // Tina no se esconde tan cerca del punto de inicio
  VIEW_WORLD_SIZE: 760,    // cuántos px de mundo se ven en la dimensión menor de la pantalla
  TINA_STATIC: true        // Tina permanece quieta en su escondite
};

/* 300 -> "5:00" */
JT.formatTime = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

/* Materiales de piso: color base + detalle */
JT.MATERIALS = {
  plaza:    { base: '#cfc8bb', line: '#bdb5a6', pattern: 'tiles', size: 40 },
  grass:    { base: '#7fa65a', line: '#6f9450', pattern: 'grass' },
  steps:    { base: '#b8ab95', line: '#9e917b', pattern: 'stripes', size: 14 },
  gallery:  { base: '#ece6da', line: '#dcd4c4', pattern: 'tiles', size: 60 },
  lobby:    { base: '#dfe8ea', line: '#c9d6d9', pattern: 'tiles', size: 30 },
  hall:     { base: '#b9785a', line: '#a4674b', pattern: 'bricks', size: 22 },
  hallBand: { base: '#c98a6a', line: '#b17558', pattern: 'stripes', size: 10 },
  office:   { base: '#aeb8c4', line: '#9eaab8', pattern: 'carpet' },
  wood:     { base: '#a8703f', line: '#915f33', pattern: 'planks', size: 16 },
  terrace:  { base: '#c4b59b', line: '#ae9f84', pattern: 'planks', size: 20 },
  bath:     { base: '#e8f1f5', line: '#cfdfe6', pattern: 'tiles', size: 16 },
  void:     { base: '#1a2233', line: '#243049', pattern: 'cross' },
  roof:     { base: '#56606e', line: '#4a5361', pattern: 'stripes', size: 8 }
};
