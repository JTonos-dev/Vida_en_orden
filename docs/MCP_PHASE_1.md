# Vida en Orden — Fase 1 MCP

> Registro histórico de la implementación inicial. El estado vigente está en `docs/CURRENT_STATE.md` y `docs/ROADMAP.md`.

**Estado:** implementada y validada localmente; no publicada

**Fecha:** 2026-11-22

## Arquitectura implementada

```text
ChatGPT / plugin privado creado por Sites
  └─ Sites dispatch
      ├─ valida que el visitante pueda acceder al Site
      ├─ agrega identidad verificada oai-authenticated-user-*
      └─ POST /mcp
          ├─ owner policy: MCP_OWNER_USER_ID / MCP_OWNER_EMAIL
          ├─ JSON-RPC 2.0 + MCP 2026-07-28
          ├─ schemas estrictos y rechazo de propiedades inesperadas
          ├─ tool router exclusivamente de lectura
          └─ McpReadService
              ├─ alcance shared_household: tareas, notas, áreas y proyectos
              └─ alcance owner_private: finanzas, calendario y auditoría
```

La interfaz existente conserva `/api/state` y `/api/action`. `/api/action` no se registra ni se reutiliza como herramienta MCP. El endpoint `/mcp` tiene su propio router y no importa las funciones de escritura de la interfaz.

## Identidad y denegación por defecto

Sites es la frontera de autenticación del transporte MCP. Según el contrato de la plataforma, valida el acceso al Site y reenvía:

- `oai-authenticated-user-id`
- `oai-authenticated-user-email`
- `oai-authenticated-user-full-name` opcional

La aplicación no acepta identidad en argumentos de herramientas. Después de la validación de Sites, compara los headers con la política de propietario configurada en el entorno del servidor:

- `MCP_OWNER_USER_ID`: selector preferido, estable dentro del Site.
- `MCP_OWNER_EMAIL`: selector inicial permitido porque Sites lo entrega verificado.
- Si ambos se configuran, ambos deben coincidir.
- Sin identidad: 401.
- Identidad válida pero no propietaria: 403.
- Sin política configurada: 503; el servidor falla cerrado.

El viewer actualmente autorizado para visitar el Site seguirá pudiendo usar la interfaz, pero el MCP le será denegado mientras la política permanezca owner-only.

## Herramientas disponibles

| Herramienta | Alcance | Función |
|---|---|---|
| `get_capabilities` | metadatos | Protocolo, módulos, política de aprobación y herramientas |
| `get_my_profile` | identidad | Identidad verificada y scopes de lectura |
| `search_tasks` | compartido | Búsqueda y filtros de tareas con paginación |
| `get_task` | compartido + resumen privado | Tarea, padre, hijos, dependencias, notas y gasto propio resumido |
| `list_accounts` | privado | Cuentas y saldo confirmado calculado a la fecha |
| `get_budget` | privado | Base, adicionales, obligaciones, metas, gasto y disponible sin doble conteo |
| `list_obligations` | privado | Obligaciones/ingresos previstos y ocurrencias |
| `list_goals` | privado | Metas, reservas y vínculos autorizados |
| `search_all` | ambos, separados | Búsqueda global con secciones `shared` y `private` |

Todas publican `readOnlyHint=true`, `destructiveHint=false`, `idempotentHint=true` y `openWorldHint=false`. Las respuestas incluyen `structuredContent` y un bloque de texto JSON compatible con clientes MCP.

## Paginación y límites

- Límite predeterminado: 20.
- Límite máximo: 50; búsqueda global máximo 10 por tipo.
- Cursor opaco validado en servidor.
- Búsquedas de texto limitadas a 200 caracteres.
- Cuerpo JSON-RPC limitado a 64 KiB.
- Los schemas son cerrados (`additionalProperties=false`) y vuelven a validarse con Zod en el servidor.

## Lecturas sin efectos secundarios

`stateFor()` y `v2StateFor()` ya no ejecutan siembras, defaults, clasificación ni migraciones. Las inicializaciones existentes permanecen en las rutas manuales de escritura:

