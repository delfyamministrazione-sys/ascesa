import { useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { MetricDefinition } from '../db/types'
import { MetricInput, type MetricValue } from '../components/MetricInput'
import { BigButton, Chip, useToast } from '../components/ui'
import { addCheckin, getLastEntry, saveMetricEntry } from '../lib/actions'
import { BINARI } from '../lib/binari'
import { domandaSeralePerGiorno } from '../lib/eveningQuestions'

type Tipo = 'wake' | 'prelunch' | 'pretraining' | 'evening'

const TITOLI: Record<Tipo, string> = {
  wake: 'Risveglio',
  prelunch: 'Pre-pranzo',
  pretraining: 'Pre-allenamento',
  evening: 'Sera',
}

function MiniSlider({
  label,
  min,
  max,
  value,
  onChange,
}: {
  label: string
  min: number
  max: number
  value: number | null
  onChange: (n: number) => void
}) {
  const cur = value ?? Math.round((min + max) / 2)
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-lg font-bold tabular-nums">{cur}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={cur}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-3 w-full appearance-none rounded-full bg-panel2 accent-accent"
      />
    </div>
  )
}

function MiniChoice({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: string[]
  value: string | null
  onChange: (s: string) => void
}) {
  return (
    <div>
      <div className="mb-1 text-sm font-medium">{label}</div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o} active={value === o} onClick={() => onChange(o)}>
            {o}
          </Chip>
        ))}
      </div>
    </div>
  )
}

