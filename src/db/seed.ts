import { db, setSetting } from './db'
import type { MetricDefinition, Phase } from './types'

type SeedMetric = Omit<MetricDefinition, 'attiva' | 'builtin' | 'ordine' | 'config'> &
  Partial<Pick<MetricDefinition, 'attiva' | 'builtin' | 'ordine' | 'config'>>

// Catalogo completo (sez.4). Protocolli in "ricetta" pratica: cosa fare, come contare, la regola.
const METRICS: SeedMetric[] = [
  // --- Prestazione fisica (Corpo) ---
  { key: 'trazioni_max', nome: 'Trazioni massime', categoria: 'Prestazione', binarioXp: 'corpo', unita: 'rip', tipoInput: 'number', frequenza: 'weekly', direzione: 'up', sorgente: 'manual', protocollo: 'Riscaldati. Un solo set a cedimento: conta solo le trazioni complete (mento sopra la sbarra, braccia distese sotto). Stesso grip e stesso giorno ogni settimana.', config: { min: 0, max: 100, benchmark: true } },
  { key: 'flessioni_max', nome: 'Flessioni massime', categoria: 'Prestazione', binarioXp: 'corpo', unita: 'rip', tipoInput: 'number', frequenza: 'weekly', direzione: 'up', sorgente: 'manual', protocollo: 'Un solo set a cedimento: petto a ~5 cm da terra e braccia distese in alto. Fermati quando perdi la forma corretta.', config: { min: 0, max: 300, benchmark: true } },
  { key: 'volume_allenamento', nome: 'Volume allenamento', categoria: 'Prestazione', binarioXp: 'corpo', unita: 'kg', tipoInput: 'number', frequenza: 'per_session', direzione: 'up', sorgente: 'manual', protocollo: 'Somma di (serie x ripetizioni x carico) di tutta la seduta. Es. 3x10x40 kg = 1200. A corpo libero usa il tuo peso come carico.', config: { min: 0, max: 100000 } },
  { key: 'plank', nome: 'Tenuta plank', categoria: 'Prestazione', binarioXp: 'corpo', unita: 's', tipoInput: 'timer', frequenza: 'weekly', direzione: 'up', sorgente: 'manual', protocollo: 'Sugli avambracci, corpo in linea (spalle-anche-caviglie). Avvia il timer, stop quando i fianchi cedono o si alzano.', config: { benchmark: true } },
  { key: 'passi', nome: 'Passi giornalieri', categoria: 'Prestazione', binarioXp: 'corpo', unita: 'passi', tipoInput: 'number', frequenza: 'daily', direzione: 'up', sorgente: 'phone', protocollo: "La sera leggi il totale del giorno dall'app salute del telefono e trascrivilo.", config: { min: 0, max: 100000 } },
  { key: 'tempo_distanza', nome: 'Tempo su distanza fissa', categoria: 'Prestazione', binarioXp: 'corpo', unita: 's', tipoInput: 'number', frequenza: 'weekly', direzione: 'down', sorgente: 'manual', protocollo: 'Scegli UNA distanza fissa (es. 1 km) e falla sempre uguale, stesso percorso. Cronometra dall inizio alla fine, segna i secondi.', config: { min: 0, max: 100000 } },
  { key: 'forza_presa', nome: 'Forza di presa', categoria: 'Prestazione', binarioXp: 'corpo', unita: 'kg', tipoInput: 'number', frequenza: 'daily', direzione: 'up', sorgente: 'device', protocollo: 'Dinamometro, in piedi, braccio disteso lungo il fianco. Stringi al massimo per 3 secondi. Due prove per la mano dominante, segna la migliore.', config: { min: 0, max: 120, step: 0.5 } },
  { key: 'salto_verticale', nome: 'Salto verticale', categoria: 'Prestazione', binarioXp: 'corpo', unita: 'cm', tipoInput: 'number', frequenza: 'daily', direzione: 'up', sorgente: 'manual', protocollo: 'In piedi vicino a un muro: segna il punto piu alto che tocchi da fermo con un salto, meno la tua altezza a braccio teso. Tre prove, tieni la migliore.', config: { min: 0, max: 200 } },
  { key: 'equilibrio_occhi_chiusi', nome: 'Equilibrio occhi chiusi', categoria: 'Prestazione', binarioXp: 'corpo', unita: 's', tipoInput: 'timer', frequenza: 'daily', direzione: 'up', sorgente: 'manual', protocollo: 'Su una gamba, mani sui fianchi. Avvia il timer alla chiusura degli occhi, stop appena appoggi l altro piede o sposti quello a terra.' },
  { key: 'mobilita_spalle', nome: 'Mobilita spalle', categoria: 'Prestazione', binarioXp: 'corpo', unita: 'cm', tipoInput: 'number', frequenza: 'weekly', direzione: 'up', sorgente: 'manual', protocollo: 'Dietro la schiena, una mano dall alto e una dal basso: misura in cm la distanza tra le dita (0 = si toccano). Stessa mano sopra ogni volta.', config: { min: 0, max: 100 } },
  { key: 'mobilita_catena_posteriore', nome: 'Mobilita catena posteriore', categoria: 'Prestazione', binarioXp: 'corpo', unita: 'cm', tipoInput: 'number', frequenza: 'weekly', direzione: 'up', sorgente: 'manual', protocollo: 'Seduto a terra, gambe tese: allungati verso le punte dei piedi. Misura i cm oltre (+) o prima (-) delle dita dei piedi.', config: { min: -50, max: 60 } },
  { key: 'apnea_co2', nome: 'Apnea dopo espirazione', categoria: 'Prestazione', binarioXp: 'corpo', unita: 's', tipoInput: 'timer', frequenza: 'weekly', direzione: 'up', sorgente: 'manual', protocollo: 'Seduto e calmo: espira normalmente, poi trattieni. Timer fino alla prima forte voglia di respirare (non forzare oltre). Misura la tolleranza alla CO2.' },

  // --- Fisiologia (al risveglio salvo indicato) ---
  { key: 'fc_riposo', nome: 'FC a riposo', categoria: 'Fisiologia', binarioXp: 'corpo', unita: 'bpm', tipoInput: 'number', frequenza: 'daily', direzione: 'down', sorgente: 'device', protocollo: 'Appena sveglio, ancora sdraiato, prima di alzarti. Conta i battiti per 60 secondi (o leggi da orologio/fascia). Sempre stesso momento.', config: { min: 30, max: 140, checkin: 'wake' } },
  { key: 'hrv', nome: 'HRV', categoria: 'Fisiologia', binarioXp: 'corpo', unita: 'ms', tipoInput: 'number', frequenza: 'daily', direzione: 'up', sorgente: 'device', protocollo: 'Stesso momento della FC, ancora a letto. Con fascia/app: resta immobile, respiro normale, misura 1 minuto. Sempre la stessa app.', config: { min: 0, max: 250, checkin: 'wake', priorita: true } },
  { key: 'test_ortostatico', nome: 'Test ortostatico', categoria: 'Fisiologia', binarioXp: 'corpo', unita: 'bpm', tipoInput: 'number', frequenza: 'daily', direzione: 'down', sorgente: 'manual', protocollo: 'Conta i battiti da sdraiato. Alzati in piedi, aspetta 60 secondi, riconta. Segna la differenza (in piedi meno sdraiato): piu alta = piu fatica accumulata.', config: { min: -20, max: 80, checkin: 'wake' } },
  { key: 'recupero_cardiaco', nome: 'Recupero cardiaco', categoria: 'Fisiologia', binarioXp: 'corpo', unita: 'bpm', tipoInput: 'number', frequenza: 'weekly', direzione: 'up', sorgente: 'manual', protocollo: '3 minuti a ritmo fisso (corsa o camminata veloce). Fermati e conta subito i battiti (A). Aspetta 60 secondi fermo e riconta (B). Segna A meno B: piu alto = meglio.', config: { min: 0, max: 100, benchmark: true, evidenza: true } },
  { key: 'pressione_sistolica', nome: 'Pressione sistolica (massima)', categoria: 'Fisiologia', binarioXp: 'corpo', unita: 'mmHg', tipoInput: 'number', frequenza: 'weekly', direzione: 'neutral', sorgente: 'device', protocollo: 'Seduto da 5 minuti, schiena appoggiata, braccio sul tavolo all altezza del cuore. Misuratore DA BRACCIO (quelli da polso sono inaffidabili). Segna il numero alto.', config: { min: 70, max: 220 } },
  { key: 'pressione_diastolica', nome: 'Pressione diastolica (minima)', categoria: 'Fisiologia', binarioXp: 'corpo', unita: 'mmHg', tipoInput: 'number', frequenza: 'weekly', direzione: 'neutral', sorgente: 'device', protocollo: 'Stessa misurazione della massima, misuratore da braccio: segna il numero basso.', config: { min: 40, max: 140 } },
  { key: 'ore_sonno', nome: 'Ore di sonno', categoria: 'Fisiologia', binarioXp: 'corpo', unita: 'h', tipoInput: 'number', frequenza: 'daily', direzione: 'up', sorgente: 'phone', protocollo: 'Ore totali dormite stanotte (dall app del telefono o a stima).', config: { min: 0, max: 16, step: 0.5, checkin: 'wake' } },
  { key: 'qualita_sonno', nome: 'Qualita sonno', categoria: 'Fisiologia', binarioXp: 'corpo', unita: '1-5', tipoInput: 'slider', frequenza: 'daily', direzione: 'up', sorgente: 'manual', protocollo: 'Quanto ti senti recuperato al risveglio: 1 = a pezzi, 5 = pieno di energia.', config: { min: 1, max: 5, checkin: 'wake' } },
  { key: 'orario_addormentamento', nome: 'Orario addormentamento', categoria: 'Fisiologia', binarioXp: 'corpo', unita: 'hh:mm', tipoInput: 'time', frequenza: 'daily', direzione: 'neutral', sorgente: 'manual', protocollo: "L'ora a cui ti sei addormentato. Punta alla REGOLARITA: lo stesso orario ogni sera conta piu della durata.", config: { checkin: 'wake' } },
  { key: 'orario_risveglio', nome: 'Orario risveglio', categoria: 'Fisiologia', binarioXp: 'corpo', unita: 'hh:mm', tipoInput: 'time', frequenza: 'daily', direzione: 'neutral', sorgente: 'manual', protocollo: "L'ora a cui ti sei svegliato. La regolarita risveglio-addormentamento e il segnale piu importante per il sonno.", config: { checkin: 'wake' } },

  // --- Composizione corporea ---
  { key: 'peso', nome: 'Peso', categoria: 'Composizione', binarioXp: 'corpo', unita: 'kg', tipoInput: 'number', frequenza: 'daily', direzione: 'down', sorgente: 'manual', protocollo: 'Appena sveglio, dopo essere andato in bagno, a digiuno, nudo, stessa bilancia. Vedrai solo la media a 7 giorni: il valore del singolo giorno e rumore.', config: { min: 30, max: 250, step: 0.1, hideDaily: true, displayRule: 'movingAvg7' } },
  { key: 'circonferenza_vita', nome: 'Circonferenza vita', categoria: 'Composizione', binarioXp: 'corpo', unita: 'cm', tipoInput: 'number', frequenza: 'weekly', direzione: 'down', sorgente: 'manual', protocollo: "In piedi, metro all'altezza dell'ombelico, aderente ma senza stringere, a fine espirazione normale. Dice piu del peso sulla salute metabolica.", config: { min: 40, max: 200, step: 0.5 } },
  { key: 'foto', nome: 'Foto di confronto', categoria: 'Composizione', binarioXp: 'corpo', unita: '', tipoInput: 'photo', frequenza: 'biweekly', direzione: 'neutral', sorgente: 'manual', protocollo: 'Ogni due settimane: stessa luce, stessa distanza, stessa posa, stessa ora, stesso sfondo. Cosi il confronto e onesto.' },

  // --- Cognitive e attenzione (Mente) ---
  { key: 'tempo_reazione', nome: 'Tempo di reazione', categoria: 'Cognitive', binarioXp: 'mente', unita: 'ms', tipoInput: 'number', frequenza: 'daily', direzione: 'down', sorgente: 'phone', protocollo: 'Test da telefono (app o sito "reaction time"): al segnale tocca il prima possibile. Fai 5 prove, segna la media in millisecondi.', config: { min: 100, max: 1000 } },
  { key: 'memoria_lavoro', nome: 'Memoria di lavoro', categoria: 'Cognitive', binarioXp: 'mente', unita: 'cifre', tipoInput: 'number', frequenza: 'daily', direzione: 'up', sorgente: 'manual', protocollo: 'Fatti leggere sequenze di cifre e ripetile ALL INDIETRO. Segna la lunghezza massima che ripeti senza errori.', config: { min: 0, max: 15 } },
  { key: 'velocita_lettura', nome: 'Velocita di lettura', categoria: 'Cognitive', binarioXp: 'mente', unita: 'ppm', tipoInput: 'number', frequenza: 'weekly', direzione: 'up', sorgente: 'manual', protocollo: 'Leggi un testo per 1 minuto, conta le parole lette, poi verifica di aver capito. Segna le parole al minuto.', config: { min: 0, max: 1500 } },
  { key: 'tempo_prima_distrazione', nome: 'Tempo alla prima distrazione', categoria: 'Cognitive', binarioXp: 'mente', unita: 'min', tipoInput: 'timer', frequenza: 'daily', direzione: 'up', sorgente: 'manual', protocollo: "Siediti a leggere. Avvia il timer all'inizio, stop al primo impulso di prendere il telefono. Segna i minuti: vederli crescere e la prova che l'attenzione migliora.", config: { motivazionale: true } },

  // --- Variabili di contesto ---
  { key: 'minuti_aperto', nome: "Minuti all'aperto", categoria: 'Contesto', binarioXp: null, unita: 'min', tipoInput: 'number', frequenza: 'daily', direzione: 'up', sorgente: 'phone', protocollo: "Minuti passati all'aperto o alla luce naturale nel giorno (a stima).", config: { min: 0, max: 1440 } },
  { key: 'ora_ultimo_caffe', nome: 'Ora ultimo caffe', categoria: 'Contesto', binarioXp: null, unita: 'hh:mm', tipoInput: 'time', frequenza: 'daily', direzione: 'neutral', sorgente: 'manual', protocollo: "L'ora dell'ultimo caffe o energetico della giornata." },
  { key: 'ore_con_persone', nome: 'Ore con altre persone', categoria: 'Contesto', binarioXp: null, unita: 'h', tipoInput: 'number', frequenza: 'daily', direzione: 'neutral', sorgente: 'manual', protocollo: 'Ore stimate passate in compagnia.', config: { min: 0, max: 24, step: 0.5 } },
  { key: 'ore_da_solo', nome: 'Ore da solo', categoria: 'Contesto', binarioXp: null, unita: 'h', tipoInput: 'number', frequenza: 'daily', direzione: 'neutral', sorgente: 'manual', protocollo: 'Ore stimate passate da solo.', config: { min: 0, max: 24, step: 0.5 } },
]

