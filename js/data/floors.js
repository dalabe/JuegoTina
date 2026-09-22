/*
 * Plantas del Museo de Arte Moderno de Medellín (MAMM).
 *
 * TODAS las coordenadas están en PÍXELES DE LA IMAGEN del plano indicado en `plan`
 * (carpeta /maps). Así puedes abrir el plano en cualquier editor de imágenes, leer la
 * posición (x, y) del cursor y copiarla aquí. El juego convierte a coordenadas de mundo con:
 *
 *      mundo = (imagen - origin) * scale
 *
 * Pulsa la tecla "P" dentro del juego (servido por http) para ver el plano original encima
 * del mapa y alinear las formas. Pulsa "G" para ver la grilla de colisión.
 *
 * Formas:
 *   rect: [x, y, ancho, alto]     poly: [[x,y], [x,y], ...]
 *
 * areas   -> superficies caminables. `mat` define el material/color del piso.
 *            Los bordes exteriores de las áreas se convierten automáticamente en muros.
 * decor   -> superficies NO caminables solo decorativas (techos, vacíos, agua...).
 * walls   -> muros interiores (polilíneas). Deja huecos entre segmentos para las puertas.
 * props   -> objetos: tree, plant, planter, bench, sculpture, column, desk, table,
 *            seats, panel, painting, block (solido genérico), stage, steps.
 * stairs  -> escaleras. Al pisarlas Bella sube/baja a `to` (id de planta) y aparece
 *            en la escalera `target` de esa planta.
 * hides   -> escondites posibles de Tina (se elige uno al azar al iniciar).
 */
window.JT = window.JT || {};

