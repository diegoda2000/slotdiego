/* Baja las fotos de los peleadores de ufcespanol.com y las deja listas en juego/fotos/.

   ┌───────────────────────────────────────────────────────────────────────────┐
   │ ESTO HAY QUE EJECUTARLO EN UNA MÁQUINA CON INTERNET NORMAL.               │
   │ La sesión de Claude sale por un proxy con lista blanca que deniega        │
   │ ufc.com, ufcespanol.com, espn.com y casi todo lo demás con un 403, así    │
   │ que desde ahí no se puede bajar nada.                                     │
   └───────────────────────────────────────────────────────────────────────────┘

   Uso:
     node herramientas/importar-fotos.mjs --ver tom-aspinall   mira qué foto usaría, sin bajarla
     node herramientas/importar-fotos.mjs tom-aspinall ciryl-gane   solo esos dos
     node herramientas/importar-fotos.mjs                       los 355

   PRIMERO --ver CON UNO. La página puede haber cambiado de maqueta desde que se
   escribió esto; con --ver se ve en dos segundos qué imagen encuentra y de qué tamaño,
   sin gastar 355 descargas para descubrir que coge la que no era.

   QUÉ HACE CON CADA IMAGEN, y por qué:

   1. Recorta el aire transparente de alrededor. Las de la UFC vienen con el peleador
      recortado pero con margen, y ese margen es justo lo que no puede haber: el juego
      apoya la imagen en el suelo de su hueco, así que un dedo de nada al pie deja al
      peleador flotando por encima del cartel del nombre.
   2. La ajusta a la proporción del hueco de la carta (0,6529 = 391,8 / 600,1 px del
      dibujo). Si el peleador sale de cuerpo entero, corta por abajo y se queda con la
      mitad de arriba: en la carta se ve de cintura para arriba, que es como se ve en
      las de la UFC. Si sale más corto, rellena por ARRIBA, nunca por abajo.
   3. La deja a 360 px de ancho en WebP con transparencia.

   El recorte y el redimensionado se hacen con el Chromium de Playwright, que ya es
   dependencia de este repositorio por medir-carta.mjs. Las imágenes van al navegador
   en base64 y no por su URL: dibujar en un lienzo una imagen de otro dominio lo
   envenena y toDataURL revienta.

   Al terminar reescribe juego/fotos.js y deja en /tmp/fotos-sin-encontrar.txt los que no
   ha sabido resolver, para buscarlos a mano.
*/
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const BASE   = process.env.UFC_BASE || 'https://www.ufcespanol.com';
const DIR    = 'juego/fotos';
/* 360 px de ancho y calidad 0,75. La carta más grande que pinta el juego ronda los 400 px,
   y ahí la ventana de la foto mide 220: con 360 va sobrada. A 420 y calidad 0,86 —como
   empezó— salían de 57 KB, y 355 de esas son 20 MB dentro del APK. Así se quedan en 36 KB
   y el total en 12,6 MB. */
const ANCHO  = 360;
const CALIDAD = 0.75;
const PROPORCION = 0.6529;          // el hueco del marco: 391,8 / 600,1
const AGENTE = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
             + '(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const args = process.argv.slice(2);
const soloVer = args.includes('--ver');
const probar  = args.includes('--probar');   // pasa un archivo local por el recorte
const lote    = args.includes('--lote');     // pasa una carpeta entera, sin red
const desdeUrls = args.includes('--urls');   // baja de una lista de URLs ya conocida
const pedidos = args.filter(a => !a.startsWith('--'));

/* El Chromium que trae el contenedor no está donde lo busca Playwright, igual que en
   medir-carta.mjs. Si existe el del contenedor se usa ese; si no, el que Playwright
   tenga instalado, que es lo que pasará en una máquina normal. */
const exe = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const arranque = fs.existsSync(exe) ? { executablePath: exe } : {};

