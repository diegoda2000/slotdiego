/* Baja las fotos de los peleadores de ufcespanol.com y las deja listas en juego/fotos/.

   ┌───────────────────────────────────────────────────────────────────────────┐
   │ ESTO HAY QUE EJECUTARLO EN UNA MÁQUINA CON INTERNET NORMAL.               │
   │ La sesión de Claude sale por un proxy con lista blanca que deniega        │
   │ ufc.com, ufcespanol.com, espn.com y casi todo lo demás con un 403, así    │
   │ que desde ahí no se puede bajar nada.                                     │
   └───────────────────────────────────────────────────────────────────────────┘

   Uso:
     node herramientas/importar-fotos.mjs --ver tom-aspinall   mira qué foto usaría, sin bajarla
     node herramientas/importar-fotos.mjs tom-aspinall ciryl-gane   solo esos dos
     node herramientas/importar-fotos.mjs                       los 355

   PRIMERO --ver CON UNO. La página puede haber cambiado de maqueta desde que se
   escribió esto; con --ver se ve en dos segundos qué imagen encuentra y de qué tamaño,
   sin gastar 355 descargas para descubrir que coge la que no era.

   QUÉ HACE CON CADA IMAGEN, y por qué:

   1. Recorta el aire transparente de alrededor. Las de la UFC vienen con el peleador
      recortado pero con margen, y ese margen es justo lo que no puede haber: el juego
      apoya la imagen en el suelo de su hueco, así que un dedo de nada al pie deja al
      peleador flotando por encima del cartel del nombre.
   2. La ajusta a la proporción del hueco de la carta (0,6529 = 391,8 / 600,1 px del
      dibujo). Si el peleador sale de cuerpo entero, corta por abajo y se queda con la
      mitad de arriba: en la carta se ve de cintura para arriba, que es como se ve en
      las de la UFC. Si sale más corto, rellena por ARRIBA, nunca por abajo.
   3. La deja a 360 px de ancho en WebP con transparencia.

   El recorte y el redimensionado se hacen con el Chromium de Playwright, que ya es
   dependencia de este repositorio por medir-carta.mjs. Las imágenes van al navegador
   en base64 y no por su URL: dibujar en un lienzo una imagen de otro dominio lo
   envenena y toDataURL revienta.

   Al terminar reescribe juego/fotos.js y deja en /tmp/fotos-sin-encontrar.txt los que no
   ha sabido resolver, para buscarlos a mano.
*/
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE   = process.env.UFC_BASE || 'https://www.ufcespanol.com';
const DIR    = 'juego/fotos';
/* 360 px de ancho y calidad 0,75. La carta más grande que pinta el juego ronda los 400 px,
   y ahí la ventana de la foto mide 220: con 360 va sobrada. A 420 y calidad 0,86 —como
   empezó— salían de 57 KB, y 355 de esas son 20 MB dentro del APK. Así se quedan en 36 KB
   y el total en 12,6 MB. */
const ANCHO  = 360;
const CALIDAD = 0.75;
const PROPORCION = 0.6529;          // el hueco del marco: 391,8 / 600,1
const AGENTE = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
             + '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const args = process.argv.slice(2);
const soloVer = args.includes('--ver');
const probar  = args.includes('--probar');   // pasa un archivo local por el recorte
const lote    = args.includes('--lote');     // pasa una carpeta entera, sin red
const pedidos = args.filter(a => !a.startsWith('--'));

/* El Chromium que trae el contenedor no está donde lo busca Playwright, igual que en
   medir-carta.mjs. Si existe el del contenedor se usa ese; si no, el que Playwright
   tenga instalado, que es lo que pasará en una máquina normal. */
const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const arranque = fs.existsSync(exe) ? { executablePath: exe } : {};

