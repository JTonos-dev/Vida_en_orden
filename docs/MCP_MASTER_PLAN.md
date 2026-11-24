# VIDA EN ORDEN — PLAN MAESTRO DE INTEGRACIÓN MCP

**Versión del documento:** 1.0  
**Fecha:** 22 de noviembre de 2026  
**Destino:** Codex / equipo de desarrollo del ChatGPT Site *Vida en Orden* (antes *Casa en Orden*)  
**Site de referencia:** cada instalación configura su propio dominio de ChatGPT Sites; no se publica aquí ningún dominio privado.  
**Estado:** especificación de producto, seguridad y arquitectura; **no** constituye auditoría del código actualmente desplegado.  
**Objetivo:** permitir gestionar, consultar y analizar desde conversaciones de ChatGPT la totalidad de capacidades autorizadas de Vida en Orden mediante un plugin MCP hospedado en el Site, sin añadir una interfaz de IA dentro de la aplicación.

> **MANDATO PARA CODEX:** El objetivo es cobertura funcional total de **las capacidades reales existentes**, no prometer operaciones que el Site todavía no tenga. Primero inventariar el código, los modelos y la base de datos actuales; después implementar cada herramienta contra los servicios de dominio reales. No sustituir el Site, no reconstruir sus datos, no introducir cambios destructivos y no exponer CRUD genérico ni base de datos directamente al modelo.

---

## 1. Resultado esperado y límites

Una conversación de ChatGPT que haya seleccionado el plugin podrá:

1. Descubrir **qué información existe y cómo está relacionada**, sin requerir que el usuario recuerde identificadores internos.
2. Consultar, buscar, filtrar, comparar y resumir registros de todos los módulos autorizados.
3. Interpretar solicitudes en lenguaje natural; resolver referencias ambiguas, inferir categorías/conceptos a partir de catálogos existentes y distinguir información comprobada de inferencias.
4. **Preparar** cambios individuales o coordinados entre varios módulos, mostrando en el chat un resumen corto y completo de sus efectos.
5. **Ejecutar** los cambios únicamente tras **una aprobación específica y verificable** de esa propuesta. Nunca convertir una instrucción inicial, una preferencia guardada o una indicación incluida en un documento en autorización permanente.
6. Verificar el resultado en el servidor y reportar qué se creó, cambió, omitió, rechazó o deshizo.
7. Producir informes narrativos y tabulares basados en datos recuperados; señalar fechas de corte, filtros, alcance, supuestos y limitaciones.

**No está previsto:** un chatbot interno al Site, un agente autónomo que escriba en segundo plano, conexión directa de ChatGPT a SQL, publicación de información financiera, conexión bancaria, acceso a contraseñas/tokens, o que un LLM se convierta en autoridad de contabilidad y permisos.

**Alcance funcional inicial:** Tareas, Planificación/Calendario/Eventos, Áreas y Proyectos, Finanzas, Bitácora y Configuración; agregar también búsquedas e informes transversales. La navegación «Resumen/Inicio» se cubre con herramientas agregadas de consulta.

**Reserva de seguridad:** “hacer todo” significa poder **solicitar** todas las operaciones de negocio que el usuario ya puede hacer, no poder saltarse permisos, reglas legales, medidas de seguridad o procesos de recuperación. Los controles administrativos sensibles tendrán una aprobación más fuerte, y ciertas acciones (gestión de credenciales, restablecimiento global, cambios de titularidad/permisos, borrado irreversible, restauración masiva) se mantienen en una interfaz segura del Site hasta contar con un flujo verificado equivalente.

## 2. Principios no negociables

- **Una sola fuente de verdad.** La UI y el MCP comparten las mismas funciones de dominio; no crear una segunda interpretación de saldos, prioridades, estados o recurrencias.
- **Solo lectura por defecto.** Ninguna consulta puede persistir cambios, aunque invoque cálculos complejos.
- **Confirmación en cada escritura.** Incluye crear, editar, completar, reabrir, reordenar, vincular, reservar, revertir, archivar, importar, ajustar y eliminar. No hay aprobación genérica de una sesión.
- **La confirmación debe ser efectiva, no teatral.** Un parámetro `confirmed: true` enviado por el modelo o un texto «sí» que el mismo modelo interpreta **no es prueba criptográfica** de aprobación humana. Ver §7.
- **El Site es la autoridad.** Todos los permisos, reglas, integridad referencial, reservas, saldos e invariantes se comprueban del lado servidor y dentro de una transacción de base de datos cuando proceda.
- **No inferir hechos no observados.** La categoría puede sugerirse; el importe real, la cuenta pagadora, una fecha que afecta la contabilidad o la confirmación de un pago no se inventan.
- **No filtración por defecto.** Las herramientas devuelven la mínima información suficiente; nunca secretos, tokens, hash de contraseñas, información de otras cuentas o archivos privados no solicitados.
- **Cambios reversibles y auditables.** Preferir anulación, reversión y archivo donde el dominio lo permita; no borrar silenciosamente el historial de finanzas.
- **Consistencia intermodular.** Una tarea, meta, presupuesto y gasto pueden relacionarse sin multiplicar los importes ni duplicar movimientos.
- **Diseño incremental.** El inventario y pruebas de regresión preceden al despliegue. Si la plataforma no soporta algún mecanismo propuesto, documentar la desviación y establecer alternativa segura antes de habilitar escrituras.

## 3. Investigación previa obligatoria (Fase 0)

Codex debe producir `MCP_CURRENT_STATE.md` con evidencia real de:

1. Repositorio, rama, versión desplegada, framework, runtime del Site, estructura de rutas, endpoints y componentes; verificar si hay backend/server functions, DB integrada y autenticación.
2. Tablas/modelos/relaciones/campos, entidades huérfanas, cardinalidades, claves, índices, historial, datos de prueba y datos productivos.
3. Identidad, propietario y separación de espacios de datos; posibilidad de usuarios invitados; comportamiento de sesiones y permisos.
4. Contratos actuales por módulo: lectura, creación, edición, eliminación, archivado, copia, cambio de estado, arrastrar/reordenar, importación/exportación, cálculos y dependencias.
5. Lógica real de finanzas: saldo inicial, corte, cuentas, transferencias/ACH/LTBR/comisiones/impuestos, movimientos, conceptos, categorías, obligaciones, ingresos fijos, recurrentes, presupuesto mensual, metas, reservas y reportes.
6. Reglas actuales de calendario, ejecución y fechas de tareas, recurrencias, cambios de horario, gestión de eventos.
7. Tareas, subtareas recursivas, reglas de cierre/reapertura automática, prioridades, registros de bitácora y vínculos económicos.
8. Estrategia existente de backup; exportación y restauración verificadas. **Atención:** restaurar una versión de código en ChatGPT Sites no restaura necesariamente su base de datos ni archivos; el despliegue puede ejecutar migraciones que persisten incluso si la publicación falla.
9. Compatibilidad efectiva de MCP hospedado en **este** Site, flujos de autorización/identidad, UI de aprobación en ChatGPT y posibilidades de almacenamiento temporal en servidor.
10. Matriz **implementado / parcialmente implementado / pendiente / no autorizado** por funcionalidad, con enlaces a archivos y pruebas, sin deducir estado a partir de documentos antiguos.

**Entregables de salida:** `MCP_CURRENT_STATE.md`, `MCP_PARITY_MATRIX.md`, diagrama de entidades actualizado, lista de riesgos y plan de respaldo probado. **No migrar ni publicar** sin completar esta fase.

