import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '@/api/client'
import { type Offer, listOffers } from '@/api/offers'
import { ListEmpty, ListToolbar, Pagination } from '@/components/ListControls'
import { OfferCard, OfferGrid } from '@/components/OfferCard'
import { PageHeader } from '@/components/PageHeader'
import { RecommendedOffers } from '@/components/RecommendedOffers'
import { AsyncSection, EmptyState, Panel } from '@/components/Panel'
import { Button } from '@/components/ui/button'
import { parseLocalDate } from '@/lib/date'
import { useListing } from '@/lib/useListing'
import { plural } from '@/lib/utils'

const MODALITY_LABEL: Record<string, string> = {
  PRESENCIAL: 'Presencial',
  HIBRIDA: 'Híbrida',
  REMOTA: 'Remota',
}

function formatDate(dateValue: string): string {
  const parsed = parseLocalDate(dateValue)
  if (Number.isNaN(parsed.getTime())) return dateValue
  return new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }).format(parsed)
}

function formatPeriod(periodStart: string, periodEnd: string): string {
  return `${formatDate(periodStart)} – ${formatDate(periodEnd)}`
}

function OffersList({ offers }: { offers: Offer[] }) {
  return (
    <OfferGrid>
      {offers.map((offer) => (
        <OfferCard
          key={offer.id}
          title={offer.title}
          subtitle={offer.company.name}
          tags={[
            MODALITY_LABEL[offer.modality] ?? offer.modality,
            plural(offer.seats, 'cupo', 'cupos'),
            `${offer.requiredHours} h`,
          ]}
          description={offer.description}
          meta={formatPeriod(offer.periodStart, offer.periodEnd)}
          actions={
            <Button asChild size="sm">
              <Link to={`/ofertas/${offer.id}`}>Ver y postular</Link>
            </Button>
          }
        />
      ))}
    </OfferGrid>
  )
}

export function OffersPage() {
  const [offers, setOffers] = useState<Offer[] | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    listOffers()
      .then((data) => {
        if (!cancelled) setOffers(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : 'No se pudieron cargar las ofertas')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const modalities = useMemo(
    () => (offers ? Array.from(new Set(offers.map((offer) => offer.modality))).sort() : []),
    [offers],
  )

  const listing = useListing(offers, {
    searchText: (offer) => `${offer.title} ${offer.company.name} ${offer.description}`,
    filters: { modalidad: (offer, value) => offer.modality === value },
  })

  return (
    <>
      <PageHeader
        title="Ofertas de práctica"
        subtitle="Publicadas por empresas con convenio y aprobadas por la coordinación."
      />

      <RecommendedOffers />

      {offers && offers.length > 0 ? (
        <ListToolbar
          listing={listing}
          searchPlaceholder="Buscar por puesto, empresa o descripción"
          filters={[
            {
              name: 'modalidad',
              label: 'Modalidad',
              options: modalities.map((m) => ({ value: m, label: MODALITY_LABEL[m] ?? m })),
            },
          ]}
        />
      ) : null}

      <AsyncSection
        error={error}
        data={listing.pageItems}
        loadingLabel="Cargando ofertas…"
        empty={
          <ListEmpty listing={listing}>
            <EmptyState
              title="No hay ofertas publicadas para este periodo"
              description="Vuelve a revisar más adelante."
            />
          </ListEmpty>
        }
      >
        {(items) => (
          <>
            <OffersList offers={items} />
            <Panel>
              <Pagination listing={listing} noun={['oferta', 'ofertas']} />
            </Panel>
          </>
        )}
      </AsyncSection>
    </>
  )
}
