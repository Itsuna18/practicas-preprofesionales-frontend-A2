---
name: historia-sprint
description: Flujo del equipo A2 para trabajar una historia del backlog (E5-xx, E6-xx, etc.) en el frontend. Úsala al empezar una historia, al hacer commits y al preparar el PR. Crea la rama con la clave, recuerda las reglas del proyecto y redacta el PR con la plantilla del repo.
---

# Historia de sprint (frontend)

La fuente de verdad de cada historia es la guía del curso (sección "Backlog"): historia, criterios de aceptación y definición de terminado. Lee la historia completa antes de tocar código y trabaja contra sus criterios, no contra lo que "parece mejor".

## 1. Empezar

```bash
git checkout develop && git pull
git checkout -b <tipo>/<CLAVE>-<descripcion-corta>
```

- `<tipo>` sale del tipo de la historia: `feat`, `fix` (bug) o `chore`.
- Ejemplos: `chore/E6-04-separar-formulario-horas`, `fix/E6-05-libro-horas-fluido`, `chore/E6-06-tests-hooks-dexie`.
- Revisa la columna "Depende de". Si la dependencia no está en `develop`, no empieces: avisa en el tablero.

## 2. Reglas del proyecto que no se rompen

- **Regla de oro offline-first:** la interfaz nunca hace `fetch` de datos sincronizables. Lee de Dexie (`src/offline/db.ts`) mediante los hooks de `src/offline/hooks/`, y escribe en Dexie más la cola (`outbox`). La red solo la tocan `src/offline/sync/*` y `src/api/*`.
- Registrar horas **sin conexión** tiene que seguir funcionando. Pruébalo con DevTools → Network → Offline.
- Las pruebas van en el mismo PR que el código, en un archivo `*.spec.ts(x)` junto al archivo probado.
- No bajes la cobertura. Si baja, explica por qué en el PR.
- Un PR de menos de 400 líneas de diff. Si crece, pártelo.

## 3. Commits

Commits pequeños, en español, con la clave de la historia:

```
chore(E6-04): extraer la validacion del formulario a useHourLogForm
test(E6-06): cubrir useHourLogs con coleccion vacia
```

## 4. Antes de abrir el PR

```bash
pnpm lint
pnpm typecheck
pnpm test:cov
```

Los tres deben pasar. Compara la cobertura total con la de `develop` (la CI la publica en el resumen).

## 5. Abrir el PR

- Base: **`develop`**, nunca `main`.
- Usa `.github/PULL_REQUEST_TEMPLATE.md` y llena todas las secciones: Qué cambia, Por qué (`Closes #NN` del issue del tablero), Deuda técnica (si paga una deuda de `KNOWN_ISSUES.md`, di cuál), Cómo probarlo (pasos que el revisor puede copiar) y Checklist.
- Añade "Qué queda fuera" si dejaste algo sin hacer a propósito.
- Si la historia pide una medición o una tabla (E6-05, E5-01), va en la descripción del PR.
- Pide revisión a un compañero. Cuando se integre, mueve la tarjeta del tablero a **Done**.

## 6. Demo en la review

Prepara en 3 o 4 pasos cómo enseñar la historia funcionando con la app corriendo (`pnpm dev`, backend arriba, usuarios del seed con contraseña `yura1234`), contrastando cada criterio de aceptación.
