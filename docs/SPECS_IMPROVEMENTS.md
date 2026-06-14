# PRODE Mundial FIFA 2026 — Especificación de Mejoras (Propuesta)

> Documento de **propuesta de evolución** (`to-be`). Complementa a [`SPECS.md`](./SPECS.md)
> (estado actual). Cada mejora indica **problema**, **propuesta** y **prioridad**.
> Fecha: 2026-06-14.

## Leyenda de prioridad

| Nivel | Significado                                            |
|-------|-------------------------------------------------------|
| 🔴 P0 | Crítico — integridad/seguridad del juego               |
| 🟠 P1 | Alto — afecta la operación real del PRODE              |
| 🟡 P2 | Medio — mejora experiencia o mantenibilidad           |
| 🟢 P3 | Bajo — nice-to-have / pulido                           |

---

## 1. Integridad y corrección (núcleo del juego)

### 1.1 🔴 Corrección y puntuación automatizada
**Problema:** Hoy `puntos`, `aciertos_exactos` y `diferencia_goles` se cargan **a mano** en
Supabase. Con decenas/cientos de participantes y 64 partidos esto es inviable y propenso a error.

**Propuesta:**
- Nueva tabla `resultados` (`partido_id TEXT PK`, `goles_local INT`, `goles_visitante INT`, `cerrado BOOL`).
- Función SQL / Postgres RPC `as_recalcular_ranking()` que recorre `predicciones` vs `resultados`
  y recalcula los 3 campos por participante aplicando:
  - +3 si marcador exacto,
  - +1 si acierta 1X2 (signo del resultado) sin marcador exacto,
  - 0 en otro caso,
  - `diferencia_goles` = suma de |dif_pronosticada − dif_real| de los partidos con resultado.
- Panel mínimo de admin (página protegida) para cargar resultados y disparar el recálculo.

### 1.2 🔴 Cierre de ingreso por hora de partido
**Problema:** Las fechas del fixture son strings (`'Jue 18 Jun'`); no se puede impedir
pronosticar un partido ya jugado/empezado.

**Propuesta:**
- Añadir `kickoff` (ISO 8601 con zona horaria de Bolivia) a cada partido en `fixture.js`.
- Deshabilitar los inputs de un partido cuyo `kickoff` ya pasó (lock visual + validación en submit).
- Considerar un único **deadline global** (ej. inicio de la jornada 2) si se prefiere simplicidad.

### 1.3 🟠 Permitir edición del Prode hasta el deadline
**Problema:** Una vez enviado, no se puede corregir un error de tipeo.

**Propuesta:** Token/UUID por participante guardado en `localStorage`; permitir reabrir y
re-guardar (UPDATE) mientras no haya pasado el deadline.

---

## 2. Seguridad y anti-fraude

### 2.1 🔴 Endurecer RLS / anti-spam
**Problema:** La `anon key` es pública y las políticas permiten `INSERT` ilimitado anónimo →
cualquiera puede inflar la tabla con basura vía API.

**Propuesta:**
- Mover la inserción a una **Edge Function** de Supabase con validación server-side:
  rate-limit por IP, validación de payload (64 partidos exactos, ids válidos, goles 0–N).
- Restringir la política de `INSERT` para que solo la función de servicio escriba.
- Mantener `SELECT` público solo sobre una **vista** que exponga el ranking (sin `ip`).

### 2.2 🟠 Reemplazar/mejorar bloqueo por IP
**Problema:** El NAT de un colegio comparte una sola IP pública → el bloqueo por IP `UNIQUE`
impediría participar a casi todos.

**Propuesta:**
- Quitar la unicidad dura por IP; usar IP solo como señal de rate-limit (N por IP por hora).
- Identidad real por **nombre + curso** normalizados (anti-duplicado suave) y/o código único
  entregado al pagar los 10 Bs (ticket/QR de inscripción).

### 2.3 🟡 No exponer la `ip` en lecturas
**Propuesta:** Asegurar que `obtenerClasificacion()` nunca seleccione `ip` (hoy no lo hace, pero
debe garantizarse vía vista). Documentar la `anon key` como pública por diseño.

---

## 3. Arquitectura y mantenibilidad

### 3.1 🟡 Centralizar configuración y constantes
**Propuesta:** `js/config.js` con: fecha de inicio del Mundial, deadline, reglas de puntaje,
flags (mock, admin). Hoy el `targetDate` está hardcodeado en `home.js` y el puntaje solo en HTML.

