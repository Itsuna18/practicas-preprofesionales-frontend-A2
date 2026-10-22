import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'
import { ApiError } from '@/api/client'
import { type RecommendationsResponse, type RecommendedOffer, getRecommendedOffers } from '@/api/profile'
import { Tag } from '@/components/Chip'
import { LoadingState, Section } from '@/components/Panel'
import { Button } from '@/components/ui/button'
import { cn, plural } from '@/lib/utils'

const MODALITY_LABEL: Record<string, string> = {
  PRESENCIAL: 'Presencial',
  HIBRIDA: 'Híbrida',
  REMOTA: 'Remota',
}

function MatchRing({ value }: { value: number }) {
  // Anillo SVG: el trazo recorre la circunferencia según el porcentaje.
  const radius = 18
  const circumference = 2 * Math.PI * radius
  return (
    <div className="relative size-12 flex-none" role="img" aria-label={`${value}% de coincidencia`}>
      <svg viewBox="0 0 44 44" className="size-12 -rotate-90" aria-hidden="true">
        <circle cx="22" cy="22" r={radius} fill="none" strokeWidth="4" className="stroke-paperRule" />
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          className="stroke-stamp transition-[stroke-dashoffset] duration-700 ease-out"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - value / 100)}
        />
      </svg>
      <span aria-hidden="true" className="absolute inset-0 flex items-center justify-center font-data text-11 font-semibold text-ink">
        {value}%
      </span>
    </div>
  )
}

function RecommendationCard({ item, index }: { item: RecommendedOffer; index: number }) {
  const { offer } = item
  return (
    <article
      className="flex flex-col gap-3 rounded-xl border border-line bg-surface px-5 py-[18px] transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-stamp animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start gap-3">
        <MatchRing value={item.match} />
        <div className="min-w-0">
          <h3 className="font-display text-15 font-bold leading-snug text-ink">{offer.title}</h3>
          <p className="mt-0.5 text-13 text-inkMid">
            {offer.company.name} · {offer.company.sector}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Tag>{MODALITY_LABEL[offer.modality] ?? offer.modality}</Tag>
        <Tag>{item.seatsLeft > 0 ? plural(item.seatsLeft, 'cupo libre', 'cupos libres') : 'Sin cupos'}</Tag>
      </div>

      <ul className="flex flex-col gap-1 text-13 text-inkDeep">
        {item.reasons.map((reason) => (
          <li key={reason} className="flex gap-2">
            <span aria-hidden="true" className={cn('mt-[7px] size-1.5 flex-none rounded-full', reason.startsWith('Sin cupos') ? 'bg-dotPending' : 'bg-stamp')} />
            {reason}
          </li>
        ))}
      </ul>

      <div className="mt-auto flex justify-end border-t border-paperRule pt-3">
        <Button asChild size="sm">
          <Link to={`/ofertas/${offer.id}`}>Ver y postular</Link>
        </Button>
      </div>
    </article>
  )
}

/** Ofertas recomendadas según la carrera, los intereses y la modalidad del estudiante. */
export function RecommendedOffers() {
  const [data, setData] = useState<RecommendationsResponse | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    getRecommendedOffers()
      .then((result) => {
        if (!cancelled) setData(result)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'No se pudieron cargar las recomendaciones')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const title = (
    <span className="flex items-center gap-2">
      <Sparkles aria-hidden="true" className="size-4 text-stamp" />
      Recomendadas para ti
    </span>
  )
  const aside = (
    <Link to="/perfil" className="text-13 font-semibold text-stamp hover:underline">
      Editar mi perfil
    </Link>
  )

  if (error) {
    return (
      <Section title={title} aside={aside}>
        <p className="px-[18px] py-4 text-13 text-inkSoft">{error}</p>
      </Section>
    )
  }

  if (!data) {
    return (
      <Section title={title} aside={aside}>
        <LoadingState>Buscando ofertas para ti…</LoadingState>
      </Section>
    )
  }

  if (!data.profileComplete) {
    return (
      <Section title={title}>
        <div className="flex flex-wrap items-center justify-between gap-3 px-[18px] py-4">
          <p className="max-w-md text-14 text-inkDeep">
            Cuéntanos tu carrera y tus intereses y te mostramos primero las ofertas que más encajan contigo.
          </p>
          <Button asChild size="sm">
            <Link to="/perfil">Completar mi perfil</Link>
          </Button>
        </div>
      </Section>
    )
  }

  return (
    <Section title={title} aside={aside}>
      {data.recommendations.length === 0 ? (
        <p className="px-[18px] py-4 text-13 text-inkSoft">
          Por ahora ninguna oferta abierta coincide con tu perfil. Prueba a sumar intereses.
        </p>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3 p-3">
          {data.recommendations.map((item, index) => (
            <RecommendationCard key={item.offerId} item={item} index={index} />
          ))}
        </div>
      )}
    </Section>
  )
}
