/* Prueba del PvP en vivo.
   Abre DOS navegadores, uno crea sala y el otro entra con el código, y juegan una
   partida completa contra el servidor. Comprueba lo único que justifica que exista
   un servidor: que ningún cliente recibe cartas del rival sin resolver.

   Requiere el servidor levantado:
     cd servidor && npx wrangler dev --port 8787 --local
   Uso:
     node juego/test-online.mjs [urlServidor]
*/
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import fs from 'fs';
import path from 'path';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const URL_JUEGO = 'file://' + path.join(AQUI, 'juego.html');
const SERVIDOR = process.argv[2] || 'http://127.0.0.1:8787';

let fallos = 0;
const comprobar = (c, t) => { console.log((c ? '  ✓ ' : '  ✗ ') + t); if (!c) fallos++; };
const esperar = async (fn, ms = 15000, cada = 120) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) { if (await fn()) return true; await new Promise(r => setTimeout(r, cada)); }
  return false;
};

const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const navegador = await chromium.launch(fs.existsSync(exe) ? { executablePath: exe } : {});

const errores = [];
async function abrirJugador(nombre, rasgoPreferido) {
  const ctx = await navegador.newContext();
  const pg = await ctx.newPage();
  pg.on('pageerror', e => errores.push(`${nombre}: ${e}`));
  pg.on('console', m => { if (m.type() === 'error') errores.push(`${nombre}: ${m.text()}`); });
  await pg.goto(URL_JUEGO);
  await pg.waitForFunction(() => typeof S !== 'undefined' && S.coleccion);
  // plantilla completa y variada, y el servidor apuntado
  await pg.evaluate(([n, srv, rasgo]) => {
    S.nombre = n; S.servidor = srv;
    S.coleccion = []; S.plantilla = {};
    const usados = new Set();
    for (const d of DIVISIONES) {
      let pool = ROSTER.filter(c => c.alineable && c.division === d.id && !usados.has(c.persona));
      // para forzar casos concretos: si se pide un rasgo, se prefieren cartas que lo lleven
      if (rasgo) {
        const conRasgo = pool.filter(c => c.rasgos.some(r => r.tipo === rasgo));
        if (conRasgo.length) pool = conRasgo;
      }
      const c = pool[Math.floor(Math.random() * pool.length)];
      usados.add(c.persona);
      const iid = 'i' + Math.random().toString(36).slice(2, 9);
      S.coleccion.push({ iid, cid: c.id });
      S.plantilla[d.id] = iid;
    }
    guardar(); ir('directo');   // el directo ya no vive en la pantalla de Amigos
  }, [nombre, SERVIDOR, rasgoPreferido]);
  return pg;
}

console.log(`\nServidor: ${SERVIDOR}`);
const A = await abrirJugador('Ana');
const B = await abrirJugador('Beto');

/* ── 1. Sala ──────────────────────────────────────────────────────────── */
console.log('\n1. Crear y entrar en la sala');
await A.locator('[data-a="crearsala"]').click();
comprobar(await esperar(async () => !!(await A.evaluate(() => SALA && SALA.codigo))),
  'crear sala devuelve un código');
const codigo = await A.evaluate(() => SALA.codigo);
console.log(`     código: ${codigo}`);
comprobar(/^[A-HJ-NP-Z2-9]{6}$/.test(codigo), 'el código evita caracteres ambiguos (sin O/0 ni I/1)');

await B.evaluate(c => conectar(c), codigo);
comprobar(await esperar(async () => (await B.evaluate(() => P && P.fase)) === 'rol'),
  'al entrar el segundo, la partida arranca sola');
comprobar(await esperar(async () => (await A.evaluate(() => P && P.fase)) === 'rol'),
  'los dos reciben el arranque');

