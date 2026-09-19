import { LayoutDashboard, Package, ShoppingCart, AlertTriangle, ArrowRight, ShieldAlert, CheckCircle2, Clock } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { clsx } from 'clsx'
import { MetricCard } from '../components/common/MetricCard'
import { StatusBadge } from '../components/common/StatusBadge'
import { ErrorState } from '../components/common/ErrorState'
import { Skeleton } from '../components/common/Skeleton'
import { SupplyNetworkMap } from '../components/map/SupplyNetworkMap'
import { apiClient } from '../api/client'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['overview'],
    queryFn: apiClient.overview,
  })

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      </div>
    )
  }

  const activeRecalls = data?.active_recalls?.filter(r => ['CRITICAL', 'WARNING', 'MONITORING'].includes(r.status)) || []

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Overview Top Bar Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Overview</h1>
          <p className="text-xs text-text-muted mt-0.5">Supply chain intelligence across your connected kitchen network</p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-text-muted bg-surface-elevated px-3 py-1.5 rounded-lg border border-border">
          <Clock className="w-3.5 h-3.5 text-cyan" />
          <span>Updated: <strong className="text-text-primary font-mono">{format(new Date(), 'HH:mm:ss')}</strong></span>
        </div>
      </div>

      {/* 4 Hero Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Kitchens"
          value={data?.kitchen_count || 128}
          trend="+4.2%"
          trendType="positive"
          subtitle="25 regional hubs in Delhi NCR"
          icon={LayoutDashboard}
          color="cyan"
          loading={isLoading}
        />
        <MetricCard
          title="Active Batches"
          value={(data?.active_batch_count || 4821).toLocaleString()}
          trend="+32 today"
          trendType="positive"
          subtitle="Dairy, poultry, produce, grains"
          icon={Package}
          color="cyan"
          loading={isLoading}
        />
        <MetricCard
          title="Orders"
          value="1.02M"
          trend="Live"
          trendType="positive"
          subtitle="100% batch traceability"
          icon={ShoppingCart}
          color="cyan"
          loading={isLoading}
        />
        <MetricCard
          title="Active Recalls"
          value={data?.active_recall_count || 3}
          trend="Critical"
          trendType="alert"
          subtitle="1 Critical · 1 Monitoring · 1 Resolved"
          icon={AlertTriangle}
          color={data?.active_recall_count ? 'red' : 'green'}
          loading={isLoading}
        />
      </div>

      {/* Main Grid: Supply Network Map (2 cols) + Active Recalls (1 col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Supply Network Map */}
        <div className="lg:col-span-2 flex flex-col h-[520px]">
          <SupplyNetworkMap
            clusters={data?.city_clusters}
            loading={isLoading}
            className="w-full h-full"
          />
        </div>

        {/* Right 1 Col: Active Recalls Panel */}
        <div className="bg-surface border border-border rounded-xl flex flex-col h-[520px] shadow-card overflow-hidden">
          <div className="p-4 border-b border-border bg-surface-elevated flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-red" />
              <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Active Recalls</h2>
            </div>
            <span className="text-xs px-2 py-0.5 rounded-full bg-red/10 border border-red/30 text-red font-semibold">
              {activeRecalls.length} Incidents
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoading ? (
              [...Array(3)].map((_, i) => <Skeleton key={i} className="h-28 w-full rounded-lg" />)
            ) : activeRecalls.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-green" />
                <p className="text-sm font-semibold text-text-primary">All Batches Clean</p>
                <p className="text-xs text-text-muted">No active contamination alerts in the network.</p>
              </div>
            ) : (
              activeRecalls.map(recall => {
                const isCritical = recall.status === 'CRITICAL'

                return (
                  <div
                    key={recall.code}
                    className={clsx(
                      'relative rounded-xl p-4 transition-all duration-200 border group',
                      isCritical
                        ? 'bg-gradient-to-b from-red-subtle to-surface border-red/50 shadow-red-glow hover:border-red'
                        : 'bg-surface-elevated border-border hover:border-border-bright'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-mono text-base font-bold text-text-primary group-hover:text-cyan transition-colors">
                          {recall.code}
                        </span>
                        <div className="text-xs text-text-secondary mt-0.5">
                          {recall.ingredient} &middot; {recall.supplier_name}
                        </div>
                      </div>
                      <StatusBadge status={recall.status} />
                    </div>

                    <div className="flex items-center justify-between text-xs text-text-muted my-3 py-2 px-3 rounded-lg bg-surface-subtle border border-border/50">
                      <span>{recall.kitchen_count} kitchens</span>
                      <span>&bull;</span>
                      <span>{recall.order_count?.toLocaleString()} orders</span>
                      <span>&bull;</span>
                      <span>{recall.qty_kg} kg</span>
                    </div>

                    {/* Prominent Action Button (Cyan button matching mockup) */}
                    <button
                      onClick={() => navigate(`/recalls/${recall.code}`)}
                      className={clsx(
                        'w-full flex items-center justify-center space-x-2 py-2.5 px-4 rounded-lg text-xs font-bold transition-all',
                        isCritical
                          ? 'bg-cyan text-bg hover:bg-cyan-bright shadow-cyan-glow font-bold'
                          : 'bg-surface border border-border hover:bg-surface-hover text-text-primary'
                      )}
                    >
                      <span>Trace Impact</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Recent Activity Log Feed */}
      <div className="bg-surface border border-border rounded-xl shadow-card overflow-hidden">
        <div className="p-4 border-b border-border bg-surface-elevated flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-cyan" />
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Recent Activity</h2>
          </div>
          <span className="text-xs text-text-muted">Live audit timeline</span>
        </div>

        <div className="p-4">
          {isLoading ? (
            <Skeleton className="h-28 w-full" />
          ) : (
            <div className="divide-y divide-border/50">
              {data?.recent_activity.map(activity => (
                <div key={activity.id} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between text-xs gap-4">
                  <div className="flex items-center space-x-3 min-w-0">
                    <span className="font-mono text-text-muted shrink-0">
                      {format(new Date(activity.ts), 'HH:mm')}
                    </span>
                    <span
                      className={clsx(
                        'w-2 h-2 rounded-full shrink-0',
                        activity.severity === 'CRITICAL' || activity.severity === 'high'
                          ? 'bg-red animate-pulse'
                          : activity.severity === 'WARNING' || activity.severity === 'medium'
                          ? 'bg-amber'
                          : 'bg-cyan'
                      )}
                    />
                    <span className="text-text-primary truncate font-medium">{activity.message}</span>
                  </div>
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-surface-elevated text-text-muted shrink-0 border border-border">
                    {activity.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
