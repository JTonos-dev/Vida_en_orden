# Plan de pruebas

## Automatizables

### MCP Fase 1

- Identidad ausente, viewer no autorizado y política owner-only.
- Rechazo de identidad o propiedades inesperadas en argumentos.
- Descubrimiento MCP y catálogo exclusivamente read-only.
- Consultas SQL MCP limitadas a `SELECT` y siempre filtradas por owner en dominios privados.
- Lecturas sin modificación de workspaces, tareas, áreas, categorías, settings o auditoría.
- Build con ruta `/mcp`, `/api/state` y página principal operativas.

- Compilación y lint sin errores.
- Migración aditiva sobre la base existente.
- Creación de tarea y subtarea recursiva.
- Validación del intervalo inicio → fecha para hacerla → límite.
- Bloqueo de completar una madre con subtareas pendientes y propagación al completar las hijas.
- Creación, edición, recurrencia y cancelación de eventos.
- Transferencia con total patrimonial invariable.
- Ingreso futuro excluido del saldo actual e incluido en proyección.
- Gasto vinculado reflejado una sola vez en tarea y proyecto.
- Presupuesto mensual consumido sólo por gastos del mismo mes.
- Reserva de meta sin crear gasto.
- Aporte a meta que amplía el presupuesto sin reducir la asignación previa.
- Edición/reducción de aportes y bloqueo de reducciones sobre dinero ya utilizado.
- Gasto vinculado que consume la reserva de meta y anulación que la restaura.
- Gasto pagado por transferencia que descuenta importe y comisión de la cuenta.
- Adicional presupuestario por concepto, editable y eliminable desde el detalle de la partida.
- Pago de obligación y creación del siguiente vencimiento.
- Exportación CSV y respaldo JSON.
- Restauración que recalcula saldos y conserva jerarquía/vínculos.
- Rechazo de referencias a registros ajenos o inexistentes.

El script `scripts/qa-v2.mjs` modifica datos y restaura el estado previo al finalizar. Solo admite una vista loopback aislada mediante `QA_BASE_URL` y rechaza redirecciones. `verify:worker` lo ejecuta automáticamente sobre una D1 temporal; nunca apuntarlo a una instalación personal o remota.

## Integración de fases 3–7

`test:mcp` incluye motor/staging, verificación WebAuthn, catálogo de 43 acciones, carreras, idempotencia, evidencias, atomicidad/rollback, denegaciones, límites, migraciones y aislamiento. `mcp-d1-runtime.test.ts` comprueba un batch real de D1 local mediante workerd. `verify:schema` exige equivalencia Drizzle sin generar SQL en el repositorio.

`verify:worker` usa el build real y HTTPS loopback: ejecuta las 31 lecturas, prepara y aprueba mediante criptografía sintética dentro del Worker, deniega CSRF, comprueba que la siguiente solicitud por conexión persistente funciona, verifica alta no confiable/anti-framing y ejecución MCP cerrada. Continúa con 27 verificaciones de API/UI en la misma D1 ficticia. Todo se elimina al acabar. No prueba el control físico del autenticador, navegación visual ni la identidad del host: esos casos están en USER_ACCEPTANCE_TESTS.md.

## QA visual histórico de la aplicación transferida

La lista siguiente conserva evidencia de la aplicación original. No certifica la nueva pantalla de aprobación ni una revisión visual nueva en esta sesión.

- Escritorio: resumen, tareas, planificación, proyectos, finanzas y configuración.
- Buscador letra por letra con foco persistente.
- Un solo modal durante edición/alta y retorno al detalle original.
- Navegación madre → subtarea → atrás sin abrir modales apilados.
- Persistencia visible de fecha, horario, completado, gasto vinculado y reservas.
- Detalle de presupuesto dentro del mismo panel, separado entre conceptos presupuestados y gastos reportados.
- Hint exacto “Después de ingresos”.
- Flujo completo gasto → transferencia → meta → consumo de reserva comprobado en una base local aislada.
- Estados vacíos, mensajes de error, confirmaciones y diseño adaptable.

