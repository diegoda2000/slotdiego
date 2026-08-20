/* ¿Cae cada texto de la carta dentro del hueco que le dibuja el marco?

   Esta herramienta no calcula nada. Dibuja la carta a tamaño natural, la fotografía dos
   veces —con el texto y sin él— y se queda con la diferencia: eso es, píxel a píxel,
   exactamente el trazo de las letras. Después lo compara con el hueco del marco, medido
   también en píxeles sobre juego/marcos/oro.webp.

   Existe porque los atajos fallaron. Medir la caja del elemento no sirve: la caja de línea
   de Oswald reserva sitio bajo la base para las colas de las letras, así que un texto puede
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

/* Los huecos del marco, leídos de oro.webp (620x877) recorriendo cada columna y anotando
   dónde el dorado del hueco se separa del marfil del marco. */
const HUECOS = {
  '.c-rk':     { x: [0.075, 0.185], filas: [[1.82, 11.97]] },
  '.c-nom':    { x: [0.260, 0.740], filas: [[66.02, 70.51]] },
  '.c-record': { x: [0.130, 0.870], filas: [[70.60, 75.30]] },
  '.c-num':    { x: [0.180, 0.216], filas: [[76.05, 78.22], [82.33, 84.49], [88.71, 90.88]] },
};

const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
// Con el mínimo de letra de un móvil, que es donde el texto se salía de su hueco.
const nav = await chromium.launch({ args: ['--blink-settings=minimumFontSize=8,minimumLogicalFontSize=8'],
  ...(fs.existsSync(exe) ? { executablePath: exe } : {}) });
const pag = await nav.newPage({ viewport: { width: 800, height: 1200 }, deviceScaleFactor: 2 });
await pag.goto('file://' + path.resolve('juego/juego.html'));
await pag.waitForFunction(() => typeof window.ROSTER !== 'undefined');

await pag.evaluate(() => {
  // una carta de oro CON puesto, para que salga también la pestaña del ranking
  const l = ROSTER.filter(c => c.rareza === 'oro' && c.rk).slice(0, 40);
  S.coleccion = l.map((c, i) => ({ iid: 'm' + i, cid: c.id }));
  ir('coleccion'); render();
});
await pag.waitForTimeout(600);

const carta = await pag.evaluate(() => {
  const est = document.createElement('style');
  // Sin sombras ni reflejos: lo que se mide tiene que ser la letra, no su relieve.
  est.textContent = '.carta .c-nom,.carta .c-rk,.carta .c-record,.carta .c-num{text-shadow:none !important}'
                  + '.carta .brillo{display:none !important}';
  document.head.appendChild(est);
  const jaula = document.createElement('div');
  jaula.id = 'jaula';
  jaula.style.cssText = 'position:fixed;left:20px;top:20px;width:620px;z-index:9999';
  const c = document.querySelector('.grid .carta').cloneNode(true);
  c.style.setProperty('--k', '1');       // el lienzo, a tamaño natural
  jaula.appendChild(c); document.body.appendChild(jaula);
  return { nombre: c.querySelector('.c-nom').textContent, rk: c.querySelector('.c-rk').textContent };
});
console.log(`Carta medida: ${carta.rk} ${carta.nombre}\n`);

const foto = async () => descodificar(await pag.locator('#jaula .carta').screenshot());
const con = await foto();

/* Se apaga UN elemento cada vez, no todos a la vez: la franja del récord toca por arriba
   con la placa del nombre y por los lados con los rombos, y apagándolos juntos la
   diferencia salía de un texto que no era el que se estaba midiendo. */
const sin = {};
for (const sel of Object.keys(HUECOS)) {
  const est = await pag.evaluateHandle(s => {
    const e = document.createElement('style');
    e.textContent = `#jaula ${s}{visibility:hidden !important}`;
    document.head.appendChild(e); return e;
  }, sel);
  sin[sel] = await foto();
  await est.evaluate(e => e.remove());
}
await nav.close();

const sig = n => (n >= 0 ? '+' : '') + n.toFixed(2);
let fuera = 0;
for (const [sel, { x, filas }] of Object.entries(HUECOS)) {
  filas.forEach(([arriba, abajo], i) => {
    const t = banda(con, sin[sel], x, [arriba - 1.5, abajo + 1.5]);
    const et = `${sel}${filas.length > 1 ? ' ' + (i + 1) : ''}`;
    if (!t) { console.log(`  ${et.padEnd(14)} sin tinta`); return; }
    const ha = t[0] - arriba, hb = abajo - t[1];
    const bien = ha >= -0.05 && hb >= -0.05;
    if (!bien) fuera++;
    console.log(`  ${et.padEnd(14)} tinta ${t[0].toFixed(2).padStart(6)}-${t[1].toFixed(2)}` +
      `   hueco ${arriba.toFixed(2).padStart(6)}-${abajo.toFixed(2)}` +
      `   holgura ${sig(ha)} / ${sig(hb)}   ${bien ? 'DENTRO' : 'FUERA'}`);
  });
}
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
