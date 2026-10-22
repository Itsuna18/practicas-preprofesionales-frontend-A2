import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { Offer } from '@/api/offers'
import { OffersPage } from './OffersPage'

function offer(id: number, title: string, modality: string): Offer {
  return {
    id, companyId: 1, title, description: 'Prácticas de 240 horas', modality, seats: 2, requiredHours: 240,
    periodStart: '2026-03-01', periodEnd: '2026-07-31', status: 'PUBLISHED', publishedAt: null,
    company: { id: 1, name: `Empresa ${id}` },
  }
}

const OFFERS = Array.from({ length: 14 }, (_, i) => offer(i + 1, i === 0 ? 'Practicante de Análisis' : `Oferta ${i + 1}`, i % 2 ? 'HIBRIDA' : 'PRESENCIAL'))

vi.mock('@/api/offers', () => ({ listOffers: () => Promise.resolve(OFFERS) }))
vi.mock('@/components/RecommendedOffers', () => ({ RecommendedOffers: () => null }))

function renderPage(url = '/ofertas') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <OffersPage />
    </MemoryRouter>,
  )
}

describe('OffersPage', () => {
  it('shows 10 offers per page and moves to the next page', async () => {
    renderPage()
    expect(await screen.findByText('1–10 de 14 ofertas')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Página 2' }))
    expect(screen.getByText('11–14 de 14 ofertas')).toBeInTheDocument()
  })

  it('searches without accents and filters by modality', async () => {
    renderPage()
    await screen.findByText('1–10 de 14 ofertas')
    await userEvent.type(screen.getByRole('searchbox'), 'analisis')
    expect(screen.getByText('Practicante de Análisis')).toBeInTheDocument()
    expect(screen.getByText('1–1 de 1 oferta (filtrados de 14)')).toBeInTheDocument()

    await userEvent.clear(screen.getByRole('searchbox'))
    await userEvent.selectOptions(screen.getByLabelText('Modalidad'), 'HIBRIDA')
    expect(screen.getByText('1–7 de 7 ofertas (filtrados de 14)')).toBeInTheDocument()
  })
})
