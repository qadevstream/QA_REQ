-- ═══════════════════════════════════════════════════════════════════
-- QACC — Fix trigger record_requirement_history
-- El trigger referenciaba columnas que ya no existen en requirements
-- (estado_qa, iteracion, cp_total, bloqueado, etc. fueron movidos
--  a requirement_iterations o eliminados en migraciones anteriores).
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

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
  IF OLD.qa_apoyo1_id        IS DISTINCT FROM NEW.qa_apoyo1_id        THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'qa_apoyo1',         OLD.qa_apoyo1_id::TEXT,        NEW.qa_apoyo1_id::TEXT);        END IF;
  IF OLD.qa_apoyo2_id        IS DISTINCT FROM NEW.qa_apoyo2_id        THEN INSERT INTO requirement_history VALUES (gen_random_uuid(), NEW.id, v_user, 'qa_apoyo2',         OLD.qa_apoyo2_id::TEXT,        NEW.qa_apoyo2_id::TEXT);        END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
