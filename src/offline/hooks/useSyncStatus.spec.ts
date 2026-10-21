import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { setStatus } from '@/offline/sync/status'
import { useSyncStatus } from './useSyncStatus'

beforeEach(() => {
  setStatus({
    online: true,
    pending: 0,
    lastSyncAt: null,
    syncing: false,
  })
})

describe('useSyncStatus', () => {
  it('returns the current synchronization status on mount', () => {
    const { result } = renderHook(() => useSyncStatus())
    expect(result.current).toEqual({
      online: true,
      pending: 0,
      lastSyncAt: null,
      syncing: false,
    })
  })

  it('updates when synchronization status changes via setStatus', () => {
    const { result } = renderHook(() => useSyncStatus())

    act(() => {
      setStatus({ syncing: true, pending: 3 })
    })
    expect(result.current.syncing).toBe(true)
    expect(result.current.pending).toBe(3)

    act(() => {
      setStatus({
        syncing: false,
        pending: 0,
        lastSyncAt: '2026-04-01T15:00:00.000Z',
      })
    })
    expect(result.current).toEqual({
      online: true,
      pending: 0,
      lastSyncAt: '2026-04-01T15:00:00.000Z',
      syncing: false,
    })
  })
})
