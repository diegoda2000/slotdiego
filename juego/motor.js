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

const RAREZAS = {
  bronce  :{n:'Bronce',   min:55,max:68,fichas:1/20},
  plata   :{n:'Plata',    min:65,max:78,fichas:1/5},
  oro     :{n:'Oro',      min:75,max:88,fichas:1},
  elite   :{n:'Élite',    min:85,max:95,fichas:3},
  leyenda :{n:'Leyenda',  min:96,max:99,fichas:8},
};
const ORDEN_RAREZA = ['bronce','plata','oro','elite','leyenda'];

// Arquetipos: sesgos por stat. Base de la autoría — el resto es ruido.
const ARQUETIPOS = [
  {n:'Striker de distancia', o:{golpeo:+9,lucha:-6,suelo:-7,cardio:+1,dureza:-1,iq:+4}},
  {n:'Boxeador de presión',  o:{golpeo:+8,lucha:+1,suelo:-8,cardio:+3,dureza:+4,iq:-3}},
  {n:'Luchador de control',  o:{golpeo:-6,lucha:+10,suelo:+6,cardio:+3,dureza:+2,iq:+1}},
  {n:'Grappler agresivo',    o:{golpeo:-8,lucha:+7,suelo:+11,cardio:-1,dureza:-2,iq:+2}},
  {n:'Sumisionista',         o:{golpeo:-9,lucha:+3,suelo:+12,cardio:-2,dureza:-1,iq:+4}},
  {n:'Peleador completo',    o:{golpeo:+2,lucha:+2,suelo:+2,cardio:+2,dureza:+1,iq:+3}},
  {n:'Guerrero de desgaste', o:{golpeo:0, lucha:+1,suelo:-2,cardio:+10,dureza:+9,iq:-4}},
  {n:'Noqueador',            o:{golpeo:+12,lucha:-3,suelo:-9,cardio:-6,dureza:+3,iq:-3}},
  {n:'Contragolpeador',      o:{golpeo:+5,lucha:-4,suelo:-4,cardio:+2,dureza:0, iq:+9}},
  {n:'Wrestleboxer',         o:{golpeo:+5,lucha:+7,suelo:0, cardio:+1,dureza:+1,iq:+2}},
];

const RASGOS = {
  camaleon   :{n:'Camaleón',   ic:'🦎', d:'Al declarar, manda esta carta a pelear a una división contigua sin penalización. Tu carta de esa división se descarta sin pelear y el Camaleón sigue disponible para su propio duelo.', dplus:'Igual, pero no consume tu jugada.'},
  incomodo   :{n:'Incómodo',   ic:'🌀', d:'Ocultas la división. El rival ve dos cartas suyas (la real y una contigua) y elige a ciegas. Si falla, su carta come -6.', dplus:'La segunda carta es de cualquier división en juego y el fallo cuesta -12. Usable siempre.'},
  especialista:{n:'Especialista',ic:'🎯',d:'Si gana su duelo en su stat, esa stat no se gasta del pool.', dplus:'La stat no se gasta aunque pierda.'},
  veterano   :{n:'Veterano',   ic:'🧠', d:'Cuando el rival declara la stat, la cambias por una aleatoria de entre las vivas.', dplus:'La eliges tú.'},
};

const PROMOTORAS = [
  {id:'liga', n:'Liga Mayor', alineable:true},
  {id:'cw',   n:'Circuito Norte',  alineable:false},
  {id:'ksw',  n:'Arena del Este',  alineable:false},
  {id:'rzn',  n:'Torneo Oriental', alineable:false},
  {id:'inv',  n:'Liga Invicta',    alineable:false},
];

const GIMNASIOS = ['Casa Negra','Hierro Viejo','Escuela Delta','Jaula 9','Templo Rojo','Nordeste MMA',
  'Alto Valle','Puño de Piedra','Academia Marea','Cuartel Sur','Bunker 12','Halcón Blanco'];
