/* Convierte la base de datos de peleadores (docs/base-de-datos-peleadores.md) en el
   archivo de datos que carga el juego (juego/roster.js).

   Se hace con un importador y no a mano por dos motivos: son 396 cartas, y porque el
   día que la base de datos se actualice hay que poder repetirlo en un segundo sin
   revisar nada. El .md es la fuente; roster.js es un producto y no se toca a mano.

   Uso:  node herramientas/importar-roster.mjs
*/
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(AQUI, '..');
const ENTRADA = path.join(RAIZ, 'docs', 'base-de-datos-peleadores.md');
const SALIDA  = path.join(RAIZ, 'juego', 'roster.js');

// Los nombres de las secciones del documento, a los identificadores de división del juego.
const DIVISIONES = {
  'Peso pesado (M)': 'm7', 'Peso semipesado (M)': 'm6', 'Peso medio (M)': 'm5',
  'Peso welter (M)': 'm4', 'Peso ligero (M)': 'm3',    'Peso pluma (M)': 'm2',
  'Peso gallo (M)': 'm1',  'Peso mosca (M)': 'm0',
  'Peso gallo (F)': 'f2',  'Peso mosca (F)': 'f1',     'Peso paja (F)': 'f0',
};
const STATS = ['golpeo', 'lucha', 'suelo', 'cardio', 'dureza', 'iq'];

/* El atributo viene escrito como en el documento. "Especialista DUREZA" lleva la stat
   pegada; "Camaleón+" es la única versión plus de todo el juego. */
function leerRasgo(txt) {
  const t = txt.trim();
  if (!t || t === '—' || t === '-') return null;
  const plus = t.endsWith('+');
  const base = (plus ? t.slice(0, -1) : t).trim();
  if (base === 'Veterano')  return { tipo: 'veterano', plus };
  if (base === 'Camaleón')  return { tipo: 'camaleon', plus };
  if (base === 'Incómodo')  return { tipo: 'incomodo', plus };
  if (base.startsWith('Especialista')) {
    const stat = base.split(/\s+/)[1].toLowerCase();
    if (!STATS.includes(stat)) throw new Error('stat desconocida en: ' + t);
    return { tipo: 'especialista', plus, stat };
  }
  throw new Error('atributo desconocido: ' + t);
}

/* El ranking viene congelado en la fecha de impresión: C para el campeón, 1-15 para
   los clasificados y — para el resto. Solo en la división donde está rankeado. */
function leerRanking(txt) {
  const t = txt.trim();
  if (!t || t === '—' || t === '-') return null;
  if (t === 'C' || t === 'c') return 0;                 // 0 = campeón
  const n = Number(t);
  if (!Number.isInteger(n) || n < 1 || n > 15) throw new Error('ranking raro: ' + t);
  return n;
}

// Identificador estable para el peleador. Es lo que hace que dos cartas del mismo
// peleador en divisiones distintas no se puedan alinear a la vez.
const idPersona = nombre => nombre.toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const texto = fs.readFileSync(ENTRADA, 'utf8');
const lineas = texto.split('\n');

let division = null, rareza = null;
const cartas = [];

