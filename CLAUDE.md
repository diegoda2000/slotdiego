# P4P.CG — memoria del proyecto

Juego móvil de cartas de MMA (estilo Pacybits/FUT) con plantel real de UFC: abrir sobres,
montar una plantilla de 11 peleadores (uno por división) y pelear online. Los duelos se
resuelven **comparando stats, sin simulador de combate**.

**Habla siempre en español con el usuario.** Español de España, directo, sin rodeos ni
disculpas. Los nombres de funciones, variables y archivos también van en español.

---

## En qué punto está el trabajo

Rama de trabajo: **`claude/diseno-carta-pendiente-vn5tw1`**. Lo último entregado: los
nueve emblemas de verdad. (El número de commit no se apunta aquí: se quedaba viejo al
commit siguiente y despistaba más que ayudaba.)
El APK se publica solo en cada push y se descarga de la publicación **`apk-latest`**
(`p4p-cg.apk`, ~11,6 MB, y `p4p-cg.ipa`).

**Hecho y aprobado por el dueño:**

- El plantel con foto: **354 de 355** (falta y va a faltar Xiong Jing Nan).
- El diseño nuevo de la carta, con los marcos y Antonio.
- El nombre **P4P.CG** y su logotipo en la cabecera, con el dibujo que pasó él a la
  izquierda.
- El **icono de la aplicación**: el mismo dibujo sin fondo y el nombre debajo.
- El **fondo de pantalla**: la foto de la jaula que pasó él, sin velo ni tinte.
- La **apertura del sobre sin florituras** y la foto del peleador como último paso de la
  revelación.
- **Conor en JUGAR e Islam en Logros**, recortados y sobre el fondo general.
- Los nombres de todos los botones **en cursiva y más grandes**.

**REDISEÑO EN MARCHA.** El dueño ha dicho que se rehace el juego casi entero: logo nuevo,
sobres nuevos, diseño de carta nuevo e interfaz nueva. Él va pasando los recursos. El orden
acordado es: **1) la carta, 2) el logo y la paleta, 3) los sobres, 4) la interfaz.** La
carta va primera porque es la única pieza que puede bloquear días: las 354 fotos están
recortadas para el hueco del marco actual y, si la ventana cambia, hay que volver a bajarlas
las 354 desde una máquina con internet normal —desde aquí el proxy da 403 en ufc.com—.

**Se acaban el oro y la plata.** La escalera entera es de cinco: **común, raro, épico,
legendario y ultimate**. De ésos, las **cartas base son los tres primeros**: todo peleador
tiene la común; los del medio tienen común y rara; los top tienen las tres. O sea que un
mismo peleador puede existir en tres cartas distintas con la misma cara. **Legendario y
ultimate NO son carta base** y vienen después. Esto **contradice el
GDD**, que hay que actualizar cuando esté cerrado, y arrastra: `roster.js` (la rareza de las
402 cartas), `motor.js` (`RAREZAS`, `ORDEN_RAREZA`, los seis estatus con su rango de media y
lo que paga el reciclaje), `juego.html` (85 sitios), la suite (41) y los tres sobres de la
tienda, que se llaman básico, plata y oro.

**Y ojo con el identificador.** Hoy una carta es peleador + división (`ilia-topuria-m3`).
Con tres variaciones del mismo peleador el identificador tiene que llevar la rareza dentro,
y eso **rompe la colección guardada**: lo guardado apunta a identificadores que dejarían de
existir. Hay que migrarlo a propósito al arrancar, no descubrirlo después. Ya se le avisó.

**La carta nueva, lo que ya está cerrado.** El marco común (frente y reverso) está en
`originales/marcos-v2/` y la maqueta del reparto en `herramientas/maqueta-carta.html`, con
las medidas en % de un lienzo de 1054x1492 sacadas de medir el boceto con una rejilla
encima. Decidido por el dueño:

- **La medida es 1054x1492 (0,706)**, la del boceto y el reverso. El que se sale es el
  frente, que viene a 1024x1536, y es el que se reescala.
- **La foto va a cuerpo entero, como la tenemos hoy** —eligió la opción B—. O sea que
  **las 354 fotos se quedan y no hay que volver a bajarlas.** Se probó también el recorte
  cercano del boceto y lo descartó: con un archivo de 360x551 se ablanda al ampliarlo.
- **El marco es OPACO**, 0% de transparencia, así que va debajo y el contenido se recorta a
  su hueco libre: 6,93–92,87% de ancho, 4,23–95,64% de alto. El peleador no puede pasar por
  detrás del metal como en el boceto.
- **El "P4P.CG" del pie no lo pinta el juego**: el marco ya trae ahí sus marcas "////" y se
  montan. Si lo quiere, tiene que venir dibujado en el marco.
- **El récord SE VA.** En el boceto no estaba y el dueño lo ha confirmado: la carta nueva
  no lo lleva. El campo sigue en `roster.js`, sólo deja de pintarse.
- **Los apodos SÍ van**, y aprobó los que se usaron en la maqueta —THE NIGHTMARE, THE
  BADDY, SUGA…—. Están en `docs/apodos.json`: **189 de 355**. Él pidió que los tengan
  **TODOS los que lo tengan**, y desde aquí no se puede terminar: el proxy deniega
  ufcstats.com, ufc.com, sherdog.com y Wikipedia, así que no hay con qué comprobarlo.
  Para eso está **`herramientas/importar-apodos.mjs`**, que los trae de ufcstats.com y
  sólo AÑADE los que faltan —no toca los escritos a mano—; **hay que ejecutarla en una
  máquina con internet normal**, como `importar-fotos.mjs`, y después volver a pasar
  `importar-roster.mjs`. **Quien no tenga apodo deja la línea en blanco: inventarle uno a
  alguien es peor que dejarlo vacío.**
- **El monograma de la esquina SE QUITÓ.** Estaba de marca de agua y lo mandó fuera. El
  archivo se queda en `originales/marcos-v2/monograma.png` por si se recupera; no lo
  repongas.
- Antonio deja de estar justificada: se eligió midiendo las etiquetas impresas del marco
  viejo, y el marco nuevo no imprime ninguna. La maqueta va con Saira Condensed.

**LA APERTURA YA ESTÁ PUESTA, Y ES LA QUE ÉL MONTÓ.** La pasó hecha en un HTML y está
guardada en `originales/apertura/apertura-que-quiere.html`: *"pero por qué te inventas ahora
por la cara otra apertura? la apertura es esta"*. **Si hay que cambiar algo, se cambia
PRIMERO en esa maqueta y después en el juego.**

Cómo va: se toca el sobre → **la rasgadura AVANZA** por el dentado → la solapa se va y el
cuerpo cae → las cartas suben desde dentro, **todas boca abajo** → un toque voltea la de
arriba **en su sitio** → otro la manda **al fondo del montón** → y **no se acaba nunca**:
se sigue pasando en círculo, y como las vistas se quedan boca arriba, dar otra vuelta es
repasarlas todas. Se sale por la flecha.

**SE BORRÓ TODO RASTRO DEL SISTEMA VIEJO, y lo mandó él dos veces:** *"al acabar la
apertura no lo has dejado como te dije, has hecho un scroll hacia abajo, cuando lo que
tiene que quedar simplemente es el montón de cartas que si pulso vayan pasando de forma
normal"* y *"has hecho una mezcla entre el sistema viejo y nuevo a la hora de pulsar el
sobre, BORRA CUALQUIER RASTRO DEL SISTEMA VIEJO Y DEJA SOLO EL NUEVO"*. Lo que se fue:

- **La pantalla de resumen.** Las cartas en rejilla con "nueva/repetida", el botón de abrir
  otro y su scroll. Con ella se fueron `a.resumen`, `a.nuevas` y `puedeOtro()`.
- **El doble toque.** Se tocaba el sobre en su pantalla —y ahí sonaba un golpe elegido por
  la MEJOR carta del sobre, o sea que te contaba lo que venía antes de ver nada, más un
  compás de 240 ms— y luego había que tocar OTRA VEZ dentro de la apertura para rasgar. Dos
  toques sobre dos sobres distintos. Ahora el toque de la pantalla del sobre es el que
  rasga: se entra y **se rasga solo**, con dos fotogramas de espera —`requestAnimationFrame`
  anidado, no un temporizador— para que la escena esté pintada antes de empezar.
- **El golpe ya no depende de lo que traiga el sobre.** Rasgar un sobre suena igual traiga
  lo que traiga.
- **`SONIDO.dato()`**, los campos `paso` y `anuncio` de `NIVEL_APERTURA` y sus dos colores
  por nivel: eran de la revelación por partes y del resplandor del walkout, y no los leía
  nadie. La tabla se queda sólo con lo que suena al destapar una carta.
- **`abrirsobre()`**, una función vacía que existía sólo para colgarle el temporizador del
  compás.

**Tres cosas de la maqueta que no son cosméticas y hay que respetar:**

- **La rasgadura no es cortar el dibujo en dos y apartar uno.** Hay una línea de dientes
  generada UNA vez, y en cada fotograma sólo está abierta hasta donde ha llegado; lo que
  queda por delante sigue pegado. La solapa gira sobre **el punto exacto donde va el
  desgarro**. Como el polígono cambia de número de vértices, va con `requestAnimationFrame`
  y **no** con una transición de CSS, que no sabe interpolar dos polígonos con distinta
  cantidad de puntos.
