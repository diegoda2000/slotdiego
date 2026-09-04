"""Detecta la cara de cada foto y escribe juego/caras.js.

POR QUÉ HACE FALTA. Las 357 fotos están todas encuadradas igual —cuerpo entero hasta el
muslo, 360x551—, pero eso NO quiere decir que las caras salgan iguales: un peleador alto
sale con la cabeza pequeña dentro del cuadro y uno bajo con la cabeza grande, y ninguno la
tiene exactamente en el centro. Recortando a todos por la misma ventana, unas caras salían
enanas, otras enormes y casi ninguna centrada.

POR QUÉ NO VALE MEDIR LA SILUETA. El primer intento adivinaba la cabeza por el ancho de
píxel opaco fila a fila: coronilla, fila más ancha, cuello. Falla en tres sitios y el dueño
los cazó los tres:

  · con melena, el ancho no baja nunca y no hay cuello que encontrar;
  · Alex Pereira sostiene el cinturón a la altura del pecho y ensancha las filas de la
    barbilla;
  · y no dice NADA de dónde está la cara a lo ancho, así que quien mira de lado quedaba
    descentrado.

Así que aquí se detecta la cara de verdad, con YuNet (el detector de caras de OpenCV, que
además devuelve los ojos, la nariz y las comisuras). El ancla es **la distancia entre los
ojos**: es la medida más estable de una cara —no la toca el pelo, ni la barba, ni girar la
cabeza— y de ella salen tanto el tamaño como el centro.

  alto de cabeza ~ 3,4 x la distancia entre ojos
  ventana        = alto de cabeza / 0,62      (la cabeza ocupa el 62% del círculo)
  los ojos van al 42% de arriba, y el centro de la ventana en el punto medio de los ojos

QUÉ SE ESCRIBE. Tres números por foto, ya en porcentaje de CSS: lo ancha que va la imagen,
dónde cae su borde de arriba y dónde su centro a lo ancho. El juego no calcula nada.

Uso:  python3 herramientas/medir-caras.py [--ver nombre]
"""
from PIL import Image
import numpy as np
import cv2, glob, os, sys, statistics

FOTOS = 'juego/fotos'
SALIDA = 'juego/caras.js'
MODELO = 'herramientas/modelos/yunet.onnx'

ALTO_POR_OJOS = 3.4    # alto de cabeza en distancias entre ojos
PARTE = 0.62           # qué parte del círculo ocupa la cabeza de alto
OJOS_EN = 0.42         # a qué altura del círculo van los ojos

det = cv2.FaceDetectorYN.create(MODELO, '', (360, 551), 0.55, 0.3, 5000)

def sobreGris(f):
    """La foto sobre un gris neutro: el detector necesita RGB, no transparencia."""
    im = Image.open(f).convert('RGBA')
    fondo = Image.new('RGB', im.size, (110, 110, 110))
    fondo.paste(im, (0, 0), im)
    return fondo, im.size

def caraDe(f):
    """Devuelve (centro de ojos x, y, distancia entre ojos) o None."""
    im, (W, H) = sobreGris(f)
    bgr = cv2.cvtColor(np.array(im), cv2.COLOR_RGB2BGR)
    det.setInputSize((W, H))
    _, caras = det.detect(bgr)
    if caras is None or not len(caras):
        return None, (W, H)
    # SE QUEDA LA DE MÁS PUNTUACIÓN, no la de más arriba. Preferir la de arriba parecía
    # razonable —la cara está arriba— y era justo lo que rompía las fotos de campeón:
    # quien sostiene el cinturón en alto tiene ahí un adorno que el detector puntúa algo
    # menos que su cara pero está más alto, y se llevaba el encuadre. Pasó con Strickland,
    # Makhachev y Kayla Harrison.
    #
    # Y antes de elegir se tiran las imposibles: una cara está en la mitad de arriba del
    # retrato y mide entre el 8 y el 45% del ancho. Eso solo deja fuera falsos positivos.
    buenas = [c for c in caras
              if c[1] + c[3] / 2 < H * 0.55 and W * 0.08 < c[2] < W * 0.45]
    if not buenas:
        return None, (W, H)
    mejor = max(buenas, key=lambda c: c[14])
    ojoD = (mejor[4], mejor[5])
    ojoI = (mejor[6], mejor[7])
    cx, cy = (ojoD[0] + ojoI[0]) / 2, (ojoD[1] + ojoI[1]) / 2
    d = float(np.hypot(ojoD[0] - ojoI[0], ojoD[1] - ojoI[1]))
    return (cx, cy, d), (W, H)

if __name__ == '__main__':
    if '--ver' in sys.argv:
        n = sys.argv[sys.argv.index('--ver') + 1]
        print(caraDe(f'{FOTOS}/{n}.webp'))
        sys.exit()

    fs = sorted(glob.glob(f'{FOTOS}/*.webp'))
    filas, sinCara = [], []
    for f in fs:
        cara, (W, H) = caraDe(f)
        n = os.path.basename(f)[:-5]
        if cara is None:
            sinCara.append(n)
            continue
        cx, cy, d = cara
        lado = (d * ALTO_POR_OJOS) / PARTE          # el lado de la ventana, en px de origen
        techo = cy - OJOS_EN * lado
        izq = cx - lado / 2
        filas.append((n,
                      round(W / lado * 100, 1),                 # ancho de la imagen
                      round(-techo / lado * 100, 1),            # su borde de arriba
                      round((W / 2 - izq) / lado * 100, 1)))    # su centro a lo ancho

    # Las que no dan cara se quedan con la mediana de las demás, que es mejor que nada.
    if sinCara:
        med = [statistics.median([x[i] for x in filas]) for i in (1, 2, 3)]
        for n in sinCara:
            filas.append((n, round(med[0], 1), round(med[1], 1), round(med[2], 1)))
        filas.sort()

    anchos = [x[1] for x in filas]
    print(f'{len(filas)} fotos  ·  {len(sinCara)} sin cara detectada'
          + (': ' + ', '.join(sinCara) if sinCara else ''))
    print(f'zoom: mínimo {min(anchos)}%  ·  mediana {statistics.median(anchos):.1f}%  '
          f'·  máximo {max(anchos)}%')

    with open(SALIDA, 'w', encoding='utf-8') as s:
        s.write('''/* CÓMO SE ENCUADRA LA CARA DE CADA PELEADOR — GENERADO, NO SE EDITA A MANO.

   Lo escribe herramientas/medir-caras.py detectando la cara foto a foto con YuNet. Vuelve
   a ejecutarlo cada vez que añadas, quites o cambies una foto.

   Las fotos están todas encuadradas igual, pero las caras NO: ni miden lo mismo ni están
   en el mismo sitio. Con una ventana única unas salían enanas, otras enormes y casi
   ninguna centrada.

   Tres números por foto, ya en porcentaje de CSS y respecto al circulito de la cara:
   [ lo ancha que va la imagen , su borde de arriba , su centro a lo ancho ].
''')
        s.write(f'\n   {len(filas)} fotos.  Lo escribió medir-caras.py. */\n')
        s.write("(function(raiz){\n\"use strict\";\nraiz.CARAS={\n")
        for n, w, t, l in filas:
            s.write(f'"{n}":[{w},{t},{l}],\n')
        s.write("};\n})(typeof globalThis!=='undefined'?globalThis:this);\n")
    print('escrito', SALIDA, os.path.getsize(SALIDA) // 1024, 'kB')
