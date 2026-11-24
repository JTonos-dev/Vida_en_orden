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

## Catálogo financiero aislado (fase 5)

| Dominio | Acciones soportadas |
|---|---|
| Cuentas | finance.account.create/update/archive (solo saldo cero) |
| Categorías | finance.category.create/update/delete (sin referencias) |
| Movimientos | finance.transaction.create (income/expense/transfer/adjustment), update_amount, void |
| Presupuesto | finance.budget.set/update/addition.create/delete |
| Obligaciones/ingresos previstos | finance.obligation.create/update/pay; frecuencia once/weekly/monthly/yearly, reserva y ocurrencias calculadas por el servicio |
| Metas | finance.goal.create/update/contribute, finance.goal.entry.update/revert |
| Configuración | finance.settings.update (zona, colchón y comisiones) |
| Gasto legado de tarea | task.movement.create/delete, separado del libro financiero V2 |

24 acciones R2; montos enteros de centavos limitados a 10^12 (movimiento legado convierte a unidades del servicio). Las transferencias propias solo afectan el neto por sus comisiones. La anulación/reducción/aporte reutiliza restitución de reservas y auditoría de dominio; no se permite rollback genérico de filas financieras.

**Sin soporte actual:** transaction.split/reconcile, edición independiente de enlaces de un movimiento existente, CRUD de conceptos, archivo de obligaciones/metas, calendario de aportes, reasignación genérica de reservas, currency distinta de DOP e importaciones/restauraciones. No se declaran implementadas. Los vínculos tarea/proyecto/meta existen al crear la operación y sus validaciones siguen activas. No se agrega infraestructura bancaria real.

## Transporte de propuestas opt-in (fase 3B)

Diez herramientas nuevas solo al configurar explícitamente propuestas en la instancia de desarrollo: prepare_change_plan, revise_change_plan, cancel_change_plan, get_pending_proposal, list_my_pending_proposals, request_approval, get_approval_status, commit_approved_change_plan, get_execution_result y prepare_non_financial_reversal. Las de metadatos mutables no se anuncian como readOnly; las 31 anteriores conservan readOnlyHint=true. No hay herramienta approve/enroll/execute_sql ni ruta de ejecución alternativa. commit siempre se deniega en esta entrega. El canal humano es página HTTPS con WebAuthn, separado de MCP.

## Fase 6: componentes implementados

- Propuestas: idempotencia de preparación, expected_revision, salud, leases, evidencia durable, revalidación de credenciales, verificación posterior y efectos por acción/impacto financiero ligado a huella.
- `inspect_attachment_context`: texto/CSV/recibo JSON acotados como datos no confiables; no obtiene binarios, ejecuta fórmulas ni hace OCR.
- `get_financial_integrity_report`: compara vistas privadas del libro, compromisos y flujos; detecta carreras/límites, no concilia con bancos.
- Los updates V2 omiten sin borrar campos existentes; las búsquedas literales mantienen 200 caracteres sin patrones LIKE largos.
- Catálogo: 31 sin flags; 33 solo ampliaciones; 42 solo propuestas; 44 con ambos. No se anuncian binarios, OCR, SQL, alta de confianza ni escrituras de negocio habilitadas.

Siguen pendientes aceptación humana alojada, cuota/desempeño real y funcionalidades del plan maestro que la aplicación aún no soporta, enumeradas arriba. Implementación aislada no equivale a paridad funcional aceptada en producción.
