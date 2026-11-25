# Informe de desarrollo de fases 3–7

24 de noviembre de 2026. Código implementado/probado, Site privado publicado, registro/firma personal y conexión auténtica del plugin verificados. APPROVED con evidencia durable y ejecución denegada, sin negocio. **Faltan revisión/integración, habilitación separada y aceptación de ejecución futura.** No hubo merges, force-push, cambios de protecciones ni modificaciones de instalaciones personales. No se creó otro repositorio público ni se sustituyó historia.

## Inventario y estado por fase

| Fase | Implementación | Estado restante |
|---|---|---|
| 3 | Propuestas/revisiones inmutables, diff/impacto, propietario/huella, TTL, replay/idempotencia, concurrencia, WebAuthn, batch atómico, auditoría/recibo/verificación y bootstrap autenticado | Registro/plugin/firma humana verificados; APPROVED con evidencia y ejecución denegada. Revisión/integración pendientes |
| 4 | 19 acciones de tareas/subtareas, contexto/orden/estados/fechas, áreas/proyectos, calendario/recurrencia y bitácora; reversión por recibo | Pruebas aisladas aprobadas; ejecución MCP real bloqueada hasta habilitación revisada |
| 5 | 24 acciones financieras de cuentas, movimientos/comisiones, catálogos existentes, presupuesto, obligaciones/recurrencia/reservas, metas/aportes, preferencias y vínculos | Integridad contable probada con datos ficticios; misma compuerta pendiente, sin movimientos financieros reales |
| 6 | Texto/CSV/recibo JSON no confiable, informes internos, validación/límites, evidencia/revocación, salud/leases y recuperación | Texto, reporte vacío y salud probados también en plataforma; binarios/OCR/bancos no disponibles, carga/cuotas/retención pendientes |
| 7 | Worker/D1, migraciones/ORM, CI/clones, auditorías, exportación trazable, publicación privada y documentación/UAT |31 lecturas y firma reales verificadas; no completada: faltan aceptación de ejecución futura, carga/cuotas y revisión/integración |

MCP_PARITY_MATRIX enumera las 43 acciones y las excepciones: split/reconciliación, CRUD de conceptos, archivo de obligaciones/metas, reasignación genérica de reservas, importación/restauración MCP y otras capacidades que la aplicación no soporta. No se cubren con SQL/CRUD genérico.

Las 31 lecturas conservan contratos/anotaciones y ausencia de efectos. Catálogo 31 por defecto; 33/42/44 con opt-in. Solo metadatos/staging son mutables. Fábrica y transporte mantienen `MCP_BUSINESS_WRITES_ENABLED=false`; incluso APPROVED no habilita ejecución. El constructor del executor solo se habilita en pruebas aisladas. Texto, archivos y `confirmed` no sustituyen firma ni fijan confianza. El campo conservador `platformHumanApprovalVerified` sigue false en código: una prueba de una instalación no lo cambia globalmente.

## PR y commits

