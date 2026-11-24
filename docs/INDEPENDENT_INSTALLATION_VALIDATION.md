# Validación de instalación independiente

Fecha de revisión: 24 de noviembre de 2026. Base pública: `e7ed6d8a85f67d2630805f429165c66ed0408c1e`. Alcance: preparar una instancia separada y verificar la fase 2, sin habilitar las fases siguientes.

## Hallazgo de portabilidad y corrección propuesta

La auditoría manual encontró fixtures personales en el bootstrap de tareas y una organización automática con proyectos e identificadores ligados al origen. La comprobación previa de correos y credenciales no detectaba ese contenido. No se reprodujeron los datos en este informe. No se publicó el artefacto que los contenía.

Se retiran esas dos fuentes del código de arranque y se amplía `verify:independent` para rechazar su reintroducción. La creación del workspace y los valores genéricos de configuración se conservan. No se cambia el esquema, no se eliminan datos ya guardados y no se vuelve a clasificar una instalación existente. Los objetos y commits históricos del repositorio público no se reescriben.

## Evidencia automatizable

- `npm ci` instala el lockfile en un clon limpio con Node.js >=22.13.0.
- `npm run test:finance` cubre cálculos financieros; `tests/finance-filters.test.ts` cubre los filtros adicionales.
- `npm run test:mcp` incluye `tests/mcp-installation.test.ts`: las 31 herramientas se ejecutan mediante JSON-RPC contra SQLite real con las migraciones 0000–0007. Los detalles usan registros sintéticos relacionados, no respuestas simuladas.
- Se repiten las 31 lecturas en vacío y se compara el contenido de todas las tablas antes y después. Los detalles inexistentes deben responder `not_found`.
- Dos bases separadas con los mismos IDs y alcance compartido deben devolver únicamente sus propios registros. Se prueba también un registro privado de otro propietario.
- Se comprueban paginación real con `limit=1`, descubrimiento, catálogo read-only, `businessWritesEnabled=false` y rechazos 401, 403 y 503.
- TypeScript, lint, build y `verify:independent` forman parte de la validación. Este último usa D1 local temporal y nunca `--remote`.
- `scripts/qa-v2.mjs` modifica y restaura exclusivamente una base local de prueba. Usa fechas relativas y comprueba que las primeras acciones no añadan fixtures ni proyectos heredados.

## Límites de la evidencia

SQLite local no demuestra por sí solo la conexión del plugin de ChatGPT ni la configuración de Sites. Cada propietario debe comprobar por separado Site privado, binding `DB`, ocho migraciones alojadas, secretos propios y ejecución individual desde su plugin. Un catálogo de 31 herramientas no equivale a 31 llamadas satisfactorias desde ChatGPT.

La audiencia y `MCP_OWNER_EMAIL` se obtienen de la cuenta que crea el Site. No se usa un ID de cuenta como `MCP_OWNER_USER_ID`: ese valor debe corresponder a la identidad autenticada específica del Site. Los identificadores, URL, secretos y resultados con datos propios se guardan fuera del repositorio público.

La consulta pública de GitHub encontró un ruleset activo con PR obligatorio, bloqueo de force-push y borrado. No contiene CI requerido ni aprobación humana requerida; deben configurarse antes del desarrollo colaborativo. La lectura de protección clásica y la publicación de PR necesitan permisos de GitHub adecuados.

## Compatibilidad y reversión

Se conservan las 31 herramientas, los contratos y las ocho migraciones existentes. No hay una migración adicional ni una restauración de D1 asociada a esta corrección. Una instalación previa conserva sus registros; simplemente deja de ejecutar la clasificación automática de origen.

Si falla la primera publicación, conservar el Site privado sin publicar hasta corregir el artefacto. No usar como rollback de una instalación nueva el bootstrap que vuelve a cargar fixtures personales. Para una instalación existente, seguir el procedimiento documentado de versiones y respaldos, con autorización de su propietario.
