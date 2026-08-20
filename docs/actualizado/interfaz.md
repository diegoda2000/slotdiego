# Distribución de la interfaz

Documento de trabajo para rediseñar. Recoge **cómo está montada la interfaz hoy**: qué hay en cada
pantalla, a qué tamaño se ve una carta en cada una, y dónde cae cada texto sobre el marco.

Todas las medidas de aquí están **sacadas del propio dibujo y de la pantalla**, no copiadas del
código ni puestas a ojo. Las verticales de la carta salen de `herramientas/medir-carta.mjs`, que
dibuja la carta a tamaño natural, la fotografía con y sin cada texto y se queda con la diferencia.
Los tamaños por pantalla salen de abrir el juego en cuatro ventanas y medir el elemento.

---

## 1. La carta

### 1.1 Lo que no se puede cambiar sin tocar el juego

| | |
|---|---|
| **Proporción** | 620 × 877 (0,7070). Está fijada con `aspect-ratio` y de ella cuelga todo lo demás |
| **Archivos** | `juego/marcos/oro.webp` y `juego/marcos/plata.webp`, 620 × 877 |
| **Qué son** | El marco **vacío**. El texto no está en la imagen: lo pinta el juego encima, en porcentajes |
| **Escalado** | Una sola carta que escala. No hay versión pequeña y versión grande |

### 1.1.1 Cómo escala, y por qué así

La carta **se maqueta siempre a 620 px de ancho** —el del dibujo— y después se encoge con
`transform: scale()` hasta el tamaño que le toque. Dentro de ese lienzo todos los tamaños de letra
son fijos: el número mide 22,3 px, el nombre 31,6 px, la etiqueta 26 px.

No es un rodeo. **Los WebView traen un tamaño mínimo de letra** —8 px en Android— y cualquier texto
por debajo se dibuja a 8 px de todas formas. Calculando las letras contra el ancho real de la carta,
en el álbum de un móvil salían así:

| | calculado | lo que dibujaba el móvil |
|---|---|---|
| Número | 3,3 px | **8 px** |
| Etiqueta | 3,9 px | **8 px** |
| Nombre | 4,2 px | **8 px** |
| Récord | 2,6 px | **8 px** |

Los cuatro acababan del mismo tamaño y desbordando su hueco: el número ocupaba **el 158% del ancho de
su rombo** y las etiquetas se montaban encima de los números. Maquetando a 620 px las letras son de
22 px, ningún mínimo interviene, y lo que encoge después es el dibujo entero — y encoger no es
tipografía. Vale igual para Android, para iPhone y para el navegador.

El lienzo lleva además `text-size-adjust: none`, para que el "texto grande" del sistema no vuelva a
deformar la carta. Fuera de la carta ese ajuste sigue funcionando, que es donde tiene sentido.

**En Chromium de escritorio nada de esto pasa**, porque no tiene mínimo de letra. Por eso las pruebas
daban verde mientras en el móvil estaba roto. Ahora la tanda se lanza con
`--blink-settings=minimumFontSize=8,minimumLogicalFontSize=8` y comprueba el encaje también en una
ventana de 360 px, que es donde las cartas se hacen más pequeñas.

Antes de esto se probó con consultas de contenedor de CSS y también hubo que quitarlo: no existen en
los WebView antiguos.

### 1.2 A qué tamaño se ve de verdad

Esto es lo que decide cuánto detalle aguanta el diseño. Un adorno que se vea bien en la carta de la
apertura desaparece en el álbum, donde la carta mide la cuarta parte.

| Pantalla | Móvil estrecho 360 | Móvil típico 412 | Móvil alto 430 | Tableta 760 |
|---|---|---|---|---|
| **Apertura** (la carta grande) | 331 × 469 | 379 × 536 | 396 × 560 | 523 × 740 |
| **Resumen del sobre** (3×3) | 68 × 96 | 109 × 155 | 113 × 160 | 129 × 183 |
| **Plantilla** (las 11) | 78 × 111 | 109 × 155 | 112 × 159 | 124 × 176 |
| **Colección** (álbum 3×4) | 58 × 82 | 94 × 133 | 97 × 137 | 119 × 169 |
| **Reciclaje** (4×3) | igual que el álbum | | | |

