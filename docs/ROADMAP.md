# Roadmap MCP

Este documento conserva el plan real de siete fases del plan maestro y separa el estado del código de cualquier promesa futura.

| Fase | Alcance | Estado verificable | Siguiente criterio de aceptación |
|---|---|---|---|
| 0 | Auditoría, inventario, backup, recuperación, matriz de paridad y amenazas | Documentada y cubierta por el código de prueba; cada instalación debe repetir la parte operativa. | Repetir auditoría y recuperación en cada instalación antes de cambios sensibles. |
| 1 | Servidor MCP, identidad, owner-only, transporte y lecturas iniciales | Completada. | Mantener compatibilidad de las nueve herramientas iniciales. |
| 1.1 | Compatibilidad con el transporte moderno, headers, notificaciones, límites y conformance | Implementada en el código transferido. | Ejecutar la suite MCP en cada PR. |
| 2 | Paridad integral de lecturas, relaciones, finanzas, agenda, bitácora, configuración y paginación | Implementada en el código transferido; contiene 31 herramientas. | Validar cada herramienta en una nueva instalación y comparar con su interfaz. |
| 3 | Motor de propuestas, diff, huella, aprobación humana autenticada, caducidad e idempotencia | No iniciada. Solo existen tipos futuros; no hay herramientas de escritura. | Demostrar que ninguna ruta puede escribir sin aprobación verificable. |
| 4 | Escrituras no financieras: tareas, áreas, proyectos, planificación y bitácora | No iniciada. | Atomicidad, rollback y paridad con servicios existentes. |
| 5 | Escrituras financieras y relaciones cruzadas | No iniciada. | Pruebas contables, no doble conteo, concurrencia, reversión y reconciliación. |
| 6 | Adjuntos interpretados, informes ampliados y endurecimiento operativo | No iniciada. | Seguridad ante prompt injection, observabilidad, carga y manejo de datos incompletos. |
| 7 | Cierre documental, publicación, conexión y pruebas end-to-end | Parcial: este repositorio cubre la transferencia y documentación; falta validar una segunda instalación independiente. | Otro agente debe instalar, conectar su propio Site/plugin y repetir las pruebas sin la conversación original. |

## Dependencias

La fase 3 depende de una aprobación humana demostrable en la plataforma. Las fases 4 y 5 dependen de la fase 3 y de servicios de dominio transaccionales. La fase 6 depende de límites de archivos y permisos verificables del host. La fase 7 no convierte ninguna fase pendiente en terminada.

## Orden recomendado para continuar

1. Crear una instalación independiente con D1 de prueba usando solo este repositorio.
2. Validar las 31 herramientas y el aislamiento con identidad ficticia.
3. Abrir un PR de endurecimiento de contratos/documentación si aparece una diferencia.
4. Diseñar la fase 3 sin activar escrituras.
5. Solo después de aprobar el diseño, implementar y probar el motor de propuestas.
