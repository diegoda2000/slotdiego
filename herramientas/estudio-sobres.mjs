/* LOS SOBRES CON LAS TRES RAREZAS: propuesta y medición.

   Lo pidió él: "actualiza los porcentajes de los sobres, de forma que ahora aparte de
   rankeados o no rankeados también tengan probabilidad épicos y raros ... pero
   equilibrando todo lo que hay".

   LO PRIMERO ES QUE LAS DOS COSAS NO SON INDEPENDIENTES. Contando lo que de verdad existe
   (peleador x división x rareza), que es lo que ya calcula importar-roster.mjs:

                sinrank  12-15   6-11  corona   TOTAL
     común        224     44     66     68      402
     rara          38     44     66     68      216
     épica          0      0      0     68       68

   O sea: UNA ÉPICA ES SIEMPRE UN CAMPEÓN O TOP 5 —no hay épicas de nadie más—, y una rara
   sólo existe para los rankeados y para los 38 destacados (ex campeones y nombres grandes
   sin cinturón). Así que no se puede sortear "rareza" y "ranking" por separado y ya: la
   mitad de las combinaciones no existen.

   POR ESO SE SORTEA EN DOS PASOS: primero la RAREZA y después el TRAMO DENTRO DE ESA
   RAREZA. Los dos porcentajes que se le enseñan al jugador son entonces verdad exacta, sin
   redondeos ni "es que si sale un tramo que no existe se reintenta".

   Y LA RARA DEL SOBRE COMÚN ES CASI SIEMPRE UN DESTACADO, no un rankeado. No es un
   capricho: el sobre común es GRATIS Y SIN LÍMITE, y la venta paga por RANKING. Si el
   gratis empezara a soltar rankeados, el bucle de abrir-y-vender se volvería rentable y
   se rompe la economía —hay una comprobación en la suite que lo sujeta—. Con el destacado
   la emoción sube (te sale un Conor con marco azul) y el ranking medio del sobre no se
   mueve un milímetro.

   Uso:  node herramientas/estudio-sobres.mjs [nSobres]
*/
import fs from 'fs';

const raiz = globalThis;
new Function(fs.readFileSync('juego/motor.js', 'utf8')).call(raiz);
new Function(fs.readFileSync('juego/roster.js', 'utf8')).call(raiz);

const N = Number(process.argv[2]) || 200000;
const TRAMOS = ['sinrank', 'top1215', 'top611', 'corona'];
const ET = { sinrank: 'Sin ranking', top1215: 'Top 12-15', top611: 'Top 6-11', corona: 'Campeón o Top 5' };
const RAREZAS = ['comun', 'rara', 'epica'];

/* El catálogo de verdad: cuántas cartas hay de cada rareza y tramo. */
const nivelDe = c => (c.rk === 0 || (c.rk >= 1 && c.rk <= 5)) ? 'corona'
  : (c.rk >= 6 && c.rk <= 11) ? 'top611'
  : (c.rk >= 12 && c.rk <= 15) ? 'top1215' : 'sinrank';
const bolsa = {};
for (const c of raiz.ROSTER_DATOS)
  for (const r of (c.base || ['comun'])) ((bolsa[r] ||= {})[nivelDe(c)] ||= []).push(c);

/* ── LA PROPUESTA ────────────────────────────────────────────────────────────────────
   `rarezas` es el primer sorteo y `tramos` el segundo, uno por rareza. La épica no lleva
   tramos porque sólo existe corona: sale sola. */
