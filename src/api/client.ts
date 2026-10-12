const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'

export class ApiError extends Error {
  constructor(
    readonly statusCode: number,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('access_token')
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  })

  // Manejo de 401: intentar renovar la sesión de forma transparente
  if (res.status === 401 && !path.startsWith('/auth/login') && !path.startsWith('/auth/refresh') && token) {
    try {
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      })

      if (refreshRes.ok) {
        const data = (await refreshRes.json()) as { accessToken: string; user?: unknown }
        localStorage.setItem('access_token', data.accessToken)
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user))
        }

        // Reintentar la llamada original con el nuevo token
        return api<T>(path, {
          ...init,
          headers: {
            ...init.headers,
            Authorization: `Bearer ${data.accessToken}`,
          },
        })
      }
    } catch {
      // Ignorar error de red y proceder con la expiración
    }

    // Si el refresh falló o el token ya no es válido, caduca la sesión
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    sessionStorage.setItem('session_expired_message', 'Tu sesión ha caducado. Inicia sesión nuevamente.')
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth:expired'))
    }
    throw new ApiError(401, 'sesión caducada')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new ApiError(res.status, body.message ?? `Error ${res.status}`)
  }
  return res.json() as Promise<T>
}

