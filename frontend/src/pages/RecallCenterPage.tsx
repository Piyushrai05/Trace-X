import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Plus, Search, ShieldAlert } from 'lucide-react'
import { DataTable, Column } from '../components/common/DataTable'
import { StatusBadge } from '../components/common/StatusBadge'
import { Skeleton } from '../components/common/Skeleton'
import { Button } from '../components/common/Button'
import { Modal } from '../components/common/Modal'
import { useToast } from '../components/common/Toast'
import { safeFormatDate } from '../utils/date'
import { apiClient } from '../api/client'
import type { RecallListItem } from '../types'

export default function RecallCenterPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [filter, setFilter] = useState('ALL')
  const [search, setSearch] = useState('')
  const [initiateModalOpen, setInitiateModalOpen] = useState(false)
  const [selectedCode, setSelectedCode] = useState<string | null>(null)

  const { data: recalls, isLoading, refetch } = useQuery({
    queryKey: ['recalls'],
    queryFn: apiClient.recalls.list,
  })

  const { data: impactData, isLoading: impactLoading } = useQuery({
    queryKey: ['impact', selectedCode],
    queryFn: () => apiClient.recalls.impact(selectedCode!),
    enabled: !!selectedCode,
  })

  const filteredRecalls =
    recalls?.filter(r => {
      if (filter !== 'ALL' && r.status !== filter) return false
      if (
        search &&
        !r.code.toLowerCase().includes(search.toLowerCase()) &&
        !r.ingredient.toLowerCase().includes(search.toLowerCase())
      )
        return false
      return true
    }) || []

  const handleInitiate = async () => {
    if (!selectedCode) return
    try {
      await apiClient.recalls.initiate(selectedCode)
      showToast(`Recall initiated for ${selectedCode}`, 'success')
      setInitiateModalOpen(false)
      refetch()
    } catch (err: any) {
      showToast(err.message || 'Failed to initiate recall', 'error')
    }
  }

  const columns: Column<RecallListItem>[] = [
    {
      key: 'code',
      header: 'Batch Code',
      render: r => (
        <span
          className="font-mono font-bold text-sm text-cyan cursor-pointer hover:underline"
          onClick={() => navigate(`/recalls/${r.code}`)}
        >
          {r.code}
        </span>
      ),
    },
    { key: 'ingredient', header: 'Ingredient', render: r => <span className="font-semibold text-text-primary">{r.ingredient}</span> },
    { key: 'status', header: 'Risk Status', render: r => <StatusBadge status={r.status} /> },
    { key: 'supplier_name', header: 'Supplier Org', render: r => <span className="text-text-secondary text-xs">{r.supplier_name}</span> },
    { key: 'qty_kg', header: 'Batch Qty', render: r => <span className="font-mono">{r.qty_kg} kg</span> },
    { key: 'received_at', header: 'Received Date', render: r => safeFormatDate(r.received_at) },
    { key: 'kitchen_count', header: 'Affected Hubs', render: r => <span className="font-mono font-semibold">{r.kitchen_count} kitchens</span> },
    {
      key: 'actions',
      header: '',
      render: r => (
        <div className="flex space-x-2 justify-end">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/recalls/${r.code}`)}>
            Trace Blast Radius &rarr;
          </Button>
          {r.status !== 'CRITICAL' && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setSelectedCode(r.code)
                setInitiateModalOpen(true)
              }}
            >
              Quarantine
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red" />
            Recall Operations Center
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Active contamination recalls, containment protocols, and quarantine management
          </p>
        </div>
        <Button onClick={() => navigate('/investigate')}>
          <Plus className="w-4 h-4 mr-2" /> Reverse Investigation
        </Button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex space-x-1.5 bg-surface p-1 rounded-lg border border-border">
          {['ALL', 'CRITICAL', 'MONITORING', 'RESOLVED'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                filter === f
                  ? 'bg-cyan text-bg font-bold shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            placeholder="Search batch code (e.g. PNR-2047) or ingredient..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg pl-10 pr-4 py-2 text-xs focus:outline-none focus:border-cyan text-text-primary"
          />
        </div>
      </div>

      {/* Recalls Data Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-card">
        <DataTable columns={columns} data={filteredRecalls} loading={isLoading} />
      </div>

      {/* Quarantine Confirmation Modal */}
      <Modal
        isOpen={initiateModalOpen}
        onClose={() => setInitiateModalOpen(false)}
        title={`Initiate Containment Protocol: ${selectedCode}`}
      >
        {impactLoading ? (
          <div className="space-y-4 p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        ) : impactData ? (
          <div className="space-y-6">
            <div className="bg-red-subtle border border-red/40 rounded-xl p-4 flex items-start space-x-3 text-red">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-sm">This action will quarantine batch {selectedCode} as CRITICAL.</p>
                <p className="text-text-secondary leading-relaxed">
                  Blast Radius: <strong>{impactData.kitchen_count}</strong> kitchens, <strong>{impactData.prep_lot_count}</strong> prep lots, <strong>{impactData.dish_count}</strong> dishes, <strong>{impactData.order_count}</strong> orders, <strong>{impactData.customer_count}</strong> customers.
                </p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button variant="ghost" onClick={() => setInitiateModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleInitiate}>
                Confirm & Quarantine Batch
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </div>
  )
}
