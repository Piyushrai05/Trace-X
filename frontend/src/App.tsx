import React, { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { ToastProvider } from './components/common/Toast'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import RecallCenterPage from './pages/RecallCenterPage'
import ForwardTracePage from './pages/ForwardTracePage'
import ReverseInvestigatePage from './pages/ReverseInvestigatePage'
import KitchensPage from './pages/KitchensPage'
import BatchDetailPage from './pages/BatchDetailPage'
import SuppliersPage from './pages/SuppliersPage'
import ComponentGalleryPage from './pages/ComponentGalleryPage'
import { apiClient } from './api/client'

// ── Global Error Boundary ──────────────────────────────────────────────────
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[TraceX ErrorBoundary]', error, info.componentStack)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen items-center justify-center bg-bg p-8">
          <div className="max-w-lg text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-red/10 border border-red/30 flex items-center justify-center mx-auto">
              <span className="text-red text-2xl font-bold">!</span>
            </div>
            <h1 className="text-2xl font-bold text-text">Something went wrong</h1>
            <p className="text-muted text-sm">An unexpected error occurred in the application.</p>
            <pre className="bg-surface border border-border p-4 rounded-lg text-left text-xs text-red/80 overflow-auto max-h-40">
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: undefined })
                window.location.reload()
              }}
              className="px-4 py-2 bg-cyan/10 border border-cyan/30 text-cyan rounded-lg text-sm hover:bg-cyan/20 transition-colors"
            >
              Reload application
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Service Unavailable Screen ─────────────────────────────────────────────
function ServiceUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex h-screen items-center justify-center bg-bg p-8">
      <div className="max-w-md text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-amber/10 border border-amber/30 flex items-center justify-center mx-auto">
          <svg className="w-10 h-10 text-amber" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text mb-2">Service Unavailable</h1>
          <p className="text-muted text-sm leading-relaxed">
            TraceX cannot connect to its backend API. The backend server or the Neo4j AuraDB instance
            may be paused or unreachable.
          </p>
        </div>
        <div className="bg-surface border border-amber/20 rounded-lg p-4 text-left space-y-2">
          <p className="text-amber text-xs font-semibold uppercase tracking-wide">Troubleshooting</p>
          <ul className="text-muted text-sm space-y-1 list-disc list-inside">
            <li>Check if the backend is running on port 8000</li>
            <li>Resume your <span className="text-cyan">Neo4j AuraDB</span> instance at console.neo4j.io</li>
            <li>Run <code className="text-cyan text-xs">python scripts/ping_aura.py</code> to test connectivity</li>
            <li>Wait 60–90 seconds after resuming Aura before retrying</li>
          </ul>
        </div>
        <button
          onClick={onRetry}
          className="w-full py-2.5 bg-cyan text-bg font-semibold rounded-lg text-sm hover:bg-cyan/90 transition-colors"
        >
          Retry connection
        </button>
      </div>
    </div>
  )
}

// ── Auth Guard ─────────────────────────────────────────────────────────────
function RequireAuth({ children }: { children: React.ReactNode }) {
  const isAuthed = localStorage.getItem('tracex_auth') === 'true'
  if (!isAuthed) return <Navigate to="/login" replace />
  return <>{children}</>
}

// ── App Routes ─────────────────────────────────────────────────────────────
function AppContent() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="recalls" element={<RecallCenterPage />} />
        <Route path="recalls/:code" element={<ForwardTracePage />} />
        <Route path="investigate" element={<ReverseInvestigatePage />} />
        <Route path="kitchens" element={<KitchensPage />} />
        <Route path="batches/:code" element={<BatchDetailPage />} />
        <Route path="suppliers" element={<SuppliersPage />} />
        <Route path="dev/components" element={<ComponentGalleryPage />} />
      </Route>
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

// ── Root App with Health Gate ───────────────────────────────────────────────
export default function App() {
  const [serviceStatus, setServiceStatus] = useState<'checking' | 'ok' | 'degraded' | 'unavailable'>('checking')

  const checkHealth = async () => {
    setServiceStatus('checking')
    try {
      const result = await apiClient.health()
      if ((result as { status: string }).status === 'degraded') {
        setServiceStatus('degraded')
      } else {
        setServiceStatus('ok')
      }
    } catch {
      setServiceStatus('unavailable')
    }
  }

  useEffect(() => {
    checkHealth()
  }, [])

  if (serviceStatus === 'checking') {
    return (
      <div className="flex h-screen items-center justify-center bg-bg">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
          <p className="text-muted text-sm">Connecting to TraceX services...</p>
        </div>
      </div>
    )
  }

  if (serviceStatus === 'unavailable') {
    return <ServiceUnavailable onRetry={checkHealth} />
  }

  return (
    <ErrorBoundary>
      <ToastProvider>
        {serviceStatus === 'degraded' && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-amber/10 border-b border-amber/30 px-4 py-2 flex items-center justify-center gap-3 text-xs text-amber">
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
            <span>
              <strong>No database connected.</strong> Fill in{' '}
              <code className="bg-amber/10 px-1 rounded">backend/.env</code> with your Neo4j Aura credentials,
              run <code className="bg-amber/10 px-1 rounded">python scripts/seed.py</code>, then restart.
            </span>
          </div>
        )}
        <div className={serviceStatus === 'degraded' ? 'pt-9' : ''}>
          <AppContent />
        </div>
      </ToastProvider>
    </ErrorBoundary>
  )
}

