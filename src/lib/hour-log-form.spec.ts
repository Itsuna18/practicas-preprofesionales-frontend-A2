import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  computeDurationLabel,
  formatDateForConfirmation,
  todayAsInputValue,
} from './hour-log-form'

describe('todayAsInputValue', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('devuelve la fecha actual en formato YYYY-MM-DD', () => {
    vi.setSystemTime(new Date(2026, 3, 7))
    expect(todayAsInputValue()).toBe('2026-04-07')
  })

  it('rellena mes y dia con cero a la izquierda cuando son de un solo digito', () => {
    vi.setSystemTime(new Date(2026, 0, 3))
    expect(todayAsInputValue()).toBe('2026-01-03')
  })
})

describe('formatDateForConfirmation', () => {
  it('devuelve cadena vacia cuando el valor es vacio', () => {
    expect(formatDateForConfirmation('')).toBe('')
  })

  it('devuelve cadena vacia si la fecha es invalida', () => {
    expect(formatDateForConfirmation('abcd-ef-gh')).toBe('')
  })

  it('arma la etiqueta legible en espanol con dia, mes y anio', () => {
    const result = formatDateForConfirmation('2026-04-07')
    expect(result).toContain('2026')
    expect(result.toLowerCase()).toContain('abril')
    expect(result).toContain('07')
  })
})

describe('computeDurationLabel', () => {
  it('devuelve null si falta la hora de inicio o la de fin', () => {
    expect(computeDurationLabel('', '12:00')).toBeNull()
    expect(computeDurationLabel('08:00', '')).toBeNull()
  })

  it('devuelve null si la hora de fin es igual o anterior al inicio', () => {
    expect(computeDurationLabel('10:00', '09:00')).toBeNull()
    expect(computeDurationLabel('10:00', '10:00')).toBeNull()
  })

  it('devuelve null si las horas no son numericas', () => {
    expect(computeDurationLabel('aa:bb', '09:00')).toBeNull()
  })

  it('calcula la duracion en horas con un decimal', () => {
    expect(computeDurationLabel('08:00', '12:00')).toBe('Duración calculada: 4.0 h')
    expect(computeDurationLabel('08:00', '12:30')).toBe('Duración calculada: 4.5 h')
  })
})