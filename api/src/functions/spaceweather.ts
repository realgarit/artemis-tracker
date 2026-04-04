import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { fetchSpaceWeather } from '../services/spaceweather.js'

export async function spaceweather(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const data = await fetchSpaceWeather()
    return { jsonBody: data }
  } catch (err) {
    context.error('Space weather error:', err)
    return { status: 500, jsonBody: { error: 'Failed to fetch space weather data' } }
  }
}

app.http('spaceweather', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'artemis/spaceweather',
  handler: spaceweather,
})
