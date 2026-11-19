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
python scripts/actualizar.py            # todo (unos 4 min; arXiv pide 3 s entre consultas)
python scripts/actualizar.py --rapido   # sin buscar arXiv por título
python scripts/actualizar.py --sin-red  # solo rearma datos/sitio.js después de editar contenido/
```

Fuentes que consulta: ORCID y OpenAlex (base de la lista), Crossref, DataCite, Semantic Scholar, zbMATH Open y arXiv (sellos de verificación). DBLP se lee desde Semantic Scholar. Las ubicaciones del mapa vienen de las instituciones de OpenAlex.

**Búsquedas lentas.** zbMATH tarda unos 7 s por DOI y arXiv pide 3 s entre consultas por título. `datos/busquedas.json` recuerda la última búsqueda de cada obra en esas dos fuentes, así que cada semana solo se buscan las obras nuevas y, por turno, las 8 revisadas hace más tiempo (al menos 4 semanas). Si se borra ese archivo, la siguiente ejecución vuelve a buscarlas todas (unos 15 minutos).

Si una fuente falla, se conservan sus sellos anteriores y la página de Fuentes lo indica. Si ORCID u OpenAlex fallan, no se sobrescribe nada.

**Clave de OpenAlex.** Desde noviembre de 2026 OpenAlex cobra cada consulta contra un presupuesto diario. Sin clave, ese presupuesto es pequeño (US$ 0,10) y lo comparten todos los que salen por la misma IP, como pasa en GitHub Actions. Con una clave gratuita (https://openalex.org/settings/api) el presupuesto es de US$ 1 al día, de sobra para una ejecución semanal. La clave se lee de la variable de entorno `OPENALEX_API_KEY`; en GitHub va como secreto del repositorio con ese mismo nombre.

**Obras que solo están en ORCID.** A veces OpenAlex fusiona registros duplicados y la versión que queda trae «Tomas Veloz» escrito pero sin vincular a su perfil, así que la obra deja de salir entre las suyas. Por eso el recolector busca en OpenAlex, por DOI o por título, cada obra que solo trajo ORCID, y la acepta solo si Tomás figura entre los autores. Si ya estaba en la lista, une el duplicado; si no, le agrega las citas y la marca como `"recuperada"`. Las citas del perfil (`stats.cites`, h, i10) siguen siendo las de OpenAlex, sin sumar nada; las recuperadas se informan aparte en `stats.cites_recuperadas`. Si el recolector avisa que una obra de ORCID está en OpenAlex pero Tomás no figura como autor, hay que revisarla y, si no es suya, agregarla a `obras_excluidas`.

## Corregir sin inventar

`contenido/correcciones.json` permite excluir obras o tipos, unir instituciones duplicadas (p. ej. UTEM aparece dos veces en OpenAlex) y renombrarlas. `contenido/lineas.json` guarda las reglas de línea, las líneas confirmadas por Tomás y las obras ocultas.

## Cómo contribuir

El proyecto usa **GitHub Flow**. El detalle y el porqué están en [docs/tecnico/decisiones/0001-flujo-de-trabajo-git.md](docs/tecnico/decisiones/0001-flujo-de-trabajo-git.md).

- `main` siempre funciona: GitHub Pages la publica. No se trabaja directamente sobre ella.
- Una rama corta por tarea de la carta Gantt, con su número: `feat/2.2-recuperar-citas`, `docs/6.1-documento-tecnico`, `fix/...`.
- Al terminar: probar en local → pull request a `main` → merge → borrar la rama. Antes, `git pull`, porque el proceso semanal también escribe en `main`.
- Mensajes con *Conventional Commits* en español: `feat:`, `fix:`, `docs:`, `refactor:`, `chore:`, y `datos:` para los datos regenerados (siempre en un commit aparte).
- Nunca subir claves ni archivos `.env`.
- Cada hito se marca con una etiqueta: `v0.1-H1`, `v0.2-H2` y `v1.0-H3`.
