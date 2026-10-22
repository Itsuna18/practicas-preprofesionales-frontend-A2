import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { OfferApplication } from '@/api/companies'
import { OfferApplicationsPage } from './OfferApplicationsPage'

const APPLICATIONS: OfferApplication[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  offerId: 4,
  studentId: 100 + i,
  status: i < 3 ? 'ACCEPTED' : 'SUBMITTED',
  motivation: i === 5 ? 'Me apasiona el análisis de datos' : 'Quiero aprender',
  submittedAt: '2026-02-20',
  decidedAt: null,
  student: { id: 100 + i, fullName: i === 0 ? 'Lucía Gómez' : `Estudiante ${i}`, email: `e${i}@miyura.com` },
}))

vi.mock('@/api/companies', () => ({
  listApplicationsForOffer: () => Promise.resolve(APPLICATIONS),
  decideApplication: () => Promise.resolve(),
}))
vi.mock('@/api/offers', () => ({ getOffer: () => Promise.resolve({ id: 4, title: 'Practicante Backend', seats: 5 }) }))

function renderPage(query = '') {
  return render(
    <MemoryRouter initialEntries={[`/ofertas-empresa/4/postulaciones${query}`]}>
      <Routes>
        <Route path="/ofertas-empresa/:id/postulaciones" element={<OfferApplicationsPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('OfferApplicationsPage', () => {
  it('pages the applications', async () => {
    renderPage()
    expect(await screen.findByText('1–10 de 12 postulaciones')).toBeInTheDocument()
  })

  it('searches by name or motivation and filters by status', async () => {
    renderPage()
    await screen.findByText('1–10 de 12 postulaciones')
    await userEvent.type(screen.getByRole('searchbox'), 'analisis')
    expect(screen.getByText('Me apasiona el análisis de datos')).toBeInTheDocument()
    expect(screen.getByText('1–1 de 1 postulación (filtrados de 12)')).toBeInTheDocument()

    await userEvent.clear(screen.getByRole('searchbox'))
    await userEvent.selectOptions(screen.getByLabelText('Estado'), 'ACCEPTED')
    expect(screen.getByText('Lucía Gómez')).toBeInTheDocument()
    expect(screen.getByText('1–3 de 3 postulaciones (filtrados de 12)')).toBeInTheDocument()
  })
})
