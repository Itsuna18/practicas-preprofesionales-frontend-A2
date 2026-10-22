import { describe, expect, it } from 'vitest'
import { SEARCH_MAX_LENGTH, hasForbiddenChars, matchesQuery, normalizeText, pageWindow, paginate, sanitizeSearch } from './listing'

describe('normalizeText', () => {
  it('ignores case and accents', () => {
    expect(normalizeText('Práctica ÁGIL')).toBe('practica agil')
  })
})

describe('matchesQuery', () => {
  it('matches every word in any order, without accents', () => {
    expect(matchesQuery('Practicante Backend — Empresa 3', 'empresa backend')).toBe(true)
    expect(matchesQuery('Análisis de datos', 'analisis')).toBe(true)
    expect(matchesQuery('Practicante QA', 'backend')).toBe(false)
  })

  it('matches everything with an empty query', () => {
    expect(matchesQuery('lo que sea', '   ')).toBe(true)
  })
})

describe('paginate', () => {
  const items = Array.from({ length: 23 }, (_, i) => i + 1)

  it('returns the requested page and its range', () => {
    expect(paginate(items, 2, 10)).toEqual({ items: [11, 12, 13, 14, 15, 16, 17, 18, 19, 20], page: 2, totalPages: 3, from: 11, to: 20 })
  })

  it('handles the last, partial page', () => {
    expect(paginate(items, 3, 10)).toMatchObject({ items: [21, 22, 23], from: 21, to: 23 })
  })

  it('clamps pages out of range or invalid', () => {
    expect(paginate(items, 99, 10).page).toBe(3)
    expect(paginate(items, 0, 10).page).toBe(1)
    expect(paginate(items, Number.NaN, 10).page).toBe(1)
  })

  it('has one empty page when there is nothing', () => {
    expect(paginate([], 1, 10)).toEqual({ items: [], page: 1, totalPages: 1, from: 0, to: 0 })
  })
})

describe('pageWindow', () => {
  it('shows every page when there are few', () => {
    expect(pageWindow(2, 5)).toEqual([1, 2, 3, 4, 5])
  })

  it('collapses distant pages with an ellipsis', () => {
    expect(pageWindow(10, 20)).toEqual([1, '…', 9, 10, 11, '…', 20])
    expect(pageWindow(1, 20)).toEqual([1, 2, '…', 20])
    expect(pageWindow(20, 20)).toEqual([1, '…', 19, 20])
  })

  it('does not put an ellipsis between consecutive pages', () => {
    expect(pageWindow(3, 10)).toEqual([1, 2, 3, 4, '…', 10])
  })
})

describe('sanitizeSearch', () => {
  it('keeps letters with accents, numbers, spaces and . @ # - _', () => {
    expect(sanitizeSearch('Lucía Núñez #101 e1@miyura.com pre-práctica_2')).toBe('Lucía Núñez #101 e1@miyura.com pre-práctica_2')
  })

  it('removes special characters', () => {
    expect(sanitizeSearch('<script>alert("x")</script>')).toBe('scriptalertxscript')
    expect(sanitizeSearch("datos'; DROP TABLE--")).toBe('datos DROP TABLE--')
    expect(sanitizeSearch('100% $ * { } [ ] \\ / | ~ ^ ` = + ? ! ¿ ¡ & ( ) : , ;')).toBe('100 ')
  })

  it('collapses repeated spaces, trims the start and limits the length', () => {
    expect(sanitizeSearch('   ana    perez')).toBe('ana perez')
    expect(sanitizeSearch('a'.repeat(100))).toHaveLength(SEARCH_MAX_LENGTH)
  })
})

describe('hasForbiddenChars', () => {
  it('detects only the characters that would be removed', () => {
    expect(hasForbiddenChars('Estudiante #101')).toBe(false)
    expect(hasForbiddenChars('ana<b>')).toBe(true)
  })
})