/* Modo lote: coge una carpeta de imágenes ya descargadas y las pasa todas por el recorte
   en UNA sola sesión de navegador. Con --probar se abre y se cierra un Chromium por
   imagen, que para dos son dos segundos y para doscientas son siete minutos de arrancar
   y apagar. El nombre de salida es el mismo de entrada con extensión .webp, así que la
   carpeta de origen tiene que venir ya nombrada por el slug del peleador.

     node herramientas/importar-fotos.mjs --lote <carpeta-origen> <carpeta-destino>
*/
if (lote) {
  const [orig, dest] = pedidos;
  if (!orig || !dest) { console.log('uso: --lote <origen> <destino>'); process.exit(1); }
  fs.mkdirSync(dest, { recursive: true });
  const navL = await chromium.launch(arranque);
  const pg = await navL.newPage();
  const fichas = fs.readdirSync(orig).filter(f => /\.(webp|png|avif|jpe?g)$/i.test(f));
  let ok = 0; const malas = [];
  for (const f of fichas) {
    const b64 = fs.readFileSync(path.join(orig, f)).toString('base64');
    const tipo = { webp:'image/webp', avif:'image/avif', jpg:'image/jpeg', jpeg:'image/jpeg' }
                 [(f.split('.').pop()||'').toLowerCase()] || 'image/png';
    const out = await pg.evaluate(prepararImagen, { b64, tipo, ANCHO, PROPORCION, CALIDAD });
    if (!out) { malas.push(f); continue; }
    const nombre = f.replace(/\.(webp|png|avif|jpe?g)$/i, '') + '.webp';
    fs.writeFileSync(path.join(dest, nombre), Buffer.from(out.split(',')[1], 'base64'));
    ok++;
  }
  await navL.close();
  console.log(`${ok} recortadas de ${fichas.length}`);
  if (malas.length) console.log('sin recortar (vacías o sin transparencia):\n  ' + malas.join('\n  '));
  process.exit(0);
}

/* Modo prueba: coge una imagen del disco, la pasa por el mismo recorte que las
   descargadas y la escribe al lado con el sufijo -recortada. Sirve para comprobar el
   encuadre sin gastar una descarga, y sin red. */
if (probar) {
  const orig = pedidos[0];
  if (!orig) { console.log('uso: node herramientas/importar-fotos.mjs --probar <archivo>'); process.exit(1); }
  const nav0 = await chromium.launch(arranque);
  const pg = await nav0.newPage();
  const b64 = fs.readFileSync(orig).toString('base64');
  const tipo = { webp:'image/webp', avif:'image/avif', jpg:'image/jpeg', jpeg:'image/jpeg' }
               [(orig.split('.').pop()||'').toLowerCase()] || 'image/png';
  const out = await pg.evaluate(prepararImagen, { b64, tipo, ANCHO, PROPORCION, CALIDAD });
  await nav0.close();
  if (!out) { console.log('la imagen sale vacía'); process.exit(1); }
  const destino = orig.replace(/\.(png|webp|avif|jpg|jpeg)$/i, '') + '-recortada.webp';
  fs.writeFileSync(destino, Buffer.from(out.split(',')[1], 'base64'));
  console.log('escrita', destino);
  process.exit(0);
}

const roster = fs.readFileSync('juego/roster.js', 'utf8');
const NOMBRE = {};
for (const m of roster.matchAll(/"persona":"([^"]+)","nombre":"([^"]+)"/g)) NOMBRE[m[1]] = m[2];
/* Por defecto solo se baja lo que falta. Repetir las 197 que ya están es media hora de
   descargas para acabar con los mismos archivos, y en un runner de GitHub eso es media
   hora de minutos gastados. Con --rehacer se bajan todas otra vez. */
const rehacer = args.includes('--rehacer');
const todas = pedidos.length ? pedidos : Object.keys(NOMBRE).sort();
const personas = rehacer ? todas
  : todas.filter(p => !fs.existsSync(path.join(DIR, p + '.webp')));
if (!rehacer && !soloVer)
  console.log(`${todas.length - personas.length} ya están; se bajan ${personas.length}.`);

fs.mkdirSync(DIR, { recursive: true });
const nav = await chromium.launch(arranque);
const pag = await nav.newPage({ userAgent: AGENTE });
const obrador = await nav.newPage();          // página en blanco, solo para el lienzo

const fallos = [];
let hechas = 0;

for (const persona of personas) {
  try {
    const url = await buscarFoto(persona);
    if (!url) { fallos.push(`${persona}\t(no encuentro la foto en la ficha)`); seguir(persona, 'sin foto en la ficha'); continue; }
    if (soloVer) { console.log(`${persona}\n  ficha: ${BASE}/athlete/${persona}\n  foto : ${url}`); continue; }

    const resp = await fetch(url, { headers: { 'User-Agent': AGENTE, Referer: `${BASE}/athlete/${persona}` } });
    if (!resp.ok) { fallos.push(`${persona}\t(la imagen da ${resp.status})`); seguir(persona, `imagen ${resp.status}`); continue; }
    const b64 = Buffer.from(await resp.arrayBuffer()).toString('base64');
    const tipo = (resp.headers.get('content-type') || 'image/png').split(';')[0];

    const dataUrl = await obrador.evaluate(prepararImagen, { b64, tipo, ANCHO, PROPORCION, CALIDAD });
    if (!dataUrl) { fallos.push(`${persona}\t(la imagen sale vacía o sin transparencia)`); seguir(persona, 'imagen vacía'); continue; }

    fs.writeFileSync(path.join(DIR, persona + '.webp'), Buffer.from(dataUrl.split(',')[1], 'base64'));
    hechas++;
    console.log(`  ✓ ${persona}`);
  } catch (e) {
    fallos.push(`${persona}\t(${e.message})`);
    seguir(persona, e.message);
  }
}
await nav.close();

