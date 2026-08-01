import { describe, it, expect } from 'vitest'
import { cumulativeForLevel, levelFromXp, stepForLevel, computeProgress } from './levels'
import type { XpEntry, LevelUp } from '../db/types'

describe('curva livelli', () => {
  it('step cresce di 40 per livello', () => {
    expect(stepForLevel(1)).toBe(80)
    expect(stepForLevel(2)).toBe(120)
    expect(stepForLevel(3)).toBe(160)
  })

  it('cumulativo corretto', () => {
    expect(cumulativeForLevel(1)).toBe(0)
    expect(cumulativeForLevel(2)).toBe(80)
    expect(cumulativeForLevel(3)).toBe(200)
    expect(cumulativeForLevel(4)).toBe(360)
  })

  it('livello da XP alle soglie', () => {
    expect(levelFromXp(0)).toBe(1)
    expect(levelFromXp(79)).toBe(1)
    expect(levelFromXp(80)).toBe(2)
    expect(levelFromXp(199)).toBe(2)
    expect(levelFromXp(200)).toBe(3)
  })
})

describe('computeProgress', () => {
  it('livello mai perso e barra mai negativa quando gli XP calano', () => {
    // binario promosso a Lv2 (un levelUp) ma con soli 50 XP rimasti (sotto soglia 80)
    const ledger: XpEntry[] = [{ binario: 'corpo', azione: 'x', xp: 50, ts: 1 }]
    const levelUps: LevelUp[] = [{ binario: 'corpo', livello: 2, isoWeek: '2026-W01', ts: 1 }]
    const p = computeProgress(ledger, levelUps)
    const corpo = p.perBinario.find((x) => x.binario === 'corpo')!
    expect(corpo.level).toBe(2) // livello resta
    expect(corpo.xpIntoLevel).toBe(0) // barra non negativa
    expect(corpo.pct).toBe(0)
  })

  it('readyBlocked quando ci sono XP oltre la soglia ma nessun levelUp', () => {
    const ledger: XpEntry[] = [{ binario: 'mente', azione: 'x', xp: 100, ts: 1 }]
    const p = computeProgress(ledger, [])
    const mente = p.perBinario.find((x) => x.binario === 'mente')!
    expect(mente.level).toBe(1)
    expect(mente.readyBlocked).toBe(true)
  })
})