/* ── 2. Lo que justifica el servidor ──────────────────────────────────── */
console.log('\n2. Las cartas del rival están ocultas de verdad');
// Al acabar la partida el servidor destapa la plantilla entera del rival a propósito:
// ahí ya no hay nada que proteger. La fuga solo cuenta mientras se está jugando.
const fuga = async pg => pg.evaluate(() => {
  if (P.fase === 'fin') return { vistas: 0, indebidas: 0, fin: true };
  const vistas = Object.entries(P.cartas.r).filter(([, c]) => c);
  const permitidas = new Set(P.jugadas);
  return { vistas: vistas.length, indebidas: vistas.filter(([d]) => !permitidas.has(d)).length };
});
const fA = await fuga(A);
comprobar(fA.vistas === 0, `antes de jugar nada, el cliente no tiene ni una carta del rival (tiene ${fA.vistas})`);
// La prueba fuerte: coger las cartas REALES de B y buscarlas en el JSON crudo de A.
const cartasB = await B.evaluate(() => DIVISIONES.map(d => inst(S.plantilla[d.id]).cid));
const cartasA = await A.evaluate(() => DIVISIONES.map(d => inst(S.plantilla[d.id]).cid));
const crudoA = await A.evaluate(() => JSON.stringify(P));
// las que Ana también tiene no cuentan: los dos sortean del mismo catálogo
const soloDeB = cartasB.filter(cid => !cartasA.includes(cid));
const filtradas = soloDeB.filter(cid => crudoA.includes(`"${cid}"`));
comprobar(filtradas.length === 0,
  `ninguna carta exclusiva de Beto aparece en el estado crudo de Ana (${filtradas.length} de ${soloDeB.length})`);

/* ── 3. Partida completa ──────────────────────────────────────────────── */
console.log('\n3. Partida completa a través del servidor');
await A.evaluate(() => enviarRed({ t: 'rol', v: 'vetar' }));
await B.evaluate(() => enviarRed({ t: 'rol', v: 'declarar' }));
comprobar(await esperar(async () => (await A.evaluate(() => P.fase)) === 'vetos'),
  'la elección de rol se resuelve en el servidor');

const jugadores = [A, B];
let indebidasTotales = 0, vueltas = 0, vetPreguntados = 0;

while (vueltas++ < 160) {
  const fases = await Promise.all(jugadores.map(p => p.evaluate(() => P ? P.fase : null)));
  if (fases[0] === 'fin') break;

  for (const [i, pg] of jugadores.entries()) {
    const est = await pg.evaluate(() => ({
      fase: P.fase, turno: P.turno,
      vetoMio: P.fase === 'vetos' && ((P.vetados.length % 2 === 0) === (P.vetoPrimero === 'j')),
      libres: P.fase === 'vetos'
        ? DIVISIONES.map(d => d.id).filter(x => !P.vetados.includes(x))
        : librePara(P, 'j'),
      stats: P.statsVivas, pend: !!P.pendiente, vet: !!P.pendienteVet,
    }));
    if (est.fase === 'vetos' && est.vetoMio)
      await pg.evaluate(d => enviarRed({ t: 'veto', division: d }), est.libres[0]);
    else if (est.fase === 'veterano' && est.vet) {
      vetPreguntados++;
      await pg.evaluate(() => enviarRed({ t: 'veterano', usar: Math.random() < 0.5,
        stat: P.pendienteVet.opciones[0] }));
    }
    else if (est.fase === 'incomodo' && est.pend)
      await pg.evaluate(() => enviarRed({ t: 'incomodo', idx: Math.floor(Math.random() * 2) }));
    else if (est.fase === 'duelos' && est.turno === 'j')
      await pg.evaluate(([d, s]) => enviarRed({ t: 'declarar', division: d, stat: s }),
        [est.libres[Math.floor(Math.random() * est.libres.length)],
         est.stats[Math.floor(Math.random() * est.stats.length)]]);
    else if (est.fase === 'desempate')
      await pg.evaluate(() => enviarRed({ t: 'desempate' }));

    const f = await fuga(pg);
    indebidasTotales += f.indebidas;
  }
  await new Promise(r => setTimeout(r, 60));
}

const finA = await A.evaluate(() => ({ fase: P.fase, fin: P.fin, m: P.marcador, duelos: P.log.filter(l => l.t === 'duelo').length }));
const finB = await B.evaluate(() => ({ fase: P.fase, fin: P.fin, m: P.marcador }));
comprobar(finA.fase === 'fin', `la partida llega al final (${finA.fase})`);
comprobar(finA.m.j === finB.m.r && finA.m.r === finB.m.j,
  `los dos ven el mismo marcador, cada uno desde su lado (${finA.m.j}-${finA.m.r} / ${finB.m.j}-${finB.m.r})`);
comprobar(finA.fin !== finB.fin, 'uno gana y el otro pierde, no los dos lo mismo');
comprobar(indebidasTotales === 0,
  `en toda la partida, cero cartas del rival filtradas antes de resolverse (${indebidasTotales})`);
comprobar(finA.duelos >= 4, `se han resuelto duelos de verdad (${finA.duelos})`);
const vetAuto = await A.evaluate(() =>
  P.log.some(l => l.t === 'sys' && /Veterano/.test(l.x || '')));
