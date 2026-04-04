import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { MISSIONS, getMissionStatus } from '../services/mission.js'

const DEFAULT_MISSION = 'artemis-ii'

export async function mission(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  const missionId = request.query.get('mission') || DEFAULT_MISSION
  const config = MISSIONS[missionId]
  if (!config) return { status: 404, jsonBody: { error: `Mission '${missionId}' not found` } }
  return { jsonBody: getMissionStatus(config) }
}

app.http('mission', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'artemis/mission',
  handler: mission,
})
