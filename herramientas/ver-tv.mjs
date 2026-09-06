/* Mira cómo queda y cómo se maneja el juego en una ANDROID TV —el Nvidia Shield y
   compañía—, y comprueba que en un MÓVIL no ha cambiado nada.

   Uso:  node herramientas/ver-tv.mjs [carpeta]

   QUÉ ES UNA TELE, PARA ESTO. No abre la aplicación a pantalla completa: la encajona en
   una ventana con forma de móvil en el centro de la pantalla. Y Android TV normaliza a
   960x540 dp en 720p, en 1080p y en 4K —lo que cambia con la resolución es la densidad,
   no los dp—, así que esa ventana mide COMO MUCHO 540 de alto y unos 304 de ancho. Por
   eso da igual la resolución del televisor: lo que hay que medir es ese rango.

   LAS CUATRO COSAS QUE MIDE:

   1. LA FORMA en todo el rango de ventana que puede dar una tele. Nada puede desbordar.

   2. EL APAISADO, que está DESCARTADO y se mide para que se vea por qué: soltar el
      bloqueo vertical parece lo obvio y rompe dos pantallas por falta de alto.

   3. EL TECLADO, que es lo que se pidió arreglar primero. Se simula la ventana ya
      encogida por él y se exige que los campos de las dos únicas pantallas que escriben
      —cuenta y sugerencias— se sigan viendo enteros y sin que los tape la barra.

   4. LA CRUCETA del mando: que se entre por el contenido, que en una rejilla la derecha
      se quede en la fila y avance, que abajo baje por la misma columna, que el OK pulse,
      que se llegue a las pestañas y que el foco SE VEA.

   Y AL FINAL, LO MÁS IMPORTANTE: que en un móvil no exista ni un rastro de todo esto.
*/
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SALIDA = process.argv[2] || 'tv';
const PANTALLAS = ['tienda', 'club', 'inicio', 'desafios', 'perfil', 'coleccion', 'plantilla', 'reciclaje'];
const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const nav = await chromium.launch({
  args: ['--blink-settings=minimumFontSize=8,minimumLogicalFontSize=8'],
  ...(fs.existsSync(exe) ? { executablePath: exe } : {}),
});

let mal = 0;
const ok = (c, q) => { console.log((c ? '  ok  ' : 'FALLA ') + q); if (!c) mal++; };

const abrir = async (w, h, tv) => {
  const pag = await nav.newPage({ viewport: { width: w, height: h } });
  const fallos = [];
  pag.on('pageerror', e => fallos.push(String(e)));
  await pag.goto('file://' + path.resolve('juego/juego.html') + (tv ? '?tv=1' : ''));
  await pag.waitForFunction(() => typeof window.ROSTER !== 'undefined');
  await pag.waitForTimeout(400);
  return [pag, fallos];
};
const desborde = async (pag, v) => {
  await pag.evaluate(p => { ir(p); }, v);
  await pag.waitForTimeout(200);
  return pag.evaluate(() => document.documentElement.scrollHeight - innerHeight);
};

/* ── 1. LA FORMA EN TODA VENTANA DE TELE ─────────────────────────────────── */
fs.mkdirSync(SALIDA, { recursive: true });
/* DOS ESCENARIOS, Y HAY QUE MEDIR LOS DOS.

   EL BUENO: el juego le pide al WebView 495 px de ancho de CSS, y entonces el alto sube
   en proporción hasta unos 879 y la maqueta tiene el sitio de un móvil. Ahí no se
   desborda NADA.

   EL DE REPUESTO: si un WebView no hace caso a ese ancho, se queda con los ~304x540 de
   la ventana física. Ahí las pantallas de menú SÍ se desplazan —no cabe, y apretarlas
   era lo que amontonaba los textos—, pero las de CARTAS siguen sin desplazarse ni un
   píxel, que ésa es la regla que no se toca. */
