# Colaboración entre agentes

## Flujo normal

```text
main actualizado
  -> rama limitada
  -> pruebas y documentación
  -> push de la rama
  -> pull request
  -> revisión y CI
  -> merge autorizado
```

Cada PR debe indicar objetivo, archivos, contratos, migraciones, pruebas ejecutadas, pruebas no ejecutadas, riesgos, rollback y si requiere publicación manual de Sites.

## Protección de `main`

La configuración objetivo para este repositorio pequeño es:

- exigir pull request hacia `main`;
- exigir el check `CI / verify` exitoso y actualizado;
- bloquear force-push y eliminación de `main`;
- exigir al menos una revisión humana cuando haya un segundo colaborador;
- impedir el merge mientras haya checks pendientes o fallidos;
- permitir al responsable del repositorio resolver un bloqueo excepcional de administración, pero no usarlo para eludir una revisión ordinaria.

La consulta actual del 24 de noviembre de 2026 encontró el ruleset activo `Protect main`, aplicado a la rama por defecto: exige PR, check `verify` de GitHub Actions y bloqueo de borrado/force-push. Permite cero aprobaciones y no exige actualizar el check contra la base. La protección clásica no pudo leerse con la cuenta ejecutora; no se afirman reglas adicionales. El PR #3 tuvo revisión aprobatoria del dueño y CI verde antes del merge. El propietario debe completar la aprobación humana requerida cuando ambos colaboradores estén habilitados y decidir el requisito de base actualizada. No hacer push directo a `main` para probarlo.

## Retirada de historia contaminada

El procedimiento excepcional está en `HISTORY_SANITIZATION_PLAN.md`. Los cambios ordinarios del auditor y la documentación pasan por PR/CI; no eliminan antecesores. La opción propuesta prepara una distribución standalone de una sola raíz sin force-push. No publicar el candidato, retirar repositorios/forks ni cambiar visibilidad sin autorización específica. No recuperar ramas antiguas mediante merge, mirror o sincronización del fork después del corte; recrear los clones y trasladar solo parches revisados.

Con dos colaboradores, el primer PR de cada persona debe ser revisado por la otra. Mientras exista un solo colaborador efectivo, la revisión obligatoria de una persona distinta al autor puede bloquear el flujo; por eso debe activarse cuando el segundo colaborador tenga acceso de escritura.

## Fases en paralelo

Un agente puede trabajar en la fase 3 mientras otro prepara documentación de la fase 5, pero ningún PR debe asumir que una fase anterior ya está integrada. Declara el commit base, las dependencias y los contratos esperados. Para incorporar trabajo de otra fase, prueba primero el PR en una instalación aislada y resuelve conflictos conservando invariantes financieras y scopes MCP.

## Conflictos y contratos

Si cambia una herramienta MCP, actualiza schema, descripción, anotaciones, pruebas, matriz de paridad y changelog en el mismo PR. No cambies silenciosamente el significado de un campo ni reutilices un cursor incompatible.

Si cambia el esquema, añade una migración aditiva, documenta el orden, prueba upgrade desde la versión anterior y explica rollback. El código de una fase no debe activar automáticamente las escrituras de otra.

## Continuar desde un PR pendiente

Revisa el diff, el commit base, los checks y los comentarios. Si el PR quedó desactualizado, actualiza su rama desde `main` sin reescribir ramas compartidas. No fusiones ni despliegues hasta que el estado de CI y la documentación reflejen el mismo código.

## Publicación de instalaciones

El repositorio es compartido; las instalaciones son independientes. Un merge a `main` no autoriza desplegar la instalación personal de otro colaborador. Cada responsable debe decidir cuándo actualizar su Site, preparar respaldo y verificar la versión desplegada.

## Prueba de una instalación independiente

Desde un clon limpio, después de `npm ci` y `npm run build`, ejecutar `npm run verify:independent`. El script usa una D1 local temporal, aplica todas las migraciones y no puede alcanzar la base remota porque siempre usa `--local`. Las pruebas MCP verifican catálogo de 31 herramientas, solo lectura, owner-only, rechazo sin identidad y política ausente, y aislamiento por propietario.

## Integración desde un PR pendiente

Registrar el commit base del PR, comprobar sus checks y probar la rama en un clon independiente. Si requiere otra fase o migración, no mezclarlo por conveniencia: actualizar la matriz de dependencias, aplicar migraciones aditivas en orden y documentar el rollback. Tras el merge, el propietario de cada Site decide separadamente si sincroniza y publica ese commit.
