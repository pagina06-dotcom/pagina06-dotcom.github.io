# 0006 · Recuperar las citas de obras solo en ORCID, sin sumarlas al perfil

- **Estado:** aceptada
- **Fecha:** 2026-11-17 (tarea 2.2)

## Contexto

El 4-nov-2026 OpenAlex fusionó registros duplicados de obras de Tomás. En la versión que sobrevivió, su nombre aparece escrito ("Tomas Veloz", "T. Veloz") pero no vinculado a su perfil de autor. Esas 5 obras dejaron de salir en el perfil, que bajó de 900 a 792 citas. En el sitio seguían apareciendo porque ORCID las trae, pero sin citas.

Además, ORCID tenía obras repetidas con otro año (importadas en lote) y 3 obras de la revista *Complexity* en las que Tomás no figura como autor.

## Decisión

- Cada semana, el recolector busca en OpenAlex **cada obra que solo trajo ORCID**: por DOI si lo tiene y, si no, por título (`filter=title.search`).
- La obra encontrada se acepta solo si **el título coincide** (o el DOI) **y Tomás figura entre los autores**, por su ID de OpenAlex o por su nombre escrito (apellido Veloz + nombre Tomás o inicial T, sin tildes).
- Si la obra encontrada **ya estaba en la lista**, la de ORCID era un duplicado: se unen.
- Si no estaba, se completa con citas, autores y temas, y se marca `"recuperada": "doi"` o `"titulo"`.
- **Las cifras del perfil no se tocan.** `stats.cites`, `h` e `i10` siguen siendo las del perfil de OpenAlex. Las citas recuperadas se informan aparte en `stats.cites_recuperadas`.
- Si OpenAlex falla durante la búsqueda, se conservan las citas recuperadas la semana anterior.
- Si la obra existe en OpenAlex pero Tomás no figura como autor, el script lo avisa en el registro y en `datos/fuentes.json` (`sin_autoria`). No se excluye sola: lo decide Tomás.

## Consecuencias

- **Resultado del 17-nov:** 5 obras recuperadas (147 citas) y 5 duplicados unidos. La lista bajó de 100 a 95 obras.
- **A favor:** las obras desvinculadas vuelven a mostrar sus citas sin inventar cifras: cada número sigue siendo de OpenAlex.
- **En contra:** el total del perfil (967) y la suma de las citas de la lista no coinciden. Para la tarea 5.1 queda decidir cómo explicarlo en el sitio (por ejemplo, "+147 en obras que OpenAlex no vinculó al perfil").
- **En contra:** cada búsqueda por título se cobra en OpenAlex. Con unas 15 búsquedas semanales es poco, pero conviene la clave ([0007](0007-clave-de-openalex.md)).
- **Pendiente:** confirmar con Tomás si se excluyen las 3 obras de *Complexity* (`10.1155/2020/9048191`, `10.1155/2020/5342606`, `10.1155/2019/8205696`). La solución de fondo es pedir a OpenAlex que vuelva a vincular las obras a su perfil.
