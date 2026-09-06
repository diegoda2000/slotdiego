"""Deja listos los marcos de RARO y ÉPICO desde originales/marcos-v2/.

Los pasó él ya dibujados, frente y reverso de cada uno, y pidió tres cosas:

  1. "que ocupen el mismo tamaño que las cartas actuales"     -> 620x877, como el común.
  2. "que no tengan ningún tipo de reborde negro por fuera"    -> recortadas, como el común.
  3. "la luz de estas debe ser constante, no muy fuerte en las zonas que tenga un
     resplandor, siempre del color de esas zonas en la carta"  -> lo de abajo.

LO DE LA LUZ NO ES UNA IMPRESIÓN SUYA, ESTÁ MEDIDO. Contando qué parte de cada archivo
pasa de cada nivel de luz y con cuánto color le queda:

    marco     >170 de luz          >220                >250
    común     0,05% · sat 0,17     nada                nada
    raro      1,03% · sat 0,70     0,12% · sat 0,32    nada
    épico     1,60% · sat 0,37     0,54% · sat 0,18    0,10% · sat 0,02

Los dos nuevos vienen con reventones de floración: en el épico hay un 0,10% de la carta a
saturación 0,02, o sea BLANCO PURO. Ahí el resplandor ha perdido su color, que es justo lo
que él dice. Y comparados con el común —que no pasa de 200 en ningún píxel— los tres no
parecen la misma baraja.

Se arregla en dos pasos, y los dos hacen falta:

  · SE LE DEVUELVE EL COLOR DE SU ZONA. De dónde sale ese color no se elige: se toma del
    propio archivo, desenfocándolo mucho (un radio del 3% del ancho) para quedarse con el
    tono medio de esa parte del marco. Así un reventón sobre una barra dorada vuelve dorado
    y uno sobre una violeta vuelve violeta, sin decidir nada a mano.
  · SE LE BAJA EL PICO. Por encima del techo la luz se comprime en vez de cortarse: cortar
    aplana el resplandor en una mancha de un solo tono y se le ve el escalón.

Y CADA MARCO SALE PARTIDO EN DOS, que es lo que permite animar la luz sin moverla:
"raro.webp" es el marco con el resplandor APAGADO y "raro-luz.webp" el resplandor solo, con
los colores del original y transparencia donde no hay luz. El juego los pone uno encima del
otro y lo único que anima es la opacidad de la capa de arriba: al 100% la carta es EXACTA
al archivo que él pasó, y al 45% la misma carta con la luz baja. El resplandor no se
desplaza ni cambia de tono —sigue siendo el de su zona, píxel por píxel—: sólo respira.

Se hace así y no con `mix-blend-mode` ni sumando capas a propósito. Con la mezcla normal de
toda la vida, poner la luz encima da `apagado·(1−a) + original·a`, y como el apagado ES el
original multiplicado en esas mismas zonas, el resultado a opacidad 1 vuelve a ser el
original clavado. Un modo de mezcla exótico no haría falta y sería una cosa más que puede
no existir en un WebView viejo.

QUÉ CUENTA COMO RESPLANDOR: la luz, pesada por el color. `a` sube con la luminancia entre
0,20 y 0,55 y se multiplica por la saturación hasta 0,35. Lo segundo no es un adorno: sin
ello entrarían el "UFC" y el "P4P" del reverso, que son blancos y plata, y se pondrían a
parpadear como si fueran neón.

Uso:  python3 herramientas/preparar-marcos-rareza.py [--muestras]
"""
import os, sys
import numpy as np
from PIL import Image, ImageFilter

ORIGEN, SALIDA = 'originales/marcos-v2', 'juego/marcos'
ANCHO, ALTO = 620, 877          # lo mismo que el común: él lo pidió así

# El techo sale de la tabla de arriba: el común no llega a 200 en ningún píxel, así que
# poner el de los otros dos en 210 los deja un punto por encima —siguen siendo cartas más
# ricas— sin que ninguno reviente. Lo que pase de ahí se comprime a un tercio.
TECHO, COMPRESION = 210, 0.34
# Por debajo de esta saturación el píxel ya no dice de qué color era: se le pone el de su
# zona. Por encima, se respeta el suyo.
SAT_MINIMA = 0.45
DESENFOQUE = 0.03               # el radio del desenfoque, en fracción del ancho

# Los dos extremos de qué es resplandor, y cuánto se apaga la capa de abajo.
LUZ_0, LUZ_1 = 0.20, 0.55       # por debajo no es luz; por encima es luz del todo
SAT_LUZ = 0.35                  # el color que hace falta para contar como neón
APAGADO = 0.42                  # a cuánto se queda el resplandor en la capa de abajo


