import { useEffect, useMemo, useState } from 'react'
import {
  Award,
  CalendarCheck,
  Clock,
  Flag,
  Flame,
  Lock,
  type LucideIcon,
  Sparkles,
  Trophy,
} from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { Section } from '@/components/Panel'
import { type Achievements, type Badge, type BadgeId, computeAchievements } from '@/lib/achievements'
import type { LocalHourLog } from '@/offline/db'
import { cn, plural } from '@/lib/utils'

const ICONS: Record<BadgeId, LucideIcon> = {
  'primer-registro': Sparkles,
  'primera-semana': CalendarCheck,
  'racha-10': Flame,
  'horas-50': Clock,
  'horas-100': Award,
  'mitad-camino': Flag,
  'meta-cumplida': Trophy,
}

function seenKey(userId: number): string {
  return `achievements:seen:${userId}`
}

/**
 * Insignias desbloqueadas desde la última visita, para celebrarlas una sola
 * vez. Lo ya visto se recuerda en este navegador; la primera vez solo se
 * registra lo que hay, sin celebrar cada insignia a la vez.
 */
export function useNewBadges(userId: number | undefined, badges: Badge[]): Badge[] {
  const [fresh, setFresh] = useState<Badge[]>([])
  const unlockedIds = badges.filter((b) => b.unlocked).map((b) => b.id).join(',')

  useEffect(() => {
    if (userId === undefined) return
    const unlocked = unlockedIds ? unlockedIds.split(',') : []
    let seen: string[] | null = null
    try {
      const raw = localStorage.getItem(seenKey(userId))
      seen = raw ? (JSON.parse(raw) as string[]) : null
    } catch {
      return
    }
    if (seen !== null) {
      const known = new Set(seen)
      const newOnes = unlocked.filter((id) => !known.has(id))
      if (newOnes.length > 0) setFresh(badges.filter((b) => newOnes.includes(b.id)))
    }
    try {
      localStorage.setItem(seenKey(userId), JSON.stringify(unlocked))
    } catch {
      // Sin almacenamiento simplemente no se celebra.
    }
    // `badges` cambia de referencia en cada render; lo que importa es el conjunto desbloqueado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, unlockedIds])

  useEffect(() => {
    if (fresh.length === 0) return
    const timer = setTimeout(() => setFresh([]), 6000)
    return () => clearTimeout(timer)
  }, [fresh])

  return fresh
}

function BadgeTile({ badge }: { badge: Badge }) {
  const Icon = badge.unlocked ? ICONS[badge.id] : Lock
  return (
    <li
      className={cn(
        'group flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-all duration-200 ease-in-out',
        badge.unlocked
          ? 'border-stamp/30 bg-chipStamp hover:-translate-y-0.5'
          : 'border-line bg-well',
      )}
      title={badge.description}
    >
      <span
        className={cn(
          'flex size-11 items-center justify-center rounded-full transition-transform duration-200 group-hover:scale-110',
          badge.unlocked ? 'bg-stamp text-surface animate-pop-in' : 'bg-soft text-inkMute',
        )}
      >
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className={cn('text-13 font-semibold leading-tight', badge.unlocked ? 'text-ink' : 'text-inkSoft')}>
        {badge.title}
      </span>
      <span className="sr-only">{badge.unlocked ? 'Desbloqueada.' : 'Bloqueada.'} {badge.description}</span>
      {!badge.unlocked ? (
        <span aria-hidden="true" className="h-1 w-full overflow-hidden rounded-full bg-paperRule">
          <span
            className="block h-full origin-left rounded-full bg-inkMute transition-[width] duration-700 ease-out"
            style={{ width: `${Math.round(badge.progress * 100)}%` }}
          />
        </span>
      ) : null}
    </li>
  )
}

function Celebration({ badges }: { badges: Badge[] }) {
  return (
    <div role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex justify-center px-4">
      {badges.length > 0 ? (
        <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-[0_16px_40px_-16px_hsl(var(--scrim)/0.5)] animate-in fade-in slide-in-from-bottom-4 duration-300">
          <span className="flex size-10 items-center justify-center rounded-full bg-stamp text-surface animate-pop-in">
            <Trophy aria-hidden="true" className="size-5" />
          </span>
          <div>
            <p className="text-13 font-semibold text-ink">
              {badges.length === 1 ? '¡Insignia desbloqueada!' : `¡${badges.length} insignias desbloqueadas!`}
            </p>
            <p className="text-12 text-inkSoft">{badges.map((b) => b.title).join(' · ')}</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}

export function AchievementsPanel({
  achievements,
  userId,
}: {
  achievements: Achievements
  userId: number | undefined
}) {
  const { currentStreak, bestStreak, badges } = achievements
  const unlocked = badges.filter((b) => b.unlocked).length
  const fresh = useNewBadges(userId, badges)

  return (
    <Section
      title="Logros"
      aside={
        <span className="font-data text-12 text-inkSoft">
          {unlocked} de {badges.length} insignias
        </span>
      }
    >
      <div className="flex flex-col gap-5 px-[18px] py-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'flex size-12 items-center justify-center rounded-full',
                currentStreak > 0 ? 'bg-chipPending text-pending' : 'bg-soft text-inkMute',
              )}
            >
              <Flame aria-hidden="true" className={cn('size-6', currentStreak > 0 && 'animate-pulse')} />
            </span>
            <div>
              <p className="font-data text-22 font-semibold leading-none text-ink">
                {plural(currentStreak, 'día', 'días')}
              </p>
              <p className="mt-1 text-12 text-inkSoft">racha actual de días hábiles</p>
            </div>
          </div>
          <p className="text-13 text-inkSoft">
            Mejor racha: <span className="font-data font-semibold text-ink">{plural(bestStreak, 'día', 'días')}</span>
          </p>
        </div>

        <ul aria-label="Insignias" className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
          {badges.map((badge) => (
            <BadgeTile key={badge.id} badge={badge} />
          ))}
        </ul>
      </div>
      <Celebration badges={fresh} />
    </Section>
  )
}

/** Logros del estudiante autenticado a partir de su libro de horas local. */
export function StudentAchievements({
  logs,
  requiredHours,
}: {
  logs: LocalHourLog[] | undefined
  requiredHours: number
}) {
  const { user } = useAuth()
  const achievements = useMemo(() => computeAchievements(logs, requiredHours), [logs, requiredHours])
  return <AchievementsPanel achievements={achievements} userId={user?.id} />
}
