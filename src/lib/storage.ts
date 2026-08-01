import { getSetting, setSetting } from '../db/db'

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
