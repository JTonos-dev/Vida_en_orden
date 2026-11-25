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
