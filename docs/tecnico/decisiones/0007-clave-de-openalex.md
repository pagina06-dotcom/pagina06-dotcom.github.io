# 0007 · Clave de OpenAlex como secreto de GitHub

- **Estado:** aceptada (falta crear la clave)
- **Fecha:** 2026-11-17

## Contexto

Desde 2026, OpenAlex cobra cada consulta contra un presupuesto diario. El 17-nov se comprobó en las cabeceras de la API:

- **Sin clave:** US$ 0,10 al día, compartidos por todos los que salen por la misma IP. Una búsqueda o un filtro cuesta US$ 0,001; las consultas por ID o DOI son más baratas.
- **Con clave gratuita:** US$ 1 al día, propios.

En GitHub Actions las IP se comparten con otros usuarios, así que sin clave el presupuesto puede estar agotado cuando corre la actualización. Una ejecución completa usa unas 20 consultas (~US$ 0,02).

## Decisión

- El recolector lee la clave de la variable de entorno **`OPENALEX_API_KEY`** y la agrega a todas las consultas a OpenAlex. Si no hay clave, funciona igual con el presupuesto compartido.
- En GitHub, la clave se guarda como **secreto del repositorio** con ese mismo nombre, y el workflow la pasa al script. En el PC, se define en la sesión y nunca se escribe en un archivo del repositorio.
- La clave se crea con la cuenta del piloto en openalex.org/settings/api.
- Regla general para todas las claves (Gemini, búsqueda web): **secretos de GitHub**, nunca en el código ni en `.env` subidos al repositorio. Los mensajes de error que se publican en `datos/fuentes.json` no incluyen la URL de la consulta.

## Consecuencias

- **A favor:** la actualización semanal no depende del uso que hagan otros usuarios de GitHub Actions.
- **En contra:** una clave más que mantener. Si se revoca o vence, el script sigue funcionando sin ella y la página de Fuentes mostrará el error si se agota el presupuesto.
- **Para el producto:** con muchas personas habrá que estimar el costo (búsquedas y filtros se cobran) o usar el snapshot de OpenAlex (alcance, Anexo A).