comprobar(!vetAuto || vetPreguntados > 0,
  `el Veterano solo actúa si el jugador lo decide (preguntado ${vetPreguntados} veces)`);
// y al terminar sí se destapa todo, que es lo que hace legible el resultado
const alFinal = await A.evaluate(() => Object.values(P.cartas.r).filter(Boolean).length);
comprobar(alFinal >= 6, `al acabar se revela la plantilla del rival (${alFinal} cartas)`);

/* ── 4. El servidor no se fía del cliente ─────────────────────────────── */
console.log('\n4. Jugadas ilegales rechazadas');
const C = await abrirJugador('Caro');
const D = await abrirJugador('Dani');
await C.locator('[data-a="crearsala"]').click();
await esperar(async () => !!(await C.evaluate(() => SALA && SALA.codigo)));
const cod2 = await C.evaluate(() => SALA.codigo);
await D.evaluate(c => conectar(c), cod2);
comprobar(await esperar(async () => (await D.evaluate(() => P && P.fase)) === 'rol'),
  'sala 2: los dos dentro');

const cazar = async (pg, accion) => {
  if (!await pg.evaluate(() => !!RED)) return null;
  await pg.evaluate(() => { window.__err = null;
    const orig = RED.onmessage;
    RED.onmessage = e => { const m = JSON.parse(e.data); if (m.t === 'error') window.__err = m.motivo; orig(e); };
  });
  await pg.evaluate(accion);
  await esperar(async () => !!(await pg.evaluate(() => window.__err)), 3000);
  return pg.evaluate(() => window.__err);
};

comprobar(!!await cazar(C, () => enviarRed({ t: 'veto', division: 'm0' })),
  'vetar sin haber elegido rol se rechaza');
await C.evaluate(() => enviarRed({ t: 'rol', v: 'vetar' }));
await D.evaluate(() => enviarRed({ t: 'rol', v: 'declarar' }));
comprobar(await esperar(async () => (await C.evaluate(() => P.fase)) === 'vetos'),
  'sala 2: los roles se resuelven → ' + await C.evaluate(() => P.fase));

const quienVeta = await C.evaluate(() => (P.vetados.length % 2 === 0) === (P.vetoPrimero === 'j') ? 'C' : 'D');
const fueraDeTurno = quienVeta === 'C' ? D : C;
comprobar(!!await cazar(fueraDeTurno, () => enviarRed({ t: 'veto', division: 'm0' })),
  'vetar fuera de turno se rechaza');
comprobar(!!await cazar(C, () => enviarRed({ t: 'veto', division: 'no-existe' })),
  'vetar una división inventada se rechaza');
comprobar(!!await cazar(C, () => enviarRed({ t: 'declarar', division: 'm0', stat: 'golpeo' })),
  'declarar durante los vetos se rechaza');

/* ── 5. Reconexión ────────────────────────────────────────────────────── */
console.log('\n5. Reconexión a mitad de partida');
// se hace un veto legal primero, para tener algo que recuperar
const vetaAhora = await C.evaluate(() =>
  (P.vetados.length % 2 === 0) === (P.vetoPrimero === 'j') ? 'C' : 'D');
const elQueVeta = vetaAhora === 'C' ? C : D;
await elQueVeta.evaluate(() => enviarRed({ t: 'veto', division: librePara(P, 'j').length
  ? DIVISIONES.map(x => x.id).filter(x => !P.vetados.includes(x))[0]
  : DIVISIONES[0].id }));
comprobar(await esperar(async () => (await D.evaluate(() => P.vetados.length)) === 1),
  'un veto legal sí pasa');

await D.evaluate(() => { RED.close(); });
await new Promise(r => setTimeout(r, 500));
await D.evaluate(c => conectar(c), cod2);
const vuelve = await esperar(async () =>
  (await D.evaluate(() => !!(P && P.vetados))) === true, 10000);
const traeD = await D.evaluate(() => P ? { fase: P.fase, vet: P.vetados.length } : null);
comprobar(vuelve && traeD, 'volver a entrar recupera la partida');
comprobar(!!traeD && traeD.fase === 'vetos' && traeD.vet === 1,
  `la reconexión devuelve el estado exacto, no una partida nueva (${JSON.stringify(traeD)})`);

