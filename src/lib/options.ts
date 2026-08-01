import type { Binario } from '../db/types'
import { startOfDayMs } from './dates'

// --- Impulsi ---
export interface ImpulsoTipo {
  key: string
  label: string
  color: string
  boss?: 'rientro' | 'scroll'
}

export const IMPULSO_TIPI: ImpulsoTipo[] = [
  { key: 'scroll', label: 'Scroll / social', color: '#3b82f6', boss: 'scroll' },
  { key: 'cibo', label: 'Cibo / rientro', color: '#f59e0b', boss: 'rientro' },
  { key: 'visivo', label: 'Impulso visivo', color: '#8b5cf6' },
  { key: 'altro', label: 'Altro', color: '#97a0b2' },
]

export const LUOGHI: string[] = ['Casa', 'Camera / Letto', 'Lavoro', 'Palestra', 'Fuori', 'Auto', 'Altro']

// Esiti in linguaggio neutro e fattuale: solo dati, nessun giudizio.
export interface EsitoImpulso {
  key: string
  label: string
}
export const ESITI_IMPULSO: EsitoImpulso[] = [
  { key: 'passato', label: 'E passato da solo' },
  { key: 'contromossa', label: 'Ho usato la contromossa' },
  { key: 'seguito', label: 'L ho seguito' },
  { key: 'altro', label: 'Altro' },
]

// --- Boss ricorrenti (sez. 3.2) ---
export interface Boss {
  key: 'rientro' | 'scroll'
  nome: string
  descrizione: string
  color: string
}
export const BOSS: Boss[] = [
  { key: 'rientro', nome: 'Il Rientro', descrizione: 'Arrivo a casa senza niente di pronto', color: '#f59e0b' },
  { key: 'scroll', nome: 'Lo Scroll', descrizione: 'Prendere il telefono e scorrere', color: '#3b82f6' },
]

// --- Sessioni con previsione/realta ---
export const ATTIVITA_PER_BINARIO: Record<Binario, string[]> = {
  spirito: ['Lettura Bibbia', 'Preghiera', 'Studio biblico'],
  corpo: ['Allenamento', 'Corsa', 'Camminata', 'Mobilita'],
  tavola: ['Pasto pianificato'],
  mente: ['Lettura', 'Studio', 'Lavoro profondo'],
  vita: ['Tempo con altri', 'Sport di gruppo', 'Gioco', 'Ozio / riposo'],
}

// --- Domande di studio per le sessioni di Spirito (prepara alla scuola biblica) ---
export const DOMANDE_STUDIO: string[] = [
  'Cosa dice questo passo su chi e Dio?',
  'C e un comando da mettere in pratica? Quale, concretamente?',
  'Cosa mi ha sorpreso o messo in difficolta in questo testo?',
  'Che domanda vorrei portare a un insegnante su questo passo?',
  'Come si collega a qualcosa che ho gia letto?',
  'Se dovessi spiegarlo a qualcuno in una frase, cosa direi?',
  'Qual e il contesto: chi scrive, a chi, perche?',
  'C e una promessa in cui posso appoggiarmi oggi?',
  'Cosa cambia nella mia giornata se prendo sul serio questo testo?',
  'Quale parola o immagine e ripetuta o centrale?',
  'Cosa rivela questo passo del cuore umano?',
  'Che preghiera nasce da questa lettura?',
  'C e un peccato da abbandonare o una virtu da coltivare?',
  'Come parla questo passo di Gesu, direttamente o in prospettiva?',
  'Cosa non ho capito e vorrei approfondire?',
]

export function domandaStudioPerGiorno(d: Date | number = new Date()): string {
  const dayIndex = Math.floor(startOfDayMs(d) / 86_400_000)
  return DOMANDE_STUDIO[dayIndex % DOMANDE_STUDIO.length]
}
