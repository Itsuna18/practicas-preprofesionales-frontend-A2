import { useState } from 'react'
import { validateHours } from '@/lib/hour-log-rules'
import {
  computeDurationLabel,
  formatDateForConfirmation,
  todayAsInputValue,
} from '@/lib/hour-log-form'

export interface HourLogFormValues {
  date: string
  startTime: string
  endTime: string
  hours: string
  activity: string
}

export interface HourLogFormErrors {
  date?: string
  startTime?: string
  endTime?: string
  hours?: string
  activity?: string
}

// Pura: dadas los valores actuales del formulario, devuelve el objeto de
// errores que corresponde. No depende de React y se puede probar en soledad.
export function buildHourLogFormErrors(values: HourLogFormValues): HourLogFormErrors {
  const errors: HourLogFormErrors = {}
  if (!values.date) {
    errors.date = 'La fecha es obligatoria'
  }
  if (!values.startTime) {
    errors.startTime = 'La hora de inicio es obligatoria'
  }
  if (!values.endTime) {
    errors.endTime = 'La hora de fin es obligatoria'
  }
  if (!values.activity.trim()) {
    errors.activity = 'Describe la actividad realizada'
  }
  const hoursMessage = validateHours(values.hours, values.startTime, values.endTime)
  if (hoursMessage) {
    errors.hours = hoursMessage
  }
  return errors
}

// Hook de estado del formulario de registro de horas. Se extrajo de
// HourLogForm.tsx (E6-04) para que la validación y las transiciones de
// estado puedan probarse sin renderizar la interfaz.
export function useHourLogForm() {
  const [date, setDate] = useState(todayAsInputValue())
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [hours, setHours] = useState('')
  const [activity, setActivity] = useState('')
  const [errors, setErrors] = useState<HourLogFormErrors>({})

  const values: HourLogFormValues = { date, startTime, endTime, hours, activity }

  const confirmationLabel = formatDateForConfirmation(date)
  const durationLabel = computeDurationLabel(startTime, endTime)
  const liveHoursWarning = hours ? validateHours(hours, startTime, endTime) : null

  function setField<K extends keyof HourLogFormValues>(field: K, value: HourLogFormValues[K]) {
    if (field === 'date') setDate(value)
    else if (field === 'startTime') setStartTime(value)
    else if (field === 'endTime') setEndTime(value)
    else if (field === 'hours') setHours(value)
    else if (field === 'activity') setActivity(value)
  }

  function validate(): HourLogFormErrors {
    const nextErrors = buildHourLogFormErrors(values)
    setErrors(nextErrors)
    return nextErrors
  }

  function reset() {
    setDate(todayAsInputValue())
    setStartTime('')
    setEndTime('')
    setHours('')
    setActivity('')
    setErrors({})
  }

  return {
    values,
    setField,
    errors,
    setErrors,
    confirmationLabel,
    durationLabel,
    liveHoursWarning,
    validate,
    reset,
  }
}