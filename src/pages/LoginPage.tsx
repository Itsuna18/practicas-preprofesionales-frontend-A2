import { type FormEvent, type ReactNode, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bot,
  CloudOff,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  Trophy,
  type LucideIcon,
} from 'lucide-react'
import { ApiError } from '@/api/client'
import { useAuth } from '@/auth/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface Feature {
  icon: LucideIcon
  title: string
  body: string
}

export const FEATURES: Feature[] = [
  { icon: CloudOff, title: 'Registra horas sin conexión', body: 'Se guardan en tu dispositivo y se sincronizan solas al volver la señal.' },
  { icon: Sparkles, title: 'Ofertas a tu medida', body: 'Recomendaciones según tu carrera, tus intereses y la modalidad que prefieres.' },
  { icon: Bot, title: 'Asistente con IA', body: 'Pregúntale cuántas horas te faltan o cómo acreditar tu práctica.' },
  { icon: Trophy, title: 'Rachas e insignias', body: 'Celebra cada semana completa y cada meta de horas que alcanzas.' },
]

const ROTATE_MS = 4000

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
}

/** Carrusel de lo que ofrece la plataforma. Se pausa al pasar el mouse o con el foco. */
function FeatureCarousel() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || prefersReducedMotion()) return
    const timer = setInterval(() => setIndex((i) => (i + 1) % FEATURES.length), ROTATE_MS)
    return () => clearInterval(timer)
  }, [paused])

  const feature = FEATURES[index]
  const Icon = feature.icon

  return (
    <div
      className="flex flex-col gap-4"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div
        key={index}
        className="flex min-h-[112px] items-start gap-4 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md animate-in fade-in slide-in-from-right-4 duration-500"
      >
        <span className="flex size-11 flex-none items-center justify-center rounded-xl bg-white/15">
          <Icon aria-hidden="true" className="size-5 text-white" />
        </span>
        <div>
          <p className="font-display text-17 font-semibold text-white">{feature.title}</p>
          <p className="mt-1 text-14 leading-relaxed text-white/80">{feature.body}</p>
        </div>
      </div>
      <div className="flex gap-2" role="group" aria-label="Funciones de la plataforma">
        {FEATURES.map((f, i) => (
          <button
            key={f.title}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Ver: ${f.title}`}
            aria-pressed={i === index}
            className={cn(
              'h-1.5 rounded-full transition-all duration-300 ease-out',
              i === index ? 'w-8 bg-white' : 'w-3 bg-white/40 hover:bg-white/70',
            )}
          />
        ))}
      </div>
    </div>
  )
}

/** Formas difusas que flotan detrás del contenido del panel de marca. */
function FloatingShapes() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <span className="absolute -left-16 top-10 size-72 rounded-full bg-sky-400/30 blur-3xl animate-drift" />
      <span className="absolute -right-10 bottom-0 size-80 rounded-full bg-indigo-400/25 blur-3xl animate-drift [animation-delay:-6s]" />
      <span className="absolute left-1/3 top-1/2 size-56 rounded-full bg-cyan-300/20 blur-3xl animate-drift [animation-delay:-12s]" />
      {/* Cuadrícula sutil que se desvanece hacia los bordes. */}
      <span className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.06)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_75%)]" />
    </div>
  )
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className={cn(
          'relative block size-7 rotate-6 rounded-lg shadow-lg transition-transform duration-300 hover:rotate-0',
          light ? 'bg-white' : 'bg-gradient-to-br from-stamp to-sky-500',
        )}
      >
        <span className={cn('absolute inset-1.5 rounded-[4px]', light ? 'bg-[#0E3A6B]' : 'bg-surface/30')} />
      </span>
      <span className={cn('font-display text-19 font-bold tracking-[-0.02em]', light ? 'text-white' : 'text-ink')}>
        prácticas.
      </span>
    </div>
  )
}

/** Panel de marca: degradado animado, formas que flotan y el carrusel de funciones. */
function BrandPanel() {
  return (
    <aside className="relative hidden overflow-hidden bg-[linear-gradient(135deg,#0B2545_0%,#0E3A6B_35%,#13509A_65%,#0B6E99_100%)] bg-[length:200%_200%] animate-gradient-pan lg:flex lg:w-[52%] lg:flex-col lg:justify-between lg:p-12">
      <FloatingShapes />
      <div className="relative animate-in fade-in slide-in-from-top-2 duration-500">
        <Logo light />
      </div>
      <div className="relative flex max-w-md flex-col gap-8">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <h2 className="font-display text-40 font-bold leading-[1.05] tracking-[-0.03em] text-white">
            Tu práctica preprofesional, <span className="bg-gradient-to-r from-sky-300 to-cyan-200 bg-clip-text text-transparent">en un solo lugar</span>.
          </h2>
          <p className="mt-4 text-16 leading-relaxed text-white/80">
            Estudiantes, tutores, empresas y coordinación trabajando sobre la misma información, con o sin señal.
          </p>
        </div>
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 [animation-delay:150ms] fill-mode-both">
          <FeatureCarousel />
        </div>
      </div>
      <p className="relative text-12 text-white/60">Universidad · Unidad de vinculación</p>
    </aside>
  )
}

/** Franja de marca para pantallas angostas, donde no entra el panel lateral. */
function MobileBrand() {
  return (
    <div className="relative overflow-hidden bg-[linear-gradient(135deg,#0B2545_0%,#0E3A6B_45%,#0B6E99_100%)] bg-[length:200%_200%] px-6 pb-10 pt-8 animate-gradient-pan lg:hidden">
      <FloatingShapes />
      <div className="relative flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 duration-500">
        <Logo light />
        <p className="max-w-xs text-14 text-white/80">Tu práctica preprofesional, en un solo lugar. Con o sin señal.</p>
      </div>
    </div>
  )
}

function Field({ id, label, icon: Icon, delay, children }: { id: string; label: string; icon: LucideIcon; delay: string; children: ReactNode }) {
  return (
    <div className={cn('flex flex-col gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both', delay)}>
      <Label htmlFor={id}>{label}</Label>
      <div className="group relative">
        <Icon aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-inkMute transition-colors group-focus-within:text-stamp" />
        {children}
      </div>
    </div>
  )
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const msg = sessionStorage.getItem('session_expired_message')
      if (msg) {
        sessionStorage.removeItem('session_expired_message')
        return msg
      }
    }
    return null
  })
  const [attempt, setAttempt] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'no se pudo iniciar sesión')
      // Cambia la clave del formulario para repetir la sacudida en cada intento fallido.
      setAttempt((n) => n + 1)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-paper lg:flex-row">
      <BrandPanel />
      <MobileBrand />

      <main className="relative -mt-6 flex flex-1 items-center justify-center rounded-t-3xl bg-paper px-5 py-10 lg:mt-0 lg:rounded-none lg:px-12">
        <div className="absolute right-5 top-5 animate-in fade-in duration-500">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-[420px]">
          <div className="animate-in fade-in slide-in-from-bottom-3 duration-500">
            <p className="font-data text-12 uppercase tracking-[0.12em] text-stamp">Bienvenido de vuelta</p>
            <h1 className="mt-2 font-display text-28 font-bold tracking-[-0.02em] text-ink">Entrá a tu cuenta</h1>
            <p className="mt-1.5 text-14 text-inkMid">Con el correo institucional que te dio la unidad de vinculación.</p>
          </div>

          <form
            key={attempt}
            className={cn('mt-8 flex flex-col gap-5', attempt > 0 && error && 'animate-shake')}
            onSubmit={handleSubmit}
            noValidate
          >
            <Field id="email" label="Correo institucional" icon={Mail} delay="[animation-delay:100ms]">
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                placeholder="nombre@miyura.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="h-12 rounded-xl pl-10"
              />
            </Field>

            <Field id="password" label="Contraseña" icon={Lock} delay="[animation-delay:200ms]">
              <Input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="h-12 rounded-xl pl-10 pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
                className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg text-inkSoft transition-colors hover:bg-pillHover hover:text-ink"
              >
                {showPassword ? <EyeOff aria-hidden="true" className="size-4" /> : <Eye aria-hidden="true" className="size-4" />}
              </button>
            </Field>

            {error ? (
              <p role="alert" className="rounded-xl bg-chipVoid px-3.5 py-3 text-13 text-void animate-in fade-in slide-in-from-top-1 duration-300">
                {error}
              </p>
            ) : null}

            <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both [animation-delay:300ms]">
              <Button
                type="submit"
                size="lg"
                disabled={submitting}
                className="group h-12 w-full rounded-xl bg-gradient-to-r from-stamp to-sky-600 text-15 shadow-[0_10px_30px_-12px_hsl(var(--stamp)/0.7)] hover:shadow-[0_14px_34px_-12px_hsl(var(--stamp)/0.9)] dark:to-sky-400"
              >
                {submitting ? (
                  <>
                    <Loader2 aria-hidden="true" className="animate-spin" />
                    Entrando…
                  </>
                ) : (
                  <>
                    Entrar
                    <ArrowRight aria-hidden="true" className="transition-transform duration-200 group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <p className="mt-8 text-center text-12 text-inkSoft animate-in fade-in duration-700 fill-mode-both [animation-delay:400ms]">
            Funciona sin conexión una vez que entraste por primera vez.
          </p>
        </div>
      </main>
    </div>
  )
}
