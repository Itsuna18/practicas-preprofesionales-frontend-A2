import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api } from '@/api/client'
import { db } from '@/offline/db'
import { enqueue, pushOutbox } from './push'

vi.mock('@/api/client', () => ({ api: vi.fn() }))

const mockedApi = vi.mocked(api)

beforeEach(async () => {
  await db.delete()
  await db.open()
  mockedApi.mockReset()
})

describe('enqueue', () => {
  it('adds an outbox entry and marks the local hour log as queued', async () => {
    await db.hourLogs.put({
      id: 9,
      placementId: 1,
      date: '2026-04-01',
      startTime: '08:00',
      endTime: '12:00',
      hours: 4,
      activity: 'Soporte',
      status: 'SUBMITTED',
      version: 1,
      updatedAt: '2026-04-01T00:00:00.000Z',
      syncState: 'local',
    })

    await enqueue({
      entity: 'hourLog',
      op: 'create',
      payload: { id: 9, hours: 4 },
      baseVersion: null,
    })

    await expect(db.outbox.count()).resolves.toBe(1)
    await expect(db.hourLogs.get(9)).resolves.toMatchObject({ syncState: 'queued' })
  })
})

describe('pushOutbox', () => {
  it('no llama a la red cuando el outbox está vacío', async () => {
    const result = await pushOutbox()

    expect(result).toEqual({ applied: 0, failed: 0 })
    expect(api).not.toHaveBeenCalled()
  })

  it('envía las operaciones en cola, vacía el outbox y aplica los resultados', async () => {
    await db.hourLogs.put({
      id: 10,
      placementId: 1,
      date: '2026-04-01',
      startTime: '08:00',
      endTime: '12:00',
      hours: 4,
      activity: 'Soporte',
      status: 'SUBMITTED',
      version: 1,
      updatedAt: '2026-04-01T00:00:00.000Z',
      syncState: 'local',
    })
    await enqueue({
      entity: 'hourLog',
      op: 'create',
      payload: { id: 10, hours: 4 },
      baseVersion: null,
    })
    const [entry] = await db.outbox.toArray()

    mockedApi.mockResolvedValue({
      results: [{ clientOpId: entry.clientOpId, status: 'applied', server: { id: 10, version: 2 }, reason: null }],
    })

    const result = await pushOutbox()

    expect(result).toEqual({ applied: 1, failed: 0 })
    await expect(db.outbox.count()).resolves.toBe(0)
    await expect(db.hourLogs.get(10)).resolves.toMatchObject({ syncState: 'synced', version: 2 })
  })

  it('E1-01 (Spike): demuestra la pérdida de horas cuando la red falla a mitad del envío', async () => {
    await db.hourLogs.put({
      id: 11,
      placementId: 1,
      date: '2026-04-01',
      startTime: '08:00',
      endTime: '12:00',
      hours: 4,
      activity: 'Prácticas de campo',
      status: 'SUBMITTED',
      version: 1,
      updatedAt: '2026-04-01T00:00:00.000Z',
      syncState: 'local',
    })
    await enqueue({
      entity: 'hourLog',
      op: 'create',
      payload: { id: 11, hours: 4 },
      baseVersion: null,
    })

    mockedApi.mockRejectedValue(new Error('Network error / Failed to fetch'))

    await expect(pushOutbox()).rejects.toThrow('Network error / Failed to fetch')

    // Con el bug actual, pushOutbox borró el outbox antes de enviar a la red,
    // por lo que count() devuelve 0 y esta expectativa falla como se pide en el Spike.
    const remainingOutbox = await db.outbox.count()
    expect(remainingOutbox).toBe(1)
  })

  it('E1-02: las operaciones rechazadas por el servidor quedan marcadas con su motivo y no se pierden en silencio', async () => {
    await db.hourLogs.put({
      id: 12,
      placementId: 1,
      date: '2026-04-01',
      startTime: '08:00',
      endTime: '12:00',
      hours: 4,
      activity: 'Desarrollo',
      status: 'SUBMITTED',
      version: 1,
      updatedAt: '2026-04-01T00:00:00.000Z',
      syncState: 'local',
    })
    await enqueue({
      entity: 'hourLog',
      op: 'create',
      payload: { id: 12, hours: 4 },
      baseVersion: null,
    })
    const [entry] = await db.outbox.toArray()

    mockedApi.mockResolvedValue({
      results: [{ clientOpId: entry.clientOpId, status: 'rejected', server: { id: 12 }, reason: 'Hora ya evaluada por el tutor' }],
    })

    const result = await pushOutbox()

    expect(result).toEqual({ applied: 0, failed: 1 })
    await expect(db.outbox.count()).resolves.toBe(0)
    await expect(db.hourLogs.get(12)).resolves.toMatchObject({
      syncState: 'failed',
      reviewNote: 'Hora ya evaluada por el tutor',
    })
  })

  it('E1-02: reintenta las operaciones fallidas en la siguiente sincronización exitosa', async () => {
    await db.hourLogs.put({
      id: 13,
      placementId: 1,
      date: '2026-04-01',
      startTime: '08:00',
      endTime: '12:00',
      hours: 4,
      activity: 'Testing',
      status: 'SUBMITTED',
      version: 1,
      updatedAt: '2026-04-01T00:00:00.000Z',
      syncState: 'local',
    })
    await enqueue({
      entity: 'hourLog',
      op: 'create',
      payload: { id: 13, hours: 4 },
      baseVersion: null,
    })

    // 1er intento falla por corte de red
    mockedApi.mockRejectedValueOnce(new Error('Network error'))
    await expect(pushOutbox()).rejects.toThrow('Network error')
    expect(await db.outbox.count()).toBe(1)
    const [entryAfterFail] = await db.outbox.toArray()
    expect(entryAfterFail.attempts).toBe(1)
    expect(entryAfterFail.lastError).toBe('Network error')

    // 2do intento: la red se recupera y el servidor confirma la operación
    mockedApi.mockResolvedValueOnce({
      results: [{ clientOpId: entryAfterFail.clientOpId, status: 'applied', server: { id: 13, version: 2 }, reason: null }],
    })

    const result = await pushOutbox()
    expect(result).toEqual({ applied: 1, failed: 0 })
    expect(await db.outbox.count()).toBe(0)
    await expect(db.hourLogs.get(13)).resolves.toMatchObject({ syncState: 'synced', version: 2 })
  })
})

