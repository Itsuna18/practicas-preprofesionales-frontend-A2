import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { CompanyOffer } from '@/api/companies'
import { CompanyOffersPage } from './CompanyOffersPage'

const STATUSES = ['DRAFT', 'PUBLISHED', 'CLOSED']
const OFFERS = Array.from({ length: 13 }, (_, i) => ({
  id: i + 1, companyId: 2, title: i === 0 ? 'Practicante de Diseño' : `Oferta ${i + 1}`, description: 'Prácticas',
  modality: 'PRESENCIAL', seats: 3, requiredHours: 240, periodStart: '2026-03-01', periodEnd: '2026-07-31',
  status: STATUSES[i % 3], publishedAt: null, company: { id: 2, name: 'Acme' }, applications: [],
})) as CompanyOffer[]

vi.mock('@/auth/AuthContext', () => ({ useAuth: () => ({ user: { id: 5, companyId: 2 }, role: 'COMPANY' }) }))
vi.mock('@/api/companies', () => ({
  listMyOffers: () => Promise.resolve(OFFERS),
  listCompanies: () => Promise.resolve([]),
  createOffer: vi.fn(),
  publishOffer: vi.fn(),
  closeOffer: vi.fn(),
}))

function renderPage(url = '/ofertas-empresa') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <CompanyOffersPage />
    </MemoryRouter>,
  )
}

describe('CompanyOffersPage', () => {
  it('pages the company offers', async () => {
    renderPage()
    expect(await screen.findByText('1–10 de 13 ofertas')).toBeInTheDocument()
  })

  it('filters by status and searches by title', async () => {
    renderPage('/ofertas-empresa?estado=DRAFT')
    expect(await screen.findByText('1–5 de 5 ofertas (filtrados de 13)')).toBeInTheDocument()
    await userEvent.type(screen.getByRole('searchbox'), 'diseno')
    expect(screen.getByText('Practicante de Diseño')).toBeInTheDocument()
    expect(screen.getByText('1–1 de 1 oferta (filtrados de 13)')).toBeInTheDocument()
  })
})
