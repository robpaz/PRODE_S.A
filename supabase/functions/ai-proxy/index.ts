// ============================================================
// EDGE FUNCTION — ai-proxy
// PRODE Mundial FIFA 2026 — proxy seguro a OpenRouter (DeepSeek)
// ------------------------------------------------------------
// El frontend llama a esta función (con la anon key); la key de
// OpenRouter vive SOLO acá como secret (OPENROUTER_API_KEY). El
// cliente manda { tarea, params } de una allow-list; el prompt se
// arma server-side. Incluye rate-limit por IP.
//
// Secrets requeridos (supabase secrets / Management API):
//   OPENROUTER_API_KEY   (la key de OpenRouter — NUNCA en el repo)
//   AI_MODEL             (ej. deepseek/deepseek-chat)  [opcional]
// Auto-inyectados por Supabase: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Deploy:
//   supabase functions deploy ai-proxy --no-verify-jwt
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = Deno.env.get('AI_MODEL') || 'deepseek/deepseek-chat';
const RATE_LIMIT = 10;          // máx. llamadas por IP por ventana
const VENTANA_SEG = 60;         // ventana de rate-limit
const MAX_PREGUNTA = 500;       // tope de caracteres de la pregunta

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// Contexto del juego que se inyecta al asistente (siempre correcto y on-brand).
const CONTEXTO_PRODE = `
Sos el asistente del "PRODE Mundial FIFA 2026" del colegio San Agustín (Bolivia).
Respondé SOLO sobre este juego de pronósticos, en español, breve y amable (máx ~4 frases).
Si te preguntan algo ajeno al PRODE, redirigí amablemente al tema.

Reglas del juego:
- Se pronostica el marcador de los partidos de la fase de grupos del Mundial 2026.
- Puntaje: +3 si acertás el marcador EXACTO; +1 si acertás solo el resultado (ganador o empate);
  0 si no acertás. Los puntos del usuario son la suma de todos los partidos con resultado.
- Diferencia de goles (desempate, MENOR es mejor): suma de |dif pronosticada - dif real|.
- Desempate del ranking: más puntos, luego más aciertos exactos, luego menor diferencia de goles,
  luego quien envió antes.
- Costo de participación: 10 Bs (se paga por QR o efectivo).
- Un Prode por navegador/dispositivo.
- Los partidos que ya terminaron (con resultado cargado) quedan bloqueados y no se pueden pronosticar.
- Secciones del sitio: Inicio (countdown + top), Hacer Predicción, Predicciones (ver la de cualquiera),
  Ranking, Reglamento.
`.trim();

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  let payload: any;
  try { payload = await req.json(); } catch { return json({ error: 'JSON inválido' }, 400); }
  const { tarea, params } = payload ?? {};

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('cf-connecting-ip') || 'desconocida';

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // --- Rate-limit por IP ---
  const desde = new Date(Date.now() - VENTANA_SEG * 1000).toISOString();
  const { count } = await admin
    .from('ai_usage')
    .select('id', { count: 'exact', head: true })
    .eq('ip', ip)
    .gte('created_at', desde);
  if ((count ?? 0) >= RATE_LIMIT) {
    return json({ error: 'Demasiadas consultas. Esperá un momento e intentá de nuevo.' }, 429);
  }

  // --- Armar mensajes según la tarea (allow-list) ---
  let messages: Array<{ role: string; content: string }>;
  if (tarea === 'asistente') {
    const pregunta = String(params?.pregunta ?? '').slice(0, MAX_PREGUNTA).trim();
    if (!pregunta) return json({ error: 'Pregunta vacía' }, 400);
    messages = [
      { role: 'system', content: CONTEXTO_PRODE },
      { role: 'user', content: pregunta },
    ];
  } else {
    return json({ error: 'Tarea no permitida' }, 400);
  }

  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) return json({ error: 'IA no configurada' }, 500);

  // --- Llamar a OpenRouter ---
  let reply = '';
  let tokens = 0;
  try {
    const r = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://robpaz.github.io/PRODE_S.A/',
        'X-Title': 'PRODE FIFA 2026',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.5,
        max_tokens: 500,
      }),
    });
    const data = await r.json();
    if (!r.ok) {
      console.error('OpenRouter error:', data);
      return json({ error: 'Error del modelo de IA' }, 502);
    }
    reply = data?.choices?.[0]?.message?.content?.trim() || '';
    tokens = data?.usage?.total_tokens || 0;
  } catch (e) {
    console.error('Fetch OpenRouter falló:', e);
    return json({ error: 'No se pudo contactar a la IA' }, 502);
  }

  // --- Registrar uso (best-effort) ---
  try { await admin.from('ai_usage').insert([{ ip, tarea, tokens }]); } catch (_) { /* noop */ }

  return json({ reply });
});
