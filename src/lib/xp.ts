import { db } from '../db/db'
import type { Binario, Modalita } from '../db/types'
import { BINARI } from './binari'
import { isoWeekKey } from './dates'
import { MODALITA, modalitaForDate } from './phases'
import { cumulativeForLevel, countByBinario, sumByBinario } from './levels'

// Ri-esporto la matematica pura dei livelli (retro-compatibilità con chi importava da './xp')
export {
  stepForLevel,
  cumulativeForLevel,
  levelFromXp,
  computeProgress,
  type BinarioProgress,
  type ProgressState,
} from './levels'

async function modalitaMultiplierNow(): Promise<number> {
  const [phases, ov] = await Promise.all([db.phases.toArray(), db.settings.get('modalita_override')])
  const override = ov?.value as Modalita | undefined
  const m = override ?? modalitaForDate(phases)
  return MODALITA[m].moltiplicatore
}

// --- Economia XP (sempre in positivo, regola 2.1) ---
export const XP = {
  impulso: 15,
  checkin: 10,
  metrica: 4,
  sessionePrevisione: 8,
  sessioneRealta: 10,
  bossPrep: 20,
  missione: 50,
  calibrazione: 12,
  vita: 8,
} as const

/**
 * Assegna XP. Applica il moltiplicatore della fase corrente, mai valori negativi,
 * scrive nel ledger append-only (con ref opzionale per l'annullamento) e riconcilia i livelli.
 */
export async function grantXp(
  binario: Binario,
  azione: string,
  baseXp: number,
  ref?: string,
): Promise<number> {
  const mult = await modalitaMultiplierNow()
  const xp = Math.max(0, Math.round(baseXp * mult))
  await db.xpLedger.add({ binario, azione, xp, ts: Date.now(), ref })
  await reconcileLevels()
  return xp
}

/**
 * Regola 2.3: un solo binario puo salire di livello a settimana.
 * Promuove al massimo un binario per settimana ISO (quello col maggior surplus).
 * Gli XP in eccesso restano; i livelli non si perdono mai (levelUps e append-only).
 */
export async function reconcileLevels(): Promise<void> {
  const [ledger, levelUps] = await Promise.all([db.xpLedger.toArray(), db.levelUps.toArray()])
  const week = isoWeekKey()
  if (levelUps.some((l) => l.isoWeek === week)) return

  const totals = sumByBinario(ledger)
  const counts = countByBinario(levelUps)

  let best: { binario: Binario; livello: number; surplus: number } | null = null
  for (const info of BINARI) {
    const b = info.key
    const recorded = 1 + (counts[b] ?? 0)
    const total = totals[b] ?? 0
    const needed = cumulativeForLevel(recorded + 1)
    if (total >= needed) {
      const surplus = total - needed
      if (!best || surplus > best.surplus) best = { binario: b, livello: recorded + 1, surplus }
    }
  }

  if (best) {
    await db.levelUps.add({
      binario: best.binario,
      livello: best.livello,
      isoWeek: week,
      ts: Date.now(),
    })
  }
}
