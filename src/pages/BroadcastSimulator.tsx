import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Battery,
  CheckCircle,
  ChevronDown,
  Clock,
  Copy,
  Crosshair,
  Gauge,
  History,
  MapPin,
  Pause,
  Play,
  Plane,
  Radio,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Signal,
  Sparkles,
  User,
  Wifi,
  Zap,
} from 'lucide-react'
import { MOCK_DRONES } from '../data/mockDrones'

console.log('BroadcastSimulator loaded')

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const

type Drone = (typeof MOCK_DRONES)[number]

type ComplianceLevel = 'compliant' | 'caution' | 'noncompliant'

type Snapshot = {
  id: string
  at: Date
  drone: Drone
  lat: number
  lng: number
  altitudeAGL: number
  altitudeMSL: number
  speed: number
  heading: number
  battery: number
  signal: SignalLevel
  emergency: 'NONE' | 'LOST_LINK' | 'DOWNED' | 'GEOFENCE'
  pilotLat: number
  pilotLng: number
  pilotDistance: number
  ctrlLat: number
  ctrlLng: number
  ctrlAltMSL: number
  compliance: ComplianceLevel
}

type SignalLevel = 'Strong' | 'Good' | 'Weak'

type ChainTx = {
  hash: string
  block: number
  at: Date
  droneId: string
}

const HEADINGS = [
  { dir: 'N', deg: [338, 360, 0, 22] },
  { dir: 'NE', deg: [23, 67] },
  { dir: 'E', deg: [68, 112] },
  { dir: 'SE', deg: [113, 157] },
  { dir: 'S', deg: [158, 202] },
  { dir: 'SW', deg: [203, 247] },
  { dir: 'W', deg: [248, 292] },
  { dir: 'NW', deg: [293, 337] },
]

const DIRECTION_NAMES: Record<string, string> = {
  N: 'North',
  NE: 'Northeast',
  E: 'East',
  SE: 'Southeast',
  S: 'South',
  SW: 'Southwest',
  W: 'West',
  NW: 'Northwest',
}

function headingDirection(deg: number): string {
  const d = ((deg % 360) + 360) % 360
  for (const h of HEADINGS) {
    if (h.deg.length === 4) {
      if (d >= h.deg[0] || d <= h.deg[3]) return h.dir
    } else if (d >= h.deg[0] && d <= h.deg[1]) {
      return h.dir
    }
  }
  return 'N'
}

function formatLat(lat: number) {
  const v = Math.abs(lat).toFixed(4)
  return `${v} ${lat >= 0 ? 'N' : 'S'}`
}

function formatLng(lng: number) {
  const v = Math.abs(lng).toFixed(4)
  return `${v} ${lng >= 0 ? 'E' : 'W'}`
}

function formatClockMs(d: Date) {
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  const ms = String(d.getMilliseconds()).padStart(3, '0')
  return `${hh}:${mm}:${ss}.${ms} IST`
}

function formatHistoryClock(d: Date) {
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  const ss = String(d.getSeconds()).padStart(2, '0')
  const ms = String(d.getMilliseconds()).padStart(3, '0')
  return `${hh}:${mm}:${ss}.${ms}`
}

function pilotIdFor(drone: Drone) {
  const tail = drone.pilotLicense.split('-').pop() ?? '0000'
  return `PLT-IND-2026-${tail}`
}

function registrationFor(drone: Drone) {
  return `IND-DRN-${drone.id.replace(/^DRN-/, '')}`
}

function complianceFor(drone: Drone, battery: number, signal: SignalLevel, emergency: Snapshot['emergency']): ComplianceLevel {
  if (drone.status === 'violation' || emergency !== 'NONE') return 'noncompliant'
  if (battery < 25 || signal === 'Weak' || drone.compliance < 90) return 'caution'
  return 'compliant'
}

