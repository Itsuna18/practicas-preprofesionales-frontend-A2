// Helpers puros del formulario de registro de horas. Se extrajeron de
// HourLogForm.tsx (E6-04) para poder probarlos sin montar la interfaz.

// Fecha de hoy en formato YYYY-MM-DD, tal como la espera un <input type="date">.
export function todayAsInputValue(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Convierte la fecha elegida (YYYY-MM-DD) a una etiqueta legible en español
// para que el estudiante confirme, de un vistazo, qué día está registrando
// antes de guardar.
export function formatDateForConfirmation(dateValue: string): string {
  if (!dateValue) return ''
  const [year, month, day] = dateValue.split('-').map(Number)
  if (!year || !month || !day) return ''
  const parsed = new Date(year, month - 1, day)
  if (Number.isNaN(parsed.getTime())) return ''
  return new Intl.DateTimeFormat('es-EC', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(parsed)
}

// Duración calculada a partir de la hora de inicio y de fin, para que el
// estudiante pueda comparar contra lo que va a escribir en "Horas" antes de
// guardar. Puramente informativo, no toca las horas que finalmente se
// registran.
export function computeDurationLabel(startTime: string, endTime: string): string | null {
  if (!startTime || !endTime) return null
  const [startHour, startMinute] = startTime.split(':').map(Number)
  const [endHour, endMinute] = endTime.split(':').map(Number)
  if ([startHour, startMinute, endHour, endMinute].some((value) => Number.isNaN(value))) {
    return null
  }
  const startMinutes = startHour * 60 + startMinute
  const endMinutes = endHour * 60 + endMinute
  const diffMinutes = endMinutes - startMinutes
  if (diffMinutes <= 0) return null
  const diffHours = diffMinutes / 60
  return `Duración calculada: ${diffHours.toFixed(1)} h`
}