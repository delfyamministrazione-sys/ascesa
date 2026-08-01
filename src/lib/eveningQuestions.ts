import { startOfDayMs } from './dates'

// Sez. 5.1 — pool >= 30 domande serali, rotazione senza ripetizione per almeno un mese.
// Autoanalisi, mai valutative, mai giudizi.
export const DOMANDE_SERALI: string[] = [
  'Qual e stato il momento della giornata in cui ti sei sentito piu te stesso?',
  'Cosa ha occupato piu spazio nella tua testa oggi?',
  'Quando hai sentito piu energia? Cosa stavi facendo?',
  'C e stato un momento in cui il tempo e volato? Quale?',
  'Cosa avresti voluto avere piu tempo per fare?',
  'Quale impulso e arrivato oggi e cosa lo ha preceduto?',
  'Con chi hai parlato che ti ha lasciato qualcosa?',
  'Cosa hai notato del tuo corpo oggi?',
  'Qual e la cosa piu piccola che ti ha dato piacere?',
  'Cosa hai imparato oggi, anche minimo?',
  'Se rifacessi un ora di oggi, quale sceglieresti?',
  'Cosa ti ha stancato piu del previsto?',
  'Cosa ti ha dato energia piu del previsto?',
  'Che pensiero ti e tornato piu volte?',
  'Dove eri quando ti sei sentito piu calmo?',
  'Cosa hai rimandato oggi? Cosa lo rendeva difficile iniziare?',
  'Quale previsione su oggi si e rivelata sbagliata?',
  'Cosa ha guidato le tue scelte di oggi: fame, noia, curiosita, dovere?',
  'Quale conversazione avresti voluto avere?',
  'Cosa hai fatto oggi solo per te?',
  'In quale momento ti sei sentito piu presente?',
  'Cosa hai osservato negli altri oggi?',
  'Che sapore ha avuto la giornata, in una parola?',
  'Cosa ti ha sorpreso di te oggi?',
  'Quale gesto di oggi rifaresti domani?',
  'Cosa hai evitato di guardare oggi dentro di te?',
  'Quando hai riso oggi?',
  'Cosa ti ha dato senso oggi?',
  'Cosa il tuo corpo ti stava chiedendo e non hai ascoltato?',
  'Cosa porti con te di oggi verso domani?',
  'Quale momento vorresti ricordare tra un mese?',
  'Cosa ti ha tolto attenzione senza accorgertene?',
]

export function domandaSeralePerGiorno(d: Date | number = new Date()): string {
  const dayIndex = Math.floor(startOfDayMs(d) / 86_400_000)
  return DOMANDE_SERALI[dayIndex % DOMANDE_SERALI.length]
}
