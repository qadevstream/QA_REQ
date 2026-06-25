-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — Redefine Tipo de Solicitud (Actividades)
-- Reemplaza el catálogo genérico (Correctivo/Evolutivo/...) por los 3
-- valores reales: [PRY] Atenciones / Incidentes / Requerimientos.
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- 1. Desacoplar las columnas que usan este enum (registro_diario y la
--    columna heredada, ya no usada, de requirements)
ALTER TABLE registro_diario ALTER COLUMN tipo_solicitud TYPE TEXT;
ALTER TABLE requirements ALTER COLUMN tipo_requerimiento TYPE TEXT;

-- 2. Eliminar el enum viejo y crear el real
DROP TYPE tipo_requerimiento_enum;

CREATE TYPE tipo_requerimiento_enum AS ENUM (
  'PRY_ATENCIONES',
  'PRY_INCIDENTES',
  'PRY_REQUERIMIENTOS'
);

-- 3. Volver a tipar las columnas. Los valores viejos no tienen
--    correspondencia real, así que quedan en NULL.
ALTER TABLE registro_diario
  ALTER COLUMN tipo_solicitud TYPE tipo_requerimiento_enum
  USING (
    CASE WHEN tipo_solicitud IN ('PRY_ATENCIONES','PRY_INCIDENTES','PRY_REQUERIMIENTOS')
    THEN tipo_solicitud::tipo_requerimiento_enum ELSE NULL END
  );

ALTER TABLE requirements
  ALTER COLUMN tipo_requerimiento TYPE tipo_requerimiento_enum
  USING (
    CASE WHEN tipo_requerimiento IN ('PRY_ATENCIONES','PRY_INCIDENTES','PRY_REQUERIMIENTOS')
    THEN tipo_requerimiento::tipo_requerimiento_enum ELSE NULL END
  );
