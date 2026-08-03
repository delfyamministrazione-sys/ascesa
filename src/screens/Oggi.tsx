import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { Binario, Modalita, Session } from '../db/types'
import { Card, Chip, ProgressBar, SectionTitle, useToast } from '../components/ui'
import { useProgress } from '../hooks/useProgress'
import { BINARI, binario } from '../lib/binari'
import { MODALITA } from '../lib/phases'
import { logicalDayKey, shortDate } from '../lib/dates'
import { ATTIVITA_PER_BINARIO, domandaStudioPerGiorno } from '../lib/options'
import {
  closeSession,
  completaMissione,
  deleteSession,
  getMissione,
  setMissione,
  setModalitaOverride,
  startSession,
} from '../lib/actions'
import { daysSince, getLastBackup } from '../lib/storage'
import { SfideBox } from '../components/Activities'
import { CheckinFlow } from './CheckinFlow'

type Tipo = 'wake' | 'prelunch' | 'pretraining' | 'evening'
const CHECKINS: { tipo: Tipo; label: string }[] = [
  { tipo: 'wake', label: 'Risveglio' },
  { tipo: 'prelunch', label: 'Pre-pranzo' },
  { tipo: 'pretraining', label: 'Pre-allen.' },
  { tipo: 'evening', label: 'Sera' },
]
const CHECKIN_META: Record<Tipo, { label: string; color: string }> = {
  wake: { label: 'Check-in Risveglio', color: '#ef4444' },
  prelunch: { label: 'Check-in Pre-pranzo', color: '#f59e0b' },
  pretraining: { label: 'Check-in Pre-allenamento', color: '#ef4444' },
  evening: { label: 'Check-in Sera', color: '#8b5cf6' },
}
export function Oggi() {
  const { progress, streak, modalita, fase, totaleXp } = useProgress()
  const [checkinAttivo, setCheckinAttivo] = useState<Tipo | null>(null)
  const navigate = useNavigate()

  const oggi = logicalDayKey()
  const checkinsOggi = useLiveQuery(async () => {
    const all = await db.checkins.toArray()
    return new Set(all.filter((c) => logicalDayKey(c.ts) === oggi).map((c) => c.tipo))
  }, [oggi])
  const overrideRow = useLiveQuery(() => db.settings.get('modalita_override'), [])
  const backupRow = useLiveQuery(() => getLastBackup(), [])

  const done = checkinsOggi ?? new Set<string>()
  const isTrasferta = modalita !== 'normale'
  const override = (overrideRow?.value as Modalita | undefined) ?? null
  const giorniBackup = daysSince((backupRow ?? null) as number | null)
  const backupUrgente = backupRow !== undefined && (giorniBackup === null || giorniBackup >= 4)

  const ora = new Date().getHours()
  let prossimo: Tipo | null = null
  if (!isTrasferta && ora < 11 && !done.has('wake')) prossimo = 'wake'
  else if (!isTrasferta && ora >= 11 && ora < 15 && !done.has('prelunch')) prossimo = 'prelunch'
  else if (!isTrasferta && ora >= 15 && ora < 20 && !done.has('pretraining')) prossimo = 'pretraining'
  else if (ora >= 18 && !done.has('evening')) prossimo = 'evening'

  return (
    <div className="mx-auto max-w-md px-4 pb-8 pt-safe">
      <div className="flex items-center justify-between py-4">
        <div>
          <div className="text-xs uppercase tracking-wider text-ink-dim">{shortDate(new Date())}</div>
          <h1 className="text-2xl font-bold">Ascesa</h1>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold tabular-nums">🔥 {streak}</div>
          <div className="text-[11px] text-ink-dim">giorni di fila</div>
        </div>
      </div>

      {backupUrgente && (
        <button
          onClick={() => navigate('/menu')}
          className="mb-3 w-full rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-left"
        >
          <div className="text-sm font-semibold text-amber-300">Fai un backup dei dati</div>
          <div className="text-xs text-amber-200/80">
            {giorniBackup === null ? 'Non hai mai esportato.' : `Ultimo backup ${giorniBackup} giorni fa.`}{' '}
            Menu → Esporta (i dati vivono solo su questo telefono).
          </div>
        </button>
      )}

      {prossimo ? (
        <button
          onClick={() => setCheckinAttivo(prossimo)}
          className="mb-3 w-full rounded-2xl p-4 text-left active:scale-[.99]"
          style={{ background: CHECKIN_META[prossimo].color }}
        >
          <div className="text-xs text-white/80">Prossima azione</div>
          <div className="text-lg font-bold text-white">{CHECKIN_META[prossimo].label}</div>
          <div className="text-xs text-white/80">30 secondi, valori gia precompilati.</div>
        </button>
      ) : (
        <button
          onClick={() => navigate('/impulso')}
          className="mb-3 w-full rounded-2xl border border-line bg-panel p-4 text-left active:scale-[.99]"
        >
          <div className="text-xs text-ink-dim">Prossima azione</div>
          <div className="text-lg font-bold">Tutto in pari per ora</div>
          <div className="text-xs text-ink-dim">Se parte un impulso, registralo.</div>
        </button>
      )}

      {/* Fase + Trasferta manuale */}
      {fase && (
        <Card className="mb-2">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">{fase.nome}</div>
              <div className="text-xs text-ink-dim">
                {MODALITA[modalita].label} · XP ×{MODALITA[modalita].moltiplicatore}
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold tabular-nums">{totaleXp}</div>
              <div className="text-[11px] text-ink-dim">XP totali</div>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            {([
              { k: null, l: 'Auto' },
              { k: 'trasferta', l: 'Trasferta' },
              { k: 'trasferta_leggera', l: 'Traf. leggera' },
            ] as { k: Modalita | null; l: string }[]).map((o) => (
              <button
                key={o.l}
                onClick={() => setModalitaOverride(o.k)}
                className={`flex-1 rounded-xl border py-2 text-xs font-semibold ${
                  override === o.k ? 'border-accent bg-accent/15 text-accent' : 'border-line bg-panel2 text-ink-dim'
                }`}
              >
                {o.l}
              </button>
            ))}
          </div>
          {override && (
            <p className="mt-2 text-[11px] text-ink-dim">
              Trasferta manuale attiva: streak congelata, solo azioni minime, XP ridotti. "Auto" per
              tornare al calendario.
            </p>
          )}
        </Card>
      )}

      {/* XP per binario */}
      <SectionTitle>Binari</SectionTitle>
      {progress?.promossoQuestaSettimana && (
        <div
          className="mb-2 rounded-xl border px-3 py-2 text-xs"
          style={{ borderColor: binario(progress.promossoQuestaSettimana).color }}
        >
          Questa settimana e salito:{' '}
          <span className="font-semibold" style={{ color: binario(progress.promossoQuestaSettimana).color }}>
            {binario(progress.promossoQuestaSettimana).nome}
          </span>
          . Il prossimo salto la settimana prossima.
        </div>
      )}
      <div className="space-y-2">
        {progress?.perBinario.map((p) => {
          const info = binario(p.binario)
          return (
            <Card key={p.binario} className="py-3">
              <div className="mb-1.5 flex items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white"
                  style={{ background: info.color }}
                >
                  {info.sigla}
                </span>
                <span className="font-semibold">{info.nome}</span>
                <span className="ml-auto text-sm text-ink-dim">
                  Lv {p.level}
                  {p.readyBlocked && <span className="ml-1 text-[10px] text-accent">· pronto ↑</span>}
                </span>
              </div>
              <ProgressBar pct={p.pct} color={info.color} />
              <div className="mt-1 text-[11px] text-ink-dim">
                {p.xpIntoLevel}/{p.xpForNext} XP al livello {p.level + 1}
              </div>
            </Card>
          )
        })}
      </div>

      {/* Check-in */}
      <SectionTitle>Check-in di oggi</SectionTitle>
      <div className="grid grid-cols-2 gap-2">
        {CHECKINS.filter((c) => !isTrasferta || c.tipo === 'evening').map((c) => {
          const isDone = done.has(c.tipo)
          return (
            <button
              key={c.tipo}
              onClick={() => setCheckinAttivo(c.tipo)}
              className={`rounded-2xl border py-4 text-sm font-semibold active:scale-[.98] ${
                isDone ? 'border-vita/50 bg-vita/10 text-vita' : 'border-line bg-panel'
              }`}
            >
              {isDone ? '✓ ' : ''}
              {c.label}
            </button>
          )
        })}
      </div>

      {/* Attività a punti */}
      <button
        onClick={() => navigate('/attivita')}
        className="mt-3 w-full rounded-2xl border border-line bg-panel p-4 text-left active:scale-[.99]"
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold">Attività a punti</div>
            <div className="text-xs text-ink-dim">
              Culto, Bibbia, inglese, allenamento, fisio, lettura, giochi… XP per tempo e sforzo.
            </div>
          </div>
          <span className="text-ink-dim">›</span>
        </div>
      </button>

      {/* Sfide & bonus */}
      <SectionTitle>Sfide & bonus di oggi (facoltative)</SectionTitle>
      <SfideBox />

      <MissioneSettimanale />
      <SessioniBox soloSpirito={isTrasferta} />

      {checkinAttivo && <CheckinFlow tipo={checkinAttivo} onClose={() => setCheckinAttivo(null)} />}
    </div>
  )
}

