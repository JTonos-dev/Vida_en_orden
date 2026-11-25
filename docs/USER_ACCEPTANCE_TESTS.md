# Pruebas funcionales del propietario

Estado inicial: pendientes de entregas de desarrollo. Usar exclusivamente una instancia de pruebas independiente y datos ficticios. No ejecutar casos de escritura en la instalación personal ni habilitar una compuerta de seguridad para saltarse un bloqueo.

Los casos cubiertos por tests automatizados se documentarán como evidencia técnica; el propietario solo debe comprobar interacción real de plataforma y aceptación funcional que esos tests no pueden demostrar.

| Caso | Fase | Estado | Requisitos y pasos | Resultado y persistencia | Denegaciones y precauciones |
|---|---|---|---|---|---|
| UAT-AUTH-01: propietario conectado | 3 | Pendiente | Plugin de desarrollo, owner policy propia; solicitar capacidades y perfil. | Identidad propia, lecturas disponibles; ejecución real permanece deshabilitada. | Otra identidad debe ser rechazada; no compartir secretos ni introducir IDs de otra instalación. |
| UAT-APPROVAL-01: aprobación humana real | 3 | Bloqueada hasta desplegar desarrollo | Preparar una propuesta ficticia y abrir su pantalla de aprobación. Comprobar diff, revisión y caducidad. Accionar personalmente el control de verificación. | Evidencia vinculada al digest/revisión; nunca aprobación automática por texto o por el agente. Consultar estado persistido. | Cancelar/verificación fallida/vencimiento deben impedir ejecución. No se considera verificado por un simulador. |
| UAT-SAFETY-01: compuerta cerrada | 3 | Pendiente | Solicitar ejecutar una propuesta en una instancia sin canal aprobado. | Denegación explícita, sin cambios de negocio. | No cambiar configuración para forzar el resultado. |

Se ampliará cada entrega con datos, pasos y verificación persistida concretos. Una prueba permanece pendiente o bloqueada hasta que el propietario reporte su resultado; no se marcará aprobada por inferencia.

## Aceptación no financiera (fase 4)

Estos casos se ejecutarán únicamente cuando la versión de desarrollo esté instalada y el canal humano validado. Ahora están **bloqueados por habilitación segura**; no se debe cambiar la compuerta para adelantarlos. Las regresiones de reglas, atomicidad, referencias y permisos se ejecutan automáticamente: no requieren repetirlas a mano.

Preparación común: Site privado de pruebas con D1 ficticia, plugin de desarrollo y credencial WebAuthn fijada por administración. Usar solo nombres `UAT Synthetic …`, fecha de mañana y los IDs obtenidos al crear entidades. Antes de cada operación pedir a ChatGPT preparar una propuesta, revisar el diff en el Site y aprobar mediante el autenticador; pedir ejecución solo si una entrega posterior autorizada la habilita. Verificar persistencia recargando el módulo correspondiente del Site y consultando su herramienta de lectura. Ante denegación/caducidad/error no debe haber cambios de negocio; se consulta el recibo antes de reintentar. Evitar datos reales y borrar/archivar solo entidades UAT.

| Caso / funcionalidad | Datos ficticios y pasos específicos | Resultado y verificación persistida | Estado |
|---|---|---|---|
| UAT-4-TASK-CREATE: tarea/subtarea | Crear `UAT Synthetic parent`; crear `UAT Synthetic child` con parentId del padre. | Dos filas, jerarquía correcta en Site y get_task. | Bloqueada |
| UAT-4-TASK-UPDATE: fechas, prioridad, dependencias | Cambiar título a `UAT Synthetic revised`, prioridad P+, programar mañana; vincular otra tarea UAT como dependencia. | Diff exacto y fechas/prioridad/dependencias persistidas; texto del campo owner es etiqueta, no autorización. | Bloqueada |
| UAT-4-TASK-DUPLICATE | Duplicar tarea UAT. | Una copia nueva con ID distinto; sin duplicar ejecución al reintentar. | Bloqueada |
| UAT-4-TASK-STATE | Completar subtarea; reabrirla; archivar y desarchivar. | El resumen muestra efectos en ancestros; Site refleja done/archived. | Bloqueada |
| UAT-4-TASK-ORDER | Reordenar dos tareas UAT; cambiar contexto a área/proyecto UAT y horario 10:00–11:00. | Orden manual y vínculos correctos al recargar. | Bloqueada |
| UAT-4-JOURNAL | Crear nota `UAT Synthetic note`; editar a `UAT Synthetic edited`; eliminarla en propuestas separadas. | get_task/list_task_relations y Site muestran cada resultado. | Bloqueada |
| UAT-4-AREA | Crear área `UAT Synthetic area` color #112233; renombrar a `UAT Synthetic area 2`. | list_areas/get_area y Site coinciden; no se ofrece borrar/archivar área. | Bloqueada |
| UAT-4-PROJECT | Crear proyecto `UAT Synthetic project`; asignar área UAT; actualizar a paused. | Proyecto y área persistidos; no se ofrece borrar proyecto. | Bloqueada |
| UAT-4-EVENT | Crear evento UAT mañana todo el día; actualizar fecha a pasado mañana; cancelar. | get_calendar_event y calendario reflejan cambios, propietario privado correcto. | Bloqueada |
| UAT-4-WORKSPACE | Cambiar orden a priority y límite ficticio 10000. | get_configuration y Site muestran el diff aprobado. No representa un movimiento financiero. | Bloqueada |
| UAT-4-DELETE-REVERSE | Crear tarea UAT con nota; eliminarla; preparar reversión inmediatamente y aprobar nueva propuesta. | El borrado/reversión muestra todo su alcance, restaura IDs/relaciones y conserva auditoría. Si hay cambios posteriores se exige corrección específica. | Bloqueada |

