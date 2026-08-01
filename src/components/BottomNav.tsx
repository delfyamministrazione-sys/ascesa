import { NavLink } from 'react-router-dom'

interface Item {
  to: string
  label: string
  icon: string
  center?: boolean
}

const ITEMS: Item[] = [
  { to: '/', label: 'Oggi', icon: '◎' },
  { to: '/registra', label: 'Registra', icon: '＋' },
  { to: '/impulso', label: 'Impulso', icon: '⚡', center: true },
  { to: '/corpo', label: 'Corpo', icon: '◈' },
  { to: '/menu', label: 'Menu', icon: '☰' },
]

export function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-30 border-t border-line bg-bg/90 pb-safe backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2">
        {ITEMS.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[11px] ${
                isActive ? 'text-accent' : 'text-ink-dim'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`flex items-center justify-center rounded-full transition ${
                    it.center
                      ? 'h-11 w-11 text-xl'
                      : 'h-7 w-7 text-lg'
                  }`}
                  style={
                    it.center
                      ? { background: isActive ? '#a78bfa' : '#1b2333', color: isActive ? '#fff' : '#e8ebf1' }
                      : undefined
                  }
                >
                  {it.icon}
                </span>
                <span className="font-medium">{it.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
