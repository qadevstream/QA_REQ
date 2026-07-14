-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — ANALISTA_QA ve TODO el Registro Diario
-- Antes (migración 004): el analista solo podía leer sus propios
-- registros (registro_diario_propio_select: qa_id = auth.uid()
-- OR created_by = auth.uid()). El Supervisor/Admin ya veía todo.
--
-- Ahora: se agrega una política SELECT ADITIVA para que el ANALISTA_QA
-- lea los registros de todo el equipo (la vista Actividades muestra la
-- bitácora completa y permite filtrar por QA).
--
-- La ESCRITURA no cambia: el analista sigue pudiendo editar/eliminar
-- solo lo propio (registro_diario_propio_update/delete); Supervisor/Admin
-- mantienen acceso total (registro_diario_supervisor).
--
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "registro_diario_analista_select" ON registro_diario;
CREATE POLICY "registro_diario_analista_select" ON registro_diario
  FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ANALISTA_QA'
  );
