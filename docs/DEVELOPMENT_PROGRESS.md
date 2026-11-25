# Continuidad del desarrollo MCP: fases 3–7

Mandato vigente: 24 de noviembre de 2026. El responsable autoriza desarrollar todas las fases secuencialmente en ramas/PR dependientes, sin pedir permiso entre fases. Mantener oficial/fork actuales; la sustitución del historial está suspendida. La exposición histórica sigue abierta y no bloquea desarrollo. No modificar una instalación personal ni activar ejecución MCP real sin aprobación humana demostrada y revisión autorizada.

## Entregas y orden de revisión

| Entrega | Rama / commit | PR oficial | Dependencia / verificación |
|---|---|---|---|
| Auditoría/plan previo | chore/history-audit-phase3-plan / 30a2aac | [#4](https://github.com/JorgeTonos28/Vida_en_orden/pull/4) | Main 317cfd8; CI verde; retirada histórica no ejecutada |
| 3A: motor aislado | feature/mcp-phase3-foundation / 01a410c | [#5](https://github.com/JorgeTonos28/Vida_en_orden/pull/5) | #4; 94 pruebas; 0000–0008 |
| 4: catálogo no financiero | feature/mcp-phase4-domain-catalog / b57a554 | [#6](https://github.com/JorgeTonos28/Vida_en_orden/pull/6) | #5; 101 pruebas; sin migración nueva |
| 5: catálogo financiero | feature/mcp-phase5-financial-catalog / eb6594d | [#7](https://github.com/JorgeTonos28/Vida_en_orden/pull/7) | #6; 110 pruebas; sin migración nueva |
| 3B: transporte/canal web | feature/mcp-proposal-transport-approval / 20de2bf | [#8](https://github.com/JorgeTonos28/Vida_en_orden/pull/8) | #7; 115 pruebas; 0009 |
| 6: endurecimiento | feature/mcp-phase6-hardening / bc453ec | [#9](https://github.com/JorgeTonos28/Vida_en_orden/pull/9) | #8; 130 pruebas; 0010 |
| 7: integración/cierre | chore/mcp-phase7-integration / por publicar | En preparación | #9; 137 pruebas y verificaciones locales aprobadas |

Los PR #4–#9 están abiertos, sin revisión humana, con verify satisfactorio al último control. No se han fusionado. Tienen base main por permisos del oficial; revisar primero el delta desde el commit de dependencia indicado. Main sigue en PR #3 integrado, 317cfd8. No usar force-push, merge directo o bypass para resolver el apilado. El mantenedor revisa/integra y debe repetir CI frente a la base resultante.

## Implementación por fase

**3.** Propuestas inmutables/revisiones, JSON canónico, digest SHA-256 por dominio, owner autenticado, diez minutos de TTL, staging particionado de las 18 tablas de negocio y servicios compartidos mediante AsyncLocalStorage. Se calculan efectos por acción, diff final, impacto/alertas financieras y resultados. Clave idempotente de preparación, CAS de revisión/cancelación, nonce único y aprobación/consumición/evidencia atómicas. Commit en un único batch D1: guardas de owner/digest/TTL/revisión global, revalidación de credencial, delta tipado, auditoría y recibo. Verificación posterior conserva evidencia histórica. Transporte opt-in, página HTTPS/CSRF/origen/anti-framing y WebAuthn UV/UP. Enrollment solo candidato; confianza administrativa ajena al modelo. Pendiente: autenticador humano y canal alojado reales. Fábrica/transporte mantienen constante false.

**4.** 19 adaptadores: tareas/subtareas (crear, editar, duplicar, archivar/reabrir/completar, eliminar, ordenar, contexto), bitácora, workspace, áreas/proyectos y eventos. Referencias a resultados anteriores, validaciones y conservación de campos omitidos. Reversión no financiera derivada del recibo con propuesta nueva, sin cambios posteriores y conservando auditoría. No se inventa borrar áreas/proyectos cuando la UI no lo soporta. Pendiente: aceptación real del plugin tras habilitación segura futura.

**5.** 24 adaptadores R2: cuentas/categorías, movimientos/transferencias/ajustes/anulación, presupuestos/adiciones, obligaciones/ocurrencias/pago, metas/aportes/corrección/reversión, preferencias financieras y gasto legado de tareas. Centavos enteros acotados; lógica de dominio existente. Regresión del reporte neto de transferencia: principal no cuenta como ingreso/gasto y comisión de seis centavos produce neto −6. Pruebas de reservas, pago parcial, ingreso previsto, redondeo, referencias, concurrencia, idempotencia y fallo parcial/rollback. Sin movimientos reales. Pendientes: aceptación humana y ejecución real segura; operaciones ausentes del producto se enumeran en paridad.

**6.** Stream/JSON acotado, fechas reales, claves cerradas, límites de acciones/filas/bytes/consultas/tiempo, búsqueda literal hasta 200 caracteres. Adjuntos texto/CSV/JSON no confiables sin fetch/OCR/fórmulas; alertas auxiliares de instrucciones no sustituyen controles. Informe de integridad interna reutiliza lecturas/cálculos; no conciliación bancaria. Evidencia durable y revocación, efectos por acción/impacto ligado a digest, leases/cleanup vencido y salud sin contenido privado. 0010 invalida planes anteriores sin evidencia y limpia solo staging. Pendiente: cuotas/carga del host, binarios/OCR y política operativa de retención; no prometerlos implementados.

**7.** Pruebas versionadas de D1/workerd, migraciones/journal/ORM/defaults y upgrade 0009→0010 preservando negocio. verify:schema ejecuta generación en copia temporal y exige cero cambios; corrige codificación de defaults de snapshots 0008–0010 (ningún SQL destructivo se aplica/publica). verify:worker arranca el build real con HTTPS loopback/D1 temporal: 31 lecturas, preparación/aprobación con criptografía sintética dentro del Worker, denegación CSRF seguida de request válido en conexión persistente, inscripción no confiable, anti-framing y writes_disabled; después 27 comprobaciones de API/UI. QA rechaza remoto y redirects. Regresiones de jerarquía, cambio entre padres, ciclo previo y completado en fecha local cerca de medianoche. Documentación de aceptación, paridad y upgrade/rollback. Falta cierre final/CI/clon GitHub e investigación alojada; no declarar fase aceptada en plataforma.

## Pruebas y evidencia reproducible

Las entregas 3A–6 ejecutaron npm ci, finanzas/MCP/auditoría, TypeScript, lint, build, audit:public y verify:independent. El CI de cada PR también pasó. En #9: 14 finanzas +112 MCP +4 auditoría =130; 243 archivos auditados, 0000–0010 y 48 tablas en D1 local. Lint conserva cuatro advertencias anteriores sin errores.

Verificación final local de fase 7: npm ci aprobado (710 paquetes); 14 financieras +119 MCP +4 auditoría =137 pruebas, todas aprobadas, sin omitidas. TypeScript, lint (cero errores/cuatro advertencias previas), verify:schema (cero cambios), build y audit:public (250 archivos, cero hallazgos) aprobados. verify:independent aplicó 0000–0010 y comprobó 48 tablas. verify:worker pasó las 31 lecturas (22 válidas/nueve not_found esperados), aprobación criptográfica dentro del Worker, CSRF/conexión persistente, alta no confiable, anti-framing, compuerta cerrada y 27 comprobaciones API/UI. Todo sobre D1 temporal y datos ficticios. Logs ignorados en outputs/phase7-*.log. Pendientes: CI del PR de cierre, clon nuevo GitHub y validación alojada/humana.

Las 31 herramientas de la instalación independiente existente fueron comprobadas antes por su plugin y ahora se consultaron solo capacidades/referencias: fase2, lectura, businessWritesEnabled=false, cero incidencias. No se le aplicó código ni migraciones. Pruebas con firmas sintéticas y D1 local no certifican WebAuthn físico, identidad alojada ni aceptación de ChatGPT.

## Bloqueos y riesgos vigentes

- Revisión/merge del mantenedor. Reglas efectivas exigen PR/verify y bloquean force/delete de main, pero admiten cero aprobaciones. Mantener revisión humana por procedimiento.
- Canal humano real y credencial personalmente fijada. Ningún modelo puede suplir ese acto o abrir ejecución por entorno.
- Compatibilidad de migraciones del host: Sites documenta esquema solamente; 0008 inicializa instalación/triggers y 0010 invalida metadatos. Verificar en un Site privado nuevo; no omitir seguridad, editar SQL ya aplicado ni abrir SQL desde MCP.
- Cuota alojada/performance y política de retención de evidencia/propuestas. Limpieza automática solo de staging vencido propio.
- Historia/PR/forks/cachés anteriores siguen potencialmente accesibles. Auditoría de fuente actual no equivale a purga histórica.

## Cómo reanudar

1. Leer AGENTS, este documento, CURRENT_STATE, ROADMAP, plan maestro/paridad, HUMAN_APPROVAL_SETUP, MCP_HARDENING y UPGRADE_AND_ROLLBACK. Inspeccionar git status y preservar cambios; no resetear ni integrar en main.
2. Revisar estado real de PR/CI y obtener la rama chore/mcp-phase7-integration del fork actual, o el último commit integrado cuando el mantenedor complete la cadena. Verificar los commits antes de copiar código.
3. Si la entrega final sigue sin publicar, registrar SHA/PR, audit:public y diff --check, commit/push ordinario y PR que declare dependencia #9. Si ya existe, actualizar ese PR, sin force-push.
4. Repetir instalación desde GitHub en clon nuevo sin configuración local; npm ci y suite de AGENTS. Registrar resultados exactos. Usar únicamente D1 temporal y datos ficticios.
5. Evaluar/publicar solo un Site privado de desarrollo nuevo desde el commit verificado, con identidad/D1 propias, usando el flujo oficial de Sites. Nunca actualizar la instalación personal existente. Si hay un intento previo, reutilizar su project_id/versión/deployment privados bajo work; no crear duplicados ni repetir migraciones inciertas.
6. Preparar UAT-3-HUMAN; el propietario debe accionar su autenticador y fijar la credencial legítima por administración. Continuar tareas independientes mientras ese paso está pendiente. No declarar aprobada una prueba manual ni habilitar negocio por pasar tests locales.
