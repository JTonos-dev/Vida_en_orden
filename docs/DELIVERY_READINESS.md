# Entregas para aceptación y actualización

Base integrada: ca336b7846d08fa9853cef72f086d153babbc8e4, CI45664520146 aprobado. Corte25nov2026. No se modifica ni migra una instalación personal; no se activa negocio ni se despliegan candidatos sin aprobación. Las entregas pendientes se revisan por PR y orden de dependencia, sin auto-merge.

## A — Diagnóstico tipado de referencias

Rama fix/mcp-typed-reference-errors, basada directamente en main. DomainReferenceError identifica referencias ausentes/no disponibles dentro de los servicios existentes; conserva mensajes UI. El motor traduce exclusivamente ese tipo a reference_not_found/404 con mensaje uniforme sin IDs ni datos ajenos. Errores desconocidos/infraestructura no se clasifican por texto. Se conservan validación, scopes, cálculos, lotes CAS y guardas de aprobación/ejecución.

Tres regresiones nuevas verifican fallo de revisión tras firma WebAuthn sintética conservando versión/huella/clave/evidencia/autorización utilizable, errores de referencias financieras/compartidas/calendario y preservación de errores desconocidos. La regresión Worker deja de exigir internal_error y mantiene la preservación de APPROVED. No hay SQL nuevo ni despliegue; la QA alojada anterior conserva su diagnóstico hasta publicación autorizada.

Pruebas:169 aprobadas(14financieras+147MCP+4auditoría+4recuperación),0omitidas; npmci709paquetes,dependencias0alertas,TypeScript/lint0errores(4advertencias previas),schema sin cambios/build/D1 independiente y Workers. Logs locales outputs/references-*. Auditoría/CI/PR se enlazan en DEVELOPMENT_PROGRESS al publicar. Rollback: revertir código/diagnóstico por PR, sin restaurar D1 ni borrar datos.

## B — Habilitación QA condicionada, sin activar

Se prepara en una rama dependiente e independiente de operaciones productivas. La constante pública MCP_BUSINESS_WRITES_ENABLED=false se mantiene. Ningún flag del modelo ni variable genérica habilita negocio. Antes de activación hacen falta revisión de la implementación, contexto de despliegue QA verificable, autorización administrativa específica y credencial/acción WebAuthn propia de QA. No portar la firma/clave de otra instancia.

Las pruebas con autenticadores sintéticos y D1 local no se presentan como aprobación humana ni ejecución alojada. Las43operaciones requieren recorrido y persistencia exactos en aislamiento; la ejecución alojada permanece bloqueada hasta superar esas puertas reales.

## C — Actualización de fase2 con recuperación

Ensayar únicamente con datos ficticios y copias propias. Conservar todas las filas/propietarios/configuración, aplicar solo migraciones pendientes, comparar totales/referencias/lecturas y mantener MCP cerrado. Un export/restore nativo local y ledger de Wrangler no certifican el ledger o la recuperación del servicio administrado de Sites. La issue #13 continúa abierta mientras no exista capacidad administrativa nativa probada y autorización para la instalación destino.

## Bloqueos externos confirmados

- Automatización visual de Chrome: el helper oficial de Windows inicializa/lista apps, pero falla al seleccionar/capturar con GetCursorPos failed: Access is denied (0x80070005). No se cambian permisos/seguridad del sistema ni se fabrican sesiones/headers. No atribuir a HTTP una recarga visual o desconexión/reconexión del plugin.
- Las herramientas Sites disponibles exponen overview/filas, no snapshot/export/restore, ledger/DDL completo ni métricas de CPU/memoria/cuota. No se inventan endpoints ni se modifica D1 remota/ledger para eludirlo. Preparar solicitud de soporte con datos privados solo en canal administrativo autorizado.
- Habilitación real, registro/acción humana propios de QA y43ejecuciones alojadas: pendientes de revisión/autorización/canal humano, sin simular aprobaciones. Se continúa con toda implementación/prueba aislada viable.
-2.000filas conjuntas de otras17tablas/2MiB siguen siendo límites de preparación. No bloquean por sí solos instalar código con negocio cerrado, pero impiden recomendar escritura sobre datasets que excedan el presupuesto. No purgar historial ni truncar saldos. Cuotas del host y rendimiento real requieren evidencia, no inferencias desde CI.
