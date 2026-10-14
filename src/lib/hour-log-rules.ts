// Regla única para el rango de horas válido por registro. Antes el
// formulario tenía dos copias idénticas de esta validación (D-06), con un
// tope de 8 horas que ni siquiera coincidía con el backend.
//
// El valor y el mensaje están alineados con `src/common/hour-log-rules.ts`
// del backend, para que el estudiante vea el mismo aviso sin importar si lo
// atrapa el formulario o la API.
const DEFAULT_MAX_HOURS_PER_LOG = 10

export const MIN_HOURS_PER_LOG = 0.5

export const MAX_HOURS_PER_LOG = import.meta.env.VITE_HOUR_LOG_MAX_HOURS
  ? Number(import.meta.env.VITE_HOUR_LOG_MAX_HOURS)
  : DEFAULT_MAX_HOURS_PER_LOG

export const HOURS_OUT_OF_RANGE_MESSAGE = `Las horas deben estar entre ${MIN_HOURS_PER_LOG} y ${MAX_HOURS_PER_LOG} por registro.`

/**
 * Valida el campo de horas de un registro: que sea un número, que esté
 * dentro del rango permitido, y que el horario de inicio sea anterior al de
 * fin. Se usa tanto para el envío del formulario como para el aviso en vivo
 * bajo el campo Horas, antes había una copia de esto por cada uso.
 */
export function validateHours(hours: string, startTime: string, endTime: string): string | null {
  const hoursValue = Number(hours)
  if (!hours || Number.isNaN(hoursValue)) {
    return 'Ingresa un número de horas válido'
  }
  if (hoursValue < MIN_HOURS_PER_LOG || hoursValue > MAX_HOURS_PER_LOG) {
    return HOURS_OUT_OF_RANGE_MESSAGE
  }
  if (startTime && endTime && endTime <= startTime) {
    return 'La hora de fin debe ser posterior a la de inicio'
  }
  return null
}