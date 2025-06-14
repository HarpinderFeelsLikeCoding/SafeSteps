import { Router } from 'express'
import { geocode, getDirections } from '../utils/maps'
import { getCrashCollection } from '../utils/mongo'
import turf from '@turf/turf'

type Mode = 'driving' | 'walking' | 'bicycling'
const router = Router()

router.post('/', async (req, res) => {
  const { origin, destination } = req.body as { origin: string; destination: string }
  const oLoc = await geocode(origin)
  const dLoc = await geocode(destination)

  const modes: Mode[] = ['driving', 'walking', 'bicycling']
  const results = []

  const coll = await getCrashCollection()
  for (const mode of modes) {
    const route = await getDirections(oLoc, dLoc, mode)
    // build LineString geometry
    const coords = turf.lineString(
      route.overview_polyline.points
        .split('')
        .reduce((acc, _, idx, arr) => acc, []) // decodePolyline…
    )
    // find crashes within 50m buffer of the route
    const buffered = turf.buffer(coords, 0.05, { units: 'kilometers' })
    const crashDocs = await coll
      .find({
        location: {
          $geoWithin: {
            $geometry: buffered.geometry
          }
        }
      })
      .toArray()

    results.push({
      mode,
      distance: route.legs[0].distance.text,
      duration: route.legs[0].duration.text,
      coordinates: turf.getCoords(coords),
      crashData: crashDocs.map((d) => ({
        latitude: d.latitude,
        longitude: d.longitude,
        severity: d.deaths_total + d.injuries_total
      }))
    })
  }

  res.json({ routes: results })
})

export default router
