/* ¿Cae cada texto de la carta dentro del hueco que le dibuja el marco?

   Esta herramienta no calcula nada. Dibuja la carta a tamaño natural, la fotografía dos
   veces —con el texto y sin él— y se queda con la diferencia: eso es, píxel a píxel,
   exactamente el trazo de las letras. Después lo compara con el hueco del marco, medido
   también en píxeles sobre juego/marcos/oro.webp.

   Existe porque los atajos fallaron. Medir la caja del elemento no sirve: la caja de línea
   de la fuente reserva sitio bajo la base para las colas de las letras, así que un texto puede
   estar centrado en su caja y torcido dentro del hueco. Y medir con las métricas del canvas
   tampoco: en la rejilla las cartas van a 90-100 px, y ahí Chromium redondea a píxeles
   enteros —una fuente de 3,3 px devuelve una altura de 3, un 25% de error—. Dando por
   buenas esas medidas se dejaron los números y el nombre un 1% por debajo de su sitio.

   Uso:  node herramientas/medir-carta.mjs
*/
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

/* LAS CAJAS DE LA CARTA NUEVA, en % de su alto, tal como las reparte el diseño.

   OJO, QUE ESTO YA NO SE MIDE SOBRE EL MARCO. El marco viejo traía huecos negros
   dibujados —una barra para el nombre, seis recuadros para las stats— y la comprobación
   era "¿cae la tinta dentro del hueco que le pintaron?". El marco nuevo no trae ninguno:
   el nombre, el apodo, los datos y el panel de stats se pintan sobre el fondo, y sus cajas
   salen del boceto, no del dibujo. Lo que se comprueba ahora es que cada texto se quede
   dentro de la caja que el diseño le asigna, que es lo que caza los desbordes por el
   mínimo de letra del móvil —el fallo para el que se hizo esta herramienta—.

   Si mueves una caja en el CSS, muévela también aquí o esto deja de decir la verdad. */
const MARCOS = {
  comun: {
    '.c-nom':    { x: [0.04, 0.96], filas: [[63.40, 72.30]] },
    '.c-apodo':  { x: [0.00, 1.00], filas: [[73.50, 76.80]] },
    '.c-datos':  { x: [0.00, 1.00], filas: [[78.40, 83.40]] },
    '.c-stats':  { x: [0.07, 0.93], filas: [[84.00, 94.60]] },
  },
};

const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
// Con el mínimo de letra de un móvil, que es donde el texto se salía de su hueco.
const nav = await chromium.launch({ args: ['--blink-settings=minimumFontSize=8,minimumLogicalFontSize=8'],
  ...(fs.existsSync(exe) ? { executablePath: exe } : {}) });
const pag = await nav.newPage({ viewport: { width: 800, height: 1200 }, deviceScaleFactor: 2 });
await pag.goto('file://' + path.resolve('juego/juego.html'));
await pag.waitForFunction(() => typeof window.ROSTER !== 'undefined');

await pag.evaluate(() => {
  const est = document.createElement('style');
  // Sin sombras ni reflejos: lo que se mide tiene que ser la letra, no su relieve.
  /* Sin sombras ni relieves: lo que se mide tiene que ser la letra. El nombre del diseño
     nuevo lleva drop-shadow en un filter, no un text-shadow, así que hay que apagar los
     dos o la sombra cuenta como tinta y la banda sale más alta de lo que es. */
  est.textContent = '.carta .c-nom,.carta .c-apodo,.carta .c-datos,.carta .c-stats'
                  + '{text-shadow:none !important;filter:none !important}'
                  + '.carta .c-foto{filter:none !important}'
                  + '.carta .c-datos img{box-shadow:none !important}';
  // (la sombra de la bandera se apaga para medir: es relieve, no letra)
  document.head.appendChild(est);
  const jaula = document.createElement('div');
  jaula.id = 'jaula';
  jaula.style.cssText = 'position:fixed;left:20px;top:20px;width:620px;z-index:9999';
  document.body.appendChild(jaula);
});