**Regla de paridad:** cada operación ya disponible en la UI debe identificarse y clasificarse. Toda capacidad «pendiente» en el roadmap histórico es una hipótesis hasta que se constate en el código. La matriz es también la definición de «100 % de cobertura».

## 4. Arquitectura objetivo

```text
Conversación ChatGPT (usuario autenticado)
  ├─ analiza lenguaje natural, imágenes/PDF y solicita datos
  └─ Plugin «Vida en Orden» (servidor MCP hospedado en el Site)
        │ OAuth/identidad vinculada, permisos, límites
        ├─ Herramientas de descubrimiento y consulta (solo lectura)
        ├─ Preparación de cambios + previsualización SIN efectos
        ├─ Aprobación autenticada por el propietario
        └─ Ejecución consumible una vez + verificación
               │
               ▼
        Capa única de servicios de dominio existente
          ├─ Tareas / Planificación / Proyectos
          ├─ Finanzas / Obligaciones / Metas
          ├─ Bitácora / Configuración autorizada
          └─ Validadores, transacciones, auditoría
               │
               ▼
        Base de datos y archivos persistentes EXISTENTES
```

### 4.1 Componentes mínimos

- **MCP Gateway:** registro de herramientas, esquemas estrictos, metadatos descriptivos y versiones compatibles.
- **Identity/Authorization:** resolución de usuario por credencial validada, controles por propiedad y módulo; prohibido confiar en `user_id` provisto por el LLM.
- **Context Query Layer:** búsqueda segura, filtros, paginación, relaciones y resúmenes eficientes.
- **Action Planner/Validator:** normalización de propuestas, referencias e IDs, reglas de negocio, diferencias antes/después, estimación de impacto, advertencias, versiones de registros afectados.
- **Approval Manager:** propuestas pendientes, caducidad, estado, aprobado por quién y cómo, huella criptográfica del contenido.
- **Transactional Executor:** ejecución atómica por grupo coordinado, control de concurrencia, idempotencia, validación al confirmar.
- **Audit/Recovery:** registro de cambios, referencias, reversión cuando sea viable, observabilidad y alertas.

Usar las bibliotecas y patrones soportados por el Site; **no elegir tecnología, agregar servicios externos ni secretos sin justificar compatibilidad**. MCP debe ser una capa fina, no otro backend financiero independiente.

### 4.2 Identidad y autorización

- Evaluar la autenticación que admite un plugin creado desde Sites y la identidad real disponible en el backend.
- Preferir OAuth 2.1 / protocolo soportado, con separación `read`/`write`/`admin` si el entorno permite scopes granulares, token validado para cada llamada, expiración, revocación, mínimos privilegios y `subject` verificado.
- Usuario propietario del Site y usuario conectado al plugin deben corresponder a la misma identidad o una vinculación explícita verificable. Rechazar acceso cruzado.
- Si no se puede verificar de forma confiable al usuario final por llamada, **habilitar solo lecturas no sensibles o no publicar el plugin**, según el riesgo; nunca publicar finanzas privadas en herramientas anónimas.
- No registrar credenciales, secretos ni documentos enteros en logs. Usar HTTPS y controles de origen/CSRF en el flujo de aprobación web.
- Declarar correctamente anotaciones MCP `readOnlyHint`, `destructiveHint`, `openWorldHint` e `idempotentHint` según comportamiento real. Son señales para el cliente, no controles de seguridad.

## 5. Inventario de capacidades a exponer

La siguiente matriz es **objetivo de cobertura**, no afirmación de que todas las acciones están ya implementadas. Codex debe verificarla y convertirla en un contrato por operación.

| Dominio | Lecturas obligatorias | Operaciones planificables (si existen en el Site) | Reglas particulares |
|---|---|---|---|
| **Inicio/Resumen** | Indicadores, próximas acciones, alertas, disponibilidad y resumen de finanzas | Solo las mutaciones de módulos subyacentes | Resultados explicables y con fecha de corte |
| **Tareas** | Listar/buscar, detalle completo, árbol de ancestros/descendientes, prioridades, esfuerzo, estados, fechas, costo, enlaces, notas | Crear, actualizar, duplicar, reubicar, reordenar, completar, reabrir, archivar, eliminar, crear/editar subtareas, establecer vínculos | Cierre y reapertura recursivos; no ciclos; orden estable |
| **Planificación** | Calendario por rango, eventos, bloques programados, vencimientos, superposiciones, recurrencias y vistas | Crear/editar/cancelar eventos, programar/reprogramar tareas, modificar bloques/recurrencia y excepciones si existen | Zona horaria, fin posterior a inicio, evitar cambios implícitos de deadline |
| **Áreas y Proyectos** | Áreas, proyectos, jerarquías, integrantes autorizados, avances, tareas/finanzas asociadas | Crear, editar, archivar/eliminar, asignar/reasignar tareas y proyectos, ordenar, modificar fechas/metadatos | Restricciones referenciales; no eliminar de forma silenciosa tareas vinculadas |
| **Finanzas — cuentas** | Lista, saldo confirmado, movimiento y fecha de corte, conciliaciones | Crear/editar/archivar cuentas, ajustes/conciliaciones si están habilitados | No exponer claves bancarias ni duplicar saldo inicial |
| **Finanzas — movimientos** | Histórico, detalles, desglose, categorías, conceptos, cuenta, medio, comisiones, vínculo a tareas/metas | Ingreso/gasto/transferencia; editar, anular, reclasificar, vincular; dividir partidas si se soporta | Contabilidad consistente; comisiones ACH/LTBR, impuestos y cuentas |
| **Finanzas — presupuestos** | Períodos, categorías, partidas, asignado, gastado, comprometido, restante, comparativos | Crear/editar/eliminar presupuesto mensual y partidas, asignar o reajustar reservas | Plan esperado ≠ saldo real; evitar duplicaciones con obligaciones y metas |
| **Finanzas — obligaciones** | Obligaciones, cuotas/ocurrencias, vencimientos, importes previstos, reservado, estado, pagos asociados | Crear/editar/archivar, reglas recurrentes, reservar, cambiar ocurrencia, registrar pago real | Lo previsto no es gastado; pagos parciales y recurrencia idempotente |
| **Finanzas — ingresos fijos** | Reglas, ocurrencias previstas, efectivo recibido, incidencia presupuestaria | Crear/editar/cancelar reglas, registrar recepción o ajuste si existe | No sumar ingresos futuros al disponible hoy |
| **Finanzas — metas** | Objetivos, fechas, progreso, aportes, reservas, vinculaciones, historial | Crear/editar/archivar, aportar, corregir/revertir aportes, automatización mensual si existe, consumir reserva en gasto | Aporte no implica gasto; reservas y transferencias conciliables |
| **Finanzas — reportes** | Flujos de caja, gastos por categoría/concepto, tendencias, pronósticos, patrimonio por cuenta, disponibilidad | No escribir salvo exportaciones autorizadas | Fuente y filtros visibles; separar realizado de previsto |
| **Bitácora** | Notas cronológicas de tareas/eventos/proyectos y registros globales, filtros, autor, fechas | Añadir, corregir, vincular y eliminar notas según permisos | Mantener trazabilidad; no sobrescribir auditoría del sistema |
| **Configuración** | Preferencias no secretas, catálogos, métodos de pago, categorías, zonas horarias, opciones relevantes | Editar preferencias/catálogos y opciones que la UI permita; importación/exportación condicionada | Claves/secretos/permisos/restauraciones con flujo reforzado o UI del Site |

