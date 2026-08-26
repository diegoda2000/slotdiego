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
- Encuadre de medio cuerpo, mirando de frente. Se apoyan en el suelo de la ventana, así
  que lo que se corta es la cintura, no la cabeza.

## Cómo se llaman

`<persona>.webp`, donde `<persona>` es el campo `persona` del roster: el nombre en
minúsculas, sin acentos y con guiones. Por ejemplo:

    tom-aspinall.webp
    ciryl-gane.webp
    waldo-cortes-acosta.webp

La lista entera sale de `juego/roster.js`.

## Después de añadir o quitar fotos

    node herramientas/generar-fotos.mjs

Escribe `juego/fotos.js`, que es de donde el juego saca qué caras hay. Sin volver a
ejecutarlo, una foto nueva no se ve y una borrada deja la carta pidiendo un archivo que
ya no está.
