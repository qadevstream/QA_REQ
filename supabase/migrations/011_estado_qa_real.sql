-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — Redefine Estado QA de Requerimientos
-- Reemplaza los 10 valores genéricos por los 8 estados reales del
-- equipo (los mismos del tablero Planner + Cancelado).
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- 1. Desacoplar la columna del enum viejo
ALTER TABLE requirements ALTER COLUMN estado_qa DROP DEFAULT;
ALTER TABLE requirements ALTER COLUMN estado_qa TYPE TEXT;

-- 2. Eliminar el enum viejo y crear el real
DROP TYPE estado_qa_enum;

CREATE TYPE estado_qa_enum AS ENUM (
  'PEND_ASIGNACION',
  'EN_ESTIMACION',
  'PEND_APROB_ATI',
  'EN_PRUEBAS_QA',
  'OBSERVADO_BLOQUEADO',
  'EN_PRUEBAS_USUARIO',
  'TERMINADO',
  'CANCELADO'
);

-- 3. Mapear los valores existentes (texto) al nuevo enum, y volver a tipar
ALTER TABLE requirements
  ALTER COLUMN estado_qa TYPE estado_qa_enum
  USING (
    CASE estado_qa
      WHEN 'BACKLOG'           THEN 'PEND_ASIGNACION'
      WHEN 'ANALISIS'          THEN 'EN_ESTIMACION'
      WHEN 'ESTIMACION'        THEN 'EN_ESTIMACION'
      WHEN 'PREPARACION_CASOS' THEN 'PEND_APROB_ATI'
      WHEN 'EJECUCION_QA'      THEN 'EN_PRUEBAS_QA'
      WHEN 'PRUEBAS_USUARIO'   THEN 'EN_PRUEBAS_USUARIO'
      WHEN 'OBSERVADO'         THEN 'OBSERVADO_BLOQUEADO'
      WHEN 'BLOQUEADO'         THEN 'OBSERVADO_BLOQUEADO'
      WHEN 'COMPLETADO'        THEN 'TERMINADO'
      WHEN 'CANCELADO'         THEN 'CANCELADO'
      ELSE 'PEND_ASIGNACION'
    END
  )::estado_qa_enum;

ALTER TABLE requirements ALTER COLUMN estado_qa SET DEFAULT 'PEND_ASIGNACION';
