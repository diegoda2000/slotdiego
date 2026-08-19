# Juego de cartas de MMA — Documento de diseño

**Estado:** bloque de cartas y PvP cerrado **y construido**, con roster real de UFC y aplicación en
Android e iPhone. Economía fuera de los sobres, modos y licencias pendientes.
**Última actualización:** 19 de agosto de 2026 — **revisión 3**

> **Cómo leer este documento.** Las secciones marcadas **[R2]** y **[R3]** son cambios que salieron
> de construir el juego. Donde una sección [R3] contradice lo que el documento decía antes, **manda
> la [R3]**: las dos revisiones están resumidas en las tablas del final.

> **Qué ha cambiado, en dos revisiones.**
> **[R2]** — el juego dejó de estar solo sobre el papel: prototipo jugable, APK y partidas en vivo
> entre dos personas reales. Construirlo obligó a cerrar ocho puntos que el documento dejaba
> abiertos o mal resueltos.
> **[R3]** — entró el **roster real de UFC** y la aplicación salió también en iPhone, y con eso
> cayeron trece cosas más: desaparece la media de la carta, desaparece el bronce, cambian las
> franjas de margen, el Especialista y el Veterano intercambian oficio, y el reciclaje pasa a ir por
> estatus deportivo.

---

## 1. Concepto

Juego móvil de colección de cartas de MMA, estilo Pacybits/FUT: abres sobres, montas tu plantilla y peleas contra otros jugadores online.

**La plantilla es un peleador por división.** No eres promotor ni entrenador: montas el mejor roster posible cubriendo todas las divisiones.

**Peleadores reales.** Riesgo legal asumido conscientemente (ver sección 10).

**En PvP, solo UFC.** La plantilla de 11 se monta exclusivamente con cartas de UFC. Es lo que mantiene limpia la lógica de divisiones: KSW, Rizin y ONE usan categorías de peso distintas y encajarlas en las 11 de UFC ensuciaría todo el sistema de cruces y penalizaciones.

**En colección, no solo UFC.** Cage Warriors, KSW, Rizin, Invicta, LFA y regionales existen como cartas: entran en sets, se reciclan y se intercambian. Es el hueco de mercado frente a EA, que está atada a una sola promoción.

*Decisión marcada como provisional ("de momento"). Abrir el PvP a otras promotoras es una vía de crecimiento futuro, pero exige resolver antes el mapeo de divisiones.*

**Sin casa de subastas.** No se compran ni se venden cartas por dinero del juego: no hay precios, no hay especulación. Lo que sí hay es una **sala de intercambio** entre jugadores, de trueque puro (ver sección 9).

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

Cada stat es una **media global de ataque y defensa juntos**. No existe "derribos" separado de "defensa de derribo": el sistema compara números simétricamente (los dos peleadores hacen lo mismo a la vez), así que no hay atacante ni defensor.

Los nombres deben dejar claro que son capacidades globales. Por eso es LUCHA y no "derribos" — si se llama derribos, el jugador espera que un 90 derribe siempre.

> **Nota [R2] — las seis son las originales.** LUCHA y SUELO son dos stats distintas desde el principio
> y ninguna sustituye a nada: LUCHA es dónde se pelea (derribos, clinch, jaula) y SUELO es qué pasa
> una vez ahí (sumisiones, control, guardia). La única stat que sí se sustituyó en su día fue
> **VELOCIDAD → IQ**, y está recogida en el documento de decisiones descartadas.

### 2.2 Sub-stats (modelo FIFA)

Cada stat visible sale de la media de sus sub-stats internas. La carta enseña las 6 grandes; el sistema guarda el detalle.

- **GOLPEO** — potencia, precisión, volumen, boxeo, patadas, golpeo en clinch
- **LUCHA** — derribos, defensa de derribo, clinch, control contra la jaula, levantarse, transiciones
- **SUELO** — sumisiones, defensa de sumisión, control desde arriba, guardia, ground and pound, escapes
- **CARDIO** — resistencia, recuperación entre asaltos, ritmo sostenido, aguante en asaltos finales, eficiencia de movimiento, gestión del gas
- **DUREZA** — mentón, absorción de daño, resistencia a cortes, recuperación de aturdimiento, tolerancia al castigo corporal, voluntad
- **IQ** — lectura del rival, gestión de distancia, adaptación, control del octógono, defensa, gestión de asaltos

> **Aviso de trabajo:** 36 valores por carta. Con 500 cartas son 18.000 números a mano. Se puntúan las sub-stats y la grande sale sola, pero hay que contarlo en la planificación.

> **[R2] Las cartas de colección no llevan sub-stats.** Como no son alineables, sus 36 números no los
> usa nadie. Llevan solo las 6 grandes. Es la respuesta a la pregunta abierta de §11 y ahorra el 80%
> del trabajo de puntuación fuera del pool alineable.

### 2.3 [R3] No hay media general. Ninguna

Esta sección decía lo contrario y se sustituye entera. **La carta no tiene media, ni visible ni
guardada en el código.** No existe el número.

El motivo es el de siempre, llevado hasta el final: una media castiga al especialista. Un 92 de
golpeo con 60 en lo demás da media 65 y parece basura, cuando es una carta buenísima para declarar
golpeo. La solución de antes —enseñar la media *y* las stats altas— no arregla eso, solo añade un
número que el jugador va a usar igual para comparar. Se quita el número.

**La carta se lee por sus seis stats.** Eso es todo lo que hay.

#### Cómo se ordena entonces

Por **estatus deportivo**, que es lo que el jugador persigue de verdad:

