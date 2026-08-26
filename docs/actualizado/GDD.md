# Juego de cartas de MMA — Documento de diseño

**Estado:** cartas, PvP y roster cerrados. Aplicación jugable en Android e iPhone. Sets, SBC y
licencias pendientes.
**Última actualización:** 19 de agosto de 2026 — **revisión 4**

> **Cómo leer este documento.**
> **[R2]** cerró ocho puntos al construir el prototipo.
> **[R3]** cerró el bloque de datos: el roster real con las stats derivadas de UFCStats, la
> desaparición de la media general, las bandas por rareza, el criterio de rareza, el reparto de
> atributos, la tabla de márgenes recalibrada y el reciclaje por tramo.
> **[R4]** cierra el bloque de presentación y corrige los datos: el diseño de la carta con su marco
> real, la apertura de sobres como walkout con sonido, el orden por puesto, los rasgos que
> intercambian oficio, el reajuste de los tres sobres y —lo más importante— **hacer cumplir las
> reglas de puntuación que ya estaban escritas y no se aplicaban**.
> Donde una sección [R4] contradice lo que el documento decía antes, **manda la [R4]**. Las tres
> revisiones están resumidas en los anexos A, B y C.

---

## 1. Concepto

Juego móvil de colección de cartas de MMA, estilo Pacybits/FUT: abres sobres, montas tu plantilla y
peleas contra otros jugadores online.

- **La plantilla es un peleador por división.** No eres promotor ni entrenador: montas el mejor
  roster posible cubriendo todas las divisiones
- **Peleadores reales.** Riesgo legal asumido conscientemente (ver sección 10)
- **En PvP, solo UFC.** La plantilla de 11 se monta exclusivamente con cartas de UFC. Es lo que
  mantiene limpia la lógica de divisiones: KSW, Rizin y ONE usan categorías de peso distintas y
  encajarlas en las 11 de UFC ensuciaría todo el sistema de cruces y penalizaciones
- **En colección, no solo UFC.** Cage Warriors, KSW, Rizin, Invicta, LFA y regionales existen como
  cartas: entran en sets, se reciclan y se intercambian. Es el hueco de mercado frente a EA, que
  está atada a una sola promoción

*Decisión marcada como provisional ("de momento"). Abrir el PvP a otras promotoras es una vía de
crecimiento futuro, pero exige resolver antes el mapeo de divisiones.*

- **Sin casa de subastas.** No se compran ni se venden cartas por dinero del juego: no hay precios,
  no hay especulación. Lo que sí hay es una **sala de intercambio** entre jugadores, de trueque puro
  (ver sección 9)

---

## 2. La carta

### 2.1 Las 6 stats

Todas sobre 100.

| Stat | Qué mide |
|---|---|
| **GOLPEO** | Todo el juego de pie |
| **LUCHA** | Imponer dónde se pelea: derribos y defensa de derribo |
| **SUELO** | Dominio en el suelo: sumisiones, control, defensa |
| **CARDIO** | Ritmo sostenido y recuperación |
| **DUREZA** | Aguantar castigo y seguir |
| **IQ** | Lectura, adaptación, gestión del combate |

Cada stat es una **media global de ataque y defensa juntos**. No existe "derribos" separado de
"defensa de derribo": el sistema compara números simétricamente (los dos peleadores hacen lo mismo a
la vez), así que no hay atacante ni defensor.

Los nombres deben dejar claro que son capacidades globales. Por eso es LUCHA y no "derribos" — si se
llama derribos, el jugador espera que un 90 derribe siempre.

> **Nota [R2] — las seis son las originales.** LUCHA y SUELO son dos stats distintas desde el
> principio y ninguna sustituye a nada: LUCHA es dónde se pelea (derribos, clinch, jaula) y SUELO es
> qué pasa una vez ahí (sumisiones, control, guardia). La única stat que sí se sustituyó en su día
> fue **VELOCIDAD → IQ**, y está recogida en el documento de decisiones descartadas.

### 2.2 Sub-stats (modelo FIFA)

Cada stat visible saldría de la media de sus sub-stats internas. La carta enseña las 6 grandes.

- **GOLPEO** — potencia, precisión, volumen, boxeo, patadas, golpeo en clinch
- **LUCHA** — derribos, defensa de derribo, clinch, control contra la jaula, levantarse, transiciones
- **SUELO** — sumisiones, defensa de sumisión, control desde arriba, guardia, ground and pound, escapes
- **CARDIO** — resistencia, recuperación entre asaltos, ritmo sostenido, aguante en asaltos finales, eficiencia de movimiento, gestión del gas
- **DUREZA** — mentón, absorción de daño, resistencia a cortes, recuperación de aturdimiento, tolerancia al castigo corporal, voluntad
- **IQ** — lectura del rival, gestión de distancia, adaptación, control del octógono, defensa, gestión de asaltos

> **[R3] Las sub-stats no se usan y no se van a puntuar a mano.** Ninguna regla del juego las lee, y
> las seis grandes ya no salen de ellas: salen de los datos reales de UFCStats (ver §2.3). El aviso
> de los 18.000 números a mano queda anulado — el roster entero se puntúa con una fórmula. La lista
> de arriba se conserva como referencia de qué entra conceptualmente en cada stat, no como
> estructura de datos.

> **[R2] Las cartas de colección no llevan sub-stats.** Como no son alineables, sus 36 números no
> los usa nadie. Llevan solo las 6 grandes.

### 2.3 [R3] La carta no tiene media

Se elimina la media general. **Ni simple, ni ponderada, ni estrellas, ni ningún número resumen.** La
carta enseña seis stats, la rareza y el atributo si lo lleva.

El motivo es el que ya avisaba el documento anterior y no tenía arreglo: cualquier cifra resumen
miente sobre un especialista. Pereira con 88 de golpeo y 74 de suelo no es "un 79" — es una carta
buenísima si declaras golpeo y mala si te sacan al suelo, y esa es exactamente la decisión que
plantea el juego. Aplastarla en un número la borra.

Se probaron y se descartaron la media ponderada por arquetipo, el sistema de 1 a 5 estrellas y el
mostrar la stat más alta como cifra de portada. Están en el documento de decisiones descartadas.

**[R4] Y no queda ni oculta en el código.** Se probó dejarla dentro solo para ordenar, y no vale: en
cuanto el número existe, algo del juego acaba ordenando por él y el especialista vuelve a salir
malparado. No existe.

#### Cómo se calculan las seis stats

No se puntúan a ojo. Cada una sale de campos concretos de UFCStats cruzados con el historial completo
de combates de cada peleador:

| Stat | Se calcula con |
|---|---|
| **GOLPEO** | Golpes por minuto × precisión, diferencial de golpes, defensa de golpeo, y KO pesados por el ranking del rival |
| **LUCHA** | Derribos por 15 min × precisión de derribo + defensa de derribo |
| **SUELO** | Intentos de sumisión + sumisiones logradas − sumisiones sufridas |
| **CARDIO** | Minutos reales por pelea + ratio de peleas que llegan a las tarjetas |
| **DUREZA** | No ser finalizado + defensa + castigo absorbido sin caer |
| **IQ** | Defensa de golpeo + defensa de derribo + fiabilidad del récord + experiencia |

**Tres correcciones sin las cuales la fórmula da resultados absurdos:**

1. **La calidad de la oposición pesa.** Noquear a un campeón no vale lo que noquear a un debutante.
   Sin esa corrección, peleadores con tres combates y buenas medias se colaban por encima de Pereira
   y Topuria.
2. **Las muestras cortas tiran hacia la media** hasta acumular unas doce peleas, para que un dato de
   tres combates no mande.
3. **La élite va anclada a criterio.** Los datos miden actividad, no calidad: no saben que el jab de
   Yan es mejor que el de un número 12. Los valores del top están fijados a mano y la fórmula coloca
   al resto alrededor. Cambiar un anclaje recalcula toda la curva de esa stat.

> **Dureza, aviso.** El primer cálculo penalizaba recibir golpes y dejaba a Gaethje en el suelo de la
> banda. Es al revés: absorber muchísimo castigo y no caer es dureza alta. Lo que la baja es que te
> finalicen.

#### 2.3.1 [R4] Las tres correcciones, ahora sí aplicadas

Estaban escritas desde [R3] y **los datos no las cumplían**. Brando Pericic, #15 de pesado con
7-1-0, tenía **88 de GOLPEO**: el mismo número que Alex Pereira y por encima de Tom Aspinall. Josh
Hokit, con diez peleas, llevaba dos ochentaiochos. Veintidós cartas compartían ese 88, así que no
distinguía a nadie. Es exactamente el fallo que la corrección 1 describía —"peleadores con tres
combates y buenas medias se colaban por encima de Pereira"— sin que nadie lo hubiera aplicado al
roster.

**El techo de cada stat lo da el puesto.** Es lo que significa que la élite ancle la escala:

| Puesto | Techo de cada stat |
|---|---|
| Campeón | 89 |
| Top 1-5 | 88 |
| Top 6-10 | 87 |
| Top 11-15 | 86 |
| Oro sin rankear | 85 |

