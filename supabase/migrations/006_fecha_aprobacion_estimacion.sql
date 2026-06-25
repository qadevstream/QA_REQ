-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — Agrega Fecha Aprobación Estimación a Requerimientos
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE requirements ADD COLUMN fecha_aprobacion_estimacion DATE;
