# PRODE Mundial FIFA 2026 — Mejoras con IA (OpenRouter + DeepSeek)

> Propuesta de funciones con IA para el sitio, usando **OpenRouter** como gateway
> y **DeepSeek** como modelo. Documento de diseño/roadmap — la implementación se
> hace por fases y requiere primero resolver la arquitectura segura (§1).
> Fecha: 2026-06-14.

---

## 0. ⚠️ Seguridad: la API key NUNCA va en el frontend

El sitio es **estático** (GitHub Pages, sin servidor). Cualquier cosa en `js/` es
**pública**: queda en el repo y se sirve a todos los visitantes. Por lo tanto:

- ❌ **NO** poner `OPENROUTER_API_KEY` en `js/*.js`, `index.html`, ni en el repo.
- ❌ **NO** llamar a `https://openrouter.ai/...` directamente desde el navegador.
- ✅ Usar un **proxy server-side** que guarde la key como *secret* y reenvíe los pedidos.

> La key compartida por chat debe **rotarse** en OpenRouter (Dashboard → Keys) y cargarse
> únicamente como secret del proxy, nunca commitearse.

---

## 1. Arquitectura: proxy con Supabase Edge Function

Reutilizamos la infraestructura que ya existe (Supabase del proyecto).

```
Navegador (frontend)
   │  POST /functions/v1/ai-proxy   (con la anon key del sitio)
   ▼
Supabase Edge Function "ai-proxy"   ← guarda OPENROUTER_API_KEY como secret
   │  - valida el tipo de pedido (allow-list de "tareas")
   │  - aplica rate-limit por IP
   │  - arma el prompt server-side (el cliente NO manda prompts libres)
   │  POST https://openrouter.ai/api/v1/chat/completions
   ▼
OpenRouter → DeepSeek
```

### 1.1 Detalle OpenRouter
- Endpoint: `POST https://openrouter.ai/api/v1/chat/completions`
- Headers: `Authorization: Bearer $OPENROUTER_API_KEY`, `Content-Type: application/json`,
  opcional `HTTP-Referer: https://robpaz.github.io/PRODE_S.A/` y `X-Title: PRODE FIFA 2026`.
- Body (OpenAI-compatible):
  ```json
  {
    "model": "deepseek/deepseek-chat",
    "messages": [{"role":"system","content":"..."},{"role":"user","content":"..."}],
    "temperature": 0.5,
    "max_tokens": 600
  }
  ```
- **Modelo DeepSeek:** confirmar el slug exacto en <https://openrouter.ai/models?q=deepseek>.
  Candidatos: `deepseek/deepseek-chat` (V3), `deepseek/deepseek-r1` (razonamiento).
  Si existe "V4", usar su slug oficial; dejarlo **configurable** (no hardcodear) en el secret/env
  `AI_MODEL` del proxy.

### 1.2 Reglas del proxy (anti-abuso, porque la Edge Function es pública)
- **Allow-list de tareas**: el cliente manda `{ tarea: "...", params: {...} }`, NO prompts libres.
  El proxy arma el prompt final. Evita que usen tu saldo como ChatGPT gratis.
- **Rate-limit por IP** (ej. N pedidos/min) — tabla `ai_rate_limit` o en memoria por request.
- **Límite de tokens** por respuesta (`max_tokens`) y de tamaño de entrada.
- **Caché** de respuestas deterministas (ej. resumen de una jornada ya cerrada) en una tabla
  `ai_cache` para no re-pagar el mismo texto.
- Manejar y registrar errores/uso (tokens) para monitorear costo.

### 1.3 Despliegue
```
supabase secrets set OPENROUTER_API_KEY=sk-or-...   # la key ROTADA, nunca en el repo
supabase secrets set AI_MODEL=deepseek/deepseek-chat
supabase functions deploy ai-proxy --no-verify-jwt
```
El frontend agrega un flag en `js/config.js` (`AI_ENABLED`, `AI_PROXY_FN = 'ai-proxy'`).

---

## 2. Funciones con IA propuestas (priorizadas)

Prioridad: 🔴 alto valor/feasible · 🟠 medio · 🟢 nice-to-have.
Costo: aprox. por llamada (DeepSeek es barato; igual conviene caché y rate-limit).

### 🔴 2.1 Asistente / Chatbot del PRODE
Burbuja de chat que responde dudas: **cómo participar, sistema de puntos, desempates,
costo (10 Bs), fechas, cómo ver "Mi Prode"**. El proxy inyecta como contexto el
**reglamento** (de `docs/REGLAMENTO.md` / `CONFIG`) → respuestas siempre correctas y on-brand.
- Tarea proxy: `asistente` (params: pregunta del usuario, acotada).
- Valor: baja fricción para alumnos nuevos; reduce preguntas repetidas.

