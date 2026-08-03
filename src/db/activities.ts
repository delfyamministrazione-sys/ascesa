import { db } from './db'
import type { ActivityDef } from './types'

type Seed = Omit<ActivityDef, 'attiva' | 'builtin' | 'ordine' | 'config'> & Partial<ActivityDef>

const T = (silver: number, gold: number, diamond: number) => [
  { key: 'silver', label: 'Silver', xp: silver },
  { key: 'gold', label: 'Gold', xp: gold },
  { key: 'diamond', label: 'Diamond', xp: diamond },
]

// Catalogo attività a punti. Ogni attività alimenta il suo binario, così tutti i binari
// possono salire di livello (non solo Corpo). XP in base a tempo / sforzo / tier.
export const ACTIVITIES: Seed[] = [
  // --- SPIRITO ---
  { key: 'culto', nome: 'Culto / Chiesa', binario: 'spirito', tipo: 'fixed', baseXp: 45, config: { hint: 'Una funzione intera (~1h30).' } },
  { key: 'bibbia', nome: 'Lettura Bibbia', binario: 'spirito', tipo: 'timed', baseXp: 0, config: { perMinute: 1.5, cap: 60, hint: 'XP per minuto letto.' } },
  { key: 'preghiera', nome: 'Preghiera', binario: 'spirito', tipo: 'timed', baseXp: 0, config: { perMinute: 1.5, cap: 40 } },
  { key: 'studio_biblico', nome: 'Studio biblico', binario: 'spirito', tipo: 'timed', baseXp: 0, config: { perMinute: 1.2, cap: 45 } },

  // --- CORPO ---
  { key: 'allenamento', nome: 'Allenamento', binario: 'corpo', tipo: 'tiered', baseXp: 0, config: { tiers: T(15, 28, 45), hint: 'Silver leggero · Gold medio · Diamond intenso.' } },
  { key: 'fisio', nome: 'Esercizi fisioterapici', binario: 'corpo', tipo: 'fixed', baseXp: 35, config: { hint: '3 esercizi, 4x10. Falli davvero :)' } },
  { key: 'corsa', nome: 'Corsa', binario: 'corpo', tipo: 'timed', baseXp: 0, config: { perMinute: 1.2, cap: 70 } },
  { key: 'bici', nome: 'Bici', binario: 'corpo', tipo: 'timed', baseXp: 0, config: { perMinute: 0.8, cap: 70 } },
  { key: 'nuoto', nome: 'Nuoto', binario: 'corpo', tipo: 'timed', baseXp: 0, config: { perMinute: 1.2, cap: 70 } },
  { key: 'camminata', nome: 'Camminata', binario: 'corpo', tipo: 'timed', baseXp: 0, config: { perMinute: 0.5, cap: 45 } },

  // --- MENTE ---
  { key: 'inglese', nome: 'Studio inglese', binario: 'mente', tipo: 'timed', baseXp: 0, config: { perMinute: 1.2, cap: 60, hint: 'XP per minuto.' } },
  { key: 'lettura', nome: 'Lettura', binario: 'mente', tipo: 'timed', baseXp: 0, config: { perMinute: 1, cap: 60 } },
  { key: 'scrittura', nome: 'Scrivere testi', binario: 'mente', tipo: 'timed', baseXp: 0, config: { perMinute: 1, cap: 60 } },
  { key: 'studio', nome: 'Studio / lavoro profondo', binario: 'mente', tipo: 'timed', baseXp: 0, config: { perMinute: 1, cap: 60 } },
  { key: 'task_lavoro', nome: 'Task lavorativa', binario: 'mente', tipo: 'tiered', baseXp: 0, config: { tiers: T(15, 30, 55), hint: 'Complessità: Silver · Gold · Diamond.' } },
  { key: 'emozioni', nome: 'Scrivere le emozioni', binario: 'mente', tipo: 'fixed', baseXp: 15, config: { hint: 'Consapevolezza: metti nero su bianco come stai.' } },

  // --- VITA ---
  { key: 'sport_gruppo', nome: 'Sport con altri', binario: 'vita', tipo: 'fixed', baseXp: 25 },
  { key: 'giochi_tavolo', nome: 'Giochi da tavolo', binario: 'vita', tipo: 'tiered', baseXp: 0, config: { tiers: [{ key: 'giocato', label: 'Giocato', xp: 12 }, { key: 'vinto', label: 'Vinto!', xp: 22 }] } },
  { key: 'videogiochi', nome: 'Videogiochi', binario: 'vita', tipo: 'timed', baseXp: 0, config: { perMinute: 0.4, cap: 24, hint: 'Anche lo svago conta (con misura).' } },
  { key: 'tempo_altri', nome: 'Tempo con altri', binario: 'vita', tipo: 'fixed', baseXp: 12 },
  { key: 'riposo', nome: 'Riposo / ozio', binario: 'vita', tipo: 'fixed', baseXp: 8 },
  { key: 'natura', nome: 'Tempo in natura', binario: 'vita', tipo: 'timed', baseXp: 0, config: { perMinute: 0.6, cap: 40 } },

  // --- TAVOLA ---
  { key: 'dieta_ok', nome: 'Dieta rispettata oggi', binario: 'tavola', tipo: 'sfida', baseXp: 18, config: { periodo: 'daily', hint: 'Bonus per esserti tenuto sulla linea decisa.' } },
  { key: 'pasto_pianificato', nome: 'Pasto deciso in anticipo', binario: 'tavola', tipo: 'fixed', baseXp: 8 },
]

