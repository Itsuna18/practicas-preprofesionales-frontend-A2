import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from './button'

describe('Button', () => {
  it.each([
    ['default', 'text-surface'],
    ['destructive', 'text-surface'],
  ] as const)('keeps the light text of the %s variant at every size', (variant, textClass) => {
    for (const size of ['default', 'sm', 'lg'] as const) {
      const { unmount } = render(
        <Button variant={variant} size={size}>
          Siguiente
        </Button>,
      )
      const className = screen.getByRole('button', { name: 'Siguiente' }).className
      expect(className).toContain(textClass)
      expect(className).toMatch(/text-1[34]/)
      unmount()
    }
  })
})
