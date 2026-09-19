import React, { useState, useEffect } from 'react'
import { 
  Search, Bot, Sparkles, Code, Table, Network, 
  CheckCircle2, X, RefreshCw, AlertCircle, Copy
} from 'lucide-react'
import { apiClient } from '../../api/client'
import type { AskGraphResponse } from '../../types'
import { TraceGraph } from '../graph/TraceGraph'

interface AskGraphModalProps {
  isOpen: boolean
  onClose: () => void
}

const SUGGESTED_QUERIES = [
  "Which suppliers provided batches with CRITICAL status?",
  "How many kitchens used batch PNR-2047?",
  "Find top 5 suppliers with most complaints.",
  "Show temperature readings for batch PNR-2047."
]

export const AskGraphModal: React.FC<AskGraphModalProps> = ({
  isOpen,
  onClose
}) => {
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AskGraphResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showCypher, setShowCypher] = useState(false)
  const [viewMode, setViewMode] = useState<'table' | 'graph'>('table')
  const [copiedCypher, setCopiedCypher] = useState(false)

  // Listen for Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        if (isOpen) onClose()
        else {
          // Open handled by parent or layout
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  const handleSearch = async (qText?: string) => {
    const queryToRun = (qText || question).trim()
    if (!queryToRun) return

    setLoading(true)
    setError(null)
    setQuestion(queryToRun)

    try {
      const res = await apiClient.ask.query(queryToRun)
      setResult(res)
    } catch (err: any) {
      console.error('Ask Graph error', err)
      const detail = err.response?.data?.detail || err.message || 'Failed to query graph with natural language.'
      setError(detail)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyCypher = () => {
    if (result?.cypher) {
      navigator.clipboard.writeText(result.cypher)
      setCopiedCypher(true)
      setTimeout(() => setCopiedCypher(false), 2000)
    }
  }

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-slate-900 border border-cyan-500/40 w-full max-w-4xl max-h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Search Bar Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white flex-shrink-0">
            <Bot className="w-5 h-5" />
          </div>

          <div className="flex-1 relative">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Ask anything about the supply chain (e.g. 'Which suppliers provided batches with CRITICAL status?')"
              className="w-full bg-slate-950 border border-slate-700/80 rounded-xl py-3 pl-10 pr-24 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 shadow-inner"
              autoFocus
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <button
              onClick={() => handleSearch()}
              disabled={loading || !question.trim()}
              className="absolute right-2 top-2 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-40"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Ask'}
            </button>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suggested Queries Chips */}
        <div className="bg-slate-950/70 border-b border-slate-800 px-6 py-2.5 flex items-center gap-2 overflow-x-auto text-xs">
          <span className="text-slate-500 font-semibold flex items-center gap-1 flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Suggestions:
          </span>
          {SUGGESTED_QUERIES.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => handleSearch(sq)}
              className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition flex-shrink-0 text-[11px]"
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="py-20 text-center space-y-3 flex flex-col items-center">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-xs text-slate-400 animate-pulse">
                Parsing question semantics, translating to parameterized read Cypher, and querying Neo4j graph...
              </p>
            </div>
          ) : error ? (
            <div className="p-5 bg-red-950/40 border border-red-500/40 rounded-xl flex items-start gap-3 text-red-200 text-xs">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-red-300">Query Guard Alert</div>
                <div>{error}</div>
              </div>
            </div>
          ) : result ? (
            <div className="space-y-4">
              {/* Answer Summary Banner */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Answer Summary
                  </div>
                  <div className="text-sm text-slate-200">{result.answer_summary}</div>
                </div>
                <div className="text-right flex-shrink-0 font-mono text-xs text-slate-400">
                  <span>{result.row_count} rows &middot; {result.execution_time_ms}ms</span>
                </div>
              </div>

              {/* View Switcher & Generated Cypher Accordion Bar */}
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setShowCypher(!showCypher)}
                  className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>{showCypher ? 'Hide Generated Cypher' : 'Show Generated Cypher'}</span>
                </button>

                {result.graph && (
                  <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                    <button
                      onClick={() => setViewMode('table')}
                      className={`flex items-center gap-1 px-3 py-1 rounded transition ${viewMode === 'table' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                    >
                      <Table className="w-3.5 h-3.5" /> Table
                    </button>
                    <button
                      onClick={() => setViewMode('graph')}
                      className={`flex items-center gap-1 px-3 py-1 rounded transition ${viewMode === 'graph' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
                    >
                      <Network className="w-3.5 h-3.5" /> Graph
                    </button>
                  </div>
                )}
              </div>

              {/* Collapsible Cypher Code Box */}
              {showCypher && (
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Generated Cypher (Read-Only Guard Active)</span>
                    <button
                      onClick={handleCopyCypher}
                      className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                    >
                      {copiedCypher ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedCypher ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="font-mono text-xs text-cyan-300 overflow-x-auto whitespace-pre-wrap">
                    {result.cypher}
                  </pre>
                </div>
              )}

              {/* Data Table or Graph View */}
              {viewMode === 'table' ? (
                <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden max-h-72 overflow-y-auto">
                  {result.rows.length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-xs">No records returned.</div>
                  ) : (
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-900 text-slate-400 sticky top-0 border-b border-slate-800 font-semibold">
                        <tr>
                          {result.columns.map((col) => (
                            <th key={col} className="p-3 uppercase tracking-wider text-[10px]">{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                        {result.rows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-slate-900/50 transition">
                            {result.columns.map((col) => {
                              const val = row[col]
                              const displayVal = typeof val === 'object' ? JSON.stringify(val) : String(val ?? '-')
                              return (
                                <td key={col} className="p-3 text-xs truncate max-w-xs">{displayVal}</td>
                              )
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              ) : (
                result.graph && (
                  <div className="h-72 rounded-xl border border-slate-800 overflow-hidden">
                    <TraceGraph data={result.graph} />
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <Bot className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-xs">Type a question above or click a suggestion chip to query the graph in natural language.</p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-[11px] text-slate-500">
          <span>{result?.disclaimer || "AI-generated query, review before relying on it."}</span>
          <span className="font-mono">Press Esc to close</span>
        </div>
      </div>
    </div>
  )
}
