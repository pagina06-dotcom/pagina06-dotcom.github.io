"""Recolector semanal del sitio de Tomás Veloz.

Consulta las fuentes académicas, une los duplicados y escribe:
  datos/publicaciones.json   lista unificada con línea sugerida y sellos de verificación
  datos/perfil.json          cifras, publicaciones por año, coautores, afiliaciones con ubicación
  datos/fuentes.json         estado y fecha de cada sincronización
  datos/sitio.js             todo lo anterior + contenido/*.json, listo para la página

Uso:
  python scripts/actualizar.py            recolecta todo (5-8 minutos, arXiv es lento)
  python scripts/actualizar.py --rapido   sin la búsqueda de arXiv por título
  python scripts/actualizar.py --sin-red  solo vuelve a armar datos/sitio.js (tras editar contenido/)

Reglas: no se inventa nada. Si una fuente falla se conservan sus datos de la semana anterior;
si fallan ORCID u OpenAlex (la base de la lista) no se sobrescribe nada.
Solo usa la biblioteca estándar de Python 3.10+.
"""
import argparse
import datetime as dt
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET

ORCID = "0000-0003-3014-8340"
OPENALEX_AUTHOR = "A5026723884"

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENIDO = os.path.join(RAIZ, "contenido")
DATOS = os.path.join(RAIZ, "datos")

# Correo de contacto opcional para el "polite pool" de OpenAlex y Crossref (variable de entorno).
CONTACTO = os.environ.get("CONTACTO_API", "").strip()
UA = "tveloz-sitio/1.0 (sitio académico; GitHub Actions)" + (f" mailto:{CONTACTO}" if CONTACTO else "")
HOY = dt.date.today().isoformat()


# ---------------------------------------------------------------- utilidades
def log(*a):
    print(*a, flush=True)


def pedir(url, datos=None, cabeceras=None, intentos=4, json_=True):
    """GET/POST con reintentos ante 429 y errores 5xx. Devuelve None si el recurso no existe (404)."""
    cab = {"User-Agent": UA, "Accept": "application/json"}
    cab.update(cabeceras or {})
    cuerpo = None
    if datos is not None:
        cuerpo = json.dumps(datos).encode()
        cab["Content-Type"] = "application/json"
    for i in range(intentos):
        try:
            req = urllib.request.Request(url, data=cuerpo, headers=cab)
            with urllib.request.urlopen(req, timeout=40) as r:
                txt = r.read().decode("utf-8")
                return json.loads(txt) if json_ else txt
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return None
            if e.code in (429, 500, 502, 503, 504) and i < intentos - 1:
                time.sleep(3 * (i + 1) ** 2)
                continue
            raise
        except (urllib.error.URLError, TimeoutError):
            if i < intentos - 1:
                time.sleep(3 * (i + 1))
                continue
            raise


def leer_json(ruta, defecto=None):
    try:
        with open(ruta, encoding="utf-8") as f:
            return json.load(f)
    except FileNotFoundError:
        return defecto


def escribir_json(ruta, obj):
    with open(ruta, "w", encoding="utf-8") as f:
        json.dump(obj, f, ensure_ascii=False, indent=1)
        f.write("\n")


def norm(s):
    return re.sub(r"[^a-z0-9]", "", (s or "").lower())


def doi_limpio(d):
    if not d:
        return None
    d = d.strip().lower()
    d = re.sub(r"^https?://(dx\.)?doi\.org/", "", d)
    return d or None


