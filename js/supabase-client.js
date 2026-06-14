// ============================================================
// SUPABASE CLIENT — PRODE MUNDIAL FIFA 2026
// ============================================================
// PASO 1: Creá un proyecto gratuito en https://supabase.com
// PASO 2: Andá a Project Settings > API
// PASO 3: Pegá tu URL y Anon Key abajo
// ============================================================

// ⚙️  CONFIGURACIÓN — EDITÁ ESTAS DOS LÍNEAS:
const SUPABASE_URL = 'https://mpzsraavipfzqacubiuo.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wenNyYWF2aXBmenFhY3ViaXVvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyOTgwNDAsImV4cCI6MjA5Njg3NDA0MH0.3YblrFTF9JAqPzmZIKuG0k5-7VeQRKnh8-NTONUYHZg';

// ============================================================
// SQL DE CONFIGURACIÓN — Ejecutarlo en el SQL Editor de Supabase
// ============================================================
/*
-- Tabla de participantes
CREATE TABLE participantes (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre           TEXT        NOT NULL,
  curso            TEXT        NOT NULL,
  ip               TEXT        UNIQUE,
  fecha_envio      TIMESTAMPTZ DEFAULT now(),
  puntos           INTEGER     DEFAULT 0,
  aciertos_exactos INTEGER     DEFAULT 0,
  diferencia_goles INTEGER     DEFAULT 0
);

-- Tabla de predicciones
CREATE TABLE predicciones (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  participante_id  UUID    REFERENCES participantes(id) ON DELETE CASCADE,
  partido_id       TEXT    NOT NULL,
  goles_local      INTEGER NOT NULL CHECK (goles_local >= 0),
  goles_visitante  INTEGER NOT NULL CHECK (goles_visitante >= 0)
);

-- Habilitar Row Level Security
ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE predicciones  ENABLE ROW LEVEL SECURITY;

-- Políticas: cualquiera puede insertar y leer
CREATE POLICY "insert_participantes" ON participantes FOR INSERT WITH CHECK (true);
CREATE POLICY "select_participantes" ON participantes FOR SELECT USING (true);
CREATE POLICY "insert_predicciones"  ON predicciones  FOR INSERT WITH CHECK (true);
CREATE POLICY "select_predicciones"  ON predicciones  FOR SELECT USING (true);
*/

// ============================================================
// Cliente Supabase
// ============================================================

let _supabase = null;
let supabaseConfigurado = false;

function initSupabase() {
  if (
    SUPABASE_URL.includes('TU_PROYECTO') ||
    SUPABASE_ANON_KEY.includes('TU_ANON_KEY')
  ) {
    console.warn('⚠️ Supabase no configurado. Edita js/supabase-client.js');
    supabaseConfigurado = false;
    return false;
  }
  try {
    _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    supabaseConfigurado = true;
    console.log('✅ Supabase conectado correctamente.');
    return true;
  } catch (e) {
    console.error('❌ Error al inicializar Supabase:', e);
    supabaseConfigurado = false;
    return false;
  }
}

// ---- HELPERS MOCK PARA DESARROLLO LOCAL SIN CONFIGURAR SUPABASE ----
function getMockParticipantes() {
  const MOCK_PARTICIPANTES_KEY = LS_PARTICIPANTES;
  let data = localStorage.getItem(MOCK_PARTICIPANTES_KEY);
  if (!data) {
    const initialMock = [
      { id: 'mock-1', nombre: 'Mateo Fernández', curso: '6to A', puntos: 42, aciertos_exactos: 12, diferencia_goles: 6, fecha_envio: new Date(Date.now() - 86400000 * 3).toISOString() },
      { id: 'mock-2', nombre: 'Sofía Rodríguez', curso: '5to B', puntos: 38, aciertos_exactos: 10, diferencia_goles: 8, fecha_envio: new Date(Date.now() - 86400000 * 2).toISOString() },
      { id: 'mock-3', nombre: 'Santiago Benítez', curso: '4to A', puntos: 35, aciertos_exactos: 9, diferencia_goles: 8, fecha_envio: new Date(Date.now() - 86400000 * 4).toISOString() },
      { id: 'mock-4', nombre: 'Valentina Gomez', curso: '6to B', puntos: 35, aciertos_exactos: 8, diferencia_goles: 11, fecha_envio: new Date(Date.now() - 86400000 * 1).toISOString() },
      { id: 'mock-5', nombre: 'Lucas Martínez', curso: '5to A', puntos: 31, aciertos_exactos: 8, diferencia_goles: 7, fecha_envio: new Date(Date.now() - 86400000 * 5).toISOString() },
      { id: 'mock-6', nombre: 'Camila Díaz', curso: '3er A', puntos: 28, aciertos_exactos: 7, diferencia_goles: 7, fecha_envio: new Date(Date.now() - 86400000 * 6).toISOString() },
      { id: 'mock-7', nombre: 'Thiago Silva', curso: '4to B', puntos: 25, aciertos_exactos: 6, diferencia_goles: 7, fecha_envio: new Date(Date.now() - 86400000 * 7).toISOString() }
    ];
    initialMock.sort((a, b) => b.puntos - a.puntos || b.aciertos_exactos - a.aciertos_exactos || b.diferencia_goles - a.diferencia_goles);
    localStorage.setItem(MOCK_PARTICIPANTES_KEY, JSON.stringify(initialMock));
    return initialMock;
  }
  try {
    const list = JSON.parse(data);
    list.sort((a, b) => b.puntos - a.puntos || b.aciertos_exactos - a.aciertos_exactos || b.diferencia_goles - a.diferencia_goles);
    return list;
  } catch (e) {
    return [];
  }
}

