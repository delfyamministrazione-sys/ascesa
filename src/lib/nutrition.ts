import type { NutritionEntry } from '../db/types'
import { dayKey } from './dates'

// Colori neutri e distinti: descrivono, non giudicano (niente verde/rosso "buono/cattivo").
export interface Campo {
  key: keyof Pick<NutritionEntry, 'kcal' | 'carbo' | 'proteine' | 'grassi' | 'sale' | 'fibre' | 'zuccheri'>
  label: string
  unita: string
  color: string
  kcalPerG?: number
  step?: number
}

export const MACRO: Campo[] = [
  { key: 'carbo', label: 'Carboidrati', unita: 'g', color: '#38bdf8', kcalPerG: 4, step: 1 },
  { key: 'proteine', label: 'Proteine', unita: 'g', color: '#f472b6', kcalPerG: 4, step: 1 },
  { key: 'grassi', label: 'Grassi', unita: 'g', color: '#fbbf24', kcalPerG: 9, step: 1 },
]

export const EXTRA: Campo[] = [
  { key: 'fibre', label: 'Fibre', unita: 'g', color: '#34d399', step: 1 },
  { key: 'zuccheri', label: 'Zuccheri', unita: 'g', color: '#c084fc', step: 1 },
  { key: 'sale', label: 'Sale', unita: 'g', color: '#94a3b8', step: 0.1 },
]

export const PASTI = ['Colazione', 'Pranzo', 'Cena', 'Spuntino'] as const

export interface Totali {
  kcal: number
  carbo: number
  proteine: number
  grassi: number
  sale: number
  fibre: number
  zuccheri: number
  pasti: number
}

export function sumDay(entries: NutritionEntry[], giorno: string): Totali {
  const t: Totali = { kcal: 0, carbo: 0, proteine: 0, grassi: 0, sale: 0, fibre: 0, zuccheri: 0, pasti: 0 }
  for (const e of entries) {
    if (dayKey(e.ts) !== giorno) continue
    t.kcal += e.kcal ?? 0
    t.carbo += e.carbo ?? 0
    t.proteine += e.proteine ?? 0
    t.grassi += e.grassi ?? 0
    t.sale += e.sale ?? 0
    t.fibre += e.fibre ?? 0
    t.zuccheri += e.zuccheri ?? 0
    t.pasti += 1
  }
  return t
}

// Composizione energetica dai macro (per la ciambella). Descrittiva, senza target.
export function macroEnergia(t: Totali): { name: string; value: number; color: string }[] {
  return MACRO.map((m) => ({
    name: m.label,
    value: Math.round((t[m.key] ?? 0) * (m.kcalPerG ?? 0)),
    color: m.color,
  })).filter((x) => x.value > 0)
}

export function dailyKcalSeries(entries: NutritionEntry[]): { day: string; kcal: number }[] {
  const map = new Map<string, number>()
  for (const e of entries) {
    const d = dayKey(e.ts)
    map.set(d, (map.get(d) ?? 0) + (e.kcal ?? 0))
  }
  return Array.from(map.entries())
    .sort()
    .map(([day, kcal]) => ({ day, kcal }))
}