1. Campeones
2. Top 5
3. Top 6-10
4. Top 11-15
5. Oro sin rankear
6. Plata

Dentro de un mismo tramo se desempata por la **suma interna de las seis stats**, que **no se enseña
nunca**, y si aún hay empate, por orden alfabético. Ese orden manda en todas partes: la colección,
el resumen de un sobre, y "Rellenar con lo mejor".

### 2.3.1 [R3] El diseño de la carta

La carta es un **marco de imagen** —uno de oro y uno de plata— con el texto colocado encima en
porcentajes medidos sobre la propia imagen. No hay una versión por tamaño: hay una sola que escala.

De arriba abajo:

- **Pestaña de ranking**: `#C` para un campeón, `#3` para un clasificado, vacía para el resto
- **Icono y nombre del atributo**, y el récord
- **Placa del nombre**, centrada en los dos ejes, con el tamaño de letra ajustado por nombre para
  llenar la placa sin salirse
- **Las seis stats**: el número dentro del rombo dorado o plateado, el nombre completo de la stat
  centrado sobre su línea
- **Al pie del panel blanco**: bandera del país, como imagen, y la sigla del peso (HW, LHW, MW…)

Nombre y pestaña de ranking llevan relieve y un reflejo cruzado, para que se lean como parte del
metal y no como una pegatina encima.

**El texto se mide contra el ancho de la propia carta**, no contra la pantalla. Se probó con
consultas de contenedor y hubo que cambiarlo: no existen en los WebView antiguos, y allí el texto
se quedaba en un tamaño fijo y se salía de los huecos en cuanto la carta era pequeña.

### 2.4 [R3] Rangos por rareza — solo oro y plata

El bronce **no existe**. Queda reservado por si algún día entran Cage Warriors, KSW, LFA y demás
promotoras, pero hoy son cero cartas.

| Rareza | Quién entra | Rango | Cartas |
|---|---|---|---|
| **Oro** | Rankeado, racha de 3+, 2+ peleas de título, o 12+ victorias UFC con +4 | 74-89 | 244 |
| **Plata** | Resto del roster UFC | 64-82 | 158 |
| Bronce | Otras promotoras (pendiente) | 55-74 | 0 |
| Especiales | Capa aparte | hasta 92 | — |

**Y esto tiene una consecuencia que hay que mirar de frente.** El reparto de antes —bronce 55-68
contra oro 75-88— era lo que hacía saltar la tabla de márgenes: oro contra bronce daba finish. Con
el roster real de UFC los números están **mucho más juntos**, porque los peleadores de verdad se
parecen más entre sí que las cartas inventadas. Medido sobre partidas completas, los finish caen al
**6-14%** de los duelos, frente al 52% que daba el roster inventado.

No es un fallo, es lo que pasa al usar datos reales, y hay que decidirlo a conciencia: o se acepta
que el finish sea raro y valioso —que es defendible, en MMA real también lo es—, o se estiran las
stats de la élite para volver a abrir el hueco. **Está sin decidir.**

### 2.5 Escala de habilidad, no de peso

Un 85 de GOLPEO vale lo mismo en mosca que en pesado. Las stats están ajustadas a la división donde compite cada uno.

**El peso solo importa cuando alguien cruza de división** y come penalización. No existe división dominante.

### 2.6 Reglas de carta

- Cada carta pertenece a una división
- **Solo las cartas de UFC son alineables.** Las de otras promotoras existen como cartas de colección: valen para sets, reciclaje e intercambio, pero no se pueden poner en la plantilla
- **[R2] Las cartas de colección no llevan rasgos.** Un rasgo en una carta que no se puede alinear es una promesa imposible de cumplir
- Un mismo peleador puede tener cartas distintas en divisiones distintas (McGregor pluma / McGregor ligero), con stats diferentes
- **Un peleador, un slot:** no puedes alinear dos versiones del mismo peleador a la vez
- Los rasgos van en versiones especiales; campeones y rankeados suelen llevar rasgo normal
- Una carta puede llevar hasta **dos rasgos** (dos plus, uno plus y uno normal, o dos normales). Deben ser rarísimas: aunque solo actives uno por partida, tener dos llaves en la misma carta es muy fuerte
- **Si una carta lleva dos rasgos, tienen que ser distintos.** Un Camaleón normal junto a un Camaleón plus en la misma carta no significa nada, porque el plus siempre es mejor y nunca usarías el normal

### 2.7 [R2] Reparto mínimo de rasgos en el roster

Los rasgos tienen requisitos: el Camaleón solo va en peleadores con historial en dos divisiones y el
Veterano solo en carreras largas. Si además se sortean por rareza, es perfectamente posible que **una
clase entera se quede en cero** y que un rasgo del diseño no exista en el juego. Pasó: la primera
versión del roster de prueba no tenía **ni un solo Veterano** en 215 cartas.

**Regla:** el roster garantiza un mínimo por clase de rasgo, repartido de mejor a peor carta. El
número exacto se ajusta al tamaño del roster final; en el prototipo son 8 de cada uno.

---

## 3. La plantilla

- **11 cartas, una por división:** 8 masculinas, 3 femeninas
- **Solo cartas de UFC.** Las de otras promotoras no son alineables (ver sección 1)
- **Sin banquillo.** Se descartó: con sets de colección como sumidero, el banquillo solo añadía gestión aburrida
- Puedes alinear **todas las cartas con rasgo que quieras**, y pueden repetir rasgo entre ellas. El límite está en cuántas puedes activar, no en cuántas puedes llevar
- Repetir rasgo no da potencia extra, porque solo activas uno. Da **fiabilidad**: si llevas tres Camaleones en divisiones distintas, es más probable que al menos uno quede en posición útil después de los vetos

