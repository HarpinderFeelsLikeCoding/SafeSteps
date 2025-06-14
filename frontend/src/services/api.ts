import type { RouteData, SafetyScore, CrashData } from '../types'

const API = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export async function healthCheck() {
  const res = await fetch(`${API}/health`)
  return res.json() as Promise<{ mongodb: string; openai: string }>
}

export async function searchCrashes(
  origin: string,
  destination: string
): Promise<{ routes: Array<{
    mode: string
    coordinates: [number,number][]
    distance: string
    duration: string
    crashData: CrashData[]
  }> }> {
  const res = await fetch(`${API}/routes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ origin, destination })
  })
  return res.json()
}

export async function analyzeRoute(
  coordinates: [number,number][]
): Promise<{
  safetyAnalysis: SafetyScore
  crashData: CrashData[]
}> {
  const res = await fetch(`${API}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ coordinates })
  })
  return res.json()
}
