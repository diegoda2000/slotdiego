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
/* Se lanza con TAMAÑO MÍNIMO DE LETRA, como un WebView de verdad.

   Sin esto, la prueba corría en Chromium de escritorio, que no tiene mínimo, y daba verde
   mientras en el móvil las cartas estaban rotas: Android dibuja a 8 px cualquier texto por
   debajo de 8, y en el álbum los números salían a 3,3 px y las etiquetas a 3,9, así que
   los tres acababan a 8 y se salían de su hueco. Comprobar donde el fallo no existe no es
   comprobar nada. */
const MINIMO_MOVIL = '--blink-settings=minimumFontSize=8,minimumLogicalFontSize=8';
const lanzar = { args: [MINIMO_MOVIL], ...(fs.existsSync(exe) ? { executablePath: exe } : {}) };
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
  /* El orden: rankeado antes que sin rankear siempre, entre rankeados por PUESTO
     —campeón, #1, #2… #15—, y entre los que no tienen ranking por la suma. */
  ordenOk: (() => {
    const o = ordenar(ROSTER.filter(c => c.alineable));
    const pos = c => (c.rk === 0 || c.rk) ? c.rk : null;
    for (let i = 1; i < o.length; i++) {
      const a = o[i - 1], b = o[i], ra = pos(a), rb = pos(b);
      if (ra === null && rb !== null) return false;          // sin rankear delante de rankeado
      if (ra !== null && rb !== null && ra > rb) return false; // peor puesto delante del mejor
      if (ra === null && rb === null) {
        const ia = ORDEN_ESTATUS.indexOf(a.estatus), ib = ORDEN_ESTATUS.indexOf(b.estatus);
        if (ia > ib) return false;
        if (ia === ib && a.suma < b.suma) return false;
      }
    }
    return true;
  })(),
  // y un #11 va por delante de un #15 aunque el #15 sume más
  puestoManda: (() => {
    const o = ordenar(ROSTER.filter(c => c.rk));
    const once = o.findIndex(c => c.rk === 11), quince = o.findIndex(c => c.rk === 15);
    return once >= 0 && quince >= 0 && once < quince;
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
comprobar(info.ordenOk, 'el orden va por puesto real, y los rankeados siempre antes que los demás');
comprobar(info.puestoManda, 'un #11 va antes que un #15 aunque el #15 sume más');
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
      debe: TIPOS_SOBRE[t].cartas,
      oros: cs.filter(c => c.rareza === 'oro').length,
      repetidasDentro: r.length - new Set(r.map(i => i.cid)).size,
      // ¿salen ordenadas de mejor a peor?
      ordenadas: cs.every((c, k) => k === 0 || comparar(cs[k - 1], c) <= 0),
    };
  }
  return { antes, despues: S.coleccion.length, porTipo };
});
const tipos = Object.keys(sobres.porTipo);
/* CADA SOBRE TRAE LAS SUYAS, no nueve todos. Lo pone el boceto: 5, 6, 8, 10 y 10, y va
   escrito en TIPOS_SOBRE.cartas, que es contra lo que se comprueba. */
const sumaCartas = tipos.reduce((a, t) => a + sobres.porTipo[t].debe, 0);
comprobar(sobres.despues === sobres.antes + sumaCartas,
  'las cartas del sobre entran en la colección');
comprobar(Object.values(sobres.porTipo).every(x => x.n === x.debe),
  'cada sobre reparte las cartas que anuncia: ' + tipos.map(t =>
    `${t} ${sobres.porTipo[t].n}/${sobres.porTipo[t].debe}`).join(' · '));
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
      oros += r.filter(x => !esPlata(x)).length;
      coronas += r.filter(x => x === 'corona').length;
    }
    const esperadosOros = Object.entries(T.oros)
      .reduce((a, [n, p]) => a + (+n) * p, 0) / Object.values(T.oros).reduce((a, b) => a + b, 0);
    const totNiv = Object.values(T.nivel).reduce((a, b) => a + b, 0);
    out[t] = { debe: T.cartas, huecos: huecos / N, oros: oros / N, esperadosOros,
      coronas: coronas / N, esperadasCoronas: (oros / N) * T.nivel.corona / totNiv };
  }
  return out;
});
for (const [t, r] of Object.entries(reparto)) {
  comprobar(Math.abs(r.huecos - r.debe) < 0.001, `${t}: siempre ${r.debe} huecos`);
  comprobar(Math.abs(r.oros - r.esperadosOros) < 0.12,
    `${t}: ${r.oros.toFixed(2)} oros por sobre (declarado ${r.esperadosOros.toFixed(2)})`);
  comprobar(Math.abs(r.coronas - r.esperadasCoronas) < 0.02,
    `${t}: campeones o top 5 al ritmo declarado (${(r.coronas * 100).toFixed(2)} por cada 100 sobres)`);
}

/* Cada sobre hace UNA cosa, y esto lo fija para que no se deshaga sin querer:
   el básico da oros para montarse un equipo pero casi nunca uno alto, el de plata
   está para cerrar la colección de platas, y el de oro es el que reparte arriba. */