**Por qué el álbum es de tres columnas y no de cuatro.** Con cuatro, el ancho de la pantalla se
agota antes que el alto: las cartas no pueden pasar de 92 px porque no caben más anchas, y las cuatro
filas ocupan poco más de media pantalla dejando un hueco muerto debajo. Con tres columnas la carta
crece hasta que lo que se agota es el **alto**, que es la dimensión que sobraba, y la hoja llega hasta
la barra de navegación. Doce cartas por hoja son además exactamente cuatro filas de tres, así que la
hoja llena nunca sale coja.

**La carta enseña lo mismo en todas las pantallas.** Hubo una versión "compacta" que en la plantilla
escondía el récord, el rasgo y los nombres de las stats, con la excusa de que a ese tamaño no se
leerían; dejaba números sueltos con rayas al lado. Era al revés: la carta de la plantilla mide 109 px
y la del álbum 93, y en el álbum se veían. Lo que no se leía era el desbordamiento de arriba.

En píxeles: **el caso peor real es 58 px de ancho**. Ahí un número de stat mide 2 px de alto. Lo que
se dibuje pensando en la carta grande hay que mirarlo también a ese tamaño.

### 1.3 Dónde cae cada cosa

Porcentajes sobre la carta. `x` de izquierda a derecha, `y` de arriba abajo.

| Elemento | x | y | Letra (fracción del ancho) |
|---|---|---|---|
| Pestaña del ranking | 7,4 – 18,4 | 2,4 – 9,4 | 0,062 |
| Foto / icono | 12 – 88 | 15 – 55 | icono 0,17 · rasgo 0,027 |
| Placa del nombre | 25,3 – 74,2 | 66,02 – 70,51 | 0,045, **ajustada por nombre** |
| Récord | 12 – 88 | 71,2 – 74,8 | 0,028 |
| Etiquetas de stat, columna izq. | 24,2 – 45,4 | 75,32 / 81,55 / 87,92 | 0,042 |
| Etiquetas de stat, columna der. | 63,1 – 84,0 | (las mismas tres) | 0,042 |
| Números, columna izq. | 17,2 – 22,4 | 76,05 / 82,33 / 88,71 | 0,036 |
| Números, columna der. | 56,1 – 61,3 | (las mismas tres) | 0,036 |
| Pie: bandera y peso | 10 – 90 | 92 – 96,4 | 0,031 · bandera 1,45 em · peso 1,74 em |

Los tres altos de las filas de stats son **2,17%** cada uno.

### 1.4 Los huecos del dibujo, medidos

Esto es lo que el marco ofrece. Si el diseño nuevo mueve un hueco, estos son los números que hay que
darme.

| Hueco | Arriba | Abajo | Alto |
|---|---|---|---|
| Pestaña del ranking | 1,82% | 11,97% | 10,15% |
| Placa del nombre | 66,02% | 70,51% | 4,49% |
| Banda del récord | 70,60% | 75,30% | 4,70% |
| Rombo, fila 1 | 76,05% | 78,22% | 2,17% |
| Rombo, fila 2 | 82,33% | 84,49% | 2,16% |
| Rombo, fila 3 | 88,71% | 90,88% | 2,17% |

En horizontal, cada rombo mide **16,45 – 23,23%** (columna izquierda) y **55,32 – 61,94%** (derecha)
en su punto más ancho. El texto no usa todo eso: usa una caja interior más estrecha —17,2 – 22,4% y
56,1 – 61,3%— porque el rombo está inclinado y en los bordes se estrecha, y usando el ancho aparente
los números se salían por el filo.

### 1.5 Y dónde cae la tinta

Comprobado con `node herramientas/medir-carta.mjs`:

| | Tinta | Hueco | Holgura arriba / abajo |
|---|---|---|---|
| Ranking | 4,33 – 7,81 | 1,82 – 11,97 | +2,51 / +4,16 |
| Nombre | 66,99 – 70,41 | 66,02 – 70,51 | +0,97 / +0,10 |
| Récord | 72,23 – 74,23 | 70,60 – 75,30 | +1,63 / +1,07 |
| Números, fila 1 | 76,17 – 78,22 | 76,05 – 78,22 | +0,12 / 0,00 |
| Números, fila 2 | 82,44 – 84,49 | 82,33 – 84,49 | +0,11 / 0,00 |
| Números, fila 3 | 88,83 – 90,88 | 88,71 – 90,88 | +0,12 / 0,00 |

Los números **llenan el rombo de borde a borde**, que es lo que se pidió: que rellenen el recuadro
por completo sin desbordar.

