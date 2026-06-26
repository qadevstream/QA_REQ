-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — Script completo de migraciones (001 → 026)
-- Pegar en: Supabase → SQL Editor → Run All
-- NOTA: La migración 027 fue excluida porque referencia la tabla
--       requirement_iterations que aún no existe en el schema.
-- ═══════════════════════════════════════════════════════════════════


-- ───────────────────────────────────────────────────────────────────
-- 001 — Schema inicial
-- ───────────────────────────────────────────────────────────────────

CREATE TYPE user_role AS ENUM (
  'SUPERVISOR',
  'ANALISTA_QA'
);

CREATE TYPE cargo_enum AS ENUM (
  'SUPERVISOR_QA',
  'ANALISTA_QA_SENIOR',
  'ANALISTA_QA',
  'ANALISTA_QA_JUNIOR',
  'TESTER'
);

CREATE TYPE aplicativo_enum AS ENUM (
  'FONDO_CRECER',
  'SIRPC',
  'MESA_PARTES_VIRTUAL',
  'PORTAL_INSTITUCIONAL',
  'INTRANET',
  'OTROS'
);

CREATE TYPE tipo_requerimiento_enum AS ENUM (
  'CORRECTIVO',
  'EVOLUTIVO',
  'INCIDENTE',
  'MEJORA',
  'SOPORTE',
  'PROYECTO'
);

CREATE TYPE estado_qa_enum AS ENUM (
  'BACKLOG',
  'ANALISIS',
  'ESTIMACION',
  'PREPARACION_CASOS',
  'EJECUCION_QA',
  'PRUEBAS_USUARIO',
  'OBSERVADO',
  'BLOQUEADO',
  'COMPLETADO',
  'CANCELADO'
);

CREATE TYPE estado_req_enum AS ENUM (
  'PENDIENTE',
  'EN_DESARROLLO',
  'EN_QA',
  'EN_UAT',
  'APROBADO',
  'RECHAZADO',
  'EN_PRODUCCION',
  'CERRADO'
);

CREATE TYPE riesgo_enum AS ENUM (
  'BAJO',
  'MEDIO',
  'ALTO',
  'CRITICO'
);

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  cargo       cargo_enum NOT NULL DEFAULT 'ANALISTA_QA',
  dni         TEXT,
  role        user_role NOT NULL DEFAULT 'ANALISTA_QA',
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE requirements (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_requerimiento      TEXT NOT NULL UNIQUE,
  titulo                    TEXT NOT NULL,
  descripcion               TEXT,
  aplicativo                aplicativo_enum NOT NULL,
  tipo_requerimiento        tipo_requerimiento_enum NOT NULL,
  gestor_responsable        TEXT,
  responsable_qa_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  qa_apoyo_1_id             UUID REFERENCES profiles(id) ON DELETE SET NULL,
  qa_apoyo_2_id             UUID REFERENCES profiles(id) ON DELETE SET NULL,
  qa_apoyo_3_id             UUID REFERENCES profiles(id) ON DELETE SET NULL,
  estado_qa                 estado_qa_enum NOT NULL DEFAULT 'BACKLOG',
  estado_req                estado_req_enum,
  iteracion                 SMALLINT NOT NULL DEFAULT 1,
  cp_total                  SMALLINT NOT NULL DEFAULT 0,
  cp_ok                     SMALLINT NOT NULL DEFAULT 0,
  cp_fallo                  SMALLINT NOT NULL DEFAULT 0,
  cp_bloqueados             SMALLINT NOT NULL DEFAULT 0,
  cp_gestion                SMALLINT NOT NULL DEFAULT 0,
  cp_diseno                 SMALLINT NOT NULL DEFAULT 0,
  cp_it                     SMALLINT NOT NULL DEFAULT 0,
  horas_estimadas           NUMERIC(8,2) NOT NULL DEFAULT 0,
  horas_reales              NUMERIC(8,2) NOT NULL DEFAULT 0,
  fecha_asignacion          DATE,
  fecha_entrega_estimacion  DATE,
  fecha_inicio_planificada  DATE,
  fecha_inicio_real         DATE,
  fecha_entrega_planificada DATE,
  fecha_entrega_real        DATE,
  defectos_qa               SMALLINT NOT NULL DEFAULT 0,
  defectos_uat              SMALLINT NOT NULL DEFAULT 0,
  defectos_produccion       SMALLINT NOT NULL DEFAULT 0,
  rutas_evidencias          TEXT,
  ticket                    TEXT,
  observaciones_estado      TEXT,
  riesgo                    riesgo_enum NOT NULL DEFAULT 'BAJO',
  bloqueado                 BOOLEAN NOT NULL DEFAULT FALSE,
  motivo_bloqueo            TEXT,
  created_by                UUID REFERENCES profiles(id),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_bloqueo CHECK (
    bloqueado = FALSE OR (bloqueado = TRUE AND motivo_bloqueo IS NOT NULL AND motivo_bloqueo <> '')
  ),
  CONSTRAINT chk_cp_ok      CHECK (cp_ok       >= 0 AND cp_ok       <= cp_total),
  CONSTRAINT chk_cp_fallo   CHECK (cp_fallo    >= 0 AND cp_fallo    <= cp_total),
  CONSTRAINT chk_cp_bloq    CHECK (cp_bloqueados >= 0)
);

CREATE TABLE requirement_history (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id   UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  changed_by       UUID REFERENCES profiles(id),
  campo_modificado TEXT NOT NULL,
  valor_anterior   TEXT,
  valor_nuevo      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_req_estado            ON requirements(estado_qa);
CREATE INDEX idx_req_estado_req        ON requirements(estado_req);
CREATE INDEX idx_req_responsable       ON requirements(responsable_qa_id);
CREATE INDEX idx_req_aplicativo        ON requirements(aplicativo);
CREATE INDEX idx_req_bloqueado         ON requirements(bloqueado) WHERE bloqueado = TRUE;
CREATE INDEX idx_req_created_at        ON requirements(created_at DESC);
CREATE INDEX idx_history_req           ON requirement_history(requirement_id);
CREATE INDEX idx_history_created_at    ON requirement_history(created_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_requirements_updated_at
  BEFORE UPDATE ON requirements
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION record_requirement_history()
RETURNS TRIGGER AS $$
DECLARE v_user UUID;
BEGIN
  v_user := auth.uid();
  IF OLD.titulo           IS DISTINCT FROM NEW.titulo           THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'titulo',           OLD.titulo,                    NEW.titulo);                    END IF;
  IF OLD.estado_qa        IS DISTINCT FROM NEW.estado_qa        THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'estado_qa',        OLD.estado_qa::TEXT,           NEW.estado_qa::TEXT);           END IF;
  IF OLD.estado_req       IS DISTINCT FROM NEW.estado_req       THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'estado_req',       OLD.estado_req::TEXT,          NEW.estado_req::TEXT);          END IF;
  IF OLD.iteracion        IS DISTINCT FROM NEW.iteracion        THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'iteracion',        OLD.iteracion::TEXT,           NEW.iteracion::TEXT);           END IF;
  IF OLD.responsable_qa_id IS DISTINCT FROM NEW.responsable_qa_id THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'responsable_qa', OLD.responsable_qa_id::TEXT,   NEW.responsable_qa_id::TEXT);   END IF;
  IF OLD.horas_estimadas  IS DISTINCT FROM NEW.horas_estimadas  THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'horas_estimadas', OLD.horas_estimadas::TEXT,     NEW.horas_estimadas::TEXT);     END IF;
  IF OLD.horas_reales     IS DISTINCT FROM NEW.horas_reales     THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'horas_reales',    OLD.horas_reales::TEXT,        NEW.horas_reales::TEXT);        END IF;
  IF OLD.cp_total         IS DISTINCT FROM NEW.cp_total         THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'cp_total',        OLD.cp_total::TEXT,            NEW.cp_total::TEXT);            END IF;
  IF OLD.cp_ok            IS DISTINCT FROM NEW.cp_ok            THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'cp_ok',           OLD.cp_ok::TEXT,               NEW.cp_ok::TEXT);               END IF;
  IF OLD.cp_fallo         IS DISTINCT FROM NEW.cp_fallo         THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'cp_fallo',        OLD.cp_fallo::TEXT,            NEW.cp_fallo::TEXT);            END IF;
  IF OLD.bloqueado        IS DISTINCT FROM NEW.bloqueado        THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'bloqueado',       OLD.bloqueado::TEXT,           NEW.bloqueado::TEXT);           END IF;
  IF OLD.defectos_qa      IS DISTINCT FROM NEW.defectos_qa      THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'defectos_qa',     OLD.defectos_qa::TEXT,         NEW.defectos_qa::TEXT);         END IF;
  IF OLD.defectos_uat     IS DISTINCT FROM NEW.defectos_uat     THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'defectos_uat',    OLD.defectos_uat::TEXT,        NEW.defectos_uat::TEXT);        END IF;
  IF OLD.observaciones_estado IS DISTINCT FROM NEW.observaciones_estado THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'observaciones', OLD.observaciones_estado, NEW.observaciones_estado);       END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_requirement_history
  AFTER UPDATE ON requirements
  FOR EACH ROW EXECUTE FUNCTION record_requirement_history();

ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_history ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION is_supervisor()
RETURNS BOOLEAN AS $$
  SELECT role = 'SUPERVISOR' FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (id = auth.uid() OR is_supervisor());

CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "req_supervisor" ON requirements FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'SUPERVISOR')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'SUPERVISOR');

CREATE POLICY "req_analista_select" ON requirements FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ANALISTA_QA'
    AND (
      responsable_qa_id = auth.uid() OR
      qa_apoyo_1_id     = auth.uid() OR
      qa_apoyo_2_id     = auth.uid() OR
      qa_apoyo_3_id     = auth.uid()
    )
  );

CREATE POLICY "req_analista_update" ON requirements FOR UPDATE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ANALISTA_QA'
    AND (
      responsable_qa_id = auth.uid() OR
      qa_apoyo_1_id     = auth.uid() OR
      qa_apoyo_2_id     = auth.uid() OR
      qa_apoyo_3_id     = auth.uid()
    )
  );

CREATE POLICY "history_supervisor" ON requirement_history FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'SUPERVISOR');

CREATE POLICY "history_analista" ON requirement_history FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ANALISTA_QA'
    AND requirement_id IN (
      SELECT id FROM requirements
      WHERE responsable_qa_id = auth.uid()
         OR qa_apoyo_1_id = auth.uid()
         OR qa_apoyo_2_id = auth.uid()
         OR qa_apoyo_3_id = auth.uid()
    )
  );

CREATE POLICY "history_insert" ON requirement_history FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, cargo, dni, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'cargo')::public.cargo_enum, 'ANALISTA_QA'),
    NEW.raw_user_meta_data->>'dni',
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'ANALISTA_QA')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ───────────────────────────────────────────────────────────────────
-- 002 — Catálogo real de Aplicativos
-- ───────────────────────────────────────────────────────────────────

ALTER TABLE requirements ALTER COLUMN aplicativo TYPE TEXT;
DROP TYPE aplicativo_enum;

CREATE TYPE aplicativo_enum AS ENUM (
  'FIFPPA','REACTIVA','WORKFLOW_MIVIVIENDA','SINTER','PAE','GARANTIA_COVID',
  'PGCC','API_RENIEC','SGCC','CENDOCDEV','METODIZACION','SIGOBL','SIGORG',
  'WF_FIRMAS','IMPULSO_MYPERU','SGAU','CUSTOMER_COFIDE','SCM','TCREUTERS',
  'PROYECTO_BASE_EXCEL','API_MULTISERVICES_SUNAT','AGRO','FONDO_CRECER','CDE','OTROS'
);

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


-- ───────────────────────────────────────────────────────────────────
-- 003 — Actividades (Planner / Kanban)
-- ───────────────────────────────────────────────────────────────────

CREATE TYPE actividad_estado_enum AS ENUM (
  'PEND_ASIGNACION',
  'EN_ESTIMACION',
  'PEND_APROB_ATI',
  'EN_PRUEBAS_QA',
  'OBSERVADO_BLOQUEADO',
  'EN_PRUEBAS_USUARIO',
  'TERMINADO'
);

CREATE TYPE actividad_prioridad_enum AS ENUM (
  'URGENTE',
  'IMPORTANTE',
  'MEDIA',
  'BAJA'
);

CREATE TYPE actividad_progreso_enum AS ENUM (
  'NO_INICIADO',
  'EN_CURSO',
  'COMPLETADO'
);