---

## 4. Fase previa a la partida

1. **Elección de rol.** Los dos eligen a la vez: empezar vetando o empezar declarando. Si eligen distinto, cada uno a lo suyo. Si coinciden, dado y el más alto se queda lo que pidió.
   **[R2] El que empieza una cosa no empieza la otra**, siempre: es la contrapartida que equilibra el reparto, y por eso el dado se tira una sola vez y decide las dos.
   **[R2] Contra la IA no hay dado.** La máquina no compite por el rol: eliges tú y ella se queda lo otro. Un dado que le diera a la IA la primera declaración estaría quitándole al jugador su elección con azar, y eso solo tiene sentido cuando al otro lado hay una persona que también eligió.

   **[R2] Qué significa exactamente cada opción**, escrito así en la pantalla de elección porque es la parte que se malinterpreta:

   | Eliges | Vetos | Duelos que declaras |
   |---|---|---|
   | **Empezar vetando** | tiras el veto 1 y el 3 | **el primer duelo lo declara el rival**; tú declaras el 2, el 4 y el 6 |
   | **Empezar declarando** | el primer veto lo tira el rival | declaras el 1, el 3 y el 5 |

   Que el rival declare el primer duelo **no es un fallo cuando has pedido empezar vetando**: es
   literalmente lo mismo dicho de otra manera. Si algún día se decide que el rival no declare nunca
   el primero, entonces la opción de "empezar vetando" no puede existir — son incompatibles, y hay
   que elegir una de las dos.
2. **Vetos alternos y visibles.** 2 cada uno. Cada veto aparece en pantalla al hacerse, para que el otro pueda reaccionar.
3. **Veto aleatorio, al final.** Rompe planes ya construidos, que es donde más impacto tiene.
4. **La división del veto aleatorio será el desempate.** Los dos la ven desde el principio y condiciona toda la partida.
5. Quedan **6 divisiones en juego**, en orden visible desde el inicio.

---

## 5. El duelo

- Se declara **división + stat**
- **[R2] Se declara tocando la carta del peleador, y la stat se elige sobre esa misma carta.** No hay listas ni etiquetas de filtro: primero eliges quién pelea, después con qué. El jugador tiene que estar mirando al peleador cuando decide, porque la decisión es sobre él
- Declaraciones **3 y 3**, alternando. Empieza el que no empezó vetando
- **Las stats se gastan del pool compartido:** 6 stats, 6 duelos, cada stat se usa una vez y muere para los dos jugadores
- **Cada peleador pelea una sola vez** por partida
- Las cartas están **ocultas** hasta que se resuelve el duelo
- **Reloj de 20-30 segundos** por decisión

### 5.1 Por qué funciona el pool compartido

Declarar no es solo elegir tu terreno: es **quemar el terreno del otro**. Puedes declarar LUCHA no porque te convenga, sino para obligar al rival a gastar ahí antes de que esté listo.

Y guardarse una stat es un plan que el rival puede reventar. Si tienes un fenómeno en lucha y lo reservas para el final, el rival puede declarar lucha en el duelo 2 y romperte el plan.

Cada declaración es a la vez ataque y defensa. Eso es lo que sostiene la tensión hasta el último duelo.

### 5.2 [R2] El duelo no se resuelve solo

Declarar **no resuelve nada**. Cuando alguien declara, el otro tiene que **mandar su carta al duelo a
mano**: hasta que no pulsa, no pasa nada.

No es una formalidad, es donde vive media partida. Esa pantalla es la ventana del defensor para
reaccionar — es donde decide si usa **Veterano** para cambiar la stat, o **Especialista** si su carta
lo lleva en la stat declarada. Si la resolución fuera automática, el defensor no tendría turno y sus
rasgos tendrían que dispararse solos, que es exactamente lo que no puede pasar (ver §7).

La única excepción es el **Incómodo**: elegir a ciegas entre las dos cartas ya es mandar la tuya, y
pedirla otra vez sería pedirla dos veces.

### 5.3 Resolución

Gana la stat más alta. El margen decide el tipo de victoria:

| Margen | Resultado |
|---|---|
| **10 o más [R3]** | Finish (KO o sumisión) |
| **4-9 [R3]** | Decisión |
| **1-3 [R3]** | Combate reñido: azar ponderado **55/45** |
| **0 [R2]** | **Empate exacto: moneda al aire, 50/50** |

**[R3] Las franjas se estrecharon y el reñido se aplanó.** El finish baja de 13 a 10 y la decisión
de 7-12 a 4-9, porque con el roster real de UFC los números están mucho más juntos y con las franjas
anteriores casi no saltaba ningún finish. Y el reñido pasa de 65/35 a **55/45**: si la franja es de
solo tres puntos, dar al alto dos de cada tres es demasiado premio para una diferencia mínima.

**[R2] El empate exacto es su propio caso.** Con margen 0 no hay "el alto" al que dar el 65%: los dos
números son el mismo. Meterlo en el cajón de "reñido" no cambiaba el resultado del sorteo, pero sí
lo que el juego le contaba al jugador — decía 65/35 sobre un duelo que era 50/50, y con dos cartas de
97 en la misma stat eso se nota y parece trampa. Es un caso frecuente, no una rareza: en las
mediciones del prototipo sale en torno al 8-11% de los duelos.

### 5.4 [R3] Victoria

- **A 4 victorias**
- Si acaba **3-3**, el primer criterio son los **finishes**: gana quien haya acabado más peleas antes
  de tiempo. Es lo justo — dos peleadores con el mismo marcador no han hecho lo mismo si uno ha
  ganado noqueando y el otro por decisión ajustada
