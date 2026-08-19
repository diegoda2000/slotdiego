# Decisiones descartadas y criterios de diseño

Documento complementario al GDD. El GDD dice **qué es** el juego; este dice **qué no es** y por qué, para no repetir debates ya cerrados.

Si una idea aparece aquí, ya se discutió y se descartó. Volver a proponerla solo tiene sentido si hay un argumento nuevo que no se tuvo en cuenta entonces.

> **Revisión 2.** Se añaden las secciones **8** (lo que se descartó al construir el prototipo) y tres
> criterios nuevos en la 7. El resto no cambia.

---

## 1. Estructura del juego

**La plantilla como cartelera de evento (ser promotor).**
Descartada. Mezclaba dos fantasías distintas —promotor y coleccionista— y ensuciaba el concepto. La plantilla es literal: un peleador por división.

**Simulador de combate por asaltos**, con barra de momentum, daño acumulado y decisiones de esquina entre rondas.
Descartado. Los duelos se resuelven **comparando stats**. Además de ser lo que hace Pacybits, ahorra medio proyecto: no hay motor de combate que construir ni equilibrar.

**Banquillo además de los 11 titulares.**
Descartado. Se defendía como motor de colección, pero con los sets de colección cumpliendo esa función, el banquillo solo añadía gestión aburrida.

**Convocatoria de 7 peleadores de entre los 11.**
Descartada. La fase de vetos ya decide qué divisiones se juegan, así que sobraba.

---

## 2. Divisiones

**Una división 12 de "peleadores fuera de la UFC"**, mezclando Cage Warriors, KSW, Rizin, etc.
Descartada por dos motivos: los peleadores cambian de promotora constantemente y habría que mover cartas de división a mitad de temporada, rompiendo plantillas ajenas; y un solo slot para todos no resuelve nada. El problema de fondo se resolvió de otra forma: **el PvP es solo UFC y las demás promotoras viven en la capa de colección**.

**Mezclar promotoras dentro de la plantilla de PvP.**
Descartado de momento. KSW, Rizin y ONE usan categorías de peso distintas, y encajarlas en las 11 divisiones de UFC ensucia el sistema de cruces y penalizaciones. Las cartas de otras promotoras existen igual: entran en sets, se reciclan y se intercambian. Marcado como provisional — abrir el PvP a otras promotoras es una vía de crecimiento futuro.

**Peso átomo femenino como división 12.**
Descartado. Se quedan **11 divisiones**: 8 masculinas y 3 femeninas.

**Cuotas fijas de divisiones femeninas obligatorias** (tipo "3 masculinas + 2 femeninas por partida").
Descartadas. Se juega lo que sobreviva a los vetos, sin composición forzada.

---

## 3. Fase previa y azar

**Dado para repartir quién veta más y quién declara más.**
Descartado. Repartía roles por suerte antes de que nadie jugara, y en un juego donde se paga por cartas eso escuece mucho. Se resolvió con la **pantalla de elección**: cada uno elige rol y el dado solo interviene si ambos eligen lo mismo.

**El dado contra la IA.** *(Añadido en R2)*
Descartado. Que un dado le quite al jugador la primera declaración solo tiene sentido cuando al otro lado hay una persona que también eligió. Contra la máquina, **elige el jugador y la IA se queda lo otro**. El dado sobrevive únicamente en las partidas en vivo.

**Veto aleatorio al principio de la fase.**
Descartado. Va **al final**, para romper planes ya construidos. Al principio, los jugadores simplemente vetarían sabiéndolo y perdería todo el impacto.

**Desempate en una división distinta a la del veto aleatorio.**
Descartado. Se juega **en esa misma**: es la única división que ninguno de los dos eligió quitar, o sea el terreno más neutral que existe en la partida. Además ahorra un sorteo.

**Stat al azar en todos los duelos.**
Descartada. Destruiría el juego entero: sin declaración no hay lectura del rival, ni farol, ni gestión de recursos. Sería una tragaperras. El azar solo aparece en el desempate, donde ya no quedan decisiones que tomar.

---

## 4. Rasgos descartados

**CIERRE** — bonus considerable en el duelo 6 y en el desempate.
Descartado. Era un "+8" disfrazado de rasgo: sumaba números sin cambiar ninguna regla.

