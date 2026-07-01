-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — Nuevos estados QA
-- Agrega 3 estados nuevos al flujo (Requerimientos y Planner):
--   · Terminado con Obs.        (TERMINADO_CON_OBS)     tras Observado/Bloqueado
--   · Pend. Implementación PRD  (PEND_IMPLEMENTACION_PRD) tras En Pruebas de Usuario
--   · Implementado PRD          (IMPLEMENTADO_PRD)       final del flujo
--
-- "Terminado" se re-etiqueta como "Terminado QA" solo en la UI; el valor
-- del enum sigue siendo 'TERMINADO' (no requiere migrar datos existentes).
--
-- Nota: ALTER TYPE ADD VALUE no puede ejecutarse dentro de una transacción
-- que además use el valor. Aquí solo se agregan valores, así que corre bien.
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- Estado QA de requerimientos / iteraciones
ALTER TYPE estado_qa_enum ADD VALUE IF NOT EXISTS 'TERMINADO_CON_OBS'       AFTER 'OBSERVADO_BLOQUEADO';
ALTER TYPE estado_qa_enum ADD VALUE IF NOT EXISTS 'PEND_IMPLEMENTACION_PRD' AFTER 'EN_PRUEBAS_USUARIO';
ALTER TYPE estado_qa_enum ADD VALUE IF NOT EXISTS 'IMPLEMENTADO_PRD'        AFTER 'PEND_IMPLEMENTACION_PRD';

-- Estado del tablero Planner / Actividades
ALTER TYPE actividad_estado_enum ADD VALUE IF NOT EXISTS 'TERMINADO_CON_OBS'       AFTER 'OBSERVADO_BLOQUEADO';
ALTER TYPE actividad_estado_enum ADD VALUE IF NOT EXISTS 'PEND_IMPLEMENTACION_PRD' AFTER 'EN_PRUEBAS_USUARIO';
ALTER TYPE actividad_estado_enum ADD VALUE IF NOT EXISTS 'IMPLEMENTADO_PRD'        AFTER 'PEND_IMPLEMENTACION_PRD';
