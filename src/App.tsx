import { useEffect, useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { ensureSeed } from './db/seed'
import { db, setSetting } from './db/db'
import { BottomNav } from './components/BottomNav'
import { Onboarding } from './screens/Onboarding'
import { Oggi } from './screens/Oggi'
import { Registra } from './screens/Registra'
import { Impulso } from './screens/Impulso'
import { Corpo } from './screens/Corpo'
import { Menu } from './screens/Menu'

function Splash() {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <div className="text-2xl font-bold">Ascesa</div>
        <div className="mt-2 text-sm text-ink-dim">Preparazione…</div>
      </div>
    </div>
  )
}

export default function App() {
  const [seeded, setSeeded] = useState(false)
  useEffect(() => {
    ensureSeed().then(() => setSeeded(true))
  }, [])

  const onboardingRow = useLiveQuery(() => db.settings.get('onboarding_done'), [])

  if (!seeded) return <Splash />
  if (onboardingRow?.value !== true) {
    return <Onboarding onDone={() => setSetting('onboarding_done', true)} />
  }

  return (
    <div className="flex min-h-full flex-col">
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Oggi />} />
          <Route path="/registra" element={<Registra />} />
          <Route path="/impulso" element={<Impulso />} />
          <Route path="/corpo" element={<Corpo />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="*" element={<Oggi />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