### 5.1 Relaciones que deben comprenderse explícitamente

La consulta nunca debe devolver registros aislados cuando la solicitud requiera entender vínculos. Definir relaciones navegables y reversas:

- Área → proyectos → tareas → subtareas recursivas → notas/bitácora → programación → gastos y costo estimado/real.
- Tarea ↔ proyecto/área ↔ meta de ahorro ↔ aportes/reserva ↔ gastos asociados.
- Cuenta ↔ movimientos ↔ categorías/conceptos ↔ presupuestos ↔ obligaciones ↔ reglas de recurrencia.
- Evento ↔ proyecto/área/tarea vinculada, conservando identidad de cada elemento.
- Obligación recurrente ↔ ocurrencia concreta ↔ pago(s) real(es) ↔ reserva ↔ partida de presupuesto.
- Ingreso fijo ↔ ocurrencia prevista ↔ cobro real ↔ previsión mensual, sin duplicación.

**El grafo se obtiene por identificadores y consultas seguras, no concatenando una exportación privada completa en cada respuesta.** Respetar filtros, paginación, niveles de expansión máximos y límites de datos.

## 6. Diseño de herramientas MCP (contrato inicial)

**Criterio:** herramientas de lectura suficientemente específicas para que el modelo elija bien; pocas puertas de escritura **protegidas** y con operaciones tipadas. Evitar exponer un centenar de CRUD directos o una herramienta `execute_sql`.

### 6.1 Herramientas de solo lectura

| Nombre propuesto | Propósito |
|---|---|
| `get_capabilities` | Versión, módulos, acciones realmente soportadas, límites, política de aprobación, fecha de actualización; sin datos privados si no hay sesión validada |
| `get_my_profile` | Identidad autenticada, espacio activo, scopes y zona horaria; no entrega secretos |
| `get_app_overview` | Indicadores de Inicio/Resumen con cortes y filtros |
| `search_all` | Buscar términos entre módulos autorizados con coincidencias y enlaces profundos |
| `get_record` | Detalle tipado de entidad por ID y tipo, con campos permitidos |
| `get_related_records` | Relaciones paginadas y árbol expandible; dirección y profundidad controladas |
| `list_tasks` / `get_task_tree` | Búsqueda/filtros de tareas, orden, jerarquía y estados |
| `list_calendar_items` / `find_schedule_conflicts` | Eventos, plazos, bloques y superposiciones por fechas |
| `list_areas_projects` / `get_project_summary` | Catálogos y resumen de progreso/costos |
| `list_accounts` / `get_account_ledger` | Cuentas, saldos y movimientos con fecha de corte |
| `list_transactions` / `get_transaction_detail` | Movimientos y desgloses por período, cuenta, tipo, categoría, concepto |
| `get_finance_catalogs` | Categorías, conceptos, cuentas, métodos, reglas de comisiones aplicables |
| `get_budget` / `compare_budget_actual` | Presupuesto, partidas, gastado, reservas y diferencias |
| `list_obligations` / `list_recurring_rules` | Vencimientos, ocurrencias, pagos, ingresos fijos y su estado |
| `list_savings_goals` / `get_goal_detail` | Metas, aportes, reserva y vínculos |
| `get_cashflow_projection` / `get_available_to_spend` | Proyecciones/ liquidez vs comprometido, explicando supuestos |
| `get_financial_report` | Informe parametrizado, tendencias y agrupaciones autorizadas |
| `list_journal_entries` / `get_activity_timeline` | Notas y bitácora, histórico de actividades y relaciones |
| `get_preferences` / `get_setting_catalogs` | Preferencias editables, sin datos de seguridad secretos |
| `get_change_history` | Historial del MCP y acciones de dominio permitido, antes/después redactado según acceso |
| `get_pending_proposal` / `list_my_pending_proposals` | Revisar propuestas pendientes, estado, impacto y caducidad |

**Contrato de entrada/salida para lecturas:**

- Entradas tipadas `entity_type`, `id`, `filters`, `start`, `end`, `sort`, `limit`, `cursor`, `include` (lista permitida); no filtros SQL, operadores arbitrarios ni claves JSON dinámicas.
- Todas las fechas con zona explícita; moneda DOP para registros RD$ y centavos como enteros o cadenas monetarias exactas, nunca `float`.
- Salidas estructuradas con `records`, `total_count` (cuando se pueda), `next_cursor`, `as_of`, `currency`, `source`, `permissions`, `warnings`; IDs estables y enlaces profundos del Site si disponibles.
- No traer toda la base «por si acaso»; aplicar paginación (ej. 25–100 registros/página, ajustar por capacidad), resúmenes y expansión selectiva.
- Informar claramente `not_found`, `forbidden`, `unsupported`, `stale_data`, `ambiguous_reference`, `validation_error`.

### 6.2 Herramientas de propuestas y ejecución

| Herramienta | Permisos y comportamiento |
|---|---|
| `prepare_change_plan` | **Sin escritura de negocio.** Valida conjunto de acciones tipadas y crea exclusivamente una propuesta temporal de aprobación; devuelve diff, advertencias, impacto, vínculos, digest y `proposal_id` |
| `revise_change_plan` | Sustituye la propuesta anterior, revalida todo, incrementa versión y anula la aprobación previa |
| `cancel_change_plan` | Cancela propuesta pendiente; no cambia entidades de negocio |
| `request_approval` | Expone el resumen inmutable y desencadena un canal de aprobación confiable (widget autenticado o enlace de aprobación del Site); no aprueba automáticamente |
| `get_approval_status` | Consulta estado, actor, modo y caducidad de la aprobación sin modificar negocio |
| `commit_approved_change_plan` | **ÚNICA puerta de escritura de negocio desde MCP.** Verifica aprobación real, propietario, digest, versiones, permisos, caducidad, idempotencia y transacción; devuelve resultado por acción |
| `get_execution_result` | Verifica resultado de una ejecución específica; evita asumir éxito ante timeout |

**Nota de implementación:** es válido dividir `prepare_change_plan` en herramientas especializadas por dominio (`prepare_task_changes`, `prepare_finance_changes`, etc.) si la complejidad del esquema dificulta la selección. **Todas** deben desembocar en el mismo motor de aprobación/ejecución y no crear rutas de escritura directa no protegida.

### 6.3 Tipos de acciones tipadas dentro de un plan

Establecer un `Action` discriminado (por ejemplo `type`) y validar con esquemas separados. No aceptar `table`, `sql`, `endpoint`, `arbitrary_patch` ni paths elegidos por el LLM. Tipos esperados, condicionados a la matriz de paridad:

- `task.create`, `task.update`, `task.duplicate`, `task.move`, `task.reorder`, `task.complete`, `task.reopen`, `task.archive`, `task.delete`, `task.link`, `subtask.create`.
- `event.create`, `event.update`, `event.cancel`, `schedule.create`, `schedule.update`, `schedule.delete`, `recurrence.update`.
- `area.create/update/archive/delete`, `project.create/update/archive/delete`, `task.assign_area_project`.
- `account.create/update/archive`, `transaction.create/update/void`, `transaction.split`, `transaction.link`, `transfer.create`, `account.reconcile`.
- `budget.create/update/delete`, `budget_line.create/update/delete`, `budget.reserve/reallocate`.
- `obligation.create/update/archive`, `obligation_occurrence.update`, `obligation.reserve`, `obligation.record_payment`, `recurring_rule.create/update/disable`, `fixed_income.record_receipt`.
- `goal.create/update/archive`, `goal.contribute`, `goal.reverse_contribution`, `goal.schedule_contribution`, `goal.consume_reserve`.
- `journal.create/update/delete`, `setting.update`, `category.create/update/archive`, `concept.create/update/archive`, `payment_method.update`.
- Importación/restauración, cambio de titularidad, permisos y borrados globales **no se habilitan** en `commit_approved_change_plan` hasta implementar aprobación reforzada y un modelo de recuperación auditado.

