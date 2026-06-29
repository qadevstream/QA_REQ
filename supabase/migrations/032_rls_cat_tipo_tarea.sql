-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — Políticas RLS para cat_tipo_tarea
-- La tabla se creó desde el Table Editor (que habilita RLS sin políticas),
-- por lo que la app leía 0 filas aunque los datos existieran: el dropdown
-- "Tipo de Tarea" del Registro Diario salía vacío.
--
-- Mismo patrón que aplicativos_catalogo (migración 014):
--   lectura = cualquier usuario autenticado · escritura = Supervisor/Admin.
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE cat_tipo_tarea ENABLE ROW LEVEL SECURITY;

-- Lectura: todos los usuarios autenticados
DROP POLICY IF EXISTS "cat_tipo_tarea_select" ON cat_tipo_tarea;
CREATE POLICY "cat_tipo_tarea_select" ON cat_tipo_tarea
  FOR SELECT USING (auth.role() = 'authenticated');

-- Escritura: solo Supervisor / Administrador (is_supervisor)
DROP POLICY IF EXISTS "cat_tipo_tarea_insert" ON cat_tipo_tarea;
CREATE POLICY "cat_tipo_tarea_insert" ON cat_tipo_tarea
  FOR INSERT WITH CHECK (is_supervisor());

DROP POLICY IF EXISTS "cat_tipo_tarea_update" ON cat_tipo_tarea;
CREATE POLICY "cat_tipo_tarea_update" ON cat_tipo_tarea
  FOR UPDATE USING (is_supervisor());

DROP POLICY IF EXISTS "cat_tipo_tarea_delete" ON cat_tipo_tarea;
CREATE POLICY "cat_tipo_tarea_delete" ON cat_tipo_tarea
  FOR DELETE USING (is_supervisor());