for (const linea of lineas) {
  const sec = linea.match(/^##\s+(.+?)\s*$/);
  if (sec && DIVISIONES[sec[1]]) { division = DIVISIONES[sec[1]]; rareza = null; continue; }
  if (sec) { division = null; continue; }          // secciones que no son divisiones
  const sub = linea.match(/^###\s+(Oro|Plata|Bronce)\s*$/);
  if (sub) { rareza = sub[1].toLowerCase(); continue; }
  if (!division || !rareza) continue;
  if (!linea.startsWith('|')) continue;

  const celdas = linea.split('|').slice(1, -1).map(x => x.trim());
  if (celdas.length < 11) continue;
  if (celdas[0] === 'Peleador' || /^-+$/.test(celdas[1])) continue;   // cabecera y regla

  const nombre = celdas[0].replace(/\*\*/g, '').replace(/◆/g, '').trim();
  const numeros = celdas.slice(3, 9).map(Number);
  if (numeros.some(n => !Number.isFinite(n))) continue;

  const stats = {};
  STATS.forEach((s, i) => { stats[s] = numeros[i]; });
  const rasgo = leerRasgo(celdas[9]);

  cartas.push({
    persona: idPersona(nombre),
    nombre,
    division,
    rareza,
    // El interrogante de "Croacia ?" marca un dato que quien hizo la base de datos no
    // daba por seguro. Se guarda el país sin el signo y se avisa al importar.
    pais: celdas[1].replace(/\s*\?\s*$/, '').trim(),
    paisDudoso: /\?\s*$/.test(celdas[1]),
    rk: leerRanking(celdas[2]),
    stats,
    record: celdas[10].trim(),
    rasgos: rasgo ? [rasgo] : [],
  });
}

/* ── Comprobaciones antes de escribir nada ──
   Un importador que se traga datos rotos y produce un archivo silenciosamente es peor
   que no tener importador: el fallo aparece tres pantallas más allá y sin pistas. */
const fallos = [], avisos = [];
const porDivision = {};
for (const c of cartas) (porDivision[c.division] = porDivision[c.division] || []).push(c);

if (Object.keys(porDivision).length !== 11)
  fallos.push(`faltan divisiones: hay ${Object.keys(porDivision).length} de 11`);
for (const [d, lista] of Object.entries(porDivision)) {
  if (!lista.some(c => c.rareza === 'oro'))   fallos.push(`${d} no tiene ni un oro`);
  if (!lista.some(c => c.rareza === 'plata')) fallos.push(`${d} no tiene ni una plata`);
}
for (const c of cartas) {
  if (c.rareza === 'plata' && c.rasgos.length)
    fallos.push(`${c.nombre} es plata y lleva atributo: solo los oros llevan`);
  for (const s of STATS) if (c.stats[s] < 40 || c.stats[s] > 99)
    fallos.push(`${c.nombre} tiene ${s}=${c.stats[s]}, fuera de rango`);
}
// misma carta dos veces en la misma división
const vistas = new Set();
for (const c of cartas) {
  const k = c.persona + '@' + c.division;
  if (vistas.has(k)) fallos.push(`${c.nombre} aparece dos veces en ${c.division}`);
  vistas.add(k);
}
if (fallos.length) {
  console.error('LA BASE DE DATOS NO CUADRA:');
  for (const f of fallos) console.error('  · ' + f);
  process.exit(1);
}

/* ── Estatus deportivo ──
   Ya no se deduce de nada: sale del ranking que trae la base de datos. Es lo que ordena
   la colección, decide el nivel de cada hueco de oro en los sobres y fija cuántos
   repetidos cuesta una ficha. */
const suma = c => STATS.reduce((a, s) => a + c.stats[s], 0);
for (const c of cartas) {
  if (c.rareza === 'plata') c.estatus = 'plata';
  else if (c.rk === null)   c.estatus = 'oro';          // oro sin rankear
  else if (c.rk === 0)      c.estatus = 'campeon';
  else if (c.rk <= 5)       c.estatus = 'top5';
  else if (c.rk <= 10)      c.estatus = 'top10';
  else                      c.estatus = 'top15';
}

/* Y aquí las comprobaciones que solo se pueden hacer con el ranking delante: un campeón
   por división y ni un puesto repetido. Un ranking con dos números 3 en la misma
   división ordenaría la colección de forma distinta cada vez que se abre el juego. */
for (const [d, lista] of Object.entries(porDivision)) {
  const campeones = lista.filter(c => c.rk === 0);
  if (campeones.length !== 1)
    fallos.push(`${d} tiene ${campeones.length} campeones, tiene que haber exactamente 1`);
  const puestos = lista.filter(c => c.rk).map(c => c.rk);
  const repes = puestos.filter((n, i) => puestos.indexOf(n) !== i);
  if (repes.length) fallos.push(`${d} repite los puestos ${[...new Set(repes)].join(', ')}`);
  /* Una plata rankeada contradice la regla de rareza de la propia base de datos, que ya
     lo recoge como pendiente. NO se corrige aquí: promocionarla a oro sería cambiarle la
     carta al jugador por decisión de un importador. Se respeta la rareza que trae el
     documento, el ranking se ignora para el orden —la plata va última, y punto— y se
     avisa al importar para que no se olvide. */
  for (const c of lista) if (c.rareza === 'plata' && c.rk !== null) avisos.push(
    `${c.nombre} (${d}) es plata y va rankeada #${c.rk}. Se queda plata; el ranking no cuenta para el orden.`);
}
if (fallos.length) {
  console.error('EL RANKING NO CUADRA:');
  for (const f of fallos) console.error('  · ' + f);
  process.exit(1);
}
for (const c of cartas) if (c.rareza === 'plata') c.rk = null;   // el orden lo manda la rareza

// Peleadores con carta en más de una división: candidatos naturales al Camaleón.
const enVarias = new Set();
const cuenta = {};
for (const c of cartas) cuenta[c.persona] = (cuenta[c.persona] || 0) + 1;
for (const [p, n] of Object.entries(cuenta)) if (n > 1) enVarias.add(p);

cartas.forEach((c, i) => {
  c.id = 'u' + String(i).padStart(3, '0');
  c.dobleDiv = enVarias.has(c.persona);
  c.suma = suma(c);
});

const resumen = {};
for (const c of cartas) resumen[c.estatus] = (resumen[c.estatus] || 0) + 1;
const rasgos = {};
for (const c of cartas) for (const r of c.rasgos) rasgos[r.tipo + (r.plus ? '+' : '')] = (rasgos[r.tipo + (r.plus ? '+' : '')] || 0) + 1;

const cabecera = `/* CATÁLOGO DE PELEADORES — GENERADO, NO SE EDITA A MANO.

   Sale de docs/base-de-datos-peleadores.md pasándolo por herramientas/importar-roster.mjs.
   Si hay que cambiar un número, se cambia en el .md y se vuelve a importar: editar aquí
   se pierde en la siguiente importación.

   ${cartas.length} cartas · ${new Set(cartas.map(c => c.persona)).size} peleadores
   ${Object.entries(resumen).map(([k, v]) => k + ' ' + v).join(' · ')}
   atributos: ${Object.entries(rasgos).map(([k, v]) => k + ' ' + v).join(' · ')}

   El campo `+'`suma`'+` es la suma de las seis stats. Solo ordena empates dentro de un mismo
   estatus: no se enseña nunca y no interviene en ningún duelo. */
`;

const cuerpo = cartas.map(c => JSON.stringify({
  id: c.id, persona: c.persona, nombre: c.nombre, division: c.division,
  rareza: c.rareza, estatus: c.estatus, rk: c.rk, pais: c.pais,
  suma: c.suma, record: c.record,
  dobleDiv: c.dobleDiv, stats: c.stats, rasgos: c.rasgos,
})).join(',\n');

fs.writeFileSync(SALIDA,
  cabecera + '(function(raiz){\n"use strict";\nraiz.ROSTER_DATOS=[\n' + cuerpo +
  '\n];\n})(typeof globalThis!==\'undefined\'?globalThis:this);\n');

for (const a of avisos) console.log('  ⚠ ' + a);
console.log(`${cartas.length} cartas escritas en juego/roster.js`);
console.log('  ' + Object.entries(resumen).map(([k, v]) => `${k} ${v}`).join(' · '));
console.log('  atributos: ' + Object.entries(rasgos).map(([k, v]) => `${k} ${v}`).join(' · '));
console.log('  peleadores en varias divisiones: ' + enVarias.size);
const paises = new Set(cartas.map(c => c.pais));
console.log(`  países: ${paises.size} · cartas rankeadas: ${cartas.filter(c => c.rk !== null).length}`);
const dudosos = cartas.filter(c => c.paisDudoso);
if (dudosos.length) console.log('  ⚠ país marcado como dudoso en la base de datos: ' +
  dudosos.map(c => `${c.nombre} (${c.pais})`).join(', '));
