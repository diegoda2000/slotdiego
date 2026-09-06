#!/usr/bin/env python3
"""Saca el banner de Android TV desde el logo ya recortado.

    originales/logo-v2/logo-recortado.png  ->  android/.../drawable-xhdpi/banner_tv.png

POR QUÉ HACE FALTA. En la pantalla de inicio de una Android TV las aplicaciones no se
enseñan con su icono cuadrado y su nombre debajo, sino con un BANNER apaisado de
320x180 en xhdpi, y el nombre tiene que ir dentro del dibujo porque el lanzador no
escribe ninguno. Sin banner, la aplicación sale como un recuadro vacío.

Aquí el nombre ya viene dentro: el logo ES el P4P.CG escrito dentro del octógono, así
que el banner es el logo sobre el negro de la paleta y nada más. Ponerle el nombre otra
vez al lado sería escribirlo dos veces.

EL TAMAÑO SALE DEL RADIO DE VERDAD, como en el icono. El octógono no llena su caja: si
se escala por la caja, en pantalla se ve más pequeño de lo que podría. Se mide la
distancia del centro al píxel opaco más lejano y se ajusta contra el alto útil del
banner, dejando un margen del 11% arriba y abajo para que no toque el canto —los
lanzadores de TV recortan un pelo y le ponen un realce alrededor al enfocarlo—.
"""
from PIL import Image
import os

ORIGEN = 'originales/logo-v2/logo-recortado.png'
DESTINO = 'android/app/src/main/res/drawable-xhdpi/banner_tv.png'
ANCHO, ALTO = 320, 180
FONDO = (6, 7, 7, 255)      # --negro de la paleta, el mismo que @color/fondo
MARGEN = 0.11               # del alto, arriba y abajo

logo = Image.open(ORIGEN).convert('RGBA')
alfa = logo.getchannel('A')

# El radio real: del centro de la caja opaca al píxel con alfa más lejano.
caja = alfa.getbbox()
cx, cy = (caja[0] + caja[2]) / 2, (caja[1] + caja[3]) / 2
px = alfa.load()
radio = 0.0
for y in range(caja[1], caja[3]):
    for x in range(caja[0], caja[2]):
        if px[x, y] > 8:
            d = ((x - cx) ** 2 + (y - cy) ** 2) ** 0.5
            if d > radio: radio = d

util = (ALTO * (1 - 2 * MARGEN)) / 2      # el radio que puede ocupar
escala = util / radio
ancho_n, alto_n = max(1, round(logo.width * escala)), max(1, round(logo.height * escala))
chico = logo.resize((ancho_n, alto_n), Image.LANCZOS)

banner = Image.new('RGBA', (ANCHO, ALTO), FONDO)
# Se pega centrando el CENTRO DEL DIBUJO, no la caja del archivo: si el logo trae aire
# de más en un lado, centrando la caja quedaría descolocado.
ccx, ccy = cx * escala, cy * escala
banner.alpha_composite(chico, (round(ANCHO / 2 - ccx), round(ALTO / 2 - ccy)))

os.makedirs(os.path.dirname(DESTINO), exist_ok=True)
banner.convert('RGB').save(DESTINO, 'PNG', optimize=True)
print(f'{DESTINO}  {ANCHO}x{ALTO}  (radio del logo {radio:.0f}px -> escala {escala:.3f})')
