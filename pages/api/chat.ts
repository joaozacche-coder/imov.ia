import type { NextApiRequest, NextApiResponse } from 'next'
import { SYSTEM_PROMPT } from '../../lib/prompts'
import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()
  const { messages, conversationId } = req.body
  if (!messages || !Array.isArray(messages)) return res.status(400).json({ error: 'messages required' })
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: 'gpt-4o-mini', max_tokens: 1500, messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages] }),
    })
    const data = await response.json()
    const reply = data.choices?.[0]?.message?.content ?? 'Erro na resposta.'
    if (conversationId) {
      const sb = supabaseAdmin()
      const allMessages = [...messages, { role: 'assistant', content: reply }]
      await sb.from('conversations').upsert({ id: conversationId, messages: allMessages, title: messages[0]?.content?.slice(0, 60) ?? 'Conversa' })
    }
    return res.status(200).json({ reply })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