const PAISES = ['🇧🇷 Brasil','🇺🇸 EE.UU.','🇷🇺 Rusia','🇲🇽 México','🇮🇪 Irlanda','🇳🇬 Nigeria','🇯🇵 Japón',
  '🇵🇱 Polonia','🇰🇷 Corea','🇦🇺 Australia','🇫🇷 Francia','🇬🇧 Reino Unido','🇦🇷 Argentina','🇨🇳 China'];

const NOM_M = ['Dario','Kervin','Oleg','Tadeo','Mattis','Rulon','Ivo','Sabas','Nuno','Kaleb','Ronin','Elian',
 'Zoran','Bruno','Anselmo','Yuri','Iker','Marek','Teo','Casio','Adib','Renzo','Lubo','Ander','Tibor','Nael',
 'Osmar','Dimas','Vlado','Emeka','Hiro','Kwame','Silas','Roco','Jarek','Amiel','Nestor','Ciro','Baltasar','Vasco'];
const NOM_F = ['Nira','Talia','Yuna','Reka','Ilse','Mara','Zoe','Ainhoa','Kaia','Ludmila','Iria','Sena',
 'Vania','Runa','Amaia','Petra','Noor','Kira','Elsa','Tania','Maren','Ísis','Nadia','Lía','Frida','Ondina'];
const APE = ['Varga','Okonkwo','Mestre','Duarte','Kovac','Ferreiro','Nakamura','Bielski','Sandoval','Moreau',
 'Ibarra','Krylov','Tanaka','Oduya','Salgado','Vranic','Cabral','Nikolic','Estévez','Rahal','Bjorn','Cassano',
 'Petrov','Aguirre','Moss','Delacroix','Farkas','Quiroga','Nurgaliev','Owusu','Vidal','Strand','Barros','Melnyk',
 'Ozaki','Ferrán','Lombardi','Haddad','Rojas','Kirilenko','Bouchard','Nunes do Vale','Ashworth','Tovar'];
const APODOS = ['el Cirujano','Mano de Hierro','el Silencioso','Tormenta','el Reloj','Diente de Sable',
 'el Contable','Media Noche','el Ancla','Rayo Seco','el Profesor','Bisturí','el Náufrago','Cabeza Fría',
 'el Martillo','Viento Negro','el Cuervo','Piedra','el Relámpago','Corazón Frío','la Guillotina','el Sismo',
 'Mandíbula','el Verdugo','Aguja','Hueso Duro','el Fantasma','Perro Viejo','la Marea','Dos Caras'];

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
   3. GENERACIÓN DEL ROSTER  (semilla fija: el catálogo es siempre el mismo)
   ══════════════════════════════════════════════════════════════════════════ */
let ROSTER=[], PORID={};

