# Historial de cambios

## Compatibilidad Sites: proyección y bootstrap · 2026-11-24

- Se conserva el SQL original 0000–0010 y se añade 0011, una columna de versión de metadatos. La exportación de un commit limpio genera un candidato Sites de solo esquema con hashes y sin Git/identidad ajenos; 0000–0007 permanecen idénticos.
- La primera preparación autenticada inicializa metadatos en batch atómico, conserva negocio/revisión/recibos y registra una única transición. Lecturas/salud no inicializan; payloads anteriores y metadatos futuros fallan cerrados.
- Las guardas de aprobación/commit verifican la versión. No se habilita negocio ni existe bootstrap SQL elegible por el modelo.
- 143 pruebas, schema/build/D1 y dos integraciones Worker (cadena completa y proyección Sites) aprobados localmente; 27 comprobaciones API/UI en cada modo. Publicación y aprobación humana reales todavía pendientes.

## Corrección de dependencias y gate de publicación · 2026-11-24

- Se resuelven 33 entradas de auditoría (dos críticas) del lockfile basal: React/RSC, Next, Vinext/Vite, Cloudflare y transitivas compatibles. Auditoría actual: cero vulnerabilidades, sin force ni degradación de Drizzle. Ver DEPENDENCY_SECURITY.md.
- Migración real a Zod 4 con records explícitos y dispatcher tipado; conformance compara códigos/campos de validación. CI incorpora audit:dependencies.
- verify:hosting identifica 21 instrucciones de metadatos fuera del flujo de migración de esquema documentado de Sites y bloquea publicación. Se conserva SQL/triggers y se prepara consulta administrativa; no se afirma un rechazo del backend no observado.
- 138 pruebas locales aprobadas, instalación/build/ORM/D1/Worker y 27 comprobaciones API/UI aprobados. No se modifica ninguna instalación personal ni se habilita ejecución de negocio.

## Fase 7: integración reproducible y cierre técnico · 2026-11-24

- Verificación del Worker compilado por HTTPS loopback con D1 nueva, las 31 lecturas, WebAuthn sintético, CSRF, anti-framing, inscripción sin confianza y ejecución cerrada; 27 comprobaciones de la interfaz.
- Pruebas de D1/workerd con rollback forzado, equivalencia ORM/SQL/defaults y upgrade 0009→0010. verify:schema exige que Drizzle no genere cambios.
- Se corrigen recálculo de padres al mover subtareas, rechazo de ciclos anteriores y fechas de completado cerca de medianoche, con regresiones. Las denegaciones consumen cuerpos pequeños de forma acotada para conservar conexiones del Worker.
- Corrección de codificación en snapshots nuevos 0008–0010, sin cambiar/aplicar SQL destructivo. QA rechaza destinos remotos y redirects.
- Guías de actualización/rollback, aceptación y continuidad. No se habilitan escrituras, fusionan PR ni modifican instalaciones personales; aceptación humana real y exposición histórica siguen pendientes.

## Fase 6: límites, evidencia y recuperación · 2026-11-24

- JSON acotado por stream, UTF-8, profundidad, nodos y claves; fechas reales y búsquedas literales de 200 caracteres sin LIKE largo.
- Contexto de adjuntos texto/CSV/JSON sin fetch/OCR/ejecución y reporte interno de integridad sin conciliación bancaria externa.
- Evidencia WebAuthn durable, revocación antes del commit, idempotencia de preparación, expected_revision, leases y métricas sin contenido. Migración 0010 invalida planes antiguos y elimina solo staging previo.
- Efectos por acción e impacto financiero antes/después en la huella y revisión humana, con alertas de negativos/duplicados/futuros. Parches conservan campos omitidos.
- Catálogo predeterminado 31; opt-in completo 44. Escrituras reales siguen deshabilitadas.

## Fase 3B: transporte opcional y canal humano · 2026-11-24

- Diez herramientas de propuestas opt-in; el catálogo predeterminado sigue en 31 lecturas.
- Página de diff y aprobación owner-only con origen exacto, CSRF, versión mostrada y firma WebAuthn. El registro solo produce candidatos; no fija confianza automáticamente.
- Migración aditiva 0009 para desafíos de registro. Guía de configuración privada y aceptación humana.
- Fábrica y transporte mantienen ejecución MCP deshabilitada. Firmas sintéticas no equivalen a una prueba humana real.

## Fase 5: adaptadores financieros aislados · 2026-11-24

