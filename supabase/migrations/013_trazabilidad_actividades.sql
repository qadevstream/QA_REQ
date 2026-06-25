-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — Trazabilidad de Estados (Planner / Actividades)
-- Registra automáticamente CADA cambio de columna del tablero, con
-- fecha y quién lo hizo, para poder calcular cuánto tiempo estuvo un
-- ticket en cada estado.
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE actividad_estado_historial (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actividad_id    UUID NOT NULL REFERENCES actividades(id) ON DELETE CASCADE,
  estado_anterior actividad_estado_enum,
  estado_nuevo    actividad_estado_enum NOT NULL,
  changed_by      UUID REFERENCES profiles(id),
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_actividad_historial_actividad   ON actividad_estado_historial(actividad_id);
CREATE INDEX idx_actividad_historial_changed_at  ON actividad_estado_historial(changed_at);

-- Registra el estado inicial al crear la actividad
CREATE OR REPLACE FUNCTION log_actividad_estado_inicial()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO actividad_estado_historial (actividad_id, estado_anterior, estado_nuevo, changed_by)
  VALUES (NEW.id, NULL, NEW.estado, NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_actividad_estado_inicial
  AFTER INSERT ON actividades
  FOR EACH ROW EXECUTE FUNCTION log_actividad_estado_inicial();

-- Registra cada cambio de columna/estado
CREATE OR REPLACE FUNCTION log_actividad_estado_cambio()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO actividad_estado_historial (actividad_id, estado_anterior, estado_nuevo, changed_by)
    VALUES (NEW.id, OLD.estado, NEW.estado, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_actividad_estado_cambio
  AFTER UPDATE ON actividades
  FOR EACH ROW EXECUTE FUNCTION log_actividad_estado_cambio();

-- RLS
ALTER TABLE actividad_estado_historial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "actividad_historial_supervisor" ON actividad_estado_historial FOR SELECT
  USING (is_supervisor());

CREATE POLICY "actividad_historial_propio" ON actividad_estado_historial FOR SELECT
  USING (
    actividad_id IN (SELECT id FROM actividades WHERE qa_asignado_id = auth.uid())
  );

CREATE POLICY "actividad_historial_insert" ON actividad_estado_historial FOR INSERT WITH CHECK (true);
