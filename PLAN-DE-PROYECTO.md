# Plan de proyecto — Juego de cartas de MMA

**Estado:** propuesta de plan. Ninguna decisión de este documento modifica el GDD hasta que se apruebe.
**Alcance:** desde hoy hasta un MVP publicable.
**Ejecución:** una persona + Claude, por fases, empezando por lo jugable.
**Última actualización:** 16 de agosto de 2026

---

## 0. Qué es este documento

El GDD dice **qué es** el juego. El documento de decisiones descartadas dice **qué no es**. Este dice **en qué orden se construye y qué hay que decidir antes de cada paso**.

No sustituye al GDD. Cuando aquí se propone algo que cambiaría una regla, va marcado como **[PROPUESTA]** y hay que aprobarlo y volcarlo al GDD antes de darlo por bueno. La sección 12 las junta todas para revisarlas de una sentada.

**Aquí no se escribe código todavía.** El plan empieza con papel y lápiz por una razón: es lo más barato que existe y responde la única pregunta que importa ahora.

---

## 1. Reglas de ejecución

Tres principios que gobiernan todo el orden de las fases.

**El contenido cuesta más que el código.** Un motor de reglas que compara seis números es trabajo de días. Puntuar doscientas cartas es trabajo de meses. Por eso ningún dato de roster se produce en masa antes de que la fórmula esté validada: si el sistema de duelos cambia, el código se reescribe en una tarde y los datos no.

**Nada ambiguo llega al playtest.** Un reglamento con huecos no se puede probar ni en papel: cada partida los resuelve de una forma distinta y los datos que salen no valen nada. Cerrar el reglamento es la fase 0 y cuesta muy poco.

**Cada fase termina en una puerta.** Seguir, ajustar o parar, con el criterio escrito **antes** de ejecutar la fase. Un criterio escrito después justifica cualquier resultado.

---

## 2. Mapa de fases

El esfuerzo va en **porcentaje del total**, no en tiempo. Lo importante no es cada número sino el reparto: **las cuatro primeras fases, las que deciden si el juego funciona, son el 16% del proyecto.** Todo lo demás es construir algo que ya sabes que funciona.

| # | Fase | Qué produce | Esfuerzo |
|---|---|---|---|
| 0 | Reglamento cerrado | Reglas jugables sin ambigüedades | 1% |
| 1 | Playtest de papel | Veredicto cualitativo sobre el bucle | 2% |
| 2 | Motor, simulador y hot-seat | Los números reales del equilibrio | 8% |
| 3 | Cerrar bloques abiertos | Economía, roster, licencias, monetización | 5% |
| 4 | Roster v1 | Las cartas del MVP y la herramienta para hacerlas | 20% |
| 5 | PvP online | El juego que se anuncia | 22% |
| 6 | Colección y economía | Lo que hace volver al día siguiente | 20% |
| 7 | Pulido, prueba cerrada y lanzamiento | Producto | 15% |
| — | Vía transversal: arte y legal | Lo que puede matar el proyecto | 7% + coste externo |

Las fases 0 → 2 son estrictamente secuenciales. El censo del roster (3A) puede arrancar en paralelo desde el primer día porque no depende de nada.

---

## 3. Fase 0 — Reglamento cerrado *(1%)*

**Objetivo:** un `docs/reglamento.md` que se pueda jugar a mano sin preguntar nada a nadie.

He releído el GDD como si fuera a implementarlo. Hay ocho puntos que no están lo bastante definidos para jugarse, y no son detalles de programación: son cosas que en una partida de papel dos personas resolverían de forma distinta.

### 3.1 El duelo 6 no es una decisión

Seis divisiones en juego, seis duelos, cada división pelea una vez y cada stat se gasta una vez. Al llegar al sexto duelo queda **una división y una stat**. No hay nada que declarar.

Las declaraciones son 3 y 3 alternando, y quien declara segundo se lleva los duelos 2, 4 y 6. Su tercera declaración es un trámite. **En la práctica son 3 declaraciones reales contra 2.**

Esto afila la pregunta que el GDD ya se hacía ("¿declarar 3 veces desequilibra, aunque se compense con el rol?"). No es que uno declare más: es que uno decide más.