- **Solo si también van igualados a finishes** se juega el duelo de desempate: división del veto
  aleatorio, **stat al azar** entre las 6, cartas frescas (esa división no se ha jugado)
- En el desempate no hay cambios de división ni jugadas: no hay divisiones contiguas en juego

Así el azar decide lo último de lo último, y solo cuando de verdad no hay nada que separe a los dos.

---

## 6. [R3] Cambios de división — solo defendiendo

- **Solo lo puede hacer quien defiende.** El que declara elige división y stat: ya tiene toda la
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

El -6 no es arbitrario: con la tabla de márgenes actual, **basta para convertir cualquier victoria por decisión en un combate reñido**. Cruzar de división pasa una ventaja cómoda a moneda al aire, pero no regala el duelo.

Las stats no penalizadas quedan intactas. La carta se muestra con los números ya ajustados en rojo.

> **[R2] Cuidado con la contigüidad.** Las dos escaleras de peso son independientes (no hay puente
> entre géneros) y los vetos dejan solo 6 divisiones de 11. La cuenta: de los 462 repartos posibles
> de 6 divisiones, **solo 5 no dejan ninguna pareja contigua** — un 1%. O sea que el cambio de
> división casi siempre está disponible, que es lo que se quería. El que sí sufre es el **Incómodo
> normal**, que necesita una contigua concreta: es inusable en torno al 22% de las veces en el
> centro de la escalera y hasta el 50% en los extremos. De ahí que el plus valga tanto.

---

## 7. Rasgos

**Una activación por partida**, compartida con el cambio de esquina. Puedes llevar los rasgos que quieras en plantilla, pero solo usas uno.

Los rasgos están **ocultos** hasta que se usan. Al activarse, se muestra claramente cuál ha sido — si no, el jugador no entiende por qué ha pasado lo que ha pasado y piensa que hay bugs.

**[R2] Ningún rasgo se activa solo. Nunca.** Ni el del jugador ni el de la máquina en tu nombre. Cada
rasgo lo activa su dueño, en el momento, y **eligiendo con qué stat** cuando el rasgo lo admita. Es
consecuencia directa de que la activación sea única: un rasgo que salta por su cuenta te está
gastando el único recurso de la partida sin preguntarte, y puede gastarlo en el duelo que menos te
convenía. En las partidas en vivo esto cuesta una ida y vuelta más por duelo, y merece la pena.

**Principio de diseño: el plus no es un número mayor, es una restricción menos.**

### CAMALEÓN
*Solo peleadores con historial real en dos divisiones (McGregor, Cejudo, Adesanya, Jones, Cormier, Nunes, Shevchenko, Penn...)*

**[R3] Solo defendiendo**, por lo mismo que el cambio de división: el que declara ya elige división
y stat, y darle además mover cartas es darle dos jugadas en la misma mano. El Camaleón es una
respuesta a lo que te han declarado.

- **Normal:** cuando te declaran, mandas tu Camaleón a pelear ese duelo desde una división contigua
  **sin penalización**. La carta que tenías en la división declarada **se descarta sin pelear**, y el
  Camaleón **sigue disponible para su propio duelo**.
- **Plus:** lo mismo, pero **no consume tu jugada de la partida**.

### INCÓMODO

- **Normal:** ocultas la división. El sistema enseña al rival **dos cartas suyas** — la de la división real y una contigua. Elige a ciegas. Si acierta, duelo limpio. Si falla, su carta come **-6**. **Solo se puede usar si los vetos han dejado dos divisiones contiguas en juego.**
- **Plus:** se enseñan la de la división real y **una aleatoria de cualquier división en juego**, no necesariamente contigua. Si falla, **-12**. **Se puede usar siempre**, porque no necesita contigüidad.

En el plus no se enseñan tres cartas contiguas: la de en medio delataría la respuesta.

#### [R2] Qué pasa exactamente con las cartas

Esto estaba sin especificar y se resolvió mal en la primera implementación. La regla correcta:

- **La carta de la división real siempre queda fuera, acierte o falle.** Si acierta, porque ha peleado
  su duelo. Si falla, porque **se descarta sin pelear**: ese duelo acaba de jugarse con otra carta y
  ella ya no tiene duelo al que ir.
- **La carta enviada pelea el duelo declarado con la penalización, y luego pelea también el suyo, sin
  penalización.** No cambia de hueco. Es la misma excepción que ya hace el Camaleón.
- **No hay intercambio de huecos.** Se probó y estaba mal por dos motivos: con el plus, que admite
  cualquier división, podía acabar mandando un mosca a pelear en pesado más tarde — un duelo imposible
  que nadie eligió; y castigaba **dos veces el mismo fallo**, en este duelo y en el siguiente.

Un fallo, un castigo. El Incómodo ya es fuerte con eso.

### [R3] ESPECIALISTA — impone su stat
*Va asociado a una stat concreta*

Esta sección cambia entera. El Especialista ya no salva stats: **impone la suya al duelo**.

- **Normal:** el duelo se pelea **en su stat**, en lugar de la que se había declarado.
- **Plus:** lo mismo, y además se puede usar **aunque ya hayas gastado tu jugada**.

Es la respuesta natural de un especialista: te han declarado donde a él no le conviene, y él arrastra
la pelea a lo suyo. Solo tiene sentido si su stat **sigue viva** en el pool y **no es ya** la
declarada; si no, el botón no aparece.

Lo puede activar tanto quien declara —eligiendo la stat— como quien defiende, en la pantalla de
mandar su carta.

