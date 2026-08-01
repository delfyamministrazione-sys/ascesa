import { db } from '../db/db'
import type { Binario, XpEntry, LevelUp } from '../db/types'
import { BINARI } from './binari'
import { isoWeekKey } from './dates'
import { MODALITA, modalitaForDate } from './phases'

async function modalitaMultiplierNow(): Promise<number> {
  const phases = await db.phases.toArray()
  return MODALITA[modalitaForDate(phases)].moltiplicatore
}

// --- Economia XP (sempre in positivo, regola 2.1) ---
export const XP = {
  impulso: 15, // registrare un impulso (regola 2.2: assegnati subito, l'esito non li cambia)
  checkin: 12, // completare un check-in
  metrica: 5, // registrare una metrica
  sessionePrevisione: 6, // avviare una sessione con previsione
  sessioneRealta: 4, // chiudere la sessione col dato reale
  bossPrep: 20, // dichiarare la contromossa a un boss (XP sulla preparazione)
  missione: 40, // missione settimanale completata
  calibrazione: 8, // tre previsioni settimanali
} as const

// --- Curva dei livelli ---
export function stepForLevel(level: number): number {
  // XP necessari per passare da `level` a `level+1`
  return 80 + 40 * (level - 1)
}

export function cumulativeForLevel(level: number): number {
  // XP cumulativi per ESSERE al livello `level` (livello 1 = 0)
  let sum = 0
  for (let l = 1; l < level; l++) sum += stepForLevel(l)
  return sum
}

export function levelFromXp(total: number): number {
  let level = 1
  while (total >= cumulativeForLevel(level + 1)) level++
  return level
}

function sumByBinario(ledger: XpEntry[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const e of ledger) out[e.binario] = (out[e.binario] ?? 0) + e.xp
  return out
}

function countByBinario(levelUps: LevelUp[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const l of levelUps) out[l.binario] = (out[l.binario] ?? 0) + 1
  return out
}

/**
 * Assegna XP. Applica il moltiplicatore della fase corrente, mai valori negativi,
 * scrive nel ledger append-only e riconcilia i livelli.
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
 * Promuove al massimo un binario per settimana ISO, scegliendo quello col maggior
 * surplus oltre la soglia. Gli XP in eccesso restano e faranno salire la settimana dopo.
 * I livelli non si perdono mai (levelUps e append-only).
 */
export async function reconcileLevels(): Promise<void> {
  const [ledger, levelUps] = await Promise.all([db.xpLedger.toArray(), db.levelUps.toArray()])
  const week = isoWeekKey()
  if (levelUps.some((l) => l.isoWeek === week)) return // slot settimanale gia usato

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

export interface BinarioProgress {
  binario: Binario
  totalXp: number
  level: number
  xpIntoLevel: number
  xpForNext: number
  pct: number
  readyBlocked: boolean // ha abbastanza XP ma il livello e bloccato dal limite settimanale
}

export interface ProgressState {
  perBinario: BinarioProgress[]
  settimana: string
  promossoQuestaSettimana: Binario | null
  slotSettimanaleUsato: boolean
}

export function computeProgress(ledger: XpEntry[], levelUps: LevelUp[]): ProgressState {
  const week = isoWeekKey()
  const totals = sumByBinario(ledger)
  const counts = countByBinario(levelUps)
  const promosso = levelUps.find((l) => l.isoWeek === week)?.binario ?? null

  const perBinario: BinarioProgress[] = BINARI.map((info) => {
    const b = info.key
    const total = totals[b] ?? 0
    const level = 1 + (counts[b] ?? 0) // livello raggiunto, mai perso
    // se gli XP calano (es. dopo un annullamento) il livello resta ma la barra non va negativa
    const xpIntoLevel = Math.max(0, total - cumulativeForLevel(level))
    const xpForNext = stepForLevel(level)
    const pct = Math.max(0, Math.min(1, xpForNext > 0 ? xpIntoLevel / xpForNext : 0))
    const readyBlocked = levelFromXp(total) > level
    return { binario: b, totalXp: total, level, xpIntoLevel, xpForNext, pct, readyBlocked }
  })

  return {
    perBinario,
    settimana: week,
    promossoQuestaSettimana: promosso,
    slotSettimanaleUsato: promosso !== null,
  }
}