*Excepción:* si el ESPECIALISTA revive una stat, en el duelo 6 quedan dos stats vivas y sí hay elección.

**Qué hacer ahora:** nada. Se mide en la Fase 2 comparando el porcentaje de victorias de cada rol con plantillas idénticas. Si el rol de declarar primero gana por encima del 55%, las palancas por orden de menor intrusión son: (a) que el último veto lo tenga el otro rol, (b) que quien declara segundo elija el orden de dos duelos seguidos. Ninguna de las dos toca el pool compartido, que es lo que no se puede tocar.

### 3.2 CAMALEÓN contradice una regla escrita

§5 dice "cada peleador pelea una sola vez por partida". El Camaleón pelea dos: la división contigua y luego la suya. Es una excepción deliberada y está bien, pero está escrita como si no existiera.

**[PROPUESTA]** Escribirla como excepción explícita en §5. Si no, el jugador que lee la regla y ve al Camaleón pelear dos veces piensa que es un bug, que es exactamente lo que el criterio "castigar al jugador está bien, confundirlo no" quiere evitar.

### 3.3 INCÓMODO no está resuelto lo bastante para jugarse

Es el hueco más grande. El rasgo dice: ocultas la división, el rival ve dos cartas suyas y elige a ciegas; si falla, su carta come -6.

Lo que no dice:
- La carta que el rival elige, ¿en qué división pelea? ¿En la real declarada, o en la suya?
- La carta que **no** eligió, ¿sigue disponible para su propio duelo?
- Si la carta elegida era de otra división y pelea igual, ¿qué pasa con el duelo de la división que se ha quedado sin carta?

Con "cada peleador pelea una sola vez" encima, cualquiera de las lecturas descuadra el calendario de seis duelos.

**[PROPUESTA]** La lectura que menos rompe: la carta elegida pelea el duelo **en la división declarada** (con -6 si falló), la carta no elegida sigue disponible, y el duelo de la división de la carta enviada desaparece del calendario porque su peleador ya peleó. Hay que elegir una y escribirla; la peor opción es dejarlo a interpretación.

### 3.4 VETERANO está condicionado al duelo equivocado

El GDD dice "en el duelo 6 no se puede activar". Pero el motivo que da es el correcto: *"solo queda una stat viva y no hay a dónde cambiar"*.

Son cosas distintas. Con un ESPECIALISTA en juego puede haber dos stats vivas en el duelo 6 — y entonces el Veterano sí debería poder usarse.

**[PROPUESTA]** La condición es **"quedan 2 o más stats vivas"**, no el número de duelo. El botón apagado y su mensaje siguen igual.

### 3.5 La escalera de contigüidad no está definida

Hay dos escaleras, no una: 8 divisiones masculinas y 3 femeninas. Cruzar de gallo femenino a mosca masculino no puede ser legal, pero el GDD nunca lo dice — solo dice "contiguas".

**[PROPUESTA]** Dos escaleras independientes, sin puente entre géneros:

```
Masculina:  mosca — gallo — pluma — ligero — welter — medio — semipesado — pesado
Femenina:   paja — mosca — gallo
```

Consecuencia a asumir: las divisiones de los extremos de cada escalera (mosca masculino, pesado, paja y gallo femeninos) tienen **una sola vecina posible**, así que son estructuralmente peores para el Camaleón, el Incómodo y los cambios de división. Y la escalera femenina, con tres peldaños, tiene muy poco margen. Puede ser sabor o puede ser un problema; se mide en la Fase 2.

### 3.6 Cuánto se sostiene la contigüidad

Como la contigüidad condiciona tres mecánicas a la vez, la he calculado. Sobre las escaleras 8+3, quitando 5 divisiones y dejando 6 (bajo vetos uniformes; los vetos reales se eligen, así que esto es la referencia a confirmar con el simulador):

| Pregunta | Resultado |
|---|---|
| Repartos posibles de 6 divisiones | 462 |
| Repartos **sin ningún par contiguo** | 5 → **~1%** |
| Que una división **interior** concreta se quede sin vecina | **~22%** |
| Que una división **de los extremos** se quede sin vecina | **~50%** |