**PIEDRA** — no puede perder por margen amplio; todo duelo se resuelve como reñido.
Descartado. Permitiría que un peleador sin ranking le ganase a una élite en una tirada, y eso quita la razón para perseguir las cartas altas — se cae la economía entera.

**INCÓMODO en su versión original** — ocultar al rival la división en la que peleas.
Descartado tal cual: las divisiones en juego están siempre a la vista de los dos, así que no ocultaba nada. Se rehízo como **elección a ciegas entre dos cartas propias**, que es la versión que está en el GDD.

**INCÓMODO con intercambio de huecos.** *(Añadido en R2)*
Descartado. Al fallar la elección, la carta enviada y la de la división real intercambiaban su sitio. Dos motivos: con el plus, que admite cualquier división en juego, podía acabar mandando a un mosca a pelear en pesado en un duelo posterior que nadie había elegido; y **castigaba dos veces el mismo fallo**, en el duelo declarado y otra vez en el siguiente. Un fallo, un castigo.

**VETERANO plus = bloquear la jugada del rival en ese duelo.**
Descartado. Efecto vacío, porque no se puede responder a un rasgo con otro. El plus quedó como "eliges tú la stat".

**Contrarrestar un rasgo con otro rasgo.**
Descartado como regla general. Convertiría cada duelo en una cadena de respuestas, inmanejable en móvil.

---

## 5. Stats

**VELOCIDAD como sexta stat.**
Descartada en favor de **IQ**. Argumento: en MMA la lectura y la adaptación son diferenciales incluso en pesado, donde un golpe acaba la pelea. El caso Ngannou-Gane lo ilustra en las dos direcciones.

**"Cabeza" como nombre.**
Renombrada **IQ**.

> *Nota R2: esta es la única sustitución de stat que ha habido en todo el proyecto. LUCHA y SUELO son
> dos stats distintas desde el principio y ninguna sustituye a nada.*

**Separar ataque y defensa** (derribos vs. defensa de derribo, sumisión vs. escape).
Descartado. El sistema compara números simétricamente: los dos peleadores hacen lo mismo a la vez, no hay atacante ni defensor, así que un enfrentamiento asimétrico no encaja. Cada stat es una **media global**.

**Media general ponderada por arquetipo.**
Descartada. **Media simple** de las 6. En un juego de colección la gente hace cuentas, y si el número no cuadra con las stats visibles, piensa que hay trampa.

**Penalización plana por cruzar de división** (-X a todo).
Descartada. Es **selectiva**: subir castiga golpeo, lucha y dureza; bajar castiga cardio y dureza. Así la decisión deja de ser "¿me compensan los -6?" y pasa a depender de qué stat se ha declarado.

---

## 6. Economía

**Mercado de jugadores / casa de subastas con precios.**
Descartado. Sin precios no hay inflación, ni especulación, ni reventa por dinero real. Lo que **sí** existe es la **sala de intercambio**: entras pagando 1 ficha, te empareja a ciegas con otro jugador y cambiáis cartas por cartas, hasta 3 por lado. El valor lo fijan los dos en el momento, no el sistema.

**Fichas como moneda de valor de carta.**
Descartada. La ficha **no** paga cartas ni compensa diferencias: es solo la entrada a la sala. Ahí está su gracia — como cuesta cartas trituradas, salir de vacío duele y empuja a cerrar tratos.

**Sala de búsqueda dirigida por 3 fichas**, que te emparejaba con quien tuviera lo que buscas.
Descartada. Se quedó una sola sala de 1 ficha. La puntería la da la **lista de deseos pública**, estilo Pacybits/MadFUT: no sirve para emparejar, sirve para que el otro vea qué buscas y te lo ofrezca si lo tiene.

**Límite de 2 cartas con rasgo en plantilla.**
Sustituido por **1 activación por partida**, sin límite de cuántas alineas. Mejor porque el coleccionista puede aprovechar sus cartas sin desequilibrar el duelo.

**Ratios de reciclaje 3 oros / 7 platas / 10 bronces por ficha.**
Cambiados a **1 oro / 5 platas / 20 bronces**. Con la escala anterior la gente trituraría oros para farmear rápido y luego los echaría en falta en los sets.