/* Modo URLs: baja de una lista <peleador> -> <url de la imagen> y recorta.

   Existe porque ufc.com contesta 403 a las IPs de datacenter —lo hace también con los
   runners de GitHub, no solo con el proxy de desarrollo—, así que abrir la ficha de cada
   peleador para sacar de ahí la foto no funciona desde ninguna máquina de las que hay a
   mano. Las URLs ya están: salen de fichas scrapeadas en su día, y apuntan directamente
   al archivo en /images/styles/athlete_bio_full_body/. Pedir el archivo es una petición
   de imagen, no de página, y eso sí suele pasar.

     node herramientas/importar-fotos.mjs --urls docs/fotos-urls.json
*/
if (desdeUrls) {
  const mapa = JSON.parse(fs.readFileSync(pedidos[0] || 'docs/fotos-urls.json', 'utf8'));
  fs.mkdirSync(DIR, { recursive: true });
  const navU = await chromium.launch(arranque);
  const pg = await navU.newPage();
  let ok = 0; const malas = [];
  for (const [persona, entrada] of Object.entries(mapa)) {
    if (fs.existsSync(path.join(DIR, persona + '.webp'))) continue;
    /* De algunos peleadores solo se conoce la RUTA del archivo en s3, no la firma
       (?itok=) del estilo athlete_bio_full_body, que Drupal calcula con una clave del
       sitio y no se puede reconstruir. Para esos la entrada es una lista de formas del
       mismo archivo —el CDN y ufc.com, con estilo y sin él— y se prueban en orden hasta
       que una conteste con una imagen. */
    const candidatas = Array.isArray(entrada) ? entrada : [entrada];
    let hecha = false, ultimo = '';
    for (const url of candidatas) {
      /* La UFC pone su propia silueta negra a quien no tiene foto todavía. Es una imagen
         válida y se bajaría sin protestar, pero es un borrón negro con forma de persona
         puesto sobre un peleador de verdad. Fuera. */
      if (esSilueta(url)) { ultimo = 'la UFC solo tiene su silueta de relleno'; continue; }
      try {
        const r = await fetch(url, { headers: { 'User-Agent': AGENTE, Referer: 'https://www.ufc.com/' } });
        if (!r.ok) { ultimo = String(r.status); continue; }
        const b64 = Buffer.from(await r.arrayBuffer()).toString('base64');
        const tipo = (r.headers.get('content-type') || 'image/png').split(';')[0];
        const out = await pg.evaluate(prepararImagen,
          { b64, tipo, ANCHO, PROPORCION, CALIDAD, espejo: miraAlOtroLado(url) });
        if (!out) { ultimo = 'imagen vacía'; continue; }
        fs.writeFileSync(path.join(DIR, persona + '.webp'), Buffer.from(out.d.split(',')[1], 'base64'));
        ok++; hecha = true;
        /* El tamaño de origen se enseña siempre: las oficiales vienen todas a 460x700,
           así que una que salga con otra medida avisa de que el encuadre no es el mismo
           y hay que mirarla antes de darla por buena. */
        console.log(`  ✓ ${persona} — ${out.W}x${out.H}${candidatas.length > 1 ? '  ' + url : ''}`);
        break;
      } catch (e) { ultimo = e.message; }
    }
    if (!hecha) { malas.push(`${persona}\t${ultimo}`); console.log(`  ✗ ${persona} — ${ultimo}`); }
  }
  await navU.close();
  console.log(`\n${ok} bajadas de ${Object.keys(mapa).length}`);
  if (malas.length) fs.writeFileSync('/tmp/fotos-sin-encontrar.txt', malas.join('\n') + '\n');
  process.exit(0);
}

