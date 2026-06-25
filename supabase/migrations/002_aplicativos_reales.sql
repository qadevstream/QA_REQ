-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — Catálogo real de Aplicaciones
-- Reemplaza los 6 valores genéricos de aplicativo_enum por las 24
-- aplicaciones reales del área.
-- Ejecutar en: Supabase → SQL Editor → Run (ANTES de 003_actividades.sql)
-- ═══════════════════════════════════════════════════════════════════

-- 1. Desacoplar la columna del enum viejo (no se puede eliminar un tipo
--    mientras una columna lo use)
ALTER TABLE requirements ALTER COLUMN aplicativo TYPE TEXT;

-- 2. Eliminar el enum viejo (genérico) y crear el real
DROP TYPE aplicativo_enum;

CREATE TYPE aplicativo_enum AS ENUM (
  'FIFPPA',
  'REACTIVA',
  'WORKFLOW_MIVIVIENDA',
  'SINTER',
  'PAE',
  'GARANTIA_COVID',
  'PGCC',
  'API_RENIEC',
  'SGCC',
  'CENDOCDEV',
  'METODIZACION',
  'SIGOBL',
  'SIGORG',
  'WF_FIRMAS',
  'IMPULSO_MYPERU',
  'SGAU',
  'CUSTOMER_COFIDE',
  'SCM',
  'TCREUTERS',
  'PROYECTO_BASE_EXCEL',
  'API_MULTISERVICES_SUNAT',
  'AGRO',
  'FONDO_CRECER',
  'CDE',
  'OTROS'
);

-- 3. Volver a tipar la columna como el enum real.
--    Cualquier valor existente que no calce queda en NULL (no debería
--    haber datos reales todavía).
ALTER TABLE requirements
  ALTER COLUMN aplicativo TYPE aplicativo_enum
  USING (
    CASE WHEN aplicativo IN (
      'FIFPPA','REACTIVA','WORKFLOW_MIVIVIENDA','SINTER','PAE','GARANTIA_COVID',
      'PGCC','API_RENIEC','SGCC','CENDOCDEV','METODIZACION','SIGOBL','SIGORG',
      'WF_FIRMAS','IMPULSO_MYPERU','SGAU','CUSTOMER_COFIDE','SCM','TCREUTERS',
      'PROYECTO_BASE_EXCEL','API_MULTISERVICES_SUNAT','AGRO','FONDO_CRECER','CDE','OTROS'
    ) THEN aplicativo::aplicativo_enum ELSE NULL END
  );
