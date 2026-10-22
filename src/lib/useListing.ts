import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { matchesQuery, paginate, sanitizeSearch } from '@/lib/listing'

export interface ListingConfig<T> {
  /** Texto en el que busca la caja de búsqueda (nombre, título, actividad…). */
  searchText?: (item: T) => string
  /** Filtros por nombre: reciben el elemento y el valor elegido ('' = todos). */
  filters?: Record<string, (item: T, value: string) => boolean>
  /** Tamaño de página inicial. */
  pageSize?: number
}

export const PAGE_SIZES = [10, 20, 50]

export interface Listing<T> {
  query: string
  setQuery: (value: string) => void
  filterValue: (name: string) => string
  setFilter: (name: string, value: string) => void
  page: number
  setPage: (page: number) => void
  pageSize: number
  setPageSize: (size: number) => void
  /** Elementos de la página actual; `undefined` mientras los datos cargan. */
  pageItems: T[] | undefined
  /** Cuántos pasan la búsqueda y los filtros. */
  filteredCount: number
  total: number
  totalPages: number
  from: number
  to: number
  hasActiveFilters: boolean
  clear: () => void
}

/** Lee de la URL la búsqueda, la página, el tamaño y los filtros con valor. */
function readParams(params: URLSearchParams, filterNames: string[], defaultSize: number) {
  const sizeParam = Number(params.get('tamano'))
  return {
    // También se limpia lo que llega por la URL, por si el enlace se armó a mano.
    query: sanitizeSearch(params.get('q') ?? ''),
    page: Number(params.get('pagina') ?? '1'),
    pageSize: PAGE_SIZES.includes(sizeParam) ? sizeParam : defaultSize,
    activeFilters: filterNames.map((name) => [name, params.get(name) ?? ''] as const).filter(([, v]) => v),
  }
}

type ActiveFilters = (readonly [string, string])[]

function applyFilters<T>(items: T[], config: ListingConfig<T>, query: string, active: ActiveFilters): T[] {
  const { searchText, filters = {} } = config
  return items.filter(
    (item) =>
      (!searchText || matchesQuery(searchText(item), query)) && active.every(([name, value]) => filters[name](item, value)),
  )
}

/**
 * Búsqueda, filtros y paginación para cualquier listado. El estado vive en la URL
 * (`?q=…&estado=…&pagina=2`): se puede compartir el enlace, sobrevive al
 * recargar y el botón «atrás» funciona. Filtra en el navegador, así que sirve
 * igual para datos de Dexie (sin conexión) que para los de la API.
 */
export function useListing<T>(items: T[] | undefined, config: ListingConfig<T> = {}): Listing<T> {
  const [params, setParams] = useSearchParams()
  const defaultSize = config.pageSize ?? PAGE_SIZES[0]
  const filterNames = Object.keys(config.filters ?? {})
  const { query, page, pageSize, activeFilters } = readParams(params, filterNames, defaultSize)

  const update = useCallback(
    (changes: Record<string, string | null>, resetPage = true) => {
      setParams(
        (current) => {
          const next = new URLSearchParams(current)
          for (const [key, value] of Object.entries(changes)) {
            if (value) next.set(key, value)
            else next.delete(key)
          }
          if (resetPage) next.delete('pagina')
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )

  const filtered = useMemo(
    () => (items ? applyFilters(items, config, query, activeFilters) : undefined),
    // Los filtros activos se derivan de la URL; `config` trae funciones nuevas
    // en cada render y no debe recalcular por sí mismo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items, query, activeFilters.map(([n, v]) => `${n}=${v}`).join('&')],
  )

  const current = paginate(filtered ?? [], page, pageSize)

  return {
    query,
    setQuery: (value) => update({ q: value }),
    filterValue: (name) => params.get(name) ?? '',
    setFilter: (name, value) => update({ [name]: value }),
    page: current.page,
    setPage: (next) => update({ pagina: next > 1 ? String(next) : null }, false),
    pageSize,
    setPageSize: (size) => update({ tamano: size === defaultSize ? null : String(size) }),
    pageItems: filtered ? current.items : undefined,
    filteredCount: filtered ? filtered.length : 0,
    total: items ? items.length : 0,
    totalPages: current.totalPages,
    from: current.from,
    to: current.to,
    hasActiveFilters: Boolean(query) || activeFilters.length > 0,
    clear: () => update(Object.fromEntries(['q', ...filterNames].map((key) => [key, null]))),
  }
}