function MissioneSettimanale() {
  const { toastXp } = useToast()
  const missione = useLiveQuery(() => getMissione(), [])
  const [testo, setTesto] = useState('')

  return (
    <>
      <SectionTitle>Missione della settimana</SectionTitle>
      <Card>
        {!missione ? (
          <div className="space-y-2">
            <input
              value={testo}
              onChange={(e) => setTesto(e.target.value)}
              placeholder="Una sfida singola per la settimana"
              className="w-full rounded-xl border border-line bg-panel2 px-3 py-3 text-sm outline-none"
            />
            <button
              onClick={() => testo.trim() && setMissione(testo.trim())}
              disabled={!testo.trim()}
              className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white disabled:bg-panel2 disabled:text-ink-dim"
            >
              Imposta missione
            </button>
          </div>
        ) : (
          <div>
            <div className="text-sm font-medium">{missione.testo}</div>
            {missione.fatta ? (
              <div className="mt-2 text-sm font-semibold text-vita">Completata ✓ · +50 XP presi</div>
            ) : (
              <button
                onClick={async () => {
                  const xp = await completaMissione()
                  if (navigator.vibrate) navigator.vibrate(20)
                  if (xp > 0) toastXp(xp, 'vita')
                }}
                className="mt-2 w-full rounded-xl bg-vita py-3 text-sm font-semibold text-white"
              >
                Segna completata · +50 XP
              </button>
            )}
          </div>
        )}
      </Card>
    </>
  )
}

