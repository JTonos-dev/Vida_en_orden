# Estado actual reproducible

Corte: 24 de noviembre de 2026. Este documento describe la rama propuesta de fases 3–7; no una versión desplegada. El oficial y el fork actual siguen siendo las únicas fuentes de desarrollo. La exposición histórica pública **no está resuelta**; su sustitución está suspendida por el responsable y no bloquea estas entregas.

## Código integrado e instalación existente

`main` oficial integra PR #3 (`317cfd8`), con 31 herramientas MCP de lectura. PR #4 y las entregas siguientes están pendientes de revisión/integración. No se ha fusionado, desplegado ni migrado ninguna instalación personal durante este desarrollo. Una comprobación de solo lectura de la instancia independiente confirmó fase 2, 31 herramientas, businessWritesEnabled=false y cero incidencias referenciales.

La UI conserva `/api/action`; MCP nunca llama a ese endpoint. Los datos de tareas/áreas/proyectos mantienen el scope compartido original y finanzas/eventos el scope privado autenticado. Cada Site tiene D1, propietario, secretos y configuración propios.

## Rama propuesta

- React/Vinext, Worker Cloudflare, D1 `DB` y Drizzle. Servicios de dominio compartidos mediante contexto de request; no hay segundo motor financiero.
- Motor de propuestas: staging particionado, acciones cerradas, diff por acción y final, impacto financiero, SHA-256, expiración, propietario autenticado, revisión, idempotencia y guardas atómicas de concurrencia. Ejecución/recibo/auditoría y reversión no financiera probados en aislamiento.
- Aprobación web: origen HTTPS exacto, owner-only, CSRF y WebAuthn con presencia/verificación de usuario. La inscripción entrega candidatos, nunca confianza automática. Credenciales fijadas administrativamente; el modelo no puede aprobar ni inscribir claves de confianza.
- 19 acciones no financieras y 24 financieras reutilizan los servicios existentes. Catálogo detallado y excepciones en [MCP_PARITY_MATRIX.md](MCP_PARITY_MATRIX.md).
- Endurecimiento: JSON acotado, presupuestos de consulta, idempotencia de preparación, leases/limpieza de staging vencido, evidencia durable, revocación, verificación posterior, adjuntos texto/CSV/JSON no confiables e informe interno de integridad.
- Migraciones SQL 0000–0010, 48 tablas y 54 triggers de revisión. 0008/0009 son aditivas; 0010 invalida metadatos de propuestas antiguas y limpia staging, sin cambiar negocio. No aplicarlas a producción sin el procedimiento de [UPGRADE_AND_ROLLBACK.md](UPGRADE_AND_ROLLBACK.md).

## Superficie MCP y compuerta

| Configuración privada | Herramientas | Efectos permitidos |
|---|---:|---|
| Sin flags | 31 | Lectura; sin inicialización ni mantenimiento |
| Solo MCP_EXTENDED_READS_ENABLED | 33 | Lectura; adjuntos/informe adicionales |
| Solo MCP_PROPOSALS_ENABLED | 42 | Lecturas y metadatos/staging de propuestas |
| Ambos flags | 44 | Ambas superficies anteriores |

Las 31 herramientas anteriores conservan nombre, contrato y readOnlyHint=true/destructiveHint=false. Las herramientas que modifican metadatos tienen anotaciones acordes. `businessWritesEnabled=false` está fijado en código en fábrica y transporte; incluso una propuesta APPROVED devuelve `writes_disabled`. No existe herramienta approve/enroll/SQL, ni `confirmed: true` que sustituya la autorización.

## Evidencia y límites

Las pruebas versionadas incluyen SQLite con todas las migraciones, D1 local real mediante workerd, rollback forzado de recibo, carreras/idempotencia, aislamiento, WebAuthn sintético, contrato de las 31 lecturas, equivalencia ORM/SQL y upgrade. La verificación del Worker compilado usa HTTPS loopback, base temporal, firmas sintéticas y 27 comprobaciones de la interfaz. Nunca utiliza datos, claves ni bases de otra instalación.

Resultados finales, PR y continuidad: [DEVELOPMENT_PROGRESS.md](DEVELOPMENT_PROGRESS.md) e [IMPLEMENTATION_REPORT.md](IMPLEMENTATION_REPORT.md). Aceptación personal progresiva: [USER_ACCEPTANCE_TESTS.md](USER_ACCEPTANCE_TESTS.md). No convertir pruebas sintéticas en certificación de interacción humana, autenticador físico o cuotas del host.

Pendientes externos: revisión del mantenedor, integración ordenada, instalación alojada de desarrollo, aprobación humana real y aceptación funcional. Binarios/OCR, conexión bancaria, importación/restauración MCP y operaciones inexistentes en la aplicación no se declaran implementadas. La retención de propuestas/evidencia y la carga máxima alojada requieren política/validación operativa; no se borra evidencia por mantenimiento ordinario.

El cierre encontró dependencias vulnerables en la base anterior: la corrección dependiente actual obtiene cero alertas npm y supera las pruebas del runtime actualizado; ver DEPENDENCY_SECURITY.md. No se actualizó ninguna instalación existente. El Site nuevo de desarrollo sigue privado y sin publicar; aprovisionamiento D1 alojado y aprobación humana no están verificados. verify:hosting está bloqueado por 21 instrucciones de metadatos fuera del flujo de migración de esquema documentado, no por un rechazo observado del backend. Ver SITES_MIGRATION_COMPATIBILITY.md para el diagnóstico y consulta preparada; no se ignora ese gate para publicar.

Las reglas efectivas consultadas exigen PR/check verify y bloquean force-push/eliminación de main, pero admiten cero aprobaciones y no exigen check actualizado con base. La cuenta ejecutora solo lee el oficial y publica en su fork. Se mantiene revisión humana del mantenedor por procedimiento; no se eluden protecciones.
