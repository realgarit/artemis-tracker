import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { MISSIONS } from '../services/mission.js'
import { fetchTrajectoryHistory } from '../services/horizons.js'

const DEFAULT_MISSION = 'artemis-ii'

export async function distanceHistory(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const missionId = request.query.get('mission') || DEFAULT_MISSION
    const config = MISSIONS[missionId]
    if (!config) return { status: 404, jsonBody: { error: `Mission '${missionId}' not found` } }

    const history = await fetchTrajectoryHistory(config.horizonsId, 24, 30)
    return {
      jsonBody: {
        data: history.map(p => ({ timestamp: p.timestamp, value: p.distanceFromEarth })),
        source: 'JPL Horizons',
      },
    }
  } catch (err) {
    context.error('Distance history error:', err)
    return { status: 500, jsonBody: { error: 'Failed to fetch distance history' } }
  }
}

app.http('distanceHistory', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'artemis/distancehistory',
  handler: distanceHistory,
})
