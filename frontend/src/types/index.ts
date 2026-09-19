export type BatchStatus = 'NORMAL' | 'MONITORING' | 'WARNING' | 'CRITICAL' | 'RESOLVED'
export type NodeType = 'supplier' | 'batch' | 'prep_lot' | 'kitchen' | 'dish' | 'order' | 'order_aggregate' | 'customer' | 'customer_aggregate'
export type EdgeType = 'SUPPLIED' | 'USED_IN' | 'PREPARED_AT' | 'MADE_INTO' | 'SOLD_IN' | 'PLACED_BY'

export interface GraphNode {
  id: string
  type: NodeType
  label: string
  data: Record<string, unknown>
}

export interface GraphEdge {
  id: string
  source: string
  target: string
  type: EdgeType | string
}

export interface GraphPayload {
  nodes: GraphNode[]
  edges: GraphEdge[]
  meta: Record<string, number>
}

export interface ImpactSummary {
  batch_code: string
  ingredient: string
  status: BatchStatus
  supplier_name: string
  kitchen_count: number
  prep_lot_count: number
  dish_count: number
  order_count: number
  customer_count: number
  elapsed_ms: number
}

export interface RecallListItem {
  code: string
  ingredient: string
  status: BatchStatus
  supplier_name: string
  supplier_id: string
  qty_kg: number
  received_at: string
  expiry: string
  kitchen_count: number
  order_count: number
}

export interface CityCluster {
  city: string
  lat: number
  lng: number
  kitchen_count: number
  has_critical: boolean
  has_monitoring: boolean
}

export interface ActivityItem {
  id: string
  type: string
  message: string
  ts: string
  severity: string
}

export interface OverviewResponse {
  kitchen_count: number
  active_batch_count: number
  order_count: number
  active_recall_count: number
  city_clusters: CityCluster[]
  recent_activity: ActivityItem[]
  active_recalls: RecallListItem[]
}

export interface TempReading {
  ts: string
  celsius: number
}

export interface BatchDetail {
  code: string
  ingredient: string
  status: BatchStatus
  supplier_name: string
  supplier_id: string
  qty_kg: number
  received_at: string
  expiry: string
  temp_readings: TempReading[]
}

export interface KitchenSummary {
  id: string
  name: string
  city: string
  lat: number
  lng: number
  affected_batch_count: number
}

export interface KitchenDetail extends KitchenSummary {
  active_batch_count: number
  order_count_today: number
  inventory: BatchDetail[]
}

export interface SupplierSummary {
  id: string
  name: string
  city: string
  category: string
  total_batches: number
  flagged_batches: number
}

export interface SupplierDetail extends SupplierSummary {
  recent_batches: RecallListItem[]
}

export interface ComplaintItem {
  id: string
  text: string
  created_at: string
  order_id: string
  severity: string
}

export interface CandidateBatch {
  batch_code: string
  ingredient: string
  supplier_name: string
  complaint_count: number
  confidence_score: number
}

export interface StageCounts {
  complaints: number
  orders: number
  dishes: number
  prep_lots: number
  batches: number
  suppliers: number
}

export interface ReverseInvestigationResponse {
  stage_counts: StageCounts
  candidates: CandidateBatch[]
  graph: GraphPayload
  disclaimer: string
}

// AI Co-Pilot & Regulatory Package
export interface RegulatoryNoticeResponse {
  batch_code: string
  fssai_notice_markdown: string
  customer_sms_template: string
  executive_summary_bullets: string[]
  brand_financial_savings: {
    surgical_recall_loss: number
    blind_blanket_loss: number
    net_savings_usd: number
    reputation_score_saved: string
    prevented_lawsuits_est: number
  }
}

export interface DispatchedChannel {
  channel: string
  action: string
  status: string
  affected_items: number
  latency_ms: number
}

export interface ContainmentDispatchResponse {
  batch_code: string
  status: string
  containment_percentage: number
  elapsed_seconds: number
  channels_dispatched: DispatchedChannel[]
}

// Phase 10: Kitchen Action Tracker
export type TaskStatus = 'NOTIFIED' | 'ACKNOWLEDGED' | 'QUARANTINED' | 'DISPOSED'
export type RecallWorkflowStatus = 'INITIATED' | 'IN_PROGRESS' | 'CONTAINED'

export interface KitchenTaskItem {
  id: string
  recall_id: string
  kitchen_id: string
  kitchen_name: string
  kitchen_city: string
  status: TaskStatus
  updated_at: string
  updated_by: string
  note?: string
  lat?: number
  lng?: number
}

export interface StatusCounts {
  notified: number
  acknowledged: number
  quarantined: number
  disposed: number
}

export interface RecallTasksResponse {
  batch_code: string
  recall_id: string
  recall_status: RecallWorkflowStatus
  initiated_at: string
  initiated_by: string
  total_kitchens: number
  percent_complete: number
  status_counts: StatusCounts
  tasks: KitchenTaskItem[]
}

export interface UpdateTaskResponse {
  task: KitchenTaskItem
  recall_status: RecallWorkflowStatus
  percent_complete: number
  message: string
}

// Phase 11: Live Demo Mode
export interface SimulateIncidentResponse {
  batch_code: string
  previous_status: string
  new_status: string
  temp_reading_celsius: number
  events_written: string[]
  impact: ImpactSummary
  message: string
}

export interface ResetDemoResponse {
  status: string
  restored_batches_count: number
  cleared_recalls_count: number
  cleared_tasks_count: number
  cleared_events_count: number
  message: string
}

// Phase 12: Timeline Replay
export interface TimelineBucket {
  bucket_index: number
  timestamp: string
  hour_label: string
  cumulative_kitchens: number
  cumulative_prep_lots: number
  cumulative_dishes: number
  cumulative_orders: number
  cumulative_customers: number
  new_node_ids: string[]
  stage_event?: string
}

export interface TimelineReplayResponse {
  batch_code: string
  ingredient: string
  received_at: string
  flagged_at: string
  exposure_window_hours: number
  total_buckets: number
  buckets: TimelineBucket[]
  nodes_meta: Record<string, { type: string; appeared_hour: number }>
}

// Phase 13: Ask the Graph
export interface AskGraphResponse {
  question: string
  answer_summary: string
  cypher: string
  columns: string[]
  rows: Record<string, any>[]
  row_count: number
  graph?: GraphPayload
  execution_time_ms: number
  disclaimer: string
}