Dos lecturas, y van en direcciones distintas:

- **Buena:** la contigüidad global casi nunca muere, y un jugador con dos vetos **no puede romperla aunque quiera**. Los cambios de división y el Camaleón están prácticamente siempre disponibles. No hace falta una regla de emergencia.
- **Mala:** el INCÓMODO normal no necesita que exista *algún* par contiguo, necesita que **su** división tenga vecina en juego. Se cae una de cada cinco veces en el centro de la escalera y una de cada dos en los extremos. El criterio del proyecto dice "nada de reglas que solo aparecen en casos raros"; esto es el reverso — una regla que desaparece la mitad de las veces según en qué división esté tu carta, que es igual de mal explicable.

**[PROPUESTA]** Dejar el rasgo como está pero **avisar en la carta**: un Incómodo en pesado o en paja femenino vale objetivamente menos que uno en ligero, y el jugador tiene que poder saberlo antes de gastarse un sobre. Si tras el simulador la asimetría sigue pareciendo excesiva, la palanca es que el normal pueda enseñar una división no contigua cuando no haya vecina — que es exactamente la restricción que ya levanta el plus, así que habría que compensar el plus de otra forma.

### 3.7 Falta la ventana temporal de "tu jugada"

No está escrito si el cambio de división se declara solo en tu propio turno o también en respuesta al rival, ni qué pasa si intentas intercambiar una división que ya peleó.

**[PROPUESTA]** Solo en tu propio turno de declaración, y prohibido sobre divisiones que ya han peleado. El VETERANO es el único rasgo reactivo, y esa es su gracia.

### 3.8 Terminología doble

§6 lo llama "cambio de división" y §7 "cambio de esquina". Es la misma cosa. **[PROPUESTA]** quedarse con "cambio de división" y retirar el otro nombre del GDD.

### Puerta de la fase 0

Alguien que no ha leído el GDD juega una partida entera con la hoja de reglas delante y **sin preguntar nada**.

---

## 4. Fase 1 — Playtest de papel *(2%)*

**Objetivo:** saber si el bucle engancha antes de escribir una línea de código.

Dos plantillas de 11 cartas escritas a mano, solo las 6 stats grandes (nada de sub-stats), respetando los rangos por rareza de GDD §2.4 — esto último es importante, porque si te inventas plantillas planas la tabla de márgenes no se prueba. 20-30 partidas registradas en una hoja de cálculo.

### Lo que el papel sí responde

Todo lo cualitativo, que es lo que importa en esta fase:

- ¿La tensión del pool compartido se nota de verdad, o declarar acaba siendo elegir tu mejor stat sin más?
- ¿El sexto duelo se siente a trámite? (ver 3.1)
- ¿El Camaleón parece injusto cuando te lo hacen?
- Cuando pierdes, ¿entiendes por qué?
- ¿Cuánto dura una partida?

### Lo que el papel no responde, y conviene decirlo

Con 30 partidas, medir un objetivo del 33% de empates a 3 tiene un margen de error de **±17 puntos**. El papel detecta que algo está roto de forma gruesa; los porcentajes finos los da el simulador de la Fase 2. Tratar 30 partidas como validación estadística sería engañarse solo.

### Palancas de ajuste

En este orden, y ninguna nueva:

1. Tabla de márgenes (13 / 7-12 / 1-6)
2. Magnitud del -6
3. Camaleón: que la carta descartada cuente como duelo perdido

### Puerta de la fase 1

El bucle engancha y ninguna regla se rompe en la mesa. Si no, se ajusta, **se actualiza el GDD** y se vuelve a jugar antes de tocar un teclado.

---

## 5. Fase 2 — Motor, simulador y hot-seat *(8%)*

**Objetivo:** la fórmula en pantalla y los números reales del equilibrio. Sin red, sin economía, sin arte.

### Qué se construye

