/* Deja el logotipo listo para todo lo que lo usa:

     juego/arte/logo.webp                                 el de la cabecera del juego
     android/.../drawable-xxxhdpi/ic_launcher_foreground.png   el icono de Android
     ios/JaulaAbierta/Assets.xcassets/.../icono-1024.png       el icono de iPhone

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

   LOS DOS ICONOS. El de Android es un icono adaptativo: el sistema le recorta la forma
   que quiera —círculo, cuadrado redondeado, gota— así que el dibujo va centrado y sin
   llegar a los bordes, sobre una capa de fondo negra que es la que rellena lo que quede.
   El de iPhone no se recorta ni admite transparencia, así que ahí va el cuadrado entero
   tal cual, con su negro.

   Uso:  node herramientas/preparar-logo.mjs [alto-en-px]
         (por defecto 96 px de alto, que es 3x del tamaño al que se pinta la cabecera)
*/
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ORIGEN = 'originales/logo/logo.png';
const DESTINO = 'juego/arte/logo.webp';
const ALTO = Number(process.argv[2]) || 96;
const CALIDAD = 0.92;

const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const nav = await chromium.launch(fs.existsSync(exe) ? { executablePath: exe } : {});
const pag = await nav.newPage();
/* Se abre el juego para tener sus @font-face: el nombre del icono se escribe con la misma
   Saira Condensed que la cabecera, y en una página en blanco no existiría. */
await pag.goto('file://' + path.resolve('juego/juego.html'));
await pag.evaluate(() => document.fonts.ready);

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

/* EL ICONO DE LA APLICACIÓN: el logo recortado, SIN FONDO, y el nombre debajo.

   Recortar el negro no se puede hacer por umbral ni deshaciendo la premultiplicación: el
   cuerpo de las cartas también es negro y se volvería transparente con él. Lo que se hace
   es un relleno por inundación desde los cuatro bordes sobre lo que es casi negro. Así se
   va SOLO el negro que rodea al dibujo —el que toca el borde— y el de dentro de las
   cartas, que no está conectado con él, se queda.

   EL CONJUNTO SE SALE DEL CÍRCULO SEGURO, y es a propósito porque lo pidió el dueño: con
   un dibujo Y un nombre, quedarse dentro de los 66 dp que Android garantiza dejaba el
   icono ocupando media casilla. Así llena, y lo que se pierde en las máscaras redondas
   —Pixel— es la punta de las cartas, que ahí es casi todo negro. El bloque va un poco por
   encima del centro justo para eso: que si se recorta algo, no sea el pie del nombre. */
const recortarFondo = ({ b64 }) => new Promise(res => {
  const img = new Image();
  img.onerror = () => res(null);
  img.onload = () => {
    const W = img.naturalWidth, H = img.naturalHeight;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, W, H), p = d.data;

    const fuera = new Uint8Array(W * H);
    const pila = [];
    const casiNegro = n => Math.max(p[n * 4], p[n * 4 + 1], p[n * 4 + 2]) <= 18;
    const mete = n => { if (!fuera[n] && casiNegro(n)) { fuera[n] = 1; pila.push(n); } };
    for (let x = 0; x < W; x++) { mete(x); mete((H - 1) * W + x); }
    for (let y = 0; y < H; y++) { mete(y * W); mete(y * W + W - 1); }
    while (pila.length) {
      const n = pila.pop(), x = n % W, y = (n / W) | 0;
      if (x > 0) mete(n - 1);
      if (x < W - 1) mete(n + 1);
      if (y > 0) mete(n - W);
      if (y < H - 1) mete(n + W);
    }

    let minx = W, maxx = -1, miny = H, maxy = -1;
    for (let n = 0; n < W * H; n++) {
      if (fuera[n]) { p[n * 4 + 3] = 0; continue; }
      const x = n % W, y = (n / W) | 0;
      if (x < minx) minx = x;
      if (x > maxx) maxx = x;
      if (y < miny) miny = y;
      if (y > maxy) maxy = y;
    }
    if (maxx < 0) return res(null);
    g.putImageData(d, 0, 0);

    const sw = maxx - minx + 1, sh = maxy - miny + 1;
    const sal = document.createElement('canvas');
    sal.width = sw; sal.height = sh;
    sal.getContext('2d').drawImage(c, minx, miny, sw, sh, 0, 0, sw, sh);
    res(sal.toDataURL('image/png'));
  };
  img.src = 'data:image/png;base64,' + b64;
});