// ---- KEYS DE localStorage (con fallback si CONFIG no cargó) --
function _lsKey(name, fallback) {
  return (window.CONFIG && window.CONFIG.LS && window.CONFIG.LS[name]) || fallback;
}
const LS_PARTICIPANTES = _lsKey('PARTICIPANTES_MOCK', 'prode_participantes_mock');
const LS_IPS = _lsKey('IPS_MOCK', 'prode_ips_bloqueadas_mock');
const LS_RESULTADOS = _lsKey('RESULTADOS_MOCK', 'prode_resultados_mock');

// ---- VERIFICAR IP EXISTENTE ---------------------------------
async function verificarIpExistente(ip) {
  if (!ip) return false;
  if (!supabaseConfigurado) {
    const ipsBloqueadas = JSON.parse(localStorage.getItem(LS_IPS) || '[]');
    return ipsBloqueadas.includes(ip);
  }
  try {
    const { data, error } = await _supabase
      .from('participantes')
      .select('id')
      .eq('ip', ip)
      .limit(1);
    if (error) throw error;
    return data && data.length > 0;
  } catch (e) {
    console.error('Error al verificar IP:', e);
    return false;
  }
}

// ---- INSERTAR participante (devuelve el ID creado) ----------
async function insertarParticipante(nombre, curso, ip) {
  if (!supabaseConfigurado) {
    const id = 'mock-' + Math.random().toString(36).substr(2, 9);
    const mockParticipantes = getMockParticipantes();
    const nuevo = {
      id,
      nombre,
      curso,
      ip,
      fecha_envio: new Date().toISOString(),
      puntos: 0,
      aciertos_exactos: 0,
      diferencia_goles: 0
    };
    mockParticipantes.push(nuevo);
    localStorage.setItem(LS_PARTICIPANTES, JSON.stringify(mockParticipantes));

    // Guardar IP bloqueada localmente
    if (ip) {
      const ipsBloqueadas = JSON.parse(localStorage.getItem(LS_IPS) || '[]');
      if (!ipsBloqueadas.includes(ip)) {
        ipsBloqueadas.push(ip);
        localStorage.setItem(LS_IPS, JSON.stringify(ipsBloqueadas));
      }
    }
    return id;
  }
  const { data, error } = await _supabase
    .from('participantes')
    .insert([{ nombre, curso, ip }])
    .select('id')
    .single();
  if (error) throw error;
  return data.id;
}

// ---- INSERTAR predicciones en batch -----------------------
async function insertarPredicciones(participanteId, predicciones) {
  // predicciones = [{ partido_id, goles_local, goles_visitante }, ...]
  if (!supabaseConfigurado) {
    localStorage.setItem(`prode_predicciones_mock_${participanteId}`, JSON.stringify(predicciones));
    return;
  }
  const rows = predicciones.map(p => ({
    participante_id: participanteId,
    partido_id: p.partido_id,
    goles_local: p.goles_local,
    goles_visitante: p.goles_visitante,
  }));
  const { error } = await _supabase.from('predicciones').insert(rows);
  if (error) throw error;
}

// ---- OBTENER tabla de posiciones --------------------------
async function obtenerClasificacion() {
  if (!supabaseConfigurado) {
    return getMockParticipantes();
  }
  const { data, error } = await _supabase
    .from('participantes')
    .select('id, nombre, curso, puntos, aciertos_exactos, diferencia_goles, fecha_envio')
    .order('puntos', { ascending: false })
    .order('aciertos_exactos', { ascending: false })
    .order('diferencia_goles', { ascending: false });
  if (error) {
    console.error('Error al obtener clasificación:', error);
    return [];
  }
  return data || [];
}

// ---- CONTAR participantes ----------------------------------
async function contarParticipantes() {
  if (!supabaseConfigurado) {
    return getMockParticipantes().length;
  }
  const { count, error } = await _supabase
    .from('participantes')
    .select('*', { count: 'exact', head: true });
  if (error) return 0;
  return count || 0;
}

// ---- ENVIAR PRODE (vía Edge Function, anti-spam) -----------
// Devuelve el id del participante creado. Úsese cuando
// CONFIG.USE_EDGE_FUNCTION === true.
async function enviarProdeViaEdge(nombre, curso, predicciones) {
  const fnName = (window.CONFIG && window.CONFIG.EDGE_FUNCTION_NAME) || 'submit-prode';
  const { data, error } = await _supabase.functions.invoke(fnName, {
    body: { nombre, curso, predicciones },
  });
  if (error) throw error;
  if (data && data.error) throw new Error(data.error);
  return data.id;
}

