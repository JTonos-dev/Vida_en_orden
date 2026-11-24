# Vida en Orden MCP — Fase 2

**Estado:** implementada en el código transferido; su publicación depende de cada instalación.  
**Alcance:** paridad de lecturas, sin efectos secundarios y sin escrituras MCP.

## Resultado

La implementación amplía las nueve herramientas iniciales hasta un catálogo de 31 herramientas. Reutiliza `lib/home-server.ts`, `lib/v2-server.ts`, `lib/finance-math.ts` y el modelo D1 existente; no crea un segundo motor financiero.

La fase incluye:

- búsquedas y filtros avanzados de tareas y movimientos;
- detalles y relaciones entre tareas, áreas, proyectos, eventos y movimientos;
- agenda combinada de tareas y eventos;
- cuentas y saldos a fecha de corte;
- categorías y conceptos;
- presupuestos y asignaciones por concepto;
- obligaciones, ocurrencias e ingresos previstos;
- metas y aportes históricos;
- reportes financieros agregados;
- auditoría, configuración y validación de referencias;
- paginación explícita mediante `nextCursor`.

## Seguridad

- El endpoint es `POST /mcp` y permanece separado de `/api/action`.
- Sites autentica la visita; el servidor compara la identidad con la política owner-only configurada en cada instalación.
- `MCP_BUSINESS_WRITES_ENABLED` está fijado a `false`.
- Ninguna herramienta puede crear, editar, eliminar, anular, restaurar, migrar o aprobar información.
- Las herramientas aceptan schemas cerrados y no permiten `userId`, SQL, nombres de tablas ni filtros arbitrarios para elegir el alcance.
- Las lecturas privadas filtran por el propietario autenticado; tareas, áreas y proyectos conservan el alcance compartido definido por la aplicación.
- Los límites de página, texto, cuerpo y expansión protegen el rendimiento y evitan truncamientos silenciosos.

## Catálogo

Las definiciones completas están en `lib/mcp/server.ts` y las consultas en `lib/mcp/read-service.ts`.

```text
get_capabilities
get_my_profile
search_tasks
get_task
list_task_relations
list_areas
get_area
list_projects
get_project
list_calendar_events
get_calendar_event
get_agenda
list_accounts
get_account
list_categories
list_concepts
search_transactions
get_transaction
get_budget
list_budget_allocations
list_obligations
get_obligation
list_obligation_occurrences
list_goals
get_goal
list_goal_entries
get_finance_report
list_audit_log
get_configuration
validate_references
search_all
```

## Pruebas de la implementación

El estado recuperado pasó las pruebas MCP y financieras, TypeScript, lint y build antes de la transferencia. Las pruebas específicas cubren identidad, scopes, schemas cerrados, protocolo moderno, consultas `SELECT`, paginación y ausencia de efectos secundarios.

La validación automatizada del código confirma el catálogo, la política de solo lectura, los límites y la paginación. La validación de una instalación publicada debe ejecutarse con sus propias credenciales y no debe exportar sus datos a este repositorio.

## Limitaciones honestas

- Una nueva instalación debe validar individualmente las herramientas desde su propio plugin; el catálogo publicado no equivale por sí solo a una prueba end-to-end.
- La comparación visual depende de la sesión autenticada de cada Site.
- La fase 2 no implementa propuestas ni escrituras. No debe interpretarse como autorización para iniciar la fase 3.
