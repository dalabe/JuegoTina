/*
 * Servidor estático mínimo (sin dependencias) para jugar en la red local o en un servidor.
 *   node server.js            -> http://localhost:8080
 *   PORT=3000 node server.js  -> otro puerto
 * Muestra también la IP local para abrir el juego desde el celular en la misma red Wi-Fi.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8080;
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.mp3': 'audio/mpeg', '.wav': 'audio/wav'
};
// Solo se publican los archivos del juego (no las fotos personales de /Bella y /Tina)
const PUBLIC = ['index.html', 'css', 'js', 'maps'];

http.createServer((req, res) => {
  let url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/') url = '/index.html';
  const file = path.normalize(path.join(ROOT, url));
  const rel = path.relative(ROOT, file);
  const top = rel.split(path.sep)[0];
  if (rel.startsWith('..') || !PUBLIC.includes(top)) { res.writeHead(404); return res.end('No encontrado'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('No encontrado'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
}).listen(PORT, () => {
  console.log(`\n  Bella busca a Tina  ->  http://localhost:${PORT}`);
  Object.values(os.networkInterfaces()).flat()
    .filter(i => i && i.family === 'IPv4' && !i.internal)
    .forEach(i => console.log(`  Desde el celular    ->  http://${i.address}:${PORT}`));
  console.log('');
});