function generarCarta(id,divId,rareza,promo,opts={}){
  const d=DIV[divId], fem=d.g==='F';
  const arq=pick(ARQUETIPOS);
  const R=RAREZAS[rareza];
  const objetivo=ri(R.min,R.max);
  const persona=opts.persona||{
    nombre:(fem?pick(NOM_F):pick(NOM_M))+' '+pick(APE),
    apodo: RNG()<.55?pick(APODOS):'',
    pais:pick(PAISES), gimnasio:pick(GIMNASIOS),
    veterano:RNG()<.28,
  };
  const stats={}, subs={};
  for(const s of SID){
    const t=clamp(objetivo+(arq.o[s]||0)+ri(-4,4),38,99);
    if(promo.alineable){
      // Las alineables llevan las 6 sub-stats; la grande es su media (GDD §2.2)
      const v=SUBSTATS[s].map(()=>clamp(t+ri(-7,7),35,99));
      subs[s]=v; stats[s]=Math.round(v.reduce((a,b)=>a+b,0)/v.length);
    }else{
      // Las de colección no son alineables: solo las 6 grandes (propuesta del plan)
      stats[s]=t;
    }
  }
  // El sesgo del arquetipo desplaza la media fuera de su banda de rareza. Se corrige
  // desplazando todo el bloque hasta el objetivo: mantiene la forma del arquetipo y
  // deja la media dentro del rango, que es lo que hace funcionar la tabla de márgenes.
  let media=Math.round(SID.reduce((a,s)=>a+stats[s],0)/6);
  const delta=objetivo-media;
  if(delta){
    for(const s of SID){
      if(subs[s]){
        subs[s]=subs[s].map(v=>clamp(v+delta,35,99));
        stats[s]=Math.round(subs[s].reduce((a,b)=>a+b,0)/subs[s].length);
      }else stats[s]=clamp(stats[s]+delta,35,99);
    }
    media=Math.round(SID.reduce((a,s)=>a+stats[s],0)/6);
  }
  return {id,persona:opts.personaId||id,nombre:persona.nombre,apodo:persona.apodo,
    pais:persona.pais,gimnasio:persona.gimnasio,esVeterano:persona.veterano,
    division:divId,rareza,media,stats,subs:promo.alineable?subs:null,
    promotora:promo.id,alineable:promo.alineable,arquetipo:arq.n,
    dobleDiv:!!opts.dobleDiv,rasgos:[],notraspasable:false};
}

function asignarRasgos(c){
  // Las cartas de colección no se alinean nunca, así que un rasgo en ellas sería una
  // promesa que no se puede cumplir. Además descuadraba la cuenta del equilibrado.
  if(!c.alineable) return;
  const p={bronce:.02,plata:.08,oro:.26,elite:.62,leyenda:.9}[c.rareza];
  if(RNG()>p) return;
  const posibles=['incomodo','especialista'];
  if(c.dobleDiv) posibles.push('camaleon');
  if(c.esVeterano) posibles.push('veterano');
  const n=(RNG()<.07 && posibles.length>1)?2:1;   // dos rasgos: rarísimo
  const elegidos=shuffle(posibles).slice(0,n);    // siempre distintos entre sí
  for(const t of elegidos){
    const r={tipo:t,plus:RNG()<.2};
    if(t==='especialista'){
      // asociado a su mejor stat
      r.stat=SID.slice().sort((a,b)=>c.stats[b]-c.stats[a])[0];
    }
    c.rasgos.push(r);
  }
}

/* Los rasgos se sortean por rareza, y con esa lotería es fácil que una clase entera se
   quede fuera: la primera versión de este roster no tenía NI UN Veterano en las 215 cartas,
   así que uno de los cuatro rasgos del diseño no existía en el juego. Esta pasada garantiza
   un mínimo de cada uno, respetando quién puede llevarlos. */
const MIN_POR_RASGO=8;
function equilibrarRasgos(cartas){
  const elegible=(c,t)=>{
    if(!c.alineable) return false;              // los rasgos solo cuentan si se pueden alinear
    if(c.rasgos.length>=2) return false;         // el máximo son dos por carta
    if(c.rasgos.some(r=>r.tipo===t)) return false;  // y tienen que ser distintos entre sí
    if(t==='camaleon') return c.dobleDiv;        // solo peleadores de dos divisiones
    if(t==='veterano') return c.esVeterano;      // solo carreras largas
    return true;
  };
  for(const t of Object.keys(RASGOS)){
    let n=cartas.filter(c=>c.rasgos.some(r=>r.tipo===t)).length;
    if(n>=MIN_POR_RASGO) continue;
    // de mejor a peor: el GDD dice que los rasgos van en versiones especiales,
    // no repartidos entre los bronces
    const cand=shuffle(cartas.filter(c=>elegible(c,t))).sort((a,b)=>b.media-a.media);
    for(const c of cand){
      if(n>=MIN_POR_RASGO) break;
      const r={tipo:t,plus:RNG()<.2};
      if(t==='especialista') r.stat=SID.slice().sort((x,y)=>c.stats[y]-c.stats[x])[0];
      c.rasgos.push(r); n++;
    }
  }
}