Aplica a las **seis** stats, no solo a la más alta: la carta refleja dónde estás hoy. Un ex campeón
que hoy no está clasificado tiene carta de no clasificado.

**Y por debajo de doce peleas el valor tira hacia la media de su banda**, en proporción a lo corta
que sea la muestra, y tira **de los dos lados**: una muestra corta tampoco puede ser extrema por
abajo.

Resultado: **113 cartas cambian y 169 valores se mueven.** Pericic pasa de `88-75-76-77-87-85` a
`85-76-77-79-86-84`. Comprobado: ninguna carta se pasa del techo que le corresponde, ningún campeón
pierde nada, y **el número más alto de cada una de las seis stats pasa a tenerlo un campeón o un top
5**, que es lo que "anclar la escala" quería decir.

La corrección **no se hizo a mano**: vive en `herramientas/corregir-stats.mjs`, se puede volver a
pasar y se puede auditar.

#### 2.3.1.1 [R4] LUCHA estaba midiendo otra cosa

El techo fue el primer hallazgo. Mirando el suelo apareció uno peor.

LUCHA es, según este documento, **"imponer dónde se pelea: derribos y defensa de derribo"**, y se
calcula con "derribos por 15 min × precisión **+ defensa de derribo**". Los datos solo recogieron la
primera mitad. Se notaba en tres sitios:

1. **El suelo era un vertedero.** 97 de 244 cartas de oro en 74-75, el suelo de la banda: un 40%.
   El techo, ya corregido, lo tocaba menos del 2%.
2. **LUCHA no correlacionaba con SUELO.** Media de LUCHA para SUELO 74-77: 77,8. Para SUELO 85-89:
   79,8. Dos puntos de diferencia. Un sumisionista y un pegador puro puntuaban igual en la stat que
   mide llevar la pelea al suelo, lo cual es imposible.
3. **Los casos eran absurdos.** Mackenzie Dern —campeona y cinturón negro mundial de BJJ— tenía 74.
   Aljamain Sterling, luchador de cadena, 74. Reinier de Ridder, doble campeón de ONE por sumisión,
   74. Y Justin Gaethje, que fue All-American de lucha en la NCAA, 74.

**Es exactamente el mismo error que este documento ya había cazado en DUREZA:** *"el primer cálculo
penalizaba recibir golpes y dejaba a Gaethje en el suelo de la banda. Es al revés."* La defensa
cuenta, y no se estaba contando.

La reconstrucción va en tres capas, de más objetiva a más opinable, y en ese orden:

- **A. Coherencia interna**, con los datos que ya hay: quien domina el suelo tiene que llegar a él,
  así que LUCHA no puede quedar más de 7 puntos por debajo de SUELO. Sale de la propia base
- **B. Anclajes de criterio.** Es lo que este documento pide —*"los datos ordenan, el criterio
  ancla"*— y lo único que arregla la defensa de derribo, porque ese dato no está en la base. La
  lista es **explícita y auditable** en `herramientas/anclar-lucha.mjs`: 60 peleadores, cada número
  un juicio que se puede discutir uno a uno
- **C. Suelo para los que no se juzgan.** Un clasificado entre los quince mejores del mundo no tiene
  **cero** defensa de derribo. A los rankeados sin anclaje se les sube a 77 —"no es su terreno" en
  vez de "es indefenso"— y el 74-75 queda para quien de verdad lo merece, como Michael Page

**Resultado: el suelo pasa del 40% al 6% de las cartas**, y LUCHA ya crece con SUELO.

#### 2.3.1.2 [R4] La técnica no cambia con la báscula

§2.6 lo dice desde [R3]: *"lo que no cambia entre versiones es lo que no depende del peso: el golpeo
de Pereira es 88 en medio, semipesado y pesado"*. **Los datos no lo cumplían.** De los 41 peleadores
con varias cartas de oro, el GOLPEO variaba en 38, la LUCHA en 29 y el SUELO en 36. Khamzat Chimaev
pegaba **74 en medio y 80 en welter**: el mismo puñetazo valiendo seis puntos distinto según la
báscula.

GOLPEO, LUCHA y SUELO son técnica y se igualan entre las cartas de un mismo peleador, tomando el
valor más alto —que es lo que hace el ejemplo de Pereira—. **CARDIO, DUREZA e IQ no se tocan:** son
justo las tres que el documento dice que sí cambian al cruzar de peso.

Ahora la incoherencia es **cero** en las tres.

> **Lo que todo esto todavía no hace.** Un techo por puesto es un sustituto mecánico del anclaje a
> criterio, y los anclajes de LUCHA cubren sesenta peleadores, no cuatrocientos. Que un #10 con un
> striking espectacular tenga 86 de golpeo está bien; lo que no arregla ninguna fórmula es que un
> peleador infle sus números contra oposición floja. **La corrección 1 sigue sin poder aplicarse**:
> la base guarda el récord, no contra quién. Sin datos de rival por combate, "la calidad de la
> oposición pesa" no se puede calcular, solo juzgar. Es la tarea abierta más importante del bloque
> de datos, y la vía práctica es seguir ampliando la lista de anclajes.

> **Sigue abierto: las platas.** Su banda declarada es 64-82 y los datos solo usan de 68 a 82, con
> **121 de 158 cartas empatadas en 82 de DUREZA**. Es el mismo vicio que tenía el oro, más agudo.
> Arreglarlo es reescalar la stat entera, no ponerle techo, y se dejó fuera de [R4] a propósito:
> cambiaría el carácter de todo el fondo de la colección.

#### 2.3.2 [R4] Cómo se ordena, sin media: por puesto real

1. **Rankeado antes que sin rankear. Siempre**, y sin mirar los números: un #15 va delante del oro
   sin rankear más completo del roster. El ranking es lo que el jugador persigue y lo que la carta
   enseña.
2. Entre rankeados, **por puesto**: campeón, #1, #2… hasta #15.
3. Entre los que no tienen ranking, primero el oro y luego la plata, y dentro de cada uno por la
   **suma interna de las seis stats**, que **no se enseña nunca**.
4. Y si aún hay empate, alfabético.

Antes se agrupaba por tramos de cinco puestos y dentro del tramo mandaba la suma, y eso ponía a un
**#15 por delante de un #11** cuando el #15 sumaba más. Manda el puesto.

Ese orden manda en todas partes: la colección, el resumen de un sobre, la carta que enseña un sobre
al abrirlo y "Rellenar con lo mejor".

*Consecuencia de producto que sigue en pie:* sin media, la pantalla de plantilla tiene que dejar
**ordenar por stat**. Es lo único que la media resolvía y es un requisito de interfaz, no opcional.

### 2.3.3 [R4] El diseño de la carta

La carta es un **marco de imagen** —uno de oro y uno de plata— con el texto colocado encima en
porcentajes **medidos sobre la propia imagen**, no ajustados a ojo. No hay una versión por tamaño:
hay una sola que escala.

De arriba abajo:

- **Pestaña de ranking**: `#C` para un campeón, `#3` para un clasificado, vacía para el resto
- **Icono y nombre del atributo**
- **Placa del nombre**, centrada en los dos ejes, con el tamaño de letra ajustado por nombre para
  llenar la placa sin salirse
- **Récord**, en el panel blanco, entre la placa del nombre y las stats
- **Las seis stats**: el número dentro del rombo, el nombre completo de la stat centrado sobre su línea
- **Al pie del panel blanco**: bandera del país, como imagen, y la sigla del peso (HW, LHW, MW…)

Nombre y pestaña de ranking llevan relieve y un reflejo cruzado, para que se lean como parte del
metal y no como una pegatina encima.

Las medidas, todas comprobadas contra el marco. [R5] La comprobación es
`herramientas/medir-carta.mjs`, que no calcula nada: dibuja la carta a tamaño natural, la fotografía
con y sin cada texto y se queda con la diferencia, que es la tinta. El mapa completo de la interfaz
—huecos, rejillas de cada pantalla y a qué tamaño se ve la carta en cada una— está en
**interfaz.md**.

| Elemento | Dónde y por qué |
|---|---|
| **Récord** | La franja de y 70,6% a 75,3% está limpia de lado a lado y las etiquetas de las stats no empiezan hasta el 75,32% |
| **Números** | [R5] Llenan el rombo de borde a borde: la tinta va del 76,17% al 78,22% y el rombo del 76,05% al 78,22%. Las tres filas usan las alturas leídas del dibujo —76,05%, 82,33% y 88,71%— y no las que se habían apuntado, unas centésimas desviadas |
| **Bandera y peso** | **Dos mitades iguales**, no un bloque centrado. Centrar el par como bloque dejaba el hueco 1,28% a la derecha del eje, porque la bandera es más ancha que "HW"; con dos columnas iguales la frontera **es** el eje, y sale simétrico de "HW" a "WFLW" |
| **Altura del peso** | Las mayúsculas del peso miden lo mismo que la bandera: 4,52% contra 4,49% |
| **Centrado vertical** | [R5] **Ningún texto lleva desplazamiento**: el centrado del navegador ya los deja donde toca. Lo llevaron —0,42 em hacia abajo— y estaba mal: la medición que lo justificaba metía la sonda de la línea de base dentro de un contenedor flex, donde el navegador la convierte en otro elemento en vez de apoyarla en el texto. Dejaba el nombre y los números un 1% de la altura por debajo de su sitio, colgando del rombo y de la placa |
| **Ranking** | Centrado en la pestaña **como si fuera un rectángulo**: su esquina inferior izquierda se sale de la carta y el ojo ve el hueco recortado, cuyo centro está en otro sitio |

