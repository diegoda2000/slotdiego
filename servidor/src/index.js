/* ═══════════════════════════════════════════════════════════════════════════
   Servidor de partidas en vivo — Cloudflare Worker + Durable Objects

   Un Durable Object por sala. Es el árbitro: conoce las dos plantillas y no se
   las enseña a nadie hasta que cada duelo se resuelve. Esa es toda la razón de
   que exista un servidor en este juego — las cartas están ocultas, así que la
   plantilla del rival no puede vivir en el móvil del otro.

   El motor de reglas es el mismo archivo que usa el cliente. No hay una copia
   del reglamento aquí: si divergieran, el servidor arbitraría un juego distinto
   al que la gente cree estar jugando.
   ═══════════════════════════════════════════════════════════════════════════ */

import '../../juego/motor.js';   // define globalThis.MOTOR y sus nombres sueltos

generarRoster();   // mismo catálogo que los clientes, de la misma semilla fija

// Sin O/0 ni I/1: los códigos se dictan por teléfono.
const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const codigoNuevo = () => Array.from({ length: 6 },
  () => ALFABETO[Math.floor(Math.random() * ALFABETO.length)]).join('');

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};
const json = (o, s = 200) =>
  new Response(JSON.stringify(o), { status: s, headers: { 'Content-Type': 'application/json', ...CORS } });

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const ruta = url.pathname.replace(/\/+$/, '');

    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });
    if (ruta === '' || ruta === '/') return json({ ok: true, servicio: 'jaula-abierta' });

    if (ruta === '/sala' && req.method === 'POST') return json({ codigo: codigoNuevo() });

    const m = ruta.match(/^\/sala\/([A-Za-z0-9]{4,12})$/);
    if (m) {
      const codigo = m[1].toUpperCase();
      return env.SALAS.get(env.SALAS.idFromName(codigo)).fetch(req);
    }
    return json({ error: 'ruta desconocida' }, 404);
  },
};

/* ── La sala ──────────────────────────────────────────────────────────────── */

export class Sala {
  constructor(ctx, env) {
    this.ctx = ctx;
    this.conex = new Map();       // jugadorId -> WebSocket
    this.jugadores = new Map();   // jugadorId -> {nombre, cartas, lado}
    this.P = null;
    this.rolElegido = {};         // lado -> 'vetar' | 'declarar'
  }

  async fetch(req) {
    const url = new URL(req.url);
    if (req.headers.get('Upgrade') !== 'websocket')
      return json({ error: 'se esperaba una conexión websocket' }, 426);

    const jugadorId = (url.searchParams.get('jugador') || '').slice(0, 40);
    if (!jugadorId) return json({ error: 'falta el identificador de jugador' }, 400);

    const par = new WebSocketPair();
    const [cliente, servidor] = Object.values(par);
    servidor.accept();

    // Reconectar: si ya estabas dentro, se sustituye tu conexión y sigues en tu lado.
    const anterior = this.conex.get(jugadorId);
    if (anterior) { try { anterior.close(1000, 'reemplazada'); } catch (e) {} }
    this.conex.set(jugadorId, servidor);

    servidor.addEventListener('message', ev => {
      let msg;
      try { msg = JSON.parse(ev.data); } catch (e) { return; }
      try { this.recibir(jugadorId, msg); }
      catch (e) { this.enviar(jugadorId, { t: 'error', motivo: String(e.message || e) }); }
    });
    servidor.addEventListener('close', () => {
      if (this.conex.get(jugadorId) === servidor) this.conex.delete(jugadorId);
      this.difundirPresencia();
    });

    if (this.jugadores.has(jugadorId)) this.mandarEstado();   // reconexión en curso

    return new Response(null, { status: 101, webSocket: cliente });
  }

  /* ── envío ── */
  enviar(id, obj) {
    const ws = this.conex.get(id);
    if (ws) { try { ws.send(JSON.stringify(obj)); } catch (e) {} }
  }
  difundir(obj) { for (const id of this.conex.keys()) this.enviar(id, obj); }

  difundirPresencia() {
    for (const [id, j] of this.jugadores) {
      this.enviar(id, {
        t: 'sala',
        tuLado: j.lado,
        jugadores: [...this.jugadores.values()].map(x => ({
          nombre: x.nombre, lado: x.lado, conectado: this.conex.has(this.idDe(x)),
        })),
      });
    }
  }
  idDe(jug) { for (const [id, j] of this.jugadores) if (j === jug) return id; return null; }
  ladoDe(id) { const j = this.jugadores.get(id); return j ? j.lado : null; }
  otroLado(l) { return l === 'j' ? 'r' : 'j'; }
  nombreDeLado(l) {
    for (const j of this.jugadores.values()) if (j.lado === l) return j.nombre;
    return 'Rival';
  }

