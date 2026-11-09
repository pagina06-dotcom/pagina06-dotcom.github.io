# Sitio de Tomás Veloz — prototipo

Plantillas del sitio según el handoff de Claude Design (dirección «Grilla»), con datos reales obtenidos de las APIs.

| Archivo | Qué es |
|---|---|
| `index.html` | Sitio público (vista visitante): 9 pantallas, ES/EN, claro/oscuro, escritorio y móvil |
| `admin.html` | Plantillas **estáticas** de administración: edición sobre el sitio y «Mi panel». Muestran qué se puede editar; los botones no guardan nada |
| `scripts/actualizar.py` | Recolector de datos (solo biblioteca estándar de Python) |
| `contenido/*.json` | Lo que se carga por formulario: textos, perfiles, charlas, proyectos, escritos, correcciones |
| `datos/*.json` | Lo que genera el recolector. No se edita a mano |
| `datos/sitio.js` | Paquete que lee la página (contenido + datos) |
| `.github/workflows/actualizar.yml` | Ejecución semanal en GitHub Actions |

## Abrir

Doble clic en `index.html` (funciona sin servidor). Para la vista de Tomás, `admin.html`, o el enlace «Vista Tomás (plantilla)» en el pie.

Rutas útiles: `#home/line-cot`, `#area-cooperation/sust`, `#area-free`, `#publications`, `#journey`, `#sources`; en `admin.html` también `#panel`, `#panel/pubs`, `#panel/profiles`, `#panel/content`, `#panel/sources`.

## Actualizar datos

```
python scripts/actualizar.py            # todo (unos 5 min; arXiv pide 3 s entre consultas)
python scripts/actualizar.py --rapido   # sin buscar arXiv por título
python scripts/actualizar.py --sin-red  # solo rearma datos/sitio.js después de editar contenido/
```

Fuentes que consulta: ORCID y OpenAlex (base de la lista), Crossref, DataCite, Semantic Scholar, zbMATH Open y arXiv (sellos de verificación). DBLP se lee desde Semantic Scholar. Las ubicaciones del mapa vienen de las instituciones de OpenAlex.

Si una fuente falla, se conservan sus sellos anteriores y la página de Fuentes lo indica. Si ORCID u OpenAlex fallan, no se sobrescribe nada.

## Corregir sin inventar

`contenido/correcciones.json` permite excluir obras o tipos, unir instituciones duplicadas (p. ej. UTEM aparece dos veces en OpenAlex) y renombrarlas. `contenido/lineas.json` guarda las reglas de línea, las líneas confirmadas por Tomás y las obras ocultas.
