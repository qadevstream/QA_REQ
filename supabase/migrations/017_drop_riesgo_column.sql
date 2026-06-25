-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — Eliminar columna riesgo de requirements
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE requirements DROP COLUMN IF EXISTS riesgo;

DROP TYPE IF EXISTS riesgo_enum;
