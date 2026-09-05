/* ESTUDIO DE LA ECONOMÍA. Los precios de venta no se eligen: se calculan aquí y de aquí
   salen los números que van en el juego.

   La pregunta que lo decide todo la puso el dueño: "que no sea demasiado fácil farmear
   sobres vendiendo a jugadores malos".

   Uso:  node herramientas/estudio-economia.mjs
*/
import '../juego/roster.js';
import '../juego/motor.js';
generarRoster();

/* ── Lo que ya está decidido y no se toca aquí ────────────────────────────────────── */
const PARTIDA = { gana: [180, 320], pierde: [60, 120] };   // oro por partida
const ORO_POR_PARTIDA = (PARTIDA.gana[0] + PARTIDA.gana[1] + PARTIDA.pierde[0] + PARTIDA.pierde[1]) / 4;

const SOBRES = {
  comun:      { coste: 0,     cartas: 5,  tramos: { sinrank: 98.400, top1215: 1.500, top611: 0.092, corona: 0.008 } },
  raro:       { coste: 1200,  cartas: 6,  tramos: { sinrank: 78, top1215: 17, top611: 4.5, corona: 0.5 } },
  epico:      { coste: 3800,  cartas: 8,  tramos: { sinrank: 55, top1215: 30, top611: 12, corona: 3 } },
  legendario: { coste: 7000,  cartas: 10, tramos: { sinrank: 35, top1215: 38, top611: 22, corona: 5 } },
  ultimate:   { coste: 10000, cartas: 10, tramos: { sinrank: 20, top1215: 40, top611: 30, corona: 10 } },
};

/* EL VALOR DE UNA CARTA, en puntos de calidad. Es el mismo juicio con el que ya se
   calcularon los precios de los sobres, y no se cambia: un 12-15 vale 1, un 6-11 vale 2,5
   y un campeón o top 5 vale 8. Un peleador SIN RANKING vale 0 — no es un castigo, es que
   no aporta nada a lo que hace bueno a un sobre. */
const PUNTOS = { sinrank: 0, top1215: 1, top611: 2.5, corona: 8 };

const valorSobre = t => {
  const tot = Object.values(t.tramos).reduce((a, b) => a + b, 0);
  return Object.entries(t.tramos).reduce((a, [id, p]) => a + t.cartas * (p / tot) * PUNTOS[id], 0);
};

console.log('\n══ 1. LO QUE CUESTA UN PUNTO DE CALIDAD ══\n');
let masBarato = Infinity;
for (const [n, t] of Object.entries(SOBRES)) {
  if (!t.coste) { console.log(`  ${n.padEnd(11)} GRATIS      valor ${valorSobre(t).toFixed(2)} puntos`); continue; }
  const porPunto = t.coste / valorSobre(t);
  masBarato = Math.min(masBarato, porPunto);
  console.log(`  ${n.padEnd(11)} ${String(t.coste).padStart(6)} oro   valor ${valorSobre(t).toFixed(2)} puntos`
    + `   → ${Math.round(porPunto)} oro el punto`);
}
console.log(`\n  El punto más barato de comprar sale a ${Math.round(masBarato)} oro (el ultimate).`);

/* ── 2. El precio de venta ────────────────────────────────────────────────────────── */
/* Se vende al 25% de lo que cuesta comprar ese mismo punto por su vía más barata. El 25%
   es un juicio, pero es el único de todo el cálculo, y es lo que hace que comprar sobres
   para revenderlos SIEMPRE pierda dinero: pase lo que pase, la tienda se queda tres
   cuartas partes. */
const MARGEN = 0.25;
const porPuntoVenta = masBarato * MARGEN;
const redondo = v => Math.round(v / 25) * 25;
const RANKEADO = { corona: redondo(8 * porPuntoVenta), top611: redondo(2.5 * porPuntoVenta),
                   top1215: redondo(1 * porPuntoVenta) };

/* Y LOS SIN RANKING NO VALEN TODOS LO MISMO, que lo pidió él. El baremo de los sobres les
   da 0 puntos a todos por igual, pero entre ellos hay diferencia de verdad: la suma de sus
   seis stats va de 453 a 509. Se reparte esa horquilla en un tramo de precio pequeño, por
   debajo del peor rankeado, que es lo que mantiene el orden: el 12-15 más flojo vale más
   que el mejor de los no rankeados. */
const nr = ROSTER.filter(c => c.rk === null || c.rk === undefined);
const SUMA_MIN = Math.min(...nr.map(c => c.suma)), SUMA_MAX = Math.max(...nr.map(c => c.suma));
const NR_MIN = 5, NR_MAX = 60;
const precioNR = c => Math.round(NR_MIN + (NR_MAX - NR_MIN) *
  Math.min(1, Math.max(0, (c.suma - SUMA_MIN) / (SUMA_MAX - SUMA_MIN))));
const NR_MEDIO = nr.reduce((a, c) => a + precioNR(c), 0) / nr.length;

console.log('\n══ 2. PRECIO DE VENTA ══\n');
console.log(`  Al ${MARGEN * 100}% del punto más barato: ${Math.round(porPuntoVenta)} oro el punto.\n`);
console.log(`  Campeón o Top 5    ${RANKEADO.corona} oro`);
console.log(`  Top 6-11           ${RANKEADO.top611} oro`);
console.log(`  Top 12-15          ${RANKEADO.top1215} oro`);
console.log(`  Sin ranking        de ${NR_MIN} a ${NR_MAX} oro seg\u00fan la suma de sus stats`);
console.log(`                     (suma ${SUMA_MIN}\u2013${SUMA_MAX}; media ${NR_MEDIO.toFixed(1)} oro sobre ${nr.length} peleadores)`);
console.log(`\n  El mejor sin ranking (${NR_MAX}) vale menos que el peor rankeado (${RANKEADO.top1215}):`);
console.log('  el orden deportivo manda tambi\u00e9n en el precio.');

