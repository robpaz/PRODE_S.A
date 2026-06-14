-- ============================================================
-- SQL CONFIGURATION SCRIPT — PRODE FIFA WORLD CUP 2026
-- Ejecutar en el SQL Editor de Supabase.
-- Secciones:
--   1. Tablas base (participantes, predicciones)
--   2. RLS y políticas públicas (modo actual)
--   3. Resultados oficiales + vista de ranking
--   4. RPC de corrección/puntuación automática (as_recalcular_ranking)
--   5. (OPCIONAL) RLS endurecida + Edge Function
-- ============================================================


-- ============================================================
-- 1. TABLAS BASE
-- ============================================================

CREATE TABLE IF NOT EXISTS participantes (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre           TEXT        NOT NULL,
  curso            TEXT        NOT NULL,
  ip               TEXT        UNIQUE,
  fecha_envio      TIMESTAMPTZ DEFAULT now(),
  puntos           INTEGER     DEFAULT 0,
  aciertos_exactos INTEGER     DEFAULT 0,
  diferencia_goles INTEGER     DEFAULT 0
);

-- Si ya existe la tabla y falta la columna 'ip':
-- ALTER TABLE participantes ADD COLUMN IF NOT EXISTS ip TEXT UNIQUE;

CREATE TABLE IF NOT EXISTS predicciones (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  participante_id  UUID    REFERENCES participantes(id) ON DELETE CASCADE,
  partido_id       TEXT    NOT NULL,
  goles_local      INTEGER NOT NULL CHECK (goles_local >= 0),
  goles_visitante  INTEGER NOT NULL CHECK (goles_visitante >= 0)
);

-- Evita predicciones duplicadas del mismo partido por participante
-- (necesario para poder EDITAR el Prode con UPSERT).
CREATE UNIQUE INDEX IF NOT EXISTS uq_prediccion_participante_partido
  ON predicciones (participante_id, partido_id);


-- ============================================================
-- 2. RLS Y POLÍTICAS PÚBLICAS (MODO ACTUAL)
-- ============================================================

ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE predicciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert_participantes" ON participantes;
DROP POLICY IF EXISTS "select_participantes" ON participantes;
DROP POLICY IF EXISTS "insert_predicciones" ON predicciones;
DROP POLICY IF EXISTS "select_predicciones" ON predicciones;

CREATE POLICY "insert_participantes" ON participantes FOR INSERT WITH CHECK (true);
CREATE POLICY "select_participantes" ON participantes FOR SELECT USING (true);
CREATE POLICY "insert_predicciones"  ON predicciones  FOR INSERT WITH CHECK (true);
CREATE POLICY "select_predicciones"  ON predicciones  FOR SELECT USING (true);

-- Permitir editar la propia predicción (UPSERT) — modo actual sin auth.
DROP POLICY IF EXISTS "update_predicciones" ON predicciones;
CREATE POLICY "update_predicciones" ON predicciones FOR UPDATE USING (true) WITH CHECK (true);


-- ============================================================
-- 3. RESULTADOS OFICIALES + VISTA DE RANKING
-- ============================================================

