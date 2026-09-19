import { LucideIcon, TrendingUp, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'

interface MetricCardProps {
  title: string
  value?: number | string
  subtitle?: string
  trend?: string
  trendType?: 'positive' | 'negative' | 'neutral' | 'alert'
  icon: LucideIcon
  color?: 'cyan' | 'red' | 'amber' | 'green'
  loading?: boolean
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendType = 'positive',
  icon: Icon,
  color = 'cyan',
  loading,
}: MetricCardProps) {
  const colorStyles = {
    cyan: {
      border: 'hover:border-cyan/40',
      iconBg: 'bg-cyan-subtle text-cyan border border-cyan/20',
      glow: 'group-hover:shadow-cyan-glow',
      accent: 'bg-cyan',
    },
    red: {
      border: 'border-red/40 shadow-red-glow',
      iconBg: 'bg-red-subtle text-red border border-red/30',
      glow: 'shadow-red-glow',
      accent: 'bg-red',
    },
    amber: {
      border: 'hover:border-amber/40',
      iconBg: 'bg-amber-subtle text-amber border border-amber/20',
      glow: '',
      accent: 'bg-amber',
    },
    green: {
      border: 'hover:border-green/40',
      iconBg: 'bg-green-subtle text-green border border-green/20',
      glow: '',
      accent: 'bg-green',
    },
  }

  const currentStyle = colorStyles[color]

  return (
    <div
      className={clsx(
        'group relative bg-surface border rounded-xl p-5 transition-all duration-300 shadow-card overflow-hidden',
        color === 'red' ? 'border-red/40 shadow-red-glow' : 'border-border hover:border-border-bright',
        currentStyle.border
      )}
    >
      {/* Top micro accent bar */}
      <div className={clsx('absolute top-0 left-0 right-0 h-[2px] opacity-80', currentStyle.accent)} />

      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">{title}</span>
        <div className={clsx('p-2 rounded-lg transition-transform group-hover:scale-105', currentStyle.iconBg)}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      {loading || value === undefined ? (
        <div className="space-y-2">
          <div className="h-8 w-28 bg-surface-elevated animate-pulse rounded" />
          <div className="h-3 w-16 bg-surface-elevated animate-pulse rounded" />
        </div>
      ) : (
        <div>
          <div className="flex items-baseline justify-between">
            <span className="text-3xl font-bold tracking-tight text-text-primary font-mono">{value}</span>
            {trend && (
              <span
                className={clsx(
                  'inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded-full border',
                  trendType === 'alert' || color === 'red'
                    ? 'bg-red/10 text-red border-red/30'
                    : trendType === 'positive'
                    ? 'bg-cyan/10 text-cyan border-cyan/30'
                    : 'bg-surface-elevated text-text-secondary border-border'
                )}
              >
                {trendType === 'positive' && <TrendingUp className="w-3 h-3 mr-1" />}
                {trendType === 'alert' && <AlertCircle className="w-3 h-3 mr-1" />}
                {trend}
              </span>
            )}
          </div>
          {subtitle && <p className="text-xs text-text-muted mt-1.5 flex items-center gap-1">{subtitle}</p>}
        </div>
      )}
    </div>
  )
}
