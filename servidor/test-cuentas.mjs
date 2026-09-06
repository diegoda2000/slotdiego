/* Prueba la clase Cuentas del Worker fuera de Cloudflare, con un almacén de mentira que
   se comporta como ctx.storage: get(clave) y put(objeto o clave,valor). */
import { Cuentas, VUELTAS } from './src/index.js';

const almacen = new Map();
const ctx = { storage: {
  async get(k){ return almacen.has(k) ? structuredClone(almacen.get(k)) : undefined },
  async put(a,b){ if(typeof a==='object'){ for(const [k,v] of Object.entries(a)) almacen.set(k,v); }
                  else almacen.set(a,b); },
  // list() como el de un Durable Object: por prefijo, ordenado por clave.
  async list({ prefix = '', reverse = false, limit = 1000 } = {}){
    let cl = [...almacen.keys()].filter(k => k.startsWith(prefix)).sort();
    if (reverse) cl.reverse();
    return new Map(cl.slice(0, limit).map(k => [k, structuredClone(almacen.get(k))]));
  },
}};
// Sin clave de correo ni de lectura: es como está hoy en producción.
const C = new Cuentas(ctx, {});

const pide = (ruta, {metodo='POST', cuerpo, token} = {}) => C.fetch(new Request(
  'https://x'+ruta, { method: metodo, headers: token?{Authorization:'Bearer '+token}:{},
    body: cuerpo ? JSON.stringify(cuerpo) : undefined }));
const leer = async r => [r.status, await r.json()];

let fallos = 0;
const ok = (c, q) => { console.log((c?'  ok  ':'FALLA ')+q); if(!c) fallos++; };

// 1. registro bueno
let [s, j] = await leer(await pide('/cuenta/registro',
  {cuerpo:{usuario:'Diego', correo:'Diego@Ejemplo.com', clave:'contrasena1', estado:{partidas:7,coleccion:[1,2,3]}}}));
ok(s===200 && j.token && j.cuenta.usuario==='Diego', 'registro devuelve token y cuenta');
const tokenD = j.token;
ok(!JSON.stringify([...almacen.values()]).includes('contrasena1'), 'la contraseña NO está guardada en ninguna parte');

// 2. el nombre y el correo son únicos, sin importar mayúsculas
[s, j] = await leer(await pide('/cuenta/registro',
  {cuerpo:{usuario:'DIEGO', correo:'otro@ejemplo.com', clave:'contrasena1'}}));
ok(s===409, 'usuario repetido en otras mayúsculas → 409  ('+j.error+')');
[s, j] = await leer(await pide('/cuenta/registro',
  {cuerpo:{usuario:'otro', correo:'DIEGO@ejemplo.COM', clave:'contrasena1'}}));
ok(s===409, 'correo repetido en otras mayúsculas → 409');

// 3. lo que no vale
for (const [caso, d] of [
  ['usuario corto',   {usuario:'ab', correo:'a@b.co', clave:'contrasena1'}],
  ['usuario con espacios', {usuario:'di ego', correo:'a@b.co', clave:'contrasena1'}],
  ['correo malo',     {usuario:'valido', correo:'noesuncorreo', clave:'contrasena1'}],
  ['clave de 7',      {usuario:'valido', correo:'a@b.co', clave:'1234567'}],
  ['sin nada',        {}],
]) { [s] = await leer(await pide('/cuenta/registro',{cuerpo:d})); ok(s===400, caso+' → 400'); }

// 4. entrar
[s, j] = await leer(await pide('/cuenta/entrar',{cuerpo:{quien:'diego', clave:'contrasena1'}}));
ok(s===200 && j.estado && j.estado.partidas===7, 'entrar con el usuario baja el estado subido al registrarse');
[s, j] = await leer(await pide('/cuenta/entrar',{cuerpo:{quien:'DIEGO@ejemplo.com', clave:'contrasena1'}}));
ok(s===200 && j.token, 'entrar con el correo también vale');
const tokenB = j.token;