JT.FLOORS = [
  // ───────────────────────────── PISO 1 ─────────────────────────────
  {
    id: 'p1',
    level: 1,
    name: 'Piso 1 · Planta urbana',
    plan: 'maps/02_MAMM_Planta_Urbana_y_Primer_Nivel.jpg',
    scale: 2.5,
    origin: [180, 120],
    size: [1170, 760],
    outside: '#5d6b58',
    spawn: [640, 790],
    areas: [
      { mat: 'plaza', rect: [180, 135, 1165, 725] },
      { mat: 'grass', rect: [180, 135, 1165, 50] },
      { mat: 'grass', rect: [900, 740, 445, 120] },
      { mat: 'grass', poly: [[180, 250], [228, 245], [185, 480], [228, 780], [180, 790]] },
      { mat: 'steps', poly: [[490, 402], [545, 415], [545, 720], [490, 715]] },
      // Edificio norte (torre)
      { mat: 'gallery', rect: [540, 195, 355, 140] },
      { mat: 'gallery', rect: [795, 335, 100, 165] },
      // Edificio central
      { mat: 'gallery', rect: [545, 415, 190, 100] },
      { mat: 'gallery', rect: [545, 515, 55, 205] },
      { mat: 'gallery', rect: [675, 470, 60, 160] },
      // Lobby vidriado
      { mat: 'lobby', rect: [895, 195, 40, 445] },
      // Nave de Talleres Robledo
      { mat: 'hall', rect: [935, 190, 410, 530] },
      { mat: 'hallBand', rect: [945, 255, 395, 115] },
      { mat: 'hallBand', rect: [945, 545, 395, 95] }
    ],
    decor: [],
    walls: [
      // Torre: perímetro con puertas
      [[540, 195], [895, 195]],
      [[540, 195], [540, 335], [600, 335]],
      [[640, 335], [760, 335]],
      [[795, 335], [795, 420]],
      [[795, 452], [795, 500], [895, 500]],
      [[895, 195], [895, 300]],
      [[895, 340], [895, 420]],
      [[895, 500], [895, 520]],
      [[895, 560], [895, 640], [935, 640]],
      // Torre: interiores
      [[605, 195], [605, 290]],
      [[735, 195], [735, 260]],
      [[735, 292], [735, 335]],
      [[775, 195], [775, 250]],
      [[795, 280], [845, 280]],
      // Edificio central
      [[545, 415], [735, 415], [735, 470]],
      [[545, 415], [545, 560]],
      [[545, 592], [545, 720], [570, 720]],
      [[600, 515], [620, 515]],
      [[650, 515], [675, 515]],
      [[600, 515], [600, 600]],
      [[600, 632], [600, 720], [598, 720]],
      [[675, 515], [675, 630], [735, 630], [735, 592]],
      [[735, 560], [735, 470]],
      // Nave
      [[935, 190], [1345, 190], [1345, 720], [1140, 720]],
      [[1100, 720], [935, 720], [935, 540]],
      [[935, 500], [935, 300]],
      [[935, 262], [935, 190]],
      [[895, 195], [935, 195]]
    ],
    props: [
      // Árboles del borde norte
      ...[220, 310, 400, 490, 580, 665, 750, 840, 930, 1020, 1110, 1200, 1290].map(x => ({ type: 'tree', x, y: 165, r: 32 })),
      // Árboles del borde sur y jardín
      { type: 'tree', x: 1050, y: 780, r: 32 },
      { type: 'tree', x: 1130, y: 775, r: 30 },
      { type: 'tree', x: 1200, y: 775, r: 30 },
      { type: 'tree', x: 1290, y: 780, r: 30 },
      { type: 'tree', x: 350, y: 845, r: 22 },
      { type: 'tree', x: 430, y: 845, r: 22 },
      { type: 'tree', x: 555, y: 815, r: 24 },
      { type: 'tree', x: 720, y: 820, r: 24 },
      { type: 'tree', x: 835, y: 815, r: 24 },
      { type: 'planter', rect: [315, 205, 70, 25] },
      { type: 'planter', rect: [400, 205, 45, 25] },
      { type: 'plant', x: 295, y: 270, r: 22 },
      { type: 'plant', x: 355, y: 270, r: 22 },
      { type: 'plant', x: 415, y: 270, r: 22 },
      { type: 'plant', x: 350, y: 745, r: 22 },
      { type: 'plant', x: 410, y: 745, r: 22 },
      { type: 'plant', x: 470, y: 745, r: 22 },
      { type: 'sculpture', poly: [[265, 630], [300, 630], [320, 660], [300, 700], [320, 740], [300, 770], [265, 770], [255, 745], [275, 700], [255, 660]], color: '#c7b9a6' },
      { type: 'bench', rect: [400, 470, 60, 12] },
      { type: 'bench', rect: [400, 560, 60, 12] },
      { type: 'bench', rect: [760, 560, 12, 50] },
      // Torre (interior)
      { type: 'block', rect: [543, 230, 20, 30], color: '#8a8a8a' },
      { type: 'desk', rect: [625, 215, 40, 18] },
      { type: 'table', x: 690, y: 250, r: 12 },
      { type: 'block', rect: [800, 283, 45, 50], color: '#6d6d6d', label: 'ASC' },
      { type: 'painting', x1: 610, y1: 198, x2: 700, y2: 198, color: '#d9534f' },
      { type: 'sculpture', x: 680, y: 305, r: 10, color: '#e0a800' },
      { type: 'sculpture', x: 845, y: 420, r: 12, color: '#2a9d8f' },
      { type: 'painting', x1: 892, y1: 350, x2: 892, y2: 410, color: '#264653' },
      // Edificio central
      { type: 'sculpture', x: 640, y: 460, r: 14, color: '#f4a261' },
      { type: 'painting', x1: 560, y1: 418, x2: 620, y2: 418, color: '#8e44ad' },
      { type: 'painting', x1: 548, y1: 620, x2: 548, y2: 690, color: '#e76f51' },
      { type: 'panel', rect: [700, 520, 8, 60] },
      { type: 'plant', x: 720, y: 612, r: 10 },
      { type: 'bench', rect: [560, 540, 12, 40] },
      // Lobby
      { type: 'plant', x: 915, y: 225, r: 10 },
      { type: 'block', rect: [915, 588, 18, 14], color: '#b08968', label: 'INFO' },
      // Nave: columnas
      ...Array.from({ length: 9 }, (_, i) => ({ type: 'column', x: 965 + i * 46, y: 372, r: 7 })),
      ...Array.from({ length: 9 }, (_, i) => ({ type: 'column', x: 965 + i * 46, y: 545, r: 7 })),
      { type: 'panel', rect: [1000, 280, 70, 8] },
      { type: 'panel', rect: [1120, 330, 8, 40] },
      { type: 'panel', rect: [1190, 290, 90, 8] },
      { type: 'panel', rect: [1000, 600, 90, 8] },
      { type: 'panel', rect: [1180, 570, 8, 60] },
      { type: 'sculpture', x: 1060, y: 455, r: 20, color: '#e63946' },
      { type: 'sculpture', x: 1200, y: 450, r: 16, color: '#457b9d' },
      { type: 'sculpture', poly: [[1270, 420], [1310, 430], [1300, 480], [1262, 470]], color: '#1d3557' },
      { type: 'bench', rect: [1120, 440, 40, 12] },
      { type: 'painting', x1: 950, y1: 193, x2: 1120, y2: 193, color: '#f1c40f' },
      { type: 'painting', x1: 1342, y1: 300, x2: 1342, y2: 400, color: '#2ecc71' },
      { type: 'painting', x1: 960, y1: 717, x2: 1080, y2: 717, color: '#e67e22' },
      { type: 'plant', x: 1330, y: 205, r: 10 },
      { type: 'plant', x: 950, y: 705, r: 10 }
    ],
    stairs: [
      { id: 'core', rect: [850, 268, 38, 64], to: 'p2', target: 'core_down', dir: 'up' },
      { id: 'lobby', rect: [900, 422, 32, 72], to: 'p2', target: 'lobby', dir: 'up' },
      { id: 'hallNE', rect: [1245, 212, 55, 50], to: 'p2', target: 'hallNE', dir: 'up' },
      { id: 'hallSE', rect: [1298, 662, 42, 52], to: 'p2', target: 'hallSE', dir: 'up' }
    ],
    hides: [
      [340, 240], [290, 700], [572, 212], [565, 700], [715, 432], [875, 485],
      [1330, 700], [955, 355], [1150, 300], [1300, 600], [905, 625], [1320, 840], [210, 820]
    ]
  },

  // ───────────────────────────── PISO 2 ─────────────────────────────
  {
    id: 'p2',
    level: 2,
    name: 'Piso 2 · Oficinas y sala múltiple',
    plan: 'maps/03_MAMM_Planta_Segundo_Nivel.jpg',
    scale: 1.7,
    origin: [115, 30],
    size: [1300, 850],
    outside: '#26324a',
    areas: [
      { mat: 'terrace', poly: [[128, 355], [240, 375], [280, 380], [280, 830], [145, 830]] },
      { mat: 'terrace', poly: [[240, 375], [480, 390], [480, 455], [280, 455]] },
      { mat: 'office', poly: [[220, 105], [488, 70], [500, 250], [252, 300]] },
      { mat: 'office', poly: [[486, 85], [545, 85], [545, 255], [498, 250]] },
      { mat: 'office', rect: [540, 85, 190, 370] },
      { mat: 'gallery', rect: [730, 45, 60, 260] },
      { mat: 'wood', rect: [280, 455, 460, 245] },
      { mat: 'gallery', rect: [735, 300, 52, 400] },
      // Nave (mezzanines y pasarelas sobre el vacío)
      { mat: 'hall', rect: [785, 40, 615, 115] },
      { mat: 'hall', rect: [785, 690, 615, 180] },
      { mat: 'hall', rect: [785, 40, 55, 830] },
      { mat: 'hallBand', rect: [840, 155, 540, 145] },
      { mat: 'hallBand', rect: [840, 575, 540, 115] }
    ],
    decor: [
      { mat: 'void', rect: [840, 300, 560, 275], label: 'VACÍO · Nave de Talleres Robledo' }
    ],
    walls: [
      [[545, 300], [600, 300]],
      [[632, 300], [660, 300], [660, 340]],
      [[660, 372], [660, 455]],
      [[660, 400], [730, 400]],
      [[655, 145], [655, 175]],
      [[540, 455], [600, 455]],
      [[640, 455], [675, 455]],
      [[705, 455], [740, 455]],
      [[280, 455], [370, 455]],
      [[402, 455], [540, 455]],
      [[740, 455], [740, 560]],
      [[740, 600], [740, 700]],
      [[730, 305], [730, 360]],
      [[730, 400], [730, 455]],
      [[787, 160], [787, 330]],
      [[787, 480], [787, 690]],
      [[1060, 40], [1060, 110]],
      [[1160, 40], [1160, 110]],
      [[960, 870], [960, 800]],
      [[1150, 870], [1150, 800]]
    ],
    props: [
      { type: 'desk', rect: [335, 175, 40, 40] },
      { type: 'desk', rect: [395, 170, 40, 40] },
      { type: 'desk', rect: [455, 165, 30, 40] },
      { type: 'desk', rect: [335, 240, 40, 25] },
      { type: 'desk', rect: [395, 235, 40, 25] },
      { type: 'desk', rect: [320, 100, 40, 25] },
      { type: 'desk', rect: [400, 90, 40, 25] },
      { type: 'block', rect: [230, 160, 30, 60], color: '#9c8b7a' },
      { type: 'table', x: 515, y: 225, r: 14 },
      { type: 'plant', x: 525, y: 100, r: 10 },
      { type: 'block', rect: [595, 180, 55, 70], color: '#7a7a7a', label: 'ASC' },
      { type: 'table', rect: [565, 410, 60, 22] },
      { type: 'desk', rect: [675, 320, 40, 18] },
      { type: 'desk', rect: [675, 420, 40, 18] },
      { type: 'plant', x: 555, y: 440, r: 9 },
      { type: 'stage', poly: [[285, 465], [360, 465], [405, 520], [420, 580], [405, 640], [360, 690], [285, 690]] },
      ...Array.from({ length: 9 }, (_, i) => ({ type: 'seats', rect: [430 + i * 20, 490, 7, 75] })),
      ...Array.from({ length: 9 }, (_, i) => ({ type: 'seats', rect: [430 + i * 20, 590, 7, 75] })),
      { type: 'plant', x: 200, y: 400, r: 12 },
      { type: 'plant', x: 230, y: 810, r: 12 },
      { type: 'bench', rect: [180, 560, 12, 60] },
      { type: 'steps', rect: [300, 390, 150, 55] },
      { type: 'panel', rect: [900, 200, 8, 70] },
      { type: 'panel', rect: [1020, 180, 80, 8] },
      { type: 'panel', rect: [1200, 220, 8, 60] },
      { type: 'panel', rect: [930, 610, 80, 8] },
      { type: 'panel', rect: [1150, 600, 8, 70] },
      { type: 'sculpture', x: 1300, y: 220, r: 16, color: '#e9c46a' },
      { type: 'sculpture', x: 1050, y: 640, r: 14, color: '#2a9d8f' },
      { type: 'sculpture', x: 870, y: 780, r: 14, color: '#e76f51' },
      { type: 'bench', rect: [1050, 780, 60, 12] },
      { type: 'painting', x1: 800, y1: 43, x2: 1040, y2: 43, color: '#d62828' },
      { type: 'painting', x1: 1397, y1: 700, x2: 1397, y2: 860, color: '#003049' },
      { type: 'plant', x: 1380, y: 60, r: 10 },
      { type: 'plant', x: 800, y: 855, r: 10 }
    ],
    stairs: [
      { id: 'core_down', rect: [660, 182, 32, 66], to: 'p1', target: 'core', dir: 'down' },
      { id: 'core_up', rect: [694, 182, 32, 66], to: 'p3', target: 'core_down', dir: 'up' },
      { id: 'lobby', rect: [752, 385, 28, 100], to: 'p1', target: 'lobby', dir: 'down' },
      { id: 'hallNE', rect: [1235, 80, 95, 60], to: 'p1', target: 'hallNE', dir: 'down' },
      { id: 'hallSE', rect: [1340, 730, 55, 80], to: 'p1', target: 'hallSE', dir: 'down' },
      { id: 'terr_up', rect: [430, 395, 40, 45], to: 'p3', target: 'ext_down', dir: 'up' },
      { id: 'aud_up', rect: [292, 460, 60, 24], to: 'p3', target: 'aud_down', dir: 'up' }
    ],
    hides: [
      [240, 140], [320, 600], [600, 640], [180, 720], [1100, 70], [1000, 840],
      [1330, 250], [470, 280], [705, 440], [760, 90], [1370, 640], [880, 600]
    ]
  },

  // ───────────────────────────── PISO 3 ─────────────────────────────
  {
    id: 'p3',
    level: 3,
    name: 'Piso 3 · Galerías y auditorio',
    plan: 'maps/04_MAMM_Planta_Tercer_Nivel.jpg',
    scale: 2.0,
    origin: [150, 120],
    size: [1000, 720],
    outside: '#26324a',
    areas: [
      { mat: 'gallery', rect: [232, 155, 300, 145] },
      { mat: 'gallery', rect: [530, 168, 44, 18] },
      { mat: 'gallery', poly: [[572, 138], [745, 152], [738, 340], [560, 325]] },
      { mat: 'bath', poly: [[575, 142], [640, 146], [640, 186], [574, 184]] },
      { mat: 'terrace', poly: [[265, 300], [500, 300], [495, 330], [285, 368]] },
      { mat: 'terrace', rect: [490, 318, 45, 105] },
      { mat: 'terrace', rect: [300, 420, 235, 75] },
      { mat: 'terrace', poly: [[168, 410], [245, 420], [300, 425], [300, 820], [260, 820], [170, 805]] },
      { mat: 'gallery', rect: [676, 330, 26, 170] },
      { mat: 'wood', rect: [300, 495, 300, 210] },
      { mat: 'office', rect: [600, 495, 120, 210] }
    ],
    decor: [
      { mat: 'roof', rect: [745, 135, 520, 715], label: 'Cubierta · Nave de Talleres Robledo' }
    ],
    walls: [
      [[640, 146], [640, 162]],
      [[640, 176], [640, 186], [612, 186]],
      [[590, 186], [574, 186]],
      [[300, 495], [380, 495]],
      [[412, 495], [540, 495]],
      [[566, 495], [676, 495]],
      [[702, 495], [720, 495]],
      [[600, 495], [600, 540]],
      [[600, 568], [600, 640]],
      [[600, 668], [600, 705]],
      [[600, 620], [650, 620]],
      [[680, 620], [720, 620]]
    ],
    props: [
      ...[170, 200, 230, 262, 292].map(y => ({ type: 'column', x: 435, y, r: 11 })),
      { type: 'panel', rect: [300, 190, 8, 70] },
      { type: 'panel', rect: [360, 240, 50, 8] },
      { type: 'sculpture', x: 490, y: 230, r: 14, color: '#ff6b6b' },
      { type: 'painting', x1: 240, y1: 158, x2: 420, y2: 158, color: '#4ecdc4' },
      { type: 'painting', x1: 235, y1: 170, x2: 235, y2: 290, color: '#ffe66d' },
      { type: 'bench', rect: [330, 280, 50, 10] },
      { type: 'block', rect: [578, 290, 45, 30], color: '#7a7a7a', label: 'ASC' },
      { type: 'block', rect: [660, 160, 70, 25], color: '#cfd8dc' },
      { type: 'plant', x: 725, y: 320, r: 10 },
      { type: 'plant', x: 280, y: 330, r: 10 },
      { type: 'steps', rect: [390, 425, 140, 60] },
      { type: 'plant', x: 200, y: 450, r: 12 },
      { type: 'plant', x: 270, y: 800, r: 12 },
      { type: 'bench', rect: [200, 600, 12, 60] },
      { type: 'stage', poly: [[305, 505], [380, 505], [410, 560], [420, 610], [410, 660], [380, 700], [305, 700]] },
      ...Array.from({ length: 8 }, (_, i) => ({ type: 'seats', rect: [440 + i * 19, 510, 6, 80] })),
      ...Array.from({ length: 8 }, (_, i) => ({ type: 'seats', rect: [440 + i * 19, 610, 6, 80] })),
      { type: 'block', rect: [660, 640, 45, 40], color: '#5f6c7b', label: 'PROY' },
      { type: 'desk', rect: [620, 520, 50, 16] }
    ],
    stairs: [
      { id: 'core_down', rect: [632, 232, 28, 55], to: 'p2', target: 'core_up', dir: 'down' },
      { id: 'core_up', rect: [662, 232, 28, 55], to: 'p4', target: 'core_down', dir: 'up' },
      { id: 'ext_down', rect: [496, 345, 34, 50], to: 'p2', target: 'terr_up', dir: 'down' },
      { id: 'aud_down', rect: [302, 462, 70, 26], to: 'p2', target: 'aud_up', dir: 'down' },
      { id: 'corr_up', rect: [678, 385, 22, 60], to: 'p4', target: 'cen_down', dir: 'up' }
    ],
    hides: [
      [250, 285], [515, 170], [720, 175], [600, 170], [320, 690], [585, 690],
      [200, 780], [700, 690], [520, 470], [290, 355], [700, 300]
    ]
  },

  // ───────────────────────────── PISO 4 ─────────────────────────────
  {
    id: 'p4',
    level: 4,
    name: 'Piso 4 · Salas de exposición',
    plan: 'maps/05_MAMM_Planta_Cuarto_Nivel.jpg',
    scale: 1.8,
    origin: [400, 60],
    size: [640, 760],
    outside: '#26324a',
    areas: [
      { mat: 'gallery', poly: [[430, 190], [628, 163], [690, 615], [500, 640]] },
      { mat: 'lobby', poly: [[630, 195], [775, 180], [775, 640], [693, 640], [690, 615]] },
      { mat: 'gallery', rect: [775, 87, 205, 553] },
      { mat: 'terrace', rect: [500, 640, 480, 155] }
    ],
    decor: [
      { mat: 'roof', rect: [1040, 95, 345, 840], label: 'Cubierta' }
    ],
    walls: [
      [[630, 180], [647, 305]],
      [[655, 365], [681, 550]],
      [[688, 590], [692, 618]],
      [[775, 87], [775, 320]],
      [[775, 362], [775, 540]],
      [[775, 600], [775, 640]],
      [[500, 640], [510, 640]],
      [[775, 640], [850, 640]],
      [[890, 640], [980, 640]],
      [[905, 210], [900, 210], [900, 330]],
      [[905, 338], [975, 338]],
      [[815, 240], [870, 240]]
    ],
    props: [
      { type: 'block', rect: [835, 288, 60, 32], color: '#7a7a7a', label: 'ASC' },
      { type: 'panel', rect: [478, 240, 8, 90] },
      { type: 'panel', rect: [500, 420, 8, 110] },
      { type: 'panel', rect: [560, 300, 50, 8] },
      { type: 'column', x: 460, y: 297, r: 7 },
      { type: 'column', x: 622, y: 294, r: 7 },
      { type: 'column', x: 503, y: 548, r: 7 },
      { type: 'column', x: 667, y: 540, r: 7 },
      { type: 'sculpture', x: 580, y: 420, r: 18, color: '#9b5de5' },
      { type: 'sculpture', x: 540, y: 220, r: 12, color: '#f15bb5' },
      { type: 'painting', x1: 437, y1: 205, x2: 480, y2: 520, color: '#00bbf9' },
      { type: 'panel', rect: [955, 370, 8, 70] },
      { type: 'panel', rect: [955, 470, 8, 70] },
      { type: 'panel', rect: [820, 450, 70, 8] },
      { type: 'sculpture', x: 870, y: 560, r: 18, color: '#fee440' },
      { type: 'sculpture', x: 830, y: 140, r: 14, color: '#00f5d4' },
      { type: 'painting', x1: 790, y1: 90, x2: 960, y2: 90, color: '#f15bb5' },
      { type: 'bench', rect: [860, 390, 50, 12] },
      { type: 'steps', rect: [700, 300, 70, 245] },
      { type: 'plant', x: 520, y: 700, r: 14 },
      { type: 'plant', x: 960, y: 780, r: 14 },
      { type: 'plant', x: 700, y: 780, r: 14 },
      { type: 'bench', rect: [600, 720, 60, 12] },
      { type: 'bench', rect: [820, 700, 60, 12] }
    ],
    stairs: [
      { id: 'core_down', rect: [906, 212, 32, 58], to: 'p3', target: 'core_up', dir: 'down' },
      { id: 'core_up', rect: [940, 212, 32, 58], to: 'p5', target: 'core_down', dir: 'up' },
      { id: 'cen_down', rect: [688, 440, 30, 90], to: 'p3', target: 'corr_up', dir: 'down' },
      { id: 'cen_up', rect: [735, 330, 32, 90], to: 'p5', target: 'int_down', dir: 'up' }
    ],
    hides: [
      [450, 215], [520, 620], [650, 230], [960, 620], [790, 620], [960, 105],
      [520, 780], [960, 700], [730, 600], [620, 560]
    ]
  },

  // ───────────────────────────── PISO 5 ─────────────────────────────
  {
    id: 'p5',
    level: 5,
    name: 'Piso 5 · Terrazas y mirador',
    plan: 'maps/06_MAMM_Planta_Quinto_Nivel.jpg',
    scale: 2.0,
    origin: [250, 60],
    size: [600, 560],
    outside: '#2d3e5e',
    areas: [
      { mat: 'terrace', poly: [[275, 172], [440, 150], [450, 185], [617, 158], [345, 480], [330, 555]] },
      { mat: 'terrace', poly: [[727, 320], [748, 320], [748, 550], [531, 550]] },
      { mat: 'gallery', poly: [[668, 97], [808, 225], [488, 600], [345, 480]] },
      { mat: 'bath', poly: [[668, 100], [745, 165], [700, 215], [610, 212], [600, 170]] }
    ],
    decor: [
      { mat: 'roof', rect: [810, 80, 570, 780], label: 'Cubierta' }
    ],
    walls: [
      [[617, 158], [514, 280]],
      [[472, 330], [345, 480]],
      [[727, 320], [701, 350]],
      [[642, 420], [531, 550]],
      [[600, 215], [650, 215]],
      [[680, 215], [700, 215]],
      [[600, 170], [610, 212]]
    ],
    props: [
      { type: 'block', rect: [625, 245, 58, 38], color: '#7a7a7a', label: 'ASC' },
      { type: 'sculpture', x: 560, y: 420, r: 18, color: '#ef476f' },
      { type: 'sculpture', x: 470, y: 470, r: 12, color: '#06d6a0' },
      { type: 'panel', rect: [600, 330, 60, 8] },
      { type: 'painting', x1: 350, y1: 482, x2: 485, y2: 596, color: '#118ab2' },
      { type: 'bench', rect: [520, 520, 40, 12] },
      { type: 'plant', x: 300, y: 190, r: 14 },
      { type: 'plant', x: 420, y: 170, r: 14 },
      { type: 'plant', x: 340, y: 520, r: 12 },
      { type: 'plant', x: 380, y: 300, r: 16 },
      { type: 'plant', x: 735, y: 540, r: 10 },
      { type: 'bench', rect: [310, 380, 12, 50] }
    ],
    stairs: [
      { id: 'core_down', rect: [690, 190, 50, 50], to: 'p4', target: 'core_up', dir: 'down' },
      { id: 'int_down', rect: [510, 300, 40, 52], to: 'p4', target: 'cen_up', dir: 'down' }
    ],
    hides: [
      [295, 215], [480, 580], [720, 540], [640, 130], [560, 450], [340, 470], [600, 540]
    ]
  }
];
