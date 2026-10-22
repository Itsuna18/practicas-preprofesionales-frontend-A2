import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { LocalHourLog } from '@/offline/db'
import { HourLogsList, formatDate, sameVisibleHourLog } from './HourLogsList'

function hourLog(overrides: Partial<LocalHourLog> = {}): LocalHourLog {
  return {
    id: 1, placementId: 7, date: '2026-04-01', startTime: '08:00', endTime: '12:00',
    hours: 4, activity: 'Soporte', status: 'SUBMITTED', version: 1,
    updatedAt: '2026-04-01T12:00:00.000Z', syncState: 'synced',
    ...overrides,
  }
}

describe('formatDate', () => {
  it('formats a calendar date without timezone shift', () => {
    expect(formatDate('2026-04-01')).toMatch(/01.*abr.*2026/)
  })

  it('returns the raw value when the date is invalid', () => {
    expect(formatDate('no-es-fecha')).toBe('no-es-fecha')
  })
})

describe('HourLogsList', () => {
  it('shows the empty state when there are no logs', () => {
    render(<HourLogsList logs={[]} />)
    expect(screen.getByText('Todavía no has registrado horas')).toBeInTheDocument()
  })

  it('keeps the order it receives', () => {
    render(
      <HourLogsList
        logs={[
          hourLog({ id: 2, date: '2026-04-02', activity: 'Segunda' }),
          hourLog({ id: 1, date: '2026-04-01', activity: 'Primera' }),
        ]}
      />,
    )
    const activities = screen.getAllByText(/Primera|Segunda/).map((el) => el.textContent)
    expect(activities).toEqual(['Segunda', 'Primera'])
  })

  it('keeps the sync gutter of each row', () => {
    render(<HourLogsList logs={[hourLog({ syncState: 'queued' })]} />)
    expect(screen.getByRole('img', { name: 'En cola' })).toBeInTheDocument()
  })

  it('shows the review note only for rejected offline edits', () => {
    const { rerender } = render(
      <HourLogsList logs={[hourLog({ syncState: 'failed', reviewNote: 'Ya fue aprobada' })]} />,
    )
    expect(screen.getByText('Edición rechazada: Ya fue aprobada')).toBeInTheDocument()

    rerender(<HourLogsList logs={[hourLog({ syncState: 'synced', reviewNote: 'Ya fue aprobada' })]} />)
    expect(screen.queryByText(/Edición rechazada/)).not.toBeInTheDocument()
  })
})

describe('sameVisibleHourLog', () => {
  it('treats a fresh copy with the same fields as equal', () => {
    const log = hourLog()
    expect(sameVisibleHourLog(log, { ...log })).toBe(true)
  })

  it('ignores fields the row does not paint', () => {
    const log = hourLog()
    expect(sameVisibleHourLog(log, { ...log, version: 2, updatedAt: '2026-05-01T00:00:00.000Z' })).toBe(true)
  })

  it.each<[string, Partial<LocalHourLog>]>([
    ['sync state', { syncState: 'failed' }],
    ['status', { status: 'APPROVED' }],
    ['review note', { reviewNote: 'Revisar' }],
    ['activity', { activity: 'Otra' }],
    ['hours', { hours: 2 }],
    ['date', { date: '2026-04-02' }],
  ])('detects a change in %s', (_field, change) => {
    const log = hourLog()
    expect(sameVisibleHourLog(log, { ...log, ...change })).toBe(false)
  })
})