[R5] **La carta se maqueta siempre a 620 px y se encoge con `transform`.** Los WebView traen un
tamaño mínimo de letra —8 px en Android— y calculando las letras contra el ancho real de la carta, en
el álbum salían a 3-4 px y el móvil las dibujaba todas a 8: del mismo tamaño y desbordando su hueco,
con el número ocupando el 158% del ancho de su rombo y las etiquetas montándose encima. Maquetando
grande y encogiendo el dibujo entero, ningún mínimo interviene. En Chromium de escritorio no pasa, y
por eso se coló: se estaba comprobando donde el fallo no existe.

[R5] **Y enseña lo mismo en todas las pantallas.** Hubo una versión "compacta" que en la plantilla
escondía el récord y los nombres de las stats. Era al revés de lo que parecía: la carta de la
plantilla es *más grande* que la del álbum, donde sí se veían.

### 2.4 [R3] Rareza y bandas

**La rareza la marca el estatus deportivo, no las stats.** Primero se clasifica al peleador por lo
que ha hecho; después se puntúa dentro de su banda.

| Rareza | Quién entra | Banda | Cartas |
|---|---|---|---|
| **Oro** | Rankeado, racha de 3+, 2 o más peleas de título, o 12+ victorias en UFC con balance de +4 | 74-89 | **244** |
| **Plata** | Resto del roster UFC | 64-82 | **158** |
| Bronce | Reservado a otras promotoras — vacío de momento | 55-74 | 0 |
| Especiales | Capa aparte | hasta 92 | — |
| Élite | 4-5 cartas en todo el juego | hasta 95 | — |

El roster de UFC es **solo oro y plata**. El bronce se llena cuando entren Cage Warriors, KSW, LFA,
Invicta y las regionales. Un peleador con récord negativo en la UFC es plata, no bronce: **el bronce
no es "malo", es "de otra promotora"**.

Las cuatro vías a oro son deliberadamente distintas. El ranking da el estatus de hoy; la racha premia
la forma actual y es una puerta abierta a cualquiera; las peleas de título y el recorrido en la
compañía reconocen la trayectoria aunque hoy no esté en racha. Sin la tercera y la cuarta, gente como
Derrick Lewis quedaba fuera por no estar en racha, y eso no representa lo que es.

El techo es 89 y casi nadie lo toca. De 90 arriba queda libre para las cartas especiales: si la carta
normal de un campeón ya estuviera en el máximo, su especial no tendría a dónde subir y solo podría
diferenciarse por el atributo.

> **[R4] Y el finish, decidido.** Con el roster real los números están mucho más juntos que con las
> cartas inventadas, y el finish cae al 6-14% de los duelos frente al 52% de antes. **Se acepta.** No
> se estiran las stats de la élite para forzarlo: falsear cientos de cartas para que salte una tabla
> es arreglar el síntoma, y en MMA de verdad el finish tampoco es lo normal. A cambio, el finish gana
> peso: a 3-3, **desempata** (ver §5.4).

### 2.5 Escala de habilidad, no de peso

Un 85 de GOLPEO vale lo mismo en mosca que en pesado. Las stats están ajustadas a la división donde
compite cada uno.

El peso solo importa cuando alguien cruza de división y come penalización. No existe división
dominante.

### 2.6 Reglas de carta

[R5] **El que se lleva el título a otra división sigue siendo campeón en la que dejó.** Ilia
Topuria dejó vacante el de peso pluma para subir a ligero sin haberlo perdido nunca, así que su
carta de pluma es de campeón. La corona la pierde quien la pierde peleando, no quien se cambia de
báscula. Puede haber entonces dos cartas de campeón en una misma división —la del que se fue y la
del que ocupó el hueco—, y es correcto: son dos cosas distintas.


- Cada carta pertenece a una división
- **Solo las cartas de UFC son alineables.** Las de otras promotoras existen como cartas de
  colección: valen para sets, reciclaje e intercambio, pero no se pueden poner en la plantilla
- **[R2] Las cartas de colección no llevan rasgos.** Un rasgo en una carta que no se puede alinear es
  una promesa imposible de cumplir
- Un mismo peleador puede tener cartas distintas en divisiones distintas, con stats diferentes
- **Un peleador, un slot:** no puedes alinear dos versiones del mismo peleador a la vez
- **[R3] Los atributos van en la carta base.** No hace falta versión especial
- **[R3] Un solo atributo por carta.** Se elimina la regla de hasta dos
- **[R3] Solo las cartas de oro llevan atributo.** La plata no se alinea en la práctica; su función
  es la colección — entra en los sets, en los SBC y en el reciclaje
- **[R3] Ningún atributo va en versión plus**, con una única excepción en todo el juego: el
  **Camaleón+ de Islam Makhachev**, por ser campeón con defensas de título en dos divisiones
- **[R3] Un peleador puede tener carta en dos o tres divisiones**, y las versiones valen lo que hizo
  en cada sitio. Lo que no cambia entre versiones es lo que no depende del peso; lo que baja al subir
  o bajar es el aguante, el cardio y la lectura
- **[R4] Cada carta lleva un ranking congelado** en la fecha de impresión: C para campeón, 1-15 para
  clasificados, — para el resto, y solo en la división donde está rankeado
- **[R4] Un doble campeón lleva C en las dos divisiones**, así que una división puede tener dos
  cartas con C: la del campeón actual y la del doble campeón. Los puestos numerados 1-15 sí son
  únicos por división
- **[R4] Cada carta lleva un país**, el de la bandera con la que compite. Una sola nacionalidad por
  carta

### 2.7 [R2] Reparto mínimo de rasgos en el roster

Los rasgos tienen requisitos: el Camaleón solo va en peleadores con historial en dos divisiones y el
Veterano solo en carreras largas. Si además se sortean por rareza, es perfectamente posible que una
clase entera se quede en cero. Pasó: la primera versión del roster de prueba no tenía **ni un solo
Veterano en 215 cartas**.

**Regla:** el roster garantiza un mínimo por clase de rasgo, repartido de mejor a peor carta.

> **[R3] En el roster real el mínimo se cumple de sobra sin forzarlo.** Con el criterio por mérito
> salen **114 cartas con atributo**, todas de oro:
>
> | Atributo | Cartas |
> |---|---|
> | Veterano | 49 |
> | Especialista | 36 |
> | Camaleón | 19 |
> | Incómodo | 8 |
> | Camaleón+ | 2 (las dos cartas de Makhachev) |
>
> El mínimo por clase sigue siendo la red de seguridad para rosters de prueba o recortados, pero con
> el roster completo no hace falta sortear nada: el mérito ya lo reparte.

---

## 3. La plantilla

- **11 cartas, una por división:** 8 masculinas, 3 femeninas
- **Solo cartas de UFC.** Las de otras promotoras no son alineables (ver sección 1)
- **Sin banquillo.** Se descartó: con sets de colección como sumidero, el banquillo solo añadía
  gestión aburrida
- Puedes alinear **todas las cartas con rasgo que quieras**, y pueden repetir rasgo entre ellas. El
  límite está en cuántas puedes activar, no en cuántas puedes llevar
- Repetir rasgo no da potencia extra, porque solo activas uno. Da **fiabilidad**: si llevas tres
  Camaleones en divisiones distintas, es más probable que al menos uno quede en posición útil después
  de los vetos

### 3.1 [R4] Las once, a la vez y lo más grandes que quepan

**Las once caben en la pantalla sin desplazar**, y no es un capricho: una plantilla que hay que
recorrer con el dedo no se lee de un vistazo, y leerla de un vistazo es exactamente para lo que
sirve.

- **Se colocan 3 + 3 + 3 + 2, con las dos últimas centradas.** Con cuatro columnas las cartas salen
  más pequeñas de lo necesario y sobra hueco por debajo.
- **El tamaño de la carta se calcula, no se escribe.** Cuánto sitio hay depende del móvil, del alto
  de la barra de abajo y de si el botón parte en dos líneas, así que se mide el hueco real y las
  cartas se estiran hasta llenarlo. En un móvil pequeño salen a 61 px y en uno grande a 112 px, y en
  los dos casos entran las once sin desplazar.

Y por lo mismo, **todo lo que rodea a la rejilla está al mínimo**: el título y su nota van en una
sola línea y la explicación del botón vive dentro del propio botón.

---

## 4. Fase previa a la partida

