-- ═══════════════════════════════════════════════════════════════════
-- QACC — Agregar columnas ati_responsable y correo a aplicativos_catalogo
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE aplicativos_catalogo
  ADD COLUMN IF NOT EXISTS ati_responsable TEXT,
  ADD COLUMN IF NOT EXISTS correo          TEXT;
