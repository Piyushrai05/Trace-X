import React, { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Search, GitBranch, ArrowRight, AlertTriangle, Sparkles, ShieldAlert } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { clsx } from 'clsx'
import { Button } from '../components/common/Button'
import { Skeleton } from '../components/common/Skeleton'
import { TraceGraph } from '../components/graph/TraceGraph'
import { useToast } from '../components/common/Toast'
import { apiClient } from '../api/client'
import type { ReverseInvestigationResponse } from '../types'

export default function ReverseInvestigatePage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(['COMP-001', 'COMP-002', 'COMP-003'])) // Pre-select hero complaints
  const [symptomFilter, setSymptomFilter] = useState<'ALL' | 'PANEER' | 'CRITICAL'>('ALL')
  
  const [result, setResult] = useState<ReverseInvestigationResponse | null>(null)
  const [investigating, setInvestigating] = useState(false)

  // 1. Pre-load complaints on mount
  const { data: allComplaints, isLoading: loadingComplaints } = useQuery({
    queryKey: ['complaints', 'all'],
    queryFn: () => apiClient.complaints.search(''),
  })

  // Filter complaints
  const filteredComplaints = useMemo(() => {
    if (!allComplaints) return []
    return allComplaints.filter(c => {
      const matchSearch =
        !searchQuery ||
        c.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.order_id.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchSymptom =
        symptomFilter === 'ALL' ||
        (symptomFilter === 'PANEER' && c.text.toLowerCase().includes('paneer')) ||
        (symptomFilter === 'CRITICAL' && (c.severity === 'CRITICAL' || c.severity === 'high'))

      return matchSearch && matchSymptom
    })
  }, [allComplaints, searchQuery, symptomFilter])

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelectedIds(next)
  }

  const handleSelectHero = () => {
    setSelectedIds(new Set(['COMP-001', 'COMP-002', 'COMP-003']))
    setSymptomFilter('PANEER')
    showToast('Selected 3 hero contamination complaints (PNR-2047 scenario)')
  }

  const handleSelectAllFiltered = () => {
    const next = new Set(selectedIds)
    filteredComplaints.forEach(c => next.add(c.id))
    setSelectedIds(next)
  }

  const handleClearSelection = () => {
    setSelectedIds(new Set())
  }

  const handleInvestigate = async () => {
    if (selectedIds.size === 0) return
    setInvestigating(true)
    try {
      const data = await apiClient.investigations.reverse(Array.from(selectedIds))
      setResult(data)
      showToast('Reverse root-cause investigation completed', 'success')
    } catch {
      showToast('Investigation failed', 'error')
    } finally {
      setInvestigating(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto h-full flex flex-col">
      {/* Page Title */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-cyan" />
            Reverse Root-Cause Investigation
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Trace upstream customer illness complaints to identify common supply chain contamination sources
          </p>
        </div>
        <button
          onClick={handleSelectHero}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-subtle border border-red/30 text-red text-xs font-bold hover:bg-red/20 transition-all shadow-red-glow"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Select Hero Scenario (3 Complaints)</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0">
        {/* Left Column: Complaint Selector */}
        <div className="w-full lg:w-96 bg-surface border border-border rounded-xl flex flex-col h-[640px] shrink-0 shadow-card overflow-hidden">
          {/* Selector Header */}
          <div className="p-4 border-b border-border bg-surface-elevated space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-text-primary flex items-center gap-2">
                <span>Select Complaints</span>
                <span className="font-mono text-cyan bg-cyan-subtle px-2 py-0.5 rounded-full border border-cyan/30 text-[11px]">
                  {selectedIds.size} Selected
                </span>
              </h2>
              <div className="flex items-center space-x-2">
                <button onClick={handleSelectAllFiltered} className="text-[11px] text-cyan hover:underline">
                  Select All
                </button>
                {selectedIds.size > 0 && (
                  <button onClick={handleClearSelection} className="text-[11px] text-text-muted hover:text-red transition-colors">
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted" />
              <input
                type="text"
                placeholder="Search symptoms or order ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-bg border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-cyan"
              />
            </div>

            {/* Quick Filter Chips */}
            <div className="flex items-center gap-1.5 pt-1">
              <button
                onClick={() => setSymptomFilter('ALL')}
                className={clsx('px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors', symptomFilter === 'ALL' ? 'bg-cyan text-bg' : 'bg-surface text-text-muted border border-border')}
              >
                All ({allComplaints?.length || 50})
              </button>
              <button
                onClick={() => setSymptomFilter('PANEER')}
                className={clsx('px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors', symptomFilter === 'PANEER' ? 'bg-red text-bg' : 'bg-surface text-red border border-red/30')}
              >
                Paneer Contamination
              </button>
              <button
                onClick={() => setSymptomFilter('CRITICAL')}
                className={clsx('px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors', symptomFilter === 'CRITICAL' ? 'bg-amber text-bg' : 'bg-surface text-amber border border-amber/30')}
              >
                Critical
              </button>
            </div>
          </div>

          {/* Complaints Scroll List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-border/30">
            {loadingComplaints ? (
              [...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)
            ) : filteredComplaints.length === 0 ? (
              <div className="text-center py-12 text-text-muted text-xs">
                No matching complaints found. Try clearing your search filter.
              </div>
            ) : (
              filteredComplaints.map(c => {
                const isSelected = selectedIds.has(c.id)
                const isCritical = c.severity === 'CRITICAL' || c.severity === 'high'

                return (
                  <label
                    key={c.id}
                    className={clsx(
                      'flex items-start space-x-3 p-3 rounded-xl cursor-pointer transition-all border pt-3 first:pt-3',
                      isSelected
                        ? 'bg-cyan-subtle border-cyan/40 shadow-sm'
                        : 'bg-surface-elevated border-border hover:border-border-bright'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(c.id)}
                      className="mt-1 shrink-0 accent-cyan w-4 h-4 rounded cursor-pointer"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-text-primary leading-snug">
                        {c.text}
                      </div>
                      <div className="flex items-center gap-2 mt-1.5 text-[10px] text-text-muted">
                        <span className="font-mono text-cyan font-semibold">{c.id}</span>
                        <span>&middot;</span>
                        <span>Order: <strong className="text-text-secondary">{c.order_id}</strong></span>
                        <span>&middot;</span>
                        <span className={clsx('font-semibold uppercase', isCritical ? 'text-red' : 'text-amber')}>
                          {c.severity}
                        </span>
                      </div>
                    </div>
                  </label>
                )
              })
            )}
          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-border bg-surface-elevated">
            <Button
              className="w-full font-bold shadow-cyan-glow"
              disabled={selectedIds.size === 0}
              isLoading={investigating}
              onClick={handleInvestigate}
            >
              <GitBranch className="w-4 h-4 mr-2" /> Find Common Upstream Source
            </Button>
          </div>
        </div>

        {/* Right Column: Investigation Results Canvas */}
        <div className="flex-1 bg-surface border border-border rounded-xl overflow-hidden flex flex-col min-h-[640px] shadow-card">
          {!result ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
              <div className="w-16 h-16 rounded-full bg-cyan-subtle border border-cyan/30 flex items-center justify-center text-cyan">
                <GitBranch className="w-8 h-8" />
              </div>
              <div className="max-w-md space-y-1.5">
                <h3 className="text-base font-bold text-text-primary">Ready to Investigate</h3>
                <p className="text-xs text-text-muted leading-relaxed">
                  Select customer complaints on the left (or use the 3 hero incidents) and click <strong>"Find Common Upstream Source"</strong> to traverse the supply chain graph and converge on the contaminated root batch.
                </p>
              </div>
              <Button onClick={handleInvestigate} disabled={selectedIds.size === 0}>
                Run Investigation with {selectedIds.size} Selected
              </Button>
            </div>
          ) : (
            <div className="flex-1 flex flex-col overflow-y-auto">
              {/* Funnel & Disclaimer Bar */}
              <div className="p-6 border-b border-border bg-surface-elevated/60">
                <div className="flex items-start space-x-3 text-amber bg-amber-subtle p-3.5 rounded-xl border border-amber/30 mb-6">
                  <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-xs font-semibold leading-relaxed">{result.disclaimer}</p>
                </div>

                {/* Animated Graph Funnel Stages */}
                <div className="flex justify-between items-center text-center max-w-2xl mx-auto px-4">
                  {[
                    { label: 'Complaints', count: result.stage_counts.complaints, color: 'text-text-primary bg-surface' },
                    { label: 'Orders', count: result.stage_counts.orders, color: 'text-text-primary bg-surface' },
                    { label: 'Dishes', count: result.stage_counts.dishes, color: 'text-text-primary bg-surface' },
                    { label: 'Prep Lots', count: result.stage_counts.prep_lots, color: 'text-text-primary bg-surface' },
                    { label: 'Common Source', count: result.stage_counts.batches, highlight: true, color: 'text-red bg-red-subtle border-red/50 shadow-red-glow font-black' },
                  ].map((stage, i, arr) => (
                    <React.Fragment key={stage.label}>
                      <div className="flex flex-col items-center">
                        <div
                          className={clsx(
                            'w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base mb-1.5 border border-border shadow-sm',
                            stage.color
                          )}
                        >
                          {stage.count}
                        </div>
                        <span className="text-[11px] text-text-muted font-medium">{stage.label}</span>
                      </div>
                      {i < arr.length - 1 && <ArrowRight className="w-4 h-4 text-text-muted opacity-40 mb-5" />}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Top Suspects Ranking Card */}
              <div className="p-6 border-b border-border bg-surface">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-red" />
                  <span>Identified Common Upstream Candidates</span>
                </h3>

                <div className="space-y-3">
                  {result.candidates.map(c => (
                    <div
                      key={c.batch_code}
                      className="bg-surface-elevated border border-red/40 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-red-glow"
                    >
                      <div>
                        <div className="flex items-center space-x-3 mb-1">
                          <span className="font-mono font-extrabold text-lg text-text-primary">{c.batch_code}</span>
                          <span className="text-xs font-bold px-2 py-0.5 bg-red text-bg rounded font-mono shadow-sm">
                            {(c.confidence_score * 100).toFixed(0)}% Confidence Match
                          </span>
                        </div>
                        <div className="text-xs text-text-secondary">
                          Ingredient: <strong className="text-text-primary">{c.ingredient}</strong> &middot; Supplier: <strong className="text-text-primary">{c.supplier_name}</strong>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/recalls/${c.batch_code}`)}
                        className="bg-cyan text-bg font-bold text-xs py-2 px-4 rounded-lg hover:bg-cyan-bright transition-all shadow-cyan-glow flex items-center gap-1.5"
                      >
                        <span>Open Full Forward Trace</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Interactive Convergence Subgraph */}
              <div className="flex-1 p-6 h-[420px] flex flex-col">
                <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary mb-3">
                  Upstream Graph Convergence Tree
                </h3>
                <div className="flex-1 min-h-[350px] rounded-xl overflow-hidden border border-border">
                  <TraceGraph data={result.graph} className="h-full border-none" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
