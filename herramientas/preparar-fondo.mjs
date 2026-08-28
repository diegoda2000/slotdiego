/* Deja la foto de la jaula lista para usarla de fondo de pantalla: la recorta a vertical,
   la apaga y la guarda en juego/arte/fondo.webp.

   POR QUÉ HAY QUE TOCARLA. La foto que pasó el dueño es apaisada, tiene la luz azul de la
   grada al fondo y el suelo blanco abajo. Puesta tal cual, detrás de texto blanco y de
   peleadores recortados, se los come: un fondo con vida propia no es un fondo. Así que
   aquí se hacen tres cosas, y las tres a la baja:

   1. Se recorta a 9:19,5, que es la proporción de un móvil de hoy. La malla es uniforme,
      así que da igual por dónde se corte; se coge la parte de arriba, que es la que tiene
      menos suelo blanco.
   2. Se le quita el 80% del color. El azul de la grada pelea con la paleta del juego, que
      es negro, rojo y oro, y dos temperaturas a la vez se ven sucias.
   3. Se baja al 62% de luz y se calienta un poco -más rojo, menos azul-, para que caiga
      del lado del negro cálido del juego y no del negro azulado de la foto.

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

const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const nav = await chromium.launch(fs.existsSync(exe) ? { executablePath: exe } : {});
const pag = await nav.newPage();

const preparar = ({ b64, ANCHO, PROPORCION, CALIDAD }) => new Promise(res => {
  const img = new Image();
  img.onerror = () => res(null);
  img.onload = () => {
    const W = img.naturalWidth, H = img.naturalHeight;
    // Recorte vertical: sobra ancho, así que se quita a los dos lados por igual, y se
    // coge de arriba, que es donde hay menos suelo blanco.
    let sw = W, sh = H, sx = 0, sy = 0;
    if (W / H > PROPORCION) { sw = Math.round(H * PROPORCION); sx = Math.round((W - sw) / 2); }
    else { sh = Math.round(W / PROPORCION); sy = 0; }

    const c = document.createElement('canvas');
    c.width = ANCHO; c.height = Math.round(ANCHO / PROPORCION);
    const g = c.getContext('2d');
    g.drawImage(img, sx, sy, sw, sh, 0, 0, c.width, c.height);

    const d = g.getImageData(0, 0, c.width, c.height), p = d.data;
    const GRIS = 0.80, LUZ = 0.62;
    for (let i = 0; i < p.length; i += 4) {
      const l = 0.2126 * p[i] + 0.7152 * p[i + 1] + 0.0722 * p[i + 2];
      p[i]     = Math.min(255, (l * GRIS + p[i]     * (1 - GRIS)) * LUZ * 1.12);
      p[i + 1] = Math.min(255, (l * GRIS + p[i + 1] * (1 - GRIS)) * LUZ * 0.94);
      p[i + 2] = Math.min(255, (l * GRIS + p[i + 2] * (1 - GRIS)) * LUZ * 0.86);
    }
    g.putImageData(d, 0, 0);
    res({ d: c.toDataURL('image/webp', CALIDAD), W, H, w: c.width, h: c.height });
  };
  img.src = 'data:image/jpeg;base64,' + b64;
});

const out = await pag.evaluate(preparar,
  { b64: fs.readFileSync(ORIGEN).toString('base64'), ANCHO, PROPORCION, CALIDAD });
await nav.close();
if (!out) { console.log('el fondo sale vacío'); process.exit(1); }

fs.writeFileSync(DESTINO, Buffer.from(out.d.split(',')[1], 'base64'));
console.log(`${ORIGEN}  ${out.W}x${out.H}`);
console.log(`  ${DESTINO}  ${out.w}x${out.h}  ${Math.round(fs.statSync(DESTINO).size / 1024)} kB`);
