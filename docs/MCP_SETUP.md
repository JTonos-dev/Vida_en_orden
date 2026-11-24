# Configuración del servidor MCP

## Superficie

El servidor está en `app/mcp/route.ts` y `lib/mcp/server.ts`. El endpoint es `POST /mcp`. El transporte exige JSON-RPC/MCP moderno, headers de protocolo coherentes, `application/json` y un cuerpo acotado.

El manifiesto de Sites declara:

```json
{
  "d1": "DB",
  "capabilities": ["mcp"]
}
```

Cada instalación debe crear su propio Site, configurar su propio binding `DB` y reemplazar el marcador de `.openai/hosting.json` con el `project_id` de esa instalación. No se puede importar automáticamente el Site privado de otra cuenta.

## Identidad y owner-only

Sites autentica la visita y entrega `oai-authenticated-user-id` y `oai-authenticated-user-email`. El endpoint compara esos valores con la política configurada en el runtime. Si falta identidad responde 401; si no coincide con el propietario responde 403; si no existe política responde 503.

Configura los secretos mediante el panel o la herramienta oficial de Sites. No los guardes en `.openai/hosting.json`, `.env`, GitHub Actions ni archivos de ejemplo.

## Catálogo de lectura

Las 31 herramientas y sus schemas cerrados son la fuente de verdad en `lib/mcp/server.ts`. El servicio de consultas está en `lib/mcp/read-service.ts`.

Todas:

- son de solo lectura;
- tienen `readOnlyHint=true` y `destructiveHint=false`;
- tienen límites y paginación cuando devuelven colecciones;
- filtran los datos privados por la identidad autenticada;
- no aceptan SQL, endpoints, tablas ni un propietario provisto por el modelo.

## Validación después de publicar

Desde una conversación nueva de ChatGPT con el plugin de tu Site:

1. Ejecuta `get_capabilities` y confirma 31 herramientas, `readOnly=true` y escrituras deshabilitadas.
2. Ejecuta `get_my_profile` y confirma la identidad propia.
3. Invoca una herramienta de cada módulo.
4. Repite al menos una consulta con `limit=1` y el `nextCursor` recibido.
5. Ejecuta `validate_references` y documenta el resultado.
6. Confirma que no existe ninguna herramienta de crear, editar, eliminar, anular o restaurar.

Una lista de herramientas no sustituye la prueba individual desde el plugin de la nueva instalación.

Cuando Sites permite publicar con la capacidad `mcp`, puede crear e instalar automáticamente el plugin privado del nuevo Site. Comprueba su conexión mediante la herramienta oficial de Sites con `include_mcp_connection: true` y usa el `plugin_id` devuelto. Si la plataforma confirma que está instalado pero esta conversación no recibe sus herramientas, abre una conversación nueva y selecciona el plugin de esa instancia. No reutilices el plugin original ni configures un servidor local para sustituir esa comprobación.