function signalFor(drone: Drone, jitter: number): SignalLevel {
  if (drone.status === 'grounded') return 'Weak'
  if (drone.status === 'violation') return jitter > 0.55 ? 'Good' : 'Weak'
  return jitter > 0.7 ? 'Good' : 'Strong'
}

function emergencyFor(drone: Drone): Snapshot['emergency'] {
  if (drone.status === 'violation') return 'GEOFENCE'
  return 'NONE'
}

function generateTxHash() {
  const hex = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 44 }, () => hex[Math.floor(Math.random() * hex.length)]).join('')
}

function shortHash(h: string) {
  return `${h.slice(0, 8)}…${h.slice(-6)}`
}

function buildSnapshot(drone: Drone, tick: number, ts: Date): Snapshot {
  const wave = Math.sin(tick * 0.32 + drone.id.length)
  const wave2 = Math.cos(tick * 0.18 + drone.serial.length * 0.2)
  const jitter = (Math.sin(tick * 0.7) + 1) / 2

  const live = drone.status !== 'grounded'
  const lat = drone.location.lat + (live ? wave * 0.0014 : 0)
  const lng = drone.location.lng + (live ? wave2 * 0.0014 : 0)

  const altitudeAGL = Math.max(
    0,
    Math.round(drone.altitude + (live ? wave * 6 : 0)),
  )
  const altitudeMSL = Math.max(0, drone.altitudeMSL + Math.round((live ? wave * 6 : 0)))

  const speed = Math.max(0, Math.round(drone.speed + (live ? wave2 * 4 : 0)))
  const heading = Math.round(((drone.heading + (live ? tick * 0.6 : 0)) % 360 + 360) % 360)

  const drainPerTick = drone.status === 'violation' ? 0.18 : 0.05
  const battery = Math.max(
    1,
    Math.min(100, Math.round(drone.battery - tick * drainPerTick - jitter * 0.4)),
  )

  const sig = signalFor(drone, jitter)
  const emerg = emergencyFor(drone)

  const pilotLat = drone.location.lat - 0.00027
  const pilotLng = drone.location.lng - 0.00036
  const pilotDistance = live ? Math.round(35 + jitter * 25) : 0

  const ctrlLat = pilotLat
  const ctrlLng = pilotLng
  const ctrlAltMSL = Math.max(0, drone.altitudeMSL - 120)

  return {
    id: `${drone.id}-${tick}`,
    at: ts,
    drone,
    lat,
    lng,
    altitudeAGL,
    altitudeMSL,
    speed,
    heading,
    battery,
    signal: sig,
    emergency: emerg,
    pilotLat,
    pilotLng,
    pilotDistance,
    ctrlLat,
    ctrlLng,
    ctrlAltMSL,
    compliance: complianceFor(drone, battery, sig, emerg),
  }
}

