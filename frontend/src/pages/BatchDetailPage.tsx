import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ExternalLink, ThermometerSnowflake, ShieldAlert } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { StatusBadge } from '../components/common/StatusBadge'
import { Button } from '../components/common/Button'
import { Skeleton } from '../components/common/Skeleton'
import { ErrorState } from '../components/common/ErrorState'
import { safeFormatDate, safeFormatTime } from '../utils/date'
import { apiClient } from '../api/client'

export default function BatchDetailPage() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const { data: batch, isLoading, error } = useQuery({
    queryKey: ['batch', code],
    queryFn: () => apiClient.batches.detail(code!),
  })

  if (error) return <div className="p-8 max-w-7xl mx-auto"><ErrorState message={(error as Error).message} /></div>

  const isCritical = batch?.status === 'CRITICAL'

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-border/60">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-xs text-text-muted hover:text-text-primary mb-2 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> &larr; Back
          </button>
          <div className="flex items-center space-x-3">
            {isLoading ? (
              <Skeleton className="h-8 w-48 rounded-lg" />
            ) : (
              <>
                <h1 className="text-3xl font-extrabold text-text-primary tracking-tight font-mono">
                  {batch?.code}
                </h1>
                <StatusBadge status={batch?.status || 'NORMAL'} />
              </>
            )}
          </div>
          {isLoading ? (
            <Skeleton className="h-4 w-64 mt-1" />
          ) : (
            <div className="flex items-center space-x-2 text-xs text-text-muted mt-1">
              <span className="font-semibold text-text-primary">{batch?.ingredient}</span>
              <span>&middot;</span>
              <span className="text-cyan cursor-pointer hover:underline font-semibold" onClick={() => navigate('/suppliers')}>
                {batch?.supplier_name}
              </span>
            </div>
          )}
        </div>
        <Button onClick={() => navigate(`/recalls/${code}`)} className="font-bold shadow-cyan-glow">
          <ExternalLink className="w-4 h-4 mr-2" /> Open Blast Radius Trace
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Batch Provenance Card */}
        <div className="bg-surface border border-border rounded-xl p-6 space-y-5 shadow-card">
          <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5 pb-3 border-b border-border">
            <span>Batch Metadata & Provenance</span>
          </h2>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full rounded-lg" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          ) : (
            <dl className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-border/60">
                <dt className="text-text-muted">Total Quantity</dt>
                <dd className="font-mono font-bold text-text-primary text-sm">{batch?.qty_kg} kg</dd>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border/60">
                <dt className="text-text-muted">Received Date</dt>
                <dd className="font-medium text-text-primary">{safeFormatDate(batch?.received_at, 'MMM dd, yyyy HH:mm')}</dd>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-border/60">
                <dt className="text-text-muted">Expiry Date</dt>
                <dd className="font-medium text-text-primary">{safeFormatDate(batch?.expiry, 'MMM dd, yyyy')}</dd>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <dt className="text-text-muted">Quality Flag</dt>
                <dd><StatusBadge status={batch?.status || 'NORMAL'} /></dd>
              </div>
            </dl>
          )}
        </div>

        {/* Cold-Chain Chart */}
        <div className="lg:col-span-2 bg-surface border border-border rounded-xl p-6 shadow-card flex flex-col">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-border">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-secondary flex items-center gap-1.5">
              <ThermometerSnowflake className="w-4 h-4 text-cyan" />
              <span>Cold Chain Temperature Log (IoT Sensors)</span>
            </h2>
            {isCritical && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red bg-red-subtle px-2 py-0.5 rounded border border-red/40">
                <ShieldAlert className="w-3 h-3" /> Breach Detected (14.2°C)
              </span>
            )}
          </div>

          <div className="h-80 w-full flex-1">
            {isLoading ? (
              <Skeleton className="w-full h-full rounded-xl" />
            ) : !batch?.temp_readings?.length ? (
              <div className="w-full h-full flex items-center justify-center text-text-muted text-xs">
                No temperature sensor telemetry available for this batch.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={batch.temp_readings} margin={{ top: 10, right: 25, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1B2737" vertical={false} />
                  <XAxis
                    dataKey="ts"
                    tickFormatter={(val) => safeFormatTime(val)}
                    stroke="#64748B"
                    fontSize={11}
                    tickMargin={10}
                  />
                  <YAxis stroke="#64748B" fontSize={11} tickMargin={10} unit="°C" domain={[0, 18]} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#131B28', borderColor: '#26374D', color: '#F1F5F9', borderRadius: '10px', fontSize: '12px' }}
                    labelFormatter={(val) => safeFormatDate(val, 'MMM dd, yyyy HH:mm:ss')}
                  />
                  <ReferenceLine y={8} stroke="#EF4444" strokeDasharray="4 4" label={{ position: 'top', value: 'Critical Safe Limit (8°C)', fill: '#EF4444', fontSize: 11, fontWeight: 'bold' }} />
                  <Line
                    type="monotone"
                    dataKey="celsius"
                    stroke="#00E5FF"
                    strokeWidth={2.5}
                    dot={(props: any) => {
                      const isDanger = props.payload.celsius > 8
                      return (
                        <circle
                          key={props.key || props.cx}
                          cx={props.cx}
                          cy={props.cy}
                          r={isDanger ? 6 : 4}
                          fill={isDanger ? '#EF4444' : '#0D131D'}
                          stroke={isDanger ? '#EF4444' : '#00E5FF'}
                          strokeWidth={2}
                          className={isDanger ? 'animate-pulse' : ''}
                        />
                      )
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
