# 0009 · Protección ante caídas bruscas en las fuentes

- **Estado:** propuesta (evaluación de la tarea 2.3). Falta decidir la opción y los umbrales.
- **Fecha:** 2026-11-17

## Contexto

El sitio publica solo, cada lunes, lo que traen las fuentes. Si una fuente cambia bruscamente, el cambio queda publicado sin que nadie lo revise. Ya pasó: el 4-nov-2026 OpenAlex desvinculó 5 obras de Tomás y su perfil bajó de 900 a 792 citas y de h 20 a 18. Si la actualización semanal hubiera corrido ese día, el sitio habría mostrado la caída como si fuera real.

La tarea 2.2 ([0006](0006-recuperar-citas-sin-sumarlas-al-perfil.md)) resuelve **ese** caso para las obras, pero no protege las cifras del perfil ni otros cambios.

### Qué puede pasar

| Caso | Ejemplo | ¿Ya está cubierto? |
|---|---|---|
| A. Una fuente no responde | Semantic Scholar devuelve 429 | **Sí:** se conservan sus datos anteriores ([0005](0005-no-inventar-datos.md)) |
| B. ORCID u OpenAlex no responden | Caída del servicio | **Sí:** el script se detiene y no sobrescribe nada |
| C. Obras que quedan solo en ORCID | OpenAlex desvincula obras (4-nov) | **Sí, para las obras:** se recuperan por DOI o título (2.2) |
| D. Bajan las cifras del perfil | Citas, h o i10 de OpenAlex bajan de golpe | **No** |
| E. Bajan muchas obras de la lista | Una obra se vuelve privada en ORCID, o OpenAlex fusiona registros | **No** |
| F. Suben de golpe las obras | OpenAlex vincula obras de un homónimo al perfil | **No** |
| G. La respuesta cambia de forma | La API cambia un campo y llegan vacíos | **En parte:** algunos errores detienen el script; otros dejan campos vacíos |

## Opciones evaluadas

| Opción | Cómo funciona | A favor | En contra | Esfuerzo |
|---|---|---|---|---|
| 1. No hacer nada más | Se queda lo de 2.2 | Sin trabajo | D, E, F y G se publican solos | 0 h |
| **2. Retener y avisar** | Se compara con la semana anterior. Si un cambio supera un umbral, **no se publica**: se mantienen los datos anteriores, se abre un *issue* en GitHub con el detalle y la ejecución termina en error (GitHub envía un correo). Una persona revisa y, si el cambio es real, lo aprueba ejecutando el workflow con la opción «aceptar cambios» | El sitio nunca muestra una caída sin revisar. La regla de [0005](0005-no-inventar-datos.md) se mantiene | Si nadie revisa, el sitio queda con los datos de la semana anterior hasta que alguien apruebe | 3–4 h |
| 3. Publicar y marcar | Se publica igual, con un aviso visible «cifra en revisión» y un *issue* | El sitio siempre está al día | El visitante ve la caída; el aviso confunde | 2–3 h |
| 4. Suavizar | Mostrar el máximo de las últimas semanas | Sin intervención | **Inventa cifras**: contradice [0005](0005-no-inventar-datos.md). Descartada | — |

## Propuesta

**Opción 2: retener y avisar**, con estos umbrales iniciales (se ajustan con el uso):

| Qué se compara con la semana anterior | Se retiene si… |
|---|---|
| Citas del perfil (`stats.cites`) | bajan más de 3 % o más de 20 citas |
| Índice h o i10 | bajan |
| Obras visibles (`stats.works`) | bajan en 3 o más |
| Obras nuevas en la semana | son más de 10 (posible homónimo) |
| Cualquier cifra del perfil | llega vacía o en cero |

Las subidas normales (nuevas citas, una o dos obras nuevas) se publican sin revisión.

### Cómo se implementaría

1. En `scripts/actualizar.py`, antes de escribir `datos/`, comparar con los archivos actuales. Si algo supera un umbral, escribir el detalle en un archivo temporal y terminar con un código de salida especial, sin tocar `datos/`.
2. En el workflow:
   - un paso que, con ese código, abra un *issue* con el detalle (permiso `issues: write`, con el token automático de Actions);
   - una opción `aceptar_cambios` en «Run workflow» que publica aunque se superen los umbrales.
3. En `datos/fuentes.json`, registrar `"retenido": true` con la fecha, para que la página de Fuentes indique que los datos están en revisión.

## Consecuencias

- **A favor:** caídas como la del 4-nov no se publican sin revisión, y queda un registro (*issue*) de cada caso.
- **En contra:** requiere que alguien lea el correo o el *issue*. Para el piloto será Victor. Para el producto, habría que decidir quién revisa (la persona o el servicio).
- **En contra:** los umbrales pueden dar falsas alarmas al principio. Por eso son configurables y se revisan después de las primeras semanas.
- **Plazo:** la tarea 2.3 cierra el 25-nov. Si se aprueba, se implementa en la semana 5 junto con la prueba del workflow (3.2), o en la semana 6 si la semana 5 se llena con H1.

## A decidir

- [ ] ¿Opción 2? ¿Los umbrales propuestos sirven como punto de partida?
- [ ] ¿Quién recibe el aviso: solo Victor, o también Tomás?
