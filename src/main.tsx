import { Component, StrictMode, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { ToastProvider } from './components/ui'

// Se qualcosa va storto in render, mostra un messaggio invece di una pagina bianca.
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }
  static getDerivedStateFromError(error: Error) {
    return { error }
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ maxWidth: 340, textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700 }}>Ascesa</div>
            <p style={{ color: '#97a0b2', marginTop: 8, fontSize: 14 }}>
              Qualcosa si è inceppato all'avvio. I tuoi dati sono al sicuro.
            </p>
            <button
              onClick={() => location.reload()}
              style={{ marginTop: 16, width: '100%', padding: '12px 16px', borderRadius: 16, background: '#a78bfa', color: '#fff', fontWeight: 600, border: 'none' }}
            >
              Ricarica
            </button>
            <pre style={{ marginTop: 12, textAlign: 'left', fontSize: 11, color: '#6b7484', whiteSpace: 'pre-wrap' }}>
              {String(this.state.error?.message || this.state.error)}
            </pre>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <HashRouter>
        <ToastProvider>
          <App />
        </ToastProvider>
      </HashRouter>
    </ErrorBoundary>
  </StrictMode>,
)
