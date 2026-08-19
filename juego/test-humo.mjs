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
  campeones: ROSTER.filter(c => c.estatus === 'campeon').length,
  soloOroYPlata: ROSTER.every(c => c.rareza === 'oro' || c.rareza === 'plata'),
  sinMedia: ROSTER.every(c => c.media === undefined),
  sumaOk: ROSTER.every(c => c.suma === SID.reduce((a, s) => a + c.stats[s], 0)),
  // Peleadores reales: nombre, récord y una sola versión de cada carta por división.
  conRecord: ROSTER.filter(c => c.record).length,
  conNombre: ROSTER.filter(c => c.nombre && c.nombre.length > 2).length,
  dobles: new Set(ROSTER.filter(c => c.dobleDiv).map(c => c.persona)).size,
  conPais: ROSTER.filter(c => c.pais).length,
  paises: new Set(ROSTER.map(c => c.pais)).size,
  rankeadas: ROSTER.filter(c => c.rk !== null).length,
  // un campeón por división y ni un puesto repetido dentro de la misma
  // Cada división tiene campeón, y los puestos numerados no se repiten. La C sí puede
  // repetirse: un doble campeón lleva carta de campeón en sus dos divisiones.
  rankingLimpio: DIVISIONES.every(d => {
    const l = ROSTER.filter(c => c.division === d.id && c.rk !== null);
    const p = l.filter(c => c.rk).map(c => c.rk);
    return l.some(c => c.rk === 0) && new Set(p).size === p.length;
  }),
  dobleCampeon: new Set(ROSTER.filter(c => c.rk === 0).map(c => c.persona)).size < ROSTER.filter(c => c.rk === 0).length,
  // la plata nunca lleva puesto: la rareza manda en el orden
  plataSinRanking: ROSTER.every(c => c.rareza !== 'plata' || c.rk === null),
  personaPorDivision: (() => {
    const v = new Set();
    for (const c of ROSTER) { const k = c.persona + '@' + c.division; if (v.has(k)) return false; v.add(k); }
    return true;
  })(),
  // Cada stat cae dentro de la banda que declara la base de datos para su calidad.
  rangosOk: ROSTER.every(c =>
    SID.every(s => c.stats[s] >= EST[c.estatus].min - 6 && c.stats[s] <= EST[c.estatus].max)),
  // el orden es el deportivo, y dentro del tramo la suma manda
  ordenOk: (() => {
    const o = ordenar(ROSTER.filter(c => c.alineable));
    for (let i = 1; i < o.length; i++) {
      const a = o[i - 1], b = o[i];
      const ia = ORDEN_ESTATUS.indexOf(a.estatus), ib = ORDEN_ESTATUS.indexOf(b.estatus);
      if (ia > ib) return false;
      if (ia === ib && a.suma < b.suma) return false;
    }
    return true;
  })(),
  rasgosDistintos: ROSTER.every(c => new Set(c.rasgos.map(r => r.tipo)).size === c.rasgos.length),
  camaleonesValidos: ROSTER.every(c => !c.rasgos.some(r => r.tipo === 'camaleon') || c.dobleDiv),
  plantillaLlena: DIVISIONES.every(d => S.plantilla[d.id]),
}));
console.log(`  roster: ${info.total} cartas (${info.alineables} alineables, ${info.campeones} campeones)`);
comprobar(info.total > 150, 'el roster se genera');
comprobar(info.soloOroYPlata, 'solo hay oro y plata: el bronce ya no existe');
comprobar(info.campeones >= 11, `hay carta de campeón en las 11 divisiones (${info.campeones} cartas)`);
comprobar(info.sinMedia, 'NINGUNA carta tiene media, ni visible ni guardada');
comprobar(info.sumaOk, 'la suma interna es la suma real de las 6 stats');
comprobar(info.conRecord === info.total, 'todas las cartas traen el récord del peleador');
comprobar(info.conNombre === info.total, 'y todas traen nombre');
comprobar(info.personaPorDivision, 'ningún peleador aparece dos veces en la misma división');
comprobar(info.dobles > 20, `hay peleadores con carta en varias divisiones (${info.dobles})`);
comprobar(info.conPais === info.total, `todas las cartas traen país (${info.paises} distintos)`);
comprobar(info.rankeadas > 150, `el ranking real viene en las cartas (${info.rankeadas} rankeadas)`);
comprobar(info.rankingLimpio, 'cada división tiene campeón y ningún puesto numerado se repite');
comprobar(info.dobleCampeon, 'el doble campeón lleva carta de campeón en sus dos divisiones');
comprobar(info.plataSinRanking, 'ninguna plata lleva puesto de ranking: la rareza manda en el orden');
comprobar(info.rangosOk, 'todas las stats caen en la banda que declara la base de datos');
comprobar(info.ordenOk, 'el orden va por estatus deportivo y, dentro del tramo, por suma');
comprobar(info.rasgosDistintos, 'ninguna carta lleva dos rasgos del mismo tipo');
comprobar(info.camaleonesValidos, 'el Camaleón solo va en peleadores de dos divisiones');
// Sin esto no se detecta el peor fallo posible en los rasgos: que una clase entera
// no exista. La primera versión del roster no tenía ni un Veterano en 215 cartas.
const rasgos = await page.evaluate(() => {
  const c = {}; for (const t of Object.keys(RASGOS)) c[t] = 0;
  for (const x of ROSTER.filter(y => y.alineable)) for (const r of x.rasgos) c[r.tipo]++;
  return { c, enPlata: ROSTER.filter(y => y.rareza === 'plata' && y.rasgos.length).length,
    unoPorCarta: ROSTER.every(y => y.rasgos.length <= 1),
    veteranosValidos: ROSTER.every(y => !y.rasgos.some(r => r.tipo === 'veterano') || y.esVeterano),
    especialistasConStat: ROSTER.every(y => y.rasgos.every(r => r.tipo !== 'especialista' || !!r.stat)),
    conPlus: ROSTER.flatMap(y => y.rasgos).filter(r => r.plus).length };
});
console.log('  rasgos: ' + Object.entries(rasgos.c).map(([t, n]) => `${t} ${n}`).join(' · '));
comprobar(Object.values(rasgos.c).every(n => n >= 5),
  'los cuatro rasgos existen en el roster, ninguno se queda a cero');
