# Matriz de paridad MCP — estado transferido

Esta matriz describe el código del repositorio, no datos ni permisos de una instalación concreta. `Implementado` significa que existe código y prueba correspondiente. Cada instalación debe repetir la validación de conexión con sus propios datos.

| Módulo | Herramientas | Estado | Evidencia principal |
|---|---|---|---|
| Descubrimiento e identidad | `get_capabilities`, `get_my_profile` | Implementado | `lib/mcp/server.ts`, `tests/mcp-auth.test.ts`, `tests/mcp-server.test.ts` |
| Tareas | `search_tasks`, `get_task`, `list_task_relations` | Implementado | `lib/mcp/read-service.ts`, `tests/mcp-phase2.test.ts` |
| Áreas | `list_areas`, `get_area` | Implementado | `lib/mcp/read-service.ts` |
| Proyectos | `list_projects`, `get_project` | Implementado | `lib/mcp/read-service.ts` |
| Planificación | `list_calendar_events`, `get_calendar_event`, `get_agenda` | Implementado | `lib/mcp/read-service.ts`, pruebas MCP |
| Cuentas | `list_accounts`, `get_account` | Implementado | `lib/mcp/read-service.ts`, pruebas MCP |
| Catálogos financieros | `list_categories`, `list_concepts` | Implementado | `lib/mcp/read-service.ts` |
| Movimientos | `search_transactions`, `get_transaction` | Implementado | `lib/mcp/read-service.ts`, filtros financieros |
| Presupuesto | `get_budget`, `list_budget_allocations` | Implementado | `lib/mcp/read-service.ts`, `lib/finance-math.ts` |
| Obligaciones | `list_obligations`, `get_obligation`, `list_obligation_occurrences` | Implementado | `lib/mcp/read-service.ts` |
| Metas | `list_goals`, `get_goal`, `list_goal_entries` | Implementado | `lib/mcp/read-service.ts` |
| Reportes | `get_finance_report` | Implementado | `lib/mcp/read-service.ts`, pruebas financieras |
| Auditoría | `list_audit_log` | Implementado | `lib/mcp/read-service.ts` |
| Configuración | `get_configuration` | Implementado | `lib/mcp/read-service.ts` |
| Integridad | `validate_references` | Implementado | `lib/mcp/read-service.ts`, `tests/mcp-phase2.test.ts` |
| Búsqueda transversal | `search_all` | Implementado | `lib/mcp/read-service.ts`, pruebas MCP |

## Compatibilidad de las nueve herramientas iniciales

Se conservan los nombres y contratos de:

`get_capabilities`, `get_my_profile`, `search_tasks`, `get_task`, `list_accounts`, `get_budget`, `list_obligations`, `list_goals` y `search_all`.

Las ampliaciones de Fase 2 agregan filtros o relaciones sin convertirlas en herramientas de escritura.

## Reglas transversales

- Página predeterminada: 20 registros.
- Página máxima general: 50 registros.
- Los cursores son opacos, limitados y validados por servidor.
- Las búsquedas de texto están limitadas a 200 caracteres.
- `search_all` limita resultados por tipo.
- Los detalles acotan sus relaciones y devuelven `nextCursor` cuando existen más registros.
- Las respuestas financieras usan enteros de centavos (`*_minor`) y reutilizan los cálculos de la interfaz.
- `validate_references` diagnostica; nunca repara automáticamente.

## Fuera de paridad deliberadamente

No están implementados como herramientas MCP: `create`, `update`, `delete`, `void`, `restore`, `prepare_change_plan`, `request_approval`, `commit_approved_change_plan` ni `execute_sql`. Las escrituras de la interfaz no implican que el MCP pueda escribir.

## Desarrollo aislado de fase 3

`lib/mcp/plans/engine.ts` implementa preparación, revisión, cancelación, aprobación, ejecución atómica y consulta de recibos. Aún no hay herramientas nuevas expuestas ni adaptadores de negocio publicados. La verificación WebAuthn usa claves administrativas fijadas, sin inscripción desde el modelo. Producción conserva 31 lecturas.

## Catálogo no financiero en desarrollo (fase 4)

19 acciones internas, probadas en una D1 simulada con SQLite real; aún no expuestas en el catálogo de producción:

| Dominio | Acciones |
|---|---|
| Tareas y subtareas | task.create (parentId), task.update (padre, fechas, dependencias, prioridad), task.duplicate, task.archive (y desarchivar), task.complete (y reabrir), task.delete, task.reorder, task.context |
| Bitácora | journal.create, journal.update, journal.delete |
| Organización | area.create/update, project.create/update (estado active/paused/completed) |
| Calendario | event.create/update/cancel (recurrencia incluida) |
| Planificación | fechas/horas de task.update/context, workspace.update |

Reversión: `prepareReversal` calcula una nueva propuesta desde un recibo de fase 4 sin cambios posteriores. No acepta tablas/patches del llamador, no restaura backups, conserva auditoría y exige aprobación nueva. Las finanzas se anulan/compensan con sus servicios específicos.

Sin soporte en la aplicación actual: eliminar/archivar áreas; eliminar proyectos; agenda como entidad CRUD independiente. No se inventan acciones equivalentes ni se declaran implementadas. Archivar tareas y pausar/completar proyectos son operaciones disponibles.
