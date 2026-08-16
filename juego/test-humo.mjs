/* Prueba de humo del prototipo.
   Abre el juego en Chromium, comprueba la generación del roster y juega partidas
   completas pulsando botones de verdad. Falla si hay cualquier error de JavaScript.

   Uso:  node juego/test-humo.mjs [nPartidas]
*/
import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import path from 'path';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const URL_JUEGO = 'file://' + path.join(AQUI, 'juego.html');
const N_PARTIDAS = Number(process.argv[2] || 20);

const errores = [];
let fallos = 0;

function comprobar(cond, txt) {
  if (cond) { console.log('  ✓ ' + txt); }
  else { console.log('  ✗ ' + txt); fallos++; }
}

// El contenedor trae Chromium preinstalado; se puede fijar con CHROMIUM_PATH.
const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const fs = await import('fs');
const lanzar = fs.existsSync(exe) ? { executablePath: exe } : {};
const page = await (await chromium.launch(lanzar)).newPage();
page.on('pageerror', e => errores.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errores.push('console: ' + m.text()); });

await page.goto(URL_JUEGO);
await page.waitForFunction(() => typeof window.ROSTER !== 'undefined' || document.querySelector('#app').children.length > 0);

/* ── 1. Roster y estado inicial ───────────────────────────────────────── */
console.log('\n1. Roster y arranque');
const info = await page.evaluate(() => ({
  total: ROSTER.length,
  alineables: ROSTER.filter(c => c.alineable).length,
  leyendas: ROSTER.filter(c => c.rareza === 'leyenda').length,
  conSubs: ROSTER.filter(c => c.subs).length,
  sinSubs: ROSTER.filter(c => !c.subs && !c.alineable).length,
  // la stat grande tiene que ser la media de sus 6 sub-stats (GDD §2.2)
  mediaOk: ROSTER.filter(c => c.subs).every(c =>
    SID.every(s => c.stats[s] === Math.round(c.subs[s].reduce((a, b) => a + b, 0) / c.subs[s].length))),
  // la media general es media simple de las 6 (GDD §2.3)
  generalOk: ROSTER.every(c => c.media === Math.round(SID.reduce((a, s) => a + c.stats[s], 0) / 6)),
  rangosOk: ROSTER.every(c => c.media >= RAREZAS[c.rareza].min - 1 && c.media <= RAREZAS[c.rareza].max + 1),
  rasgosDistintos: ROSTER.every(c => new Set(c.rasgos.map(r => r.tipo)).size === c.rasgos.length),
  camaleonesValidos: ROSTER.every(c => !c.rasgos.some(r => r.tipo === 'camaleon') || c.dobleDiv),
  plantillaLlena: DIVISIONES.every(d => S.plantilla[d.id]),
}));
console.log(`  roster: ${info.total} cartas (${info.alineables} alineables, ${info.leyendas} leyendas)`);
comprobar(info.total > 150, 'el roster se genera');
comprobar(info.leyendas === 5, 'hay exactamente 5 leyendas (GDD §2.4: 4-5 cartas)');
comprobar(info.mediaOk, 'cada stat es la media de sus 6 sub-stats');
comprobar(info.generalOk, 'la media general es media simple de las 6');
comprobar(info.rangosOk, 'las medias respetan el rango de su rareza');
comprobar(info.rasgosDistintos, 'ninguna carta lleva dos rasgos del mismo tipo');
comprobar(info.camaleonesValidos, 'el Camaleón solo va en peleadores de dos divisiones');
comprobar(info.sinSubs > 0, 'las cartas de colección no llevan sub-stats');
comprobar(info.plantillaLlena, 'el arranque cubre las 11 divisiones');

/* ── 2. Sobres ────────────────────────────────────────────────────────── */
console.log('\n2. Sobres');
const sobres = await page.evaluate(() => {
  const antes = S.coleccion.length;
  const salida = abrirSobre('oro');
  return { antes, despues: S.coleccion.length, sacadas: salida.length,
           alineables: salida.filter(i => PORID[i.cid].alineable).length };
});
comprobar(sobres.despues === sobres.antes + sobres.sacadas, 'las cartas del sobre entran en la colección');
comprobar(sobres.alineables >= 4, 'el sobre respeta los huecos alineables garantizados');

