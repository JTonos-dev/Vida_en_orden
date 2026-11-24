# Estado actual reproducible

Corte: 24 de noviembre de 2026. Main oficial sigue 317cfd8 (PR #3, fase 2). Las fases 3–7 están implementadas en ramas/PR dependientes #4→#12, con CI verde incluido el código corregido 5359d43 y revisión humana pendiente. DEVELOPMENT_PROGRESS identifica la evidencia exacta; comprobar también el HEAD documental posterior antes de integrar. Código, commit público, fuente privada Sites, versión, deployment y aceptación son estados distintos. La exposición histórica no está resuelta y su sustitución permanece suspendida.

## Código propuesto

React/Vinext sobre Workers/D1 DB, con servicios de dominio únicos en lib/domain y facades para la UI. MCP nunca llama a /api/action. Tareas/áreas/proyectos mantienen el scope compartido original; finanzas/eventos el propietario autenticado. No se incluyen datos, secretos o configuración de una instalación real.

Motor inmutable de propuestas con staging, diff por acción/impacto, identidad/huella, TTL, replay/idempotencia, concurrencia, WebAuthn, evidencia, batch atómico, auditoría y recibos. 19 acciones no financieras y 24 financieras reutilizan servicios existentes. Se incluyen validación/límites, adjuntos texto/CSV/JSON, informe interno, leases, recuperación y endurecimiento. Ver MCP_PARITY_MATRIX para acciones y excepciones.

SQL originales 0000–0010 intactos; 0011 añade metadata_version. 48 tablas y 54 triggers en el contrato. Para Sites se genera una proyección DDL con hashes; los metadatos se inicializan una vez desde registro o preparación explícitos y autenticados, sin negocio/DDL durante requests. GET, lecturas y denegaciones no inicializan. Nuevas propuestas ligan versión de metadatos a su huella; versiones antiguas/futuras se deniegan sin destruir recibos. Ver SITES_METADATA_BOOTSTRAP.

| Configuración privada | Herramientas | Efectos |
|---|---:|---|
| Sin flags |31 |Lectura; sin bootstrap/mantenimiento |
| Solo ampliaciones |33 |Lectura; informe requiere metadatos inicializados explícitamente |
| Solo propuestas |42 |Lecturas y metadatos/staging |
| Ambos |44 |Las dos superficies anteriores |

Las 31 conservan nombre, contrato, readOnlyHint=true y destructiveHint=false. Las herramientas que mutan metadatos tienen anotaciones acordes. businessWritesEnabled=false en fábrica y transporte: ni APPROVED permite negocio. No existe approve/enroll/SQL en MCP; argumentos, confirmed o un documento no sustituyen la firma humana.

## Publicación y pruebas observadas

El código corregido 5359d43 se publicó desde un commit privado trazable en **el mismo Site nuevo de desarrollo**, owner-only, versión Sites 2/entorno 1, MCP provisionado y 48 tablas alojadas observadas. Los hashes de migraciones coinciden con la versión 1. Identidad/URL/deployment se registran privadamente; no se cambió la instalación personal ni el Site original. El plugin nuevo figura instalado, pero sus herramientas no están expuestas en este chat: conexión por usuario real/health/ChatGPT y autenticador siguen pendientes. No hay claves confiables fijadas ni aprobación humana certificada.

El candidato a05433d aprobó 143 pruebas, TypeScript, lint sin errores/cuatro advertencias previas, schema sin cambios, build, auditoría fuente 261 archivos/cero hallazgos, npm cero alertas y D1 independiente. Worker completo/proyectado: 31 lecturas, bootstrap, WebAuthn sintético, CSRF, inscripción no confiable, anti-framing y compuerta cerrada; 27 QA API/UI cada uno. CI y clon GitHub aprobados. Servicio alojado sin identidad de visitante denegado 401 en MCP/enrollment; página anti-framing aprobada. Estos resultados no certifican una persona, hardware ni aceptación ChatGPT.

El primer registro humano reportó un 503 «Falta migrar la base MCP», reproducido antes de la primera propuesta. Se corrigió el orden de bootstrap y se añadieron tres regresiones; **146 pruebas (14 financieras, 128 MCP, 4 auditoría) aprobadas**. Suite completa repetida, CI del arreglo verde, clon verificado y versión 2 publicada. Se pidió reintento humano; sigue pendiente, sin presentar el deployment como aceptación del autenticador.

La instalación independiente existente se comprobó sin cambios: fase 2,31 lecturas, ejecución deshabilitada y cero incidencias referenciales. No se usaron sus datos/configuración para desarrollar.

## Límites vigentes

Aceptación del propietario, revisión/merge y habilitación posterior siguen pendientes. Binarios/OCR, bancos, importación/restauración MCP y acciones inexistentes en la UI no se inventan. Cuotas/carga alojadas y retención de propuestas/evidencia requieren validación/política operativa. Las copias históricas, diffs, forks y cachés siguen siendo riesgo abierto.

Las protecciones efectivas consultadas exigen PR/verify y bloquean force/delete, pero admiten cero aprobaciones y no exigen check actualizado con base. La cuenta ejecutora solo lee el oficial y publica en su fork. Se exige revisión humana por procedimiento; no se eluden controles ni se fusiona por tener CI verde.

Continuidad/commits: DEVELOPMENT_PROGRESS. Informe: IMPLEMENTATION_REPORT. Aceptación: USER_ACCEPTANCE_TESTS. Actualización/rollback: UPGRADE_AND_ROLLBACK. Todo distingue verificación local, publicación y aceptación; fase 7 no se declara completada.
