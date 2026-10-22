import { type CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { HelpCircle } from 'lucide-react'
import { useAuth } from '@/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { TOUR_STEPS, type TourStep, hasSeenTour, markTourSeen } from '@/lib/tour'
import { cn } from '@/lib/utils'

const PADDING = 6
const CARD_WIDTH = 320
const GAP = 12

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

function findTarget(step: TourStep): HTMLElement | null {
  if (!step.target) return null
  // Puede haber varios (por ejemplo, la navegación en móvil y en escritorio): se usa el visible.
  const all = Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${step.target}"]`))
  return all.find((el) => el.getClientRects().length > 0) ?? all[0] ?? null
}

function measure(step: TourStep): Rect | null {
  const el = findTarget(step)
  if (!el) return null
  const r = el.getBoundingClientRect()
  if (r.width === 0 && r.height === 0) return null
  return { top: r.top - PADDING, left: r.left - PADDING, width: r.width + PADDING * 2, height: r.height + PADDING * 2 }
}

/** Tarjeta debajo del elemento si cabe; si no, encima. Siempre dentro de la pantalla. */
function cardPosition(rect: Rect | null): CSSProperties {
  if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
  const width = Math.min(CARD_WIDTH, window.innerWidth - 24)
  const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12)
  const below = rect.top + rect.height + GAP
  if (below + 180 < window.innerHeight) return { top: below, left, width }
  return { bottom: window.innerHeight - rect.top + GAP, left, width }
}

interface TourOverlayProps {
  steps: TourStep[]
  onFinish: () => void
}

function TourOverlay({ steps, onFinish }: TourOverlayProps) {
  const [index, setIndex] = useState(0)
  const [rect, setRect] = useState<Rect | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const step = steps[index]
  const last = index === steps.length - 1

  const update = useCallback(() => {
    findTarget(step)?.scrollIntoView?.({ block: 'nearest' })
    setRect(measure(step))
  }, [step])

  useLayoutEffect(update, [update])

  useEffect(() => {
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [update])

  useEffect(() => {
    cardRef.current?.focus()
  }, [index])

  const next = useCallback(() => (last ? onFinish() : setIndex((i) => i + 1)), [last, onFinish])
  const back = useCallback(() => setIndex((i) => Math.max(0, i - 1)), [])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onFinish()
      if (event.key === 'ArrowRight') next()
      if (event.key === 'ArrowLeft') back()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [next, back, onFinish])

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Foco: un recorte con una sombra enorme oscurece el resto de la pantalla. */}
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none fixed rounded-xl transition-all duration-300 ease-in-out',
          rect ? 'shadow-[0_0_0_9999px_hsl(var(--scrim)/0.6)] ring-2 ring-stamp' : 'inset-0 bg-[hsl(var(--scrim)/0.6)]',
        )}
        style={rect ? { top: rect.top, left: rect.left, width: rect.width, height: rect.height } : undefined}
      />

      <div
        ref={cardRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tour-title"
        aria-describedby="tour-body"
        tabIndex={-1}
        key={index}
        className="fixed flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5 shadow-[0_24px_60px_-20px_hsl(var(--scrim)/0.6)] outline-none animate-in fade-in zoom-in-95 duration-200"
        style={{ width: CARD_WIDTH, maxWidth: 'calc(100vw - 24px)', ...cardPosition(rect) }}
      >
        <p className="font-data text-11 uppercase tracking-[0.07em] text-inkMute">
          Paso {index + 1} de {steps.length}
        </p>
        <h2 id="tour-title" className="font-display text-17 font-bold text-ink">
          {step.title}
        </h2>
        <p id="tour-body" className="text-14 leading-relaxed text-inkDeep">
          {step.body}
        </p>

        <div className="flex items-center gap-1.5" aria-hidden="true">
          {steps.map((_, i) => (
            <span
              key={i}
              className={cn('h-1.5 rounded-full transition-all duration-300', i === index ? 'w-5 bg-stamp' : 'w-1.5 bg-line')}
            />
          ))}
        </div>

        <div className="mt-1 flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={onFinish}>
            Saltar
          </Button>
          <div className="ml-auto flex gap-2">
            {index > 0 ? (
              <Button type="button" variant="outline" size="sm" onClick={back}>
                Atrás
              </Button>
            ) : null}
            <Button type="button" size="sm" onClick={next}>
              {last ? 'Terminar' : 'Siguiente'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Tour de bienvenida según el rol. Se abre solo la primera vez que la persona
 * entra en este navegador y se puede repetir con el botón de ayuda.
 */
export function TourGuide() {
  const { user, role } = useAuth()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!user || !role || hasSeenTour(user.id)) return
    // Pequeña espera para que la pantalla termine de pintarse y los elementos existan.
    const timer = setTimeout(() => setOpen(true), 600)
    return () => clearTimeout(timer)
  }, [user, role])

  const finish = useCallback(() => {
    if (user) markTourSeen(user.id)
    setOpen(false)
  }, [user])

  if (!user || !role) return null

  return (
    <>
      <button
        type="button"
        data-tour="tour-replay"
        onClick={() => setOpen(true)}
        aria-label="Ver el tour de bienvenida"
        title="Ver el tour"
        className="flex size-9 flex-none items-center justify-center rounded-full border border-line bg-surface text-inkBody transition-all duration-200 ease-in-out hover:border-stamp hover:text-ink active:scale-95"
      >
        <HelpCircle aria-hidden="true" className="size-[18px]" />
      </button>
      {/* Al <body> con un portal: la cabecera tiene backdrop-filter, que vuelve a
          la cabecera el marco de los elementos `fixed` de adentro; sin el portal,
          la tarjeta de los pasos de abajo (Sincronización) quedaba fuera de la
          pantalla y el tour se trababa. */}
      {open ? createPortal(<TourOverlay steps={TOUR_STEPS[role]} onFinish={finish} />, document.body) : null}
    </>
  )
}
