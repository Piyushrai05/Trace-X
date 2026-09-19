import React, { useState, useEffect } from 'react'
import { 
  Play, Pause, RotateCcw, Clock, Sparkles, Loader2
} from 'lucide-react'
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, ReferenceLine 
} from 'recharts'
import { apiClient } from '../../api/client'
import type { TimelineReplayResponse } from '../../types'

interface TimelineReplayPanelProps {
  batchCode: string
  currentHour: number
  onHourChange: (hour: number, newNodes: string[]) => void
}

export const TimelineReplayPanel: React.FC<TimelineReplayPanelProps> = ({
  batchCode,
  currentHour,
  onHourChange
}) => {
  const [timelineData, setTimelineData] = useState<TimelineReplayResponse | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [speed, setSpeed] = useState<1 | 2 | 4>(1)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch timeline data from backend
  useEffect(() => {
    const fetchTimeline = async () => {
      setIsLoading(true)
      try {
        const res = await apiClient.recalls.timeline(batchCode)
        setTimelineData(res)
      } catch (err) {
        console.error('Failed to load timeline replay data', err)
      } finally {
        setIsLoading(false)
      }
    }
    if (batchCode) {
      fetchTimeline()
    }
  }, [batchCode])

  // Playback timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (isPlaying && timelineData) {
      interval = setInterval(() => {
        if (currentHour >= 24) {
          setIsPlaying(false)
        } else {
          const nextHour = currentHour + 1
          const bucket = timelineData.buckets[nextHour] || timelineData.buckets[timelineData.buckets.length - 1]
          onHourChange(nextHour, bucket?.new_node_ids || [])
        }
      }, 1000 / speed)
    }
    return () => clearInterval(interval)
  }, [isPlaying, speed, currentHour, timelineData, onHourChange])

  const buckets = timelineData?.buckets || []
  const activeBucket = buckets[currentHour] || buckets[0] || {
    hour_label: `T+${currentHour}h`,
    cumulative_kitchens: 0,
    cumulative_prep_lots: 0,
    cumulative_dishes: 0,
    cumulative_orders: 0,
    cumulative_customers: 0,
    stage_event: 'Initial batch ingestion'
  }

  const chartData = buckets.map(b => ({
    hour: b.hour_label,
    hourNum: b.bucket_index,
    orders: b.cumulative_orders,
    dishes: b.cumulative_dishes,
    kitchens: b.cumulative_kitchens,
  }))

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
      {/* Top Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Clock className="w-5 h-5 animate-pulse" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                Contamination Timeline Replay
              </h3>
              <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-cyan-500/20 text-cyan-300 rounded border border-cyan-500/30">
                {activeBucket.hour_label} / T+24h
              </span>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                24.0h Exposure Window
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Replay how contaminated batch <strong className="text-white font-mono">{batchCode}</strong> propagated through kitchens and orders
            </p>
          </div>
        </div>

        {/* Playback Button Group */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-xs">
            {([1, 2, 4] as const).map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  speed === s ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              if (currentHour >= 24) onHourChange(0, buckets[0]?.new_node_ids || [])
              setIsPlaying(!isPlaying)
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold rounded-lg shadow-md transition"
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isPlaying ? 'Pause' : currentHour >= 24 ? 'Replay' : 'Play'}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false)
              onHourChange(0, buckets[0]?.new_node_ids || [])
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-lg transition border border-slate-700"
            title="Reset to T+0h"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Live Timeline Scrubber */}
      <div className="space-y-2">
        <input
          type="range"
          min="0"
          max="24"
          step="1"
          value={currentHour}
          onChange={(e) => {
            setIsPlaying(false)
            const h = parseInt(e.target.value)
            const b = buckets[h] || buckets[0]
            onHourChange(h, b?.new_node_ids || [])
          }}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
        />

        <div className="flex justify-between text-[10px] font-mono text-slate-500">
          <span>T+00h (Dispatched)</span>
          <span>T+04h (Temp Spike 14.2°C)</span>
          <span>T+08h (Central Hub)</span>
          <span>T+12h (12 Kitchens)</span>
          <span>T+16h (Dinner Peak)</span>
          <span>T+20h (Symptoms)</span>
          <span>T+24h (AI Isolation)</span>
        </div>
      </div>

      {/* Synchronized Metrics & Recharts Area Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
        {/* Left: Synchronized Counters */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">Kitchens Reached</div>
            <div className="text-xl font-black text-white mt-0.5 font-mono">{activeBucket.cumulative_kitchens}</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">Prep Lots Made</div>
            <div className="text-xl font-black text-white mt-0.5 font-mono">{activeBucket.cumulative_prep_lots}</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">Dishes Cooked</div>
            <div className="text-xl font-black text-amber-400 mt-0.5 font-mono">{activeBucket.cumulative_dishes}</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400">Orders Sold</div>
            <div className="text-xl font-black text-red-400 mt-0.5 font-mono">{activeBucket.cumulative_orders.toLocaleString()}</div>
          </div>
        </div>

        {/* Right 2 cols: Cumulative Orders Recharts Area Curve */}
        <div className="lg:col-span-2 h-36 bg-slate-950 rounded-xl p-2 border border-slate-800">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="orderGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22D3EE" stopOpacity={0.4}/>
                  <stop offset="95%" stopColor="#22D3EE" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="hour" stroke="#64748b" fontSize={10} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '11px' }}
                labelStyle={{ color: '#22d3ee', fontWeight: 'bold' }}
              />
              <ReferenceLine x={`T+${currentHour < 10 ? '0' : ''}${currentHour}h`} stroke="#f43f5e" strokeDasharray="3 3" />
              <Area type="monotone" dataKey="orders" stroke="#22D3EE" fillOpacity={1} fill="url(#orderGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stage Event Banner */}
      {activeBucket.stage_event && (
        <div className="p-3 bg-cyan-950/30 border border-cyan-500/30 rounded-xl flex items-center justify-between text-xs text-cyan-200">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span><strong>{activeBucket.hour_label} Milestone:</strong> {activeBucket.stage_event}</span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 bg-cyan-500/20 text-cyan-300 rounded">
            Syncing Graph Canvas
          </span>
        </div>
      )}
    </div>
  )
}
