-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — Reparación del sincronizado de H. Real
--
-- SÍNTOMA: en Reportes, la columna "H. Real" salía en 0 aunque el ticket
-- tuviera horas cargadas en Actividades → Registro Diario. Ej.: el ticket
-- 19865 tenía 22 h registradas y mostraba 0.
--
-- CAUSA 1 — la migración 034 no llegó a ejecutarse en la base: no existen
-- ni el trigger ni las funciones que recalculan requirement_iterations
-- .horas_reales a partir de registro_diario. Sin eso, nada sincroniza:
-- 41 de 42 iteraciones estaban en 0.
--
-- CAUSA 2 — server/actions/registroDiario.ts llama
-- rpc('sync_horas_reales', { p_nro_ticket }), pero en la 034
-- `sync_horas_reales` es el nombre del TRIGGER, no de una función. Esa
-- función nunca existió, así que la llamada respondía 404. No se notaba
-- porque el código no revisa el error de la RPC: fallaba en silencio.
--
-- Esta migración es IDEMPOTENTE y auto-contenida: deja la base correcta
-- haya corrido o no la 034, así no hay que averiguar qué se ejecutó.
--
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- 1. Recalcula el H. Real de UNA iteración (ticket + nro de iteración)
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

-- 2. La función que faltaba: recalcula TODAS las iteraciones de un ticket.
--    Es la que invoca la app por RPC tras crear, editar o borrar un
--    registro diario. El trigger de abajo ya cubre esos casos, así que
--    esta llamada es redundante — pero se define igual para que el código
--    existente deje de fallar en silencio, y porque sirve para forzar un
--    resincronizado manual de un ticket puntual.
CREATE OR REPLACE FUNCTION sync_horas_reales(p_nro_ticket TEXT)
RETURNS VOID AS $$
  UPDATE requirement_iterations ri
  SET horas_reales = COALESCE((
        SELECT SUM(rd.horas_ejecutadas)
        FROM registro_diario rd
        WHERE rd.nro_ticket = p_nro_ticket
          AND rd.iteracion  = ri.iteracion
      ), 0)
  FROM requirements r
  WHERE ri.requirement_id = r.id
    AND r.codigo_requerimiento = p_nro_ticket;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- 3. Trigger: recalcula la(s) iteración(es) afectada(s) en cada cambio
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

DROP TRIGGER IF EXISTS sync_horas_reales ON registro_diario;
CREATE TRIGGER sync_horas_reales
  AFTER INSERT OR UPDATE OR DELETE ON registro_diario
  FOR EACH ROW EXECUTE FUNCTION trg_sync_horas_reales();

-- 4. Backfill: recalcular todo con lo ya registrado en la bitácora.
--    Verificado antes de escribir esto: la única iteración que hoy tiene
--    H. Real distinto de 0 (ticket 19941, con 4 h cargadas a mano) sí
--    tiene registros en la bitácora (18.75 h), así que el backfill la
--    CORRIGE en vez de borrarla. Ninguna fila pierde información.
--
--    ⚠️ Ojo a futuro: horas_reales pasa a derivarse SIEMPRE de la
--    bitácora. Un valor cargado a mano (por ejemplo importado del Excel
--    de requerimientos) que no tenga registros detrás quedará en 0.
UPDATE requirement_iterations ri
SET horas_reales = COALESCE((
      SELECT SUM(rd.horas_ejecutadas)
      FROM registro_diario rd
      WHERE rd.nro_ticket = r.codigo_requerimiento
        AND rd.iteracion  = ri.iteracion
    ), 0)
FROM requirements r
WHERE ri.requirement_id = r.id;
