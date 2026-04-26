import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  Bell,
  CheckCircle,
  Eye,
  FileText,
  LogOut,
  Mail,
  Map as MapIcon,
  Plus,
  Search,
  Send,
  Shield,
  Users,
  XCircle,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { MOCK_DRONES, MOCK_VIOLATIONS, NO_FLY_ZONES } from '../data/mockDrones'

const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const

type TabKey = 'overview' | 'map' | 'investigate' | 'zones' | 'violations' | 'reports'
type Drone = (typeof MOCK_DRONES)[number]

type Alert = {
  id: number
  type: string
  message: string
  time: string
  severity: 'high' | 'medium' | 'low'
}

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <Shield className="w-3.5 h-3.5" /> },
  { key: 'map', label: 'Live Map', icon: <MapIcon className="w-3.5 h-3.5" /> },
  { key: 'investigate', label: 'Investigate', icon: <Search className="w-3.5 h-3.5" /> },
  { key: 'zones', label: 'No-Fly Zones', icon: <Ban className="w-3.5 h-3.5" /> },
  { key: 'violations', label: 'Violations', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  { key: 'reports', label: 'Reports', icon: <FileText className="w-3.5 h-3.5" /> },
]

function readUser(): { name?: string; email?: string; role?: string } {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem('dronechain_user') || '{}')
  } catch {
    return {}
  }
}

export default function AuthorityPortal() {
  const navigate = useNavigate()
  const user = useMemo(readUser, [])

  if (user.role !== 'authority') {
    return <AccessDenied navigate={navigate} />
  }
  return <PortalView user={user} navigate={navigate} />
}

function AccessDenied({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  const grantDemo = () => {
    localStorage.setItem(
      'dronechain_user',
      JSON.stringify({
        name: 'Inspector A. Sharma',
        email: 'authority@dgca.gov.in',
        role: 'authority',
      }),
    )
    toast.success('Demo authority session enabled')
    setTimeout(() => window.location.reload(), 350)
  }
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-bg text-white flex flex-col items-center justify-center gap-4 px-6 text-center">
      <div className="pointer-events-none absolute inset-0 grid-bg radial-fade opacity-25" />
      <div className="text-7xl">⛔</div>
      <h1 className="font-inter font-black text-[28px] tracking-tight" style={{ color: '#EF4444' }}>
        Access Denied
      </h1>
      <p className="text-[14px] text-white/55 max-w-[420px]">
        This portal is restricted to authorized DGCA officials.
      </p>
      <p className="text-[13px]" style={{ color: '#3B82F6' }}>
        Demo account: <span className="font-mono">authority@dgca.gov.in</span>
      </p>
      <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
        <button
          type="button"
          onClick={() => navigate('/login')}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-full font-semibold text-sm text-white"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.95), rgba(99,102,241,0.95))',
            boxShadow: '0 14px 32px -10px rgba(59,130,246,0.6)',
          }}
        >
          Login as Authority
        </button>
        <button
          type="button"
          onClick={grantDemo}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-full font-semibold text-sm text-white border border-white/15 hover:border-white/35 hover:bg-white/[0.05] transition-colors"
        >
          Use demo session
        </button>
      </div>
    </div>
  )
}

