import { getSetting, setSetting } from '../db/db'

// Versione visibile in Menu, per capire al volo se sei aggiornato.
export const APP_VERSION = 'v6 · 3 ago 2026'

// Forza l'aggiornamento: rimuove il service worker e le cache (NON i dati/punti) e ricarica.
export async function forceUpdate(): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister().catch(() => {})))
    }
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
  } catch {
    // ignora
  } finally {
    location.reload()
  }
}

// Chiede al browser di non cancellare i dati (riduce il rischio di perdita su iOS/Safari).
export async function requestPersistence(): Promise<boolean> {
  try {
    if (navigator.storage?.persisted) {
      if (await navigator.storage.persisted()) return true
    }
    if (navigator.storage?.persist) return await navigator.storage.persist()
  } catch {
    // ignora
  }
  return false
}

export async function markBackup(): Promise<void> {
  await setSetting('last_backup_ts', Date.now())
}

export async function getLastBackup(): Promise<number | null> {
  return getSetting<number | null>('last_backup_ts', null)
}

export function daysSince(ts: number | null): number | null {
  if (!ts) return null
  return Math.floor((Date.now() - ts) / 86_400_000)
}
