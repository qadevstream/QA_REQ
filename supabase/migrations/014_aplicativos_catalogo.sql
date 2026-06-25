-- ═══════════════════════════════════════════════════════════════════
-- QA CONTROL CENTER — Catálogo dinámico de Aplicativos
-- Reemplaza el enum aplicativo_enum por una tabla mantenible desde la UI.
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- 1. Crear tabla catálogo
-- ──────────────────────────────────────────
CREATE TABLE aplicativos_catalogo (
  codigo  TEXT PRIMARY KEY,
  nombre  TEXT NOT NULL,
  color   VARCHAR(7) NOT NULL DEFAULT '#94A3B8',
  activo  BOOLEAN NOT NULL DEFAULT TRUE,
  orden   SMALLINT NOT NULL DEFAULT 0
);

-- 2. Poblar con la matriz oficial del área QA
-- ──────────────────────────────────────────
INSERT INTO aplicativos_catalogo (codigo, nombre, orden) VALUES
  ('UNE',          'Sistema de Unidad de Emprendimiento',                  1),
  ('EEFF',         'Sistema de Carga SBS',                                 2),
  ('RFA',          'Sistema RFA',                                          3),
  ('SEPYMEX',      'Sistema SEPYMEX',                                      4),
  ('SGCC',         'Sistema SGCC',                                         5),
  ('SIGORG',       'Sistema de Gestión de Órdenes de Giro',                6),
  ('MAIL',         'API Correo',                                           7),
  ('FIFPPA',       'Sistema FIFPPA',                                       8),
  ('WMV',          'Workflow Mi Vivienda',                                 9),
  ('SCAP',         'Sistema de Capacitación al Agricultor RFA',           10),
  ('SGC',          'Sistema de Gestión de Contratos',                     11),
  ('MEEFF',        'Sistema de Metodización',                             12),
  ('TCREUTERS',    'Sistema TcREUTERS',                                   13),
  ('CUMPLE',       'Sistema Cumpleaños',                                  14),
  ('SFC',          'Sistema de Fondo Crecer',                             15),
  ('SC',           'Sistema Centralizado',                                16),
  ('CDE',          'Sistema CDE',                                         17),
  ('SISNOTIF',     'Sistema de Notificación',                             18),
  ('RCD',          'Reporte Crediticio de Deudores',                      19),
  ('EXT.GGHH',     'Aplicación Externa Gestión Humana',                   20),
  ('SIGCNOR',      'Sistema de Gestión y Control Normativo',              21),
  ('PORTALCOFIDE', 'Sistema Portal COFIDE',                               22),
  ('PRICING',      'Sistema Pricing',                                     23),
  ('SEPYMEX_V2',   'Sistema SEPYMEX V2',                                  24),
  ('SCM',          'Sistema de Carga Masiva de Crédito',                  25),
  ('STFTP',        'Sistema de Transferencia FTP a Banco',                26),
  ('SMP',          'Sistema Multiproducto',                               27),
  ('SCO',          'Sistema de Contratos',                                28),
  ('RCC',          'Sistema RCC',                                         29),
  ('APIBW',        'API Servicios Workflow de Negocios',                  30),
  ('SIGOBL',       'Sistema de Gestión de Obligaciones',                  31),
  ('SRP',          'Sistema Reactiva Perú',                               32),
  ('APGEN',        'Aplicaciones Genéricas',                              33),
  ('SGAU',         'API SGAU',                                            34),
  ('PAE',          'Sistema de Programa de Apoyo Empresarial',            35),
  ('SPLAFT',       'SPLAFT',                                              36),
  ('FCEI',         'Sistema FCEI',                                        37),
  ('PGC',          'Sistema del Programa de Garantías COVID',             38),
  ('SIAPIAD',      'API Directorio Activo',                               39),
  ('SGP',          'Sistema de Gestión de Postulantes',                   40),
  ('SUC',          'Sistema de Usuarios Centralizados',                   41),
  ('STAT',         'Estadísticas Económicas',                             42),
  ('FOGEM',        'Sistema FOGEM',                                       43),
  ('FIRMAS',       'Sistema Firmas',                                      44),
  ('SCP',          'Sistema de Cadenas Productivas',                      45),
  ('FAE',          'Sistema de Fondo de Apoyo Empresarial',               46),
  ('PGCC',         'PGCC',                                                47),
  ('SLDU',         'Sistema Libros Digitales Únicas',                     48),
  ('SPB',          'Sistema Proyecto Base',                               49),
  ('APIHONRAS',    'API Honras',                                          50),
  ('SIMP',         'Sistema Impulso MyPerú',                              51),
  ('SNT',          'Sistema de Intermediación (SINTER)',                  52),
  ('SAP-WFDAF',    'Workflow DAF',                                        53),
  ('SAP-BP',       'Business Partner (BP)',                               54),
  ('SAP-REPOS',    'REPOS',                                               55),
  ('SAP-BONOI',    'Bonos de Inversiones',                                56),
  ('SAP-FFIN',     'Facturación Finanzas (FI)',                           57),
  ('SAP-PROV',     'Provisiones',                                         58),
  ('SAP-GAR',      'Garantías',                                           59),
  ('SAP-CLAFRI',   'Clasificación de Riesgos',                            60),
  ('SAP-ACCPRE',   'Acciones Preferentes',                                61),
  ('SAP-FFID',     'Facturación Fideicomisos (SD)',                       62),
  ('SAP-COCA',     'Contratos Calendarios',                               63),
  ('SAP-WIT',      'Workflow Integrado de Transferencia',                 64),
  ('SAP-RCD',      'Reporte Crediticio de Deudores (RCD)',                65),
  ('SAP-PPAR',     'Prepagos Parciales',                                  66),
  ('SAP-CFMV',     'Cobranza FMV',                                        67),
  ('SAP-PCON',     'Plan Concluido',                                      68),
  ('SAP-CTTC',     'Contratos Traslado Tratamiento Contable',             69),
  ('SAP-AN08',     'Anexo 8',                                             70),
  ('BI-DMRI',      'Datamart Riesgos',                                    71),
  ('BI-SIG',       'Sistema Información Gerencial',                       72),
  ('BI-PRIDER',    'Dashboard PRIDER',                                    73),
  ('SAP-LIBELE',   'Libros Electrónicos',                                 74),
  ('SAP-COMP',     'Compensación de Asientos Contables',                  75),
  ('SAP-REGFI',    'Registros Contables Finanzas',                        76),
  ('SAP-VME',      'Valoración Moneda Extranjera',                        77),
  ('SAP-REFRESH',  'Actualización de SAP Productivo a QAS',               78),
  ('SAP-PED',      'Pedido de Logística',                                 79),
  ('SAP-SOLPED',   'SOLPE',                                               80),
  ('SAP-REPCON',   'Reporte de Contratos SAP',                            81),
  ('NFAC',         'No Facturable',                                       82),
  ('SGD',          'Sistema de Gestión Documental',                       83),
  ('BI-SALEXP',    'BI-Saldo de Exposición GO',                           84),
  ('TMATE',        'Solución TeamMate (UAI)',                             85),
  ('CD',           'Site Centro de Documentos (Sharepoint)',              86),
  ('STD',          'Sistema de Trámite Documentario (Antiguo)',           87),
  ('INFOG',        'Sistemas INFOGAS',                                    88),
  ('GSERT',        'Gestión Servicio Aseguramiento Calidad',              89),
  ('BI-SRDL',      'Sistema de Registro de Datos en Línea (SRDL)',        90),
  ('SDR',          'Sistema de Denuncias',                                91),
  ('BI-OSCE',      'BI-Carga OSCE',                                       92),
  ('BI-LCONTA',    'BI-Extracción Asientos Contables',                    93),
  ('T-ASESORA',    'Site Consultas Legales (Sharepoint)',                 94),
  ('NDOC',         'Solución NetDocuments',                               95),
  ('VSOF',         'Sistema de Registro de Visitas de COFIDE',            96),
  ('BFID',         'Sistema Búsqueda de Fideicomisos',                   97),
  ('BI-FMV',       'BI-Calendarios Fondo Mi Vivienda',                   98),
  ('BI-PLAT',      'Componentes Solución BI',                             99),
  ('CVIVE',        'Intranet Vive Cofide (GOINTEGRO)',                   100),
  ('MYF',          'App Mi Yunta Financiero',                            101),
  ('SBDP',         'Sistema Base de Datos Personal',                     102),
  ('ARENIEC',      'API RENIEC',                                         103),
  ('SAP-AMAA',     'Amortización Activos Fijos',                         104),
  ('BI-CDE',       'BI-Reportes CDE',                                    105),
  ('APIMS',        'API Multiservicios SUNAT',                           106),
  ('CCOFI',        'Customer Cofide (Compliance)',                        107),
  ('OTROS',        'Otros',                                              108);