def partirLuz(im):
    """Devuelve (marco apagado, resplandor suelto). Sumados dan el original exacto."""
    a = np.asarray(im.convert('RGB'), dtype=np.float32) / 255.0
    luz = a @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    mx, mn = a.max(2), a.min(2)
    sat = np.where(mx > 1e-6, (mx - mn) / np.maximum(mx, 1e-6), 0.0)
    fuerza = (np.clip((luz - LUZ_0) / (LUZ_1 - LUZ_0), 0, 1)
              * np.clip(sat / SAT_LUZ, 0, 1))
    base = a * (1 - fuerza * (1 - APAGADO))[..., None]
    apagado = Image.fromarray((np.clip(base, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGB')
    brillo = Image.fromarray(
        np.dstack([(a * 255 + 0.5).astype(np.uint8),
                   (fuerza * 255 + 0.5).astype(np.uint8)]), 'RGBA')
    return apagado, brillo, float(fuerza.mean())


def apagarBrillos(im):
    """Luz constante y del color de su zona. Devuelve la imagen y qué se ha tocado."""
    rgb = np.asarray(im.convert('RGB'), dtype=np.float32) / 255.0
    W = im.size[0]
    zona = np.asarray(im.convert('RGB').filter(
        ImageFilter.GaussianBlur(radius=max(2, W * DESENFOQUE))), dtype=np.float32) / 255.0

    luz = rgb @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    techo = TECHO / 255.0

    # 1. EL COLOR DE LA ZONA. La saturación se mide como (max-min)/max, que es la de HSV;
    #    donde el píxel la ha perdido y su zona sí tiene, se le devuelve el tono de la zona
    #    conservando SU brillo — el reventón sigue siendo el punto más luminoso, pero con
    #    color.
    def sat(a):
        mx, mn = a.max(2), a.min(2)
        return np.where(mx > 1e-6, (mx - mn) / np.maximum(mx, 1e-6), 0.0)

    sp, sz = sat(rgb), sat(zona)
    tono = zona / np.maximum(zona.max(2, keepdims=True), 1e-6)      # la zona, normalizada
    # cuánto se le devuelve: nada si ya tiene color, todo si está blanco del todo
    mezcla = np.clip((SAT_MINIMA - sp) / SAT_MINIMA, 0, 1) * np.clip(sz / SAT_MINIMA, 0, 1)
    mezcla = (mezcla * np.clip((luz - 0.55) / 0.35, 0, 1))[..., None]   # sólo donde hay luz
    salida = rgb * (1 - mezcla) + (tono * luz[..., None] / np.maximum(
        tono @ np.array([0.299, 0.587, 0.114], dtype=np.float32), 1e-6)[..., None]) * mezcla

    # 2. EL PICO. Se comprime por encima del techo, conservando el color: se escala el
    #    píxel entero por el factor que le toque a su luz, no se recorta canal a canal
    #    —recortar canales vira el color hacia el blanco, que es lo que hay que evitar—.
    l2 = np.maximum(salida @ np.array([0.299, 0.587, 0.114], dtype=np.float32), 1e-6)
    objetivo = np.where(l2 > techo, techo + (l2 - techo) * COMPRESION, l2)
    salida = salida * (objetivo / l2)[..., None]

    tocado = float((luz > techo).mean())
    salida = np.clip(salida, 0, 1)
    return Image.fromarray((salida * 255 + 0.5).astype(np.uint8), 'RGB'), tocado


def cajaDelDibujo(a):
    """El rectángulo que ocupa la carta, sin las franjas negras de los lados."""
    luz = a @ np.array([0.299, 0.587, 0.114], dtype=np.float32)
    filas, cols = np.where(luz >= 6)
    return cols.min(), filas.min(), cols.max() + 1, filas.max() + 1


def recortar(im, caja):
    """Transparencia por detrás de la carta: las franjas y el chaflán de cada esquina.

    Igual que el común, y por el mismo motivo: una inundación libre desde los bordes se
    cuela por el canto exterior del marco —que es tan negro como el fondo— y se come una
    tira del lateral. Confinada a su rincón, una fuga no puede recorrerlo.
    """
    from collections import deque
    im = im.convert('RGBA'); W, H = im.size; p = im.load()
    cx0, cy0, cx1, cy1 = caja
    aw, ah = cx1 - cx0, cy1 - cy0
    rw, rh = int(aw * 0.16), int(ah * 0.16 * aw / ah)
    fuera = bytearray(W * H)
    for y in range(H):
        for x in range(W):
            if x < cx0 or x >= cx1 or y < cy0 or y >= cy1: fuera[y * W + x] = 1
    for ex, ey in ((cx0, cy0), (cx1 - 1, cy0), (cx0, cy1 - 1), (cx1 - 1, cy1 - 1)):
        rx0, rx1 = (ex, ex + rw) if ex == cx0 else (ex - rw, ex + 1)
        ry0, ry1 = (ey, ey + rh) if ey == cy0 else (ey - rh, ey + 1)
        cola = deque()
        def mete(x, y):
            if not (rx0 <= x < rx1 and ry0 <= y < ry1): return
            n = y * W + x
            if fuera[n]: return
            r, g, b, _ = p[x, y]
            if 0.299 * r + 0.587 * g + 0.114 * b >= 4: return
            fuera[n] = 1; cola.append((x, y))
        mete(ex, ey)
        while cola:
            x, y = cola.popleft()
            mete(x - 1, y); mete(x + 1, y); mete(x, y - 1); mete(x, y + 1)
    for y in range(H):
        for x in range(W):
            n = y * W + x
            r, g, b, _ = p[x, y]
            if fuera[n]: p[x, y] = (r, g, b, 0); continue
            toca = ((x > 0 and fuera[n - 1]) or (x < W - 1 and fuera[n + 1])
                    or (y > 0 and fuera[n - W]) or (y < H - 1 and fuera[n + W]))
            if toca:
                a = min(1.0, max(.35, (0.299 * r + 0.587 * g + 0.114 * b) / 14))
                p[x, y] = (r, g, b, round(a * 255))
    return im


PIEZAS = [('rare-frente', 'raro'), ('rare-reverso', 'raro-reverso'),
          ('epic-frente', 'epico'), ('epic-reverso', 'epico-reverso')]

os.makedirs(SALIDA, exist_ok=True)
MUESTRAS = '--muestras' in sys.argv
for orig, nom in PIEZAS:
    im = Image.open(f'{ORIGEN}/{orig}.png').convert('RGB')
    antes = im.size
    im, tocado = apagarBrillos(im)
    caja = cajaDelDibujo(np.asarray(im, dtype=np.float32))

    # El marco se parte ANTES de recortar y escalar, para que las dos capas salgan del
    # mismo original y encajen píxel a píxel al superponerlas.
    apagado, brillo, medio = partirLuz(im)
    alfa = recortar(im, caja).crop(caja).resize((ANCHO, ALTO), Image.LANCZOS).getchannel('A')

    capas = []
    base = apagado.convert('RGBA').crop(caja).resize((ANCHO, ALTO), Image.LANCZOS)
    base.putalpha(alfa)
    capas.append((nom, base))

    # El resplandor lleva el alfa de la luz multiplicado por el del recorte: fuera de la
    # carta no puede pintar nada, o el desgarro del canto se vería doble.
    luz = brillo.crop(caja).resize((ANCHO, ALTO), Image.LANCZOS)
    la = np.asarray(luz.getchannel('A'), dtype=np.float32) / 255.0
    ra = np.asarray(alfa, dtype=np.float32) / 255.0
    luz.putalpha(Image.fromarray((la * ra * 255 + 0.5).astype(np.uint8), 'L'))
    capas.append((nom + '-luz', luz))

    tam = 0
    for n2, im2 in capas:
        f = f'{SALIDA}/{n2}.webp'
        # La capa de luz va a menos calidad a propósito: es un resplandor difuso y sin
        # cantos, así que no se le nota, y a 90 duplicaba el peso del marco en el APK.
        im2.save(f, 'WEBP', quality=72 if n2.endswith('-luz') else 90, method=6)
        tam += os.path.getsize(f)
    print(f'{orig:14} {antes[0]}x{antes[1]} -> {nom}.webp + {nom}-luz.webp  dibujo '
          f'{caja[2]-caja[0]}x{caja[3]-caja[1]} (prop {(caja[2]-caja[0])/(caja[3]-caja[1]):.4f})  '
          f'luz bajada en el {100*tocado:.2f}%, resplandor en el {100*medio:.1f}%  {tam//1024} kB')

if MUESTRAS:
    print('\n  Cómo queda la luz, medida igual que antes:')
    for orig, nom in [('comun-frente', 'comun')] + PIEZAS:
        im = Image.open(f'{SALIDA}/{nom}.webp').convert('RGB')
        a = np.asarray(im, dtype=np.float32) / 255.0
        luz = (a @ np.array([0.299, 0.587, 0.114], dtype=np.float32)) * 255
        mx, mn = a.max(2), a.min(2)
        s = np.where(mx > 1e-6, (mx - mn) / np.maximum(mx, 1e-6), 0.0)
        fila = f'    {nom:15}'
        for corte in (170, 220, 250):
            m = luz >= corte
            fila += (f'>{corte}: {100*m.mean():5.2f}% sat {s[m].mean():.2f}   '
                     if m.any() else f'>{corte}: nada            ')
        print(fila + f'  máx {luz.max():.0f}')
