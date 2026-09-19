import { clsx } from 'clsx'

interface TabsProps {
  tabs: { id: string; label: string }[]
  active: string
  onChange: (id: string) => void
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex space-x-1 border-b border-border">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            active === tab.id
              ? 'border-cyan text-cyan'
              : 'border-transparent text-muted hover:text-text hover:border-border'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
