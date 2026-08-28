/* Deja la foto de la jaula lista para usarla de fondo de pantalla: la recorta a vertical,
   la apaga y la guarda en juego/arte/fondo.webp.

   LA FOTO VA COMO ESTÁ. Aquí solo se recorta a 9:19,5 —la proporción de un móvil de hoy—
   y se baja de tamaño. Ni se apaga ni se destiñe: el dueño la quiere tal cual, sin el
   velo rojo que llevaba el fondo antes. Se intentó teñirla hacia la paleta y quitarle el
   azul de la grada, y lo tumbó; no vuelvas a hacerlo sin que te lo pida.

   EL RECORTE SE QUEDA POR ENCIMA DEL SUELO. La foto tiene la lona blanca del octágono en
   la quinta parte de abajo, y ahí la pantalla se volvía blanca justo donde está la barra de
   pestañas. El corte va en el 79,5% del alto: medida la claridad media de cada fila, salta
   de 34 a 113 sobre 255 entre la 1050 y la 1075 de 1333, que es el filo de la lona.

   Eso deja una tira de 489x1060 del original, así que el fondo sale ampliado 1,66x en vez
   de 1,32x. Se nota poco —la foto es de enfoque corto y solo la malla está nítida— y es el
   precio de no tener suelo: la parte útil da 1,89 de proporción y hace falta 0,46.

   Uso:  node herramientas/preparar-fondo.mjs [ancho] [calidad]
         (por defecto 810 px de ancho y 0,72 de calidad)
*/
import { chromium } from 'playwright';
import fs from 'fs';

const ORIGEN = 'originales/fondo/jaula.jpg';
const DESTINO = 'juego/arte/fondo.webp';
const ANCHO = Number(process.argv[2]) || 810;
const CALIDAD = Number(process.argv[3]) || 0.72;
const PROPORCION = 9 / 19.5;          // el móvil de hoy, más alto que el 16:9 de antes
const SUELO = 0.795;                  // dónde empieza la lona blanca, medido fila a fila

const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const nav = await chromium.launch(fs.existsSync(exe) ? { executablePath: exe } : {});
const pag = await nav.newPage();

const preparar = ({ b64, ANCHO, PROPORCION, CALIDAD, SUELO }) => new Promise(res => {
  const img = new Image();
  img.onerror = () => res(null);
  img.onload = () => {
    const W = img.naturalWidth, H = img.naturalHeight;
    // Primero se tira la lona, y del trozo que queda se saca el vertical: se pega arriba y
    // se quita ancho a los dos lados por igual, para que siga centrado.
    const util = Math.round(H * SUELO);
    let sw = W, sh = util, sx = 0, sy = 0;
    if (W / util > PROPORCION) { sw = Math.round(util * PROPORCION); sx = Math.round((W - sw) / 2); }
    else { sh = Math.round(W / PROPORCION); }

    const c = document.createElement('canvas');
    c.width = ANCHO; c.height = Math.round(ANCHO / PROPORCION);
    const g = c.getContext('2d');
    g.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);

    res({ d: c.toDataURL('image/webp', CALIDAD), W, H, sw, sh, w: c.width, h: c.height });
  };
  img.src = 'data:image/jpeg;base64,' + b64;
});

const out = await pag.evaluate(preparar,
  { b64: fs.readFileSync(ORIGEN).toString('base64'), ANCHO, PROPORCION, CALIDAD, SUELO });
await nav.close();
if (!out) { console.log('el fondo sale vacío'); process.exit(1); }

fs.writeFileSync(DESTINO, Buffer.from(out.d.split(',')[1], 'base64'));
console.log(`${ORIGEN}  ${out.W}x${out.H}`);
console.log(`  recortado a ${out.sw}x${out.sh}  (sin la lona, ${Math.round(SUELO * 100)}% de arriba)`);
console.log(`  ${DESTINO}  ${out.w}x${out.h}  ${Math.round(fs.statSync(DESTINO).size / 1024)} kB`);
