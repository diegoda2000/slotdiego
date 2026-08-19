# Decisiones descartadas y criterios de diseño

Documento complementario al GDD. El GDD dice **qué es** el juego; este dice **qué no es** y por qué,
para no repetir debates ya cerrados.

Si una idea aparece aquí, ya se discutió y se descartó. Volver a proponerla solo tiene sentido si hay
un argumento nuevo que no se tuvo en cuenta entonces.

> **Revisión 2.** Se añaden la sección 8 (lo que se descartó al construir el prototipo) y tres
> criterios nuevos en la 7.
> **Revisión 3.** Se añaden los descartes del bloque de datos —media, rareza, bronce, reciclaje— y
> tres criterios más.
> **Revisión 4.** Se añaden la sección 9 y dos criterios nuevos: lo descartado al poner la carta, la
> apertura y los sobres en su sitio.

---

## 1. Estructura del juego

**La plantilla como cartelera de evento (ser promotor).**
Descartada. Mezclaba dos fantasías distintas —promotor y coleccionista— y ensuciaba el concepto. La
plantilla es literal: un peleador por división.

**Simulador de combate por asaltos, con barra de momentum, daño acumulado y decisiones de esquina
entre rondas.**
Descartado. Los duelos se resuelven comparando números. Un simulador convierte cada duelo en una
espera y hace imposible leer por qué has perdido.

**Banquillo.**
Descartado. Se defendía como motor de colección, pero con los sets de colección haciendo ese trabajo
solo añadía gestión aburrida.

---

## 2. Divisiones

**Mapear divisiones de otras promotoras a las 11 de UFC.**
Descartado de momento. KSW, Rizin y ONE usan categorías de peso distintas, y encajarlas ensuciaría
todo el sistema de cruces y penalizaciones. Sus cartas existen para colección, sets, reciclaje e
intercambio, pero no se alinean.

**Ampliar o reducir el número de divisiones.**
Descartado. Se quedan 11: 8 masculinas y 3 femeninas. Es lo que hay en UFC y lo que hace que la
plantilla tenga una forma reconocible.

---

## 3. Fase previa y azar

**Sortear los roles antes de que nadie decida nada.**
Descartado. Repartía roles por suerte antes de que el jugador hubiera hecho nada. Ahora los dos
eligen a la vez y el dado solo aparece si coinciden.

**Dado también contra la IA.**
Descartado. Que un dado le quite al jugador la elección tiene sentido cuando al otro lado hay una
persona que también eligió. Contra la máquina, no.

**Veto aleatorio al principio.**
Descartado. Va al final, para romper planes ya construidos, que es donde más impacto tiene.

**Desempate en una división nueva.**
Descartado. Se juega en la del veto aleatorio: es la única que no se ha jugado, los dos la conocen
desde el principio y condiciona toda la partida.

---

## 4. Rasgos descartados

**Rasgos que suman puntos a una stat.**
Descartado. Era un "+8" disfrazado de rasgo: sumaba potencia en vez de abrir opciones.

**Rasgo que ignora el ranking del rival.**
Descartado. Permitiría que un peleador sin ranking le gane a un campeón sin haber hecho nada para
merecerlo.

**Incómodo que enseña tres cartas contiguas en la versión plus.**
Descartado tal cual: las divisiones en juego están a la vista y la de en medio delataría la
respuesta.

**Incómodo con intercambio de huecos.**
Descartado. Al fallar la elección, la carta enviada y la de la división real cambiaban de sitio, y
eso podía acabar mandando un mosca a pelear en pesado más tarde. Además castigaba dos veces el mismo
fallo. Un fallo, un castigo.

**Rasgo que devuelve una stat solo para su dueño.**
Descartado. Efecto vacío, porque no se puede tener dos listas de stats vivas: el pool es compartido.

**Contrarrestar un rasgo con otro.**
Descartado como regla general. Convertiría cada duelo en una cadena de respuestas, que en móvil es
inmanejable.

---

## 5. Stats

**VELOCIDAD como sexta stat.**
Descartada en favor de **IQ**. En MMA la lectura y la adaptación son diferenciales incluso en pesado,
donde un golpe acaba la pelea. El caso Ngannou-Gane lo ilustra en las dos direcciones.

**"Cabeza" como nombre.**
Renombrada **IQ**.

> **Nota R2:** esta es la única sustitución de stat que ha habido en todo el proyecto. LUCHA y SUELO
> son dos stats distintas desde el principio y ninguna sustituye a nada.

