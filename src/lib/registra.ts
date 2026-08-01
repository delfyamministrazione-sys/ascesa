import type { MetricDefinition } from '../db/types'
import { dayKey, isoWeekKey } from './dates'

export type Momento = 'risveglio' | 'giorno' | 'sessione' | 'settimana' | 'due_settimane'

export interface MomentoInfo {
  key: Momento
  label: string
  color: string
  hint: string
}

// Ordine = ordine con cui appaiono le cartelle in Registra.
export const MOMENTI: MomentoInfo[] = [
  { key: 'risveglio', label: 'Al risveglio', color: '#f59e0b', hint: 'Appena sveglio, ancora a letto o prima di alzarti.' },
  { key: 'giorno', label: 'Durante il giorno', color: '#3b82f6', hint: 'Quando capita, entro sera.' },
  { key: 'sessione', label: 'Quando ti alleni', color: '#ef4444', hint: 'Subito dopo la seduta.' },
  { key: 'settimana', label: 'Ogni settimana', color: '#22c55e', hint: 'Un giorno fisso, a riposo. Batteria di test.' },
  { key: 'due_settimane', label: 'Ogni due settimane', color: '#a78bfa', hint: 'Stesse condizioni ogni volta.' },
]

export function momentoOf(def: MetricDefinition): Momento {
  if (def.config?.checkin === 'wake' || def.key === 'peso') return 'risveglio'
  if (def.frequenza === 'weekly') return 'settimana'
  if (def.frequenza === 'biweekly') return 'due_settimane'
  if (def.frequenza === 'per_session') return 'sessione'
  return 'giorno'
}

// "Fatta nel suo periodo": daily -> oggi, weekly -> questa settimana, biweekly -> ultimi 14 giorni.
export function isDoneInPeriod(def: MetricDefinition, lastTs: number | null, now = Date.now()): boolean {
  if (lastTs == null) return false
  const m = momentoOf(def)
  if (m === 'settimana') return isoWeekKey(lastTs) === isoWeekKey(now)
  if (m === 'due_settimane') return now - lastTs < 14 * 86_400_000
  return dayKey(lastTs) === dayKey(now) // risveglio / giorno / sessione = giornaliero
}

// Priorità: le metriche ad alto valore in cima alla cartella.
export function priorityRank(def: MetricDefinition): number {
  const c = def.config ?? {}
  if (c.priorita) return 0
  if (c.evidenza || c.benchmark || c.motivazionale) return 1
  return 2
}
