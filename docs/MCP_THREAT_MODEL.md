# Vida en Orden — modelo de amenazas MCP

| Riesgo | Severidad | Control actual | Trabajo pendiente |
|---|---|---|---|
| Escritura directa desde MCP | Crítica | El router MCP solo registra herramientas de lectura y `MCP_BUSINESS_WRITES_ENABLED=false`. | Diseñar un único executor aprobado antes de la fase 3. |
| Identidad manipulada por el modelo | Crítica | La autorización usa headers de Sites y política owner-only; los argumentos no eligen propietario. | Repetir prueba con una segunda instalación. |
| Lectura con efectos secundarios | Alta | `read-service` usa consultas acotadas y no inicializa defaults ni llama `/api/action`. | Añadir pruebas de regresión para cada nueva consulta. |
| Replay o concurrencia en futuras escrituras | Crítica | No hay escrituras MCP habilitadas. | Propuesta inmutable, digest, caducidad, idempotencia y revalidación. |
| Doble contabilización | Crítica | Las lecturas reutilizan los cálculos financieros existentes y exponen componentes separados. | Pruebas de escritura y reconciliación en fase 5. |
| Relaciones huérfanas | Alta | `validate_references` diagnostica tareas, proyectos, movimientos, obligaciones y metas. | Añadir constraints o validación transaccional antes de escrituras. |
| Mezcla de scopes | Crítica | Datos privados filtran por propietario; tareas/áreas/proyectos usan el scope compartido definido. | Probar aislamiento entre dos instalaciones/identidades. |
| Restauración destructiva | Crítica | Restauración MCP no existe; los respaldos no se almacenan en el repositorio. | Dry-run, backup automático, rollback y aprobación reforzada. |
| Secretos en repositorio | Alta | Manifiesto público usa marcador; CI busca patrones comunes; secretos se configuran en Sites. | Añadir scanner externo si el repositorio adopta uno. |
| Prompt injection en datos | Alta | Los datos no autorizan herramientas y schemas son cerrados. | Diseñar controles adicionales al procesar adjuntos en fase 6. |
| Exposición excesiva | Alta | Límites, paginación, scopes y campos seleccionados. | Revisar carga y límites cuando crezca la base. |
| Dependencias vulnerables | Media/Alta | Versiones fijadas en lockfile y CI ejecuta build/test. | Revisar advisories y licencias en cada actualización. |

## Criterio de bloqueo

No iniciar la fase 3 si una herramienta MCP puede alcanzar una escritura de negocio sin pasar por un mecanismo de aprobación verificable. No iniciar la fase 5 sin pruebas de saldo, presupuesto, obligaciones, metas, cargos, anulaciones, idempotencia y concurrencia.
