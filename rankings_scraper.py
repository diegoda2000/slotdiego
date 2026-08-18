#!/usr/bin/env python3
"""
RANKINGS UFC -> rankings.json
Once paginas, unos 10 segundos.

    pip install requests beautifulsoup4
    python rankings_scraper.py

Solo extraccion: no calcula ni deriva nada.
"""
import requests, time, json, re
from bs4 import BeautifulSoup

DIVS = ["flyweight","bantamweight","featherweight","lightweight","welterweight",
        "middleweight","light-heavyweight","heavyweight",
        "womens-strawweight","womens-flyweight","womens-bantamweight"]
HEAD = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}


def entrada(a):
    """Una fila del ranking.

    El enlace viene siempre con la misma estructura:
        <span>posicion</span>
        <div>avatar</div>          <- <img> o, sin foto, las iniciales
        <div style="flex:1">       <- <span>nombre</span> [<span>record</span>]
        <div>movimiento</div>      <- [<span>flecha</span><span>n</span>]

    Se lee por estructura y no del texto plano del enlace: cuando el peleador
    no tiene foto, el avatar cae a sus iniciales y se pegaban al nombre.
    """
    sp = a.find("span", recursive=False)
    if not sp:
        return None
    crudo = sp.get_text(strip=True).lstrip("#").strip()
    if not crudo.isdigit():
        return None

    divs = a.find_all("div", recursive=False)
    if len(divs) < 2:
        return None

    cuerpo = next((d for d in divs
                   if "flex:1" in (d.get("style") or "").replace(" ", "")), divs[1])
    spans = cuerpo.find_all("span", recursive=False)
    nombre = spans[0].get_text(strip=True) if spans else None
    record = spans[1].get_text(strip=True) if len(spans) > 1 else None

    mov = 0
    mm = re.search(r"([▲▼])\s*(\d+)", divs[-1].get_text(" ", strip=True))
    if mm:
        mov = int(mm.group(2)) * (1 if mm.group(1) == "▲" else -1)

    return {"pos": int(crudo), "nombre": nombre, "record": record, "movimiento": mov}


out = {}
for d in DIVS:
    url = f"https://ufctime.com/rankings/{d}"
    try:
        r = requests.get(url, headers=HEAD, timeout=25)
        s = BeautifulSoup(r.text, "html.parser")
    except Exception as e:
        print(f"  {d}: ERROR {e}")
        continue

    # Tarjeta del campeon: <a><h2>nombre</h2></a> y el record en el <p> hermano.
    campeon = rec_c = None
    h2 = s.find("h2")
    if h2:
        campeon = h2.get_text(" ", strip=True) or None
        p = h2.parent.find_next_sibling("p")
        if p:
            m = re.search(r"\d+-\d+-\d+(?:\s*\(\d+\s*NC\))?", p.get_text(" ", strip=True))
            if m:
                rec_c = m.group(0)

    ranking = []
    for a in s.select("a[href*='/fighter/']"):
        e = entrada(a)
        if e and e["nombre"] and 1 <= e["pos"] <= 15:
            ranking.append(e)

    ranking = sorted({x["pos"]: x for x in ranking}.values(), key=lambda x: x["pos"])
    out[d] = {"campeon": campeon, "record_campeon": rec_c, "top15": ranking}
    sin_rec = sum(1 for x in ranking if not x["record"])
    print(f"  {d:22} campeon={campeon}  top15={len(ranking)}"
          + (f"  (sin record: {sin_rec})" if sin_rec else ""))
    time.sleep(0.5)

json.dump(out, open("rankings.json", "w"), ensure_ascii=False, indent=1)
print(f"\nListo: rankings.json ({len(out)} divisiones)")
