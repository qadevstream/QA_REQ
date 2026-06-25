-- ═══════════════════════════════════════════════════════════════════
-- QACC — Agregar columna aplicativo_grupo a aplicativos_catalogo
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE aplicativos_catalogo
  ADD COLUMN IF NOT EXISTS aplicativo_grupo TEXT;

-- Pre-poblar según prefijo del código
UPDATE aplicativos_catalogo SET aplicativo_grupo = 'SAP'        WHERE codigo LIKE 'SAP-%';
UPDATE aplicativos_catalogo SET aplicativo_grupo = 'BI'         WHERE codigo LIKE 'BI-%';
UPDATE aplicativos_catalogo SET aplicativo_grupo = 'API'        WHERE codigo IN ('APGEN','APIBW','APIHONRAS','ARENIEC','APIMS','MAIL','SGAU','SIAPIAD');
UPDATE aplicativos_catalogo SET aplicativo_grupo = 'Sharepoint' WHERE codigo IN ('CD','T-ASESORA','CVIVE','EXT.GGHH','TMATE','NDOC');
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP]'   WHERE aplicativo_grupo IS NULL;
