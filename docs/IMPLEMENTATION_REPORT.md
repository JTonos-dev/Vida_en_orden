# Informe de desarrollo de fases3–7

24 de noviembre de 2026. Desarrollo técnico preparado y probado; Site privado nuevo publicado; **aceptación humana/ChatGPT y revisión del mantenedor pendientes**. No hubo merges, force-push, cambios de protecciones ni despliegues/migraciones sobre instalaciones personales. No se creó un repositorio público alternativo ni se sustituyó historia.

## Inventario y estado por fase

| Fase | Implementación entregada | Estado restante |
|---|---|---|
|3 |Propuestas/revisiones inmutables, diff/impacto, propietario/huella, expiración, replay/idempotencia, concurrencia, WebAuthn, batch atómico, auditoría/recibo/verificación; bootstrap autenticado |Código probado y hospedado en desarrollo. Interacción humana y cliente ChatGPT pendientes; negocio cerrado |
|4 |19 acciones de tareas/subtareas, contexto/orden/estados/fechas, áreas/proyectos, calendario/recurrencia y bitácora; reversión por recibo |Pruebas aisladas aprobadas; aceptación con ejecución real bloqueada hasta habilitación revisada |
|5 |24 acciones financieras de cuentas, movimientos/comisiones, catálogos existentes, presupuesto, obligaciones/recurrencia/reservas, metas/aportes, preferencias y vínculos |Contabilidad probada con datos ficticios; sin movimientos bancarios/financieros reales; misma compuerta pendiente |
|6 |Texto/CSV/recibo JSON no confiable, informes internos, validación/límites, evidencia/revocación, salud/leases y recuperación |Sin binarios/OCR/bancos inventados; carga/cuotas/retención operativa pendientes |
|7 |Integración Worker/D1, migraciones/ORM, CI/clones, auditorías, exportación trazable, publicación privada y documentación/UAT |No completada: faltan autenticador/ChatGPT, aceptación y revisión/integración |

MCP_PARITY_MATRIX enumera las43 acciones exactas y excepciones. No se declara cobertura total del objetivo aspiracional: split/reconciliación, CRUD de conceptos, archivo de obligaciones/metas, reasignación genérica de reservas, importación/restauración MCP y otras operaciones que la aplicación no soporta. No se cubren huecos con SQL/CRUD genérico.

Las31 lecturas originales conservan contratos/anotaciones y ausencia de efectos. Los flags permiten33/42/44 herramientas; solo metadatos/staging son mutables. Fábrica/transporte mantienen constante false; incluso APPROVED devuelve writes_disabled. Los tests habilitan exclusivamente el constructor aislado del executor. El modelo no aprueba ni fija confianza con confirmed, texto o adjuntos.

## PR y commits

