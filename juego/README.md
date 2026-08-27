# P4P.CG — prototipo jugable

Prototipo del juego de cartas de MMA descrito en [`../docs/GDD.md`](../docs/GDD.md).
Sirve para responder la única pregunta que importa ahora: **¿la fórmula funciona?**

**Todos los peleadores son inventados.** Nombres, apodos, gimnasios y nacionalidades se
generan por código. No hay ni una persona real, ni una marca de promotora, ni una foto.
Eso no es un atajo: es la Fase 0 del plan de proyecto hecha bien, porque permite probar el
diseño entero sin tocar el problema de licencias.

---

## Cómo jugar

**En el móvil (Android):** instala el APK. Está en la pestaña *Releases* del repositorio,
publicación `apk-latest`. Hay que permitir "instalar de orígenes desconocidos" porque no
viene de la tienda.

**En el ordenador:** abre `juego.html` con el navegador. Nada que instalar ni que compilar.

La partida se guarda sola en el propio dispositivo. Todo funciona **sin conexión** salvo las
partidas en vivo por sala, que necesitan el servidor de `../servidor/`.

---

## Qué está implementado

**La carta.** Roster de ~215 cartas generado con semilla fija, así que el catálogo es
siempre el mismo. Cada carta alineable lleva las 36 sub-stats del GDD §2.2 y las 6 stats
grandes salen de su media; la media general es media simple de las 6. Las cartas de
colección de otras promotoras llevan solo las 6 grandes. Rangos por rareza respetados,
5 leyendas en todo el juego, y peleadores con versión en dos divisiones que comparten
identidad: no puedes alinear las dos a la vez.

**La partida.** Elección de rol con dado si coincidís, 2 vetos alternos visibles por cabeza,
veto aleatorio final que marca la división de desempate, 6 divisiones en juego,
declaraciones 3 y 3 con pool de stats compartido, cartas ocultas hasta resolver, tabla de
márgenes con el 65/35 en los reñidos, victoria a 4 y desempate con stat al azar.

**Los recursos.** Una jugada por partida, compartida entre el cambio de división —con sus
penalizaciones selectivas al subir y al bajar— y los cuatro rasgos con sus versiones plus.

**Los sobres.** Todos reparten **9 cartas**, 7 alineables garantizadas y 2 de colección de
regalo: lo que distingue a un sobre de otro es la **calidad**, no la cantidad.

Tres sobres gratis **permanentes**, al estilo Pacybits/MadFUT. El **básico es ilimitado y se
abre en el sitio**, de uno en uno, sin guardarlo: da sobre todo **platas y oros bajos**, con
algún bronce de vez en cuando, y **oro alto o mejor solo el 0,8%**. Es el suelo del que nadie
baja, no una vía para llegar arriba. Los otros dos van por reloj —plata cada 20 min, oro cada
2 h—, se reclaman, se acumulan y se pueden abrir en tanda.

El sorteo no va por rareza sino por **bandas de calidad**, que parten el oro por su media
(bajo 75-80, medio 81-84, alto 85-88). Sin eso no se puede dar oros a menudo sin dar oros
buenos, que es justo lo que distingue un sobre gratis de uno de pago. Cada sobre enseña en la
tienda su porcentaje de "oro alto o mejor", que es el dato que de verdad importa.

Reclamar los de reloj **no los abre**: se guardan, porque acumular veinte y reventarlos de
golpe es justamente el momento que engancha. Para el ilimitado ese paso sobraba —guardar algo
que puedes conseguir otra vez en dos segundos es fricción sin premio—, así que se abre directo.

Como el básico es gratis e infinito, **ningún premio del juego da sobres básicos**: ni ganar
una partida ni superar un reto. Dan sobres de plata.

> Consecuencia a vigilar, y no es pequeña: **9 cartas por toque, sin límite ni espera, es un
> grifo abierto**. En un minuto se sacan cientos de cartas, cualquiera tiene enseguida la mejor
> plantilla posible de oros bajos, y la chatarra para reciclar —y por tanto las fichas— es
> infinita. Está así porque se pidió así. Si molesta, las palancas por orden de menor intrusión
> son: menos cartas en el básico, una espera corta, o que sus cartas no den fichas al reciclar.
> Y conviene medir el suelo de ~78 con la métrica "85 contra 78" del plan: si una plantilla de
> 85 gana más del 85%, la colección aplasta.

La apertura es una pantalla propia con **botón de atrás y de saltar**, revelado carta a carta
tocando en cualquier sitio, aviso destacado cuando sale una élite o una leyenda, y un resumen
final con todo lo que ha tocado y cuántas eran nuevas. Se puede salir a media apertura sin
perder nada: las cartas entran en la colección antes de revelarse.

**El resto de la economía.** Divisa, sobres de pago, reciclaje con las tres ratios, fichas,
sets de colección por gimnasio, promotora y nacionalidad, retos que consumen cartas, y sala
de intercambio de trueque puro.

**Amigos por código.** Tu plantilla se convierte en un código de texto que mandas por donde
quieras. Quien lo pega te añade y puede pelear contra tu plantilla **real** cuando quiera; el
resultado vuelve como otro código que se pega para que el marcador entre vosotros cuadre. Sin
servidor, sin cuentas, sin permisos y sin conexión.