// Sfide opzionali (bonus, non obbligatorie). Reset giornaliero.
export const SFIDE: Seed[] = [
  { key: 'sf_bibbia20', nome: '20 minuti di Bibbia', binario: 'spirito', tipo: 'sfida', baseXp: 22, config: { periodo: 'daily' } },
  { key: 'sf_fisio', nome: 'Fai gli esercizi fisio', binario: 'corpo', tipo: 'sfida', baseXp: 25, config: { periodo: 'daily' } },
  { key: 'sf_inglese', nome: '30 minuti di inglese', binario: 'mente', tipo: 'sfida', baseXp: 25, config: { periodo: 'daily' } },
  { key: 'sf_noscroll', nome: 'Zero scroll fino a mezzogiorno', binario: 'mente', tipo: 'sfida', baseXp: 20, config: { periodo: 'daily' } },
  { key: 'sf_emozioni', nome: 'Scrivi le tue emozioni', binario: 'mente', tipo: 'sfida', baseXp: 15, config: { periodo: 'daily' } },
  { key: 'sf_resisti', nome: 'Resisti a un impulso', binario: 'mente', tipo: 'sfida', baseXp: 20, config: { periodo: 'daily' } },
  { key: 'sf_allenati', nome: 'Allenati oggi', binario: 'corpo', tipo: 'sfida', baseXp: 20, config: { periodo: 'daily' } },
  { key: 'sf_bibbia_settimana', nome: 'Bibbia 5 giorni su 7', binario: 'spirito', tipo: 'sfida', baseXp: 60, config: { periodo: 'weekly' } },
]

const ALL = [...ACTIVITIES, ...SFIDE]

// Idempotente: aggiorna i builtin, non tocca i log XP né l'ordine/attivo scelti dall'utente.
export async function syncActivityDefs(): Promise<void> {
  let ordine = 0
  for (const a of ALL) {
    const ex = await db.activityDefs.get(a.key)
    if (!ex) {
      await db.activityDefs.put({ ...a, attiva: true, builtin: true, ordine, config: a.config ?? {} } as ActivityDef)
    } else if (ex.builtin) {
      await db.activityDefs.update(a.key, {
        nome: a.nome,
        binario: a.binario,
        tipo: a.tipo,
        baseXp: a.baseXp,
        config: a.config ?? {},
      })
    }
    ordine += 1
  }
}
