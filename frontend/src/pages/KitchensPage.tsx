import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { MapContainer, TileLayer, CircleMarker, Tooltip } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import { Search, ChefHat, AlertOctagon, CheckCircle2, ArrowRight } from 'lucide-react'
import { clsx } from 'clsx'
import { DataTable, Column } from '../components/common/DataTable'
import { Drawer } from '../components/common/Drawer'
import { StatusBadge } from '../components/common/StatusBadge'
import { ErrorState } from '../components/common/ErrorState'
import { Skeleton } from '../components/common/Skeleton'
import { apiClient } from '../api/client'
import type { KitchenSummary } from '../types'

export default function KitchensPage() {
  const navigate = useNavigate()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [cityFilter, setCityFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AFFECTED' | 'CLEAN'>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: kitchens, isLoading, error, refetch } = useQuery({
    queryKey: ['kitchens'],
    queryFn: apiClient.kitchens.list,
  })

  const { data: detail, isLoading: detailLoading } = useQuery({
    queryKey: ['kitchen', selectedId],
    queryFn: () => apiClient.kitchens.detail(selectedId!),
    enabled: !!selectedId,
  })

  const cities = ['ALL', 'Delhi', 'Gurugram', 'Noida', 'Ghaziabad', 'Faridabad']

  // Filtered Kitchens list
  const filteredKitchens = useMemo(() => {
    if (!kitchens) return []
    return kitchens.filter(k => {
      const matchCity = cityFilter === 'ALL' || k.city.toLowerCase() === cityFilter.toLowerCase()
      const matchStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'AFFECTED' && k.affected_batch_count > 0) ||
        (statusFilter === 'CLEAN' && k.affected_batch_count === 0)
      const matchSearch =
        !searchQuery ||
        k.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
        k.id.toLowerCase().includes(searchQuery.toLowerCase())
      return matchCity && matchStatus && matchSearch
    })
  }, [kitchens, cityFilter, statusFilter, searchQuery])

  if (error) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <ErrorState message={(error as Error).message} onRetry={refetch} />
      </div>
    )
  }

  const columns: Column<KitchenSummary>[] = [
    {
      key: 'name',
      header: 'Kitchen Hub Name',
      render: k => (
        <div className="flex items-center space-x-3">
          <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0', k.affected_batch_count > 0 ? 'bg-red-subtle text-red border border-red/30' : 'bg-cyan-subtle text-cyan border border-cyan/30')}>
            {k.id}
          </div>
          <div>
            <span className="font-semibold text-text-primary block">{k.name}</span>
            <span className="text-xs text-text-muted">{k.city} NCR</span>
          </div>
        </div>
      ),
    },
    {
      key: 'city',
      header: 'Region',
      render: k => <span className="font-medium text-text-secondary">{k.city}</span>,
    },
    {
      key: 'affected_batch_count',
      header: 'Contaminated Batches',
      render: k =>
        k.affected_batch_count > 0 ? (
          <span className="inline-flex items-center gap-1 font-mono font-bold text-red px-2 py-0.5 rounded bg-red-subtle border border-red/30 text-xs">
            <AlertOctagon className="w-3 h-3" />
            {k.affected_batch_count} Alert
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-green text-xs font-medium">
            <CheckCircle2 className="w-3 h-3" /> Clean
          </span>
        ),
    },
    {
      key: 'status',
      header: 'Hub Status',
      render: k => <StatusBadge status={k.affected_batch_count > 0 ? 'CRITICAL' : 'NORMAL'} />,
    },
  ]

  const mapCenter = { lat: 28.58, lng: 77.25 }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2">
            <ChefHat className="w-6 h-6 text-cyan" />
            Kitchen Network Hubs
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Cloud kitchen node monitoring across Delhi NCR regions
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-text-muted bg-surface-elevated px-3 py-1.5 rounded-lg border border-border">
          <span>Active Hubs: <strong className="text-text-primary font-mono">{filteredKitchens.length}</strong> / 25</span>
        </div>
      </div>

      {/* Interactive Map Canvas */}
      <div className="h-72 sm:h-80 bg-surface border border-border rounded-xl overflow-hidden shadow-card shrink-0 relative">
        {isLoading ? (
          <Skeleton className="w-full h-full rounded-none" />
        ) : (
          <MapContainer center={[mapCenter.lat, mapCenter.lng]} zoom={10} style={{ width: '100%', height: '100%' }} zoomControl={false}>
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />
            {filteredKitchens.map(k => {
              const isAlert = k.affected_batch_count > 0
              return (
                <CircleMarker
                  key={k.id}
                  center={[k.lat, k.lng]}
                  radius={isAlert ? 10 : 7}
                  pathOptions={{
                    color: isAlert ? '#EF4444' : '#00E5FF',
                    fillColor: isAlert ? '#7F1D1D' : '#0891B2',
                    fillOpacity: 0.85,
                    weight: isAlert ? 3 : 2,
                  }}
                  eventHandlers={{ click: () => setSelectedId(k.id) }}
                >
                  <Tooltip direction="top" opacity={1} className="dark-tooltip">
                    <div className="bg-surface-elevated text-text-primary p-2.5 rounded-lg border border-border-bright shadow-2xl text-xs space-y-1">
                      <div className="font-bold flex items-center justify-between gap-2">
                        <span>{k.name}</span>
                        {isAlert && <span className="text-[10px] px-1 rounded bg-red text-bg font-bold">RECALL</span>}
                      </div>
                      <div className="text-text-secondary">{k.city} &middot; {k.affected_batch_count} affected batches</div>
                      <div className="text-[10px] text-cyan pt-0.5">Click to view inventory drawer &rarr;</div>
                    </div>
                  </Tooltip>
                </CircleMarker>
              )
            })}
          </MapContainer>
        )}
      </div>

      {/* Filter Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-surface p-3 rounded-xl border border-border">
        {/* City Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {cities.map(city => (
            <button
              key={city}
              onClick={() => setCityFilter(city)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                cityFilter === city
                  ? 'bg-cyan text-bg font-bold shadow-sm'
                  : 'bg-surface-elevated text-text-muted hover:text-text-primary border border-border'
              )}
            >
              {city}
            </button>
          ))}
        </div>

        {/* Search & Status Toggle */}
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Filter kitchen hub..."
              className="bg-bg border border-border rounded-lg pl-8 pr-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-cyan w-48"
            />
          </div>

          <div className="flex items-center bg-surface-subtle p-0.5 rounded-lg border border-border text-xs">
            <button
              onClick={() => setStatusFilter('ALL')}
              className={clsx('px-2.5 py-1 rounded text-xs font-medium', statusFilter === 'ALL' ? 'bg-surface-elevated text-text-primary font-bold' : 'text-text-muted')}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('AFFECTED')}
              className={clsx('px-2.5 py-1 rounded text-xs font-medium', statusFilter === 'AFFECTED' ? 'bg-red text-bg font-bold' : 'text-red')}
            >
              Alerts
            </button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="flex-1 min-h-0 bg-surface rounded-xl border border-border overflow-hidden shadow-card">
        <DataTable
          columns={columns}
          data={filteredKitchens}
          loading={isLoading}
          onRowClick={r => setSelectedId(r.id)}
        />
      </div>

      {/* Kitchen Detail Drawer */}
      <Drawer isOpen={!!selectedId} onClose={() => setSelectedId(null)} title="Kitchen Hub Inspection">
        {detailLoading ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-40 w-full" />
          </div>
        ) : detail ? (
          <div className="space-y-6 p-4">
            <div className="bg-surface-elevated p-4 rounded-xl border border-border space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-base font-bold text-text-primary">{detail.name}</h3>
                  <p className="text-xs text-text-muted">{detail.city} Regional Cloud Hub &middot; ID: {detail.id}</p>
                </div>
                <StatusBadge status={detail.affected_batch_count > 0 ? 'CRITICAL' : 'NORMAL'} />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="bg-surface p-2.5 rounded-lg border border-border">
                  <div className="text-[10px] text-text-muted uppercase font-semibold">Active Batches</div>
                  <div className="text-lg font-bold text-cyan font-mono mt-0.5">{detail.active_batch_count}</div>
                </div>
                <div className="bg-surface p-2.5 rounded-lg border border-border">
                  <div className="text-[10px] text-text-muted uppercase font-semibold">Contaminated</div>
                  <div className={clsx('text-lg font-bold font-mono mt-0.5', detail.affected_batch_count > 0 ? 'text-red' : 'text-green')}>
                    {detail.affected_batch_count}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3 flex items-center justify-between">
                <span>Current Inventory Batches</span>
                <span className="text-[10px] text-text-muted">{detail.inventory?.length || 0} batches tracked</span>
              </h4>

              <div className="space-y-2.5">
                {detail.inventory?.map(batch => (
                  <div
                    key={batch.code}
                    className={clsx(
                      'p-3 rounded-xl border transition-colors',
                      batch.status === 'CRITICAL'
                        ? 'bg-red-subtle border-red/40'
                        : 'bg-surface-elevated border-border hover:border-border-bright'
                    )}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <span
                        className="font-mono text-sm font-bold text-text-primary hover:text-cyan cursor-pointer transition-colors"
                        onClick={() => navigate(`/batches/${batch.code}`)}
                      >
                        {batch.code}
                      </span>
                      <StatusBadge status={batch.status} />
                    </div>
                    <div className="text-xs text-text-secondary font-medium">{batch.ingredient}</div>
                    <button
                      onClick={() => navigate(`/recalls/${batch.code}`)}
                      className="mt-2.5 flex items-center gap-1 text-xs font-semibold text-cyan hover:text-cyan-bright transition-colors"
                    >
                      <span>Trace blast radius</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  )
}
