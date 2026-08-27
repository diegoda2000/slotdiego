/* Genera juego/fotos.js a partir de lo que haya en juego/fotos/.

   ¿Por qué un manifiesto y no probar a cargar la imagen y ver si falla? Porque en la
   colección se pintan doce cartas a la vez y en el resumen del sobre nueve: sin saber de
   antemano qué fotos existen, cada carta sin foto dispara una petición que falla, y la
   carta cambia de forma DESPUÉS de pintarse —el atributo pasa de estar en medio de la
   ventana a ser una chapa de abajo—, que es un salto que se ve. Con la lista dentro, la
   carta se pinta bien a la primera y no se pide nada que no esté.

   Las fotos van por PERSONA y no por carta: hay 402 cartas para 355 peleadores, y un
   peleador que compite en dos divisiones tiene dos cartas y una sola cara.

   CON UNA EXCEPCIÓN, y por eso existe <persona>-<división>.webp: quien es campeón en una
   división y no en la otra sale con el cinturón en las dos, y en la carta donde no es
   campeón eso es mentira. Esa carta lleva su propia foto sin cinturón. fotoSrc() mira
   primero la de la carta y si no la hay coge la de la persona.

   Uso:  node herramientas/generar-fotos.mjs
*/
import fs from 'fs';
import path from 'path';

const DIR = 'juego/fotos';
const SALIDA = 'juego/fotos.js';

const hay = fs.existsSync(DIR)
  ? fs.readdirSync(DIR).filter(f => f.endsWith('.webp')).map(f => f.slice(0, -5)).sort()
  : [];

/* El plantel, para decir qué falta y qué sobra. Se lee el fichero generado y se saca la
   lista de personas sin arrancar el juego entero. */
const roster = fs.readFileSync('juego/roster.js', 'utf8');
const personas = [...new Set([...roster.matchAll(/"persona":"([^"]+)"/g)].map(m => m[1]))].sort();
/* Las cartas, para poder validar los nombres de foto por carta: <persona>-<división> solo
   vale si esa persona tiene de verdad una carta en esa división. */
const cartas = new Set([...roster.matchAll(/"persona":"([^"]+)","nombre":"[^"]*","division":"([^"]+)"/g)]
  .map(m => m[1] + '-' + m[2]));

const faltan = personas.filter(p => !hay.includes(p));
const sobran = hay.filter(p => !personas.includes(p) && !cartas.has(p));

fs.writeFileSync(SALIDA,
`/* QUÉ FOTOS HAY — GENERADO, NO SE EDITA A MANO.

   Lo escribe herramientas/generar-fotos.mjs mirando qué archivos hay en juego/fotos/.
   Vuelve a ejecutarlo cada vez que añadas o quites una foto.

   ${hay.length} de ${personas.length} peleadores tienen foto. */
(function(raiz){
"use strict";
raiz.FOTOS = new Set(${JSON.stringify(hay)});
})(typeof globalThis!=='undefined'?globalThis:this);
`);

const porCarta = hay.filter(p => !personas.includes(p) && cartas.has(p));
console.log(`${hay.length - porCarta.length} fotos de ${personas.length} peleadores`);
if (porCarta.length) console.log(`  y ${porCarta.length} de carta suelta: ${porCarta.join(', ')}`);
if (sobran.length) console.log(`\n${sobran.length} sobran (no hay nadie con ese nombre):\n  ` + sobran.join('\n  '));
if (faltan.length) {
  console.log(`\n${faltan.length} sin foto. Los primeros veinte:`);
  console.log('  ' + faltan.slice(0, 20).join('\n  '));
  fs.writeFileSync('/tmp/faltan-fotos.txt', faltan.join('\n'));
  console.log(`\n  (la lista entera, en /tmp/faltan-fotos.txt)`);
}