if (!soloVer) {
  console.log(`\n${hechas} fotos guardadas de ${personas.length} intentos.`);
  if (fallos.length) {
    fs.writeFileSync('/tmp/fotos-sin-encontrar.txt', fallos.join('\n') + '\n');
    console.log(`${fallos.length} sin resolver, en /tmp/fotos-sin-encontrar.txt`);
  }
  console.log('\nAhora:  node herramientas/generar-fotos.mjs');
}

function seguir(persona, motivo) { console.log(`  ✗ ${persona} — ${motivo}`); }

/* Abre la ficha del peleador y saca la URL de la foto de cuerpo entero recortada.

   Se mira el DOM ya montado y no el HTML crudo porque la ficha carga parte de la
   maqueta con JavaScript. Se prefieren, por este orden, los estilos de imagen que la
   UFC usa para el cuerpo entero sobre fondo transparente; si no hay ninguno, se coge la
   imagen más grande de la ficha que no sea un logotipo ni una bandera. */
async function buscarFoto(persona) {
  const resp = await pag.goto(`${BASE}/athlete/${persona}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    .catch(() => null);
  if (!resp || !resp.ok()) return null;
  await pag.waitForTimeout(400);
  return pag.evaluate(() => {
    const PREFERIDOS = ['athlete_bio_full_body', 'athlete_full_body', 'full_body', 'upper_body'];
    const urls = [...document.images]
      .map(i => i.currentSrc || i.src)
      .filter(u => u && /^https?:/.test(u) && !/logo|flag|bandera|sponsor|icon/i.test(u));
    for (const clave of PREFERIDOS) {
      const u = urls.find(x => x.includes(clave));
      if (u) return u;
    }
    // Último recurso: la imagen más alta de la página, que en una ficha es el peleador.
    const grande = [...document.images]
      .filter(i => (i.currentSrc || i.src) && !/logo|flag|sponsor|icon/i.test(i.currentSrc || i.src))
      .sort((a, b) => b.naturalHeight - a.naturalHeight)[0];
    return grande && grande.naturalHeight > 300 ? (grande.currentSrc || grande.src) : null;
  });
}

/* Recorta, encuadra y comprime. Va entero dentro del navegador. */
function prepararImagen({ b64, tipo, ANCHO, PROPORCION, CALIDAD }) {
  return new Promise(resolve => {
    const img = new Image();
    img.onerror = () => resolve(null);
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = img.naturalWidth; c.height = img.naturalHeight;
      const g = c.getContext('2d');
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;

      // Caja de lo que no es transparente. Umbral 12 y no 0: los bordes suavizados de un
      // recorte dejan un halo casi invisible que, contado como tinta, no recorta nada.
      let x0 = c.width, y0 = c.height, x1 = -1, y1 = -1;
      for (let y = 0; y < c.height; y++)
        for (let x = 0; x < c.width; x++)
          if (d[(y * c.width + x) * 4 + 3] > 12) {
            if (x < x0) x0 = x; if (x > x1) x1 = x;
            if (y < y0) y0 = y; if (y > y1) y1 = y;
          }
      if (x1 < 0) return resolve(null);          // toda transparente

      const an = x1 - x0 + 1;
      const alt = Math.round(an / PROPORCION);   // el alto que pide el hueco de la carta
      const sal = document.createElement('canvas');
      sal.width = ANCHO; sal.height = Math.round(ANCHO / PROPORCION);
      const s = sal.getContext('2d');
      const k = ANCHO / an;

      /* Se conserva SIEMPRE la parte de arriba —la cabeza— y se corta o se rellena por
         abajo... no: por abajo nunca se rellena, que es lo que dejaría al peleador
         flotando. Si el cuerpo es más alto que el encuadre, se corta por abajo y el
         corte cae justo en el borde de la imagen. Si es más bajo, se rellena por ARRIBA
         y el cuerpo sigue tocando el borde de abajo. */
      if (y1 - y0 + 1 >= alt) {
        s.drawImage(img, x0, y0, an, alt, 0, 0, ANCHO, sal.height);
      } else {
        const altoCuerpo = y1 - y0 + 1;
        s.drawImage(img, x0, y0, an, altoCuerpo, 0, sal.height - altoCuerpo * k, ANCHO, altoCuerpo * k);
      }
      resolve(sal.toDataURL('image/webp', CALIDAD));
    };
    img.src = `data:${tipo};base64,${b64}`;
  });
}
