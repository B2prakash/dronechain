import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Popup,
} from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  Calendar,
  CheckCircle,
  ClipboardCheck,
  Copy,
  Download,
  ExternalLink,
  FileText,
  MapPin,
  Plane,
  Radio,
  Share2,
  Shield,
  ShieldCheck,
  TrendingUp,
  User,
  XCircle,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import toast from 'react-hot-toast'
import { MOCK_DRONES } from '../data/mockDrones'

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const

type Drone = (typeof MOCK_DRONES)[number]
type TabKey = 'overview' | 'live' | 'flights' | 'remoteId' | 'violations' | 'documents'

const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'overview', label: 'Overview', icon: <User className="w-3.5 h-3.5" /> },
  { key: 'live', label: 'Live Track', icon: <MapPin className="w-3.5 h-3.5" /> },
  { key: 'flights', label: 'Flights', icon: <Plane className="w-3.5 h-3.5" /> },
  { key: 'remoteId', label: 'Remote ID', icon: <Radio className="w-3.5 h-3.5" /> },
  { key: 'violations', label: 'Violations', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
  { key: 'documents', label: 'Documents', icon: <FileText className="w-3.5 h-3.5" /> },
]

function getStatusColor(status: string) {
  if (status === 'active') return '#10B981'
  if (status === 'violation') return '#EF4444'
  if (status === 'grounded') return '#6B7280'
  return '#F59E0B'
}

function getComplianceColor(score: number) {
  if (score >= 90) return '#10B981'
  if (score >= 70) return '#F59E0B'
  return '#EF4444'
}

export default function DroneDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const drone = MOCK_DRONES.find((d) => d.id === id)

  if (!drone) return <NotFound onBack={() => navigate('/explorer')} />

  return <DroneDetailView drone={drone} navigate={navigate} />
}

function NotFound({ onBack }: { onBack: () => void }) {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-bg text-white flex flex-col items-center justify-center gap-5 px-6 text-center">
      <div className="pointer-events-none absolute inset-0 grid-bg radial-fade opacity-25" />
      <div className="text-7xl">🔍</div>
      <h1 className="font-inter font-black text-[28px] tracking-tight">
        Drone not found
      </h1>
      <p className="text-[14px] text-white/55 max-w-[360px]">
        We couldn’t locate that drone in the registry. It may have been
        retired, transferred, or never registered.
      </p>
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 h-11 px-5 rounded-full font-semibold text-sm text-white border border-white/15 hover:border-white/35 hover:bg-white/[0.05] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Explorer
      </button>
    </div>
  )
}