- **La perspectiva va en la carta, no en la escena.** Puesta arriba se aplica sólo a los
  hijos directos, y entre medias hay dos capas que aplanan el 3D; sin ella el giro no es un
  giro, es la carta encogiéndose de ancho y volviendo a crecer.
- **No nos fiamos de `backface-visibility`.** Con el estilo calculado correcto, Chromium
  pintaba el dorso ENCIMA de la cara y todas salían boca abajo. El cambio de cara se hace a
  mano, con una transición de opacidad de duración CERO y retraso justo la mitad del giro,
  que es cuando la carta está de canto. Y las dos caras van separadas 5 px en profundidad,
  para que la carta sea un objeto con grosor.

**Pasar una carta al fondo es cambiarle el puesto (`--i`), no llevársela a otra parte.**
Todas viven en el mismo sitio y de su puesto salen desplazamiento, escala y orden.

**Y `medirCartas()` mide con `offsetWidth`, no con `getBoundingClientRect`**: el segundo
devuelve el ancho YA TRANSFORMADO, y en la apertura las cartas nacen dentro del sobre a
escala 0,34. Midiendo mal, `--k` salía tres veces más pequeño y las cartas se pintaban en
miniatura en su esquina.

**El montón trae las cartas que anuncia el sobre** —5, 6, 8, 10 y 10— y hay una comprobación
en la suite que lo verifica en los cinco.

**Con la apertura nueva se fue la vieja**: la carta llenándose por partes, sus resplandores
y toda la máquina de `ve-*`. **El anuncio (`its-time.mp3`) se queda**, pero ahora suena al
destapar el campeón o el top 5, que es el momento que premiaba.

**Cómo se mira.** `node herramientas/ver-apertura.mjs [carpeta]` fotografía la secuencia
entera paso a paso: el sobre, el rasgado en siete momentos, el montón, el volteo a medias y
del todo, y una carta yéndose al fondo.

**La apertura con vídeo está DESCARTADA.** Se generó con Kling, se recortó a la columna
del sobre —con lo que la marca de agua se quedaba fuera— y se montó en HTML; el dueño lo
vio y dijo que no. El clip y el procedimiento se quedan en `originales/apertura/` y
`herramientas/preparar-apertura.sh` por si se retoma. **No lo montes en el juego.**

Si vuelve a generar vídeo, la entrada va con `herramientas/preparar-entrada-video.mjs`:
monta el sobre entero sobre un 9:16 de 1080x1920 con fondo de estudio. Dándole el PNG a
pelo, el generador reencuadra por su cuenta y el sobre sale cortado.

**Dónde cortan los tres escalones: DECIDIDO.** Y no sale de las medias ni de la suma de
stats —lo dijo él—: sale de **la calidad del peleador**, o sea de dónde está en su división
de verdad, que es el ranking que ya trae la base de datos.