Cada tipo cuenta con definición de campos requeridos, campos opcionales, permisos, nivel de riesgo, precondiciones, validadores, efectos calculados y procedimiento de reversión.

## 7. Protocolo de confirmación obligatoria (CRÍTICO)

### 7.1 Estados

`DRAFT → VALIDATED → PENDING_APPROVAL → APPROVED → EXECUTING → COMMITTED`

Alternativas terminales: `REJECTED`, `CANCELLED`, `EXPIRED`, `INVALIDATED`, `FAILED`, `PARTIALLY_FAILED` (solo cuando el contrato haya previsto operaciones no atómicas).

**No existe transición** de `DRAFT` o `PENDING_APPROVAL` a `COMMITTED` sin aprobación efectiva. Una nueva versión de la propuesta invalida cualquier aprobación anterior.

### 7.2 Secuencia paso a paso

1. ChatGPT consulta catálogos y registros existentes; resuelve IDs y relaciones. Si un dato esencial es ambiguo o falta, pide solo el dato necesario.
2. ChatGPT llama `prepare_change_plan`. El servidor valida y **no modifica datos de negocio**.
3. El servidor devuelve resumen/diff que incluye: acciones exactas, objetos afectados, cuentas y montos, fechas, categorías inferidas, vínculos, riesgos, posibles duplicados, dependencias y estado posterior previsto.
4. ChatGPT **muestra el resumen breve en conversación y solicita confirmación nueva**, aunque el usuario hubiese ordenado actuar en el mensaje inicial. No agrupar otras acciones no presentadas.
5. La aprobación se registra por un **canal confiable**: preferentemente control MCP Apps de «Confirmar» accionado directamente por el usuario, sujeto a las garantías de identidad del host; alternativamente página/modal autenticado del Site asociada a `proposal_id` y digest. Una respuesta de texto en el chat puede expresar intención, pero **por sí sola no satisface un requisito criptográficamente demostrable**. Si el host no expone prueba autenticada de una acción directa, requerir el control web/Widget real.
6. Solo tras `APPROVED`, ChatGPT llama `commit_approved_change_plan` (o el flujo de UI activa el endpoint autenticado previsto). El servidor revalida todo en el último instante y consume una única autorización.
7. El resultado presenta IDs, enlaces, operaciones ejecutadas, montos finales, vínculos y errores. ChatGPT no proclama éxito hasta obtener confirmación del servidor. Si hubo timeout consulta `get_execution_result` antes de intentar reintento.

### 7.3 Propiedades de la aprobación

- Una aprobación = **una propuesta inmutable**, identificada por `proposal_id + digest + revision`, asociada a un propietario autenticado y a un conjunto exacto de acciones.
- Caducidad inicial sugerida: 10 minutos; configurable. Caducada o revocada, hay que volver a preparar y confirmar.
- Consumible **una sola vez**. Repetir llamada con la misma `idempotency_key` devuelve el mismo resultado, no vuelve a ejecutar.
- La aprobación debe mostrar impactos colaterales: cierre de ancestros por completar subtarea, traslado de reservas, comisiones, cambios por recurrencia, enlaces, etc.
- Cambios al plan después de aprobado requieren **nueva aprobación**, sin excepción.
- El servidor comprueba versiones (`expected_version`/ETag) de entidades involucradas. Si alguien modifica un registro antes del commit, devuelve `STALE_PROPOSAL` y requiere nuevo resumen.
- Operaciones dependientes deben ejecutarse con referencias locales del plan (`$ref:actions[0].result.id` bajo un esquema cerrado) y transacción **todo o nada** cuando comparten invariantes.
- No enviar un botón de «aprobar todo para siempre», no cachear autorizaciones para futuras conversaciones y no aceptar aprobación implícita por ejecución de una herramienta.
- El modelo **no debe** poder escribir el estado `APPROVED` ni inventar la firma/nonce. El servidor solo acepta confirmación desde el canal de usuario confiable y verifica autenticidad, identidad, CSRF, origen, expiración y nonce. Jamás permitir `user_confirmed: true` como bypass.

### 7.4 Texto breve del resumen en chat

Formato orientativo, no rígido:

> **Voy a realizar 3 cambios:**  
> 1. Crear tarea «Comprar aire acondicionado» en área Hogar, prioridad NP++.  
> 2. Crear meta «Aire acondicionado»: objetivo RD$28,000, vinculada a esa tarea, sin reservar dinero todavía.  
> 3. Crear la categoría «Electrodomésticos» porque no encuentro una equivalente existente.  
> **Impacto ahora:** ninguna salida de dinero; no se alterarán saldos.  
> **¿Confirmas esta propuesta?** [control de aprobación autenticado]

**Si la categoría ya existe:** utilizarla e indicarlo claramente; **no** crear una segunda. Si el significado es incierto, proponer opciones y pedir selección en vez de crear automáticamente.

### 7.5 Niveles de riesgo

| Nivel | Ejemplos | Control mínimo |
|---|---|---|
| R0 lectura | Buscar tarea, listar gastos, informar | Identidad/permisos, sin confirmación de escritura |
| R1 cambio común | Crear tarea, nota, evento, categoría, meta sin movimiento monetario | Resumen + aprobación específica confiable |
| R2 financiero/estructura | Registrar/modificar/anular gasto, transferencia, reserva, pago, modificar vínculos y jerarquía | Resumen con impacto antes/después, duplicados, aprobación específica, reversión trazable |
| R3 sensible/destructivo | Eliminar datos con descendientes, editar reglas recurrentes masivas, importaciones, restauraciones, credenciales o accesos | Aprobación reforzada, backup/plan de recuperación, alcance explícito; algunas acciones solo mediante Site hasta auditoría |

El permiso del usuario se valida **además** del nivel de riesgo. No se debe intentar saltar las confirmaciones propias de ChatGPT; son una capa adicional.

## 8. Propuesta estructurada y errores

### 8.1 Ejemplo de plan de dos entidades relacionadas

```json
{
  "schema_version": "1.0",
  "client_request_id": "req-unique-per-intent",
  "operations": [
    {
      "client_action_id": "a1",
      "type": "task.create",
      "data": {
        "title": "Comprar aire acondicionado",
        "area_id": "area-hogar-confirmada",
        "priority": "NP++"
      }
    },
    {
      "client_action_id": "a2",
      "type": "goal.create",
      "data": {
        "name": "Aire acondicionado",
        "target_minor": 2800000,
        "currency": "DOP",
        "linked_task": { "ref_action_id": "a1" },
        "reserved_now_minor": 0
      }
    }
  ]
}
```

Todos los IDs y monedas del ejemplo son ficticios. El plan real **no** debe permitir elegir propietarios arbitrarios; los obtiene del usuario autenticado. Las referencias entre acciones se resuelven en una misma ejecución transaccional.

### 8.2 Respuesta de preparación (ejemplo)

