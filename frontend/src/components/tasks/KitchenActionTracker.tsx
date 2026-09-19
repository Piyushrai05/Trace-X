import React, { useState } from 'react'
import { 
  ChefHat, CheckCircle2, ShieldCheck, 
  ArrowRight, Flame, MapPin, Building,
  Trash2, RefreshCw
} from 'lucide-react'
import { apiClient } from '../../api/client'
import type { RecallTasksResponse, KitchenTaskItem, TaskStatus } from '../../types'
import { safeFormatTime } from '../../utils/date'

interface KitchenActionTrackerProps {
  batchCode: string
  tasksData?: RecallTasksResponse
  isLoading?: boolean
  onTaskUpdated?: () => void
}

export const KitchenActionTracker: React.FC<KitchenActionTrackerProps> = ({
  batchCode,
  tasksData,
  isLoading,
  onTaskUpdated
}) => {
  const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null)
  const [confirmDisposeTask, setConfirmDisposeTask] = useState<KitchenTaskItem | null>(null)
  const [disposeNote, setDisposeNote] = useState<string>('Bio-secure destruction completed per FSSAI protocol.')
  const [activeFilter, setActiveFilter] = useState<'ALL' | TaskStatus>('ALL')

  const handleAdvance = async (task: KitchenTaskItem, nextStatus: TaskStatus, note?: string) => {
    setUpdatingTaskId(task.id)
    try {
      await apiClient.tasks.updateTask(task.id, nextStatus, note || `Status advanced to ${nextStatus}`)
      if (onTaskUpdated) onTaskUpdated()
    } catch (err) {
      console.error('Failed to advance task', err)
    } finally {
      setUpdatingTaskId(null)
      setConfirmDisposeTask(null)
    }
  }

  const tasks = tasksData?.tasks || []
  const filteredTasks = activeFilter === 'ALL' 
    ? tasks 
    : tasks.filter(t => t.status === activeFilter)

  const isContained = tasksData?.recall_status === 'CONTAINED'
  const percentComplete = tasksData?.percent_complete || 0

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      {/* Header & Progress Gauge */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg text-white ${
            isContained 
              ? 'bg-emerald-600 shadow-emerald-500/20' 
              : 'bg-cyan-600 shadow-cyan-500/20'
          }`}>
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Kitchen Action Tracker & Workflows
              </h3>
              <span className={`px-2.5 py-0.5 text-xs font-bold rounded-full border ${
                isContained 
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' 
                  : 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
              }`}>
                {isContained ? 'CONTAINED' : 'ACTIVE WORKFLOW'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Track multi-stage physical containment across {tasksData?.total_kitchens || 12} affected cloud kitchen hubs for Batch <strong className="text-white font-mono">{batchCode}</strong>
            </p>
          </div>
        </div>

        {/* Progress Percent Meter */}
        <div className="flex items-center gap-4 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Resolution Progress</div>
            <div className="text-xl font-black text-cyan-400 font-mono">{percentComplete}% Complete</div>
          </div>
          <div className="w-24 bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${isContained ? 'bg-emerald-400' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}
              style={{ width: `${percentComplete}%` }}
            />
          </div>
        </div>
      </div>

      {/* Status Group Filters & Counts */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
        <button
          onClick={() => setActiveFilter('ALL')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeFilter === 'ALL'
              ? 'bg-slate-800 border-cyan-500/50 shadow-md ring-1 ring-cyan-400'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <div className="text-[11px] font-semibold">All Kitchens</div>
          <div className="text-lg font-bold text-white mt-0.5">{tasks.length}</div>
        </button>

        <button
          onClick={() => setActiveFilter('NOTIFIED')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeFilter === 'NOTIFIED'
              ? 'bg-red-950/40 border-red-500 shadow-md ring-1 ring-red-400'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <div className="text-[11px] font-semibold text-red-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" /> Notified
          </div>
          <div className="text-lg font-bold text-white mt-0.5">{tasksData?.status_counts.notified || 0}</div>
        </button>

        <button
          onClick={() => setActiveFilter('ACKNOWLEDGED')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeFilter === 'ACKNOWLEDGED'
              ? 'bg-amber-950/40 border-amber-500 shadow-md ring-1 ring-amber-400'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Acknowledged
          </div>
          <div className="text-lg font-bold text-white mt-0.5">{tasksData?.status_counts.acknowledged || 0}</div>
        </button>

        <button
          onClick={() => setActiveFilter('QUARANTINED')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeFilter === 'QUARANTINED'
              ? 'bg-blue-950/40 border-blue-500 shadow-md ring-1 ring-blue-400'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <div className="text-[11px] font-semibold text-blue-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Quarantined
          </div>
          <div className="text-lg font-bold text-white mt-0.5">{tasksData?.status_counts.quarantined || 0}</div>
        </button>

        <button
          onClick={() => setActiveFilter('DISPOSED')}
          className={`p-3 rounded-xl border text-left transition-all ${
            activeFilter === 'DISPOSED'
              ? 'bg-emerald-950/40 border-emerald-500 shadow-md ring-1 ring-emerald-400'
              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
          }`}
        >
          <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Disposed
          </div>
          <div className="text-lg font-bold text-white mt-0.5">{tasksData?.status_counts.disposed || 0}</div>
        </button>
      </div>

      {/* Kitchen Action Cards List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
            <span className="text-xs">Loading kitchen tasks and live containment states...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-8 bg-slate-950 rounded-xl border border-slate-800 text-center text-slate-400 text-xs">
            No kitchen tasks found in the <strong>{activeFilter}</strong> category.
          </div>
        ) : (
          filteredTasks.map((t) => {
            const isTaskUpdating = updatingTaskId === t.id
            const isNotified = t.status === 'NOTIFIED'
            const isAck = t.status === 'ACKNOWLEDGED'
            const isQuar = t.status === 'QUARANTINED'
            const isDisp = t.status === 'DISPOSED'

            return (
              <div 
                key={t.id}
                className={`p-4 rounded-xl border transition-all flex flex-wrap items-center justify-between gap-4 ${
                  isDisp 
                    ? 'bg-slate-950/50 border-emerald-500/30' 
                    : isQuar 
                    ? 'bg-slate-900/90 border-blue-500/40' 
                    : isAck 
                    ? 'bg-slate-900/90 border-amber-500/40' 
                    : 'bg-slate-900/90 border-red-500/40 shadow-sm shadow-red-500/10'
                }`}
              >
                {/* Left: Kitchen Info */}
                <div className="flex items-center gap-3 min-w-[240px]">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isDisp ? 'bg-emerald-500/20 text-emerald-400' :
                    isQuar ? 'bg-blue-500/20 text-blue-400' :
                    isAck ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    <Building className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white flex items-center gap-1.5">
                      <span>{t.kitchen_name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
                        {t.kitchen_id}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-cyan-400" /> {t.kitchen_city}</span>
                      <span>&middot;</span>
                      <span>Updated {safeFormatTime(t.updated_at)} by {t.updated_by}</span>
                    </div>
                  </div>
                </div>

                {/* Middle: Current Status Pill & Note */}
                <div className="flex-1 min-w-[200px] text-xs">
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[11px] border ${
                      isDisp ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' :
                      isQuar ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' :
                      isAck ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                      'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                    }`}>
                      {t.status}
                    </span>
                    <span className="text-slate-400 truncate max-w-xs">{t.note || 'Pending action'}</span>
                  </div>
                </div>

                {/* Right: 1-Click Advance Buttons */}
                <div className="flex items-center gap-2">
                  {isNotified && (
                    <button
                      onClick={() => handleAdvance(t, 'ACKNOWLEDGED', 'Kitchen manager acknowledged critical quarantine alert')}
                      disabled={isTaskUpdating}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold shadow-md transition disabled:opacity-50"
                    >
                      {isTaskUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
                      Acknowledge Alert
                    </button>
                  )}

                  {isAck && (
                    <button
                      onClick={() => handleAdvance(t, 'QUARANTINED', 'Inventory barcode locked & physical batch placed in biohazard cooler')}
                      disabled={isTaskUpdating}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-md transition disabled:opacity-50"
                    >
                      {isTaskUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      Quarantine & Lock
                    </button>
                  )}

                  {isQuar && (
                    <button
                      onClick={() => setConfirmDisposeTask(t)}
                      disabled={isTaskUpdating}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-lg text-xs font-bold shadow-md transition disabled:opacity-50"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Dispose Batch
                    </button>
                  )}

                  {isDisp && (
                    <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold px-2.5 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Contained & Cleared
                    </span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Confirmation Modal for Final Disposal */}
      {confirmDisposeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-red-500/50 max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <div className="p-3 bg-red-500/20 rounded-xl border border-red-500/30">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Confirm Physical Batch Disposal</h4>
                <p className="text-xs text-slate-400">FSSAI Bio-Hazard Destruction Certification</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              You are certifying that all quarantined stock of Batch <strong className="text-white font-mono">{batchCode}</strong> at <strong>{confirmDisposeTask.kitchen_name}</strong> has been permanently denatured and incinerated per FSSAI regulations.
            </p>

            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-400">Disposal Certification Note</label>
              <input
                type="text"
                value={disposeNote}
                onChange={(e) => setDisposeNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDisposeTask(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAdvance(confirmDisposeTask, 'DISPOSED', disposeNote)}
                className="flex items-center gap-1.5 px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg shadow-lg shadow-red-500/20 transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Confirm & Advance to DISPOSED
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
