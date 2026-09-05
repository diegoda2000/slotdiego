"""Deja listos los emblemas NUEVOS —los que pasó el dueño— para el juego.

Van a juego/arte/emblemas/ y sustituyen a los que se habían recortado de su boceto, que
salían de un dibujo de baja resolución y quedaban blandos. YA ESTÁN LOS NUEVE: con SBC,
desafíos, eventos, pase y logros no queda ni uno del boceto, así que
herramientas/sacar-emblemas.py no hay que volver a pasarla.

SE NORMALIZAN POR PESO VISUAL, NO POR ALTO. Puestos todos al mismo alto, el de intercambio
—dos flechas anchas y bajas— se ve enorme al lado de la caja de la colección, que es alta y
estrecha. Lo que tiene que medir lo mismo es LA TINTA: se cuenta el área opaca de cada uno y
se escala para que la raíz de esa área sea la misma en los nueve. Es la misma cuenta que se
usa para casar iconos de distinta forma en una barra.

Uso:  python3 herramientas/preparar-emblemas-v2.py
"""
from PIL import Image
import os

ORIGEN = 'originales/emblemas-v2'
SALIDA = 'juego/arte/emblemas'
TINTA = 168          # raíz del área opaca, en px: fija el peso visual de los nueve
TOPE = 420           # ninguno pasa de aquí de alto ni de ancho

NOMBRES = ['reciclaje', 'intercambio', 'coleccion', 'sets',
           'sbc', 'desafios', 'eventos', 'pase', 'logros']

os.makedirs(SALIDA, exist_ok=True)
for n in NOMBRES:
    im = Image.open(f'{ORIGEN}/{n}.png').convert('RGBA')
    im = im.crop(im.getbbox())                      # fuera el aire de alrededor
    a = im.getchannel('A').load()
    W, H = im.size
    opaco = sum(1 for y in range(H) for x in range(W) if a[x, y] > 128)
    k = TINTA / (opaco ** 0.5)
    w, h = round(W * k), round(H * k)
    if max(w, h) > TOPE:
        k *= TOPE / max(w, h)
        w, h = round(W * k), round(H * k)
    im = im.resize((w, h), Image.LANCZOS)
    f = f'{SALIDA}/{n}.webp'
    im.save(f, 'WEBP', quality=92, method=6)
    print(f'{n:12} {W}x{H} -> {w}x{h}  tinta {opaco**0.5:.0f} -> {TINTA}  '
          f'{os.path.getsize(f)//1024} kB')
