# Actualización y reversión de fases 3–7

Esta entrega es código en PR dependientes; no autoriza actualizar una instalación personal. Ejecutar primero en una instancia privada de desarrollo con datos ficticios. Cada instalación administra sus propios recursos y versiones; GitHub no despliega otros Sites.

## Seleccionar y comprobar la versión

1. Revisar/integrar #4 → #5 → #6 → #7 → #8 → #9 → PR de cierre. Los PR tienen base main por permisos del oficial y sus diffs son acumulativos; el cuerpo de cada PR identifica el delta y dependencia. No fusionar fuera de orden ni usar force-push. El mantenedor debe exigir CI verde y revisión humana y repetir los checks después de resolver conflictos.
2. Usar un clon limpio del oficial integrado o del commit exacto del fork aprobado. No copiar `.git`, configuración, D1, credenciales ni archivos ignorados de una instalación anterior. La historia pública aún contiene exposición conocida: no tratar el clon como historia purgada.
3. Node >=22.13, npm ci; test:finance, test:mcp, test:audit, audit:public, tsc --noEmit, lint, verify:schema, build, verify:independent y verify:worker. Los últimos dos requieren el build. No aplicar SQL generado inesperadamente: verify:schema debe indicar cero cambios.
4. Conservar el manifiesto público con marcador. Crear un checkout privado de publicación desde ese commit; configurar únicamente su propio project_id. Ver NEW_INSTANCE_GUIDE y flujo oficial de Sites. La configuración privada no se devuelve al PR.

## Matriz de compatibilidad

| Código | Base mínima | Propuestas | Observación |
|---|---|---|---|
| Main fase 2 | 0000–0007 | No | 31 lecturas, sin nueva infraestructura |
| Motor #5–#7 | Hasta 0008 | Solo pruebas internas | No exponer transporte incompleto |
| Canal #8 | Hasta 0009 | Desarrollo opt-in | Sin evidencia durable del endurecimiento |
| Endurecimiento/cierre #9+ | Hasta 0010 | Desarrollo opt-in | Falla cerrado si falta instalación, tablas o cualquiera de los 54 triggers |

El código nuevo con flags ausentes conserva las 31 lecturas. Una base sin infraestructura completa no habilita propuestas; no se crean tablas/triggers en un request para ocultar una migración omitida.

## Migrar una instalación existente (solo con autorización específica)

1. Inventariar código, versión Sites, origen, variables privadas y migraciones efectivamente aplicadas. No deducir el estado de D1 desde el SHA o un despliegue fallido.
2. Exportar un respaldo propio por el procedimiento de MCP_BACKUP_RECOVERY; conservarlo fuera de Git y comprobar restauración en otra D1 aislada. Conservar código/versión y configuración anterior para rollback. No mostrar el respaldo al modelo ni cargarlo al repositorio.
3. Deshabilitar propuestas, drenar requests y coordinar una ventana sin escrituras de UI. 0010 invalida propuestas PENDING/APPROVED antiguas, retira sus aprobaciones y limpia staging; después deben prepararse nuevas propuestas. No toca cuentas, saldos ni entidades de negocio.
4. Verificar qué migraciones acepta/aplica el host. Sites documenta migraciones de esquema; 0008 contiene inicialización de instalación y triggers y 0010 mantenimiento de metadatos. La compatibilidad de ese flujo debe demostrarse en un Site privado nuevo antes de actualizar otro. Si el host rechaza SQL o su estado es incierto, detener esa actualización, conservar los IDs/diagnóstico privados y usar soporte o un procedimiento administrativo admitido. No omitir triggers, modificar SQL ya aplicado ni crear un endpoint SQL para avanzar.
5. Aplicar exclusivamente las migraciones pendientes en orden, por el mecanismo administrativo soportado del host. No ejecutar migrate:fresh/DROP/restauración ni repetir SQL a ciegas. Sites puede aplicar migraciones antes de fallar el upload del Worker.
6. Publicar el artefacto exacto verificado y comprobar owner-only, 31 lecturas sin efectos, referencias y concordancia de UI. Los flags opt-in y el canal humano se configuran después según HUMAN_APPROVAL_SETUP. La constante de ejecución continúa false.
7. Registrar versión, SHA, migraciones, resultado y rollback de **esa** instalación privadamente. Nunca publicar su identidad, correo, credenciales ni datos.

## Rollback y recuperación

Volver al código/versión de Sites previamente verificado con flags de propuestas desactivados. Conservar las tablas aditivas y triggers: no borrar D1 ni deshacer migraciones automáticamente. El rollback de código no restaura datos ni reactiva propuestas invalidadas; las operaciones UI posteriores siguen siendo datos propios de la instalación.

Si alguna ejecución futura devuelve timeout, consultar get_execution_result con la propuesta/revisión y clave idempotente originales antes de intentar otra operación. Un recibo COMMITTED es histórico; la verificación posterior distingue filas que cambiaron después. Las reversiones no financieras preparan una nueva propuesta desde un recibo y exigen aprobación; las financieras usan anulación/reversión del dominio, nunca parches de filas ni borrado de auditoría.

Si se sospecha daño de datos, detener escrituras de esa instalación, preservar evidencia privada y decidir recuperación con su propietario. Una restauración productiva exige autorización explícita y respaldo probado; no es parte del rollback ordinario de esta entrega.