1. **Elección de rol.** Los dos eligen a la vez: empezar vetando o empezar declarando. Si eligen
   distinto, cada uno a lo suyo. Si coinciden, dado y el más alto se queda lo que pidió.

   > **[R2] El que empieza una cosa no empieza la otra**, siempre: es la contrapartida que equilibra
   > el reparto, y por eso el dado se tira una sola vez y decide las dos.

   > **[R2] Contra la IA no hay dado.** La máquina no compite por el rol: eliges tú y ella se queda
   > lo otro. Un dado que le diera a la IA la primera declaración estaría quitándole al jugador su
   > elección con azar, y eso solo tiene sentido cuando al otro lado hay una persona que también
   > eligió.

   **[R2] Qué significa exactamente cada opción**, escrito así en la pantalla porque es la parte que
   se malinterpreta:

   | Eliges | Vetos | Duelos que declaras |
   |---|---|---|
   | **Empezar vetando** | tiras el veto 1 y el 3 | el primer duelo lo declara el rival; tú declaras el 2, el 4 y el 6 |
   | **Empezar declarando** | el primer veto lo tira el rival | declaras el 1, el 3 y el 5 |

   Que el rival declare el primer duelo no es un fallo cuando has pedido empezar vetando: es
   literalmente lo mismo dicho de otra manera.

2. **Vetos alternos y visibles.** 2 cada uno. Cada veto aparece en pantalla al hacerse, para que el
   otro pueda reaccionar.
3. **Veto aleatorio, al final.** Rompe planes ya construidos, que es donde más impacto tiene.
4. **La división del veto aleatorio será el desempate.** Los dos la ven desde el principio y
   condiciona toda la partida.
5. Quedan **6 divisiones en juego**, en orden visible desde el inicio.

---

## 5. El duelo

- Se declara **división + stat**
- **[R2] Se declara tocando la carta del peleador**, y la stat se elige sobre esa misma carta. No hay
  listas ni etiquetas de filtro: primero eliges quién pelea, después con qué
- **Declaraciones 3 y 3, alternando.** Empieza el que no empezó vetando
- Las stats se gastan del **pool compartido**: 6 stats, 6 duelos, cada stat se usa una vez y muere
  para los dos jugadores
- Cada peleador pelea **una sola vez** por partida
- Las cartas están **ocultas** hasta que se resuelve el duelo
- **[R4] Reloj de 25 segundos** por decisión (ver §8)

### 5.1 Por qué funciona el pool compartido

Declarar no es solo elegir tu terreno: es **quemar el terreno del otro**. Puedes declarar LUCHA no
porque te convenga, sino para obligar al rival a gastar ahí antes de que esté listo.

Y guardarse una stat es un plan que el rival puede reventar. Si tienes un fenómeno en lucha y lo
reservas para el final, el rival puede declarar lucha en el duelo 2 y romperte el plan.

Cada declaración es a la vez ataque y defensa. Eso es lo que sostiene la tensión hasta el último
duelo.

### 5.2 [R2] El duelo no se resuelve solo

Declarar no resuelve nada. Cuando alguien declara, el otro tiene que **mandar su carta al duelo a
mano**: hasta que no pulsa, no pasa nada.

No es una formalidad, es donde vive media partida. Esa pantalla es la ventana del defensor para
reaccionar — es donde decide si usa sus rasgos o cambia de división. Si la resolución fuera
automática, el defensor no tendría turno y sus rasgos tendrían que dispararse solos, que es
exactamente lo que no puede pasar (ver §7).

La única excepción es el **Incómodo**: elegir a ciegas entre las dos cartas ya es mandar la tuya.

### 5.3 [R4] Resolución

Gana la stat más alta. El margen decide el tipo de victoria:

| Margen | Resultado |
|---|---|
| **10 o más** | Finish (KO o sumisión) |
| **4-9 [R4]** | Decisión |
| **1-3 [R4]** | Combate reñido: azar ponderado **55/45 [R4]** |
| **0 [R2]** | Empate exacto: moneda al aire, 50/50 |

**[R4] Por qué se estrecha el reñido y se aplana su sorteo.** [R3] ya había bajado el finish de 13 a
10 al pasar al roster real. Con la banda de oro en 74-89, la franja de reñido de 1 a 5 se comía casi
todos los duelos entre cartas parecidas. Ahora la decisión empieza en 4 y el reñido queda en 1-3 —
tres puntos de diferencia—, y por eso su sorteo pasa de 65/35 a **55/45**: dar al alto dos de cada
tres por una diferencia mínima es demasiado premio.

La penalización de **-6 por cruzar de división no cambia**. Con la tabla nueva sigue haciendo lo que
tiene que hacer: convierte una ventaja cómoda en moneda al aire sin regalar el duelo.

> **[R2] El empate exacto es su propio caso.** Con margen 0 no hay "el alto" al que dar el 65%: los
> dos números son el mismo. Meterlo en el cajón de "reñido" no cambiaba el resultado del sorteo, pero
> sí lo que el juego le contaba al jugador. Es un caso frecuente: sale en torno al 8-16% de los
> duelos.

### 5.4 [R4] Victoria

- **A 4 victorias**
- Si acaba **3-3**, el primer criterio son los **finishes**: gana quien haya acabado más peleas antes
  de tiempo. Es lo justo — dos peleadores con el mismo marcador no han hecho lo mismo si uno ha
  ganado noqueando y el otro por decisión ajustada
- **Solo si también van igualados a finishes** se juega el duelo de desempate: división del veto
  aleatorio, **stat al azar** entre las 6, cartas frescas (esa división no se ha jugado)
- En el desempate no hay cambios de división ni jugadas: no hay divisiones contiguas en juego

Así el azar decide lo último de lo último, y solo cuando de verdad no hay nada que separe a los dos.
Era una propuesta abierta en el anexo B y queda cerrada.

---

## 6. [R4] Cambios de división — solo defendiendo

- **[R4] Solo lo puede hacer quien defiende.** El que declara elige división y stat: ya tiene toda la
  iniciativa del duelo, y darle además mover cartas es darle dos jugadas en la misma mano. El cambio
  es una **respuesta**, y por eso vive en la pantalla del defensor
- Solo entre **divisiones contiguas** y ambas en juego
- **Salto máximo de una** división
- **Intercambio obligado:** si subes tu ligero al welter, tu welter baja al ligero
- **Una sola vez por partida** — es "tu jugada", el mismo recurso que los rasgos

### Penalizaciones

| Movimiento | Penalización |
|---|---|
| **Subir** de división | -6 a GOLPEO, LUCHA y DUREZA |
| **Bajar** de división | -6 a CARDIO y DUREZA (corte de peso) |

El -6 no es arbitrario: basta para convertir cualquier victoria por decisión en un combate reñido.
Las stats no penalizadas quedan intactas. La carta se muestra con los números ya ajustados en rojo.

> **[R2] Cuidado con la contigüidad.** Las dos escaleras de peso son independientes (no hay puente
> entre géneros) y los vetos dejan solo 6 divisiones de 11. La cuenta: de los 462 repartos posibles
> de 6 divisiones, **solo 5 no dejan ninguna pareja contigua** — un 1%. O sea que el cambio de
> división casi siempre está disponible. El que sí sufre es el **Incómodo normal**, que necesita una
> contigua concreta: es inusable en torno al 22% de las veces en el centro de la escalera y hasta el
> 50% en los extremos. De ahí que el plus valga tanto.

---

## 7. Rasgos

**Una activación por partida**, compartida con el cambio de esquina. Puedes llevar los rasgos que
quieras en plantilla, pero solo usas uno.

Los rasgos están **ocultos** hasta que se usan. Al activarse, se muestra claramente cuál ha sido — si
no, el jugador no entiende por qué ha pasado lo que ha pasado y piensa que hay bugs.

> **[R2] Ningún rasgo se activa solo. Nunca.** Ni el del jugador ni el de la máquina en su nombre.
> Cada rasgo lo activa su dueño, en el momento, y **eligiendo con qué stat** cuando el rasgo lo
> admita. Es consecuencia directa de que la activación sea única: un rasgo que salta por su cuenta te
> está gastando el único recurso de la partida sin preguntarte. En las partidas en vivo esto cuesta
> una ida y vuelta más por duelo, y merece la pena.

**Principio de diseño:** el plus no es un número mayor, es **una restricción menos**.

### [R4] CAMALEÓN — solo defendiendo
*Solo peleadores con historial real en dos divisiones (McGregor, Cejudo, Adesanya, Jones, Cormier,
Nunes, Shevchenko, Penn...)*

**[R4] Solo lo puede usar quien defiende**, por lo mismo que el cambio de división: el que declara ya
elige división y stat, y darle además mover cartas es darle dos jugadas en la misma mano. El Camaleón
es una **respuesta** a lo que te han declarado.

- **Normal:** cuando te declaran, mandas tu Camaleón a pelear ese duelo desde una división contigua
  **sin penalización**. La carta que tenías en la división declarada **se descarta sin pelear**, y el
  Camaleón **sigue disponible para su propio duelo**.
- **Plus:** lo mismo, pero **no consume tu jugada** de la partida.

### INCÓMODO