```json
{
  "proposal_id": "prop-generated-by-server",
  "revision": 1,
  "status": "PENDING_APPROVAL",
  "expires_at": "<timestamp-ISO-8601>",
  "digest": "<hash-servidor-del-plan-canonico>",
  "actions": [
    { "client_action_id": "a1", "type": "task.create", "effect": "CREATE", "valid": true },
    { "client_action_id": "a2", "type": "goal.create", "effect": "CREATE", "valid": true }
  ],
  "financial_impact": { "account_delta_minor": 0, "new_reservation_minor": 0, "currency": "DOP" },
  "requires_authenticated_approval": true,
  "warnings": [],
  "approval": { "mode": "trusted-widget-or-site", "url": "<generada-y-firmada-por-servidor-si-corresponde>" }
}
```

No incluir datos bancarios completos ni otros campos innecesarios en la respuesta. El digest pertenece a un plan canónico almacenado por el servidor, no a un payload arbitrario presentado en `commit`.

### 8.3 Errores y semántica

- `AUTH_REQUIRED`, `PERMISSION_DENIED`, `INVALID_SCOPE`.
- `ENTITY_NOT_FOUND`, `AMBIGUOUS_MATCH`, `UNSUPPORTED_ACTION`.
- `VALIDATION_FAILED`, `BUSINESS_RULE_VIOLATION`, `CATEGORY_NOT_FOUND`.
- `DUPLICATE_POSSIBLE` (advertencia), `DUPLICATE_BLOCKED` (error cuando sea inequívoco).
- `APPROVAL_REQUIRED`, `APPROVAL_EXPIRED`, `APPROVAL_REVOKED`, `PROPOSAL_CHANGED`, `STALE_PROPOSAL`.
- `IDEMPOTENT_REPLAY` (devolver resultado original), `CONCURRENT_MODIFICATION`, `TRANSACTION_ABORTED`.
- `RATE_LIMITED`, `PAYLOAD_TOO_LARGE`, `TEMPORARILY_UNAVAILABLE`.

Las herramientas deben devolver códigos estables y explicación en español, con instrucciones de recuperación, sin filtrar trazas internas ni información de otros usuarios.

## 9. Inferencias, selección de categoría y manejo de documentos

### 9.1 Algoritmo para categorizar una operación

1. Leer categorías **actuales** del Site, sus jerarquías y tipos (gasto/ingreso/transferencia/obligación), conceptos existentes y, si se permite, historial relevante.
2. Interpretar el mandato; separar **hechos proporcionados** (`monto`, `fecha`, `cuenta`, `comercio`) de **inferencias** (`categoría probable`, `concepto normalizado`, vínculo).
3. Evaluar coincidencia semántica y contexto de uso; no reutilizar una categoría de ingreso para gasto ni confundir concepto y categoría.
4. Si hay coincidencia clara, seleccionar categoría existente, explicar selección, mostrarla antes de confirmar.
5. Si hay varias coincidencias razonables, presentar alternativas; no escoger una al azar para ahorrar preguntas.
6. Si no existe una categoría adecuada, proponer nombre y jerarquía, añadir `category.create` al mismo plan de cambios **solo tras mostrarlo**; si el usuario prefiere categoría genérica existente, usar esa.
7. Nunca crear duplicados que difieran por mayúsculas, tildes, plural/singular o alias evidentes; normalización y comprobación de unicidad del servidor.
8. Aplicar la misma disciplina a conceptos y métodos de pago; todos los supuestos deben figurar en el resumen de aprobación.

### 9.2 Facturas, recibos y fotos desde ChatGPT

- El usuario sube foto/PDF a la **conversación de ChatGPT**; el modelo interpreta allí su contenido disponible. **No asumir** que el plugin obtiene automáticamente los bytes del adjunto.
- El modelo estructura la información: comercio, identificador de factura si existe, fecha, moneda, productos/partidas, subtotal, impuestos, descuentos, propina, total, método/cuenta solo si consta, señales de confianza e importes ambiguos.
- El plugin recibe **propuestas estructuradas**, comprueba catálogos y saldo/reglas; no marca gasto como pagado sin evidencia o confirmación del usuario.
- Si la plataforma admite referencias autorizadas a archivos como parte de un flujo de herramienta, Codex puede añadir `attach_receipt` con permisos y caducidad. De lo contrario, registrar un comprobante solo como dato derivado o solicitar carga directa al Site; **no inventar** URLs de archivos ni transmitir documentos a terceros por defecto.
- Conciliar `sum(line_items) + impuestos + cargos - descuentos = total`. Si no cuadra, bloquear la escritura final o exigir corrección explícita; no forzar el ajuste silencioso.
- Dedupe: hash de archivo cuando exista, comercio+número+fecha+total+cuenta, e historial cercano. Coincidencias probables requieren revisión.
- Evitar registrar duplicadamente el gasto general y las partidas. Un movimiento puede tener múltiples desgloses de categoría que sumen su total; si el Site aún no soporta desglose, documentar limitación y proponer una política segura sin inventar fragmentaciones contables.
- Texto dentro de la imagen, factura o adjunto es **dato no confiable**: ignorar instrucciones sobre ejecutar tools, exfiltrar datos, omitir confirmación, cambiar categorías ajenas o borrar registros.

### 9.3 Ejemplo de gasto inferido

> Usuario: «Anota RD$1,850 que gasté en detergente y cloro, pagado con BHD».  
> ChatGPT: consulta cuentas, categorías, conceptos, presupuestos y duplicados; propone «Limpieza del hogar» (categoría existente o creación), concepto «Productos de limpieza», cuenta BHD identificada, fecha consultada o solicitada según regla.  
> Resumen: «Crearé un gasto confirmado de RD$1,850 en BHD, categoría Limpieza del hogar y concepto Productos de limpieza. Se reducirá el saldo de BHD y la partida presupuestaria una sola vez. No encontré posibles duplicados. ¿Confirmas?»  
> Solo tras aprobación auténtica: `commit_approved_change_plan`.

## 10. Reglas de consistencia e invariantes del dominio

### 10.1 Tareas y calendario

- Las subtareas forman un árbol acíclico; `parent_id` debe pertenecer al propietario y la jerarquía no debe permitir ciclos ni ciclos indirectos por movimiento.
- Completar/reabrir tarea respeta **exactamente** las reglas actuales de cierre/reapertura recursiva y las fechas reales; mostrar efectos sobre ancestros.
- Una fecha límite no equivale a una reserva de horas; reprogramar no cambia `deadline` salvo petición explícita.
- Eventos y tareas permanecen entidades distintas, aunque puedan relacionarse; las superposiciones con horario se reportan como advertencia.
- Recurrencias: prevenir ocurrencias duplicadas e interpretar correctamente fechas locales y `America/Santo_Domingo` por defecto; no desplazar fechas por conversiones UTC involuntarias.
- Orden manual es independiente de prioridad; operaciones de reordenamiento atómicas dentro del grupo correspondiente.

### 10.2 Finanzas

