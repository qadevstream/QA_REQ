-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — Renombrar aplicativo CCOFI → CSC
-- Por indicación del área: el código correcto es "CSC" y el nombre
-- "Customer Cofide" (antes: CCOFI / "Customer Cofide (Compliance)").
--
-- Cambia la clave (código) del catálogo y repunta las referencias por
-- texto en requerimientos, actividades y registro diario. No hay FK, por
-- lo que basta actualizar cada tabla. Idempotente: si ya se aplicó, los
-- WHERE sobre 'CCOFI' no afectan filas.
--
-- Ejecutar en: Supabase → SQL Editor → Run  (en CADA entorno: local y prod)
-- ═══════════════════════════════════════════════════════════════════

BEGIN;

UPDATE aplicativos_catalogo
  SET codigo = 'CSC', nombre = 'Customer Cofide'
  WHERE codigo = 'CCOFI';

UPDATE requirements    SET aplicativo = 'CSC' WHERE aplicativo = 'CCOFI';
UPDATE actividades     SET aplicativo = 'CSC' WHERE aplicativo = 'CCOFI';
UPDATE registro_diario SET aplicativo = 'CSC' WHERE aplicativo = 'CCOFI';
UPDATE registro_diario SET codigo_app = 'CSC' WHERE codigo_app = 'CCOFI';

COMMIT;