function SessioniBox({ soloSpirito }: { soloSpirito: boolean }) {
  const { toastXp, toast } = useToast()
  const aperte = useLiveQuery(async () => {
    const all = await db.sessions.orderBy('ts').reverse().toArray()
    return all.filter((s) => s.realta === null)
  }, [])

  const [binarioSel, setBinarioSel] = useState<Binario>('spirito')
  const [attivita, setAttivita] = useState<string | null>(null)
  const [previsione, setPrevisione] = useState(5)

  const binariDisponibili = soloSpirito ? BINARI.filter((b) => b.key === 'spirito') : BINARI

  const avvia = async () => {
    if (!attivita) return
    const domanda = binarioSel === 'spirito' ? domandaStudioPerGiorno() : null
    const xp = await startSession(binarioSel, attivita, previsione, domanda)
    toastXp(xp, binarioSel)
    setAttivita(null)
    setPrevisione(5)
  }

  return (
    <>
      <SectionTitle>Sessione (previsione → realta)</SectionTitle>
      <Card>
        <div className="mb-2 text-xs text-ink-dim">Prima: quanto prevedi che ti piacera (1-10)?</div>
        <div className="mb-3 flex flex-wrap gap-2">
          {binariDisponibili.map((b) => (
            <Chip
              key={b.key}
              active={binarioSel === b.key}
              color={b.color}
              onClick={() => {
                setBinarioSel(b.key)
                setAttivita(null)
              }}
            >
              {b.nome}
            </Chip>
          ))}
        </div>
        <div className="mb-3 flex flex-wrap gap-2">
          {ATTIVITA_PER_BINARIO[binarioSel].map((a) => (
            <Chip key={a} active={attivita === a} onClick={() => setAttivita(a)}>
              {a}
            </Chip>
          ))}
        </div>
        <div className="mb-1 flex items-center justify-between">
          <span className="text-sm">Previsione</span>
          <span className="text-lg font-bold tabular-nums">{previsione}</span>
        </div>
        <input
          type="range"
          min={1}
          max={10}
          value={previsione}
          onChange={(e) => setPrevisione(Number(e.target.value))}
          className="mb-3 h-3 w-full appearance-none rounded-full bg-panel2 accent-accent"
        />
        <button
          onClick={avvia}
          disabled={!attivita}
          className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:bg-panel2 disabled:text-ink-dim"
          style={attivita ? { background: binario(binarioSel).color } : undefined}
        >
          Avvia sessione · +8 XP
        </button>
      </Card>

      {aperte && aperte.length > 0 && (
        <div className="mt-3 space-y-3">
          {aperte.map((s) => (
            <SessioneApertaCard
              key={s.id}
              s={s}
              onClosed={(xp) => toastXp(xp, s.binario)}
              onDeleted={() => toast('Sessione eliminata, XP annullati.')}
            />
          ))}
        </div>
      )}
    </>
  )
}