Para reportar: caso, versión/commit de desarrollo, estado observada, pasos, resultado esperado y error/código. No adjuntar claves, cookies ni información financiera real. Cada incidencia corregida tendrá regresión automática antes del cierre.

## Aceptación financiera (fase 5)

Requisitos de todos los casos: instancia de desarrollo privada y vacía de datos reales, canal humano validado, revisión del mantenedor y habilitación específica futura de ejecución. **Ahora todos están bloqueados para MCP real por la compuerta cerrada.** No probar en la instalación personal. Crear dos cuentas `UAT Synthetic A/B`, saldo 100000/0 centavos a fecha de hoy, categorías ficticias de ingreso/gasto y tarea/proyecto UAT. El flujo de propuesta → diff → autenticador → recibo → recarga es el de la sección anterior. Verificar también con get_account/get_budget/get_obligation/get_goal/get_finance_report y list_audit_log. Las pruebas de redondeo, rollback, carreras y duplicación son automáticas; aquí se acepta la experiencia real del plugin y la coincidencia de la UI.

| Caso / funcionalidad | Pasos y datos ficticios | Resultado persistido esperado / denegación | Estado |
|---|---|---|---|
| UAT-5-ACCOUNT | Crear A/B; cambiar nombre/banco de B; archivar otra cuenta UAT de saldo cero. | Saldos iniciales y nombres coinciden. Archivar A con saldo se deniega sin efecto. | Bloqueada |
| UAT-5-CATEGORY | Crear categoría `UAT Synthetic expense`, editar nombre/color, eliminar otra sin referencias. | Catálogo persistido; categoría vinculada no se elimina. | Bloqueada |
| UAT-5-INCOME-EXPENSE | Registrar ingreso 10000 y gasto 2500 centavos con conceptos UAT y tarea/proyecto vinculados. | Diff muestra cuenta, importe, concepto y vínculos; saldos cambian exactamente +10000/−2500. | Bloqueada |
| UAT-5-TRANSFER | Transferir 12345 centavos A→B al mismo banco, luego usar otro banco y ACH al 5 bps. | Principal no cuenta como ingreso/gasto; comisión ACH 6 centavos afecta saldo e informe neto. No ejecutar una transferencia bancaria externa. | Bloqueada |
| UAT-5-TRANSACTION-UPDATE | Cambiar gasto UAT 2500→2000 con nueva propuesta; anular con razón `UAT Synthetic void`. | La UI y el recibo muestran corrección/anulación; se restituye saldo y reserva vinculada. Auditoría se conserva. | Bloqueada |
| UAT-5-BUDGET | Establecer base de mes actual 10000 centavos; añadir 2000; cambiar adición a 1500; eliminar adición. | Base y adición separadas, importes efectivos correctos al recargar get_budget. | Bloqueada |
| UAT-5-OBLIGATION | Crear obligación mensual UAT 10000 con reserva 10000, categoría del presupuesto; actualizar título; pagar 4000 y luego 6000. | Pago parcial/total y siguiente ocurrencia visibles; reserva disminuye; compromiso cubierto no se suma dos veces. | Bloqueada |
| UAT-5-INCOME-OCCURRENCE | Crear ingreso previsto once 1200; cobrarlo. | Ocurrencia pagada, cuenta +1200, ingreso recibido sin reserva de gasto. | Bloqueada |
| UAT-5-GOAL | Crear meta 50000, aportar 20000, gastar 12000 vinculado a meta y anular el gasto. | Reserva 20000→8000→20000; usado 0→12000→0; UI/lectura coinciden. | Bloqueada |
| UAT-5-CONTRIBUTION | En una meta UAT sin consumo, editar aporte 20000→18000 y revertirlo. | Reserva final cero, aporte anulado conserva trazabilidad. Una reserva consumida no se revierte completa. | Bloqueada |
| UAT-5-SETTINGS | Proponer zona válida, colchón 1000, ACH 5 bps y LBTR 100 centavos; revisar íntegro el resumen. | get_configuration refleja solo los ajustes aprobados; no cambia propietario ni permisos. | Bloqueada |
| UAT-5-LEGACY-TASK-SPEND | Crear gasto legado de tarea por 123 centavos y eliminarlo. | Bitácora/gasto de tarea muestra 1,23 unidades; no se confunde con movimiento del libro V2. | Bloqueada |

