# ⚽ PRODE Mundial FIFA 2026

Juego de **pronósticos deportivos** (PRODE) para la fase de grupos del **Mundial FIFA 2026**,
organizado por el colegio **San Agustín** (Bolivia).

🔗 **Sitio en vivo:** https://robpaz.github.io/PRODE_S.A/

Los participantes pronostican el marcador de los **64 partidos** de la fase de grupos disponibles,
ingresan su nombre y curso, y compiten en un **ranking** con sistema de puntos.

---

## ✨ Características

- 🏟️ **64 partidos** de fase de grupos (12 grupos A–L).
- ⏱️ **Cuenta regresiva** al inicio del Mundial.
- 📊 **Barra de progreso** en vivo de pronósticos completados.
- 🏆 **Ranking** con podio Top 3 y tabla completa.
- 🚫 **Anti-duplicados**: un Prode por dispositivo (localStorage) y por IP.
- 🔒 **Cierre por hora de partido**: los partidos ya jugados se bloquean automáticamente.
- 📝 **Borrador automático**, **modal de confirmación** y **filtro por jornada**.
- 👤 **Mi Prode**: revisá tus pronósticos y los puntos que vas sumando.
- 🛠️ **Panel admin** (`admin.html`): carga de resultados, recálculo de ranking y métricas por curso.
- 📲 **PWA instalable** (offline del app shell) + metadatos sociales (Open Graph/Twitter).
- 🎨 Tema oscuro con identidad visual FIFA 2026 (verdes + dorado), responsive.
- 🧪 **Modo demo** automático con datos de prueba si Supabase no está configurado.

> Varias funciones avanzadas se controlan por flags en `js/config.js`
> (`LOCK_BY_KICKOFF`, `PERSIST_DRAFT`, `CONFIRM_BEFORE_SUBMIT`, `ALLOW_EDIT`,
> `USE_EDGE_FUNCTION`). `ALLOW_EDIT` y `USE_EDGE_FUNCTION` quedan en `false` hasta
> ejecutar el `sql/setup.sql` actualizado / desplegar la Edge Function.

## 🧮 Sistema de puntos

| Resultado                                      | Puntos |
|------------------------------------------------|:------:|
| Acierto exacto (marcador idéntico)             | **+3** |
| Acierto de resultado (gana/empata) sin marcador| **+1** |
| Sin aciertos                                   | **0**  |

**Desempate:** aciertos exactos → diferencia de goles → fecha/hora de envío.
**Costo de participación:** 10 Bs (QR o efectivo).

---

## 🏗️ Stack

- **Frontend:** HTML5 + CSS3 + JavaScript vanilla (sin framework, sin build).
- **Backend/datos:** [Supabase](https://supabase.com) (Postgres + REST + RLS).
- **CDNs:** `@supabase/supabase-js@2`, Google Fonts (Outfit/Inter), flagcdn.com, api.ipify.org.
- **Hosting:** GitHub Pages.

```
PRODE_S.A/
├── index.html          # SPA por hash (Inicio, Predicción, Mi Prode, Ranking, Reglamento)
├── admin.html          # Panel admin (resultados, recálculo, métricas)
├── manifest.webmanifest, sw.js   # PWA
├── css/styles.css      # Design system + estilos
├── js/
│   ├── config.js           # Configuración central (fechas, puntaje, flags)
│   ├── utils.js            # Utilidades compartidas
│   ├── fixture.js          # Equipos + 64 partidos + kickoff
│   ├── supabase-client.js  # Capa de datos + modo mock
│   ├── home.js             # Inicio (countdown + top 5 + métricas)
│   ├── predictions.js      # Formulario (locks, borrador, modal, jornadas, edición)
│   ├── ranking.js          # Podio + tabla
│   ├── miprode.js          # "Mi Prode"
│   ├── rules.js            # Reglamento (puntaje desde config)
│   ├── admin.js            # Panel admin
│   └── app.js              # Router por hash + toasts + SW + bootstrap
├── supabase/functions/submit-prode/   # Edge Function (anti-spam, opcional)
├── images/             # logo.png, copa.png
├── sql/setup.sql       # Tablas, RLS, resultados, vista y RPC de corrección
└── docs/               # SPECS.md (estado actual) y SPECS_IMPROVEMENTS.md (mejoras)
```

### Panel admin

`admin.html` permite cargar los resultados oficiales, recalcular el ranking
(`as_recalcular_ranking`) y ver métricas por curso. Protegido por una passphrase
del lado del cliente (editable en `js/admin.js`, constante `ADMIN_PASS`) — barrera
básica, no seguridad fuerte. Requiere el `sql/setup.sql` actualizado aplicado.

---

## 🚀 Puesta en marcha

### Ver el sitio
No requiere build. Para desarrollo local, servir la carpeta con cualquier servidor estático:

```bash
# Opción 1: Python
python3 -m http.server 8000
# Opción 2: Node
npx serve .
```

Luego abrir `http://localhost:8000`.

> Abrir `index.html` con `file://` directo puede fallar por CORS de los CDNs; usá un servidor local.

### Configurar Supabase

1. Crear un proyecto gratuito en https://supabase.com.
2. En **Project Settings → API**, copiar la **Project URL** y la **anon public key**.
3. Editar `js/supabase-client.js`:
   ```js
   const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co';
   const SUPABASE_ANON_KEY = 'TU_ANON_KEY';
   ```
4. En el **SQL Editor** de Supabase, ejecutar el contenido de [`sql/setup.sql`](./sql/setup.sql)
   (crea las tablas `participantes` y `predicciones`, habilita RLS y las políticas públicas).

Si no se configura Supabase, la app corre en **modo demo** con datos en `localStorage` y muestra
un banner de aviso.

> ℹ️ La `anon key` es pública por diseño (va en el cliente); la seguridad depende de las
> políticas **RLS**. Ver [`docs/SPECS_IMPROVEMENTS.md`](./docs/SPECS_IMPROVEMENTS.md) §2 para
> recomendaciones de endurecimiento.

---

## 📦 Despliegue (GitHub Pages)

El sitio se publica automáticamente desde la rama `main` en GitHub Pages:

```bash
git add .
git commit -m "..."
git push origin main
```

Tras el push, GitHub Pages despliega y el sitio queda disponible en
**https://robpaz.github.io/PRODE_S.A/**. Verificar que el deploy responda **HTTP 200** después
de cada cambio.

---

## 📚 Documentación

- [`docs/SPECS.md`](./docs/SPECS.md) — Especificación técnica del **estado actual**.
- [`docs/SPECS_IMPROVEMENTS.md`](./docs/SPECS_IMPROVEMENTS.md) — **Propuesta de mejoras** y roadmap.
- [`docs/REGLAMENTO.md`](./docs/REGLAMENTO.md) — **Reglamento del juego** (puntaje, desempates, participación).
- [`docs/MEJORAS_IA.md`](./docs/MEJORAS_IA.md) — **Mejoras con IA** (OpenRouter + DeepSeek): arquitectura segura (proxy) y features propuestas.
- [`CHANGELOG.md`](./CHANGELOG.md) — Historial de cambios.

---

## 🤝 Mantenimiento

Proyecto del colegio **San Agustín**. Para corregir y puntuar, hoy se cargan manualmente los
campos `puntos`, `aciertos_exactos` y `diferencia_goles` en Supabase (ver roadmap para
automatizarlo).
