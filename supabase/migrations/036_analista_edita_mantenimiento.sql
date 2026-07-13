-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — ANALISTA_QA puede EDITAR el Mantenimiento
-- Catálogos de la vista Mantenimiento:
--   · aplicativos_catalogo  (Matriz de Aplicaciones)
--   · cat_tipo_tarea        (Catálogo de Tipos de Tarea)
--
-- Antes: la escritura (INSERT/UPDATE/DELETE) estaba restringida a
-- Supervisor/Administrador vía is_supervisor() (migraciones 014 y 032).
-- El analista veía los catálogos pero cualquier alta/edición/baja fallaba
-- con "new row violates row-level security policy".
--
-- Ahora: se agregan políticas ADITIVAS para ANALISTA_QA, siguiendo el
-- mismo patrón que la migración 030. Las políticas de Supervisor se
-- mantienen intactas; RLS combina ambas con OR. El CLIENTE sigue sin
-- poder escribir (no tiene política de escritura).
--
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- ─── aplicativos_catalogo: escritura para el analista ────────────────
DROP POLICY IF EXISTS "ap_catalogo_insert_analista" ON aplicativos_catalogo;
CREATE POLICY "ap_catalogo_insert_analista" ON aplicativos_catalogo
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ANALISTA_QA'
  );

DROP POLICY IF EXISTS "ap_catalogo_update_analista" ON aplicativos_catalogo;
CREATE POLICY "ap_catalogo_update_analista" ON aplicativos_catalogo
  FOR UPDATE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ANALISTA_QA'
  );

DROP POLICY IF EXISTS "ap_catalogo_delete_analista" ON aplicativos_catalogo;
CREATE POLICY "ap_catalogo_delete_analista" ON aplicativos_catalogo
  FOR DELETE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ANALISTA_QA'
  );

-- ─── cat_tipo_tarea: escritura para el analista ──────────────────────
DROP POLICY IF EXISTS "cat_tipo_tarea_insert_analista" ON cat_tipo_tarea;
CREATE POLICY "cat_tipo_tarea_insert_analista" ON cat_tipo_tarea
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ANALISTA_QA'
  );

DROP POLICY IF EXISTS "cat_tipo_tarea_update_analista" ON cat_tipo_tarea;
CREATE POLICY "cat_tipo_tarea_update_analista" ON cat_tipo_tarea
  FOR UPDATE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ANALISTA_QA'
  );

DROP POLICY IF EXISTS "cat_tipo_tarea_delete_analista" ON cat_tipo_tarea;
CREATE POLICY "cat_tipo_tarea_delete_analista" ON cat_tipo_tarea
  FOR DELETE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ANALISTA_QA'
  );