Orden de revisión/integración: [#4](https://github.com/JorgeTonos28/Vida_en_orden/pull/4) → [#5](https://github.com/JorgeTonos28/Vida_en_orden/pull/5) → [#6](https://github.com/JorgeTonos28/Vida_en_orden/pull/6) → [#7](https://github.com/JorgeTonos28/Vida_en_orden/pull/7) → [#8](https://github.com/JorgeTonos28/Vida_en_orden/pull/8) → [#9](https://github.com/JorgeTonos28/Vida_en_orden/pull/9) → [#10](https://github.com/JorgeTonos28/Vida_en_orden/pull/10) → [#11](https://github.com/JorgeTonos28/Vida_en_orden/pull/11) → [#12](https://github.com/JorgeTonos28/Vida_en_orden/pull/12). Abiertos, sin revisión humana al corte; comprobar el CI del HEAD antes de integrar. Main sigue 317cfd8.

Cierre 33a6a53/docs12f6bde; dependencias a067ef7; compatibilidad Sites a05433d; registro inicial **5359d43**; documentación de publicación b376ae4. DEVELOPMENT_PROGRESS registra ramas, commits y deltas. Los PR tienen base main por permisos del fork y diffs acumulativos: revisar cada delta desde su dependencia y repetir CI al integrar. No fusionar fuera de orden ni eludir protecciones.

## Pruebas ejecutadas

| Comprobación | Resultado observado |
|---|---|
| Instalación | npm ci, 709 paquetes del lock corregido; CI hizo checkout/instalación nuevos |
| Finanzas / MCP / auditoría | 14 +128 +4 =146 aprobadas, cero omitidas |
| TypeScript / lint | Aprobados; cero errores/cuatro advertencias previas |
| Schema / build | Drizzle no genera cambios en copia temporal; build aprobado con avisos upstream no bloqueantes |
| Auditorías | Fuente: 261 archivos sin hallazgos; npm: cero vulnerabilidades, desarrollo incluido/umbral low |
| D1 independiente | 12 SQL 0000–0011 /48 tablas en D1 temporal, sin remoto |
| Worker completo / proyectado | 31 lecturas, registro antes de preparar, WebAuthn sintético, CSRF/anti-framing y compuerta cerrada; 27 QA API/UI en cada modo |
| Exportación Sites | HEAD limpio, sin Git/configuración ajenos; 12 SQL, 21 DML conocidos diferidos, gate sin hallazgos y hashes trazables |
| CI / GitHub | Código 5359d43: run 45504851134 verde; docs b376ae4: run 45505805497 verde. Clon repite146 pruebas/auditoría con lock idéntico y árbol limpio |
| Backend Sites | Deployment satisfactorio de la misma versión 2/entorno 2; clave pública propia configurada privadamente, MCP y 48 tablas |
| Registro/identidad reales | Propietario confirmó creación personal, nonce consumido y perfil MCP coincidente; health confirma esquema / 54 triggers/metadatos versión 1 |
| Plugin conectado | 44 herramientas; 31 lecturas: 22 válidas/nueve not_found esperados por IDs ficticios inexistentes, cero fallos y entidades vacías |
| Ampliaciones/idempotencia | Reporte vacío consistente; texto no confiable sin aprobación/efectos; prepare conserva propuesta/huella/revisión al repetir clave |
| Firma y compuerta reales |APPROVED con revisión/digest exactos; evidencia WebAuthn persistida ligada a owner/clave/origen/desafío, nonce consumido dentro de TTL. Commit devuelve writes_disabled antes/después de firma; cero tarea/workspace/ejecuciones y revisión de negocio 0 |
| Autorización negativa | Servicio sin visitante recibe 401 en MCP/enrollment; página 200 y anti-framing aprobados. No se fabricó identidad |

El lock basal tenía33 entradas afectadas, incluidas dos críticas. Ese artefacto nunca se desplegó. DEPENDENCY_SECURITY documenta corrección de runtime/transitivas y migración real a Zod4, sin --force ni degradar Drizzle. Auditar fuente y dependencias verifica riesgos distintos; no garantiza seguridad futura.

La primera propuesta expiró sin firma; el propietario firmó la segunda dentro del TTL y confirmó su intervención personal. La evidencia persistida coincide con la clave fijada y el origen exacto, revisión/huella/desafío/owner; se observó APPROVED antes de caducidad y cero ejecución/negocio. Su expiración posterior es normal y no requiere repetir esta prueba. Siguen pendientes aceptación de ejecución futura, adjuntos/visualización con datos UAT y carga/cuotas máximas del host.

## Publicación, migraciones y recuperación

El Site es nuevo, owner-only, con D1/configuración propias. Código público 5359d43 y commit privado de versión 2 se registran por separado; IDs/URL/clave/ownerId nunca se publican en GitHub. Hashes de migraciones idénticos a versión 1. La clave pública legítima se fijó privadamente tras confirmación personal; entorno 2 redespliega la misma versión sin código/SQL nuevos. La instalación existente conserva fase2/31 lecturas/negocio cerrado/referencias válidas, sin cambios.

SITES_METADATA_BOOTSTRAP conserva SQL original 0000–0010 y añade 0011. Para Sites exporta DDL/triggers con hashes; el primer registro o prepare explícitos y autenticados inicializa metadatos atómicamente, invalida planes anteriores y conserva negocio/revisión/recibos. GET, lecturas y denegaciones no inicializan. No hay DDL en requests, SQL del modelo ni ledger falsificado. La automatización es freshInstallationOnly; previews con otra representación requieren inspección y autorización de su propietario.

El 503 inicial se reprodujo antes de corregir. Tres regresiones cubren arranque, denegaciones/esquema incompleto/versión futura y rollback; ambos Workers prueban registrar primero. Reintento de registro y firma humana posteriores terminaron correctamente; clave/evidencia permanecen privadas. Esta verificación no cambió código, SQL ni configuración del executor.

UPGRADE_AND_ROLLBACK exige autorización, respaldo/restauración aislada, ledger/hashes, flags apagados y requests drenados, versión exacta y mecanismo soportado. Rollback conserva datos/esquema/evidencia; no DROP, restauración ni downgrade automático. Un merge nunca despliega otro Site. Ante timeout de ejecución futura, consultar recibo/idempotencia antes de reintentar; reversión no financiera requiere nueva propuesta/firma y finanzas usan servicios de anulación específicos.

## Aceptación y límites

USER_ACCEPTANCE_TESTS contiene requisitos, datos, pasos, persistencia, errores y estado. Registro, clave propia, conexión, UAT-3-HUMAN y bloqueo de commit tras APPROVED ya aprobados: no repetirlos. La tarea/workspace propuestos no se crearon. No pedir PIN/contraseña/clave privada ni repetir pruebas automatizadas o llamadas reales ya verificadas. Toda incidencia corregida requiere regresión antes del cierre.

El canal humano ya está demostrado. Fases 4/5 reales siguen bloqueadas hasta una habilitación posterior revisada; la prueba no abre negocio ni cambia globalmente platformHumanApprovalVerified. Persisten revisión/integración, aceptación de ejecución futura, cuota/rendimiento/retención y capacidades ausentes de paridad. Historial, PR antiguos, forks y cachés siguen potencialmente accesibles; su sustitución fue suspendida y no se declara retirada histórica.
