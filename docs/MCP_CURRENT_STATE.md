# Estado técnico MCP para una instalación nueva

Actualizado para la rama de fases 3–7. El estado integrado/deployado se distingue en CURRENT_STATE.md; este documento no registra una instalación personal.

Este documento es una guía pública del código transferido. No contiene un inventario de usuarios, permisos, datos, URLs ni versiones privadas de una instalación concreta.

## Componentes

- `app/mcp/route.ts`: entrada HTTP del servidor MCP.
- `lib/mcp/server.ts`: protocolo, schemas, catálogo y routing.
- `lib/mcp/read-service.ts`: consultas tipadas, filtradas y paginadas.
- `lib/mcp/auth.ts`: validación de identidad y política de propietario.
- `lib/data-scopes.ts`: separación entre datos compartidos y privados.
- `db/schema.ts` y `drizzle/`: modelo y migraciones D1.
- `tests/mcp-*.test.ts`: conformance, autorización, lecturas y Fase 2.

## Contrato vigente

La superficie predeterminada conserva 31 herramientas de solo lectura. Los opt-in privados añaden once herramientas de propuestas y dos lecturas ampliadas (hasta 44); solo escriben metadatos/staging, con ejecución de negocio cerrada en código. El catálogo se obtiene desde `get_capabilities`; las herramientas no reciben una identidad, tabla, SQL o scope arbitrario como argumento. Las colecciones usan límites y cursores opacos. Los detalles y reportes reutilizan reglas del dominio y no crean registros.

Las escrituras de la interfaz están separadas en `/api/action`. Esa ruta no es una herramienta MCP y el servidor MCP no la importa ni la llama.

## Datos y aislamiento

Cada instalación debe usar su propio binding D1 y sus propios secretos. Los datos privados se filtran por la identidad autenticada del request. Las tareas, áreas y proyectos conservan el scope compartido que define el dominio actual. Revisa `docs/MCP_ENTITY_RELATIONSHIP.md` antes de añadir relaciones.

## Estado de desarrollo

- Fases 0, 1, 1.1 y 2: código y documentación transferidos.
- Fase 3: motor/transporte publicados, registro personal y clave pública propia configurados, conexión autenticada/44 herramientas/31 lecturas/health/idempotencia verificados. Firma personal de propuesta pendiente; primer enlace expiró sin firma. La incidencia de bootstrap fue corregida y su reintento humano aprobado. Ver DEVELOPMENT_PROGRESS.
- Fases 4/5: 19/24 adaptadores probados, sin ejecución MCP real habilitada.
- Fase 6: adjuntos de texto/CSV/JSON, informes internos y endurecimiento implementados; binarios/OCR y carga alojada sin verificar.
- Fase 7: integración, migraciones y documentación en PR dependientes; ver DEVELOPMENT_PROGRESS.md para evidencia exacta y bloqueos externos.

## Verificación local

Ejecuta los comandos de AGENTS.md, incluidos auditoría, verify:schema y, después del build, verify:independent/verify:worker/verify:sites. La proyección Sites conserva SQL originales 0000–0010 y añade 0011; el bootstrap atómico solo ocurre en registro o preparación explícitos y autenticados. La conexión de ChatGPT no puede validarse solo desde este repositorio: requiere usar el plugin publicado con identidad real. La aprobación con firmas sintéticas no sustituye la interacción de una persona.
