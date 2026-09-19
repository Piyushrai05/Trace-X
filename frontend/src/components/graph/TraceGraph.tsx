import { useEffect, useRef, useState } from 'react'
import cytoscape, { Core, ElementDefinition } from 'cytoscape'
// @ts-ignore
import cytoscapeDagre from 'cytoscape-dagre'
import { ZoomIn, ZoomOut, Maximize, Layers } from 'lucide-react'
import { clsx } from 'clsx'
import type { GraphPayload, GraphNode } from '../../types'
import { Skeleton } from '../common/Skeleton'

cytoscape.use(cytoscapeDagre)

interface TraceGraphProps {
  data: GraphPayload
  onNodeClick?: (node: GraphNode) => void
  onExpandRequest?: (nodeId: string) => void
  highlightPath?: string[]
  loading?: boolean
  className?: string
}

const TYPE_COLORS = {
  supplier: { bg: '#1F2A36', border: '#22D3EE' },
  batch: { bg: '#121820', border: '#22D3EE' },
  prep_lot: { bg: '#121820', border: '#22D3EE' },
  kitchen: { bg: '#121820', border: '#22D3EE' },
  dish: { bg: '#121820', border: '#22D3EE' },
  order_aggregate: { bg: '#121820', border: '#1F2A36' },
  customer_aggregate: { bg: 'transparent', border: '#22D3EE' },
  default: { bg: '#121820', border: '#22D3EE' },
}