const oficio = await page.evaluate(() => {
  const N = 60000, out = {};
  for (const tipo of Object.keys(TIPOS_SOBRE)) {
    let oros = 0, platas = 0, conAlto = 0;
    for (let i = 0; i < N; i++) {
      const s = repartoSobre(tipo);
      let alto = 0;
      for (const n of s) {
        if (esPlata(n)) platas++; else oros++;
        if (n === 'corona' || n === 'top611') alto++;
      }
      if (alto) conAlto++;
    }
    out[tipo] = { oros: oros / N, platas: platas / N, pctAlto: conAlto / N * 100 };
  }
  /* Y la cifra exacta, salida de la propia tabla en vez de a base de tiradas: con
     60.000 sobres el muestreo baila una décima, y el límite del GDD es justo el 1%. */
  out.exacto = {};
  for (const tipo of Object.keys(TIPOS_SOBRE)) {
    const T = TIPOS_SOBRE[tipo];
    const totN = Object.values(T.nivel).reduce((a, b) => a + b, 0);
    const p = (T.nivel.corona + T.nivel.top611) / totN;
    const totO = Object.values(T.oros).reduce((a, b) => a + b, 0);
    let q = 0;   // probabilidad de NO sacar ninguna alta, pesada por cuántos oros trae
    for (const [n, peso] of Object.entries(T.oros)) q += (peso / totO) * Math.pow(1 - p, +n);
    out.exacto[tipo] = (1 - q) * 100;
  }
  return out;
});
/* LOS CINCO SOBRES SON UNA ESCALERA, no tres sobres con oficios distintos. Antes el
   básico era el gratis para montarse un equipo, el de plata cerraba la colección de platas
   y el de oro era el caro; ahora van de común a ultimate y cada uno tiene que ser mejor
   que el de debajo, que es lo que dice el boceto con sus precios de 1.000 a 12.500. */
const ESCALERA = ['comun', 'raro', 'epico', 'legendario', 'ultimate'];
comprobar(oficio.comun.oros >= 1.5,
  `el común da oros para ir montando el equipo (${oficio.comun.oros.toFixed(2)} por sobre)`);
comprobar(oficio.exacto.comun <= 1,
  `pero un oro alto es casi imposible, el 1% o menos que manda el GDD (${oficio.exacto.comun.toFixed(2)}% de los sobres)`);
comprobar(Math.abs(oficio.comun.pctAlto - oficio.exacto.comun) < 0.25,
  `y las tiradas dan lo que dice la tabla (${oficio.comun.pctAlto.toFixed(2)}% medido)`);
const subeOros = ESCALERA.every((k, i) => i === 0 || oficio[k].oros > oficio[ESCALERA[i - 1]].oros);
comprobar(subeOros,
  `y cada escalón trae más oros que el de debajo (${ESCALERA.map(k => oficio[k].oros.toFixed(1)).join(' · ')})`);

/* Lo que define a cada sobre, escrito para que no se deshaga sin querer. */
const perfil = await page.evaluate(() => {
  const N = 120000, out = {};
  for (const tipo of Object.keys(TIPOS_SOBRE)) {
    const c = {}; let conRank = 0;
    for (let i = 0; i < N; i++) {
      const s = repartoSobre(tipo); let rk = 0;
      for (const n of s) { c[n] = (c[n] || 0) + 1;
        if (n === 'corona' || n === 'top611' || n === 'top1215') rk++; }
      if (rk) conRank++;
    }
    const oros = (c.corona || 0) + (c.top611 || 0) + (c.top1215 || 0) + (c.oro || 0);
    const pl = (c.plataAlta || 0) + (c.plataBaja || 0);
    out[tipo] = { pctOro: oros / (oros + pl) * 100,
      pctRank: conRank / N * 100,
      deLosRank1215: (c.top1215 || 0) / ((c.corona || 0) + (c.top611 || 0) + (c.top1215 || 0)) * 100,
      pctPlataAlta: (c.plataAlta || 0) / pl * 100 };
  }
  return out;
});
comprobar(perfil.comun.pctOro > 30 && perfil.comun.pctOro < 55,
  `el común reparte más plata que oro, sin llegar a ser sólo plata (${perfil.comun.pctOro.toFixed(1)}% de oro)`);
comprobar(perfil.comun.pctRank < 25,
  `y un rankeado es raro: uno cada ${Math.round(100 / perfil.comun.pctRank)} sobres`);
comprobar(perfil.comun.deLosRank1215 > 90,
  `cuando cae uno, casi siempre es de los últimos puestos (${perfil.comun.deLosRank1215.toFixed(1)}% son del 12-15)`);
const bandas = await page.evaluate(() =>
  ({ alta: poolNivel('plataAlta').length, baja: poolNivel('plataBaja').length }));
comprobar(bandas.alta > 20 && bandas.baja > 20,
  `y las dos bandas de plata tienen fondo de sobra (${bandas.alta} altas · ${bandas.baja} bajas)`);
const subeAlta = ESCALERA.every((k, i) => i === 0 || oficio.exacto[k] > oficio.exacto[ESCALERA[i - 1]]);
comprobar(subeAlta,
  `y la carta alta sube en cada escalón (${ESCALERA.map(k => oficio.exacto[k].toFixed(2) + '%').join(' · ')})`);
const subePlataAlta = ESCALERA.every((k, i) => i === 0 || perfil[k].pctPlataAlta >= perfil[ESCALERA[i - 1]].pctPlataAlta);
comprobar(subePlataAlta,
  `y hasta las platas son mejores arriba (${ESCALERA.map(k => perfil[k].pctPlataAlta.toFixed(0) + '%').join(' · ')})`);

/* ── La Tienda y el flujo de apertura ──────────────────────────────────
   Un solo camino para los tres sobres: fila → pantalla del sobre → toque encima del
   sobre → walkout → resumen. Sin atajos y sin abrir varios de golpe. */
