# Aprobación humana de propuestas (desarrollo)

## Estado de seguridad

El catálogo predeterminado mantiene las 31 herramientas de lectura. La rama de desarrollo incorpora un opt-in de once herramientas de propuesta/estado/salud (42 en total; 44 con lecturas ampliadas), con efectos limitados a metadatos y staging. Las 31 lecturas conservan sus contratos/anotaciones. `MCP_BUSINESS_WRITES_ENABLED=false` es una constante de código tanto en fábrica como en el transporte; ninguna variable ni `confirmed: true` abre ejecución.

Las propuestas caducan en diez minutos. La aprobación firma un desafío aleatorio vinculado en D1 al propietario, propuesta, revisión y digest. El endpoint humano exige identidad de Sites, política owner-only, origen HTTPS exacto, CSRF y WebAuthn con presencia/verificación de usuario. El modelo no dispone de herramienta approve ni de inscripción de claves de confianza.

## Evidencia y decisiones

Se consultaron [MCP de OpenAI](https://developers.openai.com/plugins/build/mcp-server), [SimpleWebAuthn 14.1](https://simplewebauthn.dev/docs/packages/server) y [D1.batch](https://developers.cloudflare.com/d1/worker-api/d1-database/). Las herramientas de Sites y la documentación consultada no proporcionaron una prueba firmada específica de aprobación de negocio verificable por este servidor. Esto es el resultado de la investigación, no una afirmación de inexistencia de toda API de aprobación. Una aprobación de llamada del host/API de Responses no se equipara automáticamente a nuestra evidencia de propietario + digest + revisión.

Se implementa el canal alternativo del plan maestro: página autenticada del Site y WebAuthn oficial. Firmas y registros sintéticos se prueban criptográficamente, con denegaciones; **no certifican interacción humana real, hardware ni una integración alojada**. Attestation `none` no certifica fabricante/hardware. La confianza depende de que el administrador fije personalmente la credencial legítima; no debe fijar candidatos de un modelo o tercero. Los contadores cero admiten passkeys sincronizadas; los desafíos únicos impiden replay, sin prometer detección de todos los clones de una clave comprometida.

## Preparar una instancia de desarrollo

No actualizar la instalación personal ni el Site original para probar esto. Usar una instancia de desarrollo privada, con D1 ficticia propia y acceso solo del propietario.

Seguir primero SITES_METADATA_BOOTSTRAP.md: para Sites se exporta una proyección de esquema sin modificar los SQL originales. El primer POST de registro de autenticador o prepare autenticados inicializa metadatos atómicamente, sin negocio; ninguna lectura lo hace. verify:hosting debe pasar en el checkout privado proyectado. El primer candidato ya se publicó, pero el registro antes de preparar una propuesta reveló un 503 erróneo; la corrección y regresión se registran en DEVELOPMENT_PROGRESS. La prueba humana permanece pendiente hasta reintentar personalmente sobre el código corregido.

1. Integrar/revisar las dependencias de PR en orden, o instalar la rama exacta de desarrollo indicada en DEVELOPMENT_PROGRESS. Ejecutar suite y build.
2. Validar 0000–0011 en D1 local. Para Sites publicar la proyección de esquema preparada desde el commit limpio según SITES_METADATA_BOOTSTRAP; no aplicar la cadena mixta original a ciegas ni sustituirla por ORM sin triggers. La primera preparación inicializa metadata_version=1 e invalida planes anteriores; conserva negocio, identidad/revisión existentes y recibos.
3. Configurar privadamente `MCP_OWNER_USER_ID` y/o `MCP_OWNER_EMAIL` de esta instalación. Configurar `MCP_PROPOSALS_ENABLED=true` y `MCP_APPROVAL_ORIGIN` con el origen HTTPS exacto de **este** Site (sin slash/ruta). No ponerlo en el manifiesto público.
4. Dejar `MCP_APPROVAL_CREDENTIALS` ausente o `[]`. Esto permite probar preparación/denegaciones, pero no aprobar con una clave sin fijar.
5. Publicar únicamente la versión de desarrollo autorizada. Abrir `/approvals/enroll` directamente, iniciar sesión como propietario y pulsar «Crear credencial con mi autenticador». Completar el control del sistema personalmente.
6. La página verifica el registro y entrega un candidato de clave pública. No lo activa. El administrador debe comprobar que corresponde al proceso que acaba de realizar y fijar ese JSON en la variable privada `MCP_APPROVAL_CREDENTIALS` mediante Sites. No copiarlo al repositorio. Nunca fijar una clave generada/proporcionada por el modelo. La página no recibe la clave privada.
7. Desplegar la nueva configuración en el mismo Site de desarrollo según su flujo. Si cambia el origen/RP ID, registrar otra credencial; no relajar el chequeo de origen.
8. Actualizar la conexión/plugin de desarrollo y verificar catálogo de 42 herramientas (44 al activar también MCP_EXTENDED_READS_ENABLED). Preparar una tarea `UAT Synthetic approval` y pedir request_approval. Abrir el enlace, revisar todos los efectos y la huella/versión/caducidad; pulsar «Aprobar esta versión» y completar el autenticador.
9. Consultar get_approval_status: APPROVED para esa versión; no debe existir una tarea persistida. Pedir commit debe devolver writes_disabled incluso con esa aprobación. El alta/aprobación no habilita escrituras por sí misma.

La configuración y los IDs pertenecen exclusivamente a cada instalación. No sustituir los headers autenticados con argumentos del modelo ni usar el fallback local de la UI para este canal: las APIs de aprobación no tienen ese fallback.

## Habilitación futura y revocación

Todavía **no autorizada por esta entrega**: modificar la constante para ejecutar negocio real. Antes se requieren prueba humana real de los pasos anteriores, revisión de seguridad/mantenedor, CI, pruebas D1 alojadas y aceptación correspondiente. La activación debe ser un cambio explícito revisado, nunca una inferencia del modelo ni una variable silenciosa.

Para retirar una credencial, quitarla de la configuración de esa instalación y cancelar propuestas pendientes/aprobadas antes de cualquier activación futura. No registrar claves nuevas a través de MCP. Ante pérdida/compromiso de una credencial, usar el control administrativo del Site y no publicar sus valores.

## Migración y rollback

0009 solo añade desafíos de registro con propietario, caducidad y consumición. Ninguna migración modifica saldos o entidades productivas. Revertir al código anterior con propuestas deshabilitadas deja tablas aditivas inactivas. No borrar tablas/restaurar D1 como rollback ordinario. El registro y las propuestas contienen datos del propietario y requieren una política de retención de desarrollo; el endurecimiento y recuperación se entregan separadamente.

0010 invalida propuestas y aprobaciones anteriores sin evidencia durable. Deshabilitar propuestas y drenar requests al aplicar el upgrade; preparar nuevas versiones después. El diff incluye efectos por acción y el impacto financiero calculado, también ligado a la huella. La firma/evidencia permanece después del commit y una clave retirada se deniega antes de una ejecución nueva.