**Separar ataque y defensa** (derribos vs. defensa de derribo, sumisión vs. escape).
Descartado. El sistema compara números simétricamente: los dos peleadores hacen lo mismo a la vez, no
hay atacante ni defensor. Cada stat es una media global.

**Media general ponderada por arquetipo.**
Descartada. *(Ver más abajo: en R3 se descartó la media general entera, en cualquier forma.)*

**Penalización plana por cruzar de división (-X a todo).**
Descartada. Es selectiva: subir castiga golpeo, lucha y dureza; bajar castiga cardio y dureza. Así la
decisión deja de ser "¿me compensan los -6?" y pasa a depender de qué stat se ha declarado.

**Media general en la carta, en cualquier forma.** *(Añadido en R3)*
Descartada del todo. Se probaron cuatro variantes y todas fallan por el mismo sitio: **cualquier
cifra resumen miente sobre un especialista**. La media simple hundía a Pereira a un 79 con 88 de
golpeo. La ponderada por arquetipo no encaja porque aquí no hay posiciones — tu rival puede declarar
LUCHA contra un pegador y ese agujero sale a la luz. Las estrellas de 1 a 5 chocan con la rareza, que
ya mide lo mismo. Y mostrar la stat más alta como cifra de portada es repetir un número que ya está
en la carta.

**Guardar la media solo por dentro, para ordenar.** *(Añadido en R4)*
Descartado. Era la última forma que quedaba de que sobreviviera, y no vale: en cuanto el número
existe, algo del juego acaba ordenando por él y el especialista vuelve a salir malparado. **Ni
visible ni guardada.** Lo que ordena es el estatus deportivo, y el desempate dentro de un tramo usa
la suma de las seis stats, que no se enseña nunca.

**Ordenar por tramos de cinco puestos.** *(Añadido en R4)*
Descartado. Agrupar en campeón / top 5 / top 6-10 / top 11-15 y desempatar dentro del tramo por la
suma ponía a un **#15 por delante de un #11** cuando el #15 sumaba más. El ranking es lo que el
jugador persigue: manda el puesto exacto.

**Que la calidad de la carta se derive solo de los datos.** *(Añadido en R3)*
Descartado tal cual. Las métricas de UFCStats miden **actividad, no calidad**: no saben que los
golpes de Pereira acaban peleas y los de un número 12 no. Puntuando solo con datos, peleadores con
tres combates y buenas medias salían por encima de Pereira y Topuria. La solución es mixta — datos
para la forma de la carta, anclajes de criterio para el nivel de la élite, y ponderación por el
ranking del rival en cada pelea.

**Dejar que un peleador con muestra corta se quede en el techo de la escala.** *(Añadido en R4)*
Descartado, y es el mismo descarte de arriba llevado a los datos de verdad. La regla estaba escrita
desde R3 y **el roster no la cumplía**: Brando Pericic, #15 con 7-1-0, tenía 88 de GOLPEO — el mismo
número que Alex Pereira. El techo pasa a darlo el puesto (89 campeón, 88 top 5, 87 top 10, 86 top 15,
85 sin rankear) y por debajo de doce peleas el valor tira hacia la media de su banda. **113 cartas
cambiaron.**

**Reescalar las stats de la élite para que vuelvan a saltar los finish.** *(Añadido en R4)*
Descartado. Con el roster real los finish caen al 6-14% de los duelos, contra el 52% que daba el
roster inventado, porque los peleadores de verdad se parecen mucho más entre sí. La tentación era
abrir el hueco a mano subiendo a los de arriba: sería **falsear cientos de cartas para que salte una
tabla**, y es arreglar el síntoma. Se acepta que el finish sea raro —en MMA de verdad tampoco es lo
normal— y a cambio gana peso: a 3-3, desempata.

---

## 6. Economía

**Mercado de jugadores / casa de subastas con precios.**
Descartado. Sin precios no hay inflación, ni especulación, ni reventa por dinero real. Lo que sí
existe es la **sala de intercambio**: entras pagando 1 ficha, te empareja a ciegas con otro jugador y
cambiáis cartas por cartas, hasta 3 por lado. El valor lo fijan los dos en el momento.

**Fichas como moneda de valor de carta.**
Descartada. La ficha no paga cartas ni compensa diferencias: es solo la entrada a la sala. Ahí está
su gracia — como cuesta cartas trituradas, salir de vacío duele y empuja a cerrar tratos.