/* Modo lote: coge una carpeta de imágenes ya descargadas y las pasa todas por el recorte
   en UNA sola sesión de navegador. Con --probar se abre y se cierra un Chromium por
   imagen, que para dos son dos segundos y para doscientas son siete minutos de arrancar
   y apagar. El nombre de salida es el mismo de entrada con extensión .webp, así que la
   carpeta de origen tiene que venir ya nombrada por el slug del peleador.

     node herramientas/importar-fotos.mjs --lote <carpeta-origen> <carpeta-destino>
*/
if (lote) {
  const [orig, dest] = pedidos;
  if (!orig || !dest) { console.log('uso: --lote <origen> <destino>'); process.exit(1); }
  fs.mkdirSync(dest, { recursive: true });
  const navL = await chromium.launch(arranque);
  const pg = await navL.newPage();
  const fichas = fs.readdirSync(orig).filter(f => /\.(webp|png|avif|jpe?g)$/i.test(f));
  let ok = 0; const malas = [];
  for (const f of fichas) {
    const b64 = fs.readFileSync(path.join(orig, f)).toString('base64');
    const tipo = { webp:'image/webp', avif:'image/avif', jpg:'image/jpeg', jpeg:'image/jpeg' }
                 [(f.split('.').pop()||'').toLowerCase()] || 'image/png';
    const out = await pg.evaluate(prepararImagen, { b64, tipo, ANCHO, PROPORCION, CALIDAD });
    if (!out) { malas.push(f); continue; }
    const nombre = f.replace(/\.(webp|png|avif|jpe?g)$/i, '') + '.webp';
    fs.writeFileSync(path.join(dest, nombre), Buffer.from(out.d.split(',')[1], 'base64'));
    ok++;
  }
  await navL.close();
  console.log(`${ok} recortadas de ${fichas.length}`);
  if (malas.length) console.log('sin recortar (vacías o sin transparencia):\n  ' + malas.join('\n  '));
  process.exit(0);
}

/* Modo prueba: coge una imagen del disco, la pasa por el mismo recorte que las
   descargadas y la escribe al lado con el sufijo -recortada. Sirve para comprobar el
   encuadre sin gastar una descarga, y sin red. */
if (probar) {
  const orig = pedidos[0];
  if (!orig) { console.log('uso: node herramientas/importar-fotos.mjs --probar <archivo>'); process.exit(1); }
  const nav0 = await chromium.launch(arranque);
  const pg = await nav0.newPage();
  const b64 = fs.readFileSync(orig).toString('base64');
  const tipo = { webp:'image/webp', avif:'image/avif', jpg:'image/jpeg', jpeg:'image/jpeg' }
               [(orig.split('.').pop()||'').toLowerCase()] || 'image/png';
  const out = await pg.evaluate(prepararImagen, { b64, tipo, ANCHO, PROPORCION, CALIDAD });
  await nav0.close();
  if (!out) { console.log('la imagen sale vacía'); process.exit(1); }
  const destino = orig.replace(/\.(png|webp|avif|jpg|jpeg)$/i, '') + '-recortada.webp';
  fs.writeFileSync(destino, Buffer.from(out.d.split(',')[1], 'base64'));
  console.log(`escrita ${destino} (origen ${out.W}x${out.H})`);
  process.exit(0);
}

const roster = fs.readFileSync('juego/roster.js', 'utf8');
const NOMBRE = {};
for (const m of roster.matchAll(/"persona":"([^"]+)","nombre":"([^"]+)"/g)) NOMBRE[m[1]] = m[2];
/* Por defecto solo se baja lo que falta. Repetir las 197 que ya están es media hora de
   descargas para acabar con los mismos archivos, y en un runner de GitHub eso es media
   hora de minutos gastados. Con --rehacer se bajan todas otra vez. */
const rehacer = args.includes('--rehacer');
const todas = pedidos.length ? pedidos : Object.keys(NOMBRE).sort();
const personas = rehacer ? todas
  : todas.filter(p => !fs.existsSync(path.join(DIR, p + '.webp')));
if (!rehacer && !soloVer)
  console.log(`${todas.length - personas.length} ya están; se bajan ${personas.length}.`);