comprobar(rasgos.conPlus === 2,
  `solo hay dos versiones plus en todo el juego, las de Makhachev (${rasgos.conPlus})`);
comprobar(rasgos.veteranosValidos, 'el Veterano solo va en peleadores de carrera larga');
comprobar(rasgos.especialistasConStat, 'todo Especialista lleva su stat asociada');
comprobar(rasgos.enPlata === 0, 'ninguna plata lleva atributo: solo los oros');
comprobar(rasgos.unoPorCarta, 'una sola carta lleva más de un atributo como mucho');
comprobar(info.plantillaLlena, 'el arranque cubre las 11 divisiones');

/* ── 2. Sobres ────────────────────────────────────────────────────────── */
console.log('\n2. Sobres');
const sobres = await page.evaluate(() => {
  const antes = S.coleccion.length;
  const porTipo = {};
  for (const t of Object.keys(TIPOS_SOBRE)) {
    const r = abrirSobre(t);
    const cs = r.map(i => PORID[i.cid]);
    porTipo[t] = {
      n: r.length,
      oros: cs.filter(c => c.rareza === 'oro').length,
      repetidasDentro: r.length - new Set(r.map(i => i.cid)).size,
      // ¿salen ordenadas de mejor a peor?
      ordenadas: cs.every((c, k) => k === 0 || comparar(cs[k - 1], c) <= 0),
    };
  }
  return { antes, despues: S.coleccion.length, porTipo };
});
const tipos = Object.keys(sobres.porTipo);
comprobar(sobres.despues === sobres.antes + tipos.length * 9,
  'las cartas del sobre entran en la colección');
comprobar(Object.values(sobres.porTipo).every(x => x.n === 9),
  'todos los sobres reparten 9 cartas: ' + tipos.map(t => `${t} ${sobres.porTipo[t].n}`).join(' · '));
comprobar(Object.values(sobres.porTipo).every(x => x.repetidasDentro === 0),
  'y ninguna carta se repite dentro del mismo sobre');
comprobar(Object.values(sobres.porTipo).every(x => x.ordenadas),
  'las cartas salen ordenadas de mejor a peor');

// El reparto declarado tiene que ser el reparto real. Se tiran miles de sobres y se
// compara con la tabla: si algún día se retoca un número y se olvida el otro, aquí salta.
const reparto = await page.evaluate(() => {
  const out = {};
  for (const t of Object.keys(TIPOS_SOBRE)) {
    const T = TIPOS_SOBRE[t];
    let oros = 0, coronas = 0, huecos = 0;
    const N = 4000;
    for (let i = 0; i < N; i++) {
      const r = repartoSobre(t);
      huecos += r.length;
      oros += r.filter(x => x !== 'plata').length;
      coronas += r.filter(x => x === 'corona').length;
    }
    const esperadosOros = Object.entries(T.oros)
      .reduce((a, [n, p]) => a + (+n) * p, 0) / Object.values(T.oros).reduce((a, b) => a + b, 0);
    const totNiv = Object.values(T.nivel).reduce((a, b) => a + b, 0);
    out[t] = { huecos: huecos / N, oros: oros / N, esperadosOros,
      coronas: coronas / N, esperadasCoronas: (oros / N) * T.nivel.corona / totNiv };
  }
  return out;
});
for (const [t, r] of Object.entries(reparto)) {
  comprobar(Math.abs(r.huecos - 9) < 0.001, `${t}: siempre 9 huecos`);
  comprobar(Math.abs(r.oros - r.esperadosOros) < 0.12,
    `${t}: ${r.oros.toFixed(2)} oros por sobre (declarado ${r.esperadosOros.toFixed(2)})`);
  comprobar(Math.abs(r.coronas - r.esperadasCoronas) < 0.02,
    `${t}: campeones o top 5 al ritmo declarado (${(r.coronas * 100).toFixed(2)} por cada 100 sobres)`);
}

// Solo el básico es gratis: los de plata y oro se compran o se ganan.
await page.evaluate(() => { S.gratis = {}; S.sobres = []; ir('sobres'); });
comprobar(await page.locator('[data-reloj]').count() === 1,
  'solo hay un sobre gratis, el básico');
const idBasico = await page.evaluate(() => GRATIS.find(g => TIPOS_SOBRE[g.tipo].unico).id);
comprobar(await page.locator(`[data-a="abrirgratis"][data-g="${idBasico}"]`).count() === 1,
  'el básico tiene botón de abrir, no de reclamar');
comprobar(await page.locator(`[data-a="gratis"][data-g="${idBasico}"]`).count() === 0,
  'y ya no se puede reclamar para guardarlo');
await page.locator(`[data-a="abrirgratis"][data-g="${idBasico}"]`).click();
const directo = await page.evaluate(() => ({ vista, guardados: S.sobres.length,
  enTanda: tmp.ap ? tmp.ap.items.length : 0 }));
comprobar(directo.vista === 'apertura', 'abrir el básico lleva directo a la apertura');
comprobar(directo.guardados === 0, 'y el sobre no pasa por "Tus sobres"');
comprobar(directo.enTanda === 9, 'con sus 9 cartas');

// Bono de bienvenida
const bono = await page.evaluate(() => {
  const s = estadoNuevo();
  const c = {}; for (const x of s.sobres) c[x.tipo] = (c[x.tipo] || 0) + 1;
  return c;
});
comprobar(bono.oro === 2 && bono.plata === 2,
  `el jugador nuevo arranca con 2 de oro y 2 de plata (${JSON.stringify(bono)})`);

