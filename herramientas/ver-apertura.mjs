/* Fotografía la apertura del sobre paso a paso, para poder mirarla sin un móvil delante.

   Saca la pantalla del sobre, el rasgado en cinco momentos, el montón montado, el volteo
   a medias y del todo, y una carta yéndose al fondo.

   Uso:  node herramientas/ver-apertura.mjs [carpeta] [tipo de sobre]
*/
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SALIDA = process.argv[2] || 'apertura';
const TIPO = process.argv[3] || 'comun';

const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const nav = await chromium.launch({
  args: ['--blink-settings=minimumFontSize=8,minimumLogicalFontSize=8'],
  ...(fs.existsSync(exe) ? { executablePath: exe } : {}),
});
const pag = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const fallos = [];
pag.on('pageerror', e => fallos.push(String(e)));
pag.on('console', m => { if (m.type() === 'error') fallos.push(m.text()); });

await pag.goto('file://' + path.resolve('juego/juego.html'));
await pag.waitForFunction(() => typeof window.ROSTER !== 'undefined');
await pag.evaluate(() => document.fonts.ready);
await pag.waitForTimeout(600);

fs.mkdirSync(SALIDA, { recursive: true });
let n = 0;
const tira = async et => {
  const f = `${SALIDA}/${String(++n).padStart(2, '0')}-${et}.png`;
  await pag.screenshot({ path: f });
  console.log('  ' + f);
};

await pag.evaluate(t => {
  S.sobres = [{ tipo: t }]; ir('tienda'); tmp.sub = 'mios'; render();
  document.querySelector(`[data-a="versobre"][data-t="${t}"]`).click();
}, TIPO);
await pag.waitForTimeout(300); await tira('sobre');

await pag.evaluate(() => document.querySelector('[data-a="abrirsobre"]').click());
await pag.waitForTimeout(400); await tira('montado');
// El sobre no se rasga solo: hay que tocarlo.
await pag.evaluate(() => toqueApertura());
for (const [ms, et] of [[130, 'rasga1'], [110, 'rasga2'], [110, 'rasga3'],
                        [110, 'rasga4'], [120, 'rasga5'], [140, 'rasga6'],
                        [180, 'rasga7'], [260, 'cae']]) {
  await pag.waitForTimeout(ms); await tira(et);
}
await pag.waitForTimeout(600); await tira('monton');
await pag.evaluate(() => pasarCarta());
await pag.waitForTimeout(150); await tira('volteo-medio');
await pag.waitForTimeout(340); await tira('volteada');
await pag.evaluate(() => pasarCarta());
await pag.waitForTimeout(190); await tira('yendose');
await pag.waitForTimeout(430); await tira('siguiente');

await nav.close();
console.log(fallos.length ? '\nERRORES:\n' + fallos.join('\n') : `\n${n} fotogramas, sin errores`);
