export function advanceMissionEpoch(currentEpoch: number, elapsedMilliseconds: number, speed: number, startEpoch: number, endEpoch: number): number {
  if (![currentEpoch, elapsedMilliseconds, speed, startEpoch, endEpoch].every(Number.isFinite) || elapsedMilliseconds < 0 || speed < 0 || endEpoch < startEpoch) return currentEpoch
  return Math.min(endEpoch, Math.max(startEpoch, currentEpoch + elapsedMilliseconds * speed))
}

export function advanceMissionDay(currentDay: number, elapsedSeconds: number, speed: number, missionDays: number): number {
  if (![currentDay, elapsedSeconds, speed, missionDays].every(Number.isFinite) || elapsedSeconds < 0 || speed < 0 || missionDays < 0) return currentDay
  return Math.min(missionDays, Math.max(0, currentDay + (elapsedSeconds * speed) / 86_400))
}