**Sala de búsqueda dirigida por 3 fichas.**
Descartada. Se quedó una sola sala de 1 ficha. La puntería la da la lista de deseos pública: no sirve
para emparejar, sirve para que el otro vea qué buscas.

**Límite de 2 cartas con rasgo en plantilla.**
Sustituido por **1 activación por partida**, sin límite de cuántas alineas.

**Ratios de reciclaje 3 oros / 7 platas / 10 bronces por ficha.**
Cambiados, y luego cambiados otra vez *(ver abajo, R3)*.

**Reclamar el sobre básico para abrirlo después.** *(Añadido en R2)*
Descartado. El básico se abre en el sitio y de uno en uno. Reclamar-y-guardar es un paso entre el
jugador y lo que ha venido a hacer, y además le quita la gracia a acumular.

**Sobres con distinta cantidad de cartas.** *(Añadido en R2)*
Descartado. Todos entregan 9. Lo que distingue a un sobre de otro son las probabilidades; si además
cambia la cantidad, el jugador tiene que comparar dos variables a la vez y deja de comparar.

**Rareza determinada por las stats.** *(Añadido en R3)*
Descartada. La marca el **estatus deportivo**: ranking, racha, peleas de título y recorrido en la
compañía. Si la decidieran las stats, las dos señales medirían lo mismo y sobraría una.

**Bronce para peleadores malos de UFC.** *(Añadido en R3)*
Descartado. El bronce no es "malo", es **"de otra promotora"**. Un peleador con récord negativo en la
UFC es plata. El bronce se reserva a Cage Warriors, KSW, LFA, Invicta y regionales.

**Atributos en cartas de plata.** *(Añadido en R3)*
Descartado. Nadie va a alinear una plata teniendo oros. Esto no deja a la plata sin función: entra en
los sets de colección, en los SBC y en el reciclaje.

**Reciclaje por rareza (1 oro = 1 ficha).** *(Añadido en R3)*
Sustituido por **reciclaje por tramo deportivo**. El 1:1 se fijó cuando el oro era escaso; con el
roster real generaba cientos de fichas por cada 100 sobres básicos. Además creaba un incentivo
perverso: triturar campeones era la vía más rápida de farmear.

**Mezclar tramos para completar una ficha.** *(Añadido en R3)*
Descartado. Si se pudieran combinar, un jugador con muchas platas repetidas iría rellenando huecos y
las fichas volverían a salir demasiado rápido.

**Poder reciclar la última copia de una carta.** *(Añadido en R4)*
Descartado. Solo se reciclan **repetidos**: si de una carta solo tienes una, no se toca. Reciclar no
puede vaciarte la colección, que es justo lo que desbloquea las cartas especiales.

**Comparar los tres sobres por cuántos oros dan.** *(Añadido en R4)*
Descartado como forma de razonar, no solo como número. Lleva a la conclusión falsa de que el básico
gratis es "mejor" que el de plata de pago, cuando **hacen cosas distintas**: el básico está para que
cualquiera monte un once desde el día uno, y el de plata para cerrar la colección de platas, que es
lo que desbloquea las especiales. Lo que sí tiene que crecer con el precio es la **carta alta**.

**Que el sobre básico reparta rankeados con soltura.** *(Añadido en R4)*
Descartado. Es gratis e ilimitado: si reparte clasificados a buen ritmo, el juego se acaba solo por
acumulación. Reparte **mitad oros y mitad platas** —los oros son lo que permite montar un once— pero
un clasificado cae **uno cada seis sobres**, y cuando cae es del **12-15** el 97,5% de las veces. Del
11 para arriba es simbólico.

**Que el sobre de plata reparta platas altas y bajas por igual.** *(Añadido en R4)*
Descartado. Lo que cuesta completar de una colección son las de arriba; repartiéndolas por igual, el
sobre se queda sin recorrido a las pocas compras. Reparte **92% bajas**.

**Ofrecer "abrir otro sobre básico" al final de cada apertura.** *(Añadido en R4)*
Descartado. Convierte la pantalla de apertura en una palanca de la que no se sale: abres, te ofrece
otro, abres. El gratis se reclama en la pantalla de sobres y en ningún otro sitio. Lo que sí se
encadena es lo que ya tienes guardado, que es finito.

---

## 7. Criterios de diseño

Los principios que fueron saliendo. Sirven para juzgar ideas nuevas.

