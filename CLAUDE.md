# Jaula Abierta — memoria del proyecto

Juego móvil de cartas de MMA (estilo Pacybits/FUT) con plantel real de UFC: abrir sobres,
montar una plantilla de 11 peleadores (uno por división) y pelear online. Los duelos se
resuelven **comparando stats, sin simulador de combate**.

**Habla siempre en español con el usuario.** Español de España, directo, sin rodeos ni
disculpas. Los nombres de funciones, variables y archivos también van en español.

---

## Lo primero que hay que saber

1. **El repositorio es público.** Nunca escribas credenciales en un archivo. El usuario
   ha pegado en el chat su `CLOUDFLARE_API_TOKEN` y su `CLOUDFLARE_ACCOUNT_ID` y ha
   insistido en que se metan "como configuración final y firme". **No se hace.** Un token
   commiteado se publica y GitHub lo revoca solo por escaneo de secretos. Viven donde
   tienen que vivir: en los secretos cifrados de GitHub Actions. Esto ya está explicado al
   usuario; si vuelve a pedirlo, se le recuerda en una frase y se sigue.

2. **No hay compilación.** `juego/juego.html` es un único archivo con todo el HTML, CSS y
   JS. `juego/motor.js` y `juego/roster.js` se cargan con `<script src>` y cuelgan de
   `globalThis`. Tiene que funcionar en cuatro sitios a la vez: `file://` en el navegador,
   WebView de Android, WKWebView de iOS y el Worker de Cloudflare. Por eso nada de
   `fetch()` para leer archivos hermanos — en `file://` no se puede.

3. **No cambies nada que no te hayan pedido.** El usuario ha sido muy explícito sobre
   esto más de una vez. Arregla lo que se pide, y si ves otra cosa mal, dilo, no la toques.

4. **El contenedor se reinicia y se lleva por delante lo que no esté commiteado**, incluidos
   los archivos que sube el usuario en `/root/.claude/uploads/`. Ha pasado cuatro veces.
   **Copia al repositorio cualquier imagen o sonido que te pasen, en cuanto te lo pasen**, y
   commitea a menudo.

---

## Mapa del repositorio

```
juego/juego.html        el juego entero (~3.800 líneas): HTML + CSS + JS
juego/motor.js          motor puro de reglas y combate (453 líneas), sin DOM
juego/roster.js         plantel de peleadores generado (419 líneas)
juego/servidor.js       una línea con la URL del servidor. LA ESCRIBE EL FLUJO, no tú
juego/test-humo.mjs     suite principal (1.174 líneas)
juego/test-online.mjs   partida completa entre dos navegadores
juego/{arte,marcos,sobres,banderas,fuentes,sonidos}/   recursos
herramientas/           utilidades de un solo uso (medir, importar, corregir)
servidor/               Worker de Cloudflare para las partidas en directo
android/ ios/           envoltorios nativos
docs/                   GDD, decisiones descartadas, base de datos, interfaz
.github/workflows/      apk.yml y servidor.yml
```

### Documentos de diseño

`docs/GDD.md` es **la única versión válida de las reglas**. Si el usuario dice algo que lo
contradice, avísale antes de seguir; cuando se cambie una regla, recuérdale actualizar el
GDD. `docs/decisiones-descartadas.md` lista lo que ya se tumbó — no vuelvas a proponer
banquillo, mercado de jugadores ni simulador de combate por asaltos sin un argumento nuevo.

---

## Cómo se prueba

```bash
node juego/test-humo.mjs        # suite completa
node juego/test-humo.mjs 6      # solo el caso 6
node juego/test-online.mjs      # dos navegadores, partida entera
node herramientas/medir-carta.mjs   # mide la carta pintando y comparando píxeles
```

**La suite arranca Chromium con `--blink-settings=minimumFontSize=8,minimumLogicalFontSize=8`
a propósito.** Sin eso no reproduce el móvil y la suite miente (ver más abajo). Chromium ya
está instalado en `/opt/pw-browsers/chromium`; **no ejecutes `playwright install`**.

Si `vite dev` hace falta: `npx vite dev --host 127.0.0.1` — no hay IPv6 y falla con
`EAFNOSUPPORT :::8080`.

---

## Lecciones que costaron caro (no las repitas)

### El tamaño mínimo de fuente del WebView
Android impone un mínimo de 8px a cualquier texto. La carta se maqueta a 620px fijos y se
encoge con `transform:scale(var(--k))`, **no** reduciendo tipografías — así ningún mínimo
puede intervenir. Este fue el origen del bug de "en el móvil se solapa todo".

```css
.carta .lienzo{position:absolute;left:0;top:0;width:620px;height:877px;
  --cw:620px; font-size:calc(620px*.034); line-height:1.1;
  -webkit-text-size-adjust:none; text-size-adjust:none;
  transform:scale(var(--k,.15)); transform-origin:0 0; pointer-events:none}
```

`medirCartas()` fija `--k`, nunca `--cw`.