Los códigos llevan suma de verificación, y una plantilla que llegue de fuera se valida entera
—11 divisiones, todas alineables, sin peleador repetido— antes de aceptarse. Un pegado a
medias se rechaza explicando qué pasa, en vez de reventar a mitad de partida.

**Partidas en directo, sin configurar nada.** El APK trae la dirección del servidor dentro, así
que quien lo instala abre y juega: ni cuentas, ni registros, ni ajustes. La dirección la escribe
sola la publicación del servidor. Uno crea sala, sale un código de 6 letras, el otro lo mete y juegan
**a la vez**: cada uno elige sus vetos, sus declaraciones y su jugada, en su propio móvil y en
ese mismo momento. **La IA no participa en nada** — ni siquiera el Veterano, que es reactivo y
se le pregunta al defensor en vez de saltar solo. Es un modo aparte de "retar plantillas", que
es lo asíncrono. Está en `../servidor/` y se despliega gratis en
Cloudflare; la dirección se pega en el juego, así que **el mismo APK sirve para cualquier
servidor** sin recompilar nada.

Que exista un servidor no es capricho: las cartas están ocultas hasta que se resuelve el duelo,
así que la plantilla del rival no puede vivir en tu móvil. El servidor manda a cada cliente
**solo las cartas ya reveladas**, valida todas las jugadas y voltea los lados para que cada uno
se vea como el jugador local. Está comprobado con dos navegadores jugando de verdad: ni una
carta del rival sin resolver llega al otro lado.

El motor de reglas es el mismo archivo (`motor.js`) en el juego y en el servidor, para que no
puedan divergir.

## Qué no está

**Cuentas y clasificación.** La identidad es un identificador del dispositivo: vale para jugar
con amigos, no para una liga competitiva. Tampoco hay cola de emparejamiento aleatorio —solo
salas por código—, ni ligas, telemetría, arte, sonido o monetización. La sala de intercambio
empareja con un jugador simulado.

Publicar el servidor es cosa de quien aloja el juego, una sola vez:
[`../servidor/COMO-ACTIVARLO.md`](../servidor/COMO-ACTIVARLO.md). Quien juega no tiene que
leerlo ni saber que existe.

---

## Decisiones que el GDD no cerraba

El GDD tiene huecos que no se pueden dejar abiertos si el juego va a ejecutarse: el código
obliga a elegir. Estas son las elecciones, y están recogidas también en
[`../PLAN-DE-PROYECTO.md`](../PLAN-DE-PROYECTO.md) como propuestas a aprobar.

| Hueco | Qué hace el prototipo |
|---|---|
| Empate a 0 de margen | Moneda al aire. El GDD no lo contempla |
| Contigüidad entre divisiones | Dos escaleras independientes, sin puente entre géneros |
| Resolución del Incómodo | La carta enviada pelea en la división declarada; si fallas come la penalización y la carta de la división real se descarta sin pelear. La enviada sigue en su hueco y pelea también el suyo — misma excepción que el Camaleón. Sin intercambio de huecos: con el plus podía mandar un mosca a pelear en pesado, y castigaba dos veces el mismo fallo |
| Bloqueo del Veterano | Se apaga cuando quedan menos de 2 stats vivas, no "en el duelo 6": con un Especialista puede haber dos stats vivas en el sexto |
| El Camaleón pelea dos veces | Excepción explícita a "cada peleador pelea una sola vez" |
| Cartas no alineables | Llevan las 6 stats grandes, sin sub-stats |
| Carta de rasgo inicial | Fija, la más floja con rasgo normal, y no traspasable |
| Reparto de rasgos | Se garantiza un mínimo de cada uno: con la lotería por rareza a secas, el roster se quedó sin ni un Veterano en 215 cartas |

---

## La prueba de humo

```
npm i playwright
node test-humo.mjs 25          # modo local: roster, sobres, amigos y partidas
node test-online.mjs           # en vivo: dos navegadores contra el servidor
```

La segunda necesita el servidor levantado (`cd servidor && npx wrangler dev --port 8787 --local`).

Abre el juego en Chromium, comprueba las invariantes del roster —que cada stat sea la media
de sus sub-stats, que las medias caigan en su banda de rareza, que ninguna carta lleve dos
rasgos iguales— y **juega partidas completas pulsando botones de verdad**, fallando si salta
cualquier error de JavaScript.

De paso imprime las métricas que el plan de proyecto pide para la Fase 2: porcentaje de
partidas que llegan a 3-3, reparto de finishes/decisiones/reñidos, uso de la jugada, y
cuántas veces el sexto duelo ofrece una elección real.

Esa última métrica es la interesante: **sale 0%**. Con 6 divisiones, 6 duelos y 6 stats que
se gastan una vez, al llegar al sexto queda una división y una stat, así que no hay nada que
declarar. Confirma con datos lo que el plan señalaba: las declaraciones son 3 reales contra 2.

> Ojo con lo que estas cifras significan. La IA es rudimentaria y el guion declara casi al
> azar, así que miden que el sistema **funciona**, no que esté **equilibrado**. Los números
> de verdad los tiene que dar el simulador Monte Carlo con IA decente de la Fase 2.
