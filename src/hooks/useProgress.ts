import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { computeProgress, reconcileLevels, type ProgressState } from '../lib/xp'
import { computeStreak } from '../lib/streak'
import { dayKey } from '../lib/dates'
import { MODALITA, phaseForDate } from '../lib/phases'
import type { Modalita, Phase } from '../db/types'

export interface AppProgress {
  progress: ProgressState | null
  streak: number
  modalita: Modalita
  fase: Phase | null
  totaleXp: number
  loading: boolean
}

export function useProgress(): AppProgress {
  // riconcilia i livelli all'apertura (cattura le promozioni maturate tra una settimana e l'altra)
  useEffect(() => {
    reconcileLevels()
  }, [])

  const ledger = useLiveQuery(() => db.xpLedger.toArray(), [])
  const levelUps = useLiveQuery(() => db.levelUps.toArray(), [])
  const checkins = useLiveQuery(() => db.checkins.toArray(), [])
  const phases = useLiveQuery(() => db.phases.toArray(), [])

  const loading = !ledger || !levelUps || !checkins || !phases

  if (loading) {
    return { progress: null, streak: 0, modalita: 'normale', fase: null, totaleXp: 0, loading: true }
  }

  const progress = computeProgress(ledger, levelUps)

  const activityDays = new Set<string>()
  for (const e of ledger) activityDays.add(dayKey(e.ts))
  for (const c of checkins) activityDays.add(dayKey(c.ts))
  const streak = computeStreak(activityDays, phases)

  const fase = phaseForDate(phases)
  const modalita = fase?.modalita ?? 'normale'
  const totaleXp = ledger.reduce((s, e) => s + e.xp, 0)

  return { progress, streak, modalita, fase, totaleXp, loading: false }
}

export function moltiplicatoreModalita(modalita: Modalita): number {
  return MODALITA[modalita].moltiplicatore
}
