import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Loader2,
  MapPin,
  Plane,
  Scale,
  Shield,
} from 'lucide-react'
import { MOCK_VIOLATIONS, VIOLATION_TYPES, type Violation } from '../data/mockDrones'

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

type FilterKey = 'all' | 'Pending' | 'Paid' | 'Appealed'

const FILTERS: { key: FilterKey; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: '#3B82F6' },
  { key: 'Pending', label: 'Pending', color: '#F59E0B' },
  { key: 'Paid', label: 'Paid', color: '#10B981' },
  { key: 'Appealed', label: 'Appealed', color: '#8B5CF6' },
]

function severityColor(s: string) {
  if (s === 'HIGH') return '#EF4444'
  if (s === 'MEDIUM') return '#F59E0B'
  if (s === 'LOW') return '#3B82F6'
  return '#9CA3AF'
}

function shortHash() {
  const hex = 'abcdef0123456789'
  return Array.from({ length: 16 }, () => hex[Math.floor(Math.random() * hex.length)]).join('')
}

type LocalState = {
  status: Violation['status']
  paidTx?: string
  appealId?: string
}

export default function ViolationSystem() {
  const navigate = useNavigate()
  const [filter, setFilter] = useState<FilterKey>('all')
  const [local, setLocal] = useState<Record<string, LocalState>>(() =>
    Object.fromEntries(MOCK_VIOLATIONS.map((v) => [v.id, { status: v.status }])),
  )
  const [paying, setPaying] = useState<string | null>(null)
  const [appealingFor, setAppealingFor] = useState<string | null>(null)
  const [appealText, setAppealText] = useState('')

  const handlePay = async (v: Violation) => {
    if (paying) return
    setPaying(v.id)
    await new Promise((r) => setTimeout(r, 1800))
    const tx = shortHash()
    setLocal((prev) => ({ ...prev, [v.id]: { status: 'Paid', paidTx: tx } }))
    setPaying(null)
    toast.success(`Fine paid · ${tx.slice(0, 10)}…`)
  }

  const submitAppeal = (v: Violation) => {
    if (!appealText.trim()) {
      toast.error('Please describe your appeal')
      return
    }
    const appealId = `APL-2026-${String(Math.floor(Math.random() * 900) + 100)}`
    setLocal((prev) => ({ ...prev, [v.id]: { status: 'Appealed', appealId } }))
    setAppealingFor(null)
    setAppealText('')
    toast.success('Appeal submitted')
  }

  const filtered = useMemo(() => {
    if (filter === 'all') return MOCK_VIOLATIONS
    return MOCK_VIOLATIONS.filter((v) => (local[v.id]?.status ?? v.status) === filter)
  }, [filter, local])

  const stats = useMemo(() => {
    let pending = 0,
      paid = 0,
      appealed = 0,
      totalSol = 0
    for (const v of MOCK_VIOLATIONS) {
      const status = local[v.id]?.status ?? v.status
      if (status === 'Pending') pending++
      else if (status === 'Paid') {
        paid++
        totalSol += v.fineSol
      } else if (status === 'Appealed') appealed++
    }
    return { pending, paid, appealed, totalSol }
  }, [local])

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-bg text-white">
      <div className="pointer-events-none absolute inset-0 grid-bg radial-fade opacity-25" />

      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Header navigate={navigate} />

        <StatsRow
          total={MOCK_VIOLATIONS.length}
          pending={stats.pending}
          paid={stats.paid}
          totalSol={stats.totalSol}
        />

        <div className="mt-5 flex items-center gap-1.5 flex-wrap">
          {FILTERS.map((f) => {
            const active = filter === f.key
            return (
              <button
                key={f.key}
                type="button"
                onClick={() => setFilter(f.key)}
                className="inline-flex items-center gap-2 h-10 px-3.5 rounded-full text-[12.5px] font-semibold transition-colors"
                style={{
                  background: active ? `${f.color}1f` : 'rgba(17,24,39,0.6)',
                  border: `1px solid ${active ? `${f.color}66` : 'rgba(255,255,255,0.08)'}`,
                  color: active ? f.color : 'rgba(255,255,255,0.7)',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: f.color }} />
                {f.label}
              </button>
            )
          })}
        </div>

        <ExplainerStrip />

        <div className="mt-6 grid gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((v, i) => {
              const status = local[v.id]?.status ?? v.status
              const paidTx = local[v.id]?.paidTx
              const appealId = local[v.id]?.appealId
              return (
                <ViolationCard
                  key={v.id}
                  v={v}
                  index={i}
                  status={status}
                  paidTx={paidTx}
                  appealId={appealId}
                  isPaying={paying === v.id}
                  onPay={() => handlePay(v)}
                  isAppealing={appealingFor === v.id}
                  appealText={appealingFor === v.id ? appealText : ''}
                  onAppealOpen={() => {
                    setAppealingFor(v.id)
                    setAppealText('')
                  }}
                  onAppealCancel={() => setAppealingFor(null)}
                  onAppealChange={setAppealText}
                  onAppealSubmit={() => submitAppeal(v)}
                />
              )
            })}
          </AnimatePresence>

          {filtered.length === 0 && (
            <div className="glass-strong p-8 text-center">
              <Shield className="w-10 h-10 text-success mx-auto mb-3" />
              <div className="font-inter font-bold text-white text-[16px]">
                No violations match this filter
              </div>
              <div className="text-[12.5px] text-white/55 mt-1">
                Switch filters above to see other violations.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Header({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  return (
    <header className="mb-6">
      <button
        type="button"
        onClick={() => navigate('/dashboard')}
        className="group inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors mb-3"
      >
        <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
        Dashboard
      </button>
      <h1 className="font-inter font-black tracking-tight text-[28px] sm:text-[32px] leading-tight">
        <span aria-hidden>⚠️ </span>Violation System
      </h1>
      <p className="text-[13.5px] text-white/55 mt-1">
        Track and resolve drone violations on chain.
      </p>
    </header>
  )
}

function StatsRow({
  total,
  pending,
  paid,
  totalSol,
}: {
  total: number
  pending: number
  paid: number
  totalSol: number
}) {
  const items = [
    { label: 'Total violations', value: total, color: '#3B82F6' },
    { label: 'Pending', value: pending, color: '#F59E0B' },
    { label: 'Paid', value: paid, color: '#10B981' },
    { label: 'Total fines', value: `${totalSol.toFixed(2)} SOL`, color: '#8B5CF6' },
  ]
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((it) => (
        <motion.div
          key={it.label}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
          className="glass-strong px-4 py-3.5"
        >
          <div className="text-[10.5px] uppercase tracking-[0.16em] text-white/45 font-semibold">
            {it.label}
          </div>
          <div
            className="font-inter font-black tabular-nums tracking-tight mt-0.5"
            style={{ fontSize: '1.4rem', lineHeight: 1.05, color: it.color }}
          >
            {typeof it.value === 'number' ? it.value.toLocaleString() : it.value}
          </div>
        </motion.div>
      ))}
    </div>
  )
}

function ExplainerStrip() {
  return (
    <div className="mt-6">
      <div className="text-[10.5px] uppercase tracking-[0.16em] text-white/45 font-semibold mb-2">
        Violation types
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
        {VIOLATION_TYPES.map((t) => {
          const c =
            t.severity === 'HIGH'
              ? '#EF4444'
              : t.severity === 'MEDIUM'
                ? '#F59E0B'
                : t.severity === 'LOW'
                  ? '#3B82F6'
                  : '#F59E0B'
          return (
            <div
              key={t.type}
              className="rounded-2xl p-3.5 min-w-[240px] shrink-0"
              style={{
                background: 'rgba(17,24,39,0.85)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderLeft: `4px solid ${c}`,
              }}
            >
              <div className="flex items-center gap-2">
                <span style={{ color: c }}>{t.severity === 'WARNING' ? '🟡' : '🔴'}</span>
                <span className="text-[13px] font-semibold text-white">{t.type}</span>
              </div>
              <div className="text-[12px] text-white/55 mt-1">{t.description}</div>
              <div className="text-[11.5px] mt-2 font-semibold" style={{ color: c }}>
                Fine: {t.fine}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function ViolationCard({
  v,
  index,
  status,
  paidTx,
  appealId,
  isPaying,
  onPay,
  isAppealing,
  appealText,
  onAppealOpen,
  onAppealCancel,
  onAppealChange,
  onAppealSubmit,
}: {
  v: Violation
  index: number
  status: Violation['status']
  paidTx?: string
  appealId?: string
  isPaying: boolean
  onPay: () => void
  isAppealing: boolean
  appealText: string
  onAppealOpen: () => void
  onAppealCancel: () => void
  onAppealChange: (s: string) => void
  onAppealSubmit: () => void
}) {
  const c = severityColor(v.severity)
  const statusColor =
    status === 'Pending'
      ? '#F59E0B'
      : status === 'Paid'
        ? '#10B981'
        : '#8B5CF6'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.4, delay: Math.min(index, 6) * 0.04, ease: EASE_OUT_EXPO }}
      className="rounded-2xl p-5"
      style={{
        background: 'rgba(17,24,39,0.85)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderLeft: `4px solid ${c}`,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[12px] text-white/55">{v.id}</span>
            <span
              className="inline-flex items-center gap-1 text-[10.5px] uppercase tracking-[0.14em] font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${c}1f`, color: c, border: `1px solid ${c}55` }}
            >
              {v.severity}
            </span>
            <span
              className="inline-flex items-center gap-1 text-[10.5px] uppercase tracking-[0.14em] font-bold px-2 py-0.5 rounded-full"
              style={{
                background: `${statusColor}1f`,
                color: statusColor,
                border: `1px solid ${statusColor}55`,
              }}
            >
              {status}
            </span>
          </div>
          <div
            className="font-inter font-extrabold tracking-tight text-[18px] mt-1.5"
            style={{ color: c }}
          >
            {v.type}
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-2 text-[12.5px] text-white/70 mb-3">
        <Info icon={<Plane className="w-3.5 h-3.5" />} label="Drone" value={`${v.droneId} · ${v.ownerName}`} />
        <Info icon={<MapPin className="w-3.5 h-3.5" />} label="Location" value={`${v.location}, ${v.city}`} />
        <Info icon={<Clock className="w-3.5 h-3.5" />} label="Time" value={v.time} />
        <Info icon={<DollarSign className="w-3.5 h-3.5" />} label="Fine" value={v.fine} />
      </div>

      {paidTx && (
        <div
          className="rounded-xl px-3.5 py-2.5 text-[12px] mb-3 flex items-center gap-2"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.35)' }}
        >
          <CheckCircle className="w-3.5 h-3.5 text-success" />
          <span className="text-white/70">Paid on chain ·</span>
          <span className="font-mono text-success">{paidTx.slice(0, 10)}…{paidTx.slice(-6)}</span>
        </div>
      )}

      {appealId && (
        <AppealReceipt id={appealId} />
      )}

      {status === 'Pending' && !isAppealing && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onPay}
            disabled={isPaying}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-full font-semibold text-sm text-white disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95))',
              boxShadow: '0 12px 32px -12px rgba(16,185,129,0.5)',
            }}
          >
            {isPaying ? <Loader2 className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
            {isPaying ? 'Confirming…' : `Pay fine (${v.fine})`}
          </button>
          <button
            type="button"
            onClick={onAppealOpen}
            disabled={isPaying}
            className="inline-flex items-center gap-2 h-10 px-5 rounded-full font-semibold text-sm border border-warning/40 text-warning hover:bg-warning/10 transition-colors disabled:opacity-60"
          >
            <Scale className="w-4 h-4" />
            Appeal
          </button>
        </div>
      )}

      {isAppealing && (
        <div className="mt-2 grid gap-2">
          <textarea
            value={appealText}
            onChange={(e) => onAppealChange(e.target.value)}
            rows={3}
            placeholder="Describe why you're appealing this violation…"
            className="w-full px-3.5 py-2.5 rounded-xl text-[13px] text-white placeholder:text-white/35 outline-none resize-y"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onAppealSubmit}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-full font-semibold text-sm text-white"
              style={{
                background: 'linear-gradient(135deg, rgba(245,158,11,0.95), rgba(217,119,6,0.95))',
              }}
            >
              <Scale className="w-4 h-4" />
              Submit appeal
            </button>
            <button
              type="button"
              onClick={onAppealCancel}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-full font-semibold text-sm text-white/85 border border-white/15 hover:bg-white/[0.05] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {(status === 'Paid' || status === 'Appealed') && (
        <div className="flex flex-wrap gap-2 mt-1">
          <button
            type="button"
            onClick={() => toast.success('Receipt downloaded')}
            className="inline-flex items-center gap-2 h-9 px-4 rounded-full text-[12.5px] font-semibold text-white border border-white/15 hover:bg-white/[0.05] transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            View receipt
          </button>
        </div>
      )}
    </motion.div>
  )
}

function AppealReceipt({ id }: { id: string }) {
  return (
    <div
      className="rounded-xl px-4 py-3 mb-3 flex items-start gap-3"
      style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.35)' }}
    >
      <Scale className="w-4 h-4 text-[#8B5CF6] mt-0.5 shrink-0" />
      <div className="text-[12.5px] text-white/75">
        <div className="font-semibold text-white">Appeal submitted</div>
        <div className="text-white/55 mt-0.5">
          <span className="font-mono">{id}</span> · Under review · expected 3–5 business days.
        </div>
        <div className="text-white/45 mt-0.5 text-[11.5px]">
          DGCA officials will review your evidence and respond via email.
        </div>
      </div>
    </div>
  )
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
      <span className="text-white/45">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.14em] text-white/45">{label}</div>
        <div className="text-[12.5px] font-semibold text-white truncate">{value}</div>
      </div>
    </div>
  )
}
