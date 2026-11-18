# 0011 · Datos incompletos: se muestran sin lo que falta y el aviso va solo en el panel

- **Estado:** aceptada
- **Fecha:** 2026-11-18

## Contexto

ORCID trae la formación y los cargos de Tomás, pero **ninguna de las 6 entradas tiene años** (4 de formación, 2 de cargos). Lo mismo va a pasar con lo que traigan otras fuentes y la búsqueda web ([0008](0008-ia-gemini-y-busqueda-web.md)): eventos sin lugar, premios sin año, cargos sin título.

Si solo se mostrara lo completo, el sitio escondería datos reales. Si se completara lo que falta, se inventarían datos ([0005](0005-no-inventar-datos.md)). Y un aviso de «dato incompleto» en la página pública no le sirve al visitante: quien puede completarlo es Tomás.

## Decisión

Cada dato cae en uno de tres niveles según lo que le falte:

| Nivel | Ejemplo | En el sitio público | En Mi panel |
|---|---|---|---|
| **Completo** | Título, institución y años | Se muestra en todas partes: lista, línea de tiempo y mapa | — |
| **Incompleto pero usable** | Título e institución, sin años | Se muestra **sin el dato que falta**, al final de su lista. No entra donde ese dato es obligatorio (sin año, no va al mapa ni a la línea de tiempo) | Pendiente con enlace para completarlo en la fuente |
| **Falta lo esencial** | Sin institución o sin título | **No se muestra** | Pendiente con enlace para completarlo en la fuente |

- **No se completa nada:** ni se adivina el año por las publicaciones ni se corrige el texto de la fuente.
- **Se completa en la fuente, no en el sitio.** El aviso del panel lleva a ORCID (o a la fuente que corresponda). En la siguiente actualización semanal el dato pasa solo al nivel que le toca. Así el sitio sigue siendo automático y el panel no necesita guardar nada ([0002](0002-sitio-estatico-sin-servidor.md)).
- **El visitante no ve avisos de datos incompletos.**

**Lo esencial y lo obligatorio, por tipo de dato:**

| Dato | Viene de | Esencial (si falta, no se muestra) | Obligatorio solo para… | Dónde se completa |
|---|---|---|---|---|
| Formación | ORCID | Institución y título | Línea de tiempo: año. Mapa: año y coordenadas | ORCID |
| Cargo | ORCID | Institución (el título del cargo es opcional, porque ORCID suele traer solo la institución) | No va al mapa | ORCID |
| Publicación | OpenAlex + ORCID | Título | — (sin revista, DOI o citas se muestra igual) | ORCID, si es una obra que solo está ahí |
| Afiliación | OpenAlex | Institución y años | Mapa: coordenadas | — (OpenAlex no se edita desde aquí) |
| Lugar | Contenido manual | Nombre y año | Mapa: coordenadas | Contenido manual |
| Premio | Contenido manual | Título y año | Mapa: coordenadas | Contenido manual |
| Evento, proyecto, escrito | Contenido manual | Título y área (una existente en `perfiles.json`) | — (sin enlace, lugar o institución se muestra igual) | Contenido manual |

- **Pendientes que se muestran hoy en Mi panel:**
  - entradas de ORCID sin año;
  - entradas de ORCID sin lo esencial;
  - obras que solo están en ORCID y no tienen DOI (se muestran sin citas; con el DOI, el recolector puede buscarlas);
  - contenido manual sin lo esencial;
  - lugares y premios sin coordenadas.
- **Cada pendiente dice cuáles son** (desplegable «Ver cuáles») y, en el contenido manual, qué le falta a cada uno.
- **Pistas para encontrar un DOI:** a las obras sin DOI se les agregan pistas verificables, pero **nunca se publican ni se usan como dato**.
  - Si la obra está en arXiv, su DOI oficial de arXiv (`10.48550/arXiv.<id>`).
  - Si Semantic Scholar la encuentra en una revista, el nombre de esa revista.
  - Quien completa el DOI en ORCID es Tomás.
- **Las coordenadas de la formación** salen de las afiliaciones de OpenAlex, por coincidencia de nombre. ORCID no da coordenadas (sus identificadores son RINGGOLD o FUNDREF, no ROR) y no se ubica nada por nombre en un geocodificador. La coincidencia se hace por el nombre sin tildes, sin mayúsculas y sin «The» inicial.
- **Los cargos no van al mapa:** las afiliaciones de OpenAlex ya ubican esas instituciones con sus años. Ponerlos también duplicaría los puntos.
- **Si solo hay año de inicio:** el cargo se muestra como «2013–actualidad» y la formación como «2003–». En el mapa, la formación ocupa solo ese año.
- **Lo que llegue por búsqueda web o IA** ([0008](0008-ia-gemini-y-busqueda-web.md)) entra como contenido de su tipo y sigue esta misma tabla.

**Implementación:** en `assets/js/app.js`:
- el bloque «datos incompletos» (`MAN`, `MAN_OCULTOS`, `MAN_SIN_LL`) filtra el contenido manual;
- `orcidRows()` y `orcidSection()` arman la formación y los cargos;
- `places()` arma la línea de tiempo, e `initMap()` deja en el mapa solo lo que tiene coordenadas;
- los pendientes están en `pSummary()`.

Para un tipo de dato nuevo, se agrega una fila a esta tabla.
