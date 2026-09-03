/* Deja listo el logo NUEVO —el octógono con el P4P.CG— para el icono de la aplicación:

     originales/logo-v2/logo-recortado.png                     el logo sin fondo, a resolución completa
     android/.../drawable-xxxhdpi/ic_launcher_foreground.png   el icono de Android
     ios/.../AppIcon.appiconset/icono-1024.png                 el icono de iPhone

   QUITAR EL FONDO BLANCO NO ES PONER A TRANSPARENTE LO QUE SEA BLANCO. Dentro del logo
   hay blanco —las letras P4P.CG lo son—, así que por umbral se irían las letras. Se hace
   con un relleno por inundación desde los cuatro bordes: sólo desaparece el blanco que
   ROdea al logo, y el de dentro, que no toca el borde, se queda. Con eso se va también la
   sombra que trae el archivo por debajo, que en un icono no pinta nada.

   Y EL BORDE NO SE CORTA EN SECO. El canto del octógono está suavizado: esos píxeles son
   una mezcla de blanco y negro, y dejarlos opacos deja un halo blanco alrededor. Se
   deshace la mezcla: si P = a·F + (1-a)·blanco y el canto es casi negro, entonces
   a = (255 - luz) / 229, y el color se recupera dividiendo. Sin esto el icono se ve
   perfilado en blanco sobre cualquier fondo oscuro.

   EL TAMAÑO SE CALCULA, NO SE ELIGE. De los 108 dp de una capa de icono adaptativo,
   Android sólo garantiza el círculo de 66: el 61% del lienzo. Aquí se mide el radio de
   verdad del logo —la distancia del centro al píxel opaco más lejano, que en un octógono
   es bastante menos que la diagonal de su caja— y se escala para que ese radio quepa
   justo en el círculo. Así llena todo lo que puede sin que ninguna máscara le corte una
   esquina.

   Uso:  node herramientas/preparar-logo-v2.mjs
*/
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const ORIGEN = 'originales/logo-v2/logo.png';
const SUELTO = 'originales/logo-v2/logo-recortado.png';
const AND = 'android/app/src/main/res/drawable-xxxhdpi/ic_launcher_foreground.png';
const IOS = 'ios/JaulaAbierta/Assets.xcassets/AppIcon.appiconset/icono-1024.png';

const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const nav = await chromium.launch(fs.existsSync(exe) ? { executablePath: exe } : {});
const pag = await nav.newPage();

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

    const luz = n => (p[n * 4] * 0.299 + p[n * 4 + 1] * 0.587 + p[n * 4 + 2] * 0.114);
    const croma = n => {
      const R = p[n * 4], G = p[n * 4 + 1], B = p[n * 4 + 2];
      return Math.max(R, G, B) - Math.min(R, G, B);
    };

    /* Inundación desde los bordes sobre lo claro y sin color: se come el fondo blanco y
       la sombra gris, y se para en el canto negro del octógono. El croma evita que se
       trague el oro si alguna vez tocara el borde.

       EL UMBRAL VA EN 165 Y NO EN 228 a propósito: el archivo trae una sombra suave
       alrededor, y con el umbral alto la inundación se paraba en cuanto la sombra se
       oscurecía un poco, dejando un aro claro pegado al octógono que sobre fondo negro
       se veía perfectamente. El canto del octógono está por debajo de 40, así que hay
       sitio de sobra para bajar el listón sin comerse el logo. */
    const fuera = new Uint8Array(W * H);
    const pila = [];
    const mete = n => {
      if (fuera[n]) return;
      if (luz(n) < 165 || croma(n) > 30) return;
      fuera[n] = 1; pila.push(n);
    };
    for (let x = 0; x < W; x++) { mete(x); mete((H - 1) * W + x); }
    for (let y = 0; y < H; y++) { mete(y * W); mete(y * W + W - 1); }
    while (pila.length) {
      const n = pila.pop(), x = n % W, y = (n / W) | 0;
      if (x > 0) mete(n - 1);
      if (x < W - 1) mete(n + 1);
      if (y > 0) mete(n - W);
      if (y < H - 1) mete(n + W);
    }

    /* El canto suavizado: los píxeles que quedan pero tocan el fondo son mezcla de blanco
       y del negro del octógono. Se les devuelve su alfa y su color.

       La banda es de CUATRO píxeles y no de uno: el canto no es un escalón, es un
       degradado de dos o tres píxeles más lo que quede de la sombra, y limpiando sólo la
       primera fila el resto se queda opaco y claro. Y lo que sale por debajo de 0,35 de
       cobertura se tira entero: eso ya no es canto, es sombra. */
    let borde = new Uint8Array(W * H);
    for (let n = 0; n < W * H; n++) {
      if (fuera[n]) continue;
      const x = n % W, y = (n / W) | 0;
      if ((x > 0 && fuera[n - 1]) || (x < W - 1 && fuera[n + 1]) ||
          (y > 0 && fuera[n - W]) || (y < H - 1 && fuera[n + W])) borde[n] = 1;
    }
    for (let paso = 1; paso < 4; paso++) {
      const mas = new Uint8Array(borde);
      for (let n = 0; n < W * H; n++) {
        if (fuera[n] || borde[n]) continue;
        const x = n % W, y = (n / W) | 0;
        if ((x > 0 && borde[n - 1]) || (x < W - 1 && borde[n + 1]) ||
            (y > 0 && borde[n - W]) || (y < H - 1 && borde[n + W])) mas[n] = 1;
      }
      borde = mas;
    }
    for (let n = 0; n < W * H; n++) {
      if (fuera[n]) { p[n * 4 + 3] = 0; continue; }
      if (!borde[n] || croma(n) > 30) continue;
      const a = Math.max(0, Math.min(1, (255 - luz(n)) / 229));
      if (a >= 0.98) continue;
      if (a <= 0.35) { p[n * 4 + 3] = 0; continue; }
      for (let k = 0; k < 3; k++)
        p[n * 4 + k] = Math.max(0, Math.min(255, (p[n * 4 + k] - (1 - a) * 255) / a));
      p[n * 4 + 3] = Math.round(a * 255);
    }
    g.putImageData(d, 0, 0);

    // Caja de lo que queda, para recortar el aire.
    let x0 = W, x1 = -1, y0 = H, y1 = -1;
    for (let n = 0; n < W * H; n++) {
      if (p[n * 4 + 3] < 8) continue;
      const x = n % W, y = (n / W) | 0;
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
    const sw = x1 - x0 + 1, sh = y1 - y0 + 1;
    const sal = document.createElement('canvas');
    sal.width = sw; sal.height = sh;
    const sg = sal.getContext('2d');
    sg.drawImage(c, x0, y0, sw, sh, 0, 0, sw, sh);

    /* EL RADIO DE VERDAD: del centro de la caja al píxel opaco más lejano. En un octógono
       eso es bastante menos que la media diagonal de la caja, y es lo que permite que el
       icono llene el círculo seguro en vez de quedarse corto. */
    const q = sg.getImageData(0, 0, sw, sh).data;
    const cx = sw / 2, cy = sh / 2;
    let r2 = 0;
    for (let n = 0; n < sw * sh; n++) {
      if (q[n * 4 + 3] < 24) continue;
      const dx = (n % sw) - cx, dy = ((n / sw) | 0) - cy;
      const d2 = dx * dx + dy * dy;
      if (d2 > r2) r2 = d2;
    }
    res({ d: sal.toDataURL('image/png'), W, H, sw, sh, radio: Math.sqrt(r2) });
  };
  img.src = 'data:image/png;base64,' + b64;
});

