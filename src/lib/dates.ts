import {
  format,
  getISOWeek,
  getISOWeekYear,
  startOfDay,
  differenceInCalendarDays,
  addDays,
} from 'date-fns'

export function dayKey(d: Date | number = new Date()): string {
  return format(d, 'yyyy-MM-dd')
}

// Giorno "logico": la giornata inizia alle 04:00, così un check-in dopo mezzanotte
// resta nel giorno appena passato invece di finire in quello dopo.
const CUTOFF_H = 4
export function logicalDayKey(d: Date | number = Date.now()): string {
  const ms = typeof d === 'number' ? d : d.getTime()
  return dayKey(ms - CUTOFF_H * 3_600_000)
}

export function isoWeekKey(d: Date | number = new Date()): string {
  const w = getISOWeek(d)
  const y = getISOWeekYear(d)
  return `${y}-W${String(w).padStart(2, '0')}`
}

export function startOfDayMs(d: Date | number = new Date()): number {
  return startOfDay(d).getTime()
}

export function daysBetween(a: Date | number, b: Date | number): number {
  return differenceInCalendarDays(a, b)
}

export { addDays }

export function timeHHMM(d: Date | number = new Date()): string {
  return format(d, 'HH:mm')
}

export function shortDate(d: Date | number): string {
  return format(d, 'd MMM')
}

export function shortDateTime(d: Date | number): string {
  return format(d, 'd MMM HH:mm')
}
