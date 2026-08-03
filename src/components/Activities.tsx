import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { ActivityDef, ActivityLog } from '../db/types'
import { Card, Chip, useToast } from './ui'
import { BINARI, binario } from '../lib/binari'
import { logActivity } from '../lib/actions'
import { isoWeekKey, logicalDayKey } from '../lib/dates'

function xpLabel(def: ActivityDef): string {
  if (def.tipo === 'timed') return `${def.config.perMinute ?? 1} XP/min · max ${def.config.cap ?? '—'}`
  if (def.tipo === 'tiered') return (def.config.tiers ?? []).map((t) => `${t.label} ${t.xp}`).join(' · ')
  return `+${def.baseXp} XP`
}

function doneInPeriod(def: ActivityDef, logs: ActivityLog[]): boolean {
  const per = def.config.periodo
  if (!per) return false
  const mine = logs.filter((l) => l.defKey === def.key)
  if (per === 'weekly') return mine.some((l) => isoWeekKey(l.ts) === isoWeekKey())
  return mine.some((l) => logicalDayKey(l.ts) === logicalDayKey())
}

function ActivityCard({ def, logs }: { def: ActivityDef; logs: ActivityLog[] }) {
  const { toastXp } = useToast()
  const [minuti, setMinuti] = useState<number | null>(null)
  const info = binario(def.binario)
  const fatta = doneInPeriod(def, logs)

  const registra = async (dettaglio: Record<string, unknown>) => {
    const xp = await logActivity(def, dettaglio)
    if (navigator.vibrate) navigator.vibrate(12)
    toastXp(xp, def.binario)
    setMinuti(null)
  }

  if (def.config.periodo && fatta) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-vita/40 bg-vita/10 px-4 py-3">
        <span className="text-sm font-medium">{def.nome}</span>
        <span className="text-sm font-semibold text-vita">Fatta ✓</span>
      </div>
    )
  }

  return (
    <Card style={{ borderLeft: `3px solid ${info.color}` }}>
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold">{def.nome}</div>
          <div className="text-[11px] text-ink-dim">{xpLabel(def)}</div>
        </div>
      </div>

      {def.tipo === 'timed' && (
        <div>
          <div className="mb-2 flex flex-wrap gap-2">
            {[10, 15, 20, 30, 45, 60].map((m) => (
              <Chip key={m} active={minuti === m} color={info.color} onClick={() => setMinuti(m)}>
                {m}′
              </Chip>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input
              inputMode="numeric"
              value={minuti ?? ''}
              onChange={(e) => setMinuti(e.target.value === '' ? null : Number(e.target.value))}
              placeholder="min"
              className="w-20 rounded-xl border border-line bg-panel2 px-3 py-2 text-center outline-none"
            />
            <button
              onClick={() => minuti && registra({ minutes: minuti })}
              disabled={!minuti}
              className="flex-1 rounded-xl py-2.5 text-sm font-semibold text-white disabled:bg-panel2 disabled:text-ink-dim"
              style={minuti ? { background: info.color } : undefined}
            >
              Registra
              {minuti ? ` · +${Math.min(def.config.cap ?? 9999, Math.round(minuti * (def.config.perMinute ?? 1)))} XP` : ''}
            </button>
          </div>
        </div>
      )}

      {def.tipo === 'tiered' && (
        <div className="flex flex-wrap gap-2">
          {(def.config.tiers ?? []).map((t) => (
            <button
              key={t.key}
              onClick={() => registra({ tier: t.key })}
              className="flex-1 rounded-xl border border-line bg-panel2 px-2 py-2.5 text-sm font-semibold active:scale-[.98]"
            >
              {t.label}
              <span className="block text-[11px] text-ink-dim">+{t.xp}</span>
            </button>
          ))}
        </div>
      )}

      {(def.tipo === 'fixed' || def.tipo === 'reps' || def.tipo === 'sfida') && (
        <button
          onClick={() => registra({})}
          className="w-full rounded-xl py-2.5 text-sm font-semibold text-white active:scale-[.98]"
          style={{ background: info.color }}
        >
          Registra · +{def.baseXp} XP
        </button>
      )}
    </Card>
  )
}

// Logger completo per la schermata /attivita (attività, escluse le sfide pure)
export function ActivityLogger() {
  const defs = useLiveQuery(() => db.activityDefs.toArray(), [])
  const logs = useLiveQuery(() => db.activityLogs.toArray(), [])
  const [bin, setBin] = useState(BINARI[0].key)

  const perBin = useMemo(
    () =>
      (defs ?? [])
        .filter((d) => d.attiva && d.binario === bin && !d.key.startsWith('sf_'))
        .sort((a, b) => a.ordine - b.ordine),
    [defs, bin],
  )

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {BINARI.map((b) => (
          <Chip key={b.key} active={bin === b.key} color={b.color} onClick={() => setBin(b.key)}>
            {b.nome}
          </Chip>
        ))}
      </div>
      <div className="space-y-3">
        {perBin.map((d) => (
          <ActivityCard key={d.key} def={d} logs={logs ?? []} />
        ))}
        {perBin.length === 0 && <p className="text-sm text-ink-dim">Nessuna attività per questo binario.</p>}
      </div>
    </div>
  )
}

// Sfide & bonus di oggi (per la home): tutte le attività tipo 'sfida'
export function SfideBox() {
  const defs = useLiveQuery(() => db.activityDefs.toArray(), [])
  const logs = useLiveQuery(() => db.activityLogs.toArray(), [])
  const sfide = (defs ?? []).filter((d) => d.attiva && d.tipo === 'sfida').sort((a, b) => a.ordine - b.ordine)

  if (sfide.length === 0) return null
  return (
    <div className="space-y-2">
      {sfide.map((d) => (
        <ActivityCard key={d.key} def={d} logs={logs ?? []} />
      ))}
    </div>
  )
}
