import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { db, type LocalPlacement } from '@/offline/db'
import { usePlacement } from './usePlacement'

const mockUseAuth = vi.fn()

vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}))

function placement(overrides: Partial<LocalPlacement> = {}): LocalPlacement {
  return {
    id: 10,
    studentId: 5,
    tutorId: 2,
    companyId: 3,
    startDate: '2026-03-01',
    endDate: '2026-07-01',
    requiredHours: 240,
    status: 'ACTIVE',
    version: 1,
    updatedAt: '2026-03-01T00:00:00.000Z',
    ...overrides,
  }
}

beforeEach(async () => {
  await db.delete()
  await db.open()
  mockUseAuth.mockReset()
  mockUseAuth.mockReturnValue({
    user: { id: 5, email: 'estudiante0@miyura.com', fullName: 'Estudiante 0', role: 'STUDENT' },
    role: 'STUDENT',
  })
})

describe('usePlacement', () => {
  it('starts undefined while the query loads', () => {
    const { result } = renderHook(() => usePlacement())
    expect(result.current).toBeUndefined()
  })

  it('returns null when the student has no placement in the local database', async () => {
    const { result } = renderHook(() => usePlacement())
    await waitFor(() => expect(result.current).toBeNull())
  })

  it('returns the placement matching the authenticated student', async () => {
    await db.placements.bulkPut([
      placement({ id: 10, studentId: 5 }),
      placement({ id: 20, studentId: 99 }),
    ])

    const { result } = renderHook(() => usePlacement())
    await waitFor(() => expect(result.current?.id).toBe(10))
  })

  it('returns null when there is no authenticated user', async () => {
    await db.placements.put(placement({ id: 10, studentId: 5 }))
    mockUseAuth.mockReturnValue({ user: null, role: null })

    const { result } = renderHook(() => usePlacement())
    await waitFor(() => expect(result.current).toBeNull())
  })

  it('returns null when the authenticated user is not a STUDENT', async () => {
    await db.placements.put(placement({ id: 10, studentId: 5 }))
    mockUseAuth.mockReturnValue({
      user: { id: 5, email: 'tutor0@miyura.com', fullName: 'Tutor 0', role: 'TUTOR' },
      role: 'TUTOR',
    })

    const { result } = renderHook(() => usePlacement())
    await waitFor(() => expect(result.current).toBeNull())
  })

  it('reacts to placement writes made after mounting', async () => {
    const { result } = renderHook(() => usePlacement())
    await waitFor(() => expect(result.current).toBeNull())

    await act(async () => {
      await db.placements.put(placement({ id: 15, studentId: 5 }))
    })
    await waitFor(() => expect(result.current?.id).toBe(15))
  })
})
