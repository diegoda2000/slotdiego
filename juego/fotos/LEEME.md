# Las caras de los peleadores

Una imagen por PELEADOR, no por carta: hay 402 cartas para 355 peleadores, y quien
compite en dos divisiones tiene dos cartas y una sola cara.

## Cómo tienen que ser

- **Recortadas, con fondo transparente.** El peleador va superpuesto encima del fondo de
  hexágonos del marco, que se sigue viendo por detrás y alrededor. Una foto rectangular
  con su fondo taparía el dibujo.
- **WebP con canal alfa.**
- **420x620 px** va sobrado: en la pantalla más grande del juego la ventana de la carta no
  pasa de 390 px de ancho.
- Encuadre de medio cuerpo, mirando de frente.
- **El cuerpo tiene que llegar al borde de ABAJO del archivo, sin un solo píxel
  transparente por debajo.** El juego apoya la imagen en el borde de abajo de su hueco,
  que queda tapado por la placa del nombre: así el peleador sale de detrás de la placa. Si
  la imagen lleva aire transparente al pie, ese aire se apoya en la placa y el peleador se
  queda flotando por encima, con el corte a la vista. Recórtala pegada al cuerpo.
- Por los lados sí puede sobrar: la imagen se ajusta a lo ancho del hueco y se centra.

## Cómo se llaman

`<persona>.webp`, donde `<persona>` es el campo `persona` del roster: el nombre en
minúsculas, sin acentos y con guiones. Por ejemplo:

    tom-aspinall.webp
    ciryl-gane.webp
    waldo-cortes-acosta.webp

La lista entera sale de `juego/roster.js`.

### Una foto distinta para una carta concreta

Si un peleador compite en dos divisiones y no quieres la misma cara en las dos, añade
`<persona>-<division>.webp` y esa gana sobre la general para esa carta. La división es el
id del roster: `m0` mosca, `m1` gallo, `m2` pluma, `m3` ligero, `m4` wélter, `m5` medio,
`m6` semipesado, `m7` pesado, `f0` paja, `f1` mosca F, `f2` gallo F.

    ilia-topuria.webp        la de siempre, vale para su carta de pluma
    ilia-topuria-m3.webp     solo para su carta de ligero

Hace falta porque la foto oficial de Topuria es con el cinturón de campeón de pluma, y en
su carta de ligero, donde no es campeón, ese cinturón sobra.

## De dónde salieron las que hay

Las 193 que hay vienen del repositorio público `victor-lillo/octagon-api`
(`public/fighters/`), que mantiene un espejo de los cut-outs oficiales de la UFC en
WebP 460x700 con alfa, ya nombrados por el mismo slug que usa el roster. Se bajaron con
`git clone` y se pasaron por `herramientas/importar-fotos.mjs --lote`.

No se guardan los originales de 460x700 en este repositorio: son 15 MB, están en el sitio
de donde salieron, y lo que hace falta para el juego es la versión recortada de 360 px.

## Después de añadir o quitar fotos

    node herramientas/generar-fotos.mjs

Escribe `juego/fotos.js`, que es de donde el juego saca qué caras hay. Sin volver a
ejecutarlo, una foto nueva no se ve y una borrada deja la carta pidiendo un archivo que
ya no está.