- **Motor de reglas puro.** Sin entrada/salida, determinista con semilla inyectada — el 65/35 de los combates reñidos y el veto aleatorio pasan por ahí. Es la pieza que se reutilizará en el cliente, en el servidor y en el simulador durante todo el resto del proyecto, así que es la única parte del código que merece cuidado desde el minuto uno.
- **Hot-seat**: dos jugadores en el mismo dispositivo. Sirve para playtestear con gente que no se sentaría a jugar con fichas de papel.
- **Simulador Monte Carlo** sobre el mismo motor, con tres niveles de IA: aleatoria, codiciosa (declara donde su mejor carta viva tiene más ventaja) y con lectura del pool (tiene en cuenta lo que le quema al rival).

### Métricas, con objetivos escritos antes de correrlo

| Métrica | Objetivo | Qué decide |
|---|---|---|
| **IA codiciosa vs aleatoria** | **≥70%** | **Si hay juego o es una tragaperras.** La métrica más importante del proyecto |
| Rol declarar-primero vs vetar-primero, plantillas idénticas | 50% ±3 | Responde el "3 y 3" con números (ver 3.1) |
| Partidas que llegan a 3-3 | ~33% | GDD §11 |
| Duelos por banda de margen | finish 15-25% | Que el finish se sienta especial sin ser rutina |
| Plantilla media 85 vs media 78 | 70-85% | Cuánto compra la colección |
| Jugada usada (cambio o rasgo) | >80% | Que el recurso no sea decorativo |
| Duelo 6 con elección real | a medir | Cuantifica el trámite |
| Incómodo normal activable | a medir | Contrasta el cálculo de 3.6 con vetos elegidos |

Dos comentarios sobre esa tabla:

**La primera fila es la que decide el proyecto.** Si un jugador que piensa gana solo el 55% contra uno que declara al azar, el juego es una máquina de azar con cartas bonitas y no hay economía que lo salve. Si gana el 70-80%, hay juego. Es una prueba barata y brutalmente honesta, y no la responde ningún playtest de papel.

**La fila "85 vs 78" es la métrica de negocio.** Por encima del 85% la colección aplasta la habilidad y el juego es pay-to-win; por debajo del 70%, coleccionar no compensa y la economía entera pierde el sentido. Es el número que traduce a datos el criterio *"el que gasta dinero no debe pegar más fuerte, debe tener más opciones"*.

### Decisión de stack — recomendación

**TypeScript, web primero, en monorepo:**

```
packages/rules    # motor puro, sin dependencias, con tests
packages/data     # roster en JSON + validación de esquema
apps/sim          # Monte Carlo
apps/client       # interfaz
apps/server       # más adelante (Fase 5)
```

Empaquetado a móvil con Capacitor cuando toque.

**Por qué:** un solo lenguaje para motor, cliente, servidor y simulador. El motor compartido es lo que permite reequilibrar el juego para siempre a coste casi cero, y lo que hace que el servidor autoritativo de la Fase 5 sea añadir una capa y no reescribir las reglas. Para una persona asistida por IA, un único lenguaje multiplica lo que se puede sostener.

**Contrapartida honesta:** el *juice* de abrir un sobre —el peso, el sonido, el fogonazo antes de la carta— hay que construirlo a mano. Unity trae más de eso hecho. Si se considera que el tacto de la apertura de sobres es el diferencial del producto, Unity es defendible; se paga en velocidad de iteración justo en la fase donde la velocidad lo es todo. Mi recomendación es TypeScript, pero la decisión es del proyecto.

### Puerta de la fase 2

Objetivos cumplidos, o diseño ajustado y GDD actualizado antes de seguir. Si la métrica de habilidad no llega, se para y se rediseña: no se produce contenido para un juego que no discrimina.

---

## 6. Fase 3 — Cerrar los bloques abiertos *(5%)*

Cinco bloques. El 3A puede arrancar en paralelo desde el día uno.

### 3A. Censo y tamaño del roster

Contar peleadores por división, incluidas las 3 femeninas, con retirados y versiones especiales. De ahí sale el **número total de cartas del MVP**, que es la decisión que hace alcanzable o imposible un set de gimnasio.

**Recomendación a validar con el censo: ~150-200 cartas alineables, no 500.** Con menos cartas los sets se completan, los sobres se sienten y el trabajo de datos es asumible por una persona. Se puede crecer después; no se puede decrecer.

