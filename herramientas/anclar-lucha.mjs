/* Reconstruye LUCHA, que estaba midiendo otra cosa.

   EL DIAGNÓSTICO
   LUCHA es, según el GDD, "imponer dónde se pelea: derribos Y DEFENSA DE DERRIBO", y se
   calcula con "derribos por 15 min × precisión + defensa de derribo". Los datos solo
   recogieron la primera mitad. Se nota en tres sitios:

     1. El suelo de la banda es un vertedero: 77 de 244 cartas de oro en 74 clavado,
        un 32%. El techo, después de corregirlo, lo tocan menos del 2%.
     2. LUCHA no correlaciona con SUELO. Media de LUCHA para SUELO 74-77: 77,8. Para
        SUELO 85-89: 79,8. Dos puntos. Un sumisionista y un pegador puro puntúan igual
        en la stat que mide llevar la pelea al suelo, lo cual es imposible.
     3. Los casos concretos son absurdos. Mackenzie Dern —campeona y cinturón negro de
        BJJ— tiene 74. Aljamain Sterling, luchador de cadena, 74. Reinier de Ridder,
        doble campeón de ONE por sumisión, 74. Y Justin Gaethje, que fue All-American
        de lucha en la NCAA, 74.

   Es el mismo error que el propio documento ya había cazado en DUREZA: "el primer
   cálculo penalizaba recibir golpes y dejaba a Gaethje en el suelo de la banda. Es al
   revés". Aquí pasa igual con la defensa de derribo.

   LA CORRECCIÓN, en tres capas y en este orden

   A. COHERENCIA INTERNA, con los datos que ya hay. Quien domina el suelo tiene que
      llegar a él: LUCHA no puede quedar más de 7 puntos por debajo de SUELO. Esto sale
      de la propia base, no de mi opinión.

   B. ANCLAJES DE CRITERIO. Es lo que el GDD pide literalmente —"los datos ordenan, el
      criterio ancla"— y lo único que arregla la defensa de derribo, porque ese dato no
      está en la base. La lista de abajo es explícita y auditable: cada número es un
      juicio sobre lo que ese peleador hace en la jaula, y se puede discutir uno a uno.

   C. SUELO PARA LOS QUE NO SE JUZGAN. Un peleador clasificado entre los quince mejores
      del mundo no tiene CERO defensa de derribo. A los rankeados que no llevan anclaje
      se les sube al 77, que es "no es su terreno" en vez de "es indefenso". El 74-75
      queda para quien de verdad lo merece.

   Uso:  node herramientas/anclar-lucha.mjs [--simular]
*/
import fs from 'fs';

const RUTA = 'docs/base-de-datos-peleadores.md';
const SIMULAR = process.argv.includes('--simular');

/* ── B. Los anclajes ──────────────────────────────────────────────────────────
   LUCHA junta derribar y que no te derriben. Un pegador con defensa de derribo
   excelente pertenece a la mitad alta de esta stat, no al suelo: Adesanya lleva
   media carrera sin que lo controlen contra la jaula, y eso es exactamente lo que
   LUCHA dice medir.

   Solo entran peleadores cuyo juego de lucha conozco lo bastante como para poner un
   número y defenderlo. El resto no se toca aquí: cae en la capa C o se queda como
   está. Preferible un hueco honesto a un número inventado. */
const ANCLAS = {
  // Luchadores y sumisionistas puestos en el suelo por la fórmula
  'Aljamain Sterling': 86,      // lucha de cadena, ex campeón de gallo
  'Reinier de Ridder': 86,      // doble campeón de ONE, sumisionista
  'Merab Dvalishvili': 89,      // el mayor volumen de derribos de la división
  'Khamzat Chimaev': 88,
  'Islam Makhachev': 88,
  'Charles Oliveira': 82,       // no derriba mucho, pero el suelo es suyo
  'Mackenzie Dern': 80,         // cinturón negro mundial de BJJ
  'Gillian Robertson': 82,      // récord de sumisiones en la división femenina
  'Brendan Allen': 82,
  'Brian Ortega': 81,
  'Deiveson Figueiredo': 82,
  'Karine Silva': 81,
  'Roman Dolidze': 82,          // sambo de combate
  'Miesha Tate': 82,
  'Julianna Pena': 80,
  'Amir Albazi': 80,
  'Renato Moicano': 81,
  'Diego Lopes': 80,
  'Paddy Pimblett': 80,
  'Youssef Zalal': 80,
  'Brandon Royval': 80,
  'Nikita Krylov': 80,
  'Miranda Maverick': 81,
  'Joe Pyfer': 80,
  'Maycee Barber': 80,
  'Edgar Chairez': 80,

  // Defensa de derribo de élite, sin apenas derribo propio: la mitad alta
  'Justin Gaethje': 84,         // All-American de lucha en la NCAA
  'Alexander Volkanovski': 84,
  'Israel Adesanya': 82,
  'Max Holloway': 82,
  'Leon Edwards': 82,           // frenó a Usman y a Covington
  'Sean Strickland': 81,
  'Jared Cannonier': 81,
  'Cory Sandhagen': 80,
  'Paulo Costa': 80,
  'Alonzo Menifield': 79,
  'Alex Pereira': 79,

  // Defensa media
  'Alexander Volkov': 78,
  'Waldo Cortes-Acosta': 78,
  'Derrick Lewis': 78,
  'Marlon Vera': 78,
  'Yair Rodriguez': 78,
  'Jack Della Maddalena': 78,
  'Ian Machado Garry': 78,
  'Kevin Holland': 78,
  'Steve Erceg': 78,
  'Alexa Grasso': 78,
  'Raquel Pennington': 78,
  'Amanda Lemos': 78,
  'Lerone Murphy': 80,

  // Defensa floja de verdad: estos sí van abajo, y ahora significa algo
  'Sean O\'Malley': 77,
  'Manel Kape': 77,
  'Jiri Prochazka': 77,
  'Sergei Pavlovich': 77,
  'Ciryl Gane': 76,             // lo derribaron Ngannou y Jones
  'Khalil Rountree Jr.': 76,
  'Johnny Walker': 76,
  'Bogdan Guskov': 76,
  'Jamahal Hill': 77,
  'Angela Hill': 76,
  'Michael Page': 75,           // el caso claro de suelo merecido
};