function DroneDetailView({
  drone,
  navigate,
}: {
  drone: Drone
  navigate: ReturnType<typeof useNavigate>
}) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  const flightData = useMemo(
    () =>
      ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'].map((month, i) => ({
        month,
        flights: 3 + ((drone.id.length * (i + 1)) % 14),
      })),
    [drone.id],
  )

  const remoteLogs = useMemo(() => {
    const base = Date.now()
    return Array.from({ length: 10 }, (_, i) => ({
      time: new Date(base - i * 60_000),
      lat: (drone.location.lat + i * 0.0008).toFixed(4),
      lng: (drone.location.lng + i * 0.0008).toFixed(4),
      alt: drone.altitude + ((i * 7) % 12),
      speed: drone.speed + ((i * 3) % 7),
    }))
  }, [drone])

  const flightHistory = useMemo(() => {
    const base = Date.now()
    return Array.from({ length: 8 }, (_, i) => ({
      id: `FLT-2026-${String(i + 1).padStart(3, '0')}`,
      date: new Date(base - i * 86_400_000),
      duration: `${15 + ((i * 11) % 50)} min`,
      distance: `${(1 + ((i * 7) % 90) / 10).toFixed(1)} km`,
      status: drone.status === 'violation' && i === 0 ? 'Violation' : 'Compliant',
    }))
  }, [drone])

  const handleShare = () => {
    const url = `${window.location.origin}/drone/${drone.id}`
    navigator.clipboard?.writeText(url).then(() => toast.success('Link copied'))
  }

  const handleDownload = () => {
    toast.success('Report queued for download')
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-bg text-white">
      <div className="pointer-events-none absolute inset-0 grid-bg radial-fade opacity-25" />

      <DetailHeader
        drone={drone}
        navigate={navigate}
        onShare={handleShare}
        onDownload={handleDownload}
      />

      <main className="relative max-w-[1400px] mx-auto px-4 sm:px-6 pt-6 pb-20">
        <ProfileCard drone={drone} />

        <Tabs activeTab={activeTab} setActiveTab={setActiveTab} drone={drone} />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, ease: EASE_OUT_QUART }}
            className="mt-6"
          >
            {activeTab === 'overview' && <OverviewTab drone={drone} />}
            {activeTab === 'live' && <LiveTrackTab drone={drone} />}
            {activeTab === 'flights' && (
              <FlightsTab drone={drone} flightData={flightData} flightHistory={flightHistory} />
            )}
            {activeTab === 'remoteId' && (
              <RemoteIdTab drone={drone} remoteLogs={remoteLogs} />
            )}
            {activeTab === 'violations' && <ViolationsTab drone={drone} />}
            {activeTab === 'documents' && <DocumentsTab />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

function DetailHeader({
  drone,
  navigate,
  onShare,
  onDownload,
}: {
  drone: Drone
  navigate: ReturnType<typeof useNavigate>
  onShare: () => void
  onDownload: () => void
}) {
  const statusColor = getStatusColor(drone.status)
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
          <button
            type="button"
            onClick={() => navigate('/explorer')}
            className="group inline-flex items-center gap-1.5 text-sm text-white/65 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
            <span className="hidden sm:inline">Explorer</span>
          </button>
          <div className="hidden sm:block w-px h-5 bg-white/10" />
          <span className="font-inter font-extrabold tracking-tight text-[15px] text-white truncate">
            {drone.id}
          </span>
          <span
            className="hidden sm:inline-flex items-center gap-1 text-[10.5px] uppercase tracking-[0.14em] font-bold px-2.5 py-1 rounded-full"
            style={{
              background: `${statusColor}1f`,
              color: statusColor,
              border: `1px solid ${statusColor}55`,
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusColor }} />
            {drone.status}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onShare}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold text-white/85 hover:text-white border border-white/10 hover:border-white/25 hover:bg-white/[0.05] transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Share</span>
          </button>
          <button
            type="button"
            onClick={onDownload}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full text-xs font-semibold text-white border border-primary/40 bg-primary/15 hover:bg-primary/25 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download report</span>
          </button>
        </div>
      </div>
    </header>
  )
}