console.log('\n══ 1. LA VENTANA DE UNA TELE (720p, 1080p y 4K dan los mismos dp)');
const CARTAS = ['coleccion', 'plantilla', 'reciclaje'];
for (const [etq, w, h, exigir] of [
  ['el bueno: con el ancho de CSS que pide el juego', 495, 879, 'todas'],
  ['de repuesto: si el WebView no hace caso al ancho', 304, 540, 'cartas'],
  ['de repuesto, ventana más ancha', 420, 746, 'cartas'],
]) {
  const [pag, fallos] = await abrir(w, h, true);
  const partes = [];
  for (const v of PANTALLAS) {
    const d = await desborde(pag, v);
    partes.push(`${v.slice(0, 5)} ${d}`);
    if (d > 0 && (exigir === 'todas' || CARTAS.includes(v))) mal++;
    if (w === 495) await pag.screenshot({ path: path.join(SALIDA, v + '.png') });
  }
  ok(!fallos.length, `${etq}  —  ${w}x${h}\n         desbordes: ${partes.join(' · ')}`);
  await pag.close();
}

/* ── 1 bis. QUE NO SE PISE NADA ───────────────────────────────────────────
   LA COMPROBACIÓN QUE FALTABA, y la encontró él: "inicio por ejemplo estoy viéndolas
   unas apiladas en otras, y eso NO ME SIRVE".

   Medir `scrollHeight - innerHeight` sólo caza que se desborde LA PÁGINA. Aquí el
   contenido se salía DENTRO de su panel: las columnas de menú son flex con
   `flex-basis:0`, que reparte por el factor de crecimiento y no por lo que ocupa cada
   uno, y con `min-height:0` encogen por debajo de su propio texto sin quejarse. La
   página no se desbordaba ni un píxel y las letras se montaban unas encima de otras.

   Así que se mide lo que se ve: se cogen los elementos de texto SIN HIJOS y se miran de
   dos en dos; si dos se solapan más de un tercio, se están pisando. En un móvil salen
   cero en las cinco pantallas, así que cero es la vara. */
console.log('\n══ 1 bis. QUE NO SE PISE NINGÚN TEXTO');
for (const [etq, w, h, tv] of [['tele 495', 495, 879, true], ['tele 304', 304, 540, true], ['móvil', 390, 844, false]]) {
  const [pag] = await abrir(w, h, tv);
  for (const v of ['inicio', 'tienda', 'club', 'desafios', 'perfil']) {
    await pag.evaluate(p => { ir(p); }, v);
    await pag.waitForTimeout(240);
    const pisan = await pag.evaluate(() => {
      const hojas = [...document.querySelectorAll('#app *')].filter(e => {
        const cs = getComputedStyle(e);
        return cs.display !== 'none' && cs.visibility !== 'hidden'
          && e.children.length === 0 && (e.textContent || '').trim().length > 1;
      }).map(e => ({ e, r: e.getBoundingClientRect() })).filter(o => o.r.width > 2 && o.r.height > 2);
      const mal = [];
      for (let i = 0; i < hojas.length; i++) for (let j = i + 1; j < hojas.length; j++) {
        const a = hojas[i].r, b = hojas[j].r;
        const ov = Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left))
                 * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
        if (ov > Math.min(a.width * a.height, b.width * b.height) * 0.35)
          mal.push(`«${(hojas[i].e.textContent || '').trim().slice(0, 16)}» sobre «${(hojas[j].e.textContent || '').trim().slice(0, 16)}»`);
      }
      return [...new Set(mal)];
    });
    ok(pisan.length === 0, `${etq} · ${v}: ningún texto encima de otro${pisan.length ? '  → ' + pisan.slice(0, 3).join(' · ') : ''}`);
  }
  await pag.close();
}

/* ── 2. POR QUÉ NO SE SUELTA EL BLOQUEO VERTICAL ─────────────────────────── */
console.log('\n══ 2. APAISADO 960x540 — DESCARTADO, y aquí está el motivo');
{
  const [pag] = await abrir(960, 540, true);
  const rotos = [];
  for (const v of PANTALLAS) { const d = await desborde(pag, v); if (d > 0) rotos.push(`${v} ${d}px`); }
  console.log(`  se romperían: ${rotos.join(' · ') || 'ninguna'}`);
  ok(rotos.length > 0, 'sigue habiendo motivo para no soltarlo (si esto falla, replantéalo)');
  await pag.close();
}

