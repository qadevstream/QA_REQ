-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — Actividades (tablero Kanban estilo Planner)
-- Requiere haber ejecutado antes: 002_aplicativos_reales.sql
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────
-- 1. ENUM de estados del tablero
-- ──────────────────────────────────────────

CREATE TYPE actividad_estado_enum AS ENUM (
  'PEND_ASIGNACION',
  'EN_ESTIMACION',
  'PEND_APROB_ATI',
  'EN_PRUEBAS_QA',
  'OBSERVADO_BLOQUEADO',
  'EN_PRUEBAS_USUARIO',
  'TERMINADO'
);

-- Prioridad estilo Planner (4 niveles)
CREATE TYPE actividad_prioridad_enum AS ENUM (
  'URGENTE',
  'IMPORTANTE',
  'MEDIA',
  'BAJA'
);

-- Sub-estado de avance de la tarjeta (independiente de la columna del
-- tablero), estilo Planner: No iniciado / En curso / Completado
CREATE TYPE actividad_progreso_enum AS ENUM (
  'NO_INICIADO',
  'EN_CURSO',
  'COMPLETADO'
);

-- ──────────────────────────────────────────
-- 2. TABLA actividades
-- ──────────────────────────────────────────

CREATE TABLE actividades (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  tck                TEXT NOT NULL,
  aplicativo         aplicativo_enum,

  estado             actividad_estado_enum NOT NULL DEFAULT 'PEND_ASIGNACION',
  estado_changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  posicion           INTEGER NOT NULL DEFAULT 0,

  ati_responsable    TEXT,
  qa_asignado_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,

  fecha_compromiso   DATE,
  prioridad          actividad_prioridad_enum NOT NULL DEFAULT 'MEDIA',
  progreso           actividad_progreso_enum NOT NULL DEFAULT 'NO_INICIADO',
  observaciones      TEXT,

  -- Vínculo opcional con un Requerimiento formal
  requirement_id     UUID REFERENCES requirements(id) ON DELETE SET NULL,

  created_by         UUID REFERENCES profiles(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_actividades_estado     ON actividades(estado);
CREATE INDEX idx_actividades_qa         ON actividades(qa_asignado_id);
CREATE INDEX idx_actividades_created_at ON actividades(created_at DESC);

-- ──────────────────────────────────────────
-- 3. Triggers: updated_at + registrar cambio de estado
-- ──────────────────────────────────────────

CREATE TRIGGER trg_actividades_updated_at
  BEFORE UPDATE ON actividades
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION track_actividad_estado_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    NEW.estado_changed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actividades_estado_change
  BEFORE UPDATE ON actividades
  FOR EACH ROW EXECUTE FUNCTION track_actividad_estado_change();

-- ──────────────────────────────────────────
-- 4. RLS — reutiliza is_supervisor() ya creada en 001
-- ──────────────────────────────────────────

ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "actividades_supervisor" ON actividades FOR ALL
  USING (is_supervisor())
  WITH CHECK (is_supervisor());

CREATE POLICY "actividades_analista_select" ON actividades FOR SELECT
  USING (qa_asignado_id = auth.uid());

CREATE POLICY "actividades_analista_insert" ON actividades FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "actividades_analista_update" ON actividades FOR UPDATE
  USING (qa_asignado_id = auth.uid());