const SUELO_RANKEADO = 77;   // capa C
const MARGEN_SUELO = 7;      // capa A: LUCHA >= SUELO - 7

const lineas = fs.readFileSync(RUTA, 'utf8').split('\n');

let banda = null;
const filas = [];
lineas.forEach((ln, i) => {
  const cab = ln.match(/^###\s+(Oro|Plata)\s*$/);
  if (cab) { banda = cab[1].toLowerCase(); return; }
  if (!ln.startsWith('| **') || banda !== 'oro') return;
  const p = ln.slice(1, -1).split('|').map(x => x.trim());
  if (p.length < 11) return;
  const stats = p.slice(3, 9).map(Number);
  if (stats.some(Number.isNaN)) return;
  filas.push({ i, p, stats, nombre: p[0].replace(/\*\*/g, '').replace('◆', '').trim(), rk: p[2] });
});

const techo = rk => {
  if (rk === 'C') return 89;
  if (rk === '' || rk === '—' || rk === '-') return 85;
  const n = Number(rk);
  return n <= 5 ? 88 : n <= 10 ? 87 : 86;
};
// El techo, por el mejor puesto del peleador entre todas sus cartas (regla del GDD §2.6)
const mejor = new Map();
for (const f of filas) mejor.set(f.nombre, Math.max(mejor.get(f.nombre) || 0, techo(f.rk)));

const rankeado = rk => rk !== '' && rk !== '—' && rk !== '-';
let porAncla = 0, porSuelo = 0, porCoherencia = 0;
const ejemplos = [];

for (const f of filas) {
  const antes = f.stats[1];
  let v = antes;
  let via = null;

  if (ANCLAS[f.nombre] !== undefined) { v = ANCLAS[f.nombre]; via = 'anclaje'; }
  else {
    const minPorSuelo = f.stats[2] - MARGEN_SUELO;
    if (v < minPorSuelo) { v = minPorSuelo; via = 'coherencia con SUELO'; }
    if (rankeado(f.rk) && v < SUELO_RANKEADO) { v = SUELO_RANKEADO; via = 'suelo de rankeado'; }
  }

  v = Math.max(74, Math.min(mejor.get(f.nombre) || 85, v));
  if (v === antes) continue;

  if (via === 'anclaje') porAncla++;
  else if (via === 'coherencia con SUELO') porCoherencia++;
  else porSuelo++;

  if (ejemplos.length < 14) ejemplos.push({ ...f, antes, ahora: v, via });
  const p = f.p.slice();
  p[4] = String(v);
  lineas[f.i] = '| ' + p.join(' | ') + ' |';
  f.stats[1] = v;
}

console.log(`${filas.length} cartas de oro leídas\n`);
console.log(`  por anclaje de criterio ....... ${porAncla}`);
console.log(`  por coherencia con SUELO ...... ${porCoherencia}`);
console.log(`  por suelo de rankeado ......... ${porSuelo}`);
console.log(`  total ......................... ${porAncla + porCoherencia + porSuelo}\n`);
for (const e of ejemplos) {
  const rk = e.rk === 'C' ? 'C' : (rankeado(e.rk) ? '#' + e.rk : '—');
  console.log(`  ${rk.padStart(4)}  ${e.nombre.slice(0, 24).padEnd(26)} ${e.antes} → ${e.ahora}   (${e.via})`);
}

if (SIMULAR) { console.log('\n(simulación: no se ha escrito nada)'); process.exit(0); }
fs.writeFileSync(RUTA, lineas.join('\n'));
console.log(`\nEscrito en ${RUTA}`);
