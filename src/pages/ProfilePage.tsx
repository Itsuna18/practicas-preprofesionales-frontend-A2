import { type FormEvent, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check } from 'lucide-react'
import { ApiError } from '@/api/client'
import { type ProfileOptions, type StudentProfile, getProfile, updateProfile } from '@/api/profile'
import { PageHeader } from '@/components/PageHeader'
import { ErrorState, LoadingState, Section } from '@/components/Panel'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { useOnline } from '@/offline/hooks/useOnline'
import { cn } from '@/lib/utils'

const MODALITY_LABEL: Record<string, string> = {
  PRESENCIAL: 'Presencial',
  HIBRIDA: 'Híbrida',
  REMOTA: 'Remota',
}

function pillClass(active: boolean) {
  return cn(
    'inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-13 font-medium transition-all duration-200 ease-in-out active:scale-95',
    active
      ? 'border-stamp bg-chipStamp text-stamp'
      : 'border-line bg-surface text-inkBody hover:border-stamp hover:text-ink',
  )
}

interface ProfileFormProps {
  initial: StudentProfile
  options: ProfileOptions
}

function ProfileForm({ initial, options }: ProfileFormProps) {
  const online = useOnline()
  const [profile, setProfile] = useState<StudentProfile>(initial)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  function toggleInterest(interest: string) {
    setProfile((current) => ({
      ...current,
      interests: current.interests.includes(interest)
        ? current.interests.filter((item) => item !== interest)
        : [...current.interests, interest],
    }))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage(null)
    try {
      setProfile(await updateProfile(profile))
      setMessage({ tone: 'ok', text: 'Perfil guardado. Tus recomendaciones ya están al día.' })
    } catch (err) {
      setMessage({ tone: 'error', text: err instanceof ApiError ? err.message : 'No se pudo guardar el perfil' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 px-[18px] py-5">
      <div className="flex max-w-md flex-col gap-2">
        <Label htmlFor="career">Carrera</Label>
        <select
          id="career"
          value={profile.career ?? ''}
          onChange={(event) => setProfile({ ...profile, career: event.target.value || null })}
          className="h-field rounded border border-line bg-surface px-3 text-14 text-ink transition-colors focus-visible:border-stamp"
        >
          <option value="">Sin indicar</option>
          {options.careers.map((career) => (
            <option key={career} value={career}>
              {career}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-14 font-medium text-ink">Intereses</legend>
        <div className="flex flex-wrap gap-2">
          {options.interests.map((interest) => {
            const active = profile.interests.includes(interest)
            return (
              <button
                key={interest}
                type="button"
                aria-pressed={active}
                onClick={() => toggleInterest(interest)}
                className={pillClass(active)}
              >
                {active ? <Check aria-hidden="true" className="size-3.5" /> : null}
                {interest}
              </button>
            )
          })}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-14 font-medium text-ink">Modalidad que prefieres</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Modalidad que prefieres">
          {[null, ...options.modalities].map((modality) => {
            const active = profile.preferredModality === modality
            return (
              <button
                key={modality ?? 'ninguna'}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setProfile({ ...profile, preferredModality: modality })}
                className={pillClass(active)}
              >
                {modality ? (MODALITY_LABEL[modality] ?? modality) : 'Me da igual'}
              </button>
            )
          })}
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={saving || !online}>
          {saving ? 'Guardando…' : 'Guardar perfil'}
        </Button>
        <Button asChild variant="outline">
          <Link to="/ofertas">Ver mis recomendaciones</Link>
        </Button>
        {!online ? <span className="text-13 text-void">Necesitas conexión para guardar el perfil.</span> : null}
      </div>

      {message ? (
        <p
          role="status"
          className={cn('text-13 font-medium animate-in fade-in', message.tone === 'ok' ? 'text-stamp' : 'text-void')}
        >
          {message.text}
        </p>
      ) : null}
    </form>
  )
}

export function ProfilePage() {
  const [data, setData] = useState<{ profile: StudentProfile; options: ProfileOptions } | undefined>()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getProfile()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'No se pudo cargar tu perfil')
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <>
      <PageHeader
        title="Mi perfil"
        subtitle="Con tu carrera y tus intereses te recomendamos las ofertas que mejor encajan contigo."
      />
      <Section title="Perfil profesional">
        {error ? <ErrorState>{error}</ErrorState> : null}
        {!error && !data ? <LoadingState>Cargando tu perfil…</LoadingState> : null}
        {data ? <ProfileForm initial={data.profile} options={data.options} /> : null}
      </Section>
    </>
  )
}
