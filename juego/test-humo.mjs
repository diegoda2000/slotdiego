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
// Sin esto no se detecta el peor fallo posible en los rasgos: que una clase entera
// no exista. La primera versión del roster no tenía ni un Veterano en 215 cartas.
const rasgos = await page.evaluate(() => {
  const c = {}; for (const t of Object.keys(RASGOS)) c[t] = 0;
  for (const x of ROSTER.filter(y => y.alineable)) for (const r of x.rasgos) c[r.tipo]++;
  return { c, enColeccion: ROSTER.filter(y => !y.alineable && y.rasgos.length).length,
    veteranosValidos: ROSTER.every(y => !y.rasgos.some(r => r.tipo === 'veterano') || y.esVeterano),
    especialistasConStat: ROSTER.every(y => y.rasgos.every(r => r.tipo !== 'especialista' || !!r.stat)),
    conPlus: ROSTER.flatMap(y => y.rasgos).filter(r => r.plus).length };
});
console.log('  rasgos: ' + Object.entries(rasgos.c).map(([t, n]) => `${t} ${n}`).join(' · '));
comprobar(Object.values(rasgos.c).every(n => n >= 5),
  'los cuatro rasgos existen en el roster, ninguno se queda a cero');
comprobar(rasgos.veteranosValidos, 'el Veterano solo va en peleadores de carrera larga');
comprobar(rasgos.especialistasConStat, 'todo Especialista lleva su stat asociada');
comprobar(rasgos.conPlus > 0, 'existen versiones plus');
comprobar(rasgos.enColeccion === 0, 'las cartas de colección no llevan rasgos que no podrían usar');
comprobar(info.sinSubs > 0, 'las cartas de colección no llevan sub-stats');
comprobar(info.plantillaLlena, 'el arranque cubre las 11 divisiones');

/* ── 2. Sobres ────────────────────────────────────────────────────────── */
console.log('\n2. Sobres');
const sobres = await page.evaluate(() => {
  const antes = S.coleccion.length;
  const salida = abrirSobre('oro');
  const porTipo = {};
  for (const t of Object.keys(TIPOS_SOBRE)) {
    const r = abrirSobre(t);
    porTipo[t] = { n: r.length, al: r.filter(i => PORID[i.cid].alineable).length };
  }
  return { antes, despues: S.coleccion.length, sacadas: salida.length,
           alineables: salida.filter(i => PORID[i.cid].alineable).length, porTipo };
});
comprobar(sobres.despues === sobres.antes + sobres.sacadas + 4 * 9, 'las cartas del sobre entran en la colección');
comprobar(Object.values(sobres.porTipo).every(x => x.n === 9),
  'los cuatro sobres reparten 9 cartas: ' + Object.entries(sobres.porTipo).map(([t, x]) => `${t} ${x.n}`).join(' · '));
comprobar(Object.values(sobres.porTipo).every(x => x.al === 7),
  'y 7 alineables garantizadas en todos');

// Los gratis: siempre presentes, se reclaman y se acumulan sin abrirse
await page.evaluate(() => { S.gratis = {}; S.sobres = []; ir('sobres'); });
comprobar(await page.locator('[data-reloj]').count() === 3,
  'los 3 sobres gratis están siempre en la tienda');
comprobar(await page.locator('[data-reloj]:not([disabled])').count() === 3,
  'arrancan los 3 disponibles');

// el básico se abre en el sitio, sin pasar por "Tus sobres"
await page.evaluate(() => { S.gratis = {}; S.sobres = []; ir('sobres'); });
const idBasico = await page.evaluate(() => GRATIS.find(g => TIPOS_SOBRE[g.tipo].unico).id);
comprobar(await page.locator(`[data-a="abrirgratis"][data-g="${idBasico}"]`).count() === 1,
  'el básico tiene botón de abrir, no de reclamar');
comprobar(await page.locator(`[data-a="gratis"][data-g="${idBasico}"]`).count() === 0,
  'y ya no se puede reclamar para guardarlo');
