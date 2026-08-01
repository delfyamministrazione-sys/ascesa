import { ResponsiveContainer } from 'recharts'
import type { ReactElement, ReactNode } from 'react'

export const AXIS = '#6b7484'

export const tooltipStyle = {
  background: '#1b2333',
  border: '1px solid #263043',
  borderRadius: 12,
  fontSize: 12,
  color: '#e8ebf1',
}

export function ChartBox({ children, h = 176 }: { children: ReactNode; h?: number }) {
  return (
    <div style={{ height: h }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        {children as ReactElement}
      </ResponsiveContainer>
    </div>
  )
}

export function Empty({ msg }: { msg: string }) {
  return <div className="py-8 text-center text-sm text-ink-dim">{msg}</div>
}
