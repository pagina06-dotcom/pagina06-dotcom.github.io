# 0004 · ORCID y OpenAlex como fuentes base; las demás, como sellos de verificación

- **Estado:** aceptada
- **Fecha:** 2026-11-02 (descartes del 2026-11-09; registrada el 2026-11-17)

## Contexto

Ninguna fuente tiene por sí sola la lista completa y correcta de publicaciones de Tomás. ORCID la mantiene él, pero no tiene **el número de citas** (cuántas veces se citó cada obra); solo guarda la referencia bibliográfica. OpenAlex tiene citas, coautores e instituciones con ubicación, pero mezcla duplicados y a veces desvincula obras. Google Scholar, Scopus y Web of Science no tienen una API abierta.

## Decisión

- **Fuentes base:** la lista se arma uniendo **OpenAlex** (autor `A5026723884`) y **ORCID** (`0000-0003-3014-8340`). Cada obra guarda en `fuentes` cuál de las dos la trae.
- **Sellos de verificación:** Crossref, DataCite, Semantic Scholar, DBLP, zbMATH Open y arXiv no agregan obras: solo confirman que una obra existe y, en algunos casos, dan su revista o sus citas. El sitio muestra cuántas fuentes confirman cada obra.
- **Cifras del perfil** (citas, índice h, i10): las del perfil de OpenAlex, siempre con su fecha.
- **Descartadas por ahora (2026-11-09):** Google Scholar (sin API oficial), Scopus y Web of Science (requieren acceso institucional) y el Research Portal de la VUB (prohíbe la lectura automática). El sitio solo enlaza a los perfiles de Scholar y Scopus.