export default function BroadcastSimulator() {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()

  const [selectedId, setSelectedId] = useState<string>(MOCK_DRONES[0].id)
  const [tick, setTick] = useState(0)
  const [paused, setPaused] = useState(false)
  const [history, setHistory] = useState<Snapshot[]>([])
  const [chainTxs, setChainTxs] = useState<ChainTx[]>([])
  const [storing, setStoring] = useState(false)

  const drone = useMemo(
    () => MOCK_DRONES.find((d) => d.id === selectedId) ?? MOCK_DRONES[0],
    [selectedId],
  )

  const snapshot = useMemo(
    () => buildSnapshot(drone, tick, new Date()),
    [drone, tick],
  )

  useEffect(() => {
    if (paused) return
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [paused])

  useEffect(() => {
    setHistory((prev) => [snapshot, ...prev].slice(0, 10))
  }, [snapshot])

  useEffect(() => {
    setTick(0)
    setHistory([])
  }, [selectedId])

  const handleStore = async () => {
    if (storing) return
    setStoring(true)
    const promise = new Promise<ChainTx>((resolve) =>
      setTimeout(() => {
        const tx: ChainTx = {
          hash: generateTxHash(),
          block: 248_300_000 + Math.floor(Math.random() * 9000),
          at: new Date(),
          droneId: drone.id,
        }
        resolve(tx)
      }, 1400),
    )
    await toast.promise(
      promise,
      {
        loading: 'Storing broadcast on Solana…',
        success: 'Broadcast stored on chain',
        error: 'Failed to broadcast',
      },
      {
        style: {
          background: '#111827',
          color: '#F9FAFB',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '12px',
        },
      },
    )
    const tx = await promise
    setChainTxs((prev) => [tx, ...prev].slice(0, 5))
    setStoring(false)
  }

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text).then(() => toast.success(`${label} copied`))
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-bg text-white">
      <div className="pointer-events-none absolute inset-0 grid-bg radial-fade opacity-25" />
      <div
        className="pointer-events-none absolute top-[-15%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full blur-3xl opacity-25"
        style={{
          background:
            'radial-gradient(closest-side, rgba(59,130,246,0.45), transparent 70%)',
        }}
      />

      <Navbar
        navigate={navigate}
        snapshot={snapshot}
        paused={paused}
        onTogglePause={() => setPaused((p) => !p)}
      />

      <main className="relative pt-[88px] pb-16 max-w-[1400px] mx-auto px-4 sm:px-6">
        <Header
          drone={drone}
          drones={MOCK_DRONES}
          onSelect={setSelectedId}
          tick={tick}
          paused={paused}
          snapshot={snapshot}
        />

        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(340px,400px)] gap-6">
          <div className="grid gap-6">
            <BroadcastCard
              snapshot={snapshot}
              prefersReducedMotion={!!prefersReducedMotion}
              onCopy={handleCopy}
            />

            <ChainPanel
              snapshot={snapshot}
              storing={storing}
              onStore={handleStore}
              txs={chainTxs}
              onCopy={handleCopy}
            />
          </div>

          <aside className="grid gap-6">
            <ComplianceBadge level={snapshot.compliance} />
            <HistoryFeed history={history} />
          </aside>
        </div>
      </main>

      <BroadcastStyles />
    </div>
  )
}

