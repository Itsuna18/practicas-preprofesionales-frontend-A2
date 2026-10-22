import { describe, expect, it } from 'vitest'
import { cn, plural } from './utils'

describe('cn', () => {
  it('resolves conflicting tailwind classes, keeping the last one', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })

  it('drops falsy values and keeps the rest', () => {
    const hidden: string | undefined = undefined
    expect(cn('a', hidden, null, 'c')).toBe('a c')
  })

  it('keeps the text color next to a custom font size', () => {
    // Antes, text-14 borraba text-surface y el botón primario quedaba ilegible.
    expect(cn('bg-stamp text-surface', 'h-control px-4 text-14')).toBe('bg-stamp text-surface h-control px-4 text-14')
  })

  it('still resolves conflicts inside each group', () => {
    expect(cn('text-13', 'text-14')).toBe('text-14')
    expect(cn('text-ink', 'text-void')).toBe('text-void')
  })
})

describe('plural', () => {
  it('agrees the noun with the count', () => {
    expect(plural(1, 'oferta', 'ofertas')).toBe('1 oferta')
    expect(plural(3, 'oferta', 'ofertas')).toBe('3 ofertas')
  })
})
