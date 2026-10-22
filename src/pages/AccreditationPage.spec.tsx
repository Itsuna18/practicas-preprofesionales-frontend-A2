import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { AccreditationRow } from '@/api/accreditation'
import { AccreditationPage } from './AccreditationPage'

const LEVELS: AccreditationRow['level'][] = ['ACREDITADO', 'PENDIENTE', 'NO_ACREDITADO', 'ACREDITADO_CON_OBSERVACIONES']
const ROWS: AccreditationRow[] = Array.from({ length: 45 }, (_, i) => ({
  placementId: i + 1,
  studentName: i === 0 ? 'Ana Pérez' : `Estudiante ${i}`,
  level: LEVELS[i % 4],
  reasons: i % 4 === 2 ? ['falta seguro'] : [],
  completionPercentage: 50,
}))

vi.mock('@/api/accreditation', () => ({ reportForPeriod: () => Promise.resolve(ROWS) }))

function renderPage(url = '/acreditacion') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <AccreditationPage />
    </MemoryRouter>,
  )
}

describe('AccreditationPage', () => {
  it('pages the report 20 at a time while the stats count everyone', async () => {
    renderPage()
    expect(await screen.findByText('1–20 de 45 practicantes')).toBeInTheDocument()
    expect(screen.getByText('45', { selector: 'span' })).toBeInTheDocument()
  })

  it('searches by student without accents and filters by level', async () => {
    renderPage()
    await screen.findByText('1–20 de 45 practicantes')
    await userEvent.type(screen.getByRole('searchbox'), 'ana perez')
    expect(screen.getByText('Ana Pérez')).toBeInTheDocument()
    expect(screen.getByText('1–1 de 1 practicante (filtrados de 45)')).toBeInTheDocument()

    await userEvent.clear(screen.getByRole('searchbox'))
    await userEvent.selectOptions(screen.getByLabelText('Nivel'), 'NO_ACREDITADO')
    expect(screen.getByText('1–11 de 11 practicantes (filtrados de 45)')).toBeInTheDocument()
  })

  it('searches inside the reasons too', async () => {
    renderPage('/acreditacion?q=seguro')
    expect(await screen.findByText('1–11 de 11 practicantes (filtrados de 45)')).toBeInTheDocument()
  })
})
