-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — Rol CLIENTE
-- Acceso de solo lectura a Requerimientos para usuarios externos.
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- 1. Agregar el nuevo valor al enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'CLIENTE';

-- 2. RLS: CLIENTE puede leer todos los requerimientos
--    (las políticas de SUPERVISOR y ANALISTA_QA ya existen desde migration 001)
CREATE POLICY "requirements_cliente_select" ON requirements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'CLIENTE'
        AND profiles.is_active = TRUE
    )
  );