Orden de revisión/integración: [#4](https://github.com/JorgeTonos28/Vida_en_orden/pull/4) → [#5](https://github.com/JorgeTonos28/Vida_en_orden/pull/5) → [#6](https://github.com/JorgeTonos28/Vida_en_orden/pull/6) → [#7](https://github.com/JorgeTonos28/Vida_en_orden/pull/7) → [#8](https://github.com/JorgeTonos28/Vida_en_orden/pull/8) → [#9](https://github.com/JorgeTonos28/Vida_en_orden/pull/9) → [#10](https://github.com/JorgeTonos28/Vida_en_orden/pull/10) → [#11](https://github.com/JorgeTonos28/Vida_en_orden/pull/11) → [#12](https://github.com/JorgeTonos28/Vida_en_orden/pull/12). Todos abiertos, sin revisión humana y con CI satisfactorio al corte. Main sigue317cfd8.

Código de cierre33a6a53/docs12f6bde; corrección de dependenciasa067ef7; compatibilidad Sitesa05433d. DEVELOPMENT_PROGRESS registra las ramas, commits anteriores y deltas. Los PR tienen base main por permisos del fork y diffs acumulativos: el mantenedor revisa cada delta desde su dependencia y repite CI al integrar. No fusionar fuera de orden ni eludir revisión/protecciones.

## Pruebas ejecutadas

| Comprobación | Resultado |
|---|---|
|Instalación |npm ci709 paquetes del lock corregido; #12 conserva ese lock y CI hizo checkout/instalación nuevos |
|Finanzas / MCP / auditoría |14 +128 +4 =146 aprobadas tras la regresión del registro inicial, cero omitidas |
|TypeScript / lint |Aprobados; cero errores/cuatro advertencias previas |
|Schema / build |Drizzle no genera cambios en copia temporal; build aprobado con avisos upstream no bloqueantes |
|Auditoría fuente / dependencias |261 archivos del código a05433d sin hallazgos; npm cero vulnerabilidades, desarrollo incluido/umbral low |
|D1 independiente |12 SQL0000–0011/48 tablas en D1 temporal, sin remoto |
|Worker completo / proyectado |31 lecturas, bootstrap, WebAuthn sintético, denegaciones/CSRF, inscripción no confiable y compuerta cerrada;27 QA API/UI en cada modo |
|Exportación Sites |HEAD limpio, sin Git/identidad ajenos;12 SQL,21 DML conocidos diferidos; gate privado sin hallazgos; hashes trazables |
|CI / GitHub |#4–#12 verdes; clones de cierre/dependencias y #12 aprobados, árbol limpio |
|Backend Sites |Publicación privada succeeded, versión1/env1, MCP provisionado y48 tablas observadas sin omisiones |
|Autorización alojada negativa |Acceso de servicio sin visitante:401 en MCP/enrollment; página200 y anti-framing aprobados |

El lock basal tenía33 entradas de auditoría, incluidas dos críticas. No se publicó ese artefacto. La corrección documentada en DEPENDENCY_SECURITY actualiza runtime/transitivas sin --force ni degradar Drizzle y migra realmente a Zod4. Fuente sin secretos y npm sin alertas comprueban riesgos distintos; no garantizan seguridad futura.

Pruebas no ejecutadas: firma física del propietario, conexión/llamadas de las nuevas herramientas por usuario real en ChatGPT, aceptación manual de escrituras y carga/cuotas máximas del host. El plugin figura instalado, pero sus herramientas no se exponen en este chat; installed no prueba autenticación sana. No se presenta la criptografía sintética, una versión Sites o el CI como sustituto de esos resultados.

## Publicación y migraciones

El Site de desarrollo es nuevo y owner-only, con D1/configuración propias. Source público a05433d y commit privado de publicación se registran por separado; sus IDs/URL no se publican en GitHub. No se usaron datos, usuarios, secretos o config de otra instalación. La existente se comprobó nuevamente: fase2/31 lecturas/negocio deshabilitado/referencias válidas, sin cambios.

SITES_METADATA_BOOTSTRAP conserva SQL original 0000–0010 y añade 0011. Para Sites exporta solo DDL/triggers con hashes; el primer registro o preparación explícitos y autenticados inicializa metadatos atómicamente, invalida planes anteriores y conserva negocio/revisión/recibos. GET, lecturas y denegaciones no inicializan. No hay DDL durante requests, SQL elegido por el modelo ni un ledger falsificado. La automatización está marcada freshInstallationOnly; previews con otro SQL aplicado requieren inspección y autoridad de su propietario.

El primer intento humano de registro devolvió 503 porque esperaba metadatos creados solo al preparar una propuesta. Se reprodujo el mensaje exacto antes de corregir; tres regresiones cubren el registro inicial, denegaciones/esquema incompleto/versión futura y rollback sin efectos. Las integraciones Worker prueban ahora registrar primero. El estado final de CI/deployment de esta corrección se consigna en DEVELOPMENT_PROGRESS; el intento inicial no se marca aprobado y la firma física sigue pendiente.

Tras esa corrección se repitieron npm ci, ambas auditorías, las 146 pruebas, TypeScript/lint, equivalencia Drizzle, build, D1 independiente y las dos integraciones Worker completas: todo aprobado localmente. No cambian SQL/lockfile ni se requieren nuevas migraciones para el arreglo.

## Aceptación personal y próximos pasos

El propietario tiene USER_ACCEPTANCE_TESTS con requisitos, datos ficticios, pasos, verificación persistida, errores, precauciones y estado. Empezar por UAT-3-HUMAN: registro personal del autenticador y fijación administrativa de su clave legítima, conexión de la app de desarrollo, propuesta ficticia nueva, revisión de diff/digest/TTL y firma física. No solicitar PIN/contraseña/clave privada ni fijar claves del modelo. APPROVED no debe crear la tarea y commit seguirá denegado. No pedir repetir carreras, rollback, parseo o firmas que ya son automáticos.

Los casos4/5 reales permanecen bloqueados hasta demostrar el canal y revisar una habilitación explícita posterior. No cambiar la constante por pasar tests locales ni declarar aprobación humana sin reporte/evidencia real. Si una incidencia se comunica, añadir regresión y corregir antes de cerrar.

Para actualizar instalaciones existentes: UPGRADE_AND_ROLLBACK exige autorización, respaldo/restauración aislada, ledger/hashes, flags apagados y requests drenados, versión exacta y mecanismo soportado. Conservar datos/evidencia en rollback de código; no DROP, restauración o downgrade automático de metadatos. Un merge nunca despliega otro Site.

Permanecen revisión del mantenedor, aceptación humana/ChatGPT, cuota/rendimiento/retención y capacidades ausentes de paridad. El historial público, PR antiguos, forks y cachés siguen potencialmente accesibles. Su sustitución fue suspendida por el responsable; este trabajo no declara retirada histórica.
