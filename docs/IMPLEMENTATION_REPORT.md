# Informe de desarrollo de fases 3–7

Fecha: 24 de noviembre de 2026. Implementación técnica preparada en PR dependientes; aceptación alojada/humana **pendiente**. No hubo merges, cambios de protecciones, publicaciones o migraciones sobre instalaciones personales. Oficial y fork actual siguen siendo las fuentes de desarrollo; no se creó un repositorio público alternativo ni se sustituyó historia.

## Inventario y estado exacto

| Fase | Implementado y probado en aislamiento | Pendiente / límite |
|---|---|---|
| 3 | Propuestas inmutables/revisiones, diff por acción/impacto, propietario/huella, TTL, replay/idempotencia, concurrencia, WebAuthn, batch atómico, auditoría/recibo/verificación | Canal humano y host reales. Ejecución MCP de negocio bloqueada en código |
| 4 | 19 acciones de tareas/subtareas, contexto/orden/estados/fechas, áreas/proyectos, calendario y bitácora; reversión por recibo | Aceptación del plugin real tras habilitación segura futura |
| 5 | 24 acciones financieras: cuentas, movimientos/comisiones, categorías/conceptos recordados, presupuesto, obligaciones/recurrencia/reservas, metas/aportes, preferencias y vínculos | Sin movimientos reales. Aceptación/ejecución humana pendientes; no hay conexión bancaria |
| 6 | Texto/CSV/recibo JSON, informe interno, validación/límites, evidencia/revocación, salud/leases y recuperación | Binarios/OCR, cuotas/carga alojadas y política de retención sin verificar; sin servicios inventados |
| 7 | Migraciones/ORM, integración Worker/D1, CI, clon independiente basal, documentación, paridad y UAT | Gate de publicación alojada, autenticador/ChatGPT real y revisión del mantenedor. No se declara fase completada |

La [matriz de paridad](MCP_PARITY_MATRIX.md) enumera las 43 acciones exactas y sus excepciones. No se declara cobertura total del objetivo aspiracional: split/reconciliación, CRUD de conceptos, archivo de obligaciones/metas, reasignación genérica de reservas, importación/restauración MCP y otras operaciones ausentes de la aplicación no se inventan ni se cubren mediante SQL/CRUD genérico.

Las 31 lecturas anteriores conservan contrato/anotaciones y ausencia de escrituras. Hay 33/42/44 herramientas según flags privados de ampliaciones/propuestas. Solo metadatos/staging son mutables; incluso APPROVED devuelve writes_disabled en commit. El executor se prueba con una compuerta exclusiva del constructor aislado; fábrica/transporte productivos mantienen constante false. `confirmed`, adjuntos, texto del chat y argumentos de identidad no autorizan nada.

## PR, commits y pruebas

La cadena #4 → #5 → #6 → #7 → #8 → #9 → #10 está abierta y con CI satisfactorio, sin revisiones humanas. Commits, enlaces, deltas y dependencia de la corrección del runtime están en [DEVELOPMENT_PROGRESS.md](DEVELOPMENT_PROGRESS.md). El mantenedor debe revisar/integrar en orden, sin force-push/bypass, y repetir CI tras conflictos o cambios de base. Abrir un PR no publica un Site.

El cierre basal 33a6a53 pasó 137 pruebas y toda la suite también desde un clon nuevo de GitHub, cuyo árbol quedó sin cambios. #10 siguió verde en 12f6bde. La auditoría adicional encontró 33 entradas de dependencias (dos críticas); ese artefacto privado **no se publicó**. La corrección dependiente obtiene cero alertas npm con todas las dependencias incluidas y umbral low, sin --force ni degradaciones. Detalles/versiones/fuentes primarias en [DEPENDENCY_SECURITY.md](DEPENDENCY_SECURITY.md).

