# Plan de pruebas · Módulo 03 · Reporte de daños

> Los códigos CA de abajo están **derivados del prototipo del Grupo 5** (HU-01 a HU-06). Si tu documento oficial de HU usa otra numeración, solo cambia la columna «CA».

## Funcionalidades priorizadas para la presentación

| # | Funcionalidad | HU | Archivos clave |
|---|---|---|---|
| F1 | Registrar un reporte anónimo | HU-01, HU-02, HU-03, HU-06 | `DamageReports.jsx`, `damageRules.js`, función `create_damage_report` |
| F2 | Recibir código y consultar el estado | HU-04, HU-05 | `DamageReports.jsx`, función `get_damage_report` |

## A. Pruebas automáticas (se ejecutan solas)

### A1. Reglas de negocio · `npm test` (12 pruebas, Node, sin dependencias)

| CA | Prueba | Resultado esperado |
|---|---|---|
| HU-01 CA1 | Formulario completo | sin errores |
| HU-01 CA2 | Todo vacío | error en laboratorio, recurso y descripción |
| HU-02 CA1 | Recurso de otro laboratorio | rechazado |
| HU-02 CA2 | «Infraestructura general / Otro» en los 4 laboratorios | existe |
| HU-03 CA1 | Descripción de 9 y de 10 caracteres; solo espacios | 9 y espacios rechazan; 10 acepta |
| HU-03 CA2 | Sin archivo / JPG de 1.8 MB | válido |
| HU-03 CA3 | Archivo de 8.4 MB; archivo MP4 | rechazado (límite 5 MB / tipo no permitido) |
| HU-05 CA1 | Código `  rep-2026-x8f2 ` | normalizado a `REP-2026-X8F2` |
| HU-05 CA2 | Estados de BD → línea de progreso | Registrado=1, En proceso=2, Atendido=3 |

### A2. Servidor (SQL) · verificadas en un PostgreSQL local con las mismas funciones

Se comprobó que la base de datos **rechaza** por sí misma: laboratorio vacío, recurso vacío, descripción < 10 y > 500 caracteres, urgencia inválida y ruta de evidencia maliciosa; que **acepta** un reporte válido (incluida urgencia Crítica); que el usuario anónimo **no puede** leer, insertar ni modificar la tabla directamente; y que la tabla **no guarda** datos de identidad.

## B. Pruebas manuales con evidencia (hacerlas en la app conectada a Supabase)

Completa la última columna con la captura o el resultado real.

| ID | CA | Pasos | Resultado esperado | ¿Pasó? / Evidencia |
|---|---|---|---|---|
| M1 | HU-01 | Abrir **Reporte de daños** sin iniciar sesión | Se ve el formulario, sin login ni correo | |
| M2 | HU-01 CA2 | Pulsar **Enviar** con todo vacío | 3 mensajes en rojo; **no** aparece código; Table Editor sin filas nuevas | |
| M3 | HU-02 | Elegir «Laboratorio de Redes» | «Recurso» se habilita y solo lista recursos de Redes | |
| M4 | HU-06 | Marcar urgencia **Crítica** | Aparece la alerta «Precaución de seguridad inmediata» | |
| M5 | HU-03 CA3 | Adjuntar un archivo mayor a 5 MB | Mensaje de error y no queda adjunto | |
| M6 | F1 completo | Lab Redes, PC-12, urgencia Alta, descripción ≥ 10, foto JPG pequeña → **Enviar** | Pantalla de confirmación con código `REP-2026-XXXXXX` | |
| M7 | **Persistencia** | Abrir Supabase → Table Editor → `damage_reports` | La fila nueva existe con el mismo código, urgencia Alta y estado REGISTRADO | |
| M8 | HU-04 CA2 | Pulsar **Copiar código** | Cambia a «¡Código copiado!»; al pegar en el buscador es el mismo | |
| M9 | **Persistencia** | **Recargar la página (F5)** → Consultar estado → pegar el código | Muestra el reporte (sigue ahí tras recargar) | |
| M10 | HU-05 CA1 | Consultar `REP-2026-X8F2` | Estado «En proceso», urgencia Alta, nota técnica | |
| M11 | HU-05 CA2 | Consultar `REP-2026-A104` | Estado «Atendido», los 3 pasos en verde | |
| M12 | HU-05 CA3 | Consultar `REP-0000-ERR` | «Consulta sin resultados / No se encontró…» | |
| M13 | Trazabilidad | En Table Editor cambiar `status` de tu reporte a `EN_PROCESO`; consultar de nuevo | La app muestra «En proceso» | |
| M14 | Seguridad | En la consola del navegador no hay forma de listar reportes ajenos; en SQL Editor ejecuta `set role anon; select * from public.damage_reports;` | `permission denied for table damage_reports` | |

> Para M14 recuerda ejecutar luego `reset role;`.

## Resumen de resultados (completar el día de la presentación)

- Pruebas automáticas: ___ / 12 en `npm test`
- Pruebas manuales: ___ / 14
- Defectos encontrados y corregidos: ______________________
