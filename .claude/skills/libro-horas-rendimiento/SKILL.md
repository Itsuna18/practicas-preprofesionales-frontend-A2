---
name: libro-horas-rendimiento
description: Cómo medir y mejorar el rendimiento del libro de horas (HourLogsPage, Ledger, LedgerRow) con muchos registros. Úsala en E6-05 o en cualquier cambio que afecte a listas largas o a la cantidad de renderizados.
---

# Rendimiento del libro de horas

La historia E6-05 exige **medir antes de optimizar** y dejar la medición de antes y después en el PR. Sin la medición de "antes", la historia no está terminada.

## Dónde está el código

- `src/pages/HourLogsPage.tsx`: `HourLogsList` hace `logs.slice().reverse().map(...)` y renderiza **todas** las filas. `summarizeHours(logs, ...)` se llama en cada render (hay un comentario que lo justifica: con 500 registros deja de ser cierto).
- `src/components/ledger/Ledger.tsx`, `LedgerRow.tsx` y `SyncGutter.tsx`: filas y "canalón" de sincronización. El canalón tiene que seguir viéndose igual.
- `src/offline/hooks/useHourLogs.ts`: la consulta a Dexie, ordenada por fecha.

## Paso 1: generar 500 registros

En la consola del navegador, con la app abierta como estudiante (para el `placementId`, mira la tabla `placements` en DevTools → Application → IndexedDB):

```js
const { db } = await import('/src/offline/db.ts')
const placementId = 1 // reemplazar
const logs = Array.from({ length: 500 }, (_, i) => ({
  id: 900000 + i, placementId, date: `2026-0${1 + (i % 6)}-${String(1 + (i % 28)).padStart(2, '0')}`,
  startTime: '08:00', endTime: '12:00', hours: 4, activity: `Actividad ${i}`,
  status: 'APPROVED', version: 1, updatedAt: new Date().toISOString(), syncState: 'synced',
}))
await db.hourLogs.bulkPut(logs)
```

Bórralos al terminar con `db.hourLogs.where('id').aboveOrEqual(900000).delete()`.

## Paso 2: medir el "antes"

1. DevTools → Performance → CPU **4x slowdown** (simula un teléfono de gama media). También puedes usar el modo dispositivo con un Moto G o similar.
2. React DevTools → Profiler → grabar: cargar la página y desplazarse hasta abajo.
3. Anota: tiempo del commit inicial de `HourLogsPage`, tiempo de cada re-render y FPS o tareas largas en Performance mientras te desplazas.
4. Haz una captura del Profiler. Va al PR.

Primero averigua **qué** es lento. La guía avisa que quizá sea el cálculo de totales y no la lista.

## Paso 3: opciones de mejora (de menor a mayor impacto)

1. `useMemo` para `summarizeHours` y para la lista invertida, con `logs` como dependencia. Los totales no deben recalcularse en cada render: es un criterio de aceptación.
2. `React.memo` en la fila extraída (componente `HourLogRow`) para que una fila nueva no re-renderice las 500.
3. **Virtualización** de la lista (solo se renderizan las filas visibles), por ejemplo con `@tanstack/react-virtual`. Si añades una dependencia, justifícala en el PR.
4. Paginación o "cargar más" solo si las anteriores no bastan: cambia la experiencia, así que coméntalo antes con el equipo.

## Paso 4: verificar que el comportamiento no cambió

- Mismos datos, mismo orden (los más recientes arriba) y mismo canalón de sincronización por fila.
- Registrar sin conexión sigue funcionando y la fila nueva aparece con su estado `pending`.
- Tests: si extraes `HourLogRow` o un hook de totales, añade su `*.spec.tsx`.

## Paso 5: el PR

Incluye una tabla:

| Medición (500 registros, CPU 4x) | Antes | Después |
|---|---|---|
| Render inicial de HourLogsPage | … ms | … ms |
| Re-render al añadir un registro | … ms | … ms |
| Desplazamiento (tareas largas / FPS) | … | … |

Más las capturas del Profiler de antes y después.

## No hacer

- No añadir animaciones por fila en el libro: con 500 filas rompen el desplazamiento.
- No leer de la API para "paginar desde el servidor": la pantalla lee de Dexie (regla offline-first).
