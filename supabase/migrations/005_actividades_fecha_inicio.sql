-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — Agrega Fecha de Inicio a Actividades
-- (paridad con la vista de detalle de Planner: Fecha de inicio / Fecha
-- de vencimiento)
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE actividades ADD COLUMN fecha_inicio DATE;
