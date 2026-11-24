# Estado técnico MCP para una instalación nueva

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

La superficie MCP actual es de solo lectura. El catálogo se obtiene desde `get_capabilities`; las herramientas no reciben una identidad, tabla, SQL o scope arbitrario como argumento. Las colecciones usan límites y cursores opacos. Los detalles y reportes reutilizan reglas del dominio y no crean registros.

Las escrituras de la interfaz están separadas en `/api/action`. Esa ruta no es una herramienta MCP y el servidor MCP no la importa ni la llama.

## Datos y aislamiento

Cada instalación debe usar su propio binding D1 y sus propios secretos. Los datos privados se filtran por la identidad autenticada del request. Las tareas, áreas y proyectos conservan el scope compartido que define el dominio actual. Revisa `docs/MCP_ENTITY_RELATIONSHIP.md` antes de añadir relaciones.

## Estado de desarrollo

- Fases 0, 1, 1.1 y 2: código y documentación transferidos.
- Fase 3: no iniciada; los tipos futuros no habilitan escrituras.
- Fases 4 a 7: pendientes o parcialmente documentadas según `docs/ROADMAP.md`.

## Verificación local

Ejecuta `npm ci`, `npm run test:finance`, `npm run test:mcp`, `npx tsc --noEmit`, `npm run lint` y `npm run build`. La conexión de ChatGPT no puede validarse solo desde este repositorio: requiere publicar una instalación propia y usar su plugin.
