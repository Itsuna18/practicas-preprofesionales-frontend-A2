import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, api } from './client'

afterEach(() => vi.unstubAllGlobals())

describe('api', () => {
  it('attaches the bearer token and returns parsed json', async () => {
    localStorage.setItem('access_token', 'tok')
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ id: 1 }) })
    vi.stubGlobal('fetch', fetchMock)

    await expect(api<{ id: number }>('/offers')).resolves.toEqual({ id: 1 })

    const [, init] = fetchMock.mock.calls[0]
    expect(init.headers.Authorization).toBe('Bearer tok')
  })

  it('throws ApiError carrying the backend message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false, status: 403,
      json: async () => ({ statusCode: 403, message: 'rol insuficiente' }),
    }))

    await expect(api('/offers')).rejects.toMatchObject({ statusCode: 403, message: 'rol insuficiente' })
    await expect(api('/offers')).rejects.toBeInstanceOf(ApiError)
  })

  it('renueva el token en 401 si /auth/refresh responde ok y reintenta la petición', async () => {
    localStorage.setItem('access_token', 'old-tok')

    const fetchMock = vi.fn()
      // Primera llamada a /offers falla con 401
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ statusCode: 401, message: 'Unauthorized' }),
      })
      // Llamada a /auth/refresh responde ok con nuevo token
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ accessToken: 'new-tok' }),
      })
      // Reintento de /offers responde ok
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: 'success' }),
      })

    vi.stubGlobal('fetch', fetchMock)

    const result = await api<{ data: string }>('/offers')

    expect(result).toEqual({ data: 'success' })
    expect(localStorage.getItem('access_token')).toBe('new-tok')
  })

  it('limpia localStorage y emite auth:expired cuando el refresh también falla', async () => {
    localStorage.setItem('access_token', 'expired-tok')
    localStorage.setItem('user', JSON.stringify({ id: 1 }))

    const expiredListener = vi.fn()
    window.addEventListener('auth:expired', expiredListener)

    const fetchMock = vi.fn()
      // Llamada original con 401
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ statusCode: 401, message: 'Unauthorized' }),
      })
      // Refresh falla con 401
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ statusCode: 401, message: 'token expirado' }),
      })

    vi.stubGlobal('fetch', fetchMock)

    await expect(api('/offers')).rejects.toMatchObject({ statusCode: 401, message: 'sesión caducada' })
    expect(localStorage.getItem('access_token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
    expect(sessionStorage.getItem('session_expired_message')).toBe('Tu sesión ha caducado. Inicia sesión nuevamente.')
    expect(expiredListener).toHaveBeenCalled()

    window.removeEventListener('auth:expired', expiredListener)
  })
})

