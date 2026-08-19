/* Corrige las stats de la base de datos aplicando dos reglas que la propia base declara
   y que no se estaban cumpliendo. No inventa criterio nuevo: solo hace cumplir el suyo.

   REGLA 1 — La élite ancla la escala.
   "Los valores de la élite están anclados a criterio y la fórmula coloca al resto
   alrededor". Eso quiere decir que el techo de cada stat se gana con el puesto, y no
   estaba pasando: Brando Pericic, #15 con 7-1-0, tenía 88 de GOLPEO, el mismo número
   que Alex Pereira y por encima de Tom Aspinall. El techo pasa a ser:

       campeón 89 · Top 1-5 88 · Top 6-10 87 · Top 11-15 86 · oro sin rankear 85

   Aplica a las seis stats, no solo a la más alta: la carta refleja dónde estás.

   REGLA 2 — Las muestras cortas tiran hacia la media.
   "Las muestras cortas tiran hacia la media hasta acumular unas doce peleas". Tampoco se
   estaba aplicando: Josh Hokit, con diez peleas, tenía dos ochentaiochos. Con menos de
   doce peleas el valor se acerca a la media de su banda en proporción a lo corta que sea
   la muestra. Tira de los dos lados: una muestra corta tampoco puede ser extrema por
   abajo.

   Uso:  node herramientas/corregir-stats.mjs [--simular]
*/
import fs from 'fs';

const RUTA = 'docs/base-de-datos-peleadores.md';
const SIMULAR = process.argv.includes('--simular');
const MUESTRA_COMPLETA = 12;          // peleas a partir de las cuales el dato vale entero

const texto = fs.readFileSync(RUTA, 'utf8');
const lineas = texto.split('\n');

/* Se recorre el archivo guardando en qué tabla estamos —Oro o Plata— porque la banda y
   el techo dependen de eso, y la fila no lo dice por sí sola. */
let bandaActual = null;
const filas = [];
lineas.forEach((ln, i) => {
  const cab = ln.match(/^###\s+(Oro|Plata)\s*$/);
  if (cab) { bandaActual = cab[1].toLowerCase(); return; }
  if (/^##\s/.test(ln)) return;                    // cambia de división, la banda sigue
  if (!ln.startsWith('| **') || !bandaActual) return;
  const p = ln.slice(1, -1).split('|').map(x => x.trim());
  if (p.length < 11) return;
  const stats = p.slice(3, 9).map(Number);
  if (stats.some(Number.isNaN)) return;
  const m = p[10].match(/(\d+)-(\d+)-(\d+)/);
  const peleas = m ? +m[1] + +m[2] + +m[3] : MUESTRA_COMPLETA;
  filas.push({ i, p, stats, peleas, banda: bandaActual,
    nombre: p[0].replace(/\*\*/g, '').replace('◆', '').trim(), rk: p[2] });
});

const techoPorPuesto = rk => {
  if (rk === 'C') return 89;
  if (rk === '' || rk === '—' || rk === '-') return 85;
  const n = Number(rk);
  return n <= 5 ? 88 : n <= 10 ? 87 : 86;
};

// La media de cada stat, por banda: es hacia donde tira una muestra corta.
const media = {};
for (const banda of ['oro', 'plata']) {
  const de = filas.filter(f => f.banda === banda);
  media[banda] = [0, 1, 2, 3, 4, 5].map(k =>
    de.reduce((a, f) => a + f.stats[k], 0) / de.length);
}

const LIMITE = { oro: [74, 89], plata: [64, 82] };
let tocadas = 0, valores = 0;
const ejemplos = [];

for (const f of filas) {
  const [min, max] = LIMITE[f.banda];
  // El techo por puesto solo tiene sentido en oro: la plata no lleva ranking.
  const techo = f.banda === 'oro' ? techoPorPuesto(f.rk) : max;
  const peso = Math.min(1, f.peleas / MUESTRA_COMPLETA);
  const nuevas = f.stats.map((v, k) => {
    const conTecho = Math.min(v, techo);
    const regresado = media[f.banda][k] + (conTecho - media[f.banda][k]) * peso;
    return Math.max(min, Math.min(max, Math.round(regresado)));
  });
  if (nuevas.join() === f.stats.join()) continue;
  tocadas++;
  valores += nuevas.filter((v, k) => v !== f.stats[k]).length;
  if (ejemplos.length < 12) ejemplos.push({ ...f, nuevas });
  const p = f.p.slice();
  for (let k = 0; k < 6; k++) p[3 + k] = String(nuevas[k]);
  lineas[f.i] = '| ' + p.join(' | ') + ' |';
}

console.log(`${filas.length} filas leídas · ${tocadas} cartas corregidas · ${valores} valores cambiados\n`);
for (const e of ejemplos) {
  const rk = e.rk === 'C' ? 'C' : (e.rk && e.rk !== '—' ? '#' + e.rk : '—');
  console.log(`  ${e.nombre.slice(0, 22).padEnd(24)} ${rk.padStart(4)} ${String(e.peleas).padStart(2)}pel  ` +
    `${e.stats.join('-')} → ${e.nuevas.join('-')}`);
}

if (SIMULAR) { console.log('\n(simulación: no se ha escrito nada)'); process.exit(0); }
fs.writeFileSync(RUTA, lineas.join('\n'));
console.log(`\nEscrito en ${RUTA}`);
