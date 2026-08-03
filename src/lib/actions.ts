import { db, getSetting, setSetting } from '../db/db'
import type { ActivityDef, Binario, Modalita, MetricDefinition, MetricEntry } from '../db/types'
import { grantXp, XP } from './xp'
import { xpForActivity, type ActivityDetail } from './activities'
import { dayKey, isoWeekKey, logicalDayKey } from './dates'

// Rimuove le righe XP collegate a una fonte (annullamento preciso, mai penalità).
async function removeXpByRef(ref: string): Promise<void> {
  const rows = await db.xpLedger.filter((x) => x.ref === ref).toArray()
  if (rows.length > 0) await db.xpLedger.bulkDelete(rows.map((x) => x.id!))
}

const IMPULSO_BINARIO: Record<string, Binario> = {
  scroll: 'mente',
  cibo: 'tavola',
  visivo: 'spirito',
  altro: 'mente',
}
const CHECKIN_BINARIO: Record<string, Binario> = {
  wake: 'corpo',
  prelunch: 'tavola',
  pretraining: 'corpo',
  evening: 'spirito',
}
const BOSS_BINARIO: Record<string, Binario> = {
  rientro: 'tavola',
  scroll: 'mente',
}

// --- Metriche ---
export async function getLastEntry(metricKey: string): Promise<MetricEntry | undefined> {
  const entries = await db.metricEntries.where('metricKey').equals(metricKey).toArray()
  entries.sort((a, b) => b.ts - a.ts)
  return entries[0]
}

export async function saveMetricEntry(
  def: MetricDefinition,
  valoreNum: number | null,
  valoreJson: unknown = null,
  note?: string,
  grantXpFlag = true,
): Promise<number> {
  const id = await db.metricEntries.add({
    metricKey: def.key,
    valoreNum,
    valoreJson,
    ts: Date.now(),
    note,
  })
  // Metriche osservative (calorie) o inserite dentro un check-in: nessun XP a parte.
  if (def.config?.noXp === true || !grantXpFlag) return 0
  return grantXp(def.binarioXp ?? 'mente', `metrica:${def.key}`, XP.metrica, `metric:${id}`)
}

/**
 * Annulla una registrazione: elimina la voce e RIMUOVE gli XP che aveva dato.
 * Non e una penalita: il totale non va mai sotto zero (si toglie solo cio che era stato aggiunto)
 * e il livello raggiunto resta (regola 2.5).
 */
export async function deleteMetricEntry(entryId: number): Promise<void> {
  const entry = await db.metricEntries.get(entryId)
  await db.metricEntries.delete(entryId)

  const byRef = await db.xpLedger.filter((x) => x.ref === `metric:${entryId}`).toArray()
  if (byRef.length > 0) {
    await db.xpLedger.bulkDelete(byRef.map((x) => x.id!))
  } else if (entry) {
    // fallback per registrazioni salvate prima del collegamento: azione + timestamp vicino
    const cands = await db.xpLedger
      .filter((x) => x.azione === `metrica:${entry.metricKey}` && Math.abs(x.ts - entry.ts) < 8000)
      .toArray()
    const one = cands.sort((a, b) => Math.abs(a.ts - entry.ts) - Math.abs(b.ts - entry.ts))[0]
    if (one) await db.xpLedger.delete(one.id!)
  }
}

// --- Impulsi (regola 2.2) ---
export async function logImpulse(
  tipo: string,
  luogo: string,
  intensita: number,
): Promise<number> {
  const binario = IMPULSO_BINARIO[tipo] ?? 'mente'
  // XP assegnati SUBITO, sul solo atto di registrare. L'esito non li cambiera mai.
  const id = (await db.impulses.add({
    tipo,
    luogo,
    intensita,
    tsInizio: Date.now(),
    tsFine: null,
    esito: null,
    xpAssegnati: 0,
  })) as number
  const xp = await grantXp(binario, `impulso:${tipo}`, XP.impulso, `impulse:${id}`)
  await db.impulses.update(id, { xpAssegnati: xp })
  return xp
}

