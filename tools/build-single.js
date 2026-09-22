/*
 * Genera un único archivo HTML autocontenido (JS + CSS + motor Phaser en línea)
 * para compartir el juego por WhatsApp, correo, USB, etc.
 *
 *   npm run paquete   ->  dist/BellaBuscaATina.html
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'dist');
const OUT = path.join(OUT_DIR, 'BellaBuscaATina.html');

let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

// Evita que un "</script>" dentro del código cierre la etiqueta antes de tiempo
const safeJs = js => js.replace(/<\/script/gi, '<\\/script').replace(/<!--/g, '<\\!--');

html = html.replace(/<link rel="stylesheet" href="([^"]+)"\s*\/?>/g, (_, href) =>
  `<style>\n${fs.readFileSync(path.join(ROOT, href), 'utf8')}\n</style>`);

html = html.replace(/<script src="([^"]+)"><\/script>/g, (_, src) =>
  `<script>/* ${src} */\n${safeJs(fs.readFileSync(path.join(ROOT, src), 'utf8'))}\n</script>`);

if (/<script src=|<link rel="stylesheet" href=/.test(html)) throw new Error('Quedó un recurso externo sin incrustar');

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(OUT, html);
console.log(`Listo: ${path.relative(ROOT, OUT)} (${(fs.statSync(OUT).size / 1024 / 1024).toFixed(2)} MB)`);