// 5. contraseña mala y usuario que no existe dan el MISMO error
const [s1, j1] = await leer(await pide('/cuenta/entrar',{cuerpo:{quien:'diego', clave:'otracosa'}}));
const [s2, j2] = await leer(await pide('/cuenta/entrar',{cuerpo:{quien:'nadie', clave:'otracosa'}}));
ok(s1===401 && s2===401 && j1.error===j2.error, 'contraseña mala y usuario inexistente dan el mismo 401');

// 6. subir y bajar
[s, j] = await leer(await pide('/cuenta/subir',{cuerpo:{estado:{partidas:99,coleccion:[1]}}, token:tokenD}));
ok(s===200 && j.ok, 'subir con token bueno');
[s, j] = await leer(await pide('/cuenta/bajar',{metodo:'GET', token:tokenB}));
ok(s===200 && j.estado.partidas===99, 'el otro token del mismo usuario baja lo recién subido');
[s] = await leer(await pide('/cuenta/subir',{cuerpo:{estado:{}}, token:'inventado'}));
ok(s===401, 'token inventado → 401');
[s] = await leer(await pide('/cuenta/subir',{cuerpo:{estado:{}}}));
ok(s===401, 'sin token → 401');
[s] = await leer(await pide('/cuenta/bajar',{metodo:'GET'}));
ok(s===401, 'bajar sin token → 401');

// 7. rutas y métodos que no son
[s] = await leer(await pide('/cuenta/loquesea',{cuerpo:{}}));      ok(s===404, 'ruta desconocida → 404');
[s] = await leer(await pide('/cuenta/entrar',{metodo:'GET'}));     ok(s===404, 'entrar por GET → 404');

// 8. dos cuentas distintas no se ven los estados
[s, j] = await leer(await pide('/cuenta/registro',
  {cuerpo:{usuario:'ana', correo:'ana@ejemplo.com', clave:'contrasena2', estado:{partidas:1}}}));
const tokenA = j.token;
[s, j] = await leer(await pide('/cuenta/bajar',{metodo:'GET', token:tokenA}));
ok(j.estado.partidas===1 && j.cuenta.usuario==='ana', 'cada cuenta baja lo suyo');

// 9. la misma contraseña en dos cuentas da hashes distintos (la sal es por cuenta)
const a = almacen.get('usuario:diego'), b = almacen.get('usuario:ana');
ok(a.sal!==b.sal, 'cada cuenta tiene su propia sal');

/* 10. EL TAMAÑO DEL ESTADO, Y ES OTRO CASO DE "LO QUE EL ENTORNO DE PRUEBAS NO
   REPRODUCE" —el mismo cuento que las 100.000 vueltas de aquí abajo—. Esto probaba que
   subían 5.000 cartas (194 KB) y pasaba... sobre una mentira: el almacén de mentira no
   tiene límite de tamaño, pero UN VALOR DE DURABLE OBJECT NO PUEDE PASAR DE 128 KiB. En
   Cloudflare aquello no subía: reventaba con un 500 y el jugador sólo veía que la
   partida no se guardaba, sin saber por qué.
   Ahora se corta por debajo del techo y se dice lo que pasa. */
const cartas = n => ({partidas:1, coleccion:Array.from({length:n},(_,i)=>({iid:'i'+i,cid:'ilia-topuria-m3',rz:'epica'}))});
const gordo = cartas(2000);
[s] = await leer(await pide('/cuenta/subir',{cuerpo:{estado:gordo}, token:tokenD}));
ok(s===200, 'sube una colección enorme pero posible, 2.000 cartas ('+(JSON.stringify(gordo).length/1024).toFixed(0)+' KB)');

const pasado = cartas(5000);
[s, j] = await leer(await pide('/cuenta/subir',{cuerpo:{estado:pasado}, token:tokenD}));
ok(s===413, 'y por encima del techo de Cloudflare corta con un 413, no con un 500 mudo ('
  +(JSON.stringify(pasado).length/1024).toFixed(0)+' KB)');