# ---------------------------------------------------------------- fuentes base
def orcid_obras():
    d = pedir(f"https://pub.orcid.org/v3.0/{ORCID}/works")
    obras = []
    for g in d.get("group", []):
        s = g["work-summary"][0]  # ORCID elige el resumen preferido primero
        doi = None
        for e in (s.get("external-ids") or {}).get("external-id", []):
            if e.get("external-id-type") == "doi":
                doi = doi_limpio(e.get("external-id-value"))
                break
        fecha = s.get("publication-date") or {}
        anio = (fecha.get("year") or {}).get("value")
        obras.append({
            "t": ((s.get("title") or {}).get("title") or {}).get("value"),
            "y": int(anio) if anio else None,
            "doi": doi,
            "ty": (s.get("type") or "").replace("journal-article", "article").replace("conference-paper", "conference-paper"),
            "v": (s.get("journal-title") or {}).get("value") if s.get("journal-title") else None,
            "put": s.get("put-code"),
        })
    return obras


def orcid_secciones():
    """Cuenta lo que hay en cada sección de ORCID (para Fuentes) y trae empleos y formación."""
    out = {}
    for sec in ("employments", "educations", "fundings", "distinctions", "invited-positions", "peer-reviews"):
        d = pedir(f"https://pub.orcid.org/v3.0/{ORCID}/{sec}") or {}
        grupos = d.get("affiliation-group", d.get("group", []))
        out[sec] = len(grupos)
        if sec in ("employments", "educations"):
            filas = []
            for g in grupos:
                for s in g.get("summaries", []):
                    e = next(iter(s.values()))
                    o = e.get("organization") or {}
                    ini = ((e.get("start-date") or {}).get("year") or {}).get("value")
                    fin = ((e.get("end-date") or {}).get("year") or {}).get("value")
                    filas.append({"org": o.get("name"), "ciudad": (o.get("address") or {}).get("city"),
                                  "pais": (o.get("address") or {}).get("country"),
                                  "rol": e.get("role-title"), "depto": e.get("department-name"),
                                  "desde": ini, "hasta": fin})
            out[sec + "_detalle"] = filas
    return out


def openalex_autor():
    return pedir(f"https://api.openalex.org/authors/{OPENALEX_AUTHOR}")


def openalex_obras():
    obras, cursor = [], "*"
    while cursor:
        url = ("https://api.openalex.org/works?filter=author.id:" + OPENALEX_AUTHOR +
               "&per_page=200&cursor=" + urllib.parse.quote(cursor))
        d = pedir(url)
        obras += d["results"]
        cursor = d["meta"].get("next_cursor")
        if not d["results"]:
            break
    return obras


def openalex_instituciones(ids):
    out = {}
    ids = list(ids)
    for i in range(0, len(ids), 50):
        lote = "|".join(ids[i:i + 50])
        d = pedir(f"https://api.openalex.org/institutions?filter=openalex_id:{lote}&per_page=50")
        for r in d["results"]:
            g = r.get("geo") or {}
            out[r["id"].rsplit("/", 1)[-1]] = {
                "nombre": r["display_name"], "ciudad": g.get("city"), "pais": g.get("country"),
                "ll": [g.get("latitude"), g.get("longitude")] if g.get("latitude") is not None else None,
                "ror": r.get("ror")}
    return out


