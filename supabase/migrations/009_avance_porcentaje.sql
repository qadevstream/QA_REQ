-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — Agrega Avance (%) a Requerimientos
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE requirements
  ADD COLUMN avance_porcentaje SMALLINT NOT NULL DEFAULT 0
  CONSTRAINT chk_avance_porcentaje CHECK (avance_porcentaje >= 0 AND avance_porcentaje <= 100);
