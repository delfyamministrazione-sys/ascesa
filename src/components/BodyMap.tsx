import { bmi } from '../lib/body'
import { REGIONI } from '../lib/science'

type Pt = [number, number]

// META meta-silhouette: meta destra (dall'alto del collo, in senso orario fino all'inguine).
const RIGHT: Pt[] = [
  [122, 96], // collo dx
  [150, 122], // spalla
  [163, 140], // deltoide
  [166, 168], // braccio esterno alto
  [162, 200], // gomito
  [156, 234], // avambraccio
  [150, 258], // polso esterno
  [151, 278], // mano
  [139, 258], // polso interno
  [141, 205], // avambraccio interno
  [130, 150], // ascella
  [126, 232], // vita
  [140, 272], // fianco
  [138, 322], // coscia esterna
  [128, 366], // ginocchio esterno
  [124, 410], // polpaccio
  [120, 448], // caviglia esterna
  [122, 460], // piede esterno
  [112, 460], // piede interno
  [112, 448], // caviglia interna
  [116, 366], // ginocchio interno
  [116, 300], // coscia interna
  [110, 300], // inguine (centro)
]

function mirror([x, y]: Pt): Pt {
  return [220 - x, y]
}

function smoothClosed(points: Pt[]): string {
  if (points.length < 2) return ''
  let d = `M ${points[0][0]} ${points[0][1]}`
  for (let i = 1; i < points.length; i++) {
    const [x0, y0] = points[i - 1]
    const [x1, y1] = points[i]
    const mx = (x0 + x1) / 2
    const my = (y0 + y1) / 2
    d += ` Q ${x0} ${y0} ${mx} ${my}`
  }
  d += ' Z'
  return d
}

const BODY_PATH = smoothClosed([...RIGHT, ...RIGHT.slice().reverse().map(mirror)])

interface Hot {
  region: string
  x: number
  y: number
}
const HOTS: Hot[] = [
  { region: 'mente', x: 110, y: 58 },
  { region: 'forza', x: 158, y: 150 },
  { region: 'cuore', x: 95, y: 160 },
  { region: 'spirito', x: 110, y: 182 },
  { region: 'nutrizione', x: 110, y: 222 },
  { region: 'motore', x: 103, y: 335 },
]

function regionColor(key: string): string {
  return REGIONI.find((r) => r.key === key)?.color ?? '#a78bfa'
}

function clamp(min: number, max: number, v: number) {
  return Math.min(max, Math.max(min, v))
}

export function BodyMap({
  weight,
  height,
  selected,
  onSelect,
}: {
  weight: number | null
  height: number | null
  selected: string | null
  onSelect: (key: string) => void
}) {
  const b = weight && height ? bmi(weight, height) : 22
  const wS = clamp(0.9, 1.28, Math.sqrt(b / 22))
  const hS = height ? clamp(0.95, 1.07, height / 175) : 1

  return (
    <svg viewBox="0 0 220 480" className="mx-auto block w-full max-w-[300px]">
      <defs>
        <radialGradient id="bmBg" cx="50%" cy="38%" r="70%">
          <stop offset="0" stopColor="#1c2537" />
          <stop offset="1" stopColor="#0e1420" />
        </radialGradient>
        <linearGradient id="bmSkin" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c7d0de" />
          <stop offset="0.5" stopColor="#9aa6b8" />
          <stop offset="1" stopColor="#7d8a9d" />
        </linearGradient>
        <filter id="bmSoft" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="b" />
          <feOffset in="b" dy="6" result="o" />
          <feComponentTransfer in="o" result="s">
            <feFuncA type="linear" slope="0.45" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="s" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="0" y="0" width="220" height="480" rx="20" fill="url(#bmBg)" />
      {/* ombra a terra */}
      <ellipse cx="110" cy="466" rx={54 * wS} ry="9" fill="#000" opacity="0.35" />

      <g transform={`translate(110 460) scale(${wS} ${hS}) translate(-110 -460)`} filter="url(#bmSoft)">
        <ellipse cx="110" cy="60" rx="27" ry="31" fill="url(#bmSkin)" />
        <path d={BODY_PATH} fill="url(#bmSkin)" />
        {/* luce di bordo sinistra */}
        <path d={BODY_PATH} fill="none" stroke="#ffffff" strokeOpacity="0.14" strokeWidth="1.5" />

        {/* punti cliccabili */}
        {HOTS.map((h) => {
          const on = selected === h.region
          const c = regionColor(h.region)
          return (
            <g key={h.region} onClick={() => onSelect(h.region)} style={{ cursor: 'pointer' }}>
              {on && <circle cx={h.x} cy={h.y} r="13" fill="none" stroke={c} strokeWidth="2" opacity="0.9" />}
              <circle cx={h.x} cy={h.y} r={on ? 8 : 6.5} fill={c} stroke="#0b0f19" strokeWidth="1.5">
                <animate attributeName="opacity" values="0.95;0.55;0.95" dur="2s" repeatCount="indefinite" />
              </circle>
            </g>
          )
        })}
      </g>
    </svg>
  )
}

// Barra BMI: fasce descrittive OMS, marker sulla posizione. Colori tenui, nessun merito.
export function BmiGauge({ bmiVal }: { bmiVal: number }) {
  const min = 15
  const max = 35
  const pos = clamp(0, 100, ((bmiVal - min) / (max - min)) * 100)
  const fasce = [
    { fino: 18.5, color: '#38bdf8' },
    { fino: 25, color: '#22c55e' },
    { fino: 30, color: '#f59e0b' },
    { fino: 35, color: '#ef4444' },
  ]
  let prev = min
  return (
    <div className="mt-2">
      <div className="relative h-2.5 w-full overflow-hidden rounded-full">
        <div className="flex h-full w-full">
          {fasce.map((f) => {
            const w = ((f.fino - prev) / (max - min)) * 100
            prev = f.fino
            return <div key={f.fino} style={{ width: `${w}%`, background: f.color, opacity: 0.55 }} />
          })}
        </div>
        <div
          className="absolute top-1/2 h-4 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
          style={{ left: `${pos}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-ink-dim">
        <span>15</span>
        <span>18.5</span>
        <span>25</span>
        <span>30</span>
        <span>35</span>
      </div>
    </div>
  )
}