**Un rasgo no da números, quita restricciones.** Si un rasgo se puede escribir como "+X a una stat",
está mal diseñado. Y el plus nunca es un número mayor: es una restricción menos que el normal.

**No debe haber cartas muertas.** Todo peleador tiene que valer para algo: el duelo, un set de
colección o el reciclaje. Una carta que solo puede tirarse a la basura es veneno en un juego de
sobres.

**El azar solo donde ya no quedan decisiones.** Es legítimo en el desempate, donde los dos jugadores
han demostrado lo mismo. No lo es para repartir roles, rellenar huecos ni resolver duelos normales.

**Nada de reglas que solo aparecen en casos raros.** Una regla que se activa en el 15% de las
partidas es una regla huérfana: cuesta explicarla y nadie la aprende.

**Legibilidad en móvil por encima de precisión de simulación.** Seis stats visibles, no doce. Un
recurso por partida, no tres. Si algo necesita un tutorial, probablemente sobra.

**La escasez está en los rasgos, no en la potencia.** El que gasta dinero no debe pegar más fuerte,
debe tener más opciones. Es lo que contiene el pay-to-win sin capar el gasto.

**Castigar al jugador está bien; confundirlo no.** Si el juego permite una jugada mala, la culpa es
de quien la hace. Pero un botón que se pulsa y no hace nada parece un bug, no una lección — por eso
el Veterano sale apagado en el duelo 6 con el motivo escrito.

**Cada sistema debe tener una sola función clara.** Cuando dos sistemas hacen lo mismo, o se
diferencian bien o sobra uno.

**Ninguna decisión del jugador se toma sola.** *(Añadido en R2)* Si el sistema activa un rasgo,
resuelve un duelo o gasta un recurso sin que el jugador lo pida, está mal aunque el número final sea
correcto. Es el principio que más veces se rompió al construir, porque romperlo siempre parece una
comodidad.

**El juego no puede mentir sobre sus propias probabilidades.** *(Añadido en R2)* Un empate exacto que
se anuncia como 65/35 da el mismo resultado que anunciarlo como 50/50 — y aun así está mal, porque el
jugador deja de fiarse de todo lo demás que lee.

**Una regla no está cerrada hasta que dice qué pasa en el caso raro.** *(Añadido en R2)* Casi ningún
fallo del prototipo vino de una regla mal pensada: vinieron de reglas que no cubrían un caso.

**Un número que no se puede validar no está cerrado.** *(Añadido en R3)* Los rangos por rareza
parecían cerrados hasta que se puntuaron 400 peleadores y aparecieron dos reglas que faltaban. Antes
de dar por buena una tabla de números, poblarla entera y ver qué se rompe.

**No tener un atributo también simula.** *(Añadido en R3)* Un atributo se gana con rendimiento, no
con biografía. El peleador que cambió de división y rindió mal no lleva Camaleón, y por tanto cruza
comiendo el -6 — que es literalmente lo que le pasó en la realidad.

**Los datos ordenan, el criterio ancla.** *(Añadido en R3)* Ninguna fuente de datos sabe lo que sabe
alguien que ve peleas. Pero ninguna memoria puede puntuar 400 peleadores sin inventarse la mitad. El
reparto correcto es **datos para el volumen y criterio para el techo**.

**Una regla escrita que nadie aplica es peor que no tenerla.** *(Añadido en R4)* Las tres
correcciones de puntuación llevaban desde R3 en el documento, y el roster no cumplía ninguna. El
documento decía que estaba resuelto y los datos decían lo contrario, así que nadie fue a mirar. Toda
regla que se escriba sobre los datos necesita una comprobación que falle sola si deja de cumplirse.

**Lo que aparece no puede parpadear.** *(Añadido en R4)* Cuando algo se revela por partes, lo que se
mueve tiene que ser solo la opacidad. Repintar la pantalla para enseñar el paso siguiente destruye lo
que ya estaba y lo vuelve a crear, y durante un fotograma no hay nada: eso se lee como un fallo, no
como una animación.

---

## 8. Descartado al construir *(nuevo en R2)*

Cosas que se implementaron, se probaron y se tiraron. Están aquí porque volverán a parecer buena
idea.

**Resolver el duelo automáticamente al declarar.**
Descartado. Quitaba el turno del defensor por completo, y sin turno del defensor sus rasgos tienen
que dispararse solos. El duelo espera hasta que el defensor **manda su carta a mano**.

