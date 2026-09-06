/* FOTOGRAFÍA LA MISMA CARTA EN LAS TRES RAREZAS, para poder compararlas de un vistazo.

   Pinta común, rara y épica una al lado de otra, a tamaño grande y con el mismo peleador,
   que es la única forma de ver si el color de las letras va con el marco de cada una.

   Uso:  node herramientas/ver-rarezas.mjs [carpeta] [peleador]
*/
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const CARPETA = process.argv[2] || '/tmp/rarezas';
const QUIEN = process.argv[3] || 'Ilia Topuria';
fs.mkdirSync(CARPETA, { recursive: true });

// El mismo Chromium y el mismo mínimo de letra que la suite: fotografiar en un navegador
// sin mínimo es fotografiar algo que el jugador no tiene delante.
const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const navegador = await chromium.launch({
  args: ['--blink-settings=minimumFontSize=8,minimumLogicalFontSize=8', '--allow-file-access-from-files'],
  ...(fs.existsSync(exe) ? { executablePath: exe } : {}),
});
const pg = await navegador.newPage({ viewport: { width: 1420, height: 1310 }, deviceScaleFactor: 2 });
pg.on('console', m => { if (m.type() === 'error') console.log('  consola:', m.text()); });
await pg.goto('file://' + path.resolve('juego/juego.html'));
await pg.waitForFunction(() => typeof window.cartaHTML === 'function');

const ANCHO_CARTA = 400;
const info = await pg.evaluate(async ([quien, ANCHO_CARTA]) => {
  const c = ROSTER.find(x => x.nombre === quien) || ROSTER[0];
  const marco = document.createElement('div');
  marco.style.cssText = 'position:fixed;inset:0;z-index:9999;background:#060707;overflow:auto;'
    + 'display:flex;flex-direction:column;align-items:center;justify-content:center;gap:26px;padding:30px';
  // Dos filas: los frentes arriba y los reversos debajo, que él pasó las dos caras.
  for (const cara of ['frente', 'reverso']) {
    const fila = document.createElement('div');
    fila.style.cssText = 'display:flex;align-items:flex-start;justify-content:center;gap:34px';
    for (const [rz, et] of [['comun', 'COMÚN'], ['raro', 'RARA'], ['epico', 'ÉPICA']]) {
      const col = document.createElement('div');
      col.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:12px';
      col.innerHTML = `<div style="width:${ANCHO_CARTA}px">`
        + cartaHTML(c, { rareza: rz, oculta: cara === 'reverso' }) + '</div>'
        + `<div style="font:600 17px/1 var(--titulo);letter-spacing:.22em;color:#a4a5a8">${et}</div>`;
      fila.appendChild(col);
    }
    marco.appendChild(fila);
  }
  document.body.appendChild(marco);
  medirCartas();
  // Las fotos y los marcos van en background/img: hay que esperarlos o salen a medias.
  await new Promise(r => setTimeout(r, 900));
  await document.fonts.ready;
  return { nombre: c.nombre, division: c.division, apodo: c.apodo, stats: c.stats };
}, [QUIEN, ANCHO_CARTA]);

await pg.screenshot({ path: `${CARPETA}/tres-rarezas.png` });
console.log(`  ${info.nombre} · ${info.division}${info.apodo ? ' · ' + info.apodo : ''}`);
console.log(`  ${CARPETA}/tres-rarezas.png`);

/* EL LATIDO, FOTOGRAMA A FOTOGRAMA. Una imagen fija no enseña una animación, así que se
   para la animación y se fija la opacidad a mano en cada paso del ciclo: sale determinista
   —siempre los mismos fotogramas— en vez de depender de cuándo dispare la captura. */
const PASOS = 14;
fs.mkdirSync(`${CARPETA}/latido`, { recursive: true });
for (let i = 0; i < PASOS; i++) {
  // el mismo recorrido que @keyframes latido: 1 → .45 → 1, suavizado
  const t = i / PASOS, o = 0.45 + 0.55 * (0.5 + 0.5 * Math.cos(2 * Math.PI * t));
  await pg.evaluate(o => {
    for (const e of document.querySelectorAll('.carta .luz'))
      { e.style.animation = 'none'; e.style.opacity = o; }
  }, o);
  await pg.screenshot({ path: `${CARPETA}/latido/${String(i).padStart(2, '0')}.png`,
    clip: { x: 0, y: 0, width: 1420, height: 700 } });
}
console.log(`  ${PASOS} fotogramas del latido en ${CARPETA}/latido/`);
await navegador.close();
