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

import '../../juego/roster.js';   // el catálogo de peleadores, generado de la base de datos
import '../../juego/motor.js';   // define globalThis.MOTOR y sus nombres sueltos

generarRoster();   // mismo catálogo que los clientes, de la misma semilla fija

const TURNO_MS  = 25000;   // 25 segundos por decisión
const GRACIA_MS = 20000;   // margen para volver antes de dar la partida por perdida

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
    this.chatlog = [];            // últimos mensajes, para quien reconecta
    this.caido = {};              // lado -> instante en que se cayó
  }

  /* ── EL RELOJ ──────────────────────────────────────────────────────────────
     25 segundos por decisión. Sin reloj, una partida por turnos con dos personas
     se queda colgada en cuanto una deja el móvil en la mesa, y la otra no puede
     ni rendirse a gusto porque no sabe si el rival volverá.

     Cuando se acaba el tiempo NO se pierde la partida: el servidor juega por ti la
     opción más simple y legal, y sigue. Perder por no llegar a tiempo a un duelo
     sería castigar la conexión, no el juego. */
  arrancarReloj() {
    const P = this.P;
    if (!P || P.fase === 'fin') return;
    P.limite = Date.now() + TURNO_MS;
    this.programarAlarma(P.limite + 400);
  }
  programarAlarma(cuando) {
    try { this.ctx.storage.setAlarm(cuando); } catch (e) {}
  }

  async alarm() {
    // Primero lo urgente: alguien que se fue y no ha vuelto pierde por abandono.
    for (const [lado, desde] of Object.entries(this.caido)) {
      if (Date.now() - desde >= GRACIA_MS && !this.conectado(lado)) {
        delete this.caido[lado];
        return this.abandonar(lado, 'se ha desconectado y no ha vuelto');
      }
    }
    const P = this.P;
    if (!P || P.fase === 'fin' || !P.limite) return;
    if (Date.now() < P.limite) { this.programarAlarma(P.limite + 400); return; }
    this.jugarPorElQueNoLlega();
  }

  conectado(lado) {
    for (const [id, j] of this.jugadores) if (j.lado === lado && this.conex.has(id)) return true;
    return false;
  }

  // La jugada más simple y legal que existe en cada fase. Nunca la mejor: el reloj
  // no está para jugar bien por nadie, está para que la partida no se pare.
  jugarPorElQueNoLlega() {
    const P = this.P;
    try {
      if (P.fase === 'rol') {
        for (const l of ['j', 'r']) if (!this.rolElegido[l]) {
          P.log.push({ t: 'sys', x: `Se acaba el tiempo: ${this.nombreDeLado(l)} empieza declarando.` });
          return this.elegirRol(l, 'declarar');
        }
      } else if (P.fase === 'vetos') {
        const l = this.turnoVeto(P);
        const libres = DIVISIONES.map(d => d.id).filter(x => !P.vetados.includes(x));
        P.log.push({ t: 'sys', x: `Se acaba el tiempo para ${this.nombreDeLado(l)}: veto automático.` });
        return this.veto(l, libres[0]);
      } else if (P.fase === 'duelos') {
        const l = P.turno;
        P.log.push({ t: 'sys', x: `Se acaba el tiempo para ${this.nombreDeLado(l)}: declaración automática.` });
        return this.declarar(l, { division: librePara(P, l)[0], stat: P.statsVivas[0] });
      } else if (P.fase === 'confirmar') {
        const l = P.pendienteConf.defensor;
        P.log.push({ t: 'sys', x: `Se acaba el tiempo: la carta de ${this.nombreDeLado(l)} sale sola al duelo.` });
        return this.confirmar(l);
      } else if (P.fase === 'incomodo') {
        const l = P.pendiente.defensor;
        P.log.push({ t: 'sys', x: `Se acaba el tiempo: ${this.nombreDeLado(l)} elige a ciegas por reloj.` });
        return this.eleccionIncomodo(l, 0);
      } else if (P.fase === 'desempate') {
        return this.desempate('j');
      }
    } catch (e) {
      // Si la jugada automática no cuela, se reintenta en el siguiente ciclo antes
      // que dejar la sala muerta.
      this.arrancarReloj();
    }
  }

  chat(lado, texto) {
    const t = String(texto || '').replace(/\s+/g, ' ').trim().slice(0, 200);
    if (!t) return;
    const m = { t: 'chat', lado, de: this.nombreDeLado(lado), texto: t, ts: Date.now() };
    this.chatlog.push(m);
    if (this.chatlog.length > 40) this.chatlog.shift();
    // Cada uno lo ve desde su lado, igual que el resto del estado.
    for (const [id, j] of this.jugadores)
      this.enviar(id, { ...m, lado: lado === j.lado ? 'j' : 'r' });
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
      /* Cerrar la aplicación o irse de la partida cuenta como rendirse. Se da un
         margen corto para volver, porque un túnel o un cambio de wifi no es
         abandonar; pasado ese margen, el rival gana y no se queda esperando. */
      const l = this.ladoDe(jugadorId);
      if (l && this.P && this.P.fase !== 'fin' && !this.conectado(l)) {
        this.caido[l] = Date.now();
        this.programarAlarma(Date.now() + GRACIA_MS + 400);
      }
    });

    const lado0 = this.ladoDe(jugadorId);
    if (lado0) delete this.caido[lado0];              // ha vuelto: se cancela la cuenta
    if (this.jugadores.has(jugadorId)) {
      for (const m of this.chatlog)
        this.enviar(jugadorId, { ...m, lado: m.lado === lado0 ? 'j' : 'r' });
      this.mandarEstado();   // reconexión en curso
    }

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
    // Cada vez que el estado cambia empieza un turno nuevo, así que el reloj se
    // reinicia aquí y en un solo sitio: si se repartiera por los métodos, tarde o
    // temprano alguno se olvidaría y la sala se quedaría sin reloj.
    if (this.P && this.P.fase !== 'fin') this.arrancarReloj();
    else if (this.P) this.P.limite = null;
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
      pendienteConf: null,
      limite: P.limite || null,        // instante en el que se acaba el turno
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
    /* El duelo declarado y esperando carta. Los dos lados reciben lo mismo — división
       y stat son públicas en cuanto se declaran — y cada uno mira su pantalla según de
       quién sea la carta que falta. Lo que NO viaja es si el defensor ha activado su
       Especialista: eso lo cuenta el registro cuando ya está hecho. */
    if (P.fase === 'confirmar') {
      const q = P.pendienteConf;
      V.pendienteConf = { divId: q.divId, stat: q.stat, defensor: q.defensor === mio ? 'j' : 'r' };
    }
    return V;
  }

  /* ── entrada de mensajes: aquí no se fía uno de nada ── */
  recibir(id, msg) {
    if (msg.t === 'unirse') return this.unirse(id, msg);

    const lado = this.ladoDe(id);
    if (!lado) throw new Error('todavía no te has unido a la sala');
    if (msg.t === 'abandonar') return this.abandonar(lado, 'se rinde');
    if (msg.t === 'chat') return this.chat(lado, msg.texto);
    if (msg.t === 'rol') return this.elegirRol(lado, msg.v);

    if (!this.P) throw new Error('la partida no ha empezado');
    if (msg.t === 'veto') return this.veto(lado, msg.division);
    if (msg.t === 'declarar') return this.declarar(lado, msg);
    if (msg.t === 'incomodo') return this.eleccionIncomodo(lado, msg.idx);
    if (msg.t === 'confirmar') return this.confirmar(lado);
    if (msg.t === 'especialista') return this.especialistaDefensor(lado);
    if (msg.t === 'veterano') return this.veteranoDefensor(lado);
    if (msg.t === 'camaleon') return this.camaleonDefensor(lado, msg.div);
    if (msg.t === 'cambio') return this.cambioDefensor(lado, msg.a, msg.b);
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

    /* Atacando ya no hay ni cambio de división ni Camaleón: son respuestas, y se usan
       en la ventana del defensor. Declarar es elegir el terreno y nada más. */
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
  resolver(division, stat, opts) {
    const P = this.P;
    P.pendienteConf = { divId: division, stat, defensor: this.otroLado(P.turno),
      opts: opts || {}, veterano: null };
    P.fase = 'confirmar';
    this.mandarEstado();
  }

  // Vía directa, sin confirmación: la usa el Incómodo, donde elegir a ciegas entre
  // las dos cartas YA es mandar la tuya, y volver a pedirla sería pedirla dos veces.
  resolverYa(division, stat, opts) {
    resolverDuelo(this.P, division, stat, opts || {});
    this.mandarEstado();
  }

  confirmar(lado) {
    const P = this.P;
    if (P.fase !== 'confirmar') throw new Error('no hay ningún duelo esperando');
    const q = P.pendienteConf;
    if (q.defensor !== lado) throw new Error('la carta la manda el otro');

    const opts = { ...(q.opts || {}) };
    if (q.veterano) opts.veterano = q.veterano;
    P.pendienteConf = null; P.fase = 'duelos';
    P.log.push({ t: 'sys', x: `${this.nombreDeLado(lado)} manda a ${P.cartas[lado][q.divId].nombre} al duelo.` });
    resolverDuelo(P, q.divId, q.stat, opts);
    this.mandarEstado();
  }

  /* ESPECIALISTA: la carta impone su stat. El duelo deja de jugarse con la declarada
     y pasa a jugarse con la suya. */
  especialistaDefensor(lado) {
    const P = this.P;
    if (P.fase !== 'confirmar') throw new Error('no hay ningún duelo esperando');
    const q = P.pendienteConf;
    if (q.defensor !== lado) throw new Error('esa decisión no es tuya');
    const r = especialistaDisponible(P, lado, q.divId, q.stat);
    if (!r) throw new Error('ese Especialista no se puede usar aquí');
    if (!r.plus) P.jugada[lado] = true;
    P.log.push({ t: 'sys', x: `🎯 ${this.nombreDeLado(lado)} impone ${r.stat.toUpperCase()} con su Especialista.` });
    q.stat = r.stat;
    this.mandarEstado();
  }

  /* VETERANO: si gana el duelo —o siempre, con el plus— la stat no se gasta y vuelve
     al pool de los dos. */
  veteranoDefensor(lado) {
    const P = this.P;
    if (P.fase !== 'confirmar') throw new Error('no hay ningún duelo esperando');
    const q = P.pendienteConf;
    if (q.defensor !== lado) throw new Error('esa decisión no es tuya');
    const r = veteranoDisponible(P, lado, q.divId);
    if (!r) throw new Error('ese Veterano no se puede usar aquí');
    P.jugada[lado] = true;
    q.veterano = lado;
    P.log.push({ t: 'sys', x: `🧠 ${this.nombreDeLado(lado)} activa Veterano${r.plus ? '+' : ''}: si gana${r.plus ? ' o pierde' : ''}, ${q.stat.toUpperCase()} vuelve al pool.` });
    this.mandarEstado();
  }

  /* CAMALEÓN, defensivo: trae otra carta a pelear este duelo sin penalización. */
  camaleonDefensor(lado, div) {
    const P = this.P;
    if (P.fase !== 'confirmar') throw new Error('no hay ningún duelo esperando');
    const q = P.pendienteConf;
    if (q.defensor !== lado) throw new Error('esa decisión no es tuya');
    const cam = camaleonesPosibles(P, lado, q.divId).find(c => c.div === div);
    if (!cam) throw new Error('ese Camaleón no se puede usar aquí');
    P.cartas[lado][q.divId] = cam.carta;
    P.ajustes[lado][q.divId] = {};
    if (!cam.rasgo.plus) P.jugada[lado] = true;
    q.opts = q.opts || {};
    q.opts[lado === 'j' ? 'dobleJ' : 'dobleR'] = true;
    P.log.push({ t: 'sys', x: `🦎 ${this.nombreDeLado(lado)} responde con Camaleón desde ${DIV[cam.div].n}.` });
    this.mandarEstado();
  }

  /* CAMBIO DE DIVISIÓN, defensivo: intercambio obligado entre contiguas. */
  cambioDefensor(lado, a, b) {
    const P = this.P;
    if (P.fase !== 'confirmar') throw new Error('no hay ningún duelo esperando');
    const q = P.pendienteConf;
    if (q.defensor !== lado) throw new Error('esa decisión no es tuya');
    const legal = cambiosPosibles(P, lado).some(([x, y]) => (x === a && y === b) || (x === b && y === a));
    if (!legal) throw new Error('ese cambio de división no es legal');
    hacerCambio(P, lado, a, b);
    this.mandarEstado();
  }

  /* El Veterano es del defensor y se decide en la misma pantalla en la que manda su
     carta: cambia la stat del duelo antes de enviarla. No usarlo no cuesta nada — no
     hay que contestar que no, basta con enviar la carta. */
  decidirVeterano(lado, msg) {
    const P = this.P;
    if (P.fase !== 'confirmar') throw new Error('no hay ningún duelo esperando');
    const q = P.pendienteConf;
    if (q.defensor !== lado) throw new Error('esa decisión no es tuya');
    if (!msg.usar) return;
    if (P.jugada[lado]) throw new Error('ya has gastado tu jugada');

    const r = rasgoDe(P.cartas[lado][q.divId], 'veterano');
    if (!r) throw new Error('esa carta no tiene Veterano');
    const otras = P.statsVivas.filter(s => s !== q.stat);
    if (!otras.length) throw new Error('no queda ninguna otra stat viva');

    P.jugada[lado] = true;
    // el normal cambia a una al azar; el plus la elige quien lo usa
    const nueva = r.plus
      ? (otras.includes(msg.stat) ? msg.stat : otras[0])
      : otras[Math.floor(Math.random() * otras.length)];
    P.log.push({ t: 'sys', x: `🧠 Veterano de ${this.nombreDeLado(lado)}: la stat pasa de ${q.stat.toUpperCase()} a ${nueva.toUpperCase()}.` });
    q.stat = nueva;
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
      // La enviada pelea aquí con la penalización y sigue disponible para su propio duelo;
      // la carta de la división declarada se descarta.
      const descartada = P.cartas[lado][q.divId];
      enviarAlDuelo(P, lado, elegida, q.divId, q.plus ? -12 : -6);
      P.log.push({ t: 'sys', x: `${this.nombreDeLado(lado)} falla: come ${q.plus ? -12 : -6} y ${descartada.nombre} se descarta sin pelear.` });
    }
    P.pendiente = null; P.fase = 'duelos';
    P.log.push({ t: 'sys', x: `Duelo en ${DIV[q.divId].n} · ${q.stat.toUpperCase()}.` });
    this.resolverYa(q.divId, q.stat, {});
  }

  /* Los dos ven el botón de resolver el desempate, así que los dos pueden pulsarlo casi
     a la vez. El segundo no ha hecho nada mal: sobra, y sobrar no es un error. */
  desempate(lado) {
    const P = this.P;
    if (P.fase === 'fin') return;
    if (P.fase !== 'desempate') throw new Error('no hay desempate pendiente');
    resolverDesempate(P);
    this.mandarEstado();
  }

  abandonar(lado, motivo) {
    if (!this.P || this.P.fase === 'fin') return;
    this.P.fase = 'fin';
    this.P.fin = this.otroLado(lado);
    this.P.limite = null;
    this.P.log.push({ t: 'sys', x: `${this.nombreDeLado(lado)} ${motivo || 'abandona'}: cuenta como derrota.` });
    this.mandarEstado();
  }
}