**Reclamar el sobre básico para abrirlo después.** *(Añadido en R2)*
Descartado. El básico se abre **en el sitio y de uno en uno**. Reclamar-y-guardar es un paso entre el jugador y lo que ha venido a hacer, y además le quita la gracia a acumular: lo que hace especial abrir veinte de golpe es precisamente que con el básico no se puede.

**Sobres con distinta cantidad de cartas.** *(Añadido en R2)*
Descartado. **Todos entregan 9**. Lo que distingue a un sobre de otro son las probabilidades; si además cambia la cantidad, el jugador tiene que comparar dos variables a la vez y deja de comparar.

---

## 7. Criterios de diseño

Los principios que fueron saliendo. Sirven para juzgar ideas nuevas.

**Un rasgo no da números, quita restricciones.** Si un rasgo se puede escribir como "+X a una stat", está mal diseñado. Y el plus nunca es un número mayor: es **una restricción menos** que el normal.

**No debe haber cartas muertas.** Todo peleador tiene que valer para algo: el duelo, un set de colección o el reciclaje. Una carta que solo puede tirarse a la basura es veneno en un juego de sobres.

**El azar solo donde ya no quedan decisiones.** Es legítimo en el desempate, donde los dos jugadores han demostrado lo mismo. No lo es para repartir roles, rellenar huecos ni resolver duelos normales.

**Nada de reglas que solo aparecen en casos raros.** Una regla que se activa en el 15% de las partidas es una regla huérfana: cuesta explicarla y nadie la aprende.

**Legibilidad en móvil por encima de precisión de simulación.** Seis stats visibles, no doce. Un recurso por partida, no tres. Si algo necesita un tutorial, probablemente sobra.

**La escasez está en los rasgos, no en la potencia.** El que gasta dinero no debe pegar más fuerte, debe tener más opciones. Es lo que contiene el pay-to-win sin capar el gasto.

**Castigar al jugador está bien; confundirlo no.** Si el juego permite una jugada mala, la culpa es de quien la hace. Pero un botón que se pulsa y no hace nada parece un bug, no una lección — por eso el Veterano sale apagado en el duelo 6 con el motivo escrito.

**Cada sistema debe tener una sola función clara.** Cuando dos sistemas hacen lo mismo (Camaleón y cambio de esquina, por ejemplo), o se diferencian bien o sobra uno.

**Ninguna decisión del jugador se toma sola.** *(Añadido en R2)* Si el sistema activa un rasgo, resuelve un duelo o gasta un recurso sin que el jugador lo pida, está mal aunque el número final sea correcto. Es el principio que más veces se rompió al construir, porque romperlo siempre parece una comodidad.

**El juego no puede mentir sobre sus propias probabilidades.** *(Añadido en R2)* Un empate exacto que se anuncia como 65/35 da el mismo resultado que anunciarlo como 50/50 — y aun así está mal, porque el jugador deja de fiarse de todo lo demás que lee.

**Una regla no está cerrada hasta que dice qué pasa en el caso raro.** *(Añadido en R2)* Casi ningún fallo del prototipo vino de una regla mal pensada: vinieron de reglas que no cubrían un caso, y al construirlas hubo que inventarlo sobre la marcha. Qué carta se descarta, quién decide, qué pasa con margen 0.

---

## 8. Descartado al construir *(nuevo en R2)*

Cosas que se implementaron, se probaron y se tiraron. Están aquí porque volverán a parecer buena idea.

**Resolver el duelo automáticamente al declarar.**
Descartado. Quitaba el turno del defensor por completo, y sin turno del defensor sus rasgos tienen que dispararse solos. El duelo espera hasta que el defensor **manda su carta a mano**.

**Rasgos que se aplican solos cuando se cumplen sus condiciones.**
Descartado. Es cómodo y es exactamente el fallo: gastan la única activación de la partida sin preguntar, y a veces en el duelo que menos convenía. Lo activa siempre su dueño, eligiendo además con qué stat cuando aplica.

**Que la máquina decidiera el Veterano del jugador humano en las partidas en vivo.**
Descartado. Se justificaba en ahorrar una ida y vuelta de red por duelo. No compensa: es la decisión más importante que toma el defensor.

