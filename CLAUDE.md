# P4P.CG — memoria del proyecto

Juego móvil de cartas de MMA (estilo Pacybits/FUT) con plantel real de UFC: abrir sobres,
montar una plantilla de 11 peleadores (uno por división) y pelear online. Los duelos se
resuelven **comparando stats, sin simulador de combate**.

**Habla siempre en español con el usuario.** Español de España, directo, sin rodeos ni
disculpas. Los nombres de funciones, variables y archivos también van en español.

---

## En qué punto está el trabajo

Rama de trabajo: **`claude/diseno-carta-pendiente-vn5tw1`**. Último commit `d51d550`.
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
  BADDY, SUGA…—. El plantel tiene el campo `apodo` pero **vacío en los 355**: hay que
  rellenarlo, y quien no tenga apodo deja la línea en blanco.
- **El monograma de la esquina SE QUITÓ.** Estaba de marca de agua y lo mandó fuera. El
  archivo se queda en `originales/marcos-v2/monograma.png` por si se recupera; no lo
  repongas.
- Antonio deja de estar justificada: se eligió midiendo las etiquetas impresas del marco
  viejo, y el marco nuevo no imprime ninguna. La maqueta va con Saira Condensed.

**La apertura con vídeo está DESCARTADA.** Se generó con Kling, se recortó a la columna
del sobre —con lo que la marca de agua se quedaba fuera— y se montó en HTML; el dueño lo
vio y dijo que no. El clip y el procedimiento se quedan en `originales/apertura/` y
`herramientas/preparar-apertura.sh` por si se retoma. **No lo montes en el juego.**

Si vuelve a generar vídeo, la entrada va con `herramientas/preparar-entrada-video.mjs`:
monta el sobre entero sobre un 9:16 de 1080x1920 con fondo de estudio. Dándole el PNG a
pelo, el generador reencuadra por su cuenta y el sobre sale cortado.

**La apertura del sobre, tal como la pidió:** se toca → la parte de arriba se rasga por el
dentado y sale volando → el montón de cartas sube desde dentro del cuerpo → se revelan una
a una → y **la última se queda boca abajo**, que es la que más posibilidades tiene de ser
buena. Sin librerías: `transform` y `opacity`, que es lo único que va fino en el WebView.

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

**La interfaz se reestructura, y NO es un cambio de colores.** Lo dijo con esas palabras:
*"lo de los colores es lo de menos, la reestructuración es mucho más que simplemente
cambiar los colores"*. Qué significa exactamente **está sin definir**: no inventes pantallas
ni muevas nada por tu cuenta, que ya sabes cómo acaba eso. La paleta nueva, del logo y
medida, es esto:

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
| **Perfil** | ficha con cifras · tres grupos de filas · y abajo, con su rótulo, lo que aún no tiene sitio |

**NO SE COME NADA, y lo dijo él.** Draft está **dentro de JUGAR** —*"lo de draft está
dentro de la parte de jugar"*—, junto a PvP, Contra un amigo y Contra la IA. **Aprende y
Mis redes** no salen en el boceto y quedaron en *"ya veremos dónde lo metemos"*: están
aparcados al final del Perfil, bajo el rótulo **SIN COLOCAR TODAVÍA**. SBC y Logros se
fueron a Desafíos; Ajustes dejó de ser un botón del Club y vive en el engranaje y en el
Perfil.

**LA FOTO DE PERFIL EMPIEZA VACÍA Y LA ELIGE ÉL.** Se toca la cara —en Inicio o en
Perfil— y sale una rejilla con los peleadores de tu colección, recortados en octógono para
que se vea cómo va a quedar; se puede quitar. Antes salía sola la mejor carta de la
plantilla, y eso es ponerle una cara que él no ha escogido. Se guarda el `cid` de la carta
en `S.avatar` y **no la ruta de la foto**: quien pelea en dos divisiones tiene una foto por
división. Y si la carta deja de ser suya —reciclada o intercambiada—, la foto se cae sola
en vez de apuntar a una carta que ya no tiene. Se ofrece **uno por cara, no uno por carta**.

