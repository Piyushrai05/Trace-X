import React, { useState } from 'react'
import { apiClient } from '../../api/client'
import type { ContainmentDispatchResponse } from '../../types'
import { 
  AlertOctagon, CheckCircle2, Zap, 
  Truck, ShoppingBag, MessageSquare, CreditCard, Lock,
  RefreshCw, X
} from 'lucide-react'

interface EmergencyActionModalProps {
  isOpen: boolean
  onClose: () => void
  batchCode: string
  ingredient?: string
  affectedKitchens?: number
  affectedDishes?: number
  affectedOrders?: number
}

const CHANNELS = [
  { id: 'pos_delisting', name: 'Zomato & Swiggy Auto-86', icon: <ShoppingBag className="w-4 h-4 text-orange-400" />, desc: 'Instantly delist 47 dishes across 12 cloud-kitchens on POS APIs' },
  { id: 'courier_recall', name: 'In-Transit Courier Intercept', icon: <Truck className="w-4 h-4 text-blue-400" />, desc: 'RTO redirect active delivery riders with dishes currently en route' },
  { id: 'customer_broadcast', name: 'Customer Medical SMS Broadcast', icon: <MessageSquare className="w-4 h-4 text-emerald-400" />, desc: 'Push safety warnings & symptoms checklist to 2,913 affected patrons' },
  { id: 'instant_refund', name: 'Automated UPI Refund Processing', icon: <CreditCard className="w-4 h-4 text-purple-400" />, desc: 'Auto-credit ₹340 per order back to UPI / original payment method' },
  { id: 'kitchen_lock', name: 'Physical Kitchen Smart Lock', icon: <Lock className="w-4 h-4 text-red-400" />, desc: 'Lock batch barcodes on kitchen preparation tablets' },
]

export const EmergencyActionModal: React.FC<EmergencyActionModalProps> = ({
  isOpen,
  onClose,
  batchCode,
  ingredient = 'Paneer',
  affectedKitchens = 12,
  affectedDishes = 47,
  affectedOrders = 1842
}) => {
  const [selectedChannels, setSelectedChannels] = useState<string[]>(CHANNELS.map(c => c.id))
  const [isExecuting, setIsExecuting] = useState(false)
  const [executionResult, setExecutionResult] = useState<ContainmentDispatchResponse | null>(null)
  const [progress, setProgress] = useState(0)

  if (!isOpen) return null

  const handleToggleChannel = (id: string) => {
    if (selectedChannels.includes(id)) {
      setSelectedChannels(selectedChannels.filter(c => c !== id))
    } else {
      setSelectedChannels([...selectedChannels, id])
    }
  }

  const handleExecute = async () => {
    setIsExecuting(true)
    setProgress(15)

    try {
      const interval = setInterval(() => {
        setProgress(p => Math.min(95, p + 20))
      }, 150)

      const result = await apiClient.copilot.containmentDispatch(batchCode, selectedChannels)
      clearInterval(interval)
      setProgress(100)
      setExecutionResult(result)
    } catch (err) {
      console.error('Failed to execute containment', err)
    } finally {
      setIsExecuting(false)
    }
  }

  const handleReset = () => {
    setExecutionResult(null)
    setProgress(0)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-slate-900 border border-red-500/40 w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-red-950/60 via-slate-900 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-500/30 text-white animate-pulse">
              <AlertOctagon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Emergency Multi-Channel Containment
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/40 rounded-full">
                    Surgical Action
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Targeted lockdown for Batch <strong className="text-red-400">{batchCode}</strong> ({ingredient}) across {affectedKitchens} Kitchens & {affectedOrders} Orders
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {!executionResult ? (
            <>
              {/* Target Overview Banner */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 grid grid-cols-3 gap-4 text-center">
                <div className="p-2 bg-slate-900/60 rounded-lg">
                  <div className="text-xs text-slate-400">Kitchens Quarantined</div>
                  <div className="text-xl font-bold text-white mt-1">{affectedKitchens} Hubs</div>
                </div>
                <div className="p-2 bg-slate-900/60 rounded-lg">
                  <div className="text-xs text-slate-400">Dishes Delisted</div>
                  <div className="text-xl font-bold text-amber-400 mt-1">{affectedDishes} Menu SKUs</div>
                </div>
                <div className="p-2 bg-slate-900/60 rounded-lg">
                  <div className="text-xs text-slate-400">Customer Reach</div>
                  <div className="text-xl font-bold text-red-400 mt-1">{affectedOrders} Orders</div>
                </div>
              </div>

              {/* Action Channels Checkboxes */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Select Containment Channels</span>
                  <span className="text-cyan-400">{selectedChannels.length} of {CHANNELS.length} Active</span>
                </div>

                <div className="space-y-2.5">
                  {CHANNELS.map((ch) => {
                    const isChecked = selectedChannels.includes(ch.id)
                    return (
                      <div
                        key={ch.id}
                        onClick={() => handleToggleChannel(ch.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                          isChecked
                            ? 'bg-slate-800/90 border-cyan-500/40 shadow-sm'
                            : 'bg-slate-950/40 border-slate-800/80 opacity-60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700"
                        />
                        <div className="p-2 rounded-lg bg-slate-900 flex-shrink-0">
                          {ch.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-white">{ch.name}</div>
                          <div className="text-xs text-slate-400">{ch.desc}</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Progress Bar (During execution) */}
              {isExecuting && (
                <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-cyan-500/30">
                  <div className="flex items-center justify-between text-xs text-cyan-400">
                    <span className="flex items-center gap-2 font-medium">
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Dispathing Webhooks to Swiggy, Zomato & SMS Gateways...
                    </span>
                    <span className="font-bold">{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Execution Result State */
            <div className="space-y-6">
              {/* Success Badge Banner */}
              <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/40">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <div className="text-base font-bold text-emerald-300">
                    Surgical Containment Complete (99.4% Effective)
                  </div>
                  <div className="text-xs text-slate-300 mt-0.5">
                    Batch <strong className="text-white">{executionResult.batch_code}</strong> successfully neutralized in <strong>{executionResult.elapsed_seconds}s</strong>. Zero further customer exposure.
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-emerald-400">99.4%</div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">Containment</div>
                </div>
              </div>

              {/* Channel Execution Logs */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Channel Dispatch Logs
                </div>

                <div className="space-y-2">
                  {executionResult.channels_dispatched.map((ch, idx) => (
                    <div 
                      key={idx}
                      className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <div>
                          <span className="font-bold text-white">{ch.channel}</span>
                          <span className="text-slate-400 ml-2">({ch.action})</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-cyan-400 font-mono">{ch.affected_items} items neutralized</span>
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                          {ch.latency_ms}ms
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
          {!executionResult ? (
            <>
              <button
                onClick={onClose}
                disabled={isExecuting}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleExecute}
                disabled={isExecuting || selectedChannels.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-lg text-xs font-bold shadow-lg shadow-red-500/20 transition disabled:opacity-50"
              >
                <Zap className="w-4 h-4" />
                {isExecuting ? 'Executing Lockdown...' : 'Trigger Multi-Channel Lockdown'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition"
              >
                Re-run Simulation
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
              >
                Done
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
