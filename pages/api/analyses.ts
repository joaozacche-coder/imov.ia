import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '../../lib/supabase'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const sb = supabaseAdmin()

  if (req.method === 'GET') {
    const { data, error } = await sb
      .from('analyses')
      .select('id, created_at, property_type, neighborhood, risk_level, recommendation, price, market_value')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json(data)
  }

  return res.status(405).end()
}
