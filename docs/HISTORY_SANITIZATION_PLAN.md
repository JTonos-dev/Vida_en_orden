# Saneamiento de la distribución pública

Estado: preparación y ensayo local; el historial remoto sigue expuesto. Fecha de auditoría: 24 de noviembre de 2026. No se ha reescrito, borrado, renombrado ni cambiado la visibilidad de ningún remoto. No se han modificado Sites ni D1.

## Evidencia y alcance

El PR #3 fue aprobado por el propietario y fusionado en `317cfd8ce609ccdf5b5a2afa8cb452af06d61880`. El workflow del PR y el del merge terminaron satisfactoriamente. La aprobación registrada distinguía revisión de código y CI, y advertía que borrar contenido de HEAD no elimina su historial.

La auditoría de las referencias visibles encontró:

| Superficie | Cobertura y resultado |
|---|---|
| Oficial | 10 commits, 273 objetos alcanzables, tres ramas y tres referencias de PR. Se inspeccionaron blobs y metadatos de commits. |
| Fork existente | Nueve commits, cuatro ramas; su `main` todavía contenía el bootstrap anterior al PR #3. No usarlo como fuente de una distribución nueva. |
| Código antiguo | Fixtures personales, clasificación de proyectos y referencias a registros del origen en dos módulos de dominio. Retirados de HEAD por #3, recuperables históricamente. |
| Verificador | Dos versiones del script contenían correos y un dominio particulares, incluso después de #3. Esta propuesta los sustituye por reglas genéricas, sin publicar sus valores. |
| Identidad Git | Se encontraron direcciones personales en metadatos de autor/committer. No son necesarias para distribuir la aplicación. |
| PR | Tres PR históricos revisados; los diffs de #2 y #3 contienen material que debe tratarse en la retirada. Las tres referencias de PR dependen de la historia afectada. |
| Issues y comentarios | Sin comentarios de issue ni comentarios inline de revisión en la consulta. Revisiones y cuerpos consultados; las copias de metadatos también pueden exponer identidad Git. |
| Actions | Nueve logs disponibles descargados y revisados; sin credenciales detectadas. Sin artefactos ni releases en la consulta inicial. |
| Secretos | Gitleaks 8.30.1, con checksum oficial comprobado y salida redactada, no detectó credenciales en los historiales oficial/fork ni en los logs. Esto no demuestra ausencia de secretos de formatos desconocidos. No se identificó una credencial concreta que deba rotarse. |
| LFS y archivos privados | Sin LFS ni bases, respaldos, claves privadas o archivos de entorno versionados detectados en los objetos revisados. |

Las cifras corresponden al corte previo al PR de esta propuesta. Al publicar y revisar esta corrección se crean nuevas referencias y diffs: hay que repetir el inventario antes de la retirada y añadir este PR a la solicitud privada. No publicar un informe con los valores sensibles ni enlaces que los reproduzcan.

Se conservaron evidencias solo en directorios locales ignorados `work/history-audit/` y `outputs/`. No se usan esos datos para probar reglas de negocio. El nuevo auditor incluye todos los objetos almacenados en una copia local, también los inalcanzables; no puede descubrir objetos del servidor que GitHub no anuncie, clones desconocidos o cachés externas.

## Alternativas ensayadas y decisión

Se instaló `git-filter-repo` 2.47.0 únicamente en el espacio de auditoría y se ejecutó en un espejo local desechable. Se sustituyeron los blobs afectados, se sanearon direcciones de metadatos y se conservaron los 10 commits y las seis referencias. El auditor de todos los objetos no encontró los patrones sensibles después del ensayo. El mapa de commits y `changed-refs` se guardaron localmente; no se envió ese espejo a GitHub.

Publicar ese resultado sobre el repositorio existente exigiría cambios de historia no fast-forward. El procedimiento habitual documentado por GitHub requiere permitirlos, lo que contradice la condición de conservar las protecciones. Un PR ordinario tampoco elimina sus propios antecesores. **Se descarta ejecutar esa reescritura remota bajo las condiciones actuales.** No se empleará el comando de force-push que sugiera la salida del programa.

La opción recomendada es una **distribución independiente con una raíz nueva**, formada exclusivamente por los archivos aprobados del árbol actual, sin copiar `.git`, refs, bundles, reflogs, logs ni estado local. Conserva el código funcional, ocho migraciones, pruebas, documentación y licencias; sustituye el historial de desarrollo, no los datos de una instalación. El repositorio nuevo debe quedar fuera de la red de forks contaminada.

Esto prepara una distribución limpia, pero **no elimina por sí solo la exposición del repositorio antiguo**. Su retirada y la del fork requieren intervención del propietario y coordinación con Support; hasta confirmarlas, el saneamiento remoto queda pendiente.

## Procedimiento de corte propuesto, sujeto a aprobación específica

