-- ═══════════════════════════════════════════════════════════════════
-- QACC — Actualizar nombres oficiales de la Matriz de Aplicaciones
-- Ejecutar en: Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

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
 