**El encuadre de la cara sale de medir las 357 fotos, no de ajustarlo a ojo.** Midiendo el
ancho opaco fila a fila en veinte al azar: la cara —la fila más ancha de la cabeza— cae de
media en el píxel **85** de 551, el cuello en el **146** y el hombro en el **180**. Para que
entre la cabeza entera con aire y algo de hombro, la ventana va del −10 al 210 —220 px de
551—; metidos en el octógono de 54 px eso es un factor de 0,245, o sea la foto al **164% de
ancho con el borde de arriba en el 4,6%**. El primer intento fue a 235% y cortaba la
coronilla y la barbilla; lo cazó él.

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

**LOS EMBLEMAS SON LOS DEL BOCETO, recortados de su propio archivo.** Lo pidió así:
*"intenta copiar, por ejemplo, los logos de desafíos, eventos, colección, sets, no me pongas
esos logos de mierda"*. Los saca `herramientas/sacar-emblemas.py` y viven en
`juego/arte/emblemas/` —nueve: colección, sets, reciclaje, intercambio, SBC, desafíos,
eventos, pase y logros—. El fondo del panel se quita por **luminancia** y no por umbral: el
emblema es claro sobre negro, así que el alfa sale de lo claro que es cada píxel; con un
umbral duro el canto quedaba dentado. Van a **3x** para que no se ablanden en un móvil que
pinta a doble densidad, y tres de las cajas están apretadas a mano porque el filete de oro
del panel se colaba dentro y salía una raya suelta encima del emblema. Entran en el APK
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
| común | `1-basico.png` | 1.000 | 5 | |
| raro | `2-azul.png` | 2.000 | 6 | |
| épico | `3-morado.png` | 4.000 | 8 | |
| legendario | `4-oro.png` | 7.500 | 10 | **PRÓXIMAMENTE** |
| ultimate | `5-holo.png` | 12.500 | 10 | **PRÓXIMAMENTE** |

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
- **LAS TABLAS DE REPARTO NO SALEN DEL BOCETO Y HAY QUE CERRARLAS CON ÉL.** Las viejas
  repartían de 7 a 9 oros, y un sobre común de 5 cartas no puede traer 7, así que hubo que
  escribir cinco que escalan de común a ultimate. Hay una comprobación al arrancar que
  avisa si un sobre puede repartir más oros de los que anuncia. **Los números concretos no
  se los ha dado nadie: son míos.**
- **El sobre gratis salió de la tienda**: en el boceto son cinco de pago, así que se
  reclama en la ACTIVIDAD DIARIA de Inicio. Sigue siendo el común y sigue sin límite —es lo
  que permite empezar sin dinero, y ponerle un reloj sería inventarse una regla de juego—.
- Los premios de SBC, el bono de bienvenida y el premio del tutorial usan los nombres nuevos.
- **`servidor.yml` comprobaba `sobres/oro.webp`**, que ya no existe; ahora comprueba
  `sobres/ultimate.webp`. Los tres archivos viejos se borraron.
- Los textos de los cinco **siguen hablando de plata y de oro** a propósito: hoy el plantel
  sólo tiene esas dos rarezas. Se reescriben con la migración, junto con las tablas.

**Lo que el boceto trae y sigue sin existir:** nivel y XP, gemas de verdad (hoy son las
fichas), pase de temporada, actividad diaria con reloj y racha, novedades, eventos, rango,
estadísticas e historial, cartas favoritas, cuenta y ayuda.

**Lo que queda de lo anterior, y está esperando a que él lo diga:**

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

0. **El juego se llama P4P.CG.** El logotipo son las dos P en `--acc`, el 4 en gris/plata
   y el `.CG` en blanco y más pequeño, en cursiva y con la tipografía de los botones
   (`--titulo`). Lo eligió y lo especificó el dueño hasta el detalle; **no se retoca** —los
   números exactos y por qué son ésos están en "La cabecera" más abajo—. Costó cuatro
   tandas de propuestas rechazadas llegar a él. El nombre se cambió **solo donde lo ve
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

### La cabecera: el logotipo y el nombre

```html
<div class="logo"><img class="marca" src="arte/logo.webp" alt="">
  <span class="txt"><b>P</b><em>4</em><b>P</b><i>.CG</i></span></div>
```

Cuatro números que **salieron de medir, no de ajustar a ojo**, y que no hay que tocar sin
volver a medir:

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

---

## El diseño nuevo de la carta: HECHO

Los marcos llegaron y está montado. Los PNG a resolución completa que pasó el usuario
están en **`originales/marcos/`** —fuera de `juego/`, porque `build.gradle` y
`servidor.yml` empaquetan `marcos/**` y esos dos PNG pesan cinco megas—. `juego/marcos/`
lleva la versión a 620x877 en WebP. **Si hay que volver a medir algo del marco, se mide
sobre el PNG de `originales/`, no sobre el WebP.**