- **Normal:** ocultas la división. El sistema enseña al rival **dos cartas suyas** — la de la
  división real y una contigua. Elige a ciegas. Si acierta, duelo limpio. Si falla, su carta come
  **-6**. Solo se puede usar si los vetos han dejado dos divisiones contiguas en juego.
- **Plus:** se enseñan la de la división real y **una aleatoria de cualquier división en juego**. Si
  falla, **-12**. Se puede usar siempre, porque no necesita contigüidad.

En el plus no se enseñan tres cartas contiguas: la de en medio delataría la respuesta.

> **[R2] Qué pasa exactamente con las cartas.** Estaba sin especificar y se resolvió mal en la
> primera implementación. La regla correcta:
>
> - **La carta de la división real siempre queda fuera**, acierte o falle. Si acierta, porque ha
>   peleado su duelo. Si falla, porque se descarta sin pelear: ese duelo acaba de jugarse con otra
>   carta y ella ya no tiene duelo al que ir.
> - **La carta enviada pelea el duelo declarado** con la penalización, y luego pelea también el suyo,
>   sin penalización. No cambia de hueco.
> - **No hay intercambio de huecos.** Se probó y estaba mal: con el plus podía acabar mandando un
>   mosca a pelear en pesado más tarde, y castigaba dos veces el mismo fallo.
>
> Un fallo, un castigo. El Incómodo ya es fuerte con eso.

### [R4] ESPECIALISTA — impone su stat
*Va asociado a una stat concreta*

**Cambia entero respecto a [R3].** El Especialista ya no salva stats del pool: **arrastra el duelo a
lo suyo**.

- **Normal:** el duelo se pelea **en su stat**, en lugar de la que se había declarado.
- **Plus:** lo mismo, y además se puede usar **aunque ya hayas gastado tu jugada**.

Es la respuesta natural de un especialista: te han declarado donde a él no le conviene y él lleva la
pelea a su terreno. Solo tiene sentido si su stat **sigue viva** en el pool y **no es ya** la
declarada; si no, el botón no aparece.

Lo puede activar tanto quien declara —eligiendo la stat— como quien defiende, en la pantalla de
mandar su carta.

### [R4] VETERANO — su stat no se gasta
*Solo peleadores con carrera larga de verdad*

**También cambia entero.** El Veterano se queda con lo que hacía el Especialista, que es donde encaja
mejor: un veterano sabe administrar, no sabe cambiar de pelea a mitad.

- **Normal:** si **gana** su duelo, la stat de ese duelo **no se gasta** del pool compartido.
- **Plus:** la stat no se gasta **aunque pierda**.

La stat revive **para los dos jugadores**. El pool es compartido: si reviviera solo para uno, habría
dos listas distintas y el sistema se rompe. Es un rasgo generoso y ahí está su gracia — le devuelves
una opción al rival, así que tienes que estar seguro de que en esa stat mandas tú.

**En el duelo 6 no se puede activar**: es el último, y una stat que vuelve al pool ya no la va a usar
nadie. **El botón sale apagado con el motivo escrito.** Se pierde el recurso por mala gestión, pero
no parece un bug.

> **[R2] Se decide en la pantalla en la que mandas tu carta**, no en una pantalla aparte. Es la misma
> ventana en la que el defensor toma todas sus decisiones.

### Regla general

**No se contrarresta un rasgo con otro.** Se descartó explícitamente para no convertir el duelo en
cadenas de respuestas, que en móvil es inmanejable.

---

## 8. Producto y PvP

- **Partidas en vivo, online.** Por turnos, así que la latencia da igual y el servidor es barato
- **[R4] Reloj de 25 segundos por decisión.** Lo lleva el servidor, no el móvil: si el reloj se agota
  juega por ti y la partida sigue. Un rival que se queda mirando no puede congelar la partida
- **Abandono = rendición.** Gana el otro. Y **[R4] cerrar la aplicación es abandonar**: el servidor
  da un margen corto por si es un túnel o un cambio de red, y pasado ese margen da la partida por
  perdida
- **[R4] Botón de rendirse**, explícito. Si vas 0-4 y quieres empezar otra, poder decirlo es mejor
  que obligarte a jugar tres duelos de trámite o a cerrar la aplicación
- **[R4] Chat dentro de la partida.** Se juega contra una persona; que no se pueda ni saludar es raro
- **Dos modos de emparejamiento:**
  - **Normales:** cualquier emparejamiento, para probar plantillas y estrategias
  - **Competitivas:** partidas de posicionamiento → liga → ascensos

### 8.1 [R2] Cómo se juega en vivo, en concreto

- **Salas por código de 6 letras.** Uno crea sala, dicta el código, el otro lo escribe. Se acabó
- **Sin cuentas, sin registro, sin configurar nada.** El jugador no crea nada y no se entera de que
  existe un servidor. La dirección viene dentro de la aplicación
- **Un solo servidor para todos**, alojado por quien mantiene el juego
- **El servidor es el árbitro**, y esa es toda la razón de que exista. Las cartas están ocultas, así
  que la plantilla del rival no puede vivir en el móvil del otro: el servidor solo manda las cartas
  de las divisiones ya resueltas. Al terminar la partida se revela todo
- **El servidor y el juego comparten el mismo reglamento, el mismo archivo.** Si divergieran, el
  servidor estaría arbitrando un juego distinto del que la gente cree estar jugando
- **El servidor no se fía del cliente:** valida la plantilla al entrar (11 divisiones, todas
  alineables, sin peleador repetido) y rechaza cualquier jugada fuera de turno o ilegal
- **Reconectar recupera la partida** en el punto exacto en que se dejó
- **Que sobre una pulsación no es hacer trampa.** Hay botones que ven los dos jugadores y los dos
  pueden pulsarlos casi a la vez. El segundo no ha hecho nada mal: su mensaje sobra y **se ignora, no
  se rechaza con un error**

### 8.2 [R2] Retar plantillas es un modo aparte

Existe un segundo modo, asíncrono: tu plantilla se convierte en un código de texto que mandas por
donde quieras, y quien lo pega pelea contra tu plantilla real cuando le venga bien. El resultado
vuelve como otro código.

Aquí sí juega la IA por el ausente, porque no está delante, y el marcador va por confianza. Es
deliberado y es un modo distinto: no sustituye ni se confunde con la partida en vivo. Los dos modos
van separados en el menú y cada uno dice lo que es.

---

## 9. Economía (bloque abierto)

Lo cerrado hasta ahora:

- **Sin casa de subastas.** El único movimiento de cartas entre jugadores es el trueque de la sala de
  intercambio
- **Sobres gratis con drop bajo:** lo normal es que salgan peleadores mediocres, con muy poca
  probabilidad de cartas buenas
- **Divisa del juego** para comprar sobres especiales. Se gana jugando partidas, cumpliendo objetivos
  y por logros
- **Los sobres se acumulan sin caducar.** Es deliberado: guardar veinte o cincuenta para abrirlos de
  golpe es uno de los momentos que más engancha en Pacybits/MadFUT
- **SBC / desafíos** para cartas exclusivas y especiales
- **Sets de colección** por gimnasio, promoción y nacionalidad, que desbloquean cartas especiales no
  obtenibles de otra forma. Es lo que da valor a las cartas flojas

### 9.1 [R2] El sobre básico

Es la pieza que sostiene el bucle diario, y tiene reglas propias:

- **Ilimitado y siempre disponible.** Nunca se agota ni hay que esperar a que aparezca
- **Se abre directamente, en el sitio.** No se reclama para abrir después
- **De uno en uno.** Lo que hace especial abrir veinte de golpe es precisamente que no puedes hacerlo
  con el básico
- **Tasa muy baja arriba.** Que salga un campeón o un top 5 tiene que ser casi imposible

**Todos los sobres del juego entregan 9 cartas.** Lo que cambia entre ellos son las probabilidades,
no la cantidad: así el jugador compara sobres por una sola variable.

**[R3] No pueden salir cartas repetidas dentro del mismo sobre.**

> **[R4] Y el básico no se encadena desde la apertura.** Ofrecer "abrir otro" al final de cada sobre
> convierte esa pantalla en una palanca de la que no sales. El gratis se reclama en la pantalla de
> sobres y en ningún otro sitio. Lo que sí se encadena es lo que ya tienes guardado, que es finito.

#### [R4] Dropeo de los tres sobres

Cada sobre determina primero cuántos oros trae; el resto hasta nueve se rellena con platas. Después,
cada oro tira su nivel por separado.

| | Básico (gratis) | Plata (barato) | Oro (divisa alta) |
|---|---|---|---|
| **Oros por sobre** | 3 (15%) · 4 (35%) · 5 (35%) · 6 (15%) | 1 (40%) · 2 (40%) · 3 (20%) | 7 (30%) · 8 (45%) · 9 (25%) |
| Campeón o Top 5 | **0,01%** | 0,30% | 0,60% |
| Top 6-11 | **0,09%** | 2,00% | 3,20% |
| Top 12-15 | **3,90%** | 40,00% | 46,20% |
| Oro sin rankear | **96,00%** | 57,70% | 50,00% |
| **Platas: alta / baja** | 40 / 60 | **8 / 92** | 55 / 45 |

