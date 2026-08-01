import type { Binario } from '../db/types'

export interface BinarioInfo {
  key: Binario
  nome: string
  color: string
  sigla: string
  descrizione: string
  note: string
}

export const BINARI: BinarioInfo[] = [
  {
    key: 'spirito',
    nome: 'Spirito',
    color: '#8b5cf6',
    sigla: 'S',
    descrizione: 'Lettura Bibbia, preghiera, studio',
    note: 'Ogni sessione ha una domanda di studio associata. Prepara alla scuola biblica.',
  },
  {
    key: 'corpo',
    nome: 'Corpo',
    color: '#ef4444',
    sigla: 'C',
    descrizione: 'Allenamento, movimento, prestazioni',
    note: 'Forza, recupero cardiaco, freschezza del sistema nervoso.',
  },
  {
    key: 'tavola',
    nome: 'Tavola',
    color: '#f59e0b',
    sigla: 'T',
    descrizione: 'Orari dei pasti e pianificazione',
    note: 'XP solo su: mangiato all orario previsto e deciso in anticipo cosa mangiare. Mai su cosa ne su quanto.',
  },
  {
    key: 'mente',
    nome: 'Mente',
    color: '#3b82f6',
    sigla: 'M',
    descrizione: 'Lettura, studio, tempo senza scroll',
    note: 'Attenzione, tempo alla prima distrazione.',
  },
  {
    key: 'vita',
    nome: 'Vita',
    color: '#22c55e',
    sigla: 'V',
    descrizione: 'Relazione, sport con altri, giochi, ozio, riposo',
    note: "L'ozio assegna XP. Se non entra nel sistema, il sistema divora proprio le cose che ti piacciono.",
  },
]

const MAP: Record<Binario, BinarioInfo> = BINARI.reduce(
  (acc, b) => {
    acc[b.key] = b
    return acc
  },
  {} as Record<Binario, BinarioInfo>,
)

export function binario(key: Binario): BinarioInfo {
  return MAP[key]
}

export function binarioColor(key: Binario | null | undefined): string {
  return key ? MAP[key].color : '#97a0b2'
}
