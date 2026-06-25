-- ═══════════════════════════════════════════════════════════════════
-- QACC — Carga completa: aplicativo_grupo + ati_responsable + correo
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- Registros con ATI y correo conocidos
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] Fondo Crecer',           ati_responsable = 'Wilderd Iriarte',      correo = NULL                          WHERE codigo = 'SFC';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] Reactiva Perú',           ati_responsable = 'Edwin Bustamante',     correo = 'ebustamante@cofide.com.pe'   WHERE codigo = 'SRP';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] SINTER',                  ati_responsable = 'Edwin Bustamante',     correo = 'ebustamante@cofide.com.pe'   WHERE codigo = 'SNT';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] FIFPPA',                  ati_responsable = 'Eduardo Tacuche',      correo = 'etacuche@cofide.com.pe'      WHERE codigo = 'FIFPPA';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] Customer COFIDE',         ati_responsable = 'Diego Mendoza',        correo = 'dmendoza@cofide.com.pe'      WHERE codigo = 'CCOFI';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] Portal Cofide',           ati_responsable = 'Diego Mendoza',        correo = 'dmendoza@cofide.com.pe'      WHERE codigo = 'PORTALCOFIDE';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] TcReuters',               ati_responsable = 'Diego Mendoza',        correo = 'dmendoza@cofide.com.pe'      WHERE codigo = 'TCREUTERS';
UPDATE aplicativos_catalogo SET aplicativo_grupo = '[NO SAP] SIGOBL',                  ati_responsable = 'Claudia Altamirano',   correo = 'maltamirano@cofide.com.pe'   WHERE codigo = 'SIGOBL';

-- Registros solo con aplicativo_grupo (sin ATI asignado aún)
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

-- Nuevo registro no existente en la BD
INSERT INTO aplicativos_catalogo (codigo, nombre, color, activo, orden, aplicativo_grupo, ati_responsable, correo)
VALUES ('WDF', 'Sistema Workflow de Firma', '#64748B', true, 490, '[NO SAP] WorkFlowFirma', NULL, NULL)
ON CONFLICT (codigo) DO UPDATE SET
  nombre           = EXCLUDED.nombre,
  aplicativo_grupo = EXCLUDED.aplicativo_grupo;
