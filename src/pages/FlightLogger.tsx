import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import toast from 'react-hot-toast'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Battery,
  Calendar,
  CheckCircle,
  CheckSquare,
  Clock,
  Cloud,
  CloudRain,
  Download,
  ImagePlus,
  MapPin,
  Plane,
  Play,
  Radio,
  Repeat,
  Rocket,
  Sparkles,
  Square,
  Sun,
  Upload,
  Wind,
} from 'lucide-react'
import { MOCK_DRONES } from '../data/mockDrones'

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const

type StepKey = 1 | 2 | 3
type Weather = 'Clear' | 'Partly Cloudy' | 'Overcast' | 'Windy'
type Incident = 'none' | 'minor' | 'major'

const CHECKLIST = [
  'Remote ID module active',
  'Insurance valid',
  'Weather conditions checked',
  'Airspace clearance obtained',
  'Battery fully charged',
  'No-fly zones verified',
] as const

const PURPOSES = [
  'Photography',
  'Survey',
  'Delivery',
  'Inspection',
  'Training',
  'Other',
] as const

const WEATHER_OPTIONS: { key: Weather; icon: React.ReactNode }[] = [
  { key: 'Clear', icon: <Sun className="w-3.5 h-3.5" /> },
  { key: 'Partly Cloudy', icon: <Cloud className="w-3.5 h-3.5" /> },
  { key: 'Overcast', icon: <CloudRain className="w-3.5 h-3.5" /> },
  { key: 'Windy', icon: <Wind className="w-3.5 h-3.5" /> },
]

type FormData = {
  droneId: string
  date: string
  time: string
  takeoffLocation: string
  purpose: string
  estimatedDuration: string
  weather: Weather
  incidents: Incident
  notes: string
}

const todayDate = () => new Date().toISOString().split('T')[0]
const nowTime = () => new Date().toTimeString().slice(0, 5)

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function generateFlightId() {
  return `FLT-2026-${String(Math.floor(Math.random() * 900) + 100)}`
}

function generateTxHash() {
  const hex = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 44 }, () => hex[Math.floor(Math.random() * hex.length)]).join('')
}

function shortHash(h: string) {
  return `${h.slice(0, 10)}…${h.slice(-8)}`
}