1. Integrar este PR mediante revisión y CI. Verificar de nuevo la punta exacta de `main`, PR abiertos, ramas, forks y reglas. Congelar nuevas contribuciones durante la ventana acordada; no desactivar las reglas. Si cambia el árbol aprobado, regenerar el candidato y todas sus pruebas.
2. Preparar en local un repositorio sin antecesores desde ese árbol, con autor noreply, sin remotos y con un manifiesto de SHA-256 de todos sus archivos. Comparar bytes, modos y rutas con el árbol aprobado. Auditar todos los objetos y ejecutar la suite completa, build y D1 temporal. El candidato es independiente de los espejos de auditoría.
3. Solicitar al propietario la creación de `JorgeTonos28/Vida_en_orden_saneado`, vacío y **standalone**, sin importar ni bifurcar el anterior. Ese nombre es una propuesta y debe aprobarse antes de crearlo. La cuenta ejecutora actual no tiene administración ni push sobre el repositorio oficial.
4. Con autorización específica del candidato exacto, cargar una sola vez su commit inicial a ese repositorio nuevo. Es una inicialización, sin force-push ni reemplazo de una rama protegida existente. Configurar antes de aceptar contribuciones PR obligatorio, check `verify`, bloqueo de force-push/borrado y una aprobación distinta del autor cuando estén habilitados los dos colaboradores. No autorizar bypasses. Comprobar estas reglas desde GitHub y un PR de validación; si el plan/cuenta no las permite, no declarar listo el nuevo remoto.
5. Validar el nuevo remoto desde un clon fresco: una sola raíz, fuente y migraciones idénticas, auditoría integral sin hallazgos, CI verde, flujo de PR operativo y ausencia de antecesores del repositorio anterior. Registrar ID del repositorio y raíz, no solo su URL. No cambiar aún URLs canónicas ni restaurar datos en Sites.
6. Regenerar el inventario de la red antigua. Presentar al propietario y a GitHub Support el borrador privado de retirada, con refs, PR, primer commit afectado y evidencias. Acordar el mecanismo de retirada que respete las protecciones; no asumir que archivar, privatizar o borrar elimina las cachés. La eliminación de un repositorio/fork, cambio de visibilidad o pérdida de metadatos necesita una aprobación explícita adicional con los objetivos exactos y el resultado de Support.
7. Tras esa aprobación, el propietario ejecuta únicamente la retirada acordada. Coordinar el fork propio: preservar solo parches de código revisados, retirar el fork contaminado por el procedimiento autorizado y crear otro desde el nuevo remoto limpio. **No** hacer mirror-push del fork viejo, merge, pull ni importación de su `.git` al candidato. La cuenta actual puede gestionar su fork, pero no se borrará ni recreará sin la autorización específica de esa operación.
8. Recrear los clones de trabajo desde el nuevo repositorio. Las copias de auditoría y el clon anterior quedan fuera del flujo normal; retirar sus credenciales/remotos de push y acordar retención/eliminación segura de la evidencia. No copiar la configuración local de identidad de una instalación a Git. Mantener intacto el repositorio privado de Sites y sus D1; un cambio del origen GitHub no requiere desplegarlos.
9. Actualizar enlaces canónicos mediante PR en el nuevo repositorio y avisar a los colaboradores en el mismo hilo de coordinación. Repetir las comprobaciones de accesibilidad por SHA, URLs raw, refs de PR y API de la red anterior. Registrar qué objetos siguen accesibles y la respuesta de Support. No abrir desarrollo funcional hasta cerrar estos criterios.

No hay un script que ejecute automáticamente estos pasos administrativos. El generador local y los comandos de auditoría no publican ni borran remotos. La aprobación debe identificar candidato, repositorio de destino y operaciones administrativas; no basta con aprobar genéricamente «limpiar el historial».

## Riesgos residuales y solicitud a Support

- Branches, tags y PR antiguos pueden retener objetos aunque `main` esté limpio. Las refs de PR son de solo lectura para Git; necesitan intervención de GitHub.
- Los diffs, cuerpos, revisiones y comentarios son superficies diferentes. Desreferenciar un diff no borra texto citado en un comentario.
- GitHub puede conservar vistas por SHA, URLs raw, red de forks, índices, caches, logs, artefactos, releases o LFS. Requieren inventario y decisiones separadas. La admisibilidad y el alcance de Support no están garantizados.
- Privatizar un repositorio público no privatiza sus forks públicos. Archivar bloquea desarrollo, pero no oculta datos. Borrar y volver a crear el mismo nombre tampoco garantiza la eliminación de las copias históricas.
- Copias descargadas, clones de terceros, backups y cachés ajenas a GitHub no pueden revocarse desde aquí. Pedir a sus propietarios que las retiren y verificar lo que sea observable; no prometer borrado universal.
- No revocar ni rotar credenciales solo por una coincidencia de formato. Si aparece una credencial auténtica, registrar proveedor, ubicación y alcance sin el valor, detener distribución y solicitar su revocación/rotación al dueño antes de continuar.

El borrador privado en `outputs/history-cleanup/support-request.txt` incluye el corte de auditoría y los identificadores necesarios, sin reproducir la información personal. Debe enviarse por el propietario de la red original. No se ha enviado una solicitud a Support ni se ha supuesto su aceptación.

## Validación y criterio de cierre

`npm run audit:public` inspecciona los archivos versionados del checkout. `npm run audit:public -- --history` inspecciona blobs, commits, tags y objetos inalcanzables de la copia local. El CI ordinario verifica la fuente y sus regresiones; mientras exista la historia antigua, un CI verde **no certifica su saneamiento**.

El cierre exige: nuevo origen limpio probado y protegido, fork y clones activos recreados sin objetos antiguos, ausencia comprobada de referencias públicas sensibles conocidas, retirada de las superficies históricas por su propietario/Support, y registro explícito de las copias externas no controlables. Si algún requisito falla, mantener el estado «pendiente de saneamiento remoto» y conservar las escrituras MCP deshabilitadas.

## Fuentes del procedimiento

- [GitHub: retirar datos sensibles](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository).
- [Manual de git-filter-repo](https://github.com/newren/git-filter-repo/blob/main/Documentation/git-filter-repo.txt).
- [GitHub: separar un fork](https://docs.github.com/en/pull-requests/how-tos/work-with-forks/detaching-a-fork).
- [GitHub: efectos de cambiar la visibilidad](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/managing-repository-settings/setting-repository-visibility).