Lo que pinta el juego ahora: bandera, ranking, atributo, nombre, récord, división y los
seis números. Los nombres de las stats y sus iconos **vienen dibujados dentro del marco**,
así que `.c-et`, `FILAS_STAT` y `COLS_STAT` ya no existen. No los reintroduzcas.

### Los huecos, medidos sobre el PNG (1054x1492) y no sacados de la tabla vieja

| Hueco | x | y |
|---|---|---|
| Octágono de la bandera (hueco negro) | 7,31 – 18,50% | 5,76 – 13,94% |
| Ranking | 79,89 – 95,92% | 2,88 – 12,40% |
| Ventana grande (el atributo) | 3,42 – 65,94% | 2,68 – 71% |
| Barra del nombre | 5,12 – 71,73% | 72,32 – 81,84% |
| Banda blanca (el récord) | 5,98 – 93,83% | 83,45 – 96,58% |
| Polígono del borde (la división) | 42,60 – 53,80% | cara plana 95,51 – 98,93% |
| Recuadros de stat | 85,39 – 93,55% | 17,36 / 26,21 / 35,66 / 45,04 / 54,36 / 63,47%, alto 4,15% |

Dos cosas que no son lo que parecen: **el polígono de abajo no está centrado en la carta**
—va de 42,60 a 53,80%, o sea centrado en el 48,20%—, y la sigla de la división se centra
en su **cara plana**, no en el contorno, porque la mitad de abajo es un pico que se
estrecha y centrar en el contorno la deja alta.

### La tinta
El marco viejo tenía casi todo el texto sobre metal claro y se escribía oscuro. Aquí el
nombre, el ranking y los seis recuadros son **huecos negros**: esos van en claro. Solo el
récord (banda blanca) y la división (polígono dorado o plateado) van en oscuro, y la
división en negro puro porque lo pidió así el usuario.

### La fuente: Antonio
Elegida midiendo el recorte de las etiquetas del marco a resolución completa, no a ojo.
Tres medidas de la referencia: inclinación **11,4°** (oblicua sintética, no itálica
dibujada), palo/altura de caja alta **0,156** (bold condensada, **no** black) y caja alta
al 3,04% del alto de la carta. Contra eso, Antonio 700 es la más cercana de las libres:
+2,6% de ancho, −3% de grosor, 80,5% de solape de silueta. **Quedan descartadas por medida
Barlow Condensed 900 (52% demasiado ancha) y Big Shoulders 900 (demasiado gorda)**, que
eran las dos candidatas que se manejaban antes; League Gothic y Bebas Neue quedaron a un
punto de Antonio.

La inclinación se reproduce con `skewX(-11.4deg)` y **no** con `font-style:oblique 11.4deg`:
la forma con ángulo no existe en los WebView viejos y ahí el texto saldría recto al lado
de unas etiquetas inclinadas.

### Cómo se verifica
```bash
node herramientas/medir-carta.mjs   # los diez textos, uno a uno, contra su hueco
node juego/test-humo.mjs            # la suite entera
```
`medir-carta.mjs` lleva los huecos de la tabla de arriba dentro. Si mueves un texto,
mueve también su hueco ahí, o la herramienta deja de decir la verdad.

### La carta no tiene fondo
El marco es un PNG con la carta **recortada**: alrededor del metal lleva de 14 a 55 px
transparentes, según por dónde se mire, porque el contorno no es un rectángulo —esquinas
cortadas y una muesca arriba en medio—. `.carta` **no lleva color de fondo ni
border-radius**: si se le ponen, ese margen se rellena y la carta se ve pegada sobre un
rectángulo gris. `overflow:hidden` se queda, para que un texto mal medido no se salga.

### Las fotos de los peleadores
Van en `juego/fotos/<persona>.webp`, **una por peleador y no por carta** —402 cartas, 355
peleadores, y quien pelea en dos divisiones tiene dos cartas y una cara—.

**Recortadas y con transparencia.** El peleador va superpuesto ENCIMA del fondo de
hexágonos del marco, que se sigue viendo por detrás y alrededor; una foto rectangular con
su fondo taparía el dibujo. Por eso el encaje es `object-fit:contain` y no `cover`.