/* ── 2a-bis. Reciclaje: solo repetidos, y por tramos ──────────────────── */
console.log('\n2·. Reciclaje');
const rec = await page.evaluate(() => {
  S.coleccion = []; S.plantilla = {}; S.fichas = 0;
  const plata = ROSTER.find(c => c.estatus === 'plata');
  const oro = ROSTER.find(c => c.estatus === 'oro');
  const meter = (c, n) => { const out = [];
    for (let i = 0; i < n; i++) { const iid = 'x' + Math.random().toString(36).slice(2);
      S.coleccion.push({ iid, cid: c.id }); out.push(iid); } return out; };
  const unicos = meter(plata, 1);
  const unaSola = reciclable(unicos[0]);
  const muchas = meter(plata, 30);          // ahora hay 31: 30 repetidos
  const mezcla = meter(oro, 3);
  const cuentaMezclada = cuentaReciclaje([...muchas.slice(0, 10), ...mezcla]).fichas;
  const antes = S.fichas;
  const g = reciclar([...unicos, ...muchas, ...mezcla]);
  return { unaSola, cuentaMezclada, ganadas: g, fichas: S.fichas - antes,
    quedan: S.coleccion.filter(x => x.cid === plata.id).length,
    quedanOro: S.coleccion.filter(x => x.cid === oro.id).length };
});
comprobar(rec.unaSola === false, 'la primera copia de una carta NO se puede reciclar');
comprobar(rec.cuentaMezclada === 0,
  'diez platas y tres oros sueltos no completan ninguna ficha: no se mezclan tramos');
comprobar(rec.ganadas === 1, `30 platas repetidas dan exactamente 1 ficha (dio ${rec.ganadas})`);
comprobar(rec.quedan === 1, 'y queda la copia buena, que no se toca');
comprobar(rec.quedanOro === 3, 'los oros que no llegaban a ficha se quedan intactos');

// El test de reciclaje deja la colección vacía a propósito; se rehace antes de seguir.
await page.evaluate(() => { S = estadoNuevo(); for (let i = 0; i < 4; i++) abrirSobre('oro');
  autoPlantilla(S, true); guardar(); ir('inicio'); });

/* ── 2b. Apertura: la carta grande, un toque, y el sobre entero ────────── */
console.log('\n2b. Pantalla de apertura');
await page.evaluate(() => { S.sobres = [{ tipo: 'oro' }, { tipo: 'oro' }]; ir('sobres'); });
await page.locator('[data-a="abrir"]').first().click();
comprobar(await page.evaluate(() => vista === 'apertura'), 'abrir lleva a la pantalla de apertura');
comprobar(await page.locator('[data-a="salirapertura"]').count() === 1, 'hay botón de atrás');

// La carta que enseña el sobre es la mejor de las nueve, y manda en la pantalla.
// Se mide en una ventana de móvil, que es donde se juega: en una de escritorio, ancha
// y baja, la carta la limita el alto y ocuparía poco ancho con toda la razón.
const ventana = page.viewportSize();
await page.setViewportSize({ width: 390, height: 780 });
await page.waitForTimeout(120);
const portada = await page.evaluate(() => {
  const carta = document.querySelector('.apertura-carta .carta');
  const r = carta.getBoundingClientRect();
  const mejor = tmp.ap.items.map(it => PORID[it.cid]).sort(comparar)[0];
  return { anchoCarta: r.width, anchoPantalla: innerWidth, altoCarta: r.height,
           altoPantalla: innerHeight,
           esLaMejor: carta.textContent.includes(mejor.nombre),
           botones: document.querySelectorAll('.apertura button').length };
});
comprobar(portada.esLaMejor, 'enseña la mejor carta del sobre');
comprobar(portada.anchoCarta / portada.anchoPantalla > 0.85,
  `la carta ocupa casi todo el ancho (${(portada.anchoCarta / portada.anchoPantalla * 100).toFixed(0)}%)`);
comprobar(portada.altoCarta <= portada.altoPantalla,
  'y cabe de alto sin salirse de la pantalla');
comprobar(portada.botones === 0, 'no hay botón de continuar: se toca la carta');
if (ventana) await page.setViewportSize(ventana);

const guardadasAlEntrar = await page.evaluate(() => S.coleccion.length);
await page.locator('[data-a="salirapertura"]').click();           // se sale a medias
const trasSalir = await page.evaluate(() => ({ vista, cartas: S.coleccion.length }));
comprobar(trasSalir.vista === 'sobres', 'el atrás sale de la apertura');
comprobar(trasSalir.cartas === guardadasAlEntrar, 'salir a medias no pierde ninguna carta');

await page.locator('[data-a="abrir"]').first().click();
await page.locator('.apertura').click();                          // un solo toque
const resumen = await page.evaluate(() => ({
  enResumen: tmp.ap && tmp.ap.resumen,
  mostradas: document.querySelectorAll('[data-carta]').length,
  total: tmp.ap ? tmp.ap.items.length : 0,
}));
comprobar(resumen.enResumen, 'un toque en la carta lleva al sobre entero');
comprobar(resumen.mostradas === resumen.total && resumen.total > 0,
  'el resumen enseña todas las cartas del sobre');

/* El texto de la carta se mide contra su propio ancho, así que tiene que caer en su
   sitio a cualquier tamaño. Esto es lo que se rompía en la rejilla del resumen. */
