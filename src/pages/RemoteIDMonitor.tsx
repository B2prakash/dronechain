import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
  useMap,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  Battery,
  CheckCircle,
  Compass,
  Filter,
  MapPin,
  RefreshCw,
  Settings,
  Shield,
  Siren,
  X,
  Zap,
  Radio,
  AlertTriangle,
  Eye,
} from 'lucide-react'
import { MOCK_DRONES, MOCK_STATS } from '../data/mockDrones'

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const

type Drone = (typeof MOCK_DRONES)[number]
type FilterKey = 'all' | 'active' | 'violation' | 'grounded'

type Broadcast = {
  key: string
  drone: Drone
  altitude: number
  speed: number
  battery: number
  at: Date
}

type Alert = {
  id: string
  drone: Drone
  severity: 'high' | 'medium'
  title: string
  body: string
  at: Date
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  violation: 'Violation',
  grounded: 'Grounded',
}

function getStatusColor(status: string) {
  if (status === 'active') return '#10B981'
  if (status === 'violation') return '#EF4444'
  if (status === 'grounded') return '#6B7280'
  return '#F59E0B'
}

function getDronePosition(drone: Drone, tick: number): [number, number] {
  const lat =
    drone.location.lat + Math.sin(tick * 0.1 + drone.id.length) * 0.002
  const lng =
    drone.location.lng + Math.cos(tick * 0.1 + drone.id.length) * 0.002
  return [lat, lng]
}

function relativeTime(d: Date) {
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 5) return 'just now'
  if (diff < 60) return `${diff}s ago`
  const m = Math.floor(diff / 60)
  if (m < 60) return `${m} min${m === 1 ? '' : 's'} ago`
  const h = Math.floor(m / 60)
  return `${h}h ago`
}

function formatClock(d: Date) {
  return d.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function buildAlerts(): Alert[] {
  const now = Date.now()
  return [
    {
      id: 'VIO-2026-001',
      drone: MOCK_DRONES.find((d) => d.id === 'DRN-2026-004')!,
      severity: 'high',
      title: 'Altitude exceeded',
      body: '200m above limit near Bangalore.',
      at: new Date(now - 2 * 60 * 1000),
    },
    {
      id: 'VIO-2026-002',
      drone: MOCK_DRONES.find((d) => d.id === 'DRN-2026-003')!,
      severity: 'medium',
      title: 'No Remote ID broadcast',
      body: 'Signal lost for 5 minutes.',
      at: new Date(now - 5 * 60 * 1000),
    },
  ]
}

export default function RemoteIDMonitor() {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()

  const [selectedDrone, setSelectedDrone] = useState<Drone | null>(null)
  const [filter, setFilter] = useState<FilterKey>('all')
  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [tick, setTick] = useState(0)
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([])
  const [alerts] = useState<Alert[]>(() => buildAlerts())

  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1)
      setLastUpdate(new Date())
    }, 3000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    const liveDrones = MOCK_DRONES.filter((d) => d.status === 'active' || d.status === 'violation')
    if (liveDrones.length === 0) return
    const drone = liveDrones[tick % liveDrones.length]
    const jitter = Math.sin(tick * 0.7) * 0.5 + 0.5
    const broadcast: Broadcast = {
      key: `${drone.id}-${tick}`,
      drone,
      altitude: Math.max(0, Math.round(drone.altitude + (jitter - 0.5) * 6)),
      speed: Math.max(0, Math.round(drone.speed + (jitter - 0.5) * 4)),
      battery: Math.max(
        1,
        Math.min(100, Math.round(drone.battery - tick * 0.05 - jitter * 0.4)),
      ),
      at: new Date(),
    }
    setBroadcasts((prev) => [broadcast, ...prev].slice(0, 10))
  }, [tick])

  const counts = useMemo(() => {
    const c = { active: 0, violation: 0, grounded: 0 }
    for (const d of MOCK_DRONES) {
      if (d.status === 'active') c.active++
      else if (d.status === 'violation') c.violation++
      else if (d.status === 'grounded') c.grounded++
    }
    return c
  }, [])

  const filteredDrones = useMemo(
    () => (filter === 'all' ? MOCK_DRONES : MOCK_DRONES.filter((d) => d.status === filter)),
    [filter],
  )

  const alertCount = alerts.length
  const totalRegistered = MOCK_STATS.totalDrones + Math.floor(tick / 6)

  return (
    <div className="h-screen flex flex-col bg-bg text-white overflow-hidden">
      <Navbar
        navigate={navigate}
        lastUpdate={lastUpdate}
        alertCount={alertCount}
      />

      <div className="pt-[64px] flex-1 flex flex-col min-h-0">
        <StatsBar
          counts={counts}
          totalRegistered={totalRegistered}
          tick={tick}
        />

        <FilterBar
          filter={filter}
          setFilter={setFilter}
          counts={counts}
        />

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(360px,420px)] gap-4 px-4 sm:px-6 pb-5 min-h-0">
          <MapPanel
            drones={filteredDrones}
            tick={tick}
            onSelect={setSelectedDrone}
            selectedId={selectedDrone?.id}
            prefersReducedMotion={!!prefersReducedMotion}
          />

          <aside className="relative grid grid-rows-[1fr_auto] gap-4 min-h-0">
            <BroadcastsFeed broadcasts={broadcasts} />
            <AlertsPanel alerts={alerts} onSelect={setSelectedDrone} />

            <AnimatePresence>
              {selectedDrone && (
                <DroneDetailPanel
                  key={selectedDrone.id}
                  drone={selectedDrone}
                  onClose={() => setSelectedDrone(null)}
                />
              )}
            </AnimatePresence>
          </aside>
        </div>
      </div>

      <MapStyles />
    </div>
  )
}

