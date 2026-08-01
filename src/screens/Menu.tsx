import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, setSetting } from '../db/db'
import type { Binario, Frequenza, MetricDefinition, TipoInput } from '../db/types'
import { BigButton, Card, Chip, SectionTitle, useToast } from '../components/ui'
import { BINARI, binario } from '../lib/binari'
import { MODALITA } from '../lib/phases'
import { dayKey } from '../lib/dates'
import {
  exportCSVImpulsi,
  exportCSVMetriche,
  exportCSVSessioni,
  exportJSON,
  exportTuttoCSV,
} from '../lib/export'

type Panel = 'home' | 'export' | 'admin' | 'fasi' | 'impostazioni' | 'regole'

export function Menu() {
  const [panel, setPanel] = useState<Panel>('home')

  if (panel !== 'home') {
    return (
      <div className="mx-auto max-w-md px-4 pb-8 pt-safe">
        <button onClick={() => setPanel('home')} className="py-4 text-sm text-accent">
          ‹ Menu
        </button>
        {panel === 'export' && <ExportPanel />}
        {panel === 'admin' && <AdminPanel />}
        {panel === 'fasi' && <FasiPanel />}
        {panel === 'impostazioni' && <ImpostazioniPanel />}
        {panel === 'regole' && <RegolePanel />}
      </div>
    )
  }

  const voci: { p: Panel; label: string; sub: string }[] = [
    { p: 'export', label: 'Esporta dati', sub: 'JSON + CSV per l analisi settimanale' },
    { p: 'admin', label: 'Metriche', sub: 'Aggiungi o disattiva metriche senza codice' },
    { p: 'fasi', label: 'Fasi', sub: 'Calendario e modalita Trasferta' },
    { p: 'impostazioni', label: 'Impostazioni', sub: 'Modulo calorie, onboarding' },
    { p: 'regole', label: 'Le 5 regole', sub: 'Come funziona il gioco' },
  ]

  return (
    <div className="mx-auto max-w-md px-4 pb-8 pt-safe">
      <h1 className="py-4 text-xl font-bold">Menu</h1>
      <div className="space-y-3">
        {voci.map((v) => (
          <Card key={v.p} onClick={() => setPanel(v.p)}>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{v.label}</div>
                <div className="text-xs text-ink-dim">{v.sub}</div>
              </div>
              <span className="text-ink-dim">›</span>
            </div>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-ink-dim">
        Ascesa · dati solo su questo dispositivo · {dayKey()}
      </p>
    </div>
  )
}

function ExportPanel() {
  const { toast } = useToast()
  return (
    <div>
      <SectionTitle>Esporta</SectionTitle>
      <div className="space-y-3">
        <BigButton
          onClick={async () => {
            await exportTuttoCSV()
            toast('Esportati JSON + CSV metriche.')
          }}
        >
          Esporta tutto (JSON + CSV)
        </BigButton>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => exportJSON()} className="rounded-xl border border-line bg-panel py-3 text-xs font-semibold">
            Solo JSON
          </button>
          <button onClick={() => exportCSVImpulsi()} className="rounded-xl border border-line bg-panel py-3 text-xs font-semibold">
            CSV impulsi
          </button>
          <button onClick={() => exportCSVSessioni()} className="rounded-xl border border-line bg-panel py-3 text-xs font-semibold">
            CSV sessioni
          </button>
        </div>
        <button onClick={() => exportCSVMetriche()} className="w-full rounded-xl border border-line bg-panel py-3 text-xs font-semibold">
          CSV metriche
        </button>
      </div>
      <p className="mt-4 text-xs text-ink-dim">
        Il JSON contiene tutto ed e pensato per essere incollato a un AI per l analisi settimanale.
        Regola di lettura: correlazioni, non diagnosi.
      </p>
    </div>
  )
}

const TIPI_INPUT: TipoInput[] = ['number', 'slider', 'toggle', 'timer', 'time', 'choice', 'text', 'photo']
const FREQUENZE: Frequenza[] = ['daily', 'weekly', 'biweekly', 'per_session', 'event']

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function AdminPanel() {
  const { toast } = useToast()
  const defs = useLiveQuery(() => db.metricDefinitions.toArray(), [])
  const [nome, setNome] = useState('')
  const [categoria, setCategoria] = useState('Prestazione')
  const [binarioXp, setBinarioXp] = useState<Binario | ''>('')
  const [unita, setUnita] = useState('')
  const [tipoInput, setTipoInput] = useState<TipoInput>('number')
  const [frequenza, setFrequenza] = useState<Frequenza>('daily')

  const categorieEsistenti = Array.from(new Set((defs ?? []).map((d) => d.categoria)))

  const aggiungi = async () => {
    if (!nome.trim()) return
    const key = slugify(nome)
    const maxOrd = Math.max(0, ...(defs ?? []).map((d) => d.ordine))
    const nuovo: MetricDefinition = {
      key,
      nome: nome.trim(),
      categoria: categoria.trim() || 'Altro',
      binarioXp: binarioXp === '' ? null : binarioXp,
      unita: unita.trim(),
      tipoInput,
      frequenza,
      protocollo: 'Metrica aggiunta manualmente.',
      direzione: 'neutral',
      sorgente: 'manual',
      attiva: true,
      ordine: maxOrd + 1,
      builtin: false,
      config: {},
    }
    await db.metricDefinitions.put(nuovo)
    toast(`Metrica "${nome}" aggiunta.`)
    setNome('')
    setUnita('')
  }

  return (
    <div>
      <SectionTitle>Aggiungi metrica</SectionTitle>
      <Card className="space-y-3">
        <input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome (es. Sprint 30m)" className="w-full rounded-xl border border-line bg-panel2 px-3 py-3 text-sm outline-none" />
        <div className="flex gap-2">
          <input value={categoria} onChange={(e) => setCategoria(e.target.value)} list="cats" placeholder="Categoria" className="flex-1 rounded-xl border border-line bg-panel2 px-3 py-3 text-sm outline-none" />
          <datalist id="cats">
            {categorieEsistenti.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <input value={unita} onChange={(e) => setUnita(e.target.value)} placeholder="Unita" className="w-24 rounded-xl border border-line bg-panel2 px-3 py-3 text-sm outline-none" />
        </div>
        <div>
          <div className="mb-1 text-xs text-ink-dim">Tipo di input</div>
          <div className="flex flex-wrap gap-2">
            {TIPI_INPUT.map((t) => (
              <Chip key={t} active={tipoInput === t} onClick={() => setTipoInput(t)}>
                {t}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs text-ink-dim">Frequenza</div>
          <div className="flex flex-wrap gap-2">
            {FREQUENZE.map((f) => (
              <Chip key={f} active={frequenza === f} onClick={() => setFrequenza(f)}>
                {f}
              </Chip>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs text-ink-dim">Binario che guadagna XP (opzionale)</div>
          <div className="flex flex-wrap gap-2">
            <Chip active={binarioXp === ''} onClick={() => setBinarioXp('')}>
              Nessuno
            </Chip>
            {BINARI.map((b) => (
              <Chip key={b.key} active={binarioXp === b.key} color={b.color} onClick={() => setBinarioXp(b.key)}>
                {b.nome}
              </Chip>
            ))}
          </div>
        </div>
        <BigButton onClick={aggiungi} disabled={!nome.trim()}>
          Aggiungi metrica
        </BigButton>
      </Card>

      <SectionTitle>Metriche esistenti</SectionTitle>
      <div className="space-y-2">
        {(defs ?? [])
          .sort((a, b) => a.ordine - b.ordine)
          .map((d) => (
            <Card key={d.key} className="flex items-center justify-between py-3">
              <div>
                <div className="text-sm font-medium">
                  {d.nome} {!d.attiva && <span className="text-ink-dim">(off)</span>}
                </div>
                <div className="text-[11px] text-ink-dim">
                  {d.categoria} · {d.tipoInput} · {d.frequenza}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => db.metricDefinitions.update(d.key, { attiva: !d.attiva })}
                  className="rounded-lg border border-line bg-panel2 px-2 py-1 text-xs"
                >
                  {d.attiva ? 'Disattiva' : 'Attiva'}
                </button>
                {!d.builtin && (
                  <button
                    onClick={() => db.metricDefinitions.delete(d.key)}
                    className="rounded-lg border border-line bg-panel2 px-2 py-1 text-xs text-corpo"
                  >
                    Elimina
                  </button>
                )}
              </div>
            </Card>
          ))}
      </div>
    </div>
  )
}

function FasiPanel() {
  const fasi = useLiveQuery(() => db.phases.orderBy('dataInizio').toArray(), [])
  const oggi = dayKey()
  return (
    <div>
      <SectionTitle>Calendario fasi</SectionTitle>
      <div className="space-y-2">
        {(fasi ?? []).map((f) => {
          const attiva = oggi >= f.dataInizio && oggi <= f.dataFine
          return (
            <Card key={f.id} style={attiva ? { borderColor: '#a78bfa' } : undefined}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">
                    {f.nome} {attiva && <span className="text-xs text-accent">· ora</span>}
                  </div>
                  <div className="text-xs text-ink-dim">
                    {f.dataInizio} → {f.dataFine}
                  </div>
                </div>
                <span className="rounded-full bg-panel2 px-2 py-1 text-[11px]">
                  {MODALITA[f.modalita].label} ×{MODALITA[f.modalita].moltiplicatore}
                </span>
              </div>
            </Card>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-ink-dim">
        Nei periodi in Trasferta la streak si congela e restano attive solo le azioni minime.
      </p>
    </div>
  )
}

function ImpostazioniPanel() {
  const { toast } = useToast()
  const nutriRow = useLiveQuery(() => db.settings.get('nutrition_enabled'), [])
  const altezzaRow = useLiveQuery(() => db.settings.get('altezza_cm'), [])
  const nutriOn = nutriRow?.value === true
  const [alt, setAlt] = useState('')

  const toggleNutri = async () => {
    await setSetting('nutrition_enabled', !nutriOn)
    toast(nutriOn ? 'Modulo Cibo disattivato.' : 'Modulo Cibo attivato (osservativo, senza punteggio).')
  }

  const resetOnboarding = async () => {
    await setSetting('onboarding_done', false)
    toast('Onboarding riattivato: riapri l app.')
  }

  return (
    <div>
      <SectionTitle>Cibo e nutrizione</SectionTitle>
      <Card>
        <p className="mb-3 text-sm text-ink-dim">
          Conteggio di kcal, carboidrati, proteine, grassi, sale, fibre e zuccheri. Puramente
          osservativo: nessun obiettivo, nessun colore verde/rosso, nessun alert, mai XP. Spento di
          default per le prime settimane.
        </p>
        <button
          onClick={toggleNutri}
          className={`w-full rounded-xl py-3 text-sm font-semibold ${nutriOn ? 'bg-tavola text-white' : 'border border-line bg-panel2'}`}
        >
          {nutriOn ? 'Attivo — tocca per disattivare' : 'Attiva modulo Cibo'}
        </button>
        <p className="mt-2 text-[11px] text-ink-dim">Quando attivo compare nella scheda Corpo → Cibo e in Registra.</p>
      </Card>

      <SectionTitle>Corpo</SectionTitle>
      <Card>
        <div className="mb-2 text-sm font-medium">Altezza {altezzaRow ? `(${altezzaRow.value} cm)` : ''}</div>
        <div className="flex gap-2">
          <input
            inputMode="numeric"
            value={alt}
            onChange={(e) => setAlt(e.target.value)}
            placeholder="cm"
            className="w-24 rounded-xl border border-line bg-panel2 px-3 py-2.5 text-center text-lg font-bold outline-none"
          />
          <button
            onClick={async () => {
              if (!alt) return
              await setSetting('altezza_cm', Number(alt))
              setAlt('')
              toast('Altezza aggiornata.')
            }}
            className="flex-1 rounded-xl bg-accent py-2.5 text-sm font-semibold text-white"
          >
            Salva altezza
          </button>
        </div>
        <p className="mt-2 text-[11px] text-ink-dim">Serve per il BMI e per lo Specchio (corpo visuale).</p>
      </Card>

      <SectionTitle>Onboarding</SectionTitle>
      <Card onClick={resetOnboarding}>
        <div className="text-sm font-medium">Rivedi le 5 regole all avvio</div>
        <div className="text-xs text-ink-dim">Riattiva la schermata iniziale.</div>
      </Card>
    </div>
  )
}

function RegolePanel() {
  const regole = [
    'Gli XP vanno solo in su. Un azione non fatta vale zero, mai meno.',
    'Registrare l impulso vale quanto resistergli: gli XP arrivano subito, l esito non li cambia.',
    'Un solo binario sale di livello a settimana. Gli XP in eccesso restano per la prossima.',
    'I livelli non si perdono mai: se cali, cambia solo la velocita di salita.',
    'Trasferta congela la streak invece di azzerarla. Nessun periodo puo rompere il gioco.',
  ]
  return (
    <div>
      <SectionTitle>Le 5 regole</SectionTitle>
      <div className="space-y-2">
        {regole.map((r, i) => (
          <Card key={i} style={{ borderLeft: `3px solid ${binario(BINARI[i].key).color}` }}>
            <div className="flex gap-3">
              <span className="font-bold text-accent">{i + 1}</span>
              <span className="text-sm">{r}</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
