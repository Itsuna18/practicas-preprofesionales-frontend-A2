import type { Config } from 'tailwindcss'
import tailwindcssAnimate from 'tailwindcss-animate'

export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      borderRadius: {
        DEFAULT: '10px',
        sm: '7px',
        md: '9px',
        lg: '12px',
        xl: '14px',
        '2xl': '16px',
      },
      fontSize: {
        '11': '0.6875rem',
        '12': '0.75rem',
        '13': '0.8125rem',
        '14': '0.875rem',
        '15': '0.9375rem',
        '16': '1rem',
        '17': '1.0625rem',
        '19': '1.1875rem',
        '20': '1.25rem',
        '22': '1.375rem',
        '26': '1.625rem',
        '28': '1.75rem',
        '40': '2.5rem',
      },
      colors: {
        background: 'hsl(var(--paper))',
        foreground: 'hsl(var(--ink))',
        card: {
          DEFAULT: 'hsl(var(--surface))',
          foreground: 'hsl(var(--ink))',
        },
        popover: {
          DEFAULT: 'hsl(var(--surface))',
          foreground: 'hsl(var(--ink))',
        },
        primary: {
          DEFAULT: 'hsl(var(--stamp))',
          foreground: 'hsl(var(--surface))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--soft))',
          foreground: 'hsl(var(--ink-body))',
        },
        muted: {
          DEFAULT: 'hsl(var(--soft))',
          foreground: 'hsl(var(--ink-soft))',
        },
        accent: {
          DEFAULT: 'hsl(var(--pill-hover))',
          foreground: 'hsl(var(--ink))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--void))',
          foreground: 'hsl(var(--surface))',
        },
        border: 'hsl(var(--line))',
        input: 'hsl(var(--line))',
        ring: 'hsl(var(--stamp))',

        // Vocabulario propio del sistema
        paper: 'hsl(var(--paper))',
        paperRule: 'hsl(var(--paper-rule))',
        surface: 'hsl(var(--surface))',
        well: 'hsl(var(--well))',
        soft: 'hsl(var(--soft))',
        hero: 'hsl(var(--hero))',
        line: 'hsl(var(--line))',
        ink: 'hsl(var(--ink))',
        inkDeep: 'hsl(var(--ink-deep))',
        inkBody: 'hsl(var(--ink-body))',
        inkMid: 'hsl(var(--ink-mid))',
        inkSoft: 'hsl(var(--ink-soft))',
        inkMute: 'hsl(var(--ink-mute))',
        stamp: 'hsl(var(--stamp))',
        pending: 'hsl(var(--pending))',
        void: 'hsl(var(--void))',
        chipStamp: 'hsl(var(--chip-stamp))',
        chipPending: 'hsl(var(--chip-pending))',
        chipVoid: 'hsl(var(--chip-void))',
        dotPending: 'hsl(var(--dot-pending))',
        dotVoid: 'hsl(var(--dot-void))',
        navHover: 'hsl(var(--nav-hover))',
        pillHover: 'hsl(var(--pill-hover))',
        badgeSoft: 'hsl(var(--badge-soft))',
      },
      height: {
        topbar: '60px',
        control: '38px',
        field: '42px',
        row: '58px',
      },
      width: {
        sidebar: '230px',
      },
      keyframes: {
        // La barra de progreso crece desde la izquierda al aparecer.
        'progress-grow': { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
        // Brillo que recorre los esqueletos de carga.
        shimmer: { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
        // Insignia recién desbloqueada.
        'pop-in': { '0%': { transform: 'scale(0.6)', opacity: '0' }, '70%': { transform: 'scale(1.08)', opacity: '1' }, '100%': { transform: 'scale(1)' } },
        // Formas decorativas que flotan despacio (login, estados vacíos).
        float: { '0%, 100%': { transform: 'translate3d(0, 0, 0)' }, '50%': { transform: 'translate3d(0, -14px, 0)' } },
        drift: { '0%, 100%': { transform: 'translate3d(0, 0, 0) scale(1)' }, '33%': { transform: 'translate3d(30px, -24px, 0) scale(1.08)' }, '66%': { transform: 'translate3d(-22px, 18px, 0) scale(0.95)' } },
        // Degradado que se desplaza lentamente en el panel de marca.
        'gradient-pan': { '0%, 100%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' } },
        // Sacudida corta del formulario cuando el acceso falla.
        shake: { '0%, 100%': { transform: 'translateX(0)' }, '20%, 60%': { transform: 'translateX(-6px)' }, '40%, 80%': { transform: 'translateX(6px)' } },
        // Barra de acento que se dibuja sobre el título de cada pantalla.
        'grow-x': { from: { transform: 'scaleX(0)' }, to: { transform: 'scaleX(1)' } },
      },
      animation: {
        'progress-grow': 'progress-grow 700ms cubic-bezier(0.22, 1, 0.36, 1) both',
        shimmer: 'shimmer 1.6s linear infinite',
        'pop-in': 'pop-in 450ms cubic-bezier(0.22, 1, 0.36, 1) both',
        float: 'float 6s ease-in-out infinite',
        drift: 'drift 18s ease-in-out infinite',
        'gradient-pan': 'gradient-pan 14s ease infinite',
        shake: 'shake 420ms ease-in-out',
        'grow-x': 'grow-x 600ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config
