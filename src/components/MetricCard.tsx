import { useEffect, useState } from 'react'
import type { MetricDefinition } from '../db/types'
import { MetricInput, type MetricValue } from './MetricInput'
import { Card, useToast } from './ui'
import { getLastEntry, saveMetricEntry } from '../lib/actions'
import { binarioColor } from '../lib/binari'

export function MetricCard({ def }: { def: MetricDefinition }) {
  const { toastXp } = useToast()
  const [value, setValue] = useState<MetricValue>({ num: null })
  const [saved, setSaved] = useState(false)
  const [showProto, setShowProto] = useState(false)
  const hideDaily = def.config.hideDaily === true

  useEffect(() => {
    // precompilazione dall'ultima rilevazione (regola: input a tap con valori precompilati)
    // eccezione: il peso non si precompila per non mostrare il dato giornaliero.
    if (hideDaily) return
    let alive = true
    getLastEntry(def.key).then((e) => {
      if (!alive || !e) return
      setValue({ num: e.valoreNum ?? null, json: e.valoreJson ?? undefined })
    })
    return () => {
      alive = false
    }
  }, [def.key, hideDaily])

  const canSave =
    value.num !== null ||
    (value.json !== undefined && value.json !== null && value.json !== '')

  const save = async () => {
    const xp = await saveMetricEntry(def, value.num, value.json ?? null)
    if (xp > 0) toastXp(xp, def.binarioXp ?? 'mente')
    setSaved(true)
    // Azzera sempre dopo il salvataggio: la metrica esce dalla lista "da fare"
    // (Registra la nasconde fino al rinnovo del periodo).
    setValue({ num: null })
    setTimeout(() => setSaved(false), 1600)
  }

  return (
    <Card style={{ borderLeft: `3px solid ${binarioColor(def.binarioXp)}` }}>
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold">{def.nome}</div>
          <button
            onClick={() => setShowProto((s) => !s)}
            className="text-left text-xs text-ink-dim underline decoration-dotted"
          >
            {showProto ? def.protocollo : 'protocollo'}
          </button>
        </div>
        {def.config.priorita === true && (
          <span className="rounded-full bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent">
            PRIORITARIA
          </span>
        )}
      </div>

      <MetricInput def={def} value={value} onChange={setValue} />

      <button
        onClick={save}
        disabled={!canSave}
        className="mt-4 w-full rounded-xl bg-panel2 py-3 text-sm font-semibold text-ink transition active:scale-[.98] disabled:text-ink-dim"
        style={canSave ? { background: binarioColor(def.binarioXp), color: '#fff' } : undefined}
      >
        {saved ? 'Registrato ✓' : hideDaily ? 'Registra (mostrato solo in media 7gg)' : 'Registra'}
      </button>
    </Card>
  )
}