console.log('\n2c-ter. La tienda y el flujo de apertura');
const tienda = await page.evaluate(() => {
  S.gratis = {}; S.sobres = []; S.divisa = 1000; S.coleccion = [];
  ir('tienda');
  // se listan por la tarjeta, no por la acción: el gratis lleva "versobre" y los de pago
  // "comprar", justamente porque el gratis no pasa por el inventario
  /* Ahora el botón es EL PRECIO, no la tarjeta: leer lo que trae un sobre de 600 no puede
     costar 600. Así que se lista por tarjeta y el dato se saca de su precio. */
  const tarjetas = [...document.querySelectorAll('.sobre-fila')];
  const precios = tarjetas.map(t => t.querySelector('.precio'));
  return {
    sub: tmp.sub || 'comprar',
    orden: precios.map(b => b.dataset.t),
    acciones: precios.map(b => b.dataset.a),
    // el precio es un BOTÓN y la tarjeta no: tocar el nombre no compra
    precioEsBoton: precios.every(b => b.tagName === 'BUTTON'),
    precios: precios.map(b => b.textContent.trim()),
    /* EL SOBRE GRATIS YA NO ESTÁ EN LA TIENDA: en el boceto la tienda son cinco sobres de
       pago y el gratis se reclama en la ACTIVIDAD DIARIA de Inicio. */
    gratisEnInicio: (() => { ir('inicio');
      const b = document.querySelector('[data-a="versobre"][data-t="comun"]');
      const txt = b ? b.textContent.trim() : '';
      ir('tienda'); return txt; })(),
    // "Mis sobres" vacío lo dice y enlaza a Comprar
    vacio: (() => { const antes = S.sobres; S.sobres = []; tmp.sub = 'mios'; render();
      const t = document.querySelector('#app').textContent;
      const enlace = !!document.querySelector('.btn[data-a="sub"][data-v="comprar"]');
      S.sobres = antes; tmp.sub = 'comprar'; render();
      return { dice: /no tienes ning/i.test(t), enlace }; })(),
  };
});
comprobar(tienda.orden.join(',') === 'comun,raro,epico,legendario,ultimate',
  `las cinco filas del boceto, de barata a cara (${tienda.orden.join(', ')})`);
comprobar(tienda.precioEsBoton,
  'la tarjeta y su precio hacen lo mismo, para no tener que buscar dónde tocar');
comprobar(tienda.acciones.every(a => a === 'comprar'),
  `los cinco se compran: en la tienda ya no hay nada gratis (${tienda.acciones.join(', ')})`);
comprobar(/reclamar/i.test(tienda.gratisEnInicio),
  `el sobre gratis se reclama en Inicio, no en la tienda ("${tienda.gratisEnInicio}")`);
comprobar(tienda.precios.every(p => /\d\.\d{3}/.test(p)),
  `y los precios van con su punto de millar (${tienda.precios.join(' · ')})`);
comprobar(tienda.vacio.dice && tienda.vacio.enlace,
  'sin sobres guardados, "Mis sobres" lo dice y enlaza a Comprar');

/* Las probabilidades no van en la fila: van detrás de la (i) de la esquina. En la fila
   eran dos líneas de números que nadie lee al pasar y que la engordan; quien las quiere
   las quiere con sitio para leerlas. */
const laI = await page.evaluate(() => {
  S.divisa = 1000; S.sobres = []; ir('tienda');
  const fila = document.querySelector('.sobre-fila:has(.precio[data-t="epico"]) .fila');
  const enLaFila = /%/.test(fila.textContent);
  const i = document.querySelectorAll('.info').length;
  // la (i) está FUERA de la fila, para que tocarla no dispare también la fila
  const dentroDeLaFila = fila.querySelectorAll('.info').length;
  // y cada sobre lleva su arte de verdad, no un emoji
  window.__arte = [...document.querySelectorAll('.sobre-art img')].map(i => i.getAttribute('src'));
  document.querySelector('.info[data-t="epico"]').click();
  const capa = document.querySelector('.ov, #ov, .overlay') || document.body;
  const texto = capa.textContent;
  const abrio = /por carta de oro/i.test(texto);
  const sigueEnTienda = vista === 'tienda';
  cerrarOv();
  return { enLaFila, i, dentroDeLaFila, abrio, sigueEnTienda };
});
comprobar(!laI.enLaFila, 'la fila del sobre no lleva porcentajes encima');
comprobar(laI.i === 5 && laI.dentroDeLaFila === 0,
  `cada sobre lleva su (i) en la esquina, fuera de la fila (${laI.i} de 5)`);
comprobar(laI.abrio, 'y tocarla saca las probabilidades');
comprobar(laI.sigueEnTienda, 'sin salir de la tienda ni comprar nada');

/* La pantalla del sobre es el sobre sobre un fondo liso, y del toque se pasa al walkout
   sin escala intermedia. Antes cruzaban la pantalla unos arcos que se encendían del color
   del nivel y contaban lo que venía antes de ver la carta; se quitaron, y con ellos el
   compás de 850 ms que existía para enseñarlos. Lo que queda es que el toque bloquea el
   sobre y que en menos de medio segundo ya se está en el walkout. */
const flor = await page.evaluate(async () => {
  S.divisa = 9000; S.sobres = [{ tipo: 'epico' }]; ir('tienda'); tmp.sub = 'mios'; render();
  document.querySelector('[data-a="versobre"][data-t="epico"]').click();
  const esc = document.querySelector('#escena');
  const caja = document.querySelector('.sobre-toque');
  const fondoPuesto = esc.classList.contains('puesta');
  const trazos = esc.querySelectorAll('svg path').length;
  document.querySelector('[data-a="abrirsobre"]').click();
  const alInstante = { bloqueada: caja.disabled, vista };
  await new Promise(x => setTimeout(x, 500));
  const trasMedioSegundo = vista;
  pararAviso();
  return { fondoPuesto, trazos, alInstante, trasMedioSegundo };
});
comprobar(flor.fondoPuesto, 'la pantalla del sobre pone su fondo');
comprobar(flor.trazos === 0,
  `y ya no lleva florituras dibujadas encima (${flor.trazos} trazos)`);
comprobar(flor.alInstante.bloqueada, 'el toque bloquea el sobre, un segundo toque no hace nada');
comprobar(flor.trasMedioSegundo === 'apertura',
  `y en medio segundo ya se está en el walkout (${flor.trasMedioSegundo})`);

const arte = await page.evaluate(() => window.__arte || []);
comprobar(arte.length === 5 && arte.every(a => /^sobres\/.+\.webp$/.test(a)),
  `cada sobre lleva su arte propio (${arte.join(', ')})`);

/* Las secciones tienen que LLENAR la pantalla. Apiladas arriba dejaban media pantalla
   muerta debajo. */