// Sezione 9 — calendario delle fasi (anno 2026).
const PHASES: Omit<Phase, 'id'>[] = [
  { nome: 'Costruzione', dataInizio: '2026-07-01', dataFine: '2026-08-11', modalita: 'normale' },
  { nome: 'Campo Charge', dataInizio: '2026-08-12', dataFine: '2026-08-15', modalita: 'trasferta' },
  { nome: 'Rientro', dataInizio: '2026-08-16', dataFine: '2026-08-17', modalita: 'normale' },
  { nome: 'Mare', dataInizio: '2026-08-18', dataFine: '2026-08-23', modalita: 'trasferta_leggera' },
  { nome: 'Campagna lunga', dataInizio: '2026-08-24', dataFine: '2026-10-14', modalita: 'normale' },
  { nome: 'Partenza Inghilterra', dataInizio: '2026-10-15', dataFine: '2026-10-15', modalita: 'normale' },
]

/**
 * Allinea le metriche builtin al catalogo (nomi, protocolli, config) a ogni avvio.
 * Idempotente: NON tocca le metriche aggiunte da te, ne il loro on/off, ne l'ordine.
 */
export async function syncBuiltinDefs(): Promise<void> {
  await db.transaction('rw', db.metricDefinitions, async () => {
    let ordine = 0
    for (const m of METRICS) {
      const ex = await db.metricDefinitions.get(m.key)
      if (!ex) {
        await db.metricDefinitions.put({
          ...m,
          attiva: true,
          builtin: true,
          ordine,
          config: m.config ?? {},
        } as MetricDefinition)
      } else if (ex.builtin) {
        await db.metricDefinitions.update(m.key, {
          nome: m.nome,
          categoria: m.categoria,
          binarioXp: m.binarioXp,
          unita: m.unita,
          tipoInput: m.tipoInput,
          frequenza: m.frequenza,
          direzione: m.direzione,
          sorgente: m.sorgente,
          protocollo: m.protocollo,
          config: m.config ?? {},
          // attiva e ordine restano quelli scelti dall'utente
        })
      }
      ordine += 1
    }
  })
}

export async function ensureSeed(): Promise<void> {
  await syncBuiltinDefs()

  const phaseCount = await db.phases.count()
  if (phaseCount === 0) {
    await db.phases.bulkAdd(PHASES as Phase[])
  }

  await setSetting('seed_v1', true)
}
