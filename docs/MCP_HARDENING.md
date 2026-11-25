# Endurecimiento y límites del MCP de desarrollo

## Capacidades y activación

| Configuración privada | Herramientas | Efectos |
|---|---:|---|
| Sin flags | 31 | Solo lecturas existentes; compatibles con fase 2. |
| MCP_EXTENDED_READS_ENABLED=true | 33 | Agrega inspección de contexto de adjunto e informe interno; solo lectura. |
| MCP_PROPOSALS_ENABLED=true | 42 | Agrega once herramientas de propuesta/estado/salud; puede escribir metadatos y staging, nunca negocio en esta versión. |
| Ambos flags | 44 | Capacidades anteriores combinadas; ejecución real continúa bloqueada. |

La fábrica y commit MCP mantienen una constante false. No existe bypass por entorno, confirmed, archivo, texto de chat, ownerId o herramienta approve. Los flags pertenecen a cada instalación. Requieren aplicar 0000–0010 y configurar el origen/propietario de la instancia de desarrollo.

## JSON y contenido no confiable

Se limita la lectura del stream antes de acumular todo el body: 64 KiB, UTF-8 válido, profundidad 32 y 10.000 nodos. Se rechazan claves duplicadas (incluso escapadas), claves de prototipo, números no representables y Unicode inválido. Los esquemas de acciones siguen cerrados y los importes financieros usan enteros de centavos acotados. Las fechas calendario se validan sin normalizar días inexistentes.

inspect_attachment_context solo recibe texto/CSV/JSON ya interpretado por el cliente, hasta 32 KiB. Nunca descarga URLs, obtiene archivos privados, ejecuta fórmulas, extrae OCR ni autoriza propuestas. Un recibo JSON tiene vendor, occurred_on, currency DOP, total_minor y líneas/impuestos/descuentos opcionales; discrepancias se devuelven para aclarar, sin arreglos implícitos. Texto imperativo dentro del documento es dato. Las alertas de frases sospechosas son heurísticas auxiliares: las barreras reales son ausencia de ejecución automática, esquemas cerrados, scoping, diff firmado y compuerta cerrada.

No se verificó un transporte oficial de binarios/OCR del host: imágenes, PDF y lectura directa de archivos siguen fuera de esta entrega. No se simulan resultados de producción ni autenticidad de una factura.

## Integridad, parches y concurrencia

El informe financiero reutiliza list_accounts, get_budget y get_finance_report. Compara liquidez de cuentas no archivadas/no crédito con la vista de presupuesto, muestra compromisos y flujos mensuales; registra revisión antes/después para detectar mezcla por concurrencia. Hasta 500 cuentas; si hay más o un total supera enteros seguros, declara resultado parcial/no seguro. No consulta bancos externos, no repara datos y no certifica conciliación bancaria.

Los updates V2 preservan los campos omitidos mediante hidratación desde la fila autorizada de staging, antes del servicio de dominio. Requieren id y al menos un cambio. Mover inicio de evento sin fin explícito conserva duración en días; otros conflictos temporales los rechaza el servicio. No se duplica el motor financiero. No se promete detección completa de conflictos entre calendarios recurrentes de zonas distintas.

Una clave de preparación devuelve la revisión original para las mismas acciones, incluso con reintentos concurrentes. Acciones diferentes con esa clave se deniegan. Si la propuesta original expiró/fue revisada, no se renueva silenciosamente: usar una nueva clave/consulta. Revisar/cancelar por MCP exige expected_revision y no invalida versiones nuevas por replay. Claves de ejecución siguen hasheadas y un recibo único impide doble efecto.

Las búsquedas de texto mantienen hasta 200 caracteres y coincidencia literal, incluyendo %, _ y barra invertida, mediante instr/lower. Así no dependen del límite de patrones LIKE de D1. Se conserva el filtro corto YYYY-MM% de vencimientos.

## Evidencia y verificación posterior