export const SOBRES = {
  /* EL COMÚN ES GRATIS Y SIN LÍMITE, así que su reparto de RANKING no se toca ni un
     decimal: es exactamente el que él aprobó —98,400 / 1,500 / 0,092 / 0,008—, y está
     resuelto a mano para que salga clavado sumando los dos caminos. Lo único que cambia es
     que ahora casi un 4% de sus cartas viene con marco azul, y casi siempre es un
     DESTACADO: un ex campeón o un nombre grande sin ranking. Sube la emoción sin mover la
     economía. Y la única épica que da es un campeón, con la misma frecuencia que antes
     tenía un campeón a secas. */
  comun: { n: 'Sobre común', coste: 0, cartas: 5,
    rarezas: { comun: 96.000, rara: 3.995, epica: 0.005 },
    tramos: {
      comun: { sinrank: 98.526, top1215: 1.396, top611: 0.075, corona: 0.003 },
      rara:  { sinrank: 95.495, top1215: 4.000, top611: 0.500, corona: 0.005 },
    } },
  /* De aquí para arriba SÍ suben los tramos, y tiene que ser así: una épica es siempre un
     campeón o top 5, así que meter épicas sube el ranking del sobre por definición. Se ha
     dejado subir poco en el raro y más en cada escalón. */
  /* LA RARA BAJA EN LOS DOS, y lo pidió él mirando cuántas trae un sobre: "que haya
     probabilidad de que te toque una o dos raras, pero que es muy difícil o imposible
     prácticamente que todas sean raras". El épico traía TRES O MÁS el 60% de las veces.

     Y AL BAJARLA SE COMPENSA EN LA CARTA COMÚN, porque si no el sobre pierde potencia: la
     rara es la que trae rankeados, así que quitando raras baja también el ranking. Los
     números de la columna común están resueltos para que el reparto de RANKING del sobre
     salga igual que antes de bajar la rara. Lo que cambia es cuántos marcos azules ves,
     no lo bueno que es el sobre. */
  raro: { n: 'Sobre raro', coste: 1200, cartas: 6,
    rarezas: { comun: 88.30, rara: 11.40, epica: 0.30 },
    tramos: {
      comun: { sinrank: 79.728, top1215: 16.173, top611: 3.757, corona: 0.342 },
      rara:  { sinrank: 55.000, top1215: 30.000, top611: 13.000, corona: 2.000 },
    } },
  epico: { n: 'Sobre épico', coste: 3800, cartas: 8,
    rarezas: { comun: 79.20, rara: 19.30, epica: 1.50 },
    tramos: {
      comun: { sinrank: 53.386, top1215: 29.629, top611: 14.407, corona: 2.578 },
      rara:  { sinrank: 26.000, top1215: 38.000, top611: 30.000, corona: 6.000 },
    } },
  legendario: { n: 'Sobre legendario', coste: 7000, cartas: 10, pronto: true,
    rarezas: { comun: 47.0, rara: 47.0, epica: 6.0 },
    tramos: {
      comun: { sinrank: 38.000, top1215: 36.000, top611: 23.000, corona: 3.000 },
      rara:  { sinrank: 12.000, top1215: 36.000, top611: 40.000, corona: 12.000 },
    } },
  ultimate: { n: 'Sobre ultimate', coste: 10000, cartas: 10, pronto: true,
    rarezas: { comun: 30.0, rara: 58.0, epica: 12.0 },
    tramos: {
      comun: { sinrank: 20.000, top1215: 36.000, top611: 33.000, corona: 11.000 },
      rara:  { sinrank: 4.000, top1215: 30.000, top611: 43.000, corona: 23.000 },
    } },
};

/* Lo que hay HOY, para poder enseñar el antes y el después en la misma tabla. */
const HOY = {
  comun:      { sinrank: 98.400, top1215: 1.500, top611: 0.092, corona: 0.008 },
  raro:       { sinrank: 78, top1215: 17, top611: 4.5, corona: 0.5 },
  epico:      { sinrank: 55, top1215: 30, top611: 12, corona: 3 },
  legendario: { sinrank: 35, top1215: 38, top611: 22, corona: 5 },
  ultimate:   { sinrank: 20, top1215: 40, top611: 30, corona: 10 },
};

/* ── Que las tablas digan lo que dicen ───────────────────────────────────────────── */
let mal = 0;
for (const [k, T] of Object.entries(SOBRES)) {
  const s = Object.values(T.rarezas).reduce((a, b) => a + b, 0);
  if (Math.abs(s - 100) > 1e-6) { console.error(`  ${k}: las rarezas suman ${s}`); mal++; }
  for (const [r, t] of Object.entries(T.tramos)) {
    const s2 = Object.values(t).reduce((a, b) => a + b, 0);
    if (Math.abs(s2 - 100) > 1e-6) { console.error(`  ${k}/${r}: los tramos suman ${s2}`); mal++; }
    for (const id of Object.keys(t))
      if (!(bolsa[r] || {})[id]) { console.error(`  ${k}/${r}: no existe ninguna carta ${r} de ${id}`); mal++; }
  }
}
if (mal) process.exit(1);

/* ── Sortear ─────────────────────────────────────────────────────────────────────── */
const sortear = tabla => {
  let r = Math.random() * 100;
  for (const [k, p] of Object.entries(tabla)) { r -= p; if (r <= 0) return k; }
  return Object.keys(tabla).pop();
};
function abrir(T) {
  const out = [];
  for (let i = 0; i < T.cartas; i++) {
    const rz = sortear(T.rarezas);
    const tr = rz === 'epica' ? 'corona' : sortear(T.tramos[rz]);
    const pool = bolsa[rz][tr];
    out.push({ rz, tr, carta: pool[Math.floor(Math.random() * pool.length)] });
  }
  return out;
}

