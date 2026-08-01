import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { MetricDefinition, MetricEntry } from '../db/types'
import { MetricCard } from '../components/MetricCard'
import { Card } from '../components/ui'
import { NutritionForm } from '../components/Nutrition'
import { useProgress } from '../hooks/useProgress'
import { MODALITA } from '../lib/phases'
import { MOMENTI, isDoneInPeriod, momentoOf, priorityRank, type Momento } from '../lib/registra'
import { deleteMetricEntry } from '../lib/actions'
import { timeHHMM } from '../lib/dates'

function Accordion({
  color,
  titolo,
  badge,
  hint,
  defaultOpen,
  children,
}: {
  color: string
  titolo: string
  badge: string
  hint?: string
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(!!defaultOpen)
  return (
    <div className="mb-3 overflow-hidden rounded-2xl border border-line bg-panel">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-left active:bg-panel2"
      >
        <span className="h-3.5 w-3.5 shrink-0 rounded-full" style={{ background: color }} />
        <span className="flex-1 font-semibold">{titolo}</span>
        <span className="rounded-full bg-panel2 px-2 py-0.5 text-xs font-medium text-ink-dim">{badge}</span>
        <span className={`text-ink-dim transition-transform ${open ? 'rotate-90' : ''}`}>›</span>
      </button>
      {open && (
        <div className="border-t border-line p-3">
          {hint && <p className="mb-3 px-1 text-xs text-ink-dim">{hint}</p>}
          <div className="space-y-3">{children}</div>
        </div>
      )}
    </div>
  )
}

function formatValue(def: MetricDefinition, entry: MetricEntry): string {
  if (def.tipoInput === 'toggle') return entry.valoreNum === 1 ? 'Si' : 'No'
  if (def.tipoInput === 'photo') return 'foto'
  if (def.tipoInput === 'time' || def.tipoInput === 'choice') return String(entry.valoreJson ?? '')
  if (entry.valoreNum !== null && entry.valoreNum !== undefined) return `${entry.valoreNum} ${def.unita}`.trim()
  if (entry.valoreJson) return String(entry.valoreJson)
  return '—'
}

function RigaFatta({ def, entry }: { def: MetricDefinition; entry: MetricEntry }) {
  const [conferma, setConferma] = useState(false)
  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-panel2 px-3 py-2.5">
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{def.nome}</div>
        <div className="text-xs text-ink-dim">
          {formatValue(def, entry)} · {timeHHMM(entry.ts)}
        </div>
      </div>
      {conferma ? (
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => deleteMetricEntry(entry.id!)}
            className="rounded-lg bg-corpo px-3 py-1.5 text-xs font-semibold text-white"
          >
            Elimina
          </button>
          <button onClick={() => setConferma(false)} className="px-1 text-xs text-ink-dim">
            annulla
          </button>
        </div>
      ) : (
        <button
          onClick={() => setConferma(true)}
          className="shrink-0 rounded-lg border border-line px-3 py-1.5 text-xs font-semibold text-corpo"
        >
          Elimina
        </button>
      )}
    </div>
  )
}

export function Registra() {
  const { modalita } = useProgress()
  const defs = useLiveQuery(() => db.metricDefinitions.toArray(), [])
  const entries = useLiveQuery(() => db.metricEntries.toArray(), [])
  const nutriRow = useLiveQuery(() => db.settings.get('nutrition_enabled'), [])
  const nutriOn = nutriRow?.value === true

  const oraApertura: Momento = new Date().getHours() < 12 ? 'risveglio' : 'giorno'

  const { perMomento, fatte, totRimanenti } = useMemo(() => {
    const attive = (defs ?? []).filter((d) => d.attiva)
    const defMap = new Map(attive.map((d) => [d.key, d]))

    // ultima registrazione NEL PERIODO per ogni metrica
    const lastInPeriod = new Map<string, MetricEntry>()
    for (const e of entries ?? []) {
      const def = defMap.get(e.metricKey)
      if (!def) continue
      if (!isDoneInPeriod(def, e.ts)) continue
      const cur = lastInPeriod.get(e.metricKey)
      if (!cur || e.ts > cur.ts) lastInPeriod.set(e.metricKey, e)
    }

    const perMomento = new Map<Momento, MetricDefinition[]>()
    const fatte: { def: MetricDefinition; entry: MetricEntry }[] = []
    for (const d of attive) {
      const entry = lastInPeriod.get(d.key)
      if (entry) {
        fatte.push({ def: d, entry })
      } else {
        const m = momentoOf(d)
        const arr = perMomento.get(m) ?? []
        arr.push(d)
        perMomento.set(m, arr)
      }
    }
    for (const arr of perMomento.values()) {
      arr.sort((a, b) => priorityRank(a) - priorityRank(b) || a.ordine - b.ordine)
    }
    fatte.sort((a, b) => b.entry.ts - a.entry.ts)
    const totRimanenti = attive.length - fatte.length
    return { perMomento, fatte, totRimanenti }
  }, [defs, entries])

  const nessunaRimanente = totRimanenti === 0 && (defs ?? []).length > 0

  return (
    <div className="mx-auto max-w-md px-4 pb-8 pt-safe">
      <div className="py-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Registra</h1>
          <span className="text-sm text-ink-dim">{totRimanenti} da fare</span>
        </div>
        <p className="text-sm text-ink-dim">
          Registri, il campo si azzera e la voce sparisce fino al prossimo periodo. Vedi solo cosa manca.
        </p>
      </div>

      {modalita !== 'normale' && (
        <div className="mb-3 rounded-xl border border-line bg-panel2 px-3 py-2 text-xs text-ink-dim">
          Sei in <span className="font-semibold text-ink">{MODALITA[modalita].label}</span>: XP a
          moltiplicatore {MODALITA[modalita].moltiplicatore}×.
        </div>
      )}

      {nutriOn && (
        <Accordion color="#f59e0b" titolo="Cibo" badge="pasto" hint="Osservativo: solo dati, nessun punteggio.">
          <NutritionForm />
        </Accordion>
      )}

      {!defs && <p className="text-sm text-ink-dim">Carico…</p>}

      {MOMENTI.map((m) => {
        const arr = perMomento.get(m.key)
        if (!arr || arr.length === 0) return null
        return (
          <Accordion
            key={m.key}
            color={m.color}
            titolo={m.label}
            badge={`${arr.length} da fare`}
            hint={m.hint}
            defaultOpen={m.key === oraApertura}
          >
            {arr.map((d) => (
              <MetricCard key={d.key} def={d} />
            ))}
          </Accordion>
        )
      })}

      {nessunaRimanente && (
        <Card className="text-center">
          <div className="text-lg font-semibold text-vita">Tutto registrato ✓</div>
          <p className="mt-1 text-sm text-ink-dim">
            Non ti manca niente per ora. Le voci torneranno al rinnovo del loro periodo.
          </p>
        </Card>
      )}

      {fatte.length > 0 && (
        <Accordion
          color="#4b5563"
          titolo="Gia registrate"
          badge={`${fatte.length}`}
          hint="Elimina una voce per correggerla: toglie anche gli XP e la rimette tra le cose da fare."
        >
          {fatte.map(({ def, entry }) => (
            <RigaFatta key={def.key} def={def} entry={entry} />
          ))}
        </Accordion>
      )}

      <Card className="mt-3 text-center">
        <p className="text-xs text-ink-dim">Manca una misura? Menu → Metriche per aggiungerla, senza codice.</p>
      </Card>
    </div>
  )
}