Se apoyan abajo y **la imagen se corta por debajo del borde de arriba de la placa del
nombre** —72,60% en el oro, 72,85% en el plata—, no en el borde de la ventana. Cortándola
en la ventana el peleador queda colgado en el aire; así sale de detrás de la placa.

**La caja de la foto es más estrecha que el hueco, y no es un descuido.** El cartel del
nombre tiene las esquinas cortadas en diagonal: su borde de arriba solo es plano entre el
8,06% y el 68% en el oro, y entre el 7,81% y otro tanto en el plata. Llegando la foto
hasta el filo del hueco (3,89%), sus dos esquinas de abajo quedaban fuera de ese tramo
plano y el brazo del peleador se cortaba en recto sin cartel debajo: se veía flotando. La
caja se estrecha lo mismo por los dos lados para que siga centrada en el hueco, y al
estrechar pierde alto por arriba, porque abajo está clavada al cartel. Por eso el peleador
entra algo más pequeño y con la cabeza más baja.

**Y el cuerpo tiene que llegar al borde de abajo del ARCHIVO.** El juego apoya la imagen
en el suelo de su hueco; si el recorte lleva aire transparente al pie, lo que se apoya es
el aire y el peleador vuelve a quedar flotando. Esto no se arregla con CSS y ya costó una
vuelta: la silueta de prueba tenía 85 px de nada por debajo y parecía un fallo del encaje.

**Están las 354 de 355.** Pesan 8,4 MB, todas a 360x551 desde un origen de 460x700.

**La firma del estilo no hace falta.** Las URLs de la UFC llevan `?itok=`, que Drupal
calcula con una clave del sitio y no se puede reconstruir. Da igual: el CDN
`dmxg5wxfqgb4u.cloudfront.net` sirve `/styles/athlete_bio_full_body/<ruta en s3>` **sin
firma** y devuelve exactamente el mismo archivo, 460x700. Así que basta con conocer la
ruta del archivo, que aparece en cualquier volcado de la web. Por eso las entradas de
`docs/fotos-urls.json` pueden ser **una URL o una lista de candidatas**: se prueban en
orden hasta que una conteste. Ojo con el nombre: la UFC no lo escribe siempre igual
—`ROSAS_JR_RAUL`, no `ROSAS_RAUL_JR`— y el archivo **sin** sufijo `_R_`/`_L_` es el
retrato, un recorte de cabeza que metería una carta con otro encuadre.

**Todos miran al mismo lado, y no se consigue volteando.** La UFC fotografía a cada
peleador dos veces, una para cada esquina del cartel, y nombra los archivos `_L_` y `_R_`.
En la toma `_R_` el peleador está girado al contrario, y mezclados en la baraja se ve
enseguida. De 351 fotos, 289 vienen de una toma `_L_`, así que ese es el lado bueno.

**Las dos tomas son dos fotos distintas, no una espejada**: en las dos el logo de la UFC
del pantalón se lee bien. Por eso voltear la `_R_` con un espejo **no vale**: deja el logo
al revés —se lee "JFU"—, y en la carta se nota. Se probó y se descartó. Lo que se hace es
**pedir la toma `_L_` del mismo peleador**, que está en la misma carpeta de s3 y el mismo
día, con `_L_` en vez de `_R_`. Por eso esos diecisiete llevan en `docs/fotos-urls.json`
una lista que empieza por la `_L_` y deja la `_R_` de reserva: si la `_L_` no existiera,
`importar-fotos.mjs` baja la `_R_` y **esa sí la voltea al vuelo**, que un logo pequeño al
revés molesta menos que un peleador mirando al otro lado.

**El cinturón tiene que cuadrar con el plantel.** La UFC fotografía al campeón con el
cinturón, y esa foto se queda puesta aunque pierda el título. En la carta de quien en
`roster.js` no es `campeon`, un cinturón es mentira. Se cambiaron seis —Ankalaev, Du
Plessis, Della Maddalena, Dvalishvili, Pantoja y Zhang Weili— pidiendo la toma sin
cinturón, que suele ser más nueva o más vieja pero existe. **Pantoja y Zhang Weili se
quedan con el suyo**: llevan años siendo campeones y la UFC no publica de ellos ninguna
otra, y una carta con cinturón se lee mejor que una carta sin foto.