CREATE TABLE actividades (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tck                TEXT NOT NULL,
  aplicativo         aplicativo_enum,
  estado             actividad_estado_enum NOT NULL DEFAULT 'PEND_ASIGNACION',
  estado_changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  posicion           INTEGER NOT NULL DEFAULT 0,
  ati_responsable    TEXT,
  qa_asignado_id     UUID REFERENCES profiles(id) ON DELETE SET NULL,
  fecha_compromiso   DATE,
  prioridad          actividad_prioridad_enum NOT NULL DEFAULT 'MEDIA',
  progreso           actividad_progreso_enum NOT NULL DEFAULT 'NO_INICIADO',
  observaciones      TEXT,
  requirement_id     UUID REFERENCES requirements(id) ON DELETE SET NULL,
  created_by         UUID REFERENCES profiles(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_actividades_estado     ON actividades(estado);
CREATE INDEX idx_actividades_qa         ON actividades(qa_asignado_id);
CREATE INDEX idx_actividades_created_at ON actividades(created_at DESC);

CREATE TRIGGER trg_actividades_updated_at
  BEFORE UPDATE ON actividades
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION track_actividad_estado_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    NEW.estado_changed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actividades_estado_change
  BEFORE UPDATE ON actividades
  FOR EACH ROW EXECUTE FUNCTION track_actividad_estado_change();

ALTER TABLE actividades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "actividades_supervisor" ON actividades FOR ALL
  USING (is_supervisor())
  WITH CHECK (is_supervisor());

CREATE POLICY "actividades_analista_select" ON actividades FOR SELECT
  USING (qa_asignado_id = auth.uid());

CREATE POLICY "actividades_analista_insert" ON actividades FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "actividades_analista_update" ON actividades FOR UPDATE
  USING (qa_asignado_id = auth.uid());


-- ───────────────────────────────────────────────────────────────────
-- 004 — Registro Diario
-- ───────────────────────────────────────────────────────────────────

CREATE TYPE tipo_tarea_enum AS ENUM (
  'ANALISIS_REQUERIMIENTO',
  'DISENO_CASOS_PRUEBA',
  'EJECUCION_PRUEBAS',
  'REPORTE_DEFECTOS',
  'REUNION',
  'SOPORTE_PRODUCCION',
  'DOCUMENTACION',
  'CAPACITACION',
  'OTROS'
);

CREATE TABLE registro_diario (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  periodo            TEXT NOT NULL,
  iteracion          SMALLINT,
  aplicativo         aplicativo_enum,
  codigo_app         TEXT,
  tipo_solicitud     tipo_requerimiento_enum,
  tipo_tarea         tipo_tarea_enum,
  qa_id              UUID REFERENCES profiles(id) ON DELETE SET NULL,
  horas_ejecutadas   NUMERIC(5,2) NOT NULL DEFAULT 0,
  perfil             TEXT,
  nro_ticket         TEXT,
  fecha_reporte      DATE NOT NULL DEFAULT CURRENT_DATE,
  observaciones      TEXT,
  created_by         UUID REFERENCES profiles(id),
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_registro_diario_qa      ON registro_diario(qa_id);
CREATE INDEX idx_registro_diario_fecha   ON registro_diario(fecha_reporte DESC);
CREATE INDEX idx_registro_diario_periodo ON registro_diario(periodo);

CREATE TRIGGER trg_registro_diario_updated_at
  BEFORE UPDATE ON registro_diario
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE registro_diario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "registro_diario_supervisor" ON registro_diario FOR ALL
  USING (is_supervisor())
  WITH CHECK (is_supervisor());

CREATE POLICY "registro_diario_propio_select" ON registro_diario FOR SELECT
  USING (qa_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "registro_diario_propio_insert" ON registro_diario FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "registro_diario_propio_update" ON registro_diario FOR UPDATE
  USING (qa_id = auth.uid() OR created_by = auth.uid());

CREATE POLICY "registro_diario_propio_delete" ON registro_diario FOR DELETE
  USING (qa_id = auth.uid() OR created_by = auth.uid());


-- ───────────────────────────────────────────────────────────────────
-- 005 — Fecha inicio en Actividades
-- ───────────────────────────────────────────────────────────────────

ALTER TABLE actividades ADD COLUMN fecha_inicio DATE;


-- ───────────────────────────────────────────────────────────────────
-- 006 — Fecha aprobación estimación en Requirements
-- ───────────────────────────────────────────────────────────────────

ALTER TABLE requirements ADD COLUMN fecha_aprobacion_estimacion DATE;


-- ───────────────────────────────────────────────────────────────────
-- 007 — tipo_requerimiento opcional
-- ───────────────────────────────────────────────────────────────────

ALTER TABLE requirements ALTER COLUMN tipo_requerimiento DROP NOT NULL;


-- ───────────────────────────────────────────────────────────────────
-- 008 — ATI Responsable en Requirements
-- ───────────────────────────────────────────────────────────────────

ALTER TABLE requirements ADD COLUMN ati_responsable TEXT;


-- ───────────────────────────────────────────────────────────────────
-- 009 — Avance (%) en Requirements
-- ───────────────────────────────────────────────────────────────────

ALTER TABLE requirements
  ADD COLUMN avance_porcentaje SMALLINT NOT NULL DEFAULT 0
  CONSTRAINT chk_avance_porcentaje CHECK (avance_porcentaje >= 0 AND avance_porcentaje <= 100);


-- ───────────────────────────────────────────────────────────────────
-- 010 — Prioridad en Requirements
-- ───────────────────────────────────────────────────────────────────

ALTER TABLE requirements
  ADD COLUMN prioridad actividad_prioridad_enum NOT NULL DEFAULT 'MEDIA';


-- ───────────────────────────────────────────────────────────────────
-- 011 — Estado QA real
-- ───────────────────────────────────────────────────────────────────

ALTER TABLE requirements ALTER COLUMN estado_qa DROP DEFAULT;
ALTER TABLE requirements ALTER COLUMN estado_qa TYPE TEXT;
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


-- ───────────────────────────────────────────────────────────────────
-- 012 — Tipo de Solicitud real
-- ───────────────────────────────────────────────────────────────────

ALTER TABLE registro_diario ALTER COLUMN tipo_solicitud TYPE TEXT;
ALTER TABLE requirements ALTER COLUMN tipo_requerimiento TYPE TEXT;
DROP TYPE tipo_requerimiento_enum;

CREATE TYPE tipo_requerimiento_enum AS ENUM (
  'PRY_ATENCIONES',
  'PRY_INCIDENTES',
  'PRY_REQUERIMIENTOS'
);

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


-- ───────────────────────────────────────────────────────────────────
-- 013 — Trazabilidad de estados de Actividades
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE actividad_estado_historial (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actividad_id    UUID NOT NULL REFERENCES actividades(id) ON DELETE CASCADE,
  estado_anterior actividad_estado_enum,
  estado_nuevo    actividad_estado_enum NOT NULL,
  changed_by      UUID REFERENCES profiles(id),
  changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_actividad_historial_actividad  ON actividad_estado_historial(actividad_id);
CREATE INDEX idx_actividad_historial_changed_at ON actividad_estado_historial(changed_at);

CREATE OR REPLACE FUNCTION log_actividad_estado_inicial()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO actividad_estado_historial (actividad_id, estado_anterior, estado_nuevo, changed_by)
  VALUES (NEW.id, NULL, NEW.estado, NEW.created_by);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_actividad_estado_inicial
  AFTER INSERT ON actividades
  FOR EACH ROW EXECUTE FUNCTION log_actividad_estado_inicial();

CREATE OR REPLACE FUNCTION log_actividad_estado_cambio()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.estado IS DISTINCT FROM NEW.estado THEN
    INSERT INTO actividad_estado_historial (actividad_id, estado_anterior, estado_nuevo, changed_by)
    VALUES (NEW.id, OLD.estado, NEW.estado, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_actividad_estado_cambio
  AFTER UPDATE ON actividades
  FOR EACH ROW EXECUTE FUNCTION log_actividad_estado_cambio();

ALTER TABLE actividad_estado_historial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "actividad_historial_supervisor" ON actividad_estado_historial FOR SELECT
  USING (is_supervisor());

CREATE POLICY "actividad_historial_propio" ON actividad_estado_historial FOR SELECT
  USING (
    actividad_id IN (SELECT id FROM actividades WHERE qa_asignado_id = auth.uid())
  );

CREATE POLICY "actividad_historial_insert" ON actividad_estado_historial FOR INSERT WITH CHECK (true);


-- ───────────────────────────────────────────────────────────────────
-- 014 — Catálogo dinámico de Aplicativos
-- ───────────────────────────────────────────────────────────────────

CREATE TABLE aplicativos_catalogo (
  codigo  TEXT PRIMARY KEY,
  nombre  TEXT NOT NULL,
  color   VARCHAR(7) NOT NULL DEFAULT '#94A3B8',
  activo  BOOLEAN NOT NULL DEFAULT TRUE,
  orden   SMALLINT NOT NULL DEFAULT 0
);

INSERT INTO aplicativos_catalogo (codigo, nombre, orden) VALUES
  ('UNE','Sistema de Unidad de Emprendimiento',1),('EEFF','Sistema de Carga SBS',2),
  ('RFA','Sistema RFA',3),('SEPYMEX','Sistema SEPYMEX',4),('SGCC','Sistema SGCC',5),
  ('SIGORG','Sistema de Gestión de Órdenes de Giro',6),('MAIL','API Correo',7),
  ('FIFPPA','Sistema FIFPPA',8),('WMV','Workflow Mi Vivienda',9),
  ('SCAP','Sistema de Capacitación al Agricultor RFA',10),('SGC','Sistema de Gestión de Contratos',11),
  ('MEEFF','Sistema de Metodización',12),('TCREUTERS','Sistema TcREUTERS',13),
  ('CUMPLE','Sistema Cumpleaños',14),('SFC','Sistema de Fondo Crecer',15),
  ('SC','Sistema Centralizado',16),('CDE','Sistema CDE',17),('SISNOTIF','Sistema de Notificación',18),
  ('RCD','Reporte Crediticio de Deudores',19),('EXT.GGHH','Aplicación Externa Gestión Humana',20),
  ('SIGCNOR','Sistema de Gestión y Control Normativo',21),('PORTALCOFIDE','Sistema Portal COFIDE',22),
  ('PRICING','Sistema Pricing',23),('SEPYMEX_V2','Sistema SEPYMEX V2',24),
  ('SCM','Sistema de Carga Masiva de Crédito',25),('STFTP','Sistema de Transferencia FTP a Banco',26),
  ('SMP','Sistema Multiproducto',27),('SCO','Sistema de Contratos',28),('RCC','Sistema RCC',29),
  ('APIBW','API Servicios Workflow de Negocios',30),('SIGOBL','Sistema de Gestión de Obligaciones',31),
  ('SRP','Sistema Reactiva Perú',32),('APGEN','Aplicaciones Genéricas',33),('SGAU','API SGAU',34),
  ('PAE','Sistema de Programa de Apoyo Empresarial',35),('SPLAFT','SPLAFT',36),
  ('FCEI','Sistema FCEI',37),('PGC','Sistema del Programa de Garantías COVID',38),
  ('SIAPIAD','API Directorio Activo',39),('SGP','Sistema de Gestión de Postulantes',40),
  ('SUC','Sistema de Usuarios Centralizados',41),('STAT','Estadísticas Económicas',42),
  ('FOGEM','Sistema FOGEM',43),('FIRMAS','Sistema Firmas',44),
  ('SCP','Sistema de Cadenas Productivas',45),('FAE','Sistema de Fondo de Apoyo Empresarial',46),
  ('PGCC','PGCC',47),('SLDU','Sistema Libros Digitales Únicas',48),('SPB','Sistema Proyecto Base',49),
  ('APIHONRAS','API Honras',50),('SIMP','Sistema Impulso MyPerú',51),
  ('SNT','Sistema de Intermediación (SINTER)',52),('SAP-WFDAF','Workflow DAF',53),
  ('SAP-BP','Business Partner (BP)',54),('SAP-REPOS','REPOS',55),('SAP-BONOI','Bonos de Inversiones',56),
  ('SAP-FFIN','Facturación Finanzas (FI)',57),('SAP-PROV','Provisiones',58),
  ('SAP-GAR','Garantías',59),('SAP-CLAFRI','Clasificación de Riesgos',60),
  ('SAP-ACCPRE','Acciones Preferentes',61),('SAP-FFID','Facturación Fideicomisos (SD)',62),
  ('SAP-COCA','Contratos Calendarios',63),('SAP-WIT','Workflow Integrado de Transferencia',64),
  ('SAP-RCD','Reporte Crediticio de Deudores (RCD)',65),('SAP-PPAR','Prepagos Parciales',66),
  ('SAP-CFMV','Cobranza FMV',67),('SAP-PCON','Plan Concluido',68),
  ('SAP-CTTC','Contratos Traslado Tratamiento Contable',69),('SAP-AN08','Anexo 8',70),
  ('BI-DMRI','Datamart Riesgos',71),('BI-SIG','Sistema Información Gerencial',72),
  ('BI-PRIDER','Dashboard PRIDER',73),('SAP-LIBELE','Libros Electrónicos',74),
  ('SAP-COMP','Compensación de Asientos Contables',75),('SAP-REGFI','Registros Contables Finanzas',76),
  ('SAP-VME','Valoración Moneda Extranjera',77),('SAP-REFRESH','Actualización de SAP Productivo a QAS',78),
  ('SAP-PED','Pedido de Logística',79),('SAP-SOLPED','SOLPE',80),
  ('SAP-REPCON','Reporte de Contratos SAP',81),('NFAC','No Facturable',82),
  ('SGD','Sistema de Gestión Documental',83),('BI-SALEXP','BI-Saldo de Exposición GO',84),
  ('TMATE','Solución TeamMate (UAI)',85),('CD','Site Centro de Documentos (Sharepoint)',86),
  ('STD','Sistema de Trámite Documentario (Antiguo)',87),('INFOG','Sistemas INFOGAS',88),
  ('GSERT','Gestión Servicio Aseguramiento Calidad',89),
  ('BI-SRDL','Sistema de Registro de Datos en Línea (SRDL)',90),('SDR','Sistema de Denuncias',91),
  ('BI-OSCE','BI-Carga OSCE',92),('BI-LCONTA','BI-Extracción Asientos Contables',93),
  ('T-ASESORA','Site Consultas Legales (Sharepoint)',94),('NDOC','Solución NetDocuments',95),
  ('VSOF','Sistema de Registro de Visitas de COFIDE',96),('BFID','Sistema Búsqueda de Fideicomisos',97),
  ('BI-FMV','BI-Calendarios Fondo Mi Vivienda',98),('BI-PLAT','Componentes Solución BI',99),
  ('CVIVE','Intranet Vive Cofide (GOINTEGRO)',100),('MYF','App Mi Yunta Financiero',101),
  ('SBDP','Sistema Base de Datos Personal',102),('ARENIEC','API RENIEC',103),
  ('SAP-AMAA','Amortización Activos Fijos',104),('BI-CDE','BI-Reportes CDE',105),
  ('APIMS','API Multiservicios SUNAT',106),('CCOFI','Customer Cofide (Compliance)',107),
  ('OTROS','Otros',108);

ALTER TABLE requirements    ALTER COLUMN aplicativo TYPE TEXT;
ALTER TABLE actividades     ALTER COLUMN aplicativo TYPE TEXT;
ALTER TABLE registro_diario ALTER COLUMN aplicativo TYPE TEXT;
DROP TYPE IF EXISTS aplicativo_enum;

ALTER TABLE aplicativos_catalogo ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ap_catalogo_select" ON aplicativos_catalogo
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "ap_catalogo_insert" ON aplicativos_catalogo
  FOR INSERT WITH CHECK (is_supervisor());

CREATE POLICY "ap_catalogo_update" ON aplicativos_catalogo
  FOR UPDATE USING (is_supervisor());

CREATE POLICY "ap_catalogo_delete" ON aplicativos_catalogo
  FOR DELETE USING (is_supervisor());


-- ───────────────────────────────────────────────────────────────────
-- 015 — Rol CLIENTE
-- ───────────────────────────────────────────────────────────────────

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'CLIENTE';

CREATE POLICY "requirements_cliente_select" ON requirements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'CLIENTE'
        AND profiles.is_active = TRUE
    )
  );


-- ───────────────────────────────────────────────────────────────────
-- 016 — Analista puede ver y editar todos los requerimientos
-- ───────────────────────────────────────────────────────────────────

DROP POLICY IF EXISTS "req_analista_select" ON requirements;

CREATE POLICY "req_analista_select" ON requirements
  FOR SELECT
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ANALISTA_QA');

DROP POLICY IF EXISTS "req_analista_update" ON requirements;

CREATE POLICY "req_analista_update" ON requirements
  FOR UPDATE
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'ANALISTA_QA');


-- ───────────────────────────────────────────────────────────────────
-- 017 — Eliminar columna riesgo
-- ───────────────────────────────────────────────────────────────────

ALTER TABLE requirements DROP COLUMN IF EXISTS riesgo;
DROP TYPE IF EXISTS riesgo_enum;


-- ───────────────────────────────────────────────────────────────────
-- 018 — Eliminar columnas no usadas
-- ───────────────────────────────────────────────────────────────────

ALTER TABLE requirements
  DROP COLUMN IF EXISTS bloqueado,
  DROP COLUMN IF EXISTS motivo_bloqueo,
  DROP COLUMN IF EXISTS gestor_responsable,
  DROP COLUMN IF EXISTS cp_total,
  DROP COLUMN IF EXISTS cp_bloqueados,
  DROP COLUMN IF EXISTS cp_gestion,
  DROP COLUMN IF EXISTS cp_diseno,
  DROP COLUMN IF EXISTS cp_it,
  DROP COLUMN IF EXISTS ticket;


-- ───────────────────────────────────────────────────────────────────
-- 019 — Nuevos aplicativos
-- ───────────────────────────────────────────────────────────────────

INSERT INTO aplicativos_catalogo (codigo, nombre, orden) VALUES
  ('APIENVIO','API-EnvíoCorreos',109),('APIMULTI','API MultiServices',110),
  ('BIBLIO','Biblioteca',111),('CCNX','Cadenas de Conexión',112),
  ('CALCPRI','Calculadora Pricing',113),('CEEFF','Carga Estados Financieros',114),
  ('CAVIFI','Cavifi',115),('CLNEG','Clínica de Negocios',116),
  ('COBMYPE','Cobmype',117),('ENCAJE','Encaje123',118),('FEMP','Feria del Emprendedor',119),
  ('FICOBERT','Ficobert',120),('GCUMP','Gestión de Cumplimiento',121),
  ('GVOL','Gestores Voluntarios',122),('INFOBLOOM','InfoBloomberg',123),
  ('INTRANET','Intranet',124),('LAVACT','Lavado de Activos',125),('LBTR','LBTR',126),
  ('LIBELE','Libros Electrónicos',127),('MFID','Masivo Fideicomisos',128),
  ('MICROCR','Microcredito',129),('MFPUNO','MicroFinanzasPuno',130),
  ('MICROGLO','Microglobal',131),('MIGBD','Migración BD',132),
  ('MIGCR','Migración Cristal Reports',133),('MIGSCO','Migración SCO, EstEco, Ficobert',134),
  ('PFE','PFE',135),('PGC19','PGC19',136),('PLANTA','Plantillas Automatizadas',137),
  ('PCNEG','Portal Conexión y Negocios',138),('PJUD','Procesos Judiciales',139),
  ('PWOG','Proyecto Web OG',140),('REPO','Repo',141),('REPOADM','RepoAdmin',142),
  ('SAFCO','SAFCO',143),('SGH','Sistema Gestión Humana',144),('SFTP','SFTP',145),
  ('SFIN','Servicios Financieros',146),('SGSCD','SGSCD',147),('SIAR','SIAR',148),
  ('SIAT','SIAT',149),('SIJUS','SIJUS',150),('SPAMC','SPA&MC',151),('SWIFT','SWIFT',152),
  ('TALLCAP','Talleres y Capacitaciones',153),('TESTLINK','TestLink',154),
  ('TIMESYS','TIMESYS',155),('TIPOCAM','Tipo de Cambio',156),
  ('UPGSAP','Upgrade Sist. Operativo de SAP',157),('VALIDEITOR','Valideitor',158),
  ('WIN10','Windows 10',159),('WINFOGEM','Winfogem',160),('WSGEN','WS-Genéricos',161),
  ('PRY-TEST','Servicio de Testing',162),('ESTABWMV','Estabilización de WF Mivienda',163),
  ('GGHA','GGHA',164)
ON CONFLICT (codigo) DO NOTHING;


-- ───────────────────────────────────────────────────────────────────
-- 020 — Catálogo completo con colores y grupos
-- ───────────────────────────────────────────────────────────────────

INSERT INTO aplicativos_catalogo (codigo, nombre, color, activo, orden) VALUES
('APGEN','Aplicaciones Genéricas','#0EA5E9',true,10),
('APIBW','API Servicios Workflow de Negocios','#0EA5E9',true,20),
('APIHONRAS','API Honras','#0EA5E9',true,30),
('ARENIEC','API RENIEC','#0EA5E9',true,40),
('APIMS','API Multiservicios SUNAT','#0EA5E9',true,50),
('SIAPIAD','API Directorio Activo','#0EA5E9',true,60),
('MAIL','API Correo','#0EA5E9',true,70),
('SGAU','API SGAU','#0EA5E9',true,80),
('BI-CDE','BI-Reportes CDE','#3B82F6',true,100),
('BI-DMRI','Datamart Riesgos','#3B82F6',true,110),
('BI-FMV','BI-Calendarios Fondo Mi Vivienda','#3B82F6',true,120),
('BI-LCONTA','BI-Extracción Asientos Contables','#3B82F6',true,130),
('BI-OSCE','BI-Carga OSCE','#3B82F6',true,140),
('BI-PLAT','Componentes Solución BI','#3B82F6',true,150),
('BI-PRIDER','Dashboard PRIDER','#3B82F6',true,160),
('BI-SALEXP','BI-Saldo de Exposición GO','#3B82F6',true,170),
('BI-SIG','Sistema Información Gerencial','#3B82F6',true,180),
('BI-SRDL','Sistema de Registro de Datos en Línea (SRDL)','#3B82F6',true,190),
('CD','Site Centro de Documentos (Sharepoint)','#8B5CF6',true,200),
('T-ASESORA','Site Consultas Legales (Sharepoint)','#8B5CF6',true,210),
('CVIVE','Intranet Vive Cofide (GOINTEGRO)','#8B5CF6',true,220),
('EXT.GGHH','Aplicación Externa Gestión Humana','#8B5CF6',true,230),
('TMATE','Solución TeamMate (UAI)','#8B5CF6',true,240),
('NDOC','Solución NetDocuments','#8B5CF6',true,250),
('GSERT','Gestión Servicio Aseguramiento Calidad','#64748B',true,300),
('NFAC','No Facturable','#64748B',true,310),
('PGC','Sistema del Programa de Garantías COVID','#64748B',true,320),
('SBDP','Sistema Base de Datos Personal','#64748B',true,330),
('SC','Sistema Centralizado','#64748B',true,340),
('SDR','Sistema de Denuncias','#64748B',true,350),
('SEPYMEX_V2','Sistema SEPYMEX V2','#64748B',true,360),
('SGC','Sistema de Gestión de Contratos','#64748B',true,370),
('SGP','Sistema de Gestión de Postulantes','#64748B',true,380),
('SIMP','Sistema Impulso MyPerú','#64748B',true,390),
('SISNOTIF','Sistema de Notificación','#64748B',true,400),
('SLDU','Sistema Libros Digitales Únicas','#64748B',true,410),
('SMP','Sistema Multiproducto','#64748B',true,420),
('SNT','Sistema de Intermediación / SINTER','#64748B',true,430),
('SPB','Sistema Proyecto Base','#64748B',true,440),
('STAT','Estadísticas Económicas','#64748B',true,450),
('STFTP','Sistema de Transferencia FTP a Banco','#64748B',true,460),
('VSOF','Sistema de Registro de Visitas de COFIDE (VISOF)','#64748B',true,470),
('WMV','Workflow Mi Vivienda','#64748B',true,480),
('SAP-ACCPRE','Acciones Preferentes','#F59E0B',true,500),
('SAP-AMAA','Amortización Activos Fijos','#F59E0B',true,510),
('SAP-AN08','Anexo 8','#F59E0B',true,520),
('SAP-BONOI','Bonos de Inversiones','#F59E0B',true,530),
('SAP-BP','Business Partner (BP)','#F59E0B',true,540),
('SAP-CFMV','Cobranza FMV','#F59E0B',true,550),
('SAP-CLAFRI','Clasificación de Riesgos','#F59E0B',true,560),
('SAP-COCA','Contratos Calendarios','#F59E0B',true,570),
('SAP-COMP','Compensación de Asientos Contables','#F59E0B',true,580),
('SAP-CTTC','Contratos Traslado Tratamiento Contable','#F59E0B',true,590),
('SAP-FFID','Facturación Fideicomisos (SD)','#F59E0B',true,600),
('SAP-FFIN','Facturación Finanzas (FI)','#F59E0B',true,610),
('SAP-GAR','Garantías','#F59E0B',true,620),
('SAP-LIBELE','Libros Electrónicos','#F59E0B',true,630),
('SAP-PCON','Plan Concluido','#F59E0B',true,640),
('SAP-PED','Pedido de Logística','#F59E0B',true,650),
('SAP-PPAR','Prepagos Parciales','#F59E0B',true,660),
('SAP-PROV','Provisiones','#F59E0B',true,670),
('SAP-RCD','Reporte Crediticio de Deudores (RCD)','#F59E0B',true,680),
('SAP-REFRESH','Actualización de SAP Productivo a QAS','#F59E0B',true,690),
('SAP-REGFI','Registros Contables Finanzas','#F59E0B',true,700),
('SAP-REPCON','Reporte de Contratos SAP','#F59E0B',true,710),
('SAP-REPOS','REPOS','#F59E0B',true,720),
('SAP-SOLPED','SOLPE','#F59E0B',true,730),
('SAP-VME','Valoración Moneda Extranjera','#F59E0B',true,740),
('SAP-WFDAF','Workflow DAF','#F59E0B',true,750),
('SAP-WIT','Workflow Integrado de Transferencia','#F59E0B',true,760),
('BFID','Sistema Búsqueda de Fideicomisos','#10B981',true,800),
('CDE','Sistema CDE','#10B981',true,810),
('CCOFI','Customer Cofide (Compliance)','#10B981',true,820),
('CUMPLE','Sistema Cumpleaños','#10B981',true,830),
('EEFF','Sistema de Carga SBS','#10B981',true,840),
('FAE','Sistema de Fondo de Apoyo Empresarial','#10B981',true,850),
('FCEI','Sistema FCEI','#10B981',true,860),
('FIFPPA','Sistema FIFPPA','#10B981',true,870),
('FIRMAS','Sistema Firmas','#10B981',true,880),
('FOGEM','Sistema FOGEM','#10B981',true,890),
('INFOG','Sistemas INFOGAS','#10B981',true,900),
('MEEFF','Sistema de Metodización','#10B981',true,910),
('MYF','App Mi Yunta Financiero','#10B981',true,920),
('PAE','Sistema de Programa de Apoyo Empresarial','#10B981',true,930),
('PGCC','PGCC','#10B981',true,940),
('PORTALCOFIDE','Sistema Portal COFIDE','#10B981',true,950),
('PRICING','Sistema Pricing','#10B981',true,960),
('RCC','Sistema RCC','#10B981',true,970),
('RCD','Reporte Crediticio de Deudores','#10B981',true,980),
('RFA','Sistema RFA','#10B981',true,990),
('SCAP','Sistema de Capacitación al Agricultor RFA','#10B981',true,1000),
('SCP','Sistema de Cadenas Productivas','#10B981',true,1010),
('SCM','Sistema de Carga Masiva de Crédito','#10B981',true,1020),
('SCO','Sistema de Contratos','#10B981',true,1030),
('SEPYMEX','Sistema SEPYMEX','#10B981',true,1040),
('SFC','Sistema de Fondo Crecer','#10B981',true,1050),
('SGD','Sistema de Gestión Documental','#10B981',true,1060),
('SGCC','Sistema SGCC','#10B981',true,1070),
('SIGCNOR','Sistema de Gestión y Control Normativo','#10B981',true,1080),
('SIGOBL','Sistema de Gestión de Obligaciones','#10B981',true,1090),
('SIGORG','Sistema de Gestión de Órdenes de Giro','#10B981',true,1100),
('SPLAFT','SPLAFT','#10B981',true,1110),
('SRP','Sistema Reactiva Perú','#10B981',true,1120),
('STD','Sistema de Trámite Documentario (Antiguo)','#10B981',true,1130),
('SUC','Sistema de Usuarios Centralizados','#10B981',true,1140),
('TCREUTERS','Sistema TcReuters','#10B981',true,1150),
('UNE','Sistema de Unidad de Emprendimiento','#10B981',true,1160),
('OTROS','Otros','#94A3B8',true,9999)
ON CONFLICT (codigo) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  color  = EXCLUDED.color,
  orden  = EXCLUDED.orden,
  activo = true;


-- ───────────────────────────────────────────────────────────────────
-- 021 — ATI responsable y correo en catálogo
-- ───────────────────────────────────────────────────────────────────

ALTER TABLE aplicativos_catalogo
  ADD COLUMN IF NOT EXISTS ati_responsable TEXT,
  ADD COLUMN IF NOT EXISTS correo          TEXT;


-- ───────────────────────────────────────────────────────────────────
-- 022 — Actualizar nombres oficiales
-- ───────────────────────────────────────────────────────────────────

UPDATE aplicativos_catalogo SET nombre = 'Aplicaciones Genéricas'                          WHERE codigo = 'APGEN';
UPDATE aplicativos_catalogo SET nombre = 'API Servicios Workflow de Negocios'              WHERE codigo = 'APIBW';
UPDATE aplicativos_catalogo SET nombre = 'API Honras'                                      WHERE codigo = 'APIHONRAS';
UPDATE aplicativos_catalogo SET nombre = 'API RENIEC'                                      WHERE codigo = 'ARENIEC';
UPDATE aplicativos_catalogo SET nombre = 'API Multiservicios SUNAT'                        WHERE codigo = 'APIMS';
UPDATE aplicativos_catalogo SET nombre = 'API Correo'                                      WHERE codigo = 'MAIL';
UPDATE aplicativos_catalogo SET nombre = 'API Directorio Activo'                           WHERE codigo = 'SIAPIAD';
UPDATE aplicativos_catalogo SET nombre = 'API SGAU'                                        WHERE codigo = 'SGAU';
UPDATE aplicativos_catalogo SET nombre = 'BI-Reportes CDE'                                 WHERE codigo = 'BI-CDE';
UPDATE aplicativos_catalogo SET nombre = 'Datamart Riesgos'                                WHERE codigo = 'BI-DMRI';
UPDATE aplicativos_catalogo SET nombre = 'BI-Calendarios Fondo Mi Vivienda'                WHERE codigo = 'BI-FMV';
UPDATE aplicativos_catalogo SET nombre = 'BI-Extracción Asientos Contables'                WHERE codigo = 'BI-LCONTA';
UPDATE aplicativos_catalogo SET nombre = 'BI-Carga OSCE'                                   WHERE codigo = 'BI-OSCE';
UPDATE aplicativos_catalogo SET nombre = 'Componentes Solución BI'                         WHERE codigo = 'BI-PLAT';
UPDATE aplicativos_catalogo SET nombre = 'Dashboard PRIDER'                                WHERE codigo = 'BI-PRIDER';
UPDATE aplicativos_catalogo SET nombre = 'BI-Saldo de Exposición GO'                       WHERE codigo = 'BI-SALEXP';
UPDATE aplicativos_catalogo SET nombre = 'Sistema Información Gerencial'                   WHERE codigo = 'BI-SIG';
UPDATE aplicativos_catalogo SET nombre = 'Sistema de Registro de Datos en Línea (SRDL)'   WHERE codigo = 'BI-SRDL';
UPDATE aplicativos_catalogo SET nombre = 'Site Centro de Documentos (Sharepoint)'         WHERE codigo = 'CD';
UPDATE aplicativos_catalogo SET nombre = 'Site Consultas Legales (Sharepoint)'            WHERE codigo = 'T-ASESORA';
UPDATE aplicativos_catalogo SET nombre = 'Intranet Vive Cofide (GOINTEGRO)'               WHERE codigo = 'CVIVE';
UPDATE aplicativos_catalogo SET nombre = 'Aplicación Externa Gestión Humana'              WHERE codigo = 'EXT.GGHH';
UPDATE aplicativos_catalogo SET nombre = 'Solución TeamMate (UAI)'                        WHERE codigo = 'TMATE';
UPDATE aplicativos_catalogo SET nombre = 'Solución NetDocuments'                          WHERE codigo = 'NDOC';
UPDATE aplicativos_catalogo SET nombre = 'Gestión Servicio Aseguramiento Calidad'         WHERE codigo = 'GSERT';
UPDATE aplicativos_catalogo SET nombre = 'No Facturable'                                  WHERE codigo = 'NFAC';
UPDATE aplicativos_catalogo SET nombre = 'Sistema del Programa de Garantías COVID'        WHERE codigo = 'PGC';
UPDATE aplicativos_catalogo SET nombre = 'Sistema Base de Datos Personal'                 WHERE codigo = 'SBDP';
UPDATE aplicativos_catalogo SET nombre = 'Sistema Centralizado'                           WHERE codigo = 'SC';
UPDATE aplicativos_catalogo SET nombre = 'Sistema de Denuncias'                           WHERE codigo = 'SDR';
UPDATE aplicativos_catalogo SET nombre = 'Sistema SEPYMEX V2'                             WHERE codigo = 'SEPYMEX_V2';
UPDATE aplicativos_catalogo SET nombre = 'Sistema de Gestión de Contratos'                WHERE codigo = 'SGC';
UPDATE aplicativos_catalogo SET nombre = 'Sistema de Gestión de Postulantes'              WHERE codigo = 'SGP';
UPDATE aplicativos_catalogo SET nombre = 'Sistema Impulso MyPerú'                         WHERE codigo = 'SIMP';
UPDATE aplicativos_catalogo SET nombre = 'Sistema de Notificación'                        WHERE codigo = 'SISNOTIF';
UPDATE aplicativos_catalogo SET nombre = 'Sistema Libros Digitales Únicas'               WHERE codigo = 'SLDU';
UPDATE aplicativos_catalogo SET nombre = 'Sistema Multiproducto'                          WHERE codigo = 'SMP';
UPDATE aplicativos_catalogo SET nombre = 'Sistema de Intermediación / SINTER'             WHERE codigo = 'SNT';
UPDATE aplicativos_catalogo SET nombre = 'Sistema Proyecto Base'                          WHERE codigo = 'SPB';
UPDATE aplicativos_catalogo SET nombre = 'Estadísticas Económicas'                        WHERE codigo = 'STAT';
UPDATE aplicativos_catalogo SET nombre = 'Sistema de Transferencia FTP a Banco'           WHERE codigo = 'STFTP';
UPDATE aplicativos_catalogo SET nombre = 'Sistema de Registro de Visitas de COFIDE (VISOF)' WHERE codigo = 'VSOF';
UPDATE aplicativos_catalogo SET nombre = 'Workflow Mi Vivienda'                           WHERE codigo = 'WMV';
UPDATE aplicativos_catalogo SET nombre = 'Acciones Preferentes'                           WHERE codigo = 'SAP-ACCPRE';
UPDATE aplicativos_catalogo SET nombre = 'Amortización Activos Fijos'                     WHERE codigo = 'SAP-AMAA';
UPDATE aplicativos_catalogo SET nombre = 'Anexo 8'                                        WHERE codigo = 'SAP-AN08';
UPDATE aplicativos_catalogo SET nombre = 'Bonos de Inversiones'                           WHERE codigo = 'SAP-BONOI';
UPDATE aplicativos_catalogo SET nombre = 'Business Partner (BP)'                          WHERE codigo = 'SAP-BP';
UPDATE aplicativos_catalogo SET nombre = 'Cobranza FMV'                                   WHERE codigo = 'SAP-CFMV';
UPDATE aplicativos_catalogo SET nombre = 'Clasificación de Riesgos'                       WHERE codigo = 'SAP-CLAFRI';
UPDATE aplicativos_catalogo SET nombre = 'Contratos Calendarios'                          WHERE codigo = 'SAP-COCA';
UPDATE aplicativos_catalogo SET nombre = 'Compensación de Asientos Contables'             WHERE codigo = 'SAP-COMP';
UPDATE aplicativos_catalogo SET nombre = 'Contratos Traslado Tratamiento Contable'        WHERE codigo = 'SAP-CTTC';
UPDATE aplicativos_catalogo SET nombre = 'Facturación Fideicomisos (SD)'                  WHERE codigo = 'SAP-FFID';
UPDATE aplicativos_catalogo SET nombre = 'Facturación Finanzas (FI)'                      WHERE codigo = 'SAP-FFIN';
UPDATE aplicativos_catalogo SET nombre = 'Garantías'                                      WHERE codigo = 'SAP-GAR';
UPDATE aplicativos_catalogo SET nombre = 'Libros Electrónicos'                            WHERE codigo = 'SAP-LIBELE';
UPDATE aplicativos_catalogo SET nombre = 'Plan Concluido'                                 WHERE codigo = 'SAP-PCON';
UPDATE aplicativos_catalogo SET nombre = 'Pedido de Logística'                            WHERE codigo = 'SAP-PED';
UPDATE aplicativos_catalogo SET nombre = 'Prepagos Parciales'                             WHERE codigo = 'SAP-PPAR';
UPDATE aplicativos_catalogo SET nombre = 'Provisiones'                                    WHERE codigo = 'SAP-PROV';
UPDATE aplicativos_catalogo SET nombre = 'Reporte Crediticio de Deudores (RCD)'           WHERE codigo = 'SAP-RCD';
UPDATE aplicativos_catalogo SET nombre = 'Actualización de SAP Productivo a QAS'          WHERE codigo = 'SAP-REFRESH';
UPDATE aplicativos_catalogo SET nombre = 'Registros Contables Finanzas'                   WHERE codigo = 'SAP-REGFI';
UPDATE aplicativos_catalogo SET nombre = 'Reporte de Contratos SAP'                       WHERE codigo = 'SAP-REPCON';
UPDATE aplicativos_catalogo SET nombre = 'REPOS'                                          WHERE codigo = 'SAP-REPOS';
UPDATE aplicativos_catalogo SET nombre = 'SOLPE'                                          WHERE codigo = 'SAP-SOLPED';
UPDATE aplicativos_catalogo SET nombre = 'Valoración Moneda Extranjera'                   WHERE codigo = 'SAP-VME';
UPDATE aplicativos_catalogo SET nombre = 'Workflow DAF'                                   WHERE codigo = 'SAP-WFDAF';
UPDATE aplicativos_catalogo SET nombre = 'Workflow Integrado de Transferencia'            WHERE codigo = 'SAP-WIT';
UPDATE aplicativos_catalogo SET nombre = 'Sistema Búsqueda de Fideicomisos'               WHERE codigo = 'BFID';
UPDATE aplicativos_catalogo SET nombre = 'Sistema CDE'                                    WHERE codigo = 'CDE';
UPDATE aplicativos_catalogo SET nombre = 'Customer Cofide (Compliance)'                   WHERE codigo = 'CCOFI';
UPDATE aplicativos_catalogo SET nombre = 'Sistema Cumpleaños'                             WHERE codigo = 'CUMPLE';
UPDATE aplicativos_catalogo SET nombre = 'Sistema de Carga SBS'                           WHERE codigo = 'EEFF';
UPDATE aplicativos_catalogo SET nombre = 'Sistema de Fondo de Apoyo Empresarial'          WHERE codigo = 'FAE';
UPDATE aplicativos_catalogo SET nombre = 'Sistema FCEI'                                   WHERE codigo = 'FCEI';
UPDATE aplicativos_catalogo SET nombre = 'Sistema FIFPPA'                                 WHERE codigo = 'FIFPPA';
UPDATE aplicativos_catalogo SET nombre = 'Sistema Firmas'                                 WHERE codigo = 'FIRMAS';
UPDATE aplicativos_catalogo SET nombre = 'Sistema FOGEM'                                  WHERE codigo = 'FOGEM';
UPDATE aplicativos_catalogo SET nombre = 'Sistemas INFOGAS'                               WHERE codigo = 'INFOG';
UPDATE aplicativos_catalogo SET nombre = 'Sistema de Metodización'                        WHERE codigo = 'MEEFF';
UPDATE aplicativos_catalogo SET nombre = 'App Mi Yunta Financiero'                        WHERE codigo = 'MYF';
UPDATE aplicativos_catalogo SET nombre = 'Sistema de Programa de Apoyo Empresarial'       WHERE codigo = 'PAE';
UPDATE aplicativos_catalogo SET nombre = 'PGCC'                                           WHERE codigo = 'PGCC';
UPDATE aplicativos_catalogo SET nombre = 'Sistema Portal COFIDE'                          WHERE codigo = 'PORTALCOFIDE';
UPDATE aplicativos_catalogo SET nombre = 'Sistema Pricing'                                WHERE codigo = 'PRICING';
UPDATE aplicativos_catalogo SET nombre = 'Sistema RCC'                                    WHERE codigo = 'RCC';
UPDATE aplicativos_catalogo SET nombre = 'Reporte Crediticio de Deudores'                 WHERE codigo = 'RCD';
UPDATE aplicativos_catalogo SET nombre = 'Sistema RFA'                                    WHERE codigo = 'RFA';
UPDATE aplicativos_catalogo SET nombre = 'Sistema de Capacitación al Agricultor RFA'      WHERE codigo = 'SCAP';
UPDATE aplicativos_catalogo SET nombre = 'Sistema de Cadenas Productivas'                 WHERE codigo = 'SCP';
UPDATE aplicativos_catalogo SET nombre = 'Sistema de Carga Masiva de Crédito'             WHERE codigo = 'SCM';
UPDATE aplicativos_catalogo SET nombre = 'Sistema de Contratos'                           WHERE codigo = 'SCO';
UPDATE aplicativos_catalogo SET nombre = 'Sistema SEPYMEX'                                WHERE codigo = 'SEPYMEX';
UPDATE aplicativos_catalogo SET nombre = 'Sistema de Fondo Crecer'                        WHERE codigo = 'SFC';
UPDATE aplicativos_catalogo SET nombre = 'Sistema de Gestión Documental'                  WHERE codigo = 'SGD';
UPDATE aplicativos_catalogo SET nombre = 'Sistema SGCC'                                   WHERE codigo = 'SGCC';
UPDATE aplicativos_catalogo SET nombre = 'Sistema de Gestión y Control Normativo'         WHERE codigo = 'SIGCNOR';
UPDATE aplicativos_catalogo SET nombre = 'Sistema de Gestión de Obligaciones'             WHERE codigo = 'SIGOBL';
UPDATE aplicativos_catalogo SET nombre = 'Sistema de Gestión de Órdenes de Giro'          WHERE codigo = 'SIGORG';
UPDATE aplicativos_catalogo SET nombre = 'SPLAFT'                                         WHERE codigo = 'SPLAFT';
UPDATE aplicativos_catalogo SET nombre = 'Sistema Reactiva Perú'                          WHERE codigo = 'SRP';
UPDATE aplicativos_catalogo SET nombre = 'Sistema de Trámite Documentario (Antiguo)'      WHERE codigo = 'STD';
UPDATE aplicativos_catalogo SET nombre = 'Sistema de Usuarios Centralizados'              WHERE codigo = 'SUC';
UPDATE aplicativos_catalogo SET nombre = 'Sistema TcReuters'                              WHERE codigo = 'TCREUTERS';
UPDATE aplicativos_catalogo SET nombre = 'Sistema de Unidad de Emprendimiento'            WHERE codigo = 'UNE';


-- ───────────────────────────────────────────────────────────────────
-- 023 — Fix trigger historial (primera corrección)
-- ───────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION record_requirement_history()
RETURNS TRIGGER AS $$
DECLARE v_user UUID;
BEGIN
  v_user := auth.uid();
  IF OLD.titulo              IS DISTINCT FROM NEW.titulo              THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'titulo',            OLD.titulo,                    NEW.titulo);                    END IF;
  IF OLD.aplicativo          IS DISTINCT FROM NEW.aplicativo          THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'aplicativo',        OLD.aplicativo,                NEW.aplicativo);                END IF;
  IF OLD.tipo_solicitud      IS DISTINCT FROM NEW.tipo_solicitud      THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'tipo_solicitud',    OLD.tipo_solicitud::TEXT,      NEW.tipo_solicitud::TEXT);      END IF;
  IF OLD.estado_req          IS DISTINCT FROM NEW.estado_req          THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'estado_req',        OLD.estado_req::TEXT,          NEW.estado_req::TEXT);          END IF;
  IF OLD.prioridad           IS DISTINCT FROM NEW.prioridad           THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'prioridad',         OLD.prioridad::TEXT,           NEW.prioridad::TEXT);           END IF;
  IF OLD.ati_responsable     IS DISTINCT FROM NEW.ati_responsable     THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'ati_responsable',   OLD.ati_responsable,           NEW.ati_responsable);           END IF;
  IF OLD.responsable_qa_id   IS DISTINCT FROM NEW.responsable_qa_id   THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'responsable_qa',    OLD.responsable_qa_id::TEXT,   NEW.responsable_qa_id::TEXT);   END IF;
  IF OLD.qa_apoyo_1_id       IS DISTINCT FROM NEW.qa_apoyo_1_id       THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'qa_apoyo1',         OLD.qa_apoyo_1_id::TEXT,       NEW.qa_apoyo_1_id::TEXT);       END IF;
  IF OLD.qa_apoyo_2_id       IS DISTINCT FROM NEW.qa_apoyo_2_id       THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'qa_apoyo2',         OLD.qa_apoyo_2_id::TEXT,       NEW.qa_apoyo_2_id::TEXT);       END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ───────────────────────────────────────────────────────────────────
