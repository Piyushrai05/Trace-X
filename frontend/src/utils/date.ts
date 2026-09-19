import { format, isValid } from 'date-fns'

/**
 * Safely formats a date string or timestamp.
 * Returns fallback string if input is invalid or missing, never throwing an exception.
 */
export function safeFormatDate(
  dateInput: string | number | Date | null | undefined,
  formatPattern: string = 'MMM dd, yyyy',
  fallback: string = '—'
): string {
  if (!dateInput) return fallback
  try {
    const d = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput
    if (!isValid(d) || isNaN(d.getTime())) {
      return fallback
    }
    return format(d, formatPattern)
  } catch {
    return fallback
  }
}

export function safeFormatTime(
  dateInput: string | number | Date | null | undefined,
  fallback: string = '12:00'
): string {
  return safeFormatDate(dateInput, 'HH:mm', fallback)
}
