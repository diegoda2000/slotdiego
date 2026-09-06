/* MONTA UNA PÁGINA SUELTA CON LAS TRES CARTAS, para poder ver el resplandor EN MARCHA.

   Una foto fija no enseña una animación. Esto saca un HTML de un solo archivo —marcos,
   luces, foto, bandera y fuente metidos dentro como data: URI— que se abre en cualquier
   sitio, sin servidor y sin el resto del juego.

   NO REESCRIBE LA CARTA. El CSS y el HTML salen del propio juego.html: se carga en
   Chromium, se le pide `cartaHTML()` para cada rareza y se copia su hoja de estilos tal
   cual. Así la maqueta no puede separarse de lo que se ve en el juego, que es el fallo
   clásico de tener una maqueta a mano.

   Uso:  node herramientas/maqueta-rarezas.mjs [salida.html] [peleador]
*/
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SALIDA = process.argv[2] || '/tmp/rarezas/maqueta-rarezas.html';
const QUIEN = process.argv[3] || 'Ilia Topuria';

const TIPOS = { webp: 'image/webp', png: 'image/png', jpg: 'image/jpeg',
  woff2: 'font/woff2', svg: 'image/svg+xml' };
function comoDato(rel) {
  const f = path.join('juego', rel);
  if (!fs.existsSync(f)) return null;
  const ext = rel.split('.').pop().toLowerCase();
  return `data:${TIPOS[ext] || 'application/octet-stream'};base64,${fs.readFileSync(f).toString('base64')}`;
}

const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const navegador = await chromium.launch({
  args: ['--blink-settings=minimumFontSize=8,minimumLogicalFontSize=8', '--allow-file-access-from-files'],
  ...(fs.existsSync(exe) ? { executablePath: exe } : {}),
});
const pg = await navegador.newPage({ viewport: { width: 1200, height: 900 } });
await pg.goto('file://' + path.resolve('juego/juego.html'));
await pg.waitForFunction(() => typeof window.cartaHTML === 'function');

const { css, cartas, nombre } = await pg.evaluate((quien) => {
  const c = ROSTER.find(x => x.nombre === quien) || ROSTER[0];
  const cartas = {};
  for (const rz of ['comun', 'raro', 'epico'])
    cartas[rz] = { frente: cartaHTML(c, { rareza: rz }), dorso: cartaHTML(c, { rareza: rz, oculta: true }) };
  return { css: [...document.querySelectorAll('style')].map(s => s.textContent).join('\n'),
    cartas, nombre: c.nombre };
}, QUIEN);
await navegador.close();

/* Todo lo que el CSS y el HTML piden por su ruta, metido dentro del archivo. */
let fuera = 0, dentro = 0;
const meter = txt => txt.replace(/(url\(|src=")([^)"']+?)(\)|")/g, (todo, a, ruta, b) => {
  if (/^(data:|https?:)/.test(ruta)) return todo;
  const d = comoDato(ruta.replace(/^['"]|['"]$/g, ''));
  if (!d) { fuera++; return todo; }
  dentro++;
  return a + d + b;
});

// Por `meter` pasan LOS DOS: la hoja de estilos trae los marcos y las fuentes, pero la
// foto del peleador y la bandera van en el HTML de la carta. Sin esto salían rotas.
const bloque = (rz, et) => meter(`<figure class="uno">
    <div class="par">
      <div class="sitio">${cartas[rz].frente}</div>
      <div class="sitio">${cartas[rz].dorso}</div>
    </div>
    <figcaption>${et}</figcaption>
  </figure>`);

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>P4P.CG · las tres cartas</title>
<style>
${meter(css)}
body{margin:0;background:#060707;color:#f0f0f1;font-family:var(--titulo),system-ui,sans-serif;
  padding:22px 14px 40px}
h1{font-size:19px;letter-spacing:.22em;text-transform:uppercase;text-align:center;
  color:#a4a5a8;font-weight:600;margin:0 0 6px}
.pie{text-align:center;color:#76777a;font-family:var(--texto),system-ui,sans-serif;
  font-size:13px;margin:0 auto 26px;max-width:640px;line-height:1.5}
.todo{display:flex;flex-wrap:wrap;justify-content:center;gap:26px 30px;align-items:flex-start}
.uno{margin:0;display:flex;flex-direction:column;align-items:center;gap:11px}
.par{display:flex;gap:12px}
.sitio{width:min(40vw,260px)}
figcaption{font-size:15px;letter-spacing:.24em;color:#a4a5a8;font-weight:600}
</style></head><body>
<h1>Las tres cartas base</h1>
<p class="pie">${nombre}, la misma carta en común, rara y épica. El resplandor de las dos
nuevas late en sus propias zonas, con su color y sin moverse de sitio: ciclo de 3,6 s.</p>
<div class="todo">
  ${bloque('comun', 'COMÚN')}
  ${bloque('raro', 'RARA')}
  ${bloque('epico', 'ÉPICA')}
</div>
<script>
/* medirCartas() del juego, reducido a lo que hace falta aquí: la carta se maqueta a 620 px
   y se encoge con --k. Se mide con offsetWidth y NO con getBoundingClientRect, que
   devuelve el ancho YA TRANSFORMADO. */
function medir(){for(const c of document.querySelectorAll('.carta')){
  const a=c.offsetWidth; if(a) c.style.setProperty('--k', a/620);}}
addEventListener('resize', medir); medir(); setTimeout(medir, 60);
</script>
</body></html>`;

fs.mkdirSync(path.dirname(SALIDA), { recursive: true });
fs.writeFileSync(SALIDA, html);
console.log(`  ${SALIDA}  ${(fs.statSync(SALIDA).size / 1048576).toFixed(2)} MB`
  + `  ·  ${dentro} recursos metidos dentro, ${fuera} sin encontrar`);