// La base XP resta sempre. Se resisti / usi la contromossa arriva un BONUS additivo
// (mai penalità se cedi). 'contromossa' e la mossa scritta stavolta, diversa ogni volta.
export async function closeImpulse(
  id: number,
  esito: string,
  contromossa: string | null = null,
): Promise<number> {
  const imp = await db.impulses.get(id)
  await db.impulses.update(id, { esito, tsFine: Date.now(), contromossa })
  if (!imp) return 0
  const bin = IMPULSO_BINARIO[imp.tipo] ?? 'mente'
  if (esito === 'resistito') return grantXp(bin, `impulso-vinto:${imp.tipo}`, XP.impulsoResistito, `impulse-bonus:${id}`)
  if (esito === 'passato') return grantXp(bin, `impulso-passato:${imp.tipo}`, XP.impulsoPassato, `impulse-bonus:${id}`)
  return 0 // 'seguito': nessun bonus, ma la base non si tocca
}

export async function deleteImpulse(id: number): Promise<void> {
  await removeXpByRef(`impulse:${id}`)
  await removeXpByRef(`impulse-bonus:${id}`)
  await db.impulses.delete(id)
}

// Se non segni l'esito entro 2h, l'impulso si chiude da solo come "passato" (senza bonus).
export async function sweepOpenImpulses(): Promise<void> {
  const now = Date.now()
  const open = (await db.impulses.toArray()).filter((i) => i.tsFine === null)
  for (const i of open) {
    if (now - i.tsInizio > 2 * 3_600_000) {
      await db.impulses.update(i.id!, {
        tsFine: i.tsInizio + 2 * 3_600_000,
        esito: 'passato',
        autoClosed: true,
      })
    }
  }
}

// --- Sessioni (previsione/realta) ---
export async function startSession(
  binario: Binario,
  attivita: string,
  previsione: number,
  domandaStudio: string | null = null,
): Promise<number> {
  const id = (await db.sessions.add({
    binario,
    attivita,
    previsione,
    realta: null,
    durata: null,
    ts: Date.now(),
    tsFine: null,
    domandaStudio,
    rispostaStudio: null,
  })) as number
  return grantXp(binario, `sessione:${attivita}`, XP.sessionePrevisione, `session:${id}`)
}

export async function closeSession(
  id: number,
  realta: number,
  durataMin: number,
  rispostaStudio: string | null = null,
): Promise<number> {
  const s = await db.sessions.get(id)
  if (!s) return 0
  await db.sessions.update(id, {
    realta,
    durata: durataMin,
    tsFine: Date.now(),
    rispostaStudio,
  })
  return grantXp(s.binario, `sessione-realta:${s.attivita}`, XP.sessioneRealta, `session-close:${id}`)
}

export async function deleteSession(id: number): Promise<void> {
  await removeXpByRef(`session:${id}`)
  await removeXpByRef(`session-close:${id}`)
  await db.sessions.delete(id)
}

// --- Check-in ---
export async function addCheckin(
  tipo: 'wake' | 'prelunch' | 'pretraining' | 'evening',
  risposte: Record<string, unknown>,
  metricheLoggate = 0,
): Promise<number> {
  const id = (await db.checkins.add({ tipo, ts: Date.now(), risposte })) as number
  // XP del check-in: base + piccolo bonus per le misure inserite, con tetto (anti box-ticking).
  const bonus = Math.min(metricheLoggate * 2, 12)
  return grantXp(CHECKIN_BINARIO[tipo], `checkin:${tipo}`, XP.checkin + bonus, `checkin:${id}`)
}

export async function deleteCheckin(id: number): Promise<void> {
  await removeXpByRef(`checkin:${id}`)
  await db.checkins.delete(id)
}

export async function checkinFatalOggi(tipo: string): Promise<boolean> {
  const oggi = logicalDayKey()
  const rows = await db.checkins.where('tipo').equals(tipo).toArray()
  return rows.some((r) => logicalDayKey(r.ts) === oggi)
}

// --- Boss (XP sulla preparazione, sez. 3.2) ---
interface BossGiorno {
  rientro?: { mossa: string; ts: number }
  scroll?: { mossa: string; ts: number }
  incontri?: { boss: string; pronta: boolean; ts: number }[]
}

export async function getBossOggi(): Promise<BossGiorno> {
  return getSetting<BossGiorno>(`boss:${dayKey()}`, {})
}