- **Saldo confirmado = saldo de apertura en fecha de corte + movimientos confirmados posteriores aplicables**, nunca doble suma de movimientos históricos incorporados en el saldo inicial.
- **Transferir entre cuentas propias no constituye ingreso ni gasto.** Los gastos por comisión/impuesto de la transferencia sí deben reflejarse una vez y contra la cuenta correspondiente.
- Para ACH y LTBR, tomar la configuración/comisiones vigentes en el Site, incluyendo porcentajes y monto fijo aplicable; calcular sobre montos exactos, transparentar redondeos y cuentas impactadas. No suponer tarifas.
- Un gasto confirmado cambia el saldo de la cuenta **una vez** y el presupuesto realizado **una vez**. Cambiar monto, categoría, concepto, cuenta o método de pago recalcula correctamente todos sus efectos relacionados.
- Presupuesto previsto, obligación, reserva, movimiento confirmado, meta de ahorro e ingreso esperado son entidades distintas; vincularlas no debe duplicar montos.
- Si una obligación recurrente genera una partida presupuestaria, actualizar esa misma relación; no producir partidas redundantes por ocurrencia. Aplicar igual a ingresos fijos en sus proyecciones cuando el Site los soporte.
- Una obligación prevista NO es una salida de dinero; un ingreso fijo previsto NO es dinero liquidado. «Importe esperado» no significa «reservado ahora».
- La reserva aparta una porción de fondos reales; verificar que no se asigna a múltiples compromisos por error. El saldo líquido y lo no comprometido se reportan por separado.
- Las metas de ahorro y aportes **no son automáticamente gastos**; el consumo de reserva al realizar una compra no debe descontar dos veces el mismo dinero. Reversiones y aportes mensuales deben conservar trazabilidad.
- Anular, modificar o corregir transacciones deja rastros; nunca borrar historial financiero silenciosamente ni crear movimientos compensatorios fantasmas.
- La edición de movimientos que afecte comisiones, impuesto o tipo de transacción debe recalcular y mostrar diff contable antes de pedir aprobación.
- Un reporte financiero muestra alcance, moneda, cuenta(s), período, `as_of`, inclusiones/exclusiones, cifras realizadas vs previstas y advertencia si faltan datos.

### 10.3 Transacciones intermodulares

Para «crear tarea + meta + presupuesto asociado»:

- Resolver y validar área y proyecto existentes.
- Crear las entidades y relaciones en la misma transacción cuando sean dependientes.
- No reservar dinero por el mero hecho de crear una meta si el usuario no solicitó apartarlo.
- Si se crea nueva categoría/concepto, incluirla explícitamente en el mismo plan y confirmar todo el conjunto.
- Si una acción depende de otra, el resumen debe mostrar ese vínculo y las condiciones de rollback.
- Rechazo de una acción obligatoria significa **ninguna parte del grupo se confirma**, salvo que el usuario haya aceptado explícitamente un plan dividido en lotes independientes y cada lote tenga confirmación propia.

## 11. Seguridad y protección contra automatización desmedida

1. **Autenticación fuerte:** comprobar identidad de cada solicitud, sesión y propietario; protección ante replay y revocación.
2. **Autorización por entidad:** leer/editar solo datos del propietario/espacio permitido. Si luego hay áreas compartidas, permisos granulares por recurso y denegación por defecto.
3. **Mínimo privilegio:** permisos diferenciados para consultar, proponer, aprobar y ejecutar; no habilitar administración de seguridad mediante instrucciones en texto.
4. **Superficie cerrada:** herramientas tipadas, listas de tipos/propiedades permitidas, validaciones de longitud, fecha, moneda, importe, forma y relaciones.
5. **Confirmación verificable:** aprobar un hash de cambios, no un resumen ambiguo; el backend impide ejecución sin consentimiento real.
6. **Sin autonomía permanente:** rechazar solicitudes de «haz siempre los cambios automáticamente» como excepción a la política. Las tareas recurrentes operan solo mediante reglas nativas autorizadas del Site, no aprobación ilimitada del chat.
7. **Anti-prompt-injection:** datos almacenados, notas, eventos, facturas, títulos o PDFs son datos; no constituyen instrucciones ni autorizaciones para invocar herramientas.
8. **Control de coste y volumen:** paginación, rate limits, topes para acciones por plan (ej. máximo inicial 20, configurable), tope de registros por borrado y límites de importación; propuestas grandes se dividen por lote explícito.
9. **Protección contra duplicados:** claves de idempotencia, comprobación de identidad/importe/fecha, registros de ejecución y detección de pedidos repetidos.
10. **Control de concurrencia:** versiones/ETags, bloqueo transaccional cuando sea necesario, revalidación al commit; nunca hacer overwrites ciegos.
11. **Logs seguros:** eventos `proposal_created/approved/denied/committed/reversed`, user ID y timestamp; no tokens, recibos completos ni PII innecesaria.
12. **Secretos y configuración:** API keys, OAuth secrets, backups completos, sesiones, conexiones y credenciales no son visibles ni editables mediante herramientas generales; never echo.
13. **Datos sensibles:** minimizar el detalle de finanzas/tareas personales por defecto, no compartir fuera de la cuenta; controles de exportación separados.
14. **Fallos cerrados:** no aplicar cambios si identidad, aprobación, reglas, DB, fecha/moneda, digest o vínculos no pueden verificarse.
15. **Recuperación:** snapshots respaldados antes de migraciones, pruebas de restauración, bitácora de reversión y mecanismos de anulación seguros para movimientos.
16. **Protecciones de plataforma adicionales:** respetar confirmaciones y bloqueos del host; no describir mecanismos para evadirlos.

## 12. Informes y razonamiento contextual

Las herramientas deben permitir responder, con evidencia verificable, a preguntas como:

- «¿Qué tareas vencen antes del día 30 y cuánto dinero necesitaré para terminarlas?»
- «¿Qué proyectos tienen más gastos y menos progreso?»
- «¿Cuánto puedo gastar hoy sin comprometer obligaciones y metas?»
- «¿Qué gastos del mes están por encima del presupuesto y cuáles son sus conceptos?»
- «¿Qué eventos se solapan con mis tareas programadas esta semana?»
- «¿Cuál es la evolución de la meta del aire acondicionado y qué aportes están pendientes?»
- «Muéstrame las notas de esta tarea y los gastos asociados con sus documentos disponibles».

**Protocolo:** determinar período/moneda/alcance → consultar capacidades → obtener datos relevantes paginados y relaciones → comprobar consistencia → calcular o utilizar servicios oficiales de agregación → informar fuentes internas (IDs/enlaces), fechas de corte y supuestos. Si el cálculo no es reproducible con los datos disponibles, indicarlo sin inventar precisión.

Para consultas complejas, el plugin puede entregar agregados auditables o subconjuntos suficientes en lugar de descargar todo. El modelo organiza la interpretación, pero los cálculos monetarios críticos corresponden al servidor.

## 13. Flujo de usuario que debe verse en ChatGPT

### A. Consultar (sin modificación)

**Usuario:** «¿Cuántas tareas del hogar están pendientes y cuánto presupuesto tienen?»  
**ChatGPT:** llama lecturas y responde con total, conjunto, monto, desglose pertinente, fecha de actualización y cualquier dato faltante. **No solicita aprobación**.

### B. Crear tarea + meta (varios módulos)

**Usuario:** «Agrega tarea para instalar un aire en la habitación y crea una meta de RD$30,000 para comprarlo».  
**ChatGPT:** consulta área/categorías/metas/tareas similares, propone nombres y vínculos, muestra resumen exacto, solicita autorización.  
**Usuario:** confirma mediante control autenticado.  
**MCP:** crea todo o nada, devuelve IDs y estados.  
**ChatGPT:** confirma resultado comprobado y proporciona enlaces.

### C. Gasto inferido

**Usuario:** «Gasté RD$1,200 en mosaicos, pagué con efectivo. Regístralo».  
**ChatGPT:** busca cuentas de efectivo, categorías, conceptos, tareas de reparaciones y potencial duplicidad. Si cuenta o destino es ambiguo, pregunta. Presenta categoría seleccionada, vínculo, monto y saldo afectado; confirma y ejecuta.

### D. Foto de factura