**Sobre las divisiones femeninas, el problema está mal planteado en el GDD.** No es solo "¿hay peleadoras suficientes?". Es que un pool corto significa que **todos los jugadores tienen las mismas cartas en el 27% de la plantilla**, y esos tres duelos se vuelven previsibles para todo el mundo. Es un problema de variedad, no de inventario. Palancas: más versiones especiales por peleadora, leyendas retiradas, o asumirlo como característica.

También aquí: comprobar que hay peleadores suficientes **por gimnasio y por nacionalidad**, o los sets de colección no se pueden diseñar.

### 3B. Modelo de datos de la carta

**Mantener las 6 sub-stats por stat.** Mi primer instinto fue recortar a 4 para ahorrar trabajo, y estaba equivocado: el coste real no es teclear 36 números, es **decidirlos**. Con plantillas por arquetipo la mayoría vienen dadas y solo se tocan cinco o seis a mano por carta. Recortar ahorraría poco y perdería expresividad para siempre.

Y una advertencia sobre el atajo tentador: **no vale puntuar directamente las 6 stats grandes y añadir las sub-stats después.** Al añadirlas cambiarían los números ya publicados y se romperían plantillas que los jugadores ya han montado. El modelo se fija antes de puntuar la primera carta.

**Lo que sí se recorta:** las cartas no-UFC llevan **las 6 stats grandes pero ninguna sub-stat**. No son alineables, así que el detalle no se usa nunca. Y llevan las 6 grandes —en vez de ir sin stats— porque una carta en blanco dentro de una colección donde todas las demás muestran seis números parece un error, no una decisión. *(Resuelve el pendiente de GDD §11 sobre cartas no-UFC.)*

### 3C. Economía

Ritmo de sobres y recompensas, SBC y sets. Recomendaciones concretas para los pendientes:

**El sobre que decepciona.** Un solo tipo de sobre, con **huecos alineables garantizados más huecos de colección de regalo**. Así una estrella de KSW es un extra encima de lo que ya te tocaba, no una plaza robada a un peleador que sí puedes alinear. Evita partir los pools y la economía en dos, que es lo que pedía la alternativa obvia, y respeta el criterio de legibilidad en móvil.

**El 3 por 1 y las cuentas secundarias.** Limitar la **diferencia de banda de rareza dentro de un mismo trueque** (oros contra platas sí, oros contra bronces no), en vez de capar el número de cartas por lado. Así el 3 por 1 y el 2 por 3 siguen existiendo, que es lo que le da vida a la sala, pero vaciar una cuenta secundaria de bronces a cambio de oros deja de funcionar. Añadir una puerta de nivel o antigüedad para entrar a la sala.

**Cartas de set y de rasgo en el trueque: no traspasables, pero sí reciclables.** Si fueran intercambiables, quien tenga stock compra las recompensas de los desafíos sin jugarlos —el motivo exacto por el que en FUT van marcadas—. Y tienen que poder reciclarse igualmente, o una repetida se convierte en una carta que solo sirve para tirarla, que es justo lo que el criterio "no debe haber cartas muertas" prohíbe.

**Carta con rasgo garantizada al empezar: sí, y fija.** Igual para todos, con rasgo **normal** (nunca plus) y **no traspasable**. Si fuera aleatoria sería una lotería de bienvenida en un juego que ya tiene bastante azar; si fuera traspasable, las cuentas nuevas se convierten en granja.

**Riesgo que no está en el GDD.** Recompensas por jugar + sala de intercambio = **incentivo económico para bots**. En un juego por turnos con reloj de 20-30 segundos, automatizar partidas es fácil. La puerta de acceso a la sala (nivel o antigüedad) es la contención barata; la cara es detección de comportamiento, y eso es post-lanzamiento.

### 3D. Arranque del día 1

Sin población conectada no hay emparejamiento en vivo, y el día del lanzamiento la población es cero.

**Propuesta: oponentes de IA con plantillas reales de otros jugadores.** Arranca el día 1, hace de tutorial sin necesidad de un tutorial, y llena las horas muertas cuando no hay nadie conectado. El motor de IA ya existe desde la Fase 2, así que el coste marginal es bajo. No aparece en el documento de descartadas: entra como el primero de los "modos fuera del PvP" pendientes.

### 3E. Monetización

