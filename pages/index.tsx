import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import { v4 as uuidv4 } from 'uuid'
import styles from '../styles/app.module.css'

type Message = { role: 'user' | 'assistant'; content: string }
type Analysis = { id: string; created_at: string; property_type: string; neighborhood: string; risk_level: string; recommendation: string; price: number; market_value: number }

export default function Home() {
  const [tab, setTab] = useState<'chat' | 'analyze' | 'history'>('chat')
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Olá! Sou o **IMOV.IA**, seu analista estratégico imobiliário.\n\nPosso te ajudar a avaliar imóveis de leilão, analisar matrículas, calcular ROI de flipping, entender regularizações e muito mais.\n\nComo posso ajudar hoje?' }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [convId] = useState(() => uuidv4())
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Analyze form
  const [formData, setFormData] = useState({
    property_type: 'Apartamento', neighborhood: '', area_m2: '', price: '',
    market_value: '', origin: 'Leilão Judicial', occupation: 'Desocupado',
    renovation_level: 'Desconhecido', objective: 'House Flipping (revenda)', notes: ''
  })
  const [files, setFiles] = useState<File[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<string | null>(null)
  const [analysisRisk, setAnalysisRisk] = useState<string | null>(null)

  // History
  const [history, setHistory] = useState<Analysis[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  useEffect(() => {
    if (tab === 'history') fetchHistory()
  }, [tab])

  async function fetchHistory() {
    setLoadingHistory(true)
    const res = await fetch('/api/analyses')
    const data = await res.json()
    setHistory(Array.isArray(data) ? data : [])
    setLoadingHistory(false)
  }

  async function sendMessage(text?: string) {
    const msg = text ?? input.trim()
    if (!msg || loading) return
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: msg }]
    setMessages(newMessages)
    setLoading(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages, conversationId: convId })
      })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: '⚠️ Erro de conexão. Tente novamente.' }])
    }
    setLoading(false)
  }

  async function runAnalysis() {
    setAnalyzing(true)
    setAnalysisResult(null)
    const fd = new FormData()
    Object.entries(formData).forEach(([k, v]) => fd.append(k, v))
    files.forEach(f => fd.append('documents', f))
    try {
      const res = await fetch('/api/analyze', { method: 'POST', body: fd })
      const data = await res.json()
      setAnalysisResult(data.result)
      setAnalysisRisk(data.riskLevel)
      setTab('chat')
      setMessages(prev => [...prev,
        { role: 'user', content: `Analise o imóvel: ${formData.property_type} em ${formData.neighborhood || 'não informado'}` },
        { role: 'assistant', content: data.result }
      ])
    } catch {
      setAnalysisResult('Erro ao processar análise.')
    }
    setAnalyzing(false)
  }

  const riskColor = (r: string) => r === 'Alto' ? '#E24B4A' : r === 'Médio' ? '#EF9F27' : '#1D9E75'
  const recomIcon = (r: string) => r === 'Comprar' ? '✅' : r === 'Comprar com Cautela' ? '⚠️' : '🚫'

  function formatMessage(text: string) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
  }

  return (
    <>
      <Head>
        <title>IMOV.IA — Analista Estratégico</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>

      <div className={styles.app}>
        {/* SIDEBAR */}
        <aside className={styles.sidebar}>
          <div className={styles.logo}>
            <div className={styles.logoMark}>IM</div>
            <div>
              <div className={styles.logoText}>IMOV<span>.IA</span></div>
              <div className={styles.logoSub}>Analista Estratégico</div>
            </div>
          </div>

          <div className={styles.navSection}>
            <div className={styles.navLabel}>Menu</div>
            {[
              { id: 'chat', icon: '💬', label: 'Consultor IA' },
              { id: 'analyze', icon: '🔍', label: 'Nova Análise' },
              { id: 'history', icon: '📂', label: 'Histórico' },
            ].map(item => (
              <button key={item.id} className={`${styles.navItem} ${tab === item.id ? styles.active : ''}`} onClick={() => setTab(item.id as any)}>
                <span className={styles.navIcon}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          <div className={styles.sidebarBottom}>
            <div className={styles.agentCard}>
              <div className={styles.agentDot} />
              <div>
                <div className={styles.agentName}>IMOV.IA</div>
                <div className={styles.agentRole}>Ativo e pronto</div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className={styles.main}>
          <header className={styles.header}>
            <div className={styles.headerTitle}>
              {tab === 'chat' && 'Consultor IA'}
              {tab === 'analyze' && 'Nova Análise de Imóvel'}
              {tab === 'history' && 'Histórico de Análises'}
            </div>
            <div className={styles.headerStatus}>
              <span className={styles.statusDot} />
              <span>Agente ativo</span>
            </div>
          </header>

          {/* CHAT TAB */}
          {tab === 'chat' && (
            <div className={styles.chatWrapper}>
              <div className={styles.chatMessages}>
                {messages.map((m, i) => (
                  <div key={i} className={`${styles.message} ${m.role === 'user' ? styles.userMsg : styles.agentMsg}`}>
                    <div className={`${styles.avatar} ${m.role === 'user' ? styles.avatarUser : styles.avatarAgent}`}>
                      {m.role === 'user' ? 'P' : 'IA'}
                    </div>
                    <div className={styles.bubble} dangerouslySetInnerHTML={{ __html: formatMessage(m.content) }} />
                  </div>
                ))}
                {loading && (
                  <div className={`${styles.message} ${styles.agentMsg}`}>
                    <div className={`${styles.avatar} ${styles.avatarAgent}`}>IA</div>
                    <div className={styles.typingBubble}>
                      <span /><span /><span />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className={styles.inputArea}>
                <div className={styles.quickActions}>
                  {['🏦 Leilão Caixa', '📈 Calcular ROI', '📋 Regularização CNIB', '⚠️ Riscos de penhora'].map(q => (
                    <button key={q} className={styles.quickBtn} onClick={() => sendMessage(q.replace(/^[^\s]+ /, ''))}>{q}</button>
                  ))}
                </div>
                <div className={styles.inputRow}>
                  <textarea
                    className={styles.textarea}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                    placeholder="Pergunte sobre leilões, matrículas, ROI, regularização..."
                    rows={1}
                  />
                  <button className={styles.sendBtn} onClick={() => sendMessage()} disabled={loading}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ANALYZE TAB */}
          {tab === 'analyze' && (
            <div className={styles.analyzeWrapper}>
              <div className={styles.analyzeGrid}>

                <div className={`${styles.card} ${styles.fullWidth}`}>
                  <div className={styles.cardHeader}><span>📄</span> Upload de Documentos</div>
                  <label className={styles.uploadZone}>
                    <input type="file" accept=".pdf" multiple onChange={e => setFiles(Array.from(e.target.files ?? []))} style={{ display: 'none' }} />
                    <div className={styles.uploadIcon}>📎</div>
                    <div className={styles.uploadTitle}>Arraste PDFs ou clique para selecionar</div>
                    <div className={styles.uploadSub}>Matrícula · Edital de Leilão · Certidões · Laudos</div>
                  </label>
                  {files.length > 0 && (
                    <div className={styles.fileChips}>
                      {files.map(f => <span key={f.name} className={styles.chip}>📄 {f.name}</span>)}
                    </div>
                  )}
                </div>

                <div className={styles.card}>
                  <div className={styles.cardHeader}><span>🏠</span> Dados do Imóvel</div>
                  {[
                    { label: 'Tipo', key: 'property_type', type: 'select', options: ['Apartamento', 'Casa', 'Terreno', 'Comercial'] },
                    { label: 'Bairro / Cidade', key: 'neighborhood', type: 'text', placeholder: 'Ex: Jacarepaguá, RJ' },
                    { label: 'Área (m²)', key: 'area_m2', type: 'number', placeholder: 'Ex: 75' },
                    { label: 'Lance / Preço (R$)', key: 'price', type: 'text', placeholder: 'Ex: 180000' },
                    { label: 'Valor de Mercado (R$)', key: 'market_value', type: 'text', placeholder: 'Ex: 320000' },
                    { label: 'Origem', key: 'origin', type: 'select', options: ['Leilão Judicial', 'Leilão Caixa', 'Venda Direta', 'Particular'] },
                  ].map(f => (
                    <div className={styles.fieldGroup} key={f.key}>
                      <label className={styles.fieldLabel}>{f.label}</label>
                      {f.type === 'select' ? (
                        <select className={styles.fieldInput} value={(formData as any)[f.key]} onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}>
                          {f.options!.map(o => <option key={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input className={styles.fieldInput} type={f.type} placeholder={f.placeholder} value={(formData as any)[f.key]} onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))} />
                      )}
                    </div>
                  ))}
                </div>

                <div className={styles.card}>
                  <div className={styles.cardHeader}><span>⚙️</span> Situação & Contexto</div>
                  {[
                    { label: 'Ocupação', key: 'occupation', options: ['Desocupado', 'Ocupado pelo devedor', 'Locado a terceiros', 'Abandonado'] },
                    { label: 'Nível de Reforma', key: 'renovation_level', options: ['Desconhecido', 'Leve (estética)', 'Média (estrutura parcial)', 'Pesada (estrutural)'] },
                    { label: 'Objetivo', key: 'objective', options: ['House Flipping (revenda)', 'Renda (aluguel)', 'Uso próprio', 'Consultoria para cliente'] },
                  ].map(f => (
                    <div className={styles.fieldGroup} key={f.key}>
                      <label className={styles.fieldLabel}>{f.label}</label>
                      <select className={styles.fieldInput} value={(formData as any)[f.key]} onChange={e => setFormData(p => ({ ...p, [f.key]: e.target.value }))}>
                        {f.options.map(o => <option key={o}>{o}</option>)}
                      </select>
                    </div>
                  ))}
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Observações</label>
                    <textarea className={styles.fieldInput} rows={4} placeholder="Informações adicionais..." value={formData.notes} onChange={e => setFormData(p => ({ ...p, notes: e.target.value }))} />
                  </div>
                </div>

                <button className={`${styles.analyzeBtn} ${styles.fullWidth}`} onClick={runAnalysis} disabled={analyzing}>
                  {analyzing ? '⏳ Analisando...' : '🔍 Iniciar Análise Estratégica'}
                </button>
              </div>
            </div>
          )}

          {/* HISTORY TAB */}
          {tab === 'history' && (
            <div className={styles.historyWrapper}>
              {loadingHistory && <div className={styles.loading}>Carregando histórico...</div>}
              {!loadingHistory && history.length === 0 && (
                <div className={styles.empty}>Nenhuma análise salva ainda. Faça sua primeira análise!</div>
              )}
              {history.map(a => (
                <div key={a.id} className={styles.historyCard}>
                  <div className={styles.historyLeft}>
                    <div className={styles.historyType}>{a.property_type || '—'}</div>
                    <div className={styles.historyLocation}>{a.neighborhood || 'Localização não informada'}</div>
                    <div className={styles.historyDate}>{new Date(a.created_at).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <div className={styles.historyRight}>
                    {a.price && <div className={styles.historyPrice}>R$ {Number(a.price).toLocaleString('pt-BR')}</div>}
                    {a.risk_level && (
                      <div className={styles.riskBadge} style={{ color: riskColor(a.risk_level), borderColor: riskColor(a.risk_level) + '44', background: riskColor(a.risk_level) + '18' }}>
                        {a.risk_level}
                      </div>
                    )}
                    {a.recommendation && <div className={styles.recom}>{recomIcon(a.recommendation)} {a.recommendation}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </>
  )
}