Ninguno de estos textos lleva desplazamiento vertical. Lo llevaron y estaba mal: se añadió sobre una
medición falsa —la sonda de la línea de base se metía dentro de un contenedor flex, donde el
navegador la convierte en otro elemento en vez de apoyarla en el texto— y dejaba el nombre y los
números un 1% de la altura por debajo de su sitio.

### 1.6 Tipografía y color

- **Oswald**, empaquetada en `juego/fuentes/` para que se vea igual sin conexión. Reservas:
  Roboto Condensed, Avenir Next Condensed, Arial Narrow.
- El nombre y la pestaña del ranking llevan **relieve y un reflejo cruzado**, para que se lean como
  parte del metal y no como una pegatina encima.
- Sobre oro: nombre `#2e2107`, ranking `#3a2a09`, números `#2b1f07`, récord y etiquetas `#3a3d42`.
- Sobre plata, todos más fríos y más oscuros: nombre `#1a1e22`, ranking `#23272c`, números `#15181c`.
- Un número **modificado** cambia de color: rojo `#7a1109` si baja, verde `#0f4a22` si sube.

---

## 2. Las pantallas

Fondo `#0d1014`, contenido centrado con un ancho máximo de **760 px**, barra de navegación fija
abajo. Todo el juego cabe en el alto de la pantalla: **no se hace scroll para ver cartas** en ninguna
de las pantallas que las enseñan.

| Pantalla | Cómo se colocan las cartas |
|---|---|
| **Inicio** | Sin cartas |
| **Sobres** | Lista de sobres. Hoy cada uno es un emoji: 📦 básico, 🎁 plata, 🥇 oro |
| **Apertura** | Una sola carta, lo más grande que quepa, con su resplandor por nivel |
| **Resumen del sobre** | 3 × 3 — las nueve del sobre a la vez |
| **Colección** | Álbum de **3 × 4** (tres columnas, cuatro filas), se pasa de página. Sin scroll |
| **Plantilla** | 11 divisiones: tres filas de tres y una última fila de dos, centrada |
| **Reciclaje** | 4 × 3, paginado |
| **Partida** | Las cartas del duelo, enfrentadas |

Cualquier rejilla marcada con `data-fit="columnas,filas"` se mide sola: el juego calcula el sitio que
queda libre en la pantalla y le da a las cartas el tamaño que hace que quepan justas. Por eso los
tamaños de 1.2 cambian con la ventana.

### 2.1 El resplandor por nivel

La pantalla de apertura se tiñe del nivel que viene antes de que se vea nada:

| Nivel | Luz | Luz 2 |
|---|---|---|
| Campeón | `#ffd24a` | `#ff4a3d` |
| Top 5 | `#ffcf3f` | `#e8a021` |
| Top 10 | `#dfe6ee` | `#9fb4c8` |
| Top 15 | `#cfd6de` | `#8d9aa8` |
| Oro | `#b9c1ca` | `#79838f` |
| Plata | `#aab2bb` | `#6e7883` |

---

## 3. Los sobres

Hoy no tienen diseño: son un emoji y el nombre. Lo que el juego necesita de cada uno:

| | Básico | Plata | Oro |
|---|---|---|---|
| Coste | gratis, ilimitado | 250 fichas | 600 fichas |
| Cartas | 9 | 9 | 9 |
| Icono actual | 📦 | 🎁 | 🥇 |

Un diseño de sobre se coloca en dos sitios: la **lista de la pantalla de Sobres** (pequeño, en fila,
hoy a 22 px) y el **título del resumen** al terminar de abrirlo. Si el dibujo va a llevar detalle,
conviene mirarlo a ese tamaño pequeño, que es donde más se ve.

---

## 4. Qué hace falta para cambiar el diseño

Para que entre directo y sin adivinar nada:

1. **Los marcos vacíos**, sin texto de ejemplo encima. Con el texto puesto hay que adivinar dónde
   acaba el hueco y dónde empieza la letra, y ahí es donde se falla.
2. **PNG o WebP**, a 620 × 877 o a cualquier tamaño mayor con la misma proporción.
3. **Oro y plata**, los dos.
4. Si el diseño mueve los huecos, no hace falta que me pases medidas: las saco del dibujo con la
   herramienta. Lo que sí necesito saber es si **cambia la proporción** o si **desaparece o aparece**
   algún elemento, porque eso ya no es medir sino tocar la maquetación.

Después de cambiarlos, la comprobación es:

```
node herramientas/medir-carta.mjs     # dónde cae la tinta contra cada hueco
node juego/test-humo.mjs 6            # la tanda entera, que incluye el encaje del texto
```