/* El icono: el logo centrado y escalado para que su radio real quepa en el círculo. */
const componerIcono = ({ b64, LADO, FONDO, SEGURO, RADIO, ANCHO, ALTO }) => new Promise(res => {
  const img = new Image();
  img.onerror = () => res(null);
  img.onload = () => {
    const c = document.createElement('canvas');
    c.width = c.height = LADO;
    const g = c.getContext('2d');
    if (FONDO) { g.fillStyle = FONDO; g.fillRect(0, 0, LADO, LADO); }
    const k = (LADO * SEGURO / 2) / RADIO;
    const w = ANCHO * k, h = ALTO * k;
    g.drawImage(img, (LADO - w) / 2, (LADO - h) / 2, w, h);
    res(c.toDataURL('image/png'));
  };
  img.src = 'data:image/png;base64,' + b64;
});

const bruto = fs.readFileSync(ORIGEN).toString('base64');
const out = await pag.evaluate(recortarFondo, { b64: bruto });
if (!out) { await nav.close(); console.log('el recorte sale vacío'); process.exit(1); }
fs.mkdirSync(path.dirname(SUELTO), { recursive: true });
fs.writeFileSync(SUELTO, Buffer.from(out.d.split(',')[1], 'base64'));

const s64 = out.d.split(',')[1];
const comun = { b64: s64, RADIO: out.radio, ANCHO: out.sw, ALTO: out.sh };
/* 0,61 = los 66 dp que Android garantiza, de los 108 que mide la capa. */
const png = await pag.evaluate(componerIcono, { ...comun, LADO: 432, FONDO: null, SEGURO: 0.61 });
/* El de iPhone no lo recorta nadie y Apple no admite transparencia: va sobre negro. */
const ipng = await pag.evaluate(componerIcono, { ...comun, LADO: 1024, FONDO: '#000000', SEGURO: 0.90 });
await nav.close();

for (const [ruta, datos] of [[AND, png], [IOS, ipng]]) {
  if (!datos) { console.log('no ha salido', ruta); process.exit(1); }
  fs.mkdirSync(path.dirname(ruta), { recursive: true });
  fs.writeFileSync(ruta, Buffer.from(datos.split(',')[1], 'base64'));
}

const kB = f => Math.round(fs.statSync(f).size / 1024) + ' kB';
console.log(`${ORIGEN}  ${out.W}x${out.H}`);
console.log(`  recortado a ${out.sw}x${out.sh}  ·  radio real ${out.radio.toFixed(1)} px ` +
            `(la media diagonal de la caja sería ${(Math.hypot(out.sw, out.sh) / 2).toFixed(1)})`);
console.log(`  suelto    ${SUELTO}  ${kB(SUELTO)}`);
console.log(`  Android   ${AND}  432x432  ${kB(AND)}`);
console.log(`  iPhone    ${IOS}  1024x1024  ${kB(IOS)}`);
