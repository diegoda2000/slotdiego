/* Mete una maqueta de herramientas/ en UN SOLO archivo, con las imágenes y las fuentes
   dentro, para poder pasársela al dueño y que la abra y la toque él.

   Hace falta porque una maqueta suelta tira de archivos hermanos por ruta relativa y,
   fuera del repositorio, esas rutas no existen. Las imágenes gordas -el sobre y los dos
   marcos- se bajan a 760 px y pasan a WebP; lo demás va tal cual.

   Uso:  node herramientas/empaquetar-maqueta.mjs maqueta-sobre.html [salida.html]
*/
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ENTRADA = process.argv[2] || 'maqueta-sobre.html';
const SALIDA = process.argv[3] || path.join('/tmp', ENTRADA.replace('maqueta-', ''));
const ANCHO_MAX = 760, CALIDAD = 0.88;

const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const nav = await chromium.launch(fs.existsSync(exe) ? { executablePath: exe } : {});
const pag = await nav.newPage();

const bajar = (b64, tipo) => pag.evaluate(({ b64, tipo, ANCHO_MAX, CALIDAD }) =>
  new Promise(res => {
    const i = new Image();
    i.onload = () => {
      const k = Math.min(1, ANCHO_MAX / i.naturalWidth);
      const c = document.createElement('canvas');
      c.width = Math.round(i.naturalWidth * k);
      c.height = Math.round(i.naturalHeight * k);
      c.getContext('2d').drawImage(i, 0, 0, c.width, c.height);
      res(c.toDataURL('image/webp', CALIDAD));
    };
    i.src = `data:image/${tipo};base64,` + b64;
  }), { b64, tipo, ANCHO_MAX, CALIDAD });

const leer = f => fs.readFileSync(f).toString('base64');
const mime = f => f.endsWith('.webp') ? 'image/webp'
               : f.endsWith('.woff2') ? 'font/woff2' : 'image/png';

let html = fs.readFileSync(path.join('herramientas', ENTRADA), 'utf8');

/* Primero lo que aparece escrito tal cual: url(...) y src="...". */
for (const r of new Set([...html.matchAll(/\.\.\/[\w./-]+\.(?:png|webp|woff2)/g)].map(m => m[0]))) {
  const f = r.replace('../', '');
  if (!fs.existsSync(f)) { console.log('  falta', f); continue; }
  const d = /sobres-v2|comun-(frente|reverso)/.test(f)
    ? await bajar(leer(f), 'png')
    : `data:${mime(f)};base64,` + leer(f);
  html = html.split(r).join(d);
}

/* Y luego lo que el JS pide con una plantilla, que como texto no vale: se meten en dos
   mapas y la plantilla pasa a consultarlos. */
const mapa = (lista, ruta) => Object.fromEntries(lista
  .map(k => [k, ruta(k)]).filter(([, f]) => fs.existsSync(f))
  .map(([k, f]) => [k, `data:image/webp;base64,` + leer(f)]));

const personas = [...html.matchAll(/\{p:'([^']+)'/g)].map(m => m[1]);
const banderas = [...html.matchAll(/b:'([^']+)'/g)].map(m => m[1]);
if (personas.length) {
  const FOTO = mapa(personas, k => `juego/fotos/${k}.webp`);
  const BAND = mapa(banderas, k => `juego/banderas/${k}.webp`);
  html = html.replace('const ET = ',
    `const FOTO = ${JSON.stringify(FOTO)};\nconst BAND = ${JSON.stringify(BAND)};\nconst ET = `);
  html = html.split('../juego/fotos/${c.p}.webp').join('${FOTO[c.p]}');
  html = html.split('../juego/banderas/${c.b}.webp').join('${BAND[c.b]}');
}

await nav.close();
fs.writeFileSync(SALIDA, html);
const sueltas = (html.match(/\.\.\//g) || []).length;
console.log(`${SALIDA}  ${Math.round(fs.statSync(SALIDA).size / 1024)} kB`);
console.log(sueltas ? `  OJO: quedan ${sueltas} rutas relativas sin meter` : '  va solo');
