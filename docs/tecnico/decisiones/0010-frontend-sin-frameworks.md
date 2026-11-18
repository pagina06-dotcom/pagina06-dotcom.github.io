# 0010 · Frontend en JavaScript sin frameworks ni paso de compilación

- **Estado:** aceptada
- **Fecha:** 2026-10-29 (registrada el 2026-11-18). Complementa a [0002](0002-sitio-estatico-sin-servidor.md), que decide *dónde* vive el sitio; esta decide *con qué* se construye.

## Contexto

[0002](0002-sitio-estatico-sin-servidor.md) fija un sitio estático en GitHub Pages, pero quedaba abierto si el frontend usaba un framework (React, Vue, Svelte) o un generador de sitios (Astro, Eleventy, Hugo), que también producen sitios estáticos.

- El sitio anterior de Tomás (`tveloz.github.io-main/`) tenía `package.json`, `node_modules`, `googleapis`, `node-cron` y un `.env`. Dejó de funcionar cuando nadie mantuvo esas piezas.
- El piloto tiene 8 horas por semana y, al terminar, nadie va a actualizar dependencias.
- El sitio es una sola página con navegación por `#hash`: `index.html` (22 líneas), `assets/js/app.js` (~730 líneas), `assets/css/site.css` y `datos/sitio.js` (~90 KB). El único estado son los filtros, el carrusel y el timelapse.
- El prototipo aprobado en H0 (5-nov) ya estaba en JavaScript sin frameworks, y se aprobó tal cual.

## Decisión

- El frontend es **HTML, CSS y JavaScript sin frameworks**. La única biblioteca es **Leaflet 1.9.4**, para el mapa.
- **No hay paso de compilación ni `package.json`.** El repositorio se publica tal cual y `index.html` funciona con doble clic (`file://`).
- Las páginas se arman con *template strings* en `app.js`. **Todo texto que venga de datos pasa por `esc()`** y **todo enlace externo pasa por `urlSegura()`**, que solo acepta `http://` y `https://`. Un framework escaparía el texto solo, pero tampoco bloquearía un `href="javascript:..."`; aquí ambas cosas son reglas explícitas.
- Si `app.js` se hace difícil de leer, se parte en **varios `<script>` clásicos**, no en módulos ES: los navegadores no cargan `type="module"` desde `file://`.
