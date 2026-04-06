// Multi-mission trajectory data system
// Supports switching between Artemis I (completed) and Artemis II (active)

import * as THREE from 'three'
import { NASA_TRAJ_A1, NASA_MOON_A1, getMissionPhaseA1 } from './artemisIData'

export const EARTH_RADIUS_KM = 6371
export const MOON_RADIUS_KM = 1737
export const EARTH_MOON_DIST_KM = 384400
export const SCALE = 1 / 4000 // 1 Three.js unit = 4000 km

export const eR = EARTH_RADIUS_KM * SCALE  // ~1.59
export const mR = MOON_RADIUS_KM * SCALE   // ~0.43

// ——— Mission Configuration ———

export interface MissionTrajConfig {
  id: string
  name: string
  status: 'completed' | 'active'
  launchTime: number
  missionDays: number
  trajStartDay: number
  trajStepDays: number
  tliIndex: number
  trajectory: number[][]
  moon: number[][]
  getPhase: (day: number) => string
}

// ——— Artemis II Data ———

const LAUNCH_TIME_A2 = Date.UTC(2026, 3, 1, 22, 35, 0) // Apr 1 2026 22:35 UTC

// Official NASA Artemis II Overview Timeline (MET-based phase boundaries)
function getMissionPhaseA2(day: number): string {
  if (day < 0) return 'Pre-Launch'
  if (day < 0.035) return 'LEO'                // MET 0:00 → 0:50 (PRM)
  if (day < 1.063) return 'High Earth Orbit'    // MET 0:50 → 1/01:31 (TLI)
  if (day < 5.058) return 'Trans-Lunar'         // MET 1/01:31 → 5/01:23 (Lunar Close Approach)
  if (day < 9.052) return 'Trans-Earth'         // MET 5/01:23 → 9/01:13 (CM/SM Sep)
  if (day < 9.074) return 'EDL'                 // MET 9/01:13 → 9/01:46 (Splashdown)
  return 'Recovery'
}

const NASA_TRAJ_A2: number[][] = [
[-29093,-27111,-2392],[-31496,-45814,-4008],[-29834,-58891,-5132],
[-25980,-67721,-5886],[-20697,-72881,-6316],[-14424,-74597,-6442],
[-7456,-72813,-6251],[-106,-67200,-5732],[7219,-56991,-4818],
[13627,-40422,-3370],[14877,-11923,-933],[-24384,-8223,-1139],
[-41529,-33903,-3648],[-52054,-54749,-5625],[-59960,-72910,-7324],
[-66364,-89266,-8842],[-71767,-104280,-10227],[-76440,-118236,-11508],
[-80550,-131320,-12705],[-84208,-143668,-13829],[-87495,-155376,-14892],
[-90469,-166524,-15902],[-93173,-177169,-16864],[-95642,-187362,-17783],
[-97904,-197142,-18663],[-99983,-206543,-19507],[-101897,-215595,-20319],
[-103663,-224321,-21100],[-105293,-232743,-21852],[-106800,-240880,-22578],
[-108194,-248746,-23279],[-109485,-256358,-23956],[-110679,-263727,-24611],
[-111785,-270865,-25244],[-112809,-277783,-25857],[-113757,-284490,-26451],
[-114635,-290994,-27027],[-115447,-297304,-27585],[-116200,-303425,-28126],
[-116897,-309366,-28650],[-117543,-315131,-29159],[-118143,-320726,-29653],
[-118702,-326156,-30133],[-119224,-331426,-30599],[-119713,-336540,-31051],
[-120176,-341503,-31490],[-120618,-346316,-31917],[-121046,-350985,-32333],
[-121468,-355511,-32737],[-121893,-359897,-33131],[-122333,-364143,-33515],
[-122803,-368252,-33890],[-123325,-372220,-34257],[-123930,-376043,-34619],
[-124665,-379709,-34977],[-125610,-383185,-35334],[-126910,-386385,-35699],
[-128854,-389013,-36082],[-131670,-389891,-36489],[-133591,-387785,-36831],
[-133714,-384668,-37075],[-132933,-381462,-37266],[-131685,-378249,-37425],
[-130148,-375012,-37562],[-128410,-371729,-37679],[-126517,-368380,-37777],
[-124499,-364953,-37859],[-122373,-361434,-37925],[-120152,-357816,-37974],
[-117846,-354088,-38007],[-115459,-350245,-38023],[-112998,-346280,-38022],
[-110465,-342186,-38004],[-107864,-337957,-37969],[-105195,-333588,-37915],
[-102462,-329072,-37842],[-99663,-324403,-37749],[-96800,-319574,-37637],
[-93874,-314580,-37502],[-90885,-309413,-37346],[-87832,-304066,-37167],
[-84715,-298531,-36963],[-81533,-292799,-36734],[-78286,-286861,-36478],
[-74974,-280707,-36194],[-71594,-274326,-35879],[-68146,-267706,-35532],
[-64629,-260833,-35150],[-61040,-253693,-34732],[-57379,-246267,-34274],
[-53643,-238539,-33773],[-49830,-230484,-33225],[-45938,-222079,-32626],
[-41965,-213293,-31971],[-37908,-204094,-31253],[-33764,-194440,-30465],
[-29531,-184282,-29597],[-25206,-173559,-28638],[-20787,-162197,-27573],
[-16272,-150099,-26383],[-11663,-137137,-25040],[-6967,-123134,-23506],
[-2198,-107835,-21724],[2600,-90842,-19599],[7317,-71460,-16954],
[11584,-48236,-13381],[13214,-16560,-7286]
]