- 24 operaciones R2 con servicios existentes, centavos enteros, reservas, pagos, aportes y anulaciones, sin escritura real habilitada.
- Pruebas de concurrencia, idempotencia, redondeo, integridad contable y rollback completo ante fallas.
- Se corrige get_finance_report: netCashImpactMinor descuenta la comisión de transferencias propias, sin contar el principal como ingreso/gasto.
- Sin migración nueva, despliegue ni datos reales.

## Fase 4: adaptadores no financieros · 2026-11-24

- Catálogo cerrado de 19 acciones que usa los servicios compartidos y referencias locales entre operaciones.
- Validación de dependencias y devolución inequívoca de IDs, con pruebas de regresión.
- Reversión no financiera derivada de un recibo, con propuesta/aprobación nueva y sin cambios posteriores. Se conserva la auditoría.
- Sin migraciones nuevas, despliegues ni cambios de las 31 herramientas públicas.

## Fase 3: fundamento aislado · 2026-11-24

- Motor de propuestas inmutables con diff, SHA-256, caducidad, aislamiento, guardas de concurrencia, aprobación criptográfica y recibos idempotentes.
- Servicios existentes extraídos a contexto por request; preparación sobre staging particionado y commit atómico D1, sin duplicar cálculos financieros.
- Migración aditiva 0008 y registro Drizzle completado para 0006–0008. No se modifica ninguna instalación.
- Se inicia seguimiento continuo y guía de aceptación. El historial expuesto permanece como riesgo conocido; se suspende su sustitución.
- WebAuthn se comprueba con firmas sintéticas reales; falta prueba humana en plataforma. El catálogo público conserva sus 31 lecturas y la compuerta de negocio sigue cerrada.

## Auditoría histórica y preparación de fase 3 · 2026-11-24

- PR #3 integrado con revisión y CI satisfactorios; se distingue la fuente actual del historial todavía expuesto.
- Se retiran valores particulares del verificador y se añade auditoría genérica de fuente/objetos históricos, con regresiones y CI que no imprime valores sensibles.
- Se prepara un generador local de distribución sin antecesores, sin remotos y con comparación de árbol y hashes. No ejecuta reemplazos, publicaciones ni borrados remotos.
- Se documentan alcance, fork, diffs, cachés y procedimiento de Support, junto con el plan técnico de fase 3. No se implementan propuestas, aprobaciones, escrituras MCP ni migraciones nuevas.

## Instalación independiente: bootstrap vacío y validación integral · 2026-11-24

- Se retiran fixtures personales incrustados en tareas y la clasificación automática ligada a registros de origen. No se borran datos existentes ni se reescribe historia compartida.
- Se ejecutan las 31 herramientas MCP contra SQLite migrado, con datos ficticios y en vacío; se comprueban aislamiento, paginación, autorización y ausencia de escrituras.
- La auditoría de portabilidad rechaza el bootstrap heredado. QA V2 usa fechas relativas y comprueba que la primera escritura no carga tareas o proyectos ajenos.
- Sin migraciones nuevas ni cambios en los contratos MCP. Las fases 3 y posteriores permanecen pendientes.

Este es el changelog canónico del repositorio. `docs/CHANGELOG.md` se conserva como enlace documental para compatibilidad con la estructura transferida.

## Infraestructura de colaboración · 2026-11-24

- Se añadió la verificación reproducible de instalación independiente con D1 local temporal y migraciones `0000`–`0007`.
- Se documentó la separación entre repositorio público, Sites personales, datos, secretos, audiencia y despliegues.
- Se añadió la guía para un nuevo usuario de Codex y el procedimiento Sites↔GitHub.
- Se actualizó el flujo de ramas, pull requests, CI y revisión de la protección de `main`.
- No se cambió el Site personal, su audiencia, sus variables, su D1 ni su despliegue.

## Transferencia pública · 2026-11-24

- Se saneó el snapshot del Site de origen y se preparó para instalaciones independientes.
- Se añadió `AGENTS.md`, roadmap de siete fases, documentación de instalación, seguridad, despliegue, portabilidad y colaboración.
- Se añadió CI con pruebas MCP/financieras, TypeScript, lint, build y búsqueda de patrones de credenciales.
- No se incluyeron datos productivos, respaldos, secretos, identificadores privados ni historial Git interno.

## MCP Fase 2

- Catálogo de 31 herramientas de lectura con relaciones, filtros, reportes, auditoría, configuración y validación.
- Paginación acotada mediante cursores opacos y schemas cerrados.
- Escrituras MCP permanecen deshabilitadas.

## Nota de alcance

La mejora de infraestructura y portabilidad no completa ni adelanta la fase 3 del MCP.
