import type { Impulse, MetricEntry, Session } from '../db/types'
import { dayKey } from './dates'

export function lastPerDay(entries: MetricEntry[], key: string) {
  const byDay = new Map<string, { t: number; value: number }>()
  for (const e of entries) {
    if (e.metricKey !== key || e.valoreNum === null) continue
    const d = dayKey(e.ts)
    const prev = byDay.get(d)
    if (!prev || e.ts > prev.t) byDay.set(d, { t: e.ts, value: e.valoreNum })
  }
  return Array.from(byDay.entries())
    .map(([day, v]) => ({ day, t: v.t, value: v.value }))
    .sort((a, b) => a.t - b.t)
}

export function latestValue(entries: MetricEntry[], key: string): number | null {
  const s = lastPerDay(entries, key)
  return s.at(-1)?.value ?? null
}

export function movingAvg(series: { t: number; value: number }[], win: number) {
  return series.map((_, i) => {
    const from = Math.max(0, i - win + 1)
    const slice = series.slice(from, i + 1)
    const avg = slice.reduce((s, x) => s + x.value, 0) / slice.length
    return { t: series[i].t, avg: Number(avg.toFixed(2)) }
  })
}

export function pesoMediaMobile(entries: MetricEntry[]) {
  const s = lastPerDay(entries, 'peso').map((x) => ({ t: x.t, value: x.value }))
  return movingAvg(s, 7)
}

export function impulsiPerOra(impulses: Impulse[]) {
  const arr = Array.from({ length: 24 }, (_, h) => ({ ora: `${h}`, n: 0 }))
  for (const i of impulses) arr[new Date(i.tsInizio).getHours()].n += 1
  return arr
}

export function impulsiPerLuogo(impulses: Impulse[], luoghi: string[]) {
  const map = new Map<string, number>()
  for (const l of luoghi) map.set(l, 0)
  for (const i of impulses) map.set(i.luogo, (map.get(i.luogo) ?? 0) + 1)
  return Array.from(map.entries()).map(([luogo, n]) => ({ luogo, n }))
}

export function durataMediaImpulso(impulses: Impulse[]): number | null {
  const chiusi = impulses.filter((i) => i.tsFine !== null)
  if (chiusi.length === 0) return null
  const tot = chiusi.reduce((s, i) => s + (i.tsFine! - i.tsInizio), 0)
  return Math.round(tot / chiusi.length / 60000)
}

export function scartoPerAttivita(sessions: Session[]) {
  const map = new Map<string, { sum: number; n: number }>()
  for (const s of sessions) {
    if (s.realta === null || s.previsione === null) continue
    const cur = map.get(s.attivita) ?? { sum: 0, n: 0 }
    cur.sum += s.realta - s.previsione
    cur.n += 1
    map.set(s.attivita, cur)
  }
  return Array.from(map.entries()).map(([attivita, v]) => ({
    attivita,
    delta: Number((v.sum / v.n).toFixed(2)),
  }))
}

export function scartoMedio(sessions: Session[]): number | null {
  const valid = sessions.filter((s) => s.realta !== null && s.previsione !== null)
  if (valid.length === 0) return null
  return Number((valid.reduce((s, x) => s + (x.realta! - x.previsione!), 0) / valid.length).toFixed(2))
}

export function volumeDaily(entries: MetricEntry[]) {
  const map = new Map<string, number>()
  for (const e of entries) {
    if (e.metricKey !== 'volume_allenamento' || e.valoreNum === null) continue
    const d = dayKey(e.ts)
    map.set(d, (map.get(d) ?? 0) + e.valoreNum)
  }
  return Array.from(map.entries())
    .sort()
    .map(([day, kg]) => ({ day, kg }))
}