const encaje = await page.evaluate(() => {
  const malos = [];
  document.querySelectorAll('.grid .carta').forEach(carta => {
    const R = carta.getBoundingClientRect();
    const dentro = (el, holgura = 0) => {
      const b = el.getBoundingClientRect();
      const r = document.createRange(); r.selectNodeContents(el);
      const t = r.getBoundingClientRect();
      return t.width <= b.width + holgura && t.left >= b.left - holgura
          && t.right <= b.right + holgura;
    };
    if (!carta.style.getPropertyValue('--cw')) malos.push('sin --cw');
    carta.querySelectorAll('.c-et,.c-num,.c-nom').forEach(el => {
      if (el.textContent.trim() && !dentro(el, R.width * 0.01))
        malos.push(el.className + ':' + el.textContent.trim());
    });
  });
  return malos;
});
comprobar(encaje.length === 0,
  `en la rejilla, nombres y stats caben en su hueco (${encaje.slice(0, 4).join(', ') || 'todos'})`);

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

// La distribución se mide sobre la salida REAL, abriendo sobres de verdad: un fallo en
// el reparto no se ve leyendo la tabla de probabilidades.
console.log('\n2c-bis. Distribución real de 2.000 sobres básicos');
const dist = await page.evaluate(() => {
  const cuenta = {}; let n = 0;
  const guardada = S.coleccion.slice();
  for (let i = 0; i < 2000; i++) {
    for (const it of abrirSobre('basico')) {
      const e = PORID[it.cid].estatus;
      cuenta[e] = (cuenta[e] || 0) + 1; n++;
    }
    S.coleccion = guardada.slice();   // sin acumular 18.000 cartas de prueba
  }
  const p = k => (cuenta[k] || 0) / n;
  return { n, cuenta, corona: p('campeon') + p('top5'), plata: p('plata'),
    oro: 1 - p('plata'),
    // los nombres viajan con el resultado: dentro del navegador sí existen
    orden: ORDEN_ESTATUS.map(e => [e, EST[e].n]) };
});
for (const [e, nombre] of dist.orden)
  console.log(`     ${nombre.padEnd(11)} ${((dist.cuenta[e] || 0) / dist.n * 100).toFixed(2)}%`);
comprobar(dist.corona <= 0.005,
  `campeón o top 5 por debajo del 0,5% de las cartas (${(dist.corona * 100).toFixed(3)}%)`);
comprobar(Math.abs(dist.oro - 5.7 / 9) < 0.03,
  `los oros salen al ritmo declarado, 5,7 de 9 (${(dist.oro * 9).toFixed(2)})`);
comprobar(dist.plata > 0.2, `y el resto son platas (${(dist.plata * 100).toFixed(1)}%)`);

// La escalera de calidad tiene que subir de un sobre al siguiente.
const escalera = await page.evaluate(() => ['basico', 'plata', 'oro'].map(k => pctCorona(k)));
comprobar(escalera[2] > escalera[1] && escalera[2] > escalera[0],
  `el sobre de oro es el que más campeones da: ${escalera.map(v => v.toFixed(2)).join('% · ')}%`);

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

/* ── 2e. En directo: viene configurado de fábrica ─────────────────────── */
console.log('\n2e. Pantalla de partida en directo');

// Con servidor de fábrica —que es como sale el APK— no hay nada que configurar
await page.evaluate(() => {
  window.SERVIDOR_POR_DEFECTO = 'https://jaula-abierta.ejemplo.workers.dev';
  S.servidor = ''; tmp = {}; ir('directo');
});
const fabrica = await page.evaluate(() => ({
  url: servidorURL(), manual: servidorEsManual(),
  crear: !!document.querySelector('[data-a="crearsala"]'),
  entrar: !!document.querySelector('[data-a="pedircodigo"]'),
  campoALaVista: !!document.querySelector('#servidor'),
}));
comprobar(fabrica.url === 'https://jaula-abierta.ejemplo.workers.dev',
  'la dirección de fábrica se usa sin que el jugador guarde nada');
comprobar(!fabrica.manual, 'y no cuenta como dirección manual');
comprobar(fabrica.crear && fabrica.entrar, 'salen los dos botones: crear sala y entrar con código');
comprobar(!fabrica.campoALaVista,
  'la casilla de la dirección NO está a la vista: no hay nada que configurar');

// pero sigue estando, plegada, para quien la necesite
await page.locator('[data-a="avanzado"]').click();
comprobar(await page.locator('#servidor').count() === 1,
  'en ajustes avanzados sí aparece, para apuntar a un servidor propio');

// y lo manual gana sobre lo de fábrica, que es como se prueba en local
const manda = await page.evaluate(() => {
  S.servidor = 'http://127.0.0.1:8787';
  return { url: servidorURL(), manual: servidorEsManual() };
});
comprobar(manda.url === 'http://127.0.0.1:8787' && manda.manual,
  'la dirección manual tiene prioridad sobre la de fábrica');

// sin ninguna de las dos, el juego no se rompe y no le encarga tareas al jugador
const sinServidor = await page.evaluate(() => {
  window.SERVIDOR_POR_DEFECTO = ''; S.servidor = ''; tmp = {}; ir('directo');
  return { sinCrear: !document.querySelector('[data-a="crearsala"]'),
           texto: document.querySelector('#app').textContent };
});
comprobar(sinServidor.sinCrear, 'sin ningún servidor, no se ofrece crear sala');
comprobar(/no tendrás que configurar nada|no es cosa tuya|no tuya/i.test(sinServidor.texto),
  'y se le dice al jugador que no es cosa suya, en vez de encargarle un despliegue');
await page.evaluate(() => { window.SERVIDOR_POR_DEFECTO = ''; S.servidor = ''; });

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

