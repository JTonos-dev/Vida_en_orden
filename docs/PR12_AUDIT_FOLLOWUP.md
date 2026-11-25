# Seguimiento de la auditoría del PR #12

Revisión de referencia: [observaciones del mantenedor sobre 10a0f83](https://github.com/JorgeTonos28/Vida_en_orden/pull/12#pullrequestreview-6049614005). Las correcciones están propuestas en la misma rama; **la conformidad del revisor sigue pendiente**. No se fusiona la cadena, despliega código ni activa negocio. La firma humana ya acreditada no se repite.

## 1. Revisión de propuestas atómica

Antes, revise invalidaba la versión vigente y borraba su autorización antes de preparar el reemplazo. Un error de input, staging, límites o D1 podía dejarla invalidada sin sucesora.

Ahora prepara y valida en una partición independiente, sin cambiar head, estado, aprobación, desafío o evidencia de la vigente. Solo después publica en **un D1.batch**:

1. Guarda CAS sobre propietario, head/revisión, estado y digest capturados. Un estado COMMITTED nunca puede sustituirse.
2. Inserta la sucesora inmutable VALIDATED.
3. Invalida la anterior, retira su autorización activa y consume sus desafíos; conserva evidencia histórica.
4. Registra invalidación/preparación, mueve el head y retira la guarda.

Si cualquier sentencia falla, el lote revierte completo. Una carrera con aprobación, cancelación, commit u otra revisión devuelve stale_proposal; no sobrescribe al ganador. Fallos de publicación sin conflicto devuelven revision_failed y requieren consultar estado antes de reintentar. La versión anterior permanece **utilizable durante staging**: revisar no es cancelar. Para revocación inmediata se usa cancel_change_plan.

La limpieza de staging no puede ocultar una publicación confirmada ni sustituir el error original. Si falla, conserva su lease; health informa conteos y la siguiente preparación/mantenimiento autorizado elimina hasta 20 leases vencidos por llamada. Expiran a los 10 minutos. No hay limpieza desde lecturas ni se promete un proceso de fondo.

## 2. Auditoría creciente y límite operativo

El historial audit_log ya no se cuenta ni se copia completo al preparar. Se conserva en D1 y sus lecturas reales siguen paginadas; **no se purga, archiva ni trunca para eludir el límite**.

Solo se copia, por propietario, un máximo de un marcador existente system/concepts-v1/seeded. El servicio de dominio lo usa como señal de inicialización; no necesita el historial para cálculos o decisiones de las 43 acciones actuales. Un marcador antiguo con ID no canónico también se reconoce. La búsqueda usa un índice cubriente y ORDER BY id/LIMIT1, no una muestra de los últimos eventos. Si no existe marcador, el servicio genera su evento nuevo habitual.

Los eventos nuevos de dominio continúan en staging, diff firmado y lote de ejecución. El contexto auditado solo admite INSERT y las dos lecturas existentes del dominio (marcador y presentación de estado). Rechaza UPDATE/DELETE y lecturas nuevas dependientes del historial; deben diseñar su conjunto de lectura explícito antes de añadirse. El executor también rechaza deltas de actualización/borrado de auditoría. No se inventan ni reescriben entradas históricas.

**Límite restante:** se siguen cargando completas las otras 17 tablas autorizadas, filtradas por owner/scope. El estado fuente está limitado a 2.000 filas en conjunto, incluidos archivados y movimientos históricos. El marcador de auditoría no consume esas 2.000 filas; sus bytes sí cuentan en el snapshot inicial de 2 MiB. Un conjunto de 2.001 filas se rechaza, nunca se recorta. Diff100 filas/64KiB, payload128KiB,20 acciones,400 consultas/60 segundos permanecen igual. Las nuevas entradas de auditoría sí consumen el presupuesto del diff.

Health aclara rowLimitScope=non_audit_source_rows, auditContextRows=1 y auditHistoryIncluded=false. Esta mitigación elimina el bloqueo causado únicamente por crecimiento de auditoría, **no resuelve la escalabilidad de las 17 tablas restantes**. Hace falta un motor con conjuntos de lectura/dependencias acotados para instalaciones mayores; no se declara paridad lista para producción. Los54 triggers, incluido audit_log, permanecen: un append concurrente sigue cambiando business_revision y puede exigir preparar de nuevo.

## 3. Migración y rollback

0012_mcp_audit_context_index.sql añade únicamente el índice audit_log_seed_context_idx sobre owner_id, entity_type, entity_id, action, id. ORM, snapshot 0012 y journal lo describen. Los SQL 0000–0011 no se editan; siguen 48 tablas y 54 triggers. El runtime falla cerrado para propuestas/registro/health si falta el índice. Las31 lecturas originales no dependen de él.

Se prueba la cadena nueva en D1 local y el upgrade 0011→0012 con auditoría ficticia existente, sin cambios de datos/identidad/revisión. No se aplicó a ningún Site. La instalación de desarrollo que acreditó firma sigue con código5359d43/SQL hasta 0011; esa aceptación no prueba el código nuevo alojado.

Antes de actualizar una instalación existente: autorización de su propietario, respaldo/restauración aislada, revisión de ledger/hashes, flags apagados y ventana controlada. El índice requiere espacio y tiempo de construcción proporcionales a su historial; medirlo en la copia restaurada, sin asumir cuotas del host. No hay autorización de despliegue por este PR. Rollback ordinario vuelve al código previo con propuestas deshabilitadas y conserva el índice/esquema/historial, sin DROP ni restauración de D1.

## 4. Regresiones y evidencia

Las regresiones nuevas reproducen los hallazgos antes de corregir:12 de 13 casos iniciales fallaban sobre 10a0f83. La entrega final añade 16 casos, además de ampliar la integración de D1/workerd existente:

- Input externo inválido, acción desconocida y argumentos inválidos conservan head/APPROVED/aprobación/evidencia/nonce; el commit aislado anterior sigue autorizado.
- Fallos en copia de staging, inserción de sucesora y auditoría tardía de publicación revierten toda la sustitución.
- Carreras controladas con commit/cancel/approve y dos revisiones del mismo head conservan al ganador; una sucesora exige firma nueva.
- Fallos de limpieza preservan resultado/error y dejan un lease recuperable.
- 5.000 eventos ficticios con metadatos de 1 KiB cada uno, con/sin marcador antiguo y marcador de otro propietario: preparación financiera viable, contexto0/1, historia intacta y eventos nuevos añadidos. Lectura real del historial sigue completa/paginada; EXPLAIN confirma índice.
- Frontera 2.000/2.001, rechazo de mutaciones/lecturas de auditoría no admitidas, e índice ausente/upgrade sin pérdida.
- D1 real local: trigger que aborta la publicación tardía deja APPROVED y autorización anteriores; otro ensayo conserva5.000 eventos al preparar.

Resultados finales de suite/CI y commit: DEVELOPMENT_PROGRESS y el check del HEAD del PR. Firmas usadas en regresiones son exclusivamente sintéticas; no se reutilizan datos, claves ni pruebas criptográficas del propietario. MCP_BUSINESS_WRITES_ENABLED=false permanece en fábrica y transporte. La conformidad y la prueba sobre una copia restaurada de cada instalación siguen siendo pasos separados de la integración.
