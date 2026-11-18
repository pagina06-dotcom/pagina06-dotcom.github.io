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
