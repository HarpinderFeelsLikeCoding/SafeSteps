import { Router } from 'express'
import OpenAI from 'openai'
import { getCrashCollection } from '../utils/mongo'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
const router = Router()

router.post('/', async (req, res) => {
  const { coordinates } = req.body as { coordinates: [number, number][] }
  const coll = await getCrashCollection()

  // embed the route summary to find semantically similar crash narratives
  const summary = `Route goes through ${coordinates.length} points.`
  const embRes = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: summary
  })
  const routeVec = embRes.data[0].embedding

  // vector search: top 20 semantically relevant crashes
  const vectorHits = await coll.aggregate([
    {
      $search: {
        knnBeta: {
          vector: routeVec,
          path: 'embedding',
          k: 20
        }
      }
    },
    { $limit: 20 }
  ]).toArray()

  // then compute safetyScore = 100 - normalized crash severity sum
  const totalSeverity = vectorHits.reduce((sum, d) => sum + (d.deaths_total + d.injuries_total), 0)
  const score = Math.max(0, Math.min(100, 100 - totalSeverity))

  // use GPT to generate recommendations
  const chat = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: 'You are an expert road-safety assistant.' },
      {
        role: 'user',
        content: `
          Given crash data narratives:
          ${vectorHits.map((d, i) => `${i+1}. ${d.narrative}`).join('\n')}
          and a safety score of ${score}, 
          provide 3 actionable recommendations for a commuter to improve safety.
        `
      }
    ]
  })

  res.json({
    safetyAnalysis: {
      score,
      crashCount: vectorHits.length,
      recommendations: chat.choices[0].message?.content.split('\n').filter(Boolean)
    },
    crashData: vectorHits
  })
})

export default router
