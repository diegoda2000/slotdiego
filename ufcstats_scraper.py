#!/usr/bin/env python3
"""
EXTRACTOR DE UFCSTATS
Solo saca datos crudos. No calcula ni deriva nada.

    pip install requests beautifulsoup4
    python ufcstats_scraper.py

Salida: ufcstats_data.json

Opciones:
    python ufcstats_scraper.py --letras abc     solo apellidos A, B, C
    python ufcstats_scraper.py --lista mis_peleadores.txt   solo esos nombres
                                                 (un nombre por linea)

Se puede parar con Ctrl+C y relanzar: continua donde lo dejo.
"""

import requests, time, json, re, string, os, sys, argparse, glob
from bs4 import BeautifulSoup

BASE = "http://ufcstats.com"
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")
HEAD = {"User-Agent": UA}
PAUSA = 0.4                      # no bajar de 0.3
SALIDA = "ufcstats_data.json"
PROGRESO = "ufcstats_progreso.json"

# UFCStats sirve un intersticial con un reto JavaScript en vez de la pagina.
# Lo resuelve un Chromium real ejecutando el script del propio sitio, igual
# que haria el navegador de cualquier visitante; luego se reutiliza la cookie
# de sesion que deja, como hace el navegador con sus siguientes peticiones.
MURO = "Checking your browser"
SESION = requests.Session()
SESION.headers.update(HEAD)


def chromium():
    """Ruta al Chromium ya instalado (no descarga nada)."""
    for patron in ("/opt/pw-browsers/chromium-*/chrome-linux/chrome",
                   "/opt/pw-browsers/chromium_headless_shell-*/chrome-linux/headless_shell"):
        encontrados = sorted(glob.glob(patron))
        if encontrados:
            return encontrados[-1]
    return None


def resolver_reto(espera=40):
    """Abre el navegador, deja que resuelva el reto y guarda la cookie."""
    from playwright.sync_api import sync_playwright
    ruta = chromium()
    print("    resolviendo el reto de acceso con Chromium...", file=sys.stderr)
    with sync_playwright() as p:
        nav = p.chromium.launch(headless=True, executable_path=ruta,
                                args=["--no-sandbox"])
        ctx = nav.new_context(user_agent=UA)
        pag = ctx.new_page()
        pag.goto(f"{BASE}/statistics/events/completed",
                 timeout=60000, wait_until="domcontentloaded")
        for _ in range(espera):
            if MURO not in pag.content():
                break
            time.sleep(1)
        galletas = {c["name"]: c["value"] for c in ctx.cookies()}
        nav.close()
    for k, v in galletas.items():
        SESION.cookies.set(k, v)
    if not galletas:
        print("    el navegador no obtuvo cookie de sesion", file=sys.stderr)
    return galletas

# Iconos que UFCStats pone en las filas del historial.
# Clave = fichero en /static/images/, valor = como lo guardamos.
ICONOS = {
    "belt.png":  "titulo",
    "perf.png":  "actuacion_de_la_noche",
    "fight.png": "pelea_de_la_noche",
    "sub.png":   "sumision_de_la_noche",
    "ko.png":    "ko_de_la_noche",
}


def sopa(url, reintentos=3):
    """Descarga y parsea. Devuelve None tras agotar reintentos, avisando por que."""
    ultimo = None
    for i in range(reintentos):
        try:
            r = SESION.get(url, timeout=25)
            if r.status_code == 200:
                if MURO in r.text:
                    # La cookie ha caducado: volver a pasar por el navegador.
                    ultimo = "muro de acceso"
                    resolver_reto()
                    continue
                return BeautifulSoup(r.text, "html.parser")
            ultimo = f"HTTP {r.status_code}"
            if r.status_code in (403, 407):
                # Bloqueo de red / proxy: reintentar no arregla nada.
                cuerpo = r.text.strip()[:200]
                print(f"    acceso denegado ({r.status_code}) en {url}"
                      + (f": {cuerpo}" if cuerpo else ""), file=sys.stderr)
                return None
            if r.status_code == 429:
                time.sleep(30)
        except requests.RequestException as e:
            ultimo = f"{type(e).__name__}: {e}"
        time.sleep(3 * (i + 1))
    print(f"    sin respuesta de {url} ({ultimo})", file=sys.stderr)
    return None


