# Issue #13 — respaldo, restauración y ensayo de 0012

Corte: 24 de noviembre de 2026 (convención documental del proyecto: America/Santo_Domingo; etiqueta aclarada tras revisión del PR #14, sin modificar fechas ni registros). Base oficial: `767f71fcd220e8e5c5b1214ca92248e34ba958d3`, PR #4–#12 integrados. El mantenedor aprobó la corrección del PR #12 sobre `d2f48c9`; CI posterior a main [45526085881](https://github.com/JorgeTonos28/Vida_en_orden/actions/runs/45526085881) satisfactorio. La aprobación del código no autoriza despliegues ni ejecución MCP. Seguimiento: [issue #13](https://github.com/JorgeTonos28/Vida_en_orden/issues/13).

## Resultado y alcance

**Ensayos locales aprobados; actualización del Site de desarrollo todavía bloqueada por respaldo nativo/ledger y pendiente de autorización administrativa específica.** No se publicó código, guardó versión, cambió configuración/audiencia/clave ni aplicó SQL en ningún Site. La instalación personal no se consultó ni modificó. La ejecución MCP sigue deshabilitada en fábrica y transporte.

| Comprobación | Evidencia observada | Alcance |
|---|---|---|
| Identidad y acceso | Site de desarrollo versión 2, entorno revisión 2; acceso exclusivo del propietario, sin grupos/externos. Perfil MCP coincide con el propietario de la credencial fijada. Configuración redactada idéntica antes/después. | Alojado, sin cambios |
| Lecturas MCP | 31 invocadas: 22 respuestas válidas, nueve `not_found` esperados con identificadores ficticios inexistentes. Catálogo opt-in 44, `businessWritesEnabled=false`; referencias válidas, cero entidades de negocio. | Alojado, código anterior `5359d43` |
| Compuerta | Una nueva llamada al commit de la propuesta histórica devuelve `writes_disabled`. No nueva firma ni propuesta en el host. | Alojado; la firma original ya estaba verificada |
| Inventario y captura | Dos pasadas completas de las 48 tablas de usuario, con columnas/filas sin omisiones; 18 filas en nueve tablas de metadatos, cero negocio/staging/ejecuciones. Comparación canónica igual entre pasadas. | Copia lógica; no snapshot atómico |
| Campos recortados | Sites recorta los dos payloads de propuestas. Se recuperan por lectura MCP tipada del propietario, verificando identidad/revisión/owner y SHA-256 del dominio de propuesta. Se conserva el estado almacenado, aunque MCP calcule `EXPIRED` por TTL. Ningún otro valor recortado aceptado. | Captura lógica completa de tablas de usuario observables |
| Protección de la copia | Cifrado DPAPI CurrentUser, directorio limitado al usuario/SYSTEM, fuera de Git. Dos archivos cifrados iguales en el mismo dispositivo; descifrado y comparación byte a byte aprobados. | Protección local; falta copia separada recuperable |
| Procedencia del esquema | Commit privado coincide con la versión nativa del Site; se verifican los 12 hashes de SQL proyectados 0000–0011 contra su manifiesto privado. | Esquema reconstruido de fuente; no inspección del DDL/ledger nativo |
| Restauración aislada | La copia descifrada se restaura en SQLite exclusivamente en memoria. Inventario exacto, comparación de todas las filas, `foreign_key_check` e `integrity_check=ok`. 48 tablas/54 triggers; identidad, revisión de negocio 0 y metadata_version=1 conservadas. | Local; no restauración en servicio D1 remoto |
| Evidencia WebAuthn | Firma archivada revalidada criptográficamente con clave pública fijada, propietario, origen y desafío; digest consistente, nonce consumido y fecha de firma dentro del TTL original. | Local sobre evidencia alojada capturada; no nueva aprobación ni certificación del candidato alojado |
| Upgrade 0011→0012 | Solo índice `audit_log_seed_context_idx`, columnas exactas owner/entity_type/entity_id/action/id. Todas las filas y los 54 triggers iguales antes/después. Medición local: 0,1583 ms; 565.248→569.344 bytes (+4.096). | SQLite en memoria, auditoría de negocio vacía; no extrapolar al host |
| MCP sobre copia restaurada | Transporte actual: 31 lecturas (22 válidas/nueve esperadas), denegaciones 401/403, sin cambio de metadatos por lecturas. Health listo, preparación ficticia idempotente y commit `writes_disabled`; cero tareas/ejecuciones/revisión de negocio 0. | Local, no actualización del Site |

Los contenidos, identificadores, claves públicas, firmas, fechas individuales, URL del Site y configuración privada quedan fuera de Git y de esta issue. Los archivos cifrados están bajo `%LOCALAPPDATA%\VidaEnOrden\Issue13\20261124`; no adjuntarlos a GitHub. DPAPI depende del perfil Windows: dos archivos en el mismo disco no constituyen recuperación ante pérdida del dispositivo. La orquestación y el resultado privado se conservan en `outputs/issue13-private-recovery.mjs` y `outputs/issue13-recovery-result.json`, ignorados por Git. No contienen un mecanismo de administración remota y no son un procedimiento de recuperación productiva.

## Reproducción automática sin datos privados

`npm run test:recovery` ejecuta cuatro regresiones con fixtures ficticios: restauración de tarea/identidad/revisión no cero y 0012, rechazo de inventario/columnas/celdas incompletas, detección de migración que altera datos y recuperación de payload con huella/owner verificables conservando estado. CI incorpora este comando. `scripts/rehearse-user-table-restore.mjs` solo abre SQLite `:memory:`; no acepta una conexión remota. El esquema procede de SQL revisado, nunca de texto almacenado en filas. Durante importación difiere claves foráneas y recrea triggers dentro de una única transacción de esa copia desechable, para conservar business_revision. Esto no autoriza retirar triggers en un Site.

El arnés exige el inventario completo del esquema suministrado, columnas y filas exactas, valores sin pérdida (null/texto/enteros seguros; rechaza otros tipos), identidad de datos antes/después, integridad y el índice esperado. No exporta D1, no certifica el ledger oculto, no restaura secretos/entorno y no habilita MCP de restauración. Una captura real nunca se añade a fixtures ni se usa en CI.

| Verificación ejecutada en esta entrega | Resultado |
|---|---|
| `npm ci` | 709 paquetes; salida 0 |
| `audit:dependencies` | Cero vulnerabilidades |
| `test:finance`, `test:mcp`, `test:audit`, `test:recovery` | 14 +144 +4 +4 = **166 aprobadas**, cero omitidas |
| TypeScript / lint | Sin errores; cuatro advertencias existentes en v2-modules |
| `verify:schema` | Drizzle sin cambios |
| `build`, `verify:independent` | Aprobados; D1 local temporal, 13 SQL consecutivos |
| `verify:worker`, `verify:sites` | Aprobados sobre workerd/D1 local: 31 lecturas, WebAuthn sintético/denegaciones y 27 QA API/UI por modo |
| `audit:public` | 268 archivos, cero hallazgos; no certifica retirada de exposición histórica |
| CI del PR | [Checks del PR #14](https://github.com/JorgeTonos28/Vida_en_orden/pull/14/checks); ensayos/arnés en9d2d9af y trazabilidad documental posterior. Consultar HEAD exacto; no inferir aprobación humana ni resultado de otro commit |

Las integraciones workerd/D1 usan exclusivamente datos ficticios; la restauración de la captura propia se ejecutó en SQLite en memoria. Son evidencias complementarias, no una restauración nativa alojada del respaldo. El aviso del harness sobre aprobación humana no verificada se refiere a su prueba sintética, no invalida la firma histórica de la instalación.

## Bloqueos y recursos pendientes

1. Las herramientas administrativas disponibles exponen overview/filas, pero no exportación nativa, snapshot, ledger de migraciones ni SQL administrativo. La captura de tablas no incluye tablas de sistema/ledger/DDL efectivo. Dos pasadas iguales detectan deriva, pero no prueban consistencia transaccional ni ausencia de cambios intermedios; no se congelaron escrituras UI ni solicitudes del propietario. El visor de escritorio no permitió control en esta sesión. No se usó un endpoint remoto inventado ni una identidad fabricada para suplirlo.
2. Falta obtener por un canal administrativo admitido de Sites un respaldo nativo consistente del D1 de desarrollo, ledger y DDL efectivo; verificar restauración aislada y una segunda copia separada accesible al propietario. La recuperación lógica ensayada no cierra ese requisito. No se ha verificado que exista una opción de exportación en la UI; si no está disponible, consultar al soporte administrativo de Sites antes de continuar. No enviar el dump ni credenciales a una issue pública.
3. Falta confirmar la migración incremental 0012 en ese host/ledger existente. `prepare:sites` es freshInstallationOnly: una proyección nueva verde no autoriza reemplazar los SQL aplicados ni el ledger. Conservar versiones, origen, credencial pública fijada y datos; aplicar solo 0012 por un mecanismo soportado y comprobar su índice. Si el host no lo permite, detener la actualización y escalar; no omitir índice/triggers ni añadir SQL al MCP.
4. Faltan autorización administrativa específica y ventana controlada antes de guardar/publicar una versión o cambiar flags. No se solicitó ni ejecutó un despliegue en esta entrega. Después, comprobar identidad/owner-only, catálogo/31 lecturas, health/índice/metadatos, preparación/revisión ficticia sin negocio, coherencia UI y `writes_disabled`. No repetir registro/firma humana salvo un cambio del canal que lo justifique.
5. Cuotas D1/Worker (CPU, memoria, tamaño, latencia/carga y espacio libre) no observables con estas herramientas; no certificadas. La base capturada no tiene negocio/audit_log histórico y no demuestra escala. Las regresiones existentes cubren 2.000 aceptadas/2.001 denegadas y 5.000 auditorías, sin truncar datos. Persisten 2.000 filas conjuntas de otras 17 tablas, 2 MiB de snapshot y presupuestos de acciones/diff/consultas/tiempo. No generar carga ni purgar auditoría en el host para sortearlos.

## Actualización y rollback futuros

Con los bloqueos anteriores resueltos, usar un commit oficial revisado y CI verde, mantener ejecución MCP cerrada y preservar el respaldo nativo probado y la versión/entorno anteriores. Coordinar ausencia de escrituras, drenar propuestas y seguir UPGRADE_AND_ROLLBACK/SITES_METADATA_BOOTSTRAP sin repetir migraciones aplicadas. Guardar/publicar en el mismo Site únicamente tras autorización explícita; comprobar el resultado real aunque falle el upload (puede haberse aplicado SQL). Registrar procedencia privadamente y resultados sin identificadores en la issue.

Ante fallo, detener el cambio, conservar base/evidencia y volver a la versión de código anterior mediante el procedimiento administrativo autorizado, con propuestas desactivadas. Conservar el índice aditivo y los datos; no hacer DROP, reinstalar, modificar ledger ni restaurar una base viva automáticamente. Una restauración real requiere decisión y autorización propias del propietario. La issue #13 sigue abierta; fase 7, aceptación de escrituras y escalabilidad no están completas. La exposición histórica pública sigue siendo riesgo conocido sin resolver.