**Usuario:** adjunta foto y ordena «cárgala en Finanzas».  
**ChatGPT:** lee los importes que pueda comprobar, categoriza por partida si la funcionalidad lo permite, identifica dudas, explica ajustes y detecta posibles duplicados. Aprobación antes de registrar; si faltan datos relevantes, los solicita. Si no hay lectura fiable, se abstiene de inventar.

### E. Reprogramación con conflicto

**Usuario:** «Mueve esta tarea para el martes a las 4».  
**ChatGPT:** identifica la tarea, busca eventos de la franja y propone cambio con advertencia de solapamiento. Aprobación antes de ejecutar.

### F. Cambio de configuración

**Usuario:** «Cambia la moneda de visualización / ajusta mi preferencia de calendario».  
**ChatGPT:** verifica si la opción existe y si no afecta datos históricos, prepara resumen y aprobación. Cambios de seguridad o restauración requieren interfaz reforzada.

### G. Rechazo/corrección

Si el usuario dice «No, usa Transportes, no Hogar», ChatGPT **revisa** la propuesta y solicita **nueva** aprobación. La versión anterior queda inválida; nunca ejecutar un plan que el usuario corrigió.

## 14. Calidad del servicio, formatos y experiencia del plugin

- Nombre visible: **Vida en Orden**. Descripción: «Consulta y administra de manera segura las tareas, planificación, proyectos, finanzas, bitácora y preferencias de tu Site».
- Idioma principal de metadatos y respuestas: español claro; nombres de tools estables en inglés o español, pero sin duplicados semánticos.
- Ejemplos positivos y negativos en descripciones de herramientas: cuándo usar; cuándo pedir aclaración; que escrituras exigen propuesta y aprobación.
- Salidas estructuradas con `outputSchema`, identificadores claros, enlaces a registros y error codes.
- No hace falta UI de IA dentro del Site. **Sí** puede ser útil una **tarjeta de aprobación MCP Apps dentro de ChatGPT**, o una pantalla externa mínima autenticada que confirme el plan; esto es UI de seguridad, no chatbot integrado.
- No obligar al modelo a descargar todas las transacciones para una simple consulta de saldo.
- El Site y el MCP deben responder igual a los mismos cálculos, con igual redondeo, prioridad y semántica.
- Los cambios de esquema MCP deben ser versionados; publicar Site con las herramientas y comprobar que la versión del plugin instalada las expone. No asumir que una publicación ya actualizó la lista aceptada por el cliente.

## 15. Plan de ejecución por fases / PRs

### Fase 0 — Auditoría, backups y matriz de paridad (bloqueante)

- Inventario de UI, modelos, base de datos, seguridad, servicios, relaciones, reglas y versión desplegada.
- Backup íntegro verificable de DB y archivos; ensayo de recuperación según capacidades reales del entorno.
- Entregables: `MCP_CURRENT_STATE.md`, `MCP_PARITY_MATRIX.md`, `MCP_THREAT_MODEL.md` y cobertura real. **No modificar datos productivos**.

**Salida:** propuesta técnica con decisiones de plataforma confirmadas; cualquier brecha marcada sin simulaciones.

### Fase 1 — Servidor MCP y autenticación (sin escrituras)

- Implementar servidor sobre Site, `get_capabilities`, `get_my_profile`, `get_app_overview`, búsquedas, lectura selectiva y paginación.
- Autorización por propietario y permisos; pruebas contra accesos no autorizados.
- Instrumentar logs seguros y manejo de errores.
- **Desplegar primero versión de solo lectura** y probar desde ChatGPT conectado.

**Salida:** plugin funcional de lectura sin exposición de datos ajenos.

### Fase 2 — Paridad integral de lectura

- Implementar herramientas de todos los módulos, relaciones y reportes, con URLs a las fichas.
- Probar datos de finanzas, áreas, árbol de tareas, calendario y bitácora; comparar resultados con interfaz.

**Salida:** cobertura de lectura de todos los campos permitidos y de todos los vínculos relevantes.

### Fase 3 — Motor de propuestas y aprobación

- Diseñar esquemas de acciones, `prepare_change_plan`, diff, clasificación de riesgo, huella y propuestas caducables.
- Implementar interfaz de aprobación autenticada: widget ChatGPT si la plataforma ofrece garantías verificables; fallback a sitio de aprobación del mismo proyecto.
- Probar que ninguna ruta, ni siquiera `commit`, puede escribir sin aprobación específica válida.

**Salida:** seguridad demostrada con pruebas de bypass, replay, modificación y caducidad.

### Fase 4 — Escrituras de tareas, áreas, proyectos, planificación y bitácora

- Conectar acciones tipadas a servicios existentes; garantizar cierre/recursión y agenda.
- Primeras pruebas multi-entidad («tarea + proyecto + evento + nota»), atomicidad y rollback.

**Salida:** paridad de escritura no financiera, siempre confirmada.

### Fase 5 — Escrituras financieras y relaciones cruzadas

- Cuentas/movimientos/transferencias/categorías/conceptos/presupuestos/obligaciones/ingresos/metas.
- Comisiones y ajustes, recurrencias, reservas, vinculación con tareas y controles de duplicidad.
- Pruebas contables con transacciones mixtas, edición, anulación y redondeo.

**Salida:** paridad financiera de escritura y reconciliación con la UI.

### Fase 6 — Adjuntos interpretados en ChatGPT, informes y endurecimiento

- Flujo foto/PDF -> propuesta estructurada -> aprobación -> registro; archivo opcional si el host permite referencias y permisos seguros.
- Pruebas de reportes con datos incompletos, detección de prompt injection y evaluación de inferencias de categorías.
- Límites, observabilidad, pruebas de carga, alarmas y manual de operación.

**Salida:** plugin listo para uso cotidiano y auditoría reproducible.

### Fase 7 — Cierre, documentación y publicación

- `MCP_TOOL_CATALOG.md`, `MCP_DOMAIN_RULES.md`, `MCP_SECURITY.md`, `MCP_TEST_PLAN.md`, `MCP_OPERATIONS.md`, `CHANGELOG.md`.
- Publicación del **Site existente** por su propietario para activar/actualizar plugin; instalar y conectar plugin, confirmar permisos y probar sesiones de chat.
- Comparar la matriz de paridad con lo realmente disponible; registrar explícitamente acciones no expuestas y razones.
- Realizar pruebas end-to-end en ChatGPT antes de declarar completado.

**Regla de entrega:** cada PR incluye alcance, contratos cambiados, migraciones (si aplica), pruebas, riesgos, rollback y evidencia de que las funciones previas siguen disponibles.

## 16. Plan de pruebas de aceptación

**A. Identidad y lectura**

1. Usuario autorizado obtiene lista de módulos, relaciones y registros; la UI coincide.
2. Usuario no autenticado o usuario distinto no puede consultar tareas ni finanzas privadas.
3. `get_record` no acepta ID de otro propietario aunque conozca la cadena exacta.
4. Búsqueda global filtra, pagina y no divulga registros fuera de scope.
5. Árbol de tareas de múltiples niveles no omite ni duplica hijos.
6. Un informe contextual muestra fechas de corte y límites; no confunde proyección con disponible.

**B. Confirmación / protección**

