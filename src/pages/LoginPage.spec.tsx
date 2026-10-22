import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import { FEATURES, LoginPage } from './LoginPage'

// Implementación simple (no vi.fn) para que el rechazo atrapado no se marque como no manejado.
let nextLogin: () => Promise<void> = () => Promise.resolve()
const calls: [string, string][] = []
vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({
    login: (email: string, password: string) => {
      calls.push([email, password])
      return nextLogin()
    },
  }),
}))

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<p>Inicio</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  calls.length = 0
  nextLogin = () => Promise.resolve()
  sessionStorage.clear()
})

describe('LoginPage', () => {
  it('signs in and goes home', async () => {
    renderLogin()
    await userEvent.type(screen.getByLabelText('Correo institucional'), 'estudiante0@miyura.com')
    await userEvent.type(screen.getByLabelText('Contraseña'), 'yura1234')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(calls).toEqual([['estudiante0@miyura.com', 'yura1234']])
    expect(await screen.findByText('Inicio')).toBeInTheDocument()
  })

  it('shows and hides the password', async () => {
    renderLogin()
    const password = screen.getByLabelText('Contraseña')
    expect(password).toHaveAttribute('type', 'password')

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar contraseña' }))
    expect(password).toHaveAttribute('type', 'text')

    await userEvent.click(screen.getByRole('button', { name: 'Ocultar contraseña' }))
    expect(password).toHaveAttribute('type', 'password')
  })

  it('shows the error and shakes the form when the login fails', async () => {
    nextLogin = () => Promise.reject(new ApiError(401, 'credenciales inválidas'))
    const { container } = renderLogin()
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('credenciales inválidas')
    expect(container.querySelector('form')).toHaveClass('animate-shake')
  })

  it('shows the expired-session message once', () => {
    sessionStorage.setItem('session_expired_message', 'Tu sesión ha caducado.')
    renderLogin()
    expect(screen.getByRole('alert')).toHaveTextContent('Tu sesión ha caducado.')
    expect(sessionStorage.getItem('session_expired_message')).toBeNull()
  })

  it('lets you pick a feature of the carousel', async () => {
    renderLogin()
    const last = FEATURES[FEATURES.length - 1]
    await userEvent.click(screen.getByRole('button', { name: `Ver: ${last.title}` }))
    expect(screen.getByText(last.title)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: `Ver: ${last.title}` })).toHaveAttribute('aria-pressed', 'true')
  })
})
