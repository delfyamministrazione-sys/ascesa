import type { ActivityDef } from '../db/types'

export interface ActivityDetail {
  minutes?: number
  tier?: string
  note?: string
}

// XP di un'attività in base al tipo (tempo / tier / fisso).
export function xpForActivity(def: ActivityDef, d: ActivityDetail): number {
  switch (def.tipo) {
    case 'timed': {
      const m = Math.max(0, d.minutes ?? 0)
      const raw = Math.round(m * (def.config.perMinute ?? 1))
      return Math.min(def.config.cap ?? 9999, raw)
    }
    case 'tiered':
      return def.config.tiers?.find((t) => t.key === d.tier)?.xp ?? 0
    case 'sfida':
    case 'reps':
    default:
      return def.baseXp
  }
}
