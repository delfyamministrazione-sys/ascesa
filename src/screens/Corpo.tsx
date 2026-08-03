import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { db, setSetting } from '../db/db'
import { Card, Chip, SectionTitle } from '../components/ui'
import { AXIS, ChartBox, Empty, tooltipStyle } from '../components/charts'
import { AreaTrend, KpiTile } from '../components/stats'
import { BodyMap, BmiGauge } from '../components/BodyMap'
import { NutritionDay, NutritionForm } from '../components/Nutrition'
import {
  durataMediaImpulso,
  impulsiPerLuogo,
  impulsiPerOra,
  lastPerDay,
  latestValue,
  pesoMediaMobile,
  scartoMedio,
  scartoPerAttivita,
  volumeDaily,
} from '../lib/analytics'
import { dailyKcalSeries } from '../lib/nutrition'
import { LUOGHI } from '../lib/options'
import { REGIONI, SCIENZA_BMI, bmiCategoria } from '../lib/science'
import { bmi } from '../lib/body'
import { dayKey, shortDate } from '../lib/dates'

type Seg = 'specchio' | 'fisico' | 'mente' | 'cibo'
const SEGMENTI: { key: Seg; label: string; color: string }[] = [
  { key: 'specchio', label: 'Specchio', color: '#a78bfa' },
  { key: 'fisico', label: 'Fisico', color: '#ef4444' },
  { key: 'mente', label: 'Mente', color: '#3b82f6' },
  { key: 'cibo', label: 'Cibo', color: '#f59e0b' },
]