### [R3] VETERANO — su stat no se gasta
*Solo peleadores con carrera larga de verdad*

Y esta también. El Veterano se queda con lo que antes hacía el Especialista, que es donde encaja
mejor: un veterano sabe administrar, no sabe cambiar de pelea a mitad.

- **Normal:** si **gana** su duelo, la stat de ese duelo **no se gasta** del pool compartido.
- **Plus:** la stat no se gasta **aunque pierda**.

La stat revive **para los dos jugadores**. El pool es compartido: si reviviera solo para uno, habría
dos listas distintas y el sistema se rompe. Es un rasgo generoso y ahí está su gracia — le devuelves
una opción al rival, así que tienes que estar seguro de que en esa stat mandas tú.

**En el duelo 6 no se puede activar**: es el último, y una stat que vuelve al pool ya no la va a usar
nadie. **El botón sale apagado con el motivo escrito**. Se pierde el recurso por mala gestión, pero
no parece un bug.

**[R2] Se decide en la pantalla en la que mandas tu carta**, no en una pantalla aparte. Es la misma
ventana en la que el defensor toma todas sus decisiones, y así el rasgo no interrumpe el ritmo del
duelo ni se convierte en un aviso que aparece y desaparece.

### Regla general

**No se contrarresta un rasgo con otro.** Se descartó explícitamente para no convertir el duelo en cadenas de respuestas, que en móvil es inmanejable.

---

## 8. Producto y PvP

- **Partidas en vivo, online.** Por turnos, así que la latencia da igual y el servidor es barato
- **[R3] Reloj de 25 segundos por decisión.** Lo lleva el servidor, no el móvil: si el reloj se agota
  juega por ti y la partida sigue. Un rival que se queda mirando no puede congelar la partida
- **Abandono = rendición.** Gana el otro. Y **cerrar la aplicación es abandonar**: el servidor da un
  margen corto por si es un túnel o un cambio de red, y pasado ese margen da la partida por perdida
- **[R3] Botón de rendirse**, explícito. Si vas 0-4 y quieres empezar otra, poder decirlo es mejor
  que obligarte a jugar tres duelos de trámite o a cerrar la aplicación
- **[R3] Chat dentro de la partida.** Se juega contra una persona; que no se pueda ni saludar es raro
- **Dos modos de emparejamiento:**
  - **Normales:** cualquier emparejamiento, para probar plantillas y estrategias
  - **Competitivas:** partidas de posicionamiento → liga → ascensos

### 8.1 [R2] Cómo se juega en vivo, en concreto

- **Salas por código de 6 letras.** Uno crea sala, dicta el código, el otro lo escribe. Se acabó.
- **Sin cuentas, sin registro, sin configurar nada.** El jugador no crea nada y no se entera de que
  existe un servidor. La dirección viene dentro de la aplicación.
- **Un solo servidor para todos**, alojado por quien mantiene el juego. No hay un servidor por
  persona ni nada que instalar.
- **El servidor es el árbitro, y esa es toda la razón de que exista.** Las cartas están ocultas, así
  que la plantilla del rival **no puede vivir en el móvil del otro**: el servidor solo manda las
  cartas de las divisiones ya resueltas. Al terminar la partida se revela todo, que es cuando ya no
  hay nada que proteger.
- **El servidor y el juego comparten el mismo reglamento, el mismo archivo.** Si divergieran, el
  servidor estaría arbitrando un juego distinto del que la gente cree estar jugando.
- **El servidor no se fía del cliente:** valida la plantilla al entrar (11 divisiones, todas
  alineables, sin peleador repetido) y rechaza cualquier jugada fuera de turno o ilegal.
- **Reconectar recupera la partida** en el punto exacto en que se dejó.
- **Que sobre una pulsación no es hacer trampa.** Hay botones que ven los dos jugadores —resolver el
  desempate, por ejemplo— y los dos pueden pulsarlos casi a la vez. El segundo no ha hecho nada mal:
  su mensaje sobra y se ignora, no se rechaza con un error. Lo mismo cuando alguien vuelve a pulsar
  porque la pantalla todavía no se ha actualizado.

### 8.2 [R2] Retar plantillas es un modo aparte

Existe un segundo modo, **asíncrono**: tu plantilla se convierte en un código de texto que mandas por
donde quieras, y quien lo pega pelea contra tu plantilla **real** cuando le venga bien. El resultado
vuelve como otro código.

Aquí **sí** juega la IA por el ausente, porque no está delante, y el marcador va por confianza. Es
deliberado y es un modo distinto: **no sustituye ni se confunde con la partida en vivo**, donde las
dos personas están y deciden todo. Los dos modos van separados en el menú y cada uno dice lo que es.

---

## 9. Economía (bloque abierto)

Lo cerrado hasta ahora:

- **Sin casa de subastas.** Las cartas no tienen precio ni se venden. El único movimiento de cartas entre jugadores es el trueque de la sala de intercambio
- **Sobres gratis** con drop bajo: lo normal es que salgan peleadores mediocres, con muy poca probabilidad de cartas buenas
- **Divisa del juego** para comprar sobres especiales, con mejores probabilidades y distinto coste. Se gana jugando partidas, cumpliendo objetivos y por logros
- **Los sobres se acumulan sin caducar.** Es deliberado: guardar veinte o cincuenta para abrirlos de golpe es uno de los momentos que más engancha en Pacybits/MadFUT, y convierte la recompensa diaria en un plan a medio plazo en vez de un caramelo suelto
- **SBC / desafíos** para cartas exclusivas y especiales
- **Sets de colección** por gimnasio, promoción y nacionalidad, que desbloquean cartas especiales no obtenibles de otra forma. Es lo que da valor a las cartas flojas: un 68 que te completa un set tiene sentido aunque no juegue nunca

