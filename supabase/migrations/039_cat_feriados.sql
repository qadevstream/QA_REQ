-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — Catálogo de Feriados
--
-- La meta de horas por período dejaba de ser un placeholder (180 h / 22
-- días hábiles hardcodeados en lib/controlHoras.ts) y pasa a calcularse:
--
--   días hábiles = (lunes a viernes dentro del período)
--                − (feriados que caen lunes a viernes dentro del período)
--   meta = días hábiles × horas por día
--
-- ⚠️ OJO con el rango: los períodos NO son meses calendario. Van del día 3
-- al día 2 del mes siguiente (ver PERIODOS en lib/constants.ts), así que un
-- feriado se asigna al período que CONTIENE su fecha, no al mes de su
-- nombre. Ej.: el 01 Ene 2026 cae en el período "Diciembre 2025", y el
-- 01 May 2026 en "Abril 2026". Por eso se guarda la FECHA exacta y no un
-- conteo por mes.
--
-- El campo `horas` permite media jornada (4) sin cambiar el modelo: son las
-- horas que el feriado DESCUENTA de la jornada de ese día.
--
-- Mismo patrón de RLS que cat_tipo_tarea (migraciones 032 y 036):
--   lectura = cualquier autenticado · escritura = Supervisor/Admin/Analista.
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS cat_feriados (
  fecha   DATE PRIMARY KEY,
  nombre  TEXT NOT NULL,
  horas   NUMERIC(4,2) NOT NULL DEFAULT 8 CHECK (horas > 0 AND horas <= 24),
  activo  BOOLEAN NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE  cat_feriados IS 'Feriados que reducen los días hábiles del período. La fecha es la clave: el período se deriva del rango que la contiene.';
COMMENT ON COLUMN cat_feriados.horas IS 'Horas que descuenta el feriado. 8 = día completo, 4 = media jornada.';

CREATE INDEX IF NOT EXISTS idx_cat_feriados_activo ON cat_feriados (activo, fecha);

-- ─── RLS ────────────────────────────────────────────────────────────
ALTER TABLE cat_feriados ENABLE ROW LEVEL SECURITY;

-- Lectura: todos los usuarios autenticados
DROP POLICY IF EXISTS "cat_feriados_select" ON cat_feriados;
CREATE POLICY "cat_feriados_select" ON cat_feriados
  FOR SELECT USING (auth.role() = 'authenticated');

-- Escritura: Supervisor / Administrador
DROP POLICY IF EXISTS "cat_feriados_insert" ON cat_feriados;
CREATE POLICY "cat_feriados_insert" ON cat_feriados
  FOR INSERT WITH CHECK (is_supervisor());

DROP POLICY IF EXISTS "cat_feriados_update" ON cat_feriados;
CREATE POLICY "cat_feriados_update" ON cat_feriados
  FOR UPDATE USING (is_supervisor());

DROP POLICY IF EXISTS "cat_feriados_delete" ON cat_feriados;
CREATE POLICY "cat_feriados_delete" ON cat_feriados
  FOR DELETE USING (is_supervisor());

-- Escritura: Analista QA (políticas aditivas, mismo criterio que la 036)
DROP POLICY IF EXISTS "cat_feriados_insert_analista" ON cat_feriados;
CREATE POLICY "cat_feriados_insert_analista" ON cat_feriados
  FOR INSERT
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ANALISTA_QA'
  );

DROP POLICY IF EXISTS "cat_feriados_update_analista" ON cat_feriados;
CREATE POLICY "cat_feriados_update_analista" ON cat_feriados
  FOR UPDATE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ANALISTA_QA'
  );

DROP POLICY IF EXISTS "cat_feriados_delete_analista" ON cat_feriados;
CREATE POLICY "cat_feriados_delete_analista" ON cat_feriados
  FOR DELETE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ANALISTA_QA'
  );