const foto = async () => descodificar(await pag.locator('#jaula .carta').screenshot());
/* Dónde cae de verdad la caja del elemento, en % del alto de la carta. Esto es exacto: lo
   dice el navegador. La medida por tinta de más abajo es la que caza los desbordes, pero
   arrastra medio punto de suavizado de bordes ahora que la carta no lleva fondo opaco
   detrás, así que las dos se leen juntas: la caja dice dónde ESTÁ el elemento y la tinta,
   si su contenido se le sale. */
const caja = async (sel) => pag.evaluate(s => {
  const c = document.querySelector('#jaula .carta').getBoundingClientRect();
  const e = document.querySelector('#jaula ' + s);
  if (!e) return null;
  const b = e.getBoundingClientRect();
  return [(b.top - c.top) / c.height * 100, (b.bottom - c.top) / c.height * 100];
}, sel);
const sig = n => (n >= 0 ? '+' : '') + n.toFixed(2);
let fuera = 0;

for (const [marco, HUECOS] of Object.entries(MARCOS)) {
  /* EL PEOR CASO, no una carta cualquiera: el nombre más largo, con apodo y rankeado, que
     es donde el texto tiene más papeletas de salirse. */
  const carta = await pag.evaluate(() => {
    const l = ROSTER.filter(c => c.apodo && (c.rk === 0 || c.rk))
      .sort((a, b) => (b.nombre.length - a.nombre.length) || (b.apodo.length - a.apodo.length));
    const c = l[0] || ROSTER[0];
    const j = document.getElementById('jaula');
    j.innerHTML = cartaHTML(c);
    j.querySelector('.carta').style.setProperty('--k', '1');
    return { nombre: c.nombre, apodo: c.apodo, peso: SIGLA_DIV[c.division] };
  });
  console.log(`\n── ${marco.toUpperCase()} ──  ${carta.nombre} "${carta.apodo}" (${carta.peso})`);
  /* Y se espera a que TODO esté pintado antes de la primera foto: la foto del peleador y
     la bandera van con loading="lazy", y si una termina de cargar entre las dos capturas
     la diferencia sale de ella y no del texto que se está midiendo. */
  await pag.evaluate(() => Promise.all(
    [...document.querySelectorAll('#jaula img')].map(i => i.complete ? null : i.decode().catch(() => null))));
  await pag.waitForTimeout(250);
  const con = await foto();

  /* Se apaga UN elemento cada vez, no todos a la vez: las cajas se tocan entre ellas y
     apagándolas juntas la diferencia salía de un texto que no era el que se medía. */
  for (const [sel, { x, filas }] of Object.entries(HUECOS)) {
    const est = await pag.evaluateHandle(s => {
      const e = document.createElement('style');
      e.textContent = `#jaula ${s}{visibility:hidden !important}`;
      document.head.appendChild(e); return e;
    }, sel);
    const sin = await foto();
    await est.evaluate(e => e.remove());
    const cj = await caja(sel);
    for (const [i, [arriba, abajo]] of filas.entries()) {
      const t = banda(con, sin, x, [arriba - 1.5, abajo + 1.5]);
      const et = `${sel}${filas.length > 1 ? ' ' + (i + 1) : ''}`;
      /* LA CAJA, EXACTA: tiene que caer clavada donde dice el diseño. */
      const bienCaja = cj && cj[0] >= arriba - 0.02 && cj[1] <= abajo + 0.02;
      if (!bienCaja) fuera++;
      if (!t) { console.log(`  ${et.padEnd(14)} sin tinta`); continue; }
      /* Y LA TINTA, con una décima de margen para el suavizado del canto de las letras.
         Estuvo en medio punto mientras se perseguía un desborde que resultó no serlo: las
         imágenes con loading="lazy" terminaban de cargar ENTRE las dos capturas y la
         diferencia salía de ellas. Esperándolas, la medida vuelve a ser limpia. */
      const ha = t[0] - arriba, hb = abajo - t[1];
      const bienTinta = ha >= -0.10 && hb >= -0.10;
      if (!bienTinta) fuera++;
      console.log(`  ${et.padEnd(14)} caja ${cj ? cj[0].toFixed(2).padStart(6) + '-' + cj[1].toFixed(2) : '  ?'}` +
        `   tinta ${t[0].toFixed(2).padStart(6)}-${t[1].toFixed(2)}` +
        `   hueco ${arriba.toFixed(2).padStart(6)}-${abajo.toFixed(2)}` +
        `   ${sig(ha)}/${sig(hb)}   ${bienCaja && bienTinta ? 'DENTRO' : 'FUERA'}`);
    }
  }
}
await nav.close();
console.log(fuera === 0 ? '\nTodo dentro de su hueco.\n' : `\n${fuera} TEXTOS FUERA DE SU HUECO\n`);
process.exit(fuera === 0 ? 0 : 1);


