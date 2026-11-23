# Conectar Supabase con StackBlitz (módulo 03 · Reporte de daños)

Tiempo estimado: 10 minutos. Hazlo en este orden.

## 0. Abrir el proyecto en StackBlitz en la carpeta correcta

El `package.json` está dentro de la carpeta `labfis-plantilla-main/`, no en la raíz del repositorio. Si abres la raíz, StackBlitz no encuentra el proyecto. Abre esta URL:

```
https://stackblitz.com/github/freddy1604/Proyecto_Software_II/tree/main/labfis-plantilla-main
```

Cuando cargue, en la terminal debe correr `npm install` y luego `npm run dev`. Si no arranca solo, escribe `npm run dev`.

## 1. Crear las tablas en Supabase

1. Entra a tu proyecto en https://supabase.com/dashboard.
2. Menú izquierdo → **SQL Editor** → **New query**.
3. Abre el archivo `supabase/02_danos.sql`, copia **todo** su contenido y pégalo.
4. Pulsa **Run**. Debe responder `Success. No rows returned`. Se puede ejecutar varias veces sin problema.
5. Comprueba en **Table Editor** que existe `damage_reports` con 2 filas de ejemplo (`REP-2026-X8F2` y `REP-2026-A104`).

> No hace falta activar nada en **Authentication**: el módulo es anónimo.

## 2. Copiar URL y clave pública

En Supabase: **Project Settings → API** (o el botón **Connect** arriba):

- **Project URL** → `https://xxxxxxxx.supabase.co`
- **Publishable key** → empieza con `sb_publishable_...` (si tu proyecto es antiguo, sirve la clave **anon** `eyJ...`)

**Nunca** uses `service_role`, `sb_secret_...` ni la contraseña de la base de datos.

## 3. Pegarlas en StackBlitz

1. En el explorador de archivos de StackBlitz, dentro de `labfis-plantilla-main/` (al lado de `package.json`), crea un archivo llamado exactamente `.env.local`.
2. Pega esto con tus valores, sin comillas ni espacios extra, y sin `/` al final de la URL:

```env
VITE_SUPABASE_URL=https://TU-PROYECTO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=TU_CLAVE_PUBLICABLE
```

3. **Reinicia el servidor** (Vite solo lee las variables al arrancar): en la terminal, `Ctrl + C` y luego `npm run dev`.
4. Arriba a la derecha de la app debe aparecer **«Supabase configurado»** en verde (antes decía «Modo sin conexión»).

`.env.local` está en `.gitignore`: no se sube a GitHub. Si no estuviera, **no** lo subas.

## 4. Comprobar que guarda de verdad

1. Menú **Reporte de daños** → llena el formulario → **Enviar reporte anónimo**.
2. Debe aparecer un código `REP-2026-XXXXXX`.
3. En Supabase → **Table Editor → damage_reports**: el reporte nuevo debe estar en la tabla.
4. Recarga la página de la app → **Consultar estado** → pega el código → debe mostrar el reporte.

## Si algo falla

| Síntoma | Causa probable | Solución |
|---|---|---|
| Sigue «Modo sin conexión» | Archivo mal ubicado, nombre mal escrito o no reiniciaste | `.env.local` junto a `package.json`; nombres exactos `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY`; reinicia con `npm run dev` |
| `Failed to fetch` / `Invalid API key` | URL o clave con error de copia, o proyecto pausado | Copia de nuevo desde Settings → API; en el panel revisa que el proyecto esté activo (los gratuitos se pausan por inactividad) |
| `Could not find the function public.create_damage_report` | No se ejecutó el SQL, o Supabase no actualizó su caché | Ejecuta `02_danos.sql`; luego en SQL Editor ejecuta `notify pgrst, 'reload schema';` y espera unos segundos |
| `permission denied for function ...` | Faltaron los `grant` | Vuelve a ejecutar completo `02_danos.sql` |
| `No se pudo subir la evidencia (Bucket not found)` | No se creó el bucket | Vuelve a ejecutar completo `02_danos.sql`, o envía el reporte sin foto |
| El reporte se envía pero «Consultar» no lo encuentra | Código mal copiado (el sistema ignora mayúsculas y espacios, pero no letras distintas) | Usa el botón **Copiar código** |

## Plan B para la presentación

Si Supabase o el internet fallan el día de la exposición, **no se considera persistencia real** (lo dice la guía docente). Por eso, antes de exponer:

- Haz una prueba completa y toma capturas: formulario enviado, código generado, fila en Table Editor y consulta tras recargar.
- Graba un video corto (1 minuto) del flujo completo como respaldo.
