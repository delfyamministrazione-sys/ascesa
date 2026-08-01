import { useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { computeProgress, reconcileLevels, type ProgressState } from '../lib/xp'
import { computeStreak } from '../lib/streak'
import { logicalDayKey } from '../lib/dates'
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
  const overrideRow = useLiveQuery(() => db.settings.get('modalita_override'), [])

  const loading = !ledger || !levelUps || !checkins || !phases

  if (loading) {
    return { progress: null, streak: 0, modalita: 'normale', fase: null, totaleXp: 0, loading: true }
  }

  const override = (overrideRow?.value as Modalita | undefined) ?? null
  const progress = computeProgress(ledger, levelUps)

  const activityDays = new Set<string>()
  for (const e of ledger) activityDays.add(logicalDayKey(e.ts))
  for (const c of checkins) activityDays.add(logicalDayKey(c.ts))
  const streak = computeStreak(activityDays, phases, new Date(), override)

  const fase = phaseForDate(phases)
  const modalita: Modalita = override ?? fase?.modalita ?? 'normale'
  const totaleXp = ledger.reduce((s, e) => s + e.xp, 0)

  return { progress, streak, modalita, fase, totaleXp, loading: false }
}

export function moltiplicatoreModalita(modalita: Modalita): number {
  return MODALITA[modalita].moltiplicatore
}
