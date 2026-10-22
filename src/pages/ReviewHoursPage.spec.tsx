import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '@/offline/db'
import { ReviewHoursPage } from './ReviewHoursPage'

beforeEach(async () => {
  await db.delete()
  await db.open()
  await db.placements.put({
    id: 3, studentId: 100, tutorId: 9, companyId: 7, startDate: '2026-03-01', endDate: '2026-07-31',
    requiredHours: 240, status: 'ACTIVE', version: 1, updatedAt: '2026-03-01T00:00:00.000Z',
  })
  // 25 registros; los 5 últimos esperan revisión.
  await db.hourLogs.bulkPut(
    Array.from({ length: 25 }, (_, i) => ({
      id: i + 1, placementId: 3, date: `2026-04-${String(i + 1).padStart(2, '0')}`, startTime: '08:00', endTime: '12:00',
      hours: 4, activity: `Actividad ${i + 1}`, status: (i >= 20 ? 'SUBMITTED' : 'APPROVED') as 'SUBMITTED' | 'APPROVED',
      version: 1, updatedAt: '2026-04-30T00:00:00.000Z', syncState: 'synced' as const,
    })),
  )
})

function renderPage(query = '') {
  return render(
    <MemoryRouter initialEntries={[`/practicantes/3/horas${query}`]}>
      <Routes>
        <Route path="/practicantes/:id/horas" element={<ReviewHoursPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ReviewHoursPage', () => {
  it('shows the most recent 20 logs first', async () => {
    renderPage()
    expect(await screen.findByText('1–20 de 25 registros')).toBeInTheDocument()
    expect(screen.getAllByText(/^Actividad \d+$/)[0]).toHaveTextContent('Actividad 25')
  })

  it('lets the tutor see only what is waiting for review', async () => {
    renderPage()
    await screen.findByText('1–20 de 25 registros')
    await userEvent.selectOptions(screen.getByLabelText('Estado'), 'SUBMITTED')
    expect(screen.getByText('1–5 de 5 registros (filtrados de 25)')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Aprobar' })).toHaveLength(5)
  })
})