### 3.2 🟡 Eliminar duplicación de `escapeHTML()`
**Problema:** `escapeHTML()` está duplicado en `home.js` y `ranking.js`.

**Propuesta:** Moverlo a un `js/utils.js` compartido (junto con `flagUrl`, helpers de formato).

### 3.3 🟢 Separar el HTML de las plantillas JS
**Propuesta:** Las grandes cadenas de template literal (match-card, podio, filas) podrían
extraerse a funciones de render en `utils.js` para legibilidad y test.

### 3.4 🟢 Toolchain ligera
**Propuesta (opcional):** linter (ESLint) + formateador (Prettier) + un workflow de GitHub
Actions que valide y publique en Pages. Mantener "sin build" salvo que crezca.

---

## 4. Experiencia de usuario (UX)

### 4.1 🟠 Página/sección "Mi Prode"
Ver el Prode enviado (solo lectura) y, partido a partido, cuántos puntos lleva una vez cargados
los resultados. Aumenta el engagement durante el torneo.

### 4.2 🟡 Persistir el borrador localmente
Guardar los marcadores en `localStorage` mientras se completan, para no perder el avance si se
recarga la página antes de enviar.

### 4.3 🟡 Validación inline y resumen previo al envío
Modal de confirmación con resumen ("Vas a enviar 64 pronósticos como *Juan Pérez, 5to A*") antes
del guardado definitivo.

### 4.4 🟢 Filtro por jornada y "siguiente partido sin completar"
Además de tabs por grupo, permitir filtrar por jornada y un botón "ir al próximo vacío".

### 4.5 🟢 Estados de carga más ricos
Skeletons en tablas/podio en vez de spinner de texto.

---

## 5. Accesibilidad e i18n

### 5.1 🟡 Accesibilidad (a11y)
- Labels asociados correctamente a cada input de marcador (`aria-label` por equipo y lado).
- Contraste AA verificado para texto secundario sobre fondo oscuro.
- Foco visible y navegación por teclado en tabs de grupo y toasts (`role="status"`).

### 5.2 🟢 Preparar para multi-idioma
Externalizar strings a un diccionario (`es` por defecto) para futura traducción.

---

## 6. Observabilidad y operación

### 6.1 🟡 Métricas básicas
Conteo de participantes en vivo (ya existe `contarParticipantes()`, exponerlo en el hero),
y un panel de admin con totales por curso.

### 6.2 🟢 Manejo de errores uniforme
Centralizar el patrón try/catch + toast en un helper, y registrar errores no fatales.

---

## 7. SEO / PWA / distribución

### 7.1 🟢 Metadatos sociales y favicon
Open Graph / Twitter Card (título, descripción, imagen del trofeo) y `favicon` real.

### 7.2 🟢 PWA instalable
`manifest.webmanifest` + service worker para uso offline del fixture y "agregar a inicio" en
móviles (útil en un colegio).

---

## 8. Roadmap sugerido (orden de ejecución)

| Fase | Alcance                                                                 |
|------|------------------------------------------------------------------------|
| 1    | 🔴 1.2 cierre por hora + 1.1 corrección automática + 2.1 anti-spam RLS  |
| 2    | 🟠 2.2 anti-fraude realista + 1.3 edición + 4.1 "Mi Prode"              |
| 3    | 🟡 3.1/3.2 refactor config+utils + 4.2/4.3 UX + 5.1 a11y               |
| 4    | 🟢 PWA, SEO, i18n, pulido visual                                        |

---

## 9. Cambios de esquema propuestos (resumen SQL)

```sql
-- Resultados oficiales por partido
CREATE TABLE IF NOT EXISTS resultados (
  partido_id      TEXT PRIMARY KEY,
  goles_local     INTEGER CHECK (goles_local >= 0),
  goles_visitante INTEGER CHECK (goles_visitante >= 0),
  cerrado         BOOLEAN DEFAULT false
);

-- Vista pública de ranking SIN exponer la IP
CREATE OR REPLACE VIEW v_ranking AS
SELECT id, nombre, curso, puntos, aciertos_exactos, diferencia_goles, fecha_envio
FROM participantes
ORDER BY puntos DESC, aciertos_exactos DESC, diferencia_goles ASC, fecha_envio ASC;
```