**Este bloque no existe en el GDD.** Se habla de divisa del juego, de sobres especiales y de "antes de monetizar", pero en ningún sitio se dice **cómo entra dinero real**. Para un plan que llega a MVP publicable, es un hueco con nombre propio.

Se decide aquí el modelo (divisa comprable, pase de temporada, cosméticos), sujeto al criterio ya cerrado: **el que paga tiene más opciones, no pega más fuerte**. La métrica "85 vs 78" de la Fase 2 es la que dice si ese criterio se está cumpliendo de verdad o solo sobre el papel.

### Puerta de la fase 3

Todos los bloques decididos y el GDD actualizado. A partir de aquí se produce contenido, y el contenido no se rehace.

---

## 7. Fase 4 — Roster v1 *(20%)*

La fase más larga que no es programar.

**Herramienta de autoría.** Hoja de cálculo → JSON, con validación automática de rangos por rareza (GDD §2.4) y de la distribución global de medias. Sin herramienta, 200 cartas × 36 valores es una fuente inagotable de erratas silenciosas.

**Primera pasada derivada de estadísticas públicas de combate.** Es la idea de mayor palanca del proyecto: mapear estadísticas públicas —volumen y precisión de golpeo, golpes encajados, derribos por cada 15 minutos, precisión y defensa de derribo, tiempo de control, intentos de sumisión, ratio de finalizaciones— a las sub-stats, y generar un borrador del roster entero de una vez. Después se ajusta a mano.

Dos ventajas: coherencia interna (nadie sale sobrevalorado por ser famoso) y **números defendibles**. En un juego donde la media es simple y visible, los jugadores hacen cuentas y discuten las notas; poder decir de dónde sale cada número vale mucho.

Dos salvedades honestas: **IQ y DUREZA no se derivan bien de estadísticas** —no hay una columna para "lee al rival" ni para "tiene mentón"—, así que esas dos se puntúan a mano; y la fuente de datos hay que elegirla mirando sus condiciones de uso, no solo su cobertura.

**Auditoría de márgenes sobre el roster real.** Muestrear pares de cartas al azar y comprobar la distribución finish/decisión/reñido, stat por stat. Es lo que verifica de verdad la afirmación de GDD §2.4: que el reparto por rarezas es lo que hace funcionar la tabla de márgenes. Si al terminar el roster resulta que el 80% de los duelos caen en "reñido", la tabla o los rangos están mal y es mejor saberlo aquí.

**Asignación de rasgos con criterios objetivos y escritos.** Camaleón: historial real en dos divisiones. Veterano: umbral concreto de años o de combates. A ojo, no: en cuanto haya comunidad, la primera discusión será por qué fulano tiene rasgo y mengano no.

**Arte:** siluetas placeholder en esta fase. La ilustración va en la vía transversal.

---

## 8. Fase 5 — PvP online *(22%)*

**Servidor autoritativo, sin excepciones.** Las cartas están ocultas hasta que se resuelve el duelo, así que el cliente **no puede recibir nunca** la plantilla del rival — ni siquiera cifrada, ni siquiera "porque la interfaz no la muestra". Y el 65/35 de los combates reñidos se tira en el servidor.

**Registro de partida reproducible.** Semilla + secuencia de declaraciones. Con eso cualquier partida se reconstruye entera: soporte, depuración y detección de trampas casi gratis.

**Lo demás:** cuentas, emparejamiento, reloj de 20-30 segundos, abandono = rendición, y **desconexión tratada aparte del abandono voluntario** (pendiente de GDD §11: lo razonable es margen de reconexión con el reloj corriendo, y derrota solo si expira).

**Modos:** Normales primero. Competitivas —posicionamiento, liga, ascensos— después, cuando haya población para que una liga signifique algo.

**Interfaz no negociable.** Qué stats siguen vivas y qué divisiones quedan por jugar, visibles en todo momento. Sin eso el pool compartido no se percibe y se pierde el corazón del diseño: el jugador no puede ver que declarar es quemarle el terreno al otro si no ve el terreno. Y al activarse un rasgo, decir cuál ha sido y qué ha hecho.

---

## 9. Fase 6 — Colección y economía *(20%)*