function generarRoster(){
  RNG=mulberry32(20260816);
  const out=[]; let n=0;
  const liga=PROMOTORAS[0];
  for(const d of DIVISIONES){
    const reparto=[...Array(6).fill('bronce'),...Array(4).fill('plata'),...Array(3).fill('oro'),'elite'];
    for(const rar of reparto) out.push(generarCarta('c'+(n++),d.id,rar,liga));
  }
  // 5 leyendas en todo el juego (GDD §2.4: "por encima de 95, 4-5 cartas")
  for(const dId of shuffle(DIVISIONES.map(d=>d.id)).slice(0,5))
    out.push(generarCarta('c'+(n++),dId,'leyenda',liga));

  // Peleadores con historial en dos divisiones → candidatos a Camaleón.
  // Comparten persona: no puedes alinear las dos versiones a la vez.
  const gemelas=[];
  for(const c of out){
    if(c.rareza==='bronce'||RNG()>.14) continue;
    const v=vecinas(c.division); if(!v.length) continue;
    const g=generarCarta('c'+(n++),pick(v),c.rareza,liga,{
      persona:{nombre:c.nombre,apodo:c.apodo,pais:c.pais,gimnasio:c.gimnasio,veterano:c.esVeterano},
      personaId:c.persona,dobleDiv:true});
    c.dobleDiv=true; gemelas.push(g);
  }
  out.push(...gemelas);

  // Cartas de colección de otras promotoras: no alineables
  for(const p of PROMOTORAS.slice(1)){
    for(let i=0;i<11;i++){
      const rar=['bronce','bronce','bronce','plata','plata','oro','oro','elite'][ri(0,7)];
      out.push(generarCarta('c'+(n++),pick(DIVISIONES).id,rar,p));
    }
  }
  for(const c of out) asignarRasgos(c);
  equilibrarRasgos(out);
  ROSTER=out; PORID=Object.fromEntries(out.map(c=>[c.id,c]));
  raiz.ROSTER=ROSTER; raiz.PORID=PORID; MOTOR.ROSTER=ROSTER; MOTOR.PORID=PORID;
  RNG=Math.random;
}

const alineables=()=>ROSTER.filter(c=>c.alineable);
const rasgoTxt=r=>RASGOS[r.tipo].n+(r.plus?'+':'')+(r.stat?' · '+r.stat.toUpperCase():'');

/* ══════════════════════════════════════════════════════════════════════════
   6. MOTOR DE REGLAS  (puro: no toca el DOM — extraíble a packages/rules)
   ══════════════════════════════════════════════════════════════════════════ */
const MARGENES={finish:13,decision:7};

