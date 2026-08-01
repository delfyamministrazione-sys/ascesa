import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Cell, Pie, PieChart, ResponsiveContainer } from 'recharts'
import { db } from '../db/db'
import type { NutritionEntry } from '../db/types'
import { Card, Chip, useToast } from './ui'
import { EXTRA, MACRO, PASTI, macroEnergia, sumDay, type Campo } from '../lib/nutrition'
import { dayKey } from '../lib/dates'

function NumberRow({
  campo,
  value,
  onChange,
}: {
  campo: Campo
  value: number | null
  onChange: (n: number | null) => void
}) {
  const step = campo.step ?? 1
  const dec = step < 1 ? 1 : 0
  const bump = (dir: number) =>
    onChange(Number(Math.max(0, (value ?? 0) + dir * step).toFixed(dec)))
  return (
    <div className="flex items-center gap-2">
      <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: campo.color }} />
      <span className="flex-1 text-sm">{campo.label}</span>
      <button onClick={() => bump(-1)} className="h-8 w-8 rounded-lg border border-line bg-panel2 text-lg leading-none">
        −
      </button>
      <input
        inputMode="decimal"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value.replace(',', '.')))}
        placeholder="0"
        className="w-14 bg-transparent text-center text-lg font-bold tabular-nums outline-none"
      />
      <button onClick={() => bump(1)} className="h-8 w-8 rounded-lg border border-line bg-panel2 text-lg leading-none">
        +
      </button>
      <span className="w-5 text-xs text-ink-dim">{campo.unita}</span>
    </div>
  )
}

const VUOTO: Omit<NutritionEntry, 'id' | 'ts'> = {
  pasto: 'Pranzo',
  nome: '',
  kcal: null,
  carbo: null,
  proteine: null,
  grassi: null,
  sale: null,
  fibre: null,
  zuccheri: null,
}

export function NutritionForm() {
  const { toast } = useToast()
  const [m, setM] = useState<Omit<NutritionEntry, 'id' | 'ts'>>({ ...VUOTO })
  const set = (patch: Partial<typeof m>) => setM((p) => ({ ...p, ...patch }))

  const kcalStimate =
    (m.carbo ?? 0) * 4 + (m.proteine ?? 0) * 4 + (m.grassi ?? 0) * 9

  const salva = async () => {
    await db.nutrition.add({ ...m, kcal: m.kcal ?? (kcalStimate || null), ts: Date.now() })
    toast('Pasto registrato.')
    setM({ ...VUOTO, pasto: m.pasto })
  }

  const puoSalvare =
    m.kcal !== null || m.carbo !== null || m.proteine !== null || m.grassi !== null

  return (
    <Card>
      <div className="mb-3 flex flex-wrap gap-2">
        {PASTI.map((p) => (
          <Chip key={p} active={m.pasto === p} color="#f59e0b" onClick={() => set({ pasto: p })}>
            {p}
          </Chip>
        ))}
      </div>

      <input
        value={m.nome}
        onChange={(e) => set({ nome: e.target.value })}
        placeholder="Cosa hai mangiato (facoltativo)"
        className="mb-3 w-full rounded-xl border border-line bg-panel2 px-3 py-2.5 text-sm outline-none"
      />

      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">Calorie</span>
        <div className="flex items-center gap-2">
          <input
            inputMode="numeric"
            value={m.kcal ?? ''}
            onChange={(e) => set({ kcal: e.target.value === '' ? null : Number(e.target.value) })}
            placeholder={kcalStimate ? String(kcalStimate) : '0'}
            className="w-20 rounded-lg border border-line bg-panel2 px-2 py-1.5 text-center text-lg font-bold tabular-nums outline-none"
          />
          <span className="text-xs text-ink-dim">kcal</span>
        </div>
      </div>
      {kcalStimate > 0 && m.kcal === null && (
        <div className="mb-3 text-[11px] text-ink-dim">Stima dai macro: {kcalStimate} kcal (modificabile).</div>
      )}

      <div className="space-y-2.5">
        {MACRO.map((c) => (
          <NumberRow key={c.key} campo={c} value={m[c.key]} onChange={(n) => set({ [c.key]: n } as Partial<typeof m>)} />
        ))}
        <div className="my-1 border-t border-line" />
        {EXTRA.map((c) => (
          <NumberRow key={c.key} campo={c} value={m[c.key]} onChange={(n) => set({ [c.key]: n } as Partial<typeof m>)} />
        ))}
      </div>

      <button
        onClick={salva}
        disabled={!puoSalvare}
        className="mt-4 w-full rounded-xl py-3 text-sm font-semibold text-white disabled:bg-panel2 disabled:text-ink-dim"
        style={puoSalvare ? { background: '#f59e0b' } : undefined}
      >
        Registra pasto
      </button>
      <p className="mt-2 text-center text-[11px] text-ink-dim">
        Solo dati: nessun obiettivo, nessun punteggio, nessun giudizio.
      </p>
    </Card>
  )
}

export function NutritionDay() {
  const oggi = dayKey()
  const entries = useLiveQuery(() => db.nutrition.toArray(), [])
  const t = sumDay(entries ?? [], oggi)
  const donut = macroEnergia(t)
  const pastiOggi = (entries ?? []).filter((e) => dayKey(e.ts) === oggi).sort((a, b) => b.ts - a.ts)

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex items-center gap-4">
          <div className="relative h-28 w-28 shrink-0">
            {donut.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={donut} dataKey="value" innerRadius={34} outerRadius={52} paddingAngle={2} stroke="none">
                    {donut.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center rounded-full border border-line text-xs text-ink-dim">
                niente oggi
              </div>
            )}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-xl font-bold tabular-nums">{t.kcal}</div>
              <div className="text-[10px] text-ink-dim">kcal oggi</div>
            </div>
          </div>
          <div className="flex-1 space-y-1.5">
            {MACRO.map((c) => (
              <div key={c.key} className="flex items-center gap-2 text-sm">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: c.color }} />
                <span className="flex-1 text-ink-dim">{c.label}</span>
                <span className="font-semibold tabular-nums">{Math.round(t[c.key])} g</span>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-3 flex justify-between border-t border-line pt-2 text-xs text-ink-dim">
          {EXTRA.map((c) => (
            <span key={c.key}>
              {c.label}: <span className="font-semibold text-ink">{Math.round(t[c.key] * 10) / 10}{c.unita}</span>
            </span>
          ))}
        </div>
      </Card>

      {pastiOggi.length > 0 && (
        <Card>
          <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-ink-dim">Pasti di oggi</div>
          <div className="space-y-2">
            {pastiOggi.map((p) => (
              <div key={p.id} className="flex items-center justify-between text-sm">
                <div>
                  <span className="font-medium">{p.pasto}</span>
                  {p.nome && <span className="text-ink-dim"> · {p.nome}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="tabular-nums">{p.kcal ?? 0} kcal</span>
                  <button onClick={() => db.nutrition.delete(p.id!)} className="text-ink-dim">
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}
