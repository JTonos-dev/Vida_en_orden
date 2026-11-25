# Compatibilidad de publicación en Sites

El PR #12 resolvió la publicación de una instalación nueva mediante la proyección y el bootstrap descritos en [SITES_METADATA_BOOTSTRAP.md](SITES_METADATA_BOOTSTRAP.md). El candidato inicial a05433d y la corrección 5359d43 se publicaron en el mismo Site privado nuevo. Registro humano completado; clave pública propia configurada en entorno 2, misma versión 2. MCP autenticado/44 herramientas/31 lecturas/health (54 triggers) verificados y 48 tablas observadas. No se modificó una instalación personal. Firma de propuesta y aceptación funcional posterior siguen pendientes.

El primer ensayo humano descubrió un error adicional: enrollment se ejecutaba antes de la primera propuesta y confundía la ausencia de la fila de metadatos con una migración faltante. La regresión reproduce exactamente ese 503 sobre la cadena proyectada. La corrección permite el mismo bootstrap atómico desde el POST autenticado y protegido por CSRF de registro; GET, lecturas y solicitudes denegadas siguen sin inicializar. No fija confianza ni habilita negocio. Ver DEVELOPMENT_PROGRESS para el estado probado/publicado de la corrección.

## Límite documentado y diagnóstico original

La skill oficial Sites 1.1.7 remite a `<plugin-root>/skills/sites/references/storage.md`: «Keep migrations schema-only and bounded. Backfills and seed datasets belong outside migrations». Sites aplica migraciones antes de subir el Worker; SQL/snapshots/journal aplicados son inmutables. No se crean tablas ni ledgers desde requests.

| Archivo original conservado | Esquema | Metadatos fuera de esquema |
|---|---|---|
| 0008_mcp_proposal_engine.sql | 26 tablas, índices y 54 triggers | Un INSERT de identidad aleatoria propia |
| 0009_mcp_credential_candidates.sql | Tabla de desafíos | Ninguno |
| 0010_mcp_hardening.sql | Tres tablas, índice y métricas | Un UPDATE y 19 DELETE de propuestas/aprobaciones/staging anteriores |
| 0011_mcp_metadata_bootstrap.sql | Columna metadata_version | Ninguno |

Los DELETE no borran negocio. Inicialización/invalidación se trasladan al bootstrap atómico explícito, conservando identidad, revisión de negocio, recibos y evidencia. No se omiten para publicar. La comprobación compartida exige tablas y los 54 triggers antes del bootstrap.

## Procedimiento vigente

1. Ejecutar la suite y auditorías en el commit público limpio. Conservar los SQL originales y el marcador del manifiesto.
2. Generar un árbol nuevo con prepare:sites. La proyección acepta únicamente las 21 instrucciones de metadatos conocidas, conserva DDL/triggers y registra hashes originales/proyectados y SHA de origen. No exporta `.git` ni configuración ajena.
3. Configurar privadamente el Site propio y ejecutar verify:hosting allí. Debe devolver schema_only_candidate con cero instrucciones fuera de esquema. El gate sobre los originales falla deliberadamente; no relajar el auditor ni quitar triggers.
4. Construir/empaquetar/publicar el commit privado exacto mediante el helper oficial. Reutilizar el proyecto de desarrollo ya creado; no crear otra instancia para corregir código. Registrar IDs/URL/SHA privado solo en la trazabilidad privada.
5. Confirmar deployment, inventario y, mediante identidad real, health/catálogo. Probar registro antes de cualquier propuesta y completar UAT-3-HUMAN. Publicación, conexión y aprobación humana son verificaciones distintas.

El gate estático no es un validador SQL completo y mantiene backendVerified=false: su salida por sí sola no prueba Sites. La publicación nativa sí se observó para el candidato descrito, pero no certifica todas las actualizaciones ni el autenticador. Las herramientas administrativas disponibles inspeccionan tablas/filas; no ofrecen SQL arbitrario ni autorizan fabricarlo en MCP.

## Instalaciones existentes y soporte

La exportación está marcada freshInstallationOnly. Una instalación experimental que aplicó otra representación de 0008–0010 requiere autorización del propietario e inspección de ledger/hashes/estado antes de actualizar. No repetir SQL ni falsificar el ledger. Seguir UPGRADE_AND_ROLLBACK; las migraciones pueden haberse aplicado aunque una publicación falle después.

El borrador original de consulta administrativa no se envió. Ya no se requiere que el propietario investigue soporte para instalar el Site nuevo. Si una actualización existente presenta un estado ambiguo, preparar una consulta privada con: versión/commit, hashes de migraciones y estado observado; preguntar cómo inspeccionar/reanudar una publicación parcial por el mecanismo admitido. No adjuntar secretos, datos, respaldos ni identidades a GitHub. No afirmar un rechazo del backend al SQL original: no se probó ignorando la regla de esquema.