function SessioneApertaCard({
  s,
  onClosed,
  onDeleted,
}: {
  s: Session
  onClosed: (xp: number) => void
  onDeleted: () => void
}) {
  const [open, setOpen] = useState(false)
  const [realta, setRealta] = useState(5)
  const [durata, setDurata] = useState<number | null>(null)
  const [risposta, setRisposta] = useState('')
  const [conferma, setConferma] = useState(false)
  const info = binario(s.binario)

  const chiudi = async () => {
    const xp = await closeSession(s.id!, realta, durata ?? 0, s.binario === 'spirito' ? risposta : null)
    if (navigator.vibrate) navigator.vibrate(12)
    onClosed(xp)
  }

  return (
    <Card style={{ borderLeft: `4px solid ${info.color}` }}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold">{s.attivita}</div>
          <div className="text-xs text-ink-dim">
            {info.nome} · previsto {s.previsione}/10
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!open && (
            <button
              onClick={() => setOpen(true)}
              className="rounded-xl border border-line bg-panel2 px-3 py-2 text-sm font-semibold"
            >
              Chiudi
            </button>
          )}
          {conferma ? (
            <button
              onClick={() => deleteSession(s.id!).then(onDeleted)}
              className="rounded-xl bg-corpo px-3 py-2 text-xs font-semibold text-white"
            >
              Elimina
            </button>
          ) : (
            <button onClick={() => setConferma(true)} className="px-2 text-ink-dim">
              ✕
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="mt-3 space-y-3">
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-sm">Quanto ti e piaciuta davvero?</span>
              <span className="text-lg font-bold tabular-nums">{realta}</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={realta}
              onChange={(e) => setRealta(Number(e.target.value))}
              className="h-3 w-full appearance-none rounded-full bg-panel2 accent-accent"
            />
          </div>
          <div>
            <div className="mb-1 text-sm">Durata (min)</div>
            <div className="flex flex-wrap gap-2">
              {[15, 30, 45, 60, 90].map((m) => (
                <Chip key={m} active={durata === m} onClick={() => setDurata(m)}>
                  {m}
                </Chip>
              ))}
            </div>
          </div>
          {s.binario === 'spirito' && s.domandaStudio && (
            <div>
              <div className="mb-1 text-sm font-medium text-spirito">{s.domandaStudio}</div>
              <textarea
                value={risposta}
                onChange={(e) => setRisposta(e.target.value)}
                rows={2}
                placeholder="La tua risposta (prepara la scuola biblica)"
                className="w-full rounded-xl border border-line bg-panel2 px-3 py-2 text-sm outline-none"
              />
            </div>
          )}
          <button
            onClick={chiudi}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white"
            style={{ background: info.color }}
          >
            Salva realta · +10 XP
          </button>
        </div>
      )}
    </Card>
  )
}
