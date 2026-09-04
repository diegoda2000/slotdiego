"""Mide la cabeza de cada foto y escribe juego/caras.js.

POR QUÉ HACE FALTA. Las 357 fotos están todas encuadradas igual —cuerpo entero hasta el
muslo, 360x551—, pero eso NO quiere decir que las cabezas midan lo mismo: un peleador alto
sale con la cabeza pequeña dentro del cuadro y uno bajo con la cabeza grande. Recortando a
todos por la misma ventana, unas caras salen enanas y otras enormes. Lo cazó el dueño.

Así que la ventana se calcula PARA CADA FOTO, de forma que la cabeza ocupe siempre la misma
parte del círculo.

CÓMO SE MIDE LA CABEZA. Se cuenta el ancho de píxel opaco fila a fila:

  · la coronilla es la primera fila con algo,
  · la fila más ancha del primer cuarto es la cara,
  · y el cuello es el mínimo que viene después, antes de que los hombros lo disparen.

El cuello NO siempre se ve —con melena el ancho no baja nunca—, así que cuando la medida
sale rara se cae a estimar el alto de la cabeza por su ancho: en las que sí se miden bien,
el alto es 1,15 veces el ancho de media.

QUÉ SE ESCRIBE. Dos números por foto, ya en porcentaje de CSS: lo ancha que va la imagen
respecto al círculo, y dónde cae su borde de arriba. Así el juego no calcula nada.

Uso:  python3 herramientas/medir-caras.py
"""
from PIL import Image
import glob, os, statistics

FOTOS = 'juego/fotos'
SALIDA = 'juego/caras.js'

# Qué parte del círculo ocupa la cabeza de alto. 0,58 deja aire arriba y algo de hombro.
PARTE = 0.58
# Aire por encima de la coronilla, en altos de cabeza.
AIRE = 0.14
# Cuando no se ve el cuello: alto de cabeza = ancho x esto. Sale de las que sí se miden.
POR_ANCHO = 1.15

def perfil(im):
    """Ancho de píxel opaco de cada fila."""
    W, H = im.size
    a = im.getchannel('A').load()
    out = []
    for y in range(H):
        xs = [x for x in range(0, W, 2) if a[x, y] > 40]
        out.append((len(xs) * 2) if xs else 0)
    return out

def medir(f):
    im = Image.open(f).convert('RGBA')
    W, H = im.size
    an = perfil(im)
    arriba = next((y for y, w in enumerate(an) if w > 8), 0)
    cuarto = int(H * 0.25)
    cara = max(range(arriba, cuarto), key=lambda y: an[y])
    ancho = an[cara]
    # el cuello: el mínimo entre la cara y el 40% del alto
    tramo = range(cara, int(H * 0.40))
    cuello = min(tramo, key=lambda y: an[y])
    alto = cuello - arriba
    fiable = ancho * 0.90 <= alto <= ancho * 1.60
    if not fiable:
        alto = ancho * POR_ANCHO
    return W, H, arriba, cara, ancho, alto, fiable

fs = sorted(glob.glob(f'{FOTOS}/*.webp'))
filas, sinCuello = [], 0
for f in fs:
    W, H, arriba, cara, ancho, alto, fiable = medir(f)
    if not fiable:
        sinCuello += 1
    ventana = alto / PARTE
    techo = arriba - alto * AIRE
    filas.append((os.path.basename(f)[:-5],
                  round(W / ventana * 100, 1),      # lo ancha que va la imagen
                  round(-techo / ventana * 100, 1)))  # dónde cae su borde de arriba

anchos = [x[1] for x in filas]
print(f'{len(filas)} fotos  ·  {sinCuello} sin cuello visible (estimadas por el ancho)')
print(f'zoom: mínimo {min(anchos)}%  ·  mediana {statistics.median(anchos):.1f}%  '
      f'·  máximo {max(anchos)}%')

with open(SALIDA, 'w', encoding='utf-8') as s:
    s.write('''/* CÓMO SE ENCUADRA LA CARA DE CADA PELEADOR — GENERADO, NO SE EDITA A MANO.

   Lo escribe herramientas/medir-caras.py midiendo la cabeza foto a foto. Vuelve a
   ejecutarlo cada vez que añadas, quites o cambies una foto.

   Las fotos están todas encuadradas igual, pero las cabezas NO miden lo mismo: un peleador
   alto sale con la cabeza pequeña dentro del cuadro y uno bajo con la cabeza grande. Con
   una ventana única para todos, unas caras salían enanas y otras enormes.

   Dos números por foto, ya en porcentaje de CSS y respecto al circulito de la cara:
   [ lo ancha que va la imagen , dónde cae su borde de arriba ].
''')
    s.write(f'\n   {len(filas)} fotos.  Lo escribió medir-caras.py. */\n')
    s.write("(function(raiz){\n\"use strict\";\nraiz.CARAS={\n")
    for n, w, t in filas:
        s.write(f'"{n}":[{w},{t}],\n')
    s.write("};\n})(typeof globalThis!=='undefined'?globalThis:this);\n")
print('escrito', SALIDA, os.path.getsize(SALIDA) // 1024, 'kB')
