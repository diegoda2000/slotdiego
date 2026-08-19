/* Prueba del servidor YA DESPLEGADO.

   No vale con que el despliegue termine en verde: eso solo dice que el archivo se
   subió. Esto abre dos clientes de verdad contra la dirección publicada y juega una
   partida entera, comprobando además lo único que justifica que exista un servidor:
   que ninguna carta del rival sin resolver llega al otro lado.

   Usa el WebSocket que trae Node 22 de serie, así que no necesita ni navegador ni
   dependencias. Corre en GitHub Actions justo después de desplegar, y si falla, el
   APK no se publica.

   Uso:  node servidor/prueba-en-vivo.mjs https://…workers.dev
*/
import '../juego/roster.js';
import '../juego/motor.js';

const BASE = (process.argv[2] || '').replace(/\/+$/, '');
if (!BASE) { console.error('Falta la dirección del servidor'); process.exit(1); }

generarRoster();

let fallos = 0;
const comprobar = (c, t) => { console.log((c ? '  ✓ ' : '  ✗ ') + t); if (!c) fallos++; };
const dormir = ms => new Promise(r => setTimeout(r, ms));

function plantillaLegal(desde) {
  const usados = new Set(), out = [];
  for (const d of DIVISIONES) {
    const pool = ROSTER.filter(c => c.alineable && c.division === d.id && !usados.has(c.persona));
    const c = pool[desde % pool.length] || pool[0];
    usados.add(c.persona); out.push(c.id);
  }
  return out;
}

// Un cliente mínimo: guarda el último estado recibido y los errores del servidor.
function cliente(nombre, codigo, cartas) {
  const c = { nombre, P: null, errores: [], sala: null, cerrado: false };
  const url = BASE.replace(/^http/, 'ws') + '/sala/' + codigo +
    '?jugador=' + encodeURIComponent('prueba-' + nombre + '-' + Date.now());
  c.ws = new WebSocket(url);
  c.ws.addEventListener('open', () => c.ws.send(JSON.stringify({ t: 'unirse', nombre, cartas })));
  c.ws.addEventListener('message', ev => {
    const m = JSON.parse(ev.data);
    if (m.t === 'estado') c.P = m.P;
    else if (m.t === 'sala') c.sala = m;
    else if (m.t === 'error') c.errores.push(m.motivo);
  });
  c.ws.addEventListener('close', () => { c.cerrado = true; });
  c.enviar = o => c.ws.send(JSON.stringify(o));
  return c;
}

const esperar = async (fn, ms = 20000) => {
  const fin = Date.now() + ms;
  while (Date.now() < fin) { if (fn()) return true; await dormir(120); }
  return false;
};

console.log(`\nProbando el servidor desplegado: ${BASE}\n`);

/* ── 1. Responde y es el servidor del juego ───────────────────────────── */
console.log('1. El servidor responde');
const raiz = await fetch(BASE + '/').then(r => r.json()).catch(e => ({ error: String(e) }));
comprobar(raiz && raiz.servicio === 'jaula-abierta',
  `contesta y se identifica como el servidor del juego (${JSON.stringify(raiz).slice(0, 90)})`);

const sala = await fetch(BASE + '/sala', { method: 'POST' }).then(r => r.json()).catch(e => ({ error: String(e) }));
comprobar(sala && /^[A-HJ-NP-Z2-9]{6}$/.test(sala.codigo || ''),
  `crea salas con código legible (${sala.codigo || sala.error})`);
if (!sala.codigo) { console.log('\nSin código no se puede seguir.\n'); process.exit(1); }

/* ── 2. Dos clientes entran y arranca la partida ──────────────────────── */
console.log('\n2. Dos jugadores en la misma sala');
const cartasA = plantillaLegal(0), cartasB = plantillaLegal(3);
const A = cliente('Ana', sala.codigo, cartasA);
const B = cliente('Beto', sala.codigo, cartasB);
comprobar(await esperar(() => A.P && B.P && A.P.fase === 'rol'),
  'la partida arranca sola en cuanto entra el segundo');
if (!A.P) { console.log('\nNo arrancó.\n'); process.exit(1); }

