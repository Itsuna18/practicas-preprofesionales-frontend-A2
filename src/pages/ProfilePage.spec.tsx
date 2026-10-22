import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '@/api/client'
import type { ProfileResponse, StudentProfile } from '@/api/profile'
import { ProfilePage } from './ProfilePage'

const getProfile = vi.fn<() => Promise<ProfileResponse>>()
const updateProfile = vi.fn<(profile: StudentProfile) => Promise<StudentProfile>>()
vi.mock('@/api/profile', () => ({
  getProfile: () => getProfile(),
  updateProfile: (profile: StudentProfile) => updateProfile(profile),
}))

let online = true
vi.mock('@/offline/hooks/useOnline', () => ({ useOnline: () => online }))

const options = {
  careers: ['Ingeniería de Software', 'Ciencia de Datos'],
  interests: ['backend', 'datos'],
  modalities: ['PRESENCIAL', 'HIBRIDA', 'REMOTA'],
}

function renderPage() {
  return render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>,
  )
}

beforeEach(() => {
  online = true
  getProfile.mockReset()
  updateProfile.mockReset()
  getProfile.mockResolvedValue({ profile: { career: null, interests: [], preferredModality: null }, options })
})

describe('ProfilePage', () => {
  it('edits career, interests and modality and saves them', async () => {
    updateProfile.mockImplementation(async (profile) => profile)
    renderPage()

    await userEvent.selectOptions(await screen.findByLabelText('Carrera'), 'Ciencia de Datos')
    await userEvent.click(screen.getByRole('button', { name: 'datos' }))
    await userEvent.click(screen.getByRole('radio', { name: 'Remota' }))
    await userEvent.click(screen.getByRole('button', { name: 'Guardar perfil' }))

    expect(updateProfile).toHaveBeenCalledWith({
      career: 'Ciencia de Datos',
      interests: ['datos'],
      preferredModality: 'REMOTA',
    })
    expect(await screen.findByText(/Perfil guardado/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'datos' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('radio', { name: 'Remota' })).toHaveAttribute('aria-checked', 'true')
  })

  it('toggles an interest off again', async () => {
    renderPage()
    const chip = await screen.findByRole('button', { name: 'backend' })
    await userEvent.click(chip)
    await userEvent.click(chip)
    expect(chip).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows the save error', async () => {
    updateProfile.mockRejectedValue(new ApiError(400, 'career must be one of the following values'))
    renderPage()
    await userEvent.click(await screen.findByRole('button', { name: 'Guardar perfil' }))
    expect(await screen.findByText('career must be one of the following values')).toBeInTheDocument()
  })

  it('does not let you save without connection', async () => {
    online = false
    renderPage()
    expect(await screen.findByRole('button', { name: 'Guardar perfil' })).toBeDisabled()
    expect(screen.getByText('Necesitas conexión para guardar el perfil.')).toBeInTheDocument()
  })

  it('shows the loading error', async () => {
    getProfile.mockRejectedValue(new ApiError(403, 'Forbidden resource'))
    renderPage()
    expect(await screen.findByText('Forbidden resource')).toBeInTheDocument()
  })
})