fs.mkdirSync(DIR, { recursive: true });
const nav = await chromium.launch(arranque);
const pag = await nav.newPage({ userAgent: AGENTE });
const obrador = await nav.newPage();          // página en blanco, solo para el lienzo

const fallos = [];
let hechas = 0;

for (const persona of personas) {
  try {
    const url = await buscarFoto(persona);
    if (!url) { fallos.push(`${persona}\t(no encuentro la foto en la ficha)`); seguir(persona, 'sin foto en la ficha'); continue; }
    if (soloVer) { console.log(`${persona}\n  ficha: ${BASE}/athlete/${persona}\n  foto : ${url}`); continue; }

    const resp = await fetch(url, { headers: { 'User-Agent': AGENTE, Referer: `${BASE}/athlete/${persona}` } });
    if (!resp.ok) { fallos.push(`${persona}\t(la imagen da ${resp.status})`); seguir(persona, `imagen ${resp.status}`); continue; }
    const b64 = Buffer.from(await resp.arrayBuffer()).toString('base64');
    const tipo = (resp.headers.get('content-type') || 'image/png').split(';')[0];

    const out = await obrador.evaluate(prepararImagen,
      { b64, tipo, ANCHO, PROPORCION, CALIDAD, espejo: miraAlOtroLado(url) });
    if (!out) { fallos.push(`${persona}\t(la imagen sale vacía o sin transparencia)`); seguir(persona, 'imagen vacía'); continue; }

    fs.writeFileSync(path.join(DIR, persona + '.webp'), Buffer.from(out.d.split(',')[1], 'base64'));
    hechas++;
    console.log(`  ✓ ${persona} — ${out.W}x${out.H}`);
  } catch (e) {
    fallos.push(`${persona}\t(${e.message})`);
    seguir(persona, e.message);
  }
}
await nav.close();

if (!soloVer) {
  console.log(`\n${hechas} fotos guardadas de ${personas.length} intentos.`);
  if (fallos.length) {
    fs.writeFileSync('/tmp/fotos-sin-encontrar.txt', fallos.join('\n') + '\n');
    console.log(`${fallos.length} sin resolver, en /tmp/fotos-sin-encontrar.txt`);
  }
  console.log('\nAhora:  node herramientas/generar-fotos.mjs');
}

function seguir(persona, motivo) { console.log(`  ✗ ${persona} — ${motivo}`); }

/* Abre la ficha del peleador y saca la URL de la foto de cuerpo entero recortada.

   Se mira el DOM ya montado y no el HTML crudo porque la ficha carga parte de la
   maqueta con JavaScript. Se prefieren, por este orden, los estilos de imagen que la
   UFC usa para el cuerpo entero sobre fondo transparente; si no hay ninguno, se coge la
   imagen más grande de la ficha que no sea un logotipo ni una bandera. */
async function buscarFoto(persona) {
  const resp = await pag.goto(`${BASE}/athlete/${persona}`, { waitUntil: 'domcontentloaded', timeout: 30000 })
    .catch(() => null);
  if (!resp || !resp.ok()) return null;
  await pag.waitForTimeout(400);
  return pag.evaluate(() => {
    const PREFERIDOS = ['athlete_bio_full_body', 'athlete_full_body', 'full_body', 'upper_body'];
    const urls = [...document.images]
      .map(i => i.currentSrc || i.src)
      .filter(u => u && /^https?:/.test(u) && !/logo|flag|bandera|sponsor|icon/i.test(u));
    for (const clave of PREFERIDOS) {
      const u = urls.find(x => x.includes(clave));
      if (u) return u;
    }
    // Último recurso: la imagen más alta de la página, que en una ficha es el peleador.
    const grande = [...document.images]
      .filter(i => (i.currentSrc || i.src) && !/logo|flag|sponsor|icon/i.test(i.currentSrc || i.src))
      .sort((a, b) => b.naturalHeight - a.naturalHeight)[0];
    return grande && grande.naturalHeight > 300 ? (grande.currentSrc || grande.src) : null;
  });
}