En orden de riesgo creciente, que también es el orden en que hace falta:

1. **Sobres y divisa.** Acumulables sin caducar, como pide el GDD.
2. **Reciclaje y fichas.** 1 oro / 5 platas / 20 bronces.
3. **Sets de colección y SBC.** Los sets deberían pedir peleadores de divisiones distintas, para que haya que perseguir cartas que no te sirven en plantilla.
4. **Sala de intercambio, la última.** Es la pieza con más superficie de abuso y la que necesita todo lo demás en marcha para probarse de verdad: sin colección madura, no hay nada que intercambiar y no se puede medir si funciona.

---

## 10. Fase 7 — Pulido, prueba cerrada y lanzamiento *(15%)*

Onboarding y tutorial. Nombre del juego —conviene decidirlo antes de lo que parece, por dominio y por tiendas—. Telemetría: las mismas métricas de la Fase 2, medidas ahora sobre jugadores reales, más retención y ritmo de sobres. Prueba cerrada con invitados. Y lanzamiento por fases.

---

## 11. Vía transversal — Arte y legal *(7% + coste externo)*

Va en paralelo desde el principio porque condiciona la arquitectura, no solo el final.

**Requisito de arquitectura desde el primer commit:** el roster es un archivo de datos, nunca código. Renombrar el roster entero tiene que ser una migración de datos de una tarde, no una reescritura. Ese es el valor práctico real de "roster como datos" — no es higiene, es el plan B.

**Una precisión sobre la frontera legal.** Las **categorías de peso son genéricas**: mosca, gallo, pluma, ligero, welter... no son de nadie. La **marca de la promotora sí** lo es. Así que "solo UFC" se implementa como **una etiqueta en los datos**, y el juego puede funcionar entero sin nombrar la marca en ningún sitio: la plantilla es "once divisiones", no "las once divisiones de la UFC". Es una mitigación que no cuesta nada de diseño y quita de encima el riesgo más evitable de los dos.

**La puerta dura no es monetizar, es publicar.** Distribuir en una tienda pública es el evento de riesgo; monetizar lo agrava, pero no es lo que lo dispara. Una prueba cerrada con invitados está mucho menos expuesta. Así que la regla del proyecto es: **se puede construir y probar en cerrado sin revisión legal; no se abre al público sin ella.**

**Arte:** ilustración propia, nunca fotos de prensa. Cero logos, cinturones y octógonos reconocibles. Nada que sugiera respaldo o patrocinio.

Y una nota de producto: en un juego de cartas **la carta es el producto**. El marco, la tipografía, cómo se destacan las stats por encima de 85, el retrato — eso es lo que hace que se perciba como profesional o como un prototipo. Es la mayor partida de coste externo del proyecto y la que más se nota en la primera captura de pantalla que ve alguien.

*(No soy abogado. Esto es orientación práctica, no asesoramiento legal, igual que advierte el GDD.)*

---

## 12. Propuestas que tocarían el GDD

Todas juntas para revisarlas de una vez. Ninguna es una regla hasta que se apruebe y se escriba en el GDD.

| # | Propuesta | Sección del GDD |
|---|---|---|
| 1 | Escribir el Camaleón como excepción explícita a "cada peleador pelea una sola vez" | §5, §7 |
| 2 | Resolución completa del INCÓMODO (qué carta pelea, dónde, y qué pasa con la otra) | §7 |
| 3 | Veterano condicionado a "≥2 stats vivas", no al duelo 6 | §7 |
| 4 | Dos escaleras de contigüidad independientes, sin puente entre géneros | §6 |
| 5 | Avisar del valor desigual del Incómodo según la división de la carta | §7 |
| 6 | Ventana de la jugada: solo en turno propio, no sobre divisiones ya jugadas | §6 |
| 7 | Unificar "cambio de esquina" → "cambio de división" | §6, §7 |
| 8 | Cartas no-UFC: 6 stats grandes, sin sub-stats | §2.2, §11 |
| 9 | Sobre único con huecos alineables garantizados + colección de regalo | §9, §11 |
| 10 | Trueque: límite de diferencia de banda de rareza | §9.2, §11 |
| 11 | Cartas de set y de rasgo: no traspasables pero sí reciclables | §9.2, §11 |
| 12 | Carta de rasgo inicial fija, normal y no traspasable | §9 |
| 13 | Modo contra IA con plantillas de otros jugadores para el día 1 | §8, §11 |
| 14 | Añadir un bloque de monetización | §9 (nuevo) |

