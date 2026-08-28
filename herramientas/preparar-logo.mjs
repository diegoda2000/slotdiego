/* Deja el logotipo listo para la cabecera: lo recorta y lo guarda en juego/arte/logo.webp.

   QUÉ HACE. El archivo que pasó el dueño es un cuadrado de 1254x1254 con las cartas en
   medio y mucho margen negro alrededor. Aquí se le quita ese margen —buscando hasta dónde
   llega lo que no es negro— y se deja a la altura a la que se pinta en la cabecera.

   EL NEGRO SE QUEDA, y no es un descuido. Se probó a volverlo transparente deshaciendo la
   premultiplicación (alfa = el canal más alto, color dividido por él), que es lo correcto
   para un resplandor sobre negro. Pero es que aquí el negro no es solo fondo: el cuerpo de
   las cartas TAMBIÉN es negro, así que al hacerlo transparente el marrón de la cabecera se
   colaba por dentro de las cartas y el logotipo salía lavado y rosa. Con mix-blend-mode
   pasa lo mismo por otro camino. El dibujo está hecho sobre negro y sobre negro se queda:
   la cabecera es casi negra y el recorte ajustado deja poco margen a la vista.

   Uso:  node herramientas/preparar-logo.mjs [alto-en-px]
         (por defecto 96 px de alto, que es 3x del tamaño al que se pinta)
*/
import { chromium } from 'playwright';
import fs from 'fs';

const ORIGEN = 'originales/logo/logo.png';
const DESTINO = 'juego/arte/logo.webp';
const ALTO = Number(process.argv[2]) || 96;
const CALIDAD = 0.92;

const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const nav = await chromium.launch(fs.existsSync(exe) ? { executablePath: exe } : {});
const pag = await nav.newPage();

const preparar = ({ b64, ALTO, CALIDAD }) => new Promise(res => {
  const img = new Image();
  img.onerror = () => res(null);
  img.onload = () => {
    const W = img.naturalWidth, H = img.naturalHeight;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const p = g.getImageData(0, 0, W, H).data;

    let minx = W, maxx = -1, miny = H, maxy = -1;
    for (let i = 0; i < p.length; i += 4) {
      // 12 sobre 255: por debajo de ahí es el negro del fondo, no el resplandor.
      if (Math.max(p[i], p[i + 1], p[i + 2]) <= 12) continue;
      const n = i / 4, x = n % W, y = (n / W) | 0;
      if (x < minx) minx = x;
      if (x > maxx) maxx = x;
      if (y < miny) miny = y;
      if (y > maxy) maxy = y;
    }
    if (maxx < 0) return res(null);

    const sw = maxx - minx + 1, sh = maxy - miny + 1;
    const sal = document.createElement('canvas');
    sal.height = ALTO;
    sal.width = Math.max(1, Math.round(ALTO * sw / sh));
    sal.getContext('2d').drawImage(c, minx, miny, sw, sh, 0, 0, sal.width, sal.height);
    res({ d: sal.toDataURL('image/webp', CALIDAD), W, H, sw, sh, w: sal.width, h: sal.height });
  };
  img.src = 'data:image/png;base64,' + b64;
});

const out = await pag.evaluate(preparar,
  { b64: fs.readFileSync(ORIGEN).toString('base64'), ALTO, CALIDAD });
await nav.close();
if (!out) { console.log('el logotipo sale vacío'); process.exit(1); }

fs.writeFileSync(DESTINO, Buffer.from(out.d.split(',')[1], 'base64'));
console.log(`${ORIGEN}  ${out.W}x${out.H}`);
console.log(`  recortado a ${out.sw}x${out.sh} y guardado en ${DESTINO} a ${out.w}x${out.h}` +
  `, ${Math.round(fs.statSync(DESTINO).size / 1024)} kB`);
