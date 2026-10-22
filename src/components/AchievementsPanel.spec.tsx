import { act, render, renderHook, screen, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Achievements, Badge } from '@/lib/achievements'
import { AchievementsPanel, useNewBadges } from './AchievementsPanel'

function badge(id: Badge['id'], unlocked: boolean, progress = unlocked ? 1 : 0.4): Badge {
  return { id, title: `Insignia ${id}`, description: `Descripción ${id}`, unlocked, progress }
}

const achievements: Achievements = {
  currentStreak: 3,
  bestStreak: 7,
  registeredHours: 12,
  badges: [badge('primer-registro', true), badge('horas-100', false)],
}

beforeEach(() => localStorage.clear())
afterEach(() => vi.useRealTimers())

describe('AchievementsPanel', () => {
  it('shows the streak, the best streak and every badge with its state', () => {
    render(<AchievementsPanel achievements={achievements} userId={5} />)

    expect(screen.getByText('3 días')).toBeInTheDocument()
    expect(screen.getByText('7 días')).toBeInTheDocument()
    expect(screen.getByText('1 de 2 insignias')).toBeInTheDocument()

    const list = screen.getByRole('list', { name: 'Insignias' })
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    expect(within(list).getByText(/Desbloqueada\. Descripción primer-registro/)).toBeInTheDocument()
    expect(within(list).getByText(/Bloqueada\. Descripción horas-100/)).toBeInTheDocument()
  })
})

describe('useNewBadges', () => {
  it('does not celebrate on the first visit, only records what is unlocked', () => {
    const { result } = renderHook(() => useNewBadges(5, achievements.badges))
    expect(result.current).toEqual([])
    expect(JSON.parse(localStorage.getItem('achievements:seen:5')!)).toEqual(['primer-registro'])
  })

  it('celebrates badges unlocked since the last visit and hides them later', () => {
    vi.useFakeTimers()
    localStorage.setItem('achievements:seen:5', JSON.stringify(['primer-registro']))
    const badges = [badge('primer-registro', true), badge('horas-100', true)]

    const { result } = renderHook(() => useNewBadges(5, badges))
    expect(result.current.map((b) => b.id)).toEqual(['horas-100'])

    act(() => vi.advanceTimersByTime(6000))
    expect(result.current).toEqual([])
  })

  it('keeps the record per user', () => {
    localStorage.setItem('achievements:seen:5', JSON.stringify([]))
    const { result } = renderHook(() => useNewBadges(9, achievements.badges))
    expect(result.current).toEqual([])
    expect(localStorage.getItem('achievements:seen:9')).not.toBeNull()
  })

  it('does nothing without a user', () => {
    renderHook(() => useNewBadges(undefined, achievements.badges))
    expect(localStorage.length).toBe(0)
  })
})
