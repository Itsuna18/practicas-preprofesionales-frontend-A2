import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/lib/theme'
import { cn } from '@/lib/utils'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const dark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-pressed={dark}
      title={dark ? 'Modo claro' : 'Modo oscuro'}
      className={cn(
        'relative flex size-9 flex-none items-center justify-center overflow-hidden rounded-full border border-line bg-surface text-inkBody',
        'transition-all duration-200 ease-in-out hover:border-stamp hover:text-ink active:scale-95',
        className,
      )}
    >
      <Sun
        aria-hidden="true"
        className={cn(
          'absolute size-[18px] transition-all duration-300 ease-in-out',
          dark ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100',
        )}
      />
      <Moon
        aria-hidden="true"
        className={cn(
          'absolute size-[18px] transition-all duration-300 ease-in-out',
          dark ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0',
        )}
      />
    </button>
  )
}
