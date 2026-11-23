// Reglas y catálogo del módulo 03 · Reporte de daños.
// Son funciones puras (sin React ni Supabase) para poder probarlas con `npm test`.

export const LABS = {
  redes: {
    label: 'Laboratorio de Redes y Conectividad',
    resources: ['PC-01 (Estación de trabajo)', 'PC-05 (Estación de trabajo)', 'PC-12 (Estación de trabajo)', 'Switch Cisco Catalyst 2960', 'Proyector Epson Sala Redes', 'Infraestructura general / Otro'],
  },
  software: {
    label: 'Laboratorio de Ingeniería de Software',
    resources: ['PC-02 (Estación de desarrollo)', 'PC-08 (Estación de desarrollo)', 'PC-15 (Estación de desarrollo)', 'Pizarra Interactiva Smart', 'Infraestructura general / Otro'],
  },
  digitales: {
    label: 'Laboratorio de Sistemas Digitales',
    resources: ['Osciloscopio Digital Tektronix #03', 'Fuente de Poder DC #07', 'PC-04 (Simulación FPGA)', 'Infraestructura general / Otro'],
  },
  datos: {
    label: 'Laboratorio de Bases de Datos',
    resources: ['PC-03 (Servidor Local)', 'PC-10 (Estación Cliente)', 'Aire Acondicionado Central', 'Infraestructura general / Otro'],
  },
}

export const URGENCIES = [
  { value: 'Baja', hint: 'Deterioro leve' },
  { value: 'Media', hint: 'Falla parcial' },
  { value: 'Alta', hint: 'Inoperable' },
  { value: 'Crítica', hint: 'Riesgo físico' },
]

export const DESCRIPTION_MIN = 10
export const DESCRIPTION_MAX = 500
export const MAX_FILE_MB = 5
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'application/pdf']

// HU-01 / HU-02 / HU-03: campos obligatorios. Devuelve {} si todo está bien.
export function validateReport({ labKey, resource, description }) {
  const errors = {}
  if (!labKey || !LABS[labKey]) errors.lab = 'Debe seleccionar un laboratorio de la lista.'
  if (!resource || !(LABS[labKey]?.resources || []).includes(resource)) errors.resource = 'Debe seleccionar el equipo o infraestructura afectada.'
  if ((description || '').trim().length < DESCRIPTION_MIN) errors.description = `Ingresa una descripción de al menos ${DESCRIPTION_MIN} caracteres.`
  return errors
}

// HU-03: evidencia opcional (JPG/PNG/PDF, máx. 5 MB). Devuelve texto de error o null.
export function validateFile(file) {
  if (!file) return null
  if (!ALLOWED_TYPES.includes(file.type)) return `El archivo "${file.name}" no es válido. Solo se permiten JPG, PNG o PDF.`
  if (file.size > MAX_FILE_MB * 1024 * 1024) {
    return `El archivo "${file.name}" (${(file.size / 1024 / 1024).toFixed(1)} MB) supera el límite de ${MAX_FILE_MB} MB.`
  }
  return null
}

// HU-05: el código se normaliza (espacios y mayúsculas) antes de consultar.
export function normalizeCode(raw) {
  return (raw || '').trim().toUpperCase()
}

// HU-05: de estado en base de datos a lo que muestra la línea de progreso.
export function statusInfo(status) {
  if (status === 'ATENDIDO') return { label: 'Atendido', step: 3 }
  if (status === 'EN_PROCESO') return { label: 'En proceso', step: 2 }
  return { label: 'Registrado', step: 1 }
}

export function fileExtension(file) {
  return { 'image/jpeg': 'jpg', 'image/png': 'png', 'application/pdf': 'pdf' }[file.type] || 'bin'
}
