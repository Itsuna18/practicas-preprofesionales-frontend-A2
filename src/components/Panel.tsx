import type { ReactNode } from 'react'
import { Inbox, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PanelProps {
  /** Barra superior del panel, separada por una regla. */
  toolbar?: ReactNode
  children: ReactNode
  className?: string
}

/** Contenedor blanco de esquinas grandes: la caja base de listados y tablas. */
export function Panel({ toolbar, children, className }: PanelProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-2xl border border-line/60 bg-surface shadow-[0_1px_3px_hsl(var(--scrim)/0.06)] transition-shadow duration-300 hover:shadow-[0_8px_28px_-14px_hsl(var(--scrim)/0.25)]',
        className,
      )}
    >
      {toolbar ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-paperRule px-[18px] py-3.5">
          {toolbar}
        </div>
      ) : null}
      {children}
    </div>
  )
}

interface SectionProps {
  title: ReactNode
  /** Dato o enlace alineado a la derecha del título. */
  aside?: ReactNode
  children: ReactNode
  className?: string
}

/** Panel con cabecera de sección: título a la izquierda, dato a la derecha. */
export function Section({ title, aside, children, className }: SectionProps) {
  return (
    <Panel className={className}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-paperRule px-[18px] py-3.5">
        <h2 className="font-display text-15 font-semibold text-ink">{title}</h2>
        {aside}
      </div>
      {children}
    </Panel>
  )
}

/**
 * Reparto y aire de una fila de listado, compartido por todas las tablas que
 * no llevan canalón de sincronización.
 */
export const rowClass =
  'flex min-h-row flex-col justify-center gap-1 px-[18px] py-2.5 transition-colors hover:bg-well sm:flex-row sm:items-center sm:gap-3'

/** Fila de cabecera de una tabla sin canalón. */
export function TableHeaderRow({ children }: { children: ReactNode }) {
  return <div className="hidden items-center gap-3 px-[18px] py-2.5 sm:flex">{children}</div>
}

interface EmptyStateProps {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  /** Ícono de la ilustración; por defecto, una bandeja vacía. */
  icon?: LucideIcon
}

export function EmptyState({ title, description, action, icon: Icon = Inbox }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-5 py-14 text-center animate-in fade-in zoom-in-95 duration-500">
      <span aria-hidden="true" className="relative mb-3 flex size-16 items-center justify-center">
        <span className="absolute inset-0 rounded-full bg-chipStamp" />
        <span className="absolute inset-0 rounded-full bg-chipStamp opacity-60 animate-ping [animation-duration:2.4s] [animation-iteration-count:2]" />
        <Icon className="relative size-7 text-stamp animate-float" />
      </span>
      <p className="font-display text-16 font-semibold text-ink">{title}</p>
      {description ? <p className="text-14 text-inkMid">{description}</p> : null}
      {action ? <div className="mt-3">{action}</div> : null}
    </div>
  )
}

/** Mensaje de error de carga, con el mismo aire que el estado vacío. */
export function ErrorState({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="px-5 py-14 text-center text-14 text-void">
      {children}
    </p>
  )
}

const SKELETON_BAR =
  'h-3 rounded-full bg-[linear-gradient(90deg,hsl(var(--soft))_0%,hsl(var(--well))_50%,hsl(var(--soft))_100%)] bg-[length:200%_100%] animate-shimmer'

/** Esqueleto con brillo mientras carga; el texto lo anuncian los lectores de pantalla. */
export function LoadingState({ children }: { children: ReactNode }) {
  return (
    <div role="status" className="flex flex-col items-center gap-3 px-5 py-12">
      <div aria-hidden="true" className="flex w-full max-w-sm flex-col gap-2.5">
        <span className={`${SKELETON_BAR} w-3/4`} />
        <span className={`${SKELETON_BAR} w-full`} />
        <span className={`${SKELETON_BAR} w-5/6`} />
      </div>
      <p className="text-center text-14 text-inkSoft">{children}</p>
    </div>
  )
}

interface AsyncSectionProps<T> {
  /** Mensaje de error de carga; tiene prioridad sobre el resto. */
  error?: string | null
  /** `undefined` mientras carga, arreglo vacío cuando no hay nada. */
  data: T[] | undefined
  loadingLabel: ReactNode
  empty: ReactNode
  children: (data: T[]) => ReactNode
}

/**
 * Resuelve los cuatro estados de un listado — error, cargando, vacío y con
 * datos — para que cada pantalla no repita la misma escalera de ternarios.
 * Los tres primeros van dentro de su propio panel; el contenido decide su
 * envoltorio.
 */
export function AsyncSection<T>({
  error,
  data,
  loadingLabel,
  empty,
  children,
}: AsyncSectionProps<T>) {
  if (error) {
    return (
      <Panel>
        <ErrorState>{error}</ErrorState>
      </Panel>
    )
  }
  if (data === undefined) {
    return (
      <Panel>
        <LoadingState>{loadingLabel}</LoadingState>
      </Panel>
    )
  }
  if (data.length === 0) return <Panel>{empty}</Panel>
  return <>{children(data)}</>
}
