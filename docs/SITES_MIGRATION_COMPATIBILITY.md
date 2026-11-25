# Compatibilidad pendiente de publicación en Sites

Estado: **no se ha publicado ni probado esta rama en el backend de Sites**. Se creó un único proyecto privado nuevo de desarrollo y se configuraron variables propias; la D1 está declarada como DB en el manifiesto, pero su aprovisionamiento alojado no está verificado. No se guardó una versión ni se inició un deployment. Ninguna instalación personal fue modificada.

## Límite documentado y gate reproducible

La skill oficial Sites 1.1.7 remite a `<plugin-root>/skills/sites/references/storage.md`: «Keep migrations schema-only and bounded. Backfills and seed datasets belong outside migrations». También indica que Sites aplica migraciones antes de subir el Worker, que SQL/snapshots/journal aplicados son inmutables y que no se crean tablas de migración en requests.

Nuestro SQL probado en D1 local contiene:

| Archivo | Esquema | Operaciones de metadatos fuera de esquema |
|---|---|---|
| 0008_mcp_proposal_engine.sql | 26 tablas, índices y 54 triggers | Un INSERT para identificar la instalación con un valor aleatorio propio |
| 0009_mcp_credential_candidates.sql | Tabla de desafíos | Ninguna |
| 0010_mcp_hardening.sql | Tres tablas, índice y columna de métricas | Un UPDATE de invalidación y 19 DELETE de aprobaciones/staging anteriores |

Los DELETE no borran cuentas, movimientos, tareas ni otra tabla de negocio; aun así no son DDL. La inicialización y la invalidación no se omiten para conseguir un despliegue. El motor falla cerrado si falta instalación o cualquiera de los 54 triggers. Los SQL históricos se conservan; no se reescriben porque otro colaborador podría haberlos aplicado en su entorno.

`npm run verify:hosting` es un **gate previo a publicar**, distinto de build/CI/verify:independent. Analiza las migraciones versionadas sin ejecutarlas y devuelve `blocked_non_schema_migrations`, con salida 1 y 21 instrucciones fuera de esquema. El CI prueba el clasificador y el contrato local; ese CI verde no equivale a un despliegue admisible. El gate no es un validador SQL completo ni una prueba del backend: incluso schema_only_candidate mantiene backendVerified=false.

Esto es una incompatibilidad con el flujo documentado, **no un error de despliegue observado ni una afirmación de que el backend necesariamente rechace ese SQL**. No se envió el artefacto para probarlo ignorando la instrucción. Las herramientas Sites disponibles solo inspeccionan tablas/filas: no ofrecen una operación administrativa de SQL o migración fuera del flujo de publicación. No se inventa esa capacidad ni se sustituye por SQL MCP, un endpoint de mantenimiento o DDL durante requests.

## Reanudación segura

1. Conservar/reutilizar el project_id privado ya creado; está en el checkout ignorado de desarrollo indicado en DEVELOPMENT_PROGRESS. No repetir create_site ni usar el Site personal. El artefacto basal anterior a la corrección de dependencias tampoco debe publicarse.
2. Obtener un mecanismo oficial y revisable para bootstrap/mantenimiento de metadatos **fuera** de las migraciones de esquema, y confirmación del soporte de triggers. Inspeccionar su funcionamiento real antes de redactar pasos de ejecución.
3. Preparar en un PR la separación/compatibilidad para instalaciones nuevas y existentes, con trazabilidad de SQL ya aplicado y recuperación ante publicación parcial. Conservar todas las garantías y probar D1 local + Worker de nuevo. No mover silenciosamente INSERT/DELETE a lecturas ni eliminar triggers. No marcar migraciones aplicadas sin haberlas ejecutado.
4. Repetir verify:hosting sobre el candidato admitido, auditorías y suite; usar el helper oficial de Sites para publicar el artefacto exacto del commit corregido. Registrar IDs/versiones privadamente y comprobar catálogo/aislamiento antes de UAT-3-HUMAN.

## Borrador de consulta al responsable de plataforma / soporte

No enviado. Completar identificadores **solo por el canal privado de soporte**, sin tokens, datos, respaldos ni credenciales.

> Estamos preparando un Site privado nuevo con D1 propia y un MCP cuyo executor de negocio permanece deshabilitado. El código público requiere esquema aditivo, 54 triggers de revisión para detectar cambios desde UI, una fila de identificación de instalación y una invalidación/limpieza de metadatos al actualizar. Todas las migraciones y atomicidad están probadas en D1/workerd local. La guía de Sites indica migraciones solo de esquema y backfills/seed fuera de ellas. ¿Cuál es el mecanismo administrativo oficial para ejecutar y registrar ese bootstrap/mantenimiento fuera de las migraciones de publicación? ¿Se admiten CREATE TRIGGER y CHECK, cómo se comprueba el estado efectivo y cómo se reanuda un despliegue con migraciones parcialmente aplicadas? Necesitamos pasos verificables para una instalación nueva y para upgrades, además de los límites D1 efectivos. No solicitamos SQL accesible al modelo, desactivar protecciones ni modificar instalaciones ajenas. Podemos aportar por canal privado el proyecto nuevo y por enlace público los archivos SQL 0008/0010 y pruebas, sin información personal.