  mandarEstado() {
    for (const [id, j] of this.jugadores) {
      if (!this.P) continue;
      this.enviar(id, { t: 'estado', P: this.vistaDe(j.lado) });
    }
  }

  /* ── LA REDACCIÓN: lo único que hace que las cartas ocultas lo estén de verdad ──
     Del rival solo salen las cartas de divisiones ya resueltas. Al acabar la
     partida se revela todo, que es cuando ya no hay nada que proteger.
     Además se voltean los lados, para que cada cliente se vea siempre como 'j' y
     todas sus pantallas funcionen sin enterarse de que hay red por medio. */
  vistaDe(lado) {
    const P = this.P, mio = lado, otro = this.otroLado(lado), flip = lado === 'r';
    const fin = P.fase === 'fin';

    const V = {
      fase: P.fase, vetados: P.vetados, vetoAzar: P.vetoAzar, enJuego: P.enJuego,
      jugadas: P.jugadas, statsVivas: P.statsVivas, duelo: P.duelo,
      turno: P.turno === mio ? 'j' : 'r',
      vetoPrimero: P.vetoPrimero === mio ? 'j' : 'r',
      marcador: { j: P.marcador[mio], r: P.marcador[otro] },
      jugada: { j: P.jugada[mio], r: P.jugada[otro] },
      cartas: { j: { ...P.cartas[mio] }, r: {} },
      ajustes: { j: { ...P.ajustes[mio] }, r: {} },
      log: P.log.map(l => l.t !== 'duelo' ? l : {
        ...l,
        ganador: l.ganador === mio ? 'j' : 'r',
        vj: flip ? l.vr : l.vj, vr: flip ? l.vj : l.vr,
        nj: flip ? l.nr : l.nj, nr: flip ? l.nj : l.nr,
      }),
      fin: P.fin ? (P.fin === mio ? 'j' : 'r') : null,
      rival: this.nombreDeLado(otro),
      pendiente: null,
      pendienteVet: null,
      online: true,
    };

    const visibles = fin ? P.enJuego.concat([P.vetoAzar]) : P.jugadas;
    for (const d of visibles) {
      if (P.cartas[otro][d]) V.cartas.r[d] = P.cartas[otro][d];
      if (P.ajustes[otro][d]) V.ajustes.r[d] = P.ajustes[otro][d];
    }

    // El Incómodo: al defensor le llegan las dos opciones, pero NUNCA cuál es la
    // buena ni la stat. Al atacante no le llega nada: solo espera.
    if (P.fase === 'incomodo') {
      if (P.pendiente.defensor === mio) V.pendiente = { plus: P.pendiente.plus, opciones: P.pendiente.opciones };
      else V.fase = 'esperando';
    }
    // La decisión del Veterano es del defensor; el atacante solo espera.
    if (P.fase === 'veterano') {
      const q = P.pendienteVet;
      if (q.defensor === mio) V.pendienteVet = { divId: q.divId, stat: q.stat, plus: q.plus, opciones: q.opciones };
      else V.fase = 'esperando';
    }
    return V;
  }

  /* ── entrada de mensajes: aquí no se fía uno de nada ── */
  recibir(id, msg) {
    if (msg.t === 'unirse') return this.unirse(id, msg);

    const lado = this.ladoDe(id);
    if (!lado) throw new Error('todavía no te has unido a la sala');
    if (msg.t === 'abandonar') return this.abandonar(lado);
    if (msg.t === 'rol') return this.elegirRol(lado, msg.v);

    if (!this.P) throw new Error('la partida no ha empezado');
    if (msg.t === 'veto') return this.veto(lado, msg.division);
    if (msg.t === 'declarar') return this.declarar(lado, msg);
    if (msg.t === 'incomodo') return this.eleccionIncomodo(lado, msg.idx);
    if (msg.t === 'veterano') return this.decidirVeterano(lado, msg);
    if (msg.t === 'desempate') return this.desempate(lado);
    throw new Error('mensaje desconocido');
  }

  unirse(id, msg) {
    const nombre = String(msg.nombre || 'Jugador').slice(0, 20);
    const cartas = msg.cartas;

    // La misma validación que los códigos de amigo: 11 divisiones, todas
    // alineables, sin peleador repetido. Una plantilla ilegal reventaría la
    // partida a mitad y parecería un fallo del juego.
    if (!Array.isArray(cartas) || cartas.length !== 11) throw new Error('la plantilla no tiene 11 cartas');
    const objs = cartas.map(cid => PORID[cid]);
    if (objs.some(c => !c)) throw new Error('la plantilla trae cartas desconocidas: ¿tenéis la misma versión del juego?');
    if (objs.some(c => !c.alineable)) throw new Error('la plantilla trae cartas no alineables');
    if (new Set(objs.map(c => c.division)).size !== 11) throw new Error('la plantilla no cubre las 11 divisiones');
    if (new Set(objs.map(c => c.persona)).size !== 11) throw new Error('la plantilla repite peleador');

    const ya = this.jugadores.get(id);
    if (ya) { ya.nombre = nombre; }
    else {
      if (this.jugadores.size >= 2) throw new Error('la sala ya está llena');
      const usados = [...this.jugadores.values()].map(j => j.lado);
      this.jugadores.set(id, { nombre, cartas, lado: usados.includes('j') ? 'r' : 'j' });
    }
    this.difundirPresencia();

    if (this.jugadores.size === 2 && !this.P) this.arrancar();
    else this.mandarEstado();
  }