-- 024 — Grupo de aplicativos
-- ───────────────────────────────────────────────────────────────────

ALTER TABLE aplicativos_catalogo
  ADD COLUMN IF NOT EXISTS aplicativo_grupo TEXT;

UPDATE aplicativos_catalogo SET aplicativo_grupo = 'SAP'        WHERE codigo LIKE 'SAP-%';
UPDATE aplicativos_catalogo SET aplicativo_grupo = 'BI'         WHERE codigo LIKE 'BI-%';
UPDATE aplicativos_catalogo SET aplicativo_grupo = 'API'        WHERE codigo IN ('APGEN','APIBW','APIHONRAS','ARENIEC','APIMS','MAIL','SGAU','SIAPIAD');
UPDATE aplicativos_catalogo SET aplicativo_grupo = 'Sharepoint' WHERE codigo IN ('CD','T-ASESORA','CVIVE','EXT.GGHH','TMATE','NDOC');
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP]'   WHERE aplicativo_grupo IS NULL;


-- ───────────────────────────────────────────────────────────────────
-- 025 — Carga completa de grupos, ATI y correos
-- ───────────────────────────────────────────────────────────────────

UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] Fondo Crecer',           ati_responsable = 'Wilderd Iriarte',      correo = NULL                          WHERE codigo = 'SFC';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] Reactiva Perú',           ati_responsable = 'Edwin Bustamante',     correo = 'ebustamante@cofide.com.pe'   WHERE codigo = 'SRP';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] SINTER',                  ati_responsable = 'Edwin Bustamante',     correo = 'ebustamante@cofide.com.pe'   WHERE codigo = 'SNT';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] FIFPPA',                  ati_responsable = 'Eduardo Tacuche',      correo = 'etacuche@cofide.com.pe'      WHERE codigo = 'FIFPPA';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] Customer COFIDE',         ati_responsable = 'Diego Mendoza',        correo = 'dmendoza@cofide.com.pe'      WHERE codigo = 'CCOFI';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] Portal Cofide',           ati_responsable = 'Diego Mendoza',        correo = 'dmendoza@cofide.com.pe'      WHERE codigo = 'PORTALCOFIDE';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] TcReuters',               ati_responsable = 'Diego Mendoza',        correo = 'dmendoza@cofide.com.pe'      WHERE codigo = 'TCREUTERS';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] SIGOBL',                  ati_responsable = 'Claudia Altamirano',   correo = 'maltamirano@cofide.com.pe'   WHERE codigo = 'SIGOBL';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] API MultiServices',       ati_responsable = NULL, correo = NULL WHERE codigo = 'APIMS';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] API-EnvíoCorreos',        ati_responsable = NULL, correo = NULL WHERE codigo = 'MAIL';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] BusquedaFideicomiso',     ati_responsable = NULL, correo = NULL WHERE codigo = 'BFID';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] Cadenas Productivas',     ati_responsable = NULL, correo = NULL WHERE codigo = 'SCP';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] Calculadora Pricing',     ati_responsable = NULL, correo = NULL WHERE codigo = 'PRICING';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] Capacitación Agricultores', ati_responsable = NULL, correo = NULL WHERE codigo = 'SCAP';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] Carga SBS',               ati_responsable = NULL, correo = NULL WHERE codigo = 'EEFF';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] CDE',                     ati_responsable = NULL, correo = NULL WHERE codigo = 'CDE';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] Cumpleaños',              ati_responsable = NULL, correo = NULL WHERE codigo = 'CUMPLE';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] FAE',                     ati_responsable = NULL, correo = NULL WHERE codigo = 'FAE';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] FCEI',                    ati_responsable = NULL, correo = NULL WHERE codigo = 'FCEI';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] Firmas',                  ati_responsable = NULL, correo = NULL WHERE codigo = 'FIRMAS';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] Fogem',                   ati_responsable = NULL, correo = NULL WHERE codigo = 'FOGEM';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] Infogas',                 ati_responsable = NULL, correo = NULL WHERE codigo = 'INFOG';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] Metodizacion',            ati_responsable = NULL, correo = NULL WHERE codigo = 'MEEFF';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] Mi Yunta Financiero',     ati_responsable = NULL, correo = NULL WHERE codigo = 'MYF';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] PAE',                     ati_responsable = NULL, correo = NULL WHERE codigo = 'PAE';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] PGCC',                    ati_responsable = NULL, correo = NULL WHERE codigo = 'PGCC';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] RCC',                     ati_responsable = NULL, correo = NULL WHERE codigo = 'RCC';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] RCD',                     ati_responsable = NULL, correo = NULL WHERE codigo = 'RCD';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] Repo',                    ati_responsable = NULL, correo = NULL WHERE codigo = 'SAP-REPOS';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] RFA',                     ati_responsable = NULL, correo = NULL WHERE codigo = 'RFA';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] SCM',                     ati_responsable = NULL, correo = NULL WHERE codigo = 'SCM';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] SCO',                     ati_responsable = NULL, correo = NULL WHERE codigo = 'SCO';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] Sepymex',                 ati_responsable = NULL, correo = NULL WHERE codigo = 'SEPYMEX';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] SGAU',                    ati_responsable = NULL, correo = NULL WHERE codigo = 'SGAU';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] SGCC',                    ati_responsable = NULL, correo = NULL WHERE codigo = 'SGCC';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] SGD',                     ati_responsable = NULL, correo = NULL WHERE codigo = 'SGD';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] SIGCNOR',                 ati_responsable = NULL, correo = NULL WHERE codigo = 'SIGCNOR';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] SIGORG',                  ati_responsable = NULL, correo = NULL WHERE codigo = 'SIGORG';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] SPLAFT',                  ati_responsable = NULL, correo = NULL WHERE codigo = 'SPLAFT';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] STD',                     ati_responsable = NULL, correo = NULL WHERE codigo = 'STD';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] SUC',                     ati_responsable = NULL, correo = NULL WHERE codigo = 'SUC';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] UNE',                     ati_responsable = NULL, correo = NULL WHERE codigo = 'UNE';