function Navbar({
  navigate,
  snapshot,
  paused,
  onTogglePause,
}: {
  navigate: ReturnType<typeof useNavigate>
  snapshot: Snapshot
  paused: boolean
  onTogglePause: () => void
}) {
  return (
    <header
      className="fixed top-0 inset-x-0 z-40 h-[64px]"
      style={{
        background: 'rgba(10,15,26,0.85)',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="h-full max-w-[1400px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/dashboard')}
            className="group inline-flex items-center gap-1.5 text-sm text-white/65 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Dashboard</span>
          </button>
          <div className="hidden sm:block w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg" aria-hidden>
              📡
            </span>
            <span className="font-inter font-extrabold tracking-tight text-[15px] text-white truncate">
              Broadcast Simulator
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <span className="relative inline-flex w-2 h-2">
            <span
              className="absolute inset-0 rounded-full"
              style={{ background: paused ? '#F59E0B' : '#10B981' }}
            />
            {!paused && (
              <span
                className="absolute -inset-1 rounded-full pulse-ring"
                style={{ background: 'rgba(16,185,129,0.45)' }}
              />
            )}
          </span>
          <span className="text-sm font-medium text-white/85">
            {paused ? 'Paused' : 'Live'}
          </span>
          <span className="text-xs text-white/40">· 1 Hz Remote ID</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:inline-flex items-center gap-1.5 text-xs text-white/55 tabular-nums px-2.5 py-1 rounded-md border border-white/[0.06]">
            <Clock className="w-3 h-3" />
            <span className="font-mono">{formatClockMs(snapshot.at)}</span>
          </div>
          <button
            type="button"
            onClick={onTogglePause}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold text-white/85 hover:text-white border border-white/10 hover:border-white/25 hover:bg-white/[0.05] transition-colors"
          >
            {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{paused ? 'Resume' : 'Pause'}</span>
          </button>
        </div>
      </div>
    </header>
  )
}

function Header({
  drone,
  drones,
  onSelect,
  tick,
  paused,
  snapshot,
}: {
  drone: Drone
  drones: typeof MOCK_DRONES
  onSelect: (id: string) => void
  tick: number
  paused: boolean
  snapshot: Snapshot
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [])

  const seqLabel = `#${String(tick).padStart(5, '0')}`

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
      className="glass-strong p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center gap-4"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            background:
              'linear-gradient(135deg, rgba(59,130,246,0.22), rgba(59,130,246,0.06))',
            border: '1px solid rgba(59,130,246,0.35)',
          }}
        >
          <Plane className="w-5 h-5 text-primary" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
            Broadcasting
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <div ref={ref} className="relative inline-block">
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="inline-flex items-center gap-2 max-w-full"
              >
                <span className="font-inter font-extrabold tracking-tight text-[20px] sm:text-[22px] text-white truncate">
                  {drone.model}
                </span>
                <span className="text-[11px] font-mono text-white/45 tabular-nums">
                  {drone.id}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-white/55 transition-transform ${open ? 'rotate-180' : ''}`}
                />
              </button>

              <AnimatePresence>
                {open && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: EASE_OUT_QUART }}
                    className="absolute top-full left-0 mt-2 z-50 min-w-[320px] glass-strong p-1.5 max-h-[360px] overflow-y-auto"
                  >
                    {drones.map((d) => {
                      const active = d.id === drone.id
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            onSelect(d.id)
                            setOpen(false)
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors ${
                            active
                              ? 'bg-primary/15 text-white'
                              : 'text-white/85 hover:bg-white/[0.05]'
                          }`}
                        >
                          <span
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{
                              background:
                                d.status === 'active'
                                  ? '#10B981'
                                  : d.status === 'violation'
                                    ? '#EF4444'
                                    : '#6B7280',
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate">
                              {d.model}
                            </div>
                            <div className="text-[11px] font-mono text-white/45">
                              {d.id} · {d.city}
                            </div>
                          </div>
                          {active && <CheckCircle className="w-4 h-4 text-primary" />}
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="text-[12px] text-white/55 mt-1 truncate">
            {drone.city}, {drone.state} · {drone.purpose}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <SmallStat
          icon={<Radio className="w-3.5 h-3.5" />}
          label="Sequence"
          value={seqLabel}
        />
        <SmallStat
          icon={<Wifi className="w-3.5 h-3.5" />}
          label="Channel"
          value="2.4 GHz"
        />
        <SmallStat
          icon={<Signal className="w-3.5 h-3.5" />}
          label="Signal"
          value={snapshot.signal}
          tone={
            snapshot.signal === 'Strong'
              ? 'good'
              : snapshot.signal === 'Good'
                ? 'neutral'
                : 'warn'
          }
        />
        {paused && (
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] uppercase tracking-[0.16em] text-warning">
            <span className="w-1.5 h-1.5 rounded-full bg-warning" />
            Stream paused
          </span>
        )}
      </div>
    </motion.section>
  )
}

function SmallStat({
  icon,
  label,
  value,
  tone = 'neutral',
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone?: 'good' | 'neutral' | 'warn'
}) {
  const color =
    tone === 'good' ? '#10B981' : tone === 'warn' ? '#F59E0B' : '#9CA3AF'
  return (
    <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <span style={{ color }}>{icon}</span>
      <div className="leading-tight">
        <div className="text-[10px] uppercase tracking-[0.16em] text-white/45">
          {label}
        </div>
        <div className="text-[12.5px] font-semibold text-white tabular-nums">
          {value}
        </div>
      </div>
    </div>
  )
}

