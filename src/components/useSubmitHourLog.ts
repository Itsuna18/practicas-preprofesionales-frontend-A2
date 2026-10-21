import { useCallback, useState } from 'react'
import { db, type LocalHourLog, type OutboxEntry } from '@/offline/db'
import { enqueue } from '@/offline/sync/push'
import type { HourLogFormValues } from './useHourLogForm'

// La forma del objeto que enqueue() recibe en src/offline/sync/push.ts
// (los campos id, clientOpId, createdAt, attempts y lastError los pone
// enqueue por su cuenta).
export type HourLogOutboxInput = Omit<
  OutboxEntry,
  'id' | 'clientOpId' | 'createdAt' | 'attempts' | 'lastError'
>

export interface SubmitHourLogResult {
  success: boolean
  duplicate?: boolean
}

function normalizeInputDate(date: string): string {
  return date.slice(0, 10)
}

function normalizeActivity(activity: string): string {
  return activity.toLowerCase().replace(/\s+/g, '')
}

// Pura: construye el registro local que se guarda en db.hourLogs. El id es
// negativo para no chocar con los ids positivos que asigna el servidor; el
// cliente lo reemplaza cuando sync aplica la respuesta real.
export function buildHourLogRow(
  values: HourLogFormValues,
  placementId: number,
  now: Date = new Date(),
): LocalHourLog {
  return {
    id: -now.getTime(),
    placementId,
    date: values.date,
    startTime: values.startTime,
    endTime: values.endTime,
    hours: Number(values.hours),
    activity: values.activity.trim(),
    status: 'SUBMITTED',
    reviewNote: null,
    version: 1,
    updatedAt: now.toISOString(),
    syncState: 'local',
  }
}

// Pura: a partir de la fila local, arma la operación que enqueue() necesita.
export function buildHourLogOutboxOperation(row: LocalHourLog): HourLogOutboxInput {
  return {
    entity: 'hourLog',
    op: 'create',
    payload: {
      id: row.id,
      placementId: row.placementId,
      date: row.date,
      startTime: row.startTime,
      endTime: row.endTime,
      hours: row.hours,
      activity: row.activity,
      status: row.status,
      reviewNote: row.reviewNote,
      version: row.version,
      updatedAt: row.updatedAt,
    },
    baseVersion: null,
  }
}

// Busca si ya existe un registro con la misma fecha, horario y actividad.
export async function findDuplicateHourLog(
  values: HourLogFormValues,
  placementId: number,
): Promise<LocalHourLog | undefined> {
  const normDate = normalizeInputDate(values.date)
  const normActivity = normalizeActivity(values.activity.trim())

  return db.hourLogs
    .where('placementId')
    .equals(placementId)
    .filter((log) => {
      const logDate = String(log.date || '').slice(0, 10)
      const logActivity = String(log.activity || '').toLowerCase().replace(/\s+/g, '')
      const sameDay = logDate === normDate
      const sameTime = log.startTime === values.startTime && log.endTime === values.endTime
      const sameActivity = logActivity === normActivity
      return sameDay && sameTime && sameActivity
    })
    .first()
}

// Hook de persistencia: escribe el registro en db.hourLogs y encola la
// operación en el outbox, dentro de una misma transacción. Devuelve el
// estado de envío para que el componente visual lo refleje.
export function useSubmitHourLog(placementId: number) {
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const submit = useCallback(
    async (values: HourLogFormValues): Promise<SubmitHourLogResult> => {
      setSubmitError(null)
      setSubmitting(true)

      try {
        const existingDuplicate = await findDuplicateHourLog(values, placementId)
        if (existingDuplicate) {
          setSubmitError(
            'Ya existe un registro de horas en esa misma fecha con el mismo horario o actividad.',
          )
          return { success: false, duplicate: true }
        }

        const row = buildHourLogRow(values, placementId)
        const operation = buildHourLogOutboxOperation(row)

        await db.transaction('rw', [db.hourLogs, db.outbox], async () => {
          await db.hourLogs.add(row)
          await enqueue(operation)
        })

        return { success: true }
      } catch {
        setSubmitError('No se pudo guardar el registro en este dispositivo. Intenta de nuevo.')
        return { success: false }
      } finally {
        setSubmitting(false)
      }
    },
    [placementId],
  )

  return { submitting, submitError, submit, setSubmitError }
}