import { describe, expect, it } from 'vitest'
import { MAX_HOURS_PER_LOG, MIN_HOURS_PER_LOG, validateHours } from './hour-log-rules'

describe('validateHours', () => {
  it('accepts the minimum allowed value', () => {
    expect(validateHours(String(MIN_HOURS_PER_LOG), '08:00', '08:30')).toBeNull()
  })

  it('accepts the maximum allowed value', () => {
    expect(validateHours(String(MAX_HOURS_PER_LOG), '07:00', '17:00')).toBeNull()
  })

  it('rejects a value below the minimum', () => {
    expect(validateHours('0.2', '08:00', '08:10')).toContain('entre')
  })

  it('rejects a value above the maximum', () => {
    expect(validateHours('10.5', '07:00', '18:00')).toContain('entre')
  })

  it('rejects an empty or non-numeric value', () => {
    expect(validateHours('', '08:00', '09:00')).toBe('Ingresa un número de horas válido')
    expect(validateHours('abc', '08:00', '09:00')).toBe('Ingresa un número de horas válido')
  })

  it('rejects an end time that is not after the start time', () => {
    expect(validateHours('2', '10:00', '09:00')).toBe('La hora de fin debe ser posterior a la de inicio')
  })
})