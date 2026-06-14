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
- 🎨 Tema oscuro con identidad visual FIFA 2026 (verdes + dorado), responsive.
- 🧪 **Modo demo** automático con datos de prueba si Supabase no está configurado.

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
├── index.html          # Estructura de las 4 secciones (SPA por hash)
├── css/styles.css      # Design system + estilos
├── js/
│   ├── fixture.js          # Equipos + 64 partidos
│   ├── supabase-client.js  # Configuración + capa de datos + modo mock
│   ├── home.js             # Inicio (countdown + top 5)
│   ├── predictions.js      # Formulario de pronósticos
│   ├── ranking.js          # Podio + tabla
│   ├── rules.js            # Reglamento (placeholder)
│   └── app.js              # Router por hash + toasts + bootstrap
├── images/             # logo.png, copa.png
├── sql/setup.sql       # Creación de tablas + RLS en Supabase
└── docs/               # SPECS.md (estado actual) y SPECS_IMPROVEMENTS.md (mejoras)
```

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
- [`CHANGELOG.md`](./CHANGELOG.md) — Historial de cambios.

---

## 🤝 Mantenimiento

Proyecto del colegio **San Agustín**. Para corregir y puntuar, hoy se cargan manualmente los
campos `puntos`, `aciertos_exactos` y `diferencia_goles` en Supabase (ver roadmap para
automatizarlo).
