# Desarrollo MCP: continuidad de fases 3–7

Mandato vigente: 24 de noviembre de 2026. El responsable autoriza desarrollar todas las fases en ramas dependientes y PR, sin permisos entre fases. Se conserva el repositorio oficial y el fork actual. La exposición histórica sigue abierta como riesgo; no se continúa una sustitución del repositorio.

## Base y límites

- Oficial integrado: PR #3, `317cfd8`. PR #4 pendiente de revisión, con CI verde; esta rama depende de su auditor y plan (`30a2aac`).
- Las 31 herramientas de producción siguen exclusivamente de lectura. No se modifica ninguna instalación personal ni D1 productiva.
- Las propuestas, adaptadores y aprobación se implementan y prueban con datos ficticios en aislamiento. Activar ejecución real exige demostrar aprobación humana en la plataforma y revisión del mantenedor.

| Entrega | Estado | Dependencia | PR/commit | Próximo paso |
|---|---|---|---|---|
| 3: motor, persistencia, aprobación y atomicidad | Fundamento implementado y probado; transporte pendiente | #4 | Rama `feature/mcp-phase3-foundation` | PR del fundamento; continuar con catálogo y transporte. |
| 4: operaciones no financieras | Pendiente | Motor 3 | Por publicar | Catálogo cerrado y pruebas con servicios compartidos. |
| 5: operaciones financieras | Pendiente | 3 y 4 | Por publicar | Paridad, concurrencia, reservas y reversión con fixtures. |
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