### 🔴 2.2 Resumen/narración de la jornada y del ranking
Al cargar resultados, IA escribe un **recap** estilo relator: "Tras el 7‑1 de Alemania,
Jorge Colque lidera por diferencia de gol…". Se muestra en Inicio/Ranking.
- Tarea proxy: `recap_jornada` (params: standings + resultados recientes; el proxy los lee de la BD).
- Cacheable por jornada (se genera 1 vez). Muy buen costo/beneficio.

### 🔴 2.3 Normalización de cursos (calidad de datos)
Hoy hay cursos escritos distinto que son el mismo: `4to B`, `4toB`, `4to año B`, `4B`.
IA (o reglas + IA de respaldo) los **unifica** a una forma canónica → métricas por curso
correctas (admin) y ranking por curso.
- Tarea proxy: `normalizar_curso` (params: texto del curso) → devuelve curso canónico.
- Aplicar al enviar (sugerencia) y/o en un proceso de limpieza desde el admin.

### 🟠 2.4 "Tu perfil de pronosticador"
En la sección Predicciones, IA analiza los 64 pronósticos de un participante y genera un
comentario: "Sos optimista con los grandes, predecís muchos empates, arriesgás goleadas…".
- Tarea proxy: `perfil_pronosticador` (params: participante_id; el proxy lee sus predicciones).
- Cacheable hasta que el participante edite su Prode.

### 🟠 2.5 Tarjeta para compartir (engagement)
Genera un texto/tarjeta para WhatsApp: "Voy 3º en el PRODE del Mundial 🏆, ¿me alcanzás?".
- Tarea proxy: `tarjeta_compartir` (params: participante_id).

### 🟠 2.6 Analista de datos para el admin (NL → insight)
En `admin.html`, el admin pregunta en lenguaje natural ("¿qué curso va ganando?",
"¿cuántos pronosticaron empate en E1?") y la IA responde sobre los datos.
- Tarea proxy: `consulta_admin` (solo con passphrase admin; el proxy ejecuta consultas
  **predefinidas/seguras**, no SQL libre del modelo).

### 🟢 2.7 Detección de anomalías / posibles trampas
IA marca envíos sospechosos (ej. registrarse después de un partido y acertar el marcador
exacto, como pasó con un caso real). Apoyo al admin, no acción automática.
- Tarea proxy: `revisar_anomalias` (params: ventana temporal; lee participantes/resultados).

### 🟢 2.8 Sugerencia de marcador (solo diversión)
Botón opcional "Sugerir" por partido que propone un marcador plausible (con aviso de que es
solo orientativo). Ojo: no debe facilitar trampa en partidos ya jugados (los bloqueados no aplican).
- Tarea proxy: `sugerir_marcador` (params: equipos del partido).

### 🟢 2.9 Reglas explicadas / tutor
Variante del chatbot enfocada en explicar desempates con ejemplos a pedido.

---

## 3. Roadmap sugerido

| Fase | Alcance |
|------|---------|
| 0 | 🔴 **Proxy seguro** `ai-proxy` (Edge Function + secret + rate-limit + allow-list). Base de todo. |
| 1 | 🔴 Chatbot/asistente (2.1) + Recap de jornada cacheado (2.2). |
| 2 | 🔴 Normalización de cursos (2.3) + 🟠 Perfil de pronosticador (2.4). |
| 3 | 🟠 Tarjeta para compartir (2.5) + Analista admin (2.6). |
| 4 | 🟢 Anomalías (2.7), sugerencia de marcador (2.9/2.8), tutor (2.9). |

---

## 4. Costos y límites (a tener en cuenta)
- DeepSeek vía OpenRouter es **económico**, pero al ser un sitio público hay que blindar el
  proxy (rate-limit + allow-list + caché) para evitar abuso del saldo.
- Definir un **tope de gasto** en OpenRouter (límite de la key) como red de seguridad.
- Cachear todo lo que sea determinista (recaps de jornadas cerradas, perfiles hasta edición).

---

## 5. Cambios de archivos previstos (cuando se implemente)
- `supabase/functions/ai-proxy/index.ts` — proxy con allow-list de tareas + rate-limit + caché.
- `sql/setup.sql` — tablas opcionales `ai_cache`, `ai_rate_limit`.
- `js/config.js` — `AI_ENABLED`, `AI_PROXY_FN`.
- `js/ai.js` — cliente que llama al proxy (`window.ProdeAI.tarea(nombre, params)`).
- UI por feature: widget de chat, bloque de recap, botón de perfil, etc.

> Nada de esto expone la key: el frontend solo habla con la Edge Function.
