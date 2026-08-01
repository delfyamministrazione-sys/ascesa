import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { binario as binInfo } from '../lib/binari'
import type { Binario } from '../db/types'

// ---------------- Toast ----------------
interface ToastItem {
  id: number
  content: ReactNode
}
interface ToastCtx {
  toast: (content: ReactNode) => void
  toastXp: (xp: number, binario: Binario) => void
}
const Ctx = createContext<ToastCtx | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const idRef = useRef(1)

  const toast = useCallback((content: ReactNode) => {
    const id = idRef.current++
    setItems((prev) => [...prev, { id, content }])
    setTimeout(() => setItems((prev) => prev.filter((i) => i.id !== id)), 2200)
  }, [])

  const toastXp = useCallback(
    (xp: number, b: Binario) => {
      const info = binInfo(b)
      toast(
        <span className="flex items-center gap-2">
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-white"
            style={{ background: info.color }}
          >
            {info.sigla}
          </span>
          <span className="font-semibold">+{xp} XP</span>
          <span className="text-ink-dim">{info.nome}</span>
        </span>,
      )
    },
    [toast],
  )

  return (
    <Ctx.Provider value={{ toast, toastXp }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-50 flex flex-col items-center gap-2 pt-safe">
        <div className="mt-3 flex w-full max-w-md flex-col items-center gap-2 px-4">
          {items.map((i) => (
            <div
              key={i.id}
              className="pointer-events-auto rounded-full border border-line bg-panel2/95 px-4 py-2 text-sm shadow-lg backdrop-blur"
              style={{ animation: 'toastIn .18s ease-out' }}
            >
              {i.content}
            </div>
          ))}
        </div>
      </div>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:none}}`}</style>
    </Ctx.Provider>
  )
}

export function useToast(): ToastCtx {
  const c = useContext(Ctx)
  if (!c) throw new Error('useToast fuori dal provider')
  return c
}

// ---------------- Primitivi ----------------
export function Card({
  children,
  className = '',
  onClick,
  style,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
  style?: CSSProperties
}) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={`rounded-2xl border border-line bg-panel p-4 ${onClick ? 'active:scale-[.99] cursor-pointer' : ''} ${className}`}
    >
      {children}
    </div>
  )
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-2 mt-6 px-1 text-xs font-semibold uppercase tracking-wider text-ink-dim">
      {children}
    </h2>
  )
}

export function Chip({
  active,
  onClick,
  children,
  color,
}: {
  active?: boolean
  onClick?: () => void
  children: ReactNode
  color?: string
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-sm font-medium transition ${
        active ? 'text-white' : 'border-line bg-panel2 text-ink'
      }`}
      style={active ? { background: color ?? '#a78bfa', borderColor: color ?? '#a78bfa' } : undefined}
    >
      {children}
    </button>
  )
}

export function BigButton({
  children,
  onClick,
  disabled,
  color = '#a78bfa',
  className = '',
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  color?: string
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{ background: disabled ? '#2b3446' : color }}
      className={`w-full rounded-2xl px-5 py-4 text-center text-base font-semibold text-white transition active:scale-[.98] disabled:text-ink-dim ${className}`}
    >
      {children}
    </button>
  )
}

export function BinBadge({ b, size = 28 }: { b: Binario; size?: number }) {
  const info = binInfo(b)
  return (
    <span
      className="inline-flex items-center justify-center rounded-full font-bold text-white"
      style={{ background: info.color, width: size, height: size, fontSize: size * 0.42 }}
    >
      {info.sigla}
    </span>
  )
}

export function ProgressBar({ pct, color }: { pct: number; color: string }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-panel2">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${Math.round(pct * 100)}%`, background: color }}
      />
    </div>
  )
}

// countdown/utility hook per aggiornare la UI ogni N ms
export function useTick(ms = 1000) {
  const [, setT] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), ms)
    return () => clearInterval(id)
  }, [ms])
}
