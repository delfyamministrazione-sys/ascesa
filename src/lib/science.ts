export interface Regione {
  key: string
  nome: string
  sottotitolo: string
  color: string
  metriche: string[] // metric keys da mostrare con l'ultimo valore
  scienza: string[] // fatti brevi, pratici, non giudicanti
}

// Punti cliccabili sul corpo. Ogni regione mappa a dati reali + spiegazione.
export const REGIONI: Regione[] = [
  {
    key: 'mente',
    nome: 'Testa · Mente',
    sottotitolo: 'Attenzione, memoria, lucidita',
    color: '#3b82f6',
    metriche: ['tempo_reazione', 'memoria_lavoro', 'tempo_prima_distrazione', 'velocita_lettura'],
    scienza: [
      'Il tempo di reazione e la spia piu sensibile del sonno: peggiora prima dell umore e prima che tu ti senta stanco.',
      'La memoria di lavoro (cifre ripetute all indietro) cala con stress e privazione di sonno.',
      'Il tempo alla prima distrazione e allenabile: vederlo crescere e il segnale che l attenzione migliora.',
    ],
  },
  {
    key: 'cuore',
    nome: 'Petto · Cuore e recupero',
    sottotitolo: 'Sistema nervoso e cardiovascolare',
    color: '#ef4444',
    metriche: ['fc_riposo', 'hrv', 'recupero_cardiaco', 'test_ortostatico', 'pressione_sistolica'],
    scienza: [
      'FC a riposo bassa e stabile = cuore efficiente. Si misura appena sveglio, ancora a letto.',
      'HRV (variabilita del battito) e il miglior singolo indicatore di recupero: cala 1-2 giorni prima che tu percepisca stress, alcol o una malattia in arrivo.',
      'Recupero cardiaco (quanti battiti scendono in 60s dopo lo sforzo) e il miglior segnale di progresso cardiovascolare: migliora prima del peso e prima dell estetica.',
    ],
  },
  {
    key: 'nutrizione',
    nome: 'Addome · Nutrizione',
    sottotitolo: 'Energia, macro, salute metabolica',
    color: '#f59e0b',
    metriche: ['circonferenza_vita'],
    scienza: [
      'La circonferenza vita dice piu del peso sulla salute metabolica: conta il grasso viscerale, non il numero sulla bilancia.',
      'Energia dei macro: carboidrati e proteine 4 kcal/g, grassi 9 kcal/g. Ecco perche pochi grammi di grasso pesano tanto in kcal.',
      'Proteine (circa 1.6-2 g per kg di peso) sostengono muscolo e sazieta; le fibre rallentano l assorbimento degli zuccheri.',
      'Il sale in eccesso trattiene acqua e alza la pressione: e uno dei motivi per cui il peso oscilla di 1-2 kg da un giorno all altro.',
    ],
  },
  {
    key: 'forza',
    nome: 'Braccia · Forza',
    sottotitolo: 'Forza relativa e affaticamento',
    color: '#a78bfa',
    metriche: ['forza_presa', 'trazioni_max', 'flessioni_max', 'volume_allenamento'],
    scienza: [
      'La forza di presa (dinamometro) e un predittore di salute generale sorprendentemente forte, e cala nei giorni di affaticamento nervoso.',
      'Trazioni e flessioni massime misurano la forza relativa al tuo peso: migliorano aumentando il volume settimanale (serie x ripetizioni x carico).',
    ],
  },
  {
    key: 'motore',
    nome: 'Gambe · Motore',
    sottotitolo: 'Freschezza nervosa e aerobico',
    color: '#22c55e',
    metriche: ['salto_verticale', 'passi', 'equilibrio_occhi_chiusi', 'apnea_co2', 'tempo_distanza'],
    scienza: [
      'Il salto verticale da fermo e un termometro giornaliero della freschezza del sistema nervoso: cala quando sei affaticato, anche se non lo senti.',
      'L equilibrio a occhi chiusi allena propriocezione e stabilita, utili in tutto lo sport.',
      'L apnea dopo espirazione misura la tolleranza alla CO2, che migliora con il lavoro aerobico.',
    ],
  },
  {
    key: 'spirito',
    nome: 'Centro · Spirito',
    sottotitolo: 'Lettura, preghiera, studio',
    color: '#8b5cf6',
    metriche: [],
    scienza: [
      'Qui tracci lettura, preghiera e studio: ogni sessione ha una domanda che prepara alla scuola biblica.',
      'Lo scarto previsione/realta di queste sessioni spesso mostra che cio che rimandi ("non ne ho voglia") ti da piu di quanto prevedi.',
    ],
  },
]

export const SCIENZA_BMI =
  'BMI = peso diviso altezza al quadrato. E una stima grezza: non distingue muscolo da grasso. Leggilo come tendenza nel tempo, non come verdetto sul singolo giorno.'

export function bmiCategoria(bmi: number): { label: string; color: string } {
  // Etichette descrittive standard OMS, colori neutri (nessun "buono/cattivo").
  if (bmi < 18.5) return { label: 'sottopeso', color: '#38bdf8' }
  if (bmi < 25) return { label: 'normopeso', color: '#22c55e' }
  if (bmi < 30) return { label: 'sovrappeso', color: '#f59e0b' }
  return { label: 'obesita', color: '#ef4444' }
}