*Los porcentajes de las cuatro filas centrales son **por cada oro**, no por sobre.*

**Lo que sale en la práctica:**

| | Oros | Platas | Rankeadas | 1 rankeada cada | ≥1 del Top 11 o mejor | ≥1 corona |
|---|---|---|---|---|---|---|
| **Básico** | 4,50 | 4,50 | 0,18 | 6 sobres | 0,46% | 0,048% |
| **Plata** | 1,80 | 7,20 | 0,76 | 2 sobres | 4,02% | 0,54% |
| **Oro** | 7,95 | 1,05 | 3,98 | 1 sobre | 26,35% | 4,64% |

**Los tres sobres no son el mismo sobre a tres precios.** Es el error de lectura fácil y hay que
dejarlo escrito: el básico **no** es una versión peor del de plata. Cada uno hace una cosa distinta,
y por eso no se comparan por cuántos oros dan.

- El **básico** reparte **mitad oros y mitad platas**. Los oros son lo que permite montarse un once
  desde el primer día sin gastar nada, pero **casi todos son sin rankear**: cae un clasificado cada
  seis sobres, y cuando cae, **el 97,5% de las veces es del 12-15**, la cola de la tabla. Del 11 para
  arriba la probabilidad es simbólica y una corona es una entre dos mil. Se hace un equipo; no se
  hace un equipo de campeones, y no se hace por acumulación
- El **de plata** se compra para **cerrar la colección de platas**, que es lo que desbloquea las
  cartas especiales. Trae 7,20 platas contra 1,80 oros, y **el 92% de esas platas son bajas**: las de
  arriba son las que cuesta completar, y si cayeran por igual el sobre se quedaría sin recorrido a
  las pocas compras
- El **de oro** es el caro y el único que reparte cartas de arriba de verdad

Lo que sí tiene que crecer con el precio es **la carta alta**, y crece: 0,46% → 4,02% → 26,35%.

#### [R4] Los niveles de un sobre no son los tramos de estatus

Son dos cosas distintas y conviene no confundirlas:

- El **estatus** ordena la colección y pone el precio del reciclaje. Va por bloques de cinco puestos:
  campeón, Top 5, Top 6-10, Top 11-15, oro sin rankear, plata
- Los **niveles de sobre** deciden qué sale al abrir, y necesitan más filo: el básico tiene que poder
  repartir un 12-15 de vez en cuando **sin repartir nunca un 11**. Por eso el corte está en **corona
  (C y 1-5) · Top 6-11 · Top 12-15 · oro sin rankear**, donde manda el reparto

Y las **platas se parten en dos** —alta y baja— por la suma interna de sus seis stats. El tercio de
arriba son las altas.

#### [R4] Cómo se abre un sobre: el walkout

Dos pasos, y ya:

1. **El walkout:** la mejor carta de las nueve ocupa casi toda la pantalla, pero **vacía**, y se va
   llenando por partes.
2. **Un toque encima** y sale el sobre entero.

No hay botón de continuar ni se van pasando una a una. Nueve cartas de una en una son ocho toques de
puro trámite, y el momento que engancha —ver qué te ha tocado— es justo el que se diluye
repitiéndolo.

La carta se destapa **por partes y en un orden que va de lo que menos dice a lo que más**:

1. **Nacionalidad** — la bandera, abajo
2. **Peso** — la sigla, al lado
3. **Récord** — en el panel blanco
4. **Ranking** — la pestaña de arriba, y solo si lo tiene
5. **El peleador** — su icono, el nombre y las seis stats

Cada dato estrecha el cerco. Cuando ya sabes que es un pesado invicto, el ranking es la última carta
boca abajo. Todo ocurre **sobre la propia carta**, en su hueco: no hay panel, ni lista, ni ventana
aparte. Lo que se está viendo es la carta llenándose.

**Nada de esto puede parpadear.** La carta está en pantalla de principio a fin y no se mueve: sus
partes solo **aparecen**, y para eso únicamente se toca la opacidad. Ni saltos, ni escalas, ni
temblores. Es una regla dura de implementación, no un detalle estético: pasar de una fase a otra
repintando la pantalla destruye la carta y la vuelve a crear, y durante un fotograma no hay carta —
eso es el parpadeo. El nodo de la carta se crea **una vez** en toda la apertura.

**El resplandor de detrás va del nivel que viene**, así que la pantalla te está diciendo si viene
algo bueno antes de que leas una palabra. Es deliberado: esa tensión es el momento, más que la carta.
Y al completarse, **una franja de luz barre la carta entera** una sola vez.

Dos condiciones para que no canse, y son innegociables porque el sobre básico es ilimitado:

- **Dura poco** — 1,4 s por una plata, 1,7 s por un oro
- **Se salta tocando.** Quien va por su sobre número cuarenta no puede estar obligado a mirarlo
- [R5] **La excepción es el campeón y el top 5**, que duran 8,89 s porque van con el anuncio. Ahí la
  espera *es* el premio

#### [R4] El sonido

**Sintetizado, salvo una excepción.** Todo el sonido del juego se genera con Web Audio, sin archivos.
Tres razones y en este orden: no hay licencias que arrastrar —y el proyecto ya carga conscientemente
con las de usar peleadores reales—, no suma un byte a la aplicación, y funciona sin conexión.

[R5] La excepción es **el anuncio de campeón y top 5**, que sí es un archivo (146 KB). Está más abajo,
y se justifica precisamente por ser una excepción.

- Cada dato que cae suena **un tono más agudo que el anterior**, así que la escalera va contando sola
  lo que queda para ver la carta
- El **ranking** entra más fuerte y con un golpe detrás
- El **campeón** se lleva la **campana del octógono**. Es lo único reservado a la corona

Dos cosas que son de la plataforma, no del diseño: los móviles no dejan sonar nada hasta que hay un
toque, así que el contexto de audio se crea **dentro** del toque que abre el sobre; y en iPhone la
aplicación **calla si el móvil está en silencio**, que es lo correcto.

##### [R5] El anuncio, y por qué es la única excepción

Hay **un** sonido que sale de un archivo: el anuncio de ring, y suena **solo cuando la mejor carta
del sobre es un campeón o un top 5**.

Reservarlo es todo el diseño. Sonando en cada sobre sería ruido al décimo, y además taparía lo que el
sonido sintetizado ya cuenta: lo grave o agudo que entra dice el nivel antes de que se vea nada.
Guardado para las dos categorías que importan, **el sonido mismo es la noticia** — lo oyes y ya sabes
lo que ha caído, antes de mirar.

Cuando suena, **manda el clip y la revelación va detrás**: la carta arranca vacía —solo el marco— y
cada parte se enciende contra la forma del audio. La voz entra a los 0,9 s, y entre el 5,7 y el 6,4
hay un valle antes del tramo final: ahí es donde entra el peleador con sus stats.

| Qué se destapa | Cuándo |
|---|---|
| Nacionalidad | 0,9 s |
| Peso | 2,1 s |
| Récord | 3,4 s |
| Ranking | 4,9 s |
| El peleador y sus stats | 6,5 s |
| La carta queda suelta | 8,89 s, con el final del clip |

Tres decisiones que no se ven pero sostienen esto:

- Los pasos se programan **todos contra el mismo cero**, no encadenados. Encadenados, cada tirón del
  navegador se sumaba al siguiente y la revelación se estiraba; contra un audio fijo, se habría
  descuadrado sola
- Suena con `<audio>` y **no** con Web Audio: Web Audio necesita el archivo descodificado, y para eso
  hace falta `fetch()`, que no puede leer un archivo de al lado cuando el juego se abre con `file://`
- Saltarse la revelación **apaga el anuncio con un fundido**, no lo corta en seco

Esto abre un frente de licencias que antes no existía: hasta aquí no había un solo archivo de audio
y ahora hay uno. Queda anotado junto a lo de usar peleadores reales, en el apartado 10.

Hay un **interruptor de sonido en Más**, y se recuerda entre sesiones.

### 9.2 [R3] Fichas de intercambio

Se consiguen reciclando **repetidos**. El ratio va por **tramo deportivo**, no por rareza:

| Reciclas | Obtienes |
|---|---|
| 1 repetido de campeón o top 5 | 1 ficha |
| 4 repetidos del top 6-15 | 1 ficha |
| 10 repetidos de oro sin rankear | 1 ficha |
| 30 repetidos de plata | 1 ficha |

**[R4] La primera copia de una carta no se recicla nunca.** Da igual lo que sea: si solo tienes una,
no se toca. Reciclar no puede vaciarte la colección, que es lo que da las cartas especiales.

**Cada ficha sale de un solo tramo: no se mezclan.** Si tienes 3 repetidos del top 6-15 no tienes
nada hasta juntar el cuarto. Si se pudieran combinar, un jugador con muchas platas repetidas iría
rellenando huecos y las fichas saldrían demasiado rápido.