const llenan = await page.evaluate(() => {
  const guardado = { vista, tmp };
  const out = {};
  // La tienda queda fuera a propósito: es una lista de tarjetas iguales que se comparan
  // entre ellas, no bloques estirados. Estirarlas rompería justamente la comparación.
  for (const v of ['inicio', 'club']) {
    ir(v);
    const q = document.querySelector('.pila');
    const barra = parseFloat(getComputedStyle(document.body).paddingBottom) || 0;
    out[v] = q ? Math.round(innerHeight - q.getBoundingClientRect().bottom - barra) : null;
  }
  vista = guardado.vista; tmp = guardado.tmp; render();
  return out;
});
// con tope de alto, lo que sobra se reparte arriba y abajo, así que se mide el hueco
// de abajo contra la mitad de lo que sobra, no contra cero
const cojas = Object.entries(llenan).filter(([, m]) => m === null || m > 130).map(([v]) => v);
comprobar(cojas.length === 0,
  `Inicio y Club reparten el alto sin dejar hueco muerto (${cojas.join(', ') || Object.values(llenan).map(m => m + 'px').join(' · ')})`);

/* Y en Inicio no puede haber estado de plantilla: eso es del Club. */
const inicioLimpio = await page.evaluate(() => {
  const guardado = { vista, tmp };
  ir('inicio');
  const t = document.querySelector('#app').textContent;
  vista = guardado.vista; tmp = guardado.tmp; render();
  /* Lo que no puede estar en Inicio es el MARCADOR de la plantilla —el recuento de
     rankeados y el "n/11"—, no la palabra: el subtítulo del Draft dice "elige tu
     plantilla y compite" y es del propio diseño. */
  return { plantilla: /rankeados|\d+\s*\/\s*11/i.test(t) || !!document.querySelector('#app [data-nav="plantilla"]'),
           margenes: /Finish|Decisión/i.test(t) };
});
comprobar(!inicioLimpio.plantilla, 'Inicio no lleva el estado de la plantilla: eso vive en Club');
comprobar(!inicioLimpio.margenes, 'ni la tabla de márgenes, que vive en Reglas');

/* COMPRAR Y ABRIR SON DOS DECISIONES DISTINTAS, y se toman en dos sitios distintos.
   Comprar cobra —tras confirmar— y mete el sobre en "Mis sobres". La pantalla del sobre no
   cobra nada: el sobre ya es tuyo cuando llegas, y lo único que se hace ahí es abrirlo. */
const compra = await page.evaluate(() => {
  window.__antes = { coleccion: S.coleccion.slice(), plantilla: { ...S.plantilla } };
  S.divisa = 3000; S.sobres = []; S.gratis = {}; S.coleccion = [];
  ir('tienda');
  const antes = { div: S.divisa, sobres: S.sobres.length };
  document.querySelector('.precio[data-a="comprar"][data-t="raro"]').click();
  document.querySelector('[data-a="confirmarcompra"]').click();   // pagar pide un sí
  return { antes, tras: { div: S.divisa, sobres: S.sobres.length, sub: tmp.sub, vista },
           cartas: S.coleccion.length };
});
comprobar(compra.tras.div === 1000 && compra.tras.sobres === 1,
  `la fila de Comprar paga y guarda el sobre (${compra.antes.div} → ${compra.tras.div})`);
comprobar(compra.cartas === 0 && compra.tras.vista === 'tienda',
  'y no abre nada: comprar y abrir son dos decisiones distintas');
comprobar(compra.tras.sub === 'mios',
  'después salta a "Mis sobres", que es donde acaba de aparecer');

const abrir = await page.evaluate(async () => {
  const guardado = { coleccion: S.coleccion.slice(), plantilla: { ...S.plantilla } };
  document.querySelector('[data-a="versobre"][data-t="raro"]').click();
  const enSobre = { vista, div: S.divisa, sobres: S.sobres.length };
  /* En esta pantalla no hay nada que pagar, así que no se enseña ningún precio: ni la
     chapa ni la moneda dibujada que la acompaña. */
  const hablaDePrecio = !!document.querySelector('#app .precio, #app .mon');
  document.querySelector('[data-a="abrirsobre"]').click();
  await new Promise(r => setTimeout(r, 950));
  const tras = { vista, div: S.divisa, sobres: S.sobres.length };
  pararAviso();
  S.coleccion = guardado.coleccion; S.plantilla = guardado.plantilla;
  return { enSobre, hablaDePrecio, tras };
});
comprobar(abrir.enSobre.vista === 'sobre' && abrir.enSobre.div === 1000 && abrir.enSobre.sobres === 1,
  'entrar a la pantalla del sobre no cobra ni consume nada');
comprobar(!abrir.hablaDePrecio, 'y ahí no se habla de precio: no hay nada que pagar');
comprobar(abrir.tras.div === 1000 && abrir.tras.sobres === 0,
  `abrir gasta el sobre y NO el dinero (${abrir.tras.div} monedas intactas)`);
comprobar(abrir.tras.vista === 'apertura',
  'y tras encenderse las florituras arranca el walkout');

/* Pagar pide un sí. Lo que protege de gastar 600 sin querer ya no es el tamaño del
   blanco, sino la confirmación — y por eso la tarjeta entera puede volver a valer.
   El gratis y abrir lo que ya tienes NO preguntan: no gastan nada, y preguntarlo sería
   un trámite delante de algo que no tiene consecuencia. */
