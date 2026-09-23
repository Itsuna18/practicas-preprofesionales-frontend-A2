import { db } from '@/offline/db'
import { pullChanges } from './pull'
import { pushOutbox } from './push'
import { getStatus, setStatus } from './status'

const SYNC_INTERVAL_MS = 60_000
// Tope de rondas de pull por corrida: evita que un servidor que siempre
// responda hasMore:true cuelgue el scheduler en un bucle infinito.
const MAX_PULL_ROUNDS = 20

const MIN_BACKOFF_MS = 1000
const MAX_BACKOFF_MS = 32000

let currentSync: Promise<void> | null = null
let backoffMs = MIN_BACKOFF_MS
let retryTimerId: number | null = null
let intervalId: number | null = null

function clearRetryTimer() {
  if (retryTimerId !== null) {
    window.clearTimeout(retryTimerId)
    retryTimerId = null
  }
}

function hasSession(): boolean {
  return Boolean(localStorage.getItem('access_token'))
}


async function runSync(): Promise<void> {
  if (!hasSession()) return

  setStatus({ syncing: true })

  try {
    let pullError: unknown = null
    try {
      let hasMore = true
      let rounds = 0
      while (hasMore && rounds < MAX_PULL_ROUNDS) {
        const result = await pullChanges()
        hasMore = result.hasMore
        rounds += 1
      }
    } catch (err) {
      pullError = err
    }

    await pushOutbox()

    if (pullError) {
      throw pullError
    }

    const pending = await db.outbox.count()
    setStatus({ syncing: false, lastSyncAt: new Date().toISOString(), pending })

    backoffMs = MIN_BACKOFF_MS
  } catch (err) {
    console.error('sincronización falló', err)
    setStatus({ syncing: false })

    if (navigator.onLine) {
      clearRetryTimer()
      retryTimerId = window.setTimeout(() => {
        retryTimerId = null
        void syncNow()
      }, backoffMs)

      backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS)
    }
  }
}

/** Corre pull + push. Si ya hay una corrida en curso, la reutiliza en vez de duplicarla. */
export function syncNow(): Promise<void> {
  if (!currentSync) {
    if (getStatus().syncing) {
      // Otra pestaña ya está sincronizando, no dupliques el ciclo.
      return Promise.resolve()
    }
    currentSync = runSync().finally(() => {
      currentSync = null
    })
  }
  return currentSync
}

/**
 * Arranca el scheduler: sincroniza al montar, al recuperar conexión, y cada
 * 60s. Debe llamarse una sola vez (desde un useEffect en AppLayout) — llamar
 * en cada hook crearía un timer y un listener por cada consumidor.
 */
export function startSync(): () => void {
  void syncNow()

  const handleOnline = () => {
    setStatus({ online: true })
    clearRetryTimer()
    backoffMs = MIN_BACKOFF_MS
    void syncNow()
  }
  const handleOffline = () => {
    setStatus({ online: false })
    clearRetryTimer()
  }

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  intervalId = window.setInterval(() => {
    if (retryTimerId === null) {
      void syncNow()
    }
  }, SYNC_INTERVAL_MS)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
    if (intervalId !== null) window.clearInterval(intervalId)
    clearRetryTimer()
  }
}
