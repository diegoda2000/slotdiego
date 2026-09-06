/* CALIBRA LAS SEIS STATS DE TODO EL PLANTEL.

   Lo mandó él: "las stats hay que cambiarlas radicalmente, muchas cartas muestran datos
   que no son reales", y cuando se le preguntó de dónde tenían que salir los números:
   **"haz que sean más que por estadística por la calidad de los peleadores y lo que
   muestran, la impresión que dan"**.

   QUÉ ESTABA MAL, medido antes de tocar nada:

   - GOLPEO iba de 80 a 89 en las 402 cartas. Margen máximo posible: 9. Y el finish del
     duelo empieza en 10, así que **por GOLPEO no se podía hacer finish jamás**, ni
     enfrentando al mejor del juego con el peor.
   - Alexander Volkov, #2 del mundo con 40 peleas, tenía 87/78/75/85/87/85. Martin Buday,
     SIN RANKING, tenía 81/80/77/85/85/85. Dos puntos entre un aspirante al título y uno
     que no está clasificado.
   - 14 cartas compartían las SEIS stats exactas. Michel Pereira y Gabriel Santos eran
     82-82-82-82-82-82: seis ochenta y dos, que es relleno y no un dato.
   - Y la base de datos decía que los números salían de "UFCStats sobre el historial
     completo, ponderado por el ranking del rival". **En el repositorio no hay ni un dato
     crudo de UFCStats.** Esa frase era falsa y se corrige con esta pasada.

   DE DÓNDE SALEN AHORA. De lo único que en este proyecto SÍ es verdad comprobable —el
   ranking congelado, el récord y la división— y del atributo, que es lo que dice cómo
   pelea. En ese orden:

     1. EL PUESTO PONE EL NIVEL. Es el dato real que ya manda en todo lo demás del juego:
        los sobres reparten por tramos de ranking, los SBC piden ranking y la venta paga
        por ranking. La carta tiene que decir lo mismo.
     2. EL ATRIBUTO PONE LA FORMA. Un Especialista GOLPEO tiene que VERSE especialista en
        golpeo, no llevar un 82 como todos. El GDD ya avisaba: "el especialista sale
        malparado, un 92 de golpeo y 60 en el resto da media 65 y parece basura, cuando es
        una carta buenísima". Aquí no hay media que lo esconda.
     3. LA DIVISIÓN INCLINA EL PERFIL. Un pesado pega más y aguanta menos ritmo; un mosca
        al revés. Eso es la impresión que da el peso, y es cierto de la disciplina.
     4. EL RÉCORD AJUSTA. La proporción de victorias y el volumen de peleas son datos
        reales del documento.
     5. Y UNA VARIACIÓN POR PELEADOR, sacada de un hash de su nombre: determinista —la
        misma siempre— y suficiente para que no haya dos cartas clonadas.

   NO SE INVENTA NI UN DATO DE NADIE. No hay aquí ninguna afirmación sobre un peleador
   concreto que no esté ya en el documento: sólo se convierte lo que hay en una escala que
   se lee.

   Uso:  node herramientas/calibrar-stats.mjs [--simular]
*/
import fs from 'fs';

const RUTA = 'docs/base-de-datos-peleadores.md';
const SIMULAR = process.argv.includes('--simular');
const STATS = ['gol', 'luc', 'sue', 'car', 'dur', 'iq'];

/* ── 1. EL PUESTO PONE EL NIVEL ────────────────────────────────────────────────────
   El centro de la carta. Un campeón vive en los noventa, un plata sin ranking en los
   sesenta, y entre medias hay sitio de verdad para que la diferencia se note. */
const NIVEL = { campeon: 88, top5: 84, top10: 80, top15: 76, oro: 69, plata: 60 };
const nivelDe = (rk, banda) => {
  if (rk === 0) return NIVEL.campeon;
  if (rk >= 1 && rk <= 5) return NIVEL.top5;
  if (rk >= 6 && rk <= 10) return NIVEL.top10;
  if (rk >= 11 && rk <= 15) return NIVEL.top15;
  return banda === 'plata' ? NIVEL.plata : NIVEL.oro;
};

/* ── 2. EL ATRIBUTO PONE LA FORMA ──────────────────────────────────────────────────
   Lo que hace que la carta se lea como el peleador. El especialista sube fuerte en LO
   SUYO y baja en el resto: es un arma, no un todoterreno. */
const FORMA = {
  especialista: st => ({ [st]: +11, resto: -4 }),
  veterano:  () => ({ iq: +6, dur: +5, car: -4 }),
  camaleon:  () => ({ iq: +4, car: +3, luc: +3, gol: -2 }),
  incomodo:  () => ({ iq: +5, gol: +4, dur: -2 }),
};

