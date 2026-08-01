# Ascesa

PWA personale di tracking, sfida e analisi. Local-first (dati solo sul dispositivo, IndexedDB via Dexie), offline-first, installabile sulla home.

## Sviluppo

```powershell
pnpm install
pnpm dev --host        # apri http://localhost:5173 (o l'URL Network sul telefono, stessa WiFi)
pnpm build             # type-check + bundle di produzione in dist/
pnpm preview           # anteprima del build
```

## Installare sul telefono (iPhone/Android)

Il service worker (offline) richiede HTTPS: su un IP di rete `http://` non si installa come vera PWA.
Percorso consigliato: **deploy statico su Vercel** (gratis, HTTPS in ~2 min). I dati restano comunque solo sul telefono.

```powershell
pnpm build
npx vercel            # login la prima volta, poi "vercel --prod" per pubblicare
```

Poi da Safari/Chrome sul telefono: apri l'URL https e "Aggiungi a schermata Home".

## Architettura

- `src/db/` — schema Dexie (sez.6 del brief) + seed metriche (sez.4) e fasi (sez.9).
- `src/lib/` — XP/livelli (regole 2.1-2.5), fasi/Trasferta, streak, export, opzioni.
- `src/components/` — motore di rendering metriche (`MetricInput`), UI, toast.
- `src/screens/` — Oggi, Registra, Impulso, Dashboard, Menu, CheckinFlow, Onboarding.

Aggiungere una metrica non richiede codice: Menu → Metriche → Aggiungi (scrive una riga in `metric_definitions`, l'UI la renderizza in automatico dal `tipo_input`).