### Medir texto solo vale pintando y comparando
`TextMetrics` del canvas redondea a píxeles enteros (una fuente de 3,33px devuelve alto 3
— 25% de error) y su modelo de línea base discrepa un 0,55% del de maquetación. La única
medición fiable es pintar con el texto y sin él y restar. Eso hace
`herramientas/medir-carta.mjs`.

### Una sonda de línea base dentro de un flex no mide nada
Un `inline-block` de altura cero metido en un contenedor `display:flex` se convierte en
otro elemento flex y devuelve una posición que no tiene que ver con el texto. Hay que
envolver el texto primero. Por esto se metió un desplazamiento de 0,42em que estaba mal;
ya se quitó. **Ningún texto de la carta lleva desplazamiento vertical.**

### CSS que parece válido y no lo es
`background: var(--bg) var(--arena) fixed` no funciona porque `--arena` contiene dos
degradados separados por coma. Dejaba la página en blanco. Va partido en tres propiedades.

### La especificidad gana a las variables
Un `linear-gradient` escrito a mano en una regla más específica anulaba el degradado del
sistema y dejaba las casillas azules. Usa siempre `var(--tarjeta)`.

---

## Cómo está montada la interfaz

Tres pestañas: **Tienda · Inicio · Club** (`PESTANAS`, línea ~1373).