function Navbar({
  navigate,
  lastUpdate,
  alertCount,
}: {
  navigate: ReturnType<typeof useNavigate>
  lastUpdate: Date
  alertCount: number
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
      <div className="h-full max-w-[1600px] mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="group inline-flex items-center gap-1.5 text-sm text-white/65 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Home</span>
          </button>
          <div className="hidden sm:block w-px h-5 bg-white/10" />
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg" aria-hidden>📡</span>
            <span className="font-inter font-extrabold tracking-tight text-[15px] text-white truncate">
              Remote ID Monitor
            </span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <span className="relative inline-flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-danger" />
            <span className="absolute -inset-1 rounded-full pulse-ring" style={{ background: 'rgba(239,68,68,0.45)' }} />
          </span>
          <span className="text-sm font-medium text-white/85">Live</span>
          <span className="text-xs text-white/40">· updates every 3s</span>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden md:inline-flex items-center gap-1.5 text-xs text-white/50 tabular-nums px-2.5 py-1 rounded-md border border-white/[0.06]">
            <RefreshCw className="w-3 h-3" />
            {formatClock(lastUpdate)}
          </div>
          <NavIconButton ariaLabel="Alerts" badge={alertCount}>
            <Bell className="w-4 h-4" />
          </NavIconButton>
          <NavIconButton ariaLabel="Settings">
            <Settings className="w-4 h-4" />
          </NavIconButton>
        </div>
      </div>
    </header>
  )
}

function NavIconButton({
  children,
  ariaLabel,
  badge,
}: {
  children: React.ReactNode
  ariaLabel: string
  badge?: number
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="relative w-9 h-9 rounded-full flex items-center justify-center text-white/75 hover:text-white border border-white/10 hover:border-white/25 hover:bg-white/[0.05] transition-colors"
    >
      {children}
      {badge && badge > 0 ? (
        <span
          className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
          style={{ background: '#EF4444', color: '#fff' }}
        >
          {badge}
        </span>
      ) : null}
    </button>
  )
}

function StatsBar({
  counts,
  totalRegistered,
  tick,
}: {
  counts: { active: number; violation: number; grounded: number }
  totalRegistered: number
  tick: number
}) {
  return (
    <div className="px-4 sm:px-6 pt-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatPill
          label="Active Drones"
          value={counts.active}
          color="#10B981"
          pulse
        />
        <StatPill
          label="Violations"
          value={counts.violation}
          color="#EF4444"
          blink
        />
        <StatPill
          label="No Signal"
          value={counts.grounded}
          color="#6B7280"
        />
        <StatPill
          label="Total Registered"
          value={totalRegistered}
          color="#3B82F6"
          tickHint={tick}
        />
      </div>
    </div>
  )
}

