import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as hoursModule from '@/lib/hours'
import type { LocalHourLog, LocalPlacement } from '@/offline/db'
import { HourLogsPage } from './HourLogsPage'

let placement: LocalPlacement | null | undefined
let logs: LocalHourLog[] | undefined

vi.mock('@/offline/hooks/usePlacement', () => ({ usePlacement: () => placement }))
vi.mock('@/offline/hooks/useHourLogs', () => ({ useHourLogs: () => logs }))
vi.mock('@/components/HourLogForm', () => ({ HourLogForm: () => null }))
vi.mock('@/lib/hours', async (importOriginal) => {
  const original = await importOriginal<typeof import('@/lib/hours')>()
  return { ...original, summarizeHours: vi.fn(original.summarizeHours) }
})

function hourLog(id: number, overrides: Partial<LocalHourLog> = {}): LocalHourLog {
  return {
    id, placementId: 1, date: '2026-04-01', startTime: '08:00', endTime: '12:00',
    hours: 4, activity: `Actividad ${id}`, status: 'APPROVED', version: 1,
    updatedAt: '2026-04-01T12:00:00.000Z', syncState: 'synced',
    ...overrides,
  }
}

const summarizeHours = vi.mocked(hoursModule.summarizeHours)

beforeEach(() => {
  placement = { id: 1, requiredHours: 240 } as LocalPlacement
  logs = [hourLog(1), hourLog(2, { status: 'SUBMITTED' })]
  summarizeHours.mockClear()
})

describe('HourLogsPage', () => {
  it('shows the totals and every log', () => {
    render(<HourLogsPage />)
    expect(screen.getByText('2 registros')).toBeInTheDocument()
    expect(screen.getByText('Actividad 1')).toBeInTheDocument()
    expect(screen.getByText('Actividad 2')).toBeInTheDocument()
    expect(screen.getByText(/4\.0 sin aprobar/)).toBeInTheDocument()
  })

  it('does not recompute the totals when it re-renders with the same logs', () => {
    const { rerender } = render(<HourLogsPage />)
    const calls = summarizeHours.mock.calls.length

    rerender(<HourLogsPage />)
    rerender(<HourLogsPage />)

    expect(summarizeHours.mock.calls.length).toBe(calls)
  })

  it('recomputes the totals when the logs change', () => {
    const { rerender } = render(<HourLogsPage />)
    const calls = summarizeHours.mock.calls.length

    logs = [...(logs ?? []), hourLog(3)]
    rerender(<HourLogsPage />)

    expect(summarizeHours.mock.calls.length).toBe(calls + 1)
    expect(screen.getByText('3 registros')).toBeInTheDocument()
  })

  it('shows the loading and empty states', () => {
    placement = undefined
    const { rerender } = render(<HourLogsPage />)
    expect(screen.getByText('Cargando tu práctica…')).toBeInTheDocument()

    placement = null
    rerender(<HourLogsPage />)
    expect(screen.getByText('No tienes una práctica activa todavía')).toBeInTheDocument()

    placement = { id: 1, requiredHours: 240 } as LocalPlacement
    logs = undefined
    rerender(<HourLogsPage />)
    expect(screen.getByText('Cargando registros de horas…')).toBeInTheDocument()
  })
})
