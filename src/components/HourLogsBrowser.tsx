import { useMemo } from 'react'
import { HourLogsList } from '@/components/HourLogsList'
import { ListEmpty, ListToolbar, Pagination } from '@/components/ListControls'
import { EmptyState, Panel } from '@/components/Panel'
import { useListing } from '@/lib/useListing'
import type { LocalHourLog } from '@/offline/db'

export const HOUR_STATUS_OPTIONS = [
  { value: 'SUBMITTED', label: 'Enviada' },
  { value: 'APPROVED', label: 'Aprobada' },
  { value: 'REJECTED', label: 'Rechazada' },
  { value: 'DRAFT', label: 'Borrador' },
]

const monthFormatter = new Intl.DateTimeFormat('es-EC', { month: 'long', year: 'numeric' })

/** Meses (AAAA-MM) con registros, del más reciente al más antiguo. */
export function monthOptions(logs: LocalHourLog[]) {
  const months = Array.from(new Set(logs.map((log) => log.date.slice(0, 7)))).sort().reverse()
  return months.map((month) => {
    const [year, m] = month.split('-').map(Number)
    return { value: month, label: monthFormatter.format(new Date(year, m - 1, 1)) }
  })
}

export const hourLogFilters = {
  estado: (log: LocalHourLog, value: string) => log.status === value,
  mes: (log: LocalHourLog, value: string) => log.date.startsWith(value),
  sync: (log: LocalHourLog, value: string) => (value === 'pendiente' ? log.syncState !== 'synced' : log.syncState === 'synced'),
}

/**
 * Libro de horas con búsqueda, filtros y paginación. Los registros vienen de
 * Dexie, así que los filtros funcionan sin conexión. La primera página muestra lo más
 * reciente.
 */
export function HourLogsBrowser({ logs }: { logs: LocalHourLog[] }) {
  const newestFirst = useMemo(() => logs.slice().reverse(), [logs])
  const months = useMemo(() => monthOptions(logs), [logs])
  const listing = useListing(newestFirst, {
    searchText: (log) => log.activity,
    filters: hourLogFilters,
    pageSize: 20,
  })
  const pageItems = listing.pageItems ?? []

  return (
    <>
      {logs.length > 0 ? (
        <ListToolbar
          listing={listing}
          searchPlaceholder="Buscar en las actividades"
          filters={[
            { name: 'estado', label: 'Estado', options: HOUR_STATUS_OPTIONS },
            { name: 'mes', label: 'Mes', options: months },
            {
              name: 'sync',
              label: 'Sincronización',
              options: [
                { value: 'pendiente', label: 'Pendiente de enviar' },
                { value: 'sincronizado', label: 'Sincronizado' },
              ],
            },
          ]}
        />
      ) : null}

      <Panel>
        {pageItems.length === 0 ? (
          <ListEmpty listing={listing}>
            <EmptyState
              title="Todavía no has registrado horas"
              description="Puedes hacerlo sin conexión: se sincroniza cuando vuelva la señal."
            />
          </ListEmpty>
        ) : (
          <HourLogsList logs={pageItems} />
        )}
        <Pagination listing={listing} noun={['registro', 'registros']} />
      </Panel>
    </>
  )
}