export default function FlightLogger() {
  const navigate = useNavigate()
  const [step, setStep] = useState<StepKey>(1)
  const [checks, setChecks] = useState<boolean[]>(() => CHECKLIST.map(() => false))
  const [formData, setFormData] = useState<FormData>({
    droneId: '',
    date: todayDate(),
    time: nowTime(),
    takeoffLocation: 'Chandigarh, Punjab',
    purpose: '',
    estimatedDuration: '',
    weather: 'Clear',
    incidents: 'none',
    notes: '',
  })

  const [flying, setFlying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [logging, setLogging] = useState(false)
  const [logged, setLogged] = useState(false)
  const [certificate, setCertificate] = useState<{
    flightId: string
    txHash: string
    block: number
    droneId: string
    duration: number
    date: string
    maxAlt: number
    maxSpeed: number
  } | null>(null)

  const checklistDone = checks.every(Boolean)
  const formReady =
    !!formData.droneId &&
    !!formData.purpose &&
    !!formData.estimatedDuration.trim() &&
    !!formData.takeoffLocation.trim()
  const canStart = checklistDone && formReady

  useEffect(() => {
    if (!flying) return
    const id = setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => clearInterval(id)
  }, [flying])

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) =>
    setFormData((f) => ({ ...f, [k]: v }))

  const toggleCheck = (i: number) =>
    setChecks((c) => c.map((v, idx) => (idx === i ? !v : v)))

  const startFlight = () => {
    if (!canStart) {
      toast.error('Complete the checklist and form first')
      return
    }
    setFlying(true)
    setStep(2)
  }

  const endFlight = () => {
    setFlying(false)
    setStep(3)
  }

  const handleLog = async () => {
    if (logging) return
    setLogging(true)
    await new Promise((r) => setTimeout(r, 2000))
    const cert = {
      flightId: generateFlightId(),
      txHash: generateTxHash(),
      block: 248_300_000 + Math.floor(Math.random() * 9000),
      droneId: formData.droneId,
      duration: elapsed,
      date: formData.date,
      maxAlt: 145,
      maxSpeed: 52,
    }
    setCertificate(cert)
    setLogged(true)
    setLogging(false)
    toast.success('Flight logged on Solana!')
  }

  const reset = () => {
    setStep(1)
    setChecks(CHECKLIST.map(() => false))
    setFormData({
      droneId: '',
      date: todayDate(),
      time: nowTime(),
      takeoffLocation: 'Chandigarh, Punjab',
      purpose: '',
      estimatedDuration: '',
      weather: 'Clear',
      incidents: 'none',
      notes: '',
    })
    setFlying(false)
    setElapsed(0)
    setLogged(false)
    setCertificate(null)
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

      <div className="relative max-w-[1100px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Header navigate={navigate} step={step} flying={flying} />

        <Stepper step={step} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.35, ease: EASE_OUT_QUART }}
            className="mt-6"
          >
            {step === 1 && (
              <PreFlightStep
                checks={checks}
                toggleCheck={toggleCheck}
                checklistDone={checklistDone}
                formData={formData}
                set={set}
                canStart={canStart}
                onStart={startFlight}
              />
            )}
            {step === 2 && (
              <InFlightStep
                elapsed={elapsed}
                droneId={formData.droneId}
                onEnd={endFlight}
              />
            )}
            {step === 3 && (
              <PostFlightStep
                elapsed={elapsed}
                formData={formData}
                set={set}
                logging={logging}
                logged={logged}
                certificate={certificate}
                onLog={handleLog}
                onAnother={reset}
                onDashboard={() => navigate('/dashboard')}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

function Header({
  navigate,
  step,
  flying,
}: {
  navigate: ReturnType<typeof useNavigate>
  step: StepKey
  flying: boolean
}) {
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
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
        <div>
          <h1 className="font-inter font-black tracking-tight text-[28px] sm:text-[32px] leading-tight">
            <span aria-hidden>🛫 </span>Flight Logger
          </h1>
          <p className="text-[13.5px] text-white/55 mt-1">
            Log your flight on the Solana blockchain.
          </p>
        </div>
        <div className="inline-flex items-center gap-2">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-semibold"
            style={{
              background: flying ? 'rgba(239,68,68,0.12)' : 'rgba(59,130,246,0.12)',
              border: `1px solid ${flying ? '#EF4444' : '#3B82F6'}55`,
              color: flying ? '#EF4444' : '#3B82F6',
            }}
          >
            <span className="relative inline-flex w-1.5 h-1.5">
              <span
                className="absolute inset-0 rounded-full"
                style={{ background: flying ? '#EF4444' : '#3B82F6' }}
              />
              {flying && (
                <span
                  className="absolute -inset-1 rounded-full pulse-ring"
                  style={{ background: 'rgba(239,68,68,0.45)' }}
                />
              )}
            </span>
            {flying ? 'Flight active' : `Step ${step} of 3`}
          </span>
        </div>
      </div>
    </header>
  )
}

function Stepper({ step }: { step: StepKey }) {
  const labels = ['Pre-Flight', 'In Flight', 'Post-Flight']
  return (
    <div className="grid grid-cols-3 gap-2">
      {labels.map((label, idx) => {
        const i = (idx + 1) as StepKey
        const done = i < step
        const active = i === step
        const color = done ? '#10B981' : active ? '#3B82F6' : 'rgba(255,255,255,0.18)'
        return (
          <div key={label} className="flex items-center gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-[12px] shrink-0"
              style={{
                background: done ? color : active ? `${color}1f` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${color}`,
                color: done ? '#0a0f1a' : color,
              }}
            >
              {done ? <CheckCircle className="w-4 h-4" /> : i}
            </div>
            <div className="min-w-0">
              <div className="text-[10.5px] uppercase tracking-[0.14em] text-white/40">
                Step {i}
              </div>
              <div
                className="text-[13px] font-semibold truncate"
                style={{ color: active ? '#FFFFFF' : done ? '#10B981' : 'rgba(255,255,255,0.55)' }}
              >
                {label}
              </div>
            </div>
            {idx < 2 && (
              <div
                className="hidden sm:block flex-1 h-px"
                style={{ background: i < step ? '#10B981' : 'rgba(255,255,255,0.08)' }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

function PreFlightStep({
  checks,
  toggleCheck,
  checklistDone,
  formData,
  set,
  canStart,
  onStart,
}: {
  checks: boolean[]
  toggleCheck: (i: number) => void
  checklistDone: boolean
  formData: FormData
  set: <K extends keyof FormData>(k: K, v: FormData[K]) => void
  canStart: boolean
  onStart: () => void
}) {
  const checkedCount = checks.filter(Boolean).length
  return (
    <div className="grid gap-5">
      <Card title="Pre-flight checklist" icon={<CheckSquare className="w-4 h-4" />}>
        <div className="grid sm:grid-cols-2 gap-2">
          {CHECKLIST.map((label, i) => {
            const checked = checks[i]
            return (
              <button
                key={label}
                type="button"
                onClick={() => toggleCheck(i)}
                className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-colors"
                style={{
                  background: checked ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${checked ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.08)'}`,
                }}
              >
                <span
                  className="w-5 h-5 rounded-md flex items-center justify-center shrink-0"
                  style={{
                    background: checked ? '#10B981' : 'transparent',
                    border: `1.5px solid ${checked ? '#10B981' : 'rgba(255,255,255,0.25)'}`,
                  }}
                >
                  {checked && <CheckCircle className="w-3.5 h-3.5 text-bg" />}
                </span>
                <span
                  className="text-[13.5px] font-medium"
                  style={{ color: checked ? '#FFFFFF' : 'rgba(255,255,255,0.85)' }}
                >
                  {label}
                </span>
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex items-center justify-between text-[12px]">
          <span className="text-white/55">
            {checkedCount} of {CHECKLIST.length} complete
          </span>
          <span
            className="font-semibold"
            style={{ color: checklistDone ? '#10B981' : '#F59E0B' }}
          >
            {checklistDone ? 'Ready' : 'Incomplete'}
          </span>
        </div>
      </Card>

      <Card title="Flight details" icon={<Plane className="w-4 h-4" />}>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Drone">
            <select
              value={formData.droneId}
              onChange={(e) => set('droneId', e.target.value)}
              className="reg-input"
            >
              <option value="">Select a drone…</option>
              {MOCK_DRONES.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.id} — {d.model}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Purpose">
            <select
              value={formData.purpose}
              onChange={(e) => set('purpose', e.target.value)}
              className="reg-input"
            >
              <option value="">Select a purpose…</option>
              {PURPOSES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Date" icon={<Calendar className="w-3.5 h-3.5" />}>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => set('date', e.target.value)}
              className="reg-input"
            />
          </Field>
          <Field label="Time" icon={<Clock className="w-3.5 h-3.5" />}>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => set('time', e.target.value)}
              className="reg-input"
            />
          </Field>
          <Field label="Takeoff location" icon={<MapPin className="w-3.5 h-3.5" />}>
            <input
              type="text"
              placeholder="City, State"
              value={formData.takeoffLocation}
              onChange={(e) => set('takeoffLocation', e.target.value)}
              className="reg-input"
            />
          </Field>
          <Field label="Estimated duration">
            <input
              type="text"
              placeholder="e.g. 30 minutes"
              value={formData.estimatedDuration}
              onChange={(e) => set('estimatedDuration', e.target.value)}
              className="reg-input"
            />
          </Field>
        </div>

        <div className="mt-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 font-semibold mb-2">
            Weather conditions
          </div>
          <div className="flex flex-wrap gap-2">
            {WEATHER_OPTIONS.map((w) => {
              const active = formData.weather === w.key
              return (
                <button
                  key={w.key}
                  type="button"
                  onClick={() => set('weather', w.key)}
                  className="inline-flex items-center gap-2 px-3.5 h-9 rounded-full text-[12.5px] font-semibold transition-colors"
                  style={{
                    background: active ? 'rgba(59,130,246,0.18)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? 'rgba(59,130,246,0.55)' : 'rgba(255,255,255,0.08)'}`,
                    color: active ? '#FFFFFF' : 'rgba(255,255,255,0.75)',
                  }}
                >
                  <span style={{ color: active ? '#3B82F6' : 'rgba(255,255,255,0.55)' }}>
                    {w.icon}
                  </span>
                  {w.key}
                </button>
              )
            })}
          </div>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-4">
        <div className="text-[12.5px] text-white/55">
          {!checklistDone && 'Complete every checklist item to continue.'}
          {checklistDone && !canStart && 'Fill out the flight details to continue.'}
          {canStart && 'Ready for takeoff.'}
        </div>
        <button
          type="button"
          onClick={onStart}
          disabled={!canStart}
          className="inline-flex items-center gap-2 h-12 px-6 rounded-full font-semibold text-sm text-white whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          style={{
            background: canStart
              ? 'linear-gradient(135deg, rgba(59,130,246,0.95), rgba(99,102,241,0.95))'
              : 'rgba(255,255,255,0.06)',
            boxShadow: canStart ? '0 14px 32px -10px rgba(59,130,246,0.6)' : 'none',
          }}
        >
          <Play className="w-4 h-4" />
          Start flight
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <FormStyles />
    </div>
  )
}

function InFlightStep({
  elapsed,
  droneId,
  onEnd,
}: {
  elapsed: number
  droneId: string
  onEnd: () => void
}) {
  const battery = Math.max(20, 100 - Math.floor(elapsed / 10))
  const altitude = 100 + ((elapsed * 3) % 50)
  const speed = 35 + ((elapsed * 2) % 25)
  const drone = MOCK_DRONES.find((d) => d.id === droneId) ?? MOCK_DRONES[0]

  const broadcasts = useMemo(() => {
    const idx = Math.floor(elapsed / 5)
    return Array.from({ length: 5 }, (_, i) => {
      const tick = idx - i
      const t = tick * 5
      const at = new Date(Date.now() - i * 5000)
      const lat = drone.location.lat + Math.sin(tick * 0.4) * 0.001
      const lng = drone.location.lng + Math.cos(tick * 0.3) * 0.001
      return {
        key: `${tick}`,
        at,
        lat: lat.toFixed(4),
        lng: lng.toFixed(4),
        alt: 100 + ((t * 3) % 50),
        speed: 35 + ((t * 2) % 25),
      }
    })
  }, [Math.floor(elapsed / 5), drone])

  return (
    <div className="grid gap-5">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
        className="relative overflow-hidden glass-strong p-6 sm:p-8 text-center"
      >
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            background:
              'radial-gradient(ellipse at center, rgba(59,130,246,0.18), transparent 65%)',
          }}
        />
        <div className="relative">
          <div className="inline-flex items-center gap-2 text-[10.5px] uppercase tracking-[0.18em] text-danger font-bold mb-3">
            <span className="relative inline-flex w-2 h-2">
              <span className="absolute inset-0 rounded-full bg-danger" />
              <motion.span
                className="absolute -inset-0.5 rounded-full"
                style={{ background: '#EF4444' }}
                animate={{ opacity: [0.6, 0, 0.6] }}
                transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              />
            </span>
            Flight active
          </div>
          <div
            className="font-mono font-black tabular-nums tracking-tight"
            style={{
              fontSize: 'clamp(56px, 12vw, 96px)',
              lineHeight: 1,
              color: '#3B82F6',
              textShadow: '0 0 28px rgba(59,130,246,0.45)',
            }}
          >
            {formatTime(elapsed)}
          </div>
          <div className="text-[12.5px] text-white/55 mt-2">
            Drone {drone.id} · {drone.model}
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <LiveTile label="Altitude" value={`${altitude} m`} icon={<Sparkles className="w-3.5 h-3.5" />} tone="primary" />
        <LiveTile label="Speed" value={`${speed} km/h`} icon={<Wind className="w-3.5 h-3.5" />} tone="primary" />
        <LiveTile
          label="Battery"
          value={`${battery}%`}
          icon={<Battery className="w-3.5 h-3.5" />}
          tone={battery >= 50 ? 'good' : battery >= 25 ? 'warn' : 'bad'}
        />
        <LiveTile label="Remote ID" value="Active" icon={<Radio className="w-3.5 h-3.5" />} tone="good" />
      </div>

      <Card title="Live Remote ID broadcast" icon={<Radio className="w-4 h-4" />}>
        <div className="grid gap-1.5">
          <AnimatePresence initial={false}>
            {broadcasts.map((b, i) => (
              <motion.div
                key={b.key}
                layout
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.35, ease: EASE_OUT_QUART }}
                className="flex items-center gap-3 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02]"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: '#10B981' }}
                />
                <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-4 gap-2 items-center">
                  <span className="text-[12px] font-mono tabular-nums text-white/85">
                    {b.at.toLocaleTimeString()}
                    {i === 0 && (
                      <span className="ml-2 text-[9px] uppercase tracking-[0.14em] px-1.5 py-0.5 rounded text-primary border border-primary/40 bg-primary/10">
                        Latest
                      </span>
                    )}
                  </span>
                  <span className="text-[11.5px] font-mono text-white/55 tabular-nums truncate">
                    {b.lat} N · {b.lng} E
                  </span>
                  <span className="text-[12px] font-semibold text-white tabular-nums">
                    {b.alt} m
                  </span>
                  <span className="text-[12px] text-white/65 tabular-nums">
                    {b.speed} km/h
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Card>

      <div className="flex items-center justify-between gap-4 pt-2">
        <div className="text-[12.5px] text-white/55">
          When you’re back on the ground, end the flight to file the report.
        </div>
        <button
          type="button"
          onClick={onEnd}
          className="inline-flex items-center gap-2 h-12 px-6 rounded-full font-semibold text-sm text-white"
          style={{
            background: 'linear-gradient(135deg, rgba(239,68,68,0.95), rgba(220,38,38,0.95))',
            boxShadow: '0 14px 32px -12px rgba(239,68,68,0.55)',
          }}
        >
          <Square className="w-4 h-4 fill-white" />
          End flight
        </button>
      </div>
    </div>
  )
}

