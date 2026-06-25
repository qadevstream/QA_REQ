-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — Agrega ATI Responsable a Requerimientos
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE requirements ADD COLUMN ati_responsable TEXT;
