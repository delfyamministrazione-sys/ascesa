import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  CartesianGrid,
  ReferenceLine,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { db } from '../db/db'
import { Card, Chip, SectionTitle, useToast } from '../components/ui'
import { AXIS, ChartBox, Empty, tooltipStyle } from '../components/charts'
import { MetricCard } from '../components/MetricCard'
import {
  alignedPairs,
  dailyMap,
  forzaCorrelazione,
  impulsiDailyMap,
  pearson,
} from '../lib/correlations'
import { addPrediction, deletePrediction, verifyPrediction } from '../lib/actions'
import { isDoneInPeriod } from '../lib/registra'
import { isoWeekKey, shortDate } from '../lib/dates'

type Seg = 'correlazioni' | 'calibrazione' | 'benchmark' | 'foto'
const SEGMENTI: { key: Seg; label: string; color: string }[] = [
  { key: 'correlazioni', label: 'Correlazioni', color: '#a78bfa' },
  { key: 'calibrazione', label: 'Calibrazione', color: '#3b82f6' },
  { key: 'benchmark', label: 'Benchmark', color: '#22c55e' },
  { key: 'foto', label: 'Foto', color: '#f59e0b' },
]

export function Lab() {
  const navigate = useNavigate()
  const [seg, setSeg] = useState<Seg>('correlazioni')
  return (
    <div className="mx-auto max-w-md px-4 pb-8 pt-safe">
      <button onClick={() => navigate('/menu')} className="py-4 text-sm text-accent">
        ‹ Menu
      </button>
      <h1 className="pb-3 text-xl font-bold">Laboratorio</h1>
      <div className="mb-4 grid grid-cols-4 gap-1 rounded-2xl border border-line bg-panel p-1">
        {SEGMENTI.map((s) => (
          <button
            key={s.key}
            onClick={() => setSeg(s.key)}
            className={`rounded-xl py-2 text-xs font-semibold transition ${seg === s.key ? 'text-white' : 'text-ink-dim'}`}
            style={seg === s.key ? { background: s.color } : undefined}
          >
            {s.label}
          </button>
        ))}
      </div>
      {seg === 'correlazioni' && <Correlazioni />}
      {seg === 'calibrazione' && <Calibrazione />}
      {seg === 'benchmark' && <Benchmark />}
      {seg === 'foto' && <Foto />}
    </div>
  )
}

// ---------------- CORRELAZIONI ----------------
const COPPIE: { label: string; a: string; b: string }[] = [
  { label: 'Recupero cardiaco ↔ ore di sonno', a: 'recupero_cardiaco', b: 'ore_sonno' },
  { label: 'HRV ↔ ore di sonno', a: 'hrv', b: 'ore_sonno' },
  { label: 'Impulsi ↔ ore di sonno', a: 'impulsi', b: 'ore_sonno' },
  { label: 'HRV ↔ FC a riposo', a: 'hrv', b: 'fc_riposo' },
  { label: '1a distrazione ↔ ore di sonno', a: 'tempo_prima_distrazione', b: 'ore_sonno' },
  { label: 'Forza presa ↔ passi', a: 'forza_presa', b: 'passi' },
  { label: 'Impulsi ↔ minuti all aperto', a: 'impulsi', b: 'minuti_aperto' },
]

