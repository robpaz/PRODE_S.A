# Changelog

Todos los cambios notables de **PRODE Mundial FIFA 2026** se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/)
y el proyecto sigue (de forma aproximada) [Versionado Semántico](https://semver.org/lang/es/).

## [Sin publicar]

### Añadido
- Documentación técnica en `docs/`:
  - `docs/SPECS.md` — especificación del estado actual (as-built).
  - `docs/SPECS_IMPROVEMENTS.md` — propuesta de mejoras y roadmap.
- `README.md` con descripción, stack, puesta en marcha y despliegue.
- `CHANGELOG.md` (este archivo).

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
