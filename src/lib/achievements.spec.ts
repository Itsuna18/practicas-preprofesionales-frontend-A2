import { describe, expect, it } from 'vitest'
import type { LocalHourLog } from '@/offline/db'
import { computeAchievements } from './achievements'

let nextId = 1
function log(date: string, overrides: Partial<LocalHourLog> = {}): LocalHourLog {
  return {
    id: nextId++, placementId: 1, date, startTime: '08:00', endTime: '12:00',
    hours: 4, activity: 'Soporte', status: 'APPROVED', version: 1,
    updatedAt: '2026-04-01T12:00:00.000Z', syncState: 'synced',
    ...overrides,
  }
}

const badgeOf = (result: ReturnType<typeof computeAchievements>, id: string) =>
  result.badges.find((b) => b.id === id)!

// 2026-10-19 es lunes.
const MON = '2026-10-19'
const TUE = '2026-10-20'
const WED = '2026-10-21'
const THU = '2026-10-22'
const FRI = '2026-10-23'
const at = (date: string) => new Date(`${date}T15:00:00`)

describe('computeAchievements', () => {
  it('starts with everything locked and no streak', () => {
    const result = computeAchievements([], 240, at(WED))
    expect(result.currentStreak).toBe(0)
    expect(result.bestStreak).toBe(0)
    expect(result.badges.every((b) => !b.unlocked)).toBe(true)
  })

  it('counts consecutive weekdays up to today', () => {
    const result = computeAchievements([log(MON), log(TUE), log(WED)], 240, at(WED))
    expect(result.currentStreak).toBe(3)
  })

  it('keeps the streak alive while today has no log yet', () => {
    const result = computeAchievements([log(MON), log(TUE)], 240, at(WED))
    expect(result.currentStreak).toBe(2)
  })

  it('breaks the streak when a weekday is missing', () => {
    const result = computeAchievements([log(MON), log(WED)], 240, at(THU))
    expect(result.currentStreak).toBe(1)
    expect(result.bestStreak).toBe(1)
  })

  it('does not break the streak over the weekend', () => {
    const result = computeAchievements([log('2026-10-16'), log(MON)], 240, at(MON))
    expect(result.currentStreak).toBe(2)
  })

  it('counts several logs on the same day once', () => {
    const result = computeAchievements([log(MON), log(MON, { startTime: '14:00', endTime: '16:00' })], 240, at(MON))
    expect(result.currentStreak).toBe(1)
    expect(result.registeredHours).toBe(8)
  })

  it('ignores rejected logs', () => {
    const result = computeAchievements([log(MON, { status: 'REJECTED' })], 240, at(MON))
    expect(result.currentStreak).toBe(0)
    expect(badgeOf(result, 'primer-registro').unlocked).toBe(false)
  })

  it('unlocks the first complete week only with Monday to Friday', () => {
    const four = computeAchievements([log(MON), log(TUE), log(WED), log(THU)], 240, at(THU))
    expect(badgeOf(four, 'primera-semana').unlocked).toBe(false)
    expect(badgeOf(four, 'primera-semana').progress).toBeCloseTo(0.8)

    const five = computeAchievements([log(MON), log(TUE), log(WED), log(THU), log(FRI)], 240, at(FRI))
    expect(badgeOf(five, 'primera-semana').unlocked).toBe(true)
  })

  it('unlocks the hour badges with submitted and approved hours', () => {
    const logs = Array.from({ length: 13 }, (_, i) =>
      log(`2026-09-${String(i + 1).padStart(2, '0')}`, { status: i % 2 ? 'SUBMITTED' : 'APPROVED' }),
    )
    const result = computeAchievements(logs, 240, at(WED))
    expect(result.registeredHours).toBe(52)
    expect(badgeOf(result, 'horas-50').unlocked).toBe(true)
    expect(badgeOf(result, 'horas-100').unlocked).toBe(false)
    expect(badgeOf(result, 'horas-100').progress).toBeCloseTo(0.52)
  })

  it('tracks the best streak across past runs', () => {
    const tenDays = ['2026-09-07', '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11',
      '2026-09-14', '2026-09-15', '2026-09-16', '2026-09-17', '2026-09-18'].map((d) => log(d))
    const result = computeAchievements(tenDays, 240, at(WED))
    expect(result.bestStreak).toBe(10)
    expect(result.currentStreak).toBe(0)
    expect(badgeOf(result, 'racha-10').unlocked).toBe(true)
  })

  it('uses only approved hours for the goal badges', () => {
    const logs = [log(MON, { hours: 120 }), log(TUE, { hours: 120, status: 'SUBMITTED' })]
    const result = computeAchievements(logs, 240, at(TUE))
    expect(badgeOf(result, 'mitad-camino').unlocked).toBe(true)
    expect(badgeOf(result, 'meta-cumplida').unlocked).toBe(false)
    expect(badgeOf(result, 'meta-cumplida').progress).toBeCloseTo(0.5)
  })

  it('never unlocks goal badges when the placement requires no hours', () => {
    const result = computeAchievements([log(MON)], 0, at(MON))
    expect(badgeOf(result, 'meta-cumplida').unlocked).toBe(false)
  })
})