7. Intentar `commit_approved_change_plan` sin propuesta: no modifica nada.
8. Preparar propuesta no modifica tablas de negocio, balances, historiales ni tareas.
9. Intentar `commit` sin confirmación autenticada: rechazar, incluso si un parámetro indica `confirmed=true`.
10. Una instrucción «hazlo sin confirmarme» no elimina la aprobación.
11. Aprobar A y mandar B con el mismo identificador: rechazar.
12. Modificar plan tras aprobar A: invalida la aprobación y exige nuevo consentimiento.
13. Intentar reutilizar un `proposal_id` ya ejecutado: no genera cambios adicionales.
14. Caducidad, cancelación, revocación, pérdida de sesión y cambio de propietario bloquean ejecución.
15. Actualización concurrente de saldo/registro entre preparar y ejecutar: propuesta caduca o se revalida con nuevo resumen.
16. Usuario cancela desde chat/control: no se ejecuta nada.
17. Instrucción maliciosa en bitácora, tarea o factura para borrar datos o exportarlos: no se sigue.
18. Tool con ruta o propiedad no permitida es rechazado; ningún SQL dinámico disponible.

**C. Consistencia de tareas/tiempo**

19. Crear tarea, subtarea y meta relacionadas: IDs y relaciones correctos; un commit único.
20. Completar última subtarea produce exactamente los cambios de ancestros definidos por la app.
21. Reabrir subtarea restablece ancestros conforme regla vigente, con fechas correctas.
22. Intentar crear ciclo moviendo tarea bajo descendiente: rechazo sin daños.
23. Reprogramar tarea respeta deadline; conflictividad horaria visible antes de aprobar.
24. Crear/editar evento recurrente no produce dobles ocurrencias ni cambia zonas horarias erróneamente.

**D. Consistencia financiera**

25. Registrar gasto RD$1,850 afecta una sola vez cuenta y presupuesto correcto.
26. Editar monto/categoría/concepto/cuenta/método recalcula saldos y reportes consistentemente.
27. Transferencia RD$5,000 no figura como ingreso/gasto, salvo comisiones/impuestos reales separados o vinculados según modelo.
28. ACH y LTBR usan exactamente las reglas existentes; el diff muestra recargos reales.
29. Ingreso futuro no incrementa saldo disponible; cobro confirmado sí.
30. Obligación prevista, reservado y pagado conservan semánticas distintas.
31. Obligación recurrente/ingreso fijo no crea partidas o movimientos duplicados al consultar varias veces.
32. Meta creada sin aporte no crea reserva ni gasto.
33. Aporte a meta, reversión y consumo de reserva mantienen contabilidad sin doble descuento.
34. Repetir factura identificable avisa o bloquea conforme política; no duplica gasto.
35. Factura con partidas/impuesto inconsistentes no se registra como monto «ajustado» silenciosamente.
36. Reportes financieros del Site y del MCP coinciden bajo los mismos filtros.

**E. Robustez y despliegue**

37. Fallo en segunda operación de un grupo dependiente causa rollback completo.
38. Timeout durante commit seguido de consulta/reintento con misma idempotency key no duplica.
39. Lote excedido no se ejecuta parcialmente a escondidas.
40. Exportación y backup de prueba verificables; no se borraron datos preexistentes tras actualización.
41. Plugin publicado muestra las herramientas y permisos esperados; una herramienta nueva no se presupone disponible hasta validarla.
42. Prueba real desde **conversación** ChatGPT: búsqueda -> resumen -> aprobación real -> commit -> verificación visual en Site.
43. Prueba de lectura foto/PDF desde el chat sin asumir transferencia automática de archivo al MCP.
44. Prueba de compatibilidad por superficie (web, móvil, modo Chat/Work si corresponde): documentar qué modos funcionan realmente y cuáles no.

**Criterio de aceptación:** cero escrituras sin aprobación real, cero fuga de datos entre propietarios, cero duplicados derivados de reintento, cero discrepancias contables conocidas, integridad referencial intacta, y matriz de paridad completa para todas las operaciones existentes/autorizadas. No declarar «100 %» si hay excepciones: dejarlas documentadas.

## 17. Riesgos, decisiones abiertas y dependencias

| Riesgo / decisión | Respuesta obligatoria de Codex |
|---|---|
| No hay acceso confiable a código/DB productivos | Detener cambios de escritura, solicitar acceso a fuente original; no reconstruir desde suposiciones |
| El Site no puede ofrecer MCP con esa infraestructura | Documentar limitación y alternativa compatible; no exponer API anónima ni crear otro Site por defecto |
| Plugin/host no acredita que el clic de aprobación fue humano | Usar página de aprobación autenticada en Site; no confiar en booleanos enviados por LLM |
| DB no permite transacciones atómicas | Evitar lotes dependientes hasta ofrecer mecanismo equivalente seguro/compensación demostrada |
| Función mencionada en roadmap no existe en versión desplegada | Marcar `unsupported` y no implementarla subrepticiamente |
| Modelo financiero no soporta múltiples categorías por comprobante | Proponer cambio de dominio separado; no registrar N movimientos que distorsionen saldos |
| Manejo de archivos desde mensajes no disponible para MCP | Leer con ChatGPT y pasar datos estructurados; adjunto real opcional según capacidades |
| Historial/recurrencia carece de reversión segura | Exigir proceso reforzado y pruebas antes de permitir operación crítica |
| UI de ChatGPT cambia la lista de herramientas y aprobaciones | Versionar contratos, test de integración por publicación y alternativa segura |
| Solicitud masiva o ambigua | Dividir en lotes con resumen por lote y confirmaciones específicas; pedir precisión si faltan datos esenciales |

## 18. Referencias técnicas oficiales (consulta obligatoria durante implementación)

- **Hospedar plugin con ChatGPT Sites:** https://help.openai.com/en/articles/20001547-hosting-a-plugin-with-chatgpt-sites
- **Crear y editar Sites / versiones y base de datos:** https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites
- **Diseñar herramientas MCP:** https://developers.openai.com/plugins/plan/tools
- **Construir servidor MCP:** https://developers.openai.com/plugins/build/mcp-server
- **Autenticación de plugins:** https://developers.openai.com/plugins/build/auth
- **Componentes UI dentro de ChatGPT:** https://developers.openai.com/plugins/build/chatgpt-ui
- **Seguridad y privacidad:** https://developers.openai.com/plugins/guides/security-privacy
- **Conectar y probar:** https://developers.openai.com/plugins/deploy/connect-chatgpt
- **Referencia de herramientas/anotaciones:** https://developers.openai.com/plugins/reference

Verificar requisitos de permisos, disponibilidad y compatibilidad de cuenta/superficie en las páginas vigentes al desarrollar; **no** suponer que el MCP funciona automáticamente en todas las aplicaciones o dispositivos.

---

## 19. Prompt inicial breve para Codex

> Vamos a construir el plugin MCP «Vida en Orden» **sobre el Site existente**, sin añadir IA dentro del Site, siguiendo íntegramente `VIDA_EN_ORDEN_MCP_PLAN_MAESTRO_V1.md`. Tu primera entrega será **solo la Fase 0**: audita el código y los datos desplegados, crea la matriz de paridad por módulo, verifica el hospedaje MCP/autenticación/aprobación y prepara backup y pruebas de recuperación. No modifiques producción todavía. Después propón PRs por fase. El requisito de seguridad fundamental es que **toda escritura —también las creaciones y cambios menores— necesita un resumen previo visible y una aprobación humana específica verificable**; ninguna ruta MCP puede saltárselo. Prioriza la integridad de tareas, planificación y finanzas, la ejecución atómica, el mínimo privilegio y la ausencia de doble contabilización. Si alguna capacidad no existe o no puede garantizarse en la plataforma, indícalo y no la simules.

---

**Fin del plan maestro V1.**