CREATE TABLE IF NOT EXISTS resultados (
  partido_id      TEXT PRIMARY KEY,
  goles_local     INTEGER CHECK (goles_local >= 0),
  goles_visitante INTEGER CHECK (goles_visitante >= 0),
  cerrado         BOOLEAN DEFAULT false,
  actualizado     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE resultados ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "select_resultados" ON resultados;
CREATE POLICY "select_resultados" ON resultados FOR SELECT USING (true);

-- MODO SIMPLE: permite cargar resultados desde el panel admin (admin.html)
-- con la anon key + passphrase del lado del cliente. NO es seguridad real;
-- para producción endurecida, quitar estas políticas y escribir resultados
-- vía service role / Edge Function (ver sección 5).
DROP POLICY IF EXISTS "insert_resultados" ON resultados;
DROP POLICY IF EXISTS "update_resultados" ON resultados;
CREATE POLICY "insert_resultados" ON resultados FOR INSERT WITH CHECK (true);
CREATE POLICY "update_resultados" ON resultados FOR UPDATE USING (true) WITH CHECK (true);

-- Vista pública de ranking (no expone la columna 'ip').
CREATE OR REPLACE VIEW v_ranking AS
SELECT id, nombre, curso, puntos, aciertos_exactos, diferencia_goles, fecha_envio
FROM participantes
ORDER BY puntos DESC, aciertos_exactos DESC, diferencia_goles ASC, fecha_envio ASC;


-- ============================================================
-- 4. RPC DE CORRECCIÓN / PUNTUACIÓN AUTOMÁTICA
-- ------------------------------------------------------------
-- Recalcula puntos, aciertos_exactos y diferencia_goles de TODOS los
-- participantes comparando 'predicciones' contra 'resultados' cargados.
--   +3 si marcador exacto
--   +1 si acierta 1X2 (signo del resultado) sin marcador exacto
--    0 en otro caso
-- diferencia_goles = suma de |dif_pronosticada - dif_real| sobre partidos
--                    con resultado (criterio de desempate: menor es mejor).
-- ============================================================

CREATE OR REPLACE FUNCTION as_recalcular_ranking()
RETURNS void
LANGUAGE sql
AS $$
  WITH calc AS (
    SELECT
      pr.participante_id AS pid,
      SUM(
        CASE
          WHEN pr.goles_local = r.goles_local
           AND pr.goles_visitante = r.goles_visitante THEN 3
          WHEN sign(pr.goles_local - pr.goles_visitante)
             = sign(r.goles_local - r.goles_visitante) THEN 1
          ELSE 0
        END
      ) AS puntos,
      COUNT(*) FILTER (
        WHERE pr.goles_local = r.goles_local
          AND pr.goles_visitante = r.goles_visitante
      ) AS exactos,
      COALESCE(SUM(
        abs((pr.goles_local - pr.goles_visitante) - (r.goles_local - r.goles_visitante))
      ), 0) AS dif
    FROM predicciones pr
    JOIN resultados r ON r.partido_id = pr.partido_id
    GROUP BY pr.participante_id
  )
  UPDATE participantes p
  SET puntos           = COALESCE(c.puntos, 0),
      aciertos_exactos = COALESCE(c.exactos, 0),
      diferencia_goles = COALESCE(c.dif, 0)
  FROM (
    SELECT p2.id AS pid,
           c.puntos, c.exactos, c.dif
    FROM participantes p2
    LEFT JOIN calc c ON c.pid = p2.id
  ) c
  WHERE p.id = c.pid;
$$;

-- Para correr la corrección manualmente:
-- SELECT as_recalcular_ranking();


-- ============================================================
-- 5. (OPCIONAL) RLS ENDURECIDA + EDGE FUNCTION  ⚠️
-- ------------------------------------------------------------
-- Aplicar SOLO cuando se despliegue supabase/functions/submit-prode
-- y se ponga CONFIG.USE_EDGE_FUNCTION = true en js/config.js.
-- Esto deja de permitir INSERT anónimo directo: toda escritura pasa
-- por la Edge Function (service role), que valida y aplica rate-limit.
-- Si lo aplicás SIN desplegar la función, se rompe el envío del sitio.
-- ============================================================

-- DROP POLICY IF EXISTS "insert_participantes" ON participantes;
-- DROP POLICY IF EXISTS "insert_predicciones"  ON predicciones;
-- DROP POLICY IF EXISTS "update_predicciones"  ON predicciones;
-- -- Sin políticas de INSERT/UPDATE para 'anon': solo el service role escribe.
-- -- Lecturas siguen públicas (SELECT) vía v_ranking.


-- ============================================================
-- DATOS DE PRUEBA (opcional)
-- ============================================================
-- INSERT INTO participantes (nombre, curso, puntos, aciertos_exactos, diferencia_goles) VALUES
--   ('Mateo Fernández', '6to A', 42, 12, 6),
--   ('Sofía Rodríguez', '5to B', 38, 10, 8),
--   ('Santiago Benítez', '4to A', 35, 9, 8);