# ---------------------------------------------------------------- unificación
def unir(oa, orc, corr, autor_id):
    """Une OpenAlex y ORCID por DOI o por título+año. Cada obra conserva sus fuentes."""
    excluir_tipos = set(corr.get("tipos_excluidos", []))
    excluidas = set(corr.get("obras_excluidas", []))
    obras, por_doi, por_tit = [], {}, {}

    def clave_titulo(t, y):
        return norm(t)[:120] + "|" + str(y or "")

    for w in oa:
        if w.get("is_paratext") or w.get("is_retracted") or w.get("type") in excluir_tipos:
            continue
        if not w.get("title"):
            continue
        doi = doi_limpio(w.get("doi"))
        src = (w.get("primary_location") or {}).get("source") or {}
        autores = [a["author"]["display_name"] for a in w.get("authorships", [])]
        coaut = [a["author"]["display_name"] for a in w.get("authorships", [])
                 if not (a["author"].get("id") or "").endswith(autor_id)]
        arxiv = None
        for loc in w.get("locations", []):
            u = (loc.get("landing_page_url") or "") + " " + (loc.get("pdf_url") or "")
            m = re.search(r"arxiv\.org/(?:abs|pdf)/([0-9]{4}\.[0-9]{4,5}|[a-z\-]+/[0-9]{7})", u)
            if m:
                arxiv = m.group(1)
                break
        if not arxiv and doi and doi.startswith("10.48550/arxiv."):
            arxiv = doi.split("arxiv.", 1)[1]
        o = {
            "id": doi or "oa:" + w["id"].rsplit("/", 1)[-1],
            "t": w["title"], "y": w.get("publication_year"), "c": w.get("cited_by_count", 0),
            "v": src.get("display_name"), "vtipo": src.get("type"), "ty": w.get("type"),
            "doi": doi, "au": autores, "coau": coaut, "n": len(autores),
            "temas": [t["display_name"] for t in (w.get("topics") or [])[:3]],
            "oa": w["id"].rsplit("/", 1)[-1], "arxiv_oa": arxiv,
            "fuentes": ["openalex"],
        }
        k = clave_titulo(o["t"], o["y"])
        previa = (por_doi.get(doi) if doi else None) or por_tit.get(k)
        if previa:  # duplicado dentro de OpenAlex: se queda la versión con DOI de editorial y más citas
            previa["c"] = max(previa["c"], o["c"])
            if not previa["doi"] and o["doi"]:
                previa.update(id=o["id"], doi=o["doi"], v=o["v"], vtipo=o["vtipo"])
            previa["arxiv_oa"] = previa["arxiv_oa"] or arxiv
            continue
        obras.append(o)
        if doi:
            por_doi[doi] = o
        por_tit[k] = o

    titulos_excl = re.compile(corr.get("titulos_excluidos") or r"(?!)", re.I)

    def mismo_titulo(t, y):
        """Misma obra con o sin subtítulo (p. ej. "X" y "X: a conceptual analysis"), año ±1."""
        a = norm(t)
        for o in obras:
            b = norm(o["t"])
            if o["y"] and y and abs(o["y"] - y) <= 1 and min(len(a), len(b)) >= 30 and (a.startswith(b) or b.startswith(a)):
                return o
        return None

    solo_orcid = 0
    for w in orc:
        if not w["t"] or titulos_excl.search(w["t"]):
            continue
        previa = (por_doi.get(w["doi"]) if w["doi"] else None) or por_tit.get(clave_titulo(w["t"], w["y"]))
        if not previa and w["y"]:  # el año a veces difiere en 1 entre fuentes
            previa = por_tit.get(clave_titulo(w["t"], w["y"] - 1)) or por_tit.get(clave_titulo(w["t"], w["y"] + 1))
        if not previa:
            previa = mismo_titulo(w["t"], w["y"])
        if previa:
            if "orcid" not in previa["fuentes"]:
                previa["fuentes"].append("orcid")
            continue
        if w["ty"] in excluir_tipos or w["ty"] in ("other", "data-set", "lecture-speech"):
            continue
        o = {"id": w["doi"] or f"orcid:{w['put']}", "t": w["t"], "y": w["y"], "c": None, "v": w["v"], "vtipo": None,
             "ty": w["ty"] or "other", "doi": w["doi"], "au": [], "coau": [], "n": None, "temas": [],
             "oa": None, "arxiv_oa": None, "fuentes": ["orcid"]}
        obras.append(o)
        if w["doi"]:
            por_doi[w["doi"]] = o
        por_tit[clave_titulo(w["t"], w["y"])] = o
        solo_orcid += 1

    obras = [o for o in obras if o["id"] not in excluidas]
    obras.sort(key=lambda o: (-(o["y"] or 0), -(o["c"] or 0)))
    return obras, solo_orcid