export function Corpo() {
  const [seg, setSeg] = useState<Seg>('specchio')
  return (
    <div className="mx-auto max-w-md px-4 pb-8 pt-safe">
      <h1 className="py-4 text-xl font-bold">Corpo</h1>
      <div className="mb-4 flex rounded-2xl border border-line bg-panel p-1">
        {SEGMENTI.map((s) => (
          <button
            key={s.key}
            onClick={() => setSeg(s.key)}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${seg === s.key ? 'text-white' : 'text-ink-dim'}`}
            style={seg === s.key ? { background: s.color } : undefined}
          >
            {s.label}
          </button>
        ))}
      </div>
      {seg === 'specchio' && <Specchio />}
      {seg === 'fisico' && <Fisico />}
      {seg === 'mente' && <Mente />}
      {seg === 'cibo' && <Cibo />}
    </div>
  )
}

// ---------------- SPECCHIO ----------------
function Specchio() {
  const entries = useLiveQuery(() => db.metricEntries.toArray(), [])
  const defs = useLiveQuery(() => db.metricDefinitions.toArray(), [])
  const altezzaRow = useLiveQuery(() => db.settings.get('altezza_cm'), [])
  const [selected, setSelected] = useState<string>('cuore')
  const [altInput, setAltInput] = useState('')

  const altezza = (altezzaRow?.value as number) ?? null
  const pesoAvg = useMemo(() => pesoMediaMobile(entries ?? []).at(-1)?.avg ?? null, [entries])
  const bmiVal = altezza && pesoAvg ? bmi(pesoAvg, altezza) : null
  const cat = bmiVal ? bmiCategoria(bmiVal) : null
  const regione = REGIONI.find((r) => r.key === selected)!
  const defMap = new Map((defs ?? []).map((d) => [d.key, d]))

  return (
    <div>
      {!altezza && (
        <Card className="mb-3">
          <div className="mb-2 text-sm font-medium">Imposta la tua altezza (una volta)</div>
          <div className="flex gap-2">
            <input
              inputMode="numeric"
              value={altInput}
              onChange={(e) => setAltInput(e.target.value)}
              placeholder="cm"
              className="w-24 rounded-xl border border-line bg-panel2 px-3 py-2.5 text-center text-lg font-bold outline-none"
            />
            <button
              onClick={() => altInput && setSetting('altezza_cm', Number(altInput))}
              className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white"
            >
              Salva altezza
            </button>
          </div>
        </Card>
      )}

      {bmiVal && cat && (
        <Card className="mb-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-ink-dim">BMI · da media peso 7gg e altezza</div>
              <div className="text-3xl font-bold tabular-nums">
                {bmiVal.toFixed(1)}{' '}
                <span className="text-base font-semibold" style={{ color: cat.color }}>
                  {cat.label}
                </span>
              </div>
            </div>
            <div className="text-right text-xs text-ink-dim">
              <div>{pesoAvg} kg</div>
              <div>{altezza} cm</div>
            </div>
          </div>
          <BmiGauge bmiVal={bmiVal} />
          <p className="mt-2 text-[11px] text-ink-dim">{SCIENZA_BMI}</p>
        </Card>
      )}

      <BodyMap weight={pesoAvg} height={altezza} selected={selected} onSelect={setSelected} />

      <div className="mt-2 flex flex-wrap justify-center gap-2">
        {REGIONI.map((r) => (
          <Chip key={r.key} active={selected === r.key} color={r.color} onClick={() => setSelected(r.key)}>
            {r.nome.split('·')[1]?.trim() ?? r.nome}
          </Chip>
        ))}
      </div>
      <p className="mt-2 text-center text-[11px] text-ink-dim">Tocca un punto sul corpo o un etichetta.</p>

      <Card className="mt-3" style={{ borderLeft: `3px solid ${regione.color}` }}>
        <div className="text-lg font-bold" style={{ color: regione.color }}>
          {regione.nome}
        </div>
        <div className="mb-3 text-xs text-ink-dim">{regione.sottotitolo}</div>

        {regione.metriche.length > 0 && (
          <div className="mb-3 space-y-1.5">
            {regione.metriche.map((k) => {
              const d = defMap.get(k)
              const v = latestValue(entries ?? [], k)
              if (!d) return null
              return (
                <div key={k} className="flex items-center justify-between text-sm">
                  <span className="text-ink-dim">{d.nome}</span>
                  <span className="font-semibold tabular-nums">{v === null ? '—' : `${v} ${d.unita}`}</span>
                </div>
              )
            })}
          </div>
        )}

        <ul className="space-y-2">
          {regione.scienza.map((s, i) => (
            <li key={i} className="flex gap-2 text-sm text-ink">
              <span style={{ color: regione.color }}>•</span>
              <span>{s}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  )
}

// ---------------- FISICO ----------------
function Fisico() {
  const entries = useLiveQuery(() => db.metricEntries.toArray(), [])

  const circDefs = useLiveQuery(
    async () =>
      (await db.metricDefinitions.toArray())
        .filter((d) => d.categoria === 'Circonferenze' && d.attiva)
        .sort((a, b) => a.ordine - b.ordine),
    [],
  )

  const s = useMemo(() => {
    const e = entries ?? []
    const grab = (k: string) => lastPerDay(e, k)
    return {
      recupero: grab('recupero_cardiaco'),
      fc: grab('fc_riposo'),
      hrv: grab('hrv'),
      forza: grab('forza_presa'),
      passi: grab('passi'),
      peso: pesoMediaMobile(e),
      volume: volumeDaily(e),
    }
  }, [entries])

  const rUlt = s.recupero.at(-1)?.value ?? null
  const rPrec = s.recupero.at(-2)?.value ?? null
  const rDelta = rUlt !== null && rPrec !== null ? rUlt - rPrec : null

  const nessunDato =
    s.recupero.length + s.fc.length + s.hrv.length + s.forza.length + s.peso.length === 0

  if (nessunDato) {
    return <Empty msg="Registra qualche misura fisica al risveglio e nel benchmark per popolare questa sezione." />
  }

  const area = (arr: { t: number; value: number }[]) => arr.map((x) => ({ label: shortDate(x.t), v: x.value }))
  const areaPeso = s.peso.map((x) => ({ label: shortDate(x.t), v: x.avg }))

  return (
    <div>
      {/* KPI */}
      <div className="grid grid-cols-2 gap-3">
        <KpiTile label="Recupero card." value={rUlt} unit="bpm" series={s.recupero.map((x) => x.value)} color="#22c55e" direzione="up" />
        <KpiTile label="HRV" value={s.hrv.at(-1)?.value ?? null} unit="ms" series={s.hrv.map((x) => x.value)} color="#3b82f6" direzione="up" />
        <KpiTile label="FC riposo" value={s.fc.at(-1)?.value ?? null} unit="bpm" series={s.fc.map((x) => x.value)} color="#ef4444" direzione="down" />
        <KpiTile label="Forza presa" value={s.forza.at(-1)?.value ?? null} unit="kg" series={s.forza.map((x) => x.value)} color="#a78bfa" direzione="up" />
        <KpiTile label="Peso (7gg)" value={s.peso.at(-1)?.avg ?? null} unit="kg" series={s.peso.map((x) => x.avg)} color="#e8ebf1" direzione="neutral" />
        <KpiTile label="Passi" value={s.passi.at(-1)?.value ?? null} series={s.passi.map((x) => x.value)} color="#f59e0b" direzione="up" />
      </div>

      {/* Recupero cardiaco hero */}
      <SectionTitle>Recupero cardiaco · indicatore chiave</SectionTitle>
      <Card style={{ borderLeft: '3px solid #22c55e' }}>
        {rUlt === null ? (
          <Empty msg="Registra il recupero cardiaco nel benchmark settimanale." />
        ) : (
          <>
            <div className="mb-1 flex items-end gap-3">
              <div className="text-4xl font-bold tabular-nums">{rUlt}</div>
              <div className="pb-1 text-sm text-ink-dim">bpm di calo in 60s</div>
              {rDelta !== null && (
                <div className={`ml-auto pb-1 text-sm font-semibold ${rDelta >= 0 ? 'text-vita' : 'text-ink-dim'}`}>
                  {rDelta >= 0 ? '↑' : '↓'} {Math.abs(rDelta)}
                </div>
              )}
            </div>
            {s.recupero.length > 1 && <AreaTrend data={area(s.recupero)} color="#22c55e" />}
            <p className="mt-1 text-[11px] text-ink-dim">Sale prima del peso: e il segnale che ti tiene motivato nelle settimane in cui la bilancia e ferma.</p>
          </>
        )}
      </Card>

      {/* Peso */}
      <SectionTitle>Peso · media mobile 7 giorni</SectionTitle>
      <Card>
        {s.peso.length === 0 ? (
          <Empty msg="Il peso si mostra solo come media a 7 giorni." />
        ) : (
          <>
            <div className="mb-1 text-3xl font-bold tabular-nums">
              {s.peso.at(-1)?.avg} <span className="text-sm font-normal text-ink-dim">kg</span>
            </div>
            <AreaTrend data={areaPeso} color="#a78bfa" yDomain={['dataMin - 1', 'dataMax + 1']} />
            <p className="mt-1 text-[11px] text-ink-dim">Il valore giornaliero e rumore: non viene mostrato.</p>
          </>
        )}
      </Card>

      {/* FC e HRV separati (mai due scale sullo stesso asse) */}
      <div className="grid grid-cols-1 gap-3">
        <div>
          <SectionTitle>FC a riposo</SectionTitle>
          <Card>
            {s.fc.length === 0 ? <Empty msg="Registra la FC al risveglio." /> : <AreaTrend data={area(s.fc)} color="#ef4444" h={130} />}
          </Card>
        </div>
        <div>
          <SectionTitle>HRV</SectionTitle>
          <Card>
            {s.hrv.length === 0 ? <Empty msg="Registra l'HRV al risveglio." /> : <AreaTrend data={area(s.hrv)} color="#3b82f6" h={130} />}
          </Card>
        </div>
      </div>

      {/* Volume */}
      <SectionTitle>Volume allenamento</SectionTitle>
      <Card>
        {s.volume.length === 0 ? (
          <Empty msg="Registra il volume dopo l'allenamento." />
        ) : (
          <ChartBox h={130}>
            <BarChart data={s.volume.map((x) => ({ label: shortDate(new Date(x.day)), kg: x.kg }))}>
              <CartesianGrid stroke="#1e2634" vertical={false} />
              <XAxis dataKey="label" stroke={AXIS} fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke={AXIS} fontSize={10} width={34} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="kg" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ChartBox>
        )}
      </Card>

      {/* Circonferenze */}
      <SectionTitle>Circonferenze</SectionTitle>
      <Card>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {(circDefs ?? []).map((d) => {
            const v = latestValue(entries ?? [], d.key)
            return (
              <div key={d.key} className="flex items-center justify-between text-sm">
                <span className="text-ink-dim">{d.nome}</span>
                <span className="font-semibold tabular-nums">{v === null ? '—' : `${v}`}</span>
              </div>
            )
          })}
        </div>
        <p className="mt-2 text-[11px] text-ink-dim">Le registri in Registra → Ogni due settimane (cm).</p>
      </Card>
    </div>
  )
}

// ---------------- MENTE ----------------
function Mente() {
  const impulses = useLiveQuery(() => db.impulses.toArray(), [])
  const sessions = useLiveQuery(() => db.sessions.toArray(), [])
  const entries = useLiveQuery(() => db.metricEntries.toArray(), [])

  const scarto = useMemo(() => scartoPerAttivita(sessions ?? []), [sessions])
  const scartoM = useMemo(() => scartoMedio(sessions ?? []), [sessions])
  const perOra = useMemo(() => impulsiPerOra(impulses ?? []), [impulses])
  const perLuogo = useMemo(() => impulsiPerLuogo(impulses ?? [], LUOGHI), [impulses])
  const durata = useMemo(() => durataMediaImpulso(impulses ?? []), [impulses])
  const distrazione = useMemo(() => lastPerDay(entries ?? [], 'tempo_prima_distrazione'), [entries])

  const impulsiGiorno = useMemo(() => {
    const map = new Map<string, number>()
    for (const i of impulses ?? []) map.set(dayKey(i.tsInizio), (map.get(dayKey(i.tsInizio)) ?? 0) + 1)
    return Array.from(map.entries()).sort().map(([, n]) => n)
  }, [impulses])
  const impulsi7 = (impulses ?? []).filter((i) => Date.now() - i.tsInizio < 7 * 86_400_000).length
  const oraPicco = perOra.reduce((m, x) => (x.n > m.n ? x : m), { ora: '0', n: 0 })

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        <KpiTile label="Impulsi 7gg" value={impulsi7} series={impulsiGiorno} color="#a78bfa" direzione="neutral" hint="registrati" />
        <KpiTile label="Durata media" value={durata} unit="min" color="#f59e0b" direzione="neutral" hint="quanto dura un'ondata" />
        <KpiTile label="1a distrazione" value={distrazione.at(-1)?.value ?? null} unit="min" series={distrazione.map((x) => x.value)} color="#3b82f6" direzione="up" />
        <KpiTile label="Scarto medio" value={scartoM} color="#22c55e" direzione="neutral" hint="realta vs previsione" />
      </div>

      <SectionTitle>Scarto previsione / realta per attivita</SectionTitle>
      <Card>
        {scarto.length === 0 ? (
          <Empty msg="Avvia e chiudi qualche sessione per vedere quanto la previsione mente." />
        ) : (
          <>
            {scartoM !== null && (
              <div className="mb-2 text-sm">
                In media ti piacciono{' '}
                <span className={`font-bold ${scartoM >= 0 ? 'text-vita' : 'text-corpo'}`}>
                  {scartoM >= 0 ? '+' : ''}
                  {scartoM}
                </span>{' '}
                rispetto a come le prevedi.
              </div>
            )}
            <ChartBox h={Math.max(120, scarto.length * 36)}>
              <BarChart data={scarto} layout="vertical" margin={{ left: 6 }}>
                <CartesianGrid stroke="#1e2634" horizontal={false} />
                <XAxis type="number" stroke={AXIS} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="attivita" stroke={AXIS} fontSize={10} width={92} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="delta" radius={4}>
                  {scarto.map((x, i) => (
                    <Cell key={i} fill={x.delta >= 0 ? '#22c55e' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ChartBox>
          </>
        )}
      </Card>

      <SectionTitle>Mappa impulsi · per ora</SectionTitle>
      <Card>
        {(impulses ?? []).length === 0 ? (
          <Empty msg="Registra qualche impulso per vedere la mappa." />
        ) : (
          <>
            <div className="mb-1 text-xs text-ink-dim">
              Ora di picco: <span className="font-semibold text-ink">{oraPicco.ora}:00</span>
            </div>
            <ChartBox h={150}>
              <BarChart data={perOra}>
                <CartesianGrid stroke="#1e2634" vertical={false} />
                <XAxis dataKey="ora" stroke={AXIS} fontSize={10} interval={2} tickLine={false} axisLine={false} />
                <YAxis stroke={AXIS} fontSize={10} width={20} allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="n" radius={[3, 3, 0, 0]}>
                  {perOra.map((x, i) => (
                    <Cell key={i} fill={x.ora === oraPicco.ora && x.n > 0 ? '#a78bfa' : '#3a3f66'} />
                  ))}
                </Bar>
              </BarChart>
            </ChartBox>
          </>
        )}
      </Card>

      <SectionTitle>Mappa impulsi · per luogo</SectionTitle>
      <Card>
        {(impulses ?? []).length === 0 ? (
          <Empty msg="Registra qualche impulso per vedere la mappa." />
        ) : (
          <ChartBox h={160}>
            <BarChart data={perLuogo}>
              <CartesianGrid stroke="#1e2634" vertical={false} />
              <XAxis dataKey="luogo" stroke={AXIS} fontSize={9} interval={0} angle={-20} textAnchor="end" height={50} tickLine={false} axisLine={false} />
              <YAxis stroke={AXIS} fontSize={10} width={20} allowDecimals={false} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="n" fill="#f59e0b" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ChartBox>
        )}
      </Card>
    </div>
  )
}

// ---------------- CIBO ----------------
function Cibo() {
  const enabledRow = useLiveQuery(() => db.settings.get('nutrition_enabled'), [])
  const nutrition = useLiveQuery(() => db.nutrition.toArray(), [])
  const enabled = enabledRow?.value === true

  const kcalSerie = useMemo(
    () => dailyKcalSeries(nutrition ?? []).map((x) => ({ label: shortDate(new Date(x.day)), v: x.kcal })),
    [nutrition],
  )

  if (!enabled) {
    return (
      <Card>
        <div className="text-sm font-medium">Modulo Cibo & Nutrizione spento</div>
        <p className="mt-1 text-sm text-ink-dim">
          Attivalo da Menu → Impostazioni. E osservativo: kcal e macro senza obiettivi, senza punteggio, senza giudizi.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <NutritionDay />
      {kcalSerie.length > 1 && (
        <Card>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-ink-dim">Calorie giornaliere</div>
          <AreaTrend data={kcalSerie} color="#f59e0b" h={140} />
          <p className="mt-1 text-[11px] text-ink-dim">Solo osservazione: nessuna soglia, nessun colore di merito.</p>
        </Card>
      )}
      <SectionTitle>Aggiungi pasto</SectionTitle>
      <NutritionForm />
    </div>
  )
}