function PostFlightStep({
  elapsed,
  formData,
  set,
  logging,
  logged,
  certificate,
  onLog,
  onAnother,
  onDashboard,
}: {
  elapsed: number
  formData: FormData
  set: <K extends keyof FormData>(k: K, v: FormData[K]) => void
  logging: boolean
  logged: boolean
  certificate: {
    flightId: string
    txHash: string
    block: number
    droneId: string
    duration: number
    date: string
    maxAlt: number
    maxSpeed: number
  } | null
  onLog: () => void
  onAnother: () => void
  onDashboard: () => void
}) {
  if (logged && certificate) {
    return (
      <FlightCertificate
        certificate={certificate}
        onAnother={onAnother}
        onDashboard={onDashboard}
      />
    )
  }

  const incidentOptions: { key: Incident; label: string; icon: React.ReactNode; color: string }[] = [
    { key: 'none', label: 'None', icon: <CheckCircle className="w-3.5 h-3.5" />, color: '#10B981' },
    { key: 'minor', label: 'Minor', icon: <AlertCircle className="w-3.5 h-3.5" />, color: '#F59E0B' },
    { key: 'major', label: 'Major', icon: <AlertTriangle className="w-3.5 h-3.5" />, color: '#EF4444' },
  ]

  const batteryUsed = Math.min(100, Math.floor(elapsed / 10))

  return (
    <div className="grid gap-5">
      <Card title="Flight summary" icon={<Plane className="w-4 h-4" />}>
        <div className="grid sm:grid-cols-3 gap-3">
          <SummaryStat label="Total duration" value={formatTime(elapsed)} mono />
          <SummaryStat label="Takeoff" value={formData.takeoffLocation} />
          <SummaryStat label="Landing" value="Auto-detected" />
          <SummaryStat label="Max altitude" value="145 m" mono />
          <SummaryStat label="Max speed" value="52 km/h" mono />
          <SummaryStat label="Battery used" value={`${batteryUsed}%`} mono />
        </div>
      </Card>

      <Card title="Incident report" icon={<AlertCircle className="w-4 h-4" />}>
        <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 font-semibold mb-2">
          Any incidents?
        </div>
        <div className="flex flex-wrap gap-2">
          {incidentOptions.map((opt) => {
            const active = formData.incidents === opt.key
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => set('incidents', opt.key)}
                className="inline-flex items-center gap-2 px-3.5 h-10 rounded-full text-[12.5px] font-semibold transition-colors"
                style={{
                  background: active ? `${opt.color}1f` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${active ? `${opt.color}66` : 'rgba(255,255,255,0.08)'}`,
                  color: active ? opt.color : 'rgba(255,255,255,0.75)',
                }}
              >
                {opt.icon}
                {opt.label}
              </button>
            )
          })}
        </div>

        <div className="mt-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 font-semibold mb-2">
            Notes
          </div>
          <textarea
            value={formData.notes}
            onChange={(e) => set('notes', e.target.value)}
            placeholder="Any additional notes…"
            rows={3}
            className="reg-input resize-y w-full px-3 py-2 rounded-xl"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          />
        </div>

        <div className="mt-4">
          <div className="text-[11px] uppercase tracking-[0.14em] text-white/45 font-semibold mb-2">
            Photos
          </div>
          <button
            type="button"
            onClick={() => toast('Upload coming soon', { icon: '📸' })}
            className="w-full flex items-center justify-center gap-2 px-4 py-6 rounded-xl border border-dashed border-white/15 text-white/55 hover:text-white hover:border-white/35 transition-colors"
          >
            <ImagePlus className="w-4 h-4" />
            Upload flight photos (optional)
          </button>
        </div>
      </Card>

      <button
        type="button"
        onClick={onLog}
        disabled={logging}
        className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full font-semibold text-sm text-white whitespace-nowrap disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.95), rgba(99,102,241,0.95))',
          boxShadow: '0 14px 32px -10px rgba(59,130,246,0.6)',
        }}
      >
        {logging ? (
          <>
            <Repeat className="w-4 h-4 animate-spin" />
            Logging to blockchain…
          </>
        ) : (
          <>
            <Upload className="w-4 h-4" />
            Log to blockchain
          </>
        )}
      </button>

      <FormStyles />
    </div>
  )
}

function FlightCertificate({
  certificate,
  onAnother,
  onDashboard,
}: {
  certificate: NonNullable<Parameters<typeof PostFlightStep>[0]['certificate']>
  onAnother: () => void
  onDashboard: () => void
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.55, ease: EASE_OUT_EXPO }}
      className="relative overflow-hidden glass-strong p-6 sm:p-8"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-success/60 to-transparent" />
      <div
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(closest-side, rgba(16,185,129,0.3), transparent 70%)' }}
      />

      <div className="relative flex items-center gap-3 mb-5">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center"
          style={{
            background: 'rgba(16,185,129,0.18)',
            border: '1px solid rgba(16,185,129,0.45)',
          }}
        >
          <Rocket className="w-6 h-6 text-success" />
        </div>
        <div>
          <div className="text-[10.5px] uppercase tracking-[0.18em] text-success font-semibold">
            Flight certificate
          </div>
          <div className="font-inter font-extrabold tracking-tight text-[20px] text-white">
            Logged on Solana
          </div>
        </div>
      </div>

      <div className="relative grid gap-2">
        <CertRow label="Flight ID" value={certificate.flightId} mono />
        <CertRow label="Drone" value={certificate.droneId} mono />
        <CertRow label="Duration" value={formatTime(certificate.duration)} mono />
        <CertRow label="Date" value={certificate.date} />
        <CertRow label="Max altitude" value={`${certificate.maxAlt} m`} mono />
        <CertRow label="Max speed" value={`${certificate.maxSpeed} km/h`} mono />
        <CertRow label="Status">
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-success">
            <CheckCircle className="w-3.5 h-3.5" />
            Compliant
          </span>
        </CertRow>
        <CertRow label="Block" value={certificate.block.toLocaleString()} mono />
        <CertRow label="Tx hash" value={shortHash(certificate.txHash)} mono copy={certificate.txHash} />
      </div>

      <div className="relative mt-5 text-[12.5px] text-white/55 flex items-center gap-2">
        <span aria-hidden>🔗</span>
        Stored immutably on Solana — proof anchored on chain.
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => toast.success('Certificate downloaded')}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-full font-semibold text-sm text-white"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95))',
            boxShadow: '0 12px 32px -12px rgba(16,185,129,0.55)',
          }}
        >
          <Download className="w-4 h-4" />
          Download certificate
        </button>
        <button
          type="button"
          onClick={onAnother}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-full font-semibold text-sm text-white border border-white/15 hover:border-white/35 hover:bg-white/[0.05] transition-colors"
        >
          <Repeat className="w-4 h-4" />
          Log another flight
        </button>
        <button
          type="button"
          onClick={onDashboard}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-full font-semibold text-sm text-white border border-white/15 hover:border-white/35 hover:bg-white/[0.05] transition-colors"
        >
          Back to dashboard
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </motion.section>
  )
}

function CertRow({
  label,
  value,
  mono,
  copy,
  children,
}: {
  label: string
  value?: string
  mono?: boolean
  copy?: string
  children?: React.ReactNode
}) {
  const handleCopy = () => {
    if (!copy) return
    navigator.clipboard?.writeText(copy).then(() => toast.success(`${label} copied`))
  }
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02]">
      <span className="text-[12px] text-white/55">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        {children ?? (
          <span
            className={`text-[13px] font-semibold text-white truncate ${mono ? 'font-mono tabular-nums' : ''}`}
          >
            {value}
          </span>
        )}
        {copy && (
          <button
            type="button"
            onClick={handleCopy}
            className="text-white/35 hover:text-white/85 transition-colors"
            aria-label={`Copy ${label}`}
          >
            <Upload className="w-3 h-3 rotate-180" />
          </button>
        )}
      </div>
    </div>
  )
}

function SummaryStat({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="px-3 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <div className="text-[10px] uppercase tracking-[0.14em] text-white/45 font-semibold">
        {label}
      </div>
      <div
        className={`text-[14px] font-semibold text-white truncate mt-0.5 ${mono ? 'font-mono tabular-nums' : ''}`}
      >
        {value}
      </div>
    </div>
  )
}

function LiveTile({
  label,
  value,
  icon,
  tone,
}: {
  label: string
  value: string
  icon: React.ReactNode
  tone: 'primary' | 'good' | 'warn' | 'bad'
}) {
  const color =
    tone === 'good'
      ? '#10B981'
      : tone === 'warn'
        ? '#F59E0B'
        : tone === 'bad'
          ? '#EF4444'
          : '#3B82F6'
  return (
    <div
      className="rounded-xl px-4 py-3.5 border bg-white/[0.02]"
      style={{ borderColor: `${color}33` }}
    >
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.14em] text-white/55 font-semibold">
        <span style={{ color }}>{icon}</span>
        {label}
      </div>
      <motion.div
        key={value}
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="text-[20px] font-inter font-extrabold tabular-nums tracking-tight mt-0.5"
        style={{ color }}
      >
        {value}
      </motion.div>
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
    <section className="glass-strong p-5 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-primary/85">{icon}</span>
        <h3 className="font-inter font-bold text-[14px] tracking-tight text-white">
          {title}
        </h3>
      </div>
      <div>{children}</div>
    </section>
  )
}

function Field({
  label,
  icon,
  children,
}: {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <div className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.14em] text-white/45 font-semibold mb-1.5">
        {icon && <span className="text-white/40">{icon}</span>}
        {label}
      </div>
      <div
        className="px-3 py-2 rounded-xl"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {children}
      </div>
    </label>
  )
}

function FormStyles() {
  return (
    <style>{`
      .reg-input {
        width: 100%;
        background: transparent;
        border: none;
        outline: none;
        color: #F9FAFB;
        -webkit-text-fill-color: #F9FAFB;
        caret-color: #F9FAFB;
        font-family: inherit;
        font-size: 14px;
        line-height: 1.45;
      }
      .reg-input::placeholder { color: rgba(255,255,255,0.35); }
      select.reg-input { appearance: none; cursor: pointer; padding-right: 1.25rem; background-image: linear-gradient(45deg, transparent 50%, rgba(255,255,255,0.45) 50%), linear-gradient(135deg, rgba(255,255,255,0.45) 50%, transparent 50%); background-position: calc(100% - 14px) center, calc(100% - 9px) center; background-size: 5px 5px, 5px 5px; background-repeat: no-repeat; }
      select.reg-input option { background: #0a0f1a; color: #F9FAFB; }
      textarea.reg-input { line-height: 1.55; }
    `}</style>
  )
}
