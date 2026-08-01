import type { Impulse, MetricEntry } from '../db/types'
import { dayKey } from './dates'

// ultimo valore per giorno di calendario
export function dailyMap(entries: MetricEntry[], key: string): Map<string, number> {
  const byDay = new Map<string, { t: number; v: number }>()
  for (const e of entries) {
    if (e.metricKey !== key || e.valoreNum === null) continue
    const d = dayKey(e.ts)
    const prev = byDay.get(d)
    if (!prev || e.ts > prev.t) byDay.set(d, { t: e.ts, v: e.valoreNum })
  }
  const out = new Map<string, number>()
  for (const [d, o] of byDay) out.set(d, o.v)
  return out
}

export function impulsiDailyMap(impulses: Impulse[]): Map<string, number> {
  const m = new Map<string, number>()
  for (const i of impulses) {
    const d = dayKey(i.tsInizio)
    m.set(d, (m.get(d) ?? 0) + 1)
  }
  return m
}

export function alignedPairs(a: Map<string, number>, b: Map<string, number>): [number, number][] {
  const pairs: [number, number][] = []
  for (const [d, va] of a) {
    const vb = b.get(d)
    if (vb !== undefined) pairs.push([va, vb])
  }
  return pairs
}

export function pearson(pairs: [number, number][]): number | null {
  const n = pairs.length
  if (n < 3) return null
  let sx = 0, sy = 0, sxy = 0, sx2 = 0, sy2 = 0
  for (const [x, y] of pairs) {
    sx += x
    sy += y
    sxy += x * y
    sx2 += x * x
    sy2 += y * y
  }
  const num = n * sxy - sx * sy
  const den = Math.sqrt((n * sx2 - sx * sx) * (n * sy2 - sy * sy))
  if (den === 0) return null
  return Number((num / den).toFixed(2))
}

export function forzaCorrelazione(r: number): string {
  const a = Math.abs(r)
  if (a < 0.2) return 'trascurabile'
  if (a < 0.4) return 'debole'
  if (a < 0.6) return 'moderata'
  if (a < 0.8) return 'forte'
  return 'molto forte'
}