function Correlazioni() {
  const entries = useLiveQuery(() => db.metricEntries.toArray(), [])
  const impulses = useLiveQuery(() => db.impulses.toArray(), [])
  const [sel, setSel] = useState(0)

  const getMap = (key: string) =>
    key === 'impulsi' ? impulsiDailyMap(impulses ?? []) : dailyMap(entries ?? [], key)

  const risultati = useMemo(
    () =>
      COPPIE.map((c) => {
        const pairs = alignedPairs(getMap(c.a), getMap(c.b))
        return { ...c, r: pearson(pairs), n: pairs.length, pairs }
      }),
    [entries, impulses],
  )
  const validi = risultati.filter((r) => r.r !== null).sort((a, b) => Math.abs(b.r!) - Math.abs(a.r!))
  const scelto = risultati[sel]
  const scatter = scelto.pairs.map(([x, y]) => ({ x, y }))

  return (
    <div>
      <Card className="mb-3">
        <p className="text-xs text-ink-dim">
          Correlazione, non causalita. Con pochi dati i numeri sono instabili: servono almeno ~2
          settimane per fidarsi. Serve almeno 3 giorni in comune tra le due misure.
        </p>
      </Card>

      {validi.length === 0 ? (
        <Empty msg="Ancora pochi dati in comune. Registra sonno + recupero/HRV/impulsi per qualche giorno." />
      ) : (
        <div className="mb-3 space-y-2">
          {validi.map((r) => {
            const idx = COPPIE.findIndex((c) => c.label === r.label)
            return (
              <button
                key={r.label}
                onClick={() => setSel(idx)}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-left ${sel === idx ? 'border-accent bg-accent/10' : 'border-line bg-panel'}`}
              >
                <span className="text-sm">{r.label}</span>
                <span className="ml-2 shrink-0 text-right">
                  <span className="font-bold tabular-nums" style={{ color: r.r! >= 0 ? '#22c55e' : '#ef4444' }}>
                    r = {r.r}
                  </span>
                  <span className="block text-[10px] text-ink-dim">
                    {forzaCorrelazione(r.r!)} · n={r.n}
                  </span>
                </span>
              </button>
            )
          })}
        </div>
      )}

      {scatter.length >= 3 && (
        <Card>
          <div className="mb-1 text-sm font-medium">{scelto.label}</div>
          <ChartBox h={200}>
            <ScatterChart margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="#1e2634" />
              <XAxis type="number" dataKey="x" stroke={AXIS} fontSize={10} tickLine={false} axisLine={false} />
              <YAxis type="number" dataKey="y" stroke={AXIS} fontSize={10} width={28} tickLine={false} axisLine={false} />
              <ZAxis range={[60, 60]} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={scatter} fill="#a78bfa" />
            </ScatterChart>
          </ChartBox>
        </Card>
      )}
    </div>
  )
}

// ---------------- CALIBRAZIONE ----------------
function Calibrazione() {
  const { toastXp, toast } = useToast()
  const predictions = useLiveQuery(
    async () => (await db.predictions.toArray()).sort((a, b) => b.tsCreazione - a.tsCreazione),
    [],
  )
  const [testo, setTesto] = useState('')
  const [conf, setConf] = useState(70)

  const week = isoWeekKey()
  const daVerificare = (predictions ?? []).filter((p) => p.esito === null && p.settimana !== week)
  const verificate = (predictions ?? []).filter((p) => p.esito !== null)

  const bins = useMemo(() => {
    const ranges = [
      [50, 60],
      [60, 70],
      [70, 80],
      [80, 90],
      [90, 101],
    ]
    return ranges
      .map(([lo, hi]) => {
        const inBin = verificate.filter((p) => p.confidenza >= lo && p.confidenza < hi)
        if (inBin.length === 0) return null
        const realized = (inBin.filter((p) => p.esito).length / inBin.length) * 100
        return { conf: (lo + Math.min(hi, 100)) / 2, realized: Math.round(realized), n: inBin.length }
      })
      .filter(Boolean) as { conf: number; realized: number; n: number }[]
  }, [verificate])

  const aggiungi = async () => {
    if (!testo.trim()) return
    const xp = await addPrediction(testo.trim(), conf)
    if (xp > 0) toastXp(xp, 'mente')
    setTesto('')
    setConf(70)
  }

  return (
    <div>
      <Card className="mb-3">
        <div className="mb-2 text-sm font-medium">Nuova previsione sulla settimana</div>
        <input
          value={testo}
          onChange={(e) => setTesto(e.target.value)}
          placeholder="Es. Mi allenero almeno 3 volte"
          className="mb-3 w-full rounded-xl border border-line bg-panel2 px-3 py-2.5 text-sm outline-none"
        />
        <div className="mb-1 flex items-center justify-between text-sm">
          <span>Quanto sei sicuro?</span>
          <span className="font-bold tabular-nums">{conf}%</span>
        </div>
        <input
          type="range"
          min={50}
          max={95}
          step={5}
          value={conf}
          onChange={(e) => setConf(Number(e.target.value))}
          className="mb-3 h-3 w-full appearance-none rounded-full bg-panel2 accent-accent"
        />
        <button
          onClick={aggiungi}
          disabled={!testo.trim()}
          className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-white disabled:bg-panel2 disabled:text-ink-dim"
        >
          Aggiungi previsione
        </button>
        <p className="mt-2 text-[11px] text-ink-dim">
          Non conta quanto indovini, ma quanto sei ben calibrato: le cose date al 70% dovrebbero
          avverarsi ~70% delle volte.
        </p>
      </Card>

      {daVerificare.length > 0 && (
        <>
          <SectionTitle>Da verificare</SectionTitle>
          <div className="space-y-2">
            {daVerificare.map((p) => (
              <Card key={p.id}>
                <div className="text-sm">{p.testo}</div>
                <div className="mb-2 text-xs text-ink-dim">Confidenza {p.confidenza}%</div>
                <div className="flex gap-2">
                  <Chip color="#22c55e" onClick={() => verifyPrediction(p.id!, true)}>
                    Avverata
                  </Chip>
                  <Chip color="#ef4444" onClick={() => verifyPrediction(p.id!, false)}>
                    No
                  </Chip>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <SectionTitle>Grafico di calibrazione</SectionTitle>
      <Card>
        {bins.length === 0 ? (
          <Empty msg="Verifica qualche previsione delle settimane passate per costruire il grafico." />
        ) : (
          <ChartBox h={200}>
            <ScatterChart margin={{ top: 8, right: 12, bottom: 4, left: 0 }}>
              <CartesianGrid stroke="#1e2634" />
              <XAxis type="number" dataKey="conf" domain={[40, 100]} stroke={AXIS} fontSize={10} name="confidenza" tickLine={false} axisLine={false} />
              <YAxis type="number" dataKey="realized" domain={[0, 100]} width={28} stroke={AXIS} fontSize={10} tickLine={false} axisLine={false} />
              <ReferenceLine segment={[{ x: 40, y: 40 }, { x: 100, y: 100 }]} stroke="#4b5563" strokeDasharray="4 4" />
              <ZAxis range={[80, 80]} />
              <Tooltip contentStyle={tooltipStyle} />
              <Scatter data={bins} fill="#3b82f6" />
            </ScatterChart>
          </ChartBox>
        )}
      </Card>

      {verificate.length > 0 && (
        <>
          <SectionTitle>Storico</SectionTitle>
          <div className="space-y-2">
            {verificate.slice(0, 12).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-xl border border-line bg-panel px-3 py-2 text-sm">
                <span className="min-w-0 truncate">
                  <span style={{ color: p.esito ? '#22c55e' : '#ef4444' }}>{p.esito ? '✓' : '✗'}</span> {p.testo}
                </span>
                <span className="ml-2 flex shrink-0 items-center gap-2 text-xs text-ink-dim">
                  {p.confidenza}%
                  <button onClick={() => deletePrediction(p.id!).then(() => toast('Eliminata.'))} className="text-ink-dim">
                    ✕
                  </button>
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ---------------- BENCHMARK ----------------
function Benchmark() {
  const defs = useLiveQuery(() => db.metricDefinitions.toArray(), [])
  const entries = useLiveQuery(() => db.metricEntries.toArray(), [])
  const bench = (defs ?? []).filter((d) => d.attiva && d.config?.benchmark === true).sort((a, b) => a.ordine - b.ordine)

  const lastTs = new Map<string, number>()
  for (const e of entries ?? []) {
    const cur = lastTs.get(e.metricKey)
    if (cur === undefined || e.ts > cur) lastTs.set(e.metricKey, e.ts)
  }

  return (
    <div>
      <Card className="mb-3">
        <div className="text-sm font-medium">Benchmark settimanale</div>
        <p className="mt-1 text-xs text-ink-dim">
          Un giorno fisso a settimana, a riposo, stessa batteria ogni volta. Il recupero cardiaco e
          l indicatore che migliora prima del peso: guardalo.
        </p>
      </Card>
      <div className="space-y-3">
        {bench.map((d) => {
          const done = isDoneInPeriod(d, lastTs.get(d.key) ?? null)
          return (
            <div key={d.key}>
              {done ? (
                <div className="flex items-center justify-between rounded-2xl border border-vita/40 bg-vita/10 px-4 py-3 text-sm text-vita">
                  <span>{d.nome}</span>
                  <span>fatto questa settimana ✓</span>
                </div>
              ) : (
                <MetricCard def={d} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------- FOTO ----------------
function Foto() {
  const defs = useLiveQuery(() => db.metricDefinitions.get('foto'), [])
  const entries = useLiveQuery(() => db.metricEntries.where('metricKey').equals('foto').toArray(), [])
  const foto = (entries ?? []).filter((e) => typeof e.valoreJson === 'string').sort((a, b) => a.ts - b.ts)
  const prima = foto[0]
  const ultima = foto[foto.length - 1]

  return (
    <div>
      {defs && (
        <div className="mb-3">
          <MetricCard def={defs} />
        </div>
      )}
      {foto.length < 2 ? (
        <Empty msg="Aggiungi almeno due foto (stessa luce, posa, ora) per confrontarle." />
      ) : (
        <>
          <SectionTitle>Confronto prima → ora</SectionTitle>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <img src={prima.valoreJson as string} alt="prima" className="w-full rounded-xl border border-line" />
              <div className="mt-1 text-center text-xs text-ink-dim">{shortDate(prima.ts)}</div>
            </div>
            <div>
              <img src={ultima.valoreJson as string} alt="ora" className="w-full rounded-xl border border-line" />
              <div className="mt-1 text-center text-xs text-ink-dim">{shortDate(ultima.ts)}</div>
            </div>
          </div>
          <SectionTitle>Tutte</SectionTitle>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {foto.map((f) => (
              <div key={f.id} className="shrink-0">
                <img src={f.valoreJson as string} alt="" className="h-32 rounded-lg border border-line" />
                <div className="mt-1 text-center text-[10px] text-ink-dim">{shortDate(f.ts)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