const componerIcono = ({ b64, LADO, FONDO }) => new Promise(res => {
  const img = new Image();
  img.onerror = () => res(null);
  img.onload = async () => {
    await document.fonts.load('italic 800 100px "Saira Condensed"');
    const c = document.createElement('canvas');
    c.width = c.height = LADO;
    const g = c.getContext('2d');
    if (FONDO) { g.fillStyle = FONDO; g.fillRect(0, 0, LADO, LADO); }

    const anchoDibujo = Math.round(LADO * 0.60);
    const altoDibujo = Math.round(anchoDibujo * img.naturalHeight / img.naturalWidth);
    const hueco = Math.round(LADO * 0.03);

    // El nombre, escrito por trozos para poder darle un color a cada uno.
    const tam = Math.round(LADO * 0.175), chico = Math.round(tam * 0.58);
    const trozos = [['P', '#d40c1a', tam], ['4', '#a59e9f', tam], ['P', '#d40c1a', tam],
                    ['.CG', '#ffffff', chico]];
    const fuente = t => `italic 800 ${t}px "Saira Condensed", sans-serif`;
    let anchoTexto = 0;
    for (const [t, , z] of trozos) { g.font = fuente(z); anchoTexto += g.measureText(t).width; }

    /* El bloque se sube un pelín del centro: si alguna máscara recorta, que se lleve la
       punta de las cartas —que ahí es casi todo negro— y no el pie del nombre. */
    const total = altoDibujo + hueco + tam;
    let y = Math.round((LADO - total) / 2) - Math.round(LADO * 0.02);
    g.drawImage(img, Math.round((LADO - anchoDibujo) / 2), y, anchoDibujo, altoDibujo);

    g.textBaseline = 'alphabetic';
    let x = Math.round((LADO - anchoTexto) / 2);
    const base = y + altoDibujo + hueco + tam;
    for (const [t, color, z] of trozos) {
      g.font = fuente(z); g.fillStyle = color;
      g.fillText(t, x, base);
      x += g.measureText(t).width;
    }
    res(c.toDataURL('image/png'));
  };
  img.src = 'data:image/png;base64,' + b64;
});

const bruto = fs.readFileSync(ORIGEN).toString('base64');
const out = await pag.evaluate(preparar, { b64: bruto, ALTO, CALIDAD });
if (!out) { await nav.close(); console.log('el logotipo sale vacío'); process.exit(1); }
fs.writeFileSync(DESTINO, Buffer.from(out.d.split(',')[1], 'base64'));

const AND = 'android/app/src/main/res/drawable-xxxhdpi/ic_launcher_foreground.png';
const IOS = 'ios/JaulaAbierta/Assets.xcassets/AppIcon.appiconset/icono-1024.png';
const suelto = await pag.evaluate(recortarFondo, { b64: bruto });
if (!suelto) { await nav.close(); console.log('el recorte sale vacío'); process.exit(1); }
const s64 = suelto.split(',')[1];
const png = await pag.evaluate(componerIcono, { b64: s64, LADO: 432, FONDO: null });
/* El de iPhone va aplanado sobre negro y no porque quiera: Apple no admite transparencia
   en el icono de una aplicación, y si se la mandas la rellena ella. */
const ipng = await pag.evaluate(componerIcono, { b64: s64, LADO: 1024, FONDO: '#000000' });
await nav.close();

for (const [ruta, datos] of [[AND, png], [IOS, ipng]]) {
  if (!datos) { console.log('no ha salido', ruta); process.exit(1); }
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, Buffer.from(datos.split(',')[1], 'base64'));
}

const kB = f => Math.round(fs.statSync(f).size / 1024) + ' kB';
console.log(`${ORIGEN}  ${out.W}x${out.H}`);
console.log(`  recortado a ${out.sw}x${out.sh}`);
console.log(`  cabecera  ${DESTINO}  ${out.w}x${out.h}  ${kB(DESTINO)}`);
console.log(`  Android   ${AND}  432x432  ${kB(AND)}`);
console.log(`  iPhone    ${IOS}  1024x1024  ${kB(IOS)}`);
