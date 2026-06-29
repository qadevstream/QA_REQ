-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — tipo_tarea de registro_diario pasa de ENUM a TEXT
-- El dropdown "Tipo de Tarea" se alimenta del catálogo cat_tipo_tarea,
-- pero la columna era de tipo enum (tipo_tarea_enum) y rechazaba valores
-- nuevos: "invalid input value for enum tipo_tarea_enum: '[GSTI] …'".
--
-- Mismo enfoque que aplicativo en la migración 014: columna libre (TEXT)
-- validada por el catálogo, no por un enum rígido.
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- 1. Liberar la columna del tipo enum
ALTER TABLE registro_diario
  ALTER COLUMN tipo_tarea TYPE TEXT USING tipo_tarea::text;

-- 2. Eliminar el enum (ya no hay columnas que lo usen)
DROP TYPE IF EXISTS tipo_tarea_enum;
