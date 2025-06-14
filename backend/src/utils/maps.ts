import { Client } from '@googlemaps/google-maps-services-js'
const gmaps = new Client({})

export async function geocode(address: string) {
  const res = await gmaps.geocode({
    params: { address, key: process.env.GOOGLE_MAPS_API_KEY! }
  })
  const loc = res.data.results[0].geometry.location
  return { lat: loc.lat, lng: loc.lng }
}

export async function getDirections(
  origin: { lat: number; lng: number },
  dest: { lat: number; lng: number },
  mode: 'driving' | 'walking' | 'bicycling'
) {
  const res = await gmaps.directions({
    params: {
      origin: `${origin.lat},${origin.lng}`,
      destination: `${dest.lat},${dest.lng}`,
      mode,
      alternatives: false,
      key: process.env.GOOGLE_MAPS_API_KEY!
    }
  })
  return res.data.routes[0]
}
