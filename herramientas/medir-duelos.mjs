/* ¿QUÉ LE HACE AL COMBATE LA CALIBRACIÓN DE LAS STATS?

   La tabla de márgenes de motor.js —finish 10, decisión 4— se afinó contra la escala
   ROTA: con GOLPEO entre 80 y 89, un margen de 10 era imposible. Al abrir la escala a
   cuarenta y tantos puntos, esa misma tabla convierte casi cada duelo en un finish.

   Esto lo mide antes de escribir nada: monta plantillas como las monta el juego —la del
   rival apunta a la media de la tuya, que es lo que de verdad aprieta los duelos— y
   cuenta cómo caen los seis duelos de un combate con las stats de ahora y con las nuevas.

   Uso:  node herramientas/medir-duelos.mjs [finish decision]
*/
import fs from 'fs';
import { plantelCalibrado } from './calibrar-stats.mjs';

const raiz = globalThis;
new Function(fs.readFileSync('juego/motor.js', 'utf8')).call(raiz);
new Function(fs.readFileSync('juego/roster.js', 'utf8')).call(raiz);
raiz.generarRoster();

const STATS = ['golpeo', 'lucha', 'suelo', 'cardio', 'dureza', 'iq'];
const CORTO = { golpeo: 'gol', lucha: 'luc', suelo: 'sue', cardio: 'car', dureza: 'dur', iq: 'iq' };

/* El plantel calibrado, indexado por peleador+división para poder pegárselo al ROSTER. */
const nuevo = new Map();
for (const f of plantelCalibrado()) nuevo.set(f.nombre + '·' + f.division, f.nuevas);

/* El nombre de la división en el documento no es el de motor.js: allí lleva tilde
   ("wélter") y las tres femeninas acaban en " f". Sin deshacer eso, el emparejamiento
   no encontraba NI UNA carta y la baraja "calibrada" salía idéntica a la de ahora. */
const NOMBRE_DIV = {};
for (const d of raiz.DIVISIONES) {
  const n = d.n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ f$/, '');
  NOMBRE_DIV[d.id] = `Peso ${n} (${d.g})`;
}

/* Dos barajas: la de ahora y la calibrada, con TODO lo demás igual. */
let avisado = false;
function baraja(calibrada) {
  if (calibrada && !avisado) {
    const sin = raiz.ROSTER.filter(c => !nuevo.get(c.nombre + '·' + NOMBRE_DIV[c.division]));
    avisado = true;
    if (sin.length) { console.error(`\n  ¡OJO! ${sin.length} cartas sin calibrar (p.ej. ${sin[0].nombre} / ${NOMBRE_DIV[sin[0].division]}). La medición no vale.\n`); process.exit(1); }
  }
  return raiz.ROSTER.map(c => {
    if (!calibrada) return c;
    const n = nuevo.get(c.nombre + '·' + NOMBRE_DIV[c.division]);
    if (!n) return c;
    const stats = {}; let suma = 0;
    for (const s of STATS) { stats[s] = n[CORTO[s]]; suma += stats[s]; }
    return { ...c, stats, suma };
  });
}

/* La del rival, igual que plantillaIA: apunta a la media de la tuya y se queda con uno
   de los cinco más cercanos, sin repetir persona. */
function plantillaIA(pool, objetivo, fuera) {
  const out = {}, personas = new Set(fuera);
  for (const d of raiz.DIVISIONES) {
    const p = pool.filter(c => c.division === d.id && c.alineable && !personas.has(c.persona));
    if (!p.length) continue;
    p.sort((a, b) => Math.abs(a.suma - objetivo) - Math.abs(b.suma - objetivo));
    const c = p[Math.floor(Math.random() * Math.min(5, p.length))];
    out[d.id] = c; personas.add(c.persona);
  }
  return out;
}

/* Tres jugadores distintos, porque el margen depende de con qué juegues: el que acaba de
   instalar tira de lo que le salga, y el que lleva meses alinea a los mejores. */
const PERFILES = {
  'recién llegado': p => p.filter(c => c.rk === null || c.rk === undefined),
  'a medias':       p => p.filter(c => c.rk === null || c.rk === undefined || c.rk > 5),
  'plantillón':     p => p,
};
function plantillaJugador(pool, filtro) {
  const out = {}, personas = new Set();
  for (const d of raiz.DIVISIONES) {
    const p = filtro(pool).filter(c => c.division === d.id && c.alineable && !personas.has(c.persona));
    if (!p.length) continue;
    p.sort((a, b) => b.suma - a.suma);
    const c = p[Math.floor(Math.random() * Math.min(3, p.length))];
    out[d.id] = c; personas.add(c.persona);
  }
  return out;
}

/* Un combate son seis duelos: se van gastando divisiones y stats, igual que en el juego. */
function combate(pj, pr) {
  const divs = Object.keys(pj).filter(d => pr[d]);
  const libres = divs.slice(), vivas = STATS.slice(), out = [];
  for (let i = 0; i < 6 && libres.length && vivas.length; i++) {
    const d = libres.splice(Math.floor(Math.random() * libres.length), 1)[0];
    const s = vivas.splice(Math.floor(Math.random() * vivas.length), 1)[0];
    out.push(Math.abs(pj[d].stats[s] - pr[d].stats[s]));
  }
  return out;
}

const FIN = Number(process.argv[2]) || raiz.MARGENES.finish;
const DEC = Number(process.argv[3]) || raiz.MARGENES.decision;
const N = 20000;

function medir(calibrada) {
  const pool = baraja(calibrada);
  const filas = [];
  for (const [etiqueta, filtro] of Object.entries(PERFILES)) {
    const ms = [];
    for (let i = 0; i < N; i++) {
      const pj = plantillaJugador(pool, filtro);
      const suma = Object.values(pj).reduce((a, c) => a + c.suma, 0) / Object.keys(pj).length;
      const pr = plantillaIA(pool, Math.round(suma) + Math.floor(Math.random() * 25) - 12,
        Object.values(pj).map(c => c.persona));
      ms.push(...combate(pj, pr));
    }
    const n = ms.length;
    const pct = f => (100 * ms.filter(f).length / n).toFixed(1).padStart(6) + '%';
    filas.push([etiqueta,
      pct(m => m >= FIN), pct(m => m >= DEC && m < FIN),
      pct(m => m > 0 && m < DEC), pct(m => m === 0),
      (ms.reduce((a, b) => a + b, 0) / n).toFixed(1).padStart(6)]);
  }
  return filas;
}

console.log(`\n  Umbrales medidos:  finish ≥ ${FIN}   ·   decisión ≥ ${DEC}   ·   ${N} combates por perfil\n`);
for (const [titulo, cal] of [['STATS DE AHORA', false], ['STATS CALIBRADAS', true]]) {
  console.log('  ' + titulo);
  console.log('    perfil            finish  decisión   reñido   empate   margen medio');
  for (const f of medir(cal))
    console.log('    ' + f[0].padEnd(16) + f[1] + '   ' + f[2] + '  ' + f[3] + '  ' + f[4] + '   ' + f[5]);
  console.log('');
}
