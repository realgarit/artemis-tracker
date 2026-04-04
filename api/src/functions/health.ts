import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { MISSIONS } from '../services/mission.js'

export async function health(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  return {
    jsonBody: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      missions: Object.keys(MISSIONS),
    },
  }
}

app.http('health', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'health',
  handler: health,
})