/* ── 3. Las cartas del rival no viajan ────────────────────────────────── */
console.log('\n3. Las cartas del rival están ocultas');
const soloDeB = cartasB.filter(id => !cartasA.includes(id));
const crudoA = JSON.stringify(A.P);
comprobar(soloDeB.every(id => !crudoA.includes(`"${id}"`)),
  `ninguna carta exclusiva de Beto aparece en el estado de Ana (${soloDeB.length} comprobadas)`);

/* ── 4. Partida completa ──────────────────────────────────────────────── */
console.log('\n4. Partida completa contra el servidor desplegado');
A.enviar({ t: 'rol', v: 'vetar' });
B.enviar({ t: 'rol', v: 'declarar' });
comprobar(await esperar(() => A.P.fase === 'vetos'), 'la elección de rol se resuelve');

/* Una jugada por estado, no una por vuelta.

   El bucle gira cada 90 ms, y contra un servidor de verdad la respuesta tarda más que
   eso: si se manda en cada vuelta, la misma jugada sale dos y tres veces antes de que
   llegue el estado nuevo. La segunda la rechaza el servidor —con razón, ese duelo ya
   está resuelto— y la prueba se cae por algo que no es un fallo del juego. Una persona
   tampoco pulsa el botón otra vez mientras la pantalla sigue igual. */
const firma = P => JSON.stringify([P.fase, P.vetados.length, P.jugadas.length,
  P.turno, P.duelo, P.marcador.j, P.marcador.r]);

let fugas = 0;
for (let vuelta = 0; vuelta < 400 && A.P.fase !== 'fin'; vuelta++) {
  for (const c of [A, B]) {
    const P = c.P; if (!P) continue;

    // la vigilancia de fugas sí mira en cada vuelta: es lo que se está comprobando
    if (P.fase !== 'fin') {
      const permitidas = new Set(P.jugadas);
      fugas += Object.entries(P.cartas.r).filter(([d, x]) => x && !permitidas.has(d)).length;
    }

    const f = firma(P);
    if (c.ultima === f) continue;     // la pantalla no ha cambiado: nada nuevo que jugar
    c.ultima = f;

    if (P.fase === 'vetos' && ((P.vetados.length % 2 === 0) === (P.vetoPrimero === 'j'))) {
      const libres = DIVISIONES.map(d => d.id).filter(x => !P.vetados.includes(x));
      c.enviar({ t: 'veto', division: libres[0] });
    } else if (P.fase === 'confirmar' && P.pendienteConf && P.pendienteConf.defensor === 'j') {
      c.enviar({ t: 'confirmar' });
    } else if (P.fase === 'incomodo' && P.pendiente) {
      c.enviar({ t: 'incomodo', idx: 0 });
    } else if (P.fase === 'duelos' && P.turno === 'j') {
      c.enviar({ t: 'declarar', division: librePara(P, 'j')[0], stat: P.statsVivas[0] });
    } else if (P.fase === 'desempate') {
      c.enviar({ t: 'desempate' });
    }
  }
  await dormir(90);
}

comprobar(A.P.fase === 'fin', `la partida llega al final (${A.P.fase})`);
comprobar(A.P.marcador.j === B.P.marcador.r && A.P.marcador.r === B.P.marcador.j,
  `los dos ven el mismo marcador desde su lado (${A.P.marcador.j}-${A.P.marcador.r} / ${B.P.marcador.j}-${B.P.marcador.r})`);
comprobar(A.P.fin !== B.P.fin, 'uno gana y el otro pierde');
comprobar(fugas === 0, `cero cartas del rival filtradas durante la partida (${fugas})`);
comprobar(A.errores.length === 0 && B.errores.length === 0,
  `el servidor no rechazó ninguna jugada legal (${[...A.errores, ...B.errores].join(' | ') || 'ninguna'})`);

A.ws.close(); B.ws.close();
console.log(fallos === 0
  ? '\nEL SERVIDOR DESPLEGADO FUNCIONA\n'
  : `\n${fallos} COMPROBACIONES FALLIDAS\n`);
process.exit(fallos === 0 ? 0 : 1);
