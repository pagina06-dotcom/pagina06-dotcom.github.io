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
  python scripts/actualizar.py --solo-s2  solo reintenta Semantic Scholar (lo usa el flujo si pidió esperar)

Reglas: no se inventa nada. Si una fuente falla se conservan sus datos de la semana anterior;
si fallan ORCID u OpenAlex (la base de la lista) no se sobrescribe nada.
Las obras que solo trae ORCID se buscan en OpenAlex por DOI o título para recuperar sus citas.
Variables de entorno opcionales: OPENALEX_API_KEY (recomendada) y CONTACTO_API.
Solo usa la biblioteca estándar de Python 3.10+.
"""
import argparse
import datetime as dt
import difflib
import json
import os
import re
import sys
import time
import unicodedata
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
# Clave de OpenAlex (secreto de GitHub). Sin clave, OpenAlex da un presupuesto diario pequeño
# compartido por todos los que salen por la misma IP, y en GitHub Actions las IP son compartidas.
OPENALEX_KEY = os.environ.get("OPENALEX_API_KEY", "").strip()
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


def sin_tildes(s):
    return unicodedata.normalize("NFKD", s or "").encode("ascii", "ignore").decode().lower()


def oa_url(url):
    """Agrega la clave de OpenAlex a la consulta, si hay una configurada."""
    if OPENALEX_KEY:
        url += ("&" if "?" in url else "?") + "api_key=" + urllib.parse.quote(OPENALEX_KEY)
    return url


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
        parte = {e.get("external-id-type"): e.get("external-id-value")
                 for e in (s.get("external-ids") or {}).get("external-id", [])
                 if e.get("external-id-relationship") == "part-of"}
        fecha = s.get("publication-date") or {}
        anio = (fecha.get("year") or {}).get("value")
        obras.append({
            "t": ((s.get("title") or {}).get("title") or {}).get("value"),
            "y": int(anio) if anio else None,
            "doi": doi,
            "ty": (s.get("type") or "").replace("journal-article", "article").replace("conference-paper", "conference-paper"),
            "v": (s.get("journal-title") or {}).get("value") if s.get("journal-title") else None,
            "put": s.get("put-code"),
            "issn": parte.get("issn"),  # de la revista o el libro que contiene la obra, si ORCID lo trae
            "isbn": parte.get("isbn"),
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
    return pedir(oa_url(f"https://api.openalex.org/authors/{OPENALEX_AUTHOR}"))


def openalex_obras():
    obras, cursor = [], "*"
    while cursor:
        url = ("https://api.openalex.org/works?filter=author.id:" + OPENALEX_AUTHOR +
               "&per_page=200&cursor=" + urllib.parse.quote(cursor))
        d = pedir(oa_url(url))
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
        d = pedir(oa_url(f"https://api.openalex.org/institutions?filter=openalex_id:{lote}&per_page=50"))
        for r in d["results"]:
            g = r.get("geo") or {}
            out[r["id"].rsplit("/", 1)[-1]] = {
                "nombre": r["display_name"], "ciudad": g.get("city"), "pais": g.get("country"),
                "ll": [g.get("latitude"), g.get("longitude")] if g.get("latitude") is not None else None,
                "ror": r.get("ror")}
    return out


# ---------------------------------------------------------------- unificación
def es_tomas(autoria, autor_id):
    """¿Esta autoría de OpenAlex es Tomás? Por su ID o, si OpenAlex no la vinculó, por el nombre escrito."""
    if (autoria["author"].get("id") or "").endswith(autor_id):
        return True
    for nombre in (autoria.get("raw_author_name"), autoria["author"].get("display_name")):
        partes = re.findall(r"[a-z]+", sin_tildes(nombre))
        if "veloz" in partes and ("tomas" in partes or "t" in partes):
            return True
    return False


def ficha_openalex(w, autor_id):
    """Convierte una obra de OpenAlex al formato de datos/publicaciones.json."""
    doi = doi_limpio(w.get("doi"))
    src = (w.get("primary_location") or {}).get("source") or {}
    autorias = w.get("authorships", [])
    arxiv = None
    for loc in w.get("locations", []):
        u = (loc.get("landing_page_url") or "") + " " + (loc.get("pdf_url") or "")
        m = re.search(r"arxiv\.org/(?:abs|pdf)/([0-9]{4}\.[0-9]{4,5}|[a-z\-]+/[0-9]{7})", u)
        if m:
            arxiv = m.group(1)
            break
    if not arxiv and doi and doi.startswith("10.48550/arxiv."):
        arxiv = doi.split("arxiv.", 1)[1]
    return {
        "id": doi or "oa:" + w["id"].rsplit("/", 1)[-1],
        "t": w["title"], "y": w.get("publication_year"), "c": w.get("cited_by_count", 0),
        "v": src.get("display_name"), "vtipo": src.get("type"), "ty": w.get("type"),
        "doi": doi, "au": [a["author"]["display_name"] for a in autorias],
        "coau": [a["author"]["display_name"] for a in autorias if not es_tomas(a, autor_id)],
        "n": len(autorias),
        "temas": [t["display_name"] for t in (w.get("topics") or [])[:3]],
        "oa": w["id"].rsplit("/", 1)[-1], "arxiv_oa": arxiv,
        "fuentes": ["openalex"],
    }


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
        o = ficha_openalex(w, autor_id)
        doi = o["doi"]
        k = clave_titulo(o["t"], o["y"])
        previa = (por_doi.get(doi) if doi else None) or por_tit.get(k)
        if previa:  # duplicado dentro de OpenAlex: se queda la versión con DOI de editorial y más citas
            previa["c"] = max(previa["c"], o["c"])
            if not previa["doi"] and o["doi"]:
                previa.update(id=o["id"], doi=o["doi"], v=o["v"], vtipo=o["vtipo"])
            previa["arxiv_oa"] = previa["arxiv_oa"] or o["arxiv_oa"]
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


# ---------------------------------------------------------------- recuperación de citas
CAMPOS_OA = "id,doi,title,publication_year,cited_by_count,type,authorships,primary_location,locations,topics"


def titulo_coincide(t, y, w):
    """Mismo título que la obra de ORCID. Si es idéntico y largo, vale aunque el año difiera
    (ORCID a veces trae el año en que se importó la obra); si uno es prefijo del otro, año ±1."""
    a, b, yy = norm(t), norm(w.get("title")), w.get("publication_year")
    if not a or not b:
        return False
    if a == b:
        return len(a) >= 30 or not (y and yy) or abs(y - yy) <= 1
    return bool(y and yy and abs(y - yy) <= 1 and min(len(a), len(b)) >= 30 and (a.startswith(b) or b.startswith(a)))


def buscar_en_openalex(o):
    """Candidatos de OpenAlex para una obra de ORCID: por DOI y, si no tiene o no aparece, por título."""
    if o["doi"]:
        w = pedir(oa_url(f"https://api.openalex.org/works/doi:{urllib.parse.quote(o['doi'])}?select={CAMPOS_OA}"))
        if w:
            return [w], "doi"
    titulo = " ".join(re.sub(r"[^\w\s]", " ", o["t"]).split())[:200]
    r = pedir(oa_url("https://api.openalex.org/works?per_page=5&select=" + CAMPOS_OA +
                     "&filter=title.search:" + urllib.parse.quote(titulo)))
    return (r or {}).get("results", []), "titulo"


def recuperar_citas(obras, previas, autor_id, estado):
    """Busca en OpenAlex las obras que solo trajo ORCID (tarea 2.2).

    OpenAlex a veces fusiona registros y la versión que sobrevive queda con "Tomas Veloz" escrito
    pero sin vincular a su perfil: la obra existe, con sus citas, pero no sale en author.id.
    Solo se acepta una obra si el título (o el DOI) coincide Y Tomás figura entre los autores.
    - Si la obra encontrada ya está en la lista, la de ORCID era un duplicado: se unen.
    - Si no, se completa con citas, autores y temas de OpenAlex y se marca "recuperada".
    Si OpenAlex falla, se conservan las citas recuperadas la semana anterior.
    """
    solo = [o for o in obras if o["fuentes"] == ["orcid"]]
    en_lista = {o["oa"]: o for o in obras if o.get("oa")}
    prev = {o["id"]: o for o in previas}
    recuperadas, duplicadas, sin_autoria, pendientes = [], [], [], list(solo)
    try:
        for o in solo:
            candidatos, via = buscar_en_openalex(o)
            time.sleep(0.2)
            pendientes.remove(o)
            coinciden = [w for w in candidatos if via == "doi" or titulo_coincide(o["t"], o["y"], w)]
            w = next((w for w in coinciden if any(es_tomas(a, autor_id) for a in w.get("authorships", []))), None)
            if not w:
                if coinciden:  # la obra existe en OpenAlex, pero Tomás no figura entre sus autores
                    sin_autoria.append(o["id"])
                continue
            wid = w["id"].rsplit("/", 1)[-1]
            if wid in en_lista:
                destino = en_lista[wid]
                if "orcid" not in destino["fuentes"]:
                    destino["fuentes"].append("orcid")
                duplicadas.append(o)
                continue
            f = ficha_openalex(w, autor_id)
            for k in ("c", "au", "coau", "n", "temas", "oa", "arxiv_oa", "vtipo"):
                o[k] = f[k]
            o["v"] = o["v"] or f["v"]
            o["doi"] = o["doi"] or f["doi"]
            o["fuentes"].append("openalex")
            o["recuperada"] = via
            en_lista[wid] = o
            recuperadas.append(o)
        estado["recuperacion"] = {"estado": "ok", "fecha": HOY, "resultado": len(recuperadas),
                                  "citas": sum(o["c"] or 0 for o in recuperadas),
                                  "duplicadas": len(duplicadas), "sin_autoria": sin_autoria}
    except Exception as e:  # noqa: BLE001 - si falla, se conserva lo de la semana anterior
        log(f"  ! recuperación de citas: {e}")
        estado["recuperacion"] = {"estado": "error", "fecha": HOY, "resultado": str(e)[:160]}
        for o in pendientes:
            p = prev.get(o["id"])
            if p and p.get("recuperada"):
                for k in ("c", "n", "oa", "v", "vtipo", "doi", "recuperada"):
                    o[k] = p.get(k)
                o["au"], o["temas"], o["fuentes"] = list(p["au"]), list(p["temas"]), list(p["fuentes"])
                recuperadas.append(o)
    quitar = {id(o) for o in duplicadas}
    obras[:] = [o for o in obras if id(o) not in quitar]
    return recuperadas, duplicadas, sin_autoria


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
def estado_falla(e, reintento=False):
    """Estado de una fuente que falló. Un 429 ("demasiadas consultas") no es una falla de la fuente:
    queda como "espera", y "reintento" dice si el flujo semanal la vuelve a consultar en unos minutos."""
    if isinstance(e, urllib.error.HTTPError) and e.code == 429:
        return {"estado": "espera", "fecha": HOY, "resultado": "HTTP 429: demasiadas consultas", "reintento": reintento}
    return {"estado": "error", "fecha": HOY, "resultado": str(e)[:160]}


def sellos_s2(obras, intentos=4):
    """Sellos de Semantic Scholar (y los ID de arXiv y DBLP que trae).

    La consulta por DOI va en lote y, si falla, lanza la excepción. La búsqueda por título es una
    consulta por obra y es la que más choca con el límite de Semantic Scholar sin clave (429): si una
    pide esperar, solo esa obra queda sin revisar. Devuelve (sellos, obras sin revisar), y quien llama
    les devuelve el sello de la semana anterior.
    """
    n, sin_revisar = 0, []
    campos = "title,venue,citationCount,externalIds"
    con_doi = [o for o in obras if o["doi"]]
    for i in range(0, len(con_doi), 100):
        lote = con_doi[i:i + 100]
        r = pedir("https://api.semanticscholar.org/graph/v1/paper/batch?fields=" + campos,
                  datos={"ids": ["DOI:" + o["doi"] for o in lote]}, intentos=intentos)
        for o, p in zip(lote, r or []):
            if p:
                o["s2"] = p
        time.sleep(1.2)
    for o in obras:
        if o["doi"]:
            continue
        try:
            r = pedir("https://api.semanticscholar.org/graph/v1/paper/search/match?fields=" + campos +
                      "&query=" + urllib.parse.quote(o["t"][:300]), intentos=max(2, intentos - 2))
        except urllib.error.HTTPError as e:
            if e.code != 429:
                raise
            sin_revisar.append(o)
            time.sleep(5)
            continue
        time.sleep(3)  # sin clave, Semantic Scholar comparte un cupo pequeño entre todos
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
            o["vf"].setdefault("arxiv", {"id": ex["ArXiv"]})
        if ex.get("DBLP"):
            o["vf"]["dblp"] = {"id": ex["DBLP"]}
    return n, sin_revisar


def estado_s2(estado, obras, sin_revisar):
    """Marca Semantic Scholar y DBLP como activas, contando las obras que quedaron sin revisar."""
    for k in ("s2", "dblp"):
        estado[k] = {"estado": "ok", "fecha": HOY, "resultado": sum(1 for o in obras if k in o["vf"])}
        if sin_revisar:
            estado[k]["sin_revisar"] = len(sin_revisar)


def solo_s2():
    """Reintento de Semantic Scholar (y DBLP, que viene con él) sobre los datos ya publicados.

    El flujo semanal lo corre 10 minutos después si Semantic Scholar pidió esperar (429).
    Reintenta con más paciencia; si vuelve a fallar, se conservan los sellos anteriores y el
    panel avisa que se intentará de nuevo en la próxima actualización semanal.
    """
    ruta_p, ruta_f = os.path.join(DATOS, "publicaciones.json"), os.path.join(DATOS, "fuentes.json")
    pub, fu = leer_json(ruta_p), leer_json(ruta_f)
    obras, estado = pub["obras"], fu["estado"]
    antes = {id(o): {k: o["vf"][k] for k in ("s2", "dblp") if k in o["vf"]} for o in obras}
    for o in obras:
        o["vf"].pop("s2", None)
        o["vf"].pop("dblp", None)
    try:
        _, sin_revisar = sellos_s2(obras, intentos=6)
        for o in sin_revisar:
            o["vf"].update(antes[id(o)])
        estado_s2(estado, obras, sin_revisar)
        log(f"Semantic Scholar: {estado['s2']['resultado']} sellos, {len(sin_revisar)} obras sin revisar")
    except Exception as e:  # noqa: BLE001
        log(f"  ! s2 (reintento): {e}")
        for o in obras:
            o.pop("s2", None)
            o["vf"].update(antes[id(o)])
        estado["s2"] = estado_falla(e)
        estado["dblp"] = estado_falla(e)
    escribir_json(ruta_p, pub)
    escribir_json(ruta_f, fu)
    armar_paquete()


def verificar(obras, previas, rapido, estado):
    """Agrega los sellos: Crossref, DataCite, Semantic Scholar, zbMATH, arXiv, DBLP."""
    prev = {o["id"]: o.get("vf", {}) for o in previas}
    for o in obras:
        o["vf"] = {}

    def ok(fuente, n):
        estado[fuente] = {"estado": "ok", "fecha": HOY, "resultado": n}

    def falla(fuente, e, reintento=False):
        log(f"  ! {fuente}: {e}")
        estado[fuente] = estado_falla(e, reintento)
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
        _, sin_revisar = sellos_s2(obras)
        for o in sin_revisar:  # conservan el sello de la semana anterior
            for k in ("s2", "dblp"):
                if k in prev.get(o["id"], {}):
                    o["vf"][k] = prev[o["id"]][k]
        estado_s2(estado, obras, sin_revisar)
    except Exception as e:  # noqa: BLE001
        for o in obras:  # respuestas a medio procesar: no deben quedar en los datos publicados
            o.pop("s2", None)
        falla("s2", e, reintento=True)  # si pidió esperar, el flujo semanal lo reintenta (--solo-s2)
        falla("dblp", e, reintento=True)

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


# ---------------------------------------------------------------- obras sin DOI
CROSSREF = "https://api.crossref.org/"


def parecido(a, b):
    return difflib.SequenceMatcher(None, norm(sin_tildes(a)), norm(sin_tildes(b))).ratio()


def resumen_revista(j):
    """Lo que responde Crossref sobre una revista, en pocas palabras, para mostrarlo junto a «Comprobar»."""
    anios = [a for a, n in (j.get("breakdowns") or {}).get("dois-by-issued-year") or [] if n]
    return {"t": j.get("title"), "ed": j.get("publisher"), "issn": j.get("ISSN") or [],
            "dois": (j.get("counts") or {}).get("total-dois"), "desde": min(anios) if anios else None}


def revisar_una_sin_doi(o, w):
    """Busca en Crossref si la obra tiene DOI o si su revista o libro usa DOI. Ver revisar_sin_doi."""
    # 1. La obra misma: título casi igual (tolera ligaduras perdidas como "Identi cation"),
    #    año ±1 y Tomás entre los autores.
    titulo = " ".join(re.sub(r"[^\w\s]", " ", o["t"]).split())[:300]
    r = pedir(CROSSREF + "works?rows=5&select=DOI,title,container-title,issued,author&query.bibliographic=" +
              urllib.parse.quote(titulo))
    for it in ((r or {}).get("message") or {}).get("items", []):
        y = (((it.get("issued") or {}).get("date-parts") or [[None]])[0] or [None])[0]
        autores = {sin_tildes(a.get("family")) for a in it.get("author") or []}
        if (parecido(o["t"], (it.get("title") or [""])[0]) >= 0.93 and "veloz" in autores
                and (not o["y"] or not y or abs(o["y"] - y) <= 1)):
            return {"estado": "crossref_tiene", "doi": doi_limpio(it["DOI"]),
                    "en": (it.get("container-title") or [None])[0], "fecha": HOY,
                    "comprobar": "https://doi.org/" + it["DOI"],
                    "cr": {"t": (it.get("title") or [None])[0], "en": (it.get("container-title") or [None])[0], "y": y}}
    # 2. El libro (por ISBN) o la revista (por ISSN o, si ORCID no lo trae, por nombre exacto).
    if w.get("isbn"):
        url = CROSSREF + "works?rows=1&select=container-title,publisher&filter=isbn:" + urllib.parse.quote(w["isbn"])
        m = (pedir(url) or {}).get("message") or {}
        n, it = m.get("total-results", 0), (m.get("items") or [{}])[0]
        return {"estado": "fuente_con_doi" if n else "fuente_sin_doi", "tipo": "libro",
                "id": "ISBN " + w["isbn"], "fecha": HOY, "comprobar": url,
                "cr": {"t": (it.get("container-title") or [None])[0], "ed": it.get("publisher"), "dois": n} if n else None}
    if o["ty"] == "article" and o["v"] and not re.search(r"arxiv", o["v"], re.I):
        if w.get("issn"):
            issn = re.sub(r"[^0-9Xx]", "", w["issn"]).upper()
            issn = issn[:4] + "-" + issn[4:]
            url = CROSSREF + "journals/" + issn
            j = ((pedir(url) or {}).get("message")) or None
            ident = "ISSN " + issn
        else:
            nombre = re.sub(r"\s+[-–]\s+[A-Z]{2,10}$", "", o["v"]).strip()  # quita siglas finales: "… - MMSB"
            url = CROSSREF + "journals?rows=20&query=" + urllib.parse.quote(nombre)
            items = ((pedir(url) or {}).get("message") or {}).get("items", [])
            j = next((i for i in items if norm(sin_tildes(i.get("title"))) == norm(sin_tildes(nombre))), None)
            ident = None
        return {"estado": "fuente_con_doi" if j else "fuente_sin_doi", "tipo": "revista",
                "id": ident, "fecha": HOY, "comprobar": url, "cr": resumen_revista(j) if j else None}
    return {"estado": "sin_resultado", "fecha": HOY}


def revisar_sin_doi(obras, orc, previas):
    """Revisa en Crossref las obras que solo trae ORCID y no tienen DOI (ADR 0011).

    Crossref es donde las revistas y editoriales inscriben los DOI de lo que publican. Deja en
    o["sin_doi"] lo encontrado, con la fecha, la consulta exacta ("comprobar") y un resumen de la
    respuesta ("cr": título, editorial, ISSN, cuántos DOI) para que Mi panel la muestre y cualquiera
    pueda repetirla. No cambia ningún dato que se muestre en el sitio.
      crossref_tiene  Crossref tiene la obra con DOI: falta agregarlo en ORCID (sigue pendiente)
      fuente_sin_doi  la revista o el libro no está en Crossref: la obra no tiene DOI (no es pendiente)
      fuente_con_doi  la revista o el libro sí está en Crossref, pero esta obra no apareció (pendiente)
      sin_resultado   preprints y otros tipos: no se pudo decidir (pendiente)
    Si Crossref falla con una obra, se conserva lo revisado la semana anterior.
    """
    por_id = {f"orcid:{w['put']}": w for w in orc}
    prev = {o["id"]: o.get("sin_doi") for o in previas}
    n = 0
    for o in obras:
        if o["fuentes"] != ["orcid"] or o["doi"]:
            continue
        try:
            o["sin_doi"] = revisar_una_sin_doi(o, por_id.get(o["id"], {}))
            n += 1
        except Exception as e:  # noqa: BLE001
            log(f"  ! Crossref, obra sin DOI {o['id']}: {e}")
            if prev.get(o["id"]):
                o["sin_doi"] = prev[o["id"]]
        time.sleep(0.1)
    return n


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
        # cites, h e i10 son las del perfil de OpenAlex, sin tocar. cites_recuperadas son las de obras que
        # OpenAlex tiene pero no vinculó al perfil (ver recuperar_citas); no se suman para no inventar cifras.
        "stats": {"works": len(visibles), "cites": autor.get("cited_by_count"),
                  "h": st.get("h_index"), "i10": st.get("i10_index"),
                  "works_openalex": autor.get("works_count"),
                  "cites_recuperadas": sum(o["c"] or 0 for o in visibles if o.get("recuperada"))},
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
    ap.add_argument("--solo-s2", action="store_true", help="solo reintenta Semantic Scholar sobre los datos publicados")
    a = ap.parse_args()
    os.makedirs(DATOS, exist_ok=True)
    if a.sin_red:
        armar_paquete()
        return
    if a.solo_s2:
        solo_s2()
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

    log("Recuperación de citas de obras que solo están en ORCID…")
    rec, dup, sin_aut = recuperar_citas(obras, previas, OPENALEX_AUTHOR, estado)
    log(f"  {len(rec)} recuperadas ({sum(o['c'] or 0 for o in rec)} citas), {len(dup)} duplicadas unidas")
    for i in sin_aut:
        log(f"  ? {i}: está en OpenAlex pero Tomás no figura como autor. Revisar y, si no es suya, "
            "agregarla a obras_excluidas en contenido/correcciones.json")
    asignar_lineas(obras, lineas)

    log("Verificación (Crossref, DataCite, Semantic Scholar, zbMATH, arXiv)…")
    verificar(obras, previas, a.rapido, estado)

    log("Obras solo en ORCID sin DOI: revisión en Crossref…")
    log(f"  {revisar_sin_doi(obras, orc, previas)} revisadas")

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