function StatPill({
  label,
  value,
  color,
  pulse,
  blink,
  tickHint,
}: {
  label: string
  value: number
  color: string
  pulse?: boolean
  blink?: boolean
  tickHint?: number
}) {
  return (
    <motion.div
      key={tickHint !== undefined ? tickHint : label}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      className="glass-strong px-4 py-3 flex items-center gap-3"
    >
      <span className="relative inline-flex w-2.5 h-2.5">
        <span
          className="absolute inset-0 rounded-full"
          style={{ background: color, opacity: blink ? undefined : 1 }}
        />
        {pulse && (
          <span
            className="absolute -inset-1 rounded-full pulse-ring"
            style={{ background: `${color}66` }}
          />
        )}
        {blink && (
          <motion.span
            className="absolute -inset-0.5 rounded-full"
            style={{ background: color }}
            animate={{ opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] uppercase tracking-[0.16em] text-white/50">
          {label}
        </div>
        <div
          className="font-inter font-black tabular-nums tracking-tight"
          style={{ fontSize: '1.4rem', lineHeight: 1.05, color }}
        >
          {value.toLocaleString()}
        </div>
      </div>
    </motion.div>
  )
}

function FilterBar({
  filter,
  setFilter,
  counts,
}: {
  filter: FilterKey
  setFilter: (f: FilterKey) => void
  counts: { active: number; violation: number; grounded: number }
}) {
  const items: { key: FilterKey; label: string; count: number; color: string }[] = [
    { key: 'all', label: 'All', count: counts.active + counts.violation + counts.grounded, color: '#3B82F6' },
    { key: 'active', label: 'Active', count: counts.active, color: '#10B981' },
    { key: 'violation', label: 'Violations', count: counts.violation, color: '#EF4444' },
    { key: 'grounded', label: 'Grounded', count: counts.grounded, color: '#9CA3AF' },
  ]
  return (
    <div className="px-4 sm:px-6 pt-3 pb-4 flex items-center gap-2 flex-wrap">
      <div className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.18em] text-white/40 mr-1">
        <Filter className="w-3.5 h-3.5" />
        Filter
      </div>
      {items.map((it) => {
        const active = filter === it.key
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => setFilter(it.key)}
            className="relative inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-[border-color,background,color] duration-200"
            style={{
              background: active ? `${it.color}1a` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${active ? `${it.color}66` : 'rgba(255,255,255,0.1)'}`,
              color: active ? '#fff' : 'rgba(255,255,255,0.7)',
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: it.color }}
            />
            {it.label}
            <span className="text-[11px] tabular-nums text-white/55">
              {it.count}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function MapPanel({
  drones,
  tick,
  onSelect,
  selectedId,
  prefersReducedMotion,
}: {
  drones: Drone[]
  tick: number
  onSelect: (d: Drone) => void
  selectedId?: string
  prefersReducedMotion: boolean
}) {
  return (
    <div
      className="relative overflow-hidden h-full"
      style={{
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        zoomControl={false}
        style={{
          height: '100%',
          width: '100%',
          background: '#0a0f1a',
        }}
      >
        <ResizeOnMount />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          className="osm-dark-tiles"
        />

        {drones.map((d) => {
          const [lat, lng] = getDronePosition(d, tick)
          const color = getStatusColor(d.status)
          const isActive = d.status === 'active'
          const isViolation = d.status === 'violation'
          const isSelected = selectedId === d.id
          return (
            <CircleMarker
              key={d.id}
              center={[lat, lng]}
              radius={isActive ? 11 : 9}
              pathOptions={{
                color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.85)',
                weight: isSelected ? 3 : 2,
                fillColor: color,
                fillOpacity: 0.9,
                className: isViolation && !prefersReducedMotion ? 'drone-marker drone-marker-violation' : 'drone-marker',
              }}
              eventHandlers={{
                click: () => onSelect(d),
              }}
            >
              <Popup>
                <DronePopup drone={d} onView={() => onSelect(d)} />
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>

      <MapLegend />
    </div>
  )
}

function ResizeOnMount() {
  const map = useMap()
  useEffect(() => {
    const id = setTimeout(() => map.invalidateSize(), 60)
    const onResize = () => map.invalidateSize()
    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(id)
      window.removeEventListener('resize', onResize)
    }
  }, [map])
  return null
}

function DronePopup({ drone, onView }: { drone: Drone; onView: () => void }) {
  const color = getStatusColor(drone.status)
  return (
    <div className="dronechain-popup">
      <div className="flex items-center justify-between gap-3">
        <div className="font-mono text-[12px] text-white/85">{drone.id}</div>
        <span
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider"
          style={{ background: `${color}1a`, border: `1px solid ${color}40`, color }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
          {STATUS_LABEL[drone.status] ?? drone.status}
        </span>
      </div>
      <div className="mt-2 text-[13px] font-semibold text-white">{drone.model}</div>
      <div className="mt-0.5 text-[11px] text-white/55">{drone.owner}</div>

      <ul className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <PopupStat label="Altitude" value={`${drone.altitude}m`} />
        <PopupStat label="Speed" value={`${drone.speed} km/h`} />
        <PopupStat label="Battery" value={`${drone.battery}%`} />
      </ul>

      <div className="mt-3 flex items-center justify-between gap-2">
        <span
          className="inline-flex items-center gap-1 text-[11px]"
          style={{ color: drone.remoteIdActive ? '#10B981' : '#F59E0B' }}
        >
          <Radio className="w-3 h-3" />
          Remote ID {drone.remoteIdActive ? 'Active' : 'Inactive'}
        </span>
        <button
          type="button"
          onClick={onView}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white"
          style={{ background: '#3B82F6' }}
        >
          View Details
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}

function PopupStat({ label, value }: { label: string; value: string }) {
  return (
    <li
      className="rounded-md px-2 py-1.5"
      style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="text-[9px] uppercase tracking-wider text-white/45">{label}</div>
      <div className="font-mono text-[12px] text-white/95 tabular-nums">{value}</div>
    </li>
  )
}

function MapLegend() {
  const items = [
    { color: '#10B981', label: 'Active' },
    { color: '#EF4444', label: 'Violation' },
    { color: '#F59E0B', label: 'Warning' },
    { color: '#6B7280', label: 'Grounded' },
  ]
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3, ease: EASE_OUT_EXPO }}
      className="absolute left-3 bottom-3 z-[400] glass-strong px-3 py-2.5"
    >
      <div className="text-[10px] uppercase tracking-[0.18em] text-white/45 mb-1.5">
        Legend
      </div>
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-2 text-xs text-white/80">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: it.color, boxShadow: `0 0 8px ${it.color}88` }}
            />
            {it.label}
          </li>
        ))}
      </ul>
    </motion.div>
  )
}

function BroadcastsFeed({ broadcasts }: { broadcasts: Broadcast[] }) {
  return (
    <div className="glass-strong flex flex-col min-h-0 overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div>
          <div className="font-inter font-bold text-white text-[15px] flex items-center gap-2">
            <span aria-hidden>📡</span>
            Live Broadcasts
          </div>
          <div className="text-xs text-white/45 mt-0.5">
            Real-time Remote ID data
          </div>
        </div>
        <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-success">
          <span className="w-1.5 h-1.5 rounded-full bg-success pulse-dot" />
          Live
        </div>
      </div>
      <ul className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 space-y-2 dronechain-scroll">
        <AnimatePresence initial={false}>
          {broadcasts.length === 0 && (
            <li className="px-2 py-6 text-center text-sm text-white/45">
              Waiting for first broadcast...
            </li>
          )}
          {broadcasts.map((b) => (
            <motion.li
              key={b.key}
              layout
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
              className="rounded-[12px] px-3 py-2.5"
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
              }}
            >
              <BroadcastRow b={b} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  )
}

function BroadcastRow({ b }: { b: Broadcast }) {
  const color = getStatusColor(b.drone.status)
  const battColor = b.battery > 30 ? '#10B981' : b.battery > 15 ? '#F59E0B' : '#EF4444'
  return (
    <div className="flex items-center gap-3">
      <span
        className="relative inline-flex w-2 h-2 shrink-0"
        aria-hidden
      >
        <span className="absolute inset-0 rounded-full" style={{ background: color }} />
        {b.drone.status === 'active' && (
          <span
            className="absolute -inset-1 rounded-full pulse-ring"
            style={{ background: `${color}66` }}
          />
        )}
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[12px] font-semibold text-white">
            {b.drone.id}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-white/40">
            {b.drone.city}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2.5 text-[11px] text-white/65 tabular-nums">
          <span>{b.altitude}m</span>
          <span className="text-white/20">·</span>
          <span>{b.speed} km/h</span>
          <span className="text-white/20">·</span>
          <span style={{ color: battColor }}>{b.battery}% 🔋</span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[10px] text-white/40">{relativeTime(b.at)}</div>
        <div
          className="mt-0.5 inline-flex items-center gap-1 text-[10px]"
          style={{ color: b.drone.remoteIdActive ? '#10B981' : '#F59E0B' }}
        >
          {b.drone.remoteIdActive ? (
            <>
              <CheckCircle className="w-3 h-3" />
              Remote ID
            </>
          ) : (
            <>
              <AlertTriangle className="w-3 h-3" />
              No ID
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function AlertsPanel({
  alerts,
  onSelect,
}: {
  alerts: Alert[]
  onSelect: (d: Drone) => void
}) {
  return (
    <div className="glass-strong overflow-hidden">
      <div className="flex items-center justify-between px-5 pt-4 pb-3">
        <div>
          <div className="font-inter font-bold text-white text-[15px] flex items-center gap-2">
            <span aria-hidden>⚠️</span>
            Active Alerts
          </div>
          <div className="text-xs text-white/45 mt-0.5">
            {alerts.length} requiring attention
          </div>
        </div>
        <div className="inline-flex items-center gap-1 text-[11px] text-danger">
          <Siren className="w-3.5 h-3.5" />
          {alerts.length}
        </div>
      </div>
      <ul className="px-3 pb-3 space-y-2">
        {alerts.map((a) => (
          <motion.li
            key={a.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            className="relative rounded-[12px] pl-4 pr-3 py-3"
            style={{
              background:
                a.severity === 'high'
                  ? 'rgba(239,68,68,0.06)'
                  : 'rgba(245,158,11,0.06)',
              border: `1px solid ${a.severity === 'high' ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
            }}
          >
            <span
              className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
              style={{
                background: a.severity === 'high' ? '#EF4444' : '#F59E0B',
              }}
            />
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[12px] text-white/85">
                    {a.drone.id}
                  </span>
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider"
                    style={{
                      color: a.severity === 'high' ? '#EF4444' : '#F59E0B',
                    }}
                  >
                    {a.title}
                  </span>
                </div>
                <div className="mt-1 text-xs text-white/65 leading-snug">
                  {a.body}
                </div>
                <div className="mt-1 text-[10px] text-white/35">
                  {relativeTime(a.at)}
                </div>
              </div>
              <button
                type="button"
                onClick={() => onSelect(a.drone)}
                className="shrink-0 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors"
                style={{
                  color: a.severity === 'high' ? '#EF4444' : '#F59E0B',
                  background:
                    a.severity === 'high'
                      ? 'rgba(239,68,68,0.1)'
                      : 'rgba(245,158,11,0.1)',
                  border: `1px solid ${a.severity === 'high' ? 'rgba(239,68,68,0.3)' : 'rgba(245,158,11,0.3)'}`,
                }}
              >
                <Eye className="w-3 h-3" />
                Investigate
              </button>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  )
}

function DroneDetailPanel({
  drone,
  onClose,
}: {
  drone: Drone
  onClose: () => void
}) {
  const color = getStatusColor(drone.status)

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      className="absolute inset-0 glass-strong overflow-y-auto z-20"
      style={{
        background: 'rgba(13,18,30,0.97)',
      }}
    >
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between gap-3 sticky top-0 backdrop-blur-md" style={{ background: 'rgba(13,18,30,0.97)' }}>
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider"
            style={{
              background: `${color}1a`,
              border: `1px solid ${color}40`,
              color,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
            {STATUS_LABEL[drone.status] ?? drone.status}
          </span>
          <span className="font-mono text-[13px] text-white/85 truncate">{drone.id}</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className="w-8 h-8 rounded-full flex items-center justify-center text-white/65 hover:text-white border border-white/10 hover:border-white/25 hover:bg-white/[0.05] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="px-5 py-4">
        <div className="font-inter font-bold text-white text-lg leading-tight">
          {drone.model}
        </div>
        <div className="text-xs text-white/50">Serial · {drone.serial}</div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <DetailField
            icon={<Compass className="w-3.5 h-3.5" />}
            label="Owner"
            value={drone.owner}
          />
          <DetailField
            icon={<Shield className="w-3.5 h-3.5" />}
            label="Wallet"
            value={drone.walletAddress}
            mono
          />
          <DetailField
            icon={<MapPin className="w-3.5 h-3.5" />}
            label="Location"
            value={`${drone.city}, ${drone.state}`}
          />
          <DetailField
            icon={<MapPin className="w-3.5 h-3.5" />}
            label="Coordinates"
            value={`${drone.location.lat.toFixed(4)}, ${drone.location.lng.toFixed(4)}`}
            mono
          />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3">
          <MetricBlock label="Altitude AGL" value={`${drone.altitude}`} suffix="m" accent="#3B82F6" />
          <MetricBlock label="Altitude MSL" value={`${drone.altitudeMSL}`} suffix="m" accent="#3B82F6" />
          <MetricBlock label="Speed" value={`${drone.speed}`} suffix=" km/h" accent="#A855F7" />
          <MetricBlock label="Heading" value={`${drone.heading}`} suffix="°" accent="#A855F7" />
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-white/55">
            <span className="inline-flex items-center gap-1.5">
              <Battery className="w-3.5 h-3.5" />
              Battery
            </span>
            <span className="font-mono tabular-nums text-white/85">{drone.battery}%</span>
          </div>
          <BatteryBar value={drone.battery} />
        </div>

        <div className="mt-4 flex items-center justify-between p-3 rounded-[12px]"
          style={{
            background: drone.remoteIdActive ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
            border: `1px solid ${drone.remoteIdActive ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
          }}
        >
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4" style={{ color: drone.remoteIdActive ? '#10B981' : '#F59E0B' }} />
            <div>
              <div className="text-sm font-semibold text-white">Remote ID</div>
              <div className="text-[11px] text-white/55">
                {drone.remoteIdActive ? 'Broadcasting' : 'Signal lost'}
              </div>
            </div>
          </div>
          <span
            className="text-[11px] font-medium uppercase tracking-wider"
            style={{ color: drone.remoteIdActive ? '#10B981' : '#F59E0B' }}
          >
            {drone.remoteIdActive ? 'Active' : 'Inactive'}
          </span>
        </div>

        <div className="mt-4">
          <ComplianceRing value={drone.compliance} />
        </div>

        <div className="mt-5 grid gap-2">
          <ActionButton primary>
            <Eye className="w-4 h-4" />
            View Full Profile
          </ActionButton>
          <div className="grid grid-cols-2 gap-2">
            <ActionButton tone="warning">
              <AlertTriangle className="w-4 h-4" />
              Report Violation
            </ActionButton>
            <ActionButton tone="danger">
              <Zap className="w-4 h-4" />
              Ground Drone
            </ActionButton>
          </div>
        </div>

        <div className="mt-4 text-[11px] text-white/35 text-center">
          Pilot license · {drone.pilotLicense}
        </div>
      </div>
    </motion.div>
  )
}

function DetailField({
  icon,
  label,
  value,
  mono,
}: {
  icon: React.ReactNode
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div
      className="rounded-[10px] p-2.5"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/45">
        {icon}
        {label}
      </div>
      <div
        className={`mt-1 text-[12.5px] text-white/90 truncate ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </div>
    </div>
  )
}

function MetricBlock({
  label,
  value,
  suffix,
  accent,
}: {
  label: string
  value: string
  suffix: string
  accent: string
}) {
  return (
    <div
      className="rounded-[10px] p-3"
      style={{
        background: `${accent}0a`,
        border: `1px solid ${accent}25`,
      }}
    >
      <div className="text-[10px] uppercase tracking-wider text-white/45">
        {label}
      </div>
      <div className="mt-1 font-inter font-bold text-white text-lg tabular-nums leading-none">
        {value}
        <span className="font-sans font-normal text-sm text-white/50">{suffix}</span>
      </div>
    </div>
  )
}

function BatteryBar({ value }: { value: number }) {
  const color = value > 30 ? '#10B981' : value > 15 ? '#F59E0B' : '#EF4444'
  return (
    <div className="mt-1.5 h-2 rounded-full bg-white/[0.06] overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.9, ease: EASE_OUT_QUART }}
        className="h-full rounded-full"
        style={{ background: color }}
      />
    </div>
  )
}

function ComplianceRing({ value }: { value: number }) {
  const color = value >= 95 ? '#10B981' : value >= 80 ? '#F59E0B' : '#EF4444'
  const r = 30
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c
  return (
    <div className="flex items-center gap-4 p-3 rounded-[12px]"
      style={{
        background: 'rgba(255,255,255,0.025)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="relative w-[80px] h-[80px] shrink-0">
        <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
          <circle cx="40" cy="40" r={r} stroke="rgba(255,255,255,0.08)" strokeWidth="6" fill="none" />
          <motion.circle
            cx="40"
            cy="40"
            r={r}
            stroke={color}
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.1, ease: EASE_OUT_QUART }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="font-inter font-black text-white text-lg tabular-nums leading-none" style={{ color }}>
              {value}
            </div>
            <div className="text-[9px] text-white/45 uppercase tracking-wider">Score</div>
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[10px] uppercase tracking-wider text-white/45">Compliance</div>
        <div className="mt-1 text-sm text-white/85 leading-snug">
          {value >= 95
            ? 'Fully compliant. No issues detected.'
            : value >= 80
              ? 'Mostly compliant. Minor issues flagged.'
              : 'Non-compliant. Authority intervention recommended.'}
        </div>
      </div>
    </div>
  )
}

function ActionButton({
  children,
  primary,
  tone = 'default',
}: {
  children: React.ReactNode
  primary?: boolean
  tone?: 'default' | 'warning' | 'danger'
}) {
  const colors = primary
    ? { bg: '#3B82F6', color: '#fff', border: '#3B82F6' }
    : tone === 'warning'
      ? { bg: 'rgba(245,158,11,0.08)', color: '#F59E0B', border: 'rgba(245,158,11,0.3)' }
      : tone === 'danger'
        ? { bg: 'rgba(239,68,68,0.08)', color: '#EF4444', border: 'rgba(239,68,68,0.3)' }
        : { bg: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.85)', border: 'rgba(255,255,255,0.1)' }

  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-[background,transform] duration-200 active:scale-[0.98]"
      style={{
        background: colors.bg,
        color: colors.color,
        border: `1px solid ${colors.border}`,
        boxShadow: primary ? '0 8px 24px -10px rgba(59,130,246,0.55)' : 'none',
      }}
    >
      {children}
    </button>
  )
}

function MapStyles() {
  return (
    <style>{`
      .osm-dark-tiles {
        filter: invert(0.92) hue-rotate(180deg) brightness(0.92) contrast(0.95) saturate(0.7);
      }
      .leaflet-container {
        background: #0a0f1a !important;
        font-family: 'DM Sans', sans-serif !important;
      }
      .leaflet-control-attribution {
        background: rgba(10,15,26,0.7) !important;
        color: rgba(255,255,255,0.45) !important;
        border: 1px solid rgba(255,255,255,0.06) !important;
        border-radius: 6px !important;
        padding: 2px 6px !important;
        font-size: 10px !important;
      }
      .leaflet-control-attribution a {
        color: rgba(255,255,255,0.65) !important;
      }
      .leaflet-popup-content-wrapper {
        background: rgba(13,18,30,0.97) !important;
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        color: #F9FAFB !important;
        border: 1px solid rgba(255,255,255,0.08) !important;
        border-radius: 12px !important;
        box-shadow: 0 20px 50px -20px rgba(0,0,0,0.7) !important;
      }
      .leaflet-popup-content {
        margin: 12px 14px !important;
        min-width: 240px;
      }
      .leaflet-popup-tip {
        background: rgba(13,18,30,0.97) !important;
        border: 1px solid rgba(255,255,255,0.08) !important;
        box-shadow: none !important;
      }
      .leaflet-popup-close-button {
        color: rgba(255,255,255,0.45) !important;
        font-size: 18px !important;
        padding: 6px 8px !important;
      }
      .leaflet-popup-close-button:hover {
        color: rgba(255,255,255,0.9) !important;
      }
      .drone-marker {
        filter: drop-shadow(0 0 10px currentColor);
        transition: filter 220ms ease;
      }
      .drone-marker-violation {
        animation: drone-blink 1.4s ease-in-out infinite;
      }
      @keyframes drone-blink {
        0%, 100% { fill-opacity: 0.95; }
        50% { fill-opacity: 0.45; }
      }
      .dronechain-scroll::-webkit-scrollbar {
        width: 6px;
      }
      .dronechain-scroll::-webkit-scrollbar-track {
        background: transparent;
      }
      .dronechain-scroll::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.08);
        border-radius: 6px;
      }
      .dronechain-scroll::-webkit-scrollbar-thumb:hover {
        background: rgba(255,255,255,0.16);
      }
      .leaflet-bar a {
        background: rgba(13,18,30,0.97) !important;
        color: #F9FAFB !important;
        border-color: rgba(255,255,255,0.08) !important;
      }
      .leaflet-bar a:hover {
        background: rgba(17,24,39,1) !important;
      }
    `}</style>
  )
}