// Los gratis: siempre presentes, se reclaman y se acumulan sin abrirse
await page.evaluate(() => { S.gratis = {}; S.sobres = []; ir('sobres'); });
comprobar(await page.locator('[data-reloj]').count() === 3,
  'los 3 sobres gratis están siempre en la tienda');
comprobar(await page.locator('[data-reloj]:not([disabled])').count() === 3,
  'arrancan los 3 reclamables');

// se reclama uno CON reloj, para comprobar que pasa a cuenta atrás
const conReloj = await page.evaluate(() => GRATIS.findIndex(g => g.espera > 0));
await page.locator('[data-reloj]').nth(conReloj).click();
const trasReclamar = await page.evaluate(() => ({
  guardados: S.sobres.length, vista,
  siguenTres: document.querySelectorAll('[data-reloj]').length,
  enEspera: document.querySelectorAll('[data-reloj][disabled]').length,
}));
comprobar(trasReclamar.guardados === 1, 'reclamar guarda el sobre en vez de abrirlo');
comprobar(trasReclamar.vista === 'sobres', 'reclamar no te saca de la tienda');
comprobar(trasReclamar.siguenTres === 3, 'los sobres gratis siguen en pantalla tras reclamar');
comprobar(trasReclamar.enEspera === 1, 'el reclamado pasa a cuenta atrás');

/* ── 2b. Apertura: atrás, saltar y resumen ────────────────────────────── */
console.log('\n2b. Pantalla de apertura');
await page.evaluate(() => { S.sobres = [{ tipo: 'oro' }, { tipo: 'oro' }]; render(); });
await page.locator('[data-a="abrir"]').first().click();
comprobar(await page.evaluate(() => vista === 'apertura'), 'abrir lleva a la pantalla de apertura');
comprobar(await page.locator('[data-a="salirapertura"]').count() === 1, 'hay botón de atrás');
comprobar(await page.locator('[data-a="saltar"]').count() === 1, 'hay botón de saltar');

const guardadasAlEntrar = await page.evaluate(() => S.coleccion.length);
await page.locator('[data-a="revelar"]').last().click();          // revela una
await page.locator('[data-a="salirapertura"]').click();           // y se sale a medias
const trasSalir = await page.evaluate(() => ({ vista, cartas: S.coleccion.length }));
comprobar(trasSalir.vista === 'sobres', 'el atrás sale de la apertura');
comprobar(trasSalir.cartas === guardadasAlEntrar, 'salir a medias no pierde ninguna carta');

await page.locator('[data-a="abrir"]').first().click();
await page.locator('[data-a="saltar"]').click();
const resumen = await page.evaluate(() => ({
  enResumen: tmp.ap && tmp.ap.resumen,
  mostradas: document.querySelectorAll('[data-carta]').length,
  total: tmp.ap ? tmp.ap.items.length : 0,
}));
comprobar(resumen.enResumen, 'saltar lleva al resumen');
comprobar(resumen.mostradas === resumen.total && resumen.total > 0,
  'el resumen enseña todas las cartas del sobre');

/* ── 2c. Sobre básico ilimitado ───────────────────────────────────────── */
console.log('\n2c. Sobre básico ilimitado');
const ilim = await page.evaluate(() => {
  S.gratis = {}; S.sobres = []; ir('sobres');
  const g = GRATIS.find(x => x.espera === 0);
  for (let i = 0; i < 5; i++) {
    if (!listoGratis(g)) return { fallo: 'dejó de estar disponible en la vuelta ' + i };
    S.gratis[g.id] = Date.now(); S.sobres.push({ tipo: g.tipo });
  }
  const T = TIPOS_SOBRE.basico, tot = Object.values(T.pesos).reduce((a, b) => a + b, 0);
  return { fallo: null, guardados: S.sobres.length, buenas: (T.pesos.oro + T.pesos.elite + T.pesos.leyenda) / tot };
});
comprobar(!ilim.fallo, 'el básico sigue disponible por muchas veces que se reclame');
comprobar(ilim.guardados === 5, 'cada reclamo acumula un sobre');
comprobar(ilim.buenas < 0.03, `el básico casi nunca da cartas buenas (${(ilim.buenas * 100).toFixed(1)}%)`);
comprobar(await page.evaluate(() => nGratisListos() <= 2),
  'el ilimitado no infla el aviso del menú');

