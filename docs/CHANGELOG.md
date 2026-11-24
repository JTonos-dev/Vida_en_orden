# Historial de cambios

El changelog canónico está en [../CHANGELOG.md](../CHANGELOG.md). Este archivo se conserva para no romper enlaces de la transferencia inicial.

## Transferencia pública · 2026-11-24

- Se saneó el snapshot del Site de origen y se preparó para instalaciones independientes.
- Se añadió `AGENTS.md`, roadmap de siete fases, documentación de instalación, seguridad, despliegue, portabilidad y colaboración.
- Se añadió CI con pruebas MCP/financieras, TypeScript, lint, build y búsqueda de patrones de credenciales.
- No se incluyeron datos productivos, respaldos, secretos, identificadores privados ni historial Git interno.

## MCP Fase 2

- Catálogo de 31 herramientas de lectura con relaciones, filtros, reportes, auditoría, configuración y validación.
- Paginación acotada mediante cursores opacos y schemas cerrados.
- Escrituras MCP permanecen deshabilitadas.

## MCP Fase 1 — lectura local, pendiente de publicación

- Servidor MCP 2026-07-28 en `/mcp` con nueve herramientas read-only.
- Acceso cerrado al propietario mediante identidad verificada de Sites y política de entorno.
- Separación completa entre herramientas MCP y `/api/action`.
- Lecturas sin inicializaciones, siembras o migraciones implícitas.
- Paginación, schemas cerrados, respuestas estructuradas y pruebas de privacidad/ausencia de efectos secundarios.

## V19 · Presupuesto mensual enfocado

- La vista mensual de presupuesto ahora muestra sólo categorías con presupuesto, obligación, aporte a meta o gasto reportado en ese mes.
- Las categorías sin actividad permanecen disponibles para crear nuevas asignaciones, pero no ocupan espacio en la vista principal.

## V18 · Metas y presupuesto por conceptos

- Texto abreviado a “Después de ingresos” en la disponibilidad financiera.
- Consumo automático de reservas de metas al registrar un gasto vinculado.
- Edición y reducción de aportes; reversión con trazabilidad y protección de importes ya utilizados.
- Edición segura de metas, impidiendo objetivos inferiores a lo reservado y utilizado.
- Aportes a metas convertidos en ampliaciones automáticas del presupuesto del mes, con concepto igual al nombre de la meta.
- Sección “Metas” dentro del presupuesto y detalle de cada partida por conceptos presupuestados y gastos reportados.
- Adicionales presupuestarios trasladados al detalle de cada partida, con alta genérica o desde un concepto existente.
- Gastos pagados por transferencia con cálculo automático de comisión y categoría separada para el cargo bancario.
- Migraciones aditivas y compatibilidad defensiva con bases de versiones anteriores.
- Registro persistente de mejoras pospuestas en `docs/PENDIENTES.md`.

## V2 · Vida en Orden

- Nuevo nombre e identidad visual integral.
- Resumen combinado de tareas, agenda, proyectos y disponibilidad financiera.
- Calendario mensual, semanal, diario y agenda; eventos recurrentes y alertas de solapamiento.
- Áreas y proyectos con clasificación de tareas.
- Cuentas, movimientos, transferencias, categorías y presupuesto mensual.
- Obligaciones recurrentes con ocurrencias y pagos individuales.
- Metas de ahorro vinculables a tareas o proyectos.
- Proyección de flujo y reportes por categoría, tarea y proyecto.
- Fuente única de gasto real mediante transacciones confirmadas.
- Auditoría, exportación CSV y respaldo/restauración JSON.
- Persistencia por usuario para datos financieros y eventos.
- Correcciones previas conservadas: buscador sin pérdida de foco, subtareas contraídas, chevrón SVG, navegación interna del modal, acciones completas y fecha real de finalización.

