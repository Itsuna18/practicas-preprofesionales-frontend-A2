import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import type { RecommendationsResponse } from '@/api/profile'
import { RecommendedOffers } from './RecommendedOffers'

// Implementación simple en vez de vi.fn: el espía de Vitest marca como no
// manejado el rechazo que el componente sí atrapa.
let nextResponse: () => Promise<RecommendationsResponse> = () => new Promise(() => {})
const getRecommendedOffers = {
  mockResolvedValue: (value: RecommendationsResponse) => {
    nextResponse = () => Promise.resolve(value)
  },
  mockRejectedWith: (error: Error) => {
    nextResponse = () => Promise.reject(error)
  },
}
vi.mock('@/api/profile', () => ({ getRecommendedOffers: () => nextResponse() }))

function renderSection() {
  return render(
    <MemoryRouter>
      <RecommendedOffers />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  nextResponse = () => new Promise(() => {})
})

describe('RecommendedOffers', () => {
  it('invites to complete the profile when it is empty', async () => {
    getRecommendedOffers.mockResolvedValue({ profileComplete: false, recommendations: [] })
    renderSection()
    expect(await screen.findByRole('link', { name: 'Completar mi perfil' })).toHaveAttribute('href', '/perfil')
  })

  it('shows each recommendation with its match, seats and reasons', async () => {
    getRecommendedOffers.mockResolvedValue({
      profileComplete: true,
      recommendations: [
        {
          offerId: 4,
          match: 85,
          seatsLeft: 2,
          reasons: ['Afín a Ingeniería de Software: backend', 'Modalidad híbrida, la que prefieres'],
          offer: {
            id: 4,
            title: 'Practicante Backend — Acme',
            modality: 'HIBRIDA',
            seats: 3,
            periodStart: '2026-03-01',
            periodEnd: '2026-07-31',
            company: { name: 'Acme', sector: 'Software' },
          },
        },
      ],
    })
    renderSection()

    expect(await screen.findByText('Practicante Backend — Acme')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: '85% de coincidencia' })).toBeInTheDocument()
    expect(screen.getByText('2 cupos libres')).toBeInTheDocument()
    expect(screen.getByText('Híbrida')).toBeInTheDocument()
    expect(screen.getByText('Afín a Ingeniería de Software: backend')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver y postular' })).toHaveAttribute('href', '/ofertas/4')
  })

  it('says so when nothing matches yet', async () => {
    getRecommendedOffers.mockResolvedValue({ profileComplete: true, recommendations: [] })
    renderSection()
    expect(await screen.findByText(/ninguna oferta abierta coincide/)).toBeInTheDocument()
  })

  it('shows the API error without breaking the offers page', async () => {
    getRecommendedOffers.mockRejectedWith(new ApiError(503, 'Sin conexión con el servidor'))
    renderSection()
    expect(await screen.findByText('Sin conexión con el servidor')).toBeInTheDocument()
  })
})
