import { startOfDay } from 'date-fns'
import type { Phase } from '../db/types'
import { addDays, dayKey } from './dates'
import { isTrasferta, modalitaForDate } from './phases'

/**
 * Streak giornaliera. Un giorno "attivo" ha almeno un evento XP o un check-in.
 * Regola 2.4: nei giorni in Trasferta la streak si CONGELA (non conta, non azzera).
 * Il giorno di oggi, se ancora senza attivita, non rompe la streak (e "in corso").
 */
export function computeStreak(
  activityDayKeys: Set<string>,
  phases: Phase[],
  today: Date = new Date(),
): number {
  let streak = 0
  let cursor = startOfDay(today)
  let isToday = true
  let guard = 0

  while (guard++ < 500) {
    const mod = modalitaForDate(phases, cursor)
    if (isTrasferta(mod)) {
      cursor = addDays(cursor, -1)
      isToday = false
      continue
    }
    const has = activityDayKeys.has(dayKey(cursor))
    if (has) {
      streak++
    } else if (!isToday) {
      break
    }
    cursor = addDays(cursor, -1)
    isToday = false
  }
  return streak
}
