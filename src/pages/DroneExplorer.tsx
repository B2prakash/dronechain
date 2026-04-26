import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import {
  ArrowLeft,
  ArrowRight,
  MapPin,
  Plane,
  Radio,
  Search,
  Shield,
  User,
  X,
} from 'lucide-react'
import { MOCK_DRONES } from '../data/mockDrones'

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const

type Drone = (typeof MOCK_DRONES)[number]
type StatusFilter = 'all' | 'active' | 'grounded' | 'violation'

const FILTERS: { key: StatusFilter; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: '#3B82F6' },
  { key: 'active', label: 'Active', color: '#10B981' },
  { key: 'grounded', label: 'Grounded', color: '#9CA3AF' },
  { key: 'violation', label: 'Violations', color: '#EF4444' },
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

export default function DroneExplorer() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return MOCK_DRONES.filter((d) => {
      const matchSearch =
        !q ||
        d.id.toLowerCase().includes(q) ||
        d.owner.toLowerCase().includes(q) ||
        d.model.toLowerCase().includes(q) ||
        d.serial.toLowerCase().includes(q) ||
        d.city.toLowerCase().includes(q)
      const matchStatus = statusFilter === 'all' || d.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [search, statusFilter])

  const counts = useMemo(() => {
    const c = { all: MOCK_DRONES.length, active: 0, grounded: 0, violation: 0 }
    for (const d of MOCK_DRONES) {
      if (d.status === 'active') c.active++
      else if (d.status === 'violation') c.violation++
      else if (d.status === 'grounded') c.grounded++
    }
    return c
  }, [])

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-bg text-white">
      <div className="pointer-events-none absolute inset-0 grid-bg radial-fade opacity-25" />
      <div
        className="pointer-events-none absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full blur-3xl opacity-20"
        style={{
          background:
            'radial-gradient(closest-side, rgba(59,130,246,0.45), transparent 70%)',
        }}
      />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Header navigate={navigate} />

        <SearchAndFilters
          search={search}
          setSearch={setSearch}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          counts={counts}
        />

        <div className="mt-3 flex items-center justify-between">
          <div className="text-[12.5px] text-white/55">
            Showing{' '}
            <span className="text-white font-semibold tabular-nums">
              {filtered.length}
            </span>{' '}
            of{' '}
            <span className="text-white font-semibold tabular-nums">
              {MOCK_DRONES.length}
            </span>{' '}
            drones
          </div>
          {(search || statusFilter !== 'all') && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-[12px] text-white/55 hover:text-white inline-flex items-center gap-1 transition-colors"
            >
              <X className="w-3 h-3" />
              Clear filters
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <EmptyState onClear={clearFilters} />
        ) : (
          <div className="mt-5 grid gap-4 grid-cols-[repeat(auto-fill,minmax(300px,1fr))]">
            <AnimatePresence mode="popLayout">
              {filtered.map((d, i) => (
                <DroneCard
                  key={d.id}
                  drone={d}
                  index={i}
                  onOpen={() => navigate(`/drone/${d.id}`)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

function Header({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  return (
    <header className="flex items-center justify-between gap-4 mb-6">
      <div className="min-w-0">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="group inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
          Home
        </button>
        <h1 className="font-inter font-black tracking-tight text-[28px] sm:text-[32px] leading-tight">
          <span aria-hidden>🔍 </span>Drone Explorer
        </h1>
        <p className="text-[13.5px] text-white/55 mt-1">
          Search every drone registered on the chain.
        </p>
      </div>
    </header>
  )
}

function SearchAndFilters({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  counts,
}: {
  search: string
  setSearch: (s: string) => void
  statusFilter: StatusFilter
  setStatusFilter: (s: StatusFilter) => void
  counts: Record<StatusFilter | 'all', number>
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by drone ID, model, owner, serial, city…"
          className="w-full h-11 pl-10 pr-10 rounded-xl text-[14px] text-white placeholder:text-white/35 outline-none transition-colors"
          style={{
            background: 'rgba(17,24,39,0.7)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-white/45 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {FILTERS.map((f) => {
          const active = statusFilter === f.key
          const count = counts[f.key]
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className="relative inline-flex items-center gap-2 h-10 px-3.5 rounded-full text-[12.5px] font-semibold transition-colors"
              style={{
                background: active ? `${f.color}1f` : 'rgba(17,24,39,0.6)',
                border: `1px solid ${active ? `${f.color}66` : 'rgba(255,255,255,0.08)'}`,
                color: active ? f.color : 'rgba(255,255,255,0.7)',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: f.color }}
              />
              {f.label}
              <span
                className="text-[11px] px-1.5 py-0.5 rounded-full tabular-nums"
                style={{
                  background: active ? `${f.color}26` : 'rgba(255,255,255,0.06)',
                  color: active ? f.color : 'rgba(255,255,255,0.55)',
                }}
              >
                {count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function DroneCard({
  drone,
  index,
  onOpen,
}: {
  drone: Drone
  index: number
  onOpen: () => void
}) {
  const statusColor = getStatusColor(drone.status)
  const compColor = getComplianceColor(drone.compliance)

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.4, delay: Math.min(index, 8) * 0.04, ease: EASE_OUT_EXPO }}
      whileHover={{ y: -4 }}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen()
        }
      }}
      className="group relative cursor-pointer outline-none"
    >
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse at top, rgba(59,130,246,0.18), transparent 60%)',
        }}
      />
      <div
        className="relative rounded-2xl p-5 h-full flex flex-col gap-4"
        style={{
          background: 'rgba(17,24,39,0.8)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span aria-hidden className="text-base">
              🚁
            </span>
            <span className="font-inter font-extrabold tracking-tight text-white text-[15px] truncate">
              {drone.id}
            </span>
          </div>
          <span
            className="inline-flex items-center gap-1 text-[10.5px] uppercase tracking-[0.14em] font-bold px-2.5 py-1 rounded-full whitespace-nowrap"
            style={{
              background: `${statusColor}1f`,
              color: statusColor,
              border: `1px solid ${statusColor}55`,
            }}
          >
            <StatusDot color={statusColor} pulse={drone.status === 'active'} />
            {drone.status}
          </span>
        </div>

        <div>
          <div className="text-[17px] font-semibold text-white truncate">
            {drone.model}
          </div>
          <div className="text-[12px] text-white/45 font-mono truncate">
            {drone.serial}
          </div>
        </div>

        <div className="grid gap-1 text-[12.5px] text-white/70">
          <div className="flex items-center gap-2 truncate">
            <User className="w-3.5 h-3.5 text-white/45 shrink-0" />
            <span className="truncate">{drone.owner}</span>
          </div>
          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-3.5 h-3.5 text-white/45 shrink-0" />
            <span className="truncate">
              {drone.city}, {drone.state}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 text-[11.5px] text-white/65">
          <MiniStat
            icon={<Plane className="w-3 h-3" />}
            label="Flights"
            value={drone.totalFlights.toLocaleString()}
          />
          <MiniStat
            icon={<Radio className="w-3 h-3" />}
            label="Remote ID"
            value={drone.remoteIdActive ? 'On' : 'Off'}
            tone={drone.remoteIdActive ? 'good' : 'bad'}
          />
          <MiniStat
            icon={<Shield className="w-3 h-3" />}
            label="Score"
            value={`${drone.compliance}%`}
            tone={drone.compliance >= 90 ? 'good' : drone.compliance >= 70 ? 'warn' : 'bad'}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-[0.16em] text-white/40 font-semibold">
              Compliance
            </span>
            <span
              className="text-[11px] font-semibold tabular-nums"
              style={{ color: compColor }}
            >
              {drone.compliance}%
            </span>
          </div>
          <div className="h-1 rounded-full bg-white/[0.08] overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${drone.compliance}%` }}
              transition={{ duration: 0.7, ease: EASE_OUT_QUART, delay: 0.1 }}
              className="h-full rounded-full"
              style={{ background: compColor }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 border-t border-white/[0.06]">
          <span className="text-[11px] text-white/40">
            Registered {drone.registeredAt}
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary group-hover:gap-2 transition-all">
            View details
            <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </motion.div>
  )
}

function StatusDot({ color, pulse }: { color: string; pulse?: boolean }) {
  return (
    <span className="relative inline-flex w-1.5 h-1.5">
      <span className="absolute inset-0 rounded-full" style={{ background: color }} />
      {pulse && (
        <span
          className="absolute -inset-0.5 rounded-full pulse-ring"
          style={{ background: `${color}55` }}
        />
      )}
    </span>
  )
}

function MiniStat({
  icon,
  label,
  value,
  tone = 'neutral',
}: {
  icon: React.ReactNode
  label: string
  value: string
  tone?: 'good' | 'warn' | 'bad' | 'neutral'
}) {
  const color =
    tone === 'good'
      ? '#10B981'
      : tone === 'warn'
        ? '#F59E0B'
        : tone === 'bad'
          ? '#EF4444'
          : '#9CA3AF'
  return (
    <div className="flex flex-col items-start gap-0.5 px-2 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.05] flex-1 min-w-0">
      <span className="flex items-center gap-1 text-[9.5px] uppercase tracking-[0.14em] text-white/45">
        <span style={{ color }}>{icon}</span>
        {label}
      </span>
      <span className="text-[12.5px] font-semibold text-white tabular-nums truncate">
        {value}
      </span>
    </div>
  )
}

function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="mt-12 flex flex-col items-center justify-center text-center py-16">
      <div className="text-6xl mb-4">🔍</div>
      <h2 className="text-[20px] font-bold text-white">No drones found</h2>
      <p className="text-[13.5px] text-white/55 mt-1.5 max-w-[380px]">
        Try a different search term or clear the active filters.
      </p>
      <button
        type="button"
        onClick={onClear}
        className="mt-5 inline-flex items-center gap-1.5 h-10 px-5 rounded-full font-semibold text-sm bg-primary/15 text-primary border border-primary/40 hover:bg-primary/25 transition-colors"
      >
        Clear filters
      </button>
    </div>
  )
}