**Por qué se abandona el 1 oro = 1 ficha.** Ese ratio se fijó cuando el oro era escaso. Con el roster
real, el oro es mayoría de la capa alineable y el sobre básico entrega varios oros: con el ratio
antiguo, 100 sobres básicos generaban cientos de fichas y la sala de intercambio dejaba de costar
nada. Reciclando por tramo, el campeón repetido sigue dando su ficha entera pero el oro del montón
cuesta diez. Y de paso desaparece un incentivo perverso: con el 1:1, triturar campeones era la forma
más rápida de farmear fichas.

**La ficha no es el precio de una carta: es la entrada a la sala de intercambio.** No mide valor, no
se usa para pagar diferencias. Solo abre la puerta. Eso es lo que le da peso: entrar cuesta cartas
trituradas, así que salir de vacío duele.

### 9.3 La sala de intercambio

- **Entrar cuesta 1 ficha.** Emparejamiento a ciegas con otro jugador
- **Solo se cambian cartas por cartas.** Ni divisa, ni fichas encima para compensar. Trueque puro
- **Hasta 3 huecos por lado**, con cualquier combinación
- **Lista de deseos pública**, estilo Pacybits/MadFUT. No sirve para emparejar: sirve para que el
  otro vea qué buscas

El valor no lo fija el sistema, lo fijan los dos jugadores en el momento. Como no hay precios, no hay
inflación ni especulación, y las fichas solo aparecen destruyendo cartas — es una economía que se
vacía sola.

### 9.4 [R2] Carta con rasgo al empezar — decidido

El jugador nuevo arranca con una carta de rasgo fija, **normal** (nunca plus), la más floja que
cumpla, y marcada como **no traspasable**. Como los rasgos son la única jugada de la partida, un
novato sin ninguna juega sin herramienta. Es una herramienta, no un regalo, y por eso no se puede
intercambiar.

**[R4] Y el arranque cubre las once divisiones**, con una plata por división y sin repetir peleador.
Hay quien tiene carta de plata en dos divisiones, y si al sortear cae el mismo en las dos, una
división se queda sin nadie alineable y el jugador nuevo no puede ni empezar.

### Recomendaciones pendientes de decidir

- Los sets deberían pedir peleadores de divisiones distintas, para que haya que perseguir cartas que
  no te sirven en plantilla

---

## 10. Licencias (sin resolver)

Usar nombres, apodos e imagen de peleadores reales requiere derechos de imagen individuales. La marca
UFC está licenciada en exclusiva a EA.

**Riesgo asumido conscientemente.** Mitigaciones prácticas a valorar antes de monetizar:

- **Roster como datos, no como código.** Nombres, apodos y arte en configuración, para poder
  cambiarlos sin tocar el juego
- **Arte ilustrado propio**, nunca fotos de prensa
- **Cero marcas de promotoras:** ni logos, ni cinturones, ni octógono reconocible
- Nada que sugiera respaldo o patrocinio de ningún peleador
- Las promotoras pequeñas son bastante más accesibles para acuerdos directos que las grandes

[R5] **Y ahora también el audio.** El anuncio de campeón y top 5 es una grabación de la voz de un
anunciador real, sacada de un banco de sonidos. Hasta aquí el juego no tenía un solo archivo de audio
y ese frente no existía; ahora existe. Va en el APK y en el `.ipa`, que se publican en un repositorio
público. La mitigación es la misma que para el arte: **el sonido está en un archivo aparte**
(`juego/sonidos/`) y se cambia por una grabación propia sin tocar una línea de código.

*(No soy abogado. Esto es orientación práctica, no asesoramiento legal — antes de monetizar conviene
consultarlo con un profesional.)*

---

## 11. [R2] Enseñar a jugar

El juego tiene pool compartido de stats, vetos, una única activación por partida y cuatro rasgos con
versión plus. Es demasiado para descubrirlo solo, y un tutorial de pantallas de texto no se lee.

**Partida tutorial.** Una partida de verdad, con el mismo motor y las mismas reglas —no hay guion ni
nada simulado, así que todo lo que enseña es cierto—, contra un sparring y con una **plantilla
prestada**. Que sea prestada es lo que permite jugarla nada más instalar, antes del primer sobre.

- **Las dos plantillas se eligen del catálogo** para que los rasgos salgan seguro. La del jugador
  lleva Veterano, Especialista y Camaleón; la del sparring, Incómodo
- **Un entrenador habla cuando toca y no antes:** cada aviso está atado al momento en que ese
  concepto aparece en pantalla. Se puede cortar de un botón en cualquier momento
- **No cuenta en el registro de partidas.** Se juega con plantilla prestada contra un sparring;
  sumarlo a las victorias sería mentir en la propia ficha del jugador
- **Terminarlo entrega una recompensa de arranque**, una sola vez

**Los conceptos, en el orden en que se aprenden.** Trece avisos cortos, uno por concepto: qué es la
partida (11 peleadores, 6 duelos, a 4) · vetar o declarar · los vetos y el veto aleatorio · leer el
tablero · elegir peleador tocando su carta · las seis stats · tu única jugada · los cuatro rasgos y
el plus · defender y mandar tu carta · la tabla de márgenes · el Incómodo · el desempate · el cierre.

Si el jugador se salta un aviso porque actuó antes de leerlo, ese aviso **vuelve a aparecer** la
siguiente vez que su concepto sale en pantalla.

**Pantalla de reglas.** El tutorial enseña jugando; las reglas escritas son el papel al que se
vuelve. Ahí no se resume: están los números exactos, porque la duda que lleva a alguien a esa
pantalla suele ser justo la del número.

---

## 12. Pendiente

**Datos** *(nuevo en [R4], y es lo más importante del bloque)*

- **La calidad de la oposición.** La corrección 1 de §2.3 sigue sin poder aplicarse: la base guarda
  el récord, no contra quién. Sin datos de rival por combate no se puede calcular, solo juzgar. Es lo
  que separa "buenas estadísticas" de "buen peleador", y hoy el roster no lo distingue
- **Reescalar las platas.** Banda declarada 64-82, datos de 68 a 82, y 121 de 158 empatadas en 82 de
  DUREZA

**Diseño**

- Cuántas cartas tendrá el juego en total. Sin casa de subastas, ese número decide si un set de
  gimnasio es alcanzable o imposible
- **Profundidad de las divisiones femeninas.** Con PvP solo UFC, las 3 femeninas salen de un roster
  corto. Son el 27% de cada plantilla
- **El sobre que decepciona.** Sacar un peleador buenísimo de KSW y no poder alinearlo puede sentirse
  como un mal tirón
- **El 3 por 1 y las cuentas secundarias.** Si se pueden dar tres platas por un oro, dos cuentas del
  mismo dueño se vacían la una en la otra. Se tapa limitando la diferencia de estatus dentro de un
  mismo trueque
- **¿Entran al trueque las cartas de set y las de rasgo?** Si son intercambiables, quien tenga stock
  consigue las recompensas de los desafíos sin jugarlos
- Ritmo de sobres y recompensas: es la columna vertebral del juego
- Diseño concreto de los SBC
- Modos fuera del PvP: draft, modo carrera
- Nombre del juego

**Medido en el prototipo, pendiente de ajustar**

| Métrica | Antes de [R4] | Después de [R4] | Objetivo del GDD |
|---|---|---|---|
| Partidas que llegan a 3-3 | ~17% | **33,3%** | ~33% |
| Finish (margen 10+) | ~3% | **8,8%** | *se acepta que sea raro* |
| Decisión (4-9) | ~23% | 32,4% | — |
| Reñido (1-3) | ~58% | 47,1% | — |
| Empate exacto | ~16% | 11,8% | — |
| Jugada usada | ~50% | 66,7% | >80% |
| Duelo 6 con elección real | 0% | **16,7%** | — |

**Y esto no se buscó.** Las tres métricas se acercaron a su objetivo como efecto secundario de
arreglar LUCHA: al recuperar la stat su recorrido real —el suelo pasó del 40% de las cartas al 6%—
las diferencias entre cartas dejaron de ser todas de uno o dos puntos. Es la prueba de que el
problema no era la tabla de márgenes sino los datos que entraban en ella. Se descartó estirar las
stats de la élite para forzar finishes (ver §2.4) y no hizo falta: bastó con que una stat midiera lo
que decía medir.

Las dos que hay que mirar:

- **El duelo 6 no es una decisión.** Al llegar queda una división y una stat: no se declara nada, se
  ejecuta. Hay que decidir si se asume o si el sexto duelo cambia de forma
- **La jugada se queda sin usar demasiado.** Que un tercio de las partidas termine sin gastar el
  único recurso disponible apunta a que las condiciones para usarlo son demasiado estrechas, o a que
  no se ve bien que está ahí

**A validar con personas**

- ¿Declarar 3 veces desequilibra, aunque se compense con el rol?
- ¿Compensa de verdad cruzar división a -6?
- ¿El Camaleón gana demasiado? Palanca de ajuste si hace falta: que la carta descartada cuente como
  duelo perdido en vez de desaparecer
- ¿El Incómodo, con la regla de descarte ya corregida, sigue siendo demasiado fuerte?

**Producto**