def asignar_lineas(obras, lineas):
    reglas = [(k, re.compile(src, re.I if "i" in fl else 0)) for k, src, fl in lineas["reglas"]]
    conf = lineas.get("confirmadas", {})
    ocultas = set(lineas.get("ocultas", []))
    for o in obras:
        if o["id"] in conf:
            o["linea"], o["linea_estado"] = conf[o["id"]], "confirmada"
        else:
            texto = o["t"]
            k = next((k for k, r in reglas if r.search(texto)), None)
            if not k:  # segunda pasada con los temas de OpenAlex
                k = next((k for k, r in reglas if r.search(" ".join(o["temas"]))), None)
            o["linea"], o["linea_estado"] = k, "sugerida"
        o["oculta"] = o["id"] in ocultas


# ---------------------------------------------------------------- verificación
def verificar(obras, previas, rapido, estado):
    """Agrega los sellos: Crossref, DataCite, Semantic Scholar, zbMATH, arXiv, DBLP."""
    prev = {o["id"]: o.get("vf", {}) for o in previas}
    for o in obras:
        o["vf"] = {}

    def ok(fuente, n):
        estado[fuente] = {"estado": "ok", "fecha": HOY, "resultado": n}

    def falla(fuente, e):
        log(f"  ! {fuente}: {e}")
        estado[fuente] = {"estado": "error", "fecha": HOY, "resultado": str(e)[:160]}
        for o in obras:  # se conservan los sellos de la semana anterior
            if fuente in prev.get(o["id"], {}):
                o["vf"][fuente] = prev[o["id"]][fuente]

    con_doi = [o for o in obras if o["doi"]]

    # Crossref y DataCite (por DOI)
    try:
        n_cr = n_dc = 0
        for o in con_doi:
            r = pedir("https://api.crossref.org/works/" + urllib.parse.quote(o["doi"]))
            if r:
                m = r["message"]
                o["vf"]["crossref"] = {"venue": (m.get("container-title") or [None])[0]}
                n_cr += 1
                continue
            r = pedir("https://api.datacite.org/dois/" + urllib.parse.quote(o["doi"]))
            if r:
                a = r["data"]["attributes"]
                o["vf"]["datacite"] = {"pub": a.get("publisher") if isinstance(a.get("publisher"), str)
                                       else (a.get("publisher") or {}).get("name")}
                n_dc += 1
            time.sleep(0.05)
        ok("crossref", n_cr)
        ok("datacite", n_dc)
    except Exception as e:  # noqa: BLE001 - una fuente caída no detiene el resto
        falla("crossref", e)
        falla("datacite", e)

    # Semantic Scholar (por DOI en lote; por título si no hay DOI). Trae también los ID de arXiv y DBLP.
    try:
        n = 0
        campos = "title,venue,citationCount,externalIds"
        for i in range(0, len(con_doi), 100):
            lote = con_doi[i:i + 100]
            r = pedir("https://api.semanticscholar.org/graph/v1/paper/batch?fields=" + campos,
                      datos={"ids": ["DOI:" + o["doi"] for o in lote]})
            for o, p in zip(lote, r or []):
                if p:
                    o["s2"] = p
            time.sleep(1.2)
        for o in obras:
            if o["doi"]:
                continue
            r = pedir("https://api.semanticscholar.org/graph/v1/paper/search/match?fields=" + campos +
                      "&query=" + urllib.parse.quote(o["t"][:300]))
            time.sleep(1.2)
            p = (r or {}).get("data", [None])[0] if r else None
            if p and norm(p.get("title"))[:60] == norm(o["t"])[:60]:
                o["s2"] = p
        for o in obras:
            p = o.pop("s2", None)
            if not p:
                continue
            n += 1
            o["vf"]["s2"] = {"venue": p.get("venue") or "", "cites": p.get("citationCount")}
            ex = p.get("externalIds") or {}
            if ex.get("ArXiv"):
                o["vf"]["arxiv"] = {"id": ex["ArXiv"]}
            if ex.get("DBLP"):
                o["vf"]["dblp"] = {"id": ex["DBLP"]}
        ok("s2", n)
        ok("dblp", sum(1 for o in obras if "dblp" in o["vf"]))
    except Exception as e:  # noqa: BLE001
        falla("s2", e)
        falla("dblp", e)

    # zbMATH Open (por DOI)
    try:
        n = 0
        for o in con_doi:
            r = pedir("https://api.zbmath.org/v1/document/_structured_search?page=0&results_per_page=1&DOI=" +
                      urllib.parse.quote(o["doi"]))
            res = (r or {}).get("result") or []
            if res:
                o["vf"]["zbmath"] = {"id": res[0].get("identifier") or str(res[0].get("id"))}
                n += 1
            time.sleep(0.2)
        ok("zbmath", n)
    except Exception as e:  # noqa: BLE001
        falla("zbmath", e)

    # arXiv: primero lo que ya informaron OpenAlex y Semantic Scholar; luego búsqueda por título
    try:
        for o in obras:
            if "arxiv" not in o["vf"] and o.get("arxiv_oa"):
                o["vf"]["arxiv"] = {"id": o["arxiv_oa"]}
        if not rapido:
            ns = {"a": "http://www.w3.org/2005/Atom"}
            for o in obras:
                if "arxiv" in o["vf"]:
                    continue
                titulo = re.sub(r"[^\w\s]", " ", o["t"])[:200]
                q = urllib.parse.quote(f'ti:"{titulo}"')
                xml = pedir(f"https://export.arxiv.org/api/query?search_query={q}&max_results=3", json_=False,
                            cabeceras={"Accept": "application/atom+xml"})
                time.sleep(3.1)  # límite pedido por arXiv
                for e in ET.fromstring(xml).findall("a:entry", ns):
                    t = e.findtext("a:title", "", ns)
                    if norm(t) == norm(o["t"]):
                        o["vf"]["arxiv"] = {"id": e.findtext("a:id", "", ns).rsplit("/abs/", 1)[-1]}
                        break
        elif prev:
            for o in obras:  # en modo rápido se reutiliza lo encontrado antes
                if "arxiv" not in o["vf"] and "arxiv" in prev.get(o["id"], {}):
                    o["vf"]["arxiv"] = prev[o["id"]]["arxiv"]
        ok("arxiv", sum(1 for o in obras if "arxiv" in o["vf"]))
    except Exception as e:  # noqa: BLE001
        falla("arxiv", e)

    for o in obras:
        o.pop("arxiv_oa", None)


