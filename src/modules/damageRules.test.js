// Pruebas automáticas (sin dependencias): `npm test`
import test from 'node:test'
import assert from 'node:assert/strict'
import { validateReport, validateFile, normalizeCode, statusInfo, LABS } from './damageRules.js'

const ok = { labKey: 'redes', resource: 'PC-12 (Estación de trabajo)', description: 'El monitor parpadea constantemente.' }

// HU-01 · campos obligatorios
test('HU-01: formulario completo no tiene errores', () => assert.deepEqual(validateReport(ok), {}))
test('HU-01: con todo vacío marca laboratorio, recurso y descripción', () => {
  const e = validateReport({ labKey: '', resource: '', description: '' })
  assert.ok(e.lab && e.resource && e.description)
})

// HU-02 · cascada laboratorio -> recurso
test('HU-02: un recurso de otro laboratorio no es válido', () => {
  assert.ok(validateReport({ ...ok, resource: LABS.datos.resources[0] }).resource)
})
test('HU-02: "Infraestructura general / Otro" existe en todos los laboratorios', () => {
  for (const lab of Object.values(LABS)) assert.ok(lab.resources.includes('Infraestructura general / Otro'))
})

// HU-03 · descripción y evidencia
test('HU-03: descripción de 9 caracteres se rechaza y de 10 se acepta', () => {
  assert.ok(validateReport({ ...ok, description: '123456789' }).description)
  assert.equal(validateReport({ ...ok, description: '1234567890' }).description, undefined)
})
test('HU-03: espacios no cuentan como descripción', () => {
  assert.ok(validateReport({ ...ok, description: '            ' }).description)
})
test('HU-03: sin archivo es válido (la evidencia es opcional)', () => assert.equal(validateFile(null), null))
test('HU-03: JPG de 1.8 MB es válido', () => assert.equal(validateFile({ name: 'a.jpg', type: 'image/jpeg', size: 1.8 * 1024 * 1024 }), null))
test('HU-03: archivo de 8.4 MB se rechaza por superar 5 MB', () => {
  assert.match(validateFile({ name: 'video.png', type: 'image/png', size: 8.4 * 1024 * 1024 }), /supera el límite de 5 MB/)
})
test('HU-03: un MP4 se rechaza por tipo', () => {
  assert.match(validateFile({ name: 'video.mp4', type: 'video/mp4', size: 1024 }), /JPG, PNG o PDF/)
})

// HU-05 · consulta
test('HU-05: el código se normaliza a mayúsculas y sin espacios', () => assert.equal(normalizeCode('  rep-2026-x8f2 '), 'REP-2026-X8F2'))
test('HU-05: estados de base de datos a línea de progreso', () => {
  assert.deepEqual(statusInfo('REGISTRADO'), { label: 'Registrado', step: 1 })
  assert.deepEqual(statusInfo('EN_PROCESO'), { label: 'En proceso', step: 2 })
  assert.deepEqual(statusInfo('ATENDIDO'), { label: 'Atendido', step: 3 })
})
