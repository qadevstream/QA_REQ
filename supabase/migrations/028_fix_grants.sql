-- ═══════════════════════════════════════════════════════════════════
-- FIX: Otorgar privilegios a los roles de la API de Supabase
-- Problema: las tablas se crearon sin GRANT → "permission denied for
-- table profiles" (42501) incluso para service_role. RLS sigue activo
-- y controla el acceso por fila; estos GRANT solo dan permiso a nivel
-- de tabla (requisito previo para que RLS aplique).
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- Uso del schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- Privilegios sobre objetos existentes
GRANT ALL ON ALL TABLES    IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- Privilegios por defecto para objetos futuros
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON TABLES    TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;

-- Verificación: el usuario qadevstream debe tener rol SUPERVISOR para ver el dashboard
-- (descomenta y ajusta si su rol no es el correcto)
-- UPDATE public.profiles SET role = 'SUPERVISOR'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'qadevstream@gmail.com');
