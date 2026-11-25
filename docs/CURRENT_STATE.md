# Estado actual reproducible

**Corte del código transferido:** 24 de noviembre de 2026  
**Estado de este repositorio:** fuente de fase 2 operativa; historial público con exposición pendiente de retirada. La punta de `main` de GitHub es la referencia exacta del código integrado; una rama o candidato local no es una sustitución remota aplicada.

## Aplicación

- React/Vinext sobre Cloudflare Workers.
- D1 mediante el binding `DB` y Drizzle ORM.
- Migraciones `drizzle/0000` a `drizzle/0008` en la rama de desarrollo; main conserva la versión integrada.
- Interfaz persistente para tareas, subtareas, bitácora, calendario, áreas, proyectos, cuentas, movimientos, presupuestos, obligaciones, metas y configuración financiera.
- `/api/state` sirve lecturas de la interfaz.
- `/api/action` conserva las escrituras normales de la interfaz; no forma parte del router MCP.
- No se incluye ninguna base de datos, respaldo, log o fixture de la instalación original.

La revisión de una instalación nueva encontró fixtures incrustados en el bootstrap de tareas y una clasificación automática ligada a la instalación de origen. La copia propuesta elimina ambos del runtime: una primera escritura crea únicamente la tarea solicitada y no genera proyectos heredados. El historial público previo no se reescribe. Ver `INDEPENDENT_INSTALLATION_VALIDATION.md`.

## MCP verificado en el origen

El estado transferido implementa el servidor MCP en `POST /mcp` con protocolo `2026-07-28`:

- 31 herramientas declaradas por `get_capabilities`.
- Todas las herramientas tienen anotaciones de solo lectura.
- `MCP_BUSINESS_WRITES_ENABLED` permanece fijado en `false`.
- La autorización se basa en la identidad autenticada por Sites y en `MCP_OWNER_EMAIL`/`MCP_OWNER_USER_ID` configurados por instalación.
- Los alcances compartidos y privados están separados en `lib/data-scopes.ts` y en `lib/mcp/read-service.ts`.
- Las consultas son tipadas, acotadas, paginadas y no aceptan SQL del llamador.
- El servidor MCP no llama a `/api/action`, no ejecuta migraciones y no inicializa datos durante una lectura.

## Herramientas actuales

`get_capabilities`, `get_my_profile`, `search_tasks`, `get_task`, `list_task_relations`, `list_areas`, `get_area`, `list_projects`, `get_project`, `list_calendar_events`, `get_calendar_event`, `get_agenda`, `list_accounts`, `get_account`, `list_categories`, `list_concepts`, `search_transactions`, `get_transaction`, `get_budget`, `list_budget_allocations`, `list_obligations`, `get_obligation`, `list_obligation_occurrences`, `list_goals`, `get_goal`, `list_goal_entries`, `get_finance_report`, `list_audit_log`, `get_configuration`, `validate_references` y `search_all`.

## Pruebas recuperadas

La fuente de origen pasó antes de la transferencia:

- `npm run test:mcp`.
- `npm run test:finance`.
- `npx tsc --noEmit`.
- `npm run lint` sin errores de salida; existen advertencias no bloqueantes preexistentes de componentes.
- `npm run build`.
- `npm run verify:independent` aplica las ocho migraciones en una D1 local temporal y comprueba una consulta de humo sin usar la instalación original.

La validación local cubre catálogo, identidad, lecturas, paginación e integridad referencial. Una validación de producción pertenece a cada instalación y no se registra aquí con datos, saldos, correos, URLs o hashes de respaldos.

`tests/mcp-installation.test.ts`, incluido en `test:mcp`, ejecuta las 31 herramientas contra SQLite real con las ocho migraciones, tanto vacío como con fixtures sintéticos. Comprueba ausencia de cambios, dos bases separadas con IDs coincidentes, paginación y denegaciones 401/403/503. Esta prueba no sustituye la conexión al plugin ni la ejecución sobre D1 alojada.