function ProfileCard({ drone }: { drone: Drone }) {
  const compColor = getComplianceColor(drone.compliance)

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
      className="glass-strong p-5 sm:p-7 grid gap-6 lg:grid-cols-[auto_minmax(0,1fr)]"
    >
      <div className="flex items-center gap-5">
        <div
          className="w-[88px] h-[88px] rounded-3xl flex items-center justify-center shrink-0"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.22), rgba(59,130,246,0.04))',
            border: '1px solid rgba(59,130,246,0.4)',
          }}
        >
          <span className="text-[44px]" aria-hidden>
            🚁
          </span>
        </div>
        <div className="min-w-0">
          <div className="font-inter font-black text-primary text-[24px] tracking-tight tabular-nums">
            {drone.id}
          </div>
          <div className="text-[16px] font-semibold text-white truncate">
            {drone.model}
          </div>
          <div className="text-[12.5px] text-white/45 font-mono truncate">
            {drone.serial}
          </div>
        </div>
        <div
          className="hidden sm:flex w-[88px] h-[88px] rounded-2xl items-center justify-center shrink-0 ml-auto"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '2px dashed rgba(255,255,255,0.12)',
          }}
          aria-label="QR code placeholder"
        >
          <div className="grid grid-cols-3 gap-0.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <span
                key={i}
                className="w-3 h-3 rounded-[2px]"
                style={{
                  background:
                    [0, 2, 4, 6, 8].includes(i)
                      ? 'rgba(255,255,255,0.85)'
                      : 'rgba(255,255,255,0.18)',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-5">
        <div className="flex items-center gap-5">
          <div className="relative shrink-0">
            <svg width="80" height="80" className="rotate-[-90deg]">
              <circle
                cx="40"
                cy="40"
                r="34"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="6"
                fill="none"
              />
              <motion.circle
                cx="40"
                cy="40"
                r="34"
                stroke={compColor}
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 34}
                initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                animate={{
                  strokeDashoffset: 2 * Math.PI * 34 * (1 - drone.compliance / 100),
                }}
                transition={{ duration: 1, ease: EASE_OUT_QUART }}
              />
            </svg>
            <div
              className="absolute inset-0 flex flex-col items-center justify-center font-inter font-black tabular-nums"
              style={{ color: compColor }}
            >
              <span className="text-[18px] leading-none">{drone.compliance}</span>
              <span className="text-[9px] uppercase tracking-[0.14em] text-white/45 mt-0.5">
                Score
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 flex-1 min-w-0">
            <ProfileStat
              icon={<Plane className="w-3.5 h-3.5" />}
              label="Total flights"
              value={drone.totalFlights.toLocaleString()}
            />
            <ProfileStat
              icon={<TrendingUp className="w-3.5 h-3.5" />}
              label="Weight"
              value={drone.weightClass}
            />
            <ProfileStat
              icon={<Briefcase className="w-3.5 h-3.5" />}
              label="Purpose"
              value={drone.purpose}
            />
            <ProfileStat
              icon={<Calendar className="w-3.5 h-3.5" />}
              label="Registered"
              value={drone.registeredAt}
            />
          </div>
        </div>

        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{
            background: drone.remoteIdActive
              ? 'rgba(16,185,129,0.1)'
              : 'rgba(239,68,68,0.1)',
            border: `1px solid ${drone.remoteIdActive ? '#10B981' : '#EF4444'}55`,
            color: drone.remoteIdActive ? '#10B981' : '#EF4444',
          }}
        >
          <Radio className="w-4 h-4 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-inter font-extrabold text-[13px] tracking-[0.1em] uppercase">
              {drone.remoteIdActive
                ? 'Remote ID Active — Broadcasting Live'
                : 'Remote ID Inactive'}
            </div>
            <div className="text-[12px] opacity-80">
              {drone.remoteIdActive
                ? 'Compliant with ASTM F3411-22a · 1 Hz broadcast'
                : 'No live broadcast detected — drone may be grounded'}
            </div>
          </div>
          {drone.remoteIdActive ? (
            <span className="relative inline-flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-success" />
              <span
                className="absolute -inset-1 rounded-full pulse-ring"
                style={{ background: 'rgba(16,185,129,0.45)' }}
              />
            </span>
          ) : (
            <XCircle className="w-4 h-4" />
          )}
        </div>
      </div>
    </motion.section>
  )
}

function ProfileStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-white/45">
        <span className="text-primary/80">{icon}</span>
        {label}
      </div>
      <div className="text-[13.5px] font-semibold text-white truncate mt-0.5">
        {value}
      </div>
    </div>
  )
}

