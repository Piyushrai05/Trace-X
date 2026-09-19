import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Truck, ArrowRight, ShieldAlert, CheckCircle2 } from 'lucide-react'
import { clsx } from 'clsx'
import { DataTable, Column } from '../components/common/DataTable'
import { Skeleton } from '../components/common/Skeleton'
import { ErrorState } from '../components/common/ErrorState'
import { StatusBadge } from '../components/common/StatusBadge'
import { safeFormatDate } from '../utils/date'
import { apiClient } from '../api/client'
import type { SupplierSummary } from '../types'

export default function SuppliersPage() {
  const navigate = useNavigate()
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const { data: suppliers, isLoading, error, refetch } = useQuery({
    queryKey: ['suppliers'],
    queryFn: apiClient.suppliers.list,
  })

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['supplier', expandedId],
    queryFn: () => apiClient.suppliers.detail(expandedId!),
    enabled: !!expandedId,
  })

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      </div>
    )
  }

  const columns: Column<SupplierSummary>[] = [
    {
      key: 'name',
      header: 'Supplier Organization',
      render: s => (
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-surface-elevated flex items-center justify-center font-mono font-bold text-xs text-cyan border border-border">
            {s.id}
          </div>
          <div>
            <span className="font-semibold text-text-primary block">{s.name}</span>
            <span className="text-xs text-text-muted">{s.city} Hub</span>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: s => (
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-surface-elevated text-text-secondary border border-border">
          {s.category}
        </span>
      ),
    },
    {
      key: 'city',
      header: 'Region',
      render: s => <span className="text-text-secondary text-xs">{s.city}</span>,
    },
    {
      key: 'total_batches',
      header: 'Total Supplied',
      render: s => <span className="font-mono font-medium text-text-primary">{s.total_batches} batches</span>,
    },
    {
      key: 'flagged_batches',
      header: 'Quality Alerts',
      render: s =>
        s.flagged_batches > 0 ? (
          <span className="inline-flex items-center gap-1 font-mono font-bold text-red text-xs px-2 py-0.5 rounded bg-red-subtle border border-red/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            {s.flagged_batches} Flagged
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-green text-xs font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Pass
          </span>
        ),
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2">
            <Truck className="w-6 h-6 text-cyan" />
            Supplier Intelligence
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Vendor quality compliance & ingredient provenance audit
          </p>
        </div>
        <div className="text-xs text-text-muted bg-surface-elevated px-3 py-1.5 rounded-lg border border-border">
          <span>Active Vendors: <strong className="text-text-primary font-mono">{suppliers?.length || 12}</strong></span>
        </div>
      </div>

      <div className="space-y-4">
        {/* Suppliers Data Table */}
        <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-card">
          <DataTable
            columns={columns}
            data={suppliers || []}
            loading={isLoading}
            onRowClick={r => setExpandedId(r.id === expandedId ? null : r.id)}
          />
        </div>

        {/* Supplier Expanded Batches Panel */}
        {expandedId && (
          <div className="bg-surface border border-border-bright rounded-xl p-6 shadow-2xl animate-in fade-in slide-in-from-top-3 duration-200">
            {detailLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-8 w-64" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : detail ? (
              <div>
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                      {detail.name}
                      <span className="text-xs font-normal text-text-muted">({detail.category})</span>
                    </h3>
                    <p className="text-xs text-text-muted">ID: {detail.id} &middot; City: {detail.city}</p>
                  </div>
                  <button
                    onClick={() => setExpandedId(null)}
                    className="text-xs text-text-muted hover:text-text-primary px-2.5 py-1 rounded bg-surface-elevated border border-border"
                  >
                    Close &times;
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {detail.recent_batches?.map(batch => {
                    const isCritical = batch.status === 'CRITICAL'
                    return (
                      <div
                        key={batch.code}
                        className={clsx(
                          'p-4 rounded-xl border transition-all shadow-card',
                          isCritical
                            ? 'bg-red-subtle border-red/50 shadow-red-glow'
                            : 'bg-surface-elevated border-border hover:border-border-bright'
                        )}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span
                            className="font-mono font-bold text-sm text-text-primary hover:text-cyan cursor-pointer transition-colors"
                            onClick={() => navigate(`/batches/${batch.code}`)}
                          >
                            {batch.code}
                          </span>
                          <StatusBadge status={batch.status} />
                        </div>
                        <div className="text-xs font-semibold text-text-secondary mb-2">{batch.ingredient}</div>
                        <div className="text-xs text-text-muted space-y-1 bg-surface-subtle p-2 rounded-lg border border-border/50">
                          <div>Quantity: <strong className="text-text-primary font-mono">{batch.qty_kg} kg</strong></div>
                          <div>Received: <strong className="text-text-primary">{safeFormatDate(batch.received_at)}</strong></div>
                        </div>
                        <button
                          onClick={() => navigate(`/recalls/${batch.code}`)}
                          className="mt-3 text-xs font-semibold text-cyan hover:text-cyan-bright inline-flex items-center gap-1"
                        >
                          <span>Trace blast radius</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  )
}
