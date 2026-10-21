import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/offline/db'
import type { HourLogFormValues } from './useHourLogForm'
import {
  buildHourLogOutboxOperation,
  buildHourLogRow,
  useSubmitHourLog,
} from './useSubmitHourLog'

const validValues: HourLogFormValues = {
  date: '2026-04-07',
  startTime: '08:00',
  endTime: '12:00',
  hours: '4',
  activity: 'Soporte en campo',
}

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('buildHourLogRow', () => {
  it('construye el registro local con los valores del formulario', () => {
    const now = new Date('2026-04-07T08:00:00.000Z')
    const row = buildHourLogRow(validValues, 7, now)
    expect(row.placementId).toBe(7)
    expect(row.hours).toBe(4)
    expect(row.activity).toBe('Soporte en campo')
    expect(row.status).toBe('SUBMITTED')
    expect(row.syncState).toBe('local')
    expect(row.updatedAt).toBe('2026-04-07T08:00:00.000Z')
    expect(row.id).toBeLessThan(0)
  })

  it('recorta los espacios al principio y al final de la actividad', () => {
    const row = buildHourLogRow({ ...validValues, activity: '  trabajo  ' }, 7, new Date())
    expect(row.activity).toBe('trabajo')
  })
})

describe('buildHourLogOutboxOperation', () => {
  it('arma la operacion con los mismos datos del registro', () => {
    const row = buildHourLogRow(validValues, 7, new Date('2026-04-07T08:00:00.000Z'))
    const op = buildHourLogOutboxOperation(row)
    expect(op.entity).toBe('hourLog')
    expect(op.op).toBe('create')
    expect(op.baseVersion).toBeNull()
    expect(op.payload.placementId).toBe(7)
    expect(op.payload.hours).toBe(4)
    expect(op.payload.id).toBe(row.id)
  })
})

describe('useSubmitHourLog', () => {
  it('guarda la fila en db.hourLogs y encola la operacion en db.outbox', async () => {
    const { result } = renderHook(() => useSubmitHourLog(7))

    let outcome
    await act(async () => {
      outcome = await result.current.submit(validValues)
    })

    expect(outcome).toEqual({ success: true })
    const rows = await db.hourLogs.toArray()
    const outboxEntries = await db.outbox.toArray()
    expect(rows).toHaveLength(1)
    expect(rows[0].placementId).toBe(7)
    expect(outboxEntries).toHaveLength(1)
    expect(outboxEntries[0].entity).toBe('hourLog')
    expect(result.current.submitError).toBeNull()
  })

  it('no vuelve a guardar si ya existe un registro con la misma fecha, horario y actividad', async () => {
    const { result } = renderHook(() => useSubmitHourLog(7))

    await act(async () => {
      await result.current.submit(validValues)
    })
    await waitFor(() => expect(result.current.submitting).toBe(false))

    let outcome
    await act(async () => {
      outcome = await result.current.submit(validValues)
    })

    expect(outcome).toEqual({ success: false, duplicate: true })
    const rows = await db.hourLogs.toArray()
    expect(rows).toHaveLength(1)
    expect(result.current.submitError).toContain('Ya existe')
  })

  it('submitting pasa a true durante el envio y vuelve a false al terminar', async () => {
    const { result } = renderHook(() => useSubmitHourLog(7))
    expect(result.current.submitting).toBe(false)

    await act(async () => {
      await result.current.submit(validValues)
    })

    expect(result.current.submitting).toBe(false)
  })
})