### 9.1 [R2] El sobre básico

Es la pieza que sostiene el bucle diario, y tiene reglas propias:

- **Ilimitado y siempre disponible.** Nunca se agota ni hay que esperar a que aparezca.
- **Se abre directamente, en el sitio.** No se reclama para abrir después: eso es un paso de más entre
  el jugador y lo que ha venido a hacer.
- **De uno en uno.** No se pueden abrir varios a la vez. Lo que hace especial abrir veinte de golpe es
  precisamente que no puedes hacerlo con el básico.
- **Tasa muy baja.** Que salga un especial o un oro alto tiene que ser **casi imposible: 1% o menos**.
  Lo que sale de verdad son **oros bajos y platas**.

**Todos los sobres del juego entregan 9 cartas**, sea cual sea su tipo. Lo que cambia entre ellos son
las probabilidades, no la cantidad: así el jugador compara sobres por una sola variable.

#### [R3] Cómo se abre un sobre

Dos pasos, y ya:

1. La **mejor carta de las nueve** ocupa casi toda la pantalla, centrada.
2. **Un toque encima** y sale el sobre entero.

No hay botón de continuar ni se van pasando una a una. Nueve cartas de una en una son ocho toques de
puro trámite, y el momento que engancha —ver qué te ha tocado— es justo el que se diluye repitiéndolo.

Y **desde ahí no se encadena un básico**. El gratis se reclama en la pantalla de sobres y en ningún
otro sitio: ofrecer "abrir otro" al final de cada apertura convierte esa pantalla en una palanca de
la que no sales. Lo que sí se encadena es lo que ya tienes guardado en la mochila.

#### [R3] Los tres sobres no son el mismo sobre a tres precios

Es el error de lectura fácil, y hay que dejarlo escrito: **el básico no es una versión peor del de
plata**. Cada uno hace una cosa distinta, y por eso no se comparan por cuántos oros dan.

| | Coste | Oros | Platas | Rankeadas | ≥1 corona | ≥1 oro alto |
|---|---|---|---|---|---|---|
| **Básico** | gratis, ilimitado | 5,48 | 3,52 | 1,00 | 0,10% | **0,97%** |
| **Plata** | 250 | 1,80 | 7,20 | 0,76 | 0,54% | 4,07% |
| **Oro** | 600 | 7,95 | 1,05 | 3,98 | 4,65% | 26,39% |

- El **básico** da muchos oros **a propósito**: es lo que permite que cualquiera se monte un once
  desde el primer día sin gastar nada. Lo que casi no da es un oro **alto** — una corona cada mil
  sobres, y un oro alto en el 0,97% de ellos, que es el «1% o menos» de arriba. Se hace un equipo,
  no se hace un equipo de campeones.
- El **de plata** se compra para **cerrar la colección de platas**, que es lo que desbloquea las
  cartas especiales. Por eso trae 7,20 platas y solo 1,80 oros. No compite con el básico: hace otra
  cosa.
- El **de oro** es el único que reparte cartas de arriba de verdad, y es el caro.

Lo que sí tiene que crecer con el precio es **la carta alta**, y crece: 0,97% → 4,07% → 26,39%.

### 9.2 [R3] Fichas de intercambio

Se consiguen reciclando **repetidos**, y aquí hay dos reglas duras antes de la tabla:

- **La primera copia de una carta no se recicla nunca.** Da igual lo que sea: si solo tienes una, no
  se toca. Reciclar no puede vaciarte la colección, que es lo que da las cartas especiales.
- **Cada ficha sale de un solo tramo.** No se mezclan: diez platas y tres oros sueltos no completan
  nada.

| Reciclas (repetidos del mismo tramo) | Obtienes |
|---|---|
| 1 campeón o Top 5 | 1 ficha |
| 4 del Top 6-15 | 1 ficha |
| 10 oros sin rankear | 1 ficha |
| 30 platas | 1 ficha |

La escala va por **estatus deportivo**, no por rareza, igual que todo lo demás desde [R3]. Y está
muy separada a propósito: de platas sobran cientos y de coronas casi ninguna. Si una corona valiera
poco más de tres platas, la gente trituraría coronas para farmear rápido y luego las echaría de
menos en los sets.

**La ficha no es el precio de una carta: es la entrada a la sala de intercambio.** No mide valor, no se usa para pagar diferencias. Solo abre la puerta.

Eso es lo que le da peso: entrar cuesta una ficha, o sea cartas trituradas, así que salir de vacío duele. Empuja a cerrar tratos en vez de mirar escaparates, y hace que negociar en masa salga caro.

### 9.3 La sala de intercambio

- **Entrar cuesta 1 ficha.** Emparejamiento a ciegas con otro jugador
- **Solo se cambian cartas por cartas.** Ni divisa, ni fichas encima para compensar. Trueque puro
- **Hasta 3 huecos por lado**, con cualquier combinación: 1 por 1, 3 por 1, 2 por 3, lo que acepten los dos
- **Lista de deseos pública**, estilo Pacybits/MadFUT. No sirve para emparejar: sirve para que el otro vea qué buscas y pueda ofrecértelo si lo tiene

El valor no lo fija el sistema, lo fijan los dos jugadores en el momento. Como no hay precios, no hay inflación ni especulación, y las fichas solo aparecen destruyendo cartas — es una economía que se vacía sola.

