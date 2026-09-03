#!/bin/sh
# Deja listo el vídeo de apertura del sobre a partir del que genera la IA.
#
# El de Kling sale en 16:9 con el sobre centrado, la marca de agua "KlingAI" abajo a la
# derecha y tres segundos de sobre quieto antes de que se rompa. Aquí se recorta a la
# columna del sobre -con lo que la marca de agua se queda fuera y no hay que borrarla-,
# se tira lo de antes del desgarro y se baja a 640 px.
#
# OJO: el ffmpeg que trae Playwright NO sabe leer H.264 -viene con --disable-everything-,
# y el Chromium de Playwright tampoco. Hace falta uno completo:
#     npm i ffmpeg-static     y usar node_modules/ffmpeg-static/ffmpeg
#
# Uso:  sh herramientas/preparar-apertura.sh <ffmpeg> <entrada.mp4> <salida.mp4>
FF="${1:?ruta del ffmpeg completo}"
DE="${2:-originales/apertura/basico-kling-16-9.mp4}"
A="${3:-originales/apertura/basico-recortado.mp4}"

# 440,0 1060x1080 = la columna del sobre. 2,45 s = justo antes de que empiece a romperse.
"$FF" -hide_banner -loglevel error -ss 2.45 -i "$DE" \
  -vf "crop=1060:1080:440:0,scale=640:-2" -an \
  -c:v libx264 -profile:v baseline -level 3.1 -pix_fmt yuv420p -crf 25 -movflags +faststart \
  "$A"

# Y el primer fotograma suelto: la pantalla del sobre tiene que enseñar EXACTAMENTE eso
# antes de tocarlo, para que al arrancar el vídeo no se note el salto.
"$FF" -hide_banner -loglevel error -ss 2.45 -i "$DE" \
  -vf "crop=1060:1080:440:0,scale=640:-2" -frames:v 1 \
  "$(dirname "$A")/$(basename "$A" .mp4)-primer-fotograma.png"

ls -la "$A"