La propuesta incluye efectos antes/después por acción y un resultado final. Las acciones financieras añaden impacto antes/después de liquidez, compromisos, disponible, reservas y saldos de cuentas, usando get_budget y calculateAccountBalance con reloj de preparación fijo. Se advierten saldo/disponible negativos, movimientos futuros y posibles duplicados; no se corrigen importes ni se aprueba automáticamente. Todo integra la huella. El payload completo se limita a 128 KiB.

La aprobación y su evidencia, consumición de nonce y auditoría se escriben en un mismo batch. Se conserva assertion, clave pública/origen usados y vínculo propietario/digest/revisión/desafío. No contiene clave privada. Antes del commit se reverifica con la credencial actualmente fijada; retirarla impide una ejecución nueva. El commit guarda diff, auditoría, consumo y recibo atómicamente.

get_execution_result verifica digest, filas persistidas, revisión y firma contra la clave pública archivada. Cambios posteriores pueden hacer que el diff actual ya no coincida sin convertir el recibo histórico COMMITTED en un fallo. Una firma válida contra clave archivada no equivale a certificación de hardware/fabricante ni demuestra por sí sola que se realizó la prueba humana pendiente.

Se conservan recibos/evidencia de ejecuciones y mapeos de idempotencia; no hay purga automática que permita repetir un efecto. Denegaciones criptográficas tienen telemetría de mejor esfuerzo, pero nunca otorgan aprobación si el log falla. Registros de aprobación/ejecución y sus auditorías son obligatorios y atómicos.

## Recursos y recuperación

- Preparación: hasta 20 acciones, 2.000 filas totales del ámbito, snapshot 2 MiB y diff 100 filas/64 KiB. Importes financieros inválidos en el snapshot requieren revisión, no reparación MCP automática.
- Presupuesto de dominio: 400 consultas y 60 segundos. Snapshots completos solo antes/después; por acción se leen en batch únicamente las tablas tocadas para derivar efectos e IDs. Métricas guardan cantidades/tiempo, nunca títulos, argumentos, correos o documentos.
- Las consultas de copia, validación de esquema, snapshot, persistencia y cleanup añaden coste fijo fuera del presupuesto de dominio. No se declara que 400 sea la cuota del host ni que todas las instalaciones soporten ese volumen.
- Los [límites oficiales de D1](https://developers.cloudflare.com/d1/platform/limits/) establecen 50 llamadas por invocación en Free y 1.000 en Paid; un batch cuenta como una llamada para esa cuota. El presupuesto interno cuenta sentencias, no equivale a la cuota del host. Planes grandes pueden exceder Free por consultas individuales; debe verificarse la cuota real de Sites/D1 alojado. No se reduce aislamiento/atomicidad para evitarla. La preparación falla cerrada si no puede completar staging.
- Leases de staging de diez minutos, por propietario; preparación recupera hasta 20 vencidos sin tocar leases activos/ajenos ni negocio. El finally limpia el staging normal. Un proceso terminado abruptamente se recupera por lease.
- No se expone SQL, restauración ni limpieza genérica desde MCP. Las 31 lecturas no hacen mantenimiento ni crean datos.

## Upgrade 0010 y rollback

Deshabilitar propuestas en la instancia de desarrollo, drenar requests y respaldar esa D1. Aplicar SQL en orden; 0010 agrega tablas de evidencia/idempotencia/leases y métricas, invalida propuestas/aprobaciones antiguas sin evidencia durable y elimina solo copias de staging previas. No cambia tablas de negocio ni sus saldos. Preparar y aprobar nuevas versiones después del upgrade.

Volver al código anterior con propuestas deshabilitadas conserva datos y tablas aditivas. No borrar evidencia/recibos ni restaurar una D1 productiva como rollback ordinario. La publicación de un PR no aplica esta migración ni despliega Sites. La aceptación real con autenticador, acceso/host y cuotas sigue pendiente.
