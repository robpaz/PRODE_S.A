// ============================================================
// PRODE MUNDIAL FIFA 2026 — CONFIGURACIÓN CENTRAL
// ============================================================
// Punto único de configuración de la app. Centraliza fechas,
// reglas de puntaje y "feature flags". Editá aquí, no en cada módulo.
// ============================================================

window.CONFIG = {
  // --- Fechas del torneo (ISO 8601, UTC) ---
  // Inicio oficial del Mundial 2026 (usado por la cuenta regresiva).
  MUNDIAL_INICIO: '2026-06-11T17:00:00Z',

  // Zona horaria de referencia (Bolivia, UTC-4) — informativa.
  TZ: 'America/La_Paz',

  // --- Reglas de puntaje (deben coincidir con el RPC de Supabase) ---
  PUNTOS: {
    EXACTO: 3,       // marcador exacto
    RESULTADO: 1,    // acierta 1X2 (ganador/empate) sin marcador exacto
    SIN_ACIERTO: 0,
  },

  COSTO_PARTICIPACION: '10 Bs',

  // --- Feature flags ---
  // Bloquear inputs de un partido cuyo kickoff ya pasó.
  LOCK_BY_KICKOFF: true,

  // Guardar borrador del Prode en localStorage mientras se completa.
  PERSIST_DRAFT: true,

  // Mostrar modal de confirmación antes de enviar.
  CONFIRM_BEFORE_SUBMIT: true,

  // Permitir editar el Prode enviado (requiere token guardado en el dispositivo).
  // ⚠️ Poner en true SOLO después de correr sql/setup.sql actualizado (crea el
  //    índice único participante_id+partido_id y la política UPDATE necesarios
  //    para el UPSERT de edición). En false, el comportamiento es el clásico:
  //    un Prode por dispositivo, sin edición.
  ALLOW_EDIT: false,

  // Usar Edge Function de Supabase para insertar (anti-spam server-side).
  // ⚠️ Mantener en false hasta desplegar supabase/functions/submit-prode
  //    Y aplicar la sección "RLS ENDURECIDA" de sql/setup.sql.
  USE_EDGE_FUNCTION: false,
  EDGE_FUNCTION_NAME: 'submit-prode',

  // --- localStorage keys ---
  LS: {
    ENVIADO: 'prode_enviado',
    DRAFT: 'prode_draft',
    TOKEN: 'prode_token',          // id del participante para "Mi Prode" / edición
    PARTICIPANTES_MOCK: 'prode_participantes_mock',
    IPS_MOCK: 'prode_ips_bloqueadas_mock',
    RESULTADOS_MOCK: 'prode_resultados_mock',
  },
};
