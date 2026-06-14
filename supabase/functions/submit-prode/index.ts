// ============================================================
// EDGE FUNCTION — submit-prode
// PRODE Mundial FIFA 2026 — inserción/edición server-side endurecida
// ------------------------------------------------------------
// Valida el payload, aplica rate-limit por IP y escribe con el
// service role (bypassa RLS de forma controlada). Activar en el
// frontend con CONFIG.USE_EDGE_FUNCTION = true.
//
// Deploy:
//   supabase functions deploy submit-prode --no-verify-jwt
//   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=...   (ya disponible por defecto)
//
// Requiere también aplicar la sección 5 (RLS endurecida) de sql/setup.sql.
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const TOTAL_PARTIDOS = 64;          // debe coincidir con el fixture
const MAX_GOLES = 30;               // tope defensivo por marcador
const RATE_LIMIT_POR_IP = 5;        // máx. envíos por IP por ventana
const VENTANA_MINUTOS = 60;

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

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'JSON inválido' }, 400);
  }

  const { nombre, curso, predicciones } = payload ?? {};

  // --- Validación de campos ---
  if (typeof nombre !== 'string' || nombre.trim().length < 2 || nombre.length > 80) {
    return json({ error: 'Nombre inválido' }, 400);
  }
  if (typeof curso !== 'string' || curso.trim().length < 1 || curso.length > 40) {
    return json({ error: 'Curso inválido' }, 400);
  }
  if (!Array.isArray(predicciones) || predicciones.length < 1 || predicciones.length > TOTAL_PARTIDOS) {
    return json({ error: `Cantidad de predicciones inválida (1..${TOTAL_PARTIDOS})` }, 400);
  }
  const idsVistos = new Set<string>();
  for (const p of predicciones) {
    if (
      typeof p?.partido_id !== 'string' ||
      !Number.isInteger(p?.goles_local) || p.goles_local < 0 || p.goles_local > MAX_GOLES ||
      !Number.isInteger(p?.goles_visitante) || p.goles_visitante < 0 || p.goles_visitante > MAX_GOLES
    ) {
      return json({ error: 'Predicción inválida' }, 400);
    }
    if (idsVistos.has(p.partido_id)) return json({ error: 'partido_id duplicado' }, 400);
    idsVistos.add(p.partido_id);
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    req.headers.get('cf-connecting-ip') ||
    null;

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  // --- Rate-limit por IP (señal, no bloqueo duro de identidad) ---
  if (ip) {
    const desde = new Date(Date.now() - VENTANA_MINUTOS * 60_000).toISOString();
    const { count } = await admin
      .from('participantes')
      .select('id', { count: 'exact', head: true })
      .eq('ip', ip)
      .gte('fecha_envio', desde);
    if ((count ?? 0) >= RATE_LIMIT_POR_IP) {
      return json({ error: 'Demasiados envíos desde esta red. Intentá más tarde.' }, 429);
    }
  }

  // --- Insertar participante ---
  const { data: part, error: e1 } = await admin
    .from('participantes')
    .insert([{ nombre: nombre.trim(), curso: curso.trim(), ip }])
    .select('id')
    .single();
  if (e1 || !part) return json({ error: 'No se pudo registrar el participante' }, 500);

  // --- Insertar predicciones ---
  const rows = predicciones.map((p: any) => ({
    participante_id: part.id,
    partido_id: p.partido_id,
    goles_local: p.goles_local,
    goles_visitante: p.goles_visitante,
  }));
  const { error: e2 } = await admin.from('predicciones').insert(rows);
  if (e2) {
    await admin.from('participantes').delete().eq('id', part.id); // rollback best-effort
    return json({ error: 'No se pudieron guardar las predicciones' }, 500);
  }

  return json({ id: part.id }, 200);
});
