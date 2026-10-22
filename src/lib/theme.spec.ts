import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { THEME_STORAGE_KEY, applyTheme, readStoredTheme, resolveTheme, setTheme, useTheme } from './theme'

function mockSystemDark(dark: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: dark && query.includes('dark') }))
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
})

afterEach(() => vi.unstubAllGlobals())

describe('theme', () => {
  it('ignores unknown stored values', () => {
    localStorage.setItem(THEME_STORAGE_KEY, 'sepia')
    expect(readStoredTheme()).toBeNull()
  })

  it('follows the system preference when nothing is stored', () => {
    mockSystemDark(true)
    expect(resolveTheme()).toBe('dark')
    mockSystemDark(false)
    expect(resolveTheme()).toBe('light')
  })

  it('prefers the stored choice over the system', () => {
    mockSystemDark(true)
    localStorage.setItem(THEME_STORAGE_KEY, 'light')
    expect(resolveTheme()).toBe('light')
  })

  it('applies the theme as a class and color scheme on <html>', () => {
    applyTheme('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe('dark')
    applyTheme('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('persists the choice and survives a storage that throws', () => {
    setTheme('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')

    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    expect(() => setTheme('light')).not.toThrow()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    vi.restoreAllMocks()
  })

  it('useTheme toggles and re-renders subscribers', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('light')

    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('dark')

    act(() => result.current.toggleTheme())
    expect(result.current.theme).toBe('light')
  })
})