ok(/KB/.test(j.error||'') && /este móvil/.test(j.error||''),
  'y el error dice cuánto ocupa y que en el móvil sigue guardada  ('+j.error+')');
[s, j] = await leer(await pide('/cuenta/bajar',{metodo:'GET', token:tokenD}));
ok(j.estado.coleccion.length===2000, 'y lo que ya estaba subido NO se ha pisado con lo que no cabía');

/* 11. EL TECHO DE CLOUDFLARE. Workers rechaza PBKDF2 por encima de 100.000 vueltas, y
   `wrangler dev` NO lo comprueba: con 150.000 esto pasaba en local y el worker desplegado
   devolvía 500 al registrarse. Lo que el entorno de pruebas no reproduce, se sujeta aquí. */
ok(VUELTAS <= 100000, `las vueltas de PBKDF2 caben en el techo de Cloudflare (${VUELTAS} de 100.000)`);
ok(VUELTAS >= 50000, `y siguen siendo bastantes como para que probar a lo bruto duela (${VUELTAS})`);

/* ── EL SOBRE DE SUGERENCIAS ─────────────────────────────────────────────────────── */
[s, j] = await leer(await pide('/sugerencia', {cuerpo:{texto:'el sobre tarda mucho en abrirse', anonimo:'jabc123'}}));
ok(s===200 && j.ok, 'una sugerencia sin cuenta se acepta');
[s, j] = await leer(await pide('/sugerencia', {cuerpo:{texto:'me encanta la carta nueva'}, token:tokenD}));
ok(s===200 && j.ok, 'y con cuenta también');

for (const [caso, t] of [['tres letras','abc'], ['vacía',''], ['larguísima','x'.repeat(2001)]])
  { [s] = await leer(await pide('/sugerencia',{cuerpo:{texto:t}})); ok(s===400, 'una sugerencia '+caso+' → 400'); }

/* SE GUARDAN SIEMPRE, aunque no haya clave de correo. Perder lo que ha escrito alguien
   porque falta una configuración es peor que no tener el botón. */
const guardadas = [...almacen.entries()].filter(([k]) => k.startsWith('sugerencia:')).map(([,v]) => v);
ok(guardadas.length === 2, `se guardan aunque no haya clave de correo (${guardadas.length} de 2)`);
const conCuenta = guardadas.find(x => x.quien.usuario);
const sinCuenta = guardadas.find(x => x.quien.anonimo);
ok(conCuenta && conCuenta.quien.correo === 'Diego@Ejemplo.com',
  'la de quien tiene sesión se firma con SU cuenta, no con lo que diga el móvil');
ok(sinCuenta && sinCuenta.quien.anonimo === 'jabc123' && !sinCuenta.quien.usuario,
  'y la de quien no la tiene, con el identificador anónimo del aparato');

// Leerlas está detrás de un secreto, y sin ese secreto la ruta no existe.
[s] = await leer(await pide('/sugerencia/lista',{metodo:'GET'}));
ok(s===404, 'sin CLAVE_SUGERENCIAS puesta, la ruta de leerlas no existe');
const C2 = new Cuentas(ctx, { CLAVE_SUGERENCIAS: 'la-clave-buena' });
const pide2 = (r,{metodo='GET',token}={}) => C2.fetch(new Request('https://x'+r,
  { method: metodo, headers: token?{Authorization:'Bearer '+token}:{} }));
[s] = await leer(await pide2('/sugerencia/lista'));
ok(s===401, 'con la clave puesta pero sin mandarla → 401');
[s] = await leer(await pide2('/sugerencia/lista',{token:'la-mala'}));
ok(s===401, 'y con una clave equivocada → 401');
[s, j] = await leer(await pide2('/sugerencia/lista',{token:'la-clave-buena'}));
ok(s===200 && j.sugerencias.length===2, `con la clave buena salen las dos (${j.sugerencias.length})`);

