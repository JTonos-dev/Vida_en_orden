# Continuidad del desarrollo MCP: fases 3–7

Corte: 24 de noviembre de 2026. Mandato: desarrollar todas las fases técnicamente viables en ramas/PR dependientes; no pedir permiso entre fases. Oficial/fork actuales son la fuente de desarrollo. La sustitución histórica está suspendida y la exposición pública anterior **no está resuelta**. No modificar instalaciones personales ni abrir negocio MCP sin aprobación humana demostrada y revisión autorizada.

## Situación para continuar

Rama activa fix/mcp-schema-only-bootstrap, PR #12. Código corregido **5359d432b7a912b248b680d9baae1b5307710ff0**: 146 pruebas, instalación limpia, TypeScript/lint/schema/build, ambas auditorías, D1 independiente y los dos modos Worker aprobados. CI run 45504851134 verde; 146 pruebas repetidas desde el clon GitHub con lock idéntico. Se publicó en la versión 2 del mismo Site privado de desarrollo. Los commits posteriores solo documentan estos resultados; consultar el HEAD/check del PR antes de integrar.

**Incidencia de aceptación y corrección:** el propietario reportó «Falta migrar la base MCP» al registrar antes de la primera propuesta. Se reprodujo el 503: enrollment esperaba metadatos que solo prepare inicializaba. La corrección comparte comprobación de esquema/triggers y bootstrap atómico entre preparación y POST de registro autenticado/CSRF válido. GET, lecturas y denegaciones no inicializan; el candidato no fija confianza automáticamente. Tres regresiones elevan la suite a **146 aprobadas (14 +128 +4)**. El propietario reintentó, confirmó registro personal y entregó su candidato; D1 muestra desafío consumido para ese propietario y metadata_version=1, sin negocio. **El registro humano alojado ya está verificado.** Esto todavía no equivale a firmar una propuesta.

Se publicó **un Site privado nuevo de desarrollo**, con audiencia exclusiva del propietario, D1 propia, versión Sites 2/entorno revisión 2 y MCP provisionado. La revisión de entorno 2 fija privadamente la clave pública creada y confirmada por el propietario; se redesplegó la misma versión guardada, sin otra versión ni código/migraciones nuevos. El inventario nativo observó 48 tablas sin omisiones. El commit privado publicado procede del 5359d43 público; contiene proyección, identidad propia y hashes, confirmados por la versión nativa. Los hashes de migraciones son idénticos a versión 1. IDs, URL, SHA privado y deployment están solo en work/phase7-development-site-20261124/outputs/provenance.json; nunca copiarlos a GitHub, ni la credencial/ownerId. El artefacto basal c6881fa anterior a las correcciones no debe desplegarse.

**Conexión real verificada:** el plugin de desarrollo ya expone 44 herramientas. Capacidades y perfil MCP coinciden con el propietario del registro; health devuelve schemaReady=true/metadataReady=true/versión 1, incluidos los 54 triggers. Se invocaron las 31 lecturas: 22 respuestas válidas y 9 not_found esperados por IDs ficticios inexistentes, cero fallos; referencias válidas y todas las entidades vacías. Informe ampliado vacío consistente; adjunto ficticio marcado no confiable, approvalGranted=false/businessEffects=0. Preparación repetida con la misma clave conserva propuesta/revisión/huella. Estas son llamadas reales del plugin, sin headers fabricados. El acceso de servicio sin visitante sigue denegado 401; no es la identidad usada para esas pruebas.

**Paso humano pendiente:** la primera propuesta ficticia de tarea `UAT Synthetic approval` caducó sin firma (EXPIRED). Incluía la inicialización del workspace vacío, visible en el diff. Preparar un enlace nuevo al entregarlo al propietario, con otra clave idempotente; no reutilizar ni extender TTL. La huella/ID/enlace vigentes se conservan solo en la trazabilidad privada. Nunca firmar con una clave del modelo ni solicitar PIN/contraseña/clave privada. Tras firma personal, consultar estado/digest/revisión y evidencia; solicitar commit solo para comprobar writes_disabled, además de ausencia de tarea/workspace persistidos. El panel nativo dejó el enlace en cola y el control del navegador devolvió acceso denegado; entregar el enlace directamente, sin afirmar navegación visual verificada ni sortear ese bloqueo.

El propietario no conoce el mecanismo de migraciones de Sites: **no pedirle investigar soporte**. Se resolvió mediante proyección DDL y bootstrap autenticado fuera del esquema. Ver SITES_METADATA_BOOTSTRAP. La validación real del autenticador sigue reservada al propietario y no se sustituye por nuestros tests sintéticos.

## Entregas / orden de integración

