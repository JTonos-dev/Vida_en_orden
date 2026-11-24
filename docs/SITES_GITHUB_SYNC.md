# Sincronización operativa entre Sites y GitHub

GitHub y ChatGPT Sites son sistemas relacionados pero distintos. GitHub contiene el código público aprobado; cada Site conserva su propio `project_id`, D1, secretos, audiencia, versión guardada y despliegue. Un commit de GitHub no prueba que un Site lo esté ejecutando, y una versión interna de Sites no es un commit integrado hasta que se compare explícitamente.

## Regla de seguridad

No conectar el merge de `main` con el despliegue de un Site personal. No copiar a GitHub bases, respaldos, `.env`, logs, cookies, identificadores de Site ni datos reales. No usar un token de Sites como credencial permanente del repositorio.

## Flujo antes de modificar código

1. Leer `AGENTS.md`, `docs/CURRENT_STATE.md`, `docs/ROADMAP.md` y la documentación del cambio.
2. Actualizar `main` localmente:

   ```sh
   git fetch origin
   git switch main
   git pull --ff-only
   ```

3. Revisar PR abiertos y el commit que declara `CURRENT_STATE.md`.
4. Desde el propietario del Site, consultar la versión guardada de Sites y su `source.commit_sha`; no registrar en el repositorio ningún secreto, URL privada, audiencia ni dato de D1.
5. Si el Site y `main` no coinciden, decidir cuál es la fuente del cambio. No sobreescribir silenciosamente una versión más nueva.
6. Crear una rama `feature/`, `fix/`, `docs/` o `chore/` desde el `main` actualizado.

## Flujo de desarrollo y PR

1. Implementar el alcance mínimo en la rama.
2. Si el cambio procede de Sites, exportar únicamente código y documentación saneados; revisar `git diff --stat`, `git diff`, `git ls-files` y el escaneo de secretos antes de crear blobs.
3. Ejecutar:

   ```sh
   npm ci
   npm run test:finance
   npm run test:mcp
   npx tsc --noEmit
   npm run lint
   npm run build
   npm run verify:independent
   ```

4. Actualizar `CURRENT_STATE.md`, `ROADMAP.md`, `CHANGELOG.md` y contratos afectados.
5. Publicar la rama y abrir el PR hacia `main`.
6. Esperar CI, revisión humana y resolución de comentarios.
7. Fusionar solo el PR autorizado. Registrar el commit integrado.

## Sincronizar el Site después del merge

La sincronización es una operación separada del merge y la ejecuta el propietario de cada instalación:

1. confirmar el commit integrado en GitHub;
2. comparar ese commit con el checkout/repositorio interno de Sites;
3. resolver diferencias en una rama o revisión local antes de publicar;
4. verificar que el `project_id` local, el binding `DB`, la audiencia y los secretos sigan siendo propios;
5. preparar respaldo y rollback si el cambio afecta esquema o datos;
6. guardar una nueva versión de Sites basada exactamente en el commit aprobado;
7. desplegar solo esa versión, si el propietario lo autoriza;
8. verificar número de versión, `source.commit_sha`, deployment, salud de la interfaz y herramientas MCP;
9. registrar por separado el commit de GitHub, la versión de Sites y el deployment.

Si el Site no permite importar automáticamente un commit de GitHub, realizar el paso manual indicado por Sites. No simular un push ni afirmar que GitHub y Sites quedaron sincronizados solo porque ambos compilen.

## Evitar sobrescrituras y migraciones incompatibles

- Antes de traer cambios de otro colaborador, comparar commits, dependencias, migraciones y contratos MCP.
- Nunca hacer force-push sobre una rama compartida.
- Una migración nueva debe ser aditiva, aplicarse en orden y probarse en una D1 independiente.
- No ejecutar `migrate:fresh`, restauraciones ni SQL destructivo en producción.
- Un cambio que solo actualiza documentación no debe cambiar la versión funcional del MCP.
- Si un Site ejecuta una versión distinta de `main`, documentarlo como divergencia hasta verificar el deployment.

## Automatización disponible

El repositorio automatiza la parte segura y reproducible: CI ejecuta pruebas, build, escaneo de secretos y `verify:independent`. La conexión de una cuenta ChatGPT, la configuración de audiencia, la creación de D1, los secretos y el despliegue de cada Site permanecen deliberadamente bajo control manual del propietario. No hay un workflow que despliegue Sites al fusionar `main`.
