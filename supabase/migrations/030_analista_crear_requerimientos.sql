-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — ANALISTA_QA puede CREAR y EDITAR
-- Requerimientos, iteraciones y actividades (planner).
--
-- Antes: el ANALISTA_QA solo podía ver/editar requerimientos, y en el
-- planner solo veía/editaba las actividades asignadas a él. No podía
-- crear requerimientos (faltaba política INSERT en requirements), lo
-- que producía: "new row violates row-level security policy for table
-- requirements".
--
-- Ahora: el ANALISTA_QA puede crear, editar y eliminar todo
-- (requerimientos, iteraciones y actividades), igual que el Supervisor.
--
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- ─── requirements: permitir INSERT al analista ───────────────────────
DROP POLICY IF EXISTS "req_analista_insert" ON requirements;
CREATE POLICY "req_analista_insert" ON requirements
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ANALISTA_QA'
  );

-- ─── requirements: permitir DELETE al analista ───────────────────────
DROP POLICY IF EXISTS "req_analista_delete" ON requirements;
CREATE POLICY "req_analista_delete" ON requirements
  FOR DELETE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ANALISTA_QA'
  );

-- ─── requirement_iterations: ver / crear / editar para el analista ───
-- (Si la tabla no tuviera RLS habilitado, estas políticas quedan
--  inactivas y no cambian nada; si lo tiene, habilitan al analista.)
DROP POLICY IF EXISTS "iter_analista_select" ON requirement_iterations;
CREATE POLICY "iter_analista_select" ON requirement_iterations
  FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ANALISTA_QA'
  );

DROP POLICY IF EXISTS "iter_analista_insert" ON requirement_iterations;
CREATE POLICY "iter_analista_insert" ON requirement_iterations
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ANALISTA_QA'
  );

DROP POLICY IF EXISTS "iter_analista_update" ON requirement_iterations;
CREATE POLICY "iter_analista_update" ON requirement_iterations
  FOR UPDATE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ANALISTA_QA'
  );

DROP POLICY IF EXISTS "iter_analista_delete" ON requirement_iterations;
CREATE POLICY "iter_analista_delete" ON requirement_iterations
  FOR DELETE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ANALISTA_QA'
  );

-- Asegura que SUPERVISOR / ADMINISTRADOR tengan acceso total a las
-- iteraciones (por si la tabla no traía esta política).
DROP POLICY IF EXISTS "iter_supervisor" ON requirement_iterations;
CREATE POLICY "iter_supervisor" ON requirement_iterations
  FOR ALL
  USING (is_supervisor())
  WITH CHECK (is_supervisor());

-- ─── actividades (planner): analista ve y edita TODO ─────────────────
-- Antes el analista solo veía/editaba sus actividades asignadas.
DROP POLICY IF EXISTS "actividades_analista_select" ON actividades;
CREATE POLICY "actividades_analista_select" ON actividades
  FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ANALISTA_QA'
  );

DROP POLICY IF EXISTS "actividades_analista_update" ON actividades;
CREATE POLICY "actividades_analista_update" ON actividades
  FOR UPDATE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ANALISTA_QA'
  );

DROP POLICY IF EXISTS "actividades_analista_delete" ON actividades;
CREATE POLICY "actividades_analista_delete" ON actividades
  FOR DELETE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ANALISTA_QA'
  );

-- actividades_analista_insert ya existe (WITH CHECK auth.uid() IS NOT NULL)
-- y no necesita cambios.