// ---- OBTENER predicciones de un participante (Mi Prode) ----
async function obtenerPrediccionesDeParticipante(participanteId) {
  if (!participanteId) return [];
  if (!supabaseConfigurado) {
    return JSON.parse(localStorage.getItem(`prode_predicciones_mock_${participanteId}`) || '[]');
  }
  const { data, error } = await _supabase
    .from('predicciones')
    .select('partido_id, goles_local, goles_visitante')
    .eq('participante_id', participanteId);
  if (error) {
    console.error('Error al obtener predicciones:', error);
    return [];
  }
  return data || [];
}

// ---- OBTENER un participante por id ------------------------
async function obtenerParticipante(participanteId) {
  if (!participanteId) return null;
  if (!supabaseConfigurado) {
    return getMockParticipantes().find(p => p.id === participanteId) || null;
  }
  const { data, error } = await _supabase
    .from('participantes')
    .select('id, nombre, curso, puntos, aciertos_exactos, diferencia_goles, fecha_envio')
    .eq('id', participanteId)
    .maybeSingle();
  if (error) {
    console.error('Error al obtener participante:', error);
    return null;
  }
  return data;
}

// ---- ACTUALIZAR predicciones (editar Prode, UPSERT) --------
async function actualizarPredicciones(participanteId, predicciones) {
  if (!supabaseConfigurado) {
    localStorage.setItem(`prode_predicciones_mock_${participanteId}`, JSON.stringify(predicciones));
    return;
  }
  const rows = predicciones.map(p => ({
    participante_id: participanteId,
    partido_id: p.partido_id,
    goles_local: p.goles_local,
    goles_visitante: p.goles_visitante,
  }));
  const { error } = await _supabase
    .from('predicciones')
    .upsert(rows, { onConflict: 'participante_id,partido_id' });
  if (error) throw error;
}

// ---- OBTENER resultados oficiales (corrección) -------------
async function obtenerResultados() {
  if (!supabaseConfigurado) {
    return JSON.parse(localStorage.getItem(LS_RESULTADOS) || '[]');
  }
  const { data, error } = await _supabase
    .from('resultados')
    .select('partido_id, goles_local, goles_visitante, cerrado');
  if (error) {
    // Degradación elegante: si la tabla 'resultados' aún no existe
    // (setup.sql no aplicado), se devuelve vacío sin romper la UI.
    console.warn('Resultados no disponibles todavía:', error.message || error);
    return [];
  }
  return data || [];
}

// ---- ADMIN: guardar/actualizar un resultado ----------------
async function guardarResultado(partidoId, golesLocal, golesVisitante, cerrado = true) {
  if (!supabaseConfigurado) {
    const lista = JSON.parse(localStorage.getItem(LS_RESULTADOS) || '[]');
    const idx = lista.findIndex(r => r.partido_id === partidoId);
    const row = { partido_id: partidoId, goles_local: golesLocal, goles_visitante: golesVisitante, cerrado };
    if (idx >= 0) lista[idx] = row; else lista.push(row);
    localStorage.setItem(LS_RESULTADOS, JSON.stringify(lista));
    return;
  }
  const { error } = await _supabase
    .from('resultados')
    .upsert([{ partido_id: partidoId, goles_local: golesLocal, goles_visitante: golesVisitante, cerrado, actualizado: new Date().toISOString() }], { onConflict: 'partido_id' });
  if (error) throw error;
}

// ---- ADMIN: recalcular ranking (RPC) -----------------------
async function recalcularRanking() {
  if (!supabaseConfigurado) {
    // En mock: recalcular en cliente contra resultados locales.
    const resultados = JSON.parse(localStorage.getItem(LS_RESULTADOS) || '[]');
    const mapR = {};
    resultados.forEach(r => { mapR[r.partido_id] = r; });
    const participantes = getMockParticipantes();
    participantes.forEach(p => {
      const preds = JSON.parse(localStorage.getItem(`prode_predicciones_mock_${p.id}`) || '[]');
      let puntos = 0, exactos = 0, dif = 0;
      preds.forEach(pred => {
        const real = mapR[pred.partido_id];
        if (!real) return;
        const res = window.ProdeUtils.calcularPuntos(pred, real);
        puntos += res.puntos;
        if (res.exacto) exactos += 1;
        dif += Math.abs((pred.goles_local - pred.goles_visitante) - (real.goles_local - real.goles_visitante));
      });
      p.puntos = puntos; p.aciertos_exactos = exactos; p.diferencia_goles = dif;
    });
    localStorage.setItem(LS_PARTICIPANTES, JSON.stringify(participantes));
    return;
  }
  const { error } = await _supabase.rpc('as_recalcular_ranking');
  if (error) throw error;
}

// ---- MÉTRICAS: conteo por curso ----------------------------
async function contarPorCurso() {
  const participantes = await obtenerClasificacion();
  const mapa = {};
  participantes.forEach(p => {
    const c = (p.curso || 'Sin curso').trim();
    mapa[c] = (mapa[c] || 0) + 1;
  });
  return Object.entries(mapa)
    .map(([curso, total]) => ({ curso, total }))
    .sort((a, b) => b.total - a.total);
}
