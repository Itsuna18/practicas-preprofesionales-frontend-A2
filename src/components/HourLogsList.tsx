import { memo } from 'react'
import { EmptyState } from '@/components/Panel'
import { StatusBadge } from '@/components/StatusBadge'
import { Ledger, LedgerHeaderRow } from '@/components/ledger/Ledger'
import { LedgerRow } from '@/components/ledger/LedgerRow'
import { parseLocalDate } from '@/lib/date'
import type { LocalHourLog } from '@/offline/db'

// Un solo formateador para todas las filas: crear un Intl.DateTimeFormat por
// fila costaba ~26 ms por render con 500 registros (medido en E6-05).
const dateFormatter = new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short', year: 'numeric' })

export function formatDate(dateValue: string): string {
  const parsed = parseLocalDate(dateValue)
  if (Number.isNaN(parsed.getTime())) return dateValue
  return dateFormatter.format(parsed)
}

// Fuera de pantalla el navegador se salta el layout y el pintado de la fila.
// El tamaño estimado (alto real medido: ~145 px en teléfono, 58 px en
// escritorio) evita que la barra de desplazamiento salte; `auto` recuerda el
// alto real una vez pintada.
const offscreenRowClass =
  '[content-visibility:auto] [contain-intrinsic-size:auto_145px] sm:[contain-intrinsic-size:auto_58px]'

/**
 * useLiveQuery devuelve objetos nuevos en cada cambio de la tabla, así que la
 * igualdad por referencia no sirve: se comparan los campos que la fila pinta.
 */
export function sameVisibleHourLog(a: LocalHourLog, b: LocalHourLog): boolean {
  return (
    a.id === b.id &&
    a.date === b.date &&
    a.startTime === b.startTime &&
    a.endTime === b.endTime &&
    a.hours === b.hours &&
    a.activity === b.activity &&
    a.status === b.status &&
    a.reviewNote === b.reviewNote &&
    a.syncState === b.syncState
  )
}

const HourLogRow = memo(
  function HourLogRow({ log }: { log: LocalHourLog }) {
    return (
      <LedgerRow syncState={log.syncState} className={offscreenRowClass}>
        <span className="font-data text-14 text-ink sm:w-28">{formatDate(log.date)}</span>
        <span className="font-data text-13 text-inkSoft sm:w-28">
          {log.startTime}–{log.endTime}
        </span>
        <span className="font-data text-14 text-ink sm:w-14">{log.hours}</span>
        <div className="flex flex-1 flex-col">
          <span className="text-14 text-inkBody">{log.activity}</span>
          {log.syncState === 'failed' && log.reviewNote ? (
            <span className="text-12 font-medium text-void">Edición rechazada: {log.reviewNote}</span>
          ) : null}
        </div>
        <span className="sm:w-32 sm:text-right">
          <StatusBadge status={log.status} />
        </span>
      </LedgerRow>
    )
  },
  (prev, next) => sameVisibleHourLog(prev.log, next.log),
)

function LedgerColumnHeader() {
  return (
    <LedgerHeaderRow>
      <span className="w-28">Fecha</span>
      <span className="w-28">Horario</span>
      <span className="w-14">Horas</span>
      <span className="flex-1">Actividad</span>
      <span className="w-32 text-right">Estado</span>
    </LedgerHeaderRow>
  )
}

/** Libro de horas en el orden recibido: la página decide el orden y la paginación. */
export function HourLogsList({ logs }: { logs: LocalHourLog[] }) {

  if (logs.length === 0) {
    return (
      <EmptyState
        title="Todavía no has registrado horas"
        description="Puedes hacerlo sin conexión: se sincroniza cuando vuelva la señal."
      />
    )
  }

  return (
    <Ledger header={<LedgerColumnHeader />}>
      {logs.map((log) => (
        <HourLogRow key={log.id} log={log} />
      ))}
    </Ledger>
  )
}
