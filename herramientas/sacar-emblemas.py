"""Saca del boceto los emblemas de las filas y los deja listos para el juego.

YA NO HACE FALTA, Y NO HAY QUE VOLVER A PASARLA. El dueño acabó pasando los nueve
emblemas dibujados a resolución completa, así que en juego/arte/emblemas/ no queda ni
uno recortado del boceto. Los prepara herramientas/preparar-emblemas-v2.py desde
originales/emblemas-v2/. Esto se queda por si algún día hace falta volver a medir el
boceto: pasarla ahora PISA los nueve buenos con los recortes de baja resolución.

SON LOS DEL DUEÑO, NO ICONOS PARECIDOS. Los dibujó él en el boceto y lo pidió así:
"intenta copiar, por ejemplo, los logos de desafíos, eventos, colección, sets, no me
pongas esos logos de mierda". Así que se recortan de su archivo, no se sustituyen.

El fondo del panel se quita por LUMINANCIA y no por umbral: el emblema es claro sobre
negro, así que el alfa sale de lo claro que sea cada píxel. Con un umbral duro el canto
quedaba dentado; con la luminancia queda el degradado del propio dibujo.

Las cajas salen de medir el boceto: el interior de los paneles va de x 608 a 891 en el
Club y de 930 a 1203 en Desafíos, y las filas están donde las encontró el barrido de
bandas. Los emblemas viven pegados al lado derecho del interior.

Uso:  python3 herramientas/sacar-emblemas.py
"""
from PIL import Image
import os

BOC = 'originales/interfaz-v2/boceto-pantallas.png'
SAL = 'juego/arte/emblemas'
ESCALA = 3          # se guarda a 3x: en pantalla se ven a 56 px y el móvil pinta a 2x

# (interior derecho, alto de la fila) por pantalla
CLUB = 891
DES = 1203
FILAS = {
    'coleccion':   (CLUB, 274, 349),
    'sets':        (CLUB, 359, 434),
    'reciclaje':   (CLUB, 444, 519),
    'intercambio': (CLUB, 533, 597),
    'sbc':         (DES,  107, 204),
    'desafios':    (DES,  214, 315),
    'eventos':     (DES,  318, 417),
    'pase':        (DES,  424, 544),
    'logros':      (DES,  560, 628),
}
ANCHO = 100          # cuánto se mira desde el borde derecho hacia dentro
# Tres filas llevan la caja apretada a mano: con la del barrido, el filete de oro del panel
# se colaba dentro del recorte y salía una raya suelta encima o debajo del emblema.

def luz(p): return 0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]

im = Image.open(BOC).convert('RGB')
os.makedirs(SAL, exist_ok=True)

for n, (der, y0, y1) in FILAS.items():
    caja = im.crop((der - ANCHO, y0 + 5, der - 4, y1 - 5)).convert('RGBA')
    p = caja.load()
    W, H = caja.size
    for y in range(H):
        for x in range(W):
            r, g, b, _ = p[x, y]
            a = (luz((r, g, b)) - 20) / 62          # 20 es el negro del panel
            a = max(0.0, min(1.0, a))
            p[x, y] = (r, g, b, round(a * 255))
    # recorte por alfa, para que cada emblema quede a su tamaño y centrado
    bb = caja.getbbox()
    if not bb:
        print('  vacío:', n); continue
    caja = caja.crop(bb)
    caja = caja.resize((caja.width * ESCALA, caja.height * ESCALA), Image.LANCZOS)
    f = f'{SAL}/{n}.webp'
    caja.save(f, 'WEBP', quality=92, method=6)
    print(f'{n:12} {caja.width}x{caja.height}  {os.path.getsize(f)//1024} kB')
