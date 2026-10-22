import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import type { LocalHourLog } from '@/offline/db'
import { HourLogsBrowser, monthOptions } from './HourLogsBrowser'

function log(id: number, overrides: Partial<LocalHourLog> = {}): LocalHourLog {
  return {
    id, placementId: 1, date: '2026-04-01', startTime: '08:00', endTime: '12:00',
    hours: 4, activity: `Actividad ${id}`, status: 'APPROVED', version: 1,
    updatedAt: '2026-04-01T12:00:00.000Z', syncState: 'synced',
    ...overrides,
  }
}

// 45 registros en orden de fecha (como los entrega useHourLogs).
const LOGS = Array.from({ length: 45 }, (_, i) =>
  log(i + 1, {
    date: `2026-0${i < 20 ? 4 : 5}-${String((i % 20) + 1).padStart(2, '0')}`,
    status: i % 3 === 0 ? 'SUBMITTED' : 'APPROVED',
    syncState: i === 44 ? 'local' : 'synced',
    activity: i === 10 ? 'Reunión con el cliente' : `Actividad ${i + 1}`,
  }),
)

function renderBrowser(url = '/horas', logs = LOGS) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <HourLogsBrowser logs={logs} />
    </MemoryRouter>,
  )
}

const activities = () => screen.getAllByText(/Actividad \d+|Reunión/).map((el) => el.textContent)

describe('HourLogsBrowser', () => {
  it('shows the 20 most recent logs first', () => {
    renderBrowser()
    expect(activities()).toHaveLength(20)
    expect(activities()[0]).toBe('Actividad 45')
    expect(screen.getByText('1–20 de 45 registros')).toBeInTheDocument()
  })

  it('searches the activities', async () => {
    renderBrowser()
    await userEvent.type(screen.getByRole('searchbox'), 'reunion')
    expect(activities()).toEqual(['Reunión con el cliente'])
  })

  it('filters by status, month and sync state from the URL', () => {
    const { unmount } = renderBrowser('/horas?estado=SUBMITTED&mes=2026-04')
    expect(activities()).toHaveLength(7)
    unmount()

    renderBrowser('/horas?sync=pendiente')
    expect(activities()).toEqual(['Actividad 45'])
  })

  it('shows the empty state when there are no logs at all', () => {
    renderBrowser('/horas', [])
    expect(screen.getByText('Todavía no has registrado horas')).toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  it('offers to clear when the filters leave nothing', async () => {
    renderBrowser('/horas?q=nada-de-esto')
    expect(screen.getByText('Nada coincide con tu búsqueda')).toBeInTheDocument()
    await userEvent.click(within(screen.getByRole('search')).getByRole('button', { name: 'Limpiar filtros' }))
    expect(activities()).toHaveLength(20)
  })
})

describe('monthOptions', () => {
  it('lists the months with logs, newest first, with a readable label', () => {
    const options = monthOptions([log(1, { date: '2026-04-03' }), log(2, { date: '2026-05-01' }), log(3, { date: '2026-04-20' })])
    expect(options.map((o) => o.value)).toEqual(['2026-05', '2026-04'])
    expect(options[0].label).toMatch(/mayo.*2026/)
  })
})
