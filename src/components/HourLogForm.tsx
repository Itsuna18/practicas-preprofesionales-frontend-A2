import { type FormEvent, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { db, type LocalHourLog } from '@/offline/db'
import { enqueue } from '@/offline/sync/push'
import { useHourLogForm } from './useHourLogForm'

interface HourLogFormProps {
  placementId: number
  onSaved?: () => void
}

export function HourLogForm({ placementId, onSaved }: HourLogFormProps) {
  const form = useHourLogForm()
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitError(null)

    const nextErrors = form.validate()
    if (Object.keys(nextErrors).length > 0) {
      return
    }

    setSubmitting(true)

    const { date, startTime, endTime, hours, activity } = form.values
    const normInputDate = date.slice(0, 10)
    const trimmedActivity = activity.trim()
    const normInputActivity = trimmedActivity.toLowerCase().replace(/\s+/g, '')

    const existingDuplicate = await db.hourLogs
      .where('placementId')
      .equals(placementId)
      .filter((log) => {
        const logDate = String(log.date || '').slice(0, 10)
        const logActivity = String(log.activity || '').toLowerCase().replace(/\s+/g, '')
        const sameDay = logDate === normInputDate
        const sameTime = log.startTime === startTime && log.endTime === endTime
        const sameActivity = logActivity === normInputActivity
        return sameDay && sameTime && sameActivity
      })
      .first()

    if (existingDuplicate) {
      setSubmitError('Ya existe un registro de horas en esa misma fecha con el mismo horario o actividad.')
      setSubmitting(false)
      return
    }

    const localId = -Date.now()
    const nowIso = new Date().toISOString()
    const hoursValue = Number(hours)

    const row: LocalHourLog = {
      id: localId,
      placementId,
      date,
      startTime,
      endTime,
      hours: hoursValue,
      activity: trimmedActivity,
      status: 'SUBMITTED',
      reviewNote: null,
      version: 1,
      updatedAt: nowIso,
      syncState: 'local',
    }

    try {
      await db.transaction('rw', [db.hourLogs, db.outbox], async () => {
        await db.hourLogs.add(row)
        await enqueue({
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
        })
      })

      form.reset()
      onSaved?.()
    } catch {
      setSubmitError('No se pudo guardar el registro en este dispositivo. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const { values, errors, setField, confirmationLabel, durationLabel, liveHoursWarning } = form

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="hourlog-date">Fecha</Label>
        <Input
          id="hourlog-date"
          type="date"
          value={values.date}
          onChange={(event) => setField('date', event.target.value)}
          aria-invalid={Boolean(errors.date)}
          aria-describedby={errors.date ? 'hourlog-date-error' : undefined}
          className="font-data"
        />
        {confirmationLabel ? (
          <p className="font-data text-12 text-inkSoft">{confirmationLabel}</p>
        ) : null}
        {errors.date ? (
          <p id="hourlog-date-error" role="alert" className="text-12 text-void">
            {errors.date}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hourlog-start">Hora de inicio</Label>
          <Input
            id="hourlog-start"
            type="time"
            value={values.startTime}
            onChange={(event) => setField('startTime', event.target.value)}
            aria-invalid={Boolean(errors.startTime)}
            aria-describedby={errors.startTime ? 'hourlog-start-error' : undefined}
            className="font-data"
          />
          {errors.startTime ? (
            <p id="hourlog-start-error" role="alert" className="text-12 text-void">
              {errors.startTime}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="hourlog-end">Hora de fin</Label>
          <Input
            id="hourlog-end"
            type="time"
            value={values.endTime}
            onChange={(event) => setField('endTime', event.target.value)}
            aria-invalid={Boolean(errors.endTime)}
            aria-describedby={errors.endTime ? 'hourlog-end-error' : undefined}
            className="font-data"
          />
          {errors.endTime ? (
            <p id="hourlog-end-error" role="alert" className="text-12 text-void">
              {errors.endTime}
            </p>
          ) : null}
        </div>
      </div>

      {durationLabel ? (
        <p className="-mt-2 font-data text-12 text-inkSoft">{durationLabel}</p>
      ) : null}

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="hourlog-hours">Horas</Label>
        <Input
          id="hourlog-hours"
          type="number"
          inputMode="decimal"
          step="0.5"
          value={values.hours}
          onChange={(event) => setField('hours', event.target.value)}
          aria-invalid={Boolean(errors.hours)}
          aria-describedby={errors.hours ? 'hourlog-hours-error' : undefined}
          className="font-data tabular-nums"
        />
        {liveHoursWarning && !errors.hours ? (
          <p className="text-12 text-pending">{liveHoursWarning}</p>
        ) : null}
        {errors.hours ? (
          <p id="hourlog-hours-error" role="alert" className="text-12 text-void">
            {errors.hours}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="hourlog-activity">Actividad</Label>
        <Textarea
          id="hourlog-activity"
          value={values.activity}
          onChange={(event) => setField('activity', event.target.value)}
          aria-invalid={Boolean(errors.activity)}
          aria-describedby={errors.activity ? 'hourlog-activity-error' : undefined}
          rows={3}
          placeholder="Qué hiciste durante este bloque de horas"
        />
        {errors.activity ? (
          <p id="hourlog-activity-error" role="alert" className="text-12 text-void">
            {errors.activity}
          </p>
        ) : null}
      </div>

      {submitError ? (
        <p role="alert" className="text-14 text-void">
          {submitError}
        </p>
      ) : null}

      <p className="text-12 text-inkSoft">
        Se guarda en este dispositivo aunque no tengas conexión. Se sincroniza solo cuando vuelvas a estar en línea
      </p>

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Guardando…' : 'Guardar horas'}
      </Button>
    </form>
  )
}