function nuevaPartida(plantillaJ,plantillaR){
  return {fase:'rol', rolJ:null, vetoPrimero:null, vetados:[], vetoAzar:null,
    enJuego:[], jugadas:[], statsVivas:SID.slice(), duelo:0, turno:null,
    marcador:{j:0,r:0}, jugada:{j:false,r:false},
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

// Cambio de división: contiguas, ambas en juego, ninguna jugada, intercambio obligado
function cambiosPosibles(P,l){
  if(P.jugada[l]) return [];
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

// Camaleón: manda la carta a una contigua sin penalización; la de allí se descarta.
function camaleonesPosibles(P,l,divDeclarada){
  const out=[];
  for(const dId of librePara(P,l)){
    if(dId===divDeclarada) continue;
    const c=P.cartas[l][dId]; const r=rasgoDe(c,'camaleon');
    if(r && contiguas(dId,divDeclarada) && (!P.jugada[l]||r.plus)) out.push({div:dId,carta:c,rasgo:r});
  }
  return out;
}

function resolverDuelo(P,divId,stat,opts={}){
  const vj=valorCarta(P,'j',divId,stat), vr=valorCarta(P,'r',divId,stat);
  const m=Math.abs(vj-vr);
  let ganador, tipo;
  if(m===0){ ganador=Math.random()<.5?'j':'r'; tipo='reñido'; }         // empate: moneda al aire
  else{
    const alto=vj>vr?'j':'r';
    if(m>=MARGENES.finish){ ganador=alto; tipo='finish'; }
    else if(m>=MARGENES.decision){ ganador=alto; tipo='decisión'; }
    else { ganador=Math.random()<.65?alto:(alto==='j'?'r':'j'); tipo='reñido'; }
  }
  P.marcador[ganador]++;
  const cj=P.cartas.j[divId], cr=P.cartas.r[divId];
  P.log.push({t:'duelo',div:divId,stat,vj,vr,ganador,tipo,
    nj:cj?cj.nombre:'—',nr:cr?cr.nombre:'—',
    dobleJ:!!opts.dobleJ,dobleR:!!opts.dobleR});

  // ESPECIALISTA: la stat puede no gastarse (revive para los dos)
  let revive=false;
  for(const l of ['j','r']){
    const c=P.cartas[l][divId]; const r=rasgoDe(c,'especialista');
    if(r && r.stat===stat && (r.plus || ganador===l)) revive=true;
  }
  if(!revive) P.statsVivas=P.statsVivas.filter(s=>s!==stat);
  else P.log.push({t:'sys',x:`Especialista: ${stat.toUpperCase()} no se gasta y vuelve al pool.`});

  P.jugadas.push(divId);
  if(P.marcador.j>=4||P.marcador.r>=4){ P.fase='fin'; P.fin=P.marcador.j>=4?'j':'r'; return; }
  if(P.jugadas.length>=P.enJuego.length){
    if(P.marcador.j===P.marcador.r){ P.fase='desempate'; }
    else { P.fase='fin'; P.fin=P.marcador.j>P.marcador.r?'j':'r'; }
    return;
  }
  P.duelo++;
  P.turno=P.turno==='j'?'r':'j';
}

function resolverDesempate(P){
  const divId=P.vetoAzar, stat=pick(SID);   // azar solo donde ya no quedan decisiones
  const vj=valorCarta(P,'j',divId,stat), vr=valorCarta(P,'r',divId,stat);
  let ganador;
  const m=Math.abs(vj-vr);
  if(m===0) ganador=Math.random()<.5?'j':'r';
  else{ const alto=vj>vr?'j':'r'; ganador=(m>=MARGENES.decision)?alto:(Math.random()<.65?alto:(alto==='j'?'r':'j')); }
  P.marcador[ganador]++;
  P.log.push({t:'duelo',div:divId,stat,vj,vr,ganador,tipo:'desempate',
    nj:P.cartas.j[divId].nombre,nr:P.cartas.r[divId].nombre});
  P.fase='fin'; P.fin=ganador;
}

const MOTOR={DIVISIONES, DIV, contiguas, vecinas, STATS, SID, SUBSTATS, RAREZAS, ORDEN_RAREZA, ARQUETIPOS, RASGOS, PROMOTORAS, GIMNASIOS, PAISES, NOM_M, NOM_F, APE, APODOS, mulberry32, RNG, ri, pick, shuffle, clamp, ROSTER, generarCarta, asignarRasgos, generarRoster, alineables, rasgoTxt, MARGENES, nuevaPartida, terminarVetos, librePara, valorCarta, aplicarPenalizacion, penaliza, enviarAlDuelo, cambiosPosibles, hacerCambio, rasgoDe, camaleonesPosibles, resolverDuelo, resolverDesempate};
raiz.MOTOR=MOTOR;
// También sueltas en el global: el juego las usa por su nombre, sin prefijo.
for(const k of Object.keys(MOTOR)) if(!(k in raiz)) raiz[k]=MOTOR[k];

})(typeof globalThis!=='undefined'?globalThis:this);