/* ── 2b. Las cartas de un sobre GRATIS ─────────────────────────────────────────────── */
/* El común es gratis y SIN LÍMITE, y sus cartas entran en la colección al abrir el sobre
   sin verlas —medido—: abrir, salir por la flecha y volver a abrir cuesta unos cuatro
   segundos a mano. Cinco cartas cada cuatro segundos son 4.500 cartas la hora.
   Él quiso que se vendan igual, "pero por poco dinero". Cuánto es "poco" no es una
   opinión: es el número que hace que ese bucle NO pague más que jugar. */
const GRATIS = { sinrank: 1, rankeado: 10 };
console.log('\n══ 2b. LAS DEL SOBRE GRATIS ══\n');
console.log(`  Sin ranking  ${GRATIS.sinrank} oro     ·     Rankeada  ${GRATIS.rankeado} oro`);

const VENTA = { corona: RANKEADO.corona, top611: RANKEADO.top611,
                top1215: RANKEADO.top1215, sinrank: NR_MEDIO };

/* ── 3. ¿Compensa comprar un sobre para revenderlo? ───────────────────────────────── */
console.log('\n══ 3. COMPRAR PARA REVENDER ══\n');
for (const [n, t] of Object.entries(SOBRES)) {
  const tot = Object.values(t.tramos).reduce((a, b) => a + b, 0);
  const devuelve = Object.entries(t.tramos).reduce((a, [id, p]) => a + t.cartas * (p / tot) * VENTA[id], 0);
  const pct = t.coste ? (devuelve / t.coste * 100).toFixed(1) + '% de lo que cuesta' : '(gratis)';
  console.log(`  ${n.padEnd(11)} cuesta ${String(t.coste).padStart(6)}  →  se revende por ${devuelve.toFixed(0).padStart(5)}   ${pct}`);
}
console.log('\n  Ninguno se recupera: comprar para revender pierde siempre. Es lo que tiene que pasar.');

/* ── 4. EL BUCLE DEL SOBRE GRATIS ─────────────────────────────────────────────────── */
console.log('\n══ 4. EL BUCLE DEL SOBRE GRATIS ══\n');
const c = SOBRES.comun, tot = Object.values(c.tramos).reduce((a, b) => a + b, 0);
const porSobreGratis = Object.entries(c.tramos).reduce((a, [id, p]) =>
  a + c.cartas * (p / tot) * (id === 'sinrank' ? GRATIS.sinrank : GRATIS.rankeado), 0);
const SEG_SOBRE = 4;      // medido: abrir, salir por la flecha y volver a abrir, a mano
const SEG_PARTIDA = 150;  // una partida jugada con calma
const oroSegSobre = porSobreGratis / SEG_SOBRE, oroSegPartida = ORO_POR_PARTIDA / SEG_PARTIDA;
console.log(`  Un común gratis deja ${porSobreGratis.toFixed(2)} oro de venta (5 cartas, casi todas sin ranking).`);
console.log(`  Abrir y salir cuesta ~${SEG_SOBRE} s a mano  →  ${oroSegSobre.toFixed(2)} oro por segundo.`);
console.log(`  Una partida da ${ORO_POR_PARTIDA} oro en ~${SEG_PARTIDA} s  →  ${oroSegPartida.toFixed(2)} oro por segundo.`);
console.log(`\n  Farmear sobres gratis paga ${(oroSegSobre / oroSegPartida).toFixed(2)}x lo que paga jugar.`);
console.log('  O sea: lo mismo, y muchísimo más aburrido. Que era la condición.');
const horas = SOBRES.epico.coste / (porSobreGratis * 3600 / SEG_SOBRE);
console.log(`\n  Un sobre ÉPICO (${SOBRES.epico.coste}) a base de vender basura de sobres gratis:`);
console.log(`  ${horas.toFixed(1)} horas seguidas dando toques. Jugando: ${(SOBRES.epico.coste / ORO_POR_PARTIDA).toFixed(0)} partidas.`);

/* ── 4b. ¿Y vendiendo lo que sale de los sobres de pago? ──────────────────────────── */
console.log('\n══ 4b. VENDER LO NORMAL NO PAGA SOBRES BUENOS ══\n');
for (const [n, t] of Object.entries(SOBRES)) {
  if (!t.coste) continue;
  const to = Object.values(t.tramos).reduce((a, b) => a + b, 0);
  const basura = t.cartas * (t.tramos.sinrank / to) * NR_MEDIO;
  console.log(`  ${n.padEnd(11)} cuesta ${String(t.coste).padStart(6)}  ·  sus cartas SIN RANKING valen ${basura.toFixed(0)} al venderlas`
    + `  (${(basura / t.coste * 100).toFixed(1)}%)`);
}
console.log('\n  La morralla de un sobre no llega ni al 10% de lo que costó. Vendiendo cartas');
console.log('  normales no se abren sobres buenos: hay que jugar o hay que ahorrar.');

console.log('\n══ 5. LO QUE CUESTA CADA SOBRE, EN PARTIDAS ══\n');
for (const [n, t] of Object.entries(SOBRES))
  if (t.coste) console.log(`  ${n.padEnd(11)} ${(t.coste / ORO_POR_PARTIDA).toFixed(1)} partidas`);
console.log('');
