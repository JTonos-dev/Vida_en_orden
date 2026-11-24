# Vida en Orden MCP — Fase 1.1

> Registro histórico de compatibilidad. El estado vigente y la validación transferida están en `docs/CURRENT_STATE.md`.

**Estado:** preparada y validada en local; no publicada y sin cambios en la base productiva.

**Fecha:** 2026-11-22

## Resultado

La implementación de Fase 1 quedó alineada con el transporte MCP moderno `2026-07-28` para las operaciones de lectura que el Site expone. El endpoint continúa siendo `POST /mcp`, independiente de `/api/action`; no se habilitaron propuestas, aprobaciones ni escrituras de negocio.

## Auditoría de compatibilidad

Se contrastó el código con el SDK oficial MCP moderno que acompaña al entorno de Sites y con sus esquemas wire. La referencia establece `2026-07-28` como primera versión moderna soportada, exige el sobre de cliente en `params._meta` y define el resultado moderno mediante `resultType`.

| Área | Verificación realizada |
|---|---|
| Versión | `MCP-Protocol-Version` debe coincidir con `io.modelcontextprotocol/protocolVersion`; solo se acepta `2026-07-28`. |
| Método | `Mcp-Method` debe coincidir con `jsonrpc.method`. |
| Nombre | `tools/call` exige `Mcp-Name` y lo cruza con `params.name`. |
| Sobre de cliente | Se exige `clientCapabilities`; `clientInfo` se valida si viene presente. |
| `server/discover` | Devuelve `resultType: "complete"`, `ttlMs: 0`, `cacheScope: "private"`, versión soportada y `capabilities.tools`. |
| `tools/list` | Devuelve `resultType`, `ttlMs`, `cacheScope`, herramientas y cursor opcional. |
| `tools/call` | Devuelve `resultType: "complete"`, `content`, `structuredContent` y `isError` solo cuando corresponde. |
| Caché | Los resultados privados usan `cacheScope: "private"` y TTL cero; no se permite reutilizar datos entre propietarios. |
| Errores | Parseo/solicitud/header/version usan HTTP 400; método inexistente HTTP 404; parámetros inválidos se devuelven como error JSON-RPC en HTTP 200; fallos de ejecución de herramienta usan `isError: true` en un resultado MCP HTTP 200. |
| Notificaciones | Una notificación moderna válida se procesa sin respuesta JSON-RPC y devuelve HTTP 204. |

El endpoint también rechaza métodos HTTP distintos de POST con 405 y `Allow: POST`, `Content-Type` incorrecto con 415 y cuerpos mayores de 64 KiB con 413.

## Seguridad e identidad

- La autenticación de Sites debe proporcionar `oai-authenticated-user-id` y `oai-authenticated-user-email`; si falta cualquiera, la respuesta es 401.
- La política owner-only compara el identificador y el correo; si ambos están configurados, ambos deben coincidir. Un visitante autenticado distinto del propietario recibe 403.
- Sin política de propietario configurada, el endpoint falla cerrado con 503.
- Los parámetros de herramientas no contienen ni pueden cambiar `userId`, correo, scopes o propietario. Los esquemas cerrados rechazan, por ejemplo, `user_id` dentro de `get_my_profile`.
- La capa de lectura solo permite consultas que empiezan con `SELECT`. El código MCP no importa ni invoca las rutas normales de escritura.
- Los alcances se mantienen separados: tareas, proyectos, áreas y notas usan `casa-en-orden-shared`; cuentas, movimientos, presupuestos, obligaciones, metas, calendario y auditoría usan el propietario autenticado.

La procedencia de esos headers no se puede demostrar criptográficamente desde el código del Site: la frontera de confianza es el dispatcher autenticado de Sites, que los agrega antes de entregar la solicitud a `/mcp`. No se identificó una ruta alternativa en la aplicación que exponga el router MCP sin esa validación, pero la verificación extremo a extremo del dominio publicado queda pendiente porque esta fase no autoriza publicar.

## Coherencia financiera

`get_budget` ahora usa `calculateAccountBalance`, el saldo confirmado a la fecha y el mismo filtro de la interfaz: cuentas archivadas y cuentas de crédito no forman parte de `liquidMinor`; movimientos posteriores a la fecha actual no inflan la liquidez ni el gasto del mes.

