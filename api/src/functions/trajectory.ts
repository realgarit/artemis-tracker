import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions'
import { MISSIONS, getMissionStatus } from '../services/mission.js'
import { fetchCurrentTrajectory } from '../services/horizons.js'

const DEFAULT_MISSION = 'artemis-ii'

export async function trajectory(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const missionId = request.query.get('mission') || DEFAULT_MISSION
    const config = MISSIONS[missionId]
    if (!config) return { status: 404, jsonBody: { error: `Mission '${missionId}' not found` } }

    const status = getMissionStatus(config)
    const traj = await fetchCurrentTrajectory(config.horizonsId)

    if (!traj) {
      return {
        jsonBody: {
          distanceFromEarth: 0, distanceFromMoon: 384400, velocity: 0,
          acceleration: 0, altitude: 0, commsDelay: 0, latitude: 0, longitude: 0,
          phase: status.currentPhase, source: 'Awaiting data from JPL Horizons',
          timestamp: new Date().toISOString(),
        },
      }
    }

    return {
      jsonBody: {
        ...traj,
        altitude: traj.distanceFromEarth,
        phase: status.currentPhase,
        source: `JPL Horizons (SPKID ${config.horizonsId} - ${config.spacecraft})`,
      },
    }
  } catch (err) {
    context.error('Trajectory error:', err)
    return { status: 500, jsonBody: { error: 'Failed to fetch trajectory data' } }
  }
}

app.http('trajectory', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'artemis/trajectory',
  handler: trajectory,
})
