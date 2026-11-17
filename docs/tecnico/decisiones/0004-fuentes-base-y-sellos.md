# 0004 · ORCID y OpenAlex como fuentes base; las demás, como sellos de verificación

- **Estado:** aceptada
- **Fecha:** 2026-11-02 (descartes del 2026-11-09; registrada el 2026-11-17)

## Contexto

Ninguna fuente tiene por sí sola la lista completa y correcta de publicaciones de Tomás. ORCID la mantiene él, pero no tiene citas. OpenAlex tiene citas, coautores e instituciones con ubicación, pero mezcla duplicados y a veces desvincula obras. Google Scholar, Scopus y Web of Science no tienen una API abierta.

## Decisión

- **Fuentes base:** la lista se arma uniendo **OpenAlex** (autor `A5026723884`) y **ORCID** (`0000-0003-3014-8340`). Cada obra guarda en `fuentes` cuál de las dos la trae.
- **Sellos de verificación:** Crossref, DataCite, Semantic Scholar, DBLP, zbMATH Open y arXiv no agregan obras: solo confirman que una obra existe y, en algunos casos, dan su revista o sus citas. El sitio muestra cuántas fuentes confirman cada obra.
- **Cifras del perfil** (citas, índice h, i10): las del perfil de OpenAlex, siempre con su fecha.
- **Descartadas por ahora (2026-11-09):** Google Scholar (sin API oficial), Scopus y Web of Science (requieren acceso institucional) y el Research Portal de la VUB (prohíbe la lectura automática). El sitio solo enlaza a los perfiles de Scholar y Scopus.

## Consecuencias

- **A favor:** todas las fuentes son abiertas y gratuitas para un sitio personal sin cobro, y cada dato tiene un origen verificable.
- **En contra:** las citas de OpenAlex no coinciden con las de Google Scholar, que suelen ser más altas. El sitio lo explica en la página de Fuentes.
- **En contra:** OpenAlex puede cambiar de un día a otro: el 4-nov desvinculó 5 obras (de 900 a 792 citas). Se mitiga con [0006](0006-recuperar-citas-sin-sumarlas-al-perfil.md) y con la protección evaluada en [0009](0009-proteccion-ante-caidas-bruscas.md).
- **Licencias:** la API pública de ORCID no permite uso comercial y Semantic Scholar no lo aclara. No afecta al piloto; para el producto ver la sección 4 del documento de alcance.