/* ── 2d. Amigos por código ────────────────────────────────────────────── */
console.log('\n2d. Amigos por código');
const cods = await page.evaluate(() => {
  S.nombre = 'Diego'; S.amigos = [];
  const mio = miCodigo();
  // simula el código de otro jugador con una plantilla legal distinta.
  // Ojo: hay peleadores con carta en dos divisiones, así que hay que evitar repetir persona.
  const usados = new Set(), otra = [];
  for (const d of DIVISIONES) {
    const pool = ROSTER.filter(c => c.alineable && c.division === d.id && !usados.has(c.persona));
    const c = pool[pool.length - 1];
    usados.add(c.persona); otra.push(c.id);
  }
  return { mio, ajeno: codificar('JA1', { n: 'Ana', c: otra }) };
});
comprobar(/^JA1\./.test(cods.mio), 'tu plantilla genera un código');

const pruebas = await page.evaluate(cs => {
  const r = {};
  r.roto = anadirAmigo(cs.ajeno.slice(0, -4));                 // truncado
  r.basura = anadirAmigo('esto no es un codigo');
  r.malaPlantilla = anadirAmigo(codificar('JA1', { n: 'X', c: ['c0', 'c1'] }));
  r.bien = anadirAmigo(cs.ajeno);
  r.repetido = anadirAmigo(cs.ajeno);
  r.amigos = S.amigos.length;
  return r;
}, cods);
comprobar(typeof pruebas.roto === 'string', 'un código truncado se rechaza con explicación');
comprobar(typeof pruebas.basura === 'string', 'un texto cualquiera se rechaza');
comprobar(typeof pruebas.malaPlantilla === 'string', 'una plantilla ilegal se rechaza');
comprobar(!!pruebas.bien.aviso, 'un código válido añade al amigo');
comprobar(pruebas.amigos === 1, 'volver a pegar el mismo código actualiza en vez de duplicar');

// partida completa contra la plantilla del amigo
await page.evaluate(() => { const a = S.amigos[0]; empezarPartida(a); });
comprobar(await page.evaluate(() => P.rival === 'Ana' && !!P.amigoId),
  'la partida se juega contra la plantilla del amigo');
const mismaPlantilla = await page.evaluate(() => {
  const a = S.amigos[0];
  return a.cartas.every(id => P.cartas.r[PORID[id].division].id === id);
});
comprobar(mismaPlantilla, 'el rival alinea exactamente las cartas del código');

const resu = await page.evaluate(() => {
  const a = S.amigos[0];
  const propio = codigoResultado(a, { j: 4, r: 2 }, true);   // el que TÚ le mandas a Ana
  const ajeno = codificar('JAR', { n: 'Ana', v: 'Diego', m: [4, 1], g: 1 }); // el que Ana te manda
  const antes = a.p;
  const rMio = registrarResultado(propio);   // lleva tu nombre: no es de un amigo
  const rAna = registrarResultado(ajeno);
  return { propio, rMio, rAna, subio: S.amigos[0].g === 1, tocado: S.amigos[0].p !== antes };
});
comprobar(/^JAR\./.test(resu.propio), 'la victoria genera un código de resultado');
comprobar(typeof resu.rMio === 'string', 'un resultado que no viene de un amigo se rechaza');
comprobar(!!resu.rAna.aviso, 'el resultado que te manda un amigo se acepta');
comprobar(resu.subio && !resu.tocado, 'la victoria del amigo suma en su columna, no en la tuya');

await page.evaluate(() => { vista = 'inicio'; render(); });

/* ── 3. Partidas completas ────────────────────────────────────────────── */
console.log(`\n3. ${N_PARTIDAS} partidas completas`);
const stats = { partidas: 0, victorias: 0, empates33: 0, duelos: 0,
                finish: 0, decision: 0, renido: 0, jugadaUsada: 0, duelo6Real: 0 };

const clicVisible = async sel => {
  const el = page.locator(sel).first();
  if (await el.count() === 0) return false;
  await el.click({ timeout: 4000 });
  return true;
};

for (let n = 0; n < N_PARTIDAS; n++) {
  await page.evaluate(() => { vista = 'inicio'; render(); });
  await clicVisible('[data-a="jugar"]');

  // rol
  await clicVisible(Math.random() < .5 ? '[data-rol="vetar"]' : '[data-rol="declarar"]');

  // vetos: 2 nuestros, alternos con la IA
  for (let g = 0; g < 40; g++) {
    const fase = await page.evaluate(() => P.fase);
    if (fase !== 'vetos') break;
    const meToca = await page.evaluate(() =>
      (P.vetados.length % 2 === 0) === (P.vetoPrimero === 'j'));
    if (meToca) await clicVisible('[data-veto]');
    else await page.waitForTimeout(120);
  }

  // duelos
  for (let g = 0; g < 90; g++) {
    const fase = await page.evaluate(() => P.fase);
    if (fase === 'fin') break;
    if (fase === 'desempate') { await clicVisible('[data-a="desempate"]'); continue; }
    if (fase === 'incomodo') { await clicVisible('[data-eleccion]'); continue; }
    if (fase !== 'duelos') break;

    const miTurno = await page.evaluate(() => P.turno === 'j');
    if (!miTurno) { await clicVisible('[data-a="iaturno"]'); continue; }

    // mide si el sexto duelo ofrece elección real
    const opciones = await page.evaluate(() => ({
      divs: librePara(P, 'j').length, stats: P.statsVivas.length, duelo: P.duelo }));
    if (opciones.duelo === 6 && (opciones.divs > 1 || opciones.stats > 1)) stats.duelo6Real++;

    await clicVisible('[data-dsel]');
    await clicVisible('[data-ssel]');
    // de vez en cuando gasta la jugada, para ejercitar cambios y rasgos
    if (Math.random() < .5) {
      for (const sel of ['[data-cambio]', '[data-camaleon]', '[data-incomodo]']) {
        if (Math.random() < .4 && await clicVisible(sel)) break;
      }
    }
    if (!await clicVisible('[data-a="declarar"]:not([disabled])')) {
      await clicVisible('[data-dsel]'); await clicVisible('[data-ssel]');
      await clicVisible('[data-a="declarar"]');
    }
  }

  const r = await page.evaluate(() => ({
    fase: P.fase, fin: P.fin, m: P.marcador,
    duelos: P.log.filter(l => l.t === 'duelo'),
    jugada: P.jugada.j || P.jugada.r,
  }));
  if (r.fase !== 'fin') { console.log(`  ✗ la partida ${n + 1} se quedó en "${r.fase}"`); fallos++; break; }

  stats.partidas++;
  if (r.fin === 'j') stats.victorias++;
  if (r.duelos.some(d => d.tipo === 'desempate')) stats.empates33++;
  if (r.jugada) stats.jugadaUsada++;
  for (const d of r.duelos) {
    if (d.tipo === 'desempate') continue;
    stats.duelos++;
    if (d.tipo === 'finish') stats.finish++;
    else if (d.tipo === 'decisión') stats.decision++;
    else stats.renido++;
  }
}

comprobar(stats.partidas === N_PARTIDAS, `las ${N_PARTIDAS} partidas llegan al final`);
comprobar(errores.length === 0, 'ningún error de JavaScript');
if (errores.length) errores.slice(0, 8).forEach(e => console.log('     ' + e.slice(0, 160)));

/* ── 4. Métricas ──────────────────────────────────────────────────────── */
const pc = (a, b) => b ? (a / b * 100).toFixed(1) + '%' : '—';
console.log('\n4. Métricas del prototipo (IA sencilla, jugador que declara casi al azar)');
console.log(`  partidas ................ ${stats.partidas}`);
console.log(`  duelos resueltos ........ ${stats.duelos}`);
console.log(`  llegan a 3-3 ............ ${pc(stats.empates33, stats.partidas)}   (objetivo del GDD: ~33%)`);
console.log(`  finish (margen 13+) ..... ${pc(stats.finish, stats.duelos)}   (objetivo: 15-25%)`);
console.log(`  decisión (7-12) ......... ${pc(stats.decision, stats.duelos)}`);
console.log(`  reñido (1-6) ............ ${pc(stats.renido, stats.duelos)}`);
console.log(`  jugada usada ............ ${pc(stats.jugadaUsada, stats.partidas)}   (objetivo: >80%)`);
console.log(`  duelo 6 con elección .... ${pc(stats.duelo6Real, stats.partidas)}   (mide el "sexto duelo a trámite")`);

console.log(fallos === 0 ? '\nTODO OK\n' : `\n${fallos} COMPROBACIONES FALLIDAS\n`);
await page.context().browser().close();
process.exit(fallos === 0 ? 0 : 1);