-- 3. Liberar las columnas del tipo enum para poder eliminarlo
-- ──────────────────────────────────────────
ALTER TABLE requirements    ALTER COLUMN aplicativo TYPE TEXT;
ALTER TABLE actividades     ALTER COLUMN aplicativo TYPE TEXT;
ALTER TABLE registro_diario ALTER COLUMN aplicativo TYPE TEXT;

-- 4. Eliminar el enum (ya no hay columnas que lo usen)
-- ──────────────────────────────────────────
DROP TYPE IF EXISTS aplicativo_enum;

-- 5. RLS del catálogo
-- ──────────────────────────────────────────
ALTER TABLE aplicativos_catalogo ENABLE ROW LEVEL SECURITY;

-- Lectura: todos los usuarios autenticados
CREATE POLICY "ap_catalogo_select" ON aplicativos_catalogo
  FOR SELECT USING (auth.role() = 'authenticated');

-- Escritura: solo Supervisor
CREATE POLICY "ap_catalogo_insert" ON aplicativos_catalogo
  FOR INSERT WITH CHECK (is_supervisor());

CREATE POLICY "ap_catalogo_update" ON aplicativos_catalogo
  FOR UPDATE USING (is_supervisor());

CREATE POLICY "ap_catalogo_delete" ON aplicativos_catalogo
  FOR DELETE USING (is_supervisor());