/* ── 3. EL TECLADO ───────────────────────────────────────────────────────── */
console.log('\n══ 3. CON EL TECLADO ABIERTO (la ventana se queda al 55%)');
/* Se prueba con la ventana MUY encogida —al 55% en la tele— porque el teclado de una
   televisión es enorme. Y SE ENFOCA EL CAMPO, que es lo que pasa de verdad: sin
   enfocarlo no se dispara ni el arrastre a la vista ni el quitar la barra, y la medida
   no diría nada de lo que ve quien escribe. */
for (const [etq, w, h] of [['tele', 304, 297], ['tele', 304, 360], ['móvil', 390, 464]]) {
  const [pag] = await abrir(w, h, etq === 'tele');
  for (const v of ['sugerencias', 'cuenta']) {
    await pag.evaluate(p => { ir(p); }, v);
    await pag.waitForTimeout(220);
    await pag.evaluate(() => { const c = document.querySelector('textarea.campo, input.campo'); if (c) c.focus(); });
    await pag.waitForTimeout(260);
    const m = await pag.evaluate(() => {
      const c = document.querySelector('textarea.campo, input.campo');
      const r = c && c.getBoundingClientRect();
      const b = document.getElementById('nav');
      const rb = b && b.getBoundingClientRect();
      const tapa = !!(r && rb && rb.height && r.bottom > rb.top);
      return { ve: !!r && r.top >= 0 && r.bottom <= innerHeight, tapa };
    });
    ok(m.ve && !m.tapa, `${etq} ${w}x${h}: en ${v} el campo se ve ENTERO y no lo tapa la barra`);
  }
  await pag.close();
}

/* ── 4. LA CRUCETA ───────────────────────────────────────────────────────── */
console.log('\n══ 4. LA CRUCETA DEL MANDO');
{
  const [pag, fallos] = await abrir(304, 540, true);
  const donde = () => pag.evaluate(() => {
    const a = document.activeElement;
    if (!a || a === document.body) return null;
    const r = a.getBoundingClientRect();
    return { x: Math.round(r.left), y: Math.round(r.top), carta: a.classList.contains('carta'),
             enNav: !!a.closest('#nav') };
  });
  const pulsa = async k => { await pag.keyboard.press(k); await pag.waitForTimeout(80); return donde(); };

  await pag.evaluate(() => ir('coleccion'));
  await pag.waitForTimeout(400);
  ok(await pag.evaluate(() => document.querySelectorAll('.carta[tabindex]').length > 0),
    'las cartas reciben tabindex, que sin eso la cruceta no llega a ellas');

  let f = await pulsa('ArrowDown');
  ok(!!f && await pag.evaluate(() => !!document.activeElement.closest('#app')),
    'se entra por el contenido y no por el engranaje de la cabecera');
  let n = 0; while (f && !f.carta && n++ < 8) f = await pulsa('ArrowDown');
  ok(!!f && f.carta, 'bajando se llega a las cartas');

  const fila = [f];
  for (let i = 0; i < 3; i++) fila.push(await pulsa('ArrowRight'));
  ok(fila.every(a => a.y === fila[0].y), 'la derecha NO se sale de la fila');
  ok(fila[3].x > fila[0].x, 'y avanza de columna');
  const ab = await pulsa('ArrowDown');
  ok(ab.x === fila[3].x && ab.y > fila[3].y, 'abajo baja por la MISMA columna');
  const iz = await pulsa('ArrowLeft');
  ok(iz.x < ab.x && iz.y === ab.y, 'izquierda retrocede sin cambiar de fila');

  ok(await pag.evaluate(() => parseFloat(getComputedStyle(document.activeElement).outlineWidth) >= 2),
    'el foco SE VE: lleva contorno');

  await pag.keyboard.press('Enter');
  await pag.waitForTimeout(400);
  ok(await pag.evaluate(() => !!document.querySelector('.ov')), 'el OK del mando pulsa la carta');

  await pag.evaluate(() => { const o = document.querySelector('.ov'); if (o) o.remove(); ir('inicio'); });
  await pag.waitForTimeout(350);
  let llega = false;
  for (let i = 0; i < 14 && !llega; i++) { const a = await pulsa('ArrowDown'); llega = !!(a && a.enNav); }
  ok(llega, 'se llega a las pestañas de abajo');
  ok(!fallos.length, 'y sin un solo error de JavaScript' + (fallos.length ? ': ' + fallos[0] : ''));
  await pag.close();
}

