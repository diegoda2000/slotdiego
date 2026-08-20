/* Markdown → PDF para los documentos del proyecto.

   Se imprime con Chromium, que es lo que hay a mano y da un resultado decente sin
   arrastrar LaTeX. El tamaño de letra está pensado para leerse en pantalla y en papel,
   no para que quepan pocas páginas: un GDD apretado a 17 páginas no se lee mejor que
   uno holgado de 40, se lee peor.

   Uso:  node herramientas/documentos-a-pdf.mjs [carpeta-de-salida]
*/
import { marked } from '/tmp/claude-0/-home-user-slotdiego/b4a5e0b8-270e-5f10-9132-d74ca2d0c34d/scratchpad/node_modules/marked/lib/marked.esm.js';
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SALIDA = process.argv[2] || 'pdf';
fs.mkdirSync(SALIDA, { recursive: true });

const DOCS = [
  ['docs/actualizado/GDD.md', 'GDD', ''],
  ['docs/actualizado/decisiones-descartadas.md', 'decisiones-descartadas', ''],
  ['docs/actualizado/interfaz.md', 'interfaz', ''],
  ['docs/base-de-datos-peleadores.md', 'base-de-datos-peleadores', 'datos'],
];

const ESTILO = `
:root{--tinta:#16181c;--suave:#555c65;--linea:#d5d9df;--acc:#b4271c;--fondo:#fff;--caja:#f5f6f8}
*{box-sizing:border-box}
body{margin:0;font:12.5pt/1.62 "Source Serif 4",Georgia,"Times New Roman",serif;
  color:var(--tinta);background:var(--fondo)}
h1,h2,h3,h4,h5{font-family:"Helvetica Neue",Arial,sans-serif;line-height:1.22;
  margin:1.5em 0 .5em;font-weight:700}
h1{font-size:26pt;margin-top:0;letter-spacing:-.01em;
  border-bottom:3px solid var(--acc);padding-bottom:.3em}
h2{font-size:17pt;margin-top:2em;color:#000;break-before:auto;
  border-bottom:1px solid var(--linea);padding-bottom:.24em;break-after:avoid}
h3{font-size:13.5pt;margin-top:1.6em;break-after:avoid}
h4{font-size:12pt;margin-top:1.3em;color:#33383f;break-after:avoid}
h5{font-size:11pt;margin-top:1.1em;color:var(--suave);
  text-transform:uppercase;letter-spacing:.06em;break-after:avoid}
p{margin:0 0 .8em;orphans:3;widows:3}
strong{font-weight:700}
em{font-style:italic}
ul,ol{margin:0 0 .9em;padding-left:1.35em}
li{margin-bottom:.3em}
li>ul,li>ol{margin-top:.3em}
hr{border:0;border-top:1px solid var(--linea);margin:2em 0}
code{font-family:"SF Mono",Menlo,Consolas,monospace;font-size:.86em;
  background:var(--caja);padding:.1em .34em;border-radius:3px}
blockquote{margin:1.1em 0;padding:.8em 1.1em;background:var(--caja);
  border-left:3px solid var(--acc);border-radius:0 4px 4px 0;break-inside:avoid}
blockquote p:last-child{margin-bottom:0}
del{color:var(--suave)}
a{color:var(--acc);text-decoration:none}

table{width:100%;border-collapse:collapse;margin:1em 0 1.4em;font-size:10.5pt;
  font-family:"Helvetica Neue",Arial,sans-serif}
thead{display:table-header-group}
tr{break-inside:avoid}
th,td{border:1px solid var(--linea);padding:.42em .55em;text-align:left;vertical-align:top}
th{background:#eaecf0;font-weight:700;font-size:9.5pt;
  text-transform:uppercase;letter-spacing:.03em}
tbody tr:nth-child(even){background:#fafbfc}
td{overflow-wrap:anywhere}

/* La base de datos son 446 filas de doce columnas: se aprieta solo esa, y lo justo
   para que quepa sin partir números. */
body.datos table{font-size:8.6pt}
body.datos th,body.datos td{padding:.26em .34em}
body.datos td:nth-child(n+4):nth-child(-n+9){text-align:center;
  font-variant-numeric:tabular-nums}

.pie{margin-top:2.6em;padding-top:.8em;border-top:1px solid var(--linea);
  font-size:9pt;color:var(--suave);font-family:"Helvetica Neue",Arial,sans-serif}
`;

const nav = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
});
const hoy = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

for (const [src, nombre, clase] of DOCS) {
  if (!fs.existsSync(src)) { console.log(`  (falta ${src}, se salta)`); continue; }
  const cuerpo = marked.parse(fs.readFileSync(src, 'utf8'), { gfm: true, breaks: false });
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8">
    <title>${nombre}</title><style>${ESTILO}</style></head>
    <body class="${clase}">${cuerpo}
    <div class="pie">Jaula Abierta · ${path.basename(src)} · generado el ${hoy}</div>
    </body></html>`;
  const pg = await nav.newPage();
  await pg.setContent(html, { waitUntil: 'load' });
  await pg.emulateMedia({ media: 'print' });
  const destino = `${SALIDA}/${nombre}.pdf`;
  await pg.pdf({ path: destino, format: 'A4', printBackground: true,
    margin: { top: '18mm', bottom: '18mm', left: '17mm', right: '17mm' },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `<div style="width:100%;font:8.5pt Helvetica,Arial,sans-serif;color:#8a9099;
      padding:0 17mm;display:flex;justify-content:space-between">
      <span>${nombre}</span><span class="pageNumber"></span></div>` });
  await pg.close();
  const kb = (fs.statSync(destino).size / 1024).toFixed(0);
  console.log(`  ${nombre}.pdf · ${kb} KB`);
}
await nav.close();
