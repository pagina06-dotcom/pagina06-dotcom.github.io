# 0003 · Recolector en Python solo con la biblioteca estándar

- **Estado:** aceptada
- **Fecha:** 2026-10-29 (registrada el 2026-11-17)

## Contexto

El recolector (`scripts/actualizar.py`) corre cada semana en GitHub Actions sin que nadie lo mire. Cada dependencia externa es algo que puede romperse con una actualización o quedar abandonada, y fue justamente lo que hizo fallar el sitio anterior (scrapers de Google Scholar).

## Decisión

- Un solo script en **Python 3.10+**, usando **solo la biblioteca estándar**: `urllib` para las API, `json`, `xml.etree` para arXiv, `unicodedata` para comparar nombres sin tildes.
- No hay `requirements.txt` ni entorno virtual: en Actions basta `actions/setup-python`.
- Tres modos: completo (unos 4 minutos: zbMATH y arXiv son lentos, por eso `datos/busquedas.json` recuerda sus búsquedas y no se repiten cada semana), `--rapido` (sin buscar arXiv por título) y `--sin-red` (solo rearma `datos/sitio.js` después de editar `contenido/`).
- Las consultas se reintentan ante errores 429 y 5xx, con espera creciente.