| Entrega | Rama / código | PR | Dependencia y evidencia histórica |
|---|---|---|---|
| Auditoría/plan | chore/history-audit-phase3-plan / 30a2aac | [#4](https://github.com/JorgeTonos28/Vida_en_orden/pull/4) | Main317cfd8; CI verde; retirada histórica no ejecutada |
| 3A: motor | feature/mcp-phase3-foundation / 01a410c | [#5](https://github.com/JorgeTonos28/Vida_en_orden/pull/5) | #4; 94 pruebas; 0008 |
| 4: no financiero | feature/mcp-phase4-domain-catalog / b57a554 | [#6](https://github.com/JorgeTonos28/Vida_en_orden/pull/6) | #5; 101 pruebas; 19 acciones |
| 5: financiero | feature/mcp-phase5-financial-catalog / eb6594d | [#7](https://github.com/JorgeTonos28/Vida_en_orden/pull/7) | #6; 110 pruebas; 24 acciones |
| 3B: canal humano | feature/mcp-proposal-transport-approval / 20de2bf | [#8](https://github.com/JorgeTonos28/Vida_en_orden/pull/8) | #7; 115 pruebas; 0009 |
| 6: endurecimiento | feature/mcp-phase6-hardening / bc453ec | [#9](https://github.com/JorgeTonos28/Vida_en_orden/pull/9) | #8; 130 pruebas; 0010 |
| 7: integración | chore/mcp-phase7-integration / 33a6a53, docs 12f6bde | [#10](https://github.com/JorgeTonos28/Vida_en_orden/pull/10) | #9; 137 pruebas/CI/clon |
| Dependencias seguras | fix/mcp-runtime-dependencies / a067ef7 | [#11](https://github.com/JorgeTonos28/Vida_en_orden/pull/11) | #10; 138 pruebas/CI/clon, cero alertas npm |
| Compatibilidad Sites y registro inicial | fix/mcp-schema-only-bootstrap / a05433d, corrección 5359d43 | [#12](https://github.com/JorgeTonos28/Vida_en_orden/pull/12) | #11; 146 pruebas/CI/clon, 0011, Site privado versión 2 publicado |

Todos están abiertos, sin revisiones humanas al último control. Tienen base main por permisos del oficial: diffs acumulativos, delta de cada entrega desde el commit de dependencia indicado. El mantenedor revisa/integra #4→#12 en orden y repite CI tras conflictos/cambio de base. No merge/force-push/bypass por el agente. Main oficial sigue 317cfd8 (PR #3). Reglas efectivas: PR/verify, no force/delete, cero aprobaciones obligatorias; la revisión humana se exige por procedimiento, sin declarar una protección más fuerte que la real.

## Qué está implementado

- **3:** propuestas/revisiones inmutables, canon/digest, identidad, diez minutos de TTL, staging de 18 tablas, efectos por acción/diff/impacto financiero, idempotencia, CAS/concurrencia, nonces, WebAuthn UV/UP, evidencia durable, batch atómico, recibos y verificación posterior. Bootstrap de metadatos versión 1 idempotente/atómico desde registro o preparación explícitos y autenticados; lecturas no inicializan. Fábrica/transporte mantienen false.
- **4:**19 acciones cerradas de tareas/subtareas, estados/orden/contexto/fechas, bitácora, workspace, áreas/proyectos y eventos. Servicios compartidos, referencias previas, parches conservativos y reversión no financiera desde recibo, con nueva aprobación y sin cambios posteriores.
- **5:**24 acciones R2 de cuentas/categorías/movimientos/comisiones/presupuesto/obligaciones/metas/aportes/preferencias y gasto legado. Centavos enteros, reservas, anulaciones, vínculos y no doble conteo; transferencias netas solo por comisión. Regresión adicional de ajuste positivo/anulación. Nada financiero real.
- **6:** JSON/stream acotado, fechas reales, esquemas cerrados, límites/consultas/tiempo, texto/CSV/JSON no confiables, informe interno de integridad, leases/limpieza vencida, salud, revocación y evidencia/verificación de ejecución. Sin binarios/OCR ni conexión bancaria; carga/retención operativa pendientes.
- **7:** ORM/SQL/journal/defaults, upgrade, D1/workerd, Worker HTTPS completo y proyectado, instalación GitHub, CI, auditorías, proyección trazable y publicación privada nueva. UAT/aceptación humana/plataforma todavía pendientes: no declarar fase 7 completada.

La matriz MCP_PARITY_MATRIX enumera alcance exacto y capacidades ausentes del producto. Las 31 lecturas originales conservan contrato/anotaciones. Catálogo31 por defecto;33 solo ampliaciones,42 solo propuestas,44 ambos flags. Las nuevas mutaciones solo afectan metadatos/staging. El modelo no aprueba, elige scope/owner, fija confianza ni abre negocio mediante confirmed, archivos o entorno.

## Verificación final reproducible

| Comprobación | Resultado observado |
|---|---|
| npm ci |709 paquetes en el conjunto corregido; lock sin cambios entre #11/#12; CI hizo instalación limpia |
| test:finance / test:mcp / test:audit |14 +128 +4 =146 aprobadas tras la regresión del registro inicial, cero omitidas |
| TypeScript / lint |Aprobados; cero errores, cuatro advertencias previas de componentes |
| verify:schema |Cero migraciones generadas en copia temporal |
| build |Aprobado; advertencias upstream de sourcemaps/configuración futura, sin fallo |
| audit:public |261 archivos del código a05433d, cero hallazgos; repetir ante documentación/archivos nuevos |
| audit:dependencies |Cero vulnerabilidades, todas las dependencias/umbral low; 33 entradas basales corregidas |
| verify:independent |12 SQL 0000–0011 en D1 temporal; 48 tablas, sin remoto |
| verify:worker |31 lecturas (22 válidas/nueve not_found esperados), registro antes de preparar, crypto/CSRF/alta/compuerta;27 QA API/UI; repetido tras la regresión |
| verify:sites |Lo anterior con proyección DDL, salud/GET/denegaciones sin bootstrap y transición en registro;27 QA API/UI; repetido tras la regresión |
| prepare:sites / gate privado |Exportación real de HEAD limpio;12 SQL,21 DML diferidos; gate sin hallazgos |
| GitHub CI #12 |verify aprobado en código 5359d43, run 45504851134; consultar el check del HEAD documental posterior |
| Clon GitHub |#10/#11 y a05433d completos según registros anteriores;5359d43 repite14+128+4 y auditoría de fuente, lock sin cambios/árbol limpio |
| Sites nativo |Deployment succeeded, misma versión 2/entorno 2 del código 5359d43, clave pública propia fijada privadamente, MCP y 48 tablas |
| Identidad alojada negativa |Servicio sin visitante:401 MCP/enrollment; página y anti-framing aprobados |
| Registro humano / ChatGPT nuevo |Registro personal confirmado y nonce consumido; perfil/44 herramientas/31 lecturas/salud/2 ampliaciones/idempotencia verificados en plataforma; firma de propuesta pendiente |

Logs ignorados: outputs/bootstrap-*.log (a05433d) y outputs/enrollment-*.log (corrección); clones en work/phase7-github-verification-20261124/outputs (phase7, runtime y sites). La cadena original conserva 21 DML de metadatos y su gate falla deliberadamente; publicar únicamente la proyección que supera el gate, sin editar SQL aplicado ni falsear ledger. 0011 no cambia negocio. Bootstrap invalida planes antiguos una vez y conserva recibos/evidencia.

Se comprobó nuevamente la instalación existente mediante su plugin: fase 2,31 lecturas, businessWritesEnabled=false, referencias válidas/cero incidencias. No se le aplicaron código ni migraciones ni se reutilizó su configuración/datos.

## Próximos pasos y riesgos

1. Registrar el resultado de la firma personal de una propuesta vigente. La primera expiró; preparar otra al entregar el enlace y conservar su ID/revisión/huella/TTL en provenance. Clave fijada y herramientas conectadas: no repetir registro/instalación ni crear otra instancia.
2. Consultar get_approval_status y comprobar revisión/huella/TTL, evidencia válida y APPROVED después de firma física; verificar cero tarea/workspace persistidos y commit denegado. Si hay error, añadir regresión antes de corregir/cerrar. Cancelación/replay/crypto/carreras ya tienen pruebas automáticas.
3. Si la propuesta expiró, consultar primero su estado y preparar otra con nueva clave idempotente. No generar una clave de autenticador propia ni reemplazar la confirmada para avanzar. Verificar CI del HEAD documental antes de entregar/integrar.
4. Mantener UAT en USER_ACCEPTANCE_TESTS; no pedir repetir automatizables ni marcar pruebas humanas aprobadas por inferencia. Fases 4/5 reales siguen bloqueadas por la habilitación posterior revisada; no modificar la constante por completar tests locales.
5. Antes de cualquier actualización existente: autorización, respaldo/restauración aislada, ledger/hashes, flags apagados, requests drenados y procedimiento de UPGRADE_AND_ROLLBACK. La proyección automatizada está marcada freshInstallationOnly; previews que aplicaron otra representación requieren inspección específica, no resets automáticos.

Persisten revisión del mantenedor, aceptación ChatGPT/autenticador, carga/cuotas/retención y capacidades ausentes del producto. Historia/PR/forks/cachés anteriores siguen potencialmente accesibles; fuente actual y npm sin hallazgos no equivalen a purga histórica. No se continúa su sustitución.
