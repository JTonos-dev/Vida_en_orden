# Informe de desarrollo de fases 3–7

Fecha: 24 de noviembre de 2026. Estado: implementación en PR dependientes; verificación local aprobada, CI/clon/host en cierre. No es una publicación productiva ni aceptación funcional final. El orden, commits y resultados por entrega se mantienen en [DEVELOPMENT_PROGRESS.md](DEVELOPMENT_PROGRESS.md).

## Inventario y cobertura

| Fase | Código entregado | Estado y límite |
|---|---|---|
| 3 | Motor inmutable, diff/impacto, identidad/huella, caducidad, replay/idempotencia, concurrencia, aprobación WebAuthn, batch atómico, auditoría y verificación | Implementado y probado en aislamiento. Interacción humana/host pendientes. Ejecución real MCP deshabilitada |
| 4 | 19 acciones no financieras y reversión por recibo | Cubren operaciones reales de los servicios actuales; aceptación alojada pendiente |
| 5 | 24 acciones financieras, validación contable, anulaciones/aportes, reservas y vínculos | Probadas solo con datos ficticios/D1 aislada; ninguna operación bancaria ni movimiento real |
| 6 | Adjuntos texto/CSV/JSON, informe interno, límites, evidencia/revocación, salud y recuperación | Implementado en el alcance disponible; sin binarios/OCR ni carga alojada verificada |
| 7 | Integración Worker/D1, migraciones/ORM, compatibilidad, CI, documentación y UAT | Cierre técnico en curso; aceptación final y revisiones externas pendientes |

La [matriz de paridad](MCP_PARITY_MATRIX.md) enumera acciones exactas, herramientas y excepciones. No se declara 100% del objetivo aspiracional: split/reconciliación, CRUD de conceptos, archivo de obligaciones/metas, reasignación genérica de reservas, importación/restauración MCP y otras operaciones ausentes de la aplicación no se inventan. No se permite SQL/CRUD genérico para cubrir esos huecos.

Las 31 lecturas anteriores conservan contrato y anotaciones y no escriben. Los opt-in permiten 33/42/44 herramientas según flags; solo metadatos/staging de propuestas son mutables. La ejecución de negocio está bloqueada por constantes en dos capas, aun con aprobación válida. Los adaptadores y el executor se prueban con una compuerta exclusiva del constructor de pruebas, sin ruta de activación desde el transporte/entorno productivo.

## Pruebas y publicación

PR #4–#9 abiertos con CI satisfactorio y sin revisiones humanas. No hubo merges, force-push, cambios de protecciones, despliegues o migraciones de instalaciones personales. Entrega #9 aprobó 130 pruebas y todas sus comprobaciones. En el cierre local: 137 pruebas (14 financieras, 119 MCP, cuatro de auditoría), npm ci, TypeScript, lint sin errores (cuatro advertencias previas), verify:schema, build, audit:public (250 archivos sin hallazgos), verify:independent (once migraciones/48 tablas) y verify:worker aprobados. Este último pasó las 31 lecturas y sus controles de aprobación/denegación, además de 27 comprobaciones API/UI. El PR de cierre incorporará resultados de CI/clon GitHub; consultar el seguimiento para su estado exacto.

Los comandos reproducibles están en AGENTS.md. verify:schema comprueba cero migraciones generadas en copia temporal. verify:independent aplica 0000–0010 en D1 temporal. verify:worker ejecuta las 31 lecturas, aprobación criptográfica sintética/denegaciones y 27 comprobaciones de API/UI sobre el build real y D1 local. Los tests no usan una base remota ni credenciales de una instalación.

## Aceptación personal y bloqueos

El propietario debe ejecutar únicamente los casos de integración humana/plataforma de [USER_ACCEPTANCE_TESTS.md](USER_ACCEPTANCE_TESTS.md), empezando por UAT-3-HUMAN: acceso owner-only, registro legítimo de su autenticador, fijación administrativa, revisión de diff y firma física de una propuesta. La propuesta puede quedar APPROVED sin crear negocio; commit debe seguir devolviendo writes_disabled. No pedirle repetir pruebas automáticas de carreras, rollback o firmas.

Los casos financieros y de ejecución real están bloqueados hasta demostrar ese canal y revisar una habilitación explícita posterior. No modificar una instalación personal para desbloquearlos. La guía incluye datos ficticios, pasos, resultado persistido, errores, precauciones y estado; ninguno se marca aprobado sin reporte del propietario.

Compatibilidad alojada de migraciones, cuota de D1/Sites, revisión del mantenedor y política de retención siguen pendientes. [HUMAN_APPROVAL_SETUP.md](HUMAN_APPROVAL_SETUP.md) documenta qué se investigó oficialmente y la alternativa segura; no se presupone una API de aprobación de ChatGPT. Las firmas sintéticas no prueban intención de una persona ni certifican hardware.

## Actualización y seguridad restante

Seguir [UPGRADE_AND_ROLLBACK.md](UPGRADE_AND_ROLLBACK.md): integración ordenada, commit verificado, respaldo propio/restauración aislada, deshabilitar propuestas y drenar requests, migrar solo por mecanismo soportado y comprobar versión/esquema. 0010 invalida planes antiguos sin tocar negocio. Rollback ordinario vuelve al código anterior con flags apagados y conserva tablas/evidencia; no restaura D1 automáticamente.

La instancia independiente existente permanece fase2/31 lecturas/ejecución deshabilitada y sin incidencias referenciales en la comprobación de solo lectura. No se reutilizan sus datos/credenciales/configuración para desarrollar. El histórico público, PR antiguos, forks y cachés siguen siendo un riesgo abierto; el responsable suspendió su reemplazo y este desarrollo no declara retirada definitiva.