const confirma = await page.evaluate(() => {
  const hayOv = () => !!document.querySelector('[data-a="confirmarcompra"]');
  S.divisa = 3000; S.sobres = []; S.gratis = {}; S.coleccion = []; ir('tienda');
  document.querySelector('.fila[data-a="comprar"][data-t="raro"]').click();
  const tarjeta = { pregunta: hayOv(), div: S.divisa, sobres: S.sobres.length };
  document.querySelector('[data-a="cerrarov"]').click();
  const cancelado = { div: S.divisa, sobres: S.sobres.length };
  document.querySelector('.precio[data-a="comprar"][data-t="raro"]').click();
  const desdeElPrecio = hayOv();
  document.querySelector('[data-a="confirmarcompra"]').click();
  const comprado = { div: S.divisa, sobres: S.sobres.length, sub: tmp.sub };
  ir('inicio');
  document.querySelector('[data-a="versobre"][data-t="comun"]').click();
  const gratis = { vista, pregunta: hayOv() };
  ir('tienda'); tmp.sub = 'mios'; render();
  document.querySelector('.fila[data-a="versobre"][data-t="raro"]').click();
  const abrir = { vista, pregunta: hayOv() };
  return { tarjeta, cancelado, desdeElPrecio, comprado, gratis, abrir };
});
comprobar(confirma.tarjeta.pregunta && confirma.tarjeta.div === 3000 && confirma.tarjeta.sobres === 0,
  'tocar la tarjeta de un sobre de pago pregunta antes, y no cobra nada todavía');
comprobar(confirma.cancelado.div === 3000 && confirma.cancelado.sobres === 0,
  'cancelar no cobra ni deja sobre');
comprobar(confirma.desdeElPrecio, 'y el precio hace exactamente lo mismo que la tarjeta');
comprobar(confirma.comprado.div === 1000 && confirma.comprado.sobres === 1,
  `confirmando sí se cobra y aparece el sobre (${confirma.comprado.div} monedas)`);
comprobar(confirma.comprado.sub === 'mios', 'y salta a "Mis sobres", que es donde ha aparecido');
comprobar(!confirma.gratis.pregunta && confirma.gratis.vista === 'sobre',
  'el gratis de Inicio no pregunta: no hay nada que confirmar');
comprobar(!confirma.abrir.pregunta && confirma.abrir.vista === 'sobre',
  'y abrir uno del inventario tampoco');

/* Sin fichas: la fila se lee entera, no responde y no da error. */
const pobre = await page.evaluate(() => {
  S.divisa = 0; S.sobres = []; S.gratis = { g1: Date.now() }; ir('tienda');
  const f = document.querySelector('.precio[data-t="ultimate"]');
  const fuera = f.closest('.sobre-fila');
  const antes = { div: S.divisa, cartas: S.coleccion.length, vista };
  f.click();
  return { apagada: fuera.classList.contains('apagada'), desactivada: f.disabled,
    precio: f.textContent.trim(),
    nombre: /ultimate/i.test(fuera.textContent),
    sigueIgual: vista === antes.vista && S.divisa === antes.div && S.coleccion.length === antes.cartas };
});
comprobar(pobre.apagada && pobre.desactivada, 'sin fichas, la fila sale apagada y no responde');
comprobar(pobre.precio.includes('12.500') && pobre.nombre,
  `y se sigue leyendo entera, con su precio (${pobre.precio})`);
comprobar(pobre.sigueIgual, 'y tocarla no hace nada ni da ningún error');

/* LEGENDARIO Y ULTIMATE LLEVAN CARTEL DE PRÓXIMAMENTE. Se quedan en la tienda —lo pidió
   así— pero no se pueden comprar: un sobre que todavía no existe no puede cobrarse, ni
   tocando la fila, ni el precio, ni llamando a hacerCompra() por detrás. */
const pronto = await page.evaluate(() => {
  S.divisa = 99000; S.sobres = []; ir('tienda');
  const filas = [...document.querySelectorAll('.sobre-fila')];
  const conCartel = filas.filter(f => f.querySelector('.cartel'))
    .map(f => f.querySelector('.precio').dataset.t);
  const antes = { div: S.divisa, sobres: S.sobres.length };
  for (const k of conCartel) {
    document.querySelector(`.fila[data-t="${k}"]`).click();
    document.querySelector(`.precio[data-t="${k}"]`).click();
    hacerCompra(k);
  }
  return { conCartel, siguen: S.divisa === antes.div && S.sobres.length === antes.sobres,
    texto: (filas.find(f => f.querySelector('.cartel')) || {}).textContent || '',
    ov: !!document.querySelector('[data-a="confirmarcompra"]') };
});
comprobar(pronto.conCartel.join(',') === 'legendario,ultimate',
  `el cartel va en legendario y ultimate (${pronto.conCartel.join(', ') || 'ninguno'})`);
comprobar(/pr[oó]ximamente/i.test(pronto.texto), 'y dice PRÓXIMAMENTE');
comprobar(pronto.siguen && !pronto.ov,
  'y no se pueden comprar ni por la fila, ni por el precio, ni llamando a hacerCompra()');

/* Y la (i) NO va en la pantalla del sobre: ahí no hay nada que comparar, sólo abrirlo. */
const iEnSobre = await page.evaluate(() => {
  S.sobres = [{ tipo: 'epico' }]; ir('tienda'); tmp.sub = 'mios'; render();
  document.querySelector('[data-a="versobre"][data-t="epico"]').click();
  const n = document.querySelectorAll('#app .info').length;
  ir('tienda'); tmp.sub = 'comprar'; render();
  return n;
});
comprobar(iEnSobre === 0, `la (i) es de la tienda, no de la pantalla del sobre (${iEnSobre})`);

/* LA FOTO DE PERFIL EMPIEZA VACÍA Y LA ELIGE EL JUGADOR. Antes salía sola la mejor carta
   de su plantilla, que es ponerle una cara que él no ha escogido. */
