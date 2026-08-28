/* Deja listos los peleadores recortados que van en los botones del menú:

     juego/arte/jugar.webp     Conor, para JUGAR
     juego/arte/islam.webp     Islam con los dos cinturones, para Logros

   VAN TAL CUAL Y CON SU TRANSPARENCIA. Aquí solo se les quita el aire de alrededor
   -se busca la caja de lo que no es transparente- y se bajan de tamaño. Ni fondo, ni
   montaje, ni desenfoque: el peleador va suelto sobre el fondo general del juego, que
   se ve a través de la tarjeta porque --tarjeta lleva alfa.

   Se probó a pegar a Conor sobre la foto de arena que llevaba antes el botón, con el
   fondo desenfocado, y lo tumbó. La arena vieja se queda en originales/botones/arena.webp
   y ya no la usa nadie.

   Uso:  node herramientas/preparar-botones.mjs
*/
import { chromium } from 'playwright';
import fs from 'fs';

/* Cada uno a la altura que necesita: la de JUGAR ocupa el alto de un banner y la de
   Logros la mitad de un tile, así que no hacen falta los mismos píxeles. */
const TRABAJOS = [
  { de: 'originales/botones/conor.png', a: 'juego/arte/jugar.webp', alto: 560 },
  { de: 'originales/botones/islam.png', a: 'juego/arte/islam.webp', alto: 520 },
];
const CALIDAD = 0.86;

const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const nav = await chromium.launch(fs.existsSync(exe) ? { executablePath: exe } : {});
const pag = await nav.newPage();

const recortar = ({ b64, ALTO, CALIDAD }) => new Promise(res => {
  const img = new Image();
  img.onerror = () => res(null);
  img.onload = () => {
    const W = img.naturalWidth, H = img.naturalHeight;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const p = g.getImageData(0, 0, W, H).data;

    // La caja de lo que no es transparente: lo que hay que encuadrar es el cuerpo, no
    // el archivo, que trae aire a los lados.
    let minx = W, maxx = -1, miny = H, maxy = -1;
    for (let n = 0; n < W * H; n++) {
      if (p[n * 4 + 3] < 10) continue;
      const x = n % W, y = (n / W) | 0;
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
    sal.getContext('2d').drawImage(img, minx, miny, sw, sh, 0, 0, sal.width, sal.height);
    res({ d: sal.toDataURL('image/webp', CALIDAD), W, H, sw, sh, w: sal.width, h: sal.height });
  };
  img.src = 'data:image/png;base64,' + b64;
});

for (const { de, a, alto } of TRABAJOS) {
  const out = await pag.evaluate(recortar,
    { b64: fs.readFileSync(de).toString('base64'), ALTO: alto, CALIDAD });
  if (!out) { await nav.close(); console.log(de, 'sale vacío'); process.exit(1); }
  fs.writeFileSync(a, Buffer.from(out.d.split(',')[1], 'base64'));
  console.log(`${de}  ${out.W}x${out.H}  →  recorte ${out.sw}x${out.sh}`);
  console.log(`  ${a}  ${out.w}x${out.h}  ${Math.round(fs.statSync(a).size / 1024)} kB`);
}
await nav.close();
