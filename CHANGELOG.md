# Changelog

Todos los cambios notables de **PRODE Mundial FIFA 2026** se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/)
y el proyecto sigue (de forma aproximada) [Versionado Semántico](https://semver.org/lang/es/).

## [Sin publicar]

### Corregido
- **"Recalcular ranking" no actualizaba los puntos**: la función `as_recalcular_ranking()`
  corría con los privilegios del rol `anon`, y la RLS de `participantes` no tiene política
  `UPDATE`, por lo que el `UPDATE` se bloqueaba en silencio (devolvía 204 sin actualizar).
  Se recreó la función como `SECURITY DEFINER` (con `SET search_path = public`) para que
  actualice correctamente al invocarse desde el panel admin. Aplicado en prod y en `sql/setup.sql`.

### Cambiado
- **Restricción de un Prode ahora es por navegador/dispositivo, no por IP** (resuelve el
  bloqueo de la red NAT del colegio, donde todos comparten una IP pública). Se quitó la
  verificación/bloqueo por IP en `js/predictions.js`, se eliminó la restricción `UNIQUE` de
  `participantes.ip` (columna ahora solo de registro) y se actualizó `sql/setup.sql` y la
  documentación. La IP se sigue guardando únicamente a modo de registro.

### Añadido
- `docs/REGLAMENTO.md` — reglamento del juego (puntaje, desempates, participación).

## [1.1.0] - 2026-06-14

Implementación de las mejoras del roadmap (`docs/SPECS_IMPROVEMENTS.md`),
de forma retrocompatible con el sitio en producción.

### Añadido
- **Corrección/puntuación automática** (1.1): tabla `resultados`, vista `v_ranking`
  y RPC `as_recalcular_ranking()` en `sql/setup.sql`; ejecutable desde el nuevo
  **panel admin** (`admin.html` + `js/admin.js`).
- **Cierre por hora de partido** (1.2): campo `kickoff` por partido en `js/fixture.js`
  (cierre conservador al fin del día del partido, hora de Bolivia) y bloqueo de inputs
  de partidos ya cerrados (flag `LOCK_BY_KICKOFF`).
- **Edición del Prode** (1.3): soporte de UPSERT de predicciones y modo edición en
  el formulario (flag `ALLOW_EDIT`, desactivado por defecto hasta migrar la BD).
- **Edge Function `submit-prode`** (2.1): inserción server-side con validación y
  rate-limit por IP (`supabase/functions/`), opcional vía `USE_EDGE_FUNCTION`; incluye
  sección de RLS endurecida en `sql/setup.sql`.
- **Configuración central** (3.1): `js/config.js` (fechas, puntaje, costo, flags, keys LS).
- **Utilidades compartidas** (3.2): `js/utils.js` (`escapeHTML`, `partidoCerrado`,
  `formatDif`, `calcularPuntos`, `tableSkeleton`), eliminando duplicación.
- **Página "Mi Prode"** (4.1): `#miprode` + `js/miprode.js` con pronósticos y puntos por partido.
- **Borrador local** (4.2): autosave de marcadores/nombre/curso (`PERSIST_DRAFT`).
- **Modal de confirmación** previo al envío (4.3, `CONFIRM_BEFORE_SUBMIT`).
- **Filtro por jornada** y botón "siguiente vacío" en predicciones (4.4).
- **Skeletons** de carga en tablas (4.5).
- **Accesibilidad** (5.1): `aria-label` en inputs de marcador, `role="dialog"` en el modal.
- **Métricas** (6.1): contador de participantes en el inicio y desglose por curso en admin.
- **Manejo de errores uniforme** (6.2): `ProdeApp.handleError`.
- **SEO/PWA** (7.1, 7.2): Open Graph/Twitter, favicon, `manifest.webmanifest`, `sw.js`.
- **Toolchain** (3.4): ESLint, Prettier y workflow de CI (`.github/workflows/ci.yml`).
- Documentación técnica en `docs/` (`SPECS.md`, `SPECS_IMPROVEMENTS.md`), `README.md` y `CHANGELOG.md`.

### Notas de migración
- Para activar resultados/recálculo/edición hay que ejecutar el `sql/setup.sql` actualizado.
- `ALLOW_EDIT` y `USE_EDGE_FUNCTION` quedan en `false` por defecto para no afectar el sitio
  en producción hasta completar la migración/despliegue correspondiente.

## [1.0.0] - 2026-06-14

Primera versión funcional publicada en GitHub Pages
(https://robpaz.github.io/PRODE_S.A/).

### Añadido
- SPA estática con router por hash y 4 secciones: Inicio, Predicciones, Ranking, Reglamento.
- Fixture de **64 partidos** de fase de grupos (12 grupos A–L); jornada 1 excluida en grupos A–D.
- Formulario de pronósticos con tabs por grupo, barra de progreso y validación completa.
- Integración con **Supabase** (tablas `participantes` y `predicciones`, RLS y políticas públicas).
- **Modo demo** automático con `localStorage` cuando Supabase no está configurado.
- **Anti-duplicados** por dispositivo (localStorage) y por IP pública (`api.ipify.org` + columna `ip` UNIQUE).
- Inicio con **cuenta regresiva** al Mundial y **Top 5** de participantes.
- **Ranking** con podio Top 3 y tabla completa, ordenado por puntos → aciertos exactos → diferencia de goles.
- Reglamento con sistema de puntos (+3 / +1 / 0), costo de participación (10 Bs) y criterios de desempate.
- Sistema de diseño con tema oscuro FIFA 2026 (tipografías Outfit/Inter), navbar responsive y toasts.

### Cambiado
- Aclaración de los criterios de desempate en `index.html` (commit `eda92fe`).

[Sin publicar]: https://github.com/robpaz/PRODE_S.A/compare/main...HEAD
[1.0.0]: https://github.com/robpaz/PRODE_S.A/releases/tag/v1.0.0
