/* ═══════════════════════════════════════════════════════════════════════════
   MOTOR — datos, roster y reglas. Sin DOM, sin red, sin estado de jugador.

   Corre en tres sitios a la vez y por eso se escribe así, asignando a globalThis
   en vez de con módulos: el navegador abriendo el HTML con file://, el WebView del
   APK, y el servidor (Worker) que arbitra las partidas en vivo. Es la única forma
   de que los tres compartan las mismas reglas sin ningún paso de compilación.

   El roster NO viaja por la red: se genera de la misma semilla fija en todas partes,
   así que servidor y clientes llegan al mismo catálogo por su cuenta. Por el cable
   solo van los 11 identificadores de carta de cada plantilla.
   ═══════════════════════════════════════════════════════════════════════════ */
(function(raiz){
'use strict';

/* ══════════════════════════════════════════════════════════════════════════
   1. DATOS BASE
   ══════════════════════════════════════════════════════════════════════════ */

const DIVISIONES = [
  {id:'m0',n:'Mosca',      g:'M',o:0}, {id:'m1',n:'Gallo',      g:'M',o:1},
  {id:'m2',n:'Pluma',      g:'M',o:2}, {id:'m3',n:'Ligero',     g:'M',o:3},
  {id:'m4',n:'Wélter',     g:'M',o:4}, {id:'m5',n:'Medio',      g:'M',o:5},
  {id:'m6',n:'Semipesado', g:'M',o:6}, {id:'m7',n:'Pesado',     g:'M',o:7},
  {id:'f0',n:'Paja F',     g:'F',o:0}, {id:'f1',n:'Mosca F',    g:'F',o:1},
  {id:'f2',n:'Gallo F',    g:'F',o:2},
];
const DIV = Object.fromEntries(DIVISIONES.map(d=>[d.id,d]));

// Dos escaleras independientes: no hay puente entre géneros.
function contiguas(a,b){ const x=DIV[a],y=DIV[b]; return x.g===y.g && Math.abs(x.o-y.o)===1; }
function vecinas(id){ return DIVISIONES.filter(d=>contiguas(id,d.id)).map(d=>d.id); }

const STATS = [
  {id:'golpeo',n:'GOLPEO',c:'GLP'}, {id:'lucha',n:'LUCHA',c:'LCH'},
  {id:'suelo', n:'SUELO', c:'SUE'}, {id:'cardio',n:'CARDIO',c:'CAR'},
  {id:'dureza',n:'DUREZA',c:'DUR'}, {id:'iq',    n:'IQ',    c:'IQ'},
];
const SID = STATS.map(s=>s.id);

// Sub-stats exactamente como el GDD §2.2. La stat visible es su media.
const SUBSTATS = {
  golpeo:['potencia','precisión','volumen','boxeo','patadas','golpeo en clinch'],
  lucha :['derribos','defensa de derribo','clinch','control contra la jaula','levantarse','transiciones'],
  suelo :['sumisiones','defensa de sumisión','control desde arriba','guardia','ground and pound','escapes'],
  cardio:['resistencia','recuperación','ritmo sostenido','asaltos finales','eficiencia de movimiento','gestión del gas'],
  dureza:['mentón','absorción de daño','resistencia a cortes','recuperación de aturdimiento','castigo corporal','voluntad'],
  iq    :['lectura del rival','gestión de distancia','adaptación','control del octógono','defensa','gestión de asaltos'],
};

/* CALIDAD Y ESTATUS.

   Solo hay dos calidades, oro y plata: el bronce desaparece del juego. Y lo que de
   verdad ordena y valora una carta ya no es ningún número medio, es el ESTATUS
   DEPORTIVO del peleador — si es campeón, si está rankeado y en qué tramo.

   NO EXISTE LA MEDIA. Ni visible ni guardada: se ha quitado del modelo entero, no
   escondido. Lo único parecido es `suma`, la suma de las seis stats, que sirve para
   desempatar el orden dentro de un mismo estatus y no se enseña jamás ni interviene
   en ningún duelo. */
const RAREZAS = {
  plata:{n:'Plata', c:'#9aa4ad'},
  oro  :{n:'Oro',   c:'#d8a943'},
};
const ORDEN_RAREZA = ['plata','oro'];

/* De mejor a peor. Este orden es EL orden: sobres, colección, plantilla, todo.

   Las bandas son las que trae la base de datos y sirven para comprobar que los datos
   importados cuadran, no para generar nada: las cartas ya no se inventan.

   El tramo sale del RANKING REAL que trae la base de datos, congelado en la fecha de
   impresión de cada carta. Una plata nunca lleva tramo de ranking aunque el peleador
   esté clasificado: la rareza manda en el orden, y la plata va última. */
const ESTATUS = [
  {id:'campeon',n:'Campeón',   c:'🏆', rareza:'oro',  min:74,max:89, tramo:'corona'},
  {id:'top5',   n:'Top 5',     c:'5',  rareza:'oro',  min:74,max:89, tramo:'corona'},
  {id:'top10',  n:'Top 6-10',  c:'10', rareza:'oro',  min:74,max:89, tramo:'rankeado'},
  {id:'top15',  n:'Top 11-15', c:'15', rareza:'oro',  min:74,max:89, tramo:'rankeado'},
  {id:'oro',    n:'Oro',       c:'',   rareza:'oro',  min:74,max:89, tramo:'oro'},
  {id:'plata',  n:'Plata',     c:'',   rareza:'plata',min:64,max:82, tramo:'plata'},
];
const EST = Object.fromEntries(ESTATUS.map(e=>[e.id,e]));

/* Lo que se pinta arriba a la izquierda de la carta. Con el ranking real en la mano se
   enseña el puesto exacto —#6 dice mucho más que "top 6-10"— y la corona para el campeón. */
function etiquetaEstatus(c){
  // Texto y no emoji: un 🏆 a este tamaño no se lee, y cada sistema lo dibuja distinto.
  if(c.rk===0) return '#C';
  if(c.rk) return '#'+c.rk;
  return '';
}

/* Cuánto puede medir el nombre para llenar la placa sin salirse.

   La placa deja unos 45 puntos de ancho de carta por dentro, y Oswald gasta algo menos
   de medio punto por letra. Con eso sale el tamaño que llena el hueco, y se le pone un
   techo para que "Bo Nickal" no acabe con letras de cartel de feria. */
function tamNombre(nombre){
  const largo=Math.max(nombre.length,6);
  return (Math.min(5.1, 45/(largo*0.47))/100).toFixed(4);   // fracción del ancho de la carta
}
const ORDEN_ESTATUS = ESTATUS.map(e=>e.id);

/* Cuántos REPETIDOS del mismo tramo hay que reciclar para sacar una ficha. Una ficha
   sale siempre de un solo tramo: no se mezclan cartas de tramos distintos. */
const TRAMOS = {
  corona  :{n:'Campeón o Top 5', repes:1},
  rankeado:{n:'Top 6 al 15',     repes:4},
  oro     :{n:'Oro sin rankear', repes:10},
  plata   :{n:'Plata',           repes:30},
};
const tramoDe = c => EST[c.estatus].tramo;

/* EL ORDEN, en un solo sitio, y en este orden exacto:

     1. Rankeado antes que sin rankear. Siempre, y sin importar los números: un #15 va
        antes que el oro sin rankear más completo del roster. El ranking es lo que el
        jugador persigue, y es lo que la carta enseña.
     2. Entre rankeados, por PUESTO: campeón, #1, #2… hasta #15. Antes se agrupaba por
        tramos de cinco y dentro del tramo mandaba la suma, y eso ponía a un #15 por
        delante de un #11 si sumaba más. Manda el puesto.
     3. Entre los que no tienen ranking, primero el oro y luego la plata, y dentro de
        cada uno por la suma de las seis stats, de mayor a menor.
     4. Y si aún hay empate, alfabético.

   La suma es interna: solo decide quién va antes, nunca se enseña. */
function ordenar(cartas){
  return cartas.slice().sort(comparar);
}
function comparar(a,b){
  const ra = (a.rk===0||a.rk) ? a.rk : null;
  const rb = (b.rk===0||b.rk) ? b.rk : null;
  if(ra!==null && rb!==null){ if(ra!==rb) return ra-rb; }
  else if(ra!==null) return -1;
  else if(rb!==null) return 1;
  else {
    const d = ORDEN_ESTATUS.indexOf(a.estatus) - ORDEN_ESTATUS.indexOf(b.estatus);
    if(d) return d;
  }
  if(b.suma !== a.suma) return b.suma - a.suma;
  return a.nombre.localeCompare(b.nombre,'es');
}

/* LOS CUATRO RASGOS.

   Camaleón y cambio de división son SOLO DEFENSIVOS: se responden a una declaración,
   no se usan al declarar. El Incómodo es al revés, solo ofensivo, porque consiste en
   ocultar la división que declaras.

   Especialista y Veterano intercambiaron sus papeles respecto al diseño original: el
   que impone la stat es el Especialista, y el que la salva del pool es el Veterano. */
const RASGOS = {
  camaleon   :{n:'Camaleón',   ic:'🦎', lado:'defensa',
    d:'Al defender, manda esta carta a pelear al duelo declarado desde una división contigua, sin penalización. Tu carta de esa división se descarta sin pelear y el Camaleón sigue disponible para su propio duelo.',
    dplus:'Igual, pero no consume tu jugada.'},
  incomodo   :{n:'Incómodo',   ic:'🌀', lado:'ataque',
    d:'Al declarar, ocultas la división. El rival ve dos cartas suyas (la real y una contigua) y elige a ciegas. Si falla, su carta come -6.',
    dplus:'La segunda carta es de cualquier división en juego y el fallo cuesta -12. Usable siempre.'},
  especialista:{n:'Especialista',ic:'🎯', lado:'ambos',
    d:'Va atado a una stat. Al activarlo, el duelo pasa a pelearse con esa stat, sea cual sea la declarada.',
    dplus:'Igual, pero no consume tu jugada.'},
  veterano   :{n:'Veterano',   ic:'🧠', lado:'ambos',
    d:'Si gana el duelo, la stat usada no se gasta: revive del pool y los dos pueden volver a usarla. En el sexto duelo no sirve, porque ya no queda duelo donde gastarla.',
    dplus:'La stat revive aunque pierda el duelo.'},
};

/* ══════════════════════════════════════════════════════════════════════════
   2. AZAR CON SEMILLA
   ══════════════════════════════════════════════════════════════════════════ */
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);
  t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
let RNG = Math.random;
const ri=(a,b)=>a+Math.floor(RNG()*(b-a+1));
const pick=a=>a[Math.floor(RNG()*a.length)];
const shuffle=a=>{a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(RNG()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

/* ══════════════════════════════════════════════════════════════════════════
   3. EL CATÁLOGO

   Ya no se inventa nada: las cartas salen de juego/roster.js, que se genera de la base
   de datos de peleadores con herramientas/importar-roster.mjs. Aquí solo se les da la
   forma que espera el motor y se comprueba que el archivo está donde tiene que estar.

   Sigue sin viajar por la red: cliente y servidor cargan el mismo archivo y llegan al
   mismo catálogo por su cuenta. Por el cable solo van los 11 identificadores de carta.
   ══════════════════════════════════════════════════════════════════════════ */
let ROSTER=[], PORID={};

function generarRoster(){
  const datos = raiz.ROSTER_DATOS;
  if(!datos || !datos.length)
    throw new Error('falta juego/roster.js: el catálogo de peleadores no está cargado');

  ROSTER = datos.map(d=>({
    id:d.id, persona:d.persona, nombre:d.nombre, apodo:'',
    division:d.division, rareza:d.rareza, estatus:d.estatus,
    rk:d.rk===undefined?null:d.rk,   // 0 = campeón, 1-15 clasificado, null sin rankear
    pais:d.pais||'', suma:d.suma, stats:d.stats, record:d.record,
    // Todas las cartas del catálogo son de la liga grande, así que todas se alinean.
    // El bronce de otras promotoras está reservado y todavía vacío.
    alineable:true, dobleDiv:!!d.dobleDiv,
    rasgos:(d.rasgos||[]).map(r=>({...r})),
    esVeterano:(d.rasgos||[]).some(r=>r.tipo==='veterano'),
    notraspasable:false,
  }));
  PORID=Object.fromEntries(ROSTER.map(c=>[c.id,c]));
  raiz.ROSTER=ROSTER; raiz.PORID=PORID; MOTOR.ROSTER=ROSTER; MOTOR.PORID=PORID;
}

const alineables=()=>ROSTER.filter(c=>c.alineable);
const rasgoTxt=r=>RASGOS[r.tipo].n+(r.plus?'+':'')+(r.stat?' · '+r.stat.toUpperCase():'');

/* ══════════════════════════════════════════════════════════════════════════
   6. MOTOR DE REGLAS  (puro: no toca el DOM — extraíble a packages/rules)
   ══════════════════════════════════════════════════════════════════════════ */
/* Tabla de márgenes. Más apretada que la anterior: con 10 para el finish y solo 1-3
   de franja reñida, la mayoría de los duelos se deciden por los números y el azar
   queda arrinconado en un margen muy estrecho. */
const MARGENES={finish:10,decision:4};
const REÑIDO=0.55;   // en la franja reñida gana el alto 55 de cada 100

/* ¿Puede este lado activar el Especialista en este duelo? Necesita la carta con el
   rasgo en la división que se pelea, que su stat siga viva, que no sea ya la stat
   declarada —cambiarla por ella misma no hace nada— y no haber gastado la jugada. */
function especialistaDisponible(P,lado,divId,stat){
  const r=rasgoDe(P.cartas[lado][divId],'especialista');
  if(!r) return null;
  if(P.jugada[lado] && !r.plus) return null;
  if(r.stat===stat) return null;
  if(!P.statsVivas.includes(r.stat)) return null;
  return r;
}

/* ¿Y el Veterano? Necesita la carta, la jugada sin gastar y que quede partida por
   delante: en el sexto duelo la stat que salvaría ya no la usaría nadie. */
function veteranoDisponible(P,lado,divId){
  if(P.jugada[lado]) return null;
  const r=rasgoDe(P.cartas[lado][divId],'veterano');
  if(!r) return null;
  return ultimoDuelo(P) ? null : r;
}
// Último duelo: ya no quedan divisiones por jugar después de esta.
const ultimoDuelo = P => P.jugadas.length >= P.enJuego.length-1;

function nuevaPartida(plantillaJ,plantillaR){
  return {fase:'rol', rolJ:null, vetoPrimero:null, vetados:[], vetoAzar:null,
    enJuego:[], jugadas:[], statsVivas:SID.slice(), duelo:0, turno:null,
    marcador:{j:0,r:0}, finishes:{j:0,r:0}, jugada:{j:false,r:false}, pendienteConf:null,
    cartas:{j:{...plantillaJ},r:{...plantillaR}}, // divId -> carta
    ajustes:{j:{},r:{}},  // divId -> {stat:delta}
    log:[], pendiente:null, fin:null};
}

function terminarVetos(P){
  P.enJuego=DIVISIONES.map(d=>d.id).filter(id=>!P.vetados.includes(id));
  // Veto aleatorio al final: su división será el desempate
  P.vetoAzar=pick(P.enJuego);
  P.enJuego=P.enJuego.filter(id=>id!==P.vetoAzar);
  P.enJuego.sort((a,b)=>DIVISIONES.findIndex(d=>d.id===a)-DIVISIONES.findIndex(d=>d.id===b));
  P.fase='duelos'; P.duelo=1;
  P.turno=P.vetoPrimero==='j'?'r':'j';   // empieza declarando el que no empezó vetando
  P.log.push({t:'sys',x:`Veto aleatorio: ${DIV[P.vetoAzar].n} — será el desempate.`});
}

const librePara=(P,l)=>P.enJuego.filter(id=>!P.jugadas.includes(id));
function valorCarta(P,l,divId,stat){
  const c=P.cartas[l][divId]; if(!c) return 0;
  const a=(P.ajustes[l][divId]||{})[stat]||0;
  return c.stats[stat]+a;
}
function aplicarPenalizacion(P,l,divId,tipo){
  const a=P.ajustes[l][divId]||(P.ajustes[l][divId]={});
  const lista=tipo==='subir'?['golpeo','lucha','dureza']:['cardio','dureza'];
  for(const s of lista) a[s]=(a[s]||0)-6;
}
function penaliza(P,l,divId,stats,v){
  const a=P.ajustes[l][divId]||(P.ajustes[l][divId]={});
  for(const s of stats) a[s]=(a[s]||0)+v;
}
/* Resolución del INCÓMODO cuando el defensor falla la elección.

   La carta que ha enviado pelea el duelo en la división declarada, con la penalización,
   y la carta que había en esa división se descarta: solo iba a pelear ahí, y ese duelo
   acaba de jugarse con otra. La enviada NO se mueve de su hueco, así que después pelea
   también el suyo — es la misma excepción que ya hace el Camaleón.

   Antes las dos cartas intercambiaban hueco, y eso estaba mal por dos motivos: con el plus,
   que admite cualquier división, podía acabar mandando a un mosca a pelear en pesado más
   tarde; y castigaba dos veces el mismo fallo, en este duelo y en el siguiente. */
function enviarAlDuelo(P,l,desde,divDeclarada,penalizacion){
  P.cartas[l][divDeclarada]=P.cartas[l][desde];
  P.ajustes[l][divDeclarada]={...(P.ajustes[l][desde]||{})};
  penaliza(P,l,divDeclarada,SID,penalizacion);
}

/* ¿Está este lado defendiendo ahora mismo? Lo está cuando hay un duelo declarado
   esperando su carta y esa carta es la suya. Es la única ventana en la que se pueden
   usar el cambio de división y el Camaleón. */
function defendiendo(P,l){
  return !!(P.pendienteConf && P.pendienteConf.defensor===l);
}

/* Cambio de división: contiguas, ambas en juego, ninguna jugada, intercambio obligado.
   SOLO EN DEFENSA: se responde con él a una declaración del rival. Al declarar tú ya
   estás eligiendo el terreno, así que mover además tus cartas era elegir dos veces. */
function cambiosPosibles(P,l){
  if(P.jugada[l]) return [];
  if(!defendiendo(P,l)) return [];
  const libres=librePara(P,l), out=[];
  for(const a of libres) for(const b of libres)
    if(a<b && contiguas(a,b)) out.push([a,b]);
  return out;
}
function hacerCambio(P,l,a,b){
  const A=DIV[a],B=DIV[b];
  const [abajo,arriba]=A.o<B.o?[a,b]:[b,a];
  const cAbajo=P.cartas[l][abajo], cArriba=P.cartas[l][arriba];
  P.cartas[l][arriba]=cAbajo; P.cartas[l][abajo]=cArriba;
  P.ajustes[l][arriba]={}; P.ajustes[l][abajo]={};
  aplicarPenalizacion(P,l,arriba,'subir');   // la que sube
  aplicarPenalizacion(P,l,abajo,'bajar');    // la que baja
  P.jugada[l]=true;
  P.log.push({t:'sys',x:`${l==='j'?'Tú':'El rival'}: cambio de división ${DIV[abajo].n} ⇄ ${DIV[arriba].n}.`});
}

function rasgoDe(c,tipo){ return c?c.rasgos.find(r=>r.tipo===tipo):null; }

/* Camaleón: manda la carta a una contigua sin penalización; la de allí se descarta.
   SOLO EN DEFENSA, por lo mismo que el cambio de división. */
function camaleonesPosibles(P,l,divDeclarada){
  const out=[];
  if(!defendiendo(P,l)) return out;
  for(const dId of librePara(P,l)){
    if(dId===divDeclarada) continue;
    const c=P.cartas[l][dId]; const r=rasgoDe(c,'camaleon');
    if(r && contiguas(dId,divDeclarada) && (!P.jugada[l]||r.plus)) out.push({div:dId,carta:c,rasgo:r});
  }
  return out;
}

/* Sorteo de un duelo, en un solo sitio para que el desempate use exactamente el mismo
   baremo que los seis duelos normales. */
function sortearDuelo(vj,vr){
  const m=Math.abs(vj-vr);
  // Empate exacto: moneda al aire de verdad, 50/50, y con tipo propio — no es un
  // reñido, porque no hay "el alto" al que darle la ventaja.
  if(m===0) return {m, ganador:Math.random()<.5?'j':'r', tipo:'empate'};
  const alto=vj>vr?'j':'r', bajo=alto==='j'?'r':'j';
  if(m>=MARGENES.finish)   return {m, ganador:alto, tipo:'finish'};
  if(m>=MARGENES.decision) return {m, ganador:alto, tipo:'decisión'};
  return {m, ganador:Math.random()<REÑIDO?alto:bajo, tipo:'reñido'};
}

function resolverDuelo(P,divId,stat,opts={}){
  const vj=valorCarta(P,'j',divId,stat), vr=valorCarta(P,'r',divId,stat);
  const {m,ganador,tipo}=sortearDuelo(vj,vr);
  P.marcador[ganador]++;
  if(tipo==='finish') P.finishes[ganador]++;   // primer criterio de desempate
  const cj=P.cartas.j[divId], cr=P.cartas.r[divId];
  P.log.push({t:'duelo',div:divId,stat,vj,vr,margen:m,ganador,tipo,
    nj:cj?cj.nombre:'—',nr:cr?cr.nombre:'—',
    cartaJ:cj?cj.id:null,cartaR:cr?cr.id:null,
    dobleJ:!!opts.dobleJ,dobleR:!!opts.dobleR});

  /* VETERANO: si su dueño lo activó, la stat de este duelo no se gasta y vuelve al
     pool para los dos. El normal solo la salva si además gana el duelo; el plus la
     salva aunque pierda. Como todo rasgo, hay que haberlo activado a mano. */
  let revive=false;
  if(opts.veterano){
    const l=opts.veterano;
    const r=rasgoDe(P.cartas[l][divId],'veterano');
    if(r && (r.plus || ganador===l)) revive=true;
  }
  if(!revive) P.statsVivas=P.statsVivas.filter(s=>s!==stat);
  else P.log.push({t:'sys',x:`🧠 Veterano: ${stat.toUpperCase()} no se gasta y vuelve al pool de los dos.`});

  P.jugadas.push(divId);
  if(P.marcador.j>=4||P.marcador.r>=4){ P.fase='fin'; P.fin=P.marcador.j>=4?'j':'r'; return; }
  if(P.jugadas.length>=P.enJuego.length){
    if(P.marcador.j!==P.marcador.r){
      P.fase='fin'; P.fin=P.marcador.j>P.marcador.r?'j':'r'; return;
    }
    /* Empate a duelos. El primer criterio son los FINISHES: gana quien haya acabado
       más peleas antes de tiempo. Solo si también van igualados se juega el duelo de
       desempate, que es el único sitio donde el azar decide algo. */
    if(P.finishes.j!==P.finishes.r){
      const g=P.finishes.j>P.finishes.r?'j':'r';
      P.fase='fin'; P.fin=g;
      P.log.push({t:'sys',x:`Empate a ${P.marcador.j}. Desempata por finishes: ${P.finishes.j} a ${P.finishes.r}.`});
      return;
    }
    P.fase='desempate';
    P.log.push({t:'sys',x:`Empate a ${P.marcador.j} y a finishes (${P.finishes.j}). Se decide en la jaula.`});
    return;
  }
  P.duelo++;
  P.turno=P.turno==='j'?'r':'j';
}

function resolverDesempate(P){
  const divId=P.vetoAzar, stat=pick(SID);   // azar solo donde ya no quedan decisiones
  const vj=valorCarta(P,'j',divId,stat), vr=valorCarta(P,'r',divId,stat);
  const {m,ganador,tipo}=sortearDuelo(vj,vr);
  P.marcador[ganador]++;
  if(tipo==='finish') P.finishes[ganador]++;
  P.log.push({t:'duelo',div:divId,stat,vj,vr,margen:m,ganador,tipo:'desempate',subtipo:tipo,
    nj:P.cartas.j[divId].nombre,nr:P.cartas.r[divId].nombre,
    cartaJ:P.cartas.j[divId].id,cartaR:P.cartas.r[divId].id});
  P.fase='fin'; P.fin=ganador;
}


/* ── BANDERAS Y SIGLAS DE PESO ──
   La bandera se compone con los dos indicadores regionales del código de país, que es
   como funcionan las banderas en Unicode. Inglaterra y Escocia no son países en ISO,
   así que llevan sus banderas de subdivisión, que sí existen. */
const PAIS_ISO = {
  'Afganistán':'AF','Alemania':'DE','Angola':'AO','Argentina':'AR','Armenia':'AM',
  'Australia':'AU','Austria':'AT','Azerbaiyán':'AZ','Baréin':'BH','Birmania':'MM',
  'Brasil':'BR','Bélgica':'BE','Canadá':'CA','Chequia':'CZ','China':'CN','Croacia':'HR',
  'Ecuador':'EC','Emiratos Árabes Unidos':'AE','Eslovaquia':'SK','España':'ES',
  'Estados Unidos':'US','Francia':'FR','Georgia':'GE','Irak':'IQ','Irlanda':'IE',
  'Italia':'IT','Jamaica':'JM','Japón':'JP','Kazajistán':'KZ','Kirguistán':'KG',
  'Lituania':'LT','Marruecos':'MA','Moldavia':'MD','México':'MX','Nigeria':'NG',
  'Nueva Zelanda':'NZ','Panamá':'PA','Países Bajos':'NL','Perú':'PE','Polonia':'PL',
  'Portugal':'PT','Rep. Dominicana':'DO','Rumanía':'RO','Rusia':'RU','Serbia':'RS',
  'Sudáfrica':'ZA','Suecia':'SE','Suiza':'CH','Tailandia':'TH','Turquía':'TR',
  'Ucrania':'UA','Uganda':'UG','Uzbekistán':'UZ','Venezuela':'VE','Zimbabue':'ZW',
};
// Las dos que no tienen código ISO propio: van con su bandera de subdivisión.
const PAIS_SUELTO = { 'Inglaterra':'gb-eng', 'Escocia':'gb-sct' };
/* Devuelve el archivo de la bandera. Son imágenes y no emojis a propósito: el emoji de
   bandera lo dibuja cada sistema a su manera —y Windows directamente no lo dibuja, pone
   las dos letras— así que la misma carta se vería distinta en cada móvil. */
function banderaSrc(pais){
  const cod=PAIS_SUELTO[pais]||(PAIS_ISO[pais]||'').toLowerCase();
  return cod?('banderas/'+cod+'.webp'):'';
}

/* Sigla de la división, al estilo de las tarjetas de la UFC. */
const SIGLA_DIV = {
  m7:'HW', m6:'LHW', m5:'MW', m4:'WW', m3:'LW', m2:'FW', m1:'BW', m0:'FLW',
  f2:'WBW', f1:'WFLW', f0:'WSW',
};

const MOTOR={especialistaDisponible, tamNombre, banderaSrc, PAIS_ISO, SIGLA_DIV, etiquetaEstatus, veteranoDisponible, ultimoDuelo, defendiendo, ESTATUS, EST, ORDEN_ESTATUS, TRAMOS, tramoDe, ordenar, comparar, sortearDuelo, REÑIDO, DIVISIONES, DIV, contiguas, vecinas, STATS, SID, SUBSTATS, RAREZAS, ORDEN_RAREZA, RASGOS, mulberry32, RNG, ri, pick, shuffle, clamp, ROSTER, generarRoster, alineables, rasgoTxt, MARGENES, nuevaPartida, terminarVetos, librePara, valorCarta, aplicarPenalizacion, penaliza, enviarAlDuelo, cambiosPosibles, hacerCambio, rasgoDe, camaleonesPosibles, resolverDuelo, resolverDesempate};
raiz.MOTOR=MOTOR;
// También sueltas en el global: el juego las usa por su nombre, sin prefijo.
for(const k of Object.keys(MOTOR)) if(!(k in raiz)) raiz[k]=MOTOR[k];

})(typeof globalThis!=='undefined'?globalThis:this);
