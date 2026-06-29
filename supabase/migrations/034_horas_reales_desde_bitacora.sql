-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — H. Real auto-sumado desde la Bitácora
-- requirement_iterations.horas_reales deja de ser manual y pasa a ser la
-- suma de registro_diario.horas_ejecutadas, vinculada por:
--   registro_diario.nro_ticket = requirements.codigo_requerimiento
--   registro_diario.iteracion  = requirement_iterations.iteracion
--
-- Se mantiene actualizado con un trigger en registro_diario (INSERT /
-- UPDATE / DELETE) y se hace un backfill inicial con lo ya registrado.
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- 1. Recalcular el H. Real de la iteración que corresponde a (ticket, iter)
CREATE OR REPLACE FUNCTION recompute_iteracion_horas_reales(p_ticket TEXT, p_iter SMALLINT)
RETURNS VOID AS $$
  UPDATE requirement_iterations ri
  SET horas_reales = COALESCE((
        SELECT SUM(rd.horas_ejecutadas)
        FROM registro_diario rd
        WHERE rd.nro_ticket = p_ticket
          AND rd.iteracion  = p_iter
      ), 0)
  FROM requirements r
  WHERE ri.requirement_id = r.id
    AND r.codigo_requerimiento = p_ticket
    AND ri.iteracion = p_iter;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 2. Trigger function: recalcula la(s) iteración(es) afectada(s)
CREATE OR REPLACE FUNCTION trg_sync_horas_reales()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    IF OLD.nro_ticket IS NOT NULL AND OLD.iteracion IS NOT NULL THEN
      PERFORM recompute_iteracion_horas_reales(OLD.nro_ticket, OLD.iteracion);
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.nro_ticket IS NOT NULL AND NEW.iteracion IS NOT NULL THEN
    PERFORM recompute_iteracion_horas_reales(NEW.nro_ticket, NEW.iteracion);
  END IF;

  -- Si en un UPDATE cambió el ticket o la iteración, recalcular también el anterior
  IF (TG_OP = 'UPDATE')
     AND OLD.nro_ticket IS NOT NULL AND OLD.iteracion IS NOT NULL
     AND (OLD.nro_ticket IS DISTINCT FROM NEW.nro_ticket
          OR OLD.iteracion IS DISTINCT FROM NEW.iteracion) THEN
    PERFORM recompute_iteracion_horas_reales(OLD.nro_ticket, OLD.iteracion);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Enlazar el trigger
DROP TRIGGER IF EXISTS sync_horas_reales ON registro_diario;
CREATE TRIGGER sync_horas_reales
  AFTER INSERT OR UPDATE OR DELETE ON registro_diario
  FOR EACH ROW EXECUTE FUNCTION trg_sync_horas_reales();

-- 4. Backfill: recalcular todas las iteraciones a partir de lo ya registrado
UPDATE requirement_iterations ri
SET horas_reales = COALESCE((
      SELECT SUM(rd.horas_ejecutadas)
      FROM registro_diario rd
      WHERE rd.nro_ticket = r.codigo_requerimiento
        AND rd.iteracion  = ri.iteracion
    ), 0)
FROM requirements r
WHERE ri.requirement_id = r.id;
