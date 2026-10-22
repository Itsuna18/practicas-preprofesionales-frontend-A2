import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { useListing } from '@/lib/useListing'
import { ListToolbar, NoResults, Pagination } from './ListControls'

interface Item {
  id: number
  name: string
  status: 'OPEN' | 'CLOSED'
}

const ITEMS: Item[] = Array.from({ length: 25 }, (_, i) => ({
  id: i + 1,
  name: i === 0 ? 'Práctica de análisis' : `Oferta ${i + 1}`,
  status: i % 5 === 0 ? 'CLOSED' : 'OPEN',
}))

function Location() {
  return <output data-testid="url">{useLocation().search}</output>
}

function Demo({ items = ITEMS }: { items?: Item[] }) {
  const listing = useListing(items, {
    searchText: (item) => item.name,
    filters: { estado: (item, value) => item.status === value },
  })
  return (
    <>
      <ListToolbar
        listing={listing}
        searchPlaceholder="Buscar oferta"
        filters={[{ name: 'estado', label: 'Estado', options: [{ value: 'OPEN', label: 'Abierta' }, { value: 'CLOSED', label: 'Cerrada' }] }]}
      />
      {listing.filteredCount === 0 ? <NoResults onClear={listing.clear} /> : null}
      <ul aria-label="resultados">
        {listing.pageItems?.map((item) => <li key={item.id}>{item.name}</li>)}
      </ul>
      <Pagination listing={listing} noun={['oferta', 'ofertas']} />
      <Location />
    </>
  )
}

function renderDemo(url = '/', items?: Item[]) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Demo items={items} />
    </MemoryRouter>,
  )
}

const rows = () => within(screen.getByRole('list', { name: 'resultados' })).queryAllByRole('listitem')

describe('ListToolbar + Pagination + useListing', () => {
  it('shows the first page of 10 with a summary', () => {
    renderDemo()
    expect(rows()).toHaveLength(10)
    expect(screen.getByText('1–10 de 25 ofertas')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Página 1' })).toHaveAttribute('aria-current', 'page')
  })

  it('moves between pages and keeps the page in the URL', async () => {
    renderDemo()
    await userEvent.click(screen.getByRole('button', { name: 'Página siguiente' }))
    expect(screen.getByText('11–20 de 25 ofertas')).toBeInTheDocument()
    expect(screen.getByTestId('url')).toHaveTextContent('pagina=2')

    await userEvent.click(screen.getByRole('button', { name: 'Página 3' }))
    expect(rows()).toHaveLength(5)
    expect(screen.getByRole('button', { name: 'Página siguiente' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Página anterior' }))
    expect(screen.getByText('11–20 de 25 ofertas')).toBeInTheDocument()
  })

  it('searches without accents and goes back to page 1', async () => {
    renderDemo('/?pagina=2')
    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar oferta' }), 'practica analisis')
    expect(rows().map((r) => r.textContent)).toEqual(['Práctica de análisis'])
    expect(screen.getByText('1–1 de 1 oferta (filtrados de 25)')).toBeInTheDocument()
    expect(screen.getByTestId('url')).not.toHaveTextContent('pagina')
  })

  it('filters by status and reads the filters from the URL', () => {
    renderDemo('/?estado=CLOSED')
    expect(screen.getByLabelText('Estado')).toHaveValue('CLOSED')
    expect(rows()).toHaveLength(5)
  })

  it('changes the page size', async () => {
    renderDemo()
    await userEvent.selectOptions(screen.getByLabelText('Por página'), '20')
    expect(rows()).toHaveLength(20)
    expect(screen.getByTestId('url')).toHaveTextContent('tamano=20')
  })

  it('offers to clear when nothing matches', async () => {
    renderDemo('/?q=zzz&estado=OPEN')
    expect(screen.getByText('Nada coincide con tu búsqueda')).toBeInTheDocument()
    expect(screen.getByText('0 de 25 ofertas')).toBeInTheDocument()

    await userEvent.click(screen.getAllByRole('button', { name: /Limpiar filtros/ })[0])
    expect(rows()).toHaveLength(10)
    expect(screen.getByTestId('url')).toHaveTextContent('')
  })

  it('clears the search with its own button', async () => {
    renderDemo('/?q=oferta')
    await userEvent.click(screen.getByRole('button', { name: 'Borrar búsqueda' }))
    expect(screen.getByRole('searchbox')).toHaveValue('')
  })

  it('hides the page buttons when everything fits and the bar when there is nothing', () => {
    const { unmount } = renderDemo('/', ITEMS.slice(0, 3))
    expect(screen.queryByRole('button', { name: 'Página siguiente' })).not.toBeInTheDocument()
    expect(screen.getByText('1–3 de 3 ofertas')).toBeInTheDocument()
    unmount()

    renderDemo('/', [])
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('clamps a page out of range from the URL', () => {
    renderDemo('/?pagina=99')
    expect(screen.getByText('21–25 de 25 ofertas')).toBeInTheDocument()
  })
})

describe('search field: special characters', () => {
  it('blocks special characters while typing and explains why', async () => {
    renderDemo()
    const box = screen.getByRole('searchbox', { name: 'Buscar oferta' })
    await userEvent.type(box, 'oferta<1>')
    expect(box).toHaveValue('oferta1')
    expect(box).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Solo letras, números, espacios y . @ # - _')).toBeInTheDocument()
  })

  it('accepts accents, ñ, numbers and the allowed symbols without warning', async () => {
    renderDemo()
    const box = screen.getByRole('searchbox', { name: 'Buscar oferta' })
    await userEvent.type(box, 'Núñez #1 e@mail.com a-b_c')
    expect(box).toHaveValue('Núñez #1 e@mail.com a-b_c')
    expect(box).not.toHaveAttribute('aria-invalid')
  })

  it('cleans pasted text too', async () => {
    renderDemo()
    const box = screen.getByRole('searchbox', { name: 'Buscar oferta' })
    box.focus()
    await userEvent.paste('<script>oferta 2</script>')
    expect(box).toHaveValue('scriptoferta 2script')
  })

  it('cleans a search that arrives in a hand-made URL', () => {
    renderDemo('/?q=' + encodeURIComponent('<img src=x>oferta'))
    expect(screen.getByRole('searchbox')).toHaveValue('img srcxoferta')
  })

  it('limits the length', () => {
    renderDemo()
    expect(screen.getByRole('searchbox')).toHaveAttribute('maxLength', '60')
  })
})
