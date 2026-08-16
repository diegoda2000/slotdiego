# Jaula Abierta — prototipo jugable

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

**En el ordenador:** abre `juego.html` con el navegador. Nada que instalar, no necesita
conexión y no hay servidor.

La partida se guarda sola en el propio dispositivo.

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

**Los sobres.** Tres sobres gratis **permanentes**, al estilo Pacybits/MadFUT. El **básico es
ilimitado**, sin reloj, y por eso su drop es malísimo —2% de carta buena— : es la red de
seguridad para que nadie se quede sin poder alinear, no una vía de progreso. Los otros dos van
por reloj: plata cada 20 min, oro cada 2 h. Reclamarlos **no los abre**: se guardan, porque
acumular veinte y reventarlos de golpe es justamente el momento que engancha.

> Consecuencia a vigilar: con el básico ilimitado, la chatarra para reciclar es infinita, y las
> fichas salen de reciclar. Eso devalúa la entrada a la sala de intercambio. Si la sala llega a
> importar, la contención sería que las cartas de sobre básico no den fichas.

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

## Qué no está

**PvP en vivo.** Es la ausencia importante y conviene ser claro sobre por qué: las cartas están
ocultas hasta que se resuelve el duelo, así que la plantilla del rival no puede vivir en tu
móvil. Hacen falta un servidor autoritativo y cuentas, y eso es la Fase 5 del plan —el 22% del
proyecto—. Lo de los amigos por código da partidas contra plantillas reales hoy, pero las
decisiones del rival las toma la IA y el marcador va por confianza.

Tampoco hay ligas ni competitivas, telemetría, arte, sonido ni monetización. La sala de
intercambio empareja con un jugador simulado.

---

## Decisiones que el GDD no cerraba

El GDD tiene huecos que no se pueden dejar abiertos si el juego va a ejecutarse: el código
obliga a elegir. Estas son las elecciones, y están recogidas también en
[`../PLAN-DE-PROYECTO.md`](../PLAN-DE-PROYECTO.md) como propuestas a aprobar.

| Hueco | Qué hace el prototipo |
|---|---|
| Empate a 0 de margen | Moneda al aire. El GDD no lo contempla |
| Contigüidad entre divisiones | Dos escaleras independientes, sin puente entre géneros |
| Resolución del Incómodo | La carta enviada pelea en la división declarada; si fallas come la penalización y las dos cartas intercambian slot, así cada peleador pelea una sola vez |
| Bloqueo del Veterano | Se apaga cuando quedan menos de 2 stats vivas, no "en el duelo 6": con un Especialista puede haber dos stats vivas en el sexto |
| El Camaleón pelea dos veces | Excepción explícita a "cada peleador pelea una sola vez" |
| Cartas no alineables | Llevan las 6 stats grandes, sin sub-stats |
| Carta de rasgo inicial | Fija, la más floja con rasgo normal, y no traspasable |

---

## La prueba de humo

```
npm i playwright
node test-humo.mjs 25
```

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
