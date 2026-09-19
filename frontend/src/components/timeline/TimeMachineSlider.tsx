import React, { useState, useEffect } from 'react'
import { 
  Play, Pause, RotateCcw, Clock, AlertTriangle, Truck, 
  ChefHat, ShoppingBag, ShieldCheck
} from 'lucide-react'

interface TimeMachineSliderProps {
  currentHour: number
  onHourChange: (hour: number) => void
}

interface Milestone {
  hour: number
  label: string
  icon: React.ReactNode
  color: string
  description: string
  stage: 'supplier' | 'transport' | 'hub' | 'kitchen' | 'order' | 'complaint' | 'recall'
}

const MILESTONES: Milestone[] = [
  {
    hour: 0,
    label: 'T+0h Ingestion',
    icon: <Truck className="w-3.5 h-3.5" />,
    color: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30',
    description: 'Supplier A dispatches 420 kg Paneer Batch PNR-2047 from Sonipat',
    stage: 'supplier'
  },
  {
    hour: 4,
    label: 'T+4h Temp Spike',
    icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />,
    color: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
    description: 'Cold-chain compressor fault: IoT sensor logs 14.2°C (exceeds 4°C limit)',
    stage: 'transport'
  },
  {
    hour: 8,
    label: 'T+8h Prep Intake',
    icon: <ChefHat className="w-3.5 h-3.5" />,
    color: 'text-blue-400 bg-blue-950/40 border-blue-500/30',
    description: 'Arrives at Delhi Central Hub; split into 31 prep lots',
    stage: 'hub'
  },
  {
    hour: 12,
    label: 'T+12h Kitchens',
    icon: <ChefHat className="w-3.5 h-3.5 text-purple-400" />,
    color: 'text-purple-400 bg-purple-950/40 border-purple-500/30',
    description: 'Distributed across 12 Cloud Kitchen Hubs (Connaught Place, Cyber City, etc.)',
    stage: 'kitchen'
  },
  {
    hour: 16,
    label: 'T+16h Peak Orders',
    icon: <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />,
    color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
    description: 'Cooked into 47 dishes; 1,842 delivery orders fulfilled on Swiggy / Zomato',
    stage: 'order'
  },
  {
    hour: 20,
    label: 'T+20h Symptoms',
    icon: <AlertTriangle className="w-3.5 h-3.5 text-red-400" />,
    color: 'text-red-400 bg-red-950/40 border-red-500/30',
    description: '3 customers in Rohini & Saket report acute stomach cramps on app',
    stage: 'complaint'
  },
  {
    hour: 24,
    label: 'T+24h AI Recall',
    icon: <ShieldCheck className="w-3.5 h-3.5 text-red-500" />,
    color: 'text-red-300 bg-red-950/80 border-red-500',
    description: 'TraceX Graph AI isolates root batch in 14ms; surgical recall dispatched',
    stage: 'recall'
  }
]

export const TimeMachineSlider: React.FC<TimeMachineSliderProps> = ({
  currentHour,
  onHourChange
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<1 | 2 | 4>(1)

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isPlaying) {
      interval = setInterval(() => {
        if (currentHour >= 24) {
          setIsPlaying(false)
        } else {
          onHourChange(Math.min(24, currentHour + 1))
        }
      }, 1000 / speed)
    }
    return () => clearInterval(interval)
  }, [isPlaying, speed, currentHour, onHourChange])

  const activeMilestone = MILESTONES.slice().reverse().find(m => currentHour >= m.hour) || MILESTONES[0]

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 shadow-xl backdrop-blur-sm space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            <Clock className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-2">
              Supply Chain Time-Machine Playback
              <span className="px-2 py-0.5 text-[10px] bg-cyan-500/20 text-cyan-300 rounded font-mono">
                T+{currentHour}h / 24h
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Scrub or play through the timeline to see contamination propagation through the graph
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
            <button
              onClick={() => setSpeed(1)}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition ${speed === 1 ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              1x
            </button>
            <button
              onClick={() => setSpeed(2)}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition ${speed === 2 ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              2x
            </button>
            <button
              onClick={() => setSpeed(4)}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition ${speed === 4 ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
            >
              4x
            </button>
          </div>

          <button
            onClick={() => {
              if (currentHour >= 24) onHourChange(0)
              setIsPlaying(!isPlaying)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold rounded-lg shadow-md transition"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Pause' : currentHour >= 24 ? 'Replay' : 'Play'}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false)
              onHourChange(0)
            }}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition border border-slate-700"
            title="Reset to T+0h"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slider Bar */}
      <div className="space-y-2">
        <input
          type="range"
          min="0"
          max="24"
          step="1"
          value={currentHour}
          onChange={(e) => {
            setIsPlaying(false)
            onHourChange(parseInt(e.target.value))
          }}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />

        {/* Milestone Tick Marks */}
        <div className="grid grid-cols-7 gap-1 pt-1">
          {MILESTONES.map((m) => {
            const isReached = currentHour >= m.hour
            const isCurrent = activeMilestone.hour === m.hour
            return (
              <button
                key={m.hour}
                onClick={() => {
                  setIsPlaying(false)
                  onHourChange(m.hour)
                }}
                className={`text-left p-1.5 rounded-lg border transition-all ${
                  isCurrent
                    ? `${m.color} ring-1 ring-cyan-400 shadow-md`
                    : isReached
                    ? 'bg-slate-800/80 border-slate-700 text-slate-300'
                    : 'bg-slate-950/40 border-slate-800/50 text-slate-600 opacity-60'
                }`}
              >
                <div className="flex items-center gap-1 text-[10px] font-bold">
                  {m.icon}
                  <span>{m.label}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Active Milestone Card */}
      <div className={`p-3 rounded-lg border flex items-center gap-3 ${activeMilestone.color}`}>
        <div className="p-2 rounded-lg bg-slate-900/60 flex-shrink-0">
          {activeMilestone.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold">{activeMilestone.label}: Active Propagation State</div>
          <div className="text-[11px] opacity-90 truncate">{activeMilestone.description}</div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900/80 font-mono">
            {currentHour < 8 ? 'Upstream Sourcing' : currentHour < 16 ? 'Central Hub Prep' : currentHour < 22 ? 'Live Deliveries' : 'Active Recall'}
          </span>
        </div>
      </div>
    </div>
  )
}
