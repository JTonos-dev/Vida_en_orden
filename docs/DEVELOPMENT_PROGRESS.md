# Desarrollo MCP: continuidad de fases 3–7

Mandato vigente: 24 de noviembre de 2026. El responsable autoriza desarrollar todas las fases en ramas dependientes y PR, sin permisos entre fases. Se conserva el repositorio oficial y el fork actual. La exposición histórica sigue abierta como riesgo; no se continúa una sustitución del repositorio.

## Base y límites

- Oficial integrado: PR #3, `317cfd8`. PR #4 pendiente de revisión, con CI verde; esta rama depende de su auditor y plan (`30a2aac`).
- Las 31 herramientas de producción siguen exclusivamente de lectura. No se modifica ninguna instalación personal ni D1 productiva.
- Las propuestas, adaptadores y aprobación se implementan y prueban con datos ficticios en aislamiento. Activar ejecución real exige demostrar aprobación humana en la plataforma y revisión del mantenedor.

| Entrega | Estado | Dependencia | PR/commit | Próximo paso |
|---|---|---|---|---|
| 3: motor, persistencia, aprobación y atomicidad | Fundamento implementado y probado; transporte pendiente | #4 | Rama `feature/mcp-phase3-foundation` | PR #5, commit 01a410c; transporte pendiente. |
| 4: operaciones no financieras | Adaptadores implementados y siete pruebas aprobadas | Motor 3 | PR #6, b57a554; depende de #5 | 19 operaciones, referencias y reversión; 101 pruebas y verificaciones completas aprobadas. |
| 5: operaciones financieras | 24 adaptadores implementados; nueve pruebas específicas aprobadas | #6 | PR #7, eb6594d; depende de #6 | Suite completa y PR; compuerta real cerrada. |
| 6: adjuntos, informes y endurecimiento | Pendiente | 3–5 | Por publicar | Componentes seguros sin inventar transporte de archivos. |
| 7: cierre y aceptación | Pendiente | Entregas anteriores | Por publicar | Instalación nueva, compatibilidad, migraciones y guía manual. |

## Decisiones de implementación

Se reutilizarán los servicios de dominio existentes mediante contexto de base de datos por request. La preparación se ejecutará sobre copias particionadas de staging, nunca sobre tablas de negocio; el commit aplicará únicamente el diff calculado por servidor en un lote D1 atómico y protegido por revisión. No se duplica el motor financiero.

La aprobación no puede derivarse de `confirmed`, texto de chat ni identidad de sesión solamente. Se implementará verificación de assertions contra credenciales fijadas por configuración de confianza; un simulador se limita a pruebas. Ningún endpoint del modelo inscribe su propia credencial ni habilita la compuerta de ejecución.

## Verificación y bloqueos

Entrega 3A: `npm ci` aprobado; 14 pruebas financieras + 76 MCP (incluyen 16 nuevas del motor/WebAuthn) + 4 de auditoría = 94 aprobadas. TypeScript, lint sin errores (cuatro advertencias preexistentes), build y auditoría de 209 archivos sin hallazgos. `verify:independent` aplicó 0000–0008 en D1 local temporal: 44 tablas. No hubo acceso a D1 remota. Metadatos Drizzle incorporan 0006–0008 y snapshot actual; ningún SQL previo se modifica.

Rollback 3A: volver al código anterior conserva las tablas aditivas inactivas; no borrarlas ni restaurar producción. El commit incrementa revisión por triggers sin modificar saldos fuera del lote. Pendiente para 3B: transporte opcional, UI segura, claves administrativas e interacción humana real.

Pendientes externos: revisión/merge de PR, interacción humana real con el canal de aprobación y aceptación funcional en ChatGPT. Estas dependencias no detienen trabajo técnico independiente y no se declaran verificadas por tests con simuladores.

## Cómo reanudar