comprobar(await page.locator('[data-n]').count() === 0, 'ya no existe el "reclamar 10 de golpe"');
await page.locator(`[data-a="abrirgratis"][data-g="${idBasico}"]`).click();
const directo = await page.evaluate(() => ({ vista, guardados: S.sobres.length,
  enTanda: tmp.ap ? tmp.ap.items.length : 0 }));
comprobar(directo.vista === 'apertura', 'abrir el básico lleva directo a la apertura');
comprobar(directo.guardados === 0, 'y el sobre no pasa por "Tus sobres"');
comprobar(directo.enTanda === 9, 'con sus 9 cartas');

// ni siquiera con restos de una versión anterior se puede abrir más de uno a la vez
await page.evaluate(() => { S.sobres = [{ tipo: 'basico' }, { tipo: 'basico' }, { tipo: 'basico' }]; ir('sobres'); });
comprobar(await page.locator('[data-a="abrirtodo"][data-t="basico"]').count() === 0,
  'el básico nunca ofrece abrir en tanda, ni con varios guardados');
await page.evaluate(() => { S.sobres = [{ tipo: 'oro' }, { tipo: 'oro' }]; render(); });
comprobar(await page.locator('[data-a="abrirtodo"][data-t="oro"]').count() === 1,
  'los de reloj y de pago sí se abren en tanda');

// ningún premio del juego regala algo que ya es gratis e infinito
const premios = await page.evaluate(() => RETOS.map(r => r.premio.sobre));
comprobar(!premios.includes('basico'), 'ningún reto premia con un sobre básico');

// se reclama uno CON reloj, para comprobar que pasa a cuenta atrás
await page.evaluate(() => { S.gratis = {}; S.sobres = []; ir('sobres'); });
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
  let cartas = 0;
  for (let i = 0; i < 5; i++) {
    if (!listoGratis(g)) return { fallo: 'dejó de estar disponible en la vuelta ' + i };
    cartas += abrirSobre(g.tipo).length;
  }
  return { fallo: null, cartas, guardados: S.sobres.length };
});
comprobar(!ilim.fallo, 'el básico sigue disponible por muchas veces que se abra');
comprobar(ilim.cartas === 45, 'cinco aperturas seguidas dan 45 cartas');
comprobar(ilim.guardados === 0, 'y ninguna se queda guardada sin abrir');
comprobar(await page.evaluate(() => nGratisListos() <= 2),
  'el ilimitado no infla el aviso del menú');

// La distribución se mide sobre la salida real, no sobre los pesos escritos:
// un fallo en el reparto de bandas no se ve leyendo la tabla.
console.log('\n2c-bis. Distribución real de 2.000 sobres básicos');
const dist = await page.evaluate(() => {
  const cuenta = {}; let n = 0;
  const guardada = S.coleccion.slice();
  for (let i = 0; i < 2000; i++) {
    for (const it of abrirSobre('basico')) {
      cuenta[bandaDe(PORID[it.cid])] = (cuenta[bandaDe(PORID[it.cid])] || 0) + 1; n++;
    }
    S.coleccion = guardada.slice();   // sin acumular 6.000 cartas de prueba
  }
  const p = k => (cuenta[k] || 0) / n;
  return { n, cuenta, top: p('oroAlto') + p('elite') + p('leyenda'),
           medio: p('plata') + p('oroBajo'), bronce: p('bronce') };
});
for (const b of ['bronce', 'plata', 'oroBajo', 'oroMedio', 'oroAlto', 'elite', 'leyenda'])
  console.log(`     ${b.padEnd(9)} ${((dist.cuenta[b] || 0) / dist.n * 100).toFixed(2)}%`);
comprobar(dist.top <= 0.01, `oro alto o mejor por debajo del 1% (${(dist.top * 100).toFixed(2)}%)`);
comprobar(dist.medio > 0.8, `platas y oros bajos son la norma (${(dist.medio * 100).toFixed(1)}%)`);
comprobar(dist.bronce > 0.05 && dist.bronce < 0.25,
  `el bronce sale de vez en cuando (${(dist.bronce * 100).toFixed(1)}%)`);

