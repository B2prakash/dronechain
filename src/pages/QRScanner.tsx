import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import toast from 'react-hot-toast'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Camera,
  CheckCircle,
  Loader2,
  Phone,
  ScanLine,
  Search,
  Shield,
  XCircle,
} from 'lucide-react'
import { MOCK_DRONES } from '../data/mockDrones'

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const

type Drone = (typeof MOCK_DRONES)[number]
type Result = Drone | 'not_found' | null

const TRY_IDS = ['DRN-2026-001', 'DRN-2026-004', 'FAKE-DRONE'] as const

export default function QRScanner() {
  const navigate = useNavigate()
  const [droneId, setDroneId] = useState('')
  const [result, setResult] = useState<Result>(null)
  const [searching, setSearching] = useState(false)

  const search = async (raw?: string) => {
    const q = (raw ?? droneId).trim()
    if (!q) {
      toast.error('Enter a drone ID first')
      return
    }
    if (raw) setDroneId(raw)
    setSearching(true)
    setResult(null)
    await new Promise((r) => setTimeout(r, 1500))
    const found = MOCK_DRONES.find((d) => d.id.toLowerCase() === q.toLowerCase())
    setResult(found ?? 'not_found')
    setSearching(false)
  }

  const reset = () => {
    setResult(null)
    setDroneId('')
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-bg text-white">
      <div className="pointer-events-none absolute inset-0 grid-bg radial-fade opacity-25" />
      <div
        className="pointer-events-none absolute top-[-15%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full blur-3xl opacity-20"
        style={{
          background:
            'radial-gradient(closest-side, rgba(59,130,246,0.45), transparent 70%)',
        }}
      />

      <div className="relative max-w-[640px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Header navigate={navigate} />

        <HowItWorks />

        <ScanBox
          onCamera={() => toast('Camera capture coming soon', { icon: '📷' })}
        />

        <Divider />

        <ManualSearch
          droneId={droneId}
          setDroneId={setDroneId}
          onSearch={() => search()}
        />

        <QuickTry tryIds={[...TRY_IDS]} onTry={(id) => search(id)} />

        <AnimatePresence mode="wait">
          {searching && <LoadingState key="loading" />}
          {!searching && result && (
            <ResultPanel
              key="result"
              result={result}
              query={droneId}
              onReset={reset}
              navigate={navigate}
            />
          )}
        </AnimatePresence>
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
        <span aria-hidden>📷 </span>Drone Verifier
      </h1>
      <p className="text-[13.5px] text-white/55 mt-1">
        Verify any drone’s registration instantly against the chain.
      </p>
    </header>
  )
}

function HowItWorks() {
  const steps = [
    { n: 1, label: 'Scan QR or enter ID' },
    { n: 2, label: 'We check the blockchain' },
    { n: 3, label: 'Get an instant result' },
  ]
  return (
    <div className="grid grid-cols-3 gap-2 mb-6">
      {steps.map((s) => (
        <div
          key={s.n}
          className="flex items-start gap-2 px-3 py-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02]"
        >
          <span
            className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 text-primary"
            style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.4)' }}
          >
            {s.n}
          </span>
          <span className="text-[12px] text-white/70 leading-snug pt-0.5">{s.label}</span>
        </div>
      ))}
    </div>
  )
}

function ScanBox({ onCamera }: { onCamera: () => void }) {
  return (
    <div className="flex flex-col items-center mb-6">
      <div
        className="relative w-[280px] h-[280px] rounded-3xl flex items-center justify-center overflow-hidden"
        style={{
          background: 'rgba(17,24,39,0.6)',
          border: '2px dashed rgba(255,255,255,0.2)',
        }}
      >
        <motion.div
          aria-hidden
          className="absolute left-4 right-4 h-[2px] rounded-full"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(59,130,246,0.85), transparent)',
            boxShadow: '0 0 24px rgba(59,130,246,0.55)',
          }}
          animate={{ top: ['10%', '90%', '10%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="relative text-center">
          <ScanLine className="w-12 h-12 text-primary mx-auto mb-3" />
          <div className="font-inter font-bold text-[16px] text-white">Scan QR code</div>
          <div className="text-[12px] text-white/55 mt-1">
            Point your camera at the drone’s QR
          </div>
          <button
            type="button"
            onClick={onCamera}
            className="inline-flex items-center gap-2 h-10 px-5 mt-4 rounded-full font-semibold text-sm text-white"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.95), rgba(99,102,241,0.95))',
            }}
          >
            <Camera className="w-4 h-4" />
            Open camera
          </button>
        </div>
      </div>
    </div>
  )
}

