import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Application } from '@/api/applications'
import { MyApplicationsPage } from './MyApplicationsPage'

let nextResponse: () => Promise<Application[]> = () => Promise.resolve([])
vi.mock('@/api/applications', () => ({ listMine: () => nextResponse() }))

function application(id: number, title: string, company: string, status: Application['status']): Application {
  return {
    id, offerId: id, studentId: 1, status, motivation: '', submittedAt: '2026-02-20', decidedAt: null,
    offer: { id, title, company: { id, name: company } } as Application['offer'],
  }
}

function renderPage(url = '/postulaciones') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <MyApplicationsPage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  nextResponse = () =>
    Promise.resolve([
      application(1, 'Practicante Backend', 'Acme', 'ACCEPTED'),
      application(2, 'Practicante QA', 'Beta', 'REJECTED'),
      application(3, 'Practicante Datos', 'Acme', 'SUBMITTED'),
    ])
})

describe('MyApplicationsPage', () => {
  it('lists the applications with the pagination summary', async () => {
    renderPage()
    expect(await screen.findByText('Practicante Backend')).toBeInTheDocument()
    expect(screen.getByText('1–3 de 3 postulaciones')).toBeInTheDocument()
  })

  it('searches by company and filters by status', async () => {
    renderPage()
    await screen.findByText('Practicante Backend')
    await userEvent.type(screen.getByRole('searchbox'), 'acme')
    expect(screen.queryByText('Practicante QA')).not.toBeInTheDocument()

    await userEvent.selectOptions(screen.getByLabelText('Estado'), 'SUBMITTED')
    expect(screen.getByText('Practicante Datos')).toBeInTheDocument()
    expect(screen.queryByText('Practicante Backend')).not.toBeInTheDocument()
  })

  it('keeps the original empty state when there are no applications', async () => {
    nextResponse = () => Promise.resolve([])
    renderPage()
    expect(await screen.findByText('Todavía no has postulado a ninguna oferta')).toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })
})