# ---------------------------------------------------------------- perfil
def armar_perfil(autor, obras, corr, orcid_info):
    unir_ = corr.get("afiliaciones_unir", {})
    excl = set(corr.get("afiliaciones_excluir", []))
    nombres = corr.get("afiliaciones_nombres", {})
    afs = {}
    for a in autor.get("affiliations", []):
        iid = a["institution"]["id"].rsplit("/", 1)[-1]
        iid = unir_.get(iid, iid)
        if iid in excl:
            continue
        afs.setdefault(iid, set()).update(a.get("years", []))
    geo = openalex_instituciones(afs.keys()) if afs else {}
    afiliaciones = []
    for iid, anios in afs.items():
        g = geo.get(iid, {})
        afiliaciones.append({
            "id": iid, "n": nombres.get(iid, g.get("nombre", iid)), "ciudad": g.get("ciudad"), "pais": g.get("pais"),
            "ll": g.get("ll"), "ror": g.get("ror"), "anios": sorted(anios), "k": "aff"})
    afiliaciones.sort(key=lambda a: -max(a["anios"]))

    visibles = [o for o in obras if not o["oculta"]]
    por_anio = {}
    for o in visibles:
        if o["y"]:
            por_anio[o["y"]] = por_anio.get(o["y"], 0) + 1
    coaut = {}
    for o in visibles:
        for n in o["coau"]:
            coaut[n] = coaut.get(n, 0) + 1
    st = autor.get("summary_stats", {})
    return {
        "generado": HOY,
        "stats": {"works": len(visibles), "cites": autor.get("cited_by_count"),
                  "h": st.get("h_index"), "i10": st.get("i10_index"),
                  "works_openalex": autor.get("works_count")},
        "por_anio": sorted(([y, n] for y, n in por_anio.items())),
        "coautores": sorted(coaut.items(), key=lambda x: -x[1])[:10],
        "afiliaciones": afiliaciones,
        "orcid": orcid_info,
    }