const avatar = await page.evaluate(() => {
  S = estadoNuevo();
  ir('perfil');
  const vacia = { guardado: S.avatar, foto: !!document.querySelector('#app .jug .cara img') };
  // se toca la cara y sale la rejilla de los tuyos
  document.querySelector('[data-a="elegiravatar"]').click();
  const ops = [...document.querySelectorAll('[data-a="ponavatar"]')];
  const abre = ops.length > 0;
  // ninguno repetido: uno por cara, no uno por carta
  const cids = ops.map(o => o.dataset.cid);
  const personas = cids.map(c => PORID[c].persona);
  const sinRepetir = new Set(personas).size === personas.length;
  // y todos los ofrecidos son tuyos
  const todosMios = cids.every(c => S.coleccion.some(x => x.cid === c));
  ops[0].click();
  const puesta = { guardado: S.avatar, foto: !!document.querySelector('#app .jug .cara img') };
  // si la carta deja de ser tuya, la foto se cae sola
  const suyo = S.avatar;
  S.coleccion = S.coleccion.filter(x => x.cid !== suyo);
  render();
  const tras = !!document.querySelector('#app .jug .cara img');
  // y se puede quitar a mano
  S = estadoNuevo(); S.avatar = carasElegibles()[0].id; render();
  document.querySelector('[data-a="elegiravatar"]').click();
  document.querySelector('[data-a="quitaravatar"]').click();
  const quitada = { guardado: S.avatar, foto: !!document.querySelector('#app .jug .cara img') };
  return { vacia, abre, sinRepetir, todosMios, puesta, tras, quitada, n: ops.length };
});
comprobar(avatar.vacia.guardado === '' && !avatar.vacia.foto,
  'la foto de perfil empieza vacía, no con la mejor carta de la plantilla');
comprobar(avatar.abre && avatar.todosMios,
  `tocarla ofrece a los peleadores de tu colección (${avatar.n})`);
comprobar(avatar.sinRepetir, 'uno por cara, no uno por carta');
comprobar(avatar.puesta.guardado && avatar.puesta.foto, 'elegir uno la pone y la guarda');
comprobar(!avatar.tras, 'y si la carta deja de ser tuya, la foto se cae sola');
comprobar(avatar.quitada.guardado === '' && !avatar.quitada.foto, 'y se puede quitar a mano');

comprobar(!(await page.evaluate(() => document.body.innerHTML.includes('abrirtodo'))),
  'no hay ninguna forma de abrir varios sobres de golpe');

/* El GRATIS no pasa por el inventario: se toca y va derecho al sobre en grande. Guardarlo
   primero, para tener que ir a "Mis sobres" a abrirlo, es un paso de trámite sobre algo
   que no cuesta nada y que se reclama justamente para abrirlo ya. */
const gratis = await page.evaluate(async () => {
  S.gratis = {}; S.sobres = []; S.divisa = 0; S.coleccion = [];
  ir('inicio');
  document.querySelector('[data-a="versobre"][data-t="comun"]').click();
  const enSobre = { vista, guardados: S.sobres.length };
  document.querySelector('[data-a="abrirsobre"]').click();
  await new Promise(r => setTimeout(r, 950));
  const r = { enSobre, vista, cartas: S.coleccion.length, guardados: S.sobres.length };
  pararAviso(); return r;
});
comprobar(gratis.enSobre.vista === 'sobre' && gratis.enSobre.guardados === 0,
  'el gratis va derecho al sobre en grande, sin pasar por el inventario');
const nComun = await page.evaluate(() => TIPOS_SOBRE.comun.cartas);
comprobar(gratis.vista === 'apertura' && gratis.cartas === nComun && gratis.guardados === 0,
  `y el toque lo abre ahí mismo, entregando sus ${nComun} cartas`);

/* La revelación tiene que ir POR PARTES también aquí. El walkout arranca después del
   encendido de las florituras, y ese retraso no puede comerse los pasos.

   Y LA FOTO ES LA ÚLTIMA. Se comprueba de dos maneras, porque una sola no basta: que
   've-foto' llegue después que todo lo demás, y que mientras tanto la foto esté de
   verdad oculta —una clase en su sitio con el CSS mal puesto dejaría la cara a la vista
   desde el primer fotograma, que es justo el fallo que se está tapando aquí—. */
const porPartes = await page.evaluate(async () => {
  S.gratis = {}; S.sobres = []; S.coleccion = []; ir('inicio');
  document.querySelector('[data-a="versobre"][data-t="comun"]').click();
  document.querySelector('[data-a="abrirsobre"]').click();
  await new Promise(r => setTimeout(r, 900));          // el encendido
  const t0 = performance.now(), visto = {};
  let conFoto = false, caraAntes = false;
  const mira = () => { const k = document.querySelector('.apertura-carta .carta'); if (!k) return;
    for (const cl of ['ve-pais', 've-peso', 've-record', 've-rk', 've-todo', 've-foto'])
      if (k.classList.contains(cl) && visto[cl] === undefined) visto[cl] = Math.round(performance.now() - t0);
    const img = k.querySelector('.c-foto');
    if (!img) return;
    conFoto = true;
    if (!k.classList.contains('ve-foto') && getComputedStyle(img).visibility !== 'hidden') caraAntes = true;
  };
  const iv = setInterval(mira, 10);
  await new Promise(r => setTimeout(r, 2600));
  clearInterval(iv); pararAviso();
  return { visto, conFoto, caraAntes };
});
const pasos = Object.values(porPartes.visto);
comprobar(pasos.length >= 4, `la carta se destapa por partes (${pasos.length} pasos)`);
comprobar(pasos.length >= 2 && pasos[pasos.length - 1] - pasos[0] > 600,
  `y separados en el tiempo, no de golpe (${pasos.join(', ')} ms)`);
comprobar(!porPartes.conFoto || !porPartes.caraAntes,
  'si la carta que ha tocado tiene foto, no se ve antes de tiempo');

/* Y la comprobación de que la foto va LA ÚLTIMA, con una carta elegida a propósito: la
   de arriba se juega la suerte de que el sobre traiga a alguien con foto, y hay
   dieciséis peleadores que no la tienen. */
