---
name: test-hooks-dexie
description: Cómo escribir tests de hooks de React que leen la base local Dexie/IndexedDB (useHourLogs, usePlacement y similares) y de lógica extraída de componentes. Úsala en E6-06, al extraer lógica del formulario de horas (E6-04) o al añadir cualquier hook en src/offline/hooks.
---

# Tests de hooks que leen Dexie

La infraestructura ya existe: `src/test-setup.ts` importa `fake-indexeddb/auto`, así que en los tests IndexedDB es real (en memoria). **No mockees el hook ni `useLiveQuery`.** El criterio de E6-06 exige lectura real.

## Patrón base

Copia el patrón de `src/offline/db.spec.ts` (limpiar y reabrir antes de cada caso), así los tests no dependen del orden en que se ejecutan:

```ts
import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import { db, type LocalHourLog } from '@/offline/db'
import { useHourLogs } from './useHourLogs'

function hourLog(overrides: Partial<LocalHourLog> = {}): LocalHourLog {
  return {
    id: 1, placementId: 7, date: '2026-04-01', startTime: '08:00', endTime: '12:00',
    hours: 4, activity: 'Soporte', status: 'SUBMITTED', version: 1,
    updatedAt: '2026-04-01T12:00:00.000Z', syncState: 'synced',
    ...overrides,
  }
}

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('useHourLogs', () => {
  it('starts undefined while the query loads', () => {
    const { result } = renderHook(() => useHourLogs(7))
    expect(result.current).toBeUndefined()
  })

  it('returns an empty array when the placement has no logs', async () => {
    const { result } = renderHook(() => useHourLogs(7))
    await waitFor(() => expect(result.current).toEqual([]))
  })

  it('returns only that placement logs, sorted by date', async () => {
    await db.hourLogs.bulkPut([
      hourLog({ id: 1, date: '2026-04-03' }),
      hourLog({ id: 2, date: '2026-04-01' }),
      hourLog({ id: 3, placementId: 99 }),
    ])
    const { result } = renderHook(() => useHourLogs(7))
    await waitFor(() => expect(result.current?.map((l) => l.id)).toEqual([2, 1]))
  })

  it('reacts to writes made after mounting', async () => {
    const { result } = renderHook(() => useHourLogs(7))
    await waitFor(() => expect(result.current).toEqual([]))
    await db.hourLogs.put(hourLog())
    await waitFor(() => expect(result.current).toHaveLength(1))
  })
})
```

Los tres estados que pide la historia son **carga** (`undefined`), **vacío** (`[]` o `null`) y **con datos**. Añade el caso "reacciona a escrituras", que es lo que hace útil a `useLiveQuery`.

## Hooks que dependen de la sesión (`usePlacement`)

`usePlacement` lee `useAuth()`. Envuélvelo en el proveedor real o mockea **solo** el módulo de auth, nunca Dexie:

```ts
vi.mock('@/auth/AuthContext', () => ({ useAuth: () => ({ user: { id: 5 }, role: 'STUDENT' }) }))
```

Casos: estudiante con práctica, estudiante sin práctica (`null`), rol distinto de `STUDENT` (`null`) y carga (`undefined`).

## `useSyncStatus` y `useOnline`

- `useSyncStatus` usa `useSyncExternalStore` sobre `src/offline/sync/status.ts`. Pruébalo cambiando el estado con `setStatus(...)` de ese módulo dentro de `act()`.
- `useOnline` ya tiene tests (`useOnline.spec.ts`). Úsalo como ejemplo de eventos del navegador.

## Lógica extraída de un componente (E6-04)

Cuando separes la lógica del formulario:
- Funciones puras (validar, construir la operación del `outbox`): test directo, sin React.
- Hook de estado (`useHourLogForm`): `renderHook` + `act` para las transiciones.
- Escritura en Dexie y en la cola: verifica leyendo `db.hourLogs` y `db.outbox` después de enviar, sin mocks.

## Comprobar la cobertura

```bash
pnpm test:cov
```

Busca `src/offline/hooks` en la tabla: el objetivo de E6-06 es superar el 70 %.

## Errores comunes

- Olvidar `await waitFor(...)`: `useLiveQuery` resuelve de forma asíncrona.
- Compartir datos entre casos sin el `beforeEach` que borra la base.
- Usar `placementId` -1 u otros valores especiales sin probarlo: la página usa `-1` mientras no hay práctica.