export function TraceGraph({ data, onNodeClick, onExpandRequest, highlightPath = [], loading, className }: TraceGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const cyRef = useRef<Core | null>(null)
  const [layout, setLayout] = useState<'dagre' | 'cose'>('dagre')
  const [visibleTypes, setVisibleTypes] = useState<Set<string>>(new Set(['supplier', 'batch', 'prep_lot', 'kitchen', 'dish', 'order', 'order_aggregate', 'customer_aggregate']))

  useEffect(() => {
    if (!containerRef.current) return

    const cy = cytoscape({
      container: containerRef.current,
      style: [
        {
          selector: 'node',
          style: {
            'label': 'data(label)',
            'color': '#E6EDF3',
            'font-size': '12px',
            'font-family': 'Inter, sans-serif',
            'text-valign': 'bottom',
            'text-margin-y': 8,
            'background-color': '#121820',
            'border-width': 2,
            'border-color': '#22D3EE',
          }
        },
        {
          selector: 'node[type="supplier"]',
          style: { 'shape': 'ellipse', 'width': 40, 'height': 40, 'background-color': TYPE_COLORS.supplier.bg, 'border-color': TYPE_COLORS.supplier.border }
        },
        {
          selector: 'node[type="batch"]',
          style: { 'shape': 'diamond', 'width': 45, 'height': 45 }
        },
        {
          selector: 'node[type="batch"][status="CRITICAL"]',
          style: { 'background-color': '#7F1D1D', 'border-color': '#F0524F' }
        },
        {
          selector: 'node[type="prep_lot"]',
          style: { 'shape': 'diamond', 'width': 35, 'height': 35, 'background-color': '#121820', 'border-color': '#22D3EE' }
        },
        {
          selector: 'node[type="kitchen"]',
          style: { 'shape': 'round-rectangle', 'width': 30, 'height': 30, 'background-color': '#121820', 'border-color': '#22D3EE' }
        },
        {
          selector: 'node[type="dish"]',
          style: { 'shape': 'ellipse', 'width': 30, 'height': 30, 'background-color': '#121820', 'border-color': '#22D3EE' }
        },
        {
          selector: 'node[type="order_aggregate"]',
          style: { 'shape': 'rectangle', 'width': 25, 'height': 25, 'border-color': TYPE_COLORS.order_aggregate.border }
        },
        {
          selector: 'node[type="customer_aggregate"]',
          style: { 'shape': 'ellipse', 'width': 35, 'height': 35, 'border-style': 'dashed' }
        },
        {
          selector: 'edge',
          style: {
            'width': 1.5,
            'line-color': '#22D3EE',
            'target-arrow-color': '#22D3EE',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 1.2,
            'opacity': 0.6
          }
        },
        {
          selector: '.highlighted',
          style: { 'border-color': '#F0524F', 'border-width': 3 }
        },
        {
          selector: '.highlighted-edge',
          style: { 'line-color': '#F0524F', 'target-arrow-color': '#F0524F', 'width': 2.5, 'opacity': 1, 'z-index': 999 }
        },
        {
          selector: '.dimmed',
          style: { 'opacity': 0.3 }
        }
      ],
      wheelSensitivity: 0.2,
    })

    cy.on('tap', 'node', (evt) => {
      const nodeData = evt.target.data()
      if (nodeData.type === 'order_aggregate' || nodeData.type === 'customer_aggregate') {
        const inEdges = evt.target.incomers('edge')
        if (inEdges.length > 0 && onExpandRequest) {
          onExpandRequest(inEdges[0].source().id())
        }
      } else {
        if (onNodeClick) {
          const matchingData = data.nodes.find(n => n.id === nodeData.id)
          if (matchingData) onNodeClick(matchingData)
        }
      }
    })

    cyRef.current = cy

    return () => {
      cy.destroy()
    }
  }, [onNodeClick, onExpandRequest, data.nodes])

  useEffect(() => {
    if (!cyRef.current) return
    const cy = cyRef.current

    const elements: ElementDefinition[] = [
      ...data.nodes.filter(n => visibleTypes.has(n.type) || n.type === 'batch').map(n => ({
        group: 'nodes' as const,
        data: {
          id: n.id,
          label: n.label,
          type: n.type,
          status: n.data.status
        }
      })),
      ...data.edges.map(e => ({
        group: 'edges' as const,
        data: {
          id: e.id,
          source: e.source,
          target: e.target
        }
      }))
    ]

    cy.elements().remove()
    cy.add(elements)

    const layoutOptions = layout === 'dagre' ? {
      name: 'dagre',
      rankDir: 'TB',
      rankSep: 80,
      nodeSep: 40,
      animate: true,
      animationDuration: 300
    } : {
      name: 'cose',
      animate: true,
      animationDuration: 300
    }

    cy.layout(layoutOptions).run()
  }, [data, layout, visibleTypes])

  useEffect(() => {
    if (!cyRef.current) return
    const cy = cyRef.current

    cy.elements().removeClass('highlighted highlighted-edge dimmed')

    if (highlightPath.length > 0) {
      cy.elements().addClass('dimmed')
      highlightPath.forEach((id, i) => {
        cy.getElementById(id).removeClass('dimmed').addClass('highlighted')
        if (i < highlightPath.length - 1) {
          const source = id
          const target = highlightPath[i+1]
          cy.edges(`[source = "${source}"][target = "${target}"]`).removeClass('dimmed').addClass('highlighted-edge')
          cy.edges(`[source = "${target}"][target = "${source}"]`).removeClass('dimmed').addClass('highlighted-edge')
        }
      })
    }
  }, [highlightPath])

  const handleZoom = (factor: number) => {
    if (cyRef.current) {
      cyRef.current.zoom(cyRef.current.zoom() * factor)
    }
  }

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 50)
    }
  }

  const toggleType = (type: string) => {
    setVisibleTypes(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  return (
    <div className={clsx("relative w-full h-full min-h-[400px] bg-surface rounded-lg border border-border overflow-hidden", className)}>
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-surface/50 z-10">
          <Skeleton className="w-full h-full" />
        </div>
      ) : null}
      
      <div className="absolute top-4 left-4 z-10 flex flex-col space-y-2">
        <div className="flex space-x-2 bg-surface border border-border rounded-lg p-1">
          <button onClick={() => handleZoom(1.2)} className="p-1.5 text-muted hover:text-text hover:bg-bg rounded"><ZoomIn className="w-4 h-4" /></button>
          <button onClick={() => handleZoom(0.8)} className="p-1.5 text-muted hover:text-text hover:bg-bg rounded"><ZoomOut className="w-4 h-4" /></button>
          <button onClick={handleFit} className="p-1.5 text-muted hover:text-text hover:bg-bg rounded"><Maximize className="w-4 h-4" /></button>
        </div>
        <button 
          onClick={() => setLayout(l => l === 'dagre' ? 'cose' : 'dagre')}
          className="flex items-center space-x-2 bg-surface border border-border rounded-lg px-3 py-1.5 text-xs text-text hover:bg-bg"
        >
          <Layers className="w-3 h-3" />
          <span>Layout: {layout}</span>
        </button>
      </div>

      <div ref={containerRef} className="w-full h-full" />

      <div className="absolute bottom-4 left-4 right-4 z-10 flex flex-wrap gap-2 pointer-events-none">
        {['prep_lot', 'kitchen', 'dish', 'order_aggregate'].map(t => (
          <button
            key={t}
            onClick={() => toggleType(t)}
            className={clsx(
              "pointer-events-auto px-2 py-1 text-xs rounded border transition-colors",
              visibleTypes.has(t) ? "bg-cyan/10 border-cyan text-cyan" : "bg-surface border-border text-muted"
            )}
          >
            {t.replace('_', ' ')}
          </button>
        ))}
      </div>
    </div>
  )
}