En `calculateCommitments`:

- `liquidMinor` afecta el cálculo de `uncommittedMinor`.
- `safetyMinor` afecta `committedMinor` y, por consecuencia, `uncommittedMinor`.
- `budgetRows`, `budgetRemainingMinor`, `obligationReservedMinor`, `goalReservedMinor` y `coveredByBudgetMinor` no dependen directamente de esas dos cantidades.

El MCP ya no envía cero artificial para esos valores. Su respuesta `get_budget.summary` contiene `liquidMinor`, `safetyBufferMinor`, `committedMinor`, `uncommittedMinor` y los componentes del compromiso para contrastarlos con `finance.summary` de la interfaz. Se conservan las reglas de no duplicación de `calculateCommitments`: base manual y provisión de obligación se solapan, adicionales y metas cubiertas amplían el sobre, y un gasto que consume una reserva no se suma dos veces.

## Consultas y límites

- Herramientas paginadas: 20 por defecto, 50 máximo, cursor validado y límite de cuerpo de 64 KiB.
- Búsquedas: 200 caracteres máximo; `search_all` devuelve como máximo 10 elementos por tipo.
- `get_task`: hijos máximo 50, dependencias máximo 50 y notas máximo 20.
- `list_obligations`: máximo 50 ocurrencias por obligación retornada y consulta de ocurrencias acotada a las obligaciones de la página.
- `get_budget` usa agregados y solo consulta ocurrencias del mes solicitado; no devuelve la colección completa de ocurrencias.

Quedan para Fase 2: paginación de relaciones grandes con cursores independientes, consulta detallada de movimientos con filtros completos, histórico de auditoría, calendario detallado, conceptos presupuestados y vistas de detalle de obligaciones. No se aumentaron los alcances para resolver esos pendientes en esta fase.

## Despliegue sin publicar

`.openai/hosting.json` conserva la misma base D1 (`DB`) y declara:

```json
{
  "capabilities": ["mcp"]
}
```

La interfaz normal y sus rutas existentes se conservan. No se ejecutó publicación, no se alteró la base productiva y no se creó una conexión real de ChatGPT.

Cuando se autorice la publicación, el procedimiento será:

1. Configurar `MCP_OWNER_EMAIL` con el correo verificado del propietario; configurar también `MCP_OWNER_USER_ID` cuando el Site permita confirmarlo desde la primera lectura autenticada.
2. Publicar una nueva versión del Site conservando `DB` y el acceso personalizado actual.
3. Verificar `server/discover`, `tools/list` y una lectura inocua desde el dominio del Site.
4. Conectar en ChatGPT el plugin privado que Sites genere para ese Site.
5. Probar `get_my_profile`, `search_tasks` y `list_accounts`, comprobando que el viewer autorizado siga recibiendo 403 en MCP.

## Pruebas y commits

Pruebas de esta fase:

- `npm run test:mcp`: 22/22 aprobadas.
- Incluye headers ausentes o contradictorios, versión incompatible, `Mcp-Method`/`Mcp-Name` incorrectos, identidad ausente, viewer no propietario, parámetros manipuladores, notificaciones, resultados modernos y resultados malformados.
- La prueba financiera verifica que el resumen MCP coincide con el cálculo de la interfaz para saldo líquido, colchón, compromisos y disponible.
- Se mantuvieron las pruebas previas de finanzas, filtros, build y lint para ejecutarlas en el cierre de la fase.

Commits de la entrega:

- `1584fe5` — `chore: remove MCP lint warning`
- `803a7d8` — `fix: honor MCP notification header rules`
- `a991ae9` — `docs: record MCP phase 1.1 audit`
- `ebeb128` — `test: add MCP wire conformance coverage`
- `255ba99` — `fix: bound MCP detail queries`
- `7430a60` — `fix: harden modern MCP read transport`
- `46a3a02` — `docs: document MCP phase 1 rollout`
- `d2fdf7f` — `test: verify MCP identity and read isolation`
- `a73830f` — `feat: add owner-only read-only MCP server`
- `15e3b50` — `refactor: make state reads side effect free`

La revisión debe aprobar explícitamente la publicación y la primera conexión antes de ejecutar cualquier operación contra datos productivos.