const laFoto = await page.evaluate(async () => {
  /* Ni campeón ni top 5: esos llevan el anuncio y su revelación dura los 8,9 s del clip,
     que aquí serían ocho segundos de espera por una comprobación de orden. */
  const c = ROSTER.find(x => fotoSrc(x.persona, x.division)
    && x.estatus !== 'campeon' && x.estatus !== 'top5');
  if (!c) return { sinNadie: true };
  const it = { iid: 'iprueba', cid: c.id };
  S.coleccion.push(it);
  abrirTanda([it], 'comun');
  const t0 = performance.now(), orden = [];
  let caraAntes = false;
  const mira = () => { const k = document.querySelector('.apertura-carta .carta'); if (!k) return;
    for (const cl of ['ve-pais', 've-peso', 've-record', 've-rk', 've-todo', 've-foto'])
      if (k.classList.contains(cl) && !orden.includes(cl)) orden.push(cl);
    const img = k.querySelector('.c-foto');
    if (img && !k.classList.contains('ve-foto') && getComputedStyle(img).visibility !== 'hidden')
      caraAntes = true;
  };
  const iv = setInterval(mira, 10);
  await new Promise(r => setTimeout(r, 2600));
  clearInterval(iv); pararAviso();
  return { nombre: c.nombre, orden, caraAntes, ms: Math.round(performance.now() - t0) };
});
comprobar(!laFoto.sinNadie && laFoto.orden.includes('ve-foto'),
  `la carta con foto la destapa también (${laFoto.nombre})`);
comprobar(laFoto.orden[laFoto.orden.length - 1] === 've-foto',
  `y la foto es lo ÚLTIMO que aparece (${laFoto.orden.join(' → ')})`);
comprobar(!laFoto.caraAntes, 'y hasta ese momento la cara no se ve');

/* Con anuncio la revelación se reparte a mano contra el audio, y esa lista va indexada
   por cuántos pasos hay. Al meter la foto pasaron a ser seis, así que se comprueba que
   la tabla tiene el reparto de seis y que sigue acabando cuando acaba el clip: si se
   cayera al reparto de emergencia, la carta se soltaría descuadrada de la voz. */
const conAnuncio = await page.evaluate(() => {
  const c = ROSTER.find(x => x.estatus === 'campeon' && fotoSrc(x.persona, x.division));
  if (!c) return { sinNadie: true };
  const pasos = pasosAviso(c).map(p => p.k);
  const cuando = momentosAviso(NIVEL_APERTURA.corona, pasos.length);
  return { pasos, cuando, fin: ANUNCIO_MS };
});
comprobar(!conAnuncio.sinNadie && conAnuncio.pasos[conAnuncio.pasos.length - 1] === 'foto',
  `con anuncio la foto también va la última (${(conAnuncio.pasos || []).join(' → ')})`);
comprobar(conAnuncio.cuando && conAnuncio.cuando.length === conAnuncio.pasos.length + 1
  && conAnuncio.cuando.every((v, i, a) => i === 0 || v > a[i - 1])
  && conAnuncio.cuando[conAnuncio.cuando.length - 1] === conAnuncio.fin,
  `y los momentos siguen cuadrados con el clip (${(conAnuncio.cuando || []).join(', ')} ms)`);

/* Este bloque abre y compra sobres a mano, así que deja la colección y la plantilla en
   un estado cualquiera. Se rehacen antes de seguir: lo que viene detrás cuenta con una
   plantilla completa, y fallaría por algo que no tiene nada que ver con ello. */
await page.evaluate(() => { S = estadoNuevo(); for (let i = 0; i < 4; i++) abrirSobre('epico');
  autoPlantilla(S, true); guardar(); ir('inicio'); });

/* ── 2c. Sobre gratis ilimitado ───────────────────────────────────────── */
console.log('\n2c. Sobre gratis ilimitado');
const ilim = await page.evaluate(() => {
  S.gratis = {}; S.sobres = []; ir('inicio');
  const g = GRATIS.find(x => x.espera === 0);
  let cartas = 0;
  for (let i = 0; i < 5; i++) {
    if (!listoGratis(g)) return { fallo: 'dejó de estar disponible en la vuelta ' + i };
    cartas += abrirSobre(g.tipo).length;
  }
  return { fallo: null, cartas, guardados: S.sobres.length, debe: TIPOS_SOBRE[g.tipo].cartas * 5 };
});
comprobar(!ilim.fallo, 'el sobre gratis sigue disponible por muchas veces que se abra');
comprobar(ilim.cartas === ilim.debe, `cinco aperturas seguidas dan ${ilim.debe} cartas`);
comprobar(ilim.guardados === 0, 'y ninguna se queda guardada sin abrir');
comprobar(await page.evaluate(() => nGratisListos() <= 2),
  'el ilimitado no infla el aviso del menú');

// La distribución se mide sobre la salida REAL, abriendo sobres de verdad: un fallo en
// el reparto no se ve leyendo la tabla de probabilidades.
console.log('\n2c-bis. Distribución real de 2.000 sobres comunes');
const dist = await page.evaluate(() => {
  const cuenta = {}; let n = 0;
  const guardada = S.coleccion.slice();
  for (let i = 0; i < 2000; i++) {
    for (const it of abrirSobre('comun')) {
      const e = PORID[it.cid].estatus;
      cuenta[e] = (cuenta[e] || 0) + 1; n++;
    }
    S.coleccion = guardada.slice();   // sin acumular 18.000 cartas de prueba
  }
  const p = k => (cuenta[k] || 0) / n;
  const T = TIPOS_SOBRE.comun, totO = Object.values(T.oros).reduce((a, b) => a + b, 0);
  const mediaOros = Object.entries(T.oros).reduce((a, [k, w]) => a + (+k) * w, 0) / totO;
  return { n, cuenta, corona: p('campeon') + p('top5'), plata: p('plata'),
    oro: 1 - p('plata'), cartas: T.cartas, esperado: mediaOros / T.cartas,
    // los nombres viajan con el resultado: dentro del navegador sí existen
    orden: ORDEN_ESTATUS.map(e => [e, EST[e].n]) };
});
for (const [e, nombre] of dist.orden)
  console.log(`     ${nombre.padEnd(11)} ${((dist.cuenta[e] || 0) / dist.n * 100).toFixed(2)}%`);
comprobar(dist.corona <= 0.005,
  `campeón o top 5 por debajo del 0,5% de las cartas (${(dist.corona * 100).toFixed(3)}%)`);
