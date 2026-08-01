import { BigButton, Card } from '../components/ui'

const REGOLE: { n: number; titolo: string; testo: string; color: string }[] = [
  {
    n: 1,
    titolo: 'Gli XP vanno solo in su',
    testo:
      "Non esistono penalita ne punteggi negativi. Un'azione non fatta vale zero, mai meno di zero. Non puoi mai essere in debito col sistema.",
    color: '#22c55e',
  },
  {
    n: 2,
    titolo: "Registrare l'impulso vale quanto resistergli",
    testo:
      "Quando parte un impulso lo registri in tre tap e gli XP arrivano subito, sul solo atto di registrare. Dopo venti minuti l'app ti chiede com'e andata: l'esito non cambia in nessun modo gli XP gia presi. Il dato vale piu dell'esito.",
    color: '#a78bfa',
  },
  {
    n: 3,
    titolo: 'Un solo binario sale di livello a settimana',
    testo:
      'Non puoi alzare l asticella su piu aree insieme. E un blocco anti-crollo: gli XP in eccesso restano e ti fanno salire la settimana dopo.',
    color: '#3b82f6',
  },
  {
    n: 4,
    titolo: 'I livelli non si perdono mai',
    testo: 'Se cali, cambia solo la velocita con cui sali. Il livello raggiunto resta.',
    color: '#f59e0b',
  },
  {
    n: 5,
    titolo: 'Trasferta congela, non azzera',
    testo:
      'Nei periodi in cui non controlli ambiente e cibo (campi, mare) attivi la Trasferta: restano 3 azioni minime, la streak si congela e gli XP continuano ridotti. Nessun periodo puo rompere il gioco.',
    color: '#ef4444',
  },
]

export function Onboarding({ onDone }: { onDone: () => void }) {
  return (
    <div className="mx-auto max-w-md px-4 pb-10 pt-safe">
      <div className="pt-8 pb-2 text-center">
        <div className="text-3xl font-bold">Ascesa</div>
        <p className="mt-2 text-sm text-ink-dim">
          Mezzo videogioco, mezzo laboratorio. Misura, sfida, restituisce dati. Le interpretazioni
          le fai tu.
        </p>
      </div>

      <div className="mt-4 space-y-3">
        {REGOLE.map((r) => (
          <Card key={r.n} style={{ borderLeft: `3px solid ${r.color}` }}>
            <div className="flex items-start gap-3">
              <span
                className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: r.color }}
              >
                {r.n}
              </span>
              <div>
                <div className="font-semibold">{r.titolo}</div>
                <p className="mt-1 text-sm text-ink-dim">{r.testo}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6">
        <BigButton onClick={onDone}>Ho capito, inizia</BigButton>
      </div>
    </div>
  )
}
