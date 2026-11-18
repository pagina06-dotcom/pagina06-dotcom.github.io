/* Sitio de Tomás Veloz — prototipo.
   Lee window.SITIO (datos/sitio.js, generado por scripts/actualizar.py) y arma las páginas.
   index.html = vista visitante · admin.html = plantillas estáticas de administración (no guardan nada). */
(() => {
'use strict';
const S = window.SITIO;
if (!S) { document.getElementById('app').textContent = 'Falta datos/sitio.js: ejecuta python scripts/actualizar.py'; return; }
const C = S.contenido, DD = S.datos;
const ADMIN = document.body.dataset.modo === 'admin';
const GEN = DD.publicaciones.generado;
const NOW = +GEN.slice(0, 4);
const $ = s => document.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
/* Enlaces externos: solo http(s). Lo que llegue por IA o búsqueda web con otro esquema (javascript:, data:…) no se enlaza. */
const urlSegura = u => { const v = String(u ?? '').trim(); return /^https?:\/\//i.test(v) ? v : ''; };
const store = { get: k => { try { return localStorage.getItem(k); } catch { return null; } },
                set: (k, v) => { try { localStorage.setItem(k, v); } catch { /* sin almacenamiento */ } } };
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- idioma ---------- */
let lang = store.get('lang') === 'es' ? 'es' : 'en';
const L = a => Array.isArray(a) ? a[lang === 'es' ? 1 : 0] : a;
const T = {
  'nav.home': ['Home', 'Inicio'], 'nav.pubs': ['Publications', 'Publicaciones'], 'nav.talks': ['Talks & events', 'Charlas y eventos'],
  'nav.journey': ['Journey & awards', 'Trayectoria y premios'], 'nav.projects': ['Projects', 'Proyectos'], 'nav.writing': ['Writing', 'Escritos'],
  'nav.work': ['Work with me', 'Trabaja conmigo'], 'nav.sources': ['Data sources', 'Fuentes de datos'],
  menu: ['☰ Menu', '☰ Menú'], close: ['✕ Close', '✕ Cerrar'], dark: ['■ Dark', '■ Oscuro'], light: ['□ Light', '□ Claro'],
  langRem: ['Language · remembered on this device', 'Idioma · se recuerda en este dispositivo'], theme: ['Theme', 'Tema'],
  tLight: ['Light', 'Claro'], tDark: ['Dark', 'Oscuro'], tSys: ['System', 'Sistema'],
  form: ['Form', 'Formulario'], manual: ['Entered by hand', 'Cargado a mano'], weekly: ['every week', 'cada semana'], mainP: ['Main profile', 'Perfil principal'],
  researcher: ['Researcher', 'Investigador'], viewP: ['View profile →', 'Ver perfil →'], reserved: ['Reserved space', 'Espacio reservado'],
  'st.works': ['publications', 'publicaciones'], 'st.cites': ['citations', 'citas'], 'st.h': ['h-index', 'índice h'], 'st.i10': ['i10-index', 'índice i10'],
  about: ['About', 'Acerca de'], latest: ['Latest publications', 'Últimas publicaciones'], seeAll: ['See all {n} publications →', 'Ver las {n} publicaciones →'],
  lines: ['Research lines', 'Líneas de investigación'], linesSub: ['Each publication belongs to one line. Pick one to see its detail.', 'Cada publicación pertenece a una línea. Elige una para ver su detalle.'],
  autoAssign: ['Automatic assignment · to confirm', 'Asignación automática · por confirmar'], allLines: ['All lines', 'Todas las líneas'],
  inLine: ['publications in this line', 'publicaciones en esta línea'], mostCited: ['Most cited · suggested, to confirm', 'Más citadas · sugerido, por confirmar'],
  projTalks: ['Projects and talks', 'Proyectos y charlas'], alsoLine: ['also in this line', 'también en esta línea'], sources: ['sources', 'fuentes'],
  seeLine: ['See the {n} publications in this line →', 'Ver las {n} publicaciones de esta línea →'], nothingLine: ['No projects or talks in this line yet.', 'Aún no hay proyectos ni charlas en esta línea.'],
  upnext: ['Upcoming and recent', 'Próximo y reciente'],
  footer: ['Publications: OpenAlex and ORCID · GitHub Pages · updated every week · prototype', 'Publicaciones: OpenAlex y ORCID · GitHub Pages · actualizado cada semana · prototipo'],
  adminLink: ['Tomás view (template)', 'Vista Tomás (plantilla)'],
  home: ['Home', 'Inicio'], profiles: ['Profiles', 'Perfiles'], profile: ['Profile', 'Perfil'], all: ['All', 'Todas'], allM: ['All', 'Todos'],
  items: ['items', 'elementos'], item1: ['item', 'elemento'], countries: ['countries', 'países'], insts: ['institutions', 'instituciones'],
  empty0: ['0 ITEMS', '0 ELEMENTOS'], emptyT: ['There is no content in this sub-area yet.', 'Todavía no hay contenido en esta subárea.'],
  others: ['Other profiles', 'Otros perfiles'], also: ['Also in', 'También en'], noImg: ['No image at source · profile illustration', 'Sin imagen en la fuente · ilustración del perfil'],
  prevImg: ['Preview image', 'Imagen de vista previa'], subTBD: ['Sub-area to be defined', 'Subárea por definir'],
  freeNote: ['Tomás has not defined this profile yet. Its name, avatar, up to 4 sub-areas and its content will appear here (e.g. «Science communication», «Leadership & foundations» or «Painter»).', 'Tomás aún no define este perfil. Aquí aparecerán su nombre, avatar, hasta 4 subáreas y su contenido (por ejemplo «Divulgación», «Gestión y fundaciones» o «Pintor»).'],
  freeSub: ['Space reserved for a fourth profile.', 'Espacio reservado para un cuarto perfil.'],
  'pubs.sub': ['Synced every week from OpenAlex and ORCID. Duplicates are merged automatically and each publication shows which independent sources confirm it.', 'Sincronizado cada semana desde OpenAlex y ORCID. Los duplicados se unen solos y cada publicación muestra qué fuentes independientes la confirman.'],
  perYear: ['Publications per year', 'Publicaciones por año'], coauthors: ['Most frequent co-authors', 'Coautores más frecuentes'],
  search: ['Search title, co-author or journal…', 'Buscar título, coautor o revista…'], allTypes: ['All types', 'Todos los tipos'],
  vAll: ['All verification', 'Toda verificación'], v2: ['Verified by 2+ sources', 'Verificadas por 2+ fuentes'], v0: ['Not verified yet', 'Aún sin verificar'],
  sRecent: ['Most recent', 'Más recientes'], sCites: ['Most cited', 'Más citadas'], recentFirst: ['most recent first', 'más recientes primero'], citedFirst: ['most cited first', 'más citadas primero'],
  pubsN: ['publications', 'publicaciones'], verBy: ['Verified by', 'Verificado por'], notVer: ['Not verified by an independent source yet', 'Aún sin verificar por una fuente independiente'],
  onlyOrcid: ['Only in ORCID', 'Solo en ORCID'], noLine: ['No line', 'Sin línea'], cites: ['citations', 'citas'], fix: ['Official journal according to Crossref:', 'Revista oficial según Crossref:'],
  noRes: ['No publications match these filters.', 'Ninguna publicación coincide con estos filtros.'], etal: ['et al.', 'et al.'],
  'talks.sub': ['Invited talks, workshops, seminars and conferences.', 'Charlas invitadas, talleres, seminarios y congresos.'],
  'talks.note': ['Talks come from the backup form until ORCID has them. The image is taken from the linked page (its preview image or the video thumbnail), always with credit. If there is no image, the profile illustration is used.', 'Las charlas vienen del formulario de respaldo hasta que estén en ORCID. La imagen se toma de la página enlazada (su vista previa o la miniatura del video), siempre con crédito. Si no hay imagen, se usa la ilustración del perfil.'],
  'journey.sub': ['Where he was and what he did, year by year.', 'Dónde estuvo y qué hizo, año por año.'],
  play: ['▶ Play', '▶ Reproducir'], pause: ['❚❚ Pause', '❚❚ Pausa'], playing: ['Playing', 'Reproduciendo'], paused: ['Paused', 'En pausa'], of: ['of', 'de'],
  prevY: ['Previous year', 'Año anterior'], nextY: ['Next year', 'Año siguiente'],
  kAff: ['Affiliation', 'Afiliación'], kEv: ['Residency / event', 'Residencia / evento'], kAw: ['Award / appointment', 'Premio / nombramiento'],
  pastYears: ['Previous years', 'Años anteriores'], stopsRM: ['Stops with reduced motion', 'Se detiene con movimiento reducido'],
  pubsYear: ['publications this year', 'publicaciones este año'], affs: ['Affiliations', 'Afiliaciones'], evs: ['Residencies and events', 'Residencias y eventos'],
  aws: ['Awards and appointments', 'Premios y nombramientos'], topYear: ['Most cited of the year', 'Más citada del año'], 'new': ['new', 'nuevo'],
  lastYear: ['last year', 'último año'], noAff: ['No affiliations recorded for this year.', 'Sin afiliaciones registradas este año.'],
  fullJ: ['Full journey', 'Trayectoria completa'], eduJ: ['Education and positions', 'Formación y cargos'], edus: ['Education', 'Formación'], jobs: ['Positions', 'Cargos'], kEdu: ['Education', 'Formación'],
  pendOy: ['ORCID entries without a year', 'Entradas de ORCID sin año'], pendOys: ['They appear in Journey without a year and stay off the map. Add the years in ORCID; the site picks them up in the next weekly update.', 'Aparecen en Trayectoria sin año y no entran al mapa. Agrega los años en ORCID; el sitio los toma en la siguiente actualización semanal.'],
  pendOd: ['ORCID entries without institution or title', 'Entradas de ORCID sin institución o título'], pendOds: ['They are not shown on the site. Complete them in ORCID.', 'No se muestran en el sitio. Complétalas en ORCID.'], fixOrcid: ['Complete in ORCID ↗', 'Completar en ORCID ↗'], langL: ['Language', 'Idioma'], seeWhich: ['See which ones', 'Ver cuáles'], missing: ['missing:', 'falta:'],
  mTitle: ['title', 'título'], mArea: ['area', 'área'], mName: ['name', 'nombre'], mYear: ['year', 'año'],
  tEv: ['Event', 'Evento'], tPr: ['Project', 'Proyecto'], tWr: ['Writing', 'Escrito'], tLu: ['Place', 'Lugar'], tAw: ['Award', 'Premio'], tJob: ['Position', 'Cargo'],
  hintArxiv: ['It is on arXiv; its arXiv DOI is {doi}', 'Está en arXiv; su DOI de arXiv es {doi}'], hintS2: ['Semantic Scholar finds it in {v}: it probably has a DOI from that journal', 'Semantic Scholar la encuentra en {v}: probablemente tiene DOI de esa revista'],
  hintCr: ['Crossref has it in {v} with DOI {doi}: confirm it is the same work and add that DOI in ORCID', 'Crossref la tiene en {v}, con DOI {doi}: confirma que es la misma obra y agrega ese DOI en ORCID'],
  hintFc: ['Its {f} does use DOIs (it is in Crossref), but this work did not show up: look for the DOI on the article page', 'Su {f} sí usa DOI (está en Crossref), pero esta obra no apareció: busca el DOI en la página de la obra'],
  fJournal: ['journal', 'revista'], fBook: ['book', 'libro'], check: ['Check', 'Comprobar'], checkedOn: ['checked {d}', 'revisado el {d}'], byName: ['by name', 'por nombre'],
  ndJournal: ['Journal not registered in Crossref', 'Revista no registrada en Crossref'], ndBook: ['Book not registered in Crossref', 'Libro no registrado en Crossref'],
  pendNd: ['Works without a DOI because their journal or book does not use DOIs', 'Obras sin DOI porque su revista o libro no usa DOI'],
  pendNds: ['Nothing to do: they are shown without citations. Checked in Crossref every week.', 'No hay nada que hacer: se muestran sin citas. Se revisa en Crossref cada semana.'],
  howChecked: ['Which ones and how it was checked', 'Cuáles son y cómo se revisó'],
  howNd: ['Crossref is the registry where journals and publishers register the DOIs of what they publish. Every Monday the collector looks up the journal there (by ISSN if ORCID provides it, otherwise by its exact name) or the book (by ISBN), and also the work itself by title and author. If the journal or book is not in Crossref and the work does not show up either, the work has no DOI. To check it yourself, open «Check»: if it says "Resource not found" or "total-results": 0, it is not in Crossref. If the journal ever starts using DOIs, the work goes back to the pending list on its own.',
          'Crossref es el registro donde las revistas y editoriales inscriben los DOI de lo que publican. Cada lunes el recolector busca ahí la revista (por ISSN si ORCID lo trae; si no, por su nombre exacto) o el libro (por ISBN), y también la obra misma por título y autor. Si la revista o el libro no está en Crossref y la obra tampoco aparece, la obra no tiene DOI. Para comprobarlo tú, abre «Comprobar»: si dice "Resource not found" o "total-results": 0, no está en Crossref. Si algún día la revista empieza a usar DOI, la obra vuelve sola a los pendientes.'],
  pendOw: ['Works only in ORCID without a DOI', 'Obras solo en ORCID sin DOI'], pendOws: ['They are shown without citations. If they have a DOI, add it in ORCID so the site can look up their citations.', 'Se muestran sin citas. Si tienen DOI, agrégalo en ORCID para que el sitio pueda buscar sus citas.'],
  pendMd: ['Hand-entered items missing essential data', 'Contenido cargado a mano sin datos esenciales'], pendMds: ['They are not shown. They lack a title, an area or, for places and awards, the year.', 'No se muestran. Les falta el título, el área o, en lugares y premios, el año.'],
  pendMl: ['Places and awards without a location', 'Lugares y premios sin ubicación'], pendMls: ['They appear in Journey but not on the map. Add their coordinates in the hand-entered content.', 'Aparecen en Trayectoria pero no en el mapa. Agrega sus coordenadas en el contenido manual.'], seeMan: ['See content', 'Ver contenido'], present: ['present', 'actualidad'], mapBase: ['Base map', 'Mapa base'],
  'proj.sub': ['Grants and research projects.', 'Fondos y proyectos de investigación.'], on: ['Ongoing', 'En curso'], done: ['Completed', 'Finalizado'],
  'writing.sub': ['Essays, magazine and educational content.', 'Ensayos, revista y contenido educativo.'],
  'work.sub': ['Supervision, collaboration and consulting.', 'Supervisión, colaboración y consultoría.'], contact: ['Contact', 'Contacto'],
  cv: ['↓ Download CV (PDF)', '↓ Descargar CV (PDF)'], cvNote: ['The CV PDF is generated with the same data as the site, so it is always up to date.', 'El CV en PDF se genera con los mismos datos del sitio, así que siempre está al día.'],
  cvGen: ['CV generated', 'CV generado'], cvSoon: ['Prototype: the CV PDF will be generated by the weekly workflow.', 'Prototipo: el CV en PDF lo generará el flujo semanal.'],
  'src.sub': ['Where every datum on this site comes from and how it is obtained.', 'De dónde viene cada dato de este sitio y cómo se obtiene.'],
  how: ['How the site updates itself', 'Cómo se actualiza el sitio solo'], srcList: ['Sources', 'Fuentes'],
  'st.ok': ['Active', 'Activa'], 'st.wait': ['Pending access', 'Pendiente de acceso'], 'st.plan': ['In development', 'En desarrollo'], 'st.block': ['Not available', 'No disponible'], 'st.err': ['Failed last sync', 'Falló la última sincronización'],
  seals: ['Verification seals', 'Sellos de verificación'], sealsSub: ['Share of the {n} publications confirmed by each source (checked {d}).', 'Porcentaje de las {n} publicaciones confirmadas por cada fuente (consultado el {d}).'],
  readSeals: ['How to read the seals', 'Cómo leer los sellos'], pending: ['pending', 'pendiente'], citesBy: ['Citations according to each source', 'Citas según cada fuente'],
  citesNote: ['Each database counts citations differently, so the figures do not match. The site shows them side by side instead of picking one. Semantic Scholar: sum over the publications it indexes.', 'Cada base de datos cuenta las citas de forma distinta, por eso las cifras no coinciden. El sitio las muestra lado a lado en vez de elegir una. Semantic Scholar: suma de las publicaciones que indexa.'],
  synced: ['last sync', 'última sincronización'],
  /* admin */
  admK: ['ADMINISTRATOR VIEW', 'VISTA DE ADMINISTRADOR'], admHelp: ['Hover a text to edit it', 'Pasa el cursor sobre un texto para editarlo'],
  admPend: ['2 unpublished changes', '2 cambios sin publicar'], myPanel: ['My panel', 'Mi panel'], viewAs: ['View as visitor', 'Ver como visitante'],
  edit: ['✎ Edit', '✎ Editar'], photos: ['✎ Manage photos ({n})', '✎ Gestionar fotos ({n})'], cancel: ['Cancel', 'Cancelar'], save: ['Save', 'Guardar'],
  editedNow: ['edited now', 'editado ahora'], chars: ['characters', 'caracteres'],
  toConfirm: ['{n} publications with a line to confirm', '{n} publicaciones con línea por confirmar'], bulkRev: ['Bulk review in My panel →', 'Revisar en lote en Mi panel →'],
  confirmedN: ['lines confirmed', 'líneas confirmadas'], hiddenN: ['hidden', 'ocultas'], acceptAll: ['✓ Accept all suggestions', '✓ Aceptar todas las sugerencias'],
  line: ['LINE', 'LÍNEA'], sugBy: ['suggested from title and topics', 'sugerida por título y temas'], confBy: ['confirmed by Tomás', 'confirmada por Tomás'],
  toReview: ['To review', 'Por revisar'], confirm: ['✓ Confirm', '✓ Confirmar'], confirmedS: ['✓ Confirmed', '✓ Confirmada'], change: ['Change', 'Cambiar'],
  hide: ['Hide from site', 'Ocultar del sitio'], hiddenS: ['Hidden', 'Oculta'], show: ['Show on site', 'Mostrar en el sitio'], visNo: ['the visitor does not see it', 'el visitante no la ve'],
  subarea: ['SUB-AREA', 'SUBÁREA'], alsoIn: ['ALSO IN', 'TAMBIÉN EN'], add: ['+ Add', '+ Agregar'], rename: ['✎ Rename sub-areas', '✎ Renombrar subáreas'],
  oneSub: ['Each item belongs to a single sub-area. «Also in» is only added by Tomás; it is never automatic.', 'Cada elemento pertenece a una sola subárea. «También en» solo lo agrega Tomás; nunca es automático.'],
  addContent: ['Add content', 'Agregar contenido'], addTo: ['to {s}', 'a {s}'], oProj: ['Project', 'Proyecto'], oTalk: ['Talk or event', 'Charla o evento'], oWr: ['Writing', 'Escrito'], oWork: ['Work', 'Obra'],
  pickExisting: ['Pick from existing content', 'Elegir de lo existente'],
  cfgT: ['Set up the free profile', 'Configurar el perfil libre'], cfgS: ['Until you publish it, visitors see a reserved space.', 'Mientras no lo publiques, los visitantes ven un espacio reservado.'],
  fName: ['Name', 'Nombre'], fDesc: ['Description', 'Descripción'], missTr: ['Translation missing', 'Falta la traducción'], icon: ['Icon', 'Ícono'],
  color: ['Color', 'Color'], colorNote: ['different from the other three profiles', 'distinto de los otros tres perfiles'], subs: ['Sub-areas', 'Subáreas'], ofN: ['of', 'de'],
  addSub: ['+ Add sub-area', '+ Agregar subárea'], publishP: ['Publish profile', 'Publicar perfil'], draft: ['Save draft', 'Guardar borrador'], preview: ['PREVIEW', 'VISTA PREVIA'], tag22: ['22 px tag', 'etiqueta a 22 px'],
  teal: ['Teal', 'Verde azulado'], ochre: ['Ochre', 'Ocre'], slate: ['Slate', 'Grafito'],
  staticT: ['Static template: in the pilot this change is made through the form.', 'Plantilla estática: en el piloto este cambio se hace por formulario.'],
  /* panel */
  pSum: ['Summary', 'Resumen'], pPubs: ['Publications', 'Publicaciones'], pProf: ['Profiles and sub-areas', 'Perfiles y subáreas'], pMan: ['Manual content', 'Contenido manual'], pSrc: ['Sources', 'Fuentes'],
  view: ['View', 'Vista'], visitor: ['Visitor', 'Visitante'], panelS: ['MY PANEL', 'MI PANEL'],
  sumSub: ['The site rebuilds itself every week with GitHub Actions.', 'El sitio se reconstruye solo cada semana con GitHub Actions.'], updNow: ['↻ Update now', '↻ Actualizar ahora'],
  lastUpd: ['LAST UPDATE', 'ÚLTIMA ACTUALIZACIÓN'], nextUpd: ['NEXT', 'PRÓXIMA'], pubFigs: ['PUBLISHED FIGURES', 'CIFRAS PUBLICADAS'], correct: ['Correct', 'Correcta'], weeklyC: ['Weekly', 'Semanal'],
  figsNote: ['publications · citations · h · i10 (OpenAlex)', 'publicaciones · citas · h · i10 (OpenAlex)'], pendT: ['Pending', 'Pendientes'],
  pend1: ['Publications with a line to confirm', 'Publicaciones con línea por confirmar'], pend1s: ['Suggested automatically; confirm them in bulk.', 'Sugeridas automáticamente; confírmalas en lote.'], review: ['Review', 'Revisar'],
  pend2: ['Free profile not defined', 'Perfil libre sin definir'], pend2s: ['Visitors see a reserved space.', 'Los visitantes ven un espacio reservado.'], configure: ['Configure', 'Configurar'],
  pend3: ['Empty sub-areas in {p}', 'Subáreas vacías en {p}'],
  revT: ['Publication review', 'Revisión de publicaciones'], revS: ['The line is suggested from the title and OpenAlex topics. Confirm it once; new ones are classified with the same rules.', 'La línea se sugiere a partir del título y los temas de OpenAlex. Confírmala una vez; las nuevas se clasifican con las mismas reglas.'],
  fAll: ['All', 'Todas'], fRev: ['To review', 'Por revisar'], fConf: ['Confirmed', 'Confirmadas'], fHid: ['Hidden', 'Ocultas'], searchT: ['Search title…', 'Buscar título…'],
  selected: ['{n} selected', '{n} seleccionadas'], acceptSel: ['✓ Accept selected suggestions', '✓ Aceptar sugerencias seleccionadas'], changeLine: ['Change line ▾', 'Cambiar línea ▾'], clearSel: ['Clear selection', 'Quitar selección'],
  thTitle: ['TITLE', 'TÍTULO'], thYear: ['YEAR', 'AÑO'], thLine: ['SUGGESTED LINE', 'LÍNEA SUGERIDA'], thState: ['STATE', 'ESTADO'], thAct: ['ACTIONS', 'ACCIONES'],
  confirmB: ['Confirm', 'Confirmar'], hideB: ['Hide', 'Ocultar'], showing: ['Showing {a} of {b}', 'Mostrando {a} de {b}'],
  profT: ['Profiles and sub-areas', 'Perfiles y subáreas'], profS: ['Up to 4 profiles (the main one is fixed) and up to 4 sub-areas per profile.', 'Hasta 4 perfiles (el principal es fijo) y hasta 4 subáreas por perfil.'],
  fixed: ['fixed', 'fijo'], renameB: ['Rename', 'Renombrar'], iconColor: ['Icon and color', 'Ícono y color'], notDef: ['Not defined', 'Sin definir'],
  manT: ['Manual content', 'Contenido manual'], manS: ['What does not come from any source. In the pilot it is loaded through the backup form.', 'Lo que no viene de ninguna fuente. En el piloto se carga con el formulario de respaldo.'],
  carPh: ['Carousel photos', 'Fotos del carrusel'], siteTxt: ['Site texts', 'Textos del sitio'], role: ['Role', 'Rol'], bio: ['About', 'Acerca de'],
  both: ['ES · EN', 'ES · EN'], awards: ['Awards', 'Premios'], courses: ['Courses', 'Cursos'], works2: ['Works', 'Obras'], projectsT: ['Projects', 'Proyectos'], talksT: ['Talks and events', 'Charlas y eventos'], writingT: ['Writing', 'Escritos'],
  noneYet: ['Nothing yet.', 'Aún no hay nada.'],
  srcT: ['Sources', 'Fuentes'], srcS: ['State of each weekly synchronisation (real data from the last run).', 'Estado de cada sincronización semanal (datos reales de la última ejecución).'],
  thSrc: ['SOURCE', 'FUENTE'], thSt: ['STATE', 'ESTADO'], thLast: ['LAST SYNC', 'ÚLTIMA SINCRONIZACIÓN'], thRes: ['RESULT', 'RESULTADO'], syncNow: ['Sync now', 'Sincronizar ahora'], addKey: ['Add key', 'Agregar clave'],
  resN: ['{n} records', '{n} registros'],
};
const t = (k, v) => { let s = L(T[k]) ?? k; if (v) for (const x in v) s = s.replace('{' + x + '}', v[x]); return s; };

/* ---------- fechas y procedencia ---------- */
const MES = { en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'] };
const fd = iso => { if (!iso) return '—'; const [y, m, d] = iso.split('-').map(Number); return `${d} ${MES[lang][m - 1]} ${y}`; };
const prov = (auto, label, date, extra) => `<span class="prov"><b>${auto ? '■' : '□'}</b>${esc(label)}${date ? ' · ' + fd(date) : ''}${extra ? ' · ' + esc(extra) : ''}</span>`;

/* ---------- datos ---------- */
const PROF = C.perfiles.perfiles;
const PK = ['research', 'cooperation', 'inter', 'free'];
const PVAR = { research: '--p-research', cooperation: '--p-coop', inter: '--p-inter', free: '--p-free' };
const pc = k => `var(${PVAR[k]})`;
const ALL_WORKS = DD.publicaciones.obras;
const WORKS = ALL_WORKS.filter(w => ADMIN || !w.oculta);
const VIS = ALL_WORKS.filter(w => !w.oculta);
const LINES = PROF.research.subs;
/* ---------- datos incompletos (ADR 0011) ----------
   Lo que no tiene lo esencial no se muestra y se cuenta en Mi panel; lo demás se muestra sin el dato que falta.
   Esencial: título y área (eventos, proyectos, escritos); nombre y año (lugares, premios).
   Para el mapa además hacen falta coordenadas válidas. */
const tiene = v => Array.isArray(v) ? v.some(x => x != null && String(x).trim() !== '') : v != null && String(v).trim() !== '';
const okLL = ll => Array.isArray(ll) && ll.length === 2 && ll.every(Number.isFinite);
const anio = y => { const m = String(y ?? '').match(/\d{4}/); return m ? +m[0] : NaN; };
const areaOk = s => tiene(s) && !!PROF[String(s).split('.')[0]];
const MAN_RAW = { ev: C.eventos.eventos, pr: C.proyectos.proyectos, wr: C.escritos.escritos, lu: C.lugares.lugares, aw: C.premios.premios };
const MAN_FALTA = {  // campos esenciales que faltan, por tipo
  ev: x => [!tiene(x.title) && 'mTitle', !areaOk(x.s) && 'mArea'], pr: x => [!tiene(x.t) && 'mTitle', !areaOk(x.s) && 'mArea'],
  wr: x => [!tiene(x.t) && 'mTitle', !areaOk(x.s) && 'mArea'],
  lu: x => [!tiene(x.n) && 'mName', !Number.isFinite(anio(x.y)) && 'mYear'], aw: x => [!tiene(x.t) && 'mTitle', !Number.isFinite(anio(x.y)) && 'mYear'],
};
const manNombre = (k, x) => L(k === 'ev' ? x.title : k === 'lu' ? x.n : x.t);
const MAN = Object.fromEntries(Object.entries(MAN_RAW).map(([k, xs]) => [k, (xs || []).filter(x => !MAN_FALTA[k](x).some(Boolean))]));
const MAN_OCULTOS = Object.entries(MAN_RAW).flatMap(([k, xs]) => (xs || []).map(x => ({ k, x, falta: MAN_FALTA[k](x).filter(Boolean) })).filter(o => o.falta.length));
const MAN_SIN_LL = [...MAN.lu.map(x => ({ k: 'lu', x })), ...MAN.aw.map(x => ({ k: 'aw', x }))].filter(o => !okLL(o.x.ll));
const ITEMS = [
  ...MAN.ev.map(x => ({ ...x, typ: 'ev' })),
  ...MAN.pr.map(x => ({ ...x, typ: 'pr' })),
  ...MAN.wr.map(x => ({ ...x, typ: 'wr' })),
];
const profOf = s => s.split('.')[0];
const subOf = s => (PROF[profOf(s)].subs || []).find(x => x.id === s.split('.')[1]);
const subName = s => L(subOf(s)?.t) || s;
const subHref = s => profOf(s) === 'research' ? `#home/line-${s.split('.')[1]}` : `#area-${s.replace('.', '/')}`;
const inSub = (it, s) => it.s === s || (it.also || []).includes(s);
const inProf = (it, k) => [it.s, ...(it.also || [])].some(s => profOf(s) === k);
const domain = u => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };
const TYPES = { article: ['Article', 'Artículo'], 'conference-paper': ['Conference paper', 'Ponencia'], preprint: ['Preprint', 'Preprint'], 'book-chapter': ['Book chapter', 'Capítulo de libro'], book: ['Book', 'Libro'], editorial: ['Editorial', 'Editorial'], dissertation: ['Thesis', 'Tesis'], review: ['Review', 'Revisión'], other: ['Other', 'Otro'] };
const tyName = k => L(TYPES[k] || [k, k]);
const VS = { crossref: 'Crossref', datacite: 'DataCite', s2: 'Semantic Scholar', zbmath: 'zbMATH Open', arxiv: 'arXiv', dblp: 'DBLP' };
const vcount = w => Object.keys(VS).filter(k => w.vf && w.vf[k]).length;
const REPO = /repositor|figshare|vubir|escholarship|circle|zenodo|cornell university/i;

/* ---------- avatares (SVG geométrico, viewBox 24) ---------- */
const GLYPH = {
  research: '<path d="M8 15.5L16 15.5L12 8.5Z" fill="none" stroke="G" stroke-width="1.3" stroke-linejoin="round"/><circle cx="8" cy="15.5" r="2.5" fill="G"/><circle cx="16" cy="15.5" r="2.5" fill="G"/><circle cx="12" cy="8.5" r="2.5" fill="G"/>',
  cooperation: '<circle cx="9.3" cy="12" r="4.4" fill="G" fill-opacity=".78"/><circle cx="14.7" cy="12" r="4.4" fill="G" fill-opacity=".78"/>',
  inter: '<circle cx="12" cy="9.4" r="3.6" fill="G" fill-opacity=".78"/><circle cx="9.4" cy="14" r="3.6" fill="G" fill-opacity=".78"/><circle cx="14.6" cy="14" r="3.6" fill="G" fill-opacity=".78"/>',
  squares: '<rect x="7" y="7" width="6.5" height="6.5" fill="G" fill-opacity=".78"/><rect x="10.5" y="10.5" width="6.5" height="6.5" fill="G" fill-opacity=".78"/>',
  rings: '<circle cx="12" cy="12" r="5.5" fill="none" stroke="G" stroke-width="1.6"/><circle cx="12" cy="12" r="2.4" fill="G"/>',
  diamond: '<path d="M12 6.5L17.5 12L12 17.5L6.5 12Z" fill="G" fill-opacity=".85"/>',
};
function av(k, size, inv, color) {
  const c = color || pc(k);
  if (k === 'free' && !color) return `<span class="av" style="width:${size}px;height:${size}px" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="11" fill="none" stroke="var(--muted)" stroke-dasharray="2.4 2" stroke-width=".8"/><path d="M12 7.5v9M7.5 12h9" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round"/></svg></span>`;
  const g = (GLYPH[k] || GLYPH.squares).replace(/G/g, inv ? c : 'var(--on-p)');
  return `<span class="av" style="width:${size}px;height:${size}px" aria-hidden="true"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="${inv ? 'var(--on-p)' : c}"/>${g}</svg></span>`;
}
const tag = s => `<a class="tag" href="${subHref(s)}">${av(profOf(s), 22)}${esc(subName(s))}</a>`;
const alsoTags = it => (it.also || []).length ? `<span class="also">${t('also')} ${it.also.map(tag).join(' ')}</span>` : '';

/* ---------- admin: utilidades estáticas ---------- */
const edBtn = () => ADMIN ? `<button class="edbtn" type="button" data-static>${t('edit')}</button>` : '';
const ed = (tagName, cls, html) => ADMIN ? `<${tagName} class="${cls} ed" tabindex="0">${html}${edBtn()}</${tagName}>` : `<${tagName} class="${cls}">${html}</${tagName}>`;
function lineSelect(cur) {
  return `<select class="admin-sel" data-static aria-label="${t('line')}">${LINES.map(l => `<option ${l.id === cur ? 'selected' : ''}>${esc(L(l.t))}</option>`).join('')}<option ${!cur ? 'selected' : ''}>${t('noLine')}</option></select>`;
}
function subSelect(cur) {
  return `<select class="admin-sel" data-static aria-label="${t('subarea')}">${PK.filter(k => (PROF[k].subs || []).length).map(k => `<optgroup label="${esc(L(PROF[k].t))}">${PROF[k].subs.map(s => `<option ${k + '.' + s.id === cur ? 'selected' : ''}>${esc(L(PROF[k].t))} · ${esc(L(s.t))}</option>`).join('')}</optgroup>`).join('')}</select>`;
}
let toastTimer;
function toast(msg) {
  let el = $('.toast'); if (!el) { el = document.createElement('div'); el.className = 'toast'; el.setAttribute('role', 'status'); document.body.append(el); }
  el.textContent = msg; el.hidden = false; clearTimeout(toastTimer); toastTimer = setTimeout(() => el.hidden = true, 3200);
}

/* ---------- cabecera ---------- */
const NAV = [['home', 'nav.home'], ['publications', 'nav.pubs'], ['talks', 'nav.talks'], ['journey', 'nav.journey'], ['projects', 'nav.projects'], ['writing', 'nav.writing'], ['work', 'nav.work'], ['sources', 'nav.sources']];
let theme = store.get('theme') || 'system';
function applyTheme() {
  if (theme === 'system') document.documentElement.removeAttribute('data-theme'); else document.documentElement.dataset.theme = theme;
  mapTiles && mapTiles();
}
const isDark = () => theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
function header(page) {
  const links = NAV.map(([id, k]) => `<a href="#${id}" ${page === id ? 'aria-current="page"' : ''}>${t(k)}</a>`).join('');
  return `${ADMIN ? adminBar(page) : ''}<header class="hdr"><div class="hdr-in">
    <a class="brand" href="#home">${esc(C.perfil.nombre)}</a>
    <nav class="nav" aria-label="${t('nav.home')}">${links}</nav>
    <div class="tools"><span class="seg" role="group" aria-label="Language / Idioma"><button type="button" data-lang="en" aria-pressed="${lang === 'en'}">EN</button><button type="button" data-lang="es" aria-pressed="${lang === 'es'}">ES</button></span>
      <button type="button" class="themebtn" data-toggle-theme>${isDark() ? t('light') : t('dark')}</button></div>
    <div style="display:flex;gap:8px;align-items:center" class="mob"><span class="langmini">${lang.toUpperCase()}</span><button type="button" class="menubtn" data-menu aria-expanded="false">${t('menu')}</button></div>
  </div></header>`;
}
function sheet(page) {
  return `<div class="sheet" role="dialog" aria-modal="true" aria-label="Menu"><div class="sheet-top"><span class="brand">${esc(C.perfil.nombre)}</span><button type="button" class="sheet-close" data-close>${t('close')}</button></div>
    <nav>${NAV.map(([id, k]) => `<a href="#${id}" ${page === id ? 'aria-current="page"' : ''}>${t(k)}</a>`).join('')}</nav>
    <div class="sheet-foot"><div>${t('langRem')}</div><span class="seg"><button type="button" data-lang="en" aria-pressed="${lang === 'en'}">English</button><button type="button" data-lang="es" aria-pressed="${lang === 'es'}">Español</button></span>
    <div>${t('theme')}</div><span class="seg">${['light', 'dark', 'system'].map(x => `<button type="button" data-theme-set="${x}" aria-pressed="${theme === x}">${t(x === 'light' ? 'tLight' : x === 'dark' ? 'tDark' : 'tSys')}</button>`).join('')}</span></div></div>`;
}
function adminBar(page) {
  let help = t('admHelp'), right = `<span class="pend">${t('admPend')}</span><a class="ob" href="#panel">${t('myPanel')}</a>`;
  if (page === 'publications') { const n = VIS.filter(w => w.linea_estado !== 'confirmada').length; help = t('toConfirm', { n }); right = `<a class="ob" href="#panel/pubs">${t('bulkRev')}</a>`; }
  return `<div class="adminbar"><div class="in"><span class="k">${t('admK')}</span><span class="h">${help}</span><span class="sp"></span>${right}
    <span class="vsw"><a class="on" href="#${esc(location.hash.slice(1) || 'home')}">Tomás</a><a href="index.html${esc(location.hash)}">${t('viewAs')}</a></span></div></div>`;
}
const footer = () => `<footer class="foot"><div class="wrap" style="display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap"><span>${t('footer')} · ${fd(GEN)}</span>${ADMIN ? '' : `<a href="admin.html${esc(location.hash)}">${t('adminLink')}</a>`}</div></footer>`;
const pageHead = (title, lead, provHtml) => `<h1 class="h1">${title}</h1><p class="lead">${lead}</p><div style="margin-top:10px">${provHtml}</div>`;

/* ---------- inicio ---------- */
let ci = 0, carTimer = null, carPaused = false;
function home(line) {
  const P = C.perfil, st = DD.perfil.stats, photos = P.fotos;
  const latest = VIS.slice(0, 4);
  const others = PK.filter(k => k !== 'research');
  const upnext = [...MAN.ev].sort((a, b) => (anio(b.y) || 0) - (anio(a.y) || 0)).slice(0, 3);
  return `<div class="wrap">
  <section class="hero">
    <div class="hero-txt">
      <div class="eyebrow" style="color:var(--p-research)">${av('research', 22)}${t('mainP')} · ${t('researcher')}</div>
      <h1>${esc(P.titulo)}</h1>
      ${ed('p', 'role', esc(L(P.rol)))}
      <div class="affs">${P.afiliaciones.map(a => `<div><b>${esc(a.o)}</b><span>${esc(L(a.r))}</span></div>`).join('')}</div>
      <div class="hero-acts"><a class="btn solid" href="mailto:${esc(P.email)}">${t('contact')}</a>
        <span class="ids"><a href="https://orcid.org/0000-0003-3014-8340" target="_blank" rel="noopener">ORCID ↗</a><a href="https://scholar.google.com/citations?user=q7HbZQ4AAAAJ" target="_blank" rel="noopener">Google Scholar ↗</a><a href="https://www.scopus.com/authid/detail.uri?authorId=36873504800" target="_blank" rel="noopener">Scopus ↗</a></span></div>
      ${prov(false, t('manual'), P.actualizado)}
    </div>
    <div class="carousel" aria-roledescription="carousel" aria-label="Fotos">
      <div class="imgw"><img id="carImg" src="${esc(photos[ci].src)}" alt="${esc(L(photos[ci].d))}" width="380" height="460">${ADMIN ? `<button class="photobadge" type="button" data-static>${t('photos', { n: photos.length })}</button>` : ''}</div>
      <div class="car-foot"><div class="car-cap" aria-live="polite"><b id="carD">${esc(L(photos[ci].d))}</b><span id="carL">${esc(L(photos[ci].lugar))}</span></div>
        <div class="car-ctl"><button class="sq" type="button" data-car="-1" aria-label="‹">‹</button><span class="mono" id="carN">${ci + 1}/${photos.length}</span><button class="sq" type="button" data-car="1" aria-label="›">›</button></div></div>
      ${prov(false, t('manual'), P.actualizado, t('stopsRM').toLowerCase())}
    </div>
  </section>
  <div class="pcards">${others.map(k => profileCard(k)).join('')}</div>
  </div>
  <section class="stats"><div class="wrap stats-in">
    ${[['works', st.works], ['cites', st.cites], ['h', st.h], ['i10', st.i10]].map(([k, v]) => `<div class="stat"><b>${v ?? '—'}</b><span>${t('st.' + k)}</span></div>`).join('')}
    ${prov(true, 'OpenAlex', DD.perfil.generado, t('weekly'))}
  </div></section>
  <div class="wrap">
  <div class="grid-about sec">
    <section class="about"><div class="sec-h"><h2 class="h2">${t('about')}</h2>${prov(false, t('manual'), P.actualizado)}</div>
      ${ADMIN ? aboutEditor() : `<p>${esc(L(P.bio))}</p>`}</section>
    <section class="latest"><div class="sec-h"><h2 class="h2">${t('latest')}</h2>${prov(true, 'OpenAlex')}</div>
      ${latest.map(w => `<a href="${w.doi ? 'https://doi.org/' + esc(w.doi) : '#publications'}" ${w.doi ? 'target="_blank" rel="noopener"' : ''}><div class="t">${esc(w.t)}</div><div class="m">${w.y || ''}${w.v ? ' · ' + esc(venue(w)) : ''}</div></a>`).join('')}
      <a class="more" href="#publications">${t('seeAll', { n: VIS.length })}</a></section>
  </div>
  <section class="sec" id="lines"><div class="sec-h" style="margin-bottom:4px"><h2 class="h2">${t('lines')}</h2>${prov(true, t('autoAssign'))}</div>
    <p class="muted" style="font-size:14.5px;margin-bottom:16px">${t('linesSub')}</p>
    ${linesList(line)}${line ? linePanel(line) : ''}</section>
  <section class="sec"><div class="sec-h"><h2 class="h2">${t('upnext')}</h2>${prov(false, t('manual'), C.eventos.actualizado)}</div>
    <div class="upnext">${upnext.map(e => `<article style="--pc:${pc(profOf(e.s))}"><div class="eyebrow" style="font-size:11px;color:var(--muted)">${av(profOf(e.s), 22)}${esc(L(e.kind))}</div><div class="t">${esc(e.title)}</div><div class="m">${esc(e.when)} · ${esc(e.place)}</div></article>`).join('')}</div></section>
  </div>`;
}
function aboutEditor() {
  const txt = L(C.perfil.bio);
  return `<div class="editor"><div class="bar2"><b>${t('about')}</b><span class="lseg"><span class="${lang === 'es' ? 'on' : ''}">ES</span><span class="${lang === 'en' ? 'on' : ''}">EN</span></span>
    <span class="prov">□ ${t('form')} · ${t('editedNow')} · ${txt.length} / 900 ${t('chars')}</span>
    <span class="acts"><button class="btn lite sm" type="button" data-static>${t('cancel')}</button><button class="btn solid sm" type="button" data-static>${t('save')}</button></span></div>
    <textarea aria-label="${t('about')}">${esc(txt)}</textarea></div>`;
}
function profileCard(k, small) {
  const p = PROF[k], free = k === 'free' && !(p.subs || []).length;
  return `<a class="pcard${small ? ' sm' : ''}" href="#area-${k}">${av(k, small ? 40 : 84)}<div><div class="t">${esc(L(p.t))}</div><div class="r">${esc(L(p.r))}</div>${small ? '' : `<div class="go" style="color:${free ? 'var(--ink)' : pc(k)}">${free ? t('reserved') : t('viewP')}</div>`}</div></a>`;
}
function linesList(line) {
  const counts = Object.fromEntries(LINES.map(l => [l.id, VIS.filter(w => w.linea === l.id).length]));
  const max = Math.max(...Object.values(counts), 1);
  const row = (id, name, n, pct) => `<button type="button" class="lrow" role="radio" aria-checked="${(line || null) === id}" data-line="${id || ''}"><span class="rad"></span><span>${esc(name)}</span><span class="bar"><i style="width:${pct}%"></i></span><span class="n">${n}</span></button>`;
  return `<div class="lines" role="radiogroup" aria-label="${t('lines')}">${row(null, t('allLines'), VIS.length, 100)}${LINES.map(l => row(l.id, L(l.t), counts[l.id], counts[l.id] / max * 100)).join('')}</div>`;
}
function linePanel(id) {
  const l = LINES.find(x => x.id === id); if (!l) return '';
  const ws = VIS.filter(w => w.linea === id), cites = ws.reduce((s, w) => s + (w.c || 0), 0);
  const top = [...ws].sort((a, b) => (b.c || 0) - (a.c || 0)).slice(0, 5);
  const rel = ITEMS.filter(it => it.typ !== 'wr' && inSub(it, 'research.' + id));
  const kindLabel = it => it.typ === 'pr' ? `${esc(L(it.k))} · ${t(it.st === 'on' ? 'on' : 'done')}` : esc(L(it.kind));
  return `<div class="lpanel">
    <div><h3 class="h3" style="font-size:24px">${esc(L(l.t))}</h3><p class="muted" style="font-size:14.5px;margin-top:4px">${esc(L(l.d))}</p>
      <div class="sub-eb">${t('mostCited')}</div>
      ${top.map(w => `<div class="mini"><div><div class="t">${esc(w.t)}</div><div class="m">${w.y || ''} · ✓ ${vcount(w)} ${t('sources')}</div></div><div class="c">${w.c ?? '—'}</div></div>`).join('')}
      <a class="more" style="font-size:13.5px" href="#publications/line-${id}">${t('seeLine', { n: ws.length })}</a></div>
    <div><div class="figs"><div><b>${ws.length}</b><span>${t('inLine')}</span></div><div><b>${cites}</b><span>${t('cites')} · ■ OpenAlex</span></div></div>
      <div class="sub-eb">${t('projTalks')} · ${prov(false, t('manual'))}</div>
      ${rel.length ? rel.map(it => `<a class="rel" href="${subHref(it.s)}">${av(profOf(it.s), 22)}<div><div class="k">${kindLabel(it)}${it.s !== 'research.' + id ? ' · ' + t('alsoLine') : ''}</div><div class="t">${esc(it.t || it.title)}</div><div class="m">${esc(it.typ === 'pr' ? `${it.o} · ${L(it.y)}` : `${it.when} · ${it.place}`)}</div></div></a>`).join('') : `<p class="muted" style="font-size:14px">${t('nothingLine')}</p>`}</div>
  </div>`;
}
function venue(w) {
  const cv = w.vf && w.vf.crossref && w.vf.crossref.venue;
  return cv && (!w.v || REPO.test(w.v)) ? cv : w.v;
}

/* ---------- perfil ---------- */
function itemCard(it) {
  const k = profOf(it.s);
  let panel = '', top, title, place, desc = L(it.d);
  if (it.typ === 'ev') {
    panel = it.link ? `<div class="preview"><span class="cap">${t('prevImg')} · ${esc(domain(it.link))}</span></div>`
      : `<div class="illu" style="--pc:${pc(k)}">${av(k, 72, true)}<span class="cap">${t('noImg')}</span></div>`;
    top = [L(it.kind), it.when]; title = it.title; place = it.place;
  } else if (it.typ === 'pr') {
    top = [L(it.k), t(it.st === 'on' ? 'on' : 'done')]; title = it.t; place = `${it.o} · ${L(it.y)}`;
  } else {
    top = [L(it.k), it.y]; title = it.t; place = domain(it.u);
  }
  const href = urlSegura(it.u || it.link);
  const titleH = href ? `<a href="${esc(href)}" target="_blank" rel="noopener" style="text-decoration:none">${esc(title)} ↗</a>` : esc(title);
  const adm = ADMIN ? `<div class="itemadm"><span class="lab">${t('subarea')}</span><span>${subSelect(it.s)}</span><span class="lab">${t('alsoIn')}</span>
    <span style="display:flex;flex-wrap:wrap;gap:6px">${(it.also || []).map(s => `<span class="xchip">${av(profOf(s), 22)}${esc(subName(s))} <button type="button" data-static aria-label="×" style="border:0;background:none">×</button></span>`).join('')}<button class="addchip" type="button" data-static>${t('add')}</button></span></div>` : '';
  return `<article class="ccard">${panel}<div class="cbody"><div class="top"><span>${esc(top[0])}</span><span>${esc(top[1])}</span></div>
    <div class="t">${titleH}</div><div class="pl">${esc(place)}</div><p class="d">${esc(desc)}</p>
    <div class="tagrow">${tag(it.s)}${alsoTags(it)}</div></div>${adm}</article>`;
}
function profilePage(k, sub) {
  const p = PROF[k]; if (!p) return home();
  const subs = p.subs || [];
  const crumb = `<nav class="crumb"><a href="#home">${t('home')}</a> / ${t('profiles')} / <span>${esc(L(p.t))}</span></nav>`;
  const head = `<div class="phead">${av(k, innerWidth < 760 ? 72 : 120)}<div style="min-width:0"><div class="eyebrow" style="color:${k === 'free' ? 'var(--muted)' : pc(k)}"><span style="color:var(--muted)">${t('profile')}</span> · ${esc(L(p.r))}</div>
    <h1>${esc(L(p.t))}</h1>${ed('p', 'lead', esc(k === 'free' && !subs.length ? t('freeSub') : L(p.sub)))}<div style="margin-top:8px">${prov(false, t('manual'), C.perfiles.actualizado)}</div></div></div>`;
  const others = `<section class="sec"><div class="sec-h"><h2 class="h2">${t('others')}</h2></div><div class="pcards">${PK.filter(x => x !== k).map(x => profileCard(x, true)).join('')}</div></section>`;
  if (k === 'free' && !subs.length) {
    if (ADMIN) return `<div class="wrap page">${freeConfig()}</div>`;
    return `<div class="wrap page">${crumb}${head}<div class="slots">${[1, 2, 3].map(i => `<div><small>0${i}</small><b>${t('subTBD')}</b></div>`).join('')}</div><p class="note">${t('freeNote')}</p>${others}</div>`;
  }
  const items = ITEMS.filter(it => inProf(it, k));
  const n = s => ITEMS.filter(it => inSub(it, k + '.' + s.id)).length;
  const tabs = `<div style="display:flex;align-items:flex-end;gap:12px"><div class="tabs" role="tablist" style="--pc:${pc(k)};flex:1"><a class="tab" role="tab" href="#area-${k}" aria-selected="${!sub}">${t('all')} <small>${items.length}</small></a>${subs.map(s => `<a class="tab" role="tab" href="#area-${k}/${s.id}" aria-selected="${sub === s.id}">${esc(L(s.t))} <small>${n(s)}</small></a>`).join('')}</div>${ADMIN ? `<button class="btn lite sm" type="button" data-static style="border:0">${t('rename')}</button>` : ''}</div>`;
  let body;
  if (!sub) {
    const grid = `<div class="subgrid" style="--pc:${pc(k)}">${subs.map(s => `<a href="#area-${k}/${s.id}" class="${n(s) ? 'has' : ''}"><div class="t">${esc(L(s.t))}<span>${n(s)}</span></div><p>${esc(L(s.d))}</p></a>`).join('')}</div>`;
    let band = '';
    if (k === 'cooperation') {
      const af = DD.perfil.afiliaciones, ctry = new Set(af.map(a => a.pais).filter(Boolean));
      MAN.lu.forEach(x => { if (tiene(x.c)) ctry.add(String(x.c).split(', ').pop()); });
      band = `<div class="band"><div><b>${ctry.size}</b><span>${t('countries')}</span></div><div><b>${af.length}</b><span>${t('insts')}</span></div>${prov(true, 'OpenAlex + ' + t('manual'))}</div>`;
    }
    body = `${grid}${band}<div class="cards" style="margin-top:${band ? 0 : 28}px">${items.map(itemCard).join('')}</div>`;
  } else {
    const s = subs.find(x => x.id === sub); if (!s) return profilePage(k);
    const its = ITEMS.filter(it => inSub(it, k + '.' + sub));
    const head2 = `<div style="margin:28px 0 20px"><h2 class="h2">${esc(L(s.t))} · ${its.length} ${its.length === 1 ? t('item1') : t('items')}</h2><p class="muted" style="margin-top:6px">${esc(L(s.d))}</p></div>`;
    if (its.length) body = head2 + `<div class="cards">${its.map(itemCard).join('')}</div>`;
    else {
      const alt = subs.find(x => n(x));
      body = `<div class="empty" style="margin-top:28px"><div class="k">${t('empty0')}</div><p>${t('emptyT')}</p>${alt ? `<a class="btn" href="#area-${k}/${alt.id}">${esc(L(alt.t))} · ${n(alt)} →</a>` : ''}</div>`
        + (ADMIN ? `<div class="addpanel"><b>${t('addContent')}</b> <span class="muted">${t('addTo', { s: esc(L(s.t)) })}</span><div class="opts">${['oProj', 'oTalk', 'oWr', 'oWork'].map(x => `<button type="button" data-static>+ ${t(x)}</button>`).join('')}</div><button class="btn lite sm" type="button" data-static style="margin-top:10px">${t('pickExisting')}</button></div>` : '');
    }
  }
  return `<div class="wrap page">${crumb}${head}${tabs}${body}${ADMIN ? `<p class="note">${t('oneSub')}</p>` : ''}${others}</div>`;
}
function freeConfig() {
  const ic = ['squares', 'rings', 'diamond', 'research', 'cooperation', 'inter'];
  const teal = isDark() ? '#5fc9b8' : '#0d6e66';
  return `<h1 class="h1" style="font-size:44px">${t('cfgT')}</h1><p class="lead">${t('cfgS')}</p>
  <div class="cfg" style="margin-top:28px"><div>
    <div class="form2"><label>${t('fName')} <small>ES</small><input value="Pintor" data-static></label><label>${t('fName')} <small>EN</small><input value="Painter" data-static></label>
      <label>${t('fDesc')} <small>ES</small><textarea rows="3" data-static>Pintura y obra visual</textarea></label><label>${t('fDesc')} <small>EN</small><textarea rows="3" class="miss" placeholder="${t('missTr')}" data-static></textarea></label></div>
    <div style="margin-top:24px"><b>${t('icon')}</b><div class="icons" style="margin-top:10px">${ic.map((g, i) => `<button type="button" aria-pressed="${i === 0}" data-static>${av(g, 40, false, teal)}</button>`).join('')}</div></div>
    <div style="margin-top:24px"><b>${t('color')}</b> <span class="prov">${t('colorNote')}</span><div class="swatches" style="margin-top:10px">${[['#0d6e66', 'teal'], ['#8a6100', 'ochre'], ['#59616f', 'slate']].map(([c, n], i) => `<button type="button" aria-pressed="${i === 0}" style="background:${c}" aria-label="${t(n)}" data-static></button>`).join('')}</div></div>
    <div style="margin-top:24px"><b>${t('subs')}</b> <span class="prov">2 ${t('ofN')} 4</span>
      ${[['Pintura', 'Painting'], ['Exposiciones', '']].map(([a, b]) => `<div style="display:grid;grid-template-columns:20px 1fr 1fr 32px;gap:10px;align-items:center;margin-top:10px"><span class="muted">⋮⋮</span><input class="admin-sel" style="height:46px" value="${a}" data-static><input class="admin-sel ${b ? '' : 'miss'}" style="height:46px" value="${b}" placeholder="${t('missTr')}" data-static><button type="button" data-static style="border:0;background:none;font-size:18px" aria-label="×">×</button></div>`).join('')}
      <button class="addchip" type="button" data-static style="margin-top:12px;min-height:44px">${t('addSub')}</button></div>
    <div style="display:flex;gap:8px;border-top:1px solid var(--line);margin-top:28px;padding-top:20px"><button class="btn solid" type="button" data-static>${t('publishP')}</button><button class="btn lite" type="button" data-static>${t('draft')}</button></div>
  </div>
  <aside class="box"><div class="eyebrow" style="color:var(--muted)">${t('preview')}</div><div style="display:flex;gap:16px;align-items:center;margin:18px 0;padding-bottom:18px;border-bottom:1px solid var(--line)">${av('squares', 84, false, teal)}<div><b style="font-size:17px">Pintor</b><div class="muted" style="font-size:14px">Pintura y obra visual</div></div></div>
    <span class="tag">${av('squares', 22, false, teal)}Pintura</span> <span class="muted" style="font-size:13px">· ${t('tag22')}</span></aside></div>`;
}

/* ---------- publicaciones ---------- */
const F = { q: '', type: '', line: '', verify: '', sort: 'year' };
function pubsPage(line) {
  if (line !== undefined) F.line = line;
  const pa = DD.perfil.por_anio, ys = pa.map(x => x[0]), y0 = Math.min(...ys), y1 = Math.max(...ys);
  const byY = Object.fromEntries(pa), max = Math.max(...pa.map(x => x[1]));
  const years = []; for (let y = y0; y <= y1; y++) years.push(y);
  const chart = `<div class="ychart" role="img" aria-label="${t('perYear')}">${years.map(y => `<div><small>${byY[y] || ''}</small><i style="height:${(byY[y] || 0) / max * 85}%"></i></div>`).join('')}</div>
    <div class="ylabels">${years.map(y => `<span>${y % 2 === 0 ? "'" + String(y).slice(2) : ''}</span>`).join('')}</div>`;
  const co = DD.perfil.coautores, cmax = co[0] ? co[0][1] : 1;
  const types = [...new Set(WORKS.map(w => w.ty))];
  const conf = VIS.filter(w => w.linea_estado === 'confirmada').length, hid = ALL_WORKS.filter(w => w.oculta).length;
  return `<div class="wrap page">${pageHead(t('nav.pubs'), t('pubs.sub'), prov(true, 'OpenAlex + ORCID', GEN))}
  ${ADMIN ? `<div class="admsum"><span class="big">${conf} / ${VIS.length}</span><span>${t('confirmedN')} · ${hid} ${t('hiddenN')}</span><span class="bar"><i style="width:${conf / VIS.length * 100}%"></i></span><button class="btn solid sm" type="button" data-static>${t('acceptAll')}</button><a class="btn sm" href="#panel/pubs">${t('bulkRev')}</a></div>` : `
  <div class="charts"><div class="box"><h3>${t('perYear')}</h3>${chart}</div>
    <div class="box"><h3>${t('coauthors')}</h3>${co.map(([n, c]) => `<div class="coa"><span>${esc(n)}</span><span class="bar"><i style="width:${c / cmax * 100}%"></i></span><span class="n">${c}</span></div>`).join('')}</div></div>`}
  <div class="filters">
    <input type="search" id="fq" placeholder="${t('search')}" value="${esc(F.q)}" aria-label="${t('search')}">
    <select id="ft" aria-label="${t('allTypes')}"><option value="">${t('allTypes')}</option>${types.map(x => `<option value="${x}" ${F.type === x ? 'selected' : ''}>${tyName(x)}</option>`).join('')}</select>
    <select id="fl" aria-label="${t('allLines')}"><option value="">${t('allLines')}</option>${LINES.map(l => `<option value="${l.id}" ${F.line === l.id ? 'selected' : ''}>${esc(L(l.t))}</option>`).join('')}<option value="none" ${F.line === 'none' ? 'selected' : ''}>${t('noLine')}</option></select>
    <select id="fv" aria-label="${t('vAll')}"><option value="">${t('vAll')}</option><option value="2" ${F.verify === '2' ? 'selected' : ''}>${t('v2')}</option><option value="0" ${F.verify === '0' ? 'selected' : ''}>${t('v0')}</option></select>
    <select id="fs" aria-label="${t('sRecent')}"><option value="year">${t('sRecent')}</option><option value="cites" ${F.sort === 'cites' ? 'selected' : ''}>${t('sCites')}</option></select>
  </div><div id="publist">${pubList()}</div></div>`;
}
function pubList() {
  const q = F.q.trim().toLowerCase();
  let ws = WORKS.filter(w => (!F.type || w.ty === F.type)
    && (!F.line || (F.line === 'none' ? !w.linea : w.linea === F.line))
    && (!F.verify || (F.verify === '2' ? vcount(w) >= 2 : vcount(w) === 0))
    && (!q || [w.t, w.v, ...(w.au || [])].join(' ').toLowerCase().includes(q)));
  if (F.sort === 'cites') ws = [...ws].sort((a, b) => (b.c || 0) - (a.c || 0));
  return `<p class="count">${ws.length} ${t('pubsN')} · ${t(F.sort === 'cites' ? 'citedFirst' : 'recentFirst')}</p>${ws.length ? ws.map(pubRow).join('') : `<p class="note">${t('noRes')}</p>`}`;
}
function pubRow(w) {
  const ks = Object.keys(VS).filter(k => w.vf && w.vf[k]);
  const au = (w.au || []).length > 8 ? w.au.slice(0, 8).join(', ') + ' ' + t('etal') : (w.au || []).join(', ');
  const ln = LINES.find(l => l.id === w.linea);
  const chip = ln ? `<a class="chip" href="#home/line-${ln.id}">${av('research', 22)}${esc(L(ln.t))}</a>` : `<span class="chip none">${t('noLine')}</span>`;
  const seals = ks.length ? `<span class="seals">${t('verBy')} ${ks.map(k => `<b title="${esc(w.vf[k].venue || w.vf[k].id || '')}">✓ ${VS[k]}</b>`).join(' ')}</span>` : `<span class="seals">${t('notVer')}</span>`;
  const cv = w.vf && w.vf.crossref && w.vf.crossref.venue, showFix = cv && w.v && REPO.test(w.v);
  const orc = w.fuentes.length === 1 && w.fuentes[0] === 'orcid' ? `<span class="seals">□ ${t('onlyOrcid')}</span>` : '';
  const adm = ADMIN ? (() => {
    if (w.oculta) return `<div class="admstrip"><span class="lab">${t('line')}</span>${lineSelect(w.linea)}<span class="why">${t('visNo')}</span><span class="sp"></span><span class="state hid">${t('hiddenS')}</span><button class="btn sm" type="button" data-static>${t('show')}</button></div>`;
    const c = w.linea_estado === 'confirmada';
    return `<div class="admstrip"><span class="lab">${t('line')}</span>${lineSelect(w.linea)}<span class="why">${t(c ? 'confBy' : 'sugBy')}</span><span class="sp"></span>${c ? `<span class="state ok">${t('confirmedS')}</span><button class="btn sm" type="button" data-static>${t('change')}</button>` : `<span class="state">${t('toReview')}</span><button class="btn solid sm" type="button" data-static>${t('confirm')}</button>`}<button class="btn lite sm" type="button" data-static>${t('hide')}</button></div>`;
  })() : '';
  return `<article class="pub ${w.oculta ? 'hid' : ''}"><div class="y">${w.y || '—'}</div><div>
    <h3 class="t">${w.doi ? `<a href="https://doi.org/${esc(w.doi)}" target="_blank" rel="noopener">${esc(w.t)}</a>` : esc(w.t)}</h3>
    ${au ? `<div class="au">${esc(au)}</div>` : ''}<div class="ve">${w.v || cv ? `<i>${esc(showFix ? cv : venue(w))}</i> · ` : ''}${tyName(w.ty)}</div>
    ${showFix ? `<div class="fix">${t('fix')} <b>${esc(cv)}</b></div>` : ''}
    <div class="row">${chip}${seals}${orc}</div>${adm}</div>
    <div class="c">${w.c ?? '—'} <small>${t('cites')}</small></div></article>`;
}

/* ---------- charlas, proyectos, escritos ---------- */
const PF = { talks: '', projects: '' };
function profChips(page, list) {
  const ks = PK.filter(k => k !== 'free' || list.some(it => profOf(it.s) === 'free'));
  return `<div class="pchips" role="group">${[['', t('allM'), list.length], ...ks.map(k => [k, L(PROF[k].t), list.filter(it => profOf(it.s) === k).length])]
    .map(([k, n, c]) => `<button type="button" class="pchip" data-pf="${page}:${k}" aria-pressed="${PF[page] === k}">${k ? av(k, 22) : ''}${esc(n)} <small>${c}</small></button>`).join('')}</div>`;
}
function talksPage() {
  const list = ITEMS.filter(it => it.typ === 'ev').sort((a, b) => b.y - a.y);
  const vis = list.filter(it => !PF.talks || profOf(it.s) === PF.talks);
  return `<div class="wrap page">${pageHead(t('nav.talks'), t('talks.sub'), prov(false, t('manual'), C.eventos.actualizado))}${profChips('talks', list)}
    <div class="cards">${vis.map(itemCard).join('')}</div><p class="note">${t('talks.note')}</p></div>`;
}
function projectsPage() {
  const list = ITEMS.filter(it => it.typ === 'pr');
  const vis = list.filter(it => !PF.projects || profOf(it.s) === PF.projects);
  return `<div class="wrap page">${pageHead(t('nav.projects'), t('proj.sub'), prov(false, t('manual'), C.proyectos.actualizado, 'ORCID Funding = 0'))}${profChips('projects', list)}
    <div class="fused">${vis.map(it => `<article style="--pc:${pc(profOf(it.s))}"><div class="top" style="display:flex;justify-content:space-between;gap:10px;font:500 11px var(--mono);letter-spacing:.06em;text-transform:uppercase;color:var(--muted)"><span>${esc(L(it.k))}</span><span class="st" style="color:var(--ink)"><span class="sq-i ${it.st === 'on' ? 'ok' : ''}"></span>${t(it.st === 'on' ? 'on' : 'done')}</span></div>
      <div class="t">${esc(it.t)}</div><div class="o">${esc(it.o)} · <span class="mono">${esc(L(it.y))}</span></div><p class="d">${esc(L(it.d))}</p>
      <div class="tagrow">${tag(it.s)}${alsoTags(it)}</div>${ADMIN ? `<div style="margin-top:8px">${subSelect(it.s)}</div>` : ''}</article>`).join('')}</div></div>`;
}
function writingPage() {
  const list = ITEMS.filter(it => it.typ === 'wr').sort((a, b) => b.y - a.y);
  return `<div class="wrap page">${pageHead(t('nav.writing'), t('writing.sub'), prov(false, t('manual'), C.escritos.actualizado, 'Medium · RSS: ' + t('st.plan').toLowerCase()))}
    <div class="wlist">${list.map(it => `<div class="wrow"><div class="y">${esc(it.y)}</div><div><div class="k">${esc(L(it.k))}</div>${tag(it.s)}</div>
      <div>${urlSegura(it.u) ? `<a class="t" href="${esc(urlSegura(it.u))}" target="_blank" rel="noopener">${esc(it.t)} ↗</a>` : `<span class="t">${esc(it.t)}</span>`}<p class="d">${esc(L(it.d))}</p><div class="u">${esc(domain(it.u))}</div></div></div>`).join('')}</div></div>`;
}
function workPage() {
  const P = C.perfil, ops = C.oportunidades.oportunidades, marks = ['ok', 'block', ''];
  return `<div class="wrap page">${pageHead(t('nav.work'), t('work.sub'), prov(false, t('manual'), C.oportunidades.actualizado))}
    <div class="work"><div class="modes">${ops.map((o, i) => `<div class="mode"><div class="top"><span>0${i + 1}</span><span class="badge"><span class="sq-i ${marks[i]}"></span>${esc(L(o.s))}</span></div>
      ${ed('h3', '', esc(L(o.t)))}<p>${esc(L(o.d))}</p></div>`).join('')}</div>
    <aside class="contact"><div class="eyebrow" style="font-size:11px;color:var(--muted)">${t('contact')}</div><div class="em">${esc(P.email)}</div><div class="muted">${esc(P.sedes)}</div>
      <div class="btns"><button class="btn solid" type="button" data-cv>${t('cv')}</button><a class="btn" href="https://orcid.org/0000-0003-3014-8340" target="_blank" rel="noopener">ORCID ↗</a></div>
      <p class="muted" style="font-size:14px">${t('cvNote')}</p><div style="margin-top:12px">${prov(true, t('cvGen'), GEN)}</div></aside></div></div>`;
}

/* ---------- trayectoria ---------- */
let year = null, playing = false, playTimer = null, map = null, markers = [], tiles = null, mapTiles = null;
const parseY = s => { const m = String(s).match(/\d{4}/g) || []; return [+m[0], m[1] ? +m[1] : +m[0]]; };
function places() {
  const out = DD.perfil.afiliaciones.filter(a => (a.anios || []).length).map(a => ({ n: a.n, c: [a.ciudad, a.pais].filter(Boolean).join(', '), ll: a.ll, a: a.anios[0], b: a.anios[a.anios.length - 1], k: 'aff' }));
  MAN.lu.forEach(x => { const [a, b] = parseY(x.y); out.push({ n: x.n, c: x.c || '', ll: okLL(x.ll) ? x.ll : null, a, b, k: 'ev' }); });
  MAN.aw.forEach(x => out.push({ n: L(x.t), c: x.o || '', ll: okLL(x.ll) ? x.ll : null, a: anio(x.y), b: anio(x.y), k: 'aw' }));
  orcidRows().ok.filter(r => r.k === 'edu' && (r.desde || r.hasta)).forEach(r => {
    const m = DD.perfil.afiliaciones.find(a => okLL(a.ll) && mismaInst(a.n, r.org));
    out.push({ n: `${r.rol} · ${r.org}`, c: (m ? [m.ciudad, m.pais] : [r.ciudad, r.pais]).filter(Boolean).join(', '), ll: m ? m.ll : null, a: r.desde || r.hasta, b: r.hasta || r.desde, k: 'edu' });
  });
  return out;
}
const KCOL = { aff: '--p-research', ev: '--p-coop', aw: '--p-inter', edu: '--p-free' };
const KLAB = { aff: 'kAff', ev: 'kEv', aw: 'kAw', edu: 'kEdu' };
/* Formación y cargos desde ORCID (ADR 0011, datos incompletos):
   - sin lo esencial (institución; en formación, también el título) no se muestran;
   - sin año se listan sin año y no van al mapa;
   - una formación con año entra al mapa solo si su institución coincide con una afiliación de OpenAlex con coordenadas.
   Los avisos para completar en ORCID van solo en Mi panel. */
const ORCID_URL = 'https://orcid.org/0000-0003-3014-8340';
const normInst = s => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/^the /, '');
const mismaInst = (a, b) => { const x = normInst(a), y = normInst(b); return !!x && !!y && (x === y || x.startsWith(y + ' ') || y.startsWith(x + ' ')); };
function orcidRows() {
  const o = DD.perfil.orcid || {}, out = { ok: [], sinAnio: [], sinDatos: [] };
  [['edu', o.educations_detalle], ['job', o.employments_detalle]].forEach(([k, rows]) => (rows || []).forEach(r => {
    if (!r.org || (k === 'edu' && !r.rol)) { out.sinDatos.push({ ...r, k }); return; }
    if (!r.desde && !r.hasta) out.sinAnio.push({ ...r, k });
    out.ok.push({ ...r, k });
  }));
  return out;
}
const orcidYears = r => r.desde && r.hasta ? (r.desde === r.hasta ? `${r.desde}` : `${r.desde}–${r.hasta}`)
  : r.desde ? `${r.desde}–${r.k === 'job' ? t('present') : ''}` : r.hasta ? `${r.hasta}` : '';
function orcidSection() {
  const rows = orcidRows().ok, key = r => r.hasta || r.desde || 0;
  const place = r => [r.ciudad, r.pais].filter(Boolean).join(', ');
  const row = r => {
    const title = r.k === 'edu' ? r.rol : (r.rol || r.org);
    const meta = [r.k === 'edu' || r.rol ? r.org : null, r.depto, place(r)].filter(Boolean).join(' · ');
    return `<div><span class="y">${esc(orcidYears(r))}</span><i style="background:var(${r.k === 'edu' ? '--p-free' : '--p-research'})"></i><span><span class="t">${esc(title)}</span><br><span class="m">${esc(meta)}</span></span></div>`;
  };
  const grp = (k, title) => { const xs = rows.filter(r => r.k === k).sort((a, b) => key(b) - key(a)); return xs.length ? `<div class="eyebrow" style="font-size:11px;color:var(--muted);margin-top:24px">${title}</div><div class="tl" style="margin-top:8px">${xs.map(row).join('')}</div>` : ''; };
  return rows.length ? `<section class="sec"><h2 class="h2" style="margin-bottom:8px">${t('eduJ')}</h2>${prov(true, 'ORCID', GEN)}${grp('edu', t('edus'))}${grp('job', t('jobs'))}</section>` : '';
}
const yRange = () => { const ys = DD.perfil.por_anio.map(x => x[0]); return [Math.min(...ys), NOW]; };
function journeyPage() {
  const [y0, y1] = yRange(); if (year == null) year = reduced ? y1 : y0;
  const byY = Object.fromEntries(DD.perfil.por_anio), mx = Math.max(...Object.values(byY));
  const ys = []; for (let y = y0; y <= y1; y++) ys.push(y);
  const ps = places().sort((a, b) => b.a - a.a || b.b - a.b);
  return `<div class="wrap page">${pageHead(t('nav.journey'), t('journey.sub'), prov(true, 'OpenAlex + ORCID', GEN))}
  <div class="jgrid"><div class="mapbox" id="mapbox" tabindex="0" aria-label="${t('nav.journey')}"><div id="map"><div class="bigyear" id="bigY">${year}</div></div>
    <div class="ctl"><button class="sq" type="button" data-y="-1" aria-label="${t('prevY')}">‹</button><button class="play" type="button" data-play>${playing ? t('pause') : t('play')}</button><button class="sq" type="button" data-y="1" aria-label="${t('nextY')}">›</button><span class="stat-t" id="playSt"></span></div>
    <div class="hist" role="slider" aria-valuemin="${y0}" aria-valuemax="${y1}" aria-valuenow="${year}" aria-label="${t('nav.journey')}">${ys.map(y => `<button type="button" data-year="${y}" style="height:${Math.max(8, (byY[y] || 0) / mx * 100)}%" aria-label="${y}"></button>`).join('')}</div>
    <div class="hlab">${ys.map(y => `<span>${y % 3 === y0 % 3 ? "'" + String(y).slice(2) : ''}</span>`).join('')}</div>
    <div class="legend"><span><i style="background:var(--p-research)"></i>${t('kAff')}</span><span><i style="background:var(--p-coop)"></i>${t('kEv')}</span><span><i style="background:var(--p-inter)"></i>${t('kAw')}</span>${ps.some(p => p.k === 'edu' && okLL(p.ll)) ? `<span><i style="background:var(--p-free)"></i>${t('kEdu')}</span>` : ''}<span><i style="border:1.5px solid var(--muted)"></i>${t('pastYears')}</span><span>${t('stopsRM')}</span></div></div>
    <div class="ypanel" id="ypanel" aria-live="polite"></div></div>
  <section class="sec"><h2 class="h2" style="margin-bottom:8px">${t('fullJ')}</h2><div class="tl">${ps.map(p => `<div><span class="y">${p.a}${p.b !== p.a ? '–' + (p.b >= NOW - 1 && p.k === 'aff' ? t('present') : p.b) : ''}</span><i style="background:var(${KCOL[p.k]})"></i><span><span class="t">${esc(p.n)}</span><br><span class="m">${[esc(p.c), t(KLAB[p.k])].filter(Boolean).join(' · ')}</span></span></div>`).join('')}</div></section>
  ${orcidSection()}</div>`;
}
function initMap() {
  if (!window.L) return;
  map = window.L.map('map', { zoomControl: true, scrollWheelZoom: false, worldCopyJump: true, attributionControl: true });
  mapTiles = () => {
    if (!map) return;
    if (tiles) map.removeLayer(tiles);
    tiles = window.L.tileLayer(`https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_${isDark() ? 'Dark' : 'Light'}_Gray_Base/MapServer/tile/{z}/{y}/{x}`, { attribution: 'Tiles &copy; Esri · Leaflet', maxZoom: 16 }).addTo(map);
  };
  mapTiles();
  const ps = places().filter(p => okLL(p.ll));
  map.fitBounds(ps.map(p => p.ll), { padding: [40, 40] });
  markers = ps.map(p => ({ p, m: window.L.marker(p.ll, { keyboard: false }) }));
  setYear(year);
  if (!reduced && !playing) play();
}
function setYear(y) {
  const [y0, y1] = yRange(); year = Math.min(y1, Math.max(y0, y));
  const big = $('#bigY'); if (!big) return;
  big.textContent = year;
  document.querySelectorAll('.hist button').forEach(b => { const v = +b.dataset.year; b.className = v === year ? 'cur' : v < year ? 'past' : ''; });
  $('.hist').setAttribute('aria-valuenow', year);
  $('#playSt').textContent = `${t(playing ? 'playing' : 'paused')} · ${year} ${t('of')} ${y0}–${y1}`;
  markers.forEach(({ p, m }) => {
    const active = p.a <= year && year <= p.b, past = p.b < year;
    if (!active && !past) { if (map.hasLayer(m)) map.removeLayer(m); return; }
    const cls = active ? `pin on${p.a === year ? ' ring' : ''}` : 'pin';
    m.setIcon(window.L.divIcon({ className: '', html: `<div class="${cls}" style="--pc:var(${KCOL[p.k]})"></div>`, iconSize: active ? [16, 16] : [10, 10] }));
    m.unbindTooltip();
    if (active) m.bindTooltip(`${p.c.split(',')[0]} · ${p.n}${p.a === year ? ` (${t('new')})` : ''}`, { permanent: true, direction: 'right', className: 'plabel', offset: [10, 0] });
    if (!map.hasLayer(m)) m.addTo(map);
    m.setZIndexOffset(active ? 1000 : 0);
  });
  yearPanel();
}
function yearPanel() {
  const ps = places(), ws = VIS.filter(w => w.y === year);
  const act = ps.filter(p => p.a <= year && year <= p.b);
  const top = [...ws].sort((a, b) => (b.c || 0) - (a.c || 0))[0];
  const grp = (k, title) => { const xs = act.filter(p => p.k === k); return xs.length ? `<div class="sub-eb">${title}</div>${xs.map(p => `<div class="yi"><i style="background:var(${KCOL[p.k]})"></i><div><div class="t">${esc(p.n)}${p.a === year ? `<span class="new">${t('new')}</span>` : ''}</div><div class="m">${[esc(p.c), p.b === year && year < NOW ? t('lastYear') : ''].filter(Boolean).join(' · ')}</div></div></div>`).join('')}` : ''; };
  $('#ypanel').innerHTML = `<div class="yh"><b>${year}</b><div class="n"><b>${ws.length}</b>${t('pubsYear')}</div></div>
    ${grp('aff', t('affs')) || `<p class="muted" style="font-size:14px;margin-top:14px">${t('noAff')}</p>`}${grp('ev', t('evs'))}${grp('aw', t('aws'))}${grp('edu', t('edus'))}
    ${top ? `<div class="sub-eb" style="border-top:1px solid var(--line);padding-top:14px">${t('topYear')}</div><div class="yi"><i style="background:var(--p-research)"></i><div><div class="t">${esc(top.t)}</div><div class="m">${esc(venue(top) || '')} · ${top.c ?? '—'} ${t('cites')} · ■ OpenAlex</div></div></div>` : ''}`;
}
function play() {
  playing = !playing; clearInterval(playTimer);
  const b = $('[data-play]'); if (b) b.textContent = playing ? t('pause') : t('play');
  if (playing) playTimer = setInterval(() => { const [, y1] = yRange(); if (year >= y1) { play(); return; } setYear(year + 1); }, 3000);
  setYear(year);
}

/* ---------- fuentes ---------- */
function sourcesPage() {
  const est = DD.fuentes.estado, cat = C.fuentes;
  const st = s => { const e = est[s.id]; if (e && e.estado === 'error') return 'err'; return s.st; };
  const mark = s => ({ ok: 'ok', wait: '', plan: 'plan', block: 'block', err: 'err' }[s]);
  const n = VIS.length, cov = k => VIS.filter(w => w.vf && w.vf[k]).length;
  const s2c = VIS.reduce((s, w) => s + ((w.vf && w.vf.s2 && w.vf.s2.cites) || 0), 0);
  const s2cs = VIS.map(w => (w.vf && w.vf.s2 && w.vf.s2.cites) || 0).sort((a, b) => b - a), s2h = s2cs.filter((c, i) => c >= i + 1).length;
  const pst = DD.perfil.stats, s2err = (est.s2 || {}).estado === 'error';
  return `<div class="wrap page">${pageHead(t('nav.sources'), t('src.sub'), prov(true, t('synced'), GEN))}
  <section class="sec"><h2 class="h2" style="margin-bottom:18px">${t('how')}</h2><div class="steps">${cat.pasos.map((p, i) => `<div><b>0${i + 1}</b><h3>${esc(L(p[0]))}</h3><p>${esc(L(p[1]))}</p></div>`).join('')}</div></section>
  <section class="sec"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:16px;flex-wrap:wrap;margin-bottom:18px"><h2 class="h2">${t('srcList')}</h2>
    <div class="legend2">${['ok', 'plan', 'block'].map(k => `<span class="sts" style="font-family:var(--sans);font-size:12.5px"><span class="sq-i ${mark(k)}"></span>${t('st.' + k)}</span>`).join('')}</div></div>
    <div class="srcgrid">${cat.fuentes.map(s => { const k = st(s), e = est[s.id]; return `<article><div class="top"><h3>${esc(L(s.n))}</h3><span class="sts"><span class="sq-i ${mark(k)}"></span>${t('st.' + k)}</span></div>
      <p>${esc(L(s.what))}</p><p class="h">${esc(L(s.how))}</p>${e ? `<p class="h mono" style="font-size:11px">${fd(e.fecha)} · ${esc(typeof e.resultado === 'number' ? t('resN', { n: e.resultado }) : e.resultado)}</p>` : ''}</article>`; }).join('')}</div></section>
  <div class="vgrid"><div class="box"><h3 style="font-size:20px">${t('seals')}</h3><p class="muted" style="font-size:14px;margin:-8px 0 16px">${t('sealsSub', { n, d: fd(GEN) })}</p>
      ${Object.entries(VS).map(([k, name]) => `<div class="vrow"><span>${name}</span><span class="bar"><i style="width:${cov(k) / n * 100}%"></i></span><span class="n">${cov(k)} / ${n}</span></div>`).join('')}</div>
    <div class="box rules"><h3 style="font-size:20px">${t('readSeals')}</h3>${cat.reglas_sellos.map((r, i) => `<div><b>0${i + 1}</b><span>${esc(L(r))}</span></div>`).join('')}</div></div>
  <section class="sec"><h2 class="h2" style="margin-bottom:8px">${t('citesBy')}</h2><div class="ctable">
    <div><b>OpenAlex</b><span><span class="big">${pst.cites}</span> <small>${t('cites')}</small></span><span><span class="big">${pst.h}</span> <small>${t('st.h')}</small></span><span class="mono" style="font-size:12px">${fd(DD.perfil.generado)}</span><span class="sts" style="font-size:13px;font-family:var(--sans);color:var(--ink)"><span class="sq-i ok"></span>${t('st.ok')}</span></div>
    <div><b>Semantic Scholar</b><span><span class="big">${s2c}</span> <small>${t('cites')}</small></span><span><span class="big">${s2h}</span> <small>${t('st.h')}</small></span><span class="mono" style="font-size:12px">${fd((est.s2 || {}).fecha)}</span><span class="sts" style="font-size:13px;font-family:var(--sans);color:var(--ink)"><span class="sq-i ${s2err ? 'err' : 'ok'}"></span>${t(s2err ? 'st.err' : 'st.ok')}</span></div>
  </div><p class="note">${t('citesNote')}</p></section></div>`;
}

/* ---------- Mi panel (plantillas estáticas) ---------- */
function panel(sec) {
  const nRev = VIS.filter(w => w.linea_estado !== 'confirmada').length;
  const nav = [['', 'pSum'], ['pubs', 'pPubs', nRev], ['profiles', 'pProf'], ['content', 'pMan'], ['sources', 'pSrc']];
  const side = `<aside class="panel-side"><div class="b">${esc(C.perfil.nombre)}</div><div class="s">${t('panelS')}</div>
    <nav>${nav.map(([id, k, c]) => `<a href="#panel${id ? '/' + id : ''}" ${sec === id ? 'aria-current="page"' : ''}>${t(k)}${c ? `<small>${c}</small>` : ''}</a>`).join('')}</nav>
    <div class="vista">${t('view')}<div class="vsw"><a class="on" href="#home">Tomás</a><a href="index.html#home">${t('visitor')}</a></div>
      <div style="margin-top:14px">${t('langL')}</div><div class="vsw" role="group" aria-label="Language / Idioma">${['en', 'es'].map(l => `<button type="button" data-lang="${l}" class="${lang === l ? 'on' : ''}" aria-pressed="${lang === l}">${l.toUpperCase()}</button>`).join('')}</div></div></aside>`;
  const body = { '': pSummary, pubs: pReview, profiles: pProfiles, content: pContent, sources: pSources }[sec] || pSummary;
  return `<div class="panel">${side}<main class="panel-main">${body(nRev)}</main></div>`;
}
const pTitle = (k, s, right) => `<div style="display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap"><div><h1 class="h1">${t(k)}</h1><p class="lead" style="margin-top:6px;font-size:15px">${s}</p></div>${right || ''}</div>`;
function pSummary(nRev) {
  const st = DD.perfil.stats, next = new Date(GEN); next.setDate(next.getDate() + 7);
  const empt = PK.filter(k => k !== 'research' && (PROF[k].subs || []).length).map(k => [k, PROF[k].subs.filter(s => !ITEMS.some(it => inSub(it, k + '.' + s.id)))]).filter(x => x[1].length);
  const est = DD.fuentes.estado, oc = orcidRows();
  const orcSinDoiTodas = VIS.filter(w => w.fuentes.length === 1 && w.fuentes[0] === 'orcid' && !w.doi).sort((a, b) => (b.y || 0) - (a.y || 0));
  const sinDoiFuente = orcSinDoiTodas.filter(w => (w.sin_doi || {}).estado === 'fuente_sin_doi');  // no tienen DOI: no son pendientes
  const orcSinDoi = orcSinDoiTodas.filter(w => !sinDoiFuente.includes(w));
  const comprobar = sd => urlSegura(sd && sd.comprobar) ? ` · <a href="${esc(urlSegura(sd.comprobar))}" target="_blank" rel="noopener">${t('check')}</a>` : '';
  const orcLabel = r => `${t(r.k === 'edu' ? 'kEdu' : 'tJob')}: ${[r.rol, r.org].filter(Boolean).join(' · ') || '—'}`;
  const pistaDoi = w => {  // pistas verificables para encontrar el DOI; solo en el panel, nunca en el sitio
    const ax = w.vf && w.vf.arxiv && w.vf.arxiv.id, s2v = w.vf && w.vf.s2 && w.vf.s2.venue, sd = w.sin_doi || {};
    const cr = sd.estado === 'crossref_tiene' && sd.doi;
    return [cr ? esc(t('hintCr', { doi: sd.doi, v: sd.en || 'Crossref' })) + comprobar(sd) : '',
            sd.estado === 'fuente_con_doi' ? esc(t('hintFc', { f: t(sd.tipo === 'libro' ? 'fBook' : 'fJournal') })) + comprobar(sd) : '',
            ax && !cr ? esc(t('hintArxiv', { doi: '10.48550/arXiv.' + String(ax).replace(/v\d+$/, '') })) : '',
            s2v && !cr && !/arxiv/i.test(s2v) ? esc(t('hintS2', { v: s2v })) : ''].filter(Boolean).join('<br>');
  };
  const sinDoiFila = sinDoiFuente.length ? `<div class="prow info"><b>${sinDoiFuente.length}</b><div><div class="t">${t('pendNd')}</div><div class="m">${t('pendNds')}</div>
    <details class="pdet"><summary>${t('howChecked')}</summary><p class="hint">${esc(t('howNd'))}</p><ul>${sinDoiFuente.map(w => { const sd = w.sin_doi;
      return `<li><b>${esc(w.t)}</b> <span class="muted">· ${w.y || '—'}${w.v ? ' · ' + esc(w.v) : ''}</span><br><span class="hint">${esc(t(sd.tipo === 'libro' ? 'ndBook' : 'ndJournal'))} (${esc(sd.id || t('byName'))}) · ${esc(t('checkedOn', { d: fd(sd.fecha) }))}${comprobar(sd)}</span></li>`; }).join('')}</ul></details></div><span></span></div>` : '';
  const manLabel = o => `${t({ ev: 'tEv', pr: 'tPr', wr: 'tWr', lu: 'tLu', aw: 'tAw' }[o.k])}: «${manNombre(o.k, o.x) || '—'}»`;
  const pend = (items, k, href, btn, ext, fmt) => items.length ? `<div class="prow"><b>${items.length}</b><div><div class="t">${t(k)}</div><div class="m">${t(k + 's')}</div>
    <details class="pdet"><summary>${t('seeWhich')}</summary><ul>${items.map(x => `<li>${fmt(x)}</li>`).join('')}</ul></details></div>
    <a class="btn sm" href="${href}"${ext ? ' target="_blank" rel="noopener"' : ''}>${t(btn)}</a></div>` : '';
  return `${pTitle('pSum', t('sumSub'), `<button class="btn" type="button" data-static>${t('updNow')}</button>`)}
  <div class="kpis"><div><span class="eyebrow" style="font-size:11px;color:var(--muted)">${t('lastUpd')}</span><b>${fd(GEN)}</b><small>■ ${t('correct')}</small></div>
    <div><span class="eyebrow" style="font-size:11px;color:var(--muted)">${t('nextUpd')}</span><b>${fd(next.toISOString().slice(0, 10))}</b><small>${t('weeklyC')}</small></div>
    <div><span class="eyebrow" style="font-size:11px;color:var(--muted)">${t('pubFigs')}</span><b>${st.works} · ${st.cites} · ${st.h} · ${st.i10}</b><small>${t('figsNote')}</small></div></div>
  <div style="display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:32px;margin-top:40px" class="sumgrid">
    <section><h2 class="h2" style="font-size:22px;margin-bottom:12px">${t('pendT')}</h2>
      <div class="prow"><b>${nRev}</b><div><div class="t">${t('pend1')}</div><div class="m">${t('pend1s')}</div></div><a class="btn solid sm" href="#panel/pubs">${t('review')}</a></div>
      ${!(PROF.free.subs || []).length ? `<div class="prow"><b>1</b><div><div class="t">${t('pend2')}</div><div class="m">${t('pend2s')}</div></div><a class="btn sm" href="#area-free">${t('configure')}</a></div>` : ''}
      ${empt.map(([k, ss]) => `<div class="prow"><b>${ss.length}</b><div><div class="t">${t('pend3', { p: esc(L(PROF[k].t)) })}</div><div class="m">${ss.map(s => esc(L(s.t))).join(', ')}.</div></div><a class="btn sm" href="#area-${k}/${ss[0].id}">${t('addContent')}</a></div>`).join('')}
      ${pend(oc.sinAnio, 'pendOy', ORCID_URL, 'fixOrcid', true, r => esc(orcLabel(r)))}
      ${pend(oc.sinDatos, 'pendOd', ORCID_URL, 'fixOrcid', true, r => esc(orcLabel(r)))}
      ${pend(orcSinDoi, 'pendOw', ORCID_URL, 'fixOrcid', true, w => `<b>${esc(w.t)}</b> <span class="muted">· ${w.y || '—'}${w.v ? ' · ' + esc(w.v) : ''}</span>${pistaDoi(w) ? `<br><span class="hint">${pistaDoi(w)}</span>` : ''}`)}
      ${sinDoiFila}
      ${pend(MAN_OCULTOS, 'pendMd', '#panel/content', 'seeMan', false, o => `${esc(manLabel(o))} <span class="muted">· ${t('missing')} ${o.falta.map(f => t(f)).join(', ')}</span>`)}
      ${pend(MAN_SIN_LL, 'pendMl', '#panel/content', 'seeMan', false, o => esc(manLabel(o)))}</section>
    <section class="box"><h2 class="h2" style="font-size:22px;margin-bottom:8px">${t('pSrc')}</h2>
      ${[['ORCID', 'orcid'], ['OpenAlex', 'openalex'], ['Crossref', 'crossref'], ['Semantic Scholar', 's2']].map(([n, id]) => `<div style="display:flex;justify-content:space-between;gap:10px;border-top:1px solid var(--line);padding:11px 0"><span class="sts" style="font:600 15px var(--sans);color:var(--ink)"><span class="sq-i ${id && est[id] ? (est[id].estado === 'ok' ? 'ok' : 'err') : ''}"></span>${n}</span><span class="mono muted" style="font-size:12px">${id && est[id] ? fd(est[id].fecha) : t('pending')}</span></div>`).join('')}</section></div>`;
}
function pReview() {
  const all = ALL_WORKS, rev = all.filter(w => !w.oculta && w.linea_estado !== 'confirmada'), conf = all.filter(w => w.linea_estado === 'confirmada'), hid = all.filter(w => w.oculta);
  const rows = all.slice(0, 10);
  return `${pTitle('revT', t('revS'))}
  <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:24px;align-items:center">${[['fAll', all.length, 1], ['fRev', rev.length], ['fConf', conf.length], ['fHid', hid.length]].map(([k, n, on]) => `<button class="pchip" type="button" aria-pressed="${!!on}" data-static>${t(k)} <small>${n}</small></button>`).join('')}
    <span style="flex:1"></span><select class="admin-sel" style="height:44px" data-static><option>${t('allLines')}</option>${LINES.map(l => `<option>${esc(L(l.t))}</option>`).join('')}</select><input class="admin-sel" style="height:44px;min-width:220px" placeholder="${t('searchT')}" data-static></div>
  <div class="bulk"><b>${t('selected', { n: 3 })}</b><button class="btn solid" type="button" data-static>${t('acceptSel')}</button><button class="btn" type="button" data-static>${t('changeLine')}</button><button class="btn" type="button" data-static>${t('hide')}</button><span style="flex:1"></span><button class="btn" type="button" style="border:0" data-static>${t('clearSel')}</button></div>
  <div class="tablewrap"><table class="rtable"><thead><tr><th><span class="cbx"></span></th><th>${t('thTitle')}</th><th>${t('thYear')}</th><th>${t('thLine')}</th><th>${t('thState')}</th><th>${t('thAct')}</th></tr></thead><tbody>
    ${rows.map((w, i) => `<tr class="${i < 3 ? 'sel' : ''}"><td><span class="cbx">${i < 3 ? '✓' : ''}</span></td><td style="max-width:300px"><div class="tt">${esc(w.t)}</div><div class="vv">${esc((venue(w) || '').slice(0, 48))}</div></td><td class="mono">${w.y || ''}</td><td>${lineSelect(w.linea)}</td>
      <td><span class="sts" style="font:600 13px var(--sans);color:var(--ink)"><span class="sq-i ${w.oculta ? 'block' : w.linea_estado === 'confirmada' ? 'ok' : ''}"></span>${w.oculta ? t('hiddenS') : w.linea_estado === 'confirmada' ? t('confirmedS').slice(2) : t('toReview')}</span></td>
      <td style="white-space:nowrap"><button class="btn sm" type="button" data-static>${t('confirmB')}</button> <button class="btn lite sm" type="button" data-static>${t('hideB')}</button></td></tr>`).join('')}</tbody></table></div>
  <div class="pager"><span>${t('showing', { a: rows.length, b: all.length })}</span><span>‹ 1 2 3 … ${Math.ceil(all.length / 10)} ›</span></div>`;
}
function pProfiles() {
  return `${pTitle('profT', t('profS'))}<div style="margin-top:28px;border-top:1px solid var(--ink)">${PK.map(k => {
    const p = PROF[k], subs = p.subs || [];
    return `<div style="display:grid;grid-template-columns:24px 64px 1fr auto;gap:16px;align-items:center;padding:20px 0;border-bottom:1px solid var(--line)"><span class="muted">${p.main ? '' : '⋮⋮'}</span>${av(k, 56)}
      <div><b style="font-size:18px">${esc(L(p.t))}</b> ${p.main ? `<span class="new" style="margin-left:6px">${t('fixed')}</span>` : ''}<div class="muted" style="font-size:14px">${esc(L(p.r))}</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:10px">${subs.length ? subs.map(s => `<span class="xchip">${esc(L(s.t))} <small class="mono muted">${k === 'research' ? VIS.filter(w => w.linea === s.id).length : ITEMS.filter(it => inSub(it, k + '.' + s.id)).length}</small></span>`).join('') + `<span class="prov" style="align-self:center">${subs.length} / 4</span>` : `<span class="muted" style="font-size:14px">${t('notDef')}</span>`}</div></div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end">${subs.length ? `<button class="btn sm" type="button" data-static>${t('renameB')}</button><button class="btn lite sm" type="button" data-static>${t('iconColor')}</button>` : `<a class="btn solid sm" href="#area-free">${t('configure')}</a>`}</div></div>`;
  }).join('')}</div>`;
}
function pContent() {
  const P = C.perfil;
  const list = (title, arr, fmt) => `<section style="margin-top:32px"><div class="sec-h" style="margin-bottom:8px"><h2 class="h2" style="font-size:22px">${title} <small class="mono muted" style="font-size:13px">${arr.length}</small></h2><button class="btn sm" type="button" data-static>${t('add')}</button></div>
    ${arr.length ? arr.map(x => `<div style="display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid var(--line);padding:10px 0"><span>${fmt(x)}</span><button class="btn lite sm" type="button" data-static>${t('edit')}</button></div>`).join('') : `<div class="empty" style="padding:18px"><span class="muted">${t('noneYet')}</span></div>`}</section>`;
  return `${pTitle('manT', t('manS'))}
  <section style="margin-top:28px"><div class="sec-h" style="margin-bottom:12px"><h2 class="h2" style="font-size:22px">${t('carPh')} <small class="mono muted" style="font-size:13px">${P.fotos.length}</small></h2><button class="btn sm" type="button" data-static>${t('add')}</button></div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px">${P.fotos.map((f, i) => `<figure style="margin:0;background:var(--surface);border:1px solid var(--line)"><img src="${esc(f.src)}" alt="" style="height:140px;width:100%;object-fit:cover"><figcaption style="padding:8px;font-size:12.5px"><span class="mono muted">⋮⋮ 0${i + 1}</span><br>${esc(L(f.d))}</figcaption></figure>`).join('')}</div></section>
  <section style="margin-top:32px"><div class="sec-h" style="margin-bottom:8px"><h2 class="h2" style="font-size:22px">${t('siteTxt')}</h2></div>
    ${[['role', P.rol], ['bio', P.bio]].map(([k, v]) => `<div style="display:grid;grid-template-columns:120px 1fr auto;gap:12px;border-bottom:1px solid var(--line);padding:12px 0;align-items:start"><b>${t(k)}</b><span class="muted" style="font-size:14px">${esc(L(v).slice(0, 160))}${L(v).length > 160 ? '…' : ''}</span><span class="prov">${t('both')} ✓</span></div>`).join('')}</section>
  ${list(t('projectsT'), C.proyectos.proyectos, x => `<b>${esc(x.t)}</b> <span class="muted">· ${esc(x.o)}</span>`)}
  ${list(t('talksT'), C.eventos.eventos, x => `<b>${esc(x.title)}</b> <span class="muted">· ${esc(x.when)}</span>`)}
  ${list(t('writingT'), C.escritos.escritos, x => `<b>${esc(x.t)}</b> <span class="muted">· ${esc(x.y)}</span>`)}
  ${list(t('awards'), C.premios.premios, x => `<b>${esc(L(x.t))}</b> <span class="muted">· ${esc(x.y)}</span>`)}
  ${list(t('courses'), [], () => '')}${list(t('works2'), [], () => '')}`;
}
function pSources() {
  const est = DD.fuentes.estado;
  return `${pTitle('srcT', t('srcS'))}<div class="tablewrap"><table class="rtable"><thead><tr><th>${t('thSrc')}</th><th>${t('thSt')}</th><th>${t('thLast')}</th><th>${t('thRes')}</th><th></th></tr></thead><tbody>
    ${C.fuentes.fuentes.map(s => { const e = est[s.id]; const k = e ? (e.estado === 'ok' ? 'ok' : 'err') : s.st; return `<tr><td><b>${esc(L(s.n))}</b></td><td><span class="sts" style="font:500 13px var(--sans);color:var(--ink)"><span class="sq-i ${{ ok: 'ok', err: 'err', plan: 'plan', block: 'block', wait: '' }[k]}"></span>${t('st.' + k)}</span></td>
      <td class="mono">${e ? fd(e.fecha) : '—'}</td><td>${e ? esc(typeof e.resultado === 'number' ? t('resN', { n: e.resultado }) : e.resultado) : '—'}</td>
      <td style="text-align:right">${s.st === 'wait' ? `<button class="btn solid sm" type="button" data-static>${t('addKey')}</button>` : e ? `<button class="btn sm" type="button" data-static>${t('syncNow')}</button>` : ''}</td></tr>`; }).join('')}</tbody></table></div>`;
}

/* ---------- enrutador ---------- */
function route() {
  const h = decodeURIComponent(location.hash.slice(1)) || 'home';
  const [a, b] = h.split('/');
  clearInterval(playTimer); playing = false;
  if (map) { map.remove(); map = null; markers = []; tiles = null; }
  let page = a, html;
  if (ADMIN && a === 'panel') {
    $('#app').innerHTML = panel(b || '');
    document.title = `${t('myPanel')} — ${C.perfil.nombre}`;
    return;
  }
  if (a === 'home') html = home(b && b.startsWith('line-') ? b.slice(5) : null);
  else if (a.startsWith('area-')) { const k = a.slice(5); if (k === 'research') { location.replace('#home' + (b ? '/line-' + b : '')); return; } page = ''; html = profilePage(k, b); }
  else if (a === 'publications') html = pubsPage(b && b.startsWith('line-') ? b.slice(5) : (b === undefined ? undefined : ''));
  else if (a === 'talks') html = talksPage();
  else if (a === 'journey') html = journeyPage();
  else if (a === 'projects') html = projectsPage();
  else if (a === 'writing') html = writingPage();
  else if (a === 'work') html = workPage();
  else if (a === 'sources') html = sourcesPage();
  else { page = 'home'; html = home(); }
  $('#app').innerHTML = `${header(page)}<main id="main">${html}</main>${footer()}`;
  const navT = NAV.find(n => n[0] === page);
  document.title = (navT && page !== 'home' ? t(navT[1]) + ' — ' : '') + C.perfil.nombre;
  if (a === 'journey') initMap();
  if (a === 'home') startCar();
  if (b && a === 'home' && b.startsWith('line-')) { const el = $('#lines'); el && el.scrollIntoView({ block: 'start' }); }
  else if (!(a.startsWith('area-') && b)) scrollTo(0, 0);
}
function rerender() { const y = scrollY; route(); scrollTo(0, y); }

/* ---------- carrusel ---------- */
function showC(i) {
  const ph = C.perfil.fotos; ci = (i + ph.length) % ph.length;
  const img = $('#carImg'); if (!img) return;
  img.src = ph[ci].src; img.alt = L(ph[ci].d); $('#carD').textContent = L(ph[ci].d); $('#carL').textContent = L(ph[ci].lugar); $('#carN').textContent = `${ci + 1}/${ph.length}`;
}
function startCar() {
  clearInterval(carTimer); if (reduced) return;
  const car = $('.carousel');
  car.addEventListener('mouseenter', () => carPaused = true); car.addEventListener('mouseleave', () => carPaused = false);
  car.addEventListener('focusin', () => carPaused = true); car.addEventListener('focusout', () => carPaused = false);
  carTimer = setInterval(() => { if (!carPaused && $('#carImg')) showC(ci + 1); }, 6000);
}

/* ---------- eventos ---------- */
document.addEventListener('click', e => {
  const el = e.target.closest('button,a'); if (!el) return;
  if (el.dataset.lang) { lang = el.dataset.lang; store.set('lang', lang); document.documentElement.lang = lang; $('.sheet')?.remove(); rerender(); }
  else if ('toggleTheme' in el.dataset) { theme = isDark() ? 'light' : 'dark'; store.set('theme', theme); applyTheme(); rerender(); }
  else if (el.dataset.themeSet) { theme = el.dataset.themeSet; store.set('theme', theme); applyTheme(); $('.sheet')?.remove(); rerender(); }
  else if ('menu' in el.dataset) { const pg = (location.hash.slice(1).split('/')[0]) || 'home'; document.body.insertAdjacentHTML('beforeend', sheet(pg)); $('.sheet-close').focus(); }
  else if ('close' in el.dataset) { $('.sheet').remove(); $('[data-menu]')?.focus(); }
  else if (el.closest('.sheet') && el.tagName === 'A') { $('.sheet').remove(); }
  else if (el.dataset.car) showC(ci + +el.dataset.car);
  else if (el.dataset.line !== undefined && el.classList.contains('lrow')) { location.hash = el.dataset.line ? '#home/line-' + el.dataset.line : '#home'; }
  else if (el.dataset.pf) { const [p, k] = el.dataset.pf.split(':'); PF[p] = k; rerender(); }
  else if (el.dataset.y) { if (playing) play(); setYear(year + +el.dataset.y); }
  else if ('play' in el.dataset) play();
  else if (el.dataset.year) { if (playing) play(); setYear(+el.dataset.year); }
  else if ('cv' in el.dataset) toast(t('cvSoon'));
  else if ('static' in el.dataset) { e.preventDefault(); toast(t('staticT')); }
});
document.addEventListener('change', e => {
  if ('static' in e.target.dataset) { toast(t('staticT')); return; }
  const m = { ft: 'type', fl: 'line', fv: 'verify', fs: 'sort' }[e.target.id];
  if (m) { F[m] = e.target.value; $('#publist').innerHTML = pubList(); }
});
document.addEventListener('input', e => { if (e.target.id === 'fq') { F.q = e.target.value; $('#publist').innerHTML = pubList(); } });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && $('.sheet')) { $('.sheet').remove(); $('[data-menu]')?.focus(); }
  if (e.target.closest && e.target.closest('#mapbox') && !/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') { e.preventDefault(); if (playing) play(); setYear(year + (e.key === 'ArrowLeft' ? -1 : 1)); }
    if (e.key === ' ' && e.target.id === 'mapbox') { e.preventDefault(); play(); }
  }
});
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { if (theme === 'system') rerender(); });
addEventListener('hashchange', route);
document.documentElement.lang = lang;
applyTheme();
route();
})();