function PortalView({
  user,
  navigate,
}: {
  user: { name?: string; email?: string; role?: string }
  navigate: ReturnType<typeof useNavigate>
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')
  const [tick, setTick] = useState(0)
  const [alerts, setAlerts] = useState<Alert[]>([
    { id: 1, type: 'violation', message: 'DRN-2026-004 exceeded altitude limit', time: '2 mins ago', severity: 'high' },
    { id: 2, type: 'signal', message: 'DRN-2026-003 Remote ID signal lost', time: '8 mins ago', severity: 'medium' },
    { id: 3, type: 'registration', message: 'New drone registration pending approval', time: '15 mins ago', severity: 'low' },
  ])
  const [groundedDrones, setGroundedDrones] = useState<string[]>([])
  const [pendingApprovals, setPendingApprovals] = useState([
    { id: 'APR-001', label: 'New registration: DJI Mavic 3', sub: 'Submitted by Anjali Verma' },
    { id: 'APR-002', label: 'License renewal: PIL-2026-789', sub: 'Pilot: Arjun Mehta' },
    { id: 'APR-003', label: 'Zone clearance: Mumbai Airport', sub: 'Survey crew, 26 Apr' },
  ])

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 3000)
    return () => clearInterval(id)
  }, [])

  const counts = useMemo(() => {
    let active = 0,
      violation = 0,
      grounded = 0
    for (const d of MOCK_DRONES) {
      if (d.status === 'active') active++
      else if (d.status === 'violation') violation++
      else if (d.status === 'grounded') grounded++
    }
    return { active, violation, grounded }
  }, [])

  const dismissAlert = (id: number) =>
    setAlerts((a) => a.filter((x) => x.id !== id))

  const decideApproval = (id: string, approved: boolean) => {
    setPendingApprovals((p) => p.filter((x) => x.id !== id))
    toast.success(approved ? 'Approved on-chain' : 'Rejected and notified')
  }

  const groundDrone = (id: string) => {
    setGroundedDrones((g) => (g.includes(id) ? g : [...g, id]))
    toast.success(`Ground order issued for ${id}`)
  }

  const logout = () => {
    localStorage.removeItem('dronechain_user')
    navigate('/login')
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-bg text-white">
      <div className="pointer-events-none absolute inset-0 grid-bg radial-fade opacity-25" />

      <Navbar
        user={user}
        droneCount={MOCK_DRONES.length}
        alertCount={alerts.length}
        onLogout={logout}
      />

      <main className="relative max-w-[1400px] mx-auto px-4 sm:px-6 pt-6 pb-20">
        <StatsRow counts={counts} />

        <div className="mt-6 flex items-center gap-1 overflow-x-auto border-b border-white/[0.08]">
          {TABS.map((t) => {
            const active = t.key === activeTab
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setActiveTab(t.key)}
                className="relative inline-flex items-center gap-1.5 px-4 py-2.5 text-[13px] whitespace-nowrap transition-colors"
                style={{
                  color: active ? '#FFFFFF' : 'rgba(255,255,255,0.55)',
                  fontWeight: active ? 700 : 500,
                }}
              >
                {t.icon}
                {t.label}
                {active && (
                  <motion.span
                    layoutId="auth-tab-underline"
                    className="absolute -bottom-px left-0 right-0 h-0.5"
                    style={{ background: '#3B82F6' }}
                  />
                )}
              </button>
            )
          })}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease: EASE_OUT_QUART }}
            className="mt-6"
          >
            {activeTab === 'overview' && (
              <OverviewTab
                alerts={alerts}
                pendingApprovals={pendingApprovals}
                onDismiss={dismissAlert}
                onDecide={decideApproval}
                onSwitchTab={setActiveTab}
                navigate={navigate}
              />
            )}
            {activeTab === 'map' && <MapTab tick={tick} />}
            {activeTab === 'investigate' && (
              <InvestigateTab
                groundedDrones={groundedDrones}
                onGround={groundDrone}
                navigate={navigate}
              />
            )}
            {activeTab === 'zones' && <ZonesTab />}
            {activeTab === 'violations' && (
              <ViolationsTab onGround={groundDrone} grounded={groundedDrones} navigate={navigate} />
            )}
            {activeTab === 'reports' && <ReportsTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

function Navbar({
  user,
  droneCount,
  alertCount,
  onLogout,
}: {
  user: { name?: string; email?: string }
  droneCount: number
  alertCount: number
  onLogout: () => void
}) {
  return (
    <header
      className="sticky top-0 z-40"
      style={{
        background: 'rgba(10,15,26,0.85)',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-[64px] flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-lg" aria-hidden>
            🏛️
          </span>
          <div className="min-w-0">
            <div className="font-inter font-extrabold tracking-tight text-[15px] text-white truncate">
              Authority Command Center
            </div>
            <div className="text-[11px] text-white/45 truncate">
              DGCA India · {user.name ?? 'Inspector'}
            </div>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2">
          <span className="relative inline-flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-danger" />
            <span
              className="absolute -inset-1 rounded-full pulse-ring"
              style={{ background: 'rgba(239,68,68,0.45)' }}
            />
          </span>
          <span className="text-sm font-medium text-white/85">Live</span>
          <span className="text-xs text-white/40">· monitoring {droneCount} drones</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Alerts"
            className="relative w-9 h-9 rounded-full flex items-center justify-center text-white/75 hover:text-white border border-white/10 hover:border-white/25 hover:bg-white/[0.05] transition-colors"
          >
            <Bell className="w-4 h-4" />
            {alertCount > 0 && (
              <span
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold flex items-center justify-center"
                style={{ background: '#EF4444', color: '#fff' }}
              >
                {alertCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold text-white/85 hover:text-white border border-white/10 hover:border-white/25 hover:bg-white/[0.05] transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}

function StatsRow({
  counts,
}: {
  counts: { active: number; violation: number; grounded: number }
}) {
  const items = [
    { label: 'Active drones', value: counts.active, color: '#10B981', pulse: true },
    { label: 'Violations', value: MOCK_VIOLATIONS.length, color: '#EF4444', blink: true },
    { label: 'Pending approvals', value: 3, color: '#F59E0B' },
    { label: 'Compliance rate', value: '99.8%', color: '#10B981' },
  ]
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((it) => (
        <div key={it.label} className="glass-strong px-4 py-3.5 flex items-center gap-3">
          <span className="relative inline-flex w-2.5 h-2.5">
            <span className="absolute inset-0 rounded-full" style={{ background: it.color }} />
            {it.pulse && (
              <span
                className="absolute -inset-1 rounded-full pulse-ring"
                style={{ background: `${it.color}55` }}
              />
            )}
            {it.blink && (
              <motion.span
                className="absolute -inset-0.5 rounded-full"
                style={{ background: it.color }}
                animate={{ opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}
          </span>
          <div className="min-w-0">
            <div className="text-[10.5px] uppercase tracking-[0.16em] text-white/45 font-semibold">
              {it.label}
            </div>
            <div
              className="font-inter font-black tabular-nums tracking-tight"
              style={{ fontSize: '1.4rem', lineHeight: 1.05, color: it.color }}
            >
              {typeof it.value === 'number' ? it.value.toLocaleString() : it.value}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function OverviewTab({
  alerts,
  pendingApprovals,
  onDismiss,
  onDecide,
  onSwitchTab,
  navigate,
}: {
  alerts: Alert[]
  pendingApprovals: { id: string; label: string; sub: string }[]
  onDismiss: (id: number) => void
  onDecide: (id: string, approved: boolean) => void
  onSwitchTab: (k: TabKey) => void
  navigate: ReturnType<typeof useNavigate>
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="grid gap-5">
        <Card title="Active alerts" icon={<AlertTriangle className="w-4 h-4 text-danger" />}>
          {alerts.length === 0 ? (
            <Empty>All clear — no active alerts.</Empty>
          ) : (
            <div className="grid gap-2">
              <AnimatePresence initial={false}>
                {alerts.map((a) => {
                  const c = a.severity === 'high' ? '#EF4444' : a.severity === 'medium' ? '#F59E0B' : '#3B82F6'
                  return (
                    <motion.div
                      key={a.id}
                      layout
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.3, ease: EASE_OUT_QUART }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-white/[0.02]"
                      style={{ borderColor: `${c}33` }}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ background: c }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] text-white truncate">{a.message}</div>
                        <div className="text-[11px] text-white/45">{a.time}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onDismiss(a.id)}
                        className="text-[11px] text-white/45 hover:text-white px-2 py-1 rounded-md hover:bg-white/[0.05] transition-colors"
                      >
                        Dismiss
                      </button>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          )}
        </Card>

        <Card title="Pending approvals" icon={<CheckCircle className="w-4 h-4 text-primary" />}>
          {pendingApprovals.length === 0 ? (
            <Empty>Nothing waiting on your approval right now.</Empty>
          ) : (
            <div className="grid gap-2">
              <AnimatePresence initial={false}>
                {pendingApprovals.map((p) => (
                  <motion.div
                    key={p.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-white/[0.08] bg-white/[0.02]"
                  >
                    <div className="min-w-0">
                      <div className="text-[13px] text-white font-semibold truncate">
                        {p.label}
                      </div>
                      <div className="text-[11.5px] text-white/45 truncate">{p.sub}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onDecide(p.id, true)}
                        className="inline-flex items-center gap-1 h-8 px-3 rounded-full text-[11.5px] font-semibold text-success border border-success/40 hover:bg-success/15 transition-colors"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => onDecide(p.id, false)}
                        className="inline-flex items-center gap-1 h-8 px-3 rounded-full text-[11.5px] font-semibold text-danger border border-danger/40 hover:bg-danger/15 transition-colors"
                      >
                        Reject
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-5">
        <Card title="Quick actions" icon={<Send className="w-4 h-4 text-primary" />}>
          <div className="grid gap-2">
            <ActionRow
              label="Open live map"
              emoji="🗺️"
              onClick={() => onSwitchTab('map')}
            />
            <ActionRow
              label="View all violations"
              emoji="⚠️"
              onClick={() => navigate('/violations')}
            />
            <ActionRow
              label="Generate compliance report"
              emoji="📊"
              onClick={() => toast.success('Report queued for download')}
            />
            <ActionRow
              label="Send alert to all operators"
              emoji="📧"
              onClick={() => toast.success('Bulk alert sent to 1,247 operators')}
            />
          </div>
        </Card>

        <Card title="Recent violations" icon={<AlertTriangle className="w-4 h-4 text-danger" />}>
          <div className="grid gap-2">
            {MOCK_VIOLATIONS.slice(0, 2).map((v) => {
              const c = v.severity === 'HIGH' ? '#EF4444' : v.severity === 'MEDIUM' ? '#F59E0B' : '#3B82F6'
              return (
                <div
                  key={v.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-white/[0.02]"
                  style={{ borderColor: `${c}33` }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-mono text-white/55">{v.id}</div>
                    <div className="text-[13px] text-white font-semibold truncate">
                      {v.type}
                    </div>
                    <div className="text-[11.5px] text-white/45 truncate">
                      {v.droneId} · {v.city}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/violations')}
                    className="inline-flex items-center gap-1 h-8 px-3 rounded-full text-[11.5px] font-semibold text-white border border-white/15 hover:border-white/35 hover:bg-white/[0.05] transition-colors"
                  >
                    Investigate
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )
            })}
          </div>
        </Card>
      </div>
    </div>
  )
}

function ActionRow({
  label,
  emoji,
  onClick,
}: {
  label: string
  emoji: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-left hover:bg-white/[0.06] hover:border-white/[0.15] transition-colors"
    >
      <span className="flex items-center gap-2.5 text-[13px] text-white">
        <span aria-hidden className="text-base">
          {emoji}
        </span>
        {label}
      </span>
      <ArrowRight className="w-3.5 h-3.5 text-white/45" />
    </button>
  )
}

function MapTab({ tick }: { tick: number }) {
  return (
    <div className="rounded-2xl overflow-hidden border border-white/[0.08]">
      <MapContainer
        center={[20.5937, 78.9629]}
        zoom={5}
        style={{ height: '600px', width: '100%', background: '#0a0f1a' }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {MOCK_DRONES.map((d) => {
          const lat = d.location.lat + Math.sin(tick * 0.1 + d.id.length) * 0.001
          const lng = d.location.lng + Math.cos(tick * 0.1 + d.id.length) * 0.001
          const color =
            d.status === 'active' ? '#10B981' : d.status === 'violation' ? '#EF4444' : '#6B7280'
          return (
            <CircleMarker
              key={d.id}
              center={[lat, lng]}
              radius={d.status === 'violation' ? 14 : 10}
              fillColor={color}
              color="#FFFFFF"
              weight={2}
              fillOpacity={0.9}
            >
              <Popup>
                <div style={{ minWidth: 200 }}>
                  <strong>{d.id}</strong>
                  <br />
                  {d.model}
                  <br />
                  Owner: {d.owner}
                  <br />
                  Status: {d.status}
                  <br />
                  Altitude: {d.altitude} m
                  <br />
                  Battery: {d.battery}%
                </div>
              </Popup>
            </CircleMarker>
          )
        })}
      </MapContainer>
    </div>
  )
}

function InvestigateTab({
  groundedDrones,
  onGround,
  navigate,
}: {
  groundedDrones: string[]
  onGround: (id: string) => void
  navigate: ReturnType<typeof useNavigate>
}) {
  const [searchId, setSearchId] = useState('')
  const [result, setResult] = useState<Drone | 'not_found' | null>(null)

  const search = () => {
    const q = searchId.trim()
    if (!q) return
    const found = MOCK_DRONES.find((d) => d.id.toLowerCase() === q.toLowerCase())
    setResult(found ?? 'not_found')
  }

  return (
    <Card title="Investigate drone" icon={<Search className="w-4 h-4 text-primary" />}>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          placeholder="Enter Drone ID (e.g. DRN-2026-004)"
          className="flex-1 h-11 px-3.5 rounded-xl text-[14px] text-white placeholder:text-white/35 outline-none"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />
        <button
          type="button"
          onClick={search}
          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl font-semibold text-sm text-white"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.95), rgba(99,102,241,0.95))',
          }}
        >
          <Search className="w-4 h-4" />
          Search
        </button>
      </div>

      <div className="mt-4">
        {result === null && (
          <div className="text-[12.5px] text-white/45">
            Enter a drone ID above to pull its full registry record.
          </div>
        )}
        {result === 'not_found' && (
          <div
            className="rounded-xl px-4 py-3 text-[13px] text-danger"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.35)',
            }}
          >
            Drone not found in registry.
          </div>
        )}
        {result && result !== 'not_found' && (
          <InvestigationResult
            drone={result}
            grounded={groundedDrones.includes(result.id)}
            onGround={() => onGround(result.id)}
            onView={() => navigate(`/drone/${result.id}`)}
          />
        )}
      </div>
    </Card>
  )
}

function InvestigationResult({
  drone,
  grounded,
  onGround,
  onView,
}: {
  drone: Drone
  grounded: boolean
  onGround: () => void
  onView: () => void
}) {
  const c = drone.status === 'active' ? '#10B981' : drone.status === 'violation' ? '#EF4444' : '#6B7280'
  const violation = MOCK_VIOLATIONS.find((v) => v.droneId === drone.id)

  return (
    <div className="grid gap-3">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
        <div>
          <div className="font-inter font-extrabold text-[18px] tracking-tight text-white">
            {drone.id}
          </div>
          <div className="text-[12.5px] text-white/55">
            {drone.model} · {drone.serial}
          </div>
        </div>
        <span
          className="inline-flex items-center gap-1 text-[10.5px] uppercase tracking-[0.14em] font-bold px-2.5 py-1 rounded-full"
          style={{ background: `${c}1f`, color: c, border: `1px solid ${c}55` }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
          {drone.status}
        </span>
      </div>

      <div className="grid sm:grid-cols-2 gap-2">
        <Mini label="Owner" value={drone.owner} />
        <Mini label="Wallet" value={drone.walletAddress} mono />
        <Mini label="Location" value={`${drone.city}, ${drone.state}`} />
        <Mini label="Total flights" value={drone.totalFlights.toLocaleString()} mono />
        <Mini label="Compliance" value={`${drone.compliance}%`} mono />
        <Mini label="Remote ID" value={drone.remoteIdActive ? 'Active' : 'Inactive'} />
      </div>

      {violation && (
        <div
          className="rounded-xl px-4 py-3 text-[12.5px]"
          style={{
            background: 'rgba(239,68,68,0.07)',
            border: '1px solid rgba(239,68,68,0.3)',
          }}
        >
          <span className="font-mono text-danger">{violation.id}</span> · {violation.type} ·{' '}
          {violation.location}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Action onClick={onView} icon={<Eye className="w-3.5 h-3.5" />}>
          View profile
        </Action>
        <Action onClick={() => toast.success('Warning issued')} icon={<AlertTriangle className="w-3.5 h-3.5" />}>
          Issue warning
        </Action>
        <Action onClick={() => toast.success('Added to watchlist')} icon={<Eye className="w-3.5 h-3.5" />}>
          Add to watchlist
        </Action>
        <Action
          onClick={onGround}
          tone="danger"
          icon={<Ban className="w-3.5 h-3.5" />}
          disabled={grounded}
        >
          {grounded ? 'Drone grounded' : 'Ground drone'}
        </Action>
        <Action onClick={() => toast.success('Owner notified')} icon={<Mail className="w-3.5 h-3.5" />}>
          Contact owner
        </Action>
      </div>

      {grounded && (
        <div
          className="rounded-xl px-4 py-3 text-[13px] text-success flex items-center gap-2"
          style={{
            background: 'rgba(16,185,129,0.08)',
            border: '1px solid rgba(16,185,129,0.35)',
          }}
        >
          <CheckCircle className="w-4 h-4" />
          Ground order issued — owner notified.
        </div>
      )}
    </div>
  )
}

function ZonesTab() {
  const [zones, setZones] = useState(NO_FLY_ZONES)
  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [radius, setRadius] = useState('')
  const [altitude, setAltitude] = useState('')

  const addZone = () => {
    if (!name || !city || !radius) {
      toast.error('Name, city, and radius are required')
      return
    }
    const z = {
      id: `NFZ-${String(zones.length + 1).padStart(3, '0')}`,
      name,
      city,
      radiusKm: Number(radius) || 0,
      altitudeM: Number(altitude) || 0,
      status: 'Permanent' as const,
    }
    setZones((prev) => [...prev, z])
    setName('')
    setCity('')
    setRadius('')
    setAltitude('')
    toast.success('Zone added successfully')
  }

  const removeZone = (id: string) => {
    setZones((prev) => prev.filter((z) => z.id !== id))
    toast.success('Zone removed')
  }

  return (
    <div className="grid gap-5">
      <div className="grid gap-3 sm:grid-cols-2">
        {zones.map((z) => (
          <div
            key={z.id}
            className="rounded-2xl p-4"
            style={{
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.35)',
              borderLeftWidth: 4,
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div className="font-inter font-extrabold text-[15px] text-white">
                  {z.name}
                </div>
                <div className="text-[12px] text-white/55">{z.city}</div>
              </div>
              <span
                className="inline-flex items-center gap-1 text-[10.5px] uppercase tracking-[0.14em] font-bold px-2.5 py-1 rounded-full"
                style={{
                  background: z.status === 'Permanent' ? 'rgba(239,68,68,0.18)' : 'rgba(245,158,11,0.18)',
                  color: z.status === 'Permanent' ? '#EF4444' : '#F59E0B',
                  border: `1px solid ${z.status === 'Permanent' ? '#EF4444' : '#F59E0B'}55`,
                }}
              >
                {z.status}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[12px] text-white/65 mb-3">
              <div>
                <span className="text-white/45">Radius:</span> {z.radiusKm} km
              </div>
              <div>
                <span className="text-white/45">Altitude limit:</span>{' '}
                {z.altitudeM === 0 ? 'No-fly' : `${z.altitudeM} m`}
              </div>
              {z.schedule && (
                <div className="col-span-2 text-white/55">⏰ {z.schedule}</div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => toast('Edit form coming soon', { icon: '✏️' })}
                className="inline-flex items-center gap-1 h-8 px-3 rounded-full text-[11.5px] font-semibold text-white border border-white/15 hover:border-white/35 hover:bg-white/[0.05] transition-colors"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => removeZone(z.id)}
                className="inline-flex items-center gap-1 h-8 px-3 rounded-full text-[11.5px] font-semibold text-danger border border-danger/40 hover:bg-danger/15 transition-colors"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <Card title="Add new no-fly zone" icon={<Plus className="w-4 h-4 text-primary" />}>
        <div className="grid sm:grid-cols-2 gap-3">
          <Input label="Zone name" value={name} onChange={setName} placeholder="e.g. Red Fort" />
          <Input label="City" value={city} onChange={setCity} placeholder="e.g. Delhi" />
          <Input label="Radius (km)" value={radius} onChange={setRadius} type="number" placeholder="3" />
          <Input
            label="Max altitude (m)"
            value={altitude}
            onChange={setAltitude}
            type="number"
            placeholder="60 — use 0 for no-fly"
          />
        </div>
        <button
          type="button"
          onClick={addZone}
          className="mt-4 inline-flex items-center gap-2 h-11 px-5 rounded-full font-semibold text-sm text-white"
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.95), rgba(220,38,38,0.95))',
            boxShadow: '0 12px 32px -12px rgba(239,68,68,0.5)',
          }}
        >
          <Plus className="w-4 h-4" />
          Add no-fly zone
        </button>
      </Card>
    </div>
  )
}

function ViolationsTab({
  onGround,
  grounded,
  navigate,
}: {
  onGround: (id: string) => void
  grounded: string[]
  navigate: ReturnType<typeof useNavigate>
}) {
  return (
    <div className="grid gap-3">
      {MOCK_VIOLATIONS.map((v) => {
        const c = v.severity === 'HIGH' ? '#EF4444' : v.severity === 'MEDIUM' ? '#F59E0B' : '#3B82F6'
        return (
          <div
            key={v.id}
            className="rounded-2xl p-5"
            style={{
              background: 'rgba(17,24,39,0.85)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderLeft: `4px solid ${c}`,
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="font-mono text-[12px] text-white/55">{v.id}</div>
                <div className="font-inter font-extrabold text-[16px] text-white mt-0.5">
                  {v.type}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="inline-flex items-center gap-1 text-[10.5px] uppercase tracking-[0.14em] font-bold px-2.5 py-1 rounded-full"
                  style={{ background: `${c}1f`, color: c, border: `1px solid ${c}55` }}
                >
                  {v.severity}
                </span>
                <span className="inline-flex items-center gap-1 text-[10.5px] uppercase tracking-[0.14em] font-bold px-2.5 py-1 rounded-full text-white/65 border border-white/15">
                  {v.status}
                </span>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-2 text-[12.5px] text-white/65 mb-3">
              <div>🚁 Drone {v.droneId} ({v.ownerName})</div>
              <div>📍 {v.location}, {v.city}</div>
              <div>🕐 {v.time}</div>
              <div>💰 Fine: {v.fine}</div>
            </div>
            <div className="text-[12px] text-white/45 mb-3">
              Evidence: {v.evidence}
            </div>
            <div className="flex flex-wrap gap-2">
              <Action onClick={() => toast.success(`Fine issued for ${v.id}`)} icon={<AlertTriangle className="w-3.5 h-3.5" />}>
                Issue fine
              </Action>
              <Action
                onClick={() => onGround(v.droneId)}
                tone="danger"
                icon={<Ban className="w-3.5 h-3.5" />}
                disabled={grounded.includes(v.droneId)}
              >
                {grounded.includes(v.droneId) ? 'Grounded' : 'Ground drone'}
              </Action>
              <Action onClick={() => toast.success(`${v.id} closed`)} icon={<XCircle className="w-3.5 h-3.5" />}>
                Close case
              </Action>
              <Action onClick={() => navigate(`/drone/${v.droneId}`)} icon={<ArrowRight className="w-3.5 h-3.5" />}>
                Open drone
              </Action>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ReportsTab() {
  const reports = [
    { key: 'daily', name: 'Daily compliance report', sub: 'All drone activity for today' },
    { key: 'violations', name: 'Violation summary', sub: 'All violations this month' },
    { key: 'registrations', name: 'Registration report', sub: 'New registrations this week' },
    { key: 'audit', name: 'Audit trail', sub: 'Complete blockchain audit' },
  ]

  const generate = (name: string) => {
    toast.loading('Generating report…', { id: name })
    setTimeout(() => toast.success('Report downloaded', { id: name }), 1200)
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {reports.map((r) => (
        <div
          key={r.key}
          className="glass-strong p-5 flex items-start justify-between gap-4"
        >
          <div>
            <div className="font-inter font-bold text-[15px] text-white">{r.name}</div>
            <div className="text-[12.5px] text-white/55 mt-0.5">{r.sub}</div>
          </div>
          <button
            type="button"
            onClick={() => generate(r.name)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-full font-semibold text-sm text-white shrink-0"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.95), rgba(99,102,241,0.95))',
            }}
          >
            <FileText className="w-3.5 h-3.5" />
            Generate PDF
          </button>
        </div>
      ))}
    </div>
  )
}

function Card({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="glass-strong p-5">
      <div className="flex items-center gap-2 mb-4">
        <span>{icon}</span>
        <h3 className="font-inter font-bold text-[14px] tracking-tight text-white">
          {title}
        </h3>
      </div>
      <div>{children}</div>
    </section>
  )
}

function Action({
  onClick,
  children,
  icon,
  tone = 'default',
  disabled,
}: {
  onClick: () => void
  children: React.ReactNode
  icon?: React.ReactNode
  tone?: 'default' | 'danger'
  disabled?: boolean
}) {
  const isDanger = tone === 'danger'
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-[12px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: isDanger ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${isDanger ? 'rgba(239,68,68,0.45)' : 'rgba(255,255,255,0.12)'}`,
        color: isDanger ? '#EF4444' : '#FFFFFF',
      }}
    >
      {icon}
      {children}
    </button>
  )
}

function Mini({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.06]">
      <div className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-semibold">
        {label}
      </div>
      <div className={`text-[13px] font-semibold text-white truncate mt-0.5 ${mono ? 'font-mono tabular-nums' : ''}`}>
        {value}
      </div>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className="block">
      <div className="text-[10.5px] uppercase tracking-[0.14em] text-white/45 font-semibold mb-1.5">
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 px-3.5 rounded-xl text-[14px] text-white placeholder:text-white/35 outline-none"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      />
    </label>
  )
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-center text-[12.5px] text-white/45 py-6">
      <Users className="w-5 h-5 mx-auto mb-2 text-white/30" />
      {children}
    </div>
  )
}
