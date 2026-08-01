import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import type { LevelUp } from '../db/types'
import { binario } from '../lib/binari'

// Mostra un momento di soddisfazione quando un binario sale di livello.
export function LevelUpWatcher() {
  const levelUps = useLiveQuery(() => db.levelUps.orderBy('ts').toArray(), [])
  const seen = useRef<number | null>(null)
  const [celebra, setCelebra] = useState<LevelUp | null>(null)

  useEffect(() => {
    if (!levelUps) return
    const maxId = levelUps.length ? Math.max(...levelUps.map((l) => l.id ?? 0)) : 0
    if (seen.current === null) {
      seen.current = maxId // primo caricamento: non celebrare lo storico
      return
    }
    if (maxId > seen.current) {
      const nuovo = levelUps.find((l) => l.id === maxId)
      if (nuovo) {
        setCelebra(nuovo)
        if (navigator.vibrate) navigator.vibrate([25, 40, 25])
      }
    }
    seen.current = maxId
  }, [levelUps])

  if (!celebra) return null
  const info = binario(celebra.binario)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6"
      onClick={() => setCelebra(null)}
    >
      <div
        className="w-full max-w-xs rounded-3xl border p-6 text-center"
        style={{ background: '#141a26', borderColor: info.color }}
      >
        <div
          className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full text-4xl font-bold text-white"
          style={{ background: info.color, boxShadow: `0 0 40px ${info.color}66` }}
        >
          {info.sigla}
        </div>
        <div className="text-sm uppercase tracking-widest text-ink-dim">Livello raggiunto</div>
        <div className="mt-1 text-3xl font-bold" style={{ color: info.color }}>
          {info.nome} · Lv {celebra.livello}
        </div>
        <p className="mt-3 text-sm text-ink-dim">
          Sale un solo binario a settimana: è il blocco anti-crollo. Gli XP in eccesso restano e faranno
          salire un altro binario la prossima settimana.
        </p>
        <button
          onClick={() => setCelebra(null)}
          className="mt-5 w-full rounded-2xl py-3 font-semibold text-white"
          style={{ background: info.color }}
        >
          Avanti così
        </button>
      </div>
    </div>
  )
}
