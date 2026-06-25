-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — Quita la obligatoriedad de tipo_requerimiento
-- Se retira el campo "Tipo" del formulario de Requerimientos (no existe
-- en el backlog real). La columna se mantiene por compatibilidad pero
-- ya no es obligatoria.
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE requirements ALTER COLUMN tipo_requerimiento DROP NOT NULL;
