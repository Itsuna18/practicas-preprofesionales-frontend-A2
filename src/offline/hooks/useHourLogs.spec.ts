import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, type LocalHourLog } from '@/offline/db'
import { useHourLogs } from './useHourLogs'

function hourLog(overrides: Partial<LocalHourLog> = {}): LocalHourLog {
  return {
    id: 1,
    placementId: 7,
    date: '2026-04-01',
    startTime: '08:00',
    endTime: '12:00',
    hours: 4,
    activity: 'Soporte técnico',
    status: 'SUBMITTED',
    version: 1,
    updatedAt: '2026-04-01T12:00:00.000Z',
    syncState: 'synced',
    ...overrides,
  }
}

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('useHourLogs', () => {
  it('starts undefined while the query loads', () => {
    const { result } = renderHook(() => useHourLogs(7))
    expect(result.current).toBeUndefined()
  })

  it('returns an empty array when the placement has no logs', async () => {
    const { result } = renderHook(() => useHourLogs(7))
    await waitFor(() => expect(result.current).toEqual([]))
  })

  it('returns only that placement logs, sorted by date', async () => {
    await db.hourLogs.bulkPut([
      hourLog({ id: 1, date: '2026-04-03' }),
      hourLog({ id: 2, date: '2026-04-01' }),
      hourLog({ id: 3, placementId: 99, date: '2026-04-02' }),
    ])

    const { result } = renderHook(() => useHourLogs(7))
    await waitFor(() => expect(result.current?.map((l) => l.id)).toEqual([2, 1]))
  })

  it('reacts to writes made after mounting', async () => {
    const { result } = renderHook(() => useHourLogs(7))
    await waitFor(() => expect(result.current).toEqual([]))

    await act(async () => {
      await db.hourLogs.put(hourLog({ id: 10 }))
    })
    await waitFor(() => expect(result.current).toHaveLength(1))
    expect(result.current?.[0].id).toBe(10)
  })

  it('re-runs query when placementId changes', async () => {
    await db.hourLogs.bulkPut([
      hourLog({ id: 1, placementId: 7 }),
      hourLog({ id: 2, placementId: 8 }),
    ])

    const { result, rerender } = renderHook(({ id }) => useHourLogs(id), {
      initialProps: { id: 7 },
    })
    await waitFor(() => expect(result.current?.map((l) => l.id)).toEqual([1]))

    rerender({ id: 8 })
    await waitFor(() => expect(result.current?.map((l) => l.id)).toEqual([2]))
  })
})
