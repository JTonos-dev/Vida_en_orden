# Modelo de datos

| Dominio | Tablas | Fuente derivada |
| --- | --- | --- |
| Tareas | `home_tasks`, `home_notes`, `home_movements` | avance, vencidas, estimado, bitácora |
| Contexto | `home_areas`, `home_projects` | avance y gasto del proyecto |
| Tiempo | `calendar_events` | agenda y recurrencias |
| Cuentas | `finance_accounts` | saldo actual por movimientos confirmados |
| Movimientos | `finance_transactions`, `finance_categories` | ingresos, gastos, transferencias, gasto por vínculo |
| Presupuesto | `finance_budgets` | base, adicionales por concepto, obligaciones, metas, gasto y restante por mes/categoría |
| Obligaciones | `finance_obligations`, `finance_obligation_occurrences` | próximos compromisos y flujo proyectado |
| Metas | `finance_goals`, `finance_goal_entries` | reserva disponible, importe utilizado, aportes activos/revertidos y progreso financiero |
| Control | `finance_settings`, `audit_log` | colchón, zona horaria e historial crítico |

## Semántica de fechas de tarea

- `start_date`: comienzo del intervalo de trabajo.
- `scheduled_date`: **fecha para hacerla**, es decir, día concreto de ejecución.
- `scheduled_start_time` / `scheduled_end_time`: horario opcional de esa ejecución.
- `due_date`: fecha límite.
- `completed_at`: fecha real elegida por el usuario, nunca futura ni anterior a la creación.

## Semántica monetaria

Los campos nuevos terminados en `_minor` contienen centavos de DOP. `estimate` y los históricos `actual`/`home_movements` se preservan en pesos por compatibilidad, pero no alimentan el nuevo gasto confirmado.

- `finance_budgets.allocation_type`: `base` se solapa con obligaciones; `additional` siempre amplía la partida.
- `finance_budgets.concept`: identifica la razón concreta de cada asignación.
- `finance_goal_entries.voided_at`: conserva la trazabilidad de aportes revertidos.
- `finance_goals.used_minor`: reserva ya convertida en gasto real.
- `finance_transactions.goal_reservation_consumed_minor`: importe de reserva sustituido por el gasto.
- `finance_transactions.payment_method`, `counterparty_bank`, `transfer_mode` y `fee_minor`: describen el pago por transferencia y su comisión calculada.

