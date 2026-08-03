import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../db/db'
import { SectionTitle, useToast } from '../components/ui'
import { ActivityLogger } from '../components/Activities'
import { deleteActivityLog } from '../lib/actions'
import { logicalDayKey, shortDateTime } from '../lib/dates'

export function Attivita() {
  const navigate = useNavigate()
  const { toast } = useToast()

  const oggiLogs = useLiveQuery(async () => {
    const all = await db.activityLogs.toArray()
    return all.filter((l) => logicalDayKey(l.ts) === logicalDayKey()).sort((a, b) => b.ts - a.ts)
  }, [])
  const defMap = useLiveQuery(
    async () => new Map((await db.activityDefs.toArray()).map((d) => [d.key, d.nome])),
    [],
  )

  return (
    <div className="mx-auto max-w-md px-4 pb-8 pt-safe">
      <button onClick={() => navigate('/')} className="py-4 text-sm text-accent">
        ‹ Oggi
      </button>
      <h1 className="pb-1 text-xl font-bold">Attività a punti</h1>
      <p className="mb-4 text-sm text-ink-dim">
        Segna cosa hai fatto: gli XP scalano con tempo e sforzo e alimentano il binario giusto.
      </p>

      <ActivityLogger />

      {oggiLogs && oggiLogs.length > 0 && (
        <>
          <SectionTitle>Registrate oggi</SectionTitle>
          <div className="space-y-2">
            {oggiLogs.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-xl border border-line bg-panel px-3 py-2.5">
                <div className="min-w-0 truncate text-sm">
                  {defMap?.get(l.defKey) ?? l.defKey}{' '}
                  <span className="text-ink-dim">· +{l.xp} XP · {shortDateTime(l.ts)}</span>
                </div>
                <button
                  onClick={() => deleteActivityLog(l.id!).then(() => toast('Eliminata, XP annullati.'))}
                  className="shrink-0 pl-2 text-ink-dim"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