/* Devuelve [arriba, abajo] en % de la altura de la carta: las filas donde las dos fotos
   se diferencian, que son las que tienen tinta. Se piden dos píxeles como mínimo para no
   dar por letra un resto de suavizado del borde. */
function banda(a, b, [x0, x1], [y0, y1]) {
  const { ancho, alto, pix } = a;
  const de = Math.max(0, Math.floor(alto * y0 / 100)), a2 = Math.min(alto, Math.ceil(alto * y1 / 100));
  const cx0 = Math.floor(ancho * x0), cx1 = Math.ceil(ancho * x1);
  const filas = [];
  for (let y = de; y < a2; y++) {
    let n = 0;
    for (let x = cx0; x < cx1; x++) {
      const i = (y * ancho + x) * 4;
      if (Math.abs(pix[i] - b.pix[i]) + Math.abs(pix[i+1] - b.pix[i+1])
        + Math.abs(pix[i+2] - b.pix[i+2]) > 40) n++;
    }
    if (n >= 2) filas.push(y);
  }
  return filas.length ? [filas[0] / alto * 100, filas[filas.length - 1] / alto * 100] : null;
}

/* Un PNG de Playwright, a píxeles RGBA. Sin dependencias: se juntan los trozos IDAT, se
   descomprimen y se deshace el filtro de cada línea, que es todo lo que define el formato
   para el color verdadero de 8 bits que genera el navegador. */
function descodificar(png) {
  let p = 8, ancho = 0, alto = 0, tipo = 0, datos = [];
  while (p < png.length) {
    const largo = png.readUInt32BE(p), nombre = png.toString('ascii', p + 4, p + 8);
    const cuerpo = png.subarray(p + 8, p + 8 + largo);
    if (nombre === 'IHDR') { ancho = cuerpo.readUInt32BE(0); alto = cuerpo.readUInt32BE(4); tipo = cuerpo[9]; }
    if (nombre === 'IDAT') datos.push(cuerpo);
    if (nombre === 'IEND') break;
    p += largo + 12;
  }
  const canales = tipo === 6 ? 4 : tipo === 2 ? 3 : 0;
  if (!canales) throw new Error('tipo de PNG no contemplado: ' + tipo);
  const crudo = zlib.inflateSync(Buffer.concat(datos));
  const pix = Buffer.alloc(ancho * alto * 4);
  const linea = ancho * canales;
  let ant = Buffer.alloc(linea);
  for (let y = 0; y < alto; y++) {
    const filtro = crudo[y * (linea + 1)];
    const act = Buffer.from(crudo.subarray(y * (linea + 1) + 1, y * (linea + 1) + 1 + linea));
    for (let i = 0; i < linea; i++) {
      const a = i >= canales ? act[i - canales] : 0, b = ant[i], c = i >= canales ? ant[i - canales] : 0;
      if (filtro === 1) act[i] = (act[i] + a) & 255;
      else if (filtro === 2) act[i] = (act[i] + b) & 255;
      else if (filtro === 3) act[i] = (act[i] + ((a + b) >> 1)) & 255;
      else if (filtro === 4) {
        const p0 = a + b - c, pa = Math.abs(p0 - a), pb = Math.abs(p0 - b), pc = Math.abs(p0 - c);
        act[i] = (act[i] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
      }
    }
    for (let x = 0; x < ancho; x++) {
      const o = (y * ancho + x) * 4, s = x * canales;
      pix[o] = act[s]; pix[o+1] = act[s+1]; pix[o+2] = act[s+2];
      pix[o+3] = canales === 4 ? act[s+3] : 255;
    }
    ant = act;
  }
  return { ancho, alto, pix };
}
