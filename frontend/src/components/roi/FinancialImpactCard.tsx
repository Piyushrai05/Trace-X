import React from 'react'
import { ShieldCheck, Award, Clock } from 'lucide-react'

interface FinancialImpactCardProps {
  batchCode?: string
  surgicalLoss?: number
  blanketLoss?: number
  netSaved?: number
  lawsuitsPrevented?: number
  reputationSaved?: string
}

export const FinancialImpactCard: React.FC<FinancialImpactCardProps> = ({
  batchCode = 'PNR-2047',
  surgicalLoss = 14200,
  blanketLoss = 520000,
  netSaved = 505800,
  lawsuitsPrevented = 47,
  reputationSaved = '+38.4 pts'
}) => {
  const percentageSaved = (((blanketLoss - surgicalLoss) / blanketLoss) * 100).toFixed(1)

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-emerald-950/30 border border-emerald-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute -top-24 -right-24 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">
                TraceX Surgical ROI & Brand Shield
              </h3>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full">
                {percentageSaved}% SAVED
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Graph-targeted containment for batch <strong className="text-emerald-400 font-mono">{batchCode}</strong> vs blunt whole-network shutdown
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-slate-400 font-medium">Preserved Value</div>
          <div className="text-2xl font-black text-emerald-400 tracking-tight">
            ${netSaved.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Cost Comparison Bar */}
      <div className="py-4 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="text-red-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Blanket Network Shutdown: ${blanketLoss.toLocaleString()}
          </span>
          <span className="text-cyan-400 font-semibold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            TraceX Surgical Recall: ${surgicalLoss.toLocaleString()}
          </span>
        </div>

        {/* Visual Multi-bar comparison */}
        <div className="h-4 bg-slate-800/90 rounded-full overflow-hidden p-0.5 flex gap-1">
          <div 
            className="bg-cyan-400 h-full rounded-full transition-all duration-1000 shadow-sm shadow-cyan-400/50"
            style={{ width: `${(surgicalLoss / blanketLoss) * 100}%`, minWidth: '12px' }}
            title={`Surgical Recall: $${surgicalLoss.toLocaleString()}`}
          />
          <div 
            className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full flex-1 opacity-80"
            title={`Protected Capital: $${netSaved.toLocaleString()}`}
          />
        </div>
        <div className="flex justify-between text-[11px] text-slate-500">
          <span>Actual Cost Incurred (2.7%)</span>
          <span className="text-emerald-400 font-medium">Direct Financial Protection (97.3%)</span>
        </div>
      </div>

      {/* 3 Secondary Metric Badges */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Reputation Saved</span>
          </div>
          <div className="text-lg font-bold text-white mt-1">{reputationSaved}</div>
          <div className="text-[10px] text-slate-500">NPS score preserved</div>
        </div>

        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
            <span>Lawsuits Avoided</span>
          </div>
          <div className="text-lg font-bold text-white mt-1">{lawsuitsPrevented} Actions</div>
          <div className="text-[10px] text-slate-500">FSSAI / Consumer court</div>
        </div>

        <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Isolation Speed</span>
          </div>
          <div className="text-lg font-bold text-emerald-400 mt-1">14.2 ms</div>
          <div className="text-[10px] text-slate-500">vs 4.8 days manual</div>
        </div>
      </div>
    </div>
  )
}
