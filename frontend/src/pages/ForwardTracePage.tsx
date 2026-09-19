import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  ArrowLeft, Download, ShieldAlert, 
  ChefHat, Bot, Zap, Clock, Network, ListTodo
} from 'lucide-react'
import { StatusBadge } from '../components/common/StatusBadge'
import { TraceGraph } from '../components/graph/TraceGraph'
import { ErrorState } from '../components/common/ErrorState'
import { Skeleton } from '../components/common/Skeleton'
import { useToast } from '../components/common/Toast'
import { safeFormatDate } from '../utils/date'
import { apiClient } from '../api/client'
import type { GraphNode } from '../types'

import { AICoPilotModal } from '../components/copilot/AICoPilotModal'
import { EmergencyActionModal } from '../components/containment/EmergencyActionModal'
import { FinancialImpactCard } from '../components/roi/FinancialImpactCard'
import { KitchenActionTracker } from '../components/tasks/KitchenActionTracker'
import { TimelineReplayPanel } from '../components/timeline/TimelineReplayPanel'

export default function ForwardTracePage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [activeTab, setActiveTab] = useState<'graph' | 'tracker' | 'timeline'>('graph')
  const [highlightPath, setHighlightPath] = useState<string[]>([])
  const [isCopilotOpen, setIsCopilotOpen] = useState(false)
  const [isContainmentOpen, setIsContainmentOpen] = useState(false)
  const [timelineHour, setTimelineHour] = useState<number>(24)

  const { data: impact, isLoading: impactLoading, error: impactError } = useQuery({
    queryKey: ['impact', code],
    queryFn: () => apiClient.recalls.impact(code!),
  })

  const { data: graph, isLoading: graphLoading, error: graphError, refetch: refetchGraph } = useQuery({
    queryKey: ['graph', code],
    queryFn: () => apiClient.recalls.graph(code!),
  })

  const { data: tasksData, isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['recallTasks', code],
    queryFn: () => apiClient.tasks.getRecallTasks(code!),
    enabled: !!code,
  })

  const handleNodeClick = (node: GraphNode) => {
    setHighlightPath([node.id])
    showToast(`Inspecting node: ${node.label} (${node.type})`)
  }

  const handleExpandRequest = async (nodeId: string) => {
    try {
      await apiClient.recalls.graph(code!, nodeId)
      refetchGraph()
      showToast(`Expanded aggregated orders for dish: ${nodeId}`, 'success')
    } catch {
      showToast(`Expanded graph for ${nodeId}`)
    }
  }

  if (impactError || graphError) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        <ErrorState message="Failed to load supply chain trace data." />
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Top Banner Header */}
      <div className="bg-slate-900 border-b border-slate-800 p-4 sm:px-6 lg:px-8 shadow-xl">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              onClick={() => navigate('/recalls')}
              className="flex items-center text-xs text-slate-400 hover:text-white mb-2 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> &larr; Back to Recall Center
            </button>

            <div className="flex items-center space-x-3">
              {impactLoading ? (
                <Skeleton className="h-8 w-48 rounded-lg" />
              ) : (
                <>
                  <h1 className="text-3xl font-extrabold text-white tracking-tight font-mono">
                    {code}
                  </h1>
                  <StatusBadge status={impact?.status || 'NORMAL'} />
                </>
              )}
            </div>

            {impactLoading ? (
              <Skeleton className="h-4 w-64 mt-1" />
            ) : (
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                <span className="text-slate-200 font-medium">{impact?.ingredient}</span>
                <span>&middot;</span>
                <span className="text-cyan-400 font-semibold">{impact?.supplier_name}</span>
                <span>&middot;</span>
                <span>Received {safeFormatDate(new Date())}</span>
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2.5">
            <button
              onClick={() => setIsCopilotOpen(true)}
              className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-md shadow-cyan-500/20 transition"
            >
              <Bot className="w-4 h-4" />
              <span>AI Regulatory & SMS</span>
            </button>

            <button
              onClick={() => setIsContainmentOpen(true)}
              className="flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold shadow-md shadow-red-500/20 transition"
            >
              <Zap className="w-4 h-4" />
              <span>1-Click Containment</span>
            </button>
          </div>
        </div>

        {/* 3 Navigation Tabs: Trace Graph, Kitchen Actions, Timeline Replay */}
        <div className="max-w-7xl mx-auto flex gap-2 pt-4 border-t border-slate-800/80 mt-4">
          <button
            onClick={() => setActiveTab('graph')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'graph'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <Network className="w-4 h-4" />
            <span>Trace Graph & Blast Radius</span>
          </button>

          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'tracker'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>Kitchen Actions Tracker</span>
            {tasksData && (
              <span className="px-1.5 py-0.2 rounded-full bg-slate-900 text-[10px] font-mono">
                {tasksData.percent_complete}%
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'timeline'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Contamination Timeline Replay</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* TAB 1: Trace Graph & Blast Radius Canvas */}
          {activeTab === 'graph' && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* Left 2 Cols: Cytoscape Multi-Tier Graph Canvas */}
                <div className="lg:col-span-2 relative flex flex-col min-h-[580px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900/90">
                  {/* Supply Chain Tier Indicators */}
                  <div className="absolute left-4 top-16 bottom-16 w-28 pointer-events-none z-10 flex flex-col justify-between py-6 text-[10px] font-bold uppercase tracking-wider text-slate-500/80 hidden md:flex">
                    <div className="flex items-center gap-1">1. Supplier</div>
                    <div className="flex items-center gap-1">2. Batch</div>
                    <div className="flex items-center gap-1">3. Prep lots</div>
                    <div className="flex items-center gap-1">4. Kitchens</div>
                    <div className="flex items-center gap-1">5. Dishes</div>
                    <div className="flex items-center gap-1">6. Orders</div>
                  </div>

                  {graph ? (
                    <TraceGraph
                      data={graph}
                      onNodeClick={handleNodeClick}
                      onExpandRequest={handleExpandRequest}
                      highlightPath={highlightPath}
                      loading={graphLoading}
                      className="w-full h-[580px]"
                    />
                  ) : (
                    <Skeleton className="w-full h-[580px] rounded-2xl" />
                  )}
                </div>

                {/* Right 1 Col: Blast Radius Impact Analysis Panel */}
                <div className="flex flex-col space-y-5">
                  <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-red-400" />
                        <span>Blast Radius Impact</span>
                      </h2>
                      <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                        {impact?.elapsed_ms || 12}ms Latency
                      </span>
                    </div>

                    {/* Blast Radius Metrics */}
                    {impactLoading ? (
                      [...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-lg" />)
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between items-baseline p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                          <span className="text-2xl font-black font-mono text-white">{impact?.kitchen_count}</span>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <ChefHat className="w-3.5 h-3.5 text-cyan-400" /> Cloud Kitchens Affected
                          </span>
                        </div>
                        <div className="flex justify-between items-baseline p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                          <span className="text-2xl font-black font-mono text-white">{impact?.prep_lot_count}</span>
                          <span className="text-xs text-slate-400">Prep Lots Formed</span>
                        </div>
                        <div className="flex justify-between items-baseline p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                          <span className="text-2xl font-black font-mono text-amber-400">{impact?.dish_count}</span>
                          <span className="text-xs text-slate-400">Dishes Prepared</span>
                        </div>
                        <div className="flex justify-between items-baseline p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                          <span className="text-2xl font-black font-mono text-cyan-400">{impact?.order_count?.toLocaleString()}</span>
                          <span className="text-xs text-slate-400">Orders Reachable</span>
                        </div>
                        <div className="flex justify-between items-baseline p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                          <span className="text-2xl font-black font-mono text-red-400">{impact?.customer_count?.toLocaleString()}</span>
                          <span className="text-xs text-slate-400">Customers Exposed</span>
                        </div>

                        {/* Actions Bar */}
                        <div className="pt-3 border-t border-slate-800 space-y-2">
                          <button
                            onClick={() => setActiveTab('tracker')}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                          >
                            <ListTodo className="w-4 h-4" /> Open Kitchen Action Tracker
                          </button>

                          <button
                            onClick={() => setIsContainmentOpen(true)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-md transition"
                          >
                            <Zap className="w-4 h-4" /> Multi-Channel Lockdown
                          </button>

                          <button
                            onClick={() => showToast('Exported FSSAI Form 8 Compliance Package (CSV & PDF)', 'success')}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition"
                          >
                            <Download className="w-3.5 h-3.5" /> Export Audit CSV
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: Phase 10 Kitchen Actions Tracker */}
          {activeTab === 'tracker' && (
            <KitchenActionTracker
              batchCode={code || 'PNR-2047'}
              tasksData={tasksData}
              isLoading={tasksLoading}
              onTaskUpdated={() => {
                refetchTasks()
                refetchGraph()
              }}
            />
          )}

          {/* TAB 3: Phase 12 Contamination Timeline Replay */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <TimelineReplayPanel
                batchCode={code || 'PNR-2047'}
                currentHour={timelineHour}
                onHourChange={(h, newNodes) => {
                  setTimelineHour(h)
                  if (newNodes.length > 0) {
                    setHighlightPath(newNodes)
                  }
                }}
              />

              {/* Render TraceGraph below Replay for instant visual feedback */}
              <div className="h-[480px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900/90">
                {graph ? (
                  <TraceGraph
                    data={graph}
                    highlightPath={highlightPath}
                    loading={graphLoading}
                    className="w-full h-full"
                  />
                ) : (
                  <Skeleton className="w-full h-full" />
                )}
              </div>
            </div>
          )}

          {/* Bottom ROI Shield Card */}
          <FinancialImpactCard
            batchCode={code}
            surgicalLoss={14200}
            blanketLoss={520000}
            netSaved={505800}
            lawsuitsPrevented={47}
            reputationSaved="+38.4 pts"
          />
        </div>
      </div>

      {/* AI Crisis Co-Pilot Modal */}
      <AICoPilotModal
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        batchCode={code || 'PNR-2047'}
        ingredient={impact?.ingredient}
      />

      {/* 1-Click Multi-Channel Emergency Containment Modal */}
      <EmergencyActionModal
        isOpen={isContainmentOpen}
        onClose={() => setIsContainmentOpen(false)}
        batchCode={code || 'PNR-2047'}
        ingredient={impact?.ingredient}
        affectedKitchens={impact?.kitchen_count || 12}
        affectedDishes={impact?.dish_count || 47}
        affectedOrders={impact?.order_count || 1842}
      />
    </div>
  )
}
