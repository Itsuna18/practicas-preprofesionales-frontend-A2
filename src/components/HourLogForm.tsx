import { type FormEvent } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useHourLogForm } from './useHourLogForm'
import { useSubmitHourLog } from './useSubmitHourLog'

interface HourLogFormProps {
  placementId: number
  onSaved?: () => void
}

// Pequeño helper visual: evita repetir el mismo <p role="alert"> cinco veces
// y mantiene la complejidad del componente principal baja.
function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="text-12 text-void">
      {message}
    </p>
  )
}

export function HourLogForm({ placementId, onSaved }: HourLogFormProps) {
  const form = useHourLogForm()
  const { submitting, submitError, submit } = useSubmitHourLog(placementId)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const nextErrors = form.validate()
    if (Object.keys(nextErrors).length > 0) return
    const result = await submit(form.values)
    if (result.success) {
      form.reset()
      onSaved?.()
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
        <FieldError id="hourlog-date-error" message={errors.date} />
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
          <FieldError id="hourlog-start-error" message={errors.startTime} />
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
          <FieldError id="hourlog-end-error" message={errors.endTime} />
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
        <FieldError id="hourlog-hours-error" message={errors.hours} />
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
        <FieldError id="hourlog-activity-error" message={errors.activity} />
      </div>
      {submitError ? (
        <p role="alert" className="text-14 text-void">{submitError}</p>
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