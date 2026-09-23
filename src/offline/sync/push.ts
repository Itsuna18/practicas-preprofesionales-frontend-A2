import { api } from '@/api/client'
import { db, type OutboxEntry } from '@/offline/db'
import { applyResults, type SyncOperationResult } from './conflict'
import { setStatus } from './status'

export async function enqueue(
  op: Omit<OutboxEntry, 'id' | 'clientOpId' | 'createdAt' | 'attempts' | 'lastError'>,
): Promise<void> {
  const entry: OutboxEntry = {
    ...op,
    clientOpId: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    attempts: 0,
    lastError: null,
  }

  await db.transaction('rw', [db.outbox, db.hourLogs], async () => {
    await db.outbox.add(entry)
    const rowId = entry.payload.id
    if (typeof rowId === 'number') {
      await db.hourLogs.update(rowId, { syncState: 'queued' })
    }
  })

  // Sin esto, el contador "N pendientes" solo se recalcula tras un push
  // exitoso (scheduler.ts:34) y jamás refleja lo que se acaba de encolar
  // mientras no hay conexión.
  setStatus({ pending: await db.outbox.count() })
}

const MAX_RETRIES = 5

async function handleExhaustedEntries(exhausted: OutboxEntry[]): Promise<void> {
  if (exhausted.length === 0) return

  await db.transaction('rw', [db.outbox, db.hourLogs], async () => {
    for (const e of exhausted) {
      const rowId = e.payload.id
      if (typeof rowId === 'number') {
        await db.hourLogs.update(rowId, {
          syncState: 'failed',
          reviewNote: e.lastError || 'Máximo de reintentos alcanzado',
        })
      }
    }
    await db.outbox.bulkDelete(exhausted.map((e) => e.id as number))
  })
}

export async function pushOutbox(): Promise<{ applied: number; failed: number }> {
  const allEntries = await db.outbox.orderBy('createdAt').limit(500).toArray()
  if (allEntries.length === 0) return { applied: 0, failed: 0 }

  const validEntries = allEntries.filter((e) => e.attempts < MAX_RETRIES)
  const exhaustedEntries = allEntries.filter((e) => e.attempts >= MAX_RETRIES)

  await handleExhaustedEntries(exhaustedEntries)

  if (validEntries.length === 0) return { applied: 0, failed: 0 }

  const ops = validEntries.map((e) => ({
    clientOpId: e.clientOpId,
    entity: e.entity,
    op: e.op,
    baseVersion: e.baseVersion,
    payload: e.payload,
  }))

  const localIds = new Map(validEntries.map((e) => [e.clientOpId, Number(e.payload.id)]))
  const entryIdByClientOpId = new Map(validEntries.map((e) => [e.clientOpId, e.id as number]))

  try {
    const { results } = await api<{ results: SyncOperationResult[] }>('/sync/push', {
      method: 'POST',
      body: JSON.stringify({ ops }),
    })

    await applyResults(results, localIds)

    const idsToDelete: number[] = []
    for (const result of results) {
      const outboxId = entryIdByClientOpId.get(result.clientOpId)
      if (outboxId != null) {
        idsToDelete.push(outboxId)
      }
    }

    if (idsToDelete.length > 0) {
      await db.outbox.bulkDelete(idsToDelete)
    }

    return {
      applied: results.filter((r) => r.status === 'applied').length,
      failed: results.filter((r) => r.status !== 'applied').length,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const retryEntries = validEntries.map((e) => ({
      ...e,
      attempts: (e.attempts || 0) + 1,
      lastError: errorMessage,
    }))

    await db.outbox.bulkPut(retryEntries)
    throw error
  }
}