Resultado local de la corrección: npm ci (709 paquetes), 14 financieras +120 MCP +4 auditoría =138 pruebas aprobadas, cero omitidas; TypeScript, lint sin errores/cuatro advertencias previas, auditoría pública de 254 archivos sin hallazgos, schema sin cambios, build, D1 independiente 0000–0010/48 tablas y Worker compilado aprobados. El Worker ejecuta las 31 lecturas (22 válidas/nueve not_found esperados en vacío), WebAuthn criptográfico sintético, CSRF/conexión persistente, inscripción no confiable, anti-framing y ejecución cerrada; además 27 comprobaciones API/UI. Nada usa D1 remota ni datos/credenciales de otra instalación. Las advertencias upstream de sourcemaps no se presentan como errores ni como una revisión visual.

El CI de la corrección y su instalación desde GitHub se actualizarán en seguimiento cuando terminen; no se deducen del clon basal ni de un lockfile sin alertas. Los comandos reproducibles están en AGENTS.md. verify:hosting **no está aprobado**: informa bloqueo por 21 instrucciones de metadatos fuera de esquema.

## Bloqueos alojados y pruebas personales

Se creó un Site privado nuevo con acceso solo del propietario y variables propias, sin credenciales de confianza. D1 está declarada, pero no se verificó su aprovisionamiento alojado; no se guardó versión ni inició deployment. El flujo oficial documenta migraciones solo de esquema; el bootstrap/invalidation de 0008/0010 necesita un procedimiento administrativo admitido fuera de ese flujo. El diagnóstico, gate y consulta preparada no enviada están en [SITES_MIGRATION_COMPATIBILITY.md](SITES_MIGRATION_COMPATIBILITY.md). No es un rechazo observado del backend ni una afirmación de imposibilidad permanente. No se retiran triggers ni se inventa SQL MCP/endpoints de administración para avanzar.

Una vez resuelto ese paso, el propietario realizará [USER_ACCEPTANCE_TESTS.md](USER_ACCEPTANCE_TESTS.md), empezando por UAT-3-HUMAN: acceso owner-only, registro legítimo y fijación administrativa de su autenticador, revisión de diff/digest/TTL y firma física. APPROVED no debe crear negocio y commit debe seguir dando writes_disabled. La guía contiene requisitos, datos ficticios, pasos, persistencia, denegaciones, precauciones y estado. Ninguna aceptación está marcada aprobada por inferencia; no se pide repetir carreras/rollback/firmas que ya son automáticas.

Los casos financieros y de ejecución real siguen bloqueados hasta demostrar el canal y revisar una habilitación explícita posterior. La investigación no presupone una API de aprobación de ChatGPT; [HUMAN_APPROVAL_SETUP.md](HUMAN_APPROVAL_SETUP.md) documenta el canal alternativo verificado localmente. Las firmas sintéticas no prueban interacción humana ni certifican hardware.

## Actualización y riesgos restantes

Seguir [UPGRADE_AND_ROLLBACK.md](UPGRADE_AND_ROLLBACK.md): incluir corrección de dependencias, commit aprobado, respaldo propio/restauración aislada, propuestas deshabilitadas y requests drenados, mecanismo de migración soportado y comprobación de versión/esquema. 0010 invalida planes antiguos sin tocar negocio. Rollback ordinario vuelve al código anterior con flags apagados y conserva tablas/evidencia; nunca restaura D1 automáticamente ni borra auditoría.

La instalación independiente existente conserva fase2/31 lecturas/ejecución deshabilitada y cero incidencias referenciales en la comprobación de solo lectura. Sus datos/configuración no se usan para desarrollar y no se le aplicó la actualización. Sus propietarios deberán adoptar una corrección aprobada por su propio procedimiento, no por un despliegue automático.

Permanecen pendientes revisión humana, aprobación alojada, cuota/rendimiento, retención y las capacidades ausentes enumeradas en paridad. El historial público, PR antiguos, forks y cachés siguen potencialmente accesibles; el responsable suspendió su sustitución. Fuente actual sin secretos y npm sin alertas no equivalen a retirada histórica ni a garantía permanente de seguridad.
