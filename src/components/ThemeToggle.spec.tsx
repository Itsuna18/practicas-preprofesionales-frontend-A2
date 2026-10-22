import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { ThemeToggle } from './ThemeToggle'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

describe('ThemeToggle', () => {
  it('switches between light and dark and announces the next action', async () => {
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: 'Cambiar a modo oscuro' })
    expect(button).toHaveAttribute('aria-pressed', 'false')

    await userEvent.click(button)
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(screen.getByRole('button', { name: 'Cambiar a modo claro' })).toHaveAttribute('aria-pressed', 'true')
    expect(localStorage.getItem('theme')).toBe('dark')

    await userEvent.click(screen.getByRole('button', { name: 'Cambiar a modo claro' }))
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
