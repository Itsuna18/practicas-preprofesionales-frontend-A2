import { type ReactNode, useId } from 'react'
import { ChevronLeft, ChevronRight, Search, SearchX, X } from 'lucide-react'
import { EmptyState } from '@/components/Panel'
import { Button } from '@/components/ui/button'
import { pageWindow } from '@/lib/listing'
import { PAGE_SIZES, type Listing } from '@/lib/useListing'
import { cn } from '@/lib/utils'

const CONTROL =
  'h-control rounded-lg border border-line bg-surface text-14 text-ink transition-colors duration-200 hover:border-stamp/40 focus-visible:border-stamp focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-stamp/25'

export interface FilterOption {
  value: string
  label: string
}

export interface ListFilter {
  name: string
  label: string
  options: FilterOption[]
}

function SearchField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="relative min-w-[200px] flex-1">
      <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-inkMute" />
      <input
        type="search"
        role="searchbox"
        aria-label={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(CONTROL, 'w-full pl-9 pr-9 placeholder:text-inkMute [&::-webkit-search-cancel-button]:hidden')}
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Borrar búsqueda"
          className="absolute right-2 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-md text-inkSoft transition-colors hover:bg-pillHover hover:text-ink"
        >
          <X aria-hidden="true" className="size-3.5" />
        </button>
      ) : null}
    </div>
  )
}

function FilterSelect({ filter, value, onChange }: { filter: ListFilter; value: string; onChange: (v: string) => void }) {
  const id = useId()
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-13 text-inkSoft">
        {filter.label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(CONTROL, 'px-3', value && 'border-stamp text-stamp')}
      >
        <option value="">Todos</option>
        {filter.options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}

interface ListToolbarProps<T> {
  listing: Listing<T>
  searchPlaceholder?: string
  filters?: ListFilter[]
  /** Controles propios de la pantalla (por ejemplo, el periodo del acta). */
  children?: ReactNode
}

/** Barra de búsqueda y filtros, igual en todas las pantallas. */
export function ListToolbar<T>({ listing, searchPlaceholder, filters = [], children }: ListToolbarProps<T>) {
  return (
    <div role="search" className="flex flex-wrap items-center gap-2.5 animate-in fade-in duration-300">
      {searchPlaceholder ? (
        <SearchField value={listing.query} onChange={listing.setQuery} placeholder={searchPlaceholder} />
      ) : null}
      {filters.map((filter) => (
        <FilterSelect
          key={filter.name}
          filter={filter}
          value={listing.filterValue(filter.name)}
          onChange={(value) => listing.setFilter(filter.name, value)}
        />
      ))}
      {children}
      {listing.hasActiveFilters ? (
        <Button type="button" variant="ghost" size="sm" onClick={listing.clear}>
          Limpiar filtros
        </Button>
      ) : null}
    </div>
  )
}

function summary(from: number, to: number, filteredCount: number, total: number, noun: [string, string]): string {
  if (filteredCount === 0) return `0 de ${total} ${noun[1]}`
  const range = `${from}–${to} de ${filteredCount} ${filteredCount === 1 ? noun[0] : noun[1]}`
  return filteredCount === total ? range : `${range} (filtrados de ${total})`
}

/** Paginación: resumen, páginas con «…», anterior/siguiente y tamaño de página. */
export function Pagination<T>({ listing, noun }: { listing: Listing<T>; noun: [string, string] }) {
  const { page, totalPages, from, to, filteredCount, total, pageSize, setPage, setPageSize } = listing
  if (total === 0) return null
  const sizeId = `page-size-${noun[1]}`

  return (
    <nav
      aria-label={`Paginación de ${noun[1]}`}
      className="flex flex-wrap items-center justify-between gap-3 border-t border-paperRule px-[18px] py-3"
    >
      <p className="font-data text-12 text-inkSoft" aria-live="polite">
        {summary(from, to, filteredCount, total, noun)}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <label htmlFor={sizeId} className="text-12 text-inkSoft">
            Por página
          </label>
          <select
            id={sizeId}
            value={pageSize}
            onChange={(event) => setPageSize(Number(event.target.value))}
            className={cn(CONTROL, 'h-8 px-2 text-13')}
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        {totalPages > 1 ? (
          <div className="flex items-center gap-1">
            <Button type="button" variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1} aria-label="Página anterior">
              <ChevronLeft aria-hidden="true" />
            </Button>
            {pageWindow(page, totalPages).map((item, index) =>
              item === '…' ? (
                <span key={`gap-${index}`} aria-hidden="true" className="px-1 text-13 text-inkMute">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPage(item)}
                  aria-label={`Página ${item}`}
                  aria-current={item === page ? 'page' : undefined}
                  className={cn(
                    'h-8 min-w-8 rounded-md px-2 font-data text-13 transition-all duration-200 active:scale-95',
                    item === page ? 'bg-stamp font-semibold text-surface' : 'text-inkBody hover:bg-pillHover hover:text-ink',
                  )}
                >
                  {item}
                </button>
              ),
            )}
            <Button type="button" variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages} aria-label="Página siguiente">
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        ) : null}
      </div>
    </nav>
  )
}

/** Cuando la búsqueda o los filtros no dejan nada. */
export function NoResults({ onClear }: { onClear: () => void }) {
  return (
    <EmptyState
      title="Nada coincide con tu búsqueda"
      description="Prueba con otras palabras o quita algún filtro."
      action={
        <Button type="button" size="sm" variant="outline" onClick={onClear}>
          <SearchX aria-hidden="true" />
          Limpiar filtros
        </Button>
      }
    />
  )
}
