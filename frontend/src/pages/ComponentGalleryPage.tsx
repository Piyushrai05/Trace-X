import { useState } from 'react'
import { Activity, AlertTriangle } from 'lucide-react'
import { StatusBadge } from '../components/common/StatusBadge'
import { MetricCard } from '../components/common/MetricCard'
import { Button } from '../components/common/Button'
import { Skeleton } from '../components/common/Skeleton'
import { EmptyState } from '../components/common/EmptyState'
import { ErrorState } from '../components/common/ErrorState'
import { Modal } from '../components/common/Modal'
import { Drawer } from '../components/common/Drawer'
import { useToast } from '../components/common/Toast'

export default function ComponentGalleryPage() {
  const { showToast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="p-8 space-y-12 max-w-7xl mx-auto pb-24">
      <div>
        <h1 className="text-3xl font-bold text-text mb-2">Component Gallery</h1>
        <p className="text-muted">Development preview of TraceX design system components.</p>
      </div>

      <section>
        <h2 className="text-xl font-semibold text-text mb-4 border-b border-border pb-2">StatusBadges</h2>
        <div className="flex flex-wrap gap-4">
          <StatusBadge status="CRITICAL" />
          <StatusBadge status="WARNING" />
          <StatusBadge status="MONITORING" />
          <StatusBadge status="RESOLVED" />
          <StatusBadge status="NORMAL" />
          <StatusBadge status="UNKNOWN" />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-text mb-4 border-b border-border pb-2">Buttons</h2>
        <div className="flex flex-wrap gap-4 items-end">
          <Button variant="default">Default Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="danger">Danger Button</Button>
          <Button isLoading>Loading Button</Button>
          <Button disabled>Disabled</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-text mb-4 border-b border-border pb-2">MetricCards</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard title="Cyan Metric" value="1,234" icon={Activity} color="cyan" trend="+5.2%" />
          <MetricCard title="Red Metric" value="12" icon={AlertTriangle} color="red" />
          <MetricCard title="Amber Metric" value="45" icon={Activity} color="amber" />
          <MetricCard title="Loading State" icon={Activity} loading />
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-text mb-4 border-b border-border pb-2">States & Feedback</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="h-64"><EmptyState title="No items found" description="Try adjusting your filters or search query." icon={Activity} action={{ label: 'Clear Filters', onClick: () => {} }} /></div>
          <div className="h-64"><ErrorState message="Failed to connect to the supply chain network." onRetry={() => {}} /></div>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-text mb-4 border-b border-border pb-2">Overlays</h2>
        <div className="flex gap-4">
          <Button onClick={() => setModalOpen(true)}>Open Modal</Button>
          <Button onClick={() => setDrawerOpen(true)}>Open Drawer</Button>
          <Button onClick={() => showToast('Action completed successfully', 'success')}>Show Success Toast</Button>
          <Button onClick={() => showToast('Something went wrong', 'error')}>Show Error Toast</Button>
        </div>

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Example Modal">
          <p className="text-muted mb-4">This is a modal component. It traps focus and closes on escape.</p>
          <div className="flex justify-end space-x-2">
            <Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={() => setModalOpen(false)}>Confirm</Button>
          </div>
        </Modal>

        <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} title="Example Drawer">
          <p className="text-muted">This is a drawer component. Useful for details panels and forms on smaller screens.</p>
          <div className="mt-8 space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-8 w-3/4" />
          </div>
        </Drawer>
      </section>
    </div>
  )
}