const NASA_MOON_A2: number[][] = [
[-384033,-84399,-19978],[-382670,-91473,-20528],[-381177,-98515,-21072],
[-379556,-105524,-21608],[-377807,-112498,-22137],[-375932,-119434,-22658],
[-373931,-126329,-23171],[-371804,-133182,-23677],[-369554,-139990,-24174],
[-367180,-146751,-24664],[-364685,-153463,-25144],[-362069,-160124,-25617],
[-359333,-166731,-26081],[-356479,-173283,-26536],[-353507,-179777,-26982],
[-350419,-186212,-27419],[-347217,-192584,-27847],[-343900,-198893,-28266],
[-340472,-205137,-28675],[-336932,-211312,-29075],[-333283,-217418,-29465],
[-329525,-223453,-29845],[-325661,-229414,-30215],[-321692,-235300,-30576],
[-317619,-241109,-30926],[-313443,-246839,-31266],[-309167,-252489,-31596],
[-304792,-258057,-31916],[-300319,-263540,-32225],[-295749,-268938,-32523],
[-291086,-274249,-32811],[-286330,-279471,-33089],[-281482,-284603,-33355],
[-276546,-289642,-33611],[-271521,-294589,-33856],[-266411,-299440,-34090],
[-261217,-304195,-34312],[-255940,-308853,-34524],[-250582,-313411,-34725],
[-245146,-317869,-34914],[-239632,-322225,-35092],[-234044,-326478,-35259],
[-228382,-330627,-35415],[-222649,-334670,-35559],[-216846,-338606,-35692],
[-210976,-342435,-35813],[-205040,-346154,-35923],[-199040,-349764,-36021],
[-192979,-353262,-36108],[-186857,-356648,-36184],[-180678,-359921,-36248],
[-174442,-363080,-36300],[-168153,-366124,-36341],[-161812,-369052,-36370],
[-155421,-371863,-36388],[-148982,-374556,-36394],[-142497,-377131,-36389],
[-135968,-379586,-36372],[-129398,-381922,-36343],[-122788,-384137,-36303],
[-116140,-386230,-36252],[-109457,-388201,-36189],[-102741,-390050,-36114],
[-95993,-391775,-36028],[-89216,-393377,-35931],[-82412,-394854,-35822],
[-75583,-396207,-35702],[-68731,-397434,-35570],[-61858,-398535,-35428],
[-54967,-399510,-35274],[-48059,-400359,-35109],[-41137,-401081,-34932],
[-34203,-401676,-34745],[-27259,-402144,-34546],[-20307,-402484,-34337],
[-13350,-402696,-34117],[-6389,-402781,-33885],[573,-402737,-33643],
[7534,-402565,-33391],[14492,-402264,-33127],[21445,-401836,-32853],
[28391,-401279,-32569],[35326,-400594,-32274],[42250,-399780,-31969],
[49160,-398839,-31653],[56053,-397769,-31327],[62928,-396572,-30992],
[69782,-395247,-30646],[76614,-393794,-30290],[83420,-392214,-29925],
[90199,-390508,-29550],[96948,-388675,-29165],[103666,-386715,-28771],
[110349,-384630,-28367],[116997,-382419,-27954],[123606,-380084,-27532],
[130175,-377624,-27101],[136701,-375041,-26661],[143182,-372334,-26213],
[149616,-369504,-25756],[156001,-366552,-25290],[162334,-363479,-24816],
[168613,-360286,-24333],[174837,-356972,-23843],[181002,-353540,-23345],
[187107,-349989,-22838],[193150,-346321,-22324]
]

// ——— Mission Configs ———