/* ── 2f. Incómodo: la regla corregida ─────────────────────────────────── */
console.log('\n2f. Incómodo al fallar la elección');
const inc = await page.evaluate(() => {
  const pj = {}, pr = {};
  const usados = new Set();
  for (const d of DIVISIONES) {
    const pool = ROSTER.filter(c => c.alineable && c.division === d.id && !usados.has(c.persona));
    pj[d.id] = pool[0]; pr[d.id] = pool[1] || pool[0]; usados.add(pool[0].persona);
  }
  const P2 = nuevaPartida(pj, pr);
  P2.enJuego = DIVISIONES.slice(0, 6).map(d => d.id);
  P2.fase = 'duelos';
  const declarada = P2.enJuego[2], enviada = P2.enJuego[4];
  const antesEnviada = P2.cartas.j[enviada];
  const antesReal = P2.cartas.j[declarada];
  enviarAlDuelo(P2, 'j', enviada, declarada, -12);
  return {
    peleaLaEnviada: P2.cartas.j[declarada].id === antesEnviada.id,
    realDescartada: P2.cartas.j[declarada].id !== antesReal.id,
    sigueEnSuHueco: P2.cartas.j[enviada].id === antesEnviada.id,
    penalizada: valorCarta(P2, 'j', declarada, 'golpeo') === antesEnviada.stats.golpeo - 12,
    suHuecoLimpio: valorCarta(P2, 'j', enviada, 'golpeo') === antesEnviada.stats.golpeo,
    sinIntercambio: typeof window.intercambiarSlots === 'undefined',
  };
});
comprobar(inc.peleaLaEnviada, 'la carta enviada es la que pelea el duelo declarado');
comprobar(inc.realDescartada, 'la carta de la división real se descarta');
comprobar(inc.sigueEnSuHueco, 'la enviada sigue en su propia división y peleará también allí');
comprobar(inc.penalizada, 'come la penalización en el duelo declarado');
comprobar(inc.suHuecoLimpio, 'pero su propio duelo lo pelea sin penalización: un fallo, un castigo');
comprobar(inc.sinIntercambio, 'ya no hay intercambio de huecos, que con el plus creaba duelos imposibles');

/* ── 2g. Empate exacto y rasgos que no saltan solos ───────────────────── */
console.log('\n2g. Empate exacto y activación de rasgos');
const emp = await page.evaluate(() => {
  const pj = {}, pr = {}, usados = new Set();
  for (const d of DIVISIONES) {
    const pool = ROSTER.filter(c => c.alineable && c.division === d.id && !usados.has(c.persona));
    pj[d.id] = pool[0]; pr[d.id] = pool[0]; usados.add(pool[0].persona);   // MISMAS cartas
  }
  let gana = 0; const tipos = {};
  for (let i = 0; i < 400; i++) {
    const P2 = nuevaPartida(pj, pr);
    P2.enJuego = DIVISIONES.slice(0, 6).map(d => d.id); P2.fase = 'duelos';
    resolverDuelo(P2, P2.enJuego[0], 'golpeo', {});
    const l = P2.log.find(x => x.t === 'duelo');
    tipos[l.tipo] = (tipos[l.tipo] || 0) + 1;
    if (l.ganador === 'j') gana++;
    if (l.margen !== 0) return { fallo: 'el margen no era 0' };
  }
  return { fallo: null, gana, tipos };
});
comprobar(!emp.fallo, 'dos cartas idénticas dan margen 0');
comprobar(emp.tipos.empate === 400 && !emp.tipos['reñido'],
  'el empate exacto se clasifica como empate, no como reñido');
comprobar(emp.gana > 160 && emp.gana < 240,
  `y se resuelve 50/50, no con ventaja (${emp.gana} victorias de 400 = ${(emp.gana / 4).toFixed(0)}%)`);

const espec = await page.evaluate(() => {
  const conEsp = ROSTER.find(c => c.alineable && c.rasgos.some(r => r.tipo === 'veterano'));
  const r = conEsp.rasgos.find(x => x.tipo === 'veterano');
  const pj = {}, pr = {}, usados = new Set();
  for (const d of DIVISIONES) {
    const pool = ROSTER.filter(c => c.alineable && c.division === d.id && !usados.has(c.persona));
    pj[d.id] = pool[0]; pr[d.id] = pool[1] || pool[0]; usados.add(pool[0].persona);
  }
  pj[conEsp.division] = conEsp;
  const jugar = opts => {
    const P2 = nuevaPartida(pj, pr);
    P2.enJuego = DIVISIONES.slice(0, 6).map(d => d.id); P2.fase = 'duelos';
    const antes = P2.statsVivas.length;
    resolverDuelo(P2, conEsp.division, 'golpeo', opts);
    return P2.statsVivas.length === antes;
  };
  let sinActivar = 0, activado = 0;
  for (let i = 0; i < 60; i++) if (jugar({})) sinActivar++;
  for (let i = 0; i < 60; i++) if (jugar({ veterano: 'j' })) activado++;
  return { sinActivar, activado, plus: r.plus };
});
comprobar(espec.sinActivar === 0,
  'el Veterano NO salta solo: sin activarlo, la stat se gasta siempre');
comprobar(espec.activado > 0,
  `y sí salva la stat al activarlo (${espec.activado} de 60${espec.plus ? ', versión plus' : ''})`);

/* ── 2g-bis. La tabla de márgenes nueva y el desempate por finishes ───── */
console.log('\n2g·. Márgenes, 55/45 y desempate por finishes');
const marg = await page.evaluate(() => {
  const cuenta = m => {
    const t = {};
    for (let i = 0; i < 4000; i++) { const r = sortearDuelo(100, 100 - m); t[r.tipo] = (t[r.tipo] || 0) + 1; }
    return t;
  };
  const gana = m => {
    let g = 0;
    for (let i = 0; i < 8000; i++) if (sortearDuelo(100, 100 - m).ganador === 'j') g++;
    return g / 8000;
  };
  return { m10: cuenta(10), m9: cuenta(9), m4: cuenta(4), m3: cuenta(3), m0: cuenta(0),
    p3: gana(3), p1: gana(1), p0: gana(0), p9: gana(9) };
});
comprobar(!!marg.m10.finish && Object.keys(marg.m10).length === 1, 'margen 10 es finish, siempre');
comprobar(!!marg.m9['decisión'] && Object.keys(marg.m9).length === 1, 'margen 9 es decisión');
comprobar(!!marg.m4['decisión'] && Object.keys(marg.m4).length === 1, 'margen 4 sigue siendo decisión');
comprobar(!!marg.m3['reñido'] && Object.keys(marg.m3).length === 1, 'margen 3 es reñido');
comprobar(!!marg.m0.empate && Object.keys(marg.m0).length === 1, 'margen 0 es empate exacto');
comprobar(marg.p9 === 1, 'por decisión gana el alto seguro');
comprobar(Math.abs(marg.p3 - 0.55) < 0.03 && Math.abs(marg.p1 - 0.55) < 0.03,
  `en la franja reñida el alto gana 55 de cada 100 (medido ${(marg.p3 * 100).toFixed(1)}%)`);
