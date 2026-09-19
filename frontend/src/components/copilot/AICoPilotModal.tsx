import React, { useState, useEffect } from 'react'
import { apiClient } from '../../api/client'
import type { RegulatoryNoticeResponse } from '../../types'
import { 
  Bot, FileText, MessageSquare, ShieldAlert, CheckCircle2, 
  Copy, Download, RefreshCw, X, Sparkles, Building2
} from 'lucide-react'

interface AICoPilotModalProps {
  isOpen: boolean
  onClose: () => void
  batchCode: string
  ingredient?: string
}

export const AICoPilotModal: React.FC<AICoPilotModalProps> = ({
  isOpen,
  onClose,
  batchCode,
  ingredient = 'Paneer'
}) => {
  const [activeTab, setActiveTab] = useState<'fssai' | 'sms' | 'executive' | 'roi'>('fssai')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [data, setData] = useState<RegulatoryNoticeResponse | null>(null)
  const [language, setLanguage] = useState<'en' | 'hi'>('en')

  useEffect(() => {
    if (isOpen && batchCode) {
      loadNoticeData()
    }
  }, [isOpen, batchCode, language])

  const loadNoticeData = async () => {
    setLoading(true)
    try {
      const res = await apiClient.copilot.generateNotice(batchCode, language === 'hi' ? 'Hindi' : 'English')
      setData(res)
    } catch (err) {
      console.error('Failed to generate regulatory package', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = (text: string, type: string) => {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="bg-slate-900 border border-cyan-500/30 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 text-white">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  TraceX AI Crisis Co-Pilot
                  <span className="px-2.5 py-0.5 text-xs font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> FSSAI Ready
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated regulatory submission package, customer comms, and executive briefing for Batch <strong className="text-cyan-400">{batchCode}</strong> ({ingredient})
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700 text-xs">
              <button 
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${language === 'en' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                English
              </button>
              <button 
                onClick={() => setLanguage('hi')}
                className={`px-2.5 py-1 rounded-md font-medium transition-all ${language === 'hi' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                हिंदी
              </button>
            </div>
            <button 
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-900/60 px-6 gap-2 pt-2">
          <button
            onClick={() => setActiveTab('fssai')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'fssai'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            FSSAI Form 8 Notice
          </button>
          <button
            onClick={() => setActiveTab('sms')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'sms'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Customer Alert SMS
          </button>
          <button
            onClick={() => setActiveTab('executive')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'executive'
                ? 'border-cyan-400 text-cyan-300 bg-cyan-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            Executive Synthesis
          </button>
          <button
            onClick={() => setActiveTab('roi')}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'roi'
                ? 'border-emerald-400 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-4 h-4 text-emerald-400" />
            Financial ROI Shield
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin" />
              <p className="text-sm text-slate-400 animate-pulse">
                Synthesizing multi-tier graph provenance & regulatory compliance clauses...
              </p>
            </div>
          ) : data ? (
            <>
              {/* Tab 1: FSSAI Form 8 */}
              {activeTab === 'fssai' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2 text-xs text-slate-300">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Compliant with Food Safety & Standards (Recall Procedure) Regulations, 2017</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleCopy(data.fssai_notice_markdown, 'fssai')}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-xs font-medium text-slate-200 transition"
                      >
                        {copied === 'fssai' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied === 'fssai' ? 'Copied!' : 'Copy Markdown'}
                      </button>
                      <button
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-md text-xs font-medium transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Export PDF
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-[420px] overflow-y-auto">
                    {data.fssai_notice_markdown}
                  </div>
                </div>
              )}

              {/* Tab 2: Customer Alert SMS */}
              {activeTab === 'sms' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-slate-800/80 p-3 rounded-lg border border-slate-700">
                    <span className="text-xs text-slate-300">
                      Auto-personalized for <strong>2,913 customers</strong> who placed orders containing affected dishes.
                    </span>
                    <button
                      onClick={() => handleCopy(data.customer_sms_template, 'sms')}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-xs font-medium text-slate-200 transition"
                    >
                      {copied === 'sms' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied === 'sms' ? 'Copied!' : 'Copy Template'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                      <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">SMS / WhatsApp Alert Payload</div>
                      <div className="p-4 bg-slate-900 rounded-lg border border-slate-700 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                        {data.customer_sms_template}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                        <span>Characters: {data.customer_sms_template.length}</span>
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> DLT Registered Template
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-3">
                      <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Simulated Phone Preview</div>
                      <div className="max-w-[280px] mx-auto bg-slate-900 border-2 border-slate-700 rounded-2xl p-4 shadow-xl space-y-3">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-800 pb-2">
                          <span>Sender: <strong>VK-TRACEX</strong></span>
                          <span>Just now</span>
                        </div>
                        <div className="bg-cyan-950/40 border border-cyan-500/30 p-3 rounded-lg text-xs text-cyan-100 leading-snug">
                          {data.customer_sms_template.replace('{order_id}', '#TRX-8921').replace('{dish_name}', 'Paneer Butter Masala')}
                        </div>
                        <div className="flex justify-center">
                          <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full">
                            Auto-Refund Issued: ₹340.00
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Executive Summary */}
              {activeTab === 'executive' && (
                <div className="space-y-4">
                  <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-white">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      Executive Leadership Incident Brief
                    </div>
                    <ul className="space-y-3">
                      {data.executive_summary_bullets.map((bullet, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-xs text-slate-300 bg-slate-900/80 p-3 rounded-lg border border-slate-800">
                          <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center flex-shrink-0 text-[11px] font-bold">
                            {idx + 1}
                          </span>
                          <span className="leading-relaxed">{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab 4: Financial ROI Shield */}
              {activeTab === 'roi' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-950 p-4 rounded-xl border border-red-500/30 bg-red-950/10">
                      <div className="text-xs text-red-400 font-medium">Blind Network Shutdown</div>
                      <div className="text-2xl font-bold text-red-300 mt-1">
                        ${data.brand_financial_savings.blind_blanket_loss.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Cost of shutting down all 25 cloud hubs blindly</div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/10">
                      <div className="text-xs text-cyan-400 font-medium">TraceX Precision Surgical Recall</div>
                      <div className="text-2xl font-bold text-cyan-300 mt-1">
                        ${data.brand_financial_savings.surgical_recall_loss.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Only 12 affected kitchens & specific prep lots quarantined</div>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20">
                      <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" /> Net Value Saved
                      </div>
                      <div className="text-2xl font-black text-emerald-400 mt-1">
                        ${data.brand_financial_savings.net_savings_usd.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-emerald-300 mt-1">
                        97.3% cost reduction + brand capital preserved
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 grid grid-cols-2 gap-4 text-xs">
                    <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                      <span className="text-slate-400">Reputation Index Protected:</span>
                      <strong className="text-emerald-400">{data.brand_financial_savings.reputation_score_saved}</strong>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-900 rounded-lg">
                      <span className="text-slate-400">Estimated Lawsuits Prevented:</span>
                      <strong className="text-emerald-400">{data.brand_financial_savings.prevented_lawsuits_est} Legal Actions</strong>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-slate-400">
              No data generated.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/90 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Powered by TraceX Deep Graph & LLM Copilot Engine
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
