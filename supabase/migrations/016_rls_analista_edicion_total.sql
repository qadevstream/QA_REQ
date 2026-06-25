-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — Ampliar permisos de ANALISTA_QA en requirements
-- Antes: solo podía ver/editar requerimientos asignados a él.
-- Ahora: puede ver y editar todos los requerimientos.
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- 1. Remplazar política SELECT
DROP POLICY IF EXISTS "req_analista_select" ON requirements;

CREATE POLICY "req_analista_select" ON requirements
  FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ANALISTA_QA'
  );

-- 2. Remplazar política UPDATE
DROP POLICY IF EXISTS "req_analista_update" ON requirements;

CREATE POLICY "req_analista_update" ON requirements
  FOR UPDATE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ANALISTA_QA'
  );