// Y sin clave de correo, mandarlo no revienta: la sugerencia ya está guardada.
[s, j] = await leer(await pide('/sugerencia',{cuerpo:{texto:'sin clave de correo tampoco peta'}}));
ok(s===200 && j.ok, 'sin RESEND_API_KEY no se intenta mandar nada y no se rompe');


/* ── EL FRENO ─────────────────────────────────────────────────────────────────────
   Cada caso monta SU PROPIA instancia: los contadores viven en el objeto, así que
   compartirlos entre pruebas haría que una encendiera el freno de la siguiente. */
const nueva = (env = {}) => {
  const m = new Map();
  return new Cuentas({ storage: {
    async get(k){ return m.has(k) ? structuredClone(m.get(k)) : undefined },
    async put(a,b){ if(typeof a==='object'){ for(const [k,v] of Object.entries(a)) m.set(k,v); } else m.set(a,b); },
    async list({ prefix='', reverse=false, limit=1000 }={}){
      let cl=[...m.keys()].filter(k=>k.startsWith(prefix)).sort(); if(reverse) cl.reverse();
      return new Map(cl.slice(0,limit).map(k=>[k,structuredClone(m.get(k))])); },
  }}, env);
};
const llamar = (C, ruta, {metodo='POST', cuerpo, token, ip}={}) => C.fetch(new Request('https://x'+ruta,
  { method: metodo, body: cuerpo?JSON.stringify(cuerpo):undefined,
    headers: { ...(token?{Authorization:'Bearer '+token}:{}), ...(ip?{'CF-Connecting-IP':ip}:{}) } }));

{ // ocho intentos de contraseña y el noveno ya no pasa
  const C = nueva();
  await llamar(C,'/cuenta/registro',{cuerpo:{usuario:'pepe',correo:'p@e.co',clave:'contrasena1'}});
  const codigos = [];
  for (let i=0;i<9;i++) codigos.push((await llamar(C,'/cuenta/entrar',{cuerpo:{quien:'pepe',clave:'mal'+i}})).status);
  ok(codigos.slice(0,8).every(c=>c===401) && codigos[8]===429,
    'ocho contraseñas malas dan 401 y la novena ya es 429  ['+codigos.join(' ')+']');
  const r = await llamar(C,'/cuenta/entrar',{cuerpo:{quien:'pepe',clave:'contrasena1'}});
  ok(r.status===429 && r.headers.get('Retry-After'),
    'y con el freno echado no entra ni con la contraseña buena, y dice cuánto esperar ('+r.headers.get('Retry-After')+'s)');
}

{ // acertar suelta el contador
  const C = nueva();
  await llamar(C,'/cuenta/registro',{cuerpo:{usuario:'pepe',correo:'p@e.co',clave:'contrasena1'}});
  for (let i=0;i<5;i++) await llamar(C,'/cuenta/entrar',{cuerpo:{quien:'pepe',clave:'mal'}});
  ok((await llamar(C,'/cuenta/entrar',{cuerpo:{quien:'pepe',clave:'contrasena1'}})).status===200,
    'cinco fallos y a la sexta acierta: entra');
  const cs=[]; for (let i=0;i<8;i++) cs.push((await llamar(C,'/cuenta/entrar',{cuerpo:{quien:'pepe',clave:'mal'}})).status);
  ok(cs.every(c=>c===401), 'y al acertar se le borra el contador: vuelve a tener ocho enteros');
}

{ // el freno no puede delatar qué cuentas existen
  const C = nueva();
  const cs=[]; for (let i=0;i<9;i++) cs.push((await llamar(C,'/cuenta/entrar',{cuerpo:{quien:'nohay',clave:'x'}})).status);
  ok(cs[8]===429, 'una cuenta que NO existe se frena igual que una que sí  (si no, el 429 diría cuáles hay)');
}

