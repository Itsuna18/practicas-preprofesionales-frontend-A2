import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TOUR_STEPS, hasSeenTour, markTourSeen, tourKey } from '@/lib/tour'
import { TourGuide } from './TourGuide'

let auth: { user: { id: number } | null; role: string | null } = { user: { id: 5 }, role: 'STUDENT' }
vi.mock('@/auth/AuthContext', () => ({ useAuth: () => auth }))

beforeEach(() => {
  localStorage.clear()
  auth = { user: { id: 5 }, role: 'STUDENT' }
})

afterEach(() => vi.useRealTimers())

function renderAndWait() {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  render(
    <>
      <a data-tour="nav-/horas" href="/horas">
        Mis horas
      </a>
      <TourGuide />
    </>,
  )
  act(() => vi.advanceTimersByTime(700))
}

describe('TourGuide', () => {
  it('opens by itself the first time and walks through the role steps', async () => {
    renderAndWait()
    const steps = TOUR_STEPS.STUDENT

    expect(screen.getByRole('dialog')).toHaveAccessibleName(steps[0].title)
    expect(screen.getByText(`Paso 1 de ${steps.length}`)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    expect(screen.getByRole('dialog')).toHaveAccessibleName(steps[1].title)

    await userEvent.click(screen.getByRole('button', { name: 'Atrás' }))
    expect(screen.getByRole('dialog')).toHaveAccessibleName(steps[0].title)
  })

  it('finishes on the last step and does not open again', async () => {
    renderAndWait()
    for (let i = 0; i < TOUR_STEPS.STUDENT.length - 1; i++) {
      await userEvent.click(screen.getByRole('button', { name: 'Siguiente' }))
    }
    await userEvent.click(screen.getByRole('button', { name: 'Terminar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(hasSeenTour(5)).toBe(true)
  })

  it('can be skipped with the button or with Escape and replayed later', async () => {
    renderAndWait()
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(hasSeenTour(5)).toBe(true)

    await userEvent.click(screen.getByRole('button', { name: 'Ver el tour de bienvenida' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Saltar' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('moves with the arrow keys', async () => {
    renderAndWait()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByText(`Paso 2 de ${TOUR_STEPS.STUDENT.length}`)).toBeInTheDocument()
    await userEvent.keyboard('{ArrowLeft}')
    expect(screen.getByText(`Paso 1 de ${TOUR_STEPS.STUDENT.length}`)).toBeInTheDocument()
  })

  it('does not open by itself for someone who already saw it', () => {
    markTourSeen(5)
    renderAndWait()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows the steps of each role', () => {
    auth = { user: { id: 9 }, role: 'TUTOR' }
    renderAndWait()
    expect(screen.getByRole('dialog')).toHaveAccessibleName(TOUR_STEPS.TUTOR[0].title)
  })

  it('renders nothing without a session', () => {
    auth = { user: null, role: null }
    const { container } = render(<TourGuide />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('tour storage', () => {
  it('keeps the record per user and version', () => {
    expect(tourKey(5)).toBe('tour:v1:5')
    markTourSeen(5)
    expect(hasSeenTour(5)).toBe(true)
    expect(hasSeenTour(6)).toBe(false)
  })

  it('every step of every role has a title and a text', () => {
    for (const steps of Object.values(TOUR_STEPS)) {
      expect(steps.length).toBeGreaterThan(2)
      for (const step of steps) {
        expect(step.title.length).toBeGreaterThan(0)
        expect(step.body.length).toBeGreaterThan(0)
      }
    }
  })
})
