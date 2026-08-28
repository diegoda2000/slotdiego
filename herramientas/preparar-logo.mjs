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

/* El icono de Android. 432 px es el tamaño de una capa de icono adaptativo a xxxhdpi
   —108 dp—, y por eso el archivo va en drawable-xxxhdpi: puesto en drawable a secas el
   sistema lo tomaría por mdpi y lo ampliaría cuatro veces. El dibujo se deja al 65% del
   lienzo, que es lo que sobrevive a cualquier máscara; lo que se salga de ahí es negro
   del fondo de la carta y no se echa en falta. */
const iconoAndroid = ({ b64, LADO, PARTE }) => new Promise(res => {
  const img = new Image();
  img.onerror = () => res(null);
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = c.height = LADO;
    const g = c.getContext('2d');
    const w = Math.round(LADO * PARTE), h = Math.round(w * img.naturalHeight / img.naturalWidth);
    g.drawImage(img, Math.round((LADO - w) / 2), Math.round((LADO - h) / 2), w, h);
    res(c.toDataURL('image/png'));
  };
  img.src = 'data:image/webp;base64,' + b64;
});

/* El de iPhone: el cuadrado entero, sin recortar y sin transparencia. */
const iconoIOS = ({ b64, LADO }) => new Promise(res => {
  const img = new Image();
  img.onerror = () => res(null);
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = c.height = LADO;
    const g = c.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, LADO, LADO);
    g.drawImage(img, 0, 0, LADO, LADO);
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
const recortado = fs.readFileSync(DESTINO).toString('base64');
const png = await pag.evaluate(iconoAndroid, { b64: recortado, LADO: 432, PARTE: 0.65 });
const ipng = await pag.evaluate(iconoIOS, { b64: bruto, LADO: 1024 });
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