/* ── 3. LA DIVISIÓN INCLINA EL PERFIL ──────────────────────────────────────────────
   Un pesado pega y aguanta; le sobra poder y le falta ritmo. Un mosca es lo contrario:
   no noquea, pero no se para nunca. Es lo que ve cualquiera que haya visto MMA. */
const PESO = {
  'Peso pesado (M)':      { gol: +5, dur: +4, car: -7, luc: -2 },
  'Peso semipesado (M)':  { gol: +4, dur: +3, car: -4 },
  'Peso medio (M)':       { gol: +2, luc: +1, car: -1 },
  'Peso welter (M)':      { gol: +1, luc: +2 },
  'Peso ligero (M)':      { car: +2, luc: +1 },
  'Peso pluma (M)':       { car: +3, iq: +1, gol: -1 },
  'Peso gallo (M)':       { car: +4, iq: +1, gol: -3 },
  'Peso mosca (M)':       { car: +5, iq: +2, gol: -4, dur: -1 },
  'Peso gallo (F)':       { car: +3, iq: +1, gol: -2 },
  'Peso mosca (F)':       { car: +4, iq: +1, gol: -3 },
  'Peso paja (F)':        { car: +4, iq: +2, gol: -4, dur: -1 },
};

/* ── 4. EL RÉCORD AJUSTA ───────────────────────────────────────────────────────────
   Dos cosas reales y del documento: cuánto gana y cuánto ha peleado. Ganar casi siempre
   sube un poco; una carrera larga se paga en IQ y dureza, que es lo que da el oficio. */
function delRecord(g, p, e) {
  const total = g + p + e;
  const ratio = total ? g / total : 0.5;
  const porGanar = Math.round((ratio - 0.72) * 14);          // ±4 más o menos
  const veterania = Math.min(4, Math.floor(Math.max(0, total - 12) / 7));
  return { todas: porGanar, iq: veterania, dur: veterania };
}

/* ── 5. LA VARIACIÓN POR PELEADOR ──────────────────────────────────────────────────
   Determinista: sale del nombre, así que es la misma cada vez que se pasa esto. Sin ella
   dos peleadores del mismo tramo, división y atributo salen clonados, que es justo lo que
   pasaba: catorce cartas con las seis stats idénticas. */
function semilla(txt) {
  let h = 2166136261;
  for (let i = 0; i < txt.length; i++) { h ^= txt.charCodeAt(i); h = Math.imul(h, 16777619); }
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h ^= h >>> 13; return (h >>> 0) / 4294967296; };
}

const TECHO = 99, SUELO = 48;
export function calibrar(f) {
  const base = nivelDe(f.rk, f.banda);
  const az = semilla(f.nombre + '·' + f.division);
  const forma = f.rasgo ? (f.rasgo.tipo === 'especialista'
      ? FORMA.especialista(f.rasgo.stat)
      : FORMA[f.rasgo.tipo] ? FORMA[f.rasgo.tipo]() : {}) : {};
  const plus = f.rasgo && f.rasgo.plus ? 1.4 : 1;    // el Camaleón+ marca más
  const peso = PESO[f.division] || {};
  const rec = delRecord(f.g, f.p, f.e);

  const out = {};
  for (const s of STATS) {
    let v = base;
    v += (forma[s] || 0) * plus;
    if (forma.resto !== undefined && forma[s] === undefined) v += forma.resto;
    v += peso[s] || 0;
    v += rec.todas + (rec[s] || 0);
    // ±5 por peleador, con dos tiradas para que se agrupe en el centro y no sea plano
    v += Math.round((az() + az() - 1) * 5);
    out[s] = Math.max(SUELO, Math.min(TECHO, Math.round(v)));
  }
  return out;
}

/* ── Leer una fila del documento ───────────────────────────────────────────────────
   Extraído aparte y exportado porque lo usa también `medir-duelos.mjs`, que necesita
   calibrar el plantel entero SIN escribir nada para poder medir qué le hace al combate. */
export function leerFila(ln, banda, division) {
  const p = ln.slice(1, -1).split('|').map(x => x.trim());
  if (p.length < 11) return null;
  // El ◆ marca al que pelea en dos divisiones. Fuera del nombre: es una marca del
  // documento, no parte de cómo se llama, y con ella dentro no casa con el ROSTER.
  const nombre = p[0].replace(/\*\*/g, '').replace(/◆/g, '').trim();
  const rkTxt = p[2];
  const rk = (rkTxt === 'C' || rkTxt === 'c') ? 0
    : (/^\d+$/.test(rkTxt) ? Number(rkTxt) : null);
  const viejas = p.slice(3, 9).map(Number);
  if (viejas.some(Number.isNaN)) return null;
  const m = (p[10] || '').match(/(\d+)-(\d+)-(\d+)/);
  if (!m) return null;

  const rasgoTxt = p[9];
  let rasgo = null;
  if (rasgoTxt && rasgoTxt !== '—' && rasgoTxt !== '-') {
    const plus = rasgoTxt.endsWith('+');
    const b = (plus ? rasgoTxt.slice(0, -1) : rasgoTxt).trim();
    if (b.startsWith('Especialista')) {
      const st = { GOLPEO: 'gol', LUCHA: 'luc', SUELO: 'sue', CARDIO: 'car', DUREZA: 'dur', IQ: 'iq' }[b.split(/\s+/)[1]];
      rasgo = { tipo: 'especialista', stat: st, plus };
    } else rasgo = { tipo: b.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''), plus };
  }
  return { p, nombre, division, banda, rk, rasgo, viejas, g: +m[1], pe: +m[2], e: +m[3] };
}

