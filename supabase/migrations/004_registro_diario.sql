-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — Registro diario de Actividades
-- Bitácora que cada analista QA llena día a día.
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────
-- 1. ENUM tipo de tarea (lista inicial, ajustable)
-- ──────────────────────────────────────────

CREATE TYPE tipo_tarea_enum AS ENUM (
  'ANALISIS_REQUERIMIENTO',
  'DISENO_CASOS_PRUEBA',
  'EJECUCION_PRUEBAS',
  'REPORTE_DEFECTOS',
  'REUNION',
  'SOPORTE_PRODUCCION',
  'DOCUMENTACION',
  'CAPACITACION',
  'OTROS'
);

-- ──────────────────────────────────────────
-- 2. TABLA registro_diario
-- ──────────────────────────────────────────

CREATE TABLE registro_diario (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  periodo            TEXT NOT NULL,
  iteracion          SMALLINT,
  aplicativo         aplicativo_enum,
  codigo_app         TEXT,
  tipo_solicitud     tipo_requerimiento_enum,
  tipo_tarea         tipo_tarea_enum,

  qa_id              UUID REFERENCES profiles(id) ON DELETE SET NULL,
  horas_ejecutadas   NUMERIC(5,2) NOT NULL DEFAULT 0,
  perfil             TEXT,
  nro_ticket         TEXT,
  fecha_reporte      DATE NOT NULL DEFAULT CURRENT_DATE,
  observaciones      TEXT,

  created_by         UUID REFERENCES profiles(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_registro_diario_qa     ON registro_diario(qa_id);
CREATE INDEX idx_registro_diario_fecha  ON registro_diario(fecha_reporte DESC);
CREATE INDEX idx_registro_diario_periodo ON registro_diario(periodo);

CREATE TRIGGER trg_registro_diario_updated_at
  BEFORE UPDATE ON registro_diario
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ──────────────────────────────────────────
-- 3. RLS — cada analista ve/agrega lo suyo, supervisor ve todo
-- ──────────────────────────────────────────

ALTER TABLE registro_diario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "registro_diario_supervisor" ON registro_diario FOR ALL
  USING (is_supervisor())
  WITH CHECK (is_supervisor());

CREATE POLICY "registro_diario_propio_select" ON registro_diario FOR SELECT
  USING (qa_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "registro_diario_propio_insert" ON registro_diario FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "registro_diario_propio_update" ON registro_diario FOR UPDATE
  USING (qa_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "registro_diario_propio_delete" ON registro_diario FOR DELETE
  USING (qa_id = auth.uid() OR created_by = auth.uid());