  arrancar() {
    const porLado = l => {
      const j = [...this.jugadores.values()].find(x => x.lado === l);
      const out = {}; for (const cid of j.cartas) out[PORID[cid].division] = PORID[cid];
      return out;
    };
    this.P = nuevaPartida(porLado('j'), porLado('r'));
    this.rolElegido = {};
    this.difundir({ t: 'empieza' });
    this.mandarEstado();
  }

  elegirRol(lado, v) {
    if (!this.P || this.P.fase !== 'rol') throw new Error('no toca elegir rol');
    if (v !== 'vetar' && v !== 'declarar') throw new Error('rol inválido');
    this.rolElegido[lado] = v;
    if (Object.keys(this.rolElegido).length < 2) { this.mandarEstado(); return; }

    const P = this.P, a = this.rolElegido.j, b = this.rolElegido.r;
    if (a !== b) {
      P.vetoPrimero = a === 'vetar' ? 'j' : 'r';
      P.log.push({ t: 'sys', x: `${this.nombreDeLado('j')} eligió ${a} y ${this.nombreDeLado('r')} eligió ${b}.` });
    } else {
      const dj = 1 + Math.floor(Math.random() * 6), dr = 1 + Math.floor(Math.random() * 6);
      const gana = dj >= dr ? 'j' : 'r';
      P.vetoPrimero = (a === 'vetar') === (gana === 'j') ? 'j' : 'r';
      P.log.push({ t: 'sys', x: `Los dos queríais ${a}. Dado ${dj} a ${dr}: se lo queda ${this.nombreDeLado(gana)}.` });
    }
    P.fase = 'vetos';
    this.mandarEstado();
  }

  turnoVeto(P) { return (P.vetados.length % 2 === 0) === (P.vetoPrimero === 'j') ? 'j' : 'r'; }

  veto(lado, division) {
    const P = this.P;
    if (P.fase !== 'vetos') throw new Error('no toca vetar');
    if (this.turnoVeto(P) !== lado) throw new Error('no es tu turno de vetar');
    if (!DIV[division]) throw new Error('esa división no existe');
    if (P.vetados.includes(division)) throw new Error('esa división ya está vetada');

    P.vetados.push(division);
    P.log.push({ t: 'sys', x: `${this.nombreDeLado(lado)} veta ${DIV[division].n}.` });
    if (P.vetados.length >= 4) terminarVetos(P);
    this.mandarEstado();
  }

  declarar(lado, msg) {
    const P = this.P;
    if (P.fase !== 'duelos') throw new Error('no toca declarar');
    if (P.turno !== lado) throw new Error('no es tu turno');

    const { division, stat } = msg;
    if (!librePara(P, lado).includes(division)) throw new Error('esa división ya se ha jugado o no está en juego');
    if (!P.statsVivas.includes(stat)) throw new Error('esa stat ya se ha gastado');

    const jugada = msg.jugada || null;
    let opts = {};

    if (jugada && jugada.tipo === 'cambio') {
      const legal = cambiosPosibles(P, lado).some(([a, b]) =>
        (a === jugada.a && b === jugada.b) || (a === jugada.b && b === jugada.a));
      if (!legal) throw new Error('ese cambio de división no es legal');
      hacerCambio(P, lado, jugada.a, jugada.b);
      P.log.push({ t: 'sys', x: `${this.nombreDeLado(lado)} usa su jugada: cambio de división.` });
    }

    if (jugada && jugada.tipo === 'camaleon') {
      const cam = camaleonesPosibles(P, lado, division).find(c => c.div === jugada.div);
      if (!cam) throw new Error('ese Camaleón no se puede usar aquí');
      P.cartas[lado][division] = cam.carta;
      P.ajustes[lado][division] = {};
      if (!cam.rasgo.plus) P.jugada[lado] = true;
      P.log.push({ t: 'sys', x: `🦎 ${this.nombreDeLado(lado)} activa Camaleón desde ${DIV[cam.div].n}.` });
      opts.dobleJ = true;
    }

    if (jugada && jugada.tipo === 'incomodo') {
      const rasgo = rasgoDe(P.cartas[lado][division], 'incomodo');
      if (!rasgo) throw new Error('esa carta no tiene Incómodo');
      if (P.jugada[lado]) throw new Error('ya has gastado tu jugada');
      const defensor = this.otroLado(lado);
      const otra = segundaCartaIncomodo(P, defensor, division, rasgo);
      if (!otra) throw new Error('no hay una segunda división válida para el Incómodo');
      P.jugada[lado] = true;
      P.pendiente = { divId: division, stat, plus: rasgo.plus, defensor,
        opciones: shuffle([division, otra]) };
      P.fase = 'incomodo';
      P.log.push({ t: 'sys', x: `🌀 ${this.nombreDeLado(lado)} activa Incómodo${rasgo.plus ? '+' : ''}.` });
      this.mandarEstado();
      return;
    }

    P.log.push({ t: 'sys', x: `${this.nombreDeLado(lado)} declara ${DIV[division].n} · ${stat.toUpperCase()}.` });
    this.resolver(division, stat, opts);
  }

