/** Minúsculas y sin tildes: "Práctica" y "practica" se encuentran igual. */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
}

/** Cada palabra de la búsqueda tiene que aparecer en el texto, en cualquier orden. */
export function matchesQuery(text: string, query: string): boolean {
  const words = normalizeText(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return true
  const haystack = normalizeText(text)
  return words.every((word) => haystack.includes(word))
}

export interface Page<T> {
  items: T[]
  /** Página efectiva, ya acotada al rango válido. */
  page: number
  totalPages: number
  /** Posición del primer y último elemento mostrados (desde 1); 0 si no hay. */
  from: number
  to: number
}

export function paginate<T>(items: T[], page: number, pageSize: number): Page<T> {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const current = Math.min(Math.max(1, Math.floor(page) || 1), totalPages)
  const start = (current - 1) * pageSize
  const pageItems = items.slice(start, start + pageSize)
  return {
    items: pageItems,
    page: current,
    totalPages,
    from: pageItems.length ? start + 1 : 0,
    to: start + pageItems.length,
  }
}

/**
 * Números de página a mostrar, con "…" donde se salta: siempre la primera,
 * la última y las vecinas de la actual. Ej.: 1 … 4 5 6 … 20.
 */
export function pageWindow(page: number, totalPages: number): (number | '…')[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
  const pages = new Set([1, totalPages, page - 1, page, page + 1])
  const sorted = [...pages].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b)
  const result: (number | '…')[] = []
  for (const p of sorted) {
    const previous = result[result.length - 1]
    if (typeof previous === 'number' && p - previous > 1) result.push('…')
    result.push(p)
  }
  return result
}
