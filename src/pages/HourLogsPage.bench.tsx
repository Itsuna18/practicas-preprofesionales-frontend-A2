// Medición de E6-05: costo de render del libro de horas con 500 registros.
// Ejecutar con: pnpm bench
// Mide el trabajo de React (jsdom no hace layout ni pintado): el desplazamiento
// se mide aparte en el navegador.
import { MemoryRouter } from 'react-router-dom'
import { act, cleanup, render } from '@testing-library/react'
import { afterAll, bench, describe, vi } from 'vitest'
import type { LocalHourLog, LocalPlacement } from '@/offline/db'
import { HourLogsPage } from './HourLogsPage'

const placement = { id: 1, requiredHours: 240 } as LocalPlacement

function makeLogs(count: number): LocalHourLog[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    placementId: 1,
    date: `2026-0${1 + (i % 6)}-${String(1 + (i % 28)).padStart(2, '0')}`,
    startTime: '08:00',
    endTime: '12:00',
    hours: 4,
    activity: `Actividad ${i}: soporte y desarrollo`,
    status: i % 3 ? 'APPROVED' : 'SUBMITTED',
    version: 1,
    updatedAt: '2026-07-01T12:00:00.000Z',
    syncState: 'synced',
  }))
}

let currentLogs = makeLogs(500)

vi.mock('@/offline/hooks/usePlacement', () => ({ usePlacement: () => placement }))
vi.mock('@/offline/hooks/useHourLogs', () => ({ useHourLogs: () => currentLogs }))
vi.mock('@/components/HourLogForm', () => ({ HourLogForm: () => null }))

afterAll(() => cleanup())

describe('libro de horas con 500 registros', () => {
  bench('montar la página', () => {
    currentLogs = makeLogs(500)
    const { unmount } = render(<HourLogsPage />, { wrapper: MemoryRouter })
    unmount()
  }, { time: 3000 })

  // useLiveQuery entrega objetos nuevos en cada cambio de la tabla: se simula
  // clonando los 500 registros y añadiendo uno nuevo, como al registrar horas.
  const base = makeLogs(500)
  let view: Pick<ReturnType<typeof render>, 'rerender' | 'unmount'> | undefined
  let next = 10_000
  bench(
    'registrar una hora con la página abierta',
    () => {
      currentLogs = [...base.map((log) => ({ ...log })), { ...base[0], id: next++ }]
      act(() => view?.rerender(<HourLogsPage />))
    },
    {
      setup: () => {
        currentLogs = base
        view = render(<HourLogsPage />, { wrapper: MemoryRouter })
      },
      teardown: () => view?.unmount(),
      time: 3000,
    },
  )
})