function Tabs({
  activeTab,
  setActiveTab,
  drone,
}: {
  activeTab: TabKey
  setActiveTab: (k: TabKey) => void
  drone: Drone
}) {
  const violationCount = drone.status === 'violation' ? 1 : 0
  return (
    <div className="mt-6 flex items-center gap-1 overflow-x-auto border-b border-white/[0.08]">
      {TABS.map((t) => {
        const active = t.key === activeTab
        const showBadge = t.key === 'violations' && violationCount > 0
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
            {showBadge && (
              <span
                className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white"
                style={{ background: '#EF4444' }}
              >
                {violationCount}
              </span>
            )}
            {active && (
              <motion.span
                layoutId="tab-underline"
                className="absolute -bottom-px left-0 right-0 h-0.5"
                style={{ background: '#3B82F6' }}
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

function OverviewTab({ drone }: { drone: Drone }) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <Card title="Owner Information" icon={<User className="w-4 h-4" />}>
        <Field label="Owner" value={drone.owner} />
        <Field label="Wallet" value={drone.walletAddress} mono copyable />
        <Field label="License" value={drone.pilotLicense} mono />
        <Field label="Country" value={drone.country} />
        <Field label="State" value={drone.state} />
        <Field label="City" value={drone.city} />
      </Card>

      <Card title="Registration Details" icon={<ClipboardCheck className="w-4 h-4" />}>
        <Field label="Drone ID" value={drone.id} mono />
        <Field label="Serial" value={drone.serial} mono copyable />
        <Field label="Model" value={drone.model} />
        <Field label="Weight class" value={drone.weightClass} />
        <Field label="Purpose" value={drone.purpose} />
        <Field label="Registered" value={drone.registeredAt} />
      </Card>

      <div className="lg:col-span-2">
        <Card title="Compliance Status" icon={<Shield className="w-4 h-4" />}>
          <div className="grid gap-3 sm:grid-cols-3">
            <ComplianceItem
              label="Insurance"
              value={drone.insurance}
              ok={!drone.insurance.toLowerCase().includes('expired')}
            />
            <ComplianceItem
              label="Pilot license"
              value={drone.pilotLicense}
              ok
            />
            <ComplianceItem
              label="Remote ID"
              value={drone.remoteIdActive ? 'Active' : 'Inactive'}
              ok={drone.remoteIdActive}
            />
          </div>
        </Card>
      </div>
    </div>
  )
}

function ComplianceItem({
  label,
  value,
  ok,
}: {
  label: string
  value: string
  ok: boolean
}) {
  const color = ok ? '#10B981' : '#EF4444'
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl"
      style={{
        background: ok ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
        border: `1px solid ${color}33`,
      }}
    >
      {ok ? (
        <CheckCircle className="w-5 h-5" style={{ color }} />
      ) : (
        <XCircle className="w-5 h-5" style={{ color }} />
      )}
      <div className="min-w-0">
        <div className="text-[10.5px] uppercase tracking-[0.16em] text-white/55 font-semibold">
          {label}
        </div>
        <div className="text-[13.5px] font-semibold text-white truncate">
          {value}
        </div>
      </div>
    </div>
  )
}

function LiveTrackTab({ drone }: { drone: Drone }) {
  return (
    <div className="grid gap-5">
      <div className="rounded-2xl overflow-hidden border border-white/[0.08]">
        <MapContainer
          key={drone.id}
          center={[drone.location.lat, drone.location.lng]}
          zoom={12}
          style={{ height: '420px', width: '100%', background: '#0a0f1a' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <CircleMarker
            center={[drone.location.lat, drone.location.lng]}
            radius={14}
            fillColor="#3B82F6"
            color="#FFFFFF"
            weight={3}
            fillOpacity={0.9}
          >
            <Popup>
              <strong>{drone.id}</strong>
              <br />
              {drone.model}
              <br />
              {drone.city}, {drone.state}
            </Popup>
          </CircleMarker>
        </MapContainer>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <LiveStat label="Latitude" value={`${drone.location.lat.toFixed(4)}° N`} />
        <LiveStat label="Longitude" value={`${drone.location.lng.toFixed(4)}° E`} />
        <LiveStat label="Altitude" value={`${drone.altitude} m AGL`} />
        <LiveStat label="Speed" value={`${drone.speed} km/h`} />
      </div>
    </div>
  )
}

function LiveStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-strong px-4 py-3.5">
      <div className="text-[10px] uppercase tracking-[0.16em] text-white/45 font-semibold">
        {label}
      </div>
      <div className="text-[18px] font-inter font-extrabold text-white tabular-nums tracking-tight mt-0.5">
        {value}
      </div>
    </div>
  )
}

function FlightsTab({
  drone,
  flightData,
  flightHistory,
}: {
  drone: Drone
  flightData: { month: string; flights: number }[]
  flightHistory: {
    id: string
    date: Date
    duration: string
    distance: string
    status: string
  }[]
}) {
  return (
    <div className="grid gap-5">
      <Card title="Flights per month" icon={<Activity className="w-4 h-4" />}>
        <div className="h-[220px] -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={flightData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis
                dataKey="month"
                stroke="rgba(255,255,255,0.45)"
                tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                tickLine={false}
              />
              <YAxis
                stroke="rgba(255,255,255,0.45)"
                tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                tickLine={false}
                width={32}
              />
              <Tooltip
                contentStyle={{
                  background: '#111827',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 12,
                  color: '#F9FAFB',
                  fontSize: 12,
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.55)' }}
                cursor={{ stroke: 'rgba(59,130,246,0.4)', strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="flights"
                stroke="#3B82F6"
                strokeWidth={2.5}
                dot={{ fill: '#3B82F6', r: 4, strokeWidth: 0 }}
                activeDot={{ fill: '#3B82F6', r: 6, stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card title="Recent flights" icon={<Plane className="w-4 h-4" />}>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="text-white/45 text-[10.5px] uppercase tracking-[0.14em]">
                <th className="px-2 py-2 font-semibold">Flight ID</th>
                <th className="px-2 py-2 font-semibold">Date</th>
                <th className="px-2 py-2 font-semibold">Duration</th>
                <th className="px-2 py-2 font-semibold">Distance</th>
                <th className="px-2 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {flightHistory.map((f) => {
                const ok = f.status === 'Compliant'
                return (
                  <tr
                    key={f.id}
                    className="border-t border-white/[0.05] text-white/85"
                  >
                    <td className="px-2 py-2.5 font-mono">{f.id}</td>
                    <td className="px-2 py-2.5 text-white/60">
                      {f.date.toLocaleDateString()}
                    </td>
                    <td className="px-2 py-2.5 tabular-nums">{f.duration}</td>
                    <td className="px-2 py-2.5 tabular-nums">{f.distance}</td>
                    <td className="px-2 py-2.5">
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{
                          background: ok ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                          color: ok ? '#10B981' : '#EF4444',
                          border: `1px solid ${ok ? '#10B981' : '#EF4444'}33`,
                        }}
                      >
                        {ok ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {f.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {drone.totalFlights > flightHistory.length && (
          <div className="mt-3 text-[12px] text-white/45">
            Showing {flightHistory.length} of {drone.totalFlights} total flights.
          </div>
        )}
      </Card>
    </div>
  )
}

function RemoteIdTab({
  drone,
  remoteLogs,
}: {
  drone: Drone
  remoteLogs: { time: Date; lat: string; lng: string; alt: number; speed: number }[]
}) {
  return (
    <div className="grid gap-5">
      <Card title="Last 10 broadcasts" icon={<Radio className="w-4 h-4" />}>
        <div className="overflow-x-auto -mx-2">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="text-white/45 text-[10.5px] uppercase tracking-[0.14em]">
                <th className="px-2 py-2 font-semibold">Time</th>
                <th className="px-2 py-2 font-semibold">Latitude</th>
                <th className="px-2 py-2 font-semibold">Longitude</th>
                <th className="px-2 py-2 font-semibold">Altitude</th>
                <th className="px-2 py-2 font-semibold">Speed</th>
                <th className="px-2 py-2 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {remoteLogs.map((r, i) => (
                <tr key={i} className="border-t border-white/[0.05] text-white/85">
                  <td className="px-2 py-2.5 font-mono text-white/65 tabular-nums">
                    {r.time.toLocaleTimeString()}
                  </td>
                  <td className="px-2 py-2.5 font-mono tabular-nums">{r.lat} N</td>
                  <td className="px-2 py-2.5 font-mono tabular-nums">{r.lng} E</td>
                  <td className="px-2 py-2.5 tabular-nums">{r.alt} m</td>
                  <td className="px-2 py-2.5 tabular-nums">{r.speed} km/h</td>
                  <td className="px-2 py-2.5">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full text-success border border-success/30 bg-success/10">
                      <CheckCircle className="w-3 h-3" />
                      Compliant
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between rounded-2xl px-4 py-3.5"
        style={{
          background: 'rgba(59,130,246,0.08)',
          border: '1px solid rgba(59,130,246,0.25)',
        }}
      >
        <div className="flex items-center gap-2 text-[13px] text-white/85">
          <span aria-hidden>🔗</span>
          All logs stored immutably on Solana — drone {drone.id}
        </div>
        <button
          type="button"
          onClick={() => toast.success('Log archive queued')}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-full text-[12.5px] font-semibold text-white border border-white/15 hover:border-white/35 hover:bg-white/[0.05] transition-colors self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          Download all logs
        </button>
      </div>
    </div>
  )
}

function ViolationsTab({ drone }: { drone: Drone }) {
  if (drone.status !== 'violation') {
    return (
      <div className="glass-strong p-8 flex flex-col items-center text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
          style={{
            background: 'rgba(16,185,129,0.15)',
            border: '1px solid rgba(16,185,129,0.4)',
          }}
        >
          <ShieldCheck className="w-7 h-7 text-success" />
        </div>
        <h3 className="text-[20px] font-inter font-extrabold tracking-tight text-white">
          No violations recorded
        </h3>
        <p className="text-[13.5px] text-white/55 mt-1.5 max-w-[420px]">
          This drone has maintained full compliance with Remote ID and
          airspace regulations.
        </p>
      </div>
    )
  }

  return (
    <Card title="Open violation" icon={<AlertTriangle className="w-4 h-4 text-danger" />}>
      <div
        className="rounded-2xl p-5"
        style={{
          background: 'rgba(239,68,68,0.07)',
          border: '1px solid rgba(239,68,68,0.35)',
        }}
      >
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <div className="font-mono text-[12px] text-danger">VIO-2026-001</div>
            <div className="text-[18px] font-inter font-extrabold tracking-tight text-white mt-1">
              Altitude limit exceeded
            </div>
            <div className="text-[13px] text-white/65 mt-0.5">
              Near Kempegowda Airport, Bangalore
            </div>
          </div>
          <span
            className="inline-flex items-center gap-1 text-[10.5px] uppercase tracking-[0.14em] font-bold px-2.5 py-1 rounded-full text-danger border border-danger/40 bg-danger/10"
          >
            Pending
          </span>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 my-4">
          <Pill label="Date" value="Apr 18, 2026" />
          <Pill label="Time" value="14:32 IST" />
          <Pill label="Fine" value="0.5 SOL" />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => toast.success('Payment flow opened')}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-full font-semibold text-sm text-white"
            style={{
              background: 'linear-gradient(135deg, rgba(239,68,68,0.95), rgba(220,38,38,0.95))',
              boxShadow: '0 12px 32px -12px rgba(239,68,68,0.5)',
            }}
          >
            Pay fine
          </button>
          <button
            type="button"
            onClick={() => toast.success('Appeal drafted')}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-full font-semibold text-sm text-white border border-white/15 hover:border-white/35 hover:bg-white/[0.05] transition-colors"
          >
            Appeal
          </button>
        </div>
      </div>
    </Card>
  )
}

function DocumentsTab() {
  const docs = [
    { key: 'receipt', name: 'Purchase Receipt', kind: 'PDF · 248 KB' },
    { key: 'insurance', name: 'Insurance Certificate', kind: 'PDF · 412 KB' },
    { key: 'license', name: 'Pilot License', kind: 'JPG · 1.2 MB' },
    { key: 'photo', name: 'Drone Photo', kind: 'PNG · 2.1 MB' },
  ]
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {docs.map((d) => (
        <div
          key={d.key}
          className="glass-strong p-4 flex items-center gap-4"
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.35)',
            }}
          >
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-white text-[14px] truncate">
              {d.name}
            </div>
            <div className="flex items-center gap-2 text-[11.5px] text-white/55 mt-0.5">
              <span>{d.kind}</span>
              <span className="inline-flex items-center gap-1 text-success">
                <CheckCircle className="w-3 h-3" />
                Verified
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => toast.success(`${d.name} preview coming up`)}
            className="inline-flex items-center gap-1 h-9 px-3 rounded-full text-[12px] font-semibold text-white border border-white/10 hover:border-white/30 hover:bg-white/[0.05] transition-colors"
          >
            View
            <ExternalLink className="w-3 h-3" />
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
        <span className="text-primary/85">{icon}</span>
        <h3 className="font-inter font-bold text-[14px] tracking-tight text-white">
          {title}
        </h3>
      </div>
      <div className="grid gap-2">{children}</div>
    </section>
  )
}

function Field({
  label,
  value,
  mono,
  copyable,
}: {
  label: string
  value: string
  mono?: boolean
  copyable?: boolean
}) {
  const handleCopy = () => {
    navigator.clipboard?.writeText(value).then(() => toast.success(`${label} copied`))
  }
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
      <span className="text-[12px] text-white/55">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        <span
          className={`text-[13px] font-semibold text-white truncate ${mono ? 'font-mono tabular-nums' : ''}`}
        >
          {value}
        </span>
        {copyable && (
          <button
            type="button"
            onClick={handleCopy}
            className="text-white/35 hover:text-white/85 transition-colors"
            aria-label={`Copy ${label}`}
          >
            <Copy className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02]">
      <div className="text-[9.5px] uppercase tracking-[0.16em] text-white/40">
        {label}
      </div>
      <div className="text-[13px] font-semibold text-white tabular-nums">
        {value}
      </div>
    </div>
  )
}
