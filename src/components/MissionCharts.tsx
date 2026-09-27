import type { HistoryData } from '../lib/types'
import { VelocityChart } from './VelocityChart'
import { DistanceChart } from './DistanceChart'

export function MissionCharts({ velocity, distance, selectedTime, onSeek }: {
  velocity: HistoryData
  distance: HistoryData
  selectedTime: string
  onSeek: (time: string) => void
}) {
  return <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2"><VelocityChart data={velocity} selectedTime={selectedTime} onSeek={onSeek}/><DistanceChart data={distance} selectedTime={selectedTime} onSeek={onSeek}/></div>
}