{ // altas por IP
  const C = nueva();
  const cs=[];
  for (let i=0;i<11;i++) cs.push((await llamar(C,'/cuenta/registro',
    {cuerpo:{usuario:'alta'+i,correo:'alta'+i+'@e.co',clave:'contrasena1'}, ip:'1.2.3.4'})).status);
  ok(cs.slice(0,10).every(c=>c===200) && cs[10]===429, 'diez altas por IP y hora; la once se frena');
  ok((await llamar(C,'/cuenta/registro',
    {cuerpo:{usuario:'otra',correo:'otra@e.co',clave:'contrasena1'}, ip:'9.9.9.9'})).status===200,
    'y a otra IP no le salpica el freno de la primera');
}

{ // sin cabecera de IP el freno por IP no cuenta: fuera de Cloudflare no hay a quién contar
  const C = nueva();
  const cs=[];
  for (let i=0;i<12;i++) cs.push((await llamar(C,'/cuenta/registro',
    {cuerpo:{usuario:'libre'+i,correo:'libre'+i+'@e.co',clave:'contrasena1'}})).status);
  ok(cs.every(c=>c===200), 'sin CF-Connecting-IP no se aplica el freno por IP (12 de 12 pasan)');
}

{ // sugerencias por IP
  const C = nueva();
  const cs=[];
  for (let i=0;i<6;i++) cs.push((await llamar(C,'/sugerencia',{cuerpo:{texto:'una sugerencia numero '+i}, ip:'5.5.5.5'})).status);
  ok(cs.slice(0,5).every(c=>c===200) && cs[5]===429, 'cinco sugerencias por IP y diez minutos; la sexta se frena');
}

/* ── LA COPIA DE SEGURIDAD ────────────────────────────────────────────────────────── */
{
  const sinClave = nueva();
  await llamar(sinClave,'/cuenta/registro',{cuerpo:{usuario:'zoe',correo:'z@e.co',clave:'contrasena1',estado:{partidas:4}}});
  ok((await llamar(sinClave,'/cuenta/copia',{metodo:'GET'})).status===404,
    'sin CLAVE_COPIA puesta, la ruta de la copia no existe');

  const C = nueva({ CLAVE_COPIA: 'copia-buena' });
  const [, reg] = await leer(await llamar(C,'/cuenta/registro',
    {cuerpo:{usuario:'zoe',correo:'Z@Ejemplo.com',clave:'contrasena1',estado:{partidas:4,coleccion:[1,2]}}}));
  ok((await llamar(C,'/cuenta/copia',{metodo:'GET'})).status===401, 'con la clave puesta pero sin mandarla → 401');
  ok((await llamar(C,'/cuenta/copia',{metodo:'GET',token:'copia-mala'})).status===401, 'y con una clave equivocada → 401');

  const [sc, cp] = await leer(await llamar(C,'/cuenta/copia',{metodo:'GET',token:'copia-buena'}));
  ok(sc===200 && cp.completa===true, 'con la clave buena sale la copia y se declara completa');
  ok(cp.cuentas['usuario:zoe'] && cp.cuentas['usuario:zoe'].hash && cp.cuentas['usuario:zoe'].sal,
    'lleva el hash y la sal, que sin ellos la copia no podría restaurar nada');
  ok(cp.estados['estado:zoe'] && cp.estados['estado:zoe'].partidas===4, 'y lleva el estado de cada uno');
  ok(cp.correos['correo:z@ejemplo.com']==='zoe', 'y el índice de correos, que es lo que deja entrar con el correo');
  ok(!JSON.stringify(cp).includes(reg.token) && !JSON.stringify(cp).includes('sesion:'),
    'y NO lleva ninguna sesión abierta: en el archivo no hay llaves vivas');
}

console.log(fallos ? `\n${fallos} FALLOS` : '\nTodo bien');
process.exit(fallos?1:0);
