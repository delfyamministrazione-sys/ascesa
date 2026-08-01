import Dexie, { type Table } from 'dexie'
import type {
  MetricDefinition,
  MetricEntry,
  Checkin,
  Impulse,
  Session,
  Prediction,
  Experiment,
  XpEntry,
  LevelUp,
  Phase,
  Setting,
  NutritionEntry,
} from './types'

export class AscesaDB extends Dexie {
  metricDefinitions!: Table<MetricDefinition, string>
  metricEntries!: Table<MetricEntry, number>
  checkins!: Table<Checkin, number>
  impulses!: Table<Impulse, number>
  sessions!: Table<Session, number>
  predictions!: Table<Prediction, number>
  experiments!: Table<Experiment, number>
  xpLedger!: Table<XpEntry, number>
  levelUps!: Table<LevelUp, number>
  phases!: Table<Phase, number>
  settings!: Table<Setting, string>
  nutrition!: Table<NutritionEntry, number>

  constructor() {
    super('ascesa')
    // Nota: booleani e null non sono chiavi valide in IndexedDB -> quei campi
    // (attiva, binarioXp, tsFine, esito) si filtrano in JS, non si indicizzano.
    this.version(1).stores({
      metricDefinitions: 'key, categoria, frequenza, ordine',
      metricEntries: '++id, metricKey, ts',
      checkins: '++id, tipo, ts',
      impulses: '++id, tipo, tsInizio',
      sessions: '++id, binario, ts',
      predictions: '++id, settimana',
      experiments: '++id, stato',
      xpLedger: '++id, binario, ts',
      levelUps: '++id, binario, isoWeek',
      phases: '++id, dataInizio',
      settings: 'key',
    })
    // v2: modulo nutrizione osservativo
    this.version(2).stores({
      nutrition: '++id, ts, pasto',
    })
  }
}

export const db = new AscesaDB()

// helper impostazioni
export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  const row = await db.settings.get(key)
  return row ? (row.value as T) : fallback
}

export async function setSetting(key: string, value: unknown): Promise<void> {
  await db.settings.put({ key, value })
}
