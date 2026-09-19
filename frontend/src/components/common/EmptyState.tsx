import { LucideIcon } from 'lucide-react'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-surface border border-border rounded-lg h-full">
      {Icon && <Icon className="w-12 h-12 text-muted mb-4" />}
      <h3 className="text-lg font-medium text-text">{title}</h3>
      {description && <p className="text-sm text-muted mt-2 max-w-sm">{description}</p>}
      {action && (
        <div className="mt-6">
          <Button onClick={action.onClick}>{action.label}</Button>
        </div>
      )}
    </div>
  )
}
