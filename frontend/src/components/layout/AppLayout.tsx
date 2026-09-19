import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, AlertTriangle, GitBranch, ChefHat, Package, Truck, Sliders, Search, Menu, Database, LogOut, Sparkles } from 'lucide-react'
import { clsx } from 'clsx'
import { apiClient } from '../../api/client'
import { DemoControlsDrawer } from '../demo/DemoControlsDrawer'
import { AskGraphModal } from '../ask/AskGraphModal'

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', to: '/' },
  { icon: AlertTriangle, label: 'Recall Center', to: '/recalls' },
  { icon: GitBranch, label: 'Investigate', to: '/investigate' },
  { icon: ChefHat, label: 'Kitchen Network', to: '/kitchens' },
  { icon: Truck, label: 'Suppliers', to: '/suppliers' },
  { icon: Package, label: 'UI Components', to: '/dev/components' },
]

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isAskOpen, setIsAskOpen] = useState(false)
  const [healthInfo, setHealthInfo] = useState<{ status: string; neo4j?: string; mode?: string; latency_ms?: number } | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()


  useEffect(() => {
    if (!localStorage.getItem('tracex_auth')) {
      navigate('/login')
    }
  }, [navigate])

  useEffect(() => {
    apiClient.health()
      .then(res => setHealthInfo(res as any))
      .catch(() => setHealthInfo({ status: 'error', neo4j: 'disconnected' }))
  }, [])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery.trim()) return
    const q = searchQuery.trim().toUpperCase()
    if (q.startsWith('PNR') || q.startsWith('VEG') || q.startsWith('MILK') || q.startsWith('BATCH')) {
      navigate(`/recalls/${q}`)
    } else {
      navigate(`/investigate`)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-bg text-text-primary">
      {/* Sidebar Navigation */}
      <aside
        className={clsx(
          'hidden md:flex flex-col border-r border-border bg-surface shadow-card transition-all duration-300 z-30',
          collapsed ? 'w-18' : 'w-64'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border bg-surface-elevated">
          <div className="flex items-center space-x-3 overflow-hidden cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan to-cyan-dim flex items-center justify-center text-bg font-black tracking-wider text-sm shadow-cyan-glow shrink-0">
              TX
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-extrabold text-base tracking-tight text-text-primary flex items-center gap-1.5">
                  TraceX
                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-cyan/10 text-cyan border border-cyan/30">
                    2.0
                  </span>
                </span>
                <span className="text-[10px] text-text-muted">Cloud-Kitchen Recall Engine</span>
              </div>
            )}
          </div>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center px-3 py-2.5 rounded-lg text-xs font-semibold transition-all duration-150 group relative',
                  isActive
                    ? 'bg-cyan-subtle text-cyan border border-cyan/30 shadow-sm'
                    : 'text-text-secondary hover:bg-surface-elevated hover:text-text-primary',
                  collapsed && 'justify-center px-2'
                )
              }
            >
              <item.icon className={clsx('w-4 h-4 shrink-0 transition-transform group-hover:scale-110')} />
              {!collapsed && <span className="ml-3 truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Hero Quick Action: PNR-2047 Blast Radius */}
        {!collapsed && (
          <div className="p-3 mx-2 mb-3 rounded-xl bg-gradient-to-b from-red-subtle to-surface-elevated border border-red/30 space-y-2">
            <div className="flex items-center space-x-1.5 text-red text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 text-red animate-pulse" />
              <span>Active Incident Demo</span>
            </div>
            <p className="text-[11px] text-text-muted leading-relaxed">
              Batch <strong className="text-text-primary">PNR-2047</strong> contaminated Paneer (12 kitchens).
            </p>
            <button
              onClick={() => navigate('/recalls/PNR-2047')}
              className="w-full bg-red text-bg text-[11px] font-bold py-1.5 rounded-lg hover:bg-red-bright transition-colors shadow-red-glow"
            >
              Trace PNR-2047 &rarr;
            </button>
          </div>
        )}

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-border bg-surface-elevated flex items-center justify-between">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center space-x-2 text-xs text-text-muted hover:text-text-primary transition-colors w-full"
          >
            <Sliders className="w-4 h-4 shrink-0" />
            {!collapsed && <span>{collapsed ? 'Expand' : 'Collapse view'}</span>}
          </button>
        </div>
      </aside>

      {/* Main App Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 bg-surface-elevated border-b border-border z-20">
          <div className="flex items-center md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-text-secondary hover:text-text-primary p-2">
              <Menu className="w-6 h-6" />
            </button>
            <div className="w-8 h-8 rounded bg-cyan flex items-center justify-center text-bg font-bold ml-2">TX</div>
          </div>

          {/* Global Search Bar */}
          <div className="flex-1 max-w-xl px-4 md:px-0">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search batch code (e.g. PNR-2047), ingredient, or kitchen..."
                className="w-full bg-bg border border-border rounded-lg pl-10 pr-16 py-2 text-xs text-text-primary focus:outline-none focus:border-cyan transition-colors"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-text-muted bg-surface px-1.5 py-0.5 rounded border border-border">
                ↵ Enter
              </span>
            </form>
          </div>

          {/* Header Right Action Group */}
          <div className="flex items-center space-x-3 ml-4">
            {/* Ask the Graph (Ctrl+K) Button */}
            <button
              onClick={() => setIsAskOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border border-cyan-500/40 text-cyan-300 text-xs font-semibold hover:border-cyan-400 transition shadow-sm"
              title="Ask the Graph with Natural Language (Ctrl+K)"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ask Graph</span>
              <kbd className="hidden lg:inline-block px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded text-[10px] font-mono border border-slate-700">
                Ctrl+K
              </kbd>
            </button>

            {/* Live Database Engine Status Pill */}
            <div
              className={clsx(
                'hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                healthInfo?.mode === 'auradb'
                  ? 'bg-green/10 text-green border-green/30'
                  : 'bg-cyan/10 text-cyan border-cyan/30'
              )}
            >
              <Database className="w-3.5 h-3.5" />
              <span>
                {healthInfo?.mode === 'auradb' ? 'Neo4j AuraDB Live' : 'Graph Engine Ready'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-current animate-ping" />
            </div>

            {/* User Profile & Logout */}
            <div className="flex items-center space-x-2 pl-2 border-l border-border">
              <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center text-xs font-bold text-cyan">
                TX
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem('tracex_auth')
                  navigate('/login')
                }}
                title="Log out"
                className="p-1.5 text-text-muted hover:text-red transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Content Body */}
        <main className="flex-1 overflow-auto bg-bg">
          <Outlet />
        </main>
      </div>

      {/* Global Live Demo Controls Drawer (Shift+D) */}
      <DemoControlsDrawer 
        onIncidentTriggered={(bCode) => navigate(`/recalls/${bCode}`)}
      />

      {/* Global Ask the Graph Command Modal (Ctrl+K) */}
      <AskGraphModal
        isOpen={isAskOpen}
        onClose={() => setIsAskOpen(false)}
      />
    </div>
  )
}