/* Recorta, encuadra y comprime. Va entero dentro del navegador. */
/* El nombre del archivo de la UFC dice a qué lado mira: MORONO_ALEX_L_03-08.png va a la
   esquina izquierda del cartel y TOPURIA_ILIA_L_BELT_10-26.png también. Los _R_ miran al
   contrario y hay que voltearlos. */
function miraAlOtroLado(url) {
  const base = decodeURIComponent(url.split('?')[0]).split('/').pop();
  return /_R(?:_BELT)?[_.]/.test(base);
}
/* Las siluetas de relleno de la UFC, para quien todavía no tiene foto. */
function esSilueta(url) {
  return /SHADOW_Fighter|silhouette/i.test(url);
}

function prepararImagen({ b64, tipo, ANCHO, PROPORCION, CALIDAD, espejo }) {
  return new Promise(resolve => {
    const img = new Image();
    img.onerror = () => resolve(null);
    img.onload = () => {
      const W = img.naturalWidth, H = img.naturalHeight;
      if (!W || !H) return resolve(null);

      /* SE RESPETA EL ENCUADRE DE LA FOTO, NO SE RECORTA A LA SILUETA.

         Antes se buscaba la caja de lo que no es transparente y se escalaba ESA hasta
         llenar el ancho de la carta. Suena bien y estaba mal: la caja depende de la
         postura. A un peleador con los brazos pegados al cuerpo la silueta le sale
         estrecha, así que se agrandaba hasta que la cabeza no cabía y salía cortada por
         arriba; a uno con los brazos abiertos le salía ancha y se encogía hasta parecer
         de otra colección. El resultado era que cada carta tenía su propio zoom.

         Las fotos oficiales ya vienen encuadradas igual entre sí —460x700, mismo plano,
         mismo estudio—, y su proporción, 0,657, es casi la del hueco de la carta, 0,6529.
         Así que lo que hay que hacer es ajustar el ENCUADRE ENTERO al hueco y no tocar
         nada más: se recorta lo que sobra por los lados, a partes iguales para no
         descentrar al peleador, o por ARRIBA si sobra alto, nunca por abajo, porque abajo
         es donde el cuerpo tiene que llegar al cartel del nombre.

         Con esto el zoom es el mismo en las 355 y la única diferencia entre una carta y
         otra es el peleador. */
      let sx = 0, sy = 0, sw = W, sh = H;
      if (W / H > PROPORCION) {                 // sobra ancho: se quita a los dos lados
        sw = Math.round(H * PROPORCION);
        sx = Math.round((W - sw) / 2);
      } else {                                  // sobra alto: se quita por arriba
        sh = Math.round(W / PROPORCION);
        sy = H - sh;
      }
      const sal = document.createElement('canvas');
      sal.width = ANCHO; sal.height = Math.round(ANCHO / PROPORCION);
      const g = sal.getContext('2d');
      /* TODOS MIRANDO AL MISMO LADO.

         La UFC fotografía a cada peleador dos veces, una para cada esquina del cartel, y
         nombra los archivos _L_ y _R_ según a qué lado van. En el _R_ el peleador está
         girado hacia el otro lado. Mezclados en la baraja se ve enseguida: unos miran a un
         sitio y otros al contrario. De 354 fotos, 289 son _L_, así que ese es el lado
         bueno y las _R_ se voltean. No es un retoque de la foto: es la misma imagen vista
         desde el otro lado, que es exactamente lo que la UFC hace con sus dos tomas. */
      if (espejo) { g.translate(sal.width, 0); g.scale(-1, 1); }
      g.drawImage(img, sx, sy, sw, sh, 0, 0, sal.width, sal.height);
      resolve({ d: sal.toDataURL('image/webp', CALIDAD), W, H });
    };
    img.src = `data:${tipo};base64,${b64}`;
  });
}

