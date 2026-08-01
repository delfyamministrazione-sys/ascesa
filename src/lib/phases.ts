import type { Modalita, Phase } from '../db/types'
import { dayKey } from './dates'

export interface ModalitaInfo {
  key: Modalita
  label: string
  moltiplicatore: number
  descrizione: string
}

export const MODALITA: Record<Modalita, ModalitaInfo> = {
  normale: {
    key: 'normale',
    label: 'Normale',
    moltiplicatore: 1,
    descrizione: 'Controllo pieno di ambiente e alimentazione. Tutti i binari attivi.',
  },
  trasferta: {
    key: 'trasferta',
    label: 'Trasferta',
    moltiplicatore: 0.5,
    descrizione:
      'Campi, periodi senza controllo. Solo 3 azioni minime, la streak si congela invece di azzerarsi, XP a moltiplicatore ridotto.',
  },
  trasferta_leggera: {
    key: 'trasferta_leggera',
    label: 'Trasferta leggera',
    moltiplicatore: 0.75,
    descrizione: 'Vacanza, mare. Streak congelata, XP ridotti ma piu azioni disponibili.',
  },
}

// Le 3 azioni minime disponibili in Trasferta (regola 2.4).
export const AZIONI_TRASFERTA = ['impulso', 'serale', 'spirito'] as const

export function isTrasferta(m: Modalita): boolean {
  return m === 'trasferta' || m === 'trasferta_leggera'
}

/** Fase che contiene la data indicata (default: fase 'normale' se nessuna combacia). */
export function phaseForDate(phases: Phase[], date: Date | number = new Date()): Phase | null {
  const k = dayKey(date)
  const found = phases.find((p) => k >= p.dataInizio && k <= p.dataFine)
  return found ?? null
}

export function modalitaForDate(phases: Phase[], date: Date | number = new Date()): Modalita {
  return phaseForDate(phases, date)?.modalita ?? 'normale'
}
