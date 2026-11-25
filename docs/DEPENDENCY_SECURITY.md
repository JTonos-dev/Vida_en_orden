# Seguridad de dependencias y publicación

La auditoría de secretos/fuente y npm audit comprueban riesgos distintos. CI verde de contratos tampoco demuestra ausencia de vulnerabilidades en el framework. No aplicar npm audit fix --force, degradar Drizzle ni cambiar migraciones para silenciar alertas.

## Hallazgo de cierre (24 de noviembre de 2026)

El lockfile del cierre 33a6a53, heredado en gran parte de la aplicación transferida, obtuvo 33 entradas de paquetes afectadas: dos críticas, 14 altas, 16 moderadas y una baja. Es un conteo de paquetes/propagación del auditor, no 33 vulnerabilidades independientes ni prueba de explotación. Las dos entradas críticas eran next y react-server-dom-webpack. El nuevo Site privado fue creado y configurado, pero **el artefacto de esa base no se publicó** al conocerse el resultado. Ninguna instalación personal se modifica.

Fuentes primarias revisadas:

- [Aviso de React sobre RSC](https://github.com/advisories/GHSA-xqc2-xf4c-x3h3): versiones corregidas 19.2.9/19.3.1; la aplicación compila RSC, por lo que no basta con que sus herramientas MCP estén bloqueadas.
- [Aviso de Next sobre ImageResponse](https://github.com/advisories/GHSA-vcvr-r3jv-pc5j): afecta a uso Node de contenido SVG no confiable. La presencia del paquete es un hallazgo de auditoría; no prueba por sí sola exposición de esa API en esta aplicación.
- [Aviso de Zod](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5): consumo excesivo de memoria con colecciones; versión corregida 4.6.6. Los límites previos de cuerpo/nodos/acciones son defensa adicional, no motivo para conservar una versión afectada.

No se investigó explotación retrospectiva en instalaciones ajenas ni se obtuvieron sus logs o datos. Sus propietarios deben revisar/adoptar una actualización verificada por el procedimiento de respaldo y rollback, cuando esté aprobada; no se despliega automáticamente.

## Corrección en rama dependiente

Rama fix/mcp-runtime-dependencies, depende del cierre #10 (12f6bde). El lockfile corregido obtiene **cero vulnerabilidades** con audit:dependencies (registro npm público, sin omitir desarrollo y con umbral low). npm ci instaló 709 paquetes; 14 financieras +120 MCP +4 de auditoría =138 pruebas aprobadas. TypeScript, generación sin cambios, build, migraciones en D1 y Worker/27 comprobaciones API/UI aprobados. La auditoría de dependencias se añade al CI y falla también si no puede consultar el registro.

| Componente | Versión fijada |
|---|---|
| React / ReactDOM / RSC | 19.3.1 |
| Next / eslint-config-next | 16.4.6 |
| Vinext / Vite / plugin-rsc | 1.4.6 / 8.3.8 / 0.5.39 |
| Cloudflare vite-plugin / Wrangler | 1.70.1 / 4.164.0 |
| Workers types / Drizzle kit | 5.20261124.2 / 0.31.11 |
| Zod | 4.6.7, API v4; no import de zod/v3 |
| Overrides acotados | miniflare → sharp 0.35.5; esbuild 0.28.2; satori → fflate 0.7.5 |

Los records usan claves string explícitas por la [migración oficial de Zod](https://zod.dev/v4/changelog). npm audit fix sin force actualizó transitivas compatibles; no se aceptó la sugerencia de degradar Vinext ni Drizzle. La dependencia exacta fflate 0.7.4 de Satori se fija al [backport corregido 0.7.5](https://github.com/advisories/GHSA-px8p-9vwx-vf98), conservando su línea API. Los overrides deben revisarse al actualizar esas dependencias; no son una política de actualización automática.

La migración conservó los contratos. El dispatcher mantiene salida tipada por herramienta, sin any para resolver la API nueva; las pruebas de conformance verifican código/campo del error en lugar de frases inglesas de Zod 3. Las 31 herramientas y la compuerta false siguen siendo criterios de regresión. El build conserva advertencias no bloqueantes de sourcemaps del plugin RSC; no equivalen a un fallo funcional ni a ausencia de prueba visual. Repetir CI/instalación desde GitHub del commit publicado, sin inferir compatibilidad solo por semver o npm install.

La configuración e identidad de Sites permanece en el checkout privado de publicación. Reutilizar el Site nuevo ya creado y preparar un artefacto corregido del commit revisable; no desplegar el tar de la base anterior. La compatibilidad de migraciones alojadas todavía debe comprobarse, sin retirar los triggers ni abrir SQL desde MCP.
