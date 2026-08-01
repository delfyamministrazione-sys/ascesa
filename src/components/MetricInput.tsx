import { useEffect, useRef, useState } from 'react'
import type { MetricDefinition } from '../db/types'
import { Chip } from './ui'

export interface MetricValue {
  num: number | null
  json?: unknown
}

function cfgNum(def: MetricDefinition, key: string, fallback: number): number {
  const v = def.config[key]
  return typeof v === 'number' ? v : fallback
}
function cfgArr(def: MetricDefinition, key: string): string[] {
  const v = def.config[key]
  return Array.isArray(v) ? (v as string[]) : []
}

function fmtClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60)
  const s = Math.floor(totalSec % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

export function MetricInput({
  def,
  value,
  onChange,
}: {
  def: MetricDefinition
  value: MetricValue
  onChange: (v: MetricValue) => void
}) {
  switch (def.tipoInput) {
    case 'number':
      return <NumberField def={def} value={value} onChange={onChange} />
    case 'slider':
      return <SliderField def={def} value={value} onChange={onChange} />
    case 'toggle':
      return <ToggleField value={value} onChange={onChange} />
    case 'timer':
      return <TimerField value={value} onChange={onChange} />
    case 'time':
      return <TimeField value={value} onChange={onChange} />
    case 'choice':
      return <ChoiceField def={def} value={value} onChange={onChange} />
    case 'text':
      return <TextField value={value} onChange={onChange} />
    case 'photo':
      return <PhotoField value={value} onChange={onChange} />
    default:
      return <NumberField def={def} value={value} onChange={onChange} />
  }
}

function NumberField({
  def,
  value,
  onChange,
}: {
  def: MetricDefinition
  value: MetricValue
  onChange: (v: MetricValue) => void
}) {
  const step = cfgNum(def, 'step', 1)
  const min = cfgNum(def, 'min', -Infinity)
  const max = cfgNum(def, 'max', Infinity)
  const decimals = step < 1 ? String(step).split('.')[1]?.length ?? 1 : 0

  const clamp = (n: number) => Math.min(max, Math.max(min, n))
  const set = (n: number | null) => onChange({ num: n })

  const cur = value.num
  const bump = (dir: number) => {
    const base = cur ?? 0
    set(clamp(Number((base + dir * step).toFixed(decimals))))
  }

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={() => bump(-1)}
        className="h-12 w-12 shrink-0 rounded-full border border-line bg-panel2 text-2xl font-light active:scale-95"
      >
        −
      </button>
      <div className="flex min-w-[7rem] items-baseline justify-center gap-1">
        <input
          inputMode="decimal"
          value={cur ?? ''}
          onChange={(e) => {
            const raw = e.target.value.replace(',', '.')
            set(raw === '' ? null : Number(raw))
          }}
          placeholder="—"
          className="w-28 bg-transparent text-center text-4xl font-bold tabular-nums outline-none"
        />
        <span className="text-sm text-ink-dim">{def.unita}</span>
      </div>
      <button
        onClick={() => bump(1)}
        className="h-12 w-12 shrink-0 rounded-full border border-line bg-panel2 text-2xl font-light active:scale-95"
      >
        +
      </button>
    </div>
  )
}

function SliderField({
  def,
  value,
  onChange,
}: {
  def: MetricDefinition
  value: MetricValue
  onChange: (v: MetricValue) => void
}) {
  const min = cfgNum(def, 'min', 1)
  const max = cfgNum(def, 'max', 5)
  const cur = value.num ?? Math.round((min + max) / 2)
  return (
    <div>
      <div className="mb-3 text-center text-4xl font-bold tabular-nums">{cur}</div>
      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={cur}
        onChange={(e) => onChange({ num: Number(e.target.value) })}
        className="h-3 w-full cursor-pointer appearance-none rounded-full bg-panel2 accent-accent"
      />
      <div className="mt-1 flex justify-between text-xs text-ink-dim">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  )
}