/* ── 4 bis. EL ATRÁS DEL MANDO ───────────────────────────────────────────── */
console.log('\n══ 4 bis. EL ATRÁS DEL MANDO');
{
  const [pag, fallos] = await abrir(304, 540, true);
  const r = await pag.evaluate(async () => {
    const esperar = () => new Promise(r => setTimeout(r, 220));
    const out = {};
    /* Lo que importa: desde una pantalla CON flecha, el mando va a donde va la flecha
       —Club— y no a Inicio, que es lo que hacía antes. */
    ir('club'); await esperar(); ir('coleccion'); await esperar();
    out.deColeccion = [window.atrasTV(), vista];
    /* Un cartel abierto se cierra y no se navega. */
    ir('coleccion'); await esperar();
    const c = document.querySelector('.carta[data-carta]'); if (c) c.click();
    await esperar();
    out.conCartel = [!!document.getElementById('ov'), window.atrasTV(),
                     !!document.getElementById('ov'), vista];
    /* Una pestaña no tiene flecha: ahí sí, a Inicio. */
    ir('perfil'); await esperar();
    out.dePerfil = [!!document.querySelector('#app .pcab button.volver'), window.atrasTV(), vista];
    /* Y en Inicio se sale de la aplicación. */
    ir('inicio'); await esperar();
    out.deInicio = window.atrasTV();
    return out;
  });
  ok(r.deColeccion[0] === 'nada' && r.deColeccion[1] === 'club',
    `desde Colección el mando vuelve a CLUB, como la flecha, y no a Inicio (${r.deColeccion[1]})`);
  ok(r.conCartel[0] && r.conCartel[1] === 'nada' && !r.conCartel[2] && r.conCartel[3] === 'coleccion',
    'con un cartel abierto lo cierra y no se mueve de la pantalla');
  ok(!r.dePerfil[0] && r.dePerfil[2] === 'inicio',
    'desde una pestaña, que no tiene flecha, va a Inicio');
  ok(r.deInicio === 'salir', 'y en Inicio le dice a Android que cierre la aplicación');
  ok(!fallos.length, 'sin errores');
  await pag.close();
}

/* ── 5. EN MÓVIL, NI RASTRO ──────────────────────────────────────────────── */
console.log('\n══ 5. EN UN MÓVIL NO EXISTE NADA DE ESTO');
{
  const [pag, fallos] = await abrir(390, 844, false);
  const m = await pag.evaluate(async () => {
    ir('coleccion'); await new Promise(r => setTimeout(r, 300));
    return { clase: document.documentElement.classList.contains('tv'),
             tabindex: document.querySelectorAll('[tabindex]').length,
             marcar: typeof window.marcarFocos,
             atras: typeof window.atrasTV,
             suelo: getComputedStyle(document.querySelector('button')).scrollMarginTop };
  });
  ok(!m.clase, 'no hay clase .tv');
  ok(m.tabindex === 0, `no hay ni un elemento con tabindex (${m.tabindex})`);
  ok(m.marcar === 'undefined', 'marcarFocos ni existe');
  ok(m.atras === 'undefined', 'ni atrasTV: el atrás del móvil sigue siendo el de siempre');
  ok(m.suelo === '0px' || m.suelo === 'auto', `ni scroll-margin de tele (${m.suelo})`);
  await pag.evaluate(() => ir('inicio'));
  await pag.waitForTimeout(250);
  await pag.keyboard.press('ArrowDown');
  await pag.waitForTimeout(150);
  ok(await pag.evaluate(() => document.activeElement === document.body),
    'y las flechas no mueven ningún foco: el juego es exactamente el de siempre');
  ok(!fallos.length, 'sin errores');
  await pag.close();
}

await nav.close();
console.log(mal ? `\n${mal} PROBLEMAS` : `\nTodo bien. Fotos de la tele en ${SALIDA}/`);
process.exit(mal ? 1 : 0);
