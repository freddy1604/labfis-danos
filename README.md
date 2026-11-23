# LABFIS · Grupo 5 · Reporte Anónimo de Daños

**SIGELAB** — Sistema Integral de Gestión de Servicios de LABFIS
**Materia:** Ingeniería de Software II · EPN
**Fecha de entrega:** 23 de noviembre de 2026

## Integrantes del equipo
- Adrián Correa
- Freddy Jiménez
- Josué Mantuano

## Descripción del Módulo
Este módulo permite a estudiantes y docentes de la Facultad de Ingeniería de Sistemas reportar daños en equipos e instalaciones de los laboratorios (LABFIS) de forma **100% anónima**, sin necesidad de iniciar sesión. A cambio, el sistema genera un **código único de seguimiento** que permite al usuario consultar el estado de su reporte posteriormente (Registrado, En Proceso o Atendido).

## 🛠 Stack Tecnológico
- **Frontend:** React 18 + Vite + Tailwind CSS
- **Backend / Base de Datos:** Supabase (PostgreSQL 15)
- **Control de versiones:** GitHub
- **Despliegue:** Vercel
- **Herramientas Ágiles:** JIRA (Backlog) y TestRail (Casos de prueba)

## Historias de Usuario Implementadas
| Código | Título | Prioridad | Estado |
| :--- | :--- | :--- | :--- |
| **HU-01** | Reportar daño de forma anónima | Alta | Implementado |
| **HU-02** | Identificar laboratorio y recurso afectado | Alta | Implementado |
| **HU-03** | Describir problema y adjuntar evidencias | Alta | Implementado |
| **HU-04** | Recibir código de seguimiento | Media | Implementado |
| **HU-05** | Consultar estado de un reporte | Media | Implementado |
| **HU-06** | Indicar urgencia percibida | Baja | Integrado en HU-01 |

## Ejecución Local
Para correr este proyecto en tu computadora, sigue estos pasos:

1. Instalar dependencias:
   ```bash
   npm install