import { useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Tooltip, Circle } from 'react-leaflet'
import { Network, Map as MapIcon, ChevronRight, Activity, Layers, Key, Check } from 'lucide-react'
import { clsx } from 'clsx'
import type { CityCluster } from '../../types'
import { useNavigate } from 'react-router-dom'

interface SupplyNetworkMapProps {
  clusters?: CityCluster[]
  loading?: boolean
  className?: string
}

interface HubNode {
  id: string
  name: string
  kitchenCount: number
  x: number // SVG percentage
  y: number // SVG percentage
  lat: number
  lng: number
  hasCritical: boolean
  hasMonitoring: boolean
  description: string
  activeBatches: number
}

// Available CARTO Basemap & Custom Layers
const CARTO_LAYERS = {
  dark_matter: {
    name: 'CARTO Dark Matter',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO &copy; OpenStreetMap',
  },
  voyager: {
    name: 'CARTO Voyager (Streets & Logistics)',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO &copy; OpenStreetMap',
  },
  positron: {
    name: 'CARTO Positron (High-Contrast)',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO &copy; OpenStreetMap',
  },
  custom_mcp: {
    name: 'CARTO Custom Layer (ac_h638h7fo)',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', // Seamless fallback while token is entered
    attribution: '&copy; CARTO MCP ac_h638h7fo',
  },
}

export function SupplyNetworkMap({ clusters = [], loading, className }: SupplyNetworkMapProps) {
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState<'topology' | 'geo'>('topology')
  const [selectedHub, setSelectedHub] = useState<HubNode | null>(null)
  const [activeCartoLayer, setActiveCartoLayer] = useState<keyof typeof CARTO_LAYERS>('dark_matter')
  const [showLayerMenu, setShowLayerMenu] = useState(false)
  const [showCartoConfig, setShowCartoConfig] = useState(false)
  const [cartoApiKey, setCartoApiKey] = useState(localStorage.getItem('carto_api_key') || '')
  const [savedKey, setSavedKey] = useState(false)

  // Map cluster data to our 5 Delhi NCR Hub Nodes
  const clusterMap = new Map(clusters.map(c => [c.city.toLowerCase(), c]))

  const getCluster = (cityName: string) => clusterMap.get(cityName.toLowerCase())

  const hubs: HubNode[] = [
    {
      id: 'delhi',
      name: 'Delhi',
      kitchenCount: getCluster('Delhi')?.kitchen_count || 48,
      x: 50,
      y: 44,
      lat: 28.6139,
      lng: 77.2090,
      hasCritical: getCluster('Delhi')?.has_critical ?? true,
      hasMonitoring: false,
      description: 'Central Hub · High Density Fulfillment',
      activeBatches: 1840,
    },
    {
      id: 'gurugram',
      name: 'Gurugram',
      kitchenCount: getCluster('Gurugram')?.kitchen_count || 27,
      x: 24,
      y: 62,
      lat: 28.4595,
      lng: 77.0266,
      hasCritical: false,
      hasMonitoring: getCluster('Gurugram')?.has_monitoring ?? true,
      description: 'Cyber City & Sohna Corridor',
      activeBatches: 940,
    },
    {
      id: 'noida',
      name: 'Noida',
      kitchenCount: getCluster('Noida')?.kitchen_count || 31,
      x: 76,
      y: 56,
      lat: 28.5355,
      lng: 77.3910,
      hasCritical: getCluster('Noida')?.has_critical ?? true,
      hasMonitoring: false,
      description: 'Expressway & Sector Hubs (CRITICAL RECALL)',
      activeBatches: 1120,
    },
    {
      id: 'ghaziabad',
      name: 'Ghaziabad',
      kitchenCount: getCluster('Ghaziabad')?.kitchen_count || 12,
      x: 74,
      y: 20,
      lat: 28.6692,
      lng: 77.4538,
      hasCritical: false,
      hasMonitoring: false,
      description: 'Indirapuram & Vaishali Sector',
      activeBatches: 460,
    },
    {
      id: 'faridabad',
      name: 'Faridabad',
      kitchenCount: getCluster('Faridabad')?.kitchen_count || 10,
      x: 55,
      y: 80,
      lat: 28.4089,
      lng: 77.3178,
      hasCritical: false,
      hasMonitoring: false,
      description: 'Industrial Corridor & Bypass Hubs',
      activeBatches: 380,
    },
  ]

  // Routes between hubs
  const routes = [
    { from: 'delhi', to: 'noida', isCritical: true, label: 'Expressway Line (Contaminated Path)' },
    { from: 'delhi', to: 'gurugram', isCritical: false, label: 'NH-48 Corridor' },
    { from: 'delhi', to: 'ghaziabad', isCritical: false, label: 'GT Road Link' },
    { from: 'delhi', to: 'faridabad', isCritical: false, label: 'Mathura Road' },
    { from: 'noida', to: 'faridabad', isCritical: false, label: 'FNG Link' },
    { from: 'ghaziabad', to: 'noida', isCritical: false, label: 'Noida-Ghaziabad Link' },
  ]

  const getHub = (id: string) => hubs.find(h => h.id === id)!

  const handleSaveCartoKey = (e: React.FormEvent) => {
    e.preventDefault()
    localStorage.setItem('carto_api_key', cartoApiKey.trim())
    setSavedKey(true)
    setTimeout(() => {
      setSavedKey(false)
      setShowCartoConfig(false)
    }, 1200)
  }

  return (
    <div className={clsx('relative bg-surface border border-border rounded-xl flex flex-col overflow-hidden shadow-card', className)}>
      {/* Header Bar with Mode Switcher & CARTO Controls */}
      <div className="p-4 border-b border-border bg-surface-elevated flex flex-wrap items-center justify-between gap-3 z-20">
        <div className="flex items-center space-x-3">
          <div className="w-2 h-2 rounded-full bg-cyan animate-pulse" />
          <div>
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              Supply Network Map
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-cyan/10 border border-cyan/30 text-cyan">
                CARTO Spatial &bull; Delhi NCR
              </span>
            </h2>
          </div>
        </div>

        {/* View Toggle & CARTO Basemap Switcher */}
        <div className="flex items-center space-x-2">
          {/* CARTO Layer Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowLayerMenu(!showLayerMenu)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-surface-subtle border border-border text-xs text-text-secondary hover:text-text-primary transition-colors"
              title="Change CARTO Basemap Layer"
            >
              <Layers className="w-3.5 h-3.5 text-cyan" />
              <span className="hidden sm:inline">{CARTO_LAYERS[activeCartoLayer].name}</span>
            </button>

            {showLayerMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-surface-elevated border border-border-bright rounded-xl shadow-2xl p-2 z-50 space-y-1">
                <div className="text-[10px] font-bold uppercase tracking-wider text-text-muted px-2 py-1">
                  CARTO Basemap Styles
                </div>
                {Object.entries(CARTO_LAYERS).map(([key, layer]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveCartoLayer(key as keyof typeof CARTO_LAYERS)
                      setShowLayerMenu(false)
                      if (viewMode === 'topology') setViewMode('geo')
                    }}
                    className={clsx(
                      'w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors',
                      activeCartoLayer === key ? 'bg-cyan text-bg font-bold' : 'text-text-primary hover:bg-surface'
                    )}
                  >
                    <span>{layer.name}</span>
                    {activeCartoLayer === key && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
                <div className="pt-2 border-t border-border mt-1 px-1">
                  <button
                    onClick={() => {
                      setShowCartoConfig(true)
                      setShowLayerMenu(false)
                    }}
                    className="w-full text-left text-[11px] text-cyan hover:underline flex items-center gap-1 py-1"
                  >
                    <Key className="w-3 h-3" />
                    <span>Configure CARTO Token (ac_h638h7fo)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center space-x-1 bg-surface-subtle p-1 rounded-lg border border-border">
            <button
              onClick={() => setViewMode('topology')}
              className={clsx(
                'flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                viewMode === 'topology'
                  ? 'bg-cyan text-bg font-semibold shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <Network className="w-3.5 h-3.5" />
              <span>Topology</span>
            </button>
            <button
              onClick={() => setViewMode('geo')}
              className={clsx(
                'flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                viewMode === 'geo'
                  ? 'bg-cyan text-bg font-semibold shadow-sm'
                  : 'text-text-muted hover:text-text-primary'
              )}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Geo Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Visualization Canvas */}
      <div className="flex-1 relative bg-bg min-h-[440px] overflow-hidden command-grid">
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-bg/80 z-20">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-8 h-8 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-text-muted">Loading network hubs...</p>
            </div>
          </div>
        ) : viewMode === 'topology' ? (
          /* =========================================================================
             MODE 1: Interactive SVG Network Topology Diagram (Exact Match to Mockup)
             ========================================================================= */
          <div className="w-full h-full relative flex items-center justify-center p-6 select-none">
            {/* Legend Overlay at Top Right */}
            <div className="absolute top-4 right-4 z-10 bg-surface/90 border border-border/80 backdrop-blur-md px-3 py-2 rounded-lg text-xs space-y-1.5 shadow-lg hidden sm:block">
              <div className="flex items-center space-x-2 text-text-secondary">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan border border-cyan/60" />
                <span>Active Network Hub</span>
              </div>
              <div className="flex items-center space-x-2 text-text-secondary">
                <span className="w-2.5 h-2.5 rounded-full bg-red border border-red/60 animate-pulse" />
                <span>Active Recall Alert (Noida)</span>
              </div>
            </div>

            {/* SVG Connecting Beams */}
            <svg className="w-full h-full absolute inset-0 pointer-events-none" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="cyanLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#0891B2" stopOpacity="0.4" />
                </linearGradient>
                <linearGradient id="redLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#EF4444" stopOpacity="1" />
                  <stop offset="100%" stopColor="#B91C1C" stopOpacity="0.7" />
                </linearGradient>
                <filter id="glowCyan" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="glowRed" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="6" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Render Connection Lines */}
              {routes.map((route, i) => {
                const f = getHub(route.from)
                const t = getHub(route.to)
                const x1 = (f.x / 100) * 1000
                const y1 = (f.y / 100) * 600
                const x2 = (t.x / 100) * 1000
                const y2 = (t.y / 100) * 600

                return (
                  <g key={i}>
                    <line
                      x1={x1}
                      y1={y1}
                      x2={x2}
                      y2={y2}
                      stroke={route.isCritical ? '#EF4444' : '#0891B2'}
                      strokeWidth={route.isCritical ? 4 : 2}
                      strokeOpacity={route.isCritical ? 0.9 : 0.4}
                      filter={route.isCritical ? 'url(#glowRed)' : 'url(#glowCyan)'}
                    />
                    {route.isCritical && (
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#FF8A8A"
                        strokeWidth={4}
                        strokeDasharray="12 16"
                        className="animate-pulse"
                      />
                    )}
                  </g>
                )
              })}
            </svg>

            {/* Interactive Hub Nodes */}
            <div className="w-full h-full relative">
              {hubs.map(hub => {
                const isRed = hub.hasCritical && hub.id === 'noida'
                const isSelected = selectedHub?.id === hub.id
                const sizeClass = hub.id === 'delhi' ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-18 h-18 sm:w-20 sm:h-20'

                return (
                  <div
                    key={hub.id}
                    style={{ left: `${hub.x}%`, top: `${hub.y}%` }}
                    className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center cursor-pointer group z-10"
                    onClick={() => setSelectedHub(hub)}
                  >
                    {isRed && (
                      <div className="absolute inset-0 -m-3 rounded-full bg-red/30 animate-ping pointer-events-none" />
                    )}

                    <div
                      className={clsx(
                        'relative rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-card',
                        sizeClass,
                        isRed
                          ? 'bg-red-dim/90 border-[3px] border-red text-text-primary shadow-red-glow hover:scale-105'
                          : 'bg-surface-elevated/95 border-[3px] border-cyan text-cyan hover:border-cyan-bright hover:scale-105',
                        isSelected && 'ring-4 ring-cyan/40 scale-110'
                      )}
                    >
                      {hub.id === 'delhi' && (
                        <div className="absolute inset-1.5 rounded-full border border-cyan/40 pointer-events-none" />
                      )}

                      <span className={clsx('font-mono font-bold', hub.id === 'delhi' ? 'text-2xl sm:text-3xl text-text-primary' : 'text-xl sm:text-2xl')}>
                        {hub.kitchenCount}
                      </span>
                    </div>

                    <div className="mt-2 text-center">
                      <span className={clsx(
                        'text-xs sm:text-sm font-semibold tracking-wide block transition-colors',
                        isRed ? 'text-red-bright' : 'text-text-primary group-hover:text-cyan'
                      )}>
                        {hub.name}
                      </span>
                      <span className="text-[10px] text-text-muted hidden sm:inline-block">
                        {hub.kitchenCount} kitchens
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Hub Detail Drawer / Flyout when a node is clicked */}
            {selectedHub && (
              <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 bg-surface-elevated/95 border border-border-bright backdrop-blur-xl p-4 rounded-xl shadow-2xl z-30 animate-in fade-in slide-in-from-bottom-3 duration-200">
                <div className="flex items-start justify-between pb-2 border-b border-border">
                  <div>
                    <h4 className="text-sm font-bold text-text-primary flex items-center gap-1.5">
                      {selectedHub.name} Kitchen Hub
                      {selectedHub.hasCritical ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red/20 text-red border border-red/40 font-semibold">
                          ALERT
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-green/20 text-green border border-green/40">
                          NORMAL
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-text-muted">{selectedHub.description}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedHub(null); }}
                    className="text-text-muted hover:text-text-primary text-xs p-1"
                  >
                    ✕
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 my-3 text-xs">
                  <div className="bg-surface p-2 rounded border border-border">
                    <span className="text-text-muted block text-[10px]">Active Kitchens</span>
                    <span className="text-base font-bold text-text-primary font-mono">{selectedHub.kitchenCount}</span>
                  </div>
                  <div className="bg-surface p-2 rounded border border-border">
                    <span className="text-text-muted block text-[10px]">Tracked Batches</span>
                    <span className="text-base font-bold text-cyan font-mono">{selectedHub.activeBatches}</span>
                  </div>
                </div>

                <div className="flex space-x-2 pt-1">
                  <button
                    onClick={() => navigate('/kitchens')}
                    className="flex-1 bg-cyan text-bg text-xs font-semibold py-1.5 px-3 rounded hover:bg-cyan/90 transition-colors flex items-center justify-center gap-1"
                  >
                    <span>View Kitchens</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  {selectedHub.hasCritical && (
                    <button
                      onClick={() => navigate('/recalls/PNR-2047')}
                      className="bg-red/20 text-red border border-red/40 text-xs font-semibold py-1.5 px-3 rounded hover:bg-red/30 transition-colors"
                    >
                      Trace Recall
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* =========================================================================
             MODE 2: Leaflet Geographic Map with CARTO Basemaps & Catchment Radiuses
             ========================================================================= */
          <MapContainer
            center={[28.58, 77.25]}
            zoom={10}
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              url={CARTO_LAYERS[activeCartoLayer].url}
              attribution={CARTO_LAYERS[activeCartoLayer].attribution}
            />

            {/* Hub Delivery Catchment Radius Buffers */}
            {hubs.map(hub => (
              <Circle
                key={`catchment-${hub.id}`}
                center={[hub.lat, hub.lng]}
                radius={8000} // 8km delivery buffer
                pathOptions={{
                  color: hub.hasCritical ? '#EF4444' : '#00E5FF',
                  fillColor: hub.hasCritical ? '#EF4444' : '#00E5FF',
                  fillOpacity: 0.06,
                  weight: 1,
                  dashArray: '4 6',
                }}
              />
            ))}

            {/* Clustered Hub Markers */}
            {hubs.map(hub => (
              <CircleMarker
                key={hub.id}
                center={[hub.lat, hub.lng]}
                radius={Math.max(16, Math.min(32, hub.kitchenCount * 0.7))}
                pathOptions={{
                  color: hub.hasCritical ? '#EF4444' : '#00E5FF',
                  fillColor: hub.hasCritical ? '#7F1D1D' : '#0891B2',
                  fillOpacity: 0.85,
                  weight: hub.hasCritical ? 3.5 : 2.5,
                }}
                eventHandlers={{ click: () => setSelectedHub(hub) }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={1} className="dark-tooltip">
                  <div className="bg-surface-elevated text-text-primary p-3 rounded-xl border border-border-bright shadow-2xl text-xs space-y-1">
                    <div className="font-bold flex items-center justify-between gap-2">
                      <span>{hub.name} Regional Hub</span>
                      {hub.hasCritical && <span className="text-[10px] px-1.5 py-0.5 rounded bg-red text-bg font-bold">CRITICAL</span>}
                    </div>
                    <div className="text-text-secondary">{hub.kitchenCount} Cloud Kitchens &bull; {hub.activeBatches} Batches</div>
                    <div className="text-[10px] text-cyan pt-1">Click to inspect region &rarr;</div>
                  </div>
                </Tooltip>
              </CircleMarker>
            ))}
          </MapContainer>
        )}
      </div>

      {/* CARTO Token Modal */}
      {showCartoConfig && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-surface-elevated border border-border-bright max-w-md w-full p-6 rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <h3 className="font-bold text-base text-text-primary flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan" />
                <span>CARTO MCP Configuration</span>
              </h3>
              <button onClick={() => setShowCartoConfig(false)} className="text-text-muted hover:text-text-primary">✕</button>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              Connected CARTO MCP Server: <code className="bg-surface text-cyan px-1.5 py-0.5 rounded font-mono">gcp-asia-northeast1 (ac_h638h7fo)</code>
            </p>

            <form onSubmit={handleSaveCartoKey} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-text-muted block mb-1">CARTO API Key / Access Token</label>
                <input
                  type="password"
                  value={cartoApiKey}
                  onChange={e => setCartoApiKey(e.target.value)}
                  placeholder="Paste your CARTO token..."
                  className="w-full bg-bg border border-border rounded-lg px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-cyan"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCartoConfig(false)}
                  className="px-3 py-1.5 rounded-lg bg-surface border border-border text-xs text-text-muted hover:text-text-primary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-cyan text-bg text-xs font-bold hover:bg-cyan-bright transition-colors shadow-cyan-glow"
                >
                  {savedKey ? 'Saved ✓' : 'Save & Connect'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Status Strip */}
      <div className="px-4 py-2.5 bg-surface-elevated border-t border-border flex items-center justify-between text-xs text-text-muted">
        <div className="flex items-center space-x-4">
          <span className="flex items-center gap-1.5 text-text-secondary">
            <Activity className="w-3.5 h-3.5 text-cyan" />
            Live Network Velocity: <strong className="text-text-primary font-mono">1,420 orders/hr</strong>
          </span>
        </div>
        <span className="text-[11px] text-text-muted hidden sm:inline">
          Active Layer: <strong className="text-cyan">{CARTO_LAYERS[activeCartoLayer].name}</strong>
        </span>
      </div>
    </div>
  )
}
