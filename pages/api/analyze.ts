import type { NextApiRequest, NextApiResponse } from 'next'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'
import { supabaseAdmin } from '../../lib/supabase'
import { SYSTEM_PROMPT, ANALYSIS_PROMPT } from '../../lib/prompts'
import { v4 as uuidv4 } from 'uuid'

export const config = { api: { bodyParser: false } }

async function extractPdfText(filePath: string): Promise<string> {
  try {
    const pdfParse = (await import('pdf-parse')).default
    const buffer = fs.readFileSync(filePath)
    const result = await pdfParse(buffer)
    return result.text?.slice(0, 8000) ?? ''
  } catch {
    return ''
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const form = formidable({ multiples: true, maxFileSize: 10 * 1024 * 1024 })

  form.parse(req, async (err, fields, files) => {
    if (err) return res.status(400).json({ error: 'Form parse error' })

    const sb = supabaseAdmin()
    const analysisId = uuidv4()

    // Parse property data
    const get = (f: string) => (Array.isArray(fields[f]) ? fields[f][0] : fields[f]) ?? ''
    const propertyData = {
      id: analysisId,
      property_type: get('property_type'),
      neighborhood: get('neighborhood'),
      area_m2: parseFloat(get('area_m2')) || null,
      price: parseFloat(get('price')) || null,
      market_value: parseFloat(get('market_value')) || null,
      origin: get('origin'),
      occupation: get('occupation'),
      renovation_level: get('renovation_level'),
      objective: get('objective'),
      notes: get('notes'),
    }

    // Process uploaded PDFs
    const uploadedFiles = files.documents
      ? Array.isArray(files.documents) ? files.documents : [files.documents]
      : []

    let combinedDocText = ''
    const docRecords = []

    for (const file of uploadedFiles) {
      const extracted = await extractPdfText(file.filepath)
      combinedDocText += `\n--- ${file.originalFilename} ---\n${extracted}\n`

      // Upload to Supabase Storage
      const storagePath = `${analysisId}/${file.originalFilename}`
      const fileBuffer = fs.readFileSync(file.filepath)

      const { error: storageErr } = await sb.storage
        .from('documents')
        .upload(storagePath, fileBuffer, { contentType: 'application/pdf', upsert: true })

      if (!storageErr) {
        docRecords.push({
          analysis_id: analysisId,
          file_name: file.originalFilename,
          file_size: file.size,
          storage_path: storagePath,
          extracted_text: extracted,
        })
      }
    }

    // Build prompt
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: ANALYSIS_PROMPT(combinedDocText) }],
      }),
    })

    const aiData = await aiResponse.json()
    const resultText = aiData.content?.[0]?.text ?? 'Erro na análise.'

    // Extract risk level and recommendation
    const riskMatch = resultText.match(/📊.*?NÍVEL.*?(Baixo|Médio|Alto)/i)
    const recomMatch = resultText.match(/🎯.*?RECOMENDAÇÃO.*?\n(Comprar com Cautela|Comprar|Evitar)/i)

    const finalData = {
      ...propertyData,
      result_text: resultText,
      risk_level: riskMatch?.[1] ?? null,
      recommendation: recomMatch?.[1] ?? null,
    }

    // Save to Supabase
    const { error: analysisErr } = await sb.from('analyses').insert(finalData)
    if (!analysisErr && docRecords.length > 0) {
      await sb.from('documents').insert(docRecords)
    }

    return res.status(200).json({
      analysisId,
      result: resultText,
      riskLevel: finalData.risk_level,
      recommendation: finalData.recommendation,
    })
  })
}
