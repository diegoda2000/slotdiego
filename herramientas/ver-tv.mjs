/* Mira cómo queda el juego en una ANDROID TV —el Nvidia Shield y compañía—, que es un
   aparato horizontal con la aplicación bloqueada en vertical.
 
   Uso:  node herramientas/ver-tv.mjs [carpeta]

   QUÉ MIDE Y POR QUÉ:

   1. LA COLUMNA. Una tele no gira, así que Android encajona la aplicación vertical en el
      centro de la pantalla: sobre 1920x1080 quedan unos 607x1080 de píxeles de CSS. Se
      comprueba que ahí no se desborda nada, igual que se hace con el móvil.

   2. EL APAISADO, que está DESCARTADO y se mide para que se vea por qué. Soltar el
      bloqueo vertical parece la solución obvia y es peor: a 960x540 —1080p a densidad 2—
      no da el alto y se rompen dos pantallas. Si alguien vuelve a proponerlo, aquí está
      el número.

   3. EL TECLADO. En una tele se escribe siempre en horizontal, y el teclado de Android
      ocupa muchísimo. Se simula la ventana ya encogida y se exige que los campos de las
      dos únicas pantallas que escriben —cuenta y sugerencias— sigan viéndose enteros y
      sin que los tape la barra de pestañas.
*/
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SALIDA = process.argv[2] || 'tv';
const PANTALLAS = ['tienda', 'club', 'inicio', 'desafios', 'perfil', 'coleccion', 'plantilla'];
const CON_TECLADO = ['sugerencias', 'cuenta'];

const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const nav = await chromium.launch({
  args: ['--blink-settings=minimumFontSize=8,minimumLogicalFontSize=8'],
  ...(fs.existsSync(exe) ? { executablePath: exe } : {}),
});

const abrir = async (w, h) => {
  const pag = await nav.newPage({ viewport: { width: w, height: h } });
  const fallos = [];
  pag.on('pageerror', e => fallos.push(String(e)));
  await pag.goto('file://' + path.resolve('juego/juego.html'));
  await pag.waitForFunction(() => typeof window.ROSTER !== 'undefined');
  await pag.waitForTimeout(400);
  return [pag, fallos];
};

fs.mkdirSync(SALIDA, { recursive: true });
let mal = 0;

/* ── 1 y 2: la forma, en columna y en apaisado ───────────────────────────── */
for (const [etiq, w, h, tolera] of [
  ['LA COLUMNA de una tele 1080p (lo que hay)', 607, 1080, 0],
  ['APAISADO 960x540, DESCARTADO: mira los desbordes', 960, 540, Infinity],
]) {
  const [pag, fallos] = await abrir(w, h);
  console.log(`\n══ ${etiq}  —  ${w}x${h}`);
  for (const v of PANTALLAS) {
    await pag.evaluate(p => { ir(p); }, v);
    await pag.waitForTimeout(240);
    const d = await pag.evaluate(() => document.documentElement.scrollHeight - innerHeight);
    if (w === 607) {
      await pag.screenshot({ path: path.join(SALIDA, v + '.png') });
      if (d > tolera) mal++;
    }
    console.log(`  ${v.padEnd(11)} desborda ${String(d).padStart(4)}px${d > 0 && w === 607 ? '   ← MAL' : ''}`);
  }
  if (fallos.length) { console.log('  ERRORES: ' + fallos.join(' | ')); mal++; }
  await pag.close();
}

/* ── 3: con el teclado abierto ───────────────────────────────────────────── */
for (const [etiq, w, h] of [
  ['tele, teclado abierto', 607, 594],
  ['móvil, teclado abierto', 390, 464],
]) {
  const [pag, fallos] = await abrir(w, h);
  console.log(`\n══ ${etiq}  —  ${w}x${h}`);
  for (const v of CON_TECLADO) {
    await pag.evaluate(p => { ir(p); }, v);
    await pag.waitForTimeout(240);
    const m = await pag.evaluate(() => {
      const c = document.querySelector('textarea.campo, input.campo');
      const r = c && c.getBoundingClientRect();
      const b = document.getElementById('nav');
      const rb = b && b.getBoundingClientRect();
      return { hay: !!r, ve: r ? r.top >= 0 && r.bottom <= innerHeight : false,
               tapa: r && rb ? r.bottom > rb.top : false };
    });
    const bien = m.hay && m.ve && !m.tapa;
    if (!bien) mal++;
    console.log(`  ${v.padEnd(12)} campo visible ${m.ve} · lo tapa la barra ${m.tapa}${bien ? '' : '   ← MAL'}`);
  }
  if (fallos.length) { console.log('  ERRORES: ' + fallos.join(' | ')); mal++; }
  await pag.close();
}

await nav.close();
console.log(mal ? `\n${mal} PROBLEMAS` : `\nTodo bien. Fotos de la columna en ${SALIDA}/`);
process.exit(mal ? 1 : 0);
