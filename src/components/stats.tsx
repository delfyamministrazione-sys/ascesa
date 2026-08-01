import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AXIS, tooltipStyle } from './charts'
import type { Direzione } from '../db/types'

export function trendOf(
  series: number[],
  direzione: Direzione,
): { delta: number; improving: boolean | null } | null {
  if (series.length < 2) return null
  const a = series[series.length - 2]
  const b = series[series.length - 1]
  const delta = Number((b - a).toFixed(1))
  if (delta === 0) return { delta, improving: null }
  const improving = direzione === 'up' ? delta > 0 : direzione === 'down' ? delta < 0 : null
  return { delta, improving }
}

export function Sparkline({ data, color }: { data: number[]; color: string }) {
  const d = data.slice(-14).map((v, i) => ({ i, v }))
  if (d.length < 2) return <div className="h-9" />
  return (
    <div className="h-9 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={d} margin={{ top: 4, bottom: 2, left: 0, right: 0 }}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function KpiTile({
  label,
  value,
  unit,
  series = [],
  color,
  direzione = 'neutral',
  hint,
}: {
  label: string
  value: string | number | null
  unit?: string
  series?: number[]
  color: string
  direzione?: Direzione
  hint?: string
}) {
  const t = trendOf(series, direzione)
  const arrow = t ? (t.delta > 0 ? '↑' : t.delta < 0 ? '↓' : '→') : ''
  const arrowColor = t?.improving === true ? '#22c55e' : '#8b95a7'

  return (
    <div className="rounded-2xl border border-line bg-panel p-3">
      <div className="flex items-center justify-between">
        <span className="truncate text-[11px] font-medium uppercase tracking-wide text-ink-dim">{label}</span>
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: color }} />
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums">{value === null ? '—' : value}</span>
        {unit && value !== null && <span className="text-xs text-ink-dim">{unit}</span>}
        {t && (
          <span className="ml-auto text-xs font-semibold tabular-nums" style={{ color: arrowColor }}>
            {arrow} {Math.abs(t.delta)}
          </span>
        )}
      </div>
      {series.length > 1 ? (
        <Sparkline data={series} color={color} />
      ) : (
        <div className="h-9 pt-3 text-[10px] text-ink-dim">{hint ?? 'pochi dati'}</div>
      )}
    </div>
  )
}

export function AreaTrend({
  data,
  color,
  h = 150,
  yDomain,
}: {
  data: { label: string; v: number | null }[]
  color: string
  h?: number
  yDomain?: [string | number, string | number]
}) {
  const id = `grad-${color.replace('#', '')}`
  return (
    <div style={{ height: h }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity={0.35} />
              <stop offset="1" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#1e2634" vertical={false} />
          <XAxis dataKey="label" stroke={AXIS} fontSize={10} tickLine={false} axisLine={false} minTickGap={20} />
          <YAxis stroke={AXIS} fontSize={10} width={30} tickLine={false} axisLine={false} domain={yDomain} />
          <Tooltip contentStyle={tooltipStyle} />
          <Area
            type="monotone"
            dataKey="v"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${id})`}
            connectNulls
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
