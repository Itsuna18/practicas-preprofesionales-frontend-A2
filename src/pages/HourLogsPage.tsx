import { useMemo, useState } from 'react'
import { HourLogForm } from '@/components/HourLogForm'
import { HourLogsBrowser } from '@/components/HourLogsBrowser'
import { HoursProgressPanel } from '@/components/HoursProgressPanel'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState, LoadingState } from '@/components/Panel'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { type HoursSummary, summarizeHours } from '@/lib/hours'
import { useHourLogs } from '@/offline/hooks/useHourLogs'
import { usePlacement } from '@/offline/hooks/usePlacement'

function submittedNote(hours: HoursSummary) {
  if (hours.submittedHours <= 0) return null
  return <span className="text-pending"> · {hours.submittedHours.toFixed(1)} sin aprobar</span>
}

function NewHourLogDialog({ placementId }: { placementId: number }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button">Registrar horas</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar horas</DialogTitle>
          <DialogDescription>
            Se guardan en este dispositivo y se sincronizan cuando haya conexión
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <HourLogForm placementId={placementId} onSaved={() => setOpen(false)} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}

export function HourLogsPage() {
  const placement = usePlacement()
  const logs = useHourLogs(placement?.id ?? -1)
  // Los totales solo cambian cuando cambian los registros o las horas
  // requeridas: no se recalculan en cada render (E6-05).
  const requiredHours = placement?.requiredHours ?? 0
  const hours = useMemo(() => summarizeHours(logs, requiredHours), [logs, requiredHours])

  if (placement === undefined) {
    return <LoadingState>Cargando tu práctica…</LoadingState>
  }

  if (placement === null) {
    return (
      <EmptyState
        title="No tienes una práctica activa todavía"
        description="Cuando la coordinación active tu plaza, vas a poder registrar horas."
      />
    )
  }

  if (logs === undefined) {
    return <LoadingState>Cargando registros de horas…</LoadingState>
  }

  return (
    <>
      <PageHeader
        title="Libro de horas"
        subtitle="Todo lo que registraste este período. Se guarda en este dispositivo aunque no haya señal."
        actions={<NewHourLogDialog placementId={placement.id} />}
      />

      <HoursProgressPanel hours={hours} note={submittedNote(hours)} />

      <HourLogsBrowser logs={logs} />
    </>
  )
}