// La escalera tiene que subir: cada sobre mejor que el anterior en la mitad alta
const escalera = await page.evaluate(() => ['basico', 'plata', 'oro', 'elite']
  .map(k => +pctTop(TIPOS_SOBRE[k])));
comprobar(escalera.every((v, i) => i === 0 || v > escalera[i - 1]),
  `la escalera de sobres sube: ${escalera.join('% < ')}%`);

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

/* ── 2e. En directo: que se explique y que la dirección se entienda ───── */
console.log('\n2e. Pantalla de partida en directo');
await page.evaluate(() => { S.servidor = ''; ir('directo'); });
const sinServidor = await page.evaluate(() => ({
  explica: !!document.querySelector('[data-a="ayudaservidor"]'),
  sinCrear: !document.querySelector('[data-a="crearsala"]'),
  texto: document.querySelector('#app').textContent,
}));
comprobar(sinServidor.explica, 'sin servidor, la pantalla ofrece explicar cómo conseguir uno');
comprobar(sinServidor.sinCrear, 'sin servidor, no se ofrece crear sala');
comprobar(/gratis/i.test(sinServidor.texto) && /ocultas/i.test(sinServidor.texto),
  'y explica por qué hace falta y que es gratis');

// la dirección se acepta como venga de un copiar y pegar torpe
const normal = await page.evaluate(() => ({
  simple: normalizarServidor('jaula.workers.dev'),
  barra: normalizarServidor('https://jaula.workers.dev/'),
  espacios: normalizarServidor('  https://jaula.workers.dev  '),
  ruta: normalizarServidor('https://jaula.workers.dev/sala/ABC'),
  vacio: normalizarServidor(''),
  malo: normalizarServidor('esto no es una url ::'),
}));
comprobar(normal.simple === 'https://jaula.workers.dev', 'sin https:// se completa sola');
comprobar(normal.barra === 'https://jaula.workers.dev', 'la barra final se quita');
comprobar(normal.espacios === 'https://jaula.workers.dev', 'los espacios se quitan');
comprobar(normal.ruta === 'https://jaula.workers.dev', 'una ruta pegada de más se recorta');
comprobar(normal.vacio === '', 'vacío es vacío, no un error');
comprobar(normal.malo === null, 'una dirección imposible sí se rechaza');

// los tres veredictos de la prueba de conexión
const veredictos = await page.evaluate(async () => {
  const real = window.fetch;
  const con = async r => { window.fetch = async () => r; const x = await probarServidor('https://x'); window.fetch = real; return x; };
  const bueno = await con({ ok: true, json: async () => ({ ok: true, servicio: 'jaula-abierta' }) });
  const otro = await con({ ok: true, json: async () => ({ hola: 1 }) });
  const error = await con({ ok: false, status: 500, json: async () => ({}) });
  window.fetch = async () => { throw new Error('sin red'); };
  const muerto = await probarServidor('https://x');
  window.fetch = real;
  return { bueno, otro, error, muerto };
});
comprobar(veredictos.bueno.ok, 'el servidor del juego se reconoce');
comprobar(!veredictos.otro.ok && /no es el servidor del juego/i.test(veredictos.otro.txt),
  'una web cualquiera se distingue del servidor del juego');
comprobar(!veredictos.error.ok && /500/.test(veredictos.error.txt), 'un error del servidor se dice tal cual');
comprobar(!veredictos.muerto.ok && /No contesta/i.test(veredictos.muerto.txt),
  'una dirección muerta se explica con qué comprobar');

// los dos modos están separados y no se confunden
const menu = await page.evaluate(() => { ir('mas'); return document.querySelector('#app').textContent; });
comprobar(/Partida en directo/.test(menu) && /Retar plantillas/.test(menu),
  'el menú separa jugar en directo de retar plantillas');
const avisoAmigos = await page.evaluate(() => { ir('amigos'); return document.querySelector('#app').textContent; });
comprobar(/no es jugar a la vez/i.test(avisoAmigos),
  'la pantalla de retar plantillas avisa de que no es en directo');

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