  /* El Veterano es reactivo, y en online los dos lados son personas: la decisión es
     del defensor y se le pregunta. Cuesta una ida y vuelta más por duelo, pero que la
     máquina gaste por ti tu única jugada de la partida no es aceptable. */
  pedirVeterano(divId, stat, opts) {
    const P = this.P, def = this.otroLado(P.turno);
    const r = rasgoDe(P.cartas[def][divId], 'veterano');
    if (!r || P.jugada[def]) return false;
    const otras = P.statsVivas.filter(s => s !== stat);
    if (!otras.length) return false;          // sin stats a las que cambiar no hay decisión
    P.pendienteVet = { divId, stat, defensor: def, plus: r.plus, opciones: otras, opts: opts || {} };
    P.fase = 'veterano';
    return true;
  }

  decidirVeterano(lado, msg) {
    const P = this.P;
    if (P.fase !== 'veterano') throw new Error('no hay ninguna decisión de Veterano pendiente');
    const q = P.pendienteVet;
    if (q.defensor !== lado) throw new Error('esa decisión no es tuya');

    let stat = q.stat;
    if (msg.usar) {
      if (P.jugada[lado]) throw new Error('ya has gastado tu jugada');
      P.jugada[lado] = true;
      // el normal cambia a una al azar; el plus la elige quien lo usa
      stat = q.plus
        ? (q.opciones.includes(msg.stat) ? msg.stat : q.opciones[0])
        : q.opciones[Math.floor(Math.random() * q.opciones.length)];
      P.log.push({ t: 'sys', x: `🧠 Veterano de ${this.nombreDeLado(lado)}: la stat pasa de ${q.stat.toUpperCase()} a ${stat.toUpperCase()}.` });
    }
    const opts = q.opts;
    P.pendienteVet = null; P.fase = 'duelos';
    resolverDuelo(P, q.divId, stat, opts);
    this.mandarEstado();
  }

  resolver(division, stat, opts) {
    if (this.pedirVeterano(division, stat, opts)) { this.mandarEstado(); return; }
    resolverDuelo(this.P, division, stat, opts);
    this.mandarEstado();
  }

  eleccionIncomodo(lado, idx) {
    const P = this.P;
    if (P.fase !== 'incomodo') throw new Error('no hay ninguna elección pendiente');
    if (P.pendiente.defensor !== lado) throw new Error('esa elección no es tuya');
    const q = P.pendiente, elegida = q.opciones[idx];
    if (!elegida) throw new Error('elección inválida');

    if (elegida === q.divId) {
      P.log.push({ t: 'sys', x: `${this.nombreDeLado(lado)} acierta la división: duelo limpio.` });
    } else {
      intercambiarSlots(P, lado, elegida, q.divId);
      penaliza(P, lado, q.divId, SID, q.plus ? -12 : -6);
      P.log.push({ t: 'sys', x: `${this.nombreDeLado(lado)} falla y come ${q.plus ? -12 : -6}.` });
    }
    P.pendiente = null; P.fase = 'duelos';
    P.log.push({ t: 'sys', x: `Duelo en ${DIV[q.divId].n} · ${q.stat.toUpperCase()}.` });
    this.resolver(q.divId, q.stat, {});
  }

  desempate(lado) {
    const P = this.P;
    if (P.fase !== 'desempate') throw new Error('no hay desempate pendiente');
    resolverDesempate(P);
    this.mandarEstado();
  }

  abandonar(lado) {
    if (!this.P || this.P.fase === 'fin') return;
    this.P.fase = 'fin';
    this.P.fin = this.otroLado(lado);
    this.P.log.push({ t: 'sys', x: `${this.nombreDeLado(lado)} abandona: cuenta como derrota.` });
    this.mandarEstado();
  }
}