- Qué pasa con las desconexiones (distinto del abandono voluntario)
- **Arranque el día 1:** sin jugadores conectados, el emparejamiento en vivo no funciona. Las salas
  por código lo esquivan mientras no haya masa crítica, pero no lo resuelven
- ~~Reloj de 20-30 segundos por decisión: está en el diseño, no en el prototipo~~ — **[R4] hecho**:
  son 25 segundos, los lleva el servidor y si se agotan juega por ti
- **Identidad:** hoy es un identificador del propio móvil. Vale para jugar con amigos, no para una
  liga competitiva

---

## Anexo A · [R2] Resumen de cambios

| # | Punto | Qué cambia |
|---|---|---|
| 1 | §5.3 | El **empate exacto** (margen 0) es su propio caso y se resuelve **50/50**, no 65/35 |
| 2 | §5.2 | **El duelo no se resuelve solo**: el defensor manda su carta a mano |
| 3 | §5 | Se **declara tocando la carta** y se elige la stat sobre ella |
| 4 | §7 | **Ningún rasgo se activa solo**: siempre lo decide su dueño, y elige con qué stat |
| 5 | §7 INCÓMODO | La carta de la **división real siempre queda fuera**; la enviada pelea los dos duelos; **no hay intercambio de huecos** |
| 6 | §4.1 | **El que empieza una no empieza la otra**; contra la IA **no hay dado**; y qué significa cada opción, con su tabla |
| 7 | §8.1 / §9.1 | PvP en vivo **por código de sala, sin cuentas, un solo servidor**; una pulsación que sobra se ignora; sobre básico **ilimitado, directo, de uno en uno**; **9 cartas** en todos los sobres |
| 8 | §11 | **Partida tutorial** de trece avisos y **pantalla de reglas** |

Cambios menores que no alteran ninguna regla de partida: §2.2 y §2.6 (las cartas de colección no
llevan sub-stats ni rasgos), §2.7 (mínimo de rasgos por clase en el roster), §9.4 (la carta de rasgo
inicial pasa de recomendación a decidida).

---

## Anexo B · [R3] Resumen de cambios

Cierra el bloque de datos: el roster real, las stats y la economía de sobres.

| # | Punto | Qué cambia |
|---|---|---|
| 1 | §2.3 | Se elimina la **media general**. La carta enseña seis stats y nada más. Descartadas también la ponderada, las estrellas y mostrar la stat más alta |
| 2 | §2.3 | Las seis stats se **derivan de UFCStats** con una fórmula, ponderando la calidad del rival y corrigiendo muestras cortas. La élite va anclada a criterio |
| 3 | §2.2 | Las **sub-stats no se usan** ni se puntúan. Anulado el aviso de los 18.000 números a mano |
| 4 | §2.4 | Bandas nuevas: **oro 74-89, plata 64-82**. Techo 89, de 90 arriba para especiales |
| 5 | §2.4 | La rareza sale de **cuatro vías**: ranking, racha de 3, dos peleas de título, o recorrido en UFC. El roster UFC es solo oro y plata |
| 6 | §2.6 | **Un solo atributo por carta**, solo en cartas de oro, y nunca en versión plus salvo el Camaleón+ de Makhachev |
| 7 | §2.6 | Un peleador puede tener **dos o tres cartas**; lo que no depende del peso no cambia entre ellas |
| 8 | §5.3 | Tabla de márgenes recalibrada a **10+ / 6-9 / 1-5**. El -6 por cruzar no cambia |
| 9 | §9.1 | **Dropeo de los tres sobres** cerrado. Sin repetidos dentro del mismo sobre |
| 10 | §9.2 | **Reciclaje por tramo** (1 / 4 / 10 / 30) en vez de por rareza. No se mezclan tramos |

---

## Anexo C · [R4] Resumen de cambios

Cierra el bloque de presentación y corrige los datos.

| # | Punto | Qué cambia |
|---|---|---|
| 1 | §2.3.1 | **Las tres correcciones de puntuación, aplicadas por fin.** Techo por puesto y regresión de muestras cortas. El número más alto de cada stat pasa a tenerlo un campeón o un top 5 |
| 1b | §2.3.1.1 | **LUCHA estaba midiendo otra cosa**: solo contaba derribos hechos, no la defensa. Dern, Sterling, De Ridder y Gaethje estaban en el suelo de la stat de lucha. Reconstruida con coherencia interna y 60 anclajes de criterio: el suelo pasa del 40% al 6% |
| 1c | §2.3.1.2 | **La técnica no cambia con la báscula.** GOLPEO, LUCHA y SUELO se igualan entre las cartas de un mismo peleador. La incoherencia pasa de 38/29/36 peleadores a cero |
| 2 | §2.3.2 | El orden va por **puesto real** —campeón, #1, #2… #15—, no por tramos de cinco. Un #11 iba detrás de un #15 si el #15 sumaba más |
| 3 | §2.3.3 | **El diseño de la carta**: marco de imagen, qué va en cada hueco, y todas las medidas sacadas de medir la propia imagen |
| 4 | §2.4 | **El finish raro, aceptado.** No se estiran las stats de la élite para forzarlo |
| 5 | §3.1 | La plantilla pasa a **3 + 3 + 3 + 2** con las dos últimas centradas, y el tamaño de carta **se calcula** contra el hueco real |
| 6 | §5.3 | Márgenes: decisión **4-9** y reñido **1-3**, y el reñido se reparte **55/45** en vez de 65/35 |
| 7 | §5.4 | A 3-3 **desempatan los finishes**; el duelo de desempate solo si también van iguales ahí. Cierra una propuesta abierta del anexo B |
| 8 | §6 y §7 | **Cambio de división y Camaleón son solo del que defiende.** El que declara ya elige división y stat |
| 9 | §7 | **Especialista y Veterano intercambian oficio**: el Especialista impone su stat, el Veterano evita que se gaste |
| 10 | §8 | En vivo: **reloj de 25 s**, **cerrar la aplicación es rendirse**, **botón de rendición** y **chat** |
| 11 | §9.1 | **Los tres sobres, reajustados.** El básico da mitad y mitad, un rankeado cada seis sobres y casi siempre del 12-15. Las platas se parten en alta y baja |
| 12 | §9.1 | **El walkout y el sonido**: la carta se llena por partes, sobre sí misma, sin parpadear, con sonido sintetizado |
| 13 | §9.2 | **La primera copia nunca se recicla** |

## Anexo D · [R5] Resumen de cambios

Ronda de presentación: la carta y el sonido.

| # | Punto | Qué cambia |
|---|---|---|
| 1 | §2.3.3 | **Ningún texto de la carta lleva desplazamiento vertical.** El que llevaban se había puesto sobre una medición falsa —la sonda de la línea de base caía dentro de un contenedor flex— y dejaba el nombre y los números un 1% de la altura por debajo, colgando del rombo y de la placa |
| 2 | §2.3.3 | Las tres filas de stats usan las alturas **leídas del dibujo** (76,05 / 82,33 / 88,71%) en vez de las apuntadas, que iban unas centésimas desviadas. Los números llenan el rombo de borde a borde sin desbordar |
| 3 | §2.3.3 | Nueva herramienta de comprobación, `medir-carta.mjs`: dibuja la carta a tamaño natural, la fotografía con y sin cada texto y se queda con la diferencia. No calcula, mide |
| 4 | nuevo | **interfaz.md**, el mapa de la distribución: los huecos del marco, las rejillas de cada pantalla y a qué tamaño se ve una carta en cada una. Es el documento de trabajo para rediseñar |
| 5 | §9.1 | **El anuncio de campeón y top 5.** Único sonido que sale de un archivo, y suena solo en esas dos categorías: reservado, el sonido mismo es la noticia |
| 6 | §9.1 | Cuando suena el anuncio, la revelación va detrás del clip: 8,89 s, con cada parte de la carta encendiéndose contra la forma del audio |
| 7 | §10 | Nuevo frente de licencias: hasta ahora no había un solo archivo de audio. El sonido va aparte, para poder sustituirlo por una grabación propia sin tocar código |

---

### Roster resultante

**402 cartas de 355 peleadores: 244 de oro y 158 de plata.** 57 países. **177 cartas rankeadas**, con
las once divisiones completas de campeón a #15, sin un solo hueco. 46 peleadores con carta en más de
una división. 114 cartas con atributo, todas de oro.

**Cerrado también:** la carta fuerte de Makhachev, que el anexo B dejaba abierta. Es **doble
campeón**, así que lleva carta de campeón en ligero y en welter, y eso no le quita a Gaethje la suya
de campeón actual de ligero.

### Lo que este bloque deja abierto

- **Los sets de colección.** Completar una colección entera —que incluye platas— desbloquea cartas
  especiales. Es lo que da sentido a las 158 platas. Falta definir qué sets hay y qué desbloquea cada
  uno
- **Los SBC.** Sin media general no pueden pedir "plantilla de media 84"; el sustituto es más
  temático —"un peleador con 85+ en suelo", "tres oros de divisiones distintas"— pero hay que
  escribirlo
- **La calidad de la oposición**, que es lo que falta para que las stats reflejen al peleador que se
  ve pelear y no solo sus números (ver §12)