function ToggleField({
  value,
  onChange,
}: {
  value: MetricValue
  onChange: (v: MetricValue) => void
}) {
  const on = value.num === 1
  return (
    <div className="flex gap-3">
      <button
        onClick={() => onChange({ num: 1, json: true })}
        className={`flex-1 rounded-2xl border py-4 text-base font-semibold ${on ? 'border-vita bg-vita text-white' : 'border-line bg-panel2'}`}
      >
        Si
      </button>
      <button
        onClick={() => onChange({ num: 0, json: false })}
        className={`flex-1 rounded-2xl border py-4 text-base font-semibold ${value.num === 0 ? 'border-line bg-panel2 text-ink' : 'border-line bg-panel2 text-ink-dim'}`}
      >
        No
      </button>
    </div>
  )
}

function TimerField({
  value,
  onChange,
}: {
  value: MetricValue
  onChange: (v: MetricValue) => void
}) {
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(value.num ?? 0)
  const startRef = useRef<number>(0)

  useEffect(() => {
    if (!running) return
    startRef.current = Date.now() - elapsed * 1000
    const id = setInterval(() => {
      const e = (Date.now() - startRef.current) / 1000
      setElapsed(e)
    }, 100)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running])

  const stop = () => {
    setRunning(false)
    const v = Math.round(elapsed)
    setElapsed(v)
    onChange({ num: v })
  }
  const reset = () => {
    setRunning(false)
    setElapsed(0)
    onChange({ num: 0 })
  }

  return (
    <div className="text-center">
      <div className="mb-3 text-5xl font-bold tabular-nums">{fmtClock(elapsed)}</div>
      <div className="flex justify-center gap-3">
        {!running ? (
          <button
            onClick={() => setRunning(true)}
            className="rounded-2xl bg-vita px-6 py-3 font-semibold text-white active:scale-95"
          >
            Avvia
          </button>
        ) : (
          <button
            onClick={stop}
            className="rounded-2xl bg-corpo px-6 py-3 font-semibold text-white active:scale-95"
          >
            Stop
          </button>
        )}
        <button
          onClick={reset}
          className="rounded-2xl border border-line bg-panel2 px-6 py-3 font-semibold active:scale-95"
        >
          Azzera
        </button>
      </div>
      <p className="mt-2 text-xs text-ink-dim">Oppure inserisci i secondi a mano sopra, poi salva.</p>
    </div>
  )
}

function TimeField({
  value,
  onChange,
}: {
  value: MetricValue
  onChange: (v: MetricValue) => void
}) {
  const str = (value.json as string) ?? ''
  return (
    <input
      type="time"
      value={str}
      onChange={(e) => {
        const v = e.target.value
        const [h, m] = v.split(':').map(Number)
        onChange({ num: v ? h * 60 + m : null, json: v })
      }}
      className="w-full rounded-2xl border border-line bg-panel2 px-4 py-4 text-center text-2xl font-bold outline-none"
    />
  )
}

function ChoiceField({
  def,
  value,
  onChange,
}: {
  def: MetricDefinition
  value: MetricValue
  onChange: (v: MetricValue) => void
}) {
  const choices = cfgArr(def, 'choices')
  const cur = value.json as string
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {choices.map((c, i) => (
        <Chip key={c} active={cur === c} onClick={() => onChange({ num: i, json: c })}>
          {c}
        </Chip>
      ))}
      {choices.length === 0 && <p className="text-sm text-ink-dim">Nessuna opzione configurata.</p>}
    </div>
  )
}

function TextField({
  value,
  onChange,
}: {
  value: MetricValue
  onChange: (v: MetricValue) => void
}) {
  return (
    <textarea
      value={(value.json as string) ?? ''}
      onChange={(e) => onChange({ num: null, json: e.target.value })}
      rows={3}
      placeholder="Testo libero (facoltativo)"
      className="w-full rounded-2xl border border-line bg-panel2 px-4 py-3 outline-none"
    />
  )
}

function PhotoField({
  value,
  onChange,
}: {
  value: MetricValue
  onChange: (v: MetricValue) => void
}) {
  const url = value.json as string | undefined
  return (
    <div className="flex flex-col items-center gap-3">
      {url && <img src={url} alt="foto" className="max-h-64 rounded-2xl border border-line" />}
      <label className="cursor-pointer rounded-2xl border border-line bg-panel2 px-6 py-3 font-semibold active:scale-95">
        {url ? 'Scatta di nuovo' : 'Scatta / carica foto'}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = () => onChange({ num: null, json: reader.result as string })
            reader.readAsDataURL(file)
          }}
        />
      </label>
    </div>
  )
}
