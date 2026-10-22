import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: ReactNode
  subtitle?: ReactNode
  /** Botonera de la derecha: la acción primaria va última. */
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, subtitle, actions, className }: PageHeaderProps) {
  return (
    <header className={cn('flex flex-wrap items-end justify-between gap-x-5 gap-y-3', className)}>
      <div className="min-w-0">
        {/* Barra de acento que se dibuja al entrar a cada pantalla. */}
        <span aria-hidden="true" className="mb-3 block h-1 w-10 origin-left rounded-full bg-gradient-to-r from-stamp to-sky-400 animate-grow-x" />
        <h1 className="font-display text-26 font-bold tracking-[-0.02em] text-ink animate-in fade-in slide-in-from-left-2 duration-500">
          {title}
        </h1>
        {subtitle ? (
          <p className="mt-1 text-14 text-inkMid animate-in fade-in duration-700 fill-mode-both [animation-delay:120ms]">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-500">{actions}</div>
      ) : null}
    </header>
  )
}
