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

## Fases en paralelo

Un agente puede trabajar en la fase 3 mientras otro prepara documentación de la fase 5, pero ningún PR debe asumir que una fase anterior ya está integrada. Declara el commit base, las dependencias y los contratos esperados. Para incorporar trabajo de otra fase, prueba primero el PR en una instalación aislada y resuelve conflictos conservando invariantes financieras y scopes MCP.

## Conflictos y contratos

Si cambia una herramienta MCP, actualiza schema, descripción, anotaciones, pruebas, matriz de paridad y changelog en el mismo PR. No cambies silenciosamente el significado de un campo ni reutilices un cursor incompatible.

Si cambia el esquema, añade una migración aditiva, documenta el orden, prueba upgrade desde la versión anterior y explica rollback. El código de una fase no debe activar automáticamente las escrituras de otra.

## Continuar desde un PR pendiente

Revisa el diff, el commit base, los checks y los comentarios. Si el PR quedó desactualizado, actualiza su rama desde `main` sin reescribir ramas compartidas. No fusiones ni despliegues hasta que el estado de CI y la documentación reflejen el mismo código.

## Publicación de instalaciones

El repositorio es compartido; las instalaciones son independientes. Un merge a `main` no autoriza desplegar la instalación personal de otro colaborador. Cada responsable debe decidir cuándo actualizar su Site, preparar respaldo y verificar la versión desplegada.
