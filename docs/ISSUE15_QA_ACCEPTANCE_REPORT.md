# Issue #15 — QA nueva con esquema hasta 0012

Corte: 25 de noviembre de 2026. Fuente oficial seleccionada: `d1935627fc5c4821d795d6c9c993771780bd9cc4`, con PR #4–#12 y #14 integrados. [CI posterior al merge aprobado](https://github.com/JorgeTonos28/Vida_en_orden/actions/runs/45531409462). Seguimiento: [issue #15](https://github.com/JorgeTonos28/Vida_en_orden/issues/15). Este documento no sustituye ni cierra la [issue #13](https://github.com/JorgeTonos28/Vida_en_orden/issues/13).

Entrega de evidencia/regresiones: [PR #16](https://github.com/JorgeTonos28/Vida_en_orden/pull/16), commit66202e8 y trazabilidad posterior; [CI del HEAD publicado](https://github.com/JorgeTonos28/Vida_en_orden/pull/16/checks). Auditoría de fuente de la entrega:269archivos/cero hallazgos; el clon basal tenía268. No atribuir CI de otro commit a un HEAD posterior ni confundir aprobación de tests/docs con autorización de ejecución.

## Candidato preparado y autorización

Se obtuvo un clon limpio del oficial y una exportación nueva con `prepare:sites`, marcada `freshInstallationOnly`. El candidato conserva el código integrado y todas las migraciones originales; la proyección elimina únicamente las 21 instrucciones conocidas de metadatos de 0008/0010. Incluye 13 SQL (0000–0012). No deriva de un checkout privado de publicación, D1, respaldo, credencial, variable ni identidad de instalaciones anteriores. El template auditado conserva `project_id=null`, binding `DB`, capacidad `mcp` y sin R2; únicamente el checkout privado nuevo recibió la identidad nativa recién creada.

**Estado de plataforma: QA nueva creada y publicada, versión Sites1/entorno 1, acceso exclusivo del propietario confirmado.** El propietario autorizó explícitamente creación, guardado, publicación y configuración de identidad propia/propuestas/staging/lecturas ampliadas en esta única QA. No autorizó negocio ni cambios en instalaciones existentes. No se creó/fijó una credencial WebAuthn; configuración vacía `[]`. Identidad de propietario/origen se obtuvieron del registro nativo de la QA nueva, sin copiar variables de otro Site. Valores privados permanecen secretos, fuera de GitHub.

Se creó un único Site nuevo, privado exclusivamente del propietario, con D1 nueva/vacía/exclusiva. El helper oficial construyó/empaquetó/publicó la fuente exacta; se comprobaron 267 archivos exportados sin cambios, excepto manifiesto propio y gitignore de ejecución. La versión nativa coincide con el commit privado y el despliegue terminó succeeded, MCP provisionado. `MCP_BUSINESS_WRITES_ENABLED=false` permanece fijado en código. No se modificaron las instalaciones existentes.

El plugin nuevo figuraba instalado, pero no exponía herramientas en esta conversación. El propietario lo seleccionó y la nueva conexión autenticada quedó disponible: **44 herramientas invocadas**, incluidas las 31 lecturas. No se usaron plugins anteriores ni headers de visitante fabricados. La apertura de la URL en Codex devolvió queued y el visor automático no respondió: no certifica visita, recarga visual ni reconexión posterior a las pruebas.

## Evidencia local

| Comprobación | Resultado y alcance |
|---|---|
| Procedencia | Clon nuevo de GitHub, HEAD exacto d193562, árbol público limpio antes de exportar; CI del mismo commit aprobado. La exposición histórica conocida no se declara purgada. |
| Proyección | `prepare:sites`:13 SQL,21 instrucciones de metadatos diferidas; `verify:hosting`:schema_only_candidate, cero hallazgos, backendVerified=false. |
| Hashes | 13 originales/proyectados verificados contra Git y archivos exportados; en Windows Git aplica filtros de finales de línea al exportar, por lo que se comparan los bytes filtrados de ese commit. 0012 proyectado SHA-256 `04adaf027cb3317480e32ec5bdc4309d4c835578330889004e55bf194130f8cb`. No se editaron migraciones. |
| Contenido publicable | 269 archivos del template inspeccionados, cero hallazgos. Sin Git, secretos, identificadores privados, estado D1, backups ni archivos de instalaciones anteriores. Incluye el manifiesto de proyección; este es adicional a los 268 archivos de la fuente pública. |
| Esquema vacío | Cadena proyectada completa en SQLite en memoria:48 tablas,54 triggers, índice audit_log_seed_context_idx con owner_id/entity_type/entity_id/action/id; todas las tablas vacías e integrity_check=ok. No inicializa instalación/usuario por lectura. |
| Suite integrada | 166 aprobadas:14 financieras,144 MCP,4 auditoría,4 recuperación, cero omitidas. Dependencias sin vulnerabilidades y auditoría pública268 archivos/cero hallazgos. TypeScript/lint sin errores; cuatro advertencias existentes. |
| Instalación completa | Build, verify:schema sin cambios, verify:independent (13 SQL/D1 temporal) y verify:worker/verify:sites del clon oficial aprobados;31 lecturas/WebAuthn sintético/denegaciones/27 QA API por modo. También build/lint y ambos Workers ampliados de esta entrega aprobados. Ningún QA destructivo local apuntó al Site. |
| Worker de esta entrega | Ambos modos locales incorporan comprobaciones de revisión válida/inválida, conservación de aprobación ante fallo, invalidación de revisión anterior, cancelación obsoleta denegada, nueva solicitud HTTP que conserva revisión/huella, idempotencia original y cancelación persistida; commit siempre writes_disabled y referencias/configuración sin negocio/staging. No es una recarga de navegador ni reconexión real del plugin. |

## Evidencia ejecutada en Sites y MCP de QA

Antes de preparar propuestas, el visor nativo mostró las 48 tablas vacías; repetir la captura después de las 31 lecturas mantuvo cero filas en todas, incluida mcp_installation. Health alojado dio schemaReady=true/metadataReady=false: comprueba presencia de tablas,54nombres de triggers e índice0012, no su DDL completo. El informe ampliado falló cerrado con initialization_required, sin inicializar por lectura.

Las31 lecturas devolvieron22 respuestas válidas/nueve not_found esperados con identificadores ficticios inexistentes. El perfil coincide con el propietario nativo de la QA. Las13 herramientas adicionales también se invocaron: preparación/revisión/cancelación/consulta/lista/enlace/estado/health/commit/recibo/reversión, adjunto e informe. Ausencia de recibo devuelve receipt=null y receiptPresent=false; reversión sin ejecución se deniega invalid_reversal. El adjunto con instrucciones ficticias se marca dato no confiable, approvalGranted=false/businessEffects=0.

Se preparó una tarea ficticia sin ejecutarla: VALIDATED, instalación propia inicializada una vez y metadata_version=1. Reintento con la misma clave conserva propuesta/revisión/huella; acciones distintas con esa clave dan idempotency_conflict. Título vacío se rechaza en el schema del conector antes de llegar al host. Revisión con referencia inexistente sí llega al dominio y devuelve internal_error genérico: conserva la revisión/huella vigente. Se añadió regresión local de esa preservación, sin cambiar el diagnóstico funcional del código desplegado.

La revisión válida añadió una cuenta ficticia solo a staging: revisión2 y huella nueva; revisión1 INVALIDATED. Cancelar con expected_revision=1 dio stale_proposal. Reintentar la preparación original siguió devolviendo revisión1/huella original, sin resucitarla. Solicitar enlace de aprobación produjo PENDING_APPROVAL, sin firma ni confianza; cancelar revisión2 dejó CANCELLED. Commit antes y después de cancelar dio writes_disabled. No se probó APPROVED en esta QA ni expiración alojada por espera; están cubiertos sintéticamente en local y una nueva aprobación real requeriría al propietario y su credencial propia.

Comprobación nativa final de todas las tablas: **cero filas en las 18 tablas de negocio (incluida auditoría), cero staging/leases/ejecuciones/aprobaciones/evidencias/registro de credenciales; business_revision=0**. Solo quedaron metadatos: instalación1, propuesta2revisiones con un head, mapeo idempotente1, desafío sin firmar1 y auditoría de planes6. Health final schemaReady=true/metadataReady=true, metadataVersion1, un plan CANCELLED y staging0. El informe ampliado es completo/consistente y vacío, sin conciliación bancaria ni reparaciones.

Métricas alojadas de preparación observadas en auditoría:23 consultas de dominio/415 ms para una acción;81 consultas/1319 ms para la revisión de dos acciones. Son contadores internos y tiempo transcurrido de esas muestras, **no CPU, consumo de memoria, número total de llamadas D1 ni cuota contratada**. Tampoco prueban capacidad cerca del límite 2.000/2 MiB. No se hicieron pruebas de carga ni purgas.

Los logs y hashes de preparación están en los directorios locales ignorados `outputs/issue15-*` y `work/issue15-official-verification-20261125/outputs/issue15-*`. La fuente proyectada está dentro de `work` de ese clon limpio. El checkout privado QA es `work/issue15-qa-site-20261125`; el registro privado de procedencia conserva versión/commit privado/deployment/entorno. No copiar secretos ni contenido de otra instalación para continuar.

## Matriz de aceptación alojada

| Caso | Estado actual | Verificación tras autorización |
|---|---|---|
| QA-ACCESS | Probado alojado | get_site confirma owner-only, un propietario, sin grupos/terceros/externos; política MCP propia configurada en entorno 1. |
| QA-SCHEMA | Probado alojado; ledger/DDL no disponibles | Deployment/48 tablas y health comprueban presencia del contrato/54 triggers/índice0012. Preparaciones exitosas ejercitan el índice. Definiciones y columnas exactas probadas en proyección local; no atribuir al health una inspección completa del DDL/ledger nativo. |
| QA-READ31 | Probado alojado | 31 originales desde el plugin nuevo:22 válidas/nueve not_found esperados, referencias sin incidencias; cero inicialización/filas por lecturas. Anotaciones y schemas conservados/comprobados en fuente/Worker. |
| QA-IDENTITY | Probado parcialmente alojado | Perfil de propietario coincidente; servicio sin visitante401 en MCP/enrollment. Política ausente/otro propietario probados localmente. Sin segunda identidad alojada autorizada; no ampliar acceso ni fabricar headers para probarla. |
| QA-PROPOSALS | Probado alojado | Idempotencia, conflicto, revisión fallida conservada, revisión válida con tarea/cuenta ficticias, estado anterior INVALIDATED, cancelación obsoleta denegada, enlace PENDING_APPROVAL y cancelación final. Cero negocio. |
| QA-CLOSED | Probado alojado | Commit devuelve writes_disabled antes/después de cancelación; cero negocio/ejecuciones. No abrir compuerta para probarla. |
| QA-RELOAD | Conexión inicial probada; recarga/reconexión posterior pendiente | Plugin seleccionado por el propietario y44 herramientas invocadas. Falta recarga visual y reconexión después del estado final; no equivalen a solicitudes consecutivas. |
| QA-WEBAUTHN | No transferida; nueva prueba humana no ejecutada | Si una entrega posterior lo necesita, el propietario registra personalmente una credencial nueva de esta QA y administración fija su clave pública. La firma anterior es evidencia histórica de otra instalación. |
| QA-RESOURCES | No disponible en host aún | Diagnosticar cuotas/CPU/memoria/espacio/latencia cuando Sites lo permita, sin inventar medidas ni generar carga. Cero datos y CI verde no certifican escala. |

## Límites, rollback y habilitación futura

Incidencias de preparación resueltas sin cambiar la aplicación: get_site con include_mcp_connection antes de publicar devuelve el requisito de publicar primero (se consultó acceso sin ese flag); el lanzador de comandos genéricos npm en el helper de Windows no pudo arrancar y se sustituyó por invocación Node documentada. La comparación inicial de hashes sin filtros de Git difería por finales de línea Windows; comprobar bytes exportados con los filtros del mismo commit resolvió esa verificación. No se alteró SQL para hacer pasar el gate.

Limitación de diagnóstico pendiente: una referencia inexistente del dominio legado se informa como internal_error genérico. Se comprobó fallo cerrado y preservación de la propuesta previa; no se declara resuelto ni se mezcló un cambio de negocio en esta entrega de aceptación. Una mejora posterior debe tipar el error sin revelar datos y conservar la regresión de atomicidad.

Persisten 2.000 filas conjuntas en las otras 17 tablas, incluidas filas archivadas/históricas, snapshot2 MiB,20 acciones, diff100 filas/64 KiB,payload128 KiB,400 consultas de dominio y 60 s de preparación. Esos presupuestos no equivalen a cuotas reales de Sites/D1/CPU; la memoria/CPU del host no se ha medido. audit_log histórico no consume el snapshot salvo marcador de contexto, pero tampoco se purga. No truncar datos para pasar un límite.

Ante fallo del primer despliegue, conservar identificadores/versión/deployment y evidencia solo privadamente; continuar el mismo Site y resolver el estado nativo de migraciones antes de reintentar. No crear otro Site a ciegas, modificar SQL aplicado/ledger ni usar SQL remoto genérico. Si el candidato nunca se publica, no existe versión alojada a la que volver. Si existe una versión previa de esta misma QA verificada, un rollback administrativo autorizado conserva D1/índice/evidencia y mantiene propuestas desactivadas; no DROP ni restore automático. Nunca utilizar una instalación existente como fallback.

Fase7 continúa incompleta hasta aceptación alojada y límites operativos. Se puede preparar el diseño de una entrega posterior de habilitación, pero **no recomendar activarla** sin QA alojada aceptada, canal humano propio de esa QA, revisión independiente de autorización/CAS/idempotencia/atomicidad financiera, respaldo/recuperación aplicables, cuotas verificadas y autorización administrativa separada. Ninguna autorización de esta issue habilita negocio MCP ni resuelve la recuperación/upgrade de la instalación preexistente de issue #13.