comprobar(Math.abs(marg.p0 - 0.5) < 0.03,
  `y el empate exacto es 50/50 (medido ${(marg.p0 * 100).toFixed(1)}%)`);

const fin = await page.evaluate(() => {
  // Se monta un 3-3 a mano y se comprueba quién gana según los finishes.
  const monta = (finJ, finR) => {
    const pj = {}, pr = {}, usados = new Set();
    for (const d of DIVISIONES) {
      const pool = ROSTER.filter(c => c.alineable && c.division === d.id && !usados.has(c.persona));
      pj[d.id] = pool[0]; pr[d.id] = pool[1] || pool[0]; usados.add(pool[0].persona);
    }
    const P2 = nuevaPartida(pj, pr);
    P2.enJuego = DIVISIONES.slice(0, 6).map(d => d.id);
    P2.vetoAzar = DIVISIONES[6].id;
    P2.fase = 'duelos';
    P2.jugadas = P2.enJuego.slice(0, 5);
    P2.marcador = { j: 3, r: 2 };
    P2.finishes = { j: finJ, r: finR };
    // el sexto duelo lo gana 'r' y deja 3-3
    // margen 7: decisión para 'r', NO finish — si fuese finish cambiaría el propio
    // recuento que se está probando
    P2.cartas.j[P2.enJuego[5]] = { ...P2.cartas.j[P2.enJuego[5]], stats: { ...P2.cartas.j[P2.enJuego[5]].stats, golpeo: 90 } };
    P2.cartas.r[P2.enJuego[5]] = { ...P2.cartas.r[P2.enJuego[5]], stats: { ...P2.cartas.r[P2.enJuego[5]].stats, golpeo: 97 } };
    resolverDuelo(P2, P2.enJuego[5], 'golpeo', {});
    return { fase: P2.fase, fin: P2.fin, m: P2.marcador, f: P2.finishes };
  };
  return { masJ: monta(2, 0), masR: monta(0, 2), iguales: monta(1, 1) };
});
comprobar(fin.masJ.m.j === 3 && fin.masJ.m.r === 3, 'el montaje llega a 3-3');
comprobar(fin.masJ.fase === 'fin' && fin.masJ.fin === 'j',
  'a 3-3, gana quien tiene más finishes');
comprobar(fin.masR.fase === 'fin' && fin.masR.fin === 'r', 'y funciona para los dos lados');
comprobar(fin.iguales.fase === 'desempate',
  'solo si también empatan a finishes se juega el duelo de desempate');

/* ── 2g-ter. Camaleón y cambio de división, solo defendiendo ──────────── */
console.log('\n2g··. Las respuestas son solo defensivas');
const def = await page.evaluate(() => {
  const pj = {}, pr = {}, usados = new Set();
  for (const d of DIVISIONES) {
    const pool = ROSTER.filter(c => c.alineable && c.division === d.id && !usados.has(c.persona));
    pj[d.id] = pool[0]; pr[d.id] = pool[1] || pool[0]; usados.add(pool[0].persona);
  }
  const P2 = nuevaPartida(pj, pr);
  P2.enJuego = DIVISIONES.slice(0, 6).map(d => d.id);
  P2.fase = 'duelos'; P2.turno = 'j';
  const atacando = { cambios: cambiosPosibles(P2, 'j').length,
                     cams: camaleonesPosibles(P2, 'j', P2.enJuego[0]).length };
  P2.fase = 'confirmar';
  P2.pendienteConf = { divId: P2.enJuego[0], stat: 'golpeo', defensor: 'j', opts: {}, veterano: null };
  const defendiendoJ = { cambios: cambiosPosibles(P2, 'j').length };
  const elOtro = { cambios: cambiosPosibles(P2, 'r').length };
  return { atacando, defendiendoJ, elOtro };
});
comprobar(def.atacando.cambios === 0 && def.atacando.cams === 0,
  'declarando no se ofrece ni cambio de división ni Camaleón');
comprobar(def.defendiendoJ.cambios > 0, 'defendiendo sí');
comprobar(def.elOtro.cambios === 0, 'y solo al que le toca defender, no al que declaró');

/* ── 2h. Declarar tocando cartas, y el defensor manda la suya ──────────── */
console.log('\n2h. Declarar por carta y confirmación del defensor');
await page.evaluate(() => { vista = 'inicio'; render(); });
await page.locator('[data-a="jugar"]').click();
await page.locator('[data-rol="declarar"]').click();
for (let i = 0; i < 40; i++) {
  if (await page.evaluate(() => P.fase) !== 'vetos') break;
  if (await page.evaluate(() => (P.vetados.length % 2 === 0) === (P.vetoPrimero === 'j')))
    await page.locator('[data-veto]').first().click();
  else await page.waitForTimeout(150);
}
// aunque el rol elegido manda, el primer duelo puede tocarle a la IA: se la deja pasar
for (let i = 0; i < 30; i++) {
  const e = await page.evaluate(() => ({ fase: P.fase, turno: P.turno,
    mia: P.pendienteConf && P.pendienteConf.defensor === 'j' }));
  if (e.fase === 'duelos' && e.turno === 'j') break;
  if (e.fase === 'duelos') await page.locator('[data-a="iaturno"]').click();
  else if (e.fase === 'confirmar' && e.mia) await page.locator('[data-a="enviarcarta"]').click();
  else await page.waitForTimeout(200);
}
const pantalla = await page.evaluate(() => ({
  fase: P.fase,
  cartasTocables: document.querySelectorAll('[data-dsel]').length,
  chipsDeStat: document.querySelectorAll('.chips [data-ssel]').length,
}));
comprobar(pantalla.fase === 'duelos', 'se llega a la fase de duelos');
comprobar(pantalla.cartasTocables > 0, 'se declara tocando las cartas de los peleadores');
comprobar(pantalla.chipsDeStat === 0, 'y ya no hay etiquetas de filtro para elegir la stat');

