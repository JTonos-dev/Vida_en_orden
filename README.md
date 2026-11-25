# Vida en Orden

Aplicación web para organizar tareas, planificación, áreas, proyectos, finanzas y bitácora. Usa React/Vinext sobre Cloudflare Workers, D1 y Drizzle. Incluye un servidor MCP hospedado en `/mcp` que, en el estado transferido, expone exclusivamente consultas de lectura.

Este repositorio es la fuente pública y reproducible del código. No contiene la base de datos, respaldos, credenciales, identificadores de Sites ni datos de la instalación de ningún colaborador.

## Estado transferido

- Código recuperado del último estado funcional verificado del Site de origen.
- MCP en fase 2: 31 herramientas de lectura, owner-only mediante variables de entorno y sin escrituras de negocio.
- Las rutas normales de la interfaz (`/api/state` y `/api/action`) se conservan porque forman parte de la aplicación, pero `/mcp` no las reutiliza para ejecutar acciones.
- Las fases futuras de propuestas, aprobaciones y escrituras no están habilitadas.

Consulta [docs/CURRENT_STATE.md](docs/CURRENT_STATE.md) y [docs/ROADMAP.md](docs/ROADMAP.md) antes de modificar el proyecto.

La rama de fases 3–7 incorpora motor de propuestas, 43 acciones de dominio, canal WebAuthn y endurecimiento en PR dependientes. El catálogo predeterminado conserva las 31 lecturas; los opt-in solo habilitan metadatos/staging, con ejecución de negocio fijada en false. Código propuesto no equivale a merge, deployment o aceptación humana. Consulta [el informe](docs/IMPLEMENTATION_REPORT.md), [la continuidad](docs/DEVELOPMENT_PROGRESS.md) y [las pruebas de aceptación](docs/USER_ACCEPTANCE_TESTS.md).

La guía para una instalación de otra persona está en [docs/NEW_INSTANCE_GUIDE.md](docs/NEW_INSTANCE_GUIDE.md). El flujo operativo para mantener separados Sites y GitHub está en [docs/SITES_GITHUB_SYNC.md](docs/SITES_GITHUB_SYNC.md).

## Inicio rápido

Requisitos: Node.js `>=22.13.0`, Git y una base D1 para el despliegue. Para desarrollo local, Wrangler crea una base aislada y las migraciones de `drizzle/` se aplican únicamente al estado local.

```sh
npm ci
npm run audit:dependencies
npm run test:finance
npm run test:mcp
npm run test:audit
npm run audit:public
npx tsc --noEmit
npm run lint
npm run verify:schema
npm run build
npm run verify:independent
npm run verify:worker
npm run dev
```

La copia pública incluye un `.openai/hosting.json` con un marcador seguro. Sustitúyelo por el `project_id` de tu propio Site antes de publicar; nunca pegues aquí el manifiesto real de otra instalación.

## Instalación independiente

1. Clona este repositorio.
2. Instala dependencias con `npm ci`.
3. Crea tu propio ChatGPT Site y configura un binding D1 llamado `DB`.
4. Sustituye el marcador de `.openai/hosting.json` por el identificador de tu Site.
5. Comprueba/aplica las migraciones de la versión seleccionada en orden (main fase2: 0000–0007; rama fases3–7: 0000–0010) únicamente por el flujo soportado y probado del host. Lee [actualización y rollback](docs/UPGRADE_AND_ROLLBACK.md) antes de actualizar una base existente.
6. Configura `MCP_OWNER_EMAIL` y, si está disponible en tu entorno, `MCP_OWNER_USER_ID` como secretos del Site.
7. Publica con la capacidad MCP declarada y valida `server/discover`, `tools/list` y una lectura inocua.

Los detalles y las limitaciones de plataforma están en [docs/INSTALLATION.md](docs/INSTALLATION.md), [docs/MCP_SETUP.md](docs/MCP_SETUP.md), [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) y [docs/PORTABILITY.md](docs/PORTABILITY.md).

`npm run verify:independent` aplica todas las migraciones contiguas de la versión a una D1 local temporal, ejecuta una consulta de humo y comprueba que la fuente pública no arrastra identificadores, correos o archivos privados conocidos. Nunca usa una base remota. El historial público anterior mantiene exposición pendiente; la auditoría de la fuente actual no implica su retirada histórica.

## Desarrollo colaborativo

`main` representa el estado integrado y verificado. Después de la inicialización pública, todo cambio debe salir de una rama independiente y llegar mediante pull request. Lee [AGENTS.md](AGENTS.md) y [docs/COLLABORATION.md](docs/COLLABORATION.md).

```sh
git fetch origin
git switch main
git pull --ff-only
git switch -c feature/nombre-corto
```

No uses datos reales de otra instalación para pruebas. Usa los fixtures y el seed ficticio documentados en `tests/` y `database/seeds/`.

## Licencia

El código se distribuye bajo MIT. Las dependencias de terceros conservan sus propias licencias; consulta `package-lock.json` y [docs/SECURITY.md](docs/SECURITY.md).
