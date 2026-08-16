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

**La economía.** Sobres que no caducan, divisa, reciclaje con las tres ratios, fichas, sets
de colección por gimnasio, promotora y nacionalidad, retos que consumen cartas, y sala de
intercambio de trueque puro.

## Qué no está

PvP online de verdad: el rival es una IA sencilla que declara donde tiene ventaja. Tampoco
hay ligas, telemetría, arte, sonido ni monetización. La sala de intercambio empareja con un
jugador simulado.

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