function BroadcastCard({
  snapshot,
  prefersReducedMotion,
  onCopy,
}: {
  snapshot: Snapshot
  prefersReducedMotion: boolean
  onCopy: (text: string, label: string) => void
}) {
  const dir = headingDirection(snapshot.heading)
  const dirName = DIRECTION_NAMES[dir]

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
      className="relative overflow-hidden glass-strong"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(closest-side, rgba(59,130,246,0.25), transparent 70%)' }}
      />

      <header className="relative px-5 sm:px-6 pt-5 pb-4 flex items-center gap-3 border-b border-white/[0.06]">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{
            background: 'rgba(59,130,246,0.16)',
            border: '1px solid rgba(59,130,246,0.35)',
          }}
        >
          <Radio className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-[0.2em] text-primary/80 font-semibold">
            Remote ID Broadcast
          </div>
          <div className="font-inter font-bold text-[16px] text-white truncate">
            ASTM F3411-22a · 1 Hz Standard
          </div>
        </div>
        <TickTimestamp at={snapshot.at} prefersReducedMotion={prefersReducedMotion} />
      </header>

      <div className="relative p-5 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
        <Section title="Drone Identity" icon={<Plane className="w-3.5 h-3.5" />}>
          <Row label="Drone ID" value={snapshot.drone.id} mono onCopy={onCopy} copyKey="Drone ID" />
          <Row label="Serial" value={snapshot.drone.serial} mono onCopy={onCopy} copyKey="Serial" />
          <Row
            label="Registration"
            value={registrationFor(snapshot.drone)}
            mono
            onCopy={onCopy}
            copyKey="Registration"
          />
        </Section>

        <Section title="Real-Time Location" icon={<MapPin className="w-3.5 h-3.5" />}>
          <Row label="Latitude" value={formatLat(snapshot.lat)} mono live />
          <Row label="Longitude" value={formatLng(snapshot.lng)} mono live />
          <Row label="Altitude AGL" value={`${snapshot.altitudeAGL} m`} mono live />
          <Row label="Altitude MSL" value={`${snapshot.altitudeMSL} m`} mono live />
          <Row label="Speed" value={`${snapshot.speed} km/h`} mono live />
          <Row
            label="Heading"
            value={`${snapshot.heading}° ${dir} ${dirName}`}
            mono
            live
          />
        </Section>

        <Section title="Pilot Information" icon={<User className="w-3.5 h-3.5" />}>
          <Row label="Pilot ID" value={pilotIdFor(snapshot.drone)} mono />
          <Row label="License" value={snapshot.drone.pilotLicense} mono />
          <Row
            label="Location"
            value={`${formatLat(snapshot.pilotLat)}  ${formatLng(snapshot.pilotLng)}`}
            mono
          />
          <Row
            label="Distance from drone"
            value={`${snapshot.pilotDistance} m`}
            mono
            live
          />
        </Section>

        <Section title="Control Station" icon={<Crosshair className="w-3.5 h-3.5" />}>
          <Row label="Latitude" value={formatLat(snapshot.ctrlLat)} mono />
          <Row label="Longitude" value={formatLng(snapshot.ctrlLng)} mono />
          <Row label="Altitude MSL" value={`${snapshot.ctrlAltMSL} m`} mono />
        </Section>

        <Section
          title="Flight Status"
          icon={<Gauge className="w-3.5 h-3.5" />}
          full
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatusTile
              label="Emergency"
              value={snapshot.emergency}
              tone={snapshot.emergency === 'NONE' ? 'good' : 'bad'}
              icon={<ShieldAlert className="w-3.5 h-3.5" />}
            />
            <BatteryTile battery={snapshot.battery} />
            <StatusTile
              label="Signal"
              value={snapshot.signal}
              tone={
                snapshot.signal === 'Strong'
                  ? 'good'
                  : snapshot.signal === 'Good'
                    ? 'neutral'
                    : 'warn'
              }
              icon={<Signal className="w-3.5 h-3.5" />}
            />
            <StatusTile
              label="Compliance"
              value={
                snapshot.compliance === 'compliant'
                  ? 'FULLY COMPLIANT'
                  : snapshot.compliance === 'caution'
                    ? 'CAUTION'
                    : 'NON COMPLIANT'
              }
              tone={
                snapshot.compliance === 'compliant'
                  ? 'good'
                  : snapshot.compliance === 'caution'
                    ? 'warn'
                    : 'bad'
              }
              icon={<ShieldCheck className="w-3.5 h-3.5" />}
              wide
            />
          </div>
        </Section>
      </div>
    </motion.section>
  )
}

