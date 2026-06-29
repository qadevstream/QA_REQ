-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — Cargar catálogo de Tipos de Tarea [GSTI]
-- El dropdown "Tipo de Tarea" del Registro Diario lee de cat_tipo_tarea
-- (solo los activo = true). Estos valores no estaban cargados, por eso
-- no aparecían para seleccionar.
--
-- Idempotente: si el tipo ya existe lo deja ACTIVO y reordena; si no
-- existe lo inserta. Así cubre el caso de que estuvieran inactivos.
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO cat_tipo_tarea (tipo_tarea, activo, orden) VALUES
  ('[GSTI] Actualización de Casos de Pruebas',          true,  1),
  ('[GSTI] Ajuste de Estimación',                       true,  2),
  ('[GSTI] Apoyo en UAT',                               true,  3),
  ('[GSTI] Configuración',                              true,  4),
  ('[GSTI] Configuración de Herramientas',              true,  5),
  ('[GSTI] Definición y Análisis',                      true,  6),
  ('[GSTI] Diseño de pruebas de Stress',                true,  7),
  ('[GSTI] Ejecución de Pruebas',                       true,  8),
  ('[GSTI] Ejecución de Pruebas de Stress',             true,  9),
  ('[GSTI] Elaboración Informe de Pruebas',             true, 10),
  ('[GSTI] Elaboración Informe de Pruebas de Stress',   true, 11),
  ('[GSTI] Estimación',                                 true, 12),
  ('[GSTI] Generación de data',                         true, 13),
  ('[GSTI] Generar Documentación Adicional',            true, 14),
  ('[GSTI] Generar Documentación Cierre Pruebas',       true, 15),
  ('[GSTI] Generar Documentación de Pruebas',           true, 16),
  ('[GSTI] Generar Documentación de Pruebas Stress',    true, 17),
  ('[GSTI] Gestión de Requerimientos',                  true, 18),
  ('[GSTI] Planificación',                              true, 19),
  ('[GSTI] Preparación de Casos de Pruebas',            true, 20),
  ('[GSTI] Pruebas de Regresión',                       true, 21),
  ('[GSTI] Pruebas Unitarias',                          true, 22),
  ('[GSTI] Reunión COFIDE',                             true, 23),
  ('[GSTI] Reuniones de Trabajo',                       true, 24),
  ('[GSTI] Revisión Funcional de Documentos',           true, 25)
ON CONFLICT (tipo_tarea) DO UPDATE
  SET activo = true,
      orden  = EXCLUDED.orden;