/* Lo que se comprueba es que el ritmo REAL sea el DECLARADO, sea cual sea: el número sale
   de la propia tabla del sobre, no escrito a mano, para que no haya que tocar la prueba
   cada vez que se retoca el reparto. */
comprobar(Math.abs(dist.oro - dist.esperado) < 0.04,
  `los oros salen al ritmo declarado (${(dist.oro * dist.cartas).toFixed(2)} de ${dist.cartas}, declarados ${(dist.esperado * dist.cartas).toFixed(2)})`);
comprobar(dist.plata > 0.2, `y el resto son platas (${(dist.plata * 100).toFixed(1)}%)`);

// La escalera de calidad tiene que subir de un sobre al siguiente.
const escalera = await page.evaluate(() =>
  ['comun', 'raro', 'epico', 'legendario', 'ultimate'].map(k => pctCorona(k)));
comprobar(escalera.every((v, i) => i === 0 || v > escalera[i - 1]),
  `los campeones suben en cada escalón: ${escalera.map(v => v.toFixed(2)).join('% · ')}%`);

/* ── 2d. Amigos por código ────────────────────────────────────────────── */
/* El código de plantilla ya no existe: era un texto que había que copiar, pegar y
   volver a pegar para registrar el resultado, y para eso está la partida en directo,
   que juega de verdad. Lo que se comprueba ahora es que no quede ni rastro. */
const sinCodigos = await page.evaluate(() => ({
  fn: ['miCodigo','anadirAmigo','registrarResultado'].filter(n => typeof window[n] === 'function'),
  vista: typeof window.vAmigos === 'function',
  enlace: (ir('inicio'), !!document.querySelector('[data-nav="amigos"]')),
}));
comprobar(sinCodigos.fn.length === 0 && !sinCodigos.vista && !sinCodigos.enlace,
  `no queda nada del código de plantilla (${sinCodigos.fn.join(', ') || 'ni funciones, ni vista, ni enlace'})`);

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
const menu = await page.evaluate(() => {
  ir('jugar'); const j = document.querySelector('#app').textContent;
  ir('inicio'); const i = document.querySelector('#app').textContent;
  ir('desafios'); const d = document.querySelector('#app').textContent;
  return { j, i, d };
});
comprobar(/PvP/.test(menu.j) && /Contra un amigo/i.test(menu.j) && /Contra la IA/i.test(menu.j),
  'Jugar ofrece PvP, contra un amigo y contra la IA');
/* EL DRAFT SE MUDÓ DENTRO DE JUGAR y SBC a Desafíos: lo pidió el dueño con el boceto de
   la interfaz nueva. "Lo de draft está dentro de la parte de jugar", y es donde tenía que
   estar: es otra forma de jugar, no otra sección. */
comprobar(/Draft/.test(menu.j), 'y el Draft, que es otra forma de jugar, va ahí dentro');
comprobar(!/Draft/.test(menu.i), 'y ya no cuelga de Inicio');
comprobar(/SBC/.test(menu.d) && /Logros/i.test(menu.d),
  'Desafíos lleva SBC y Logros, que venían de Inicio y de Club');
// PvP y "contra un amigo" llevan las dos a la misma pantalla de directo: una crea la
// sala y la otra entra con el código. Que las dos lleguen ahí es lo que hay que asegurar.
const dosCaminos = await page.evaluate(() => {
  ir('jugar');
  return [...document.querySelectorAll('[data-nav="directo"]')].length;
});
comprobar(dosCaminos === 2,
  `PvP y contra un amigo llevan los dos a la partida en directo (${dosCaminos} caminos)`);

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
// Inicio → JUGAR → Contra la IA: el camino que hace el jugador de verdad
await page.evaluate(() => { ir('inicio'); });
await page.locator('[data-nav="jugar"]').click();
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

/* El tutorial ya no cuelga de Inicio: vive dentro de "Aprende a jugar". Mientras no se
   haya jugado, esa fila va marcada y el tutorial es lo primero de dentro.

   Y "Aprende a jugar" ya no está en Inicio, sino en PERFIL: el boceto de la interfaz
   nueva no le da sitio y el dueño lo dejó para más adelante -"lo de aprende, ya veremos
   dónde lo metemos"-, así que se aparca ahí abajo, bajo su rótulo, sin comérselo. */
const sinHacer = await page.evaluate(() => {
  S.tutorialHecho = false; ir('perfil');
  const mitad = document.querySelector('[data-nav="aprende"]');
  const roja = mitad && mitad.classList.contains('alerta');
  ir('aprende');
  const filas = [...document.querySelectorAll('.fila')];
  return { roja, primera: filas[0] && filas[0].dataset.a === 'tutorial',
           enInicio: (ir('inicio'), document.querySelectorAll('[data-a="tutorial"]').length) };
});
comprobar(sinHacer.roja, 'sin hacer el tutorial, "Aprende a jugar" va marcada en Perfil');
comprobar(sinHacer.primera, 'y dentro, el tutorial es la primera línea');
comprobar(sinHacer.enInicio === 0, 'pero no cuelga de Inicio: Inicio solo lleva a la sección');
await page.evaluate(() => { ir('aprende'); });
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
/* Hecho el tutorial: deja el rojo, las reglas pasan delante — y el tutorial NO
   desaparece, se puede repetir. */
const yaHecho = await page.evaluate(() => {
  ir('perfil');
  const mitad = document.querySelector('[data-nav="aprende"]');
  const roja = mitad && mitad.classList.contains('alerta');
  ir('aprende');
  const filas = [...document.querySelectorAll('.fila')];
  return { roja, primeraEsReglas: filas[0] && filas[0].dataset.nav === 'reglas',
           tutorialSigue: filas.some(f => f.dataset.a === 'tutorial') };
});
comprobar(!yaHecho.roja, 'hecho el tutorial, "Aprende a jugar" deja el rojo');
comprobar(yaHecho.primeraEsReglas, 'y las reglas pasan a ser la primera línea');
comprobar(yaHecho.tutorialSigue, 'pero el tutorial sigue ahí, para repetirlo');
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
