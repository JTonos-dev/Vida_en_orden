# Roadmap MCP

Este documento conserva el plan real de siete fases del plan maestro y separa el estado del código de cualquier promesa futura.

El endurecimiento de GitHub, la guía de portabilidad y la prueba de instalación independiente son infraestructura de colaboración. No avanzan ni completan ninguna fase funcional del MCP.

| Fase | Alcance | Estado verificable | Siguiente criterio de aceptación |
|---|---|---|---|
| 0 | Auditoría, inventario, backup, recuperación, matriz de paridad y amenazas | Documentada y cubierta por el código de prueba; cada instalación debe repetir la parte operativa. | Repetir auditoría y recuperación en cada instalación antes de cambios sensibles. |
| 1 | Servidor MCP, identidad, owner-only, transporte y lecturas iniciales | Completada. | Mantener compatibilidad de las nueve herramientas iniciales. |
| 1.1 | Compatibilidad con el transporte moderno, headers, notificaciones, límites y conformance | Implementada en el código transferido. | Ejecutar la suite MCP en cada PR. |
| 2 | Paridad integral de lecturas, relaciones, finanzas, agenda, bitácora, configuración y paginación | Implementada; las 31 herramientas se ejecutaron localmente con fixtures y mediante el plugin de una instalación nueva con D1 vacía. | Cada instalación debe repetir las pruebas y comparar lecturas con registros propios frente a su interfaz. |
| 3 | Motor de propuestas, diff, huella, aprobación humana autenticada, caducidad e idempotencia | Motor, transporte opt-in y canal WebAuthn implementados; pruebas humanas/alojadas pendientes. | Probar transporte, canal humano real y atomicidad D1 antes de habilitar ejecución. |
| 4 | Escrituras no financieras: tareas, áreas, proyectos, planificación y bitácora | 19 adaptadores y reversión implementados en aislamiento; transporte y aceptación pendientes. | Atomicidad, rollback y paridad con servicios existentes. |
| 5 | Escrituras financieras y relaciones cruzadas | 24 adaptadores R2 y pruebas contables implementados en aislamiento; aceptación/ejecución real pendientes. | Pruebas contables, no doble conteo, concurrencia, reversión y reconciliación. |
| 6 | Adjuntos interpretados, informes ampliados y endurecimiento operativo | Texto/CSV/JSON, informe interno, límites, evidencia y recuperación implementados; binarios/OCR y validación de host pendientes. | Seguridad ante prompt injection, observabilidad, carga y manejo de datos incompletos. |
| 7 | Cierre documental, publicación, conexión y pruebas end-to-end | Integración Worker/D1, migraciones/ORM, CI y guías implementadas; instalación desde GitHub/host y aceptación humana en verificación. | Otro agente debe instalar, conectar su propio Site/plugin y repetir las pruebas sin la conversación original. No se declara aceptación final. |

## Dependencias

El saneamiento del historial fue preparado y ensayado localmente; el responsable suspendió su sustitución. La exposición remota/de cachés sigue abierta. No se declara cerrada por haber saneado HEAD ni por crear una copia local limpia. Ver `HISTORY_SANITIZATION_PLAN.md`; conservar ese riesgo sin reiniciar el reemplazo.

La fase 3 depende de una aprobación humana demostrable en la plataforma. Las fases 4 y 5 dependen de la fase 3 y de servicios de dominio transaccionales. La fase 6 depende de límites de archivos y permisos verificables del host. La fase 7 no convierte ninguna fase pendiente en terminada.

## Ejecución vigente

El responsable autoriza las fases 3–7 en ramas dependientes. La exposición histórica sigue abierta; no se continúa la sustitución del repositorio y no bloquea este desarrollo. Se implementan y prueban componentes aislados sin habilitar escrituras reales. El seguimiento reproducible y los bloqueos están en `DEVELOPMENT_PROGRESS.md` y las pruebas humanas en `USER_ACCEPTANCE_TESTS.md`.
