# Bella busca a Tina 🐱🔍

Juego de escondidas en el **Museo de Arte Moderno de Medellín (MAMM)**. Bella tiene que encontrar a Tina,
la gata siamés, recorriendo las 5 plantas del museo antes de que se acabe el tiempo (5 minutos).

Hecho con **Phaser 3** (incluido en `js/lib`, no necesita internet ni instalación).

## Cómo jugar
- **Computador:** flechas del teclado o WASD. Enter para empezar.
- **Celular:** cruceta virtual en pantalla (se puede deslizar el dedo, admite diagonales).
- Las escaleras **▲ amarillas suben** y las **▼ azules bajan** de piso.
- Tina maúlla cada pocos segundos: la pista dice si está cerca, lejos, arriba o abajo, y una flecha indica la dirección aproximada.
- Ganas cuando Bella llega hasta Tina; pierdes si se acaba el tiempo.

## Ejecutar
| Forma | Cómo |
|---|---|
| Local sin servidor | Doble clic en `index.html` |
| Servidor local / celular en la misma Wi‑Fi | `npm start` → http://localhost:8080 (la consola muestra la IP para el celular) |
| Visual Studio 2022 | Abrir `JuegoTina.sln` y presionar F5 (ejecuta `npm start`) |
| Servidor web | Subir `index.html`, `css/`, `js/` y `maps/` a cualquier hosting estático |

## Modificar
| Qué | Dónde |
|---|---|
| Tiempo, velocidad, visión, frecuencia de maullidos | `js/config.js` |
| Plantas: muros, salas, objetos, escaleras, escondites | `js/data/floors.js` (coordenadas en píxeles de los planos de `maps/`) |
| Apariencia de Bella y Tina | `js/sprites.js` |
| Lógica del juego | `js/scenes/GameScene.js` |
| Sonidos (sintetizados) | `js/audio.js` |

**Herramientas de edición** (con `npm start`): tecla **P** pone el plano original encima del mapa y muestra las
coordenadas del cursor en píxeles del plano; tecla **G** muestra la grilla de colisión (verde = caminable).

`server.js` solo publica `index.html`, `css`, `js` y `maps`. Las fotos de `Bella/` y `Tina/` se usaron como
referencia y **no** se publican.