/* ── 6. Una sala es de dos ────────────────────────────────────────────── */
console.log('\n6. La sala no admite a un tercero');
const E = await abrirJugador('Eva');
await E.evaluate(c => conectar(c), cod2);
await new Promise(r => setTimeout(r, 2500));
const estadoE = await E.evaluate(() => ({ tieneP: !!P, sala: SALA ? SALA.estado : null }));
comprobar(!estadoE.tieneP, 'el tercero no recibe estado de partida');
comprobar(await D.evaluate(() => !!P), 'y los dos de dentro siguen con su partida');

/* ── 7. El Veterano lo decide el jugador, no la máquina ───────────────── */
console.log('\n7. El Veterano pregunta, no salta solo');
const F = await abrirJugador('Fran', 'veterano');
const G = await abrirJugador('Gala', 'veterano');
await F.locator('[data-a="crearsala"]').click();
await esperar(async () => !!(await F.evaluate(() => SALA && SALA.codigo)));
await G.evaluate(c => conectar(c), await F.evaluate(() => SALA.codigo));
await esperar(async () => (await G.evaluate(() => P && P.fase)) === 'rol');
await F.evaluate(() => enviarRed({ t: 'rol', v: 'vetar' }));
await G.evaluate(() => enviarRed({ t: 'rol', v: 'declarar' }));
await esperar(async () => (await F.evaluate(() => P.fase)) === 'vetos');

let vetVistos = 0, vetUsados = 0, v2 = 0;
while (v2++ < 160) {
  if ((await F.evaluate(() => P.fase)) === 'fin') break;
  for (const pg of [F, G]) {
    const e = await pg.evaluate(() => ({
      fase: P.fase, turno: P.turno,
      vetoMio: P.fase === 'vetos' && ((P.vetados.length % 2 === 0) === (P.vetoPrimero === 'j')),
      libres: P.fase === 'vetos'
        ? DIVISIONES.map(x => x.id).filter(x => !P.vetados.includes(x)) : librePara(P, 'j'),
      stats: P.statsVivas, vet: P.pendienteVet || null, pend: !!P.pendiente,
    }));
    if (e.fase === 'vetos' && e.vetoMio)
      await pg.evaluate(d => enviarRed({ t: 'veto', division: d }), e.libres[0]);
    else if (e.fase === 'veterano' && e.vet) {
      vetVistos++;
      // se comprueba que la pantalla ofrece de verdad la decisión, no un aviso
      const botones = await pg.evaluate(() =>
        document.querySelectorAll('[data-a="vetusar"]').length > 0 &&
        document.querySelectorAll('[data-a="vetpasar"]').length > 0);
      if (!botones) { console.log('  ✗ la pantalla del Veterano no ofrece elegir'); fallos++; }
      const usar = vetVistos === 1;   // la primera vez sí, para ver el efecto
      if (usar) vetUsados++;
      await pg.evaluate(u => enviarRed({ t: 'veterano', usar: u, stat: P.pendienteVet.opciones[0] }), usar);
    }
    else if (e.fase === 'incomodo' && e.pend)
      await pg.evaluate(() => enviarRed({ t: 'incomodo', idx: 0 }));
    else if (e.fase === 'duelos' && e.turno === 'j')
      await pg.evaluate(([d, st]) => enviarRed({ t: 'declarar', division: d, stat: st }),
        [e.libres[0], e.stats[0]]);
    else if (e.fase === 'desempate') await pg.evaluate(() => enviarRed({ t: 'desempate' }));
  }
  await new Promise(r => setTimeout(r, 50));
}
comprobar(vetVistos > 0, `con plantillas llenas de Veteranos, el rasgo pregunta (${vetVistos} veces)`);
const registro = await F.evaluate(() => P.log.filter(l => l.t === 'sys' && /Veterano/.test(l.x || '')).length);
comprobar(registro === vetUsados,
  `solo queda registrado el Veterano que se usó a propósito (${registro} de ${vetVistos} preguntas)`);
comprobar(await F.evaluate(() => P.fase) === 'fin', 'la partida con Veteranos también termina');

/* ── resultado ────────────────────────────────────────────────────────── */
comprobar(errores.length === 0, 'ningún error de JavaScript en ninguno de los clientes');
if (errores.length) errores.slice(0, 6).forEach(e => console.log('     ' + e.slice(0, 150)));

console.log(fallos === 0 ? '\nONLINE OK\n' : `\n${fallos} COMPROBACIONES FALLIDAS\n`);
await navegador.close();
process.exit(fallos === 0 ? 0 : 1);
