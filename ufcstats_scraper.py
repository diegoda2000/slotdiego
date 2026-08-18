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

import requests, time, json, re, string, os, sys, argparse
from bs4 import BeautifulSoup

BASE = "http://ufcstats.com"
HEAD = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
PAUSA = 0.4                      # no bajar de 0.3
SALIDA = "ufcstats_data.json"
PROGRESO = "ufcstats_progreso.json"


def sopa(url, reintentos=3):
    for i in range(reintentos):
        try:
            r = requests.get(url, headers=HEAD, timeout=25)
            if r.status_code == 200:
                return BeautifulSoup(r.text, "html.parser")
            if r.status_code == 429:
                time.sleep(30)
        except requests.RequestException:
            pass
        time.sleep(3 * (i + 1))
    return None


def indice(letras):
    """Lista de (nombre, url) de todos los peleadores del indice A-Z."""
    vistos = {}
    for letra in letras:
        s = sopa(f"{BASE}/statistics/fighters?char={letra}&page=all")
        if not s:
            print(f"  [{letra}] fallo")
            continue
        for a in s.select("a.b-link.b-link_style_black"):
            href = a.get("href", "")
            if "fighter-details" in href:
                vistos[href] = a.get_text(strip=True)
        print(f"  [{letra}] {len(vistos)} acumulados")
        time.sleep(PAUSA)
    return [(n, u) for u, n in vistos.items()]


def par(celda):
    """Una celda del historial trae el dato del peleador y el del rival."""
    p = [x.get_text(strip=True) for x in celda.select("p")]
    return {"propio": p[0] if len(p) > 0 else None,
            "rival":  p[1] if len(p) > 1 else None}


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
            bruto[k] = v if v else None
    d["ficha"] = bruto

    # Historial de combates UFC
    peleas = []
    for fila in s.select("tr.b-fight-details__table-row"):
        celdas = fila.select("td.b-fight-details__table-col")
        if len(celdas) < 10:
            continue
        res = celdas[0].get_text(" ", strip=True).lower()
        nombres = [x.get_text(strip=True) for x in celdas[1].select("p")]
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
        })
    d["peleas_ufc"] = peleas
    return d


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--letras", default=string.ascii_lowercase)
    ap.add_argument("--lista", default=None)
    args = ap.parse_args()

    filtro = None
    if args.lista and os.path.exists(args.lista):
        filtro = {l.strip().lower() for l in open(args.lista, encoding="utf-8") if l.strip()}
        print(f"Filtrando a {len(filtro)} nombres\n")

    print("1/2 Leyendo el indice...")
    lista = indice(args.letras)
    if filtro:
        lista = [(n, u) for n, u in lista if n.lower() in filtro]
    print(f"   {len(lista)} peleadores a extraer\n")

    hechos = {}
    if os.path.exists(PROGRESO):
        hechos = json.load(open(PROGRESO, encoding="utf-8"))
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
                json.dump(hechos, open(PROGRESO, "w", encoding="utf-8"), ensure_ascii=False)
                print(f"   {i}/{len(lista)}  ({len(hechos)} guardados)")
            time.sleep(PAUSA)
    except KeyboardInterrupt:
        print("\nParado. Relanza el script para continuar.")

    json.dump(hechos, open(PROGRESO, "w", encoding="utf-8"), ensure_ascii=False)
    json.dump(list(hechos.values()), open(SALIDA, "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    mb = os.path.getsize(SALIDA) / 1e6
    print(f"\nListo: {SALIDA}  ({len(hechos)} peleadores, {mb:.1f} MB)")


if __name__ == "__main__":
    main()
