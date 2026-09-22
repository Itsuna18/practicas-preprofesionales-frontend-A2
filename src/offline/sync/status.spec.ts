import { describe, expect, it, vi } from 'vitest'
import { getStatus, setStatus, subscribe } from './status'

describe('sync status store', () => {
  it('merges a partial patch into the current status', () => {
    setStatus({ pending: 3 })
    expect(getStatus()).toMatchObject({ pending: 3 })

    setStatus({ syncing: true })
    expect(getStatus()).toMatchObject({ pending: 3, syncing: true })
  })

  it('notifies subscribers on every update and stops after unsubscribing', () => {
    const listener = vi.fn()
    const unsubscribe = subscribe(listener)

    setStatus({ online: false })
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    setStatus({ online: true })
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('transmite los cambios de estado a otras pestañas por BroadcastChannel', async () => {
    const remoteChannel = new BroadcastChannel('sync-status')
    const received = new Promise((resolve) => {
      remoteChannel.onmessage = (event) => resolve(event.data)
    })

    setStatus({ pending: 7 })

    await expect(received).resolves.toMatchObject({ pending: 7 })
    remoteChannel.close()
  })

})
