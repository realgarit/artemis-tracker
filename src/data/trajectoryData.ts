// Real NASA/JPL Horizons ephemeris data for Artemis II
// Spacecraft ID: -1024 (Orion/Integrity)
// Reference frame: Earth-centered EME2000 (J2000 equatorial)
// Units: km, 2-hour intervals
// Coverage: Apr 2 03:00 TDB → Apr 10 23:00 TDB (107 points)

import * as THREE from 'three'

export const EARTH_RADIUS_KM = 6371
export const MOON_RADIUS_KM = 1737
export const EARTH_MOON_DIST_KM = 384400
export const SCALE = 1 / 4000 // 1 Three.js unit = 4000 km

export const eR = EARTH_RADIUS_KM * SCALE  // ~1.59
export const mR = MOON_RADIUS_KM * SCALE   // ~0.43

export const LAUNCH_TIME = Date.UTC(2026, 3, 1, 22, 35, 0) // Apr 1 2026 22:35 UTC
export const MISSION_DAYS = 10

// Data starts at Apr 2 03:00 UTC = day 0.184 after launch
export const TRAJ_START_DAY = (3 + 24 - 22.5833) / 24
export const TRAJ_STEP_DAYS = 2 / 24 // 2 hours
export const TLI_INDEX = 11 // Trans-Lunar Injection point

// Spacecraft trajectory — [X, Y, Z] in km, EME2000
export const NASA_TRAJ: number[][] = [
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

// Moon positions — [X, Y, Z] in km, EME2000, same timing
export const NASA_MOON: number[][] = [
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

// Convert Horizons EME2000 [X,Y,Z] → Three.js Y-up [X,Z,Y]
export function horizonsToThree(d: number[]): THREE.Vector3 {
  return new THREE.Vector3(d[0] * SCALE, d[2] * SCALE, d[1] * SCALE)
}

// Catmull-Rom interpolation for smooth curves through data points
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

// Get spacecraft position at a given mission day
export function getTrajectoryPos(day: number): THREE.Vector3 {
  if (day <= TRAJ_START_DAY) return horizonsToThree(NASA_TRAJ[0])
  const maxDay = TRAJ_START_DAY + (NASA_TRAJ.length - 1) * TRAJ_STEP_DAYS
  if (day >= maxDay) return horizonsToThree(NASA_TRAJ[NASA_TRAJ.length - 1])

  const fIdx = (day - TRAJ_START_DAY) / TRAJ_STEP_DAYS
  const i = Math.floor(fIdx)
  const t = fIdx - i
  const N = NASA_TRAJ.length

  return catmullRom(
    horizonsToThree(NASA_TRAJ[Math.max(0, i - 1)]),
    horizonsToThree(NASA_TRAJ[Math.min(N - 1, i)]),
    horizonsToThree(NASA_TRAJ[Math.min(N - 1, i + 1)]),
    horizonsToThree(NASA_TRAJ[Math.min(N - 1, i + 2)]),
    t
  )
}

// Get Moon position at a given mission day
export function getMoonPos(day: number): THREE.Vector3 {
  if (day <= TRAJ_START_DAY) return horizonsToThree(NASA_MOON[0])
  const maxDay = TRAJ_START_DAY + (NASA_MOON.length - 1) * TRAJ_STEP_DAYS
  if (day >= maxDay) return horizonsToThree(NASA_MOON[NASA_MOON.length - 1])

  const fIdx = (day - TRAJ_START_DAY) / TRAJ_STEP_DAYS
  const i = Math.floor(fIdx)
  const t = fIdx - i
  const N = NASA_MOON.length

  return catmullRom(
    horizonsToThree(NASA_MOON[Math.max(0, i - 1)]),
    horizonsToThree(NASA_MOON[Math.min(N - 1, i)]),
    horizonsToThree(NASA_MOON[Math.min(N - 1, i + 1)]),
    horizonsToThree(NASA_MOON[Math.min(N - 1, i + 2)]),
    t
  )
}

// Get current mission day from real time
export function getCurrentMissionDay(): number {
  return (Date.now() - LAUNCH_TIME) / 86400000
}

// Build trajectory curve points for rendering (from TLI onward)
export function buildTrajectoryCurve(): THREE.Vector3[] {
  const pts: THREE.Vector3[] = []
  const N = NASA_TRAJ.length
  for (let i = TLI_INDEX; i < N - 1; i++) {
    const i0 = Math.max(TLI_INDEX, i - 1)
    const i3 = Math.min(N - 1, i + 2)
    const p0 = horizonsToThree(NASA_TRAJ[i0])
    const p1 = horizonsToThree(NASA_TRAJ[i])
    const p2 = horizonsToThree(NASA_TRAJ[i + 1])
    const p3 = horizonsToThree(NASA_TRAJ[i3])
    for (let s = 0; s < 10; s++) {
      pts.push(catmullRom(p0, p1, p2, p3, s / 10))
    }
  }
  pts.push(horizonsToThree(NASA_TRAJ[N - 1]))
  return pts
}

// Build Moon orbit arc from data
export function buildMoonArc(): THREE.Vector3[] {
  return NASA_MOON.map((d) => horizonsToThree(d))
}

// Get mission phase from day
export function getMissionPhase(day: number): string {
  if (day < 0) return 'Pre-Launch'
  if (day < 1.06) return 'Earth Orbit'
  if (day < 1.5) return 'Trans-Lunar Injection'
  if (day < 5.3) return 'Translunar Coast'
  if (day < 6.3) return 'Lunar Flyby'
  if (day < 9.5) return 'Return Transit'
  return 'Re-entry'
}

// Calculate velocity (km/s) via finite difference
export function getVelocity(day: number): number {
  const step = 0.002
  const pos1 = getTrajectoryPos(day)
  const pos2 = getTrajectoryPos(Math.max(0, day - step))
  // Positions are in scaled units, convert back to km
  const distKm = pos1.clone().sub(pos2).length() / SCALE
  return distKm / (step * 86400)
}
