# Problemas conocidos

Lo que sabemos que está mal y no alcanzamos a arreglar antes de entregar esto.

Si encuentras algo que no está acá, agrégalo. Casi seguro hay más. No tuvimos tiempo de
auditar todo el repo, solo de anotar lo que nos mordió mientras construíamos.


## D-08 · El indicador de sync miente por una ventana corta

`src/offline/sync/status.ts`, `src/offline/sync/scheduler.ts`.

Cuando termina un push, `runSync` llama `setStatus({ syncing: false, lastSyncAt: ... })`.
En ese momento el indicador ya se pinta como sincronizado. El contador de `pending` se
recalcula aparte, en un `await db.outbox.count()` una línea después. Entre esas dos
llamadas hay una vuelta al event loop en la que el estado en memoria dice "ya terminé" con
un contador de pendientes que todavía no se actualizó. Es una ventana de milisegundos, no
la vas a notar mirando la pantalla, pero si escribes un test que aserte sobre el orden de
los estados del indicador, la vas a agarrar. No nos alcanzó a arreglar. Hay que juntar
ambos `setStatus` en uno solo, o calcular `pending` antes de marcar `syncing: false`.

## D-09 · `HourLogForm.tsx` hace de todo [PAGADA en E6-04]

`src/components/HourLogForm.tsx`, 348 líneas.

Estado del formulario, la validación de horas, formateo de la
fecha en español para la confirmación, cálculo de la duración a partir de inicio y fin, la
escritura a `db.hourLogs` y el `enqueue()` al outbox, todo en el mismo componente.
Funciona, pero cualquier cambio, hasta uno chico como agregar un campo, obliga a leerlo
entero para saber qué más se puede romper. Debería partirse en un hook de formulario, los
helpers puros que ya casi están separados (`formatDateForConfirmation`,
`computeDurationLabel`) y un hook de persistencia aparte. No llegamos.

## D-10 · Los hooks que tocan Dexie no tienen tests [PAGADA en E6-06]

`src/offline/hooks/`: `useHourLogs.ts`, `usePlacement.ts`, `useSyncStatus.ts`, `useOnline.ts`.

Resuelta en E6-06 agregando suites de tests automatizados (`useHourLogs.spec.ts`, `usePlacement.spec.ts` y `useSyncStatus.spec.ts`) con lectura real de IndexedDB mediante `fake-indexeddb`, alcanzando el 100 % de cobertura en `src/offline/hooks`. Anteriormente: No supimos testear hooks que tocan IndexedDB y lo dejamos así. Todos usan `useLiveQuery` de
`dexie-react-hooks` contra la base real de Dexie; en otras partes del repo probamos con
`fake-indexeddb` (mira `offline/db.spec.ts` como referencia) y no debería ser muy distinto
hacerlo acá, pero nunca nos sentamos a escribirlos. Si vas a tocar cómo se leen las horas o
la plaza del estudiante desde la UI, vas a ciegas. No hay red de seguridad que te avise si
rompiste algo.
