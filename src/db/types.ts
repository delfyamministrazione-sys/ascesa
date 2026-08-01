export type Binario = 'spirito' | 'corpo' | 'tavola' | 'mente' | 'vita'

export type TipoInput =
  | 'number'
  | 'slider'
  | 'toggle'
  | 'timer'
  | 'photo'
  | 'text'
  | 'choice'
  | 'time'

export type Frequenza = 'daily' | 'weekly' | 'biweekly' | 'per_session' | 'event'
export type Direzione = 'up' | 'down' | 'neutral'
export type Sorgente = 'manual' | 'phone' | 'device'
export type Modalita = 'normale' | 'trasferta' | 'trasferta_leggera'

export interface MetricDefinition {
  key: string
  nome: string
  categoria: string // gruppo per dashboard (Corpo/Fisiologia/Composizione/Cognitive/Contesto/...)
  binarioXp: Binario | null // quale binario guadagna XP quando si registra (null = default analisi/Mente)
  unita: string
  tipoInput: TipoInput
  frequenza: Frequenza
  protocollo: string
  direzione: Direzione
  sorgente: Sorgente
  attiva: boolean
  ordine: number
  builtin: boolean
  config: Record<string, unknown>
}

export interface MetricEntry {
  id?: number
  metricKey: string
  valoreNum: number | null
  valoreJson: unknown
  ts: number
  note?: string
  contesto?: unknown
}

export interface Checkin {
  id?: number
  tipo: 'wake' | 'prelunch' | 'pretraining' | 'evening'
  ts: number
  risposte: Record<string, unknown>
}

export interface Impulse {
  id?: number
  tipo: string
  luogo: string
  intensita: number // 1..5
  tsInizio: number
  tsFine: number | null
  esito: string | null // non modifica mai gli XP
  xpAssegnati: number
}

export interface Session {
  id?: number
  binario: Binario
  attivita: string
  previsione: number | null // 1..10 (prima)
  realta: number | null // 1..10 (dopo)
  durata: number | null // minuti
  ts: number
  tsFine: number | null
  domandaStudio: string | null // solo Spirito
  rispostaStudio: string | null
}

export interface Prediction {
  id?: number
  testo: string
  confidenza: number // %
  settimana: string // chiave settimana iso
  esito: boolean | null
  tsCreazione: number
  tsVerifica: number | null
}

export interface Experiment {
  id?: number
  domanda: string
  ipotesiBloccata: string
  condizioneA: string
  condizioneB: string
  ordineSorteggiato: string[] // es. ['A','B'] o ['B','A']
  dataInizio: string
  dataFine: string
  metricheOsservate: string[]
  stato: 'bozza' | 'attivo' | 'concluso'
}

export interface XpEntry {
  id?: number
  binario: Binario
  azione: string
  xp: number // sempre >= 0
  ts: number
  ref?: string // collega la riga XP alla sua fonte (es. 'metric:<entryId>') per poterla annullare
}

export interface LevelUp {
  id?: number
  binario: Binario
  livello: number // livello raggiunto
  isoWeek: string
  ts: number
}

export interface Phase {
  id?: number
  nome: string
  dataInizio: string // 'YYYY-MM-DD'
  dataFine: string // 'YYYY-MM-DD'
  modalita: Modalita
}

export interface Setting {
  key: string
  value: unknown
}

// Modulo nutrizione: puramente osservativo (nessun XP, nessun target, nessun giudizio).
export interface NutritionEntry {
  id?: number
  ts: number
  pasto: string // colazione | pranzo | cena | spuntino
  nome: string // descrizione libera del pasto (facoltativa)
  kcal: number | null
  carbo: number | null // g
  proteine: number | null // g
  grassi: number | null // g
  sale: number | null // g
  fibre: number | null // g
  zuccheri: number | null // g
}
