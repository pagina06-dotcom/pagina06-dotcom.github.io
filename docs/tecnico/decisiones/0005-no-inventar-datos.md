# 0005 · No inventar datos: corregir solo quitando, uniendo o renombrando

- **Estado:** aceptada
- **Fecha:** 2026-10-29 (registrada el 2026-11-17)

## Contexto

El valor del sitio está en que cada dato tenga una fuente. Si el sitio se actualiza solo, un error de una fuente o una corrección manual mal hecha puede publicar algo falso sin que nadie lo note.

## Decisión

1. **Las correcciones solo quitan, unen o renombran.** `contenido/correcciones.json` permite excluir obras o tipos, unir instituciones duplicadas y cambiar su nombre visible. No permite agregar obras ni cambiar cifras.
2. **Si una fuente falla, se conserva lo de la semana anterior.** Sus sellos se mantienen y la página de Fuentes muestra el error con su fecha.
3. **Si fallan ORCID u OpenAlex**, que son la base de la lista, el script se detiene y no sobrescribe nada.
4. **Las cifras no se mezclan.** Si dos fuentes dan números distintos (por ejemplo, citas de OpenAlex y de Semantic Scholar), se muestran lado a lado, cada una con su origen. Nunca se suman ni se promedian.
5. **La IA, cuando entre (semana 5), sigue la misma regla:** solo redacta a partir de datos recolectados, y cada texto se verifica sin IA contra esos datos antes de publicarse. Ver [0008](0008-ia-gemini-y-busqueda-web.md).

## Consecuencias

- **A favor:** todo lo que se ve en el sitio se puede rastrear hasta una fuente o una decisión explícita de Tomás.
- **En contra:** lo que ninguna fuente tiene no aparece hasta que se agregue por formulario o lo encuentre la búsqueda web.
- **En contra:** si una fuente publica un error, el sitio lo replica hasta que se corrija en la fuente o se excluya. La protección ante caídas bruscas está en evaluación ([0009](0009-proteccion-ante-caidas-bruscas.md)).