Precaución especial: ante timeout no repetir un movimiento suponiendo fallo; pedir get_execution_result y conservar propuesta/revisión/clave idempotente. Ante resultado incierto o diferente, detener ese caso, registrar el código y reportar sin datos reales. No habilitar SQL, importaciones o restauraciones para corregirlo.

## UAT-3-HUMAN — canal real de aprobación (prioridad máxima)

Fase: 3B. Estado: **bloqueada hasta desplegar instancia de desarrollo con 0008/0009 y configuración propia**. No depende de habilitar escrituras. Esta prueba sí requiere una persona y no puede sustituirse por los tests de firmas sintéticas.

- Requisitos/datos: seguir HUMAN_APPROVAL_SETUP.md; propietario con autenticador y credencial personalmente fijada. Única propuesta: crear `UAT Synthetic approval` sin datos reales.
- Pasos exactos: registrar candidato en `/approvals/enroll`, fijarlo administrativamente, preparar cambio desde ChatGPT, pedir enlace request_approval, abrirlo autenticado, comprobar diff/versión/huella y aprobar con el control del sistema.
- Esperado: get_approval_status indica APPROVED para esa huella; Site y search_tasks no muestran una tarea nueva. Pedir commit devuelve writes_disabled. La base solo contiene metadatos de aprobación.
- Denegación: cancelar el control del autenticador debe dejar la propuesta sin aprobar; sesión equivocada se deniega. No compartir credenciales/identificadores privados al reportar; no copiar claves del modelo. Las variantes criptográficas, CSRF, replay y versión están cubiertas automáticamente.
- Reportar: versión de desarrollo, navegador, tipo de autenticador (sin identificadores), estado/fecha y resultado aprobado/fallido. La aceptación se registrará sin fingir que ya ocurrió.

## Aceptación ampliada (fase 6)

Requisitos comunes: instancia privada de desarrollo con 0010 y flags indicados; solo datos ficticios. No exige habilitar negocio. Se prueban aquí integración/visualización reales; los límites, denegaciones, carreras y parser tienen regresiones automatizadas.

| Caso | Datos y pasos exactos | Resultado / persistencia / errores | Estado |
|---|---|---|---|
| UAT-6-DOCUMENT | Pedir inspect_attachment_context con texto `UAT Synthetic receipt`, o JSON vendor=UAT, occurred_on=hoy, currency=DOP, total_minor=100, line_items=[{description:UAT,amount_minor:90}]. | Devuelve dato no confiable, alerta de discrepancia y aprobación falsa; no crea movimiento ni propone arreglos automáticamente. No usar recibos reales. | Bloqueada hasta plugin de desarrollo |
| UAT-6-REPORT | Pedir get_financial_integrity_report para mes actual después de datos ficticios UAT del Site. | Comparar liquidez/compromisos con UI; indica ledger interno, no banco externo. Si cambia la base durante lectura, repetir; no declarar conciliación externa. | Bloqueada hasta plugin de desarrollo |
| UAT-6-IMPACT | Preparar gasto ficticio de 1000 centavos en cuenta UAT con saldo 100; abrir resumen sin aprobar. | Ver efectos antes/después por acción y saldo −900, alerta de negativo, reservas/compromisos y huella. Cancelar propuesta; el libro no cambia. | Bloqueada hasta instancia de desarrollo |
| UAT-6-RECOVERY | Después de la ejecución local aislada ya automatizada, consultar get_execution_result solo cuando exista recibo UAT en una entrega habilitada. | Muestra integridad actual y evidencia archivada; cambios posteriores no borran el historial COMMITTED. No repetir movimientos por timeout. | Bloqueada por ejecución real deshabilitada |
| UAT-6-HEALTH | Pedir get_change_plan_health en instancia de desarrollo. | Muestra límites y conteos propios sin títulos/documentos/credenciales. Las 31 lecturas siguen sin escribir ni hacer mantenimiento. | Bloqueada hasta plugin de desarrollo |
