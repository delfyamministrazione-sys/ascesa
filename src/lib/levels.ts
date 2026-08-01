import type { Binario, XpEntry, LevelUp } from '../db/types'
import { BINARI } from './binari'
import { isoWeekKey } from './dates'

// --- Curva dei livelli (pura, senza dipendenze da DB) ---
export function stepForLevel(level: number): number {
  return 80 + 40 * (level - 1)
}

export function cumulativeForLevel(level: number): number {
  let sum = 0
  for (let l = 1; l < level; l++) sum += stepForLevel(l)
  return sum
}

export function levelFromXp(total: number): number {
  let level = 1
  while (total >= cumulativeForLevel(level + 1)) level++
  return level
}

export function sumByBinario(ledger: XpEntry[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const e of ledger) out[e.binario] = (out[e.binario] ?? 0) + e.xp
  return out
}

export function countByBinario(levelUps: LevelUp[]): Record<string, number> {
  const out: Record<string, number> = {}
  for (const l of levelUps) out[l.binario] = (out[l.binario] ?? 0) + 1
  return out
}

export interface BinarioProgress {
  binario: Binario
  totalXp: number
  level: number
  xpIntoLevel: number
  xpForNext: number
  pct: number
  readyBlocked: boolean
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
    const level = 1 + (counts[b] ?? 0)
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
