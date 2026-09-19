import { clsx } from 'clsx'
import type { BatchStatus } from '../../types'

interface StatusBadgeProps {
  status: BatchStatus | string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const isCritical = status === 'CRITICAL'
  const isWarning = status === 'WARNING'
  const isMonitoring = status === 'MONITORING'
  const isResolved = status === 'RESOLVED'
  const isNormal = status === 'NORMAL'

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        {
          'bg-red/20 text-red border-red/30': isCritical,
          'animate-pulse': isCritical,
          'bg-amber/20 text-amber border-amber/30': isWarning || isMonitoring,
          'bg-green/20 text-green border-green/30': isResolved,
          'bg-surface text-muted border-border': isNormal,
          'bg-surface text-text border-border': !isCritical && !isWarning && !isMonitoring && !isResolved && !isNormal,
        },
        className
      )}
    >
      {status}
    </span>
  )
}