### 9.4 [R2] Carta con rasgo al empezar — decidido

Era una recomendación pendiente y se cierra que **sí**: el jugador nuevo arranca con una carta de
rasgo **fija, normal (nunca plus), la más floja que cumpla, y marcada como no traspasable**. Como los
rasgos son la única jugada de la partida, un novato sin ninguna juega sin herramienta. Es una
herramienta, no un regalo, y por eso no se puede intercambiar.

### Recomendaciones pendientes de decidir
- **Los sets deberían pedir peleadores de divisiones distintas**, para que haya que perseguir cartas que no te sirven en plantilla

---

## 10. Licencias (sin resolver)

Usar nombres, apodos e imagen de peleadores reales requiere derechos de imagen individuales. La marca UFC está licenciada en exclusiva a EA.

Riesgo asumido conscientemente. Mitigaciones prácticas a valorar antes de monetizar:

- **Roster como datos, no como código.** Nombres, apodos y arte en configuración, para poder cambiarlos sin tocar el juego
- **Arte ilustrado propio**, nunca fotos de prensa
- **Cero marcas de promotoras**: ni logos, ni cinturones, ni octógono reconocible
- Nada que sugiera respaldo o patrocinio de ningún peleador
- Las promotoras pequeñas son bastante más accesibles para acuerdos directos que las grandes

*(No soy abogado. Esto es orientación práctica, no asesoramiento legal — antes de monetizar conviene consultarlo con un profesional.)*

---

## 11. [R2] Enseñar a jugar

El juego tiene pool compartido de stats, vetos, una única activación por partida y cuatro rasgos con
versión plus. Es demasiado para descubrirlo solo, y un tutorial de pantallas de texto no se lee.

**Partida tutorial.** Una partida **de verdad**, con el mismo motor y las mismas reglas —no hay guion
ni nada simulado, así que todo lo que enseña es cierto—, contra un sparring y con una **plantilla
prestada**. Que sea prestada es lo que permite jugarla nada más instalar, antes del primer sobre.

- Las dos plantillas se eligen del catálogo **para que los rasgos salgan seguro**. Si no, un novato
  podría terminar el tutorial sin haber visto un Incómodo en su vida. La del jugador lleva Veterano,
  Especialista y Camaleón; la del sparring, Incómodo.
- Un entrenador habla **cuando toca y no antes**: cada aviso está atado al momento en que ese concepto
  aparece en pantalla. Se puede cortar de un botón en cualquier momento.
- **No cuenta en el registro de partidas.** Se juega con plantilla prestada contra un sparring;
  sumarlo a las victorias sería mentir en la propia ficha del jugador.
- Terminarlo entrega una recompensa de arranque, una sola vez: divisa y un sobre bueno.

**Los conceptos, en el orden en que se aprenden.** Trece avisos cortos, uno por concepto, cada uno en
su momento: qué es la partida (11 peleadores, 6 duelos, a 4) · vetar o declarar · los vetos y el veto
aleatorio · leer el tablero (stats vivas y divisiones en juego) · elegir peleador tocando su carta ·
las seis stats · tu única jugada · los cuatro rasgos y el plus · defender y mandar tu carta · la tabla
de márgenes · el Incómodo · el desempate · el cierre.

Si el jugador se salta un aviso porque actuó antes de leerlo, ese aviso **vuelve a aparecer la
siguiente vez que su concepto sale en pantalla**. No se pierde ninguno por ir rápido.

**Pantalla de reglas.** El tutorial enseña jugando; las reglas escritas son el papel al que se vuelve.
Ahí no se resume: están los números exactos, porque la duda que lleva a alguien a esa pantalla suele
ser justo la del número.

---

## 12. Pendiente

**Diseño**
- **Cuántas cartas tendrá el juego en total.** Sin casa de subastas, ese número decide si un set de gimnasio es alcanzable o imposible
- **Profundidad de las divisiones femeninas.** Con PvP solo UFC, las 3 femeninas salen de un roster corto (paja, mosca y gallo). Son el 27% de cada plantilla, así que hay que comprobar que hay peleadoras suficientes contando versiones especiales y retiradas
- **El sobre que decepciona.** Sacar un peleador buenísimo de KSW y no poder alinearlo puede sentirse como un mal tirón. Hay que decidir si se separan los pools de sobres o si basta con que los sets recompensen bien
- **El 3 por 1 y las cuentas secundarias.** Si se pueden dar tres platas por un oro, dos cuentas del mismo dueño se vacían la una en la otra. Se tapa limitando la diferencia de estatus dentro de un mismo trueque
- **¿Entran al trueque las cartas de set y las de rasgo?** Si son intercambiables, quien tenga stock consigue las recompensas de los desafíos sin jugarlos. En FUT van marcadas como no traspasables por este motivo exacto
- Ritmo de sobres y recompensas: es la columna vertebral del juego
- Diseño concreto de los SBC
- Modos fuera del PvP: draft, modo carrera
- Nombre del juego

**[R2] Medido en el prototipo, pendiente de ajustar**

Con 20 partidas automáticas de IA sencilla contra un jugador que declara casi al azar:

| Métrica | Medido | Objetivo del GDD |
|---|---|---|
| Partidas que llegan a 3-3 | ~20-40% | ~33% |
| Finish (margen 13+) | ~22-28% | 15-25% |
| Empate exacto | ~8-11% | — |
| Jugada usada | ~60-80% | >80% |
| Duelo 6 con elección real | 0% | — |