INSERT INTO aplicativos_catalogo (codigo, nombre, color, activo, orden, aplicativo_grupo, ati_responsable, correo)
VALUES ('WDF','Sistema Workflow de Firma','#64748B',true,490,'[NO SAP] WorkFlowFirma',NULL,NULL)
ON CONFLICT (codigo) DO UPDATE SET
  nombre           = EXCLUDED.nombre,
  aplicativo_grupo = EXCLUDED.aplicativo_grupo;


-- ───────────────────────────────────────────────────────────────────
-- 026 — Fix trigger historial v2 (versión final correcta)
-- ───────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION record_requirement_history()
RETURNS TRIGGER AS $$
DECLARE v_user UUID;
BEGIN
  v_user := auth.uid();
  IF OLD.titulo                IS DISTINCT FROM NEW.titulo                THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'titulo',              OLD.titulo,                      NEW.titulo);                      END IF;
  IF OLD.aplicativo            IS DISTINCT FROM NEW.aplicativo            THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'aplicativo',          OLD.aplicativo,                  NEW.aplicativo);                  END IF;
  IF OLD.tipo_requerimiento    IS DISTINCT FROM NEW.tipo_requerimiento    THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'tipo_requerimiento',  OLD.tipo_requerimiento::TEXT,    NEW.tipo_requerimiento::TEXT);    END IF;
  IF OLD.estado_req            IS DISTINCT FROM NEW.estado_req            THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'estado_req',          OLD.estado_req::TEXT,            NEW.estado_req::TEXT);            END IF;
  IF OLD.prioridad             IS DISTINCT FROM NEW.prioridad             THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'prioridad',           OLD.prioridad::TEXT,             NEW.prioridad::TEXT);             END IF;
  IF OLD.ati_responsable       IS DISTINCT FROM NEW.ati_responsable       THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'ati_responsable',     OLD.ati_responsable,             NEW.ati_responsable);             END IF;
  IF OLD.responsable_qa_id     IS DISTINCT FROM NEW.responsable_qa_id     THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'responsable_qa',      OLD.responsable_qa_id::TEXT,     NEW.responsable_qa_id::TEXT);     END IF;
  IF OLD.qa_apoyo_1_id         IS DISTINCT FROM NEW.qa_apoyo_1_id         THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'qa_apoyo_1',          OLD.qa_apoyo_1_id::TEXT,         NEW.qa_apoyo_1_id::TEXT);         END IF;
  IF OLD.qa_apoyo_2_id         IS DISTINCT FROM NEW.qa_apoyo_2_id         THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'qa_apoyo_2',          OLD.qa_apoyo_2_id::TEXT,         NEW.qa_apoyo_2_id::TEXT);         END IF;
  IF OLD.qa_apoyo_3_id         IS DISTINCT FROM NEW.qa_apoyo_3_id         THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'qa_apoyo_3',          OLD.qa_apoyo_3_id::TEXT,         NEW.qa_apoyo_3_id::TEXT);         END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ═══════════════════════════════════════════════════════════════════
-- FIN — Schema completo aplicado (migraciones 001 a 026)
-- ═══════════════════════════════════════════════════════════════════