**Rasgos que se aplican solos cuando se cumplen sus condiciones.**
Descartado. Es cómodo y es exactamente el fallo: gastan la única activación de la partida sin
preguntar, y a veces en el duelo que menos convenía.

**Que la máquina decidiera el Veterano del jugador humano en las partidas en vivo.**
Descartado. Se justificaba en ahorrar una ida y vuelta de red por duelo. No compensa: es la decisión
más importante que toma el defensor.

**Elegir la stat con etiquetas de filtro, separadas de las cartas.**
Descartado. La decisión es sobre un peleador concreto, así que el jugador tiene que estar mirándolo
cuando la toma. Se declara **tocando la carta**.

**Un servidor por jugador, con la dirección pegada a mano.**
Descartado. Quien instala el juego no puede tener deberes. **Un solo servidor**, ya dentro de la
aplicación, y salas por código de 6 letras.

**Sortear los rasgos solo por rareza.**
Descartado. Con requisitos encima, la lotería deja clases enteras a cero: la primera versión del
roster no tenía **ni un Veterano** en 215 cartas.

**Rasgos en cartas de colección.**
Descartado. No son alineables, así que el rasgo es una promesa que no se puede cumplir nunca.

---

## 9. Descartado al poner la carta en su sitio *(nuevo en R4)*

**Que el Especialista salvara su stat del pool.**
Descartado, pero no tirado: ese oficio pasa al **Veterano**, donde encaja mejor. Un veterano
administra; un especialista **arrastra la pelea a lo suyo**, que es lo que hace ahora — impone su
stat al duelo.

**El cambio de división y el Camaleón en manos del que declara.**
Descartado. El que declara ya elige división y stat; dejarle además mover cartas es darle dos jugadas
en la misma mano. Los dos son **respuestas**, y viven en la pantalla del defensor.

**Las franjas de margen anchas** (finish desde 13, reñido 1-5 a 65/35).
Descartadas al pasar al roster real. Estaban calibradas para cartas inventadas, que se separaban
mucho más entre sí. Ahora el finish empieza en 10, la decisión va de 4 a 9 y el reñido, que son solo
tres puntos de diferencia, se reparte **55/45**: dar al alto dos de cada tres por una diferencia
mínima es demasiado premio.

**Ir pasando el sobre carta a carta.**
Descartado. Son ocho toques de puro trámite por sobre, y diluyen justo el momento que engancha. Ahora
la mejor carta ocupa la pantalla, se toca una vez, y sale el sobre entero.

**Enseñar el walkout en un panel aparte.**
Descartado. Se probó y estaba mal: si los datos del peleador salen en una lista al lado, lo que el
jugador mira es la lista, no la carta. El walkout ocurre **sobre la carta**, cada dato en su hueco, y
lo que se ve es la carta llenándose.

**Buscar archivos de audio reales para el prototipo.**
Descartado por ahora, no para siempre. Suenan mejor —un rugido de público no se sintetiza— pero hay
que sourcearlos con licencia clara, pesan en las dos aplicaciones y este proyecto ya carga
conscientemente con el riesgo legal de usar peleadores reales. El sonido se sintetiza con Web Audio.

**Forzar que el sonido suene con el iPhone en silencio.**
Descartado. Se puede hacer, y es exactamente lo que hace que se desinstale una aplicación.

**Escalar el texto de la carta con consultas de contenedor (`cqw`).**
Descartado. Es lo elegante y lo resuelve el navegador solo, pero **no existe en los WebView
antiguos**, y allí el texto se quedaba en un tamaño fijo: en la rejilla de sobres y colección, con
cartas de 124 píxeles, los números se salían de los rombos y los nombres del recuadro. Ahora cada
carta se mide a sí misma y publica su ancho.

**Centrar el texto de la carta con las cajas de línea.**
Descartado. Centrar con flex centra la **caja de línea**, y la caja de Oswald reserva sitio bajo la
base para las colas de las letras: los números quedaban altos y se salían del rombo por arriba.
Números, nombre y ranking se centran por **altura de mayúsculas**, 0,42 em más abajo — medido, no
deducido de la ratio nominal de la fuente.

**La plantilla en cuatro columnas.**
Descartada. Con 4 + 4 + 3 las cartas salen más pequeñas de lo necesario y sobra hueco por debajo.
Pasa a **3 + 3 + 3 + 2** con las dos últimas centradas, y el tamaño de carta se calcula contra el
hueco real de cada móvil.
