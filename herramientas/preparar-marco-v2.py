"""Deja listo el marco NUEVO —el común— para el juego, desde originales/marcos-v2/.

DOS TAMAÑOS DISTINTOS EN EL ORIGEN, y hay que cuadrarlos. El reverso viene a 1054x1492 y
el frente a 1024x1536: no son la misma proporción. La medida buena es la del reverso —es la
del boceto y la que aprobó el dueño—, así que **el que se reescala es el frente**.

Y LA CARTA VA RECORTADA, SIN RECTÁNGULO NEGRO DETRÁS. Los dos PNG vienen en RGB, sin
transparencia, con el dibujo sobre negro puro, así que puestos tal cual la carta se ve
pegada sobre un rectángulo. Lo pidió él: "que estén recortadas, como yo te las pasé, sin
fondo negro detrás para hacer el rectángulo".

QUITARLO POR UMBRAL NO SE PUEDE: el interior de la carta también es casi negro —hay zonas
a luminancia 1 de 255— y por umbral se irían con él. Se hace con un RELLENO POR INUNDACIÓN
desde los cuatro bordes: así solo desaparece el negro que ROdea al dibujo, el que toca el
borde, y el de dentro, que no está conectado con él, se queda. Es lo mismo que hace
preparar-logo-v2.mjs con el logotipo.

El canto se suaviza con una rampa: el fondo es negro puro, así que lo que se ve en el borde
es el color del metal ya mezclado con él, y la cobertura se recupera de lo claro que sea.
Sin esto el contorno queda dentado.

El juego pinta la carta a 620 px de ancho y la encoge con transform, así que aquí se baja a
620x877 (la misma proporción, 0,7065) y a WebP. Los PNG de cinco megas se quedan en
originales/, fuera del APK.

Uso:  python3 herramientas/preparar-marco-v2.py
"""
from PIL import Image
from collections import deque
import os

ORIGEN = 'originales/marcos-v2'
SALIDA = 'juego/marcos'
ANCHO, ALTO = 620, 877          # lo que pinta el juego
# EL UMBRAL VA EN 4 Y NO MÁS ARRIBA, y se midió: contando cuánto se lleva la inundación
#    según el listón, de 1 a 4 se queda entre el 5,3 y el 6,1% —que es justo la franja
#    de los lados más las esquinas cortadas—, y en 6 salta al 13,7% y en 10 al 30%. Ahí
#    es donde se cuela por el borde y se come el interior de la carta, que también es
#    casi negro. Con 10 la carta salía agujereada.
UMBRAL = 4                      # por debajo de esto es fondo, dentro de un rincón
VISIBLE = 6                     # a partir de aquí ya es dibujo, para buscar su caja
RINCON = 0.16                   # cuánto de la carta mira la inundación en cada esquina
RAMPA = 14                      # hasta aquí sube la cobertura del canto

def luz(p): return 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]

def cajaDelDibujo(p, W, H):
    """El rectángulo que ocupa la carta dentro del archivo, sin las franjas negras."""
    x0, x1, y0, y1 = W, -1, H, -1
    for y in range(H):
        for x in range(W):
            if luz(p[x, y]) >= VISIBLE:
                if x < x0: x0 = x
                if x > x1: x1 = x
                if y < y0: y0 = y
                if y > y1: y1 = y
    return x0, y0, x1 + 1, y1 + 1

def recortar(im):
    """Deja transparente lo que hace el rectángulo por detrás de la carta, y NADA MÁS.

    LA INUNDACIÓN VA CONFINADA A LAS CUATRO ESQUINAS, y no es una precaución de más: el
    canto exterior del marco es tan negro como el fondo —hay píxeles a luminancia 1 o 2 en
    los dos—, así que una inundación libre desde los bordes se cuela por ahí y va comiéndose
    una tira del marco a lo largo de todo el lateral. Se probó con el listón en 4, en 6 y en
    10 y las tres veces pasó; con 10 la carta salía agujereada por dentro.

    Lo que de verdad sobra son dos cosas y las dos se pueden acotar: las franjas negras de
    los lados —que están FUERA de la caja del dibujo y se van sin inundar nada— y las
    esquinas cortadas en chaflán, que viven cada una en su rincón. Inundando sólo dentro de
    un rincón, una fuga no puede recorrer el lateral entero.
    """
    im = im.convert('RGBA')
    W, H = im.size
    p = im.load()
    cx0, cy0, cx1, cy1 = cajaDelDibujo(p, W, H)
    aw, ah = cx1 - cx0, cy1 - cy0
    rw, rh = int(aw * RINCON), int(ah * RINCON * aw / ah)

    fuera = bytearray(W * H)
    # Todo lo que queda fuera de la caja del dibujo: las franjas.
    for y in range(H):
        for x in range(W):
            if x < cx0 or x >= cx1 or y < cy0 or y >= cy1:
                fuera[y * W + x] = 1

    # Y el chaflán de cada esquina, inundando sólo dentro de su rincón.
    for ex, ey in ((cx0, cy0), (cx1 - 1, cy0), (cx0, cy1 - 1), (cx1 - 1, cy1 - 1)):
        rx0, rx1 = (ex, ex + rw) if ex == cx0 else (ex - rw, ex + 1)
        ry0, ry1 = (ey, ey + rh) if ey == cy0 else (ey - rh, ey + 1)
        cola = deque()

        def mete(x, y):
            if not (rx0 <= x < rx1 and ry0 <= y < ry1):
                return
            n = y * W + x
            if fuera[n] or luz(p[x, y]) >= UMBRAL:
                return
            fuera[n] = 1
            cola.append((x, y))

        mete(ex, ey)
        while cola:
            x, y = cola.popleft()
            mete(x - 1, y); mete(x + 1, y); mete(x, y - 1); mete(x, y + 1)

    # Fuera lo que está fuera; y el canto, con su cobertura, para que no quede dentado.
    for y in range(H):
        for x in range(W):
            n = y * W + x
            r, g, b, _ = p[x, y]
            if fuera[n]:
                p[x, y] = (r, g, b, 0)
                continue
            toca = ((x > 0 and fuera[n - 1]) or (x < W - 1 and fuera[n + 1])
                    or (y > 0 and fuera[n - W]) or (y < H - 1 and fuera[n + W]))
            if toca:
                a = min(1.0, max(.35, luz((r, g, b)) / RAMPA))
                p[x, y] = (r, g, b, round(a * 255))
    return im, sum(fuera), (cx0, cy0, cx1, cy1)

os.makedirs(SALIDA, exist_ok=True)
for orig, nom in [('comun-frente', 'comun'), ('comun-reverso', 'comun-reverso')]:
    im = Image.open(f'{ORIGEN}/{orig}.png')
    antes = im.size
    im, quitados, caja = recortar(im)
    # Y se recorta a la caja del dibujo. El frente viene a 1024x1536 —proporción 0,667— con
    # franjas negras a los lados: sin quitarlas, al llevarlo a 620x877 la carta se estira.
    im = im.crop(caja)
    im = im.resize((ANCHO, ALTO), Image.LANCZOS)
    f = f'{SALIDA}/{nom}.webp'
    im.save(f, 'WEBP', quality=90, method=6)
    print(f'{orig:15} {antes[0]}x{antes[1]} -> {nom}.webp {ANCHO}x{ALTO}  '
          f'dibujo {caja[2]-caja[0]}x{caja[3]-caja[1]} '
          f'(proporción {(caja[2]-caja[0])/(caja[3]-caja[1]):.4f})  '
          f'{os.path.getsize(f)//1024} kB')