function Divider() {
  return (
    <div className="flex items-center gap-3 mb-4 text-[11px] uppercase tracking-[0.18em] text-white/35 font-semibold">
      <span className="flex-1 h-px bg-white/[0.08]" />
      or
      <span className="flex-1 h-px bg-white/[0.08]" />
    </div>
  )
}

function ManualSearch({
  droneId,
  setDroneId,
  onSearch,
}: {
  droneId: string
  setDroneId: (s: string) => void
  onSearch: () => void
}) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.16em] text-white/45 font-semibold mb-2">
        Enter drone ID manually
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          <input
            type="text"
            value={droneId}
            onChange={(e) => setDroneId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="DRN-2026-001"
            className="w-full h-11 pl-10 pr-3 rounded-xl text-[14px] text-white placeholder:text-white/35 outline-none"
            style={{
              background: 'rgba(17,24,39,0.7)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />
        </div>
        <button
          type="button"
          onClick={onSearch}
          className="inline-flex items-center justify-center gap-2 h-11 px-5 rounded-xl font-semibold text-sm text-white"
          style={{
            background: 'linear-gradient(135deg, rgba(59,130,246,0.95), rgba(99,102,241,0.95))',
          }}
        >
          <Search className="w-4 h-4" />
          Search
        </button>
      </div>
    </div>
  )
}

function QuickTry({
  tryIds,
  onTry,
}: {
  tryIds: string[]
  onTry: (id: string) => void
}) {
  return (
    <div className="mt-3 flex items-center flex-wrap gap-2">
      <span className="text-[11.5px] text-white/45">Try these examples:</span>
      {tryIds.map((id) => (
        <button
          key={id}
          type="button"
          onClick={() => onTry(id)}
          className="font-mono text-[11.5px] px-2.5 h-7 inline-flex items-center rounded-full border border-white/15 hover:border-primary/45 hover:bg-primary/10 hover:text-primary text-white/65 transition-colors"
        >
          {id}
        </button>
      ))}
    </div>
  )
}

function LoadingState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.3, ease: EASE_OUT_QUART }}
      className="mt-6 glass-strong p-8 flex flex-col items-center text-center"
    >
      <div className="relative w-16 h-16 mb-4">
        <Shield
          className="w-16 h-16 text-primary"
          style={{ filter: 'drop-shadow(0 0 18px rgba(59,130,246,0.6))' }}
        />
        <Loader2 className="absolute inset-0 m-auto w-16 h-16 text-primary/30 animate-spin" />
      </div>
      <div className="font-inter font-bold text-[16px] text-white">
        Searching Solana blockchain…
      </div>
      <div className="text-[12.5px] text-white/55 mt-1">
        Querying registry for matching drone record.
      </div>
    </motion.div>
  )
}

function ResultPanel({
  result,
  query,
  onReset,
  navigate,
}: {
  result: Drone | 'not_found'
  query: string
  onReset: () => void
  navigate: ReturnType<typeof useNavigate>
}) {
  if (result === 'not_found') return <NotFound query={query} onReset={onReset} />
  if (result.status === 'violation')
    return <Flagged drone={result} onReset={onReset} navigate={navigate} />
  return <Verified drone={result} onReset={onReset} navigate={navigate} />
}

function Verified({
  drone,
  onReset,
  navigate,
}: {
  drone: Drone
  onReset: () => void
  navigate: ReturnType<typeof useNavigate>
}) {
  return (
    <ResultShell
      tone="good"
      icon={<CheckCircle className="w-7 h-7 text-success" />}
      eyebrow="Verified"
      heading="Registered drone"
      onReset={onReset}
    >
      <ResultDetails drone={drone} />
      <button
        type="button"
        onClick={() => navigate(`/drone/${drone.id}`)}
        className="inline-flex items-center justify-center gap-2 h-11 px-5 mt-2 rounded-full font-semibold text-sm text-white"
        style={{
          background: 'linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95))',
        }}
      >
        View full profile
        <ArrowRight className="w-4 h-4" />
      </button>
    </ResultShell>
  )
}

function Flagged({
  drone,
  onReset,
  navigate,
}: {
  drone: Drone
  onReset: () => void
  navigate: ReturnType<typeof useNavigate>
}) {
  return (
    <ResultShell
      tone="warn"
      icon={<AlertTriangle className="w-7 h-7 text-warning" />}
      eyebrow="Flagged"
      heading="Drone with active violations"
      onReset={onReset}
    >
      <ResultDetails drone={drone} />
      <div
        className="rounded-xl px-4 py-3 text-[13px]"
        style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.4)',
          color: '#F59E0B',
        }}
      >
        ⚠️ This drone has active violations on its record.
        <div className="text-white/65 text-[12px] mt-1">Status: Under investigation</div>
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        <button
          type="button"
          onClick={() => navigate('/violations')}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-full font-semibold text-sm text-white"
          style={{
            background: 'linear-gradient(135deg, rgba(245,158,11,0.95), rgba(217,119,6,0.95))',
          }}
        >
          <AlertTriangle className="w-4 h-4" />
          View violations
        </button>
        <button
          type="button"
          onClick={() => navigate(`/drone/${drone.id}`)}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-full font-semibold text-sm text-white border border-white/15 hover:bg-white/[0.05] transition-colors"
        >
          View profile
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </ResultShell>
  )
}

