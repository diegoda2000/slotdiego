/* Iguala entre versiones lo que no depende del peso.

   El GDD §2.6 lo dice con nombre y apellidos:

     "Lo que no cambia entre versiones es lo que no depende del peso: el golpeo de
      Pereira es 88 en medio, semipesado y pesado. Lo que baja al subir o bajar es el
      aguante, el cardio y la lectura."

   Y los datos no lo cumplían. De los 46 peleadores con carta en más de una división,
   el GOLPEO variaba en 43, la LUCHA en 34 y el SUELO en 40. Khamzat Chimaev pegaba 74
   en medio y 80 en welter: el mismo puñetazo valiendo seis puntos distinto según la
   báscula.

   GOLPEO, LUCHA y SUELO son técnica y se igualan entre las cartas de un mismo peleador,
   tomando el valor más alto —que es lo que hace el ejemplo de Pereira— y respetando
   siempre el techo que le corresponde por puesto.

   CARDIO, DUREZA e IQ NO se tocan: son justo las tres que el documento dice que sí
   cambian al cruzar de peso, y ahí la diferencia entre versiones es correcta.

   Uso:  node herramientas/unificar-tecnica.mjs [--simular]
*/
import fs from 'fs';

const RUTA = 'docs/base-de-datos-peleadores.md';
const SIMULAR = process.argv.includes('--simular');
const TECNICA = [0, 1, 2];          // GOLPEO, LUCHA, SUELO
const NOMBRES = ['GOLPEO', 'LUCHA', 'SUELO'];

const lineas = fs.readFileSync(RUTA, 'utf8').split('\n');

let banda = null;
const filas = [];
lineas.forEach((ln, i) => {
  const cab = ln.match(/^###\s+(Oro|Plata)\s*$/);
  if (cab) { banda = cab[1].toLowerCase(); return; }
  if (!ln.startsWith('| **')) return;
  const p = ln.slice(1, -1).split('|').map(x => x.trim());
  if (p.length < 11) return;
  const stats = p.slice(3, 9).map(Number);
  if (stats.some(Number.isNaN)) return;
  filas.push({ i, p, stats, banda,
    nombre: p[0].replace(/\*\*/g, '').replace('◆', '').trim(), rk: p[2] });
});

const techoPorPuesto = rk => {
  if (rk === 'C') return 89;
  if (rk === '' || rk === '—' || rk === '-') return 85;
  const n = Number(rk);
  return n <= 5 ? 88 : n <= 10 ? 87 : 86;
};

// Se agrupa por peleador y se calcula, por stat técnica, el valor más alto de sus cartas.
const porPeleador = new Map();
for (const f of filas) {
  if (!porPeleador.has(f.nombre)) porPeleador.set(f.nombre, []);
  porPeleador.get(f.nombre).push(f);
}

let tocadas = 0, valores = 0;
const ejemplos = [];

for (const [nombre, cartas] of porPeleador) {
  if (cartas.length < 2) continue;
  // Mezclar oro y plata no tiene sentido: las bandas son distintas.
  for (const banda of ['oro', 'plata']) {
    const grupo = cartas.filter(c => c.banda === banda);
    if (grupo.length < 2) continue;
    const max = Math.max(...grupo.map(c => techoPorPuesto(c.rk)));
    const alto = TECNICA.map(k => Math.min(max, Math.max(...grupo.map(c => c.stats[k]))));
    for (const c of grupo) {
      const antes = c.stats.slice();
      TECNICA.forEach((k, j) => { c.stats[k] = alto[j]; });
      if (antes.join() === c.stats.join()) continue;
      tocadas++;
      valores += c.stats.filter((v, k) => v !== antes[k]).length;
      if (ejemplos.length < 12)
        ejemplos.push({ nombre, rk: c.rk, antes, ahora: c.stats.slice() });
      const p = c.p.slice();
      for (let k = 0; k < 6; k++) p[3 + k] = String(c.stats[k]);
      lineas[c.i] = '| ' + p.join(' | ') + ' |';
    }
  }
}

console.log(`${porPeleador.size} peleadores · ${tocadas} cartas igualadas · ${valores} valores cambiados\n`);
for (const e of ejemplos) {
  const rk = e.rk === 'C' ? 'C' : (e.rk && e.rk !== '—' ? '#' + e.rk : '—');
  console.log(`  ${rk.padStart(4)}  ${e.nombre.slice(0, 24).padEnd(26)} ${e.antes.join('-')} → ${e.ahora.join('-')}`);
}
console.log(`\n  (se igualan ${NOMBRES.join(', ')}; CARDIO, DUREZA e IQ cambian con el peso y no se tocan)`);

if (SIMULAR) { console.log('\n(simulación: no se ha escrito nada)'); process.exit(0); }
fs.writeFileSync(RUTA, lineas.join('\n'));
console.log(`\nEscrito en ${RUTA}`);
