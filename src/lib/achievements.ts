import { parseLocalDate } from '@/lib/date'
import type { LocalHourLog } from '@/offline/db'

/**
 * Logros del estudiante calculados solo con su libro de horas local: no hay
 * nada que sincronizar y funcionan igual sin conexión.
 *
 * La racha cuenta días hábiles (lunes a viernes) seguidos con al menos un
 * registro. El fin de semana no la corta, y el día de hoy no la rompe
 * mientras no haya terminado.
 */

export type BadgeId =
  | 'primer-registro'
  | 'primera-semana'
  | 'racha-10'
  | 'horas-50'
  | 'horas-100'
  | 'mitad-camino'
  | 'meta-cumplida'

export interface Badge {
  id: BadgeId
  title: string
  description: string
  unlocked: boolean
  /** Avance hacia la insignia, de 0 a 1. */
  progress: number
}

export interface Achievements {
  currentStreak: number
  bestStreak: number
  registeredHours: number
  badges: Badge[]
}

function dayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function isWeekday(date: Date): boolean {
  const day = date.getDay()
  return day !== 0 && day !== 6
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

// Aritmética de calendario (no de milisegundos): así un cambio de horario de
// verano no corre el día.
function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

/** Día hábil anterior (salta sábado y domingo). */
function previousWeekday(date: Date): Date {
  let cursor = addDays(date, -1)
  while (!isWeekday(cursor)) cursor = addDays(cursor, -1)
  return cursor
}

function currentStreakFrom(days: Set<string>, today: Date): number {
  let cursor = startOfDay(today)
  if (!isWeekday(cursor) || !days.has(dayKey(cursor))) cursor = previousWeekday(cursor)
  let streak = 0
  while (days.has(dayKey(cursor))) {
    streak += 1
    cursor = previousWeekday(cursor)
  }
  return streak
}

function bestStreakFrom(days: Set<string>): number {
  const weekdays = [...days]
    .map((key) => parseLocalDate(key))
    .filter(isWeekday)
    .sort((a, b) => a.getTime() - b.getTime())
  let best = 0
  let run = 0
  let previous: Date | null = null
  for (const day of weekdays) {
    run = previous && dayKey(previousWeekday(day)) === dayKey(previous) ? run + 1 : 1
    best = Math.max(best, run)
    previous = day
  }
  return best
}

/** Mayor cantidad de días hábiles con registro dentro de una misma semana. */
function bestWeekCoverage(days: Set<string>): number {
  const perWeek = new Map<string, number>()
  for (const key of days) {
    const date = parseLocalDate(key)
    if (!isWeekday(date)) continue
    const monday = addDays(date, 1 - date.getDay())
    const week = dayKey(monday)
    perWeek.set(week, (perWeek.get(week) ?? 0) + 1)
  }
  return Math.max(0, ...perWeek.values())
}

function badge(id: BadgeId, title: string, description: string, value: number, goal: number): Badge {
  const progress = goal > 0 ? Math.min(1, value / goal) : 0
  return { id, title, description, unlocked: value >= goal && goal > 0, progress }
}

export function computeAchievements(
  logs: LocalHourLog[] | undefined,
  requiredHours: number,
  today: Date = new Date(),
): Achievements {
  // Lo rechazado no cuenta: no es trabajo reconocido.
  const counted = (logs ?? []).filter((log) => log.status !== 'REJECTED')
  const days = new Set(counted.map((log) => log.date.slice(0, 10)))
  const registeredHours = counted.reduce((sum, log) => sum + log.hours, 0)
  const approvedHours = counted
    .filter((log) => log.status === 'APPROVED')
    .reduce((sum, log) => sum + log.hours, 0)

  const currentStreak = currentStreakFrom(days, today)
  const bestStreak = bestStreakFrom(days)

  return {
    currentStreak,
    bestStreak,
    registeredHours,
    badges: [
      badge('primer-registro', 'Primer registro', 'Registraste tus primeras horas.', counted.length, 1),
      badge('primera-semana', 'Primera semana completa', 'Registraste horas de lunes a viernes en una misma semana.', bestWeekCoverage(days), 5),
      badge('racha-10', 'Racha de 10 días', 'Diez días hábiles seguidos con registro.', bestStreak, 10),
      badge('horas-50', '50 horas', 'Llevas 50 horas registradas.', registeredHours, 50),
      badge('horas-100', '100 horas', 'Llevas 100 horas registradas.', registeredHours, 100),
      badge('mitad-camino', 'Mitad del camino', 'Tu tutor aprobó la mitad de las horas requeridas.', approvedHours, requiredHours / 2),
      badge('meta-cumplida', 'Meta cumplida', 'Completaste todas las horas aprobadas que pide tu práctica.', approvedHours, requiredHours),
    ],
  }
}
