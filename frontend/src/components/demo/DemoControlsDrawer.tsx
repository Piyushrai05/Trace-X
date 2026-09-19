import React, { useState, useEffect } from 'react'
import { 
  Sparkles, Zap, RotateCcw, X, AlertOctagon, 
  RefreshCw, Terminal, Keyboard
} from 'lucide-react'
import { apiClient } from '../../api/client'
import { useToast } from '../common/Toast'

interface DemoControlsDrawerProps {
  onEventReceived?: (event: any) => void
  onIncidentTriggered?: (batchCode: string) => void
}

export const DemoControlsDrawer: React.FC<DemoControlsDrawerProps> = ({
  onEventReceived,
  onIncidentTriggered
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isSimulating, setIsSimulating] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [selectedBatch, setSelectedBatch] = useState('PNR-2047')
  const [sseConnected, setSseConnected] = useState(false)
  const [eventLogs, setEventLogs] = useState<Array<{ time: string; msg: string; type: string }>>([])
  const { showToast } = useToast()

  // Listen for Shift + D keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Connect to SSE stream /api/stream
  useEffect(() => {
    const sseUrl = `${import.meta.env.VITE_API_URL || ''}/api/stream`
    let es: EventSource | null = null

    try {
      es = new EventSource(sseUrl)
      es.onopen = () => setSseConnected(true)
      
      es.addEventListener('batch_flagged', (e: MessageEvent) => {
        const data = JSON.parse(e.data)
        const logEntry = {
          time: new Date().toLocaleTimeString(),
          msg: data.message || `Batch ${data.batch_code} flagged CRITICAL`,
          type: 'CRITICAL'
        }
        setEventLogs(prev => [logEntry, ...prev.slice(0, 19)])
        showToast(logEntry.msg, 'error')
        if (onEventReceived) onEventReceived(data)
      })

      es.addEventListener('demo_reset', (e: MessageEvent) => {
        const data = JSON.parse(e.data)
        const logEntry = {
          time: new Date().toLocaleTimeString(),
          msg: data.message || 'Demo state restored to seed baseline',
          type: 'NORMAL'
        }
        setEventLogs(prev => [logEntry, ...prev.slice(0, 19)])
        showToast(logEntry.msg, 'success')
        if (onEventReceived) onEventReceived(data)
      })

      es.onerror = () => {
        setSseConnected(false)
      }
    } catch {
      setSseConnected(false)
    }

    return () => {
      if (es) es.close()
    }
  }, [showToast, onEventReceived])

  const handleSimulate = async () => {
    setIsSimulating(true)
    try {
      const res = await apiClient.demo.simulateIncident(selectedBatch)
      showToast(`Simulated critical incident on ${res.batch_code}!`, 'error')
      if (onIncidentTriggered) onIncidentTriggered(res.batch_code)
    } catch (err) {
      console.error('Failed to simulate incident', err)
      showToast('Error simulating incident', 'error')
    } finally {
      setIsSimulating(false)
    }
  }

  const handleReset = async () => {
    setIsResetting(true)
    try {
      const res = await apiClient.demo.reset()
      showToast(res.message, 'success')
      if (onEventReceived) onEventReceived({ type: 'reset' })
    } catch (err) {
      console.error('Failed to reset demo', err)
      showToast('Error resetting demo', 'error')
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <>
      {/* Floating Trigger Button & DEMO MODE Badge */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-cyan-400 border border-cyan-500/40 rounded-full shadow-2xl backdrop-blur-md text-xs font-semibold transition group"
        >
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          <span>Demo Controls</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 bg-slate-800 text-slate-400 rounded text-[10px] font-mono border border-slate-700">
            Shift+D
          </kbd>
        </button>
      </div>

      {/* Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="absolute top-0 right-0 bottom-0 w-full max-w-md bg-slate-900 border-l border-slate-800 p-6 flex flex-col justify-between shadow-2xl text-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30 shadow-md">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      Live Stage Demo Mode
                    </h3>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                      <span className={`w-2 h-2 rounded-full ${sseConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                      <span>{sseConnected ? 'SSE Live Stream Active' : 'Polling Overview'}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Action Controls */}
              <div className="space-y-3">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Incident Simulator
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-slate-300">Target Batch to Contaminate:</label>
                  <select
                    value={selectedBatch}
                    onChange={(e) => setSelectedBatch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono"
                  >
                    <option value="PNR-2047">PNR-2047 (Paneer &middot; Sharma Dairy &middot; 12 Kitchens)</option>
                    <option value="VEG-9182">VEG-9182 (Spinach &middot; Green Fields &middot; 4 Kitchens)</option>
                    <option value="BATCH-0012">BATCH-0012 (Tomatoes &middot; Noida Fresh &middot; 6 Kitchens)</option>
                  </select>
                </div>

                <div className="pt-2 flex flex-col gap-2.5">
                  <button
                    onClick={handleSimulate}
                    disabled={isSimulating}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-500/20 transition disabled:opacity-50"
                  >
                    {isSimulating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <AlertOctagon className="w-4 h-4" />}
                    Simulate Live Cold-Chain Breach
                  </button>

                  <button
                    onClick={handleReset}
                    disabled={isResetting}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition disabled:opacity-50"
                  >
                    {isResetting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    Reset Demo to Seed Baseline
                  </button>
                </div>
              </div>

              {/* Real-Time Event Stream Log Feed */}
              <div className="space-y-2 pt-2">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Real-time SSE Audit Logs</span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 h-44 overflow-y-auto space-y-2 font-mono text-[11px]">
                  {eventLogs.length === 0 ? (
                    <div className="text-slate-600 text-center py-10">
                      Waiting for live events... Trigger an incident above!
                    </div>
                  ) : (
                    eventLogs.map((log, i) => (
                      <div key={i} className="flex items-start gap-2 text-slate-300">
                        <span className="text-slate-500 flex-shrink-0">{log.time}</span>
                        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                          log.type === 'CRITICAL' ? 'bg-red-400' : 'bg-emerald-400'
                        }`} />
                        <span className="leading-snug">{log.msg}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <Keyboard className="w-3 h-3 text-cyan-400" /> Shortcut: <strong>Shift+D</strong>
              </span>
              <span className="text-emerald-400 font-semibold">Demo Ready</span>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
