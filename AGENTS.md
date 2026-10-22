# AGENTS.md — Frontend de Prácticas Preprofesionales (equipo A2)

Instrucciones para cualquier agente de código (Claude Code, Codex, Gemini CLI, Antigravity, Cursor, Copilot…). Las mismas reglas valen para las personas del equipo.

## Proyecto

SPA offline-first en React 19, Vite, Tailwind y Dexie (IndexedDB). Consume la API NestJS del repo `practicas-preprofesionales-backend-A2`. Hay cuatro roles: `STUDENT`, `TUTOR`, `COMPANY` y `COORDINATOR`.

- `src/offline/db.ts`: esquema de la base local (Dexie).
- `src/offline/hooks/`: hooks que leen la base local.
- `src/offline/sync/`: pull, push, cola (`outbox`), reintentos y estado de sincronización.
- `src/api/`: llamadas a la API que no son datos sincronizables.
- `src/pages/` y `src/components/`: interfaz.

## Reglas que no se rompen

1. **Regla de oro offline-first:** la interfaz nunca hace `fetch` de datos sincronizables. Lee de Dexie mediante los hooks y escribe en Dexie más la cola `outbox`. Solo `src/offline/sync/*` y `src/api/*` tocan la red.
2. Registrar horas sin conexión tiene que seguir funcionando después de cualquier cambio.
3. Cada cambio de comportamiento lleva su test en un `*.spec.ts(x)` junto al archivo. La cobertura no baja.
4. Una historia del backlog = una rama `feat|fix|chore/<CLAVE>-<descripcion>` desde `develop`. Los commits llevan la clave (`chore(E6-04): ...`). Los PR van a `develop`, nunca a `main`, tienen menos de 400 líneas de diff y usan `.github/PULL_REQUEST_TEMPLATE.md`.
5. Trabaja contra los criterios de aceptación de la historia (guía del curso). Lo que quede fuera se dice en el PR.
6. No agregues líneas de coautoría de herramientas de IA en commits ni en PR.

## Comandos

```bash
pnpm install
pnpm dev          # http://localhost:5173 (backend en :3000)
pnpm lint
pnpm typecheck
pnpm test:cov
```

Usuarios del seed: `estudiante0@miyura.com`, `tutor0@…`, `empresa0@…`, `coordinador@…`, todos con contraseña `yura1234`.

## Skills compartidas

Viven en **`.agents/skills/`** (estándar Agent Skills). Ábrelas y síguelas cuando la tarea coincida:

| Skill | Cuándo |
|---|---|
| `.agents/skills/historia-sprint/SKILL.md` | Empezar una historia, hacer commits, abrir el PR |
| `.agents/skills/test-hooks-dexie/SKILL.md` | Tests de hooks que leen Dexie o de lógica extraída (E6-04, E6-06) |
| `.agents/skills/libro-horas-rendimiento/SKILL.md` | Medir y mejorar el libro de horas con muchos registros (E6-05) |

`.claude/skills/` y `.agent/skills/` son copias generadas para Claude Code y Antigravity. **Edita solo `.agents/skills/`** y ejecuta `pnpm skills:sync`. La CI falla si las copias no coinciden.
