import { describe, it, expect } from 'vitest'
import { computeStreak } from './streak'
import { logicalDayKey } from './dates'
import type { Phase } from '../db/types'

const today = new Date('2026-06-15T10:00:00')
const noon = (d: string) => logicalDayKey(new Date(`${d}T12:00:00`).getTime())

describe('computeStreak', () => {
  it('conta i giorni consecutivi con attivita', () => {
    const days = new Set([noon('2026-06-15'), noon('2026-06-14'), noon('2026-06-13')])
    expect(computeStreak(days, [], today)).toBe(3)
  })

  it('un buco rompe la streak', () => {
    const days = new Set([noon('2026-06-15'), noon('2026-06-13')]) // manca il 14
    expect(computeStreak(days, [], today)).toBe(1)
  })

  it('oggi senza attivita non rompe (in corso)', () => {
    const days = new Set([noon('2026-06-14'), noon('2026-06-13')])
    expect(computeStreak(days, [], today)).toBe(2)
  })

  it('un giorno in Trasferta congela invece di rompere', () => {
    const phases: Phase[] = [
      { nome: 'campo', dataInizio: '2026-06-14', dataFine: '2026-06-14', modalita: 'trasferta' },
    ]
    const days = new Set([noon('2026-06-15'), noon('2026-06-13')]) // 14 e trasferta, niente attivita
    expect(computeStreak(days, phases, today)).toBe(2)
  })

  it('Trasferta manuale oggi congela il giorno corrente', () => {
    const days = new Set([noon('2026-06-14')]) // oggi (15) niente, ieri si
    expect(computeStreak(days, [], today, 'trasferta')).toBe(1)
  })
})
