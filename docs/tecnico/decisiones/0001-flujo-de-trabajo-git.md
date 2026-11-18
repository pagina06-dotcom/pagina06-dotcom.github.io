# 0001 · Flujo de trabajo con Git: GitHub Flow

- **Estado:** aceptada
- **Fecha:** 2026-11-09

## Contexto

El piloto lo desarrolla una sola persona, con apoyo de un asistente de IA, y el sitio se publica automáticamente en GitHub Pages desde la rama `main`. Además, un proceso de GitHub Actions hace commits directos a `main` cada lunes con los datos actualizados. Hace falta un flujo de trabajo que:

- mantenga `main` siempre funcionando, porque todo lo que entra ahí queda publicado;
- deje un historial claro de qué cambió, por qué y a qué tarea del plan corresponde;
- sea liviano para un equipo de una persona.

## Decisión

Se usa **GitHub Flow**: una rama corta por tarea, que se integra a `main` cuando está lista. Se descarta GitFlow (ramas `develop`, `release` y `hotfix`) porque es demasiado para un solo desarrollador y un sitio estático.

### Reglas

1. **`main` siempre funciona.** No se trabaja directamente sobre `main`.
2. **Una rama por tarea de la carta Gantt**, con el número de la tarea en el nombre:
   - `feat/2.2-recuperar-citas`
   - `docs/6.1-documento-tecnico`
   - `fix/mapa-timelapse`
3. **Las ramas viven poco** (días, no semanas). Al terminar una tarea: se prueba en local (abrir `index.html`), se abre un *pull request* a `main`, se hace el *merge* y se borra la rama.
4. **Siempre con pull request, aunque se trabaje solo**: queda registrado qué cambió y por qué, y más adelante permite agregar revisiones automáticas antes de publicar.
5. **Antes de crear una rama o de hacer el merge, se trae lo último de `main`** (`git pull`), porque el proceso semanal de Actions también escribe en `main`.

### Mensajes de commit

Se usa el formato *Conventional Commits*, en español:

| Prefijo     | Para qué                                    | Ejemplo                                                               |
|-------------|---------------------------------------------|-----------------------------------------------------------------------|
| `feat:`     | Función nueva                               | `feat: recupera citas de obras solo en ORCID buscando por título`     |
| `fix:`      | Corrección                                  | `fix: el timelapse se salta el año 2019`                              |
| `docs:`     | Documentación                               | `docs: agrega requisitos funcionales`                                 |
| `refactor:` | Reordenar código sin cambiar comportamiento | `refactor: separa el recolector por fuente`                           |
| `chore:`    | Configuración y mantenimiento               | `chore: actualiza el workflow de Actions`                             |
| `datos:`    | Solo datos regenerados                      | `datos: actualización semanal 2026-11-16` (lo usa el proceso semanal) |

- Commits pequeños, con un cambio lógico cada uno.
- Los datos regenerados (`datos/`) van siempre en un commit aparte del código.
- Nunca se suben claves ni archivos `.env`: las claves van como secretos de GitHub.
- El autor de los commits es el desarrollador. No se agregan líneas de coautoría de herramientas de IA.

### Hitos como etiquetas

Al cumplir cada hito se marca la versión con una etiqueta (*tag*):

| Etiqueta  | Hito               | Fecha prevista |
|-----------|--------------------|----------------|
| `v0.1-H1` | Sitio en línea     | 25-nov-2026    |
| `v0.2-H2` | Todo automático    | 23-dic-2026    |
| `v1.0-H3` | Entrega del piloto | 21-ene-2027    |
