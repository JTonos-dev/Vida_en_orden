# Portabilidad

## Qué es portable

- Código de interfaz y Worker.
- Servicios de dominio y cálculos financieros.
- Contratos MCP y pruebas.
- Migraciones D1/Drizzle.
- Scripts de instalación, build y preview.
- Documentación, fixtures y seed ficticio.

## Qué no se puede copiar automáticamente

- Una base D1 productiva.
- Secretos, cookies, sesiones, owner policies y respaldos.
- Audiencia o permisos de un Site.
- La conexión privada del plugin de otra cuenta.
- Versiones internas o historial privado de ChatGPT Sites.

Una segunda cuenta debe crear su propio Site, vincular su propio D1, configurar sus secretos, publicar el código y conectar su propio plugin. La plataforma no proporciona aquí un procedimiento verificado para importar automáticamente el Site o el plugin privado de otra cuenta.

## Portabilidad de datos

La exportación y restauración JSON de la interfaz pertenecen a una instalación concreta y no deben incluirse en Git. Para migrar datos, usa un procedimiento operativo separado, verifica el propietario y restaura primero en una base aislada. La fase MCP actual no ofrece restauración.

## Reproducibilidad mínima

Un agente nuevo debe poder clonar el repositorio, ejecutar los comandos de README, aplicar las ocho migraciones a una base local y comprobar que el catálogo MCP se construye sin datos de la instalación original. La prueba de conexión de ChatGPT exige una segunda cuenta/sesión y no se puede simular con un build local.
