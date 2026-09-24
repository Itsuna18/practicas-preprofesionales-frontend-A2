export interface SyncStatus {
  online: boolean
  pending: number
  lastSyncAt: string | null
  syncing: boolean
}

type Listener = () => void

let state: SyncStatus = {
  online: navigator.onLine,
  pending: 0,
  lastSyncAt: null,
  syncing: false,
}

const listeners = new Set<Listener>()

// Coordina el estado entre pestañas del mismo origen. Cada setStatus() local
// se transmite a las demás pestañas, que lo aplican sin retransmitirlo, para
// no entrar en un eco infinito.
const channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('sync-status') : null

channel?.addEventListener('message', (event: MessageEvent<Partial<SyncStatus>>) => {
  applyPatch(event.data)
})

function applyPatch(patch: Partial<SyncStatus>): void {
  state = { ...state, ...patch }
  for (const listener of listeners) listener()
}

export function getStatus(): SyncStatus {
  return state
}

export function setStatus(patch: Partial<SyncStatus>): void {
  applyPatch(patch)
  channel?.postMessage(patch)
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}