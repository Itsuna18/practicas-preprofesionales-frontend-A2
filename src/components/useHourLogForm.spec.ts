import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  buildHourLogFormErrors,
  useHourLogForm,
  type HourLogFormErrors,
  type HourLogFormValues,
} from './useHourLogForm'

const emptyValues: HourLogFormValues = {
  date: '',
  startTime: '',
  endTime: '',
  hours: '',
  activity: '',
}

describe('buildHourLogFormErrors', () => {
  it('marca los campos obligatorios cuando el formulario esta vacio', () => {
    const errors = buildHourLogFormErrors(emptyValues)
    expect(errors.date).toBeDefined()
    expect(errors.startTime).toBeDefined()
    expect(errors.endTime).toBeDefined()
    expect(errors.activity).toBeDefined()
  })

  it('acepta un formulario completo y valido sin errores', () => {
    const errors = buildHourLogFormErrors({
      date: '2026-04-07',
      startTime: '08:00',
      endTime: '12:00',
      hours: '4',
      activity: 'Soporte',
    })
    expect(errors).toEqual({})
  })

  it('rechaza las horas fuera del rango permitido', () => {
    const errors = buildHourLogFormErrors({
      date: '2026-04-07',
      startTime: '07:00',
      endTime: '18:00',
      hours: '11',
      activity: 'Jornada larga',
    })
    expect(errors.hours).toContain('entre')
  })

  it('rechaza una actividad que solo tiene espacios', () => {
    const errors = buildHourLogFormErrors({
      date: '2026-04-07',
      startTime: '08:00',
      endTime: '12:00',
      hours: '4',
      activity: '   ',
    })
    expect(errors.activity).toBeDefined()
  })
})

describe('useHourLogForm', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 3, 7))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('inicia con fecha de hoy y el resto de campos vacios', () => {
    const { result } = renderHook(() => useHourLogForm())
    expect(result.current.values.date).toBe('2026-04-07')
    expect(result.current.values.startTime).toBe('')
    expect(result.current.values.activity).toBe('')
    expect(result.current.errors).toEqual({})
  })

  it('setField actualiza el valor del campo', () => {
    const { result } = renderHook(() => useHourLogForm())
    act(() => {
      result.current.setField('startTime', '08:00')
      result.current.setField('endTime', '12:00')
    })
    expect(result.current.values.startTime).toBe('08:00')
    expect(result.current.values.endTime).toBe('12:00')
  })

  it('las derivadas se actualizan segun los campos', () => {
    const { result } = renderHook(() => useHourLogForm())
    act(() => {
      result.current.setField('startTime', '08:00')
      result.current.setField('endTime', '12:00')
      result.current.setField('hours', '11')
    })
    expect(result.current.confirmationLabel.toLowerCase()).toContain('abril')
    expect(result.current.durationLabel).toBe('Duración calculada: 4.0 h')
    expect(result.current.liveHoursWarning).toContain('entre')
  })

  it('validate devuelve los errores y los deja en el estado', () => {
    const { result } = renderHook(() => useHourLogForm())
    act(() => {
      result.current.setField('date', '')
    })
    let nextErrors: HourLogFormErrors = {}
    act(() => {
      nextErrors = result.current.validate()
    })
    expect(nextErrors.date).toBeDefined()
    expect(result.current.errors.date).toBeDefined()
  })

  it('reset vuelve a los valores iniciales y limpia los errores', () => {
    const { result } = renderHook(() => useHourLogForm())
    act(() => {
      result.current.setField('startTime', '08:00')
      result.current.setField('activity', 'algo')
      result.current.validate()
    })
    expect(result.current.values.activity).toBe('algo')

    act(() => {
      result.current.reset()
    })
    expect(result.current.values.startTime).toBe('')
    expect(result.current.values.activity).toBe('')
    expect(result.current.values.date).toBe('2026-04-07')
    expect(result.current.errors).toEqual({})
  })
})