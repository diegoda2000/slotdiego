/* Saca una foto de cada pantalla de la interfaz, a tamaño de móvil y con el mínimo de
   letra del WebView puesto, que es lo único que reproduce cómo se ve de verdad.

   Uso:  node herramientas/ver-pantallas.mjs [carpeta]
*/
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SALIDA = process.argv[2] || 'pantallas';
const PANTALLAS = ['tienda', 'club', 'inicio', 'desafios', 'perfil'];

const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const nav = await chromium.launch({
  args: ['--blink-settings=minimumFontSize=8,minimumLogicalFontSize=8'],
  ...(fs.existsSync(exe) ? { executablePath: exe } : {}),
});
const pag = await nav.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
const fallos = [];
pag.on('pageerror', e => fallos.push(String(e)));
pag.on('console', m => { if (m.type() === 'error') fallos.push('console: ' + m.text()); });

await pag.goto('file://' + path.resolve('juego/juego.html'));
await pag.waitForFunction(() => typeof window.ROSTER !== 'undefined');
await pag.waitForTimeout(400);

fs.mkdirSync(SALIDA, { recursive: true });
for (const v of PANTALLAS) {
  await pag.evaluate(p => { ir(p); }, v);
  await pag.waitForTimeout(260);
  const f = path.join(SALIDA, v + '.png');
  await pag.screenshot({ path: f });
  const hueco = await pag.evaluate(() => {
    const q = document.querySelector('.pila');
    const barra = parseFloat(getComputedStyle(document.body).paddingBottom) || 0;
    return { desborda: document.documentElement.scrollHeight - innerHeight,
             sobra: q ? Math.round(innerHeight - q.getBoundingClientRect().bottom - barra) : null };
  });
  console.log(`${f}  desborda ${hueco.desborda}px  ·  sobra por debajo ${hueco.sobra}px`);
}
await nav.close();
if (fallos.length) { console.log('\nERRORES:\n' + fallos.join('\n')); process.exit(1); }
