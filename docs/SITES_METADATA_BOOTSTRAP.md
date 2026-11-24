# Instalación Sites con esquema y bootstrap separados

Entrega dependiente de #11, rama fix/mcp-schema-only-bootstrap, PR #12. El candidato a05433d se publicó en un Site privado nuevo. La corrección posterior de registro inicial 5359d43 pasó 146 pruebas/CI/clon y se publicó como versión 2/entorno 1 del mismo Site, con MCP provisionado y 48 tablas observadas; hashes de migraciones sin cambios. La interacción humana del autenticador y las llamadas autenticadas del nuevo plugin siguen pendientes; no se certifican por esa publicación.

## Conservación de migraciones

Los SQL originales 0000–0010 permanecen intactos. 0011 añade únicamente metadata_version INTEGER NOT NULL DEFAULT 0 a mcp_installation; snapshot/journal nuevos describen esa columna. No se reescribe historia ni se modifica el ledger de una instalación existente.

Para Sites se genera una **proyección de publicación**, derivada del commit público verificado: conserva todo el DDL y los 54 triggers; difiere únicamente al retirar las 21 instrucciones de metadatos conocidas de 0008/0010. No es otra fuente de código ni otra copia mantenida de las migraciones. La proyección exige que esas instrucciones coincidan con la inicialización/invalidación conocidas; rechaza DML de negocio, cambios de payload, tablas desconocidas y operaciones no admitidas. Los archivos 0000–0007 y todo archivo ya de esquema se copian byte a byte.

El árbol fuente original se conserva para compatibilidad D1/local. El árbol de publicación es nuevo, sin .git, datos ni identidad de otro Site. .openai/sites-migration-projection.json registra SHA público y hashes originales/proyectados; el commit privado de Sites identifica el artefacto exacto publicado. No confundir los dos SHAs, la versión Sites y el deployment.

## Bootstrap autenticado y atómico

Las 31 lecturas, la salud y GET de registro no inicializan nada. El **primer POST explícito de registro de autenticador o de preparación de una propuesta**, con propietario autenticado por Sites y política owner-only, ejecuta SQL fijo de metadatos en un único batch D1. El registro exige además origen exacto y CSRF. Ambos comparten la comprobación completa de tablas/triggers y el mismo bootstrap:

1. Crea un identificador aleatorio de instalación solo si falta; conserva uno existente y su revisión de negocio.
2. Invalida propuestas anteriores pendientes y retira aprobaciones/desafíos anteriores.
3. Limpia staging/leases/guardas anteriores; conserva tablas de negocio, recibos y evidencia histórica.
4. Registra un evento metadata_initialized y confirma metadata_version=1.

Cada instrucción de transición está condicionada a versión cero. Solicitudes concurrentes no repiten limpieza ni cambian identidad. Un fallo revierte todo el batch. Una versión futura se rechaza, nunca se degrada. Se verifican primero las tablas/columnas y los 54 triggers; no hay CREATE/ALTER en requests ni SQL elegido por el llamador.

Las nuevas propuestas incluyen metadataVersion=1 en su huella. Solicitar aprobación, aprobar y ejecutar rechaza payloads anteriores, incluso si un Worker viejo intentara persistirlos después del bootstrap. Las guardas de aprobación/commit también comprueban la versión dentro del batch. Los recibos históricos se consultan/verifican sin reautorizar ni repetir una ejecución.

Esto solo prepara infraestructura/metadatos; no aprueba propuestas ni activa negocio. Fábrica/transporte mantienen false. El informe ampliado de integridad se deniega con initialization_required antes del bootstrap; no escribe para inicializarse ni finge una revisión coherente inexistente. La salud muestra metadataReady=false para guiar el arranque. La configuración de solo ampliaciones requiere haber inicializado metadatos mediante registro o preparación explícitos y autorizados; después pueden deshabilitarse propuestas.

## Preparar la fuente de una instancia nueva

1. Ejecutar la suite de AGENTS, incluida verify:sites. Commit/revisar y auditar el árbol público; no usar datos ni configuración personal.
2. Desde el checkout público limpio ejecutar `npm run prepare:sites -- <ruta-absoluta-nueva-dentro-de-work>`. La utilidad exporta HEAD con git archive, comprueba fuente/symlinks, genera la proyección y deja project_id=null. No sobrescribe directorios ni modifica los SQL originales.
3. Usar esa carpeta como --template-source del helper oficial de Sites al iniciar una instalación. Reutilizar el project_id ya creado; no crear otro para corregir código. Para actualizar este mismo candidato ya desplegado, comprobar que sus hashes de migraciones coinciden antes de transferir código al checkout privado; conservar su manifiesto e historial propios. Una representación previa distinta requiere el procedimiento de upgrades. Mantener variables propias fuera de GitHub.
4. En el checkout privado de publicación, verificar `npm run verify:hosting`: debe devolver schema_only_candidate sin instrucciones fuera de esquema. No ejecutar audit:public sobre un manifiesto privado para luego relajar el auditor compartido; la fuente pública ya debe haber pasado la auditoría.
5. Instalar dependencias cuando cambien y construir/empaquetar con el helper de Sites; publicar solo el artefacto corregido correspondiente al commit privado exacto, con audiencia owner-only. El resultado nativo debe confirmar migración/deployment; el gate local no prueba aceptación del backend.
6. Conectar el plugin de desarrollo y comprobar 31 lecturas sin filas creadas. Consultar salud (metadataReady=false antes del primer bootstrap). Continuar HUMAN_APPROVAL_SETUP para registrar personalmente una credencial **antes** de preparar una propuesta; su POST debe inicializar metadatos y devolver opciones de autenticador. GET y denegaciones no lo hacen. La clave solo es candidata, nunca confianza automática. Preparar después una tarea UAT ficticia sin ejecutarla y comprobar metadataReady=true/estado del plan; ninguna tarea debe persistirse. El modelo nunca fija una clave propia.

## Upgrades y reversión

Esta automatización de exportación está marcada freshInstallationOnly. No actualiza una instalación personal ni presume el estado de su D1. Para una instalación de main fase 2, los SQL 0000–0007 son idénticos; el propietario debe verificar ledger/backup, autorizar la actualización, deshabilitar propuestas y drenar requests antes del flujo soportado. Una instalación experimental que ya aplicó SQL completo 0008–0010 requiere inspección administrativa de hashes/estado antes de adoptar otra representación: no repetir SQL ni falsificar el ledger. La utilidad no cambia nada en ella.

El rollback vuelve a un código verificado con flags apagados, conserva la columna/tablas y evidencia y no restaura D1. El bootstrap de versión 1 no se deshace automáticamente. La adopción de un contrato posterior requiere una migración/transición explícita revisada; no un número elegido por el modelo.

## Evidencia requerida

Pruebas versionadas comparan esquema/triggers de ambas cadenas, preservación byte a byte de 0000–0007, rechazo de DML desconocido, lecturas sin bootstrap, 20 preparaciones concurrentes, fallo/rollback, preservación de negocio/revisión/recibos y rechazo de versiones antiguas/futuras. La regresión del registro inicial reproduce el 503 reportado antes de la primera propuesta; prueba inscripción sintética sin confianza, identidad estable, denegaciones sin efectos y rollback. verify:sites comprueba ese orden real de arranque en el Worker compilado, además de las 31 lecturas y QA. Publicación, identidad alojada y autenticador humano siguen siendo verificaciones separadas.
