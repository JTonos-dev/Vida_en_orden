# Publicación y despliegue

## Preparación

Antes de publicar una instalación:

Para la rama de fases 3–7, generar la proyección desde el commit público limpio siguiendo SITES_METADATA_BOOTSTRAP.md. Ejecutar `npm run verify:hosting` en ese checkout privado: debe detectar cero instrucciones fuera de esquema. Los originales conservan 21 instrucciones de metadatos conocidas; no editarlos ni ignorar el gate. El PR #12 publicó satisfactoriamente el candidato proyectado en un Site privado nuevo, sin certificar todavía aceptación humana/ChatGPT. Incluir la corrección de dependencias y ejecutar audit:dependencies; no publicar el artefacto basal afectado.

1. Ejecuta la suite local completa.
2. Verifica que el manifiesto use el `project_id` propio y el binding D1 propio.
3. Crea y prueba un respaldo de esa base en un entorno aislado.
4. Configura `MCP_OWNER_EMAIL` y opcionalmente `MCP_OWNER_USER_ID` como secretos.
5. Revisa el acceso del Site y confirma que solo están autorizadas las personas deseadas.
6. Revisa el diff del commit y ejecuta la auditoría de secretos.

## Flujo de Sites

El agente que tenga acceso a Sites debe seguir el flujo oficial: preparar el checkout, ejecutar los checks, construir el artefacto, guardar la versión y desplegar explícitamente. Debe conservar el binding D1 y la audiencia de esa instalación salvo autorización expresa.

Un commit de GitHub no despliega por sí solo un Site. Una versión de Sites tampoco actualiza el repositorio oficial automáticamente. Registra por separado commit, versión, deployment y pruebas de producción.

## Rollback

1. Identifica el commit y la versión de Sites conocidos como sanos.
2. Comprueba el estado de la base y de las migraciones; el rollback del código no deshace migraciones.
3. Publica el artefacto anterior en una ventana autorizada.
4. Ejecuta `server/discover`, `tools/list`, una lectura MCP y una comprobación de la interfaz.
5. Si la base fue modificada, sigue el procedimiento de recuperación de `MCP_BACKUP_RECOVERY.md`; no restaures a ciegas.