**Elegir la stat con etiquetas de filtro, separadas de las cartas.**
Descartado. La decisión es sobre un peleador concreto, así que el jugador tiene que estar mirándolo cuando la toma. Se declara **tocando la carta**, y la stat se elige **sobre esa misma carta**.

**Un servidor por jugador, con la dirección pegada a mano.**
Descartado. Quien instala el juego no puede tener deberes. **Un solo servidor**, ya dentro de la aplicación, y salas por código de 6 letras. Ni cuentas, ni registro, ni ajustes.

**Sortear los rasgos solo por rareza.**
Descartado. Con requisitos encima (Camaleón solo en dobles divisiones, Veterano solo en carreras largas), la lotería deja clases enteras a cero: la primera versión del roster no tenía **ni un Veterano** en 215 cartas. El roster garantiza un mínimo por clase.

**Rasgos en cartas de colección.**
Descartado. No son alineables, así que el rasgo es una promesa que no se puede cumplir nunca.

---

## 9. Descartado en R3

**La media general de la carta, en cualquier forma.**
Descartado del todo: ni visible ni guardada en el código. Se probó primero quitarla de la vista y
dejarla dentro para ordenar, y no vale — en cuanto el número existe, algo del juego acaba
ordenando por él y el especialista vuelve a salir malparado. La carta se lee por sus seis stats, y
lo que ordena es el **estatus deportivo**. El desempate dentro de un tramo usa la suma interna,
que **no se enseña nunca**.

**El bronce.**
Descartado por ahora. Existía como rareza para peleadores de otras promotoras que todavía no están
en el juego, así que eran cero cartas ocupando un tercio de las tablas de probabilidad. La banda
queda reservada por si entran Cage Warriors, KSW y compañía.

**Comparar los tres sobres por cuántos oros dan.**
Descartado como forma de razonar, no solo como número. Lleva a la conclusión falsa de que el
básico gratis es "mejor" que el de plata de pago, cuando **hacen cosas distintas**: el básico está
para que cualquiera monte un once desde el día uno, y el de plata para cerrar la colección de
platas, que es lo que desbloquea las especiales. Lo que sí tiene que crecer con el precio es la
**carta alta**, y es lo que se mide ahora.

**Ofrecer "abrir otro sobre básico" al final de cada apertura.**
Descartado. Convierte la pantalla de apertura en una palanca de la que no se sale: abres, te ofrece
otro, abres. El gratis se reclama en la pantalla de sobres y en ningún otro sitio. Lo que sí se
encadena es lo que ya tienes guardado, que es finito.

**Ir pasando las nueve cartas del sobre de una en una.**
Descartado. Son ocho toques de puro trámite, y diluyen justo el momento que engancha. Ahora la
mejor carta ocupa la pantalla, se toca una vez, y sale el sobre entero.

**El cambio de división y el Camaleón en manos del que declara.**
Descartado. El que declara ya elige división y stat; dejarle además mover cartas es darle dos
jugadas en la misma mano. Los dos son **respuestas**, y viven en la pantalla del defensor.

**Que el Especialista salvara su stat del pool.**
Descartado, pero no tirado: ese oficio pasa al **Veterano**, donde encaja mejor. Un veterano
administra; un especialista arrastra la pelea a lo suyo, que es lo que hace ahora — **impone su
stat al duelo**.

**Las franjas de margen anchas (finish desde 13, reñido 1-6 a 65/35).**
Descartadas al pasar al roster real. Estaban calibradas para cartas inventadas, que se separaban
mucho más entre sí; con peleadores de verdad casi no saltaba un finish. Ahora el finish empieza en
10, la decisión va de 4 a 9 y el reñido, que son solo tres puntos de diferencia, se reparte 55/45.

**Escalar el texto de la carta con consultas de contenedor (`cqw`).**
Descartado. Es lo elegante y lo resuelve el navegador solo, pero **no existe en los WebView
antiguos**, y allí el texto se quedaba en un tamaño fijo: en la rejilla de sobres y colección, con
cartas de 124 píxeles, los números se salían de los rombos y los nombres del recuadro. Ahora cada
carta se mide a sí misma y publica su ancho, y todo el texto sale de ahí. Funciona en cualquier
motor.