await page.locator('[data-dsel]').first().click();
const trasCarta = await page.evaluate(() => ({
  filas: document.querySelectorAll('.fila-stat').length,
  botonApagado: !!document.querySelector('[data-a="declarar"][disabled]'),
}));
comprobar(trasCarta.filas > 0, 'al tocar la carta salen sus stats sobre ella');
comprobar(trasCarta.botonApagado, 'y no se puede declarar sin elegir stat');
await page.locator('.fila-stat').first().click();
await page.locator('[data-a="declarar"]:not([disabled])').click();
comprobar(await page.evaluate(() => P.fase === 'confirmar' || P.fase === 'duelos'),
  'declarar no resuelve el duelo por su cuenta');

/* ── 2i. Contra la IA no hay dado: tu elección de rol manda siempre ────── */
console.log('\n2i. La elección de rol contra la IA');
const rolFuera = await page.evaluate(() => {
  const out = { declararRespetado: 0, vetarRespetado: 0, dado: 0, n: 40 };
  for (let i = 0; i < out.n; i++) {
    for (const quiero of ['declarar', 'vetar']) {
      P = nuevaPartida(plantillaIA(470), plantillaIA(470));
      P.rival = 'x'; vista = 'partida';
      elegirRol(quiero);
      // empezar declarando = el primer duelo lo declaras tú = no empiezas vetando
      if (quiero === 'declarar' && P.vetoPrimero === 'r') out.declararRespetado++;
      if (quiero === 'vetar' && P.vetoPrimero === 'j') out.vetarRespetado++;
      if (P.log.some(l => /[Dd]ado/.test(l.x || ''))) out.dado++;
    }
  }
  return out;
});
comprobar(rolFuera.declararRespetado === rolFuera.n,
  `pedir empezar declarando se respeta siempre (${rolFuera.declararRespetado}/${rolFuera.n})`);
comprobar(rolFuera.vetarRespetado === rolFuera.n,
  `y pedir empezar vetando también (${rolFuera.vetarRespetado}/${rolFuera.n})`);
comprobar(rolFuera.dado === 0,
  `ningún dado le quita al jugador lo que pidió (${rolFuera.dado} tiradas en ${rolFuera.n * 2} partidas)`);

/* ── 2j. La partida tutorial ───────────────────────────────────────────── */
console.log('\n2j. Partida tutorial');
const tut = await page.evaluate(() => {
  S.tutorialHecho = false; S.tutorCortado = false;
  const pj = plantillaGuiada(['veterano', 'especialista', 'camaleon']);
  const pr = plantillaGuiada(['incomodo', 'veterano']);
  const legal = p => {
    const c = Object.values(p);
    return c.length === 11 && c.every(x => x && x.alineable)
      && new Set(c.map(x => x.division)).size === 11
      && new Set(c.map(x => x.persona)).size === 11;
  };
  const tiene = (p, t) => Object.values(p).some(c => c.rasgos.some(r => r.tipo === t));
  return { legalJ: legal(pj), legalR: legal(pr),
    vet: tiene(pj, 'veterano'), esp: tiene(pj, 'especialista'),
    cam: tiene(pj, 'camaleon'), inc: tiene(pr, 'incomodo'),
    pasos: TUTOR.length };
});
comprobar(tut.legalJ && tut.legalR, 'las dos plantillas del tutorial son legales: 11 divisiones, sin repetir peleador');
comprobar(tut.vet && tut.esp && tut.cam, 'la tuya lleva Veterano, Especialista y Camaleón garantizados');
comprobar(tut.inc, 'y la del sparring lleva Incómodo, para que lo veas de verdad');

await page.evaluate(() => { vista = 'inicio'; S.tutorialHecho = false; render(); });
comprobar(await page.locator('[data-a="tutorial"]').count() > 0,
  'el tutorial se ofrece en el inicio mientras no se haya hecho');
await page.locator('[data-a="tutorial"]').first().click();
const arranque = await page.evaluate(() => ({
  fase: P.fase, tut: !!P.tutorial,
  coach: document.querySelectorAll('.coach').length,
  titulo: (document.querySelector('.coach h3') || {}).textContent || '',
}));
comprobar(arranque.tut && arranque.fase === 'rol', 'arranca una partida de verdad, no una simulación');
comprobar(arranque.coach === 1, `y el entrenador habla desde el primer momento ("${arranque.titulo}")`);