/* ── Medir ───────────────────────────────────────────────────────────────────────── */
const pc = x => (100 * x).toFixed(x < 0.001 ? 4 : x < 0.01 ? 3 : x < 0.1 ? 2 : 1) + '%';
const uno = n => n <= 0 ? '—' : n >= 1 ? 'siempre' : `1 de cada ${Math.round(1 / n).toLocaleString('es-ES')}`;

console.log(`\n  ${N.toLocaleString('es-ES')} sobres de cada tipo.\n`);
console.log('══ POR CARTA ═══════════════════════════════════════════════════════════════════\n');
console.log('  sobre         común    rara   épica  │  sinrank   12-15    6-11  corona');
const guardado = {};
for (const [k, T] of Object.entries(SOBRES)) {
  const rz = {}, tr = {}; let n = 0;
  const porSobre = { rara: 0, epica: 0, rank: 0, corona: 0, t1215: 0, t611: 0 };
  const cuenta = new Array(T.cartas + 1).fill(0);
  for (let i = 0; i < N; i++) {
    const s = abrir(T);
    for (const c of s) { rz[c.rz] = (rz[c.rz] || 0) + 1; tr[c.tr] = (tr[c.tr] || 0) + 1; n++; }
    cuenta[s.filter(c => c.rz !== 'comun').length]++;
    if (s.some(c => c.rz !== 'comun')) porSobre.rara++;
    if (s.some(c => c.rz === 'epica')) porSobre.epica++;
    if (s.some(c => c.tr !== 'sinrank')) porSobre.rank++;
    if (s.some(c => c.tr === 'corona')) porSobre.corona++;
    if (s.some(c => c.tr === 'top1215')) porSobre.t1215++;
    if (s.some(c => c.tr === 'top611')) porSobre.t611++;
  }
  guardado[k] = { porSobre, N, tramos: tr, n, cuenta };
  console.log('  ' + k.padEnd(12)
    + RAREZAS.map(r => pc((rz[r] || 0) / n).padStart(7)).join(' ') + '  │ '
    + TRAMOS.map(t => pc((tr[t] || 0) / n).padStart(7)).join(' '));
}

console.log('\n══ EL RANKING, ANTES Y AHORA (por carta) ═══════════════════════════════════════\n');
console.log('  sobre           sinrank            12-15             6-11            campeón/top5');
for (const k of Object.keys(SOBRES)) {
  const h = HOY[k], a = guardado[k].tramos, n = guardado[k].n;
  console.log('  ' + k.padEnd(12) + TRAMOS.map(t =>
    (h[t].toFixed(h[t] < 0.1 ? 3 : 1) + ' → ' + (100 * (a[t] || 0) / n).toFixed(h[t] < 0.1 ? 3 : 1)).padStart(16)).join(' '));
}

console.log('\n══ CUÁNTAS RARAS O MEJORES TRAE UN SOBRE ═══════════════════════════════════════\n');
console.log('  Es lo que él pidió mirar: "que haya probabilidad de que te toque una o dos');
console.log('  raras, pero que es muy difícil o imposible prácticamente que todas sean raras".\n');
console.log('  sobre         ninguna      1      2      3      4     5+   │  TODAS      media');
for (const k of Object.keys(SOBRES)) {
  const c = guardado[k].cuenta, T = SOBRES[k];
  const p = i => (100 * (c[i] || 0) / N).toFixed(1).padStart(6) + '%';
  const media = c.reduce((a, n, i) => a + n * i, 0) / N;
  const todas = 100 * (c[T.cartas] || 0) / N;
  console.log('  ' + k.padEnd(12) + p(0) + p(1) + p(2) + p(3) + p(4)
    + (100 * c.slice(5).reduce((a, b) => a + b, 0) / N).toFixed(1).padStart(6) + '%'
    + '  │ ' + (todas < 0.001 ? '   nunca' : todas.toFixed(3) + '%').padStart(9)
    + '   ' + media.toFixed(2));
}

console.log('\n══ POR SOBRE ENTERO (al menos una) ═════════════════════════════════════════════\n');
console.log('  sobre          rara o mejor      épica        algún rankeado   campeón/top5');
for (const [k, T] of Object.entries(SOBRES)) {
  const g = guardado[k].porSobre;
  console.log('  ' + k.padEnd(12)
    + `${pc(g.rara / N).padStart(8)} ${('(' + uno(g.rara / N) + ')').padEnd(20)}`
    + `${pc(g.epica / N).padStart(7)}  `
    + `${pc(g.rank / N).padStart(8)}  `
    + `${pc(g.corona / N).padStart(8)} (${uno(g.corona / N)})`);
}
console.log('');
