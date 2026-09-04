"""Deja listos los sobres nuevos para el juego, desde originales/sobres-v2/.

Los seis artes los pasó el dueño a 1024x1536. Cinco van a la tienda y el ROJO es el sobre
de EVENTO —lo dijo él—, así que se prepara igual pero no entra en la fila de la tienda.

DOS COSAS QUE HACE ESTA HERRAMIENTA Y NO SON ADORNO:

· RECORTA EL AIRE. Tres de los seis vienen en RGB, sin transparencia, con el sobre sobre
  un fondo casi negro; los otros tres traen alfa. Se recorta la caja del sobre en los dos
  casos —por alfa cuando la hay y por luminancia cuando no— para que los cinco midan lo
  mismo en pantalla. Sin esto, uno con más aire alrededor se ve más pequeño que el de al
  lado en la misma fila.

· LES DA TRANSPARENCIA. Los tres RGB llevan el fondo pintado de negro, y sobre el panel
  del boceto -que no es negro puro- se veía el recuadro. El fondo se quita por luminancia,
  como en los emblemas: el sobre es claro y el fondo casi negro.

Uso:  python3 herramientas/preparar-sobres-v2.py
"""
from PIL import Image
import os

ORIGEN = 'originales/sobres-v2'
SALIDA = 'juego/sobres'
ALTO = 940          # el mismo alto que tenían los sobres de antes

TRABAJOS = {
    '1-basico': 'comun',
    '2-azul':   'raro',
    '3-morado': 'epico',
    '4-oro':    'legendario',
    '5-holo':   'ultimate',
    '6-rojo':   'evento',
}

def luz(p): return 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]

os.makedirs(SALIDA, exist_ok=True)
for orig, nom in TRABAJOS.items():
    im = Image.open(f'{ORIGEN}/{orig}.png')
    tenia_alfa = im.mode == 'RGBA' and im.getchannel('A').getextrema()[0] < 255
    im = im.convert('RGBA')
    if not tenia_alfa:
        p = im.load()
        W, H = im.size
        for y in range(H):
            for x in range(W):
                r, g, b, _ = p[x, y]
                a = (luz((r, g, b)) - 12) / 40
                p[x, y] = (r, g, b, round(max(0.0, min(1.0, a)) * 255))
    bb = im.getbbox()
    im = im.crop(bb)
    k = ALTO / im.height
    im = im.resize((round(im.width * k), ALTO), Image.LANCZOS)
    f = f'{SALIDA}/{nom}.webp'
    im.save(f, 'WEBP', quality=88, method=6)
    print(f'{orig:10} -> {nom:10} {im.width}x{im.height}  '
          f'{"tenía alfa" if tenia_alfa else "alfa por luminancia"}  '
          f'{os.path.getsize(f)//1024} kB')