| escalón | quién | cartas |
|---|---|---|
| común | todos, sin excepción | 402 |
| rara | rankeado (#1–15 o campeón) **o destacado** | 216 |
| épica | campeón y top 5 | 68 |
| | | **686** |

Los **destacados** son los que llevan rara aunque hoy estén fuera del ranking, y están en
`docs/destacados.json` en dos listas que aprobó él: **ex campeones de la UFC** (20, criterio
objetivo) y **nombres grandes sin cinturón de la UFC** (15, lista opinable). Son 38 cartas
que sin la lista serían sólo comunes. Sin eso, Conor McGregor sería una carta común.

`importar-roster.mjs` ya calcula esto y lo guarda en cada carta como `base:["comun",…]`, y
avisa si una clave de las listas no corresponde a ningún peleador. **Pero todavía NO genera
las tres cartas**: eso es la migración, y es lo que cambia el identificador y rompe lo
guardado.

**LA MIGRACIÓN ESPERA A LA INTERFAZ, y lo decidió él.** Se hacen las dos a la vez. El
motivo: adaptar el álbum, los sets y el reciclaje de AHORA a tres escalones —85 sitios en
`juego.html` y 41 en la suite— es trabajo que se tira, porque esa interfaz se va a rehacer
entera. Así que no empieces la migración por tu cuenta: va con el rediseño.

**EL LOGO NUEVO YA ESTÁ.** Es un octógono negro con el P4P.CG en blanco y oro; lo pasó
en `originales/logo-v2/logo.png`, con fondo blanco, y `herramientas/preparar-logo-v2.mjs`
le quita el fondo y saca el icono de Android y el de iPhone. **El icono de la aplicación ya
es éste.** La cabecera sigue con el logo viejo hasta que se rehaga la interfaz.

Dos cosas del recorte que costaron una vuelta: la inundación va con el umbral en **165 y
no en 228**, porque el archivo trae una sombra suave alrededor y con el listón alto quedaba
un aro claro pegado al octógono que sobre negro se veía; y el canto se limpia en una banda
de **cuatro píxeles**, no de uno, deshaciendo la mezcla con el blanco —si `P = a·F +
(1-a)·blanco` y el canto es casi negro, `a = (255-luz)/229`—. El tamaño del icono sale de
medir **el radio real del logo** (553 px de 1013x974, frente a los 703 de la media diagonal
de su caja): por eso llena el círculo de 66 dp en vez de quedarse corto.

**LA REESTRUCTURACIÓN DE LA INTERFAZ ESTÁ HECHA Y CERRADA.** Empezó con *"lo de los colores
es lo de menos, la reestructuración es mucho más que simplemente cambiar los colores"* y
acabó con **"eso ya lo hemos hecho, olvídalo"**. Ya no es un pendiente. La paleta, del logo
y medida, es esto:

| | |
|---|---|
| oro | `#c08719` |
| oro claro | `#f0c54e` |
| blanco | `#f0f0f1` |
| negro | `#060707` |
| carbón | `#272829` |

**Ya no hay rojo.** La paleta de ahora gira sobre `--acc:#d40c1a`, así que el rediseño de
la interfaz es también un cambio de color de arriba abajo. Sin empezar.

**LA ESTRUCTURA DE LA INTERFAZ NUEVA YA ESTÁ MONTADA.** El boceto lo pasó él entero
—cinco pantallas y una leyenda— y está en `originales/interfaz-v2/boceto-pantallas.png`.
La orden fue: *"EL FONDO DE JAULA QUÍTALO, HAZ ABSOLUTAMENTE TODO COMO EN EL BOCETO, Y
COPIA TAMBIÉN LAS FUENTES DE TEXTO, LO QUE OCUPA CADA BOTÓN EN PANTALLA, ETC."*, y antes
de eso: *"lo principal es dejar la estructura de la interfaz. Y una vez esté hecho eso, ya
vamos modificando"*. Del dibujo se toma **la distribución y el lenguaje visual, no sus
números**: él mismo avisó de que 198/402 y los textos de plata y oro son de ejemplo.

**Cinco pestañas abajo, e INICIO VA EN EL MEDIO.** Lo corrigió antes de pasar el dibujo,
donde sale el segundo; manda la corrección:

    TIENDA · CLUB · INICIO · DESAFÍOS · PERFIL

**Cabecera en todas las pantallas:** el P4P.CG a la izquierda, las dos monedas —oro y
gemas, que son `S.divisa` y `S.fichas`, dibujadas y rellenas porque a 18 px un contorno
hueco no se distingue— y el **engranaje de AJUSTES arriba a la derecha, alcanzable desde
cualquier pantalla**.

| pantalla | qué lleva |
|---|---|
| **Tienda** | igual que estaba: COMPRAR / MIS SOBRES, las filas de sobre con su (i) y sus probabilidades |
| **Inicio** | ficha del jugador · banner **JUGAR** con su botón · **ACTIVIDAD DIARIA** · **NOVEDADES** · **TU PROGRESO** |
| **Club** | tira **MI PLANTILLA** con cinco cartas solapadas · COLECCIÓN · SETS · RECICLAJE · INTERCAMBIO |
| **Desafíos** | SBC · DESAFÍOS · EVENTOS · **PASE DE TEMPORADA** · LOGROS |
| **Perfil** | ficha con cifras · tres grupos de filas · y abajo, con su rótulo, lo que aún no tiene sitio (ya sólo Mis redes) |

**NO SE COME NADA, y lo dijo él.** Draft está **dentro de JUGAR** —*"lo de draft está
dentro de la parte de jugar"*—, junto a PvP, Contra un amigo y Contra la IA. SBC y Logros
se fueron a Desafíos; Ajustes dejó de ser un botón del Club y vive en el engranaje y en el
Perfil.

**Y APRENDE A JUGAR TAMBIÉN ESTÁ DENTRO DE JUGAR**, la quinta y última tarjeta. Estuvo
aparcada al final del Perfil, bajo el rótulo **SIN COLOCAR TODAVÍA**, porque el boceto no
la pinta en ninguna pantalla y él lo dejó en *"ya veremos dónde lo metemos"*. Le dio sitio
después: *"mueve la pestaña tutorial dentro de la pestaña de jugar, ya que antes no tenía
sitio, démosle ese sitio"*. Va la última porque no es un modo de juego, y con su marca roja
mientras el tutorial esté sin hacer. En el Perfil, bajo ese rótulo, **ya solo queda Mis
redes**.

**EL "ATRÁS" DEL PIE SE FUE DE TODAS LAS PANTALLAS: ahora es una flecha arriba, a la
izquierda del título.** Lo pidió en dos veces: *"quita el botón de abajo de atrás, y en
lugar de eso por arriba a la izquierda de JUGAR, una flecha"* y después *"la flecha en
todas las pantallas"*. Ya **no queda ni un botón "Atrás" o "Volver" al pie**.

Lo pinta **`cabecera(titulo, volver, extra)`**, en un solo sitio. `volver` son los
atributos del botón tal cual —`data-nav="club"`, `data-a="atras"`, o los dos a la vez, que
el Volver de un SBC necesita `nav` y `a`—, igual que el `attr` de `tarjeta()` y de
`cartaHTML()`. Sin `volver` no se pinta flecha.

**Lleva `align-self:center` a propósito**: `.pcab` alinea por línea base, y la línea base de
una caja que sólo lleva un SVG dentro es su canto de abajo, así que alineada como el resto
la flecha se montaba por encima del texto.

**Cada flecha vuelve a donde cuelga esa pantalla**, y cinco no tenían botón ninguno —se
salía por las pestañas de abajo—: Colección, Plantilla, Sets, Reciclaje y la lista de SBC.

| pantalla | la flecha va a |
|---|---|
| Jugar | Inicio |
| Aprende · Draft · Partida en directo | Jugar |
| Colección · Plantilla · Sets · Reciclaje · Intercambio | Club |
| Logros · lista de SBC | Desafíos |
| detalle de un SBC | la lista, soltando las cartas elegidas (`salirreto`) |
| Reglas | Aprende |
| Notas | Ajustes |
| pantalla del sobre | la tienda (`volvertienda`) |
| **Ajustes · Mis redes** | **a donde estuvieras** |

**Ajustes es el único que no tiene destino fijo, y por eso existe `vistaPrevia`.** El
engranaje está en la cabecera de las cinco pestañas, así que Ajustes se abre desde
cualquier sitio y cualquier destino escrito sería mentira la mayoría de las veces: `ir()`
apunta de dónde venías y `data-a="atras"` te devuelve ahí.

**Tres destinos estaban mal y se arreglaron con la flecha, porque una flecha que va donde
no es está rota:**

- **Draft** llevaba a Inicio, de cuando era una tarjeta suelta de allí; vive dentro de
  Jugar desde el rediseño y se me pasó al moverlo. Lo mandó arreglar él.
- **Logros** llevaba a Inicio por lo mismo: se fue a Desafíos con el rediseño y su Atrás se
  quedó apuntando al sitio viejo.
- **Mis redes** volvía siempre a Ajustes, pero desde el rediseño se llega también desde el
  Perfil. Tiene dos puertas, así que usa `atras` como Ajustes.

**Dos sitios que NO llevan flecha, y no es un olvido:** la **apertura del sobre**, que trae
su propia barra "← Salir" y es la que montó él, y el **final de partida**, cuyo "Volver al
inicio" no es volver atrás sino cerrar la partida.

**LA FOTO DE PERFIL EMPIEZA VACÍA Y LA ELIGE ÉL.** Se toca la cara —en Inicio o en
Perfil— y sale una rejilla con los peleadores de tu colección, recortados en octógono para
que se vea cómo va a quedar; se puede quitar. Antes salía sola la mejor carta de la
plantilla, y eso es ponerle una cara que él no ha escogido. Se guarda el `cid` de la carta
en `S.avatar` y **no la ruta de la foto**: quien pelea en dos divisiones tiene una foto por
división. Y si la carta deja de ser suya —reciclada o intercambiada—, la foto se cae sola
en vez de apuntar a una carta que ya no tiene. Se ofrece **uno por cara, no uno por carta**.

**LA CARA ES UN CÍRCULO, NO UN OCTÓGONO.** Lo dijo él: que el juego vaya de MMA no obliga
a que todo tenga forma de jaula. Y con círculo el filete de oro vuelve a ser un `border`
normal, sin el truco de las dos capas recortadas.

**LAS CARAS ESTÁN A MEDIAS Y APARCADAS POR ORDEN SUYA** —*"las caras están mal todas,
déjalo, ya lo haremos"*—. Lo que hay funciona en la foto normal, pero **las de campeón con
cinturón siguen mal encuadradas**: Strickland, Makhachev, Kayla Harrison, Topuria, Aspinall,
Pantoja… La cara se detecta bien, lo que falla es dónde acaba la ventana. **No lo des por
terminado.**

**EL ENCUADRE ES DE CADA FOTO, Y SALE DE MEDIRLAS UNA A UNA.** Las 357 están cortadas igual
—cuerpo entero hasta el muslo, 360x551—, pero **las cabezas NO miden lo mismo**: un peleador
alto sale con la cabeza pequeña dentro del cuadro y uno bajo con la cabeza grande. Con una
ventana única unas caras salían enanas y otras enormes, y lo cazó él. El zoom que hace falta
va del **64% al 193%**, o sea que la cabeza más grande es el triple que la más pequeña.

`herramientas/medir-caras.py` **detecta la cara de verdad con YuNet** —el detector de
OpenCV, cuyo modelo está en `herramientas/modelos/yunet.onnx`— y escribe `juego/caras.js`
con tres números por foto, ya en porcentaje de CSS. **Hay que volver a ejecutarlo cada vez
que se añada, quite o cambie una foto**, como con `fotos.js`, y va empaquetado en los dos
sitios (`build.gradle` y `servidor.yml`).

**Adivinar la cabeza por la silueta NO vale, y se probó.** Contar el ancho de píxel opaco
fila a fila —coronilla, fila más ancha, cuello— falla en tres sitios: con melena el ancho no
baja nunca y no hay cuello que encontrar; Pereira sostiene el cinturón a la altura del pecho
y ensancha las filas de la barbilla; y no dice nada de dónde está la cara **a lo ancho**, así
que quien mira de lado quedaba descentrado. El ancla buena es **la distancia entre los ojos**:
no la toca el pelo, ni la barba, ni girar la cabeza.

**Y de las caras detectadas se queda la de MÁS PUNTUACIÓN, no la de más arriba.** Preferir la
de arriba parecía razonable y era justo lo que rompía las fotos de campeón: quien sostiene el
cinturón en alto tiene ahí un adorno que puntúa algo menos que su cara pero está más alto.

**La marca PENDIENTE.** El boceto enseña cosas que el juego no tiene: nivel y XP, pase de
temporada, racha, rango, eventos, novedades, historial, estadísticas, cartas favoritas,
cuenta y ayuda. Esos bloques **están pintados en su sitio y con su forma**, y llevan una
chapa `PENDIENTE` en oro. No se inventan números: el que se ve es de verdad —partidas,
victorias, colección, sets, repetidas, SBC, logros— o no se ve.

**Lo que cambió de lo que antes era intocable, y lo cambió él:**

- **La foto de la jaula se fue del fondo.** Ahora es negro con la malla de rombos del
  boceto, hecha con dos `repeating-linear-gradient` y no con una imagen. El archivo sigue
  en `juego/arte/fondo.webp` y su herramienta también, por si vuelve a pedirla.
- **Los paneles son OPACOS.** El alfa de `--tarjeta` existía para dejar ver la jaula entre
  fila y fila; sin jaula solo dejaba ver el negro de debajo.
- **El dibujo del logo se fue de la cabecera**: el boceto la enseña con el nombre solo, y
  con cinco pestañas, dos monedas y el engranaje ya no cabía. Con él se fueron los tres
  números medidos que existían para alinearlo —el `top:10px`, el margen negativo y el
  apoyo abajo—. Si vuelve, hay que volver a medirlos.
- **El JUGAR del banner ya no va a `min(14vw,52px)`.** En el boceto es el título del panel,
  así que va arriba a la izquierda, con su subtítulo, a `min(9.5vw,36px)` —medido: 22 px de
  caja alta en un móvil de 295 de ancho—. **El botón "JUGAR AHORA" del boceto NO va**: se
  montó y lo quitó él. La tarjeta entera vuelve a ser el botón, que además es la regla de
  siempre.
- **Ya no hay rojo en ninguna parte.** `--acc` y `--acc2` siguen llamándose así pero son
  oro: renombrarlas obligaba a tocar cien sitios que no cambian de sentido.

**LA FUENTE ES TEKO, Y SALE DE MEDIRLA.** Se recortaron del boceto tres muestras
—COLECCIÓN, HISTORIAL, PARTIDAS—, se binarizaron, y se renderizó la misma palabra con diez
condensadas a la misma caja alta comparando cuánto se solapan las siluetas: Teko gana las
tres (67,9 / 50,1 / 35,9%) con el ancho clavado, y la segunda —Khand— se queda catorce
puntos por debajo. Saira Condensed, la que llevaba el juego, es la quinta. A la vista la
delatan la D rectangular, la pata recta de la R y la S escuadrada. Va servida desde
`juego/fuentes/teko-*.woff2` y es variable: un archivo cubre del 400 al 700.

**Y lleva `size-adjust:108.7%`, que no es un capricho.** La caja alta de Teko 600 mide
0,635 em y la de Saira 0,690: al mismo `font-size` Teko se ve un 8% más pequeña y todos los
tamaños medidos sobre el boceto se quedarían cortos. Con 108,7% —que es 0,690/0,635— la
letra vuelve a medir en pantalla lo que mide en el boceto sin tocar ni un `font-size`. Si un
WebView viejo lo ignora, el texto sale un 8% más pequeño y ya está.

**LOS NUEVE EMBLEMAS SON YA LOS DE VERDAD, y los pasó él todos.** Están a resolución
completa en `originales/emblemas-v2/` y los prepara `herramientas/preparar-emblemas-v2.py`.
**Ya no queda ni uno recortado del boceto**, que eran de baja resolución y llevaban color
(morado, azul, rojo, verde) al lado del oro de los suyos.

Los cuatro primeros: **colección es la CAJA y sets son las CARTAS con la estrella** —él dejó
la elección abierta: la caja es donde se guardan todas y un set es un grupo concreto—, más
reciclaje e intercambio. **Los cinco últimos los repartió él**, que había dudas y se le
preguntó:

| emblema | va en |
|---|---|
| billete con el XP | **pase de temporada** —un pase es un billete— |
| tres peleadores con las flechas girando | **SBC** |
| calendario con la estrella | **eventos** |
| diana con la flecha | **desafíos** |
| copa con el laurel | **logros** |

**Se normalizan por PESO VISUAL, no por alto.** Puestos todos al mismo alto, el de
intercambio —dos flechas anchas y bajas— se ve enorme al lado de la caja, que es alta y
estrecha. Lo que tiene que medir lo mismo es la TINTA: se cuenta el área opaca de cada uno y
se escala para que su raíz sea la misma en los nueve. El del pase es el único que topa con
el límite de 420 px, porque es un billete muy apaisado; da igual, porque no va en una fila
sino dentro del bloque del pase, a 38 px de alto y al lado del rótulo.

**`herramientas/sacar-emblemas.py` ya no se pasa.** Es la que los recortaba del boceto por
**luminancia** y no por umbral —el emblema es claro sobre negro, así que el alfa salía de lo
claro que fuese cada píxel; con un umbral duro el canto quedaba dentado—, con tres cajas
apretadas a mano porque el filete de oro del panel se colaba dentro. Se queda por si hay que
volver a medir el boceto, pero **pasarla ahora pisa los nueve buenos**. Entran en el APK
solos: `build.gradle` y `servidor.yml` ya se llevan `arte/**`.

**Las medidas salen de medir el boceto, no de ajustar a ojo.** El móvil del dibujo son
295x706 px; sobre eso: cabecera 5,2% del alto, barra de abajo 7,9%, filas del Club 10,6%,
filas de Desafíos 14–17%, filas del Perfil 8,6% las de arriba y 6,8% las de abajo, y en
Inicio ficha 81 px, JUGAR 194, actividad 144, novedades 98 y progreso 52 sobre 598 de alto
útil —de ahí los `flex-grow` 2 / 1,47 / 1—.

**Un fallo que costó encontrar y que conviene recordar:** `.barra` es un `<span>`, y a un
elemento en línea no se le puede dar alto. Sin `display:block` se quedaba con el alto de su
línea —58 px—, estiraba la columna del nombre por encima del panel y **el nombre se salía
de la ficha del jugador** en el Perfil.

**Dos formas de fila, y son las dos del boceto.** Con emblema (Club y Desafíos): cada fila
es su propio panel con filete de oro, texto a la izquierda y el icono grande a la derecha,
sin galón. En grupo (Perfil): varias filas dentro de UN panel, separadas por una raya, con
el icono pequeño delante y el galón detrás. Un grupo pesa lo que tiene (`--n`), o el de dos
filas quedaba con filas del doble de altas.

**Cómo se mira.** `node herramientas/ver-pantallas.mjs [carpeta]` saca una foto de las
cinco pantallas a 390x844 y con el mínimo de letra del WebView puesto, y avisa si alguna
desborda.

**LA TIENDA YA ES LA DEL BOCETO.** Cinco sobres, con el arte que pasó él:

| sobre | archivo de origen | precio | cartas | |
|---|---|---|---|---|
| común | `1-basico.png` | **GRATIS** | 5 | sin límite |
| raro | `2-azul.png` | 2.000 | 6 | |
| épico | `3-morado.png` | 4.000 | 8 | |
| legendario | `4-oro.png` | 7.500 | 10 | **PRÓXIMAMENTE** |
| ultimate | `5-holo.png` | 12.500 | 10 | **PRÓXIMAMENTE** |

**LOS PRECIOS SALEN DEL VALOR DE LO QUE TRAE EL SOBRE**, y los mandó revisar él: *"revisa
todos los precios y la monetización del juego, y hazla mejor"*. El valor es cuántas cartas
buenas trae pesando cada tramo por lo que vale —un 12-15 cuenta 1, un 6-11 cuenta 2,5 y un
campeón o top 5 cuenta 8—. Los pesos son un juicio, pero es un juicio **escrito**, y con él
los precios se calculan en vez de elegirse:

| sobre | valor | precio | por punto | partidas |
|---|---|---|---|---|
| raro | 1,94 | 1.200 | 622 | 7,1 |
| épico | 6,72 | 3.800 | 567 | 22,4 |
| legendario | 13,25 | 7.000 | 527 | 41,2 |
| ultimate | 19,52 | 10.000 | 512 | 58,8 |

**El precio por punto BAJA al subir de escalón**: ahorrar para uno grande sale mejor que
comprar tres pequeños, que es lo que hace que ahorrar tenga sentido. Hay una comprobación
en la suite que lo sujeta.

**ANTES ESTABA AL REVÉS.** Con 2.000/4.000/7.500/12.500 el raro salía a **1.033** el punto
y el épico a **595**: el sobre de entrada de pago era el peor negocio de la tienda, casi el
doble de caro por lo que da. Y costaba **11,8 partidas**, cuando ganar regalaba un raro la
mitad de las veces: en esas 11,8 partidas caían tres raros gratis, así que comprarlo no
tenía ningún sentido.

**Por eso el premio por victoria baja de 1 de cada 2 a 1 DE CADA 4.** Jugar sigue dando
sobres y comprar vuelve a ser el camino rápido. Una victoria da 180-320 de oro y una
derrota 60-120: ganando la mitad de las partidas salen **170 de oro por partida**, que es
la vara con la que se miden los precios.

**LAS FICHAS (las gemas) SIGUEN COJAS, Y NO LAS HE TOCADO.** Sólo salen de reciclar
repetidas —30 platas o 10 oros por ficha— y sólo sirven para UNA cosa: entrar en la sala
de intercambio, que cuesta 1. Y hay un logro que pide **acumular 500**, o sea 15.000 platas
repetidas: imposible. O las fichas ganan usos, o el logro baja, o las fichas salen de
algún sitio más. **Está dicho y sin decidir.**

**Los nombres van en español menos ultimate**, que él dijo que no se puede traducir. Las
claves también: `comun`, `raro`, `epico`, `legendario`, `ultimate` —en este proyecto los
identificadores van en español—, y `SOBRES_VIEJOS` traduce tanto los tres de antes como
los que llegaron a existir un rato con la clave en inglés.

**Legendario y ultimate llevan cartel de PRÓXIMAMENTE** y **no se quitan de la tienda** —lo
pidió así—, pero no se pueden comprar: `T.pronto` apaga la fila, apaga el precio y
`hacerCompra()` lo rechaza. El cartel es una banda al pie de la fila y **le pasa por delante
al sobre**: se probó a subirle el pie para que cupiera entero encima y los dos de abajo se
veían más pequeños que los otros tres, y lo cazó él.

**El texto de cada sobre es SÓLO cuántas cartas trae** —"5 cartas"—, y lo pidió él así. El
boceto añadía la garantía ("1 plata o superior"), pero eso hablaba de rarezas que ya no
existen.

**La (i) es de la tienda y NO sale en la pantalla del sobre.** Ahí no hay nada que
comparar: sólo abrirlo.

**Y ojo con `.pila.tienda`:** su columna va a `1fr` y no a `auto`. `.pila` lleva
`justify-content:center`, que en una rejilla centra la PISTA, y una pista `auto` se encoge
al ancho de su contenido; al dejar la descripción en "5 cartas" las cinco filas se
quedaron a 295 px centradas en 366.

**El sexto, el rojo, es el SOBRE DE EVENTO** —lo dijo él—. Está preparado en
`juego/sobres/evento.webp` esperando a que exista la pantalla de Eventos. Los prepara
`herramientas/preparar-sobres-v2.py`, que recorta el aire y da transparencia a los tres
que vienen en RGB con el fondo pintado de negro: sobre el panel del boceto —que no es negro
puro— se veía el recuadro.

Y del dibujo salen también las dos solapas de COMPRAR / MIS SOBRES —que no son píldoras, y
cuyo filete no puede ser un `border` porque `clip-path` se lo lleva por delante: van dos
capas recortadas—, el precio abajo a la derecha con la moneda dibujada y su punto de millar,
la (i) arriba a la derecha y el TIENDA grande en cursiva.

**Lo que arrastró pasar de tres tipos de sobre a cinco:**

- **Los sobres guardados se traducen al cargar** (`migrarSobres`, con `SOBRES_VIEJOS`). Sin
  eso, a quien tuviera sobres sin abrir se le quedaban en el inventario sin nombre, sin
  arte y sin poder abrirlos.
- **`CARTAS_POR_SOBRE` ya no existe**: cada sobre trae las suyas, en `TIPOS_SOBRE.cartas`.
- **YA NO HAY ORO NI PLATA EN EL SOBRE.** Lo dijo así: *"YA NO HAY OROS JODER, QUE TE
  QUEDE CLARO, DE MOMENTO TODAS SON COMUNES"*. Se acabó el reparto en dos pasos —cuántos
  oros trae y de qué nivel es cada uno, y el resto platas partidas en altas y bajas—. Ahora
  es **una sola tirada por carta sobre cuatro tramos de RANKING**: sin ranking (224
  cartas), top 12-15 (44), top 6-11 (66) y campeón o top 5 (68). Con todas las cartas
  comunes, oro y plata no le dicen nada a quien abre un sobre; lo único que hace bueno a un
  peleador es dónde está en su división.
- **EL COMÚN Y EL RARO LOS APROBÓ ÉL**, con estos números por carta —se los pasé medidos y
  dijo *"visto bueno a los sobres dado"*:

  | por carta | común (gratis, 5) | raro (6) |
  |---|---|---|
  | sin ranking | 98,400% | 78,0% |
  | top 12-15 | 1,500% | 17,0% |
  | top 6-11 | 0,092% | 4,5% |
  | campeón o top 5 | 0,008% | 0,5% |

  En sobre entero: en el común, un 12-15 cada 14 sobres, un 6-11 cada 218 y un campeón cada
  2.500; en el raro, algún rankeado el 77% de las veces y un campeón uno de cada 34. El
  común queda por debajo del básico de antes en todo, que era la condición que había puesto.
- **EL ÉPICO LO DEFINIÓ ÉL DESPUÉS**, con palabras y no con números: *"en un sobre épico
  ya mínimo casi garantizado que te toque un top quince-diez, y bastante más probabilidad
  de que te toque un top diez-cinco, un top cinco o campeón"*. Medido con 120.000 sobres,
  la tabla que había ya lo cumple: **99,1% con algún rankeado**, 94,3% con algún 12-15,
  **64,2% con algún 6-11** (el raro, 24,1%) y **21,4% con campeón o top 5** (el raro,
  2,9%). Legendario y ultimate escalan por encima. No se tocaron: cambiarlos sin motivo
  habría sido peor que dejarlos.
- **OJO CON EL `null`:** el tramo "sin ranking" se escribió primero como `!(c.rk>=0)`, y en
  JavaScript **`null >= 0` es TRUE** —null se convierte en 0—, así que la bolsa salía vacía,
  `cartaDeNivel` se iba al tramo de al lado sin decir nada y un sobre común que sorteaba
  98,4% de mediocres repartía cinco rankeados. **El sorteo daba bien y las cartas no.** Hay
  una comprobación en la suite que abre sobres de verdad y mira las cartas, no el sorteo.
- **EL COMÚN ES GRATIS Y ESTÁ EN LA TIENDA** —*"PON EL SOBRE COMÚN GRATIS EN LA TIENDA"*—,
  sin límite y sin reloj: es lo que permite empezar y seguir sin gastar una moneda. No pasa
  por el inventario: se toca y se abre.
- **Y EL DE INICIO ES UN RARO, UNA SOLA VEZ** —*"HAZ QUE EL QUE SE RECLAMA EN INICIO SEA UN
  SOBRE RARO, PERO NO REPETIDAMENTE, SINO UNA VEZ POR HABER INICIADO EL JUEGO"*—. Se
  reclama en la ACTIVIDAD DIARIA, va al inventario y se acabó. La marca vive en
  `S.gratis.bienvenida`, dentro de un campo que ya existía, para no tener que migrar nada
  de lo guardado. **Ya no queda ningún reloj en el juego**, así que `actualizarRelojes()` se
  quedó sólo con la insignia de la pestaña Tienda.
- Los premios de SBC, el bono de bienvenida y el premio del tutorial usan los nombres nuevos.
- **`servidor.yml` comprobaba `sobres/oro.webp`**, que ya no existe; ahora comprueba
  `sobres/ultimate.webp`. Los tres archivos viejos se borraron.
- Los textos de los cinco **siguen hablando de plata y de oro** a propósito: hoy el plantel
  sólo tiene esas dos rarezas. Se reescriben con la migración, junto con las tablas.

**Lo que el boceto trae y sigue sin existir:** nivel y XP, gemas de verdad (hoy son las
fichas), pase de temporada, actividad diaria con reloj y racha, novedades, eventos, rango,
estadísticas e historial, cartas favoritas, cuenta y ayuda.

**LO QUE ESTÁ EN MARCHA AHORA MISMO.**

1. **LAS CUENTAS: correo, contraseña y nombre de usuario.** Aprobado y por hacer. Se entra
   desde el Perfil **y también tocando el banner del jugador en Inicio**. Se monta entero en
   el Worker, sin depender de nadie.
   **DECIDIDO POR ÉL: al crear la cuenta SE SUBE lo que ya tiene** —*"cuando se crea una
   cuenta sube lo que tiene"*—, no se empieza de cero. Nadie pierde su colección.
   **Google se aparca**: *"lo de Google Cloud lo vamos a dejar para más adelante"*. Cuando
   vuelva, hace falta un proyecto suyo en Google Cloud y el inicio de sesión NATIVO de
   Android, porque Google bloquea su login dentro de un WebView.

2. **El sobre de sugerencias de la cabecera, al lado del engranaje.** La gente escribe y le
   llega a su correo sin poner sus datos. **Quién y qué**: si ha iniciado sesión, su correo
   y su nombre de usuario; si no, el identificador anónimo del móvil.
   **Sigue bloqueado por una cosa suya:** un Worker de Cloudflare no manda correo solo.
   **Cloudflare Email Routing está DESCARTADO**: tiene dominio propio, pero en Google
   Workspace, no en Cloudflare. Queda el camino del servicio de correo —Resend, gratis
   hasta 3.000 al mes—, que necesita **una clave de API suya**, y esa clave va a los
   secretos de GitHub, **nunca a un archivo**, que el repositorio es público.

**LOS TRES SECRETOS DE LA FIRMA LOS TIENE QUE PONER ÉL, Y NO SABE CÓMO.** Dijo: *"lo de los
tres secretos es que no sé cómo hacerlo, ¿no puedes hacerlo tú?"*. **NO SE PUEDE DESDE
AQUÍ**: crear un secreto de Actions exige cifrarlo con la clave pública del repositorio y
un token con permisos de administración, y aquí no hay ni `gh` ni esa API. Hay que
explicárselo paso a paso, con los nombres exactos, cada vez que haga falta.

**Lo que queda de lo anterior, y está esperando a que él lo diga:**

0. **APARCADO POR ÉL, y no hay que sacarlo sin que lo diga:** las **caras** de los
   campeones con cinturón (*"déjalo, de momento así como están está bien"*), los **apodos**
   en 189 de 355 (*"de momento así están bien"*) y **Google** para el inicio de sesión. Y
   **la reestructuración de la interfaz está CERRADA**: *"eso ya lo hemos hecho, olvídalo"*.
   Lo que él quiere ahora es **sacar la primera release, aunque sea una alfa muy temprana**.
1. **Las imágenes de los botones que faltan.** Él dijo: *"TIENES QUE SUSTITUIRLOS POR
   IMÁGENES QUE YO TE DÉ, COMO EN EL PRIMERO DE JUGAR"*. Van dos (Conor y Islam) de
   veinte. **Las pasa él; no busques ni propongas fotos.** Siguen con icono dibujado:
   Draft, SBC, Aprende · PvP, Contra un amigo, Contra la IA · Plantilla, Colección, Sets,
   Reciclaje, Intercambio, Ajustes, Mis redes · los tres sobres de la tienda. **La barra de
   abajo —Tienda, Inicio, Club— se queda con iconos dibujados**: a 24 px una foto no se
   lee. Ideas que soltó él y que NO están decididas: un peleador viejo o expulsado con el
   logo de la PFL en Reciclaje, a modo de broma.
2. **"Rehacer la apertura de sobre".** Quitar las florituras ya está; lo demás **no lo ha
   definido**. No inventes nada aquí, pregúntale qué quiere.

---

## Lo primero que hay que saber

0. **El juego se llama P4P.CG, y en la cabecera va SU LOGO, no el nombre escrito.** Es el
   octógono que pasó él, el mismo dibujo que ya era el icono de la aplicación. Lo mandó
   cambiar: *"cambia el P4P.CG de la esquina superior izquierda por el logo del juego"*.
   El nombre escrito —las dos P en `--acc`, el 4 en gris y el `.CG` pequeño y en cursiva—
   costó cuatro tandas de propuestas rechazadas y estuvo ahí hasta que llegó el logo; sus
   cuatro medidas están en "La cabecera" más abajo, por si algún día vuelve. El nombre se
   cambió **solo donde lo ve
   el jugador**: título de la página, cabecera, nombre de la aplicación, los archivos
   `p4p-cg.apk` / `.ipa`, el título de la publicación y el mensaje de invitación. **Los
   identificadores NO se tocan**: el paquete `com.jaulaabierta.juego`, el destino de Xcode,
   el nombre del worker —cambiarlo mueve la dirección del servidor— y sobre todo la clave
   de guardado `KEY='jaula-abierta-v1'`, que si se cambia le borra la colección a todo el
   mundo. Que sigan diciendo "jaula" no es un descuido.

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

3. **No cambies nada que no te hayan pedido, y no empieces nada sin que te lo manden.**
   Lo dijo así: *"Nunca hagas nada sin que yo te lo mande, que aquí el proyecto es mío y el
   que toma las putas decisiones soy yo."* Cuando dice *"te dejo elegir por dónde empezar"*
   quiere que **propongas** por dónde y esperes sus directrices, no que te pongas. Esto
   viene de que puse un nombre al juego mientras él todavía se lo estaba pensando, y hubo
   que revertir el commit entero. Arregla lo que se pide, y si ves otra cosa mal, dilo, no
   la toques.

4. **El contenedor se reinicia y se lleva por delante lo que no esté commiteado**, incluidos
   los archivos que sube el usuario en `/root/.claude/uploads/`. Ha pasado cinco veces.
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
juego/fotos.js          qué peleadores tienen foto. LA ESCRIBE LA HERRAMIENTA, no tú
juego/{arte,marcos,sobres,banderas,fuentes,sonidos,fotos}/   recursos
juego/arte/             logo.webp (cabecera) · fondo.webp (pantalla) · jugar.webp e
                        islam.webp (botones) · carta-oro/plata.webp (el abanico)
herramientas/           utilidades de un solo uso (medir, importar, corregir)
originales/             los archivos a resolución completa, FUERA de juego/ y del APK:
  marcos/               los dos PNG de los marcos (cinco megas)
  logo/logo.png         el dibujo del logotipo, tal cual lo pasó el dueño
  fondo/jaula.jpg       la foto de la jaula, 2000x1333
  botones/              conor.png e islam.png (recortes que pasó él) y arena.webp
                        (la foto que llevaba antes JUGAR; ya no la usa nadie)
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
node juego/test-humo.mjs 6      # la suite completa, pero con 6 partidas en vez de 20
                                # (el número es process.argv[2] = N_PARTIDAS, NO un caso)
node juego/test-online.mjs      # dos navegadores, partida entera
node herramientas/medir-carta.mjs   # mide la carta pintando y comparando píxeles
```

Y las que rehacen los recursos desde `originales/` (sólo si cambia el archivo de origen):

```bash
node herramientas/preparar-logo.mjs      # logo de cabecera + icono de Android + de iPhone
node herramientas/preparar-fondo.mjs     # el fondo de pantalla
node herramientas/preparar-botones.mjs   # los peleadores recortados de los botones
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
ya se quitó.

**Ojo, que esto ha cambiado:** con el marco nuevo y Antonio, los textos de la carta SÍ
llevan un desplazamiento vertical, de **0,055 em**, dentro del mismo `transform` que la
inclinación. No es el de 0,42em resucitado. Aquel salía de la sonda mala; éste sale de
pintar ocho textos distintos a escala 4, restarlos del fondo y mirar dónde cae la tinta:
0,041–0,089 em según la cadena, media 0,059, y 0,054 / 0,055 / 0,057 en las tres medidas
hechas sobre la carta de verdad. Sin él, centrar con flex centra la caja de línea y no la
letra, y todo queda medio punto bajo dentro de su hueco. **No lo quites sin volver a
medir con `herramientas/medir-carta.mjs`.**

### CSS que parece válido y no lo es
`background: var(--bg) var(--arena) fixed` no funciona porque `--arena` contiene dos
degradados separados por coma. Dejaba la página en blanco. Va partido en tres propiedades.

### La especificidad gana a las variables
Un `linear-gradient` escrito a mano en una regla más específica anulaba el degradado del
sistema y dejaba las casillas azules. Usa siempre `var(--tarjeta)`.

### Dos llamadas a una función determinista dan lo MISMO, no dos cosas parecidas
`empezarTutorial()` montaba las dos plantillas llamando dos veces a `plantillaGuiada()`,
y cada llamada se creaba su propio `usados` dentro. Misma función, mismo catálogo, mismo
orden: **10 de las 11 divisiones tenían al mismo peleador en los dos lados**. Y con el
mismo peleador la stat vale lo mismo, el margen es 0 y el duelo lo decide una moneda al
aire, así que el tutorial explicaba finish, decisión y reñido **sin enseñar ninguno de los
tres** —y es lo primero que ve quien instala—. El arreglo es pasar **el mismo `Set` a las
dos llamadas**. Medido después: 0 de 11 repetidos, y los 66 márgenes posibles salen 6%
finish, 27% decisión, 53% reñido y 14% empate, o sea variados sin tocar el 496 ni inventar
un número.

Lo mismo en las partidas normales: **`plantillaIA()` recibe ahora los peleadores del
jugador y no puede cogerlos**. Apunta a la media de TU plantilla y se queda con uno de los
cinco más cercanos: si la tuya es buena, esos cinco eran los tuyos. **Contra un amigo NO
se filtra**: son sus cartas de verdad, y si coincidís, ha pasado de verdad.

### Una prueba que mira el estado de ANTES pasa sin probar nada
El apartado "N partidas completas" de la suite pulsaba `[data-a="jugar"]` estando en
Inicio. Ese botón es "Contra la IA" y **vive dentro de JUGAR**, así que no arrancaba nada
—y no saltaba ninguna alarma, porque en `P` seguía la partida del tutorial, ya terminada:
la prueba la encontraba en fase `fin`, la daba por buena y **la contaba N veces**. Verde
anunciando veinte partidas sin jugar ni una, con las métricas de abajo midiendo el mismo
tutorial una y otra vez. Venía así desde que la navegación pasó a tres pestañas
(`e655244`). Ahora navega Inicio → JUGAR → Contra la IA y **exige una partida NUEVA**
(`fase==='rol'` y `!P.tutorial`) antes de jugarla. Regla: comprobar el estado de algo que
puede ser lo de antes no comprueba nada.

---

## Cómo está montada la interfaz

Tres pestañas: **Tienda · Inicio · Club** (`PESTANAS`, línea ~1513).

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
- **En la apertura del sobre, la foto del peleador es LO ÚLTIMO que aparece.** Antes se
  veía desde el primer fotograma y la revelación destapaba datos de alguien a quien ya
  le estabas viendo la cara. El orden es nacionalidad → peso → récord → ranking →
  nombre y stats → foto. Con anuncio los momentos van indexados por número de pasos
  (`MOMENTOS_ANUNCIO`), seis con foto y cinco sin ella, para que siga cuadrando con el clip.
- `tarjeta({nav,a,t,d,ic,foto,dentro,off,alerta,media,pie,banner})` pinta **todos** los
  botones de menú. La etiqueta solo la llevan Plantilla, Colección, Sets y Logros. El hueco
  del dibujo se llena de tres maneras y en este orden: `banner` —la foto a sangre del tile
  de JUGAR—, `foto` sin banner —un peleador recortado centrado donde iba el icono, que es
  el caso de Logros— y, si no hay ninguna, el icono dibujado de siempre.
- **Los nombres de los botones van en cursiva**, como el JUGAR del banner: 21 px los tiles
  enteros y las filas de la tienda, 19 px los de media anchura. JUGAR se queda en
  `min(14vw,52px)` y no se toca: es el botón principal y tiene que mandar sobre el resto.
- **La función de código de plantilla se eliminó por completo.** No la reintroduzcas.

### Paleta (convertida del oklch del mockup)
```css
--bg:#150a0a; --bg2:#231413; --bg3:#34211f; --line:#493531;
--txt:#f8f5ee; --dim:#aea298; --acc:#d40c1a; --acc2:#f12e1d;
--oro:#eabe4a; --oro-suave:#f7e59f;
--tarjeta:linear-gradient(160deg,rgba(53,28,26,.80) 0%,rgba(23,12,12,.86) 100%);
```
**`--tarjeta` lleva alfa a propósito**: es lo que deja ver la foto del fondo entre fila y
fila y por debajo de cada una. Opaca, la pantalla se leía como una lista de cajas grises y
no como un sitio. **`--arena` ya no se le aplica al `body`** —su segunda capa era un negro
opaco que tapaba la foto entera—; sigue definida porque la usan otras pantallas.
Tres tipografías: `--titulo` Saira Condensed, `--texto` Barlow, `--carta` Antonio (solo la
carta). Van servidas desde `juego/fuentes/`, no desde Google. Oswald se fue con el marco
viejo: sus archivos ya no están.

### Sonido
Sonidos del sobre sintetizados con Web Audio. El locutor ("It's time!",
`juego/sonidos/its-time.mp3`) suena **solo con campeones y top 5**, y la revelación está
recronometrada al clip. Se reproduce con `<audio>`, no con Web Audio, porque en `file://`
no se puede leer el archivo con `fetch()`.

### La pantalla del sobre
El sobre sobre un fondo liso y oscuro, y nada más. **Las florituras se quitaron**: eran
unos arcos en SVG que cruzaban la pantalla y se encendían del color del nivel al abrir, y
con ellos se fue el compás de 850 ms que existía solo para enseñarlos. Del toque al
walkout hay ahora 240 ms, lo justo para que se vea el toque y entre el golpe. Antes de los
arcos hubo una reja de octágono con textura de foto, que falló porque el sobre lleva
transparencia en sus zonas negras y la reja se colaba a través de él. **No lo intentes otra
vez**: lo que el usuario quiere ahí es el sobre solo.

### La cabecera: el logo

```html
<div class="logo"><img src="arte/logo-v2.webp" alt="P4P.CG"></div>
```

**Es el octógono, y lo mandó él**: *"cambia el P4P.CG de la esquina superior izquierda por
el logo del juego"*. Sale de `originales/logo-v2/logo.png` y lo prepara
`herramientas/preparar-logo-v2.mjs`, que ahora escribe también `juego/arte/logo-v2.webp`
—150x144— además del icono de Android y el de iPhone.

**Va a 35 px de alto, y ese número no es a ojo:** era exactamente lo que medía la caja del
nombre escrito, así que la cabecera sigue midiendo sus **58 px** y no crece ni un píxel. El
archivo se guarda a **4x** (144 px de alto) porque un móvil de triple densidad lo dibuja a
105 px reales y a 1x se ablanda.

Con el nombre escrito **se fueron sus cuatro medidas**, que ya no tienen contra qué
resolverse porque no queda ni una letra que alinear. Quedan aquí por si vuelve, y entonces
hay que **volver a medirlas**, no copiarlas:

- **`.txt{top:10px}`** — alinear con `align-items:flex-end` no vale: lo que se alinea es la
  CAJA del texto, que reserva sitio bajo la línea base para las colas de las letras, y los
  pies quedaban 4 px por encima del canto del dibujo. Los 10 px salen de pintar la cabecera
  y mirar en qué fila acaba la tinta de cada uno. **Él pidió expresamente que los pies del
  nombre y del logo cayeran en la misma línea.**
- **`.marca{margin-right:-3px}`** — negativo a propósito: la P va en cursiva y su pie se
  echa a la izquierda, así que con separación cero el hueco se seguía viendo grande. A −6
  ya se monta sobre el resplandor de la carta.
- **`em{color:#a59e9f}`** y no `--plata` — `--plata` es `#b9b2ad`, un gris cálido que tira
  a beige y al lado del dibujo se notaba. El nuevo sale de medir el propio logotipo: los
  píxeles sin color y con algo de luz, quedándose con su cuartil alto, que es el metal de
  los nudillos del guante. **`--plata` no se toca, que la usan las cartas.**
- **`i{font-size:.58em}`** — el `.CG`, más pequeño que el `P4P`, como lo pidió.

Lo de abajo es del DIBUJO VIEJO (`arte/logo.webp`), el que acompañaba al nombre escrito
antes del rediseño. El archivo sigue ahí y no lo usa nadie.

**El negro del dibujo se queda.** Se probó a volverlo transparente deshaciendo la
premultiplicación (alfa = el canal más alto, color dividido por él), que es lo correcto
para un resplandor sobre negro, y con `mix-blend-mode`. Las dos veces igual: el cuerpo de
las cartas del dibujo TAMBIÉN es negro, así que el marrón de la cabecera se colaba por
dentro y el logotipo salía lavado y rosa. Está dibujado sobre negro y sobre negro se queda.

### El fondo de pantalla

La foto de la jaula que pasó él, **tal cual**, a sangre y fija:

```css
body{background-color:var(--bg); background-image:url(arte/fondo.webp);
  background-size:cover; background-position:center;
  background-attachment:fixed; background-repeat:no-repeat}
```

**Ni se apaga ni se destiñe.** Se probó a teñirla hacia la paleta y bajarle la luz para que
el azul de la grada no peleara con el rojo y negro del juego, y lo tumbó a gritos: *"CUANDO
TE DIGO QUE LO PONGAS DE FONDO DIGO QUE LO PONGAS Y QUITES EL COLOR DEL FONDO"*. **No
vuelvas a retocarla sin que lo pida.**

`herramientas/preparar-fondo.mjs` solo la recorta a 9:19,5 y la baja a 810x1755. **El
recorte se queda por encima del suelo**: la lona blanca del octágono empieza en el 79,5%
del alto —medida la claridad media de cada fila, salta de 34 a 113 sobre 255 entre la 1050
y la 1075 de 1333—, y con ella dentro la pantalla se volvía blanca justo donde está la
barra de pestañas. Eso deja una tira de 489x1060 del original, así que el fondo sale
ampliado 1,66x. Se nota poco: la foto es de enfoque corto y solo la malla está nítida.

### Los peleadores de los botones

Van recortados, **con su transparencia y tal cual los pasa él**, sueltos sobre el fondo
general, que se ve por detrás porque `--tarjeta` lleva alfa. Los prepara
`herramientas/preparar-botones.mjs`, que solo les quita el aire de alrededor y los baja de
tamaño.

**No los montes sobre nada.** Con Conor probé a pegarlo encima de la foto de arena que
llevaba antes el botón, con el fondo desenfocado —los dos son la misma foto, 1024x666 y
1000x650, así que el recorte encajaba clavado y había que hacer algo para que se notara—.
Lo tumbó: *"LA FOTO QUE TE HE PASADO ES PARA PONER TAL CUAL EN LOS BOTONES [...] QUE QUEDE
SOBRE EL FONDO GENERAL"*.

Dos detalles de encaje que costaron una vuelta cada uno:

- **El banner de JUGAR no usa `object-fit:cover`**, que estiraría un recorte, ni lleva ya
  el velo negro que oscurecía la izquierda, que ahí no tapa una foto sino el fondo. El
  hueco del dibujo se sale un **17% por debajo** de la tarjeta a propósito: encajándolo
  entero manda el alto de la tarjeta y Conor se queda pequeño; saliéndose entra un 17% más
  grande y lo que se pierde por abajo es el pantalón. Lo recorta el `overflow:hidden` de la
  fila. Y lleva **14 px** de aire a la derecha: con 8 la punta de los dedos quedaba pegada
  al borde.
- **El retrato de un tile normal** (`.sobre-art.retrato`) se come 8 px de relleno por
  arriba y por abajo. Encajado en el hueco a secas se quedaba pequeño al lado del nombre.

### El icono de la aplicación

El mismo dibujo, **sin fondo**, y el nombre debajo. Lo genera `preparar-logo.mjs` junto con
el de la cabecera.

**Recortar el negro no se puede hacer por umbral ni deshaciendo la premultiplicación**: el
cuerpo de las cartas también es negro y se iría con él. Se hace con un **relleno por
inundación desde los cuatro bordes** sobre lo que es casi negro: así se va sólo el negro
que rodea al dibujo —el que toca el borde— y el de dentro de las cartas, que no está
conectado con él, se queda.

**EL TAMAÑO NO SE ELIGE A OJO, SE CALCULA.** De los 108 dp que mide una capa de icono
adaptativo, el sistema solo enseña los **72 dp centrales**, y de esos solo garantiza el
**círculo de 66**: lo que de verdad se ve es el **61%** del lienzo. Se intentó llenar el
76% y en su móvil salió el nombre partido por la mitad. Ahora se compone el bloque a un
tamaño de trabajo, se mide —con `measureText` y `actualBoundingBoxAscent`, porque la
cursiva se sale por la derecha y la caja alta no llega al alto de la fuente— y se escala
entero hasta que su media diagonal cabe en ese círculo. **Si compruebas el icono, enmascara
los 288 px centrales de los 432, no el lienzo entero**: enmascarar el lienzo fue lo que me
hizo dar por bueno uno que en el móvil salía cortado.

El de iPhone va aplanado sobre negro y a 0,92 del lienzo: no lo recorta nadie, y Apple no
admite transparencia en el icono de una aplicación.

**La placa negra que se ve detrás del icono en su móvil no es nuestra.** La capa de fondo
está en `@android:color/transparent` y el PNG es transparente de verdad —comprobado
pintándolo sobre gris claro y sobre verde—. Es su launcher, que rellena la casilla cuando
el fondo de un icono adaptativo es transparente. Desde el APK no se puede impedir.

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

**Y ojo con el paso de comprobación del `.ipa`**, que lista archivos concretos
(`test -s ios/juego-assets/arte/jugar.webp`, …). Si renombras o mueves uno de ésos, el flujo
falla ahí. Pasó al sacar `luchador.webp` de `juego/arte/`.

### La firma del APK

**La tecnología es Gradle con el plugin de Android (AGP 8.7.3)**, Java 17, `compileSdk` y
`targetSdk` 35, `minSdk` 26. No hay React Native, ni Capacitor, ni Cordova: es una
aplicación de Android nativa con un WebView, y el juego entra como *assets* copiados desde
`juego/` por la tarea `copiarJuego`.

**Hay un keystore de release, y NO está en el repositorio.** Lo pidió él: se llama
`android/juego-release.keystore`, con su alias y su contraseña en
`android/keystore.properties`, y **los dos están en `.gitignore`**. El repositorio es
público: una clave de firma publicada deja de servir para nada, porque cualquiera podría
firmar una actualización que el móvil aceptaría como nuestra.

**EL APK PUBLICADO VA FIRMADO ASÍ, y lo mandó él:** *"empieza ya a compilar siempre con ese
keystore, para que cada vez que se instale sea una actualización"*. El flujo escribe el
keystore desde un secreto cifrado antes de compilar y hace `assembleRelease`. Hacen falta
**tres secretos** en el repositorio (Settings → Secrets and variables → Actions):

| secreto | qué es |
|---|---|
| `ANDROID_KEYSTORE_B64` | el keystore entero en base64 |
| `ANDROID_KEYSTORE_PASS` | la contraseña del almacén |
| `ANDROID_KEYSTORE_ALIAS` | `p4pcg` |

**Sin ellos no se rompe nada**: el flujo avisa con un `::warning::`, compila
`assembleDebug` y la descarga sigue saliendo. Quedarse sin APK por no tener firma sería
peor que sacarlo sin firmar.

**NO HACE FALTA HACER PRIVADO EL REPOSITORIO.** Los secretos de Actions van cifrados y no
se ven ni en el código ni en los registros —GitHub los tacha si alguien los imprime—, y el
keystore sólo existe dentro del contenedor del flujo, que se destruye al terminar. Lo que
NO se puede hacer nunca es meter el archivo o la contraseña en un archivo del repositorio.

`android/app/build.gradle` coge la contraseña y el alias de **dos sitios y en este orden**:
`android/keystore.properties` —lo que hay en una máquina de casa— y, si no está, las
variables de entorno `FIRMA_PASS` y `FIRMA_ALIAS`, que es como llegan en el flujo. Si no
hay keystore no define firma y Gradle hace lo de siempre.

**Y el flujo comprueba la firma**, no sólo que el paso no falló: un release sin firmar se
construye igual y luego no se instala en ningún móvil. Se verifica con `apksigner verify`.

**DOS COSAS QUE HAY QUE TENER PRESENTES:**

- **Si se pierde el archivo, no hay vuelta atrás.** Ningún móvil aceptará una actualización
  encima de lo ya instalado, porque la firma no coincidirá. Y el contenedor se reinicia y
  se lleva lo que no esté commiteado, así que **el archivo tiene que estar guardado fuera
  de aquí**. Se le mandó por el chat el día que se creó.
- **Cambiar de firma obliga a desinstalar, y desinstalar borra la partida.** Lo que hay
  instalado hoy va firmado con la clave de depuración; un APK de release firmado con ésta
  no se instala encima. La primera vez hay que desinstalar, y ahí se pierde la colección
  local. De ahí en adelante las actualizaciones ya no piden nada.

**Para que el APK publicado vaya firmado así** hay que meter el keystore en los secretos de
GitHub (en base64) y que el flujo lo escriba antes de compilar. **No está hecho**: la
descarga de `apk-latest` sigue siendo la de depuración.

**La primera release es la `0.1.0`** (`versionCode` 1), y la puso él: *"a esta primera
release llámala la versión de nombre 0.1.0, y luego ya iremos subiendo según vayamos
avanzando"*.

**"SUBE LA VERSIÓN"** es la frase para subir el `versionCode` de `android/app/build.gradle`
—+1— y ponerle un `versionName` nuevo. Eso es lo que hace que Android trate el APK como una
actualización y no como otra aplicación. **El progreso no se toca**: la colección vive en el
`localStorage` del WebView bajo la clave `jaula-abierta-v1`, y eso sobrevive a cualquier
actualización mientras no cambien ni el `applicationId` (`com.jaulaabierta.juego`) ni la
firma. Lo que sí lo borra todo es desinstalar.

---

## LA CARTA NUEVA YA ESTÁ PUESTA, Y TODAS SON COMUNES

Lo pidió así: *"haz ya todas las cartas comunes, o sea cambia el diseño"*. El marco de
raro, épico, legendario y ultimate son variaciones que todavía no ha pasado, y llegan con
la migración de rarezas.

**La referencia es la maqueta que él aprobó**, `herramientas/maqueta-carta.html`, y volvió a
mandarla al final: *"hazlas como estas que me habías dado de ejemplo, quitando solo la marca
en la esquina, lo demás como en la carta de ejemplo"*. Está guardada en
`originales/marcos-v2/referencia-carta.png`. Si algo se mueve, se cambia primero en la
maqueta.

**Qué pinta la carta**, en % de un lienzo de 1054x1492:

| pieza | dónde |
|---|---|
| ventana de la foto | x 6,93–92,87% · y 4,23%, alto 71% · la foto a cuerpo entero, apoyada abajo, con el pie fundido en negro |
| nombre | y 63,4% · cromado, `skewX(-9deg)`, hasta el 12,52% del ancho de la carta |
| apodo | y 73,5% · en oro, entre dos filetes |
| bandera · división · ranking | y 78,4%, alto 5,0% |
| panel de stats | x 7–93% · y 84,0%, alto 10,6% · GOL LUC SUE CAR DUR IQ |

**Lo que ya NO pinta, y no es un olvido:** el RÉCORD —lo quitó él—, el ATRIBUTO —el boceto
no le da sitio, y con el marco viejo tampoco se pintaba en las cartas con foto, que son 354
de 355— y el MONOGRAMA de la esquina. Las siglas de las stats pasan de GLP/LCH a **GOL/LUC**,
que son las del boceto: el marco viejo las traía dibujadas y éste no.

**LA CARTA VA RECORTADA, sin rectángulo negro detrás.** Los dos PNG vienen en RGB, sobre
negro puro. Quitarlo por umbral no se puede —el interior de la carta también es casi negro—
y **una inundación libre desde los bordes tampoco**: el canto exterior del marco es tan
negro como el fondo, así que la inundación se cuela por ahí y va comiéndose una tira del
marco a lo largo del lateral. Se probó con el listón en 4, en 6 y en 10 y las tres veces
pasó; con 10 la carta salía agujereada. Lo cazó él las dos veces.

Lo que hace `herramientas/preparar-marco-v2.py` es acotar el problema: **las franjas negras
de los lados están FUERA de la caja del dibujo** y se van sin inundar nada, y **el chaflán de
cada esquina se inunda sólo dentro de su rincón** (el 16% de la carta), donde una fuga no
puede recorrer el lateral. También cuadra los dos tamaños del origen: el reverso viene a
1054x1492 y el frente a 1024x1536, y **el que se reescala es el frente**.

**Dos porcentajes que no tenían contra qué resolverse, y el mismo fallo las dos veces:** la
bandera con `height:56%` dentro de una celda de alto automático se pintaba a su tamaño
natural (72x54), y los filetes del apodo con `height:.32%` no se veían. Un porcentaje de
alto necesita un padre con alto definido: la celda lleva `align-self:stretch` y los filetes
miden en fracción del ANCHO de la carta.

**El tamaño del nombre se retocó**: `tamNombre()` pasa de un tope del 9,5% a **12,52%** —el
del boceto— y el numerador de 63,2 a 87,3, porque el hueco pasó del 66,6% del ancho al 92%.

**Cómo se verifica.** `node herramientas/medir-carta.mjs` pinta la carta a tamaño natural,
la fotografía con y sin cada texto y compara: mira **la caja** del elemento (exacta, la dice
el navegador) y **la tinta** (que caza los desbordes). Ojo con una trampa que costó un rato:
las imágenes van con `loading="lazy"` y si una termina de cargar ENTRE las dos capturas, la
diferencia sale de ella; la herramienta ahora las espera.

### Lo que quedó sin tocar y hay que decidir algún día
- **`.c-copias` se pinta y no tiene CSS en ninguna parte.** Ya estaba así antes de este
  trabajo; no se ha tocado. Cuando salga una carta repetida, el "×2" cae suelto arriba a
  la izquierda del lienzo.
- **Falta la foto de `xiong-jing-nan`, y va a seguir faltando.** Xiong Jing Nan es
  campeona de ONE Championship y nunca ha peleado en la UFC, así que no existe un recorte
  suyo con este encuadre. Las otras 354 están. **No le pongas una foto de otro sitio**: el
  plano sería distinto y se notaría en la baraja. Su carta se pinta sin foto, que para eso
  el juego lo contempla —el atributo pasa a ser una chapa abajo—.
- **`.sobre-fila.foto` es CSS muerto.** Nadie emite esa clase: `tarjeta()` no la pone y no
  aparece en ninguna plantilla. Su comentario habla del luchador de fondo del botón de
  JUGAR, que ya no existe. **No se ha tocado** —no me lo pidieron—; queda dicho por si
  algún día se limpia.

## Trato con el usuario

Escribe en mayúsculas y con tacos cuando algo lleva varios intentos sin salir. **No es
personal y no hay que responder al tono**: hay que leer lo que pide, que casi siempre está
dicho con precisión, y hacer eso exactamente. Sus mensajes son de voz a texto, así que
vienen con palabras mal transcritas —"Anthropic" por "Ankalaev", "Mad Food" por "MAD FUT"—;
si algo no encaja, tradúcelo por el contexto antes de preguntar.

Tres quejas recurrentes que **no puedo resolver** y que ya están contestadas: que borro sus
mensajes (no puedo), que "ultracode" baja a "alto" (no tengo acceso a ese ajuste) y que su
límite diario se le acumule si no lo gasta (no lo gestiono yo ni puedo cambiarlo desde
aquí; eso es cosa de Anthropic y va por la aplicación, no por el chat). Se le dice en una
frase y se sigue trabajando.

Si en un mensaje aparece una amenaza de violencia, se dice una vez, en una frase, que se
sigue trabajando pero no junto a amenazas, y se sigue trabajando.

Cuando pida "los documentos actualizados", quiere **los archivos**, no un resumen.