# ---------------------------------------------------------------- paquete para la página
def armar_paquete():
    contenido = {}
    for f in sorted(os.listdir(CONTENIDO)):
        if f.endswith(".json"):
            contenido[f[:-5]] = leer_json(os.path.join(CONTENIDO, f))
    datos = {k: leer_json(os.path.join(DATOS, k + ".json")) for k in ("publicaciones", "perfil", "fuentes")}
    if not all(datos.values()):
        sys.exit("Faltan archivos en datos/. Ejecuta primero sin --sin-red.")
    paquete = {"contenido": contenido, "datos": datos}
    with open(os.path.join(DATOS, "sitio.js"), "w", encoding="utf-8") as f:
        f.write("// Generado por scripts/actualizar.py. No editar a mano.\n")
        f.write("window.SITIO = ")
        json.dump(paquete, f, ensure_ascii=False, separators=(",", ":"))
        f.write(";\n")
    log("datos/sitio.js listo")


# ---------------------------------------------------------------- principal
def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--rapido", action="store_true", help="omite la búsqueda de arXiv por título")
    ap.add_argument("--sin-red", action="store_true", help="solo vuelve a armar datos/sitio.js")
    a = ap.parse_args()
    os.makedirs(DATOS, exist_ok=True)
    if a.sin_red:
        armar_paquete()
        return

    corr = leer_json(os.path.join(CONTENIDO, "correcciones.json"), {})
    lineas = leer_json(os.path.join(CONTENIDO, "lineas.json"), {"reglas": []})
    previas = (leer_json(os.path.join(DATOS, "publicaciones.json"), {}) or {}).get("obras", [])
    estado = (leer_json(os.path.join(DATOS, "fuentes.json"), {}) or {}).get("estado", {})

    log("ORCID…")
    orc = orcid_obras()
    orcid_info = orcid_secciones()
    estado["orcid"] = {"estado": "ok", "fecha": HOY, "resultado": len(orc)}
    log(f"  {len(orc)} obras; secciones: " +
        ", ".join(f"{k}={v}" for k, v in orcid_info.items() if not k.endswith("_detalle")))

    log("OpenAlex…")
    autor = openalex_autor()
    oa = openalex_obras()
    estado["openalex"] = {"estado": "ok", "fecha": HOY, "resultado": len(oa),
                          "cites": autor.get("cited_by_count"), "h": autor["summary_stats"].get("h_index")}
    log(f"  {len(oa)} obras, {autor.get('cited_by_count')} citas")

    obras, solo_orcid = unir(oa, orc, corr, OPENALEX_AUTHOR)
    log(f"Unificadas: {len(obras)} ({solo_orcid} solo en ORCID)")
    asignar_lineas(obras, lineas)

    log("Verificación (Crossref, DataCite, Semantic Scholar, zbMATH, arXiv)…")
    verificar(obras, previas, a.rapido, estado)

    perfil = armar_perfil(autor, obras, corr, orcid_info)
    for o in obras:
        o.pop("coau", None)
    escribir_json(os.path.join(DATOS, "publicaciones.json"), {"generado": HOY, "obras": obras})
    escribir_json(os.path.join(DATOS, "perfil.json"), perfil)
    escribir_json(os.path.join(DATOS, "fuentes.json"), {"generado": HOY, "estado": estado})
    cobertura = {k: sum(1 for o in obras if k in o["vf"]) for k in ("crossref", "datacite", "s2", "zbmath", "arxiv", "dblp")}
    log("Sellos: " + ", ".join(f"{k} {v}" for k, v in cobertura.items()))
    armar_paquete()


if __name__ == "__main__":
    main()