Las dos que hay que mirar:
- **El duelo 6 no es una decisión.** Al llegar queda una división y una stat: no se declara nada, se
  ejecuta. El GDD dice "declaraciones 3 y 3", pero la tercera del que declara segundo es de trámite.
  Hay que decidir si se asume o si el sexto duelo cambia de forma.
- **La jugada se queda sin usar demasiado.** Que un 20-40% de las partidas termine sin gastar el único
  recurso disponible apunta a que las condiciones para usarlo son demasiado estrechas, o a que no se
  ve bien que está ahí.

**A validar con personas** *(el playtest de papel ya no hace falta: hay APK y partidas en vivo)*
- ¿Declarar 3 veces desequilibra, aunque se compense con el rol?
- ¿Compensa de verdad cruzar división a -6?
- ¿El Camaleón gana demasiado? Se lleva dos ventajas de golpe: gana un duelo y elimina uno malo. **Palanca de ajuste si hace falta:** que la carta descartada cuente como duelo perdido en vez de desaparecer
- ¿El Incómodo, con la regla de descarte ya corregida, sigue siendo demasiado fuerte?

**Producto**
- Qué pasa con las desconexiones (distinto del abandono voluntario)
- Arranque el día 1: sin jugadores conectados, el emparejamiento en vivo no funciona. **Las salas por
  código lo esquivan** mientras no haya masa crítica, pero no lo resuelven
- ~~Reloj de 20-30 segundos por decisión: está en el diseño, no en el prototipo~~ — **[R3] hecho**:
  son 25 segundos, los lleva el servidor y si se agotan juega por ti
- Identidad: hoy es un identificador del propio móvil. Vale para jugar con amigos, no para una liga
  competitiva

---

## Anexo A · [R2] Resumen de cambios de esta revisión

| # | Punto | Qué cambia |
|---|---|---|
| 1 | §5.3 | El **empate exacto** (margen 0) es su propio caso y se resuelve **50/50**, no 65/35 |
| 2 | §5.2 | **El duelo no se resuelve solo**: el defensor manda su carta a mano |
| 3 | §5 | Se **declara tocando la carta** y se elige la stat sobre ella |
| 4 | §7 | **Ningún rasgo se activa solo**: siempre lo decide su dueño, y elige con qué stat |
| 5 | §7 INCÓMODO | La carta de la **división real siempre queda fuera**; la enviada pelea los dos duelos; **no hay intercambio de huecos** |
| 6 | §4.1 | **El que empieza una no empieza la otra**; contra la IA **no hay dado**; y qué significa cada opción, con su tabla |
| 7 | §8.1 / §9.1 | PvP en vivo **por código de sala, sin cuentas, un solo servidor**; una pulsación que sobra se ignora, no se rechaza; sobre básico **ilimitado, directo, de uno en uno, 1% o menos** de cartas altas; **9 cartas** en todos los sobres |
| 8 | §11 | **Partida tutorial** de trece avisos y **pantalla de reglas** |

## [R3] Lo que cambia en esta revisión

| # | Punto | Qué cambia |
|---|---|---|
| 9 | §2.3 | **La media general desaparece**, ni visible ni guardada. La carta se lee por sus seis stats, y el orden lo da el **estatus deportivo**: campeones, top 5, top 6-10, top 11-15, oro sin rankear, plata. Desempate por suma interna, que no se enseña nunca |
| 10 | §2.3.1 | **El diseño de la carta**: marco de imagen, qué va en cada hueco, y por qué el texto se mide contra el ancho de la carta y no con consultas de contenedor |
| 11 | §2.4 | **Solo oro y plata**, con sus rangos reales. Y el aviso de que con el roster real los **finish caen al 6-14%**, decisión pendiente |
| 12 | §9.1 | **Cómo se abre un sobre**: carta grande, un toque, sobre entero. Y el básico **no se encadena desde la apertura** |
| 13 | §9.1 | Los **tres sobres no son comparables por oros**: cada uno hace una cosa. El básico da oros de sobra pero un oro alto **solo en el 0,97%** de los sobres, cumpliendo por fin el «1% o menos» |
| 14 | §9.2 | **Reciclaje por estatus**, no por rareza: 1 corona · 4 del top 6-15 · 10 oros · 30 platas. La **primera copia nunca se recicla** y **no se mezclan tramos** |
| 15 | §5.3 | **Franjas nuevas**: finish desde 10, decisión 4-9, reñido 1-3 y a **55/45** en vez de 65/35 |
| 16 | §5.4 | A 3-3 desempatan primero los **finishes**; el duelo de desempate solo si también van iguales ahí |
| 17 | §6 y §7 CAMALEÓN | El **cambio de división y el Camaleón son solo del que defiende**. El que declara ya elige división y stat |
| 18 | §7 ESPECIALISTA | Deja de salvar stats: ahora **impone su stat al duelo** |
| 19 | §7 VETERANO | Se queda con lo que hacía el Especialista: **su stat no se gasta** del pool — al ganar en el normal, gane o pierda en el plus. **Inusable en el duelo 6**, con el botón apagado y el motivo escrito |
| 20 | §8 | En vivo: **reloj de 25 s** llevado por el servidor, **cerrar la aplicación es rendirse**, **botón de rendición** explícito y **chat** en la partida |
| 21 | §2 / §9 | El roster es la **base de datos real de UFC**: 402 cartas, 355 peleadores, 57 países, 177 rankeadas, con las once divisiones completas de campeón a #15 |

Cambios menores que no alteran ninguna regla de partida: §2.2 y §2.6 (las cartas de colección no
llevan sub-stats ni rasgos), §2.7 (mínimo de rasgos por clase en el roster), §9.4 (la carta de rasgo
inicial pasa de recomendación a decidida).