-- ─── Carga inicial: feriados nacionales (Perú) 2025 – 2027 ──────────
-- Solo van los feriados de ley (Ley 31258 y anteriores).
--
-- NO se incluyen los "días no laborables para el sector público" que el
-- Ejecutivo declara por decreto supremo (ej. el viernes 02 Ene 2026).
-- Es una decisión de negocio, no un olvido: esos días son COMPENSABLES —
-- las horas se reponen en fechas posteriores—, así que descontarlos de la
-- meta la bajaría dos veces: una en el período del día libre y otra vez
-- al no sumar las horas repuestas donde corresponde.
-- Si algún día se decide considerarlos, se cargan desde
-- Mantenimiento → Catálogo de Feriados, sin tocar esta migración.
--
-- ⚠️ VERIFICAR contra el calendario oficial antes de dar por buenos los
-- años futuros: las fechas de Semana Santa son móviles. Los feriados que
-- caen sábado o domingo se incluyen igual — el cálculo de días hábiles
-- los ignora solo, porque ya no eran día laboral.
INSERT INTO cat_feriados (fecha, nombre) VALUES
  -- 2025
  ('2025-01-01', 'Año Nuevo'),
  ('2025-04-17', 'Jueves Santo'),
  ('2025-04-18', 'Viernes Santo'),
  ('2025-05-01', 'Día del Trabajo'),
  ('2025-06-07', 'Batalla de Arica y Día de la Bandera'),
  ('2025-06-29', 'San Pedro y San Pablo'),
  ('2025-07-23', 'Día de la Fuerza Aérea del Perú'),
  ('2025-07-28', 'Fiestas Patrias'),
  ('2025-07-29', 'Fiestas Patrias'),
  ('2025-08-06', 'Batalla de Junín'),
  ('2025-08-30', 'Santa Rosa de Lima'),
  ('2025-10-08', 'Combate de Angamos'),
  ('2025-11-01', 'Todos los Santos'),
  ('2025-12-08', 'Inmaculada Concepción'),
  ('2025-12-09', 'Batalla de Ayacucho'),
  ('2025-12-25', 'Navidad'),
  -- 2026
  ('2026-01-01', 'Año Nuevo'),
  ('2026-04-02', 'Jueves Santo'),
  ('2026-04-03', 'Viernes Santo'),
  ('2026-05-01', 'Día del Trabajo'),
  ('2026-06-07', 'Batalla de Arica y Día de la Bandera'),
  ('2026-06-29', 'San Pedro y San Pablo'),
  ('2026-07-23', 'Día de la Fuerza Aérea del Perú'),
  ('2026-07-28', 'Fiestas Patrias'),
  ('2026-07-29', 'Fiestas Patrias'),
  ('2026-08-06', 'Batalla de Junín'),
  ('2026-08-30', 'Santa Rosa de Lima'),
  ('2026-10-08', 'Combate de Angamos'),
  ('2026-11-01', 'Todos los Santos'),
  ('2026-12-08', 'Inmaculada Concepción'),
  ('2026-12-09', 'Batalla de Ayacucho'),
  ('2026-12-25', 'Navidad'),
  -- 2027
  ('2027-01-01', 'Año Nuevo'),
  ('2027-03-25', 'Jueves Santo'),
  ('2027-03-26', 'Viernes Santo'),
  ('2027-05-01', 'Día del Trabajo'),
  ('2027-06-07', 'Batalla de Arica y Día de la Bandera'),
  ('2027-06-29', 'San Pedro y San Pablo'),
  ('2027-07-23', 'Día de la Fuerza Aérea del Perú'),
  ('2027-07-28', 'Fiestas Patrias'),
  ('2027-07-29', 'Fiestas Patrias'),
  ('2027-08-06', 'Batalla de Junín'),
  ('2027-08-30', 'Santa Rosa de Lima'),
  ('2027-10-08', 'Combate de Angamos'),
  ('2027-11-01', 'Todos los Santos'),
  ('2027-12-08', 'Inmaculada Concepción'),
  ('2027-12-09', 'Batalla de Ayacucho'),
  ('2027-12-25', 'Navidad')
ON CONFLICT (fecha) DO NOTHING;