/* Recorre el documento entero y devuelve una fila por peleador, ya calibrada. */
export function plantelCalibrado(ruta = RUTA) {
  const out = [];
  let banda = null, division = null;
  for (const ln of fs.readFileSync(ruta, 'utf8').split('\n')) {
    const div = ln.match(/^##\s+(Peso .+)$/);
    if (div) { division = div[1].trim(); continue; }
    const cab = ln.match(/^###\s+(Oro|Plata)\s*$/);
    if (cab) { banda = cab[1].toLowerCase(); continue; }
    if (!ln.startsWith('| **') || !banda || !division) continue;
    const f = leerFila(ln, banda, division);
    if (!f) continue;
    out.push({ ...f, nuevas: calibrar({ ...f, p: f.pe }) });
  }
  return out;
}

if (!process.argv[1] || !process.argv[1].endsWith('calibrar-stats.mjs')) {
  // importado como biblioteca: no se toca ningún archivo
} else main();

function main() {
/* ── Leer, calibrar y reescribir ───────────────────────────────────────────────── */
const texto = fs.readFileSync(RUTA, 'utf8');
const lineas = texto.split('\n');
let banda = null, division = null, tocadas = 0;
const antes = [], despues = [];

const salida = lineas.map(ln => {
  const div = ln.match(/^##\s+(Peso .+)$/);
  if (div) { division = div[1].trim(); return ln; }
  const cab = ln.match(/^###\s+(Oro|Plata)\s*$/);
  if (cab) { banda = cab[1].toLowerCase(); return ln; }
  if (!ln.startsWith('| **') || !banda || !division) return ln;

  const f = leerFila(ln, banda, division);
  if (!f) return ln;
  const nuevas = calibrar({ ...f, p: f.pe });
  antes.push(f.viejas); despues.push(STATS.map(s => nuevas[s])); tocadas++;
  const q = STATS.map(s => String(nuevas[s]));
  return '| ' + [f.p[0], f.p[1], f.p[2], ...q, f.p[9], f.p[10]].join(' | ') + ' |';
});

/* ── Lo que ha cambiado, en números ────────────────────────────────────────────── */
const plano = l => l.flat();
const resumen = (l, i) => {
  const v = l.map(x => x[i]).sort((a, b) => a - b);
  const med = v.reduce((a, b) => a + b, 0) / v.length;
  return { min: v[0], max: v[v.length - 1], media: med,
    dt: Math.sqrt(v.reduce((a, b) => a + (b - med) ** 2, 0) / v.length) };
};
const NOMBRES = ['GOLPEO', 'LUCHA', 'SUELO', 'CARDIO', 'DUREZA', 'IQ'];
console.log(`\n${tocadas} cartas calibradas.\n`);
console.log('                ANTES                        AHORA');
console.log('           min max media desv   →      min max media desv   margen máx');
for (let i = 0; i < 6; i++) {
  const a = resumen(antes, i), d = resumen(despues, i);
  console.log('  ' + NOMBRES[i].padEnd(7)
    + `${String(a.min).padStart(4)}${String(a.max).padStart(4)}${a.media.toFixed(1).padStart(7)}${a.dt.toFixed(1).padStart(6)}`
    + '   →   ' + `${String(d.min).padStart(4)}${String(d.max).padStart(4)}${d.media.toFixed(1).padStart(7)}${d.dt.toFixed(1).padStart(6)}`
    + `${String(d.max - d.min).padStart(10)}`);
}
const huella = l => { const h = {}; for (const x of l) { const k = x.join('-'); h[k] = (h[k] || 0) + 1; } 
  return Object.values(h).filter(n => n > 1).reduce((a, b) => a + b, 0); };
console.log(`\n  cartas clonadas (seis stats idénticas):  antes ${huella(antes)}  →  ahora ${huella(despues)}`);

if (SIMULAR) { console.log('\n  --simular: no se ha escrito nada.\n'); return; }
fs.writeFileSync(RUTA, salida.join('\n'));
console.log('\n  Escrito en ' + RUTA + '. Ahora: node herramientas/importar-roster.mjs\n');
}
