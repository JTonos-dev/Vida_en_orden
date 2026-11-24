# Vida en Orden — mapa de entidades para MCP

```mermaid
erDiagram
  OWNER ||--|| FINANCE_SETTINGS : configures
  OWNER ||--o{ FINANCE_ACCOUNT : owns
  OWNER ||--o{ FINANCE_CATEGORY : owns
  OWNER ||--o{ FINANCE_TRANSACTION : records
  OWNER ||--o{ FINANCE_BUDGET : assigns
  OWNER ||--o{ FINANCE_OBLIGATION : schedules
  OWNER ||--o{ FINANCE_GOAL : plans
  OWNER ||--o{ CALENDAR_EVENT : schedules
  OWNER ||--o{ AUDIT_LOG : produces

  FINANCE_ACCOUNT ||--o{ FINANCE_TRANSACTION : source
  FINANCE_ACCOUNT ||--o{ FINANCE_TRANSACTION : destination
  FINANCE_CATEGORY ||--o{ FINANCE_TRANSACTION : categorizes
  FINANCE_CATEGORY ||--o{ FINANCE_BUDGET : groups
  FINANCE_CATEGORY ||--o{ FINANCE_OBLIGATION : groups
  FINANCE_CATEGORY ||--o{ FINANCE_GOAL : groups
  FINANCE_OBLIGATION ||--o{ OBLIGATION_OCCURRENCE : creates
  OBLIGATION_OCCURRENCE ||--o| FINANCE_TRANSACTION : paid_by
  FINANCE_GOAL ||--o{ GOAL_ENTRY : receives
  FINANCE_GOAL ||--o{ FINANCE_TRANSACTION : reserve_consumed_by

  SHARED_SCOPE ||--o{ AREA : contains
  AREA ||--o{ PROJECT : contains
  PROJECT ||--o{ CALENDAR_EVENT : contextualizes
  PROJECT ||--o{ TASK : contextualizes
  TASK ||--o{ TASK : parent_of
  TASK ||--o{ HOME_NOTE : documents
  TASK ||--o{ HOME_MOVEMENT : estimates_or_tracks
  TASK ||--o{ FINANCE_TRANSACTION : linked_real_spend
```

## Tablas reales

| Grupo | Tablas |
|---|---|
| Trabajo | `home_workspaces`, `home_tasks`, `home_notes`, `home_movements` |
| Organización | `home_areas`, `home_projects` |
| Tiempo | `calendar_events` |
| Finanzas | `finance_accounts`, `finance_categories`, `finance_concepts`, `finance_transactions` |
| Presupuesto | `finance_budgets` |
| Obligaciones | `finance_obligations`, `finance_obligation_occurrences` |
| Metas | `finance_goals`, `finance_goal_entries` |
| Control | `finance_settings`, `audit_log` |

Las relaciones se representan principalmente mediante IDs y validaciones en servicios. El esquema SQL auditado no declara claves foráneas para proteger esos vínculos a nivel de base de datos; el motor de propuestas MCP deberá validar cada referencia antes de aprobar y volver a validarla al ejecutar.

## Alcances

- `owner_id`: finanzas, eventos, metas, obligaciones, presupuestos, cuentas, categorías, conceptos y auditoría.
- `scope_id = casa-en-orden-shared`: áreas, proyectos y tareas heredadas compartidas.
- Tarea/proyecto pueden ser vínculos de una transacción financiera; ese vínculo no convierte la transacción en dato compartido.
