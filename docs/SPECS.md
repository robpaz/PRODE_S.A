# PRODE Mundial FIFA 2026 — Especificación Técnica (Estado Actual)

> Documento de especificación del estado **tal como está** (`as-built`) del proyecto.
> Versión del código documentada: rama `main` (commit `eda92fe`).
> Última actualización: 2026-06-14.

---

## 1. Resumen del producto

**PRODE Mundial FIFA 2026** es una aplicación web estática (SPA por hash-routing) para un
**juego de pronósticos deportivos** (PRODE) sobre la fase de grupos del Mundial FIFA 2026,
organizado por el colegio **San Agustín** (Bolivia).

Cada participante:

1. Pronostica el marcador exacto de los **64 partidos** disponibles de fase de grupos.
2. Ingresa su **nombre** y **curso**.
3. Envía su Prode (una sola vez por dispositivo y por IP).
4. Compite en un **ranking** general con sistema de puntos.

El sitio se publica como sitio estático en **GitHub Pages**:
`https://robpaz.github.io/PRODE_S.A/`

---

## 2. Arquitectura

### 2.1 Stack tecnológico

| Capa            | Tecnología                                            |
|-----------------|-------------------------------------------------------|
| Frontend        | HTML5 + CSS3 (vanilla, sin framework)                 |
| Lógica          | JavaScript ES6 vanilla (patrón módulo IIFE)           |
| Backend / datos | [Supabase](https://supabase.com) (Postgres + REST)    |
| CDN externos    | `@supabase/supabase-js@2`, Google Fonts, flagcdn.com  |
| IP pública      | `api.ipify.org`                                        |
| Hosting         | GitHub Pages (sitio estático)                         |

No hay paso de build: los archivos se sirven tal cual.

### 2.2 Estructura de archivos

```
PRODE_S.A/
├── index.html              # Estructura completa (4 "páginas" en <section>)
├── css/
│   └── styles.css          # Design system + estilos (1695 líneas)
├── js/
│   ├── fixture.js          # Datos estáticos: equipos + 64 partidos
│   ├── supabase-client.js  # Config Supabase + capa de datos + modo mock
│   ├── home.js             # Lógica del Inicio (countdown + top 5)
│   ├── predictions.js      # Lógica del formulario de pronósticos
│   ├── ranking.js          # Lógica del ranking (podio + tabla)
│   ├── rules.js            # Lógica del reglamento (placeholder)
│   └── app.js              # Router por hash + toast + bootstrap
├── images/
│   ├── logo.png            # Logo Mundial
│   └── copa.png            # Trofeo
└── sql/
    └── setup.sql           # Script de creación de tablas + RLS en Supabase
```

### 2.3 Orden de carga de scripts

`index.html` carga en este orden (importa por dependencias globales):

```
fixture.js → supabase-client.js → home.js → predictions.js → ranking.js → rules.js → app.js
```

Cada módulo expone un objeto global (`window.ProdeHome`, `window.ProdePredictions`,
`window.ProdeRanking`, `window.ProdeRules`, `window.ProdeApp`). `fixture.js` y
`supabase-client.js` exponen constantes y funciones globales sueltas.

---

## 3. Modelo de navegación (router)

`app.js` implementa un router por `window.location.hash`. Las 4 secciones son `<section class="page">`:

| Hash           | Sección       | Módulo inicializado          |
|----------------|---------------|------------------------------|
| `#inicio`      | Inicio/Home   | `ProdeHome.init()`           |
| `#prediccion`  | Predicciones  | `ProdePredictions.init()`    |
| `#ranking`     | Ranking       | `ProdeRanking.init()`        |
| `#reglamento`  | Reglamento    | `ProdeRules.init()`          |

Comportamiento del router (`router()` en `app.js`):
- Oculta todas las `.page`, muestra la activa (`.active`); fallback a `#inicio`.
- Marca el `.nav-link` activo.
- Cierra el menú hamburguesa móvil.
- Scroll al tope (`behavior: 'instant'`).
- Se re-ejecuta en cada evento `hashchange`.

---

## 4. Datos del fixture (`fixture.js`)

### 4.1 Equipos (`EQUIPOS`)

Diccionario de **48 selecciones** distribuidas en 12 grupos (A–L), cada una con:
- `nombre`: nombre en español (ej. `'Argentina'`).
- `bandera`: código de país ISO usado para `flagcdn.com` (ej. `'ar'`, `'gb-sct'`).

`flagUrl(code)` → `https://flagcdn.com/w40/<code>.png`.

### 4.2 Partidos (`FIXTURE_GRUPOS`)

Array de 12 grupos. Cada grupo:

```js
{
  grupo: 'A',
  nombreGrupo: 'GRUPO A',
  equipos: ['MEX', 'RSA', 'KOR', 'CZE'],
  soloDesdeJornada2: true,   // si la jornada 1 ya se jugó
  partidos: [ { id, jornada, local, visitante, fecha }, ... ]
}
```

**Regla de negocio del fixture:**
- Grupos **A–D**: jornada 1 **excluida** (`soloDesdeJornada2: true`) → 4 partidos c/u (jornadas 2 y 3).
- Grupos **E–L**: las **3 jornadas** completas → 6 partidos c/u.
- Total: `4 grupos × 4` + `8 grupos × 6` = **16 + 48 = 64 partidos**.

`TODOS_LOS_PARTIDOS` aplana todos los partidos; `TOTAL_PARTIDOS` = 64.

> ⚠️ El `id` de cada partido (ej. `'A3'`, `'E1'`) es la **clave** que se guarda en la BD
> y la que se usaría para corregir y puntuar. El primer carácter del `id` indica el grupo.

---

## 5. Capa de datos (`supabase-client.js`)

### 5.1 Configuración

Dos constantes al tope del archivo:
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

`initSupabase()` valida que no contengan los placeholders `TU_PROYECTO` / `TU_ANON_KEY`.
Si están sin configurar, activa el **modo mock** (banner de aviso en la UI).

### 5.2 Esquema de base de datos

Tabla **`participantes`**:

| Columna            | Tipo          | Notas                                  |
|--------------------|---------------|----------------------------------------|
| `id`               | UUID PK       | `gen_random_uuid()`                    |
| `nombre`           | TEXT NOT NULL |                                        |
| `curso`            | TEXT NOT NULL |                                        |
| `ip`               | TEXT UNIQUE   | IP pública, usada para anti-duplicados |
| `fecha_envio`      | TIMESTAMPTZ   | `now()` — desempate por orden de envío |
| `puntos`           | INTEGER       | default 0 (lo asigna la corrección)    |
| `aciertos_exactos` | INTEGER       | default 0                              |
| `diferencia_goles` | INTEGER       | default 0                              |

Tabla **`predicciones`**:

| Columna           | Tipo          | Notas                                  |
|-------------------|---------------|----------------------------------------|
| `id`              | UUID PK       |                                        |
| `participante_id` | UUID FK       | → `participantes(id)` ON DELETE CASCADE|
| `partido_id`      | TEXT NOT NULL | corresponde a `match.id` del fixture   |
| `goles_local`     | INTEGER ≥ 0   |                                        |
| `goles_visitante` | INTEGER ≥ 0   |                                        |

**RLS:** habilitado en ambas tablas con políticas públicas de `INSERT` y `SELECT`
(`WITH CHECK (true)` / `USING (true)`). No hay política de `UPDATE`/`DELETE` (la corrección
y carga de puntos se hace manualmente desde el panel de Supabase).

### 5.3 API de la capa de datos

| Función                              | Responsabilidad                                              |
|--------------------------------------|-------------------------------------------------------------|
| `initSupabase()`                     | Inicializa cliente; devuelve `true/false`.                  |
| `verificarIpExistente(ip)`           | ¿Ya existe un participante con esa IP?                       |
| `insertarParticipante(nombre,curso,ip)` | Inserta participante, devuelve `id`.                     |
| `insertarPredicciones(id, preds)`    | Inserta en batch las predicciones del participante.         |
| `obtenerClasificacion()`             | Lista ordenada por `puntos`, `aciertos_exactos`, `dif_goles`. |
| `contarParticipantes()`              | Conteo total.                                               |

### 5.4 Modo mock (sin Supabase)

Si Supabase no está configurado, todas las funciones operan contra `localStorage`:
- `prode_participantes_mock` — lista de participantes (7 ficticios precargados).
- `prode_ips_bloqueadas_mock` — IPs ya usadas.
- `prode_predicciones_mock_<id>` — predicciones por participante.

En modo mock, al enviar se asignan **puntos aleatorios** (15–45) para que el ranking
luzca poblado (efecto demo).

---

## 6. Páginas / funcionalidades

### 6.1 Inicio (`home.js`)

- **Cuenta regresiva** hacia `2026-06-11T17:00:00Z` (inicio oficial del Mundial); al llegar a 0
  muestra "¡EL MUNDIAL ESTÁ EN MARCHA!". Actualiza cada segundo.
- **Top 5 participantes** (`obtenerClasificacion().slice(0,5)`), con estados de carga / vacío / error.
- Botón **ACTUALIZAR**.
- `escapeHTML()` para evitar inyección de HTML en nombres/cursos.

### 6.2 Predicciones (`predictions.js`)

Flujo principal:

1. **Render** de tabs de grupo (A–L + "VER TODOS") y de las `match-card` con dos inputs de marcador.
2. **Anti-duplicados** (doble capa):
   - `localStorage['prode_enviado'] === 'true'` → bloquea (motivo `dispositivo`).
   - IP pública vía `api.ipify.org` (timeout 3.5s) → `verificarIpExistente(ip)` → bloquea (motivo `ip`).
3. **Barra de progreso** "N / 64 partidos pronosticados" en vivo según inputs completados.
4. **Validación al enviar**:
   - Todos los 64 partidos completos (si no, hace scroll a la primera tarjeta vacía y resalta en rojo).
   - `nombre` y `curso` obligatorios.
   - Re-verifica IP justo antes de guardar (evita carrera).
5. **Persistencia**: `insertarParticipante` → `insertarPredicciones` (batch).
6. Marca el dispositivo como enviado, muestra toast de éxito y redirige a `#ranking`.

Detalles:
- Inputs de marcador fuerzan entero ≥ 0.
- Existe un botón oculto "🎲 COMPLETAR AL AZAR (PRUEBAS)" (`fillRandomPredictions`) — para pruebas.
- `aplicarBloqueoDeFormulario(motivo)` deshabilita inputs y muestra mensaje de acceso limitado.

### 6.3 Ranking (`ranking.js`)

- **Podio Top 3** (🥇🥈🥉) con bloques de altura diferenciada.
- **Tabla completa** ordenada por la clasificación.
- Estados de carga / vacío / error; botón **ACTUALIZAR**.
- `escapeHTML()` aplicado.

### 6.4 Reglamento (`index.html` + `rules.js`)

Contenido **estático** en el HTML; `rules.js` es un placeholder (solo loguea init).

Sistema de puntos documentado en la UI:

| Resultado                          | Puntos |
|------------------------------------|--------|
| Acierto exacto (marcador idéntico) | **+3** |
| Acierto de resultado (1X2) sin marcador exacto | **+1** |
| Sin aciertos                       | **0**  |

**Costo de participación:** 10 Bs (QR o efectivo).

**Criterios de desempate (en orden):**
1. Mayor cantidad de **aciertos exactos**.
2. **Diferencia de goles acertada** (menor diferencia queda por delante).
3. **Fecha/hora de envío** (quien envió antes tiene prioridad).

---

## 7. Sistema de diseño (`styles.css`)

- **Tema:** oscuro, identidad FIFA 2026 (verdes + dorado).
- **Tipografías:** `Outfit` (títulos) e `Inter` (texto) desde Google Fonts.
- **Tokens** (CSS custom properties en `:root`): colores, sombras, radios, transiciones, fuentes.
- Componentes: navbar con hamburguesa responsive, hero con trofeo/glow, countdown, cards de
  partido, barra de progreso, podio, tablas de posiciones, toast, banner de configuración.

---

## 8. Componentes transversales

- **Toast** (`ProdeApp.showToast(title, msg, isError)`): notificación temporal (4s), variantes éxito/error.
- **Banner de config**: visible solo si Supabase no está configurado.
- **Menú hamburguesa**: toggle en móvil; se cierra al navegar.

---

## 9. Reglas de negocio (resumen)

1. Solo se pronostican los **64 partidos** definidos (jornada 1 de A–D excluida).
2. **Un Prode por dispositivo** (localStorage) **y por IP** (Supabase UNIQUE + verificación).
3. Se exigen **todos** los marcadores + nombre + curso para enviar.
4. La **corrección y puntuación** NO está automatizada en el frontend: `puntos`,
   `aciertos_exactos` y `diferencia_goles` se cargan manualmente en Supabase. La app solo
   **lee** y ordena la clasificación.
5. Desempate: aciertos exactos → diferencia de goles → fecha de envío.

---

## 10. Limitaciones conocidas (estado actual)

- **Sin corrección automática**: los puntos se cargan a mano en la BD.
- **Anti-duplicado por IP** penaliza redes con NAT compartido (todo un colegio puede salir con
  una sola IP pública → solo el primero podría enviar).
- **`SUPABASE_ANON_KEY` versionada** en el repo (es pública por diseño, pero la seguridad
  depende 100% de las políticas RLS, que hoy permiten `INSERT` anónimo sin límite).
- **Sin validación anti-spam/captcha**: cualquiera puede insertar participantes vía API pública.
- **Sin edición** del Prode una vez enviado.
- **`rules.js`** no aporta lógica (contenido estático).
- **Fechas del fixture** son strings legibles (`'Jue 18 Jun'`), no fechas reales → no se puede
  cerrar el ingreso por hora de partido automáticamente.