def indice(letras):
    """Lista de (nombre, url) de todos los peleadores del indice A-Z."""
    vistos = {}
    fallos = []
    for letra in letras:
        s = sopa(f"{BASE}/statistics/fighters?char={letra}&page=all")
        if not s:
            print(f"  [{letra}] fallo")
            fallos.append(letra)
            continue
        for a in s.select("a.b-link.b-link_style_black"):
            href = a.get("href", "")
            if "fighter-details" in href:
                vistos[href] = a.get_text(strip=True)
        print(f"  [{letra}] {len(vistos)} acumulados")
        time.sleep(PAUSA)
    if fallos:
        print(f"  AVISO: letras sin leer: {''.join(fallos)}")
    return [(n, u) for u, n in vistos.items()]


def par(celda):
    """Una celda del historial trae el dato del peleador y el del rival."""
    p = [x.get_text(strip=True) for x in celda.select("p")]
    return {"propio": p[0] if len(p) > 0 else None,
            "rival":  p[1] if len(p) > 1 else None}


def marcas(fila):
    """Iconos de la fila: cinturon de titulo y bonus de la noche.

    Se busca en la fila entera y no en una columna fija porque UFCStats
    los coloca en sitios distintos segun la vista.
    """
    brutos, etiquetas = [], []
    for img in fila.select("img"):
        fichero = os.path.basename((img.get("src") or "").split("?")[0]).lower()
        if not fichero:
            continue
        brutos.append(fichero)
        etiqueta = ICONOS.get(fichero)
        if etiqueta and etiqueta not in etiquetas:
            etiquetas.append(etiqueta)
    return brutos, etiquetas


def enlace_pelea(fila):
    """URL de la pagina fight-details de esa pelea, si la fila la trae."""
    if fila.get("data-link") and "fight-details" in fila["data-link"]:
        return fila["data-link"]
    for a in fila.select("a"):
        href = a.get("href", "")
        if "fight-details" in href:
            return href
    return None


ALIAS = {"Str. Def": "Str. Def.", "Str. Acc": "Str. Acc.",
         "TD Def": "TD Def.", "TD Acc": "TD Acc.",
         "TD Avg": "TD Avg.", "Sub. Avg": "Sub. Avg."}


def ficha(url):
    s = sopa(url)
    if not s:
        return None

    d = {"url": url, "id": url.rstrip("/").split("/")[-1]}

    t = s.select_one("span.b-content__title-highlight")
    d["nombre"] = t.get_text(strip=True) if t else None

    apodo = s.select_one("p.b-content__Nickname")
    d["apodo"] = apodo.get_text(strip=True) if apodo else None

    rec = s.select_one("span.b-content__title-record")
    d["record_texto"] = rec.get_text(strip=True).replace("Record:", "").strip() if rec else None
    if d["record_texto"]:
        m = re.search(r"(\d+)-(\d+)-(\d+)", d["record_texto"])
        if m:
            d["V"], d["D"], d["E"] = int(m.group(1)), int(m.group(2)), int(m.group(3))
        nc = re.search(r"\((\d+)\s*NC\)", d["record_texto"])
        d["NC"] = int(nc.group(1)) if nc else 0

    # Ficha fisica + estadisticas de carrera (tal cual las publica UFCStats)
    bruto = {}
    for li in s.select("li.b-list__box-list-item"):
        i = li.select_one("i.b-list__box-item-title")
        if not i:
            continue
        k = i.get_text(strip=True).rstrip(":").strip()
        v = li.get_text(" ", strip=True)
        v = v.replace(i.get_text(strip=True), "", 1).strip()
        if k:
            # UFCStats escribe unas etiquetas con punto final y otras sin el
            # ("Str. Def" frente a "TD Def."). Solo se unifica el nombre de la
            # etiqueta; el valor se guarda tal cual viene.
            bruto[ALIAS.get(k, k)] = v if v else None
    d["ficha"] = bruto

    # Historial de combates UFC
    peleas = []
    for fila in s.select("tr.b-fight-details__table-row"):
        celdas = fila.select("td.b-fight-details__table-col")
        if len(celdas) < 10:
            continue
        res = celdas[0].get_text(" ", strip=True).lower()
        nombres = [x.get_text(strip=True) for x in celdas[1].select("p")]
        iconos, distinciones = marcas(fila)
        peleas.append({
            "resultado": "win" if "win" in res else ("loss" if "loss" in res else res),
            "peleador":  nombres[0] if len(nombres) > 0 else None,
            "rival":     nombres[1] if len(nombres) > 1 else None,
            "kd":        par(celdas[2]),
            "golpes_sig": par(celdas[3]),
            "derribos":  par(celdas[4]),
            "int_sumision": par(celdas[5]),
            "evento":    celdas[6].select_one("p").get_text(strip=True) if celdas[6].select_one("p") else None,
            "fecha":     celdas[6].select("p")[-1].get_text(strip=True) if len(celdas[6].select("p")) > 1 else None,
            "metodo":    " ".join(x.get_text(strip=True) for x in celdas[7].select("p")).strip(),
            "asalto":    celdas[8].get_text(strip=True),
            "tiempo":    celdas[9].get_text(strip=True),
            "url_pelea": enlace_pelea(fila),
            "iconos":    iconos,
            "titulo":    "titulo" in distinciones,
            "bonus":     [x for x in distinciones if x != "titulo"],
        })
    d["peleas_ufc"] = peleas
    return d


