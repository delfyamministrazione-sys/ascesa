import { db } from '../db/db'
import { dayKey } from './dates'
import { markBackup } from './storage'

function trigger(filename: string, content: string, type: string) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

async function collectAll() {
  const [
    metricDefinitions,
    metricEntries,
    checkins,
    impulses,
    sessions,
    predictions,
    experiments,
    xpLedger,
    levelUps,
    phases,
    settings,
  ] = await Promise.all([
    db.metricDefinitions.toArray(),
    db.metricEntries.toArray(),
    db.checkins.toArray(),
    db.impulses.toArray(),
    db.sessions.toArray(),
    db.predictions.toArray(),
    db.experiments.toArray(),
    db.xpLedger.toArray(),
    db.levelUps.toArray(),
    db.phases.toArray(),
    db.settings.toArray(),
  ])
  return {
    app: 'ascesa',
    versione: 1,
    esportato: new Date().toISOString(),
    metricDefinitions,
    metricEntries,
    checkins,
    impulses,
    sessions,
    predictions,
    experiments,
    xpLedger,
    levelUps,
    phases,
    settings,
  }
}

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function toCSV(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return ''
  const cols = Object.keys(rows[0])
  const head = cols.join(',')
  const body = rows.map((r) => cols.map((c) => csvEscape(r[c])).join(',')).join('\n')
  return `${head}\n${body}`
}

const iso = (ts: number | null) => (ts ? new Date(ts).toISOString() : '')

async function metricEntriesCSV(): Promise<string> {
  const rows = (await db.metricEntries.toArray()).map((e) => ({
    metrica: e.metricKey,
    valore: e.valoreNum,
    valore_json: e.valoreJson ?? '',
    data: iso(e.ts),
    note: e.note ?? '',
  }))
  return toCSV(rows)
}

async function impulsesCSV(): Promise<string> {
  const rows = (await db.impulses.toArray()).map((i) => ({
    tipo: i.tipo,
    luogo: i.luogo,
    intensita: i.intensita,
    inizio: iso(i.tsInizio),
    fine: iso(i.tsFine),
    durata_min: i.tsFine ? Math.round((i.tsFine - i.tsInizio) / 60000) : '',
    esito: i.esito ?? '',
    xp: i.xpAssegnati,
  }))
  return toCSV(rows)
}

async function sessionsCSV(): Promise<string> {
  const rows = (await db.sessions.toArray()).map((s) => ({
    binario: s.binario,
    attivita: s.attivita,
    previsione: s.previsione,
    realta: s.realta,
    scarto: s.realta !== null && s.previsione !== null ? s.realta - s.previsione : '',
    durata_min: s.durata ?? '',
    data: iso(s.ts),
    risposta_studio: s.rispostaStudio ?? '',
  }))
  return toCSV(rows)
}

export async function exportJSON() {
  const data = await collectAll()
  trigger(`ascesa-${dayKey()}.json`, JSON.stringify(data, null, 2), 'application/json')
  await markBackup()
}

export async function exportTuttoCSV() {
  // un tap -> JSON completo + il CSV piu utile per l'analisi (metriche)
  await exportJSON()
  const csv = await metricEntriesCSV()
  setTimeout(() => trigger(`ascesa-metriche-${dayKey()}.csv`, csv, 'text/csv'), 400)
  await markBackup()
}

export async function exportCSVMetriche() {
  trigger(`ascesa-metriche-${dayKey()}.csv`, await metricEntriesCSV(), 'text/csv')
}
export async function exportCSVImpulsi() {
  trigger(`ascesa-impulsi-${dayKey()}.csv`, await impulsesCSV(), 'text/csv')
}
export async function exportCSVSessioni() {
  trigger(`ascesa-sessioni-${dayKey()}.csv`, await sessionsCSV(), 'text/csv')
}