Leer este documento, `AGENTS.md`, estado, roadmap y paridad; ejecutar `git status`, `git fetch origin`, revisar PR abiertos y la rama indicada. Mantener los cambios pendientes y las dependencias; no resetear ni fusionar en main. Ejecutar las pruebas de la entrega antes de publicar. No activar escrituras reales por completar pruebas locales.

### Entrega 4A

Catálogo cerrado de 19 acciones; operaciones existentes sin duplicar lógica. Correcciones: servicios V2 devuelven IDs de creación inequívocos; validación compartida de dependencias de tareas rechaza referencias inválidas, duplicados y ciclos. Reversión no financiera derivada de un recibo, con nueva huella/aprobación y rechazo si hubo cualquier cambio de negocio posterior. No revierte movimientos financieros ni borra auditoría. No hay migración nueva ni despliegue; rollback de código conserva la migración aditiva 0008. El transporte MCP se entrega aparte y permanece cerrado.

Verificación 4A: npm ci; 14 finanzas + 83 MCP + 4 auditoría = 101 pruebas; TypeScript, lint (solo cuatro advertencias previas), build, auditoría pública de 213 archivos y verify:independent 0000–0008 aprobados. CI de #5 satisfactorio. Las pruebas humanas permanecen bloqueadas por despliegue/canal, no por reglas de dominio.

### Entrega 5A

24 adaptadores financieros y de movimientos legados de tareas, todos R2, con importes enteros acotados y esquemas cerrados. Reutilizan el servicio V2/motor financiero. Sin migración nueva ni movimientos reales. Las pruebas aisladas cubren transferencias, redondeo ACH, reservas de metas/obligaciones, pago parcial y recurrencia, cobro de ingreso, anulación, rollback ante fallo de recibo y dos pagos concurrentes. Se corrige el reporte neto que omitía la comisión de transferencias propias (regresión 0 → -6 centavos).

La aplicación no tiene split/reconciliación, CRUD de conceptos, archivo de obligaciones/metas ni reasignación arbitraria de reservas: se documentan fuera de paridad, no se inventan. Los conceptos se recuerdan automáticamente con la lógica existente. Las escrituras reales siguen bloqueadas. Validación 5A completa: npm ci; 14 finanzas + 92 MCP + 4 auditoría = 110 pruebas aprobadas, TypeScript, lint sin errores (cuatro advertencias previas), build, auditoría de 216 archivos sin hallazgos y verify:independent 0000–0008 en D1 local. CI de #6 aprobado. Sin despliegue.

### Entrega 3B en curso

Rama `feature/mcp-proposal-transport-approval`, base #7 eb6594d. Transporte opcional de diez herramientas, fábrica con compuerta literal false y página/API WebAuthn owner-only con CSRF/origen/versión. Validación 3B: npm ci, 14 finanzas + 97 MCP + 4 auditoría = 115 pruebas aprobadas. TypeScript, lint sin errores (cuatro advertencias previas), build y auditoría de 232 archivos aprobados; verify:independent aplicó 0000–0009 y verificó 45 tablas en D1 local temporal. Se prepara alta de candidato de credencial que nunca lo fija automáticamente: el administrador debe fijar la clave que creó personalmente. No se modifica ninguna instalación. Los borradores ignorados outputs/proposal*.ts y approval-client se trasladaron al código de esta rama; no contienen datos reales. Enrollment completo y migración aditiva 0009 con snapshot/journal preparados. Próximo paso: verificaciones completas; luego endurecimiento/cierre. CI #7 aprobado.

Ensayo adicional aislado contra Miniflare D1: preparación sin escritura de negocio, commit/reintento idempotente y rollback total al forzar un fallo del recibo aprobados. El ensayo todavía está en outputs/miniflare-engine-probe.ts; convertirlo en verificación versionada durante fase 7. No se contactó una base remota. Canal humano real pendiente. El proxy de Next/Vinext aplica anti-framing a /approvals; falta inspección de UI alojada.