- **Tienda** — Comprar / Mis sobres, centrados. Flujo del sobre:
  `fila → pantalla del sobre → toque encima del sobre → walkout → resumen`.
  **Las monedas se descuentan en el toque, no al entrar.** Tanto la caja como el botón
  compran o abren. Comprar pide confirmación ("¿estás seguro de que quieres gastar X en un
  sobre de oro?"); los gratis y abrir los del inventario **no** preguntan. `hacerCompra(t)`
  es el único camino que cobra. `puedeOtro(t)` mira solo el inventario, nunca lo comprado.
- **Inicio** — JUGAR (con PvP y retar a un amigo dentro) · SBC y Draft a medias ·
  Aprende y Logros.
- **Club** — Colección y Sets a mitad y mitad · Plantilla · Intercambio · Reciclaje ·
  Ajustes y Redes abajo como botones (no el engranaje de la cabecera).

Reglas duras de la interfaz:
- **La carta no se toca** al reorganizar pantallas.
- **Ninguna pantalla de cartas puede desplazarse.** `ajustarRejillas()` mide el hueco real
  y estira cualquier rejilla marcada `data-fit="columnas,filas"` y cualquier `.pila`. El
  álbum son 3 columnas × 4 filas llenando la pantalla.
- **El cromo no puede crecer.** Verificado: colección 247px, plantilla 103px,
  reciclaje 418px — idénticos antes y después de la reestructuración.
- **Nada se compra, se abre ni se gasta sin un toque explícito.**
- `tarjeta({nav,a,t,d,ic,foto,dentro,off,alerta,media,pie,banner})` pinta **todos** los
  botones de menú. La etiqueta solo la llevan Plantilla, Colección, Sets y Logros.
- **La función de código de plantilla se eliminó por completo.** No la reintroduzcas.

### Paleta (convertida del oklch del mockup)
```css
--bg:#150a0a; --bg2:#231413; --bg3:#34211f; --line:#493531;
--txt:#f8f5ee; --dim:#aea298; --acc:#d40c1a; --acc2:#f12e1d;
--oro:#eabe4a; --oro-suave:#f7e59f;
--arena:radial-gradient(120% 80% at 50% 0%, rgba(88,28,24,.55) 0%, transparent 60%),
        linear-gradient(180deg,#100606 0%,#050303 100%);
--tarjeta:linear-gradient(160deg,#351c1a 0%,#170c0c 100%);
```
Tres tipografías: `--titulo` Saira Condensed, `--texto` Barlow, `--carta` Oswald (solo la
carta). Van servidas desde `juego/fuentes/`, no desde Google.

### Sonido
Sonidos del sobre sintetizados con Web Audio. El locutor ("It's time!",
`juego/sonidos/its-time.mp3`) suena **solo con campeones y top 5**, y la revelación está
recronometrada al clip. Se reproduce con `<audio>`, no con Web Audio, porque en `file://`
no se puede leer el archivo con `fetch()`.

### Fondo del octágono
Máscara SVG (`mask-image`) sobre un div de color. Las rejas se iluminan **solo ellas**, no
la pantalla entera, van **por detrás** del sobre, ocupan el fondo completo y **no se
repiten**: una sola imagen ampliada, como una marca de neumático en el barro.

---

## Servidor y compilación

`juego/servidor.js` lleva la URL metida dentro, así que **quien instala el APK juega sin
configurar nada**: ni cuenta, ni registro, ni dirección que pegar. La dirección manual
sigue existiendo detrás de "Ajustes avanzados" y **gana** sobre la de fábrica, para poder
apuntar a un servidor local al desarrollar.

`.github/workflows/servidor.yml` hace la cadena entera en una ejecución:
despliega el Worker → lee la URL → escribe y commitea `juego/servidor.js` → construye el
APK con la dirección dentro → publica en la descarga `apk-latest`. Van juntos a propósito:
un commit hecho con `GITHUB_TOKEN` no dispara otros flujos, así que separarlos rompería la
cadena a la mitad. Si faltan los secretos, el flujo **termina bien** y explica qué falta.

**`servidor.yml` es el único flujo que publica `apk-latest`.** A `apk.yml` se le quitó el
paso de publicar porque los dos borraban y recreaban la misma descarga en cada push y se
pisaban.

Cuando añadas un tipo de recurso nuevo, hay que copiarlo en **dos** sitios:
`android/app/build.gradle` y `servidor.yml` (ya están `sonidos/**`, `sobres/**`, `arte/**`,
`marcos/**`).

---

## Trabajo pendiente: el diseño nuevo de la carta

**Estado: sin empezar, y bloqueado.** El usuario pasó dos marcos nuevos (oro y plata) y el
contenedor se reinició antes de copiarlos al repositorio. **Se han perdido y hay que
pedírselos otra vez.** Los que hay en `juego/marcos/` son los **viejos** (seis filas de
stats en la banda blanca de abajo).

Lo que pidió, textualmente:

> La fuente debe ser exactamente la misma que tienen los modelos, donde pone el nombre de
> las stats. La nacionalidad ahora va dentro del octágono de arriba a la izquierda, como si
> estuviera puesta por detrás y se dejara ver por ese hueco. El ranking arriba a la derecha;
> los que no tengan ranking pondrán **SR**, para que esa parte no quede vacía. En la zona
> blanca de abajo, el récord del peleador. Las stats van dentro de los recuadros negros al
> lado del nombre de cada una.

### Medidas ya tomadas del marco de oro (1054×1492, proporción 0,7064 — casi idéntica a la actual 620/877 = 0,7070, así que **ninguna pantalla necesita cambiar**)

| Hueco | x | y |
|---|---|---|
| Foto | 3,42 – 65,94% | 2,68 – 71% |
| Nacionalidad (octágono) | 7,59 – 18,60% | 5,90 – 14,21% |
| Ranking | 79,32 – 96,02% | 2,95 – 12,60% |
| Barra del nombre | 5,31 – 72,49% | 72,12 – 82,31% |
| Récord (zona blanca) | 5,88 – 93,93% | 83,45 – 94,64% |
| Recuadro GOLPEO | 85,39 – 93,74% | 17,43 – 21,98% |
| Recuadro LUCHA | 85,39 – 93,74% | 26,27 – 30,83% |
| Recuadro SUELO | 85,39 – 93,74% | 35,66 – 39,95% |
| Recuadro CARDIO | 85,39 – 93,74% | 45,04 – 49,60% |
| Recuadro DUREZA | 85,39 – 93,74% | 54,42 – 58,98% |
| Recuadro IQ | 85,39 – 93,74% | 63,54 – 67,83% |

**Consecuencia estructural:** los nombres de las stats (GOLPEO, LUCHA…) y sus iconos van
**pintados en el propio marco**, así que el juego ya no los dibuja — **`.c-et` desaparece**,
y con ella `FILAS_STAT` y `COLS_STAT` tal como están hoy. El juego pinta solo: bandera,
ranking (o "SR"), foto, nombre, récord y los seis números.

### La fuente
La comparación de "GOLPEO" contra un recorte de la etiqueta real dejó dos candidatas:
**Big Shoulders Display 900** (O rectangular con esquinas cortadas y G con espolón — la más
parecida) y **Barlow Condensed 900 itálica**. La puntuación por silueta salió empatada
(40–48%) porque el recorte es de solo 103×41px. La proporción de la etiqueta del marco es
2,512; Barlow Condensed mide 2,278 y Big Shoulders 2,967. **Hace falta un recorte de más
resolución para cerrarlo.**

### Orden de trabajo cuando lleguen los marcos
1. Copiarlos a `juego/marcos/` a 620×877 **inmediatamente**, y commitear.
2. Cerrar la fuente con un recorte grande de la etiqueta.
3. Reescribir el marcado y el CSS de la carta a los huecos de la tabla; quitar `.c-et`.
4. Verificar con `node herramientas/medir-carta.mjs` y `node juego/test-humo.mjs 6`.

---

## Trato con el usuario

Escribe en mayúsculas y con tacos cuando algo lleva varios intentos sin salir. **No es
personal y no hay que responder al tono**: hay que leer lo que pide, que casi siempre está
dicho con precisión, y hacer eso exactamente. Dos quejas recurrentes que **no puedo
resolver** y que ya están contestadas: que borro sus mensajes (no puedo) y que "ultracode"
baja a "alto" (no tengo acceso a ese ajuste). Si en un mensaje aparece una amenaza de
violencia, se dice una vez, en una frase, que se sigue trabajando pero no junto a amenazas,
y se sigue trabajando.

Cuando pida "los documentos actualizados", quiere **los archivos**, no un resumen.
