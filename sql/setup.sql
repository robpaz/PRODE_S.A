-- ============================================================
-- SQL CONFIGURATION SCRIPT FOR PRODE FIFA WORLD CUP 2026
-- Copy and run this script in the Supabase SQL Editor
-- ============================================================

-- 1. Create the 'participantes' table (or update if you are setting up fresh)
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

-- NOTA: Si ya creaste tu tabla antes y solo quieres agregar la columna 'ip':
-- Ejecuta esta línea en tu SQL Editor:
-- ALTER TABLE participantes ADD COLUMN IF NOT EXISTS ip TEXT UNIQUE;

-- 2. Create the 'predicciones' table
CREATE TABLE IF NOT EXISTS predicciones (
  id               UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  participante_id  UUID    REFERENCES participantes(id) ON DELETE CASCADE,
  partido_id       TEXT    NOT NULL,
  goles_local      INTEGER NOT NULL CHECK (goles_local >= 0),
  goles_visitante  INTEGER NOT NULL CHECK (goles_visitante >= 0)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE participantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE predicciones ENABLE ROW LEVEL SECURITY;

-- 4. Create public insert/select policies for anonymous users
-- Note: Replace existing policies if they already exist

CREATE POLICY "insert_participantes" ON participantes
  FOR INSERT WITH CHECK (true);

CREATE POLICY "select_participantes" ON participantes
  FOR SELECT USING (true);

CREATE POLICY "insert_predicciones" ON predicciones
  FOR INSERT WITH CHECK (true);

CREATE POLICY "select_predicciones" ON predicciones
  FOR SELECT USING (true);

-- 5. Create some initial mock participants (optional)
-- Run this if you want to prepopulate the database immediately
-- INSERT INTO participantes (nombre, curso, puntos, aciertos_exactos, diferencia_goles) VALUES
--   ('Mateo Fernández', '6to A', 42, 12, 6),
--   ('Sofía Rodríguez', '5to B', 38, 10, 8),
--   ('Santiago Benítez', '4to A', 35, 9, 8),
--   ('Valentina Gomez', '6to B', 35, 8, 11),
--   ('Lucas Martínez', '5to A', 31, 8, 7);
