import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'

interface ErrorStateProps {
  message: string
  onRetry?: () => void
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-surface border border-red/30 rounded-lg">
      <AlertTriangle className="w-12 h-12 text-red mb-4" />
      <h3 className="text-lg font-medium text-red">Error</h3>
      <p className="text-sm text-muted mt-2 max-w-sm">{message}</p>
      {onRetry && (
        <div className="mt-6">
          <Button variant="outline" onClick={onRetry}>Retry</Button>
        </div>
      )}
    </div>
  )
}