function NotFound({ query, onReset }: { query: string; onReset: () => void }) {
  return (
    <ResultShell
      tone="bad"
      icon={<XCircle className="w-7 h-7 text-danger" />}
      eyebrow="No record"
      heading="Unregistered drone"
      onReset={onReset}
    >
      <div className="text-[13px] text-white/65">
        No blockchain record found for:
        <div className="font-mono text-white text-[14px] mt-1">{query || '—'}</div>
      </div>
      <div
        className="rounded-xl px-4 py-3 text-[12.5px] text-white/70"
        style={{
          background: 'rgba(239,68,68,0.07)',
          border: '1px solid rgba(239,68,68,0.35)',
        }}
      >
        This drone may be operating illegally. All drones must be registered per the
        DGCA 2021 regulations.
      </div>
      <div className="flex flex-wrap gap-2 mt-2">
        <button
          type="button"
          onClick={() => toast.success('DGCA helpline: 1800-463-3000')}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-full font-semibold text-sm text-white"
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.95), rgba(220,38,38,0.95))',
          }}
        >
          <Phone className="w-4 h-4" />
          Report to DGCA
        </button>
        <button
          type="button"
          onClick={() => toast.success('Report filed successfully')}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-full font-semibold text-sm text-white border border-white/15 hover:bg-white/[0.05] transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
          File report
        </button>
      </div>
    </ResultShell>
  )
}

function ResultShell({
  tone,
  icon,
  eyebrow,
  heading,
  children,
  onReset,
}: {
  tone: 'good' | 'warn' | 'bad'
  icon: React.ReactNode
  eyebrow: string
  heading: string
  children: React.ReactNode
  onReset: () => void
}) {
  const color = tone === 'good' ? '#10B981' : tone === 'warn' ? '#F59E0B' : '#EF4444'
  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
      className="relative overflow-hidden mt-6 glass-strong p-5 sm:p-6 grid gap-3"
      style={{
        boxShadow: `0 24px 48px -28px ${color}55`,
        borderColor: `${color}55`,
      }}
    >
      <div
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: `radial-gradient(closest-side, ${color}33, transparent 70%)` }}
      />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: `${color}1f`,
              border: `1px solid ${color}55`,
            }}
          >
            {icon}
          </div>
          <div className="min-w-0">
            <div
              className="text-[10.5px] uppercase tracking-[0.18em] font-semibold"
              style={{ color }}
            >
              {eyebrow}
            </div>
            <div className="font-inter font-extrabold tracking-tight text-[18px] text-white">
              {heading}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="text-[12px] text-white/55 hover:text-white px-2.5 py-1 rounded-md hover:bg-white/[0.05] transition-colors"
        >
          Verify another
        </button>
      </div>

      <div className="relative grid gap-3">{children}</div>
    </motion.div>
  )
}

function ResultDetails({ drone }: { drone: Drone }) {
  return (
    <div className="grid sm:grid-cols-2 gap-2">
      <DetailRow label="ID" value={drone.id} mono />
      <DetailRow label="Model" value={drone.model} />
      <DetailRow
        label="Owner"
        value="Verified"
        chip={<CheckCircle className="w-3.5 h-3.5 text-success" />}
      />
      <DetailRow
        label="Remote ID"
        value={drone.remoteIdActive ? 'Active' : 'Inactive'}
        chip={
          drone.remoteIdActive ? (
            <CheckCircle className="w-3.5 h-3.5 text-success" />
          ) : (
            <XCircle className="w-3.5 h-3.5 text-danger" />
          )
        }
      />
      <DetailRow label="Insurance" value={drone.insurance} />
      <DetailRow label="Compliance" value={`${drone.compliance}%`} mono />
      <DetailRow label="Last broadcast" value="2 minutes ago" />
    </div>
  )
}

function DetailRow({
  label,
  value,
  mono,
  chip,
}: {
  label: string
  value: string
  mono?: boolean
  chip?: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.05]">
      <span className="text-[12px] text-white/55">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        {chip}
        <span
          className={`text-[13px] font-semibold text-white truncate ${mono ? 'font-mono tabular-nums' : ''}`}
        >
          {value}
        </span>
      </div>
    </div>
  )
}