def guardar(datos, ruta):
    """Escribe a un temporal y renombra, para no dejar el fichero a medias."""
    tmp = ruta + ".tmp"
    with open(tmp, "w", encoding="utf-8") as fh:
        json.dump(datos, fh, ensure_ascii=False,
                  indent=(1 if ruta == SALIDA else None))
    os.replace(tmp, ruta)


CLAVES_FICHA = ["SLpM", "Str. Acc.", "SApM", "Str. Def.",
                "TD Avg.", "TD Acc.", "TD Def.", "Sub. Avg."]


def revision(fichas):
    """Cuenta cuantas fichas traen cada campo. Solo control de extraccion."""
    n = len(fichas)
    if not n:
        return
    def lleno(v):
        return v not in (None, "", [], {}, "--")
    print("\nRelleno de campos:")
    print(f"  record_texto        {sum(1 for f in fichas if lleno(f.get('record_texto'))):>5}/{n}")
    print(f"  peleas_ufc          {sum(1 for f in fichas if lleno(f.get('peleas_ufc'))):>5}/{n}")
    for k in CLAVES_FICHA:
        c = sum(1 for f in fichas if lleno((f.get("ficha") or {}).get(k)))
        print(f"  ficha[{k}]{' ' * max(0, 14 - len(k))}{c:>5}/{n}")
    peleas = [p for f in fichas for p in f.get("peleas_ufc", [])]
    if peleas:
        print(f"  peleas totales      {len(peleas):>5}")
        print(f"    con url_pelea     {sum(1 for p in peleas if p.get('url_pelea')):>5}")
        print(f"    de titulo         {sum(1 for p in peleas if p.get('titulo')):>5}")
        print(f"    con bonus         {sum(1 for p in peleas if p.get('bonus')):>5}")
    flojos = [k for k in CLAVES_FICHA
              if sum(1 for f in fichas if lleno((f.get("ficha") or {}).get(k))) < n * 0.5]
    if flojos:
        print(f"\n  AVISO: vacios en mas de la mitad de las fichas: {', '.join(flojos)}")
        print("  Puede que UFCStats haya cambiado el HTML; revisa los selectores.")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--letras", default=string.ascii_lowercase)
    ap.add_argument("--lista", default=None)
    args = ap.parse_args()

    filtro = None
    if args.lista and os.path.exists(args.lista):
        with open(args.lista, encoding="utf-8") as fh:
            filtro = {l.strip().lower() for l in fh if l.strip()}
        print(f"Filtrando a {len(filtro)} nombres\n")

    hechos = {}
    if os.path.exists(PROGRESO):
        with open(PROGRESO, encoding="utf-8") as fh:
            hechos = json.load(fh)

    print("0/2 Abriendo sesion con UFCStats...")
    resolver_reto()

    print("1/2 Leyendo el indice...")
    lista = indice(args.letras)
    if filtro:
        lista = [(n, u) for n, u in lista if n.lower() in filtro]
    print(f"   {len(lista)} peleadores a extraer\n")

    if not lista:
        print("No se ha leido ningun peleador del indice: no se toca "
              f"{SALIDA} ni {PROGRESO}.\n"
              "Mira los avisos de arriba (bloqueo de red, o UFCStats caido).")
        return 1

    if hechos:
        print(f"   Retomando: {len(hechos)} ya extraidos\n")

    print("2/2 Extrayendo fichas...")
    try:
        for i, (nombre, url) in enumerate(lista, 1):
            if url in hechos:
                continue
            f = ficha(url)
            if f:
                hechos[url] = f
            if i % 25 == 0:
                guardar(hechos, PROGRESO)
                print(f"   {i}/{len(lista)}  ({len(hechos)} guardados)")
            time.sleep(PAUSA)
    except KeyboardInterrupt:
        print("\nParado. Relanza el script para continuar.")

    guardar(hechos, PROGRESO)
    fichas = list(hechos.values())
    guardar(fichas, SALIDA)
    mb = os.path.getsize(SALIDA) / 1e6
    print(f"\nListo: {SALIDA}  ({len(hechos)} peleadores, {mb:.1f} MB)")
    revision(fichas)
    return 0


if __name__ == "__main__":
    sys.exit(main())
