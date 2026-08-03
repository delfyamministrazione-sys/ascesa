import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { Card, Chip, SectionTitle, useToast, useTick } from '../components/ui'
import { BOSS, ESITI_IMPULSO, IMPULSO_TIPI, LUOGHI } from '../lib/options'
import { closeImpulse, declareBoss, deleteImpulse, logImpulse, recordBossEncounter } from '../lib/actions'
import { dayKey } from '../lib/dates'
import type { Binario, Impulse } from '../db/types'

const IMP_BIN: Record<string, Binario> = { scroll: 'mente', cibo: 'tavola', visivo: 'spirito', altro: 'mente' }

const VENTI_MIN = 20 * 60 * 1000

function elapsedLabel(ms: number): string {
  const min = Math.floor(ms / 60000)
  if (min < 1) return 'ora'
  if (min < 60) return `${min} min fa`
  const h = Math.floor(min / 60)
  return `${h}h ${min % 60}m fa`
}

export function Impulso() {
  const { toastXp, toast } = useToast()
  useTick(1000)

  const [tipo, setTipo] = useState<string | null>(null)
  const [intensita, setIntensita] = useState<number | null>(null)
  const [justLogged, setJustLogged] = useState(false)

  const impulsiAperti = useLiveQuery(async () => {
    const all = await db.impulses.orderBy('tsInizio').reverse().toArray()
    return all.filter((i) => i.tsFine === null)
  }, [])

  const boss = useLiveQuery(() => db.settings.get(`boss:${dayKey()}`), [])
  const bossData = (boss?.value as Record<string, { mossa: string }>) ?? {}

  const salva = async (luogo: string) => {
    if (!tipo || !intensita) return
    const xp = await logImpulse(tipo, luogo, intensita)
    const b = IMPULSO_TIPI.find((t) => t.key === tipo)
    toastXp(xp, (b && (b.key === 'scroll' ? 'mente' : b.key === 'cibo' ? 'tavola' : b.key === 'visivo' ? 'spirito' : 'mente')) ?? 'mente')
    setTipo(null)
    setIntensita(null)
    setJustLogged(true)
    setTimeout(() => setJustLogged(false), 2500)
  }

  const step = tipo === null ? 0 : intensita === null ? 1 : 2

  return (
    <div className="mx-auto max-w-md px-4 pb-8 pt-safe">
      <div className="py-4">
        <h1 className="text-xl font-bold">Registra impulso</h1>
        <p className="text-sm text-ink-dim">
          Registrare vale quanto resistere. Gli XP arrivano ora, l esito non li cambia.
        </p>
      </div>

      <Card>
        {step === 0 && (
          <div>
            <div className="mb-3 text-sm font-medium text-ink-dim">1 · Cosa</div>
            <div className="grid grid-cols-2 gap-3">
              {IMPULSO_TIPI.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTipo(t.key)}
                  className="rounded-2xl border border-line py-5 text-base font-semibold active:scale-[.98]"
                  style={{ borderLeft: `4px solid ${t.color}` }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div>
            <div className="mb-3 text-sm font-medium text-ink-dim">2 · Intensita</div>
            <div className="flex justify-between gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setIntensita(n)}
                  className="flex-1 rounded-2xl border border-line py-6 text-2xl font-bold active:scale-95"
                >
                  {n}
                </button>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-ink-dim">
              <span>lieve</span>
              <span>fortissima</span>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="mb-3 text-sm font-medium text-ink-dim">3 · Dove</div>
            <div className="flex flex-wrap gap-2">
              {LUOGHI.map((l) => (
                <Chip key={l} onClick={() => salva(l)}>
                  {l}
                </Chip>
              ))}
            </div>
          </div>
        )}
      </Card>

      {justLogged && (
        <p className="mt-3 text-center text-sm font-medium text-vita">
          Registrato. Tra 20 minuti ti chiedo com e andata.
        </p>
      )}

      {/* Impulsi aperti: follow-up a 20 min, l'esito NON cambia gli XP */}
      {impulsiAperti && impulsiAperti.length > 0 && (
        <>
          <SectionTitle>Impulsi aperti</SectionTitle>
          <div className="space-y-3">
            {impulsiAperti.map((imp) => (
              <ImpulsoApertoCard key={imp.id} imp={imp} />
            ))}
          </div>
        </>
      )}

      {/* Boss ricorrenti: XP sulla preparazione */}
      <SectionTitle>Boss di oggi</SectionTitle>
      <div className="space-y-3">
        {BOSS.map((b) => (
          <BossCard
            key={b.key}
            bossKey={b.key}
            nome={b.nome}
            descrizione={b.descrizione}
            color={b.color}
            mossaDichiarata={bossData[b.key]?.mossa}
            onDeclare={async (mossa) => {
              const xp = await declareBoss(b.key, mossa)
              if (xp > 0) toastXp(xp, b.key === 'rientro' ? 'tavola' : 'mente')
            }}
            onEncounter={async (pronta) => {
              await recordBossEncounter(b.key, pronta)
              toast('Incontro registrato (nessun giudizio, solo dato).')
            }}
          />
        ))}
      </div>
    </div>
  )
}

function ImpulsoApertoCard({ imp }: { imp: Impulse }) {
  const { toastXp, toast } = useToast()
  const [contromossa, setContromossa] = useState('')
  const [conferma, setConferma] = useState(false)
  const eta = Date.now() - imp.tsInizio
  const pronto = eta >= VENTI_MIN
  const t = IMPULSO_TIPI.find((x) => x.key === imp.tipo)

  const chiudi = async (esito: string) => {
    const bonus = await closeImpulse(imp.id!, esito, contromossa.trim() || null)
    if (navigator.vibrate) navigator.vibrate(12)
    if (bonus > 0) toastXp(bonus, IMP_BIN[imp.tipo] ?? 'mente')
    else toast('Registrato. La base XP resta.')
  }

  return (
    <Card style={{ borderLeft: `4px solid ${t?.color ?? '#97a0b2'}` }}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-semibold">{t?.label ?? imp.tipo}</span>
        <div className="flex shrink-0 items-center gap-2 text-xs text-ink-dim">
          <span>int. {imp.intensita} · {elapsedLabel(eta)}</span>
          {conferma ? (
            <button onClick={() => deleteImpulse(imp.id!)} className="rounded bg-corpo px-2 py-0.5 font-semibold text-white">
              elimina
            </button>
          ) : (
            <button onClick={() => setConferma(true)} className="px-1 text-ink-dim">
              ✕
            </button>
          )}
        </div>
      </div>

      <div className="mb-1 text-sm text-ink-dim">
        {pronto ? 'Com e andata?' : 'Scrivi la contromossa di stavolta (cambia ogni volta) e segna com e andata:'}
      </div>
      <input
        value={contromossa}
        onChange={(e) => setContromossa(e.target.value)}
        placeholder="Contromossa usata stavolta (es. bevuto acqua, uscito a camminare)"
        className="mb-2 w-full rounded-xl border border-line bg-panel2 px-3 py-2 text-sm outline-none"
      />
      <div className="flex flex-wrap gap-2">
        {ESITI_IMPULSO.map((e) => (
          <Chip key={e.key} color={e.key === 'resistito' ? '#22c55e' : undefined} onClick={() => chiudi(e.key)}>
            {e.label}
          </Chip>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-ink-dim">Resistere dà bonus. Cedere non toglie niente.</p>
    </Card>
  )
}

function BossCard({
  nome,
  descrizione,
  color,
  mossaDichiarata,
  onDeclare,
  onEncounter,
}: {
  bossKey: string
  nome: string
  descrizione: string
  color: string
  mossaDichiarata?: string
  onDeclare: (mossa: string) => void
  onEncounter: (pronta: boolean) => void
}) {
  const [mossa, setMossa] = useState('')
  const dichiarato = mossaDichiarata !== undefined

  return (
    <Card style={{ borderLeft: `4px solid ${color}` }}>
      <div className="font-semibold">{nome}</div>
      <div className="mb-3 text-xs text-ink-dim">{descrizione}</div>

      {!dichiarato ? (
        <div className="space-y-2">
          <input
            value={mossa}
            onChange={(e) => setMossa(e.target.value)}
            placeholder="La contromossa che preparo ora"
            className="w-full rounded-xl border border-line bg-panel2 px-3 py-3 text-sm outline-none"
          />
          <button
            onClick={() => mossa.trim() && onDeclare(mossa.trim())}
            disabled={!mossa.trim()}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:bg-panel2 disabled:text-ink-dim"
            style={mossa.trim() ? { background: color } : undefined}
          >
            Dichiara la mossa · +20 XP
          </button>
        </div>
      ) : (
        <div>
          <div className="rounded-xl bg-panel2 px-3 py-2 text-sm">
            Contromossa pronta: <span className="font-medium">{mossaDichiarata}</span>
          </div>
          <div className="mt-2 text-xs text-ink-dim">Se il boss si presenta, registra il dato:</div>
          <div className="mt-2 flex gap-2">
            <Chip onClick={() => onEncounter(true)}>Contromossa pronta</Chip>
            <Chip onClick={() => onEncounter(false)}>Non pronta</Chip>
          </div>
        </div>
      )}
    </Card>
  )
}