function TickTimestamp({
  at,
  prefersReducedMotion,
}: {
  at: Date
  prefersReducedMotion: boolean
}) {
  return (
    <div className="text-right">
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/40">
        Timestamp
      </div>
      <motion.div
        key={at.toISOString()}
        initial={prefersReducedMotion ? false : { opacity: 0.4, y: -2 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: EASE_OUT_QUART }}
        className="font-mono text-[13px] text-white tabular-nums"
      >
        {formatClockMs(at)}
      </motion.div>
    </div>
  )
}

function Section({
  title,
  icon,
  children,
  full,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  full?: boolean
}) {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-primary/80">{icon}</span>
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/55 font-semibold">
          {title}
        </span>
        <span className="flex-1 h-px bg-white/[0.06]" />
      </div>
      <div className="grid gap-1.5">{children}</div>
    </div>
  )
}

function Row({
  label,
  value,
  mono,
  live,
  onCopy,
  copyKey,
}: {
  label: string
  value: string
  mono?: boolean
  live?: boolean
  onCopy?: (text: string, label: string) => void
  copyKey?: string
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] transition-colors">
      <span className="text-[12px] text-white/55">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        {live && (
          <motion.span
            key={value}
            initial={{ opacity: 0.5, color: '#3B82F6' }}
            animate={{ opacity: 1, color: '#F9FAFB' }}
            transition={{ duration: 0.5, ease: EASE_OUT_QUART }}
            className={`text-[13px] font-semibold tabular-nums truncate ${mono ? 'font-mono' : ''}`}
          >
            {value}
          </motion.span>
        )}
        {!live && (
          <span
            className={`text-[13px] font-semibold tabular-nums truncate ${mono ? 'font-mono' : ''}`}
          >
            {value}
          </span>
        )}
        {onCopy && copyKey && (
          <button
            type="button"
            onClick={() => onCopy(value, copyKey)}
            className="text-white/35 hover:text-white/85 transition-colors"
            aria-label={`Copy ${copyKey}`}
          >
            <Copy className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}

function StatusTile({
  label,
  value,
  tone,
  icon,
  wide,
}: {
  label: string
  value: string
  tone: 'good' | 'warn' | 'bad' | 'neutral'
  icon: React.ReactNode
  wide?: boolean
}) {
  const color =
    tone === 'good' ? '#10B981' : tone === 'warn' ? '#F59E0B' : tone === 'bad' ? '#EF4444' : '#9CA3AF'
  return (
    <div
      className={`px-3 py-3 rounded-xl border bg-white/[0.02] flex flex-col gap-1 ${wide ? 'col-span-2 lg:col-span-1' : ''}`}
      style={{
        borderColor: `${color}33`,
      }}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-white/55">
        <span style={{ color }}>{icon}</span>
        {label}
      </div>
      <div
        className="font-inter font-extrabold text-[14px] tabular-nums tracking-tight"
        style={{ color }}
      >
        {value}
      </div>
    </div>
  )
}

function BatteryTile({ battery }: { battery: number }) {
  const tone: 'good' | 'warn' | 'bad' = battery >= 50 ? 'good' : battery >= 25 ? 'warn' : 'bad'
  const color = tone === 'good' ? '#10B981' : tone === 'warn' ? '#F59E0B' : '#EF4444'
  return (
    <div
      className="px-3 py-3 rounded-xl border bg-white/[0.02] flex flex-col gap-1.5"
      style={{ borderColor: `${color}33` }}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-white/55">
        <Battery className="w-3.5 h-3.5" style={{ color }} />
        Battery
      </div>
      <div className="flex items-center gap-2">
        <motion.div
          key={battery}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="font-inter font-extrabold text-[14px] tabular-nums tracking-tight"
          style={{ color }}
        >
          {battery}%
        </motion.div>
        <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
          <motion.div
            initial={false}
            animate={{ width: `${battery}%` }}
            transition={{ duration: 0.6, ease: EASE_OUT_QUART }}
            className="h-full rounded-full"
            style={{ background: color }}
          />
        </div>
      </div>
    </div>
  )
}

function ComplianceBadge({ level }: { level: ComplianceLevel }) {
  const map = {
    compliant: {
      label: 'FULLY COMPLIANT',
      sub: 'All Remote ID requirements satisfied',
      color: '#10B981',
      icon: <ShieldCheck className="w-6 h-6" />,
    },
    caution: {
      label: 'CAUTION',
      sub: 'Low battery or weak signal — investigate',
      color: '#F59E0B',
      icon: <ShieldAlert className="w-6 h-6" />,
    },
    noncompliant: {
      label: 'NON COMPLIANT',
      sub: 'Active violation — broadcast may be flagged',
      color: '#EF4444',
      icon: <ShieldAlert className="w-6 h-6" />,
    },
  } as const

  const m = map[level]

  return (
    <motion.div
      key={level}
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
      className="relative overflow-hidden rounded-2xl p-5 border"
      style={{
        borderColor: `${m.color}55`,
        background: `linear-gradient(135deg, ${m.color}1f, ${m.color}05)`,
      }}
    >
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl pointer-events-none"
        style={{ background: `${m.color}40` }}
      />
      <div className="relative flex items-center gap-3 mb-3">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{ background: `${m.color}26`, color: m.color, border: `1px solid ${m.color}55` }}
        >
          {m.icon}
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/55 font-semibold">
          Compliance Status
        </div>
      </div>
      <div
        className="font-inter font-black tracking-tight"
        style={{ fontSize: '1.6rem', lineHeight: 1.1, color: m.color }}
      >
        {m.label}
      </div>
      <div className="text-[12.5px] text-white/65 mt-1">{m.sub}</div>

      <div className="mt-4 flex items-center gap-2 text-[11px] text-white/55">
        <span className="relative inline-flex w-2 h-2">
          <span className="absolute inset-0 rounded-full" style={{ background: m.color }} />
          <span
            className="absolute -inset-1 rounded-full pulse-ring"
            style={{ background: `${m.color}55` }}
          />
        </span>
        <span>Updated each second from live broadcast</span>
      </div>
    </motion.div>
  )
}

function HistoryFeed({ history }: { history: Snapshot[] }) {
  return (
    <section className="glass-strong p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-white/65" />
          <span className="text-[11px] uppercase tracking-[0.18em] text-white/55 font-semibold">
            Broadcast History
          </span>
        </div>
        <span className="text-[11px] text-white/40 tabular-nums">
          last {history.length} of 10
        </span>
      </div>

      <div className="grid gap-1.5 min-h-[420px]">
        {history.length === 0 && (
          <div className="text-center text-white/40 text-sm py-12">
            Waiting for first broadcast…
          </div>
        )}

        <AnimatePresence initial={false}>
          {history.map((s, idx) => (
            <motion.div
              key={s.id}
              layout
              initial={{ opacity: 0, x: -16, height: 0 }}
              animate={{ opacity: 1, x: 0, height: 'auto' }}
              exit={{ opacity: 0, x: 16, height: 0 }}
              transition={{ duration: 0.35, ease: EASE_OUT_QUART }}
              className="relative px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02] flex items-center gap-3"
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  background:
                    s.compliance === 'compliant'
                      ? '#10B981'
                      : s.compliance === 'caution'
                        ? '#F59E0B'
                        : '#EF4444',
                }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-[11.5px] text-white/85">
                  <span className="font-mono tabular-nums">
                    {formatHistoryClock(s.at)}
                  </span>
                  {idx === 0 && (
                    <span className="text-[9px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded text-primary border border-primary/40 bg-primary/10">
                      Latest
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-white/45 font-mono tabular-nums truncate">
                  {formatLat(s.lat)} · {formatLng(s.lng)}
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[12px] font-semibold text-white tabular-nums">
                  {s.altitudeAGL}m
                </div>
                <div className="text-[10.5px] text-white/45 tabular-nums">
                  {s.speed} km/h
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  )
}

function ChainPanel({
  snapshot,
  storing,
  onStore,
  txs,
  onCopy,
}: {
  snapshot: Snapshot
  storing: boolean
  onStore: () => void
  txs: ChainTx[]
  onCopy: (text: string, label: string) => void
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05, ease: EASE_OUT_EXPO }}
      className="glass-strong p-5 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-primary/80 font-semibold">
              Anchor on Solana
            </span>
          </div>
          <div className="font-inter font-bold text-[16px] text-white">
            Store this broadcast on-chain
          </div>
          <div className="text-[12.5px] text-white/55 mt-0.5">
            Hash the current frame and write the proof to a Solana memo.
          </div>
        </div>

        <button
          type="button"
          onClick={onStore}
          disabled={storing}
          className="relative inline-flex items-center justify-center gap-2 h-11 px-5 rounded-full font-semibold text-sm text-white whitespace-nowrap shrink-0 disabled:opacity-60 disabled:cursor-not-allowed transition-transform"
          style={{
            background:
              'linear-gradient(135deg, rgba(59,130,246,0.95), rgba(99,102,241,0.95))',
            boxShadow: '0 12px 32px -10px rgba(59,130,246,0.6)',
          }}
        >
          {storing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Anchoring…
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Store on Solana
            </>
          )}
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 text-[11px] text-white/55">
        <Pill label="Frame" value={`#${snapshot.id.split('-').pop()}`} />
        <Pill label="Drone" value={snapshot.drone.id} />
        <Pill label="Network" value="Solana Devnet" />
      </div>

      <div className="mt-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] uppercase tracking-[0.18em] text-white/45 font-semibold">
            Recent transactions
          </span>
          <span className="text-[10px] text-white/35 tabular-nums">
            {txs.length} stored
          </span>
        </div>
        <div className="grid gap-1.5">
          {txs.length === 0 && (
            <div className="text-[12px] text-white/40 px-3 py-3 rounded-lg border border-dashed border-white/10">
              No on-chain anchors yet. Click <span className="text-white/65">Store on Solana</span> to publish the current broadcast.
            </div>
          )}
          <AnimatePresence initial={false}>
            {txs.map((tx) => (
              <motion.div
                key={tx.hash}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                transition={{ duration: 0.3, ease: EASE_OUT_QUART }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02]"
              >
                <CheckCircle className="w-4 h-4 text-success shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-mono text-white truncate">
                    {shortHash(tx.hash)}
                  </div>
                  <div className="text-[11px] text-white/45 tabular-nums">
                    block {tx.block.toLocaleString()} · {formatHistoryClock(tx.at)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onCopy(tx.hash, 'Tx hash')}
                  className="text-white/45 hover:text-white transition-colors shrink-0"
                  aria-label="Copy hash"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </motion.section>
  )
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02]">
      <div className="text-[9.5px] uppercase tracking-[0.16em] text-white/40">
        {label}
      </div>
      <div className="text-[12px] font-semibold font-mono text-white tabular-nums truncate">
        {value}
      </div>
    </div>
  )
}

function BroadcastStyles() {
  return (
    <style>{`
      .pulse-ring {
        animation: pulse-ring 2.4s var(--ease-out-quart, cubic-bezier(0.25,1,0.5,1)) infinite;
      }
    `}</style>
  )
}