// se juega la partida entera pulsando "Entendido" cada vez que aparece un aviso
let avisos = 0, vueltasT = 0;
while (vueltasT++ < 420) {
  const f = await page.evaluate(() => ({ fase: P.fase, rev: !!REVEL.pendiente }));
  if (f.fase === 'fin' && !f.rev) break;   // el último duelo también se enseña
  if (await page.locator('[data-a="seguir"]').count()) {   // la revelación del duelo
    await page.locator('[data-a="seguir"]').click(); continue;
  }
  if (await page.locator('[data-a="tutorok"]').count()) {
    await page.locator('[data-a="tutorok"]').first().click(); avisos++; continue;
  }
  if (f.fase === 'confirmar' && await page.locator('[data-a="enviarcarta"]').count())
    await page.locator('[data-a="enviarcarta"]').first().click();
  else if (f.fase === 'rol') await page.locator('[data-rol="declarar"]').click();
  else if (f.fase === 'vetos' && await page.locator('[data-veto]').count())
    await page.locator('[data-veto]').first().click();
  else if (f.fase === 'incomodo') await page.locator('[data-eleccion]').first().click();
  else if (f.fase === 'desempate') await page.locator('[data-a="desempate"]').click();
  else if (f.fase === 'duelos') {
    if (await page.locator('[data-a="iaturno"]').count()) await page.locator('[data-a="iaturno"]').click();
    else if (await page.locator('[data-a="declarar"]:not([disabled])').count())
      await page.locator('[data-a="declarar"]:not([disabled])').click();
    else if (await page.locator('.fila-stat').count()) await page.locator('.fila-stat').first().click();
    else if (await page.locator('[data-dsel]').count()) await page.locator('[data-dsel]').first().click();
    else await page.waitForTimeout(120);
  } else await page.waitForTimeout(120);
}
const finT = await page.evaluate(() => ({
  fase: P.fase, vistos: P.tutorVistos.length,
  hecho: S.tutorialHecho, partidas: S.partidas,
  premio: document.body.textContent.includes('Tutorial terminado'),
}));
comprobar(finT.fase === 'fin', `la partida tutorial se puede terminar jugando (${finT.fase})`);
comprobar(avisos >= 8, `el entrenador explica los conceptos por el camino (${avisos} avisos)`);
comprobar(finT.premio && finT.hecho, 'al acabar se marca como hecho y se entrega la recompensa');
comprobar(finT.partidas === 0, 'y NO cuenta en tu registro de partidas: se juega con plantilla prestada');
await page.evaluate(() => { vista = 'inicio'; render(); });
comprobar(await page.locator('[data-a="tutorial"]').count() === 0,
  'hecho el tutorial, el inicio deja de ofrecerlo');
comprobar(await page.evaluate(() => { vista = 'reglas'; render();
  return document.body.textContent.includes('Camaleón') && document.body.textContent.includes('55 de cada 100'); }),
  'y las reglas completas siguen a mano en su pantalla');

/* ── 3. Partidas completas ────────────────────────────────────────────── */
console.log(`\n3. ${N_PARTIDAS} partidas completas`);
const stats = { partidas: 0, victorias: 0, empates33: 0, duelos: 0,
                finish: 0, decision: 0, renido: 0, empate: 0, jugadaUsada: 0, duelo6Real: 0 };

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
  for (let g = 0; g < 140; g++) {
    // Cada duelo se enseña destapado y hay que tocar para seguir: eso también se juega.
    if (await clicVisible('[data-a="seguir"]')) continue;
    const fase = await page.evaluate(() => P.fase);
    if (fase === 'fin') break;
    if (fase === 'desempate') { await clicVisible('[data-a="desempate"]'); continue; }
    if (fase === 'incomodo') { await clicVisible('[data-eleccion]'); continue; }
    if (fase === 'confirmar') {           // el defensor manda su carta a mano
      const mia = await page.evaluate(() => P.pendienteConf && P.pendienteConf.defensor === 'j');
      if (mia) {
        // de vez en cuando responde: aquí viven las cuatro jugadas defensivas
        if (Math.random() < .45) {
          for (const sel of ['[data-a="espdefensor"]', '[data-a="vetdefensor"]', '[data-camaleon]', '[data-cambio]'])
            if (Math.random() < .5 && await clicVisible(sel)) break;
        }
        await clicVisible('[data-a="enviarcarta"]');
      } else await page.waitForTimeout(180);   // le toca mandar al rival
      continue;
    }
    if (fase !== 'duelos') break;

    const miTurno = await page.evaluate(() => P.turno === 'j');
    if (!miTurno) { await clicVisible('[data-a="iaturno"]'); continue; }

    // mide si el sexto duelo ofrece elección real
    const opciones = await page.evaluate(() => ({
      divs: librePara(P, 'j').length, stats: P.statsVivas.length, duelo: P.duelo }));
    if (opciones.duelo === 6 && (opciones.divs > 1 || opciones.stats > 1)) stats.duelo6Real++;

    await clicVisible('[data-dsel]');     // se toca la CARTA del peleador
    await clicVisible('[data-ssel]');     // y luego la stat sobre esa misma carta
    // de vez en cuando gasta la jugada, para ejercitar cambios y rasgos
    // atacando la única jugada posible es el Incómodo
    if (Math.random() < .4) await clicVisible('[data-incomodo]');
    if (!await clicVisible('[data-a="declarar"]:not([disabled])')) {
      await clicVisible('[data-a="otracarta"]');
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
    else if (d.tipo === 'empate') stats.empate++;
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
console.log(`  finish (margen 10+) ..... ${pc(stats.finish, stats.duelos)}   (con finish desde 10, sube mucho)`);
console.log(`  decisión (4-9) .......... ${pc(stats.decision, stats.duelos)}`);
console.log(`  reñido (1-3) ............ ${pc(stats.renido, stats.duelos)}`);
console.log(`  empate exacto (50/50) ... ${pc(stats.empate, stats.duelos)}`);
console.log(`  jugada usada ............ ${pc(stats.jugadaUsada, stats.partidas)}   (objetivo: >80%)`);
console.log(`  duelo 6 con elección .... ${pc(stats.duelo6Real, stats.partidas)}   (mide el "sexto duelo a trámite")`);

console.log(fallos === 0 ? '\nTODO OK\n' : `\n${fallos} COMPROBACIONES FALLIDAS\n`);
await page.context().browser().close();
process.exit(fallos === 0 ? 0 : 1);
