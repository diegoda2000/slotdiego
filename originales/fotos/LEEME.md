# Las fotos tal y como llegaron

Los originales sin tocar, antes de pasarlos por `herramientas/importar-fotos.mjs`.
Van aquí y no en `juego/fotos/` porque `build.gradle` y `servidor.yml` empaquetan
`fotos/**` en el APK, y lo que tiene que ir dentro es la versión recortada a 420 px,
no el original.

`foto-1`, `foto-2` y `foto-3` están pendientes de nombre: llegaron por el chat y no se
sabe de quién es cada cara. En cuanto se sepa se renombran al slug del peleador
(`<persona>.webp` del roster) y se pasan por la herramienta.
