/* Trae los apodos que faltan desde ufcstats.com y los mete en docs/apodos.json.

   HAY QUE EJECUTARLA EN UNA MÁQUINA CON INTERNET NORMAL. El proxy de la sesión de Claude
   tiene lista blanca —GitHub, npm, PyPI, Google Fonts— y deniega ufcstats.com,
   ufc.com, sherdog.com y hasta Wikipedia, así que desde ahí no se puede comprobar ni uno.
   Es el mismo problema que tiene importar-fotos.mjs, y se resuelve igual: la ejecutas tú.

   De dónde salen. ufcstats.com publica el listado completo por letra inicial del apellido,
   y cada fila trae nombre, apellido y APODO en columnas. Es la fuente que usa todo el
   mundo para esto y no pide clave.

   QUÉ HACE Y QUÉ NO HACE. Sólo AÑADE los que faltan: no toca los que ya están escritos a
   mano en docs/apodos.json, que son los que aprobó el dueño. Y no inventa nada: quien no
   tenga apodo en la fuente se queda sin él, que es lo correcto —inventarle uno a alguien
   es peor que dejarlo vacío—.

   Después hay que volver a generar el plantel, que es quien mezcla los apodos:
     node herramientas/importar-roster.mjs

   Uso:
     node herramientas/importar-apodos.mjs            # los trae y los escribe
     node herramientas/importar-apodos.mjs --ver      # sólo los enseña, no escribe nada
*/
import fs from 'fs';

const APODOS = 'docs/apodos.json';
const ROSTER = 'juego/roster.js';
const SOLO_VER = process.argv.includes('--ver');
const LETRAS = 'abcdefghijklmnopqrstuvwxyz'.split('');

/* La clave de un peleador es su nombre en minúsculas, sin acentos y con guiones: es como
   se construye `persona` en el plantel, así que las dos tienen que salir igual. */
const clave = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/['’.]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const quienesHay = () => {
  const t = fs.readFileSync(ROSTER, 'utf8');
  return new Set([...t.matchAll(/"persona":"([^"]+)"/g)].map(m => m[1]));
};

/* La tabla de ufcstats: filas con nombre, apellido y apodo en las tres primeras columnas.
   Se lee con expresiones regulares y no con un analizador de HTML para no meter una
   dependencia por esto: la tabla es plana y no cambia de forma. */
async function deLaLetra(c) {
  const url = `http://ufcstats.com/statistics/fighters?char=${c}&page=all`;
  const r = await fetch(url, { headers: { 'user-agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`${c}: ${r.status}`);
  const html = await r.text();
  const filas = html.split('<tr').slice(1);
  const out = [];
  for (const f of filas) {
    const celdas = [...f.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)]
      .map(m => m[1].replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim());
    if (celdas.length < 3) continue;
    const [nombre, apellido, apodo] = celdas;
    if (!nombre && !apellido) continue;
    if (!apodo) continue;
    out.push({ persona: clave(`${nombre} ${apellido}`), apodo: apodo.toUpperCase() });
  }
  return out;
}

const per = quienesHay();
const ap = JSON.parse(fs.readFileSync(APODOS, 'utf8'));
const yaTiene = new Set(Object.keys(ap).filter(k => !k.startsWith('_')));

const nuevos = {};
for (const c of LETRAS) {
  process.stdout.write(`  ${c}…`);
  let filas = [];
  try { filas = await deLaLetra(c); }
  catch (e) { console.log(` ${e.message}`); continue; }
  let n = 0;
  for (const { persona, apodo } of filas) {
    if (!per.has(persona) || yaTiene.has(persona) || nuevos[persona]) continue;
    nuevos[persona] = apodo; n++;
  }
  console.log(` ${filas.length} con apodo, ${n} nuevos`);
}

const lista = Object.entries(nuevos).sort();
console.log(`\n${lista.length} apodos nuevos:`);
for (const [k, v] of lista) console.log(`  ${k.padEnd(28)} ${v}`);
console.log(`\n${yaTiene.size} tenía ya · ${yaTiene.size + lista.length} de ${per.size} al terminar`);

if (SOLO_VER) { console.log('\n--ver: no se ha escrito nada.'); process.exit(0); }
if (!lista.length) { console.log('\nNada que añadir.'); process.exit(0); }

const t = fs.readFileSync(APODOS, 'utf8');
const i = t.lastIndexOf('}');
const bloque = '\n  "_deUfcstats": "Traídos por herramientas/importar-apodos.mjs.",\n'
  + lista.map(([k, v]) => `  "${k}": ${JSON.stringify(v)},\n`).join('');
const salida = t.slice(0, i).trimEnd().replace(/,$/, '') + ',\n'
  + bloque.trimEnd().replace(/,$/, '') + '\n' + t.slice(i);
JSON.parse(salida);
fs.writeFileSync(APODOS, salida);
console.log(`\nEscrito ${APODOS}. Ahora: node herramientas/importar-roster.mjs`);
