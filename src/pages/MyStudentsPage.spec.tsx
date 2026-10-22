import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/offline/db'
import { MyStudentsPage } from './MyStudentsPage'

vi.mock('@/auth/AuthContext', () => ({ useAuth: () => ({ user: { id: 9 }, role: 'TUTOR' }) }))

beforeEach(async () => {
  await db.delete()
  await db.open()
  // 12 practicantes del tutor 9 (y uno de otro tutor que no debe aparecer).
  await db.placements.bulkPut(
    Array.from({ length: 13 }, (_, i) => ({
      id: i + 1, studentId: 100 + i, tutorId: i === 12 ? 99 : 9, companyId: 7, startDate: '2026-03-01',
      endDate: '2026-07-31', requiredHours: 240, status: 'ACTIVE', version: 1, updatedAt: '2026-03-01T00:00:00.000Z',
    })),
  )
  // Solo los tres primeros tienen horas por revisar.
  await db.hourLogs.bulkPut(
    [1, 2, 3].map((placementId) => ({
      id: placementId, placementId, date: '2026-04-01', startTime: '08:00', endTime: '12:00', hours: 4,
      activity: 'Soporte', status: 'SUBMITTED' as const, version: 1, updatedAt: '2026-04-01T12:00:00.000Z', syncState: 'synced' as const,
    })),
  )
})

function renderPage(url = '/practicantes') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <MyStudentsPage />
    </MemoryRouter>,
  )
}

describe('MyStudentsPage', () => {
  it('pages the tutor students read from Dexie', async () => {
    renderPage()
    expect(await screen.findByText('1–10 de 12 practicantes')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Página 2' }))
    expect(screen.getByText('11–12 de 12 practicantes')).toBeInTheDocument()
  })

  it('filters the ones waiting for review and searches by student', async () => {
    renderPage('/practicantes?revision=pendiente')
    expect(await screen.findByText('1–3 de 3 practicantes (filtrados de 12)')).toBeInTheDocument()

    await userEvent.type(screen.getByRole('searchbox'), '#101')
    expect(screen.getByText('Estudiante #101')).toBeInTheDocument()
    expect(screen.queryByText('Estudiante #100')).not.toBeInTheDocument()
  })
})