const ARTEMIS_I_CONFIG: MissionTrajConfig = {
  id: 'artemis-i',
  name: 'Artemis I',
  status: 'completed',
  launchTime: Date.UTC(2022, 10, 16, 6, 47, 44), // Nov 16 2022 06:47:44 UTC
  missionDays: 26,
  trajStartDay: 0.134, // Data starts ~3h 13m after launch
  trajStepDays: 2 / 24,
  tliIndex: 0, // TLI happens very early, use all data
  trajectory: NASA_TRAJ_A1,
  moon: NASA_MOON_A1,
  getPhase: getMissionPhaseA1,
}

const ARTEMIS_II_CONFIG: MissionTrajConfig = {
  id: 'artemis-ii',
  name: 'Artemis II',
  status: 'active',
  launchTime: LAUNCH_TIME_A2,
  missionDays: 10,
  trajStartDay: (3 + 24 - 22.5833) / 24, // ~0.184
  trajStepDays: 2 / 24,
  tliIndex: 11,
  trajectory: NASA_TRAJ_A2,
  moon: NASA_MOON_A2,
  getPhase: getMissionPhaseA2,
}

const MISSION_MAP: Record<string, MissionTrajConfig> = {
  'artemis-i': ARTEMIS_I_CONFIG,
  'artemis-ii': ARTEMIS_II_CONFIG,
}

// ——— Active Mission State ———

let active: MissionTrajConfig = ARTEMIS_II_CONFIG

export function getActiveMission(): MissionTrajConfig { return active }
export function getMissionConfigs(): MissionTrajConfig[] { return Object.values(MISSION_MAP) }

export function setActiveMission(id: string) {
  const cfg = MISSION_MAP[id]
  if (!cfg) return
  active = cfg
  // Rebuild pre-computed curves
  fullTrajPts = buildTrajectoryCurve()
  moonArcPts = buildMoonArc()
  lunarOrbitPts = buildLunarOrbitCircle()
}

// ——— Backward-compatible exports (read from active mission) ———

export { LAUNCH_TIME_A2 as LAUNCH_TIME }
export const MISSION_DAYS = 10 // kept for compat, but use active.missionDays
export const TRAJ_START_DAY = (3 + 24 - 22.5833) / 24

// ——— Core Math (mission-independent) ———

export function horizonsToThree(d: number[]): THREE.Vector3 {
  return new THREE.Vector3(d[0] * SCALE, d[2] * SCALE, d[1] * SCALE)
}

export function catmullRom(
  p0: THREE.Vector3, p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3, t: number
): THREE.Vector3 {
  const t2 = t * t, t3 = t2 * t
  return new THREE.Vector3(
    0.5 * ((2*p1.x) + (-p0.x+p2.x)*t + (2*p0.x-5*p1.x+4*p2.x-p3.x)*t2 + (-p0.x+3*p1.x-3*p2.x+p3.x)*t3),
    0.5 * ((2*p1.y) + (-p0.y+p2.y)*t + (2*p0.y-5*p1.y+4*p2.y-p3.y)*t2 + (-p0.y+3*p1.y-3*p2.y+p3.y)*t3),
    0.5 * ((2*p1.z) + (-p0.z+p2.z)*t + (2*p0.z-5*p1.z+4*p2.z-p3.z)*t2 + (-p0.z+3*p1.z-3*p2.z+p3.z)*t3),
  )
}

// ——— Position Functions (use active mission) ———

export function getTrajectoryPos(day: number): THREE.Vector3 {
  const { trajectory, trajStartDay, trajStepDays } = active
  if (day <= trajStartDay) return horizonsToThree(trajectory[0])
  const maxDay = trajStartDay + (trajectory.length - 1) * trajStepDays
  if (day >= maxDay) return horizonsToThree(trajectory[trajectory.length - 1])
  const fIdx = (day - trajStartDay) / trajStepDays
  const i = Math.floor(fIdx), t = fIdx - i, N = trajectory.length
  return catmullRom(
    horizonsToThree(trajectory[Math.max(0, i - 1)]),
    horizonsToThree(trajectory[Math.min(N - 1, i)]),
    horizonsToThree(trajectory[Math.min(N - 1, i + 1)]),
    horizonsToThree(trajectory[Math.min(N - 1, i + 2)]),
    t
  )
}

export function getMoonPos(day: number): THREE.Vector3 {
  const { moon, trajStartDay, trajStepDays } = active
  if (day <= trajStartDay) return horizonsToThree(moon[0])
  const maxDay = trajStartDay + (moon.length - 1) * trajStepDays
  if (day >= maxDay) return horizonsToThree(moon[moon.length - 1])
  const fIdx = (day - trajStartDay) / trajStepDays
  const i = Math.floor(fIdx), t = fIdx - i, N = moon.length
  return catmullRom(
    horizonsToThree(moon[Math.max(0, i - 1)]),
    horizonsToThree(moon[Math.min(N - 1, i)]),
    horizonsToThree(moon[Math.min(N - 1, i + 1)]),
    horizonsToThree(moon[Math.min(N - 1, i + 2)]),
    t
  )
}

