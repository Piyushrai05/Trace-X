import axios from 'axios'
import type {
  OverviewResponse, RecallListItem, ImpactSummary, GraphPayload,
  BatchDetail, KitchenSummary, KitchenDetail, SupplierSummary, SupplierDetail,
  ComplaintItem, ReverseInvestigationResponse, RegulatoryNoticeResponse, ContainmentDispatchResponse,
  RecallTasksResponse, UpdateTaskResponse, TaskStatus,
  TimelineReplayResponse, SimulateIncidentResponse, ResetDemoResponse, AskGraphResponse
} from '../types'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor for auth (demo token)
api.interceptors.request.use((config) => {
  return config
})

// Response interceptor with retry logic
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config
    if (!config._retryCount) config._retryCount = 0
    if (config._retryCount < 2 && error.code === 'ECONNABORTED') {
      config._retryCount++
      await new Promise(r => setTimeout(r, 1000 * config._retryCount))
      return api(config)
    }
    return Promise.reject(error)
  }
)

export const apiClient = {
  health: () => api.get<{ status: string; neo4j: string; latency_ms: number }>('/api/health').then(r => r.data),
  overview: () => api.get<OverviewResponse>('/api/overview').then(r => r.data),
  
  recalls: {
    list: () => api.get<RecallListItem[]>('/api/recalls').then(r => r.data),
    impact: (code: string) => api.get<ImpactSummary>(`/api/recalls/${code}/impact`).then(r => r.data),
    graph: (code: string, expand?: string) => api.get<GraphPayload>(`/api/recalls/${code}/graph${expand ? `?expand=${expand}` : ''}`).then(r => r.data),
    initiate: (code: string) => api.post<{ batch_code: string; previous_status: string; new_status: string; impact: ImpactSummary }>(`/api/recalls/${code}/initiate`).then(r => r.data),
    timeline: (code: string, bucket: string = '1h') => api.get<TimelineReplayResponse>(`/api/recalls/${code}/timeline?bucket=${bucket}`).then(r => r.data),
  },
  
  tasks: {
    getRecallTasks: (batch_code: string) => api.get<RecallTasksResponse>(`/api/recalls/${batch_code}/tasks`).then(r => r.data),
    updateTask: (task_id: string, status: TaskStatus, note?: string) => api.patch<UpdateTaskResponse>(`/api/tasks/${task_id}`, { status, note }).then(r => r.data),
  },

  demo: {
    simulateIncident: (batch_code?: string) => api.post<SimulateIncidentResponse>('/api/demo/simulate-incident', { batch_code }).then(r => r.data),
    reset: () => api.post<ResetDemoResponse>('/api/demo/reset').then(r => r.data),
  },

  ask: {
    query: (question: string) => api.post<AskGraphResponse>('/api/ask', { question }).then(r => r.data),
  },

  investigations: {
    reverse: (complaint_ids: string[]) => api.post<ReverseInvestigationResponse>('/api/investigations/reverse', { complaint_ids }).then(r => r.data),
  },
  
  batches: {
    detail: (code: string) => api.get<BatchDetail>(`/api/batches/${code}`).then(r => r.data),
  },
  
  kitchens: {
    list: () => api.get<KitchenSummary[]>('/api/kitchens').then(r => r.data),
    detail: (id: string) => api.get<KitchenDetail>(`/api/kitchens/${id}`).then(r => r.data),
  },
  
  suppliers: {
    list: () => api.get<SupplierSummary[]>('/api/suppliers').then(r => r.data),
    detail: (id: string) => api.get<SupplierDetail>(`/api/suppliers/${id}`).then(r => r.data),
  },
  
  complaints: {
    search: (q: string) => api.get<ComplaintItem[]>(`/api/complaints?q=${encodeURIComponent(q)}`).then(r => r.data),
  },

  copilot: {
    generateNotice: (batch_code: string, language?: string) => 
      api.post<RegulatoryNoticeResponse>('/api/copilot/generate-notice', { batch_code, language }).then(r => r.data),
    containmentDispatch: (batch_code: string, action_channels?: string[]) => 
      api.post<ContainmentDispatchResponse>('/api/copilot/containment-dispatch', { batch_code, action_channels }).then(r => r.data),
  },

  carto: {
    status: () => api.get<{ status: string; endpoint: string; connected: boolean; rate_limit_remaining: number }>('/api/carto/status').then(r => r.data),
    query: (query: string) => api.post<{ status: string; result: any }>('/api/carto/query', { query }).then(r => r.data),
  }
}


