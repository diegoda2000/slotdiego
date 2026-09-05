/* Prueba la clase Cuentas del Worker fuera de Cloudflare, con un almacén de mentira que
   se comporta como ctx.storage: get(clave) y put(objeto o clave,valor). */
import { Cuentas, VUELTAS } from './src/index.js';

const almacen = new Map();
const ctx = { storage: {
  async get(k){ return almacen.has(k) ? structuredClone(almacen.get(k)) : undefined },
  async put(a,b){ if(typeof a==='object'){ for(const [k,v] of Object.entries(a)) almacen.set(k,v); }
                  else almacen.set(a,b); },
}};
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

// 10. un estado gordo de verdad: 5.000 cartas
const gordo = {partidas:1, coleccion:Array.from({length:5000},(_,i)=>({iid:'i'+i,cid:'ilia-topuria-m3'}))};
[s] = await leer(await pide('/cuenta/subir',{cuerpo:{estado:gordo}, token:tokenD}));
ok(s===200, 'sube un estado de 5.000 cartas ('+(JSON.stringify(gordo).length/1024).toFixed(0)+' KB)');

/* 11. EL TECHO DE CLOUDFLARE. Workers rechaza PBKDF2 por encima de 100.000 vueltas, y
   `wrangler dev` NO lo comprueba: con 150.000 esto pasaba en local y el worker desplegado
   devolvía 500 al registrarse. Lo que el entorno de pruebas no reproduce, se sujeta aquí. */
ok(VUELTAS <= 100000, `las vueltas de PBKDF2 caben en el techo de Cloudflare (${VUELTAS} de 100.000)`);
ok(VUELTAS >= 50000, `y siguen siendo bastantes como para que probar a lo bruto duela (${VUELTAS})`);

console.log(fallos ? `\n${fallos} FALLOS` : '\nTodo bien');
process.exit(fallos?1:0);