La instalación independiente de validación también ejecutó las 31 herramientas mediante su propio plugin contra una D1 nueva: 22 lecturas válidas y nueve `not_found` esperados en detalles de una base vacía. Las 18 tablas permanecieron vacías y la validación referencial informó cero incidencias. Los detalles positivos y la paginación con registros están cubiertos localmente con datos ficticios. La publicación de esa instancia no fusiona esta propuesta ni habilita otra fase.

## Límites conocidos

- PR #3 aprobado y fusionado, con CI satisfactorio del PR y del merge. La fuente posterior elimina el bootstrap particular; el historial, los diffs y las copias de la red anterior no están purgados.
- La auditoría encontró también valores particulares dentro del verificador. Esta propuesta los sustituye por reglas genéricas y pruebas de regresión. El candidato local y el ensayo de filtrado no se han publicado como historia nueva. Ver `HISTORY_SANITIZATION_PLAN.md`.
- El mandato vigente autoriza desarrollar las fases 3–7 sin continuar el reemplazo histórico. La fase 3 dispone de motor aislado, staging, huella, WebAuthn con claves fijadas, caducidad, guardas de concurrencia y recibos idempotentes. Todavía no está expuesto por MCP ni verificado con interacción humana real. Ver `DEVELOPMENT_PROGRESS.md`.

- La configuración de audiencia y los secretos de Sites no son portables por Git y deben recrearse manualmente en cada instalación.
- El Site no ofrece una importación automática de una instalación de otra cuenta.
- Las herramientas nuevas deben validarse individualmente después de conectar el plugin de una nueva instalación; el catálogo por sí solo no prueba una integración end-to-end.
- Las escrituras reales MCP permanecen deshabilitadas; los componentes aislados no habilitan ejecución por sí mismos.
- El esquema SQL no usa claves foráneas para todas las relaciones; el código valida referencias y `validate_references` informa inconsistencias sin repararlas.
- La consulta actual de rulesets muestra PR obligatorio, bloqueo de borrado/force-push y check `verify` requerido. Permite cero aprobaciones y no exige que el check esté actualizado con la base. La cuenta ejecutora tiene lectura sobre el oficial, sin administración ni push. Ver `docs/COLLABORATION.md`.

## Entrega no financiera en rama dependiente

19 adaptadores cerrados reutilizan los servicios. Incluyen tareas/subtareas, bitácora, organización y eventos; reversión específica derivada de recibos con nueva aprobación. No hay herramientas públicas nuevas ni escrituras reales habilitadas. Ver paridad y seguimiento.

## Entrega financiera aislada

24 adaptadores R2 implementados; pruebas específicas de contabilidad, reservas, reversión, concurrencia y rollback. El reporte financiero neto incluye ahora comisiones de transferencias propias. No se cambia la política de ejecución MCP ni se toca una base personal. Ver seguimiento para verificaciones y PR.

## Propuestas opcionales y canal humano en desarrollo

La nueva rama incorpora opt-in MCP_PROPOSALS_ENABLED de diez herramientas de metadatos (41 con las lecturas), página de revisión, API owner-only/origen/CSRF y verificación WebAuthn. El alta solo devuelve candidatos; la confianza se configura por administración fuera del modelo. Requiere 0009 además de 0008. La compuerta real permanece cerrada en dos capas y falta prueba humana alojada. Ver HUMAN_APPROVAL_SETUP.md.

## Endurecimiento en rama dependiente

0010 agrega evidencia durable, idempotencia de preparación, leases y métricas sin datos de contenido; invalida planes anteriores al upgrade y limpia sus copias de staging, sin tocar negocio. Parsers/límites de stream, parches que conservan campos omitidos, efectos por acción e impacto financiero firmado. Con ambos flags hay 44 herramientas; por defecto siguen 31 lecturas. Ver MCP_HARDENING.md para límites, capacidades no verificadas y migración.
