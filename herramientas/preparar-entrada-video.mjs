/* Monta la imagen que se le da al generador de vídeo como primer fotograma.

   POR QUÉ HACE FALTA. Al darle el PNG del sobre a pelo -1024x1536, o sea 2:3-, el
   generador encuadra por su cuenta: el primer intento salió en 16:9 y con el sobre
   cortado por abajo. Dándole ya un 9:16 con el sobre entero y su aire alrededor, el
   modelo no tiene motivo para reencuadrar nada y el sobre cabe.

   El fondo es el mismo gris neutro que el generador puso por su cuenta la primera vez
   -medido en su primer fotograma: #282828 en los cuatro bordes-, con una caída suave
   hacia las esquinas para que parezca un fondo de estudio y no una pared plana.

   Uso:  node herramientas/preparar-entrada-video.mjs [sobre.png] [salida.png]
*/
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ORIGEN = process.argv[2] || 'originales/sobres-v2/1-basico.png';
const DESTINO = process.argv[3] || 'originales/apertura/entrada-9-16.png';

const ANCHO = 1080, ALTO = 1920;
const ALTO_SOBRE = 0.72;      // el sobre ocupa el 72% del alto: deja aire para la tira
const CENTRO_Y = 0.50;        // y va centrado, un pelo por encima de la mitad

const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const nav = await chromium.launch(fs.existsSync(exe) ? { executablePath: exe } : {});
const pag = await nav.newPage();

const montar = ({ b64, ANCHO, ALTO, ALTO_SOBRE, CENTRO_Y }) => new Promise(res => {
  const img = new Image();
  img.onerror = () => res(null);
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = ANCHO; c.height = ALTO;
    const g = c.getContext('2d');

    // El fondo de estudio: gris neutro con las esquinas algo más apagadas.
    g.fillStyle = '#282828';
    g.fillRect(0, 0, ANCHO, ALTO);
    const luz = g.createRadialGradient(ANCHO * .5, ALTO * .42, ANCHO * .12,
                                       ANCHO * .5, ALTO * .5, ALTO * .72);
    luz.addColorStop(0, 'rgba(62,62,62,1)');
    luz.addColorStop(.55, 'rgba(40,40,40,1)');
    luz.addColorStop(1, 'rgba(22,22,22,1)');
    g.fillStyle = luz;
    g.fillRect(0, 0, ANCHO, ALTO);

    // El sobre, entero y centrado.
    const h = ALTO * ALTO_SOBRE;
    const w = h * img.naturalWidth / img.naturalHeight;
    const x = (ANCHO - w) / 2, y = ALTO * CENTRO_Y - h / 2;

    // Una sombra por debajo, para que se apoye y no flote.
    g.save();
    g.filter = 'blur(26px)';
    g.globalAlpha = .55;
    g.fillStyle = '#000';
    g.beginPath();
    g.ellipse(ANCHO / 2, y + h * 1.005, w * .40, h * .035, 0, 0, Math.PI * 2);
    g.fill();
    g.restore();

    g.drawImage(img, x, y, w, h);
    res({ d: c.toDataURL('image/png'), w: Math.round(w), h: Math.round(h) });
  };
  img.src = 'data:image/png;base64,' + b64;
});

const out = await pag.evaluate(montar,
  { b64: fs.readFileSync(ORIGEN).toString('base64'), ANCHO, ALTO, ALTO_SOBRE, CENTRO_Y });
await nav.close();
if (!out) { console.log('sale vacío'); process.exit(1); }

fs.mkdirSync(path.dirname(DESTINO), { recursive: true });
fs.writeFileSync(DESTINO, Buffer.from(out.d.split(',')[1], 'base64'));
console.log(`${DESTINO}  ${ANCHO}x${ALTO}  sobre ${out.w}x${out.h}  ` +
            `${Math.round(fs.statSync(DESTINO).size / 1024)} kB`);