export function getCurrentMissionDay(): number {
  return (Date.now() - active.launchTime) / 86400000
}

export function getMissionPhase(day: number): string {
  return active.getPhase(day)
}

// ——— Curve Builders (use active mission) ———

export function buildTrajectoryCurve(): THREE.Vector3[] {
  const { trajectory, tliIndex } = active
  const pts: THREE.Vector3[] = []
  const N = trajectory.length
  for (let i = tliIndex; i < N - 1; i++) {
    const i0 = Math.max(tliIndex, i - 1)
    const i3 = Math.min(N - 1, i + 2)
    const p0 = horizonsToThree(trajectory[i0])
    const p1 = horizonsToThree(trajectory[i])
    const p2 = horizonsToThree(trajectory[i + 1])
    const p3 = horizonsToThree(trajectory[i3])
    for (let s = 0; s < 10; s++) {
      pts.push(catmullRom(p0, p1, p2, p3, s / 10))
    }
  }
  pts.push(horizonsToThree(trajectory[N - 1]))
  return pts
}

export function buildMoonArc(): THREE.Vector3[] {
  return active.moon.map((d) => horizonsToThree(d))
}

export function buildLunarOrbitCircle(): THREE.Vector3[] {
  const moonData = active.moon
  const p0 = horizonsToThree(moonData[0])
  const pMid = horizonsToThree(moonData[Math.floor(moonData.length / 2)])
  const v1 = pMid.clone().sub(p0)
  const v2 = horizonsToThree(moonData[Math.floor(moonData.length / 4)]).sub(p0)
  const normal = new THREE.Vector3().crossVectors(v1, v2).normalize()
  let avgR = 0
  for (const d of moonData) avgR += horizonsToThree(d).length()
  avgR /= moonData.length
  const u = new THREE.Vector3()
  if (Math.abs(normal.x) < 0.9) u.crossVectors(normal, new THREE.Vector3(1, 0, 0)).normalize()
  else u.crossVectors(normal, new THREE.Vector3(0, 1, 0)).normalize()
  const v = new THREE.Vector3().crossVectors(normal, u).normalize()
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= 360; i++) {
    const a = (i * Math.PI) / 180
    pts.push(new THREE.Vector3(
      avgR * (Math.cos(a) * u.x + Math.sin(a) * v.x),
      avgR * (Math.cos(a) * u.y + Math.sin(a) * v.y),
      avgR * (Math.cos(a) * u.z + Math.sin(a) * v.z),
    ))
  }
  return pts
}

// ——— Velocity ———

export function getVelocity(day: number): number {
  const step = 0.002
  const pos1 = getTrajectoryPos(day)
  const pos2 = getTrajectoryPos(Math.max(0, day - step))
  const distKm = pos1.clone().sub(pos2).length() / SCALE
  return distKm / (step * 86400)
}

// ——— Full Mission Profile (computed from trajectory data) ———

export interface MissionHistoryPoint {
  timestamp: number
  value: number
}

export function buildVelocityProfile(): MissionHistoryPoint[] {
  const { launchTime, missionDays, trajStartDay } = active
  const points: MissionHistoryPoint[] = []
  const steps = Math.min(200, Math.floor(missionDays * 12))
  for (let i = 0; i <= steps; i++) {
    const day = trajStartDay + (i / steps) * (missionDays - trajStartDay)
    points.push({ timestamp: launchTime + day * 86400000, value: getVelocity(day) })
  }
  return points
}

export function buildDistanceProfile(): MissionHistoryPoint[] {
  const { launchTime, missionDays, trajStartDay } = active
  const points: MissionHistoryPoint[] = []
  const steps = Math.min(200, Math.floor(missionDays * 12))
  for (let i = 0; i <= steps; i++) {
    const day = trajStartDay + (i / steps) * (missionDays - trajStartDay)
    const pos = getTrajectoryPos(day)
    points.push({ timestamp: launchTime + day * 86400000, value: Math.max(0, pos.length() / SCALE - EARTH_RADIUS_KM) })
  }
  return points
}

// ——— Pre-computed curves (mutable, rebuilt on mission switch) ———

export let fullTrajPts = buildTrajectoryCurve()
export let moonArcPts = buildMoonArc()
export let lunarOrbitPts = buildLunarOrbitCircle()
