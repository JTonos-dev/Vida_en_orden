# Vida en Orden — respaldo y recuperación para MCP

Este documento define el procedimiento operativo. No contiene ni sustituye un respaldo de datos. Los respaldos de instalaciones reales deben permanecer fuera del repositorio.

## Estado actual

Ensayo operativo de issue #13: dos capturas completas e iguales de las tablas de usuario del desarrollo propio se cifraron fuera de Git y restauraron en memoria, preservando identidad/evidencia;0012 no cambia filas. **No certifica snapshot nativo consistente, ledger, DDL alojado ni recuperación en D1 remoto.** Faltan exportación administrativa y copia separada: los dos archivos actuales comparten equipo y DPAPI depende del perfil Windows. Ver [informe](ISSUE13_ACCEPTANCE_REPORT.md); no cerrar el requisito de respaldo con esa copia lógica ni con el JSON de UI.

- La interfaz descarga un JSON compuesto por el estado leído en el navegador.
- La restauración valida versión, identificadores y algunas referencias, elimina datos existentes y vuelve a insertarlos mediante `database.batch`.
- El respaldo no se almacena automáticamente en el servidor; el manifiesto no declara R2.
- El JSON de UI excluye identidad de instalación, propuestas, autorizaciones, evidencias, nonces y ledger MCP: no permite reconstruir por sí solo la instalación completa. No usar su restore sobre D1 alojada durante estos ensayos.
- No se observó snapshot automático previo a restaurar, dry-run, rollback de negocio ni procedimiento probado contra una copia productiva.
- `scripts/qa-v2.mjs` toma un JSON, ejecuta cambios y restaura el estado anterior, pero está diseñado para una vista local aislada y no debe apuntar al Site publicado.

## Procedimiento propuesto antes de cualquier fase con datos

1. Congelar publicaciones y escrituras durante la ventana de respaldo.
2. Exportar el JSON integral desde una sesión autenticada y registrar fecha, versión del Site, commit y versión de migraciones.
3. Obtener además un respaldo nativo/exportación de D1 por el mecanismo operativo disponible para el proyecto. El JSON de UI no debe considerarse sustituto único de un backup de base.
4. Calcular hash de cada archivo, cifrarlo y guardar dos copias separadas. No incluir credenciales, tokens ni secretos en el reporte.
5. Registrar conteos por entidad y sumas de comprobación: cuentas, movimientos confirmados/anulados, presupuestos, obligaciones, ocurrencias, metas, aportes, tareas y auditoría.
6. Restaurar primero en una base aislada/local, aplicando migraciones en orden. Ejecutar las pruebas financieras, de filtros, integridad referencial, privacidad y cálculos.
7. Comparar saldos, presupuesto efectivo, gasto por categoría/tarea/proyecto, reservas, cargos y proyecciones antes/después.
8. Ejecutar una restauración de ensayo completa y documentar duración, errores y evidencia. La prueba no cuenta como exitosa si solo valida que el proceso terminó.

## Recuperación ante incidente

1. Suspender el endpoint de escritura y el commit MCP; conservar la base afectada sin sobrescribirla.
2. Identificar la última copia íntegra y el intervalo de cambios perdido.
3. Restaurar en una base aislada, verificar migraciones, invariantes y alcance por propietario.
4. Si la plataforma lo permite, cambiar el binding a la base recuperada en una ventana controlada; si no, seguir el procedimiento de recuperación específico de D1 sin improvisar una sustitución.
5. Publicar solo después de validar la versión del Site y los endpoints de lectura.
6. Reconciliar operaciones posteriores al backup desde el audit log y fuentes externas; no reejecutar ciegamente acciones financieras.
7. Mantener la base original y el reporte del incidente en modo solo lectura hasta cerrar la reconciliación.

## Requisito para habilitar restauración MCP

La restauración/importación queda fuera de `commit_approved_change_plan` inicial. Solo podrá habilitarse cuando exista: aprobación reforzada, resumen de reemplazos y entidades afectadas, backup automático verificable, dry-run, rollback, idempotencia, bloqueo de concurrencia y una prueba de recuperación documentada.