- `home-server.action()` inicializa el espacio compartido antes de una acción manual.
- `v2Action()` inicializa defaults y organización antes de una acción manual.

`McpReadService` acepta únicamente SQL que comience con `SELECT`. No importa ni llama `POST /api/action`, `home-server.action()` ni `v2Action()`.

## Contratos futuros, no habilitados

`lib/mcp/future-contracts.ts` define los tipos de Fase 3: estados de propuesta; acción tipada con riesgo y versión esperada; `ChangePlan` inmutable con `proposalId + digest + revision`; evidencia de aprobación autenticada; y solicitud idempotente de commit con resultado por acción.

`MCP_BUSINESS_WRITES_ENABLED` está fijado a `false`. Ninguna herramienta de propuesta, aprobación o commit se registra en `tools/list`.

## Pruebas realizadas

### Automatizadas

- 13/13 pruebas MCP aprobadas.
- 14/14 pruebas financieras aprobadas.
- 3/3 pruebas de filtros aprobadas.
- Build completo aprobado; `/mcp` aparece como ruta del Worker.
- Lint sin errores; permanecen cuatro warnings preexistentes por componentes no usados.

Las pruebas MCP cubren identidad ausente, política ausente, viewer rechazado, coincidencia de propietario, identidad no manipulable por argumentos, catálogo exclusivamente read-only, escrituras deshabilitadas, cursores inválidos y garantía SQL `SELECT`.

### Integración aislada con D1 local

Se creó una base local nueva y se aplicaron las migraciones `0000` a `0007`. Se levantó el Worker con una identidad ficticia y se comprobó:

- `server/discover`: MCP `2026-07-28`.
- `tools/list`: 9 herramientas, todas read-only.
- Ejecución correcta de capacidades, tareas, cuentas, presupuesto, obligaciones, metas y búsqueda global.
- Solicitud sin identidad: HTTP 401.
- Viewer autenticado no propietario: HTTP 403.
- `/api/state`: HTTP 200.
- Interfaz `/`: HTTP 200.
- Conteos después de todas las lecturas: 0 workspaces, tareas, áreas, categorías, settings y auditorías. No hubo efectos secundarios.

## Publicación y conexión — requiere autorización posterior

Para probar desde una conversación real de ChatGPT se necesita publicar porque Sites crea o actualiza el plugin únicamente al desplegar una versión cuyo manifiesto declare `"capabilities": ["mcp"]`.

La autorización futura debe cubrir exactamente:

1. Configurar en el Site `MCP_OWNER_EMAIL` con el correo verificado del propietario. Preferentemente, después de la primera conexión, configurar también `MCP_OWNER_USER_ID` obtenido mediante `get_my_profile` y volver a desplegar.
2. Empujar los commits de Fase 1 al repositorio fuente del Site.
3. Guardar y desplegar una nueva versión conservando el acceso personalizado actual. No se cambiará la audiencia ni la base D1.
4. Verificar `server/discover`, `tools/list` y una lectura inocua.
5. Obtener la conexión MCP del Site e instalar/conectar el plugin privado creado por Sites si no aparece automáticamente.
6. Abrir una conversación nueva y probar `get_my_profile`, `search_tasks` y `list_accounts`.

No se debe configurar un MCP local separado ni usar `codex mcp add`; la conexión correcta es el plugin privado que Sites genera para este proyecto.

## Riesgos pendientes

- La identidad de producción solo puede verificarse extremo a extremo tras una publicación autorizada.
- El propietario debe elegir/configurar el selector de entorno; sin él el MCP devuelve 503 por diseño.
- No se ha probado todavía con datos productivos; la integración local usó una base vacía.
- Las tablas carecen de claves foráneas SQL; las lecturas validan alcance, pero este riesgo permanece para futuras escrituras.
- Las acciones manuales existentes conservan su comportamiento actual y no pasan aún por el futuro Approval Manager; esto es intencional y separado del MCP.

## Criterio de cierre de Fase 1

El código local está listo para una publicación de lectura. No contiene herramientas MCP de escritura ni rutas alternativas hacia `/api/action`. La Fase 2 o la publicación productiva no deben comenzar hasta la revisión de estos resultados.
