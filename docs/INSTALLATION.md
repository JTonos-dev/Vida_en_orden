# Instalación independiente

## Requisitos

- Node.js `>=22.13.0`.
- Git y `npm`.
- Una cuenta con capacidad para crear un ChatGPT Site y una base D1 propia.
- Una identidad de propietario para configurar el acceso del Site y el MCP.

## Desarrollo local

```sh
git clone https://github.com/JorgeTonos28/Vida_en_orden.git
cd Vida_en_orden
npm ci
npm run test:finance
npm run test:mcp
npx tsc --noEmit
npm run build
npm run dev
```

La vista local usa la identidad ficticia de preview que proveen los helpers de Sites. No conecta con la base D1 productiva de otra persona.

## Base D1 de prueba

El esquema se describe en `db/schema.ts` y las migraciones se encuentran en `drizzle/`. Después de generar el build local, aplica solamente las migraciones pendientes a la base local con Wrangler:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js \
  d1 execute DB --local --config dist/server/wrangler.json \
  --persist-to .wrangler/state --file drizzle/0000_chunky_hellion.sql
```

Repite el comando en orden para las migraciones restantes de la versión (main fase 2: hasta 0007; rama fases 3–7: hasta 0012), sustituyendo el archivo. El estado `.wrangler/` es local e ignorado. Nunca omitas --local para una prueba. Para publicar una instalación Sites nueva sigue SITES_METADATA_BOOTSTRAP.md: exportación de esquema, gate verify:hosting en el checkout privado y bootstrap atómico de metadatos desde el primer registro o preparación explícitos y autenticados. Ese flujo ya se publicó en desarrollo; el visor de lectura no aplica migraciones. Las actualizaciones existentes requieren inspección y autorización separadas.

## Datos de demostración

`database/seeds/demo-data.json` contiene valores ficticios y no se carga automáticamente. Los tests también usan fixtures sintéticos. No conviertas este seed en una copia de datos reales.

## Variables de entorno

No se incluyen valores reales. Para el MCP, configura como secretos del Site:

- `MCP_OWNER_EMAIL`: correo verificado del propietario de esa instalación.
- `MCP_OWNER_USER_ID`: identificador estable de esa instalación, cuando Sites lo entregue y se haya verificado.

La aplicación no necesita credenciales de ChatGPT dentro del repositorio. Sites gestiona Sign in with ChatGPT y los headers de identidad del request.
