# 0002 · Sitio estático en GitHub Pages, sin servidor ni base de datos

- **Estado:** aceptada
- **Fecha:** 2026-10-29 (registrada el 2026-11-17)

## Contexto

El sitio anterior de Tomás dejó de funcionar porque dependía de piezas que nadie mantenía. El piloto dura 3 meses con 8 horas por semana, y al terminar el sitio debe seguir funcionando solo. El alcance deja fuera los servidores propios y los paneles de administración.

## Decisión

- El sitio es **estático**: `index.html` + `assets/js/app.js` en JavaScript sin frameworks, con Leaflet 1.9.4 para el mapa. No hay paso de compilación: se abre `index.html` con doble clic y funciona.
- **Los datos son archivos JSON en el repositorio** (`contenido/` y `datos/`). No hay base de datos.
- El recolector arma `datos/sitio.js` (`window.SITIO = {...}`) para que la página funcione también sin servidor (`file://`), donde el navegador no permite leer JSON con `fetch`.
- Se publica con **GitHub Pages** desde la raíz de `main`, en `https://pagina06-dotcom.github.io/`.
- La actualización semanal corre en **GitHub Actions** (lunes 06:00 UTC) y hace un commit `datos:` en `main`.
- `admin.html` son **plantillas estáticas**: muestran qué se podrá editar, pero sus botones no guardan nada.

## Consecuencias

- **A favor:** costo cero, nada que mantener ni actualizar en un servidor, historial completo de cada cambio de datos en git, y se puede volver a cualquier versión anterior.
- **En contra:** no hay edición en vivo. Lo que la persona quiera cambiar entra por formulario o editando `contenido/`, y aparece en la siguiente actualización. GitHub Pages guarda los archivos en caché hasta 10 minutos.
- **En contra:** `sitio.js` crece con la lista de publicaciones (hoy ~110 KB). Para una persona está bien; para un producto con muchas personas habría que separar un archivo por persona.
- **Pendiente:** si se protege `main` para exigir pull requests, dejar una excepción para el bot de Actions (ver [0001](0001-flujo-de-trabajo-git.md)).
