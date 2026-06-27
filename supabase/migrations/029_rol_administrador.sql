-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — Rol ADMINISTRADOR
-- Administrador tiene el mismo acceso que Supervisor QA.
-- Ejecutar en: Supabase → SQL Editor → Run
--
-- Nota: las políticas/función usan comparación por texto (role::text)
-- a propósito, para no referenciar el literal de enum recién agregado
-- dentro de la misma transacción (Postgres lo rechazaría).
-- ═══════════════════════════════════════════════════════════════════

-- 1. Agregar el valor a los enums
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'ADMINISTRADOR';
ALTER TYPE cargo_enum ADD VALUE IF NOT EXISTS 'ADMINISTRADOR';

-- 2. is_supervisor() ahora reconoce también a ADMINISTRADOR.
--    Cubre todas las políticas que ya usan esta función:
--    actividades, registro_diario, aplicativos_catalogo,
--    actividad_estado_historial y profiles_select.
CREATE OR REPLACE FUNCTION is_supervisor()
RETURNS BOOLEAN AS $$
  SELECT role::text IN ('SUPERVISOR', 'ADMINISTRADOR')
  FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- 3. Las dos políticas que hardcodeaban 'SUPERVISOR' pasan a usar is_supervisor()
--    para incluir a ADMINISTRADOR.

-- requirements: SUPERVISOR/ADMINISTRADOR ven y gestionan todo
DROP POLICY IF EXISTS "req_supervisor" ON requirements;
CREATE POLICY "req_supervisor" ON requirements FOR ALL
  USING (is_supervisor())
  WITH CHECK (is_supervisor());

-- requirement_history: SUPERVISOR/ADMINISTRADOR ven todo el historial
DROP POLICY IF EXISTS "history_supervisor" ON requirement_history;
CREATE POLICY "history_supervisor" ON requirement_history FOR SELECT
  USING (is_supervisor());
