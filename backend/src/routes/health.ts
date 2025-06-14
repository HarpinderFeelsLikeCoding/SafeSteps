import { Router } from 'express'
import { getCrashCollection } from '../utils/mongo'

export const healthRouter = Router().get('/', async (_req, res) => {
  let mongoStatus = 'disconnected'
  try {
    const coll = await getCrashCollection()
    await coll.stats()
    mongoStatus = 'connected'
  } catch {}
  res.json({
    mongodb: mongoStatus,
    openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured'
  })
})
