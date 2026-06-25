-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — Agrega Prioridad a Requerimientos
-- Reutiliza actividad_prioridad_enum (Urgente/Importante/Media/Baja)
-- para mantener consistencia con el tablero Planner.
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE requirements
  ADD COLUMN prioridad actividad_prioridad_enum NOT NULL DEFAULT 'MEDIA';
