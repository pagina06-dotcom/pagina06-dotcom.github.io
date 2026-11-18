# 0008 · IA con Gemini (nivel gratuito) y búsqueda web para completar lo que no tienen las fuentes

- **Estado:** aceptada (se implementa desde la semana 5)
- **Fecha:** 2026-11-09 (registrada el 2026-11-17). Detalle en las notas 03, 04 y 05 de *ideas-y-observaciones*.

## Contexto

En la revisión del 5-nov, Tomás pidió que el sitio sea **100% automático**. Las bases académicas no tienen sus charlas, talleres, estadías ni textos de presentación, y su perfil ORCID no tiene fondos ni distinciones. Una prueba del 9-nov encontró en la web ocho actividades y una residencia que no están en ninguna fuente, pero también muchos homónimos.

## Decisión

**Modelos de IA (Gemini API, nivel gratuito durante el piloto):**
- `gemini-3.5-flash-lite` para extraer datos de páginas, verificar homónimos y clasificar.
- `gemini-3.8-flash` para redactar la biografía y los textos por área en ES/EN.
- El nombre del modelo va en la configuración, no en el código, y hay un modelo de respaldo, porque Google cambia y retira modelos cada pocos meses.

**Búsqueda web:**
- Una API de búsqueda (Tavily; Brave como alternativa) solo para **descubrir páginas**. Los datos se toman siempre de la página original.
- Las consultas combinan el nombre con sus temas e instituciones, que ya se conocen por OpenAlex y ORCID. Unas 30–50 por semana.

**Reglas (aplican a todo lo que haga la IA):**
1. La IA solo trabaja con datos recolectados o con el texto de la página original. No completa ni supone.
2. Al extraer, cita el texto exacto que respalda cada dato; si no puede, el dato no se usa.
3. Cada salida se **verifica sin IA** contra los datos (nombres, años, instituciones) antes de publicarse. Ante la duda, no se publica.
4. Los textos generados llevan una **etiqueta visible** de texto generado con IA.
5. Solo se regenera cuando cambian los datos. Si falla la API o se agota la cuota, se mantiene el texto anterior; nunca queda una sección vacía.
6. Solo se envían datos públicos de Tomás, que lo autorizó en la reunión del 5-nov. No se rastrea a otras personas (Ley 21.719 y, por precaución, GDPR; nota 04).