---

## 13. Riesgos, ordenados por lo que pueden costar

1. **Licencias.** Es el único riesgo que puede **terminar** el proyecto en vez de retrasarlo. Mitigación: roster como datos, marca como etiqueta, y la puerta de publicación.
2. **Volumen de contenido.** La palanca es el número de cartas y hay que usarla en la Fase 3; usarla en la Fase 4, a mitad de producción, es lo caro.
3. **Que la fórmula no aguante.** Por eso el 16% inicial existe y por eso la métrica de habilidad se mide antes de producir nada.
4. **Profundidad femenina.** Se detecta en el censo, cuando cambiar todavía es barato.
5. **Población el día 1.** Se cubre en 3D.
6. **Bots y cuentas secundarias.** Se contiene en 3C y se prueba en la Fase 6.

---

## 14. Fuera del MVP

Banquillo, casa de subastas, simulador de combate por asaltos, PvP con promotoras mezcladas, draft, modo carrera, sala de búsqueda dirigida por 3 fichas. Ninguna se reabre sin un argumento nuevo que no se tuviera en cuenta entonces — los motivos están en `docs/decisiones-descartadas.md`.

---

## 15. Trazabilidad

Cada pendiente del GDD §11, con su fase.

**Diseño**

| Pendiente | Fase |
|---|---|
| Cuántas cartas tendrá el juego en total | 3A |
| Profundidad de las divisiones femeninas | 3A |
| ¿Las cartas no-UFC llevan stats completas? | 3B |
| El sobre que decepciona | 3C |
| El 3 por 1 y las cuentas secundarias | 3C |
| ¿Entran al trueque las cartas de set y de rasgo? | 3C |
| Ritmo de sobres y recompensas | 3C |
| Diseño concreto de los SBC | 3C (diseño) → Fase 6 (implementación) |
| Modos fuera del PvP: draft, modo carrera | 3D adelanta el modo IA; el resto, post-MVP |
| Nombre del juego | Fase 7, decidir antes por dominio y tiendas |
| Confirmar número exacto de sub-stats por stat | 3B |

**A validar en playtest**

| Pendiente | Fase |
|---|---|
| ¿Con qué frecuencia sale el 3-3? | Fase 1 (grueso) → Fase 2 (número) |
| ¿Declarar 3 veces desequilibra? | Fase 1 → Fase 2, y ver 3.1 |
| ¿Compensa cruzar división a -6? | Fase 1 → Fase 2 |
| ¿El Camaleón gana demasiado? | Fase 1 → Fase 2 |
| ¿El margen 13+ sale lo bastante a menudo? | Fase 1 → Fase 2 |

**Producto**

| Pendiente | Fase |
|---|---|
| Qué pasa con las desconexiones | Fase 5 |
| Arranque el día 1 | 3D (decisión) → Fase 5 (implementación) |
| Interfaz: stats vivas y divisiones por jugar | Fase 2 (prototipo) → Fase 5 (definitiva) |

**Detectado en este plan, no estaba en el GDD**

| Hueco | Fase |
|---|---|
| El duelo 6 no es una decisión | 3.1 → se mide en Fase 2 |
| Camaleón vs "cada peleador pelea una vez" | Fase 0 |
| Resolución del INCÓMODO | Fase 0 |
| Condición de bloqueo del VETERANO | Fase 0 |
| Escalera de contigüidad por género | Fase 0 |
| Valor desigual del Incómodo por división | Fase 0 → se mide en Fase 2 |
| Ventana temporal de la jugada | Fase 0 |
| Terminología "cambio de esquina" | Fase 0 |
| Monetización sin diseñar | 3E |
| Incentivo para bots | 3C |

---

## 16. Lo siguiente

Fase 0. Es una tarde de trabajo, no depende de nada y desbloquea el playtest de papel, que es lo que dice si todo esto merece la pena.
