import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import { v4 as uuidv4 } from 'uuid'
import styles from '../styles/app.module.css'

type Message = { role: 'user' | 'assistant'; content: string }
type Analysis = { id: string; created_at: string; property_type: string; neighborhood: string; risk_level: string; recommendation: string; price: number; market_value: number }

export default function Home() {
  const [tab, setTab] = useState<'chat' | 'analyze' | 'history'>('chat')
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: 'Olá! Sou o **IMOV.IA**, seu analista estratégico imobiliário.\n\nPosso te ajudar a avaliar imóveis de leilão, analisar matrículas, calcular ROI de flipping, entender regularizações e muito mais.\n\nComo posso ajudar hoje?' }])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [convId] = useState(() => uuidv4())
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [files, setFiles] = useState<File[]>([])
  const [analyzing, setAnalyzing] = useState(false)
  const [history, setHistory] = useState<Analysis[]>([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])
  useEffect(() => { if (tab === 'history') fetchHistory() }, [tab])

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
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: newMessages, conversationId: convId }) })
      const data = await res.json()
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro de conexão. Tente novamente.' }])
    }
    setLoading(false)
  }

  async function runAnalysis() {
    if (files.length === 0) return
    setAnalyzing(true)
    const fd = new FormData()
    files.forEach(f => fd.append('documents', f))
    try {
      const res = await fetch('/api/analyze', { method: 'POST', body: fd })
      const data = await res.json()
      setTab('chat')
      setMessages(prev => [...prev,
        { role: 'user', content: 'Analisar: ' + files.map(f => f.name).join(', ') },
        { role: 'assistant', content: data.result }
      ])
      setFiles([])
    } catch { alert('Erro ao processar análise.') }
    setAnalyzing(false)
  }

  const riskColor = (r: string) => r === 'Alto' ? '#E24B4A' : r === 'Médio' ? '#EF9F27' : '#1D9E75'
  const recomIcon = (r: string) => r === 'Comprar' ? 'OK' : r === 'Comprar com Cautela' ? 'CAUTELA' : 'EVITAR'
  const formatMessage = (text: string) => text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>')

  return (
    <>
      <Head>
        <title>IMOV.IA — Analista Estratégico</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500&display=swap" rel="stylesheet" />
      </Head>
      <div className={styles.app}>
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
            {[{id:'chat',icon:'💬',label:'Consultor IA'},{id:'analyze',icon:'🔍',label:'Nova Análise'},{id:'history',icon:'📂',label:'Histórico'}].map(item => (
              <button key={item.id} className={`${styles.navItem} ${tab === item.id ? styles.active : ''}`} onClick={() => setTab(item.id as any)}>
                <span className={styles.navIcon}>{item.icon}</span>{item.label}
              </button>
            ))}
          </div>
          <div className={styles.sidebarBottom}>
            <div className={styles.agentCard}>
              <div className={styles.agentDot} />
              <div><div className={styles.agentName}>IMOV.IA</div><div className={styles.agentRole}>Ativo e pronto</div></div>
            </div>
          </div>
        </aside>
        <main className={styles.main}>
          <header className={styles.header}>
            <div className={styles.headerTitle}>{tab === 'chat' ? 'Consultor IA' : tab === 'analyze' ? 'Análise de Documentos' : 'Histórico'}</div>
            <div className={styles.headerStatus}><span className={styles.statusDot} /><span>Agente ativo</span></div>
          </header>

          {tab === 'chat' && (
            <div className={styles.chatWrapper}>
              <div className={styles.chatMessages}>
                {messages.map((m, i) => (
                  <div key={i} className={`${styles.message} ${m.role === 'user' ? styles.userMsg : styles.agentMsg}`}>
                    <div className={`${styles.avatar} ${m.role === 'user' ? styles.avatarUser : styles.avatarAgent}`}>{m.role === 'user' ? 'P' : 'IA'}</div>
                    <div className={styles.bubble} dangerouslySetInnerHTML={{ __html: formatMessage(m.content) }} />
                  </div>
                ))}
                {loading && (
                  <div className={`${styles.message} ${styles.agentMsg}`}>
                    <div className={`${styles.avatar} ${styles.avatarAgent}`}>IA</div>
                    <div className={styles.typingBubble}><span /><span /><span /></div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className={styles.inputArea}>
                <div className={styles.quickActions}>
                  {['🏦 Leilão Caixa','📈 Calcular ROI','📋 Regularização CNIB','⚠️ Riscos de penhora'].map(q => (
                    <button key={q} className={styles.quickBtn} onClick={() => sendMessage(q.replace(/^[^\s]+ /,''))}>{q}</button>
                  ))}
                </div>
                <div className={styles.inputRow}>
                  <textarea className={styles.textarea} value={input} onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() } }}
                    placeholder="Pergunte sobre leilões, matrículas, ROI, regularização..." rows={1} />
                  <button className={styles.sendBtn} onClick={() => sendMessage()} disabled={loading}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'analyze' && (
            <div className={styles.analyzeWrapper}>
              <div className={styles.analyzeGrid}>
                <div className={`${styles.card} ${styles.fullWidth}`}>
                  <div className={styles.cardHeader}><span>📄</span> Upload de Documentos</div>
                  <label className={styles.uploadZone}>
                    <input type="file" accept=".pdf" multiple onChange={e => setFiles(Array.from(e.target.files ?? []))} style={{ display: 'none' }} />
                    <div className={styles.uploadIcon}>📎</div>
                    <div className={styles.uploadTitle}>Arraste um ou mais PDFs ou clique para selecionar</div>
                    <div className={styles.uploadSub}>Matrícula · Edital de Leilão · Certidões · Laudos · Contratos</div>
                  </label>
                  {files.length > 0 && (
                    <div className={styles.fileChips}>
                      {files.map(f => <span key={f.name} className={styles.chip}>📄 {f.name}</span>)}
                    </div>
                  )}
                </div>
                {files.length > 0 && (
                  <div className={`${styles.card} ${styles.fullWidth}`}>
                    <div style={{fontSize:'13px',color:'#888580',lineHeight:'1.6'}}>
                      ✅ <strong style={{color:'#F0EDE6'}}>{files.length} arquivo{files.length>1?'s':''} selecionado{files.length>1?'s':''}</strong> — O agente vai extrair e analisar automaticamente todos os documentos.
                    </div>
                  </div>
                )}
                <button className={`${styles.analyzeBtn} ${styles.fullWidth}`} onClick={runAnalysis} disabled={analyzing || files.length === 0}>
                  {analyzing ? '⏳ Analisando documentos...' : '🔍 Analisar Documentos'}
                </button>
              </div>
            </div>
          )}

          {tab === 'history' && (
            <div className={styles.historyWrapper}>
              {loadingHistory && <div className={styles.loading}>Carregando...</div>}
              {!loadingHistory && history.length === 0 && <div className={styles.empty}>Nenhuma análise ainda.</div>}
              {history.map(a => (
                <div key={a.id} className={styles.historyCard}>
                  <div className={styles.historyLeft}>
                    <div className={styles.historyType}>{a.property_type || '—'}</div>
                    <div className={styles.historyLocation}>{a.neighborhood || 'Localização não informada'}</div>
                    <div className={styles.historyDate}>{new Date(a.created_at).toLocaleDateString('pt-BR')}</div>
                  </div>
                  <div className={styles.historyRight}>
                    {a.price && <div className={styles.historyPrice}>R$ {Number(a.price).toLocaleString('pt-BR')}</div>}
                    {a.risk_level && <div className={styles.riskBadge} style={{color:riskColor(a.risk_level),borderColor:riskColor(a.risk_level)+'44',background:riskColor(a.risk_level)+'18'}}>{a.risk_level}</div>}
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
