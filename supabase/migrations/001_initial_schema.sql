-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — Schema Completo v2
-- Proyecto: DEVSTREAM_QA
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- ──────────────────────────────────────────
-- 1. ENUMERACIONES
-- ──────────────────────────────────────────

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

-- ──────────────────────────────────────────
-- 2. PERFILES DE USUARIO
-- ──────────────────────────────────────────

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

-- ──────────────────────────────────────────
-- 3. REQUERIMIENTOS
-- ──────────────────────────────────────────

CREATE TABLE requirements (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificación
  codigo_requerimiento      TEXT NOT NULL UNIQUE,
  titulo                    TEXT NOT NULL,
  descripcion               TEXT,
  aplicativo                aplicativo_enum NOT NULL,
  tipo_requerimiento        tipo_requerimiento_enum NOT NULL,
  gestor_responsable        TEXT,

  -- Equipo QA (principal + hasta 3 de apoyo)
  responsable_qa_id         UUID REFERENCES profiles(id) ON DELETE SET NULL,
  qa_apoyo_1_id             UUID REFERENCES profiles(id) ON DELETE SET NULL,
  qa_apoyo_2_id             UUID REFERENCES profiles(id) ON DELETE SET NULL,
  qa_apoyo_3_id             UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Estado y ejecución
  estado_qa                 estado_qa_enum NOT NULL DEFAULT 'BACKLOG',
  estado_req                estado_req_enum,
  iteracion                 SMALLINT NOT NULL DEFAULT 1,

  -- Casos de prueba
  cp_total                  SMALLINT NOT NULL DEFAULT 0,
  cp_ok                     SMALLINT NOT NULL DEFAULT 0,
  cp_fallo                  SMALLINT NOT NULL DEFAULT 0,
  cp_bloqueados             SMALLINT NOT NULL DEFAULT 0,
  cp_gestion                SMALLINT NOT NULL DEFAULT 0,
  cp_diseno                 SMALLINT NOT NULL DEFAULT 0,
  cp_it                     SMALLINT NOT NULL DEFAULT 0,

  -- Horas
  horas_estimadas           NUMERIC(8,2) NOT NULL DEFAULT 0,
  horas_reales              NUMERIC(8,2) NOT NULL DEFAULT 0,

  -- Fechas
  fecha_asignacion          DATE,
  fecha_entrega_estimacion  DATE,
  fecha_inicio_planificada  DATE,
  fecha_inicio_real         DATE,
  fecha_entrega_planificada DATE,
  fecha_entrega_real        DATE,

  -- Defectos
  defectos_qa               SMALLINT NOT NULL DEFAULT 0,
  defectos_uat              SMALLINT NOT NULL DEFAULT 0,
  defectos_produccion       SMALLINT NOT NULL DEFAULT 0,

  -- Evidencias y observaciones
  rutas_evidencias          TEXT,
  ticket                    TEXT,
  observaciones_estado      TEXT,

  -- Campos heredados del diseño original
  riesgo                    riesgo_enum NOT NULL DEFAULT 'BAJO',
  bloqueado                 BOOLEAN NOT NULL DEFAULT FALSE,
  motivo_bloqueo            TEXT,

  -- Auditoría
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

-- ──────────────────────────────────────────
-- 4. HISTORIAL DE CAMBIOS
-- ──────────────────────────────────────────

CREATE TABLE requirement_history (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id   UUID NOT NULL REFERENCES requirements(id) ON DELETE CASCADE,
  changed_by       UUID REFERENCES profiles(id),
  campo_modificado TEXT NOT NULL,
  valor_anterior   TEXT,
  valor_nuevo      TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ──────────────────────────────────────────
-- 5. ÍNDICES
-- ──────────────────────────────────────────

CREATE INDEX idx_req_estado            ON requirements(estado_qa);
CREATE INDEX idx_req_estado_req        ON requirements(estado_req);
CREATE INDEX idx_req_responsable       ON requirements(responsable_qa_id);
CREATE INDEX idx_req_aplicativo        ON requirements(aplicativo);
CREATE INDEX idx_req_bloqueado         ON requirements(bloqueado) WHERE bloqueado = TRUE;
CREATE INDEX idx_req_created_at        ON requirements(created_at DESC);
CREATE INDEX idx_history_req           ON requirement_history(requirement_id);
CREATE INDEX idx_history_created_at    ON requirement_history(created_at DESC);

-- ──────────────────────────────────────────
-- 6. FUNCIÓN: updated_at automático
-- ──────────────────────────────────────────

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

-- ──────────────────────────────────────────
-- 7. TRIGGER: Historial automático de cambios
-- ──────────────────────────────────────────

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

-- ──────────────────────────────────────────
-- 8. ROW LEVEL SECURITY (RLS)
-- ──────────────────────────────────────────

ALTER TABLE profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirements        ENABLE ROW LEVEL SECURITY;
ALTER TABLE requirement_history ENABLE ROW LEVEL SECURITY;

-- Función auxiliar SECURITY DEFINER: evita la recursión infinita que se
-- produce si una política de "profiles" vuelve a consultar "profiles"
-- directamente (eso re-dispara la misma política y Postgres la rechaza).
CREATE OR REPLACE FUNCTION is_supervisor()
RETURNS BOOLEAN AS $$
  SELECT role = 'SUPERVISOR' FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Profiles
CREATE POLICY "profiles_select" ON profiles FOR SELECT
  USING (id = auth.uid() OR is_supervisor());

CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Requirements: SUPERVISOR ve y gestiona todo
CREATE POLICY "req_supervisor" ON requirements FOR ALL
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'SUPERVISOR')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'SUPERVISOR');

-- Requirements: ANALISTA ve los asignados a él (principal o apoyo)
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

-- History
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

-- ──────────────────────────────────────────
-- 9. Auto-crear perfil al registrar usuario
-- ──────────────────────────────────────────

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
