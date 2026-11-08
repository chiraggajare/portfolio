// Nexoverse: a small star system where each body holds part of the portfolio.
// Positions are relative to SYSTEM_CENTER; all orbits lie on one flat plane.
// It sits far ahead of the scroll journey, visible as a small distant system in the
// background; "explore" flies the camera all the way there.

export const SYSTEM_CENTER = [330, 230, -760]
export const SYSTEM_TILT = [0, 0, 0] // radians, x / y / z

// type → shader preset in Planet.jsx
// orbit: radius around the parent, speed: radians per second, phase: start angle
export const BODIES = [
  {
    id: 'core',
    name: 'Core',
    tag: 'The star · Elevator pitch',
    type: 'sun',
    radius: 7,
    orbit: 0,
    color: '#ffc46b',
  },
  {
    id: 'terra',
    name: 'Haven',
    tag: 'Home world · About me',
    type: 'terra',
    radius: 2.6,
    orbit: 19,
    speed: 0.05,
    phase: 0.6,
    color: '#5fb4ff',
    atmosphere: '#7cc4ff',
    colors: ['#071d47', '#1a5fa3', '#2f6b2a', '#7a6a3e'],
  },
  {
    id: 'stackara',
    name: 'Stackara',
    tag: 'Gas giant · Skills',
    type: 'gas',
    radius: 4.6,
    orbit: 33,
    speed: 0.032,
    phase: 2.4,
    color: '#e0a86a',
    atmosphere: '#ffcf96',
    colors: ['#7a4a2a', '#d99a5b', '#f3dcb5', '#a8613a'],
    ring: { inner: 1.45, outer: 2.35, color: '#e9caa0' },
    // touch down higher and turned sideways so the rings sweep in past the horizon
    landing: { lat: 28, height: 1.55, tilt: 34, yaw: 45, mobile: { height: 1.7, tilt: 38, yaw: 70 } },
  },
  {
    id: 'forge',
    name: 'Forge',
    tag: 'Volcanic world · Projects',
    type: 'lava',
    radius: 3.0,
    orbit: 49,
    speed: 0.024,
    phase: 4.3,
    color: '#ff6a3d',
    atmosphere: '#ff5a2a',
    colors: ['#0d0b0c', '#3a2f2b', '#c41e05', '#ffb347'],
  },
  {
    id: 'panchakarma',
    name: 'PanchaKarma Setu',
    tag: 'Moon of Forge · Project',
    type: 'moonGreen',
    parent: 'forge',
    radius: 0.8,
    orbit: 6,
    speed: 0.22,
    phase: 1.0,
    color: '#7ee0b0',
    atmosphere: '#8affc8',
    colors: ['#1d3b2e', '#3f7a5a', '#9fd8b4', '#e7f5d9'],
  },
  {
    id: 'livecodex',
    name: 'LiveCodeX',
    tag: 'Moon of Forge · Project',
    type: 'moonTech',
    parent: 'forge',
    radius: 0.7,
    orbit: 8.5,
    speed: -0.16,
    phase: 3.6,
    color: '#b18cff',
    atmosphere: '#b99bff',
    colors: ['#1a1238', '#3b2a7a', '#8a6cff', '#d6c8ff'],
  },
  {
    id: 'glacia',
    name: 'Glacia',
    tag: 'Ice world · Experience',
    type: 'ice',
    radius: 2.4,
    orbit: 63,
    speed: 0.018,
    phase: 0.1,
    color: '#8ff0ff',
    atmosphere: '#a8f4ff',
    colors: ['#2a5d7a', '#6fb7d6', '#d8f6ff', '#ffffff'],
  },
  {
    id: 'beacon',
    name: 'Beacon',
    tag: 'Relay outpost · Contact',
    type: 'beacon',
    radius: 1.8,
    orbit: 76,
    speed: 0.014,
    phase: 5.4,
    color: '#f472b6',
    atmosphere: '#ff8fd0',
    colors: ['#1c1424', '#3d2b4a', '#7a5a8a', '#f472b6'],
  },
]

export const BODY_BY_ID = Object.fromEntries(BODIES.map((b) => [b.id, b]))

// Order used by "next / previous planet" hops and the dock
export const TOUR_ORDER = ['core', 'terra', 'stackara', 'forge', 'panchakarma', 'livecodex', 'glacia', 'beacon']

// Each category has a tint, shared by the skills fly-past and Stackara
export const SKILL_GROUPS = [
  { title: 'Frontend', tint: '#9ad7ff', items: ['React.js', 'Next.js', 'Tailwind CSS', 'Material UI', 'Vite', 'Monaco Editor'] },
  { title: 'Backend', tint: '#c8a7ff', items: ['Node.js', 'Express.js', 'Python', 'Django', 'REST APIs', 'Socket.io', 'Y.js'] },
  { title: 'Data', tint: '#7fe0c0', items: ['MongoDB', 'MongoDB Atlas', 'PostgreSQL', 'MySQL', 'Supabase', 'Firebase'] },
  { title: 'Cloud & DevOps', tint: '#ffc98a', items: ['Docker', 'AWS', 'Google Cloud', 'Cloudflare', 'ImageKit', 'Hostinger Website Builder'] },
  { title: 'AI & Tools', tint: '#ff9ec7', items: ['Google Gemini API', 'Google Stitch', 'Git', 'GitHub', 'Postman'] },
]

export const PROJECTS = {
  panchakarma: {
    title: 'PanchaKarma Setu',
    description:
      'An Ayurvedic Detox Healthcare Platform for digitizing Ayurvedic treatments with a high-performance, responsive UI.',
    logo: '/panchkarmasetu-logo.png',
    live: 'https://panchkarmasetu.onrender.com/',
    github: 'https://github.com/chiraggajare/PanchkarmaSetu',
  },
  livecodex: {
    title: 'LiveCodeX',
    description:
      'A Real-Time Collaborative Code Editor where users can work and brainstorm on code-snippets together in personal virtual rooms!',
    logo: '/livecodex-logo.png',
    live: 'https://livecodex-awlr.onrender.com/home',
    github: 'https://github.com/chiraggajare/LiveCodeX',
  },
}