export async function declareBoss(bossKey: 'rientro' | 'scroll', mossa: string): Promise<number> {
  const key = `boss:${dayKey()}`
  const cur = await getSetting<BossGiorno>(key, {})
  if (cur[bossKey]) return 0 // gia dichiarato oggi, niente doppio XP
  cur[bossKey] = { mossa, ts: Date.now() }
  await setSetting(key, cur)
  return grantXp(BOSS_BINARIO[bossKey], `boss-prep:${bossKey}`, XP.bossPrep)
}

// Registra solo il dato dell'incontro: nessun XP, nessun giudizio.
export async function recordBossEncounter(
  bossKey: 'rientro' | 'scroll',
  pronta: boolean,
): Promise<void> {
  const key = `boss:${dayKey()}`
  const cur = await getSetting<BossGiorno>(key, {})
  cur.incontri = cur.incontri ?? []
  cur.incontri.push({ boss: bossKey, pronta, ts: Date.now() })
  await setSetting(key, cur)
}

// --- Missione settimanale ---
interface Missione {
  testo: string
  fatta: boolean
}
export async function getMissione(): Promise<Missione | null> {
  return getSetting<Missione | null>(`mission:${isoWeekKey()}`, null)
}
export async function setMissione(testo: string): Promise<void> {
  await setSetting(`mission:${isoWeekKey()}`, { testo, fatta: false })
}
export async function completaMissione(): Promise<number> {
  const key = `mission:${isoWeekKey()}`
  const m = await getSetting<Missione | null>(key, null)
  if (!m || m.fatta) return 0
  await setSetting(key, { ...m, fatta: true })
  return grantXp('vita', 'missione', XP.missione)
}

// --- Trasferta manuale (override della fase) ---
export async function getModalitaOverride(): Promise<Modalita | null> {
  return getSetting<Modalita | null>('modalita_override', null)
}
export async function setModalitaOverride(m: Modalita | null): Promise<void> {
  await setSetting('modalita_override', m)
}

// --- Quick-log Vita (riposo/ozio/altri): un tap, XP subito ---
export async function logVita(attivita: string): Promise<number> {
  return grantXp('vita', `vita:${attivita}`, XP.vita)
}

// --- Calibrazione predittiva ---
export async function addPrediction(testo: string, confidenza: number): Promise<number> {
  const id = (await db.predictions.add({
    testo,
    confidenza,
    settimana: isoWeekKey(),
    esito: null,
    tsCreazione: Date.now(),
    tsVerifica: null,
  })) as number
  await grantXp('mente', 'calibrazione', Math.round(XP.calibrazione / 3), `pred:${id}`)
  return id
}
export async function verifyPrediction(id: number, esito: boolean): Promise<void> {
  await db.predictions.update(id, { esito, tsVerifica: Date.now() })
}
export async function deletePrediction(id: number): Promise<void> {
  await removeXpByRef(`pred:${id}`)
  await db.predictions.delete(id)
}

// --- Attività a punti ---
export async function logActivity(def: ActivityDef, dettaglio: ActivityDetail): Promise<number> {
  const xp0 = xpForActivity(def, dettaglio)
  const id = (await db.activityLogs.add({
    defKey: def.key,
    binario: def.binario,
    xp: 0,
    ts: Date.now(),
    dettaglio,
  })) as number
  const xp = await grantXp(def.binario, `attivita:${def.key}`, xp0, `activity:${id}`)
  await db.activityLogs.update(id, { xp })
  return xp
}

export async function deleteActivityLog(id: number): Promise<void> {
  await removeXpByRef(`activity:${id}`)
  await db.activityLogs.delete(id)
}

// Una sfida/dieta si può prendere una volta per periodo (giorno o settimana).
export async function attivitaFattaNelPeriodo(defKey: string, periodo: 'daily' | 'weekly'): Promise<boolean> {
  const logs = await db.activityLogs.where('defKey').equals(defKey).toArray()
  if (periodo === 'weekly') return logs.some((l) => isoWeekKey(l.ts) === isoWeekKey())
  return logs.some((l) => logicalDayKey(l.ts) === logicalDayKey())
}
