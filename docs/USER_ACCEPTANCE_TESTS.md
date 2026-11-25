# Pruebas funcionales del propietario

Estado inicial: pendientes de entregas de desarrollo. Usar exclusivamente una instancia de pruebas independiente y datos ficticios. No ejecutar casos de escritura en la instalación personal ni habilitar una compuerta de seguridad para saltarse un bloqueo.

Los casos cubiertos por tests automatizados se documentarán como evidencia técnica; el propietario solo debe comprobar interacción real de plataforma y aceptación funcional que esos tests no pueden demostrar.

| Caso | Fase | Estado | Requisitos y pasos | Resultado y persistencia | Denegaciones y precauciones |
|---|---|---|---|---|---|
| UAT-AUTH-01: propietario conectado | 3 | Pendiente | Plugin de desarrollo, owner policy propia; solicitar capacidades y perfil. | Identidad propia, lecturas disponibles; ejecución real permanece deshabilitada. | Otra identidad debe ser rechazada; no compartir secretos ni introducir IDs de otra instalación. |
| UAT-APPROVAL-01: aprobación humana real | 3 | Bloqueada hasta desplegar desarrollo | Preparar una propuesta ficticia y abrir su pantalla de aprobación. Comprobar diff, revisión y caducidad. Accionar personalmente el control de verificación. | Evidencia vinculada al digest/revisión; nunca aprobación automática por texto o por el agente. Consultar estado persistido. | Cancelar/verificación fallida/vencimiento deben impedir ejecución. No se considera verificado por un simulador. |
| UAT-SAFETY-01: compuerta cerrada | 3 | Pendiente | Solicitar ejecutar una propuesta en una instancia sin canal aprobado. | Denegación explícita, sin cambios de negocio. | No cambiar configuración para forzar el resultado. |

Se ampliará cada entrega con datos, pasos y verificación persistida concretos. Una prueba permanece pendiente o bloqueada hasta que el propietario reporte su resultado; no se marcará aprobada por inferencia.
