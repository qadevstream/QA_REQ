-- QACC — Agrega cp_total a requirement_iterations
-- cp_total = cantidad planificada de casos de prueba al inicio de la iteración
-- avance_porcentaje se calculará automáticamente: (cp_ok + cp_fallo) / cp_total * 100

ALTER TABLE requirement_iterations
  ADD COLUMN IF NOT EXISTS cp_total SMALLINT NOT NULL DEFAULT 0;
