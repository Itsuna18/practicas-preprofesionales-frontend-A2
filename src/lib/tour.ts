import type { Role } from '@/auth/AuthContext'

export interface TourStep {
  /** Valor de `data-tour` del elemento a iluminar; sin él, la tarjeta va centrada. */
  target?: string
  title: string
  body: string
}

const THEME: TourStep = {
  target: 'theme',
  title: 'Modo claro u oscuro',
  body: 'Cambia el aspecto de la aplicación cuando quieras. Lo recordamos en este navegador.',
}

const ASSISTANT: TourStep = {
  target: 'assistant',
  title: 'Tu asistente',
  body: 'Pregúntale lo que necesites sobre tus prácticas: responde con tus datos de la plataforma.',
}

const REPLAY: TourStep = {
  target: 'tour-replay',
  title: '¡Listo!',
  body: 'Si quieres ver este recorrido otra vez, pulsa este botón.',
}

export const TOUR_STEPS: Record<Role, TourStep[]> = {
  STUDENT: [
    { title: '¡Bienvenido a tus prácticas!', body: 'Te mostramos en un minuto dónde está cada cosa.' },
    { target: 'nav-/mi-practica', title: 'Inicio', body: 'Tu avance de horas, tu racha de días y las insignias que vas ganando.' },
    { target: 'nav-/horas', title: 'Mis horas', body: 'Registra tus horas el mismo día. Funciona aunque no tengas conexión.' },
    { target: 'sync', title: 'Sincronización', body: 'Aquí ves si hay registros pendientes de enviar. Se envían solos al volver la señal.' },
    { target: 'nav-/perfil', title: 'Mi perfil', body: 'Indica tu carrera e intereses y te recomendaremos ofertas a tu medida.' },
    { target: 'nav-/ofertas', title: 'Ofertas', body: 'Prácticas publicadas, con las recomendadas para ti primero.' },
    THEME,
    ASSISTANT,
    REPLAY,
  ],
  TUTOR: [
    { title: '¡Bienvenido, tutor!', body: 'Un recorrido rápido por lo que vas a usar.' },
    { target: 'nav-/practicantes', title: 'Mis practicantes', body: 'Revisa y aprueba las horas de cada practicante y evalúalo al cierre.' },
    { target: 'sync', title: 'Sincronización', body: 'Indica si hay cambios pendientes de enviar al servidor.' },
    THEME,
    ASSISTANT,
    REPLAY,
  ],
  COMPANY: [
    { title: '¡Bienvenida, empresa!', body: 'Un recorrido rápido por la plataforma.' },
    { target: 'nav-/ofertas-empresa', title: 'Mis ofertas', body: 'Crea y publica ofertas, y decide las postulaciones sin pasarte de los cupos.' },
    THEME,
    ASSISTANT,
    REPLAY,
  ],
  COORDINATOR: [
    { title: '¡Bienvenida, coordinación!', body: 'Un recorrido rápido por la plataforma.' },
    { target: 'nav-/acreditacion', title: 'Acreditación', body: 'El acta del periodo con el estado de cada práctica y sus motivos.' },
    THEME,
    ASSISTANT,
    REPLAY,
  ],
}

// Versión en la clave: si el recorrido cambia, se vuelve a mostrar una vez.
export function tourKey(userId: number): string {
  return `tour:v1:${userId}`
}

/** El tour ya visto es una preferencia de este navegador; si no se puede leer, no se insiste. */
export function hasSeenTour(userId: number): boolean {
  try {
    return localStorage.getItem(tourKey(userId)) === 'done'
  } catch {
    return true
  }
}

export function markTourSeen(userId: number): void {
  try {
    localStorage.setItem(tourKey(userId), 'done')
  } catch {
    // Sin almacenamiento, el tour puede volver a aparecer; no es grave.
  }
}
