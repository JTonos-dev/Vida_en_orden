# Roadmap MCP

Este documento conserva el plan real de siete fases del plan maestro y separa el estado del código de cualquier promesa futura.

El endurecimiento de GitHub, la guía de portabilidad y la prueba de instalación independiente son infraestructura de colaboración. No avanzan ni completan ninguna fase funcional del MCP.

| Fase | Alcance | Estado verificable | Siguiente criterio de aceptación |
|---|---|---|---|
| 0 | Auditoría, inventario, backup, recuperación, matriz de paridad y amenazas | Documentada y cubierta por el código de prueba; cada instalación debe repetir la parte operativa. | Repetir auditoría y recuperación en cada instalación antes de cambios sensibles. |
| 1 | Servidor MCP, identidad, owner-only, transporte y lecturas iniciales | Completada. | Mantener compatibilidad de las nueve herramientas iniciales. |
| 1.1 | Compatibilidad con el transporte moderno, headers, notificaciones, límites y conformance | Implementada en el código transferido. | Ejecutar la suite MCP en cada PR. |
| 2 | Paridad integral de lecturas, relaciones, finanzas, agenda, bitácora, configuración y paginación | Implementada; las 31 herramientas se ejecutaron localmente con fixtures y mediante el plugin de una instalación nueva con D1 vacía. | Cada instalación debe repetir las pruebas y comparar lecturas con registros propios frente a su interfaz. |
| 3 | Motor de propuestas, diff, huella, aprobación humana autenticada, caducidad e idempotencia | Motor/transporte publicados; registro humano y clave pública propia configurados, plugin autenticado/31 lecturas/health/idempotencia verificados. Firma de propuesta pendiente. | Demostrar firma humana vinculada al diff/huella y revisar habilitación antes de ejecutar negocio. |
| 4 | Escrituras no financieras: tareas, áreas, proyectos, planificación y bitácora | 19 adaptadores y reversión probados en aislamiento; transporte preparado, ejecución real cerrada. | Aceptación funcional después del canal humano y de una habilitación revisada. |
| 5 | Escrituras financieras y relaciones cruzadas | 24 adaptadores R2 y pruebas contables implementados en aislamiento; aceptación/ejecución real pendientes. | Pruebas contables, no doble conteo, concurrencia, reversión y reconciliación. |
| 6 | Adjuntos interpretados, informes ampliados y endurecimiento operativo | Texto/CSV/JSON, informe interno, límites, evidencia y recuperación implementados; binarios/OCR no disponibles, carga y cuotas alojadas pendientes. | Aceptación de los informes/adjuntos en ChatGPT y validación operativa del host. |
| 7 | Cierre documental, publicación, conexión y pruebas end-to-end | 146 pruebas, Worker/D1, ORM, instalación GitHub, CI y guías aprobados. Dependencias sin alertas. Site privado versión 2/entorno 2,48 tablas; registro humano y44 herramientas conectadas,31 lecturas verificadas. | Firma de propuesta, aceptación de ejecución futura y revisión del mantenedor pendientes. No se declara completada. |

## Dependencias

El saneamiento del historial fue preparado y ensayado localmente; el responsable suspendió su sustitución. La exposición remota/de cachés sigue abierta. No se declara cerrada por haber saneado HEAD ni por crear una copia local limpia. Ver `HISTORY_SANITIZATION_PLAN.md`; conservar ese riesgo sin reiniciar el reemplazo.

La fase 3 depende de una aprobación humana demostrable en la plataforma. Las fases 4 y 5 dependen de la fase 3 y de servicios de dominio transaccionales. La fase 6 depende de límites de archivos y permisos verificables del host. La fase 7 no convierte ninguna fase pendiente en terminada.

## Ejecución vigente

El PR #12 implementa proyección de esquema y bootstrap autenticado; originales conservados y nueva 0011. El 503 del registro inicial se corrigió en 5359d43 con tres regresiones nuevas,146 pruebas/CI/clon aprobados. Reintento humano y conexión del plugin ya verificados; firma de propuesta pendiente según DEVELOPMENT_PROGRESS. El propietario no necesita investigar un mecanismo SQL administrativo ni crear otra credencial/instancia.

El responsable autoriza las fases 3–7 en ramas dependientes. La exposición histórica sigue abierta; no se continúa la sustitución del repositorio y no bloquea este desarrollo. Se implementan y prueban componentes aislados sin habilitar escrituras reales. El seguimiento reproducible y los bloqueos están en `DEVELOPMENT_PROGRESS.md` y las pruebas humanas en `USER_ACCEPTANCE_TESTS.md`.