Y hay quien lleva cinturón en una carta y no en las otras. Para eso está
`juego/fotos/<persona>-<división>.webp`, que `fotoSrc()` mira antes que la de la persona;
`generar-fotos.mjs` valida el nombre contra las cartas del plantel para no darlo por
sobrante. Se usa en tres sitios:

| Carta | Foto | Por qué |
|---|---|---|
| `ilia-topuria-m3` | sin cinturón | campeón en pluma, no en ligero |
| `valentina-shevchenko-f2` | sin cinturón | campeona en mosca, no en gallo |
| `alex-pereira-m6` | **con** cinturón | **lo pidió el usuario** |

**Ojo con la de Pereira, que no sale de la regla de arriba y no es un descuido.** En
`roster.js` el campeón de semipesado es Carlos Ulberg y Pereira está de #3, así que por la
regla no debería llevarlo. El usuario pidió expresamente que en la de semipesado saliera
con cinturón y en las de pesado y medio sin él. **Se le avisó de que el plantel dice otra
cosa y aun así lo quiere así: no lo "arregles".**

**El derivado sin firma solo existe si la UFC lo ha generado**, o sea si es la foto que
enseña la ficha. Para una toma que no es la de la ficha hay que pedir el **archivo
original**, sin estilo —seis rutas posibles, están en `formas()`—, y **ese es la toma
entera, de la cabeza a los pies**, no el recorte por el muslo del derivado. Recortado como
los demás deja en la carta un par de piernas; pasó con Ankalaev. Por eso `prepararImagen()`
tiene una rama para cuando la proporción es de cuerpo entero: corta desde la cabeza hacia
abajo y se queda con el 70% del cuerpo, que es por donde corta la UFC.

**Y hay dos sesiones de fotos distintas.** La de la Contender Series —luz fría, pantalón
negro liso, guantes azules de la DWCS— sale apagada al lado de la del estudio de la UFC, y
en la baraja parece en blanco y negro. **No se arregla subiendo la saturación**: a ×1,6
sigue siendo otra sesión y a ×2,2 la piel se vuelve rosa. Se arregla **pidiendo la toma
posterior**, la de después de firmar, que casi siempre existe en otra carpeta de s3. Así se
cambiaron seis. La saturación media de las 351 es 0,42; por debajo de 0,23 conviene mirar
si hay una toma más nueva. Josh Hokit también tenía una, de enero de 2026, aunque la de abril de ese año
no exista: **si una carpeta no contesta, prueba las otras fechas antes de rendirte.**

**Y la UFC tiene siluetas negras de relleno** (`SHADOW_Fighter_fullLength_RED.png`,
`womens-silhouette-RED-corner.png`) para quien todavía no tiene foto. Se bajan sin
protestar y son un borrón con forma de persona encima de un peleador real. `esSilueta()`
las descarta. Tres se colaron —Brando Pericic, Louie Sutherland y Michelle Montague— y no
era que no tuvieran foto: era que la ficha de la que salió la URL se scrapeó antes de que
la UFC les hiciera la sesión. **Cuando una URL devuelva la silueta, busca una carpeta de
s3 más nueva antes de dar al peleador por perdido.**

**De dónde salen.** `herramientas/importar-fotos.mjs` las baja de ufcespanol.com, las
recorta y las deja listas. **Hay que ejecutarla en una máquina con internet normal**: el
proxy de la sesión de Claude tiene lista blanca —GitHub, npm, PyPI, Google Fonts— y
deniega con 403 ufc.com, ufcespanol.com, es.ufc.com, espn.com y hasta Wikimedia, así que
desde ahí no se puede bajar ni una. Primero `--ver` con un peleador, para comprobar que
la herramienta encuentra la imagen que toca antes de gastar 355 descargas; `--probar` pasa
un archivo del disco por el recorte, sin red.

`juego/fotos.js` dice qué caras hay y **lo escribe `herramientas/generar-fotos.mjs`**:
después de añadir o quitar una foto hay que volver a ejecutarlo. Se usa una lista y no un
`onerror` porque la carta se pinta distinta según haya foto o no —el atributo pasa de estar
en medio de la ventana a ser una chapa abajo— y descubrirlo después de pintar es un salto
que se ve; además, doce cartas sin foto serían doce peticiones fallidas por pantalla.

Al añadir fotos hay que tocar **tres** sitios de empaquetado, no dos: `build.gradle`
(`fotos/**` y `fotos.js`) y `servidor.yml` (la carpeta y el archivo).

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