export function CheckinFlow({ tipo, onClose }: { tipo: Tipo; onClose: () => void }) {
  const { toast } = useToast()
  const allDefs = useLiveQuery(() => db.metricDefinitions.toArray(), [])
  const wakeDefs = useMemo<MetricDefinition[]>(
    () =>
      (allDefs ?? [])
        .filter((d) => d.attiva && d.config.checkin === tipo)
        .sort((a, b) => a.ordine - b.ordine),
    [allDefs, tipo],
  )

  const [metricVals, setMetricVals] = useState<Record<string, MetricValue>>({})
  const [risposte, setRisposte] = useState<Record<string, unknown>>({})
  const [saving, setSaving] = useState(false)

  // precompilazione delle metriche del check-in dall'ultima rilevazione
  useEffect(() => {
    let alive = true
    Promise.all(
      wakeDefs.map(async (d) => {
        const e = await getLastEntry(d.key)
        return [d.key, e] as const
      }),
    ).then((pairs) => {
      if (!alive) return
      const init: Record<string, MetricValue> = {}
      for (const [k, e] of pairs) {
        if (e) init[k] = { num: e.valoreNum ?? null, json: e.valoreJson ?? undefined }
      }
      setMetricVals(init)
    })
    return () => {
      alive = false
    }
  }, [wakeDefs])

  const setV = (k: string, v: MetricValue) => setMetricVals((p) => ({ ...p, [k]: v }))
  const setR = (k: string, v: unknown) => setRisposte((p) => ({ ...p, [k]: v }))

  const complete = async () => {
    setSaving(true)
    let count = 0
    for (const d of wakeDefs) {
      const v = metricVals[d.key]
      if (v && (v.num !== null || (v.json !== undefined && v.json !== null && v.json !== ''))) {
        // le misure dentro il check-in non danno XP a parte: li conta il check-in (con tetto)
        await saveMetricEntry(d, v.num, v.json ?? null, undefined, false)
        count++
      }
    }
    const xp = await addCheckin(tipo, risposte, count)
    if (navigator.vibrate) navigator.vibrate(15)
    toast(<span className="font-semibold">Check-in salvato · +{xp} XP</span>)
    setSaving(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-bg">
      <div className="mx-auto max-w-md px-4 pb-28 pt-safe">
        <div className="flex items-center justify-between py-4">
          <h1 className="text-xl font-bold">{TITOLI[tipo]}</h1>
          <button onClick={onClose} className="text-2xl text-ink-dim">
            ✕
          </button>
        </div>

        <div className="space-y-5">
          {/* Metriche associate al check-in (solo wake ne ha di default) */}
          {wakeDefs.map((d) => (
            <div key={d.key} className="rounded-2xl border border-line bg-panel p-4">
              <div className="mb-3 flex items-center justify-between">
                <span className="font-semibold">{d.nome}</span>
                <span className="text-xs text-ink-dim">{d.unita}</span>
              </div>
              <MetricInput
                def={d}
                value={metricVals[d.key] ?? { num: null }}
                onChange={(v) => setV(d.key, v)}
              />
            </div>
          ))}

          {/* Campi qualitativi per tipo */}
          {tipo === 'wake' && (
            <div className="space-y-4 rounded-2xl border border-line bg-panel p-4">
              <MiniSlider
                label="Energia"
                min={1}
                max={5}
                value={(risposte.energia as number) ?? null}
                onChange={(n) => setR('energia', n)}
              />
              <div>
                <div className="mb-1 text-sm font-medium">Una intenzione per oggi</div>
                <input
                  value={(risposte.intenzione as string) ?? ''}
                  onChange={(e) => setR('intenzione', e.target.value)}
                  placeholder="In una riga (facoltativo)"
                  className="w-full rounded-xl border border-line bg-panel2 px-3 py-3 outline-none"
                />
              </div>
            </div>
          )}

          {tipo === 'prelunch' && (
            <div className="space-y-4 rounded-2xl border border-line bg-panel p-4">
              <MiniChoice
                label="Cos e questa spinta?"
                options={['Fame vera', 'Impulso', 'Misto']}
                value={(risposte.spinta as string) ?? null}
                onChange={(s) => setR('spinta', s)}
              />
              <MiniSlider
                label="Fame reale"
                min={1}
                max={5}
                value={(risposte.fame as number) ?? null}
                onChange={(n) => setR('fame', n)}
              />
              <MiniSlider
                label="Stress"
                min={1}
                max={5}
                value={(risposte.stress as number) ?? null}
                onChange={(n) => setR('stress', n)}
              />
            </div>
          )}

          {tipo === 'pretraining' && (
            <div className="space-y-4 rounded-2xl border border-line bg-panel p-4">
              <MiniSlider
                label="Voglia di allenarti"
                min={1}
                max={5}
                value={(risposte.voglia as number) ?? null}
                onChange={(n) => setR('voglia', n)}
              />
              <MiniSlider
                label="Condizione del corpo"
                min={1}
                max={5}
                value={(risposte.condizione as number) ?? null}
                onChange={(n) => setR('condizione', n)}
              />
              <MiniSlider
                label="Previsione di gradimento (1-10)"
                min={1}
                max={10}
                value={(risposte.previsione as number) ?? null}
                onChange={(n) => setR('previsione', n)}
              />
            </div>
          )}

          {tipo === 'evening' && (
            <div className="space-y-4 rounded-2xl border border-line bg-panel p-4">
              <div>
                <div className="mb-2 text-sm font-medium">Binari toccati oggi</div>
                <div className="flex flex-wrap gap-2">
                  {BINARI.map((b) => {
                    const on = ((risposte.binari as Record<string, boolean>) ?? {})[b.key]
                    return (
                      <Chip
                        key={b.key}
                        active={!!on}
                        color={b.color}
                        onClick={() =>
                          setR('binari', {
                            ...((risposte.binari as Record<string, boolean>) ?? {}),
                            [b.key]: !on,
                          })
                        }
                      >
                        {b.nome}
                      </Chip>
                    )
                  })}
                </div>
              </div>
              <div>
                <div className="mb-1 text-sm font-medium text-accent">
                  {domandaSeralePerGiorno()}
                </div>
                <textarea
                  value={(risposte.risposta_serale as string) ?? ''}
                  onChange={(e) => setR('risposta_serale', e.target.value)}
                  rows={3}
                  placeholder="Scrivi quello che ti viene (facoltativo)"
                  className="w-full rounded-xl border border-line bg-panel2 px-3 py-3 outline-none"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 border-t border-line bg-bg/95 px-4 py-3 pb-safe backdrop-blur">
        <div className="mx-auto max-w-md">
          <BigButton onClick={complete} disabled={saving}>
            {saving ? 'Salvo…' : 'Completa check-in'}
          </BigButton>
        </div>
      </div>
    </div>
  )
}
