-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — Eliminar columnas quitadas del UI
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE requirements
  DROP COLUMN IF EXISTS bloqueado,
  DROP COLUMN IF EXISTS motivo_bloqueo,
  DROP COLUMN IF EXISTS gestor_responsable,
  DROP COLUMN IF EXISTS cp_total,
  DROP COLUMN IF EXISTS cp_bloqueados,
  DROP COLUMN IF EXISTS cp_gestion,
  DROP COLUMN IF EXISTS cp_diseno,
  DROP COLUMN IF EXISTS cp_it,
  DROP COLUMN IF EXISTS ticket;
