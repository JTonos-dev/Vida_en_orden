# Historial de cambios

## Instalación independiente: bootstrap vacío y validación integral · 2026-11-24

- Se retiran fixtures personales incrustados en tareas y la clasificación automática ligada a registros de origen. No se borran datos existentes ni se reescribe historia compartida.
- Se ejecutan las 31 herramientas MCP contra SQLite migrado, con datos ficticios y en vacío; se comprueban aislamiento, paginación, autorización y ausencia de escrituras.
- La auditoría de portabilidad rechaza el bootstrap heredado. QA V2 usa fechas relativas y comprueba que la primera escritura no carga tareas o proyectos ajenos.
- Sin migraciones nuevas ni cambios en los contratos MCP. Las fases 3 y posteriores permanecen pendientes.

Este es el changelog canónico del repositorio. `docs/CHANGELOG.md` se conserva como enlace documental para compatibilidad con la estructura transferida.

## Infraestructura de colaboración · 2026-11-24

- Se añadió la verificación reproducible de instalación independiente con D1 local temporal y migraciones `0000`–`0007`.
- Se documentó la separación entre repositorio público, Sites personales, datos, secretos, audiencia y despliegues.
- Se añadió la guía para un nuevo usuario de Codex y el procedimiento Sites↔GitHub.
- Se actualizó el flujo de ramas, pull requests, CI y revisión de la protección de `main`.
- No se cambió el Site personal, su audiencia, sus variables, su D1 ni su despliegue.

## Transferencia pública · 2026-11-24

- Se saneó el snapshot del Site de origen y se preparó para instalaciones independientes.
- Se añadió `AGENTS.md`, roadmap de siete fases, documentación de instalación, seguridad, despliegue, portabilidad y colaboración.
- Se añadió CI con pruebas MCP/financieras, TypeScript, lint, build y búsqueda de patrones de credenciales.
- No se incluyeron datos productivos, respaldos, secretos, identificadores privados ni historial Git interno.

## MCP Fase 2

- Catálogo de 31 herramientas de lectura con relaciones, filtros, reportes, auditoría, configuración y validación.
- Paginación acotada mediante cursores opacos y schemas cerrados.
- Escrituras MCP permanecen deshabilitadas.

## Nota de alcance

La mejora de infraestructura y portabilidad no completa ni adelanta la fase 3 del MCP.
