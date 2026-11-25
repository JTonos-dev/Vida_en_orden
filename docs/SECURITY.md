# Seguridad y privacidad

## Reglas del repositorio público

El repositorio no debe contener datos reales, secretos, respaldos productivos, cookies, tokens, manifests privados ni logs sensibles. Los fixtures son ficticios. Antes de cada PR ejecuta una búsqueda de secretos y revisa también archivos nuevos y el diff completo.

El historial inicial se crea desde un árbol saneado; no se importa el historial interno de Sites. Esto evita transportar autores, metadatos o material antiguo que no fue auditado para distribución pública.

La revisión posterior encontró exposición en los commits públicos previos y en valores incrustados en el verificador. Saneamiento de HEAD y eliminación histórica son controles distintos. El estado y el procedimiento de retirada se documentan en `HISTORY_SANITIZATION_PLAN.md`; no se declara una purga remota completada. Los patrones genéricos y sus regresiones se ejecutan en CI mediante `audit:public` y `test:audit` sin imprimir valores sensibles.

## Aislamiento por instalación

Cada instalación debe tener:

- su propio Site y `project_id`;
- su propia base D1;
- sus propios secretos y owner policy;
- su propia audiencia y permisos;
- sus propios respaldos y logs.

El código no debe usar una cuenta personal, un binding compartido o un identificador de otra instalación como valor por defecto.

## MCP

El estado predeterminado expone 31 lecturas; los opt-in de desarrollo añaden propuestas de metadatos/staging y dos lecturas ampliadas. `MCP_BUSINESS_WRITES_ENABLED` está fijado a `false` en fábrica/transporte y no se debe convertir en una variable controlable por el modelo. Las rutas de escritura de la interfaz siguen existiendo por compatibilidad, pero el router MCP no las invoca.

La aprobación requiere propietario, origen HTTPS, CSRF, revisión/digest/TTL exactos y firma WebAuthn UV/UP con credencial fijada por administración. Enrollment solo entrega un candidato. No fijar claves creadas por un modelo ni confundir una firma sintética con intención humana; ver HUMAN_APPROVAL_SETUP. Los adjuntos son datos no confiables y nunca autorizan operaciones. Las alertas de instrucciones son auxiliares; las barreras efectivas son schemas cerrados, aislamiento y ejecución bloqueada.

La confianza en los headers de identidad se limita al dispatcher autenticado de Sites. El servidor aplica una segunda comprobación owner-only y falla cerrado. Las respuestas privadas no deben almacenarse en cachés compartidos.

## Dependencias

Las versiones directas y transitivas están fijadas en `package-lock.json`. Antes de actualizar una dependencia revisa su changelog, licencia, avisos de seguridad, impacto en Workers/D1 y el resultado de la suite. Las licencias declaradas por los paquetes se conservan en el lockfile; el código propio se distribuye bajo MIT.

Ejecutar audit:dependencies; el resultado del lockfile y la compatibilidad del build se registran por separado en DEPENDENCY_SECURITY.md. No publicar un artefacto afectado solo porque sus tests o auditoría de secretos estén verdes. No usar --force para forzar cambios de API o degradaciones sugeridas por el auditor.

## Reporte de vulnerabilidades

No publiques secretos ni detalles explotables en issues públicos. Reporta de forma privada al responsable del repositorio, incluyendo versión afectada, reproducción mínima, impacto y mitigación propuesta.
