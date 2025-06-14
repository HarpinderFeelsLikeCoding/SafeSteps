import express from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'
import { healthRouter } from './routes/health'
import computeRoutes from './routes/computeRoutes'
import analyzeRoute from './routes/analyzeRoute'
import * as dotenv from 'dotenv'
dotenv.config()

const app = express()
app.use(cors(), bodyParser.json())

app.use('/api/health', healthRouter)
app.use('/api/routes', computeRoutes)
app.use('/api/analyze', analyzeRoute)

const port = process.env.PORT || 4000
app.listen(port, () => console.log(`API running on http://localhost:${port}`))
