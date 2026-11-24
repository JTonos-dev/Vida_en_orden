# Estado actual reproducible

**Corte del código transferido:** 24 de noviembre de 2026  
**Estado de este repositorio:** snapshot público saneado; la punta de `main` de GitHub es la referencia exacta del árbol publicado.

## Aplicación

- React/Vinext sobre Cloudflare Workers.
- D1 mediante el binding `DB` y Drizzle ORM.
- Migraciones `drizzle/0000` a `drizzle/0007`.
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

## Límites conocidos

- La configuración de audiencia y los secretos de Sites no son portables por Git y deben recrearse manualmente en cada instalación.
- El Site no ofrece una importación automática de una instalación de otra cuenta.
- Las herramientas nuevas deben validarse individualmente después de conectar el plugin de una nueva instalación; el catálogo por sí solo no prueba una integración end-to-end.
- La fase de escrituras MCP no está implementada. Los contratos futuros en `lib/mcp/future-contracts.ts` no habilitan herramientas.
- El esquema SQL no usa claves foráneas para todas las relaciones; el código valida referencias y `validate_references` informa inconsistencias sin repararlas.
- La consulta pública de rulesets del 24 de noviembre de 2026 mostró una regla activa que exige PR y bloquea borrado y force-push. No incluye un required status check ni una revisión humana obligatoria. La protección clásica no pudo consultarse con la sesión disponible. Ver `docs/COLLABORATION.md`.
