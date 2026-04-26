import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import toast from 'react-hot-toast'
import { QRCodeSVG } from 'qrcode.react'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Battery,
  CheckCircle,
  Cpu,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Lock,
  MapPin,
  Plane,
  Radio,
  Receipt,
  Repeat,
  Shield,
  Sparkles,
  Upload,
  Wallet,
  Wifi,
  X,
} from 'lucide-react'

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const

type DocKey = 'purchaseReceipt' | 'insuranceCert' | 'pilotLicensePhoto' | 'dronePhoto'
type RemoteIdKey = 'standard' | 'broadcast' | 'network'

type FormData = {
  model: string
  serial: string
  weightClass: string
  purpose: string
  maxAltitude: string
  maxRange: string
  remoteIdType: RemoteIdKey | ''
  pilotName: string
  licenseNumber: string
  walletAddress: string
  friaCertified: boolean
  experience: 'Beginner' | 'Intermediate' | 'Expert' | ''
  purchaseReceipt: string | null
  insuranceCert: string | null
  pilotLicensePhoto: string | null
  dronePhoto: string | null
  broadcastFreq: string
  networkReporting: boolean
  emergencyBroadcast: boolean
}

const EMPTY_FORM: FormData = {
  model: '',
  serial: '',
  weightClass: '',
  purpose: '',
  maxAltitude: '',
  maxRange: '',
  remoteIdType: '',
  pilotName: '',
  licenseNumber: '',
  walletAddress: '',
  friaCertified: false,
  experience: '',
  purchaseReceipt: null,
  insuranceCert: null,
  pilotLicensePhoto: null,
  dronePhoto: null,
  broadcastFreq: '1',
  networkReporting: true,
  emergencyBroadcast: true,
}

const STEP_LABELS = ['Drone', 'Pilot', 'Docs', 'Remote ID', 'Mint'] as const

const DRONE_MODELS = [
  'DJI Mavic 3 Pro',
  'DJI Mavic 3 Classic',
  'DJI Phantom 4 RTK',
  'DJI Mini 3 Pro',
  'DJI Mini 4 Pro',
  'DJI Air 3',
  'Parrot Anafi',
  'Autel EVO II',
  'Skydio 2+',
  'Other',
]

const WEIGHT_CLASSES = [
  'Under 250g',
  '250g to 2kg',
  '2kg to 25kg',
  '25kg to 150kg',
  'Above 150kg',
]

const PURPOSES = [
  'Commercial Photography',
  'Survey and Mapping',
  'Delivery Services',
  'Agricultural Spraying',
  'Infrastructure Inspection',
  'Hobby and Recreation',
  'Research and Development',
  'Other',
]

const REMOTE_ID_OPTIONS: {
  key: RemoteIdKey
  emoji: string
  title: string
  body: string
  badge: string
}[] = [
  {
    key: 'standard',
    emoji: '📡',
    title: 'Standard Remote ID',
    body: 'Built-in broadcast module. Most common type.',
    badge: 'Recommended',
  },
  {
    key: 'broadcast',
    emoji: '📻',
    title: 'Broadcast Module',
    body: 'External add-on module for older drones.',
    badge: 'Add-on',
  },
  {
    key: 'network',
    emoji: '🌐',
    title: 'Network Remote ID',
    body: 'Reports via internet for commercial operations.',
    badge: 'Commercial',
  },
]

const DOC_CONFIG: { key: DocKey; emoji: string; title: string; body: string; required: boolean }[] = [
  {
    key: 'purchaseReceipt',
    emoji: '🧾',
    title: 'Purchase Receipt',
    body: 'Proof of drone purchase. PDF, JPG, or PNG.',
    required: true,
  },
  {
    key: 'insuranceCert',
    emoji: '🛡️',
    title: 'Insurance Certificate',
    body: 'Valid drone insurance. Required for commercial use.',
    required: false,
  },
  {
    key: 'pilotLicensePhoto',
    emoji: '📜',
    title: 'Pilot License Photo',
    body: 'Clear photo of your DGCA pilot certificate.',
    required: true,
  },
  {
    key: 'dronePhoto',
    emoji: '📷',
    title: 'Drone Photo',
    body: 'Clear photo showing the serial number.',
    required: true,
  },
]

function generateDroneId() {
  return `DRN-2026-${String(Math.floor(Math.random() * 900) + 100)}`
}

function generateTxHash() {
  return `7xK2mN9p${Math.random().toString(36).slice(2, 10)}`
}

function generateBlockNumber() {
  return 48_291_000 + Math.floor(Math.random() * 1000)
}

function generateWallet() {
  const hex = 'abcdefghijklmnopqrstuvwxyz0123456789'
  const r = (n: number) => Array.from({ length: n }, () => hex[Math.floor(Math.random() * hex.length)]).join('')
  return `${r(4).toUpperCase()}${r(2)}...${r(4)}${r(2)}`
}

export default function DroneRegistration() {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [resetKey, setResetKey] = useState(0)

  const [droneId] = useState(generateDroneId)
  const [txHash] = useState(generateTxHash)
  const [blockNumber] = useState(generateBlockNumber)

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) => {
    setFormData((f) => ({ ...f, [k]: v }))
    if (errors[k as string]) setErrors((e) => ({ ...e, [k as string]: '' }))
  }

  function validateStep(n: number): boolean {
    const e: Record<string, string> = {}
    if (n === 1) {
      if (!formData.model) e.model = 'Pick a drone model'
      if (!formData.serial.trim()) e.serial = 'Serial number is required'
      if (!formData.weightClass) e.weightClass = 'Pick a weight class'
      if (!formData.purpose) e.purpose = 'Pick a primary purpose'
      if (!formData.maxAltitude) e.maxAltitude = 'Maximum altitude is required'
      if (!formData.maxRange) e.maxRange = 'Maximum range is required'
      if (!formData.remoteIdType) e.remoteIdType = 'Pick a Remote ID module'
    }
    if (n === 2) {
      if (!formData.pilotName.trim()) e.pilotName = 'Full name is required'
      if (!formData.licenseNumber.trim())
        e.licenseNumber = 'License number is required'
      if (!formData.walletAddress.trim())
        e.walletAddress = 'Connect a wallet or paste an address'
    }
    if (n === 3) {
      const missing = DOC_CONFIG.filter((d) => d.required && !formData[d.key])
      if (missing.length > 0)
        e.docs = `Upload ${missing.length} required document${missing.length === 1 ? '' : 's'} to continue`
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function goNext() {
    if (!validateStep(step)) return
    if (step === 5) {
      handleMint()
      return
    }
    setStep((s) => Math.min(5, s + 1))
  }

  function goBack() {
    if (loading || success) return
    setStep((s) => Math.max(1, s - 1))
  }

  async function handleMint() {
    if (loading) return
    setLoading(true)
    await new Promise((r) => setTimeout(r, 3500))
    setLoading(false)
    setSuccess(true)
  }

  function handleReset() {
    setFormData(EMPTY_FORM)
    setErrors({})
    setStep(1)
    setSuccess(false)
    setLoading(false)
    setResetKey((k) => k + 1)
  }

  const progress = success ? 100 : (step / 5) * 100
  const totalDocs = DOC_CONFIG.length
  const uploadedCount = DOC_CONFIG.filter((d) => formData[d.key]).length

  if (success) {
    return (
      <SuccessScreen
        droneId={droneId}
        txHash={txHash}
        blockNumber={blockNumber}
        formData={formData}
        prefersReducedMotion={!!prefersReducedMotion}
        onDashboard={() => navigate('/dashboard')}
        onAnother={handleReset}
      />
    )
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-bg text-white">
      <div className="pointer-events-none absolute inset-0 grid-bg radial-fade opacity-30" />
      <div
        className="pointer-events-none absolute top-[-15%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full blur-3xl opacity-25"
        style={{
          background: 'radial-gradient(closest-side, rgba(59,130,246,0.5), transparent 70%)',
        }}
      />

      <TopBar onBack={() => navigate(step === 1 ? '/' : '#')} step={step} onStepBack={goBack} />

      <ProgressBar progress={progress} />
      <Stepper step={step} />

      <main className="relative max-w-3xl mx-auto px-5 sm:px-8 pb-24">
        <AnimatePresence mode="wait">
          <motion.section
            key={`${step}-${resetKey}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
            className="mt-10"
          >
            {step === 1 && (
              <DroneStep formData={formData} set={set} errors={errors} />
            )}
            {step === 2 && (
              <PilotStep formData={formData} set={set} errors={errors} />
            )}
            {step === 3 && (
              <DocsStep
                formData={formData}
                set={set}
                errors={errors}
                uploadedCount={uploadedCount}
                totalDocs={totalDocs}
              />
            )}
            {step === 4 && (
              <RemoteIdStep formData={formData} set={set} />
            )}
            {step === 5 && (
              <ReviewStep
                formData={formData}
                droneId={droneId}
                loading={loading}
              />
            )}
          </motion.section>
        </AnimatePresence>

        <StepFooter
          step={step}
          loading={loading}
          onBack={goBack}
          onNext={goNext}
        />
      </main>

      <RegistrationStyles />

      {loading && <MintingOverlay />}
    </div>
  )
}

function TopBar({
  onBack,
  step,
  onStepBack,
}: {
  onBack: () => void
  step: number
  onStepBack: () => void
}) {
  return (
    <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 pt-6">
      <button
        type="button"
        onClick={step > 1 ? onStepBack : onBack}
        className="group inline-flex items-center gap-1.5 text-sm text-white/65 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
        {step > 1 ? 'Back' : 'Home'}
      </button>
      <div className="flex items-center gap-2">
        <span className="text-lg" aria-hidden>🚁</span>
        <span className="font-inter font-extrabold tracking-tight text-primary text-[15px]">
          DroneChain
        </span>
      </div>
      <div className="text-xs text-white/45 tabular-nums min-w-[70px] text-right">
        Step {step} of 5
      </div>
    </div>
  )
}

function ProgressBar({ progress }: { progress: number }) {
  return (
    <div className="relative z-10 mt-5 h-[3px] bg-white/[0.06] overflow-hidden">
      <motion.div
        className="h-full origin-left"
        style={{
          background: 'linear-gradient(90deg, #3B82F6, #2563EB)',
          boxShadow: '0 0 18px rgba(59,130,246,0.55)',
        }}
        initial={false}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
      />
    </div>
  )
}

function Stepper({ step }: { step: number }) {
  return (
    <div className="relative z-10 mt-8 max-w-2xl mx-auto px-5">
      <ol className="grid grid-cols-5 gap-2 sm:gap-4">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1
          const isDone = step > n
          const isActive = step === n
          return (
            <li key={label} className="flex flex-col items-center text-center">
              <div
                className="relative w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold transition-[background,border-color,color,transform] duration-300"
                style={{
                  background: isActive
                    ? '#3B82F6'
                    : isDone
                      ? 'rgba(16,185,129,0.15)'
                      : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isActive ? '#3B82F6' : isDone ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.12)'}`,
                  color: isActive ? '#fff' : isDone ? '#10B981' : 'rgba(255,255,255,0.5)',
                  transform: isActive ? 'scale(1.08)' : 'scale(1)',
                  boxShadow: isActive ? '0 0 0 4px rgba(59,130,246,0.18)' : 'none',
                }}
              >
                {isDone ? <CheckCircle className="w-4 h-4" /> : n}
              </div>
              <div
                className="mt-2 text-[10px] sm:text-xs tracking-wide"
                style={{
                  color: isActive
                    ? '#fff'
                    : isDone
                      ? 'rgba(255,255,255,0.75)'
                      : 'rgba(255,255,255,0.4)',
                }}
              >
                {label}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function FormCard({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mx-auto"
      style={{
        maxWidth: 600,
        background: 'rgba(17,24,39,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24,
        padding: 'clamp(24px, 4vw, 40px)',
      }}
    >
      {children}
    </div>
  )
}

function StepHeading({ emoji, title, subtitle }: { emoji: string; title: string; subtitle: string }) {
  return (
    <div className="text-center max-w-lg mx-auto">
      <div className="text-3xl mb-3" aria-hidden>{emoji}</div>
      <h1
        className="font-inter font-black text-white tracking-tight"
        style={{ fontSize: 'clamp(1.625rem, 3vw, 2rem)', lineHeight: 1.05 }}
      >
        {title}
      </h1>
      <p className="mt-2 text-white/55">{subtitle}</p>
    </div>
  )
}

function Field({
  label,
  hint,
  error,
  icon,
  children,
  trailing,
}: {
  label: string
  hint?: string
  error?: string
  icon?: React.ReactNode
  children: React.ReactNode
  trailing?: React.ReactNode
}) {
  const [focused, setFocused] = useState(false)
  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-medium text-white/60 tracking-wide">{label}</div>
      <div
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="flex items-center transition-[border-color,box-shadow] duration-200 relative"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${error ? '#EF4444' : focused ? '#3B82F6' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: 12,
          padding: icon ? '12px 14px 12px 44px' : '12px 16px',
          boxShadow: focused && !error ? '0 0 0 4px rgba(59,130,246,0.12)' : 'none',
        }}
      >
        {icon && (
          <span
            className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200"
            style={{ color: error ? '#EF4444' : focused ? '#3B82F6' : 'rgba(255,255,255,0.4)' }}
          >
            {icon}
          </span>
        )}
        <div className="flex-1 min-w-0">{children}</div>
        {trailing && <div className="pl-2">{trailing}</div>}
      </div>
      {hint && !error && (
        <div className="mt-1 text-[11px] text-white/40">{hint}</div>
      )}
      {error && <FieldError message={error} />}
    </label>
  )
}

function FieldError({ message, className = '' }: { message: string; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: EASE_OUT_QUART }}
      className={`mt-1.5 flex items-center gap-1.5 text-xs text-danger ${className}`}
      role="alert"
    >
      <AlertTriangle className="w-3.5 h-3.5" />
      {message}
    </motion.div>
  )
}

function DroneStep({
  formData,
  set,
  errors,
}: {
  formData: FormData
  set: <K extends keyof FormData>(k: K, v: FormData[K]) => void
  errors: Record<string, string>
}) {
  return (
    <FormCard>
      <StepHeading emoji="🚁" title="Drone information" subtitle="Tell us about your drone." />
      <div className="mt-7 space-y-4">
        <Field label="Drone Model" icon={<Plane className="w-4 h-4" />} error={errors.model}>
          <select
            className="reg-input"
            value={formData.model}
            onChange={(e) => set('model', e.target.value)}
          >
            <option value="">Select a model</option>
            {DRONE_MODELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </Field>

        <Field label="Serial Number" icon={<Cpu className="w-4 h-4" />} error={errors.serial}>
          <input
            className="reg-input"
            placeholder="e.g. DJI-MV3-789456"
            value={formData.serial}
            onChange={(e) => set('serial', e.target.value.toUpperCase())}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Weight Class" icon={<Battery className="w-4 h-4" />} error={errors.weightClass}>
            <select
              className="reg-input"
              value={formData.weightClass}
              onChange={(e) => set('weightClass', e.target.value)}
            >
              <option value="">Select weight class</option>
              {WEIGHT_CLASSES.map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </select>
          </Field>

          <Field label="Primary Purpose" icon={<FileText className="w-4 h-4" />} error={errors.purpose}>
            <select
              className="reg-input"
              value={formData.purpose}
              onChange={(e) => set('purpose', e.target.value)}
            >
              <option value="">Select purpose</option>
              {PURPOSES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Maximum Altitude (meters)" icon={<MapPin className="w-4 h-4" />} error={errors.maxAltitude}>
            <input
              className="reg-input"
              type="number"
              min="0"
              placeholder="e.g. 400"
              value={formData.maxAltitude}
              onChange={(e) => set('maxAltitude', e.target.value)}
            />
          </Field>

          <Field label="Maximum Range (km)" icon={<Repeat className="w-4 h-4" />} error={errors.maxRange}>
            <input
              className="reg-input"
              type="number"
              min="0"
              placeholder="e.g. 10"
              value={formData.maxRange}
              onChange={(e) => set('maxRange', e.target.value)}
            />
          </Field>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-white/60 tracking-wide">
            Remote ID Module
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {REMOTE_ID_OPTIONS.map((opt) => {
              const active = formData.remoteIdType === opt.key
              return (
                <button
                  type="button"
                  key={opt.key}
                  onClick={() => set('remoteIdType', opt.key)}
                  className="relative text-left transition-[border-color,background,transform] duration-200"
                  style={{
                    background: active ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${active ? '#3B82F6' : 'rgba(255,255,255,0.1)'}`,
                    borderRadius: 14,
                    padding: 16,
                    boxShadow: active ? '0 0 0 4px rgba(59,130,246,0.15)' : 'none',
                  }}
                >
                  {active && (
                    <span
                      className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: '#3B82F6' }}
                    >
                      <CheckCircle className="w-3 h-3 text-white" />
                    </span>
                  )}
                  <div className="text-2xl" aria-hidden>{opt.emoji}</div>
                  <div className="mt-2 font-inter font-bold text-white text-sm">
                    {opt.title}
                  </div>
                  <div className="mt-1 text-[11px] text-white/55 leading-snug">
                    {opt.body}
                  </div>
                  <div
                    className="mt-3 inline-flex items-center text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                    style={{
                      color: active ? '#3B82F6' : 'rgba(255,255,255,0.55)',
                      background: active ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${active ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.08)'}`,
                    }}
                  >
                    {opt.badge}
                  </div>
                </button>
              )
            })}
          </div>
          {errors.remoteIdType && <FieldError message={errors.remoteIdType} />}
        </div>
      </div>
    </FormCard>
  )
}

function PilotStep({
  formData,
  set,
  errors,
}: {
  formData: FormData
  set: <K extends keyof FormData>(k: K, v: FormData[K]) => void
  errors: Record<string, string>
}) {
  const [walletConnecting, setWalletConnecting] = useState(false)

  async function connectWallet() {
    if (walletConnecting) return
    setWalletConnecting(true)
    await new Promise((r) => setTimeout(r, 900))
    set('walletAddress', generateWallet())
    setWalletConnecting(false)
    toast.success('Wallet connected')
  }

  return (
    <FormCard>
      <StepHeading
        emoji="✈️"
        title="Pilot information"
        subtitle="Your credentials as the operator."
      />
      <div className="mt-7 space-y-4">
        <Field label="Pilot Full Name" icon={<Plane className="w-4 h-4" />} error={errors.pilotName}>
          <input
            className="reg-input"
            placeholder="Enter your full name"
            value={formData.pilotName}
            onChange={(e) => set('pilotName', e.target.value)}
            autoComplete="name"
          />
        </Field>

        <Field
          label="Pilot License Number"
          icon={<Shield className="w-4 h-4" />}
          error={errors.licenseNumber}
          hint="Found on your DGCA certificate."
        >
          <input
            className="reg-input"
            placeholder="IND-DGCA-XXXX-XXXX"
            value={formData.licenseNumber}
            onChange={(e) => set('licenseNumber', e.target.value.toUpperCase())}
          />
        </Field>

        <div>
          <div className="mb-1.5 text-xs font-medium text-white/60 tracking-wide">
            Solana Wallet Address
          </div>
          <div className="grid gap-3 sm:grid-cols-[auto_1fr] items-stretch">
            <button
              type="button"
              onClick={connectWallet}
              disabled={walletConnecting}
              className="group inline-flex items-center justify-center gap-2 rounded-[12px] px-4 py-3 text-sm font-semibold text-white transition-[background,transform] duration-200 active:scale-[0.98] disabled:opacity-70"
              style={{
                background: '#3B82F6',
                boxShadow: '0 8px 22px -10px rgba(59,130,246,0.6)',
              }}
              onMouseEnter={(e) => { if (!walletConnecting) e.currentTarget.style.background = '#2563EB' }}
              onMouseLeave={(e) => { if (!walletConnecting) e.currentTarget.style.background = '#3B82F6' }}
            >
              {walletConnecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Connecting...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4" /> Connect Phantom Wallet
                </>
              )}
            </button>
            <Field label="" icon={<Wallet className="w-4 h-4" />} error={errors.walletAddress}>
              <input
                className="reg-input font-mono text-[13px]"
                placeholder="Or paste wallet address"
                value={formData.walletAddress}
                onChange={(e) => set('walletAddress', e.target.value)}
              />
            </Field>
          </div>
          {formData.walletAddress && !errors.walletAddress && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
              className="mt-2 flex items-center gap-1.5 text-xs text-success"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Wallet connected:{' '}
              <span className="font-mono text-white/85">
                {formData.walletAddress.length > 14
                  ? `${formData.walletAddress.slice(0, 6)}...${formData.walletAddress.slice(-4)}`
                  : formData.walletAddress}
              </span>
            </motion.div>
          )}
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-white/60 tracking-wide">
            FRIA Certified
            <span className="ml-2 text-[10px] uppercase tracking-wider text-white/35">
              FAA Recognized Identification Area
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[true, false].map((v) => {
              const label = v ? 'Yes' : 'No'
              const active = formData.friaCertified === v
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => set('friaCertified', v)}
                  className="py-2.5 rounded-[10px] text-sm font-medium transition-[border-color,background,color] duration-200"
                  style={{
                    background: active ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? '#3B82F6' : 'rgba(255,255,255,0.1)'}`,
                    color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        <div>
          <div className="mb-2 text-xs font-medium text-white/60 tracking-wide">
            Experience Level
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(['Beginner', 'Intermediate', 'Expert'] as const).map((lvl) => {
              const active = formData.experience === lvl
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => set('experience', lvl)}
                  className="py-2.5 rounded-[10px] text-sm font-medium transition-[border-color,background,color] duration-200"
                  style={{
                    background: active ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? '#3B82F6' : 'rgba(255,255,255,0.1)'}`,
                    color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {lvl}
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </FormCard>
  )
}

function DocsStep({
  formData,
  set,
  errors,
  uploadedCount,
  totalDocs,
}: {
  formData: FormData
  set: <K extends keyof FormData>(k: K, v: FormData[K]) => void
  errors: Record<string, string>
  uploadedCount: number
  totalDocs: number
}) {
  return (
    <FormCard>
      <StepHeading
        emoji="📄"
        title="Required documents"
        subtitle="All files are encrypted and stored on IPFS."
      />
      <div className="mt-3 flex items-center justify-center text-xs text-white/45 tabular-nums">
        {uploadedCount} of {totalDocs} uploaded
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {DOC_CONFIG.map((doc) => (
          <UploadBox
            key={doc.key}
            doc={doc}
            filename={formData[doc.key] as string | null}
            onUpload={(name) => set(doc.key, name as never)}
            onRemove={() => set(doc.key, null as never)}
          />
        ))}
      </div>
      {errors.docs && <FieldError message={errors.docs} className="mt-3 justify-center" />}

      <div
        className="mt-6 p-4 rounded-[12px] text-xs leading-relaxed flex items-start gap-2.5"
        style={{
          background: 'rgba(59,130,246,0.06)',
          border: '1px solid rgba(59,130,246,0.2)',
          color: 'rgba(255,255,255,0.7)',
        }}
      >
        <Lock className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
        <div>
          <div className="font-semibold text-white">Stored securely on IPFS</div>
          <div className="mt-0.5">
            Files are end-to-end encrypted and accessible only to you and authorised authorities.
          </div>
        </div>
      </div>
    </FormCard>
  )
}

function UploadBox({
  doc,
  filename,
  onUpload,
  onRemove,
}: {
  doc: { key: DocKey; emoji: string; title: string; body: string; required: boolean }
  filename: string | null
  onUpload: (name: string) => void
  onRemove: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const uploaded = !!filename

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        const f = e.dataTransfer.files?.[0]
        if (f) onUpload(f.name)
      }}
      onClick={() => !uploaded && inputRef.current?.click()}
      className="relative transition-[border-color,background] duration-200"
      style={{
        background: uploaded ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.02)',
        border: `2px dashed ${uploaded ? 'rgba(16,185,129,0.55)' : dragOver ? '#3B82F6' : 'rgba(255,255,255,0.15)'}`,
        borderRadius: 16,
        padding: 20,
        cursor: uploaded ? 'default' : 'pointer',
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onUpload(f.name)
        }}
      />
      <div className="flex items-start gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0"
          style={{
            background: uploaded ? 'rgba(16,185,129,0.12)' : 'rgba(59,130,246,0.1)',
            border: `1px solid ${uploaded ? 'rgba(16,185,129,0.3)' : 'rgba(59,130,246,0.25)'}`,
          }}
          aria-hidden
        >
          {doc.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-inter font-semibold text-white text-sm">{doc.title}</div>
            {doc.required && (
              <span className="text-[9px] uppercase tracking-wider text-warning/85 px-1.5 py-0.5 rounded border border-warning/30">
                Required
              </span>
            )}
          </div>
          <div className="mt-0.5 text-[11px] text-white/55 leading-relaxed">{doc.body}</div>

          {!uploaded ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                inputRef.current?.click()
              }}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline underline-offset-4"
            >
              <Upload className="w-3.5 h-3.5" />
              Choose File
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
              className="mt-3 flex items-center gap-2.5"
            >
              <div className="flex items-center gap-1.5 text-xs text-success min-w-0">
                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate text-white/85 font-medium">{filename}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
                className="inline-flex items-center gap-1 text-[11px] text-white/50 hover:text-danger transition-colors"
              >
                <X className="w-3 h-3" />
                Remove
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

function RemoteIdStep({
  formData,
  set,
}: {
  formData: FormData
  set: <K extends keyof FormData>(k: K, v: FormData[K]) => void
}) {
  const freq = parseInt(formData.broadcastFreq) || 1
  const [testing, setTesting] = useState<'idle' | 'running' | 'done'>('idle')

  async function runTest() {
    setTesting('running')
    await new Promise((r) => setTimeout(r, 1400))
    setTesting('done')
  }

  return (
    <FormCard>
      <StepHeading
        emoji="📡"
        title="Remote ID setup"
        subtitle="Configure your broadcast settings."
      />

      <div className="mt-7 space-y-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs font-medium text-white/60 tracking-wide">
              Broadcast Interval
            </div>
            <div className="text-xs text-white/55 tabular-nums">
              every <span className="text-white font-bold">{freq}</span> second{freq > 1 ? 's' : ''}
            </div>
          </div>
          <div
            className="rounded-[12px] p-4"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <input
              type="range"
              min={1}
              max={3}
              step={1}
              value={freq}
              onChange={(e) => set('broadcastFreq', e.target.value)}
              className="reg-slider"
              style={{
                ['--val' as string]: `${((freq - 1) / 2) * 100}%`,
              }}
            />
            <div className="mt-2 flex items-center justify-between text-[11px] text-white/45">
              <span>1s · most compliant</span>
              <span>2s</span>
              <span>3s · battery saving</span>
            </div>
          </div>
          <div className="mt-1.5 text-[11px] text-white/45">
            Recommended: 1 second to satisfy FAA + DGCA strict compliance.
          </div>
        </div>

        <ToggleRow
          label="Enable Network Reporting"
          description="Reports location to UTM network for enhanced air traffic management."
          checked={formData.networkReporting}
          onChange={(v) => set('networkReporting', v)}
          icon={<Wifi className="w-4 h-4" />}
        />

        <ToggleRow
          label="Emergency Auto-Broadcast"
          description="Automatically broadcasts an emergency signal if the connection is lost."
          checked={formData.emergencyBroadcast}
          onChange={(v) => set('emergencyBroadcast', v)}
          icon={<Radio className="w-4 h-4" />}
        />

        <div
          className="rounded-[14px] p-5"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(17,24,39,0.4) 100%)',
            border: '1px solid rgba(16,185,129,0.25)',
          }}
        >
          <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-success font-semibold">
            <Shield className="w-3.5 h-3.5" />
            Compliance preview
          </div>
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <ComplianceLine label="FAA Part 89" ok />
            <ComplianceLine label="DGCA 2021" ok />
            <ComplianceLine label="EASA U-space" ok={formData.networkReporting} />
          </ul>
          {!formData.networkReporting && (
            <div className="mt-3 text-[11px] text-warning">
              Enable Network Reporting for full EASA U-space compatibility.
            </div>
          )}
        </div>

        <div
          className="rounded-[14px] p-5"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="font-inter font-semibold text-white text-sm">
                Test Remote ID signal
              </div>
              <div className="text-[11px] text-white/50">
                Run a one-time broadcast test against simulated receivers.
              </div>
            </div>
            <button
              type="button"
              onClick={runTest}
              disabled={testing === 'running'}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white transition-colors disabled:opacity-70"
              style={{
                background: 'rgba(59,130,246,0.12)',
                color: '#3B82F6',
                border: '1px solid rgba(59,130,246,0.4)',
              }}
            >
              {testing === 'running' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Radio className="w-3.5 h-3.5" />
                  {testing === 'done' ? 'Re-test' : 'Test signal'}
                </>
              )}
            </button>
          </div>
          <AnimatePresence>
            {testing === 'done' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
                className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]"
              >
                <TestStat label="Signal" value="Excellent" tone="success" />
                <TestStat label="Range" value="1.2 km" />
                <TestStat label="Frequency" value={`${freq}s`} />
                <TestStat label="Status" value="✅ All good" tone="success" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </FormCard>
  )
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  icon,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (v: boolean) => void
  icon: React.ReactNode
}) {
  return (
    <div
      className="flex items-start gap-3 rounded-[12px] p-4"
      style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-primary"
        style={{
          background: 'rgba(59,130,246,0.1)',
          border: '1px solid rgba(59,130,246,0.25)',
        }}
        aria-hidden
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-inter font-semibold text-white text-sm">{label}</div>
        <div className="mt-0.5 text-[11px] text-white/50 leading-relaxed">{description}</div>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  )
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative shrink-0"
      style={{
        width: 44,
        height: 24,
        borderRadius: 999,
        background: checked ? '#3B82F6' : 'rgba(255,255,255,0.1)',
        border: `1px solid ${checked ? '#3B82F6' : 'rgba(255,255,255,0.15)'}`,
        transition: 'background 220ms, border-color 220ms',
      }}
    >
      <motion.span
        className="absolute top-1/2 -translate-y-1/2 rounded-full bg-white shadow"
        style={{ width: 18, height: 18 }}
        animate={{ left: checked ? 22 : 2 }}
        transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
      />
    </button>
  )
}

function ComplianceLine({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center gap-2 text-sm">
      <CheckCircle
        className="w-4 h-4"
        style={{ color: ok ? '#10B981' : 'rgba(255,255,255,0.3)' }}
      />
      <span style={{ color: ok ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.45)' }}>
        {label}
      </span>
    </li>
  )
}

function TestStat({
  label,
  value,
  tone = 'default',
}: {
  label: string
  value: string
  tone?: 'default' | 'success'
}) {
  return (
    <div
      className="rounded-[10px] px-3 py-2"
      style={{
        background: tone === 'success' ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${tone === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`,
      }}
    >
      <div className="text-[9px] uppercase tracking-wider text-white/45">{label}</div>
      <div
        className="mt-0.5 text-xs font-mono"
        style={{ color: tone === 'success' ? '#10B981' : 'rgba(255,255,255,0.9)' }}
      >
        {value}
      </div>
    </div>
  )
}

function ReviewStep({
  formData,
  droneId,
  loading: _loading,
}: {
  formData: FormData
  droneId: string
  loading: boolean
}) {
  return (
    <FormCard>
      <StepHeading
        emoji="🎨"
        title="Mint your drone NFT"
        subtitle="Review the details and mint on Solana."
      />

      <NftPreview formData={formData} droneId={droneId} />

      <div className="mt-7">
        <div className="text-xs uppercase tracking-[0.18em] text-white/45 font-semibold">
          Details summary
        </div>
        <dl className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <ReviewRow label="Model" value={formData.model || '—'} />
          <ReviewRow label="Serial" value={formData.serial || '—'} mono />
          <ReviewRow label="Weight" value={formData.weightClass || '—'} />
          <ReviewRow label="Purpose" value={formData.purpose || '—'} />
          <ReviewRow label="Pilot" value={formData.pilotName || '—'} />
          <ReviewRow label="License" value={formData.licenseNumber || '—'} mono />
          <ReviewRow
            label="Wallet"
            value={
              formData.walletAddress.length > 14
                ? `${formData.walletAddress.slice(0, 6)}...${formData.walletAddress.slice(-4)}`
                : formData.walletAddress || '—'
            }
            mono
          />
          <ReviewRow
            label="Remote ID"
            value={
              REMOTE_ID_OPTIONS.find((o) => o.key === formData.remoteIdType)?.title ?? '—'
            }
          />
        </dl>
      </div>

      <div className="mt-7 pt-6 border-t border-white/[0.06]">
        <div className="text-xs uppercase tracking-[0.18em] text-white/45 font-semibold">
          Cost breakdown
        </div>
        <dl className="mt-3 space-y-1.5 text-sm">
          <CostRow label="Registration Fee" value="0.01 SOL" />
          <CostRow label="Network Fee" value="0.000005 SOL" />
          <div className="pt-2 mt-2 border-t border-white/[0.06]">
            <CostRow label="Total" value="≈ 0.010005 SOL" emphasis />
          </div>
        </dl>
      </div>
    </FormCard>
  )
}

function NftPreview({
  formData,
  droneId,
}: {
  formData: FormData
  droneId: string
}) {
  const prefersReducedMotion = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })

  function handleMove(e: React.MouseEvent<HTMLDivElement>) {
    if (prefersReducedMotion) return
    const r = ref.current?.getBoundingClientRect()
    if (!r) return
    const x = (e.clientX - r.left) / r.width
    const y = (e.clientY - r.top) / r.height
    setTilt({ rx: -(y - 0.5) * 6, ry: (x - 0.5) * 8 })
  }
  function handleLeave() {
    setTilt({ rx: 0, ry: 0 })
  }

  return (
    <div className="mt-6 perspective-[1200px] flex justify-center">
      <motion.div
        ref={ref}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        animate={{ rotateX: tilt.rx, rotateY: tilt.ry }}
        transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
        style={{
          background:
            'linear-gradient(135deg, #1d3a8a 0%, #3B82F6 35%, #6d28d9 100%)',
          borderRadius: 22,
          padding: 22,
          width: '100%',
          maxWidth: 460,
          boxShadow: '0 30px 80px -30px rgba(59,130,246,0.55), 0 0 0 1px rgba(255,255,255,0.08) inset',
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          className="absolute inset-0 pointer-events-none rounded-[22px]"
          style={{
            background:
              'radial-gradient(600px circle at 30% 0%, rgba(255,255,255,0.18), transparent 50%)',
            mixBlendMode: 'overlay',
          }}
        />
        <div className="relative">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.2em] text-white/85 font-semibold">
              <Sparkles className="w-3 h-3" />
              DroneChain NFT
            </span>
            <span
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider"
              style={{ background: 'rgba(255,255,255,0.18)', color: '#fff' }}
            >
              <Shield className="w-3 h-3" />
              Verified
            </span>
          </div>

          <div className="mt-5 flex flex-col items-center text-center">
            <div className="text-6xl drone-glow" aria-hidden>🚁</div>
            <div className="mt-3 font-inter font-black text-white text-xl tracking-tight">
              {formData.model || 'Unnamed drone'}
            </div>
            <div className="text-xs font-mono text-white/70 mt-0.5">
              {formData.serial || '—'}
            </div>
          </div>

          <div
            className="mt-5 flex items-center gap-3 px-3 py-2 rounded-xl"
            style={{ background: 'rgba(0,0,0,0.18)', border: '1px solid rgba(255,255,255,0.16)' }}
          >
            <div className="flex-1 min-w-0">
              <div className="text-[9px] uppercase tracking-wider text-white/60">
                Drone ID
              </div>
              <div className="mt-0.5 font-mono text-[13px] text-white truncate">{droneId}</div>
              <div className="mt-1.5 text-[10px] text-white/65 truncate">
                Owner · {formData.pilotName || '—'}
              </div>
            </div>
            <div className="rounded-md p-1.5" style={{ background: '#fff' }}>
              <QRCodeSVG
                value={`https://dronechain.io/drone/${droneId}`}
                size={64}
                fgColor="#0a0f1a"
                bgColor="#ffffff"
                level="M"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between text-[10px] text-white/65 uppercase tracking-wider">
            <span>Solana Devnet</span>
            <span>DGCA 2021 + FAA Part 89</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function ReviewRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-baseline gap-2">
      <dt className="text-[11px] uppercase tracking-wider text-white/45">{label}</dt>
      <dd
        className={`text-white/90 font-medium truncate ${mono ? 'font-mono text-[13px] tracking-tight' : ''}`}
      >
        {value}
      </dd>
    </div>
  )
}

function CostRow({
  label,
  value,
  emphasis,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className={emphasis ? 'text-white font-semibold' : 'text-white/55'}>
        {label}
      </span>
      <span
        className={`font-mono tabular-nums ${emphasis ? 'text-primary text-base font-bold' : 'text-white/85'}`}
      >
        {value}
      </span>
    </div>
  )
}

function StepFooter({
  step,
  loading,
  onBack,
  onNext,
}: {
  step: number
  loading: boolean
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div className="mt-8 flex items-center justify-between gap-3 max-w-3xl mx-auto">
      {step > 1 ? (
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="group inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-white/80 hover:text-white border border-white/10 hover:border-white/25 hover:bg-white/[0.05] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
          Back
        </button>
      ) : (
        <span />
      )}
      <button
        type="button"
        onClick={onNext}
        disabled={loading}
        className="group ml-auto inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white transition-[background,transform,box-shadow] duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
        style={{
          background: '#3B82F6',
          boxShadow: '0 10px 30px -12px rgba(59,130,246,0.6)',
        }}
        onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#2563EB' }}
        onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#3B82F6' }}
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Minting...
          </>
        ) : step === 5 ? (
          <>
            🚀 Mint Drone NFT
          </>
        ) : (
          <>
            Continue
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </>
        )}
      </button>
    </div>
  )
}

const MINT_STEPS = [
  { icon: '⏳', body: 'Preparing transaction...', delay: 0 },
  { icon: '⏳', body: 'Connecting to Solana...', delay: 700 },
  { icon: '⏳', body: 'Minting NFT...', delay: 1400 },
  { icon: '⏳', body: 'Storing on IPFS...', delay: 2400 },
  { icon: '✅', body: 'Registration complete!', delay: 3100 },
]

function MintingOverlay() {
  const [shown, setShown] = useState<number>(0)

  useEffect(() => {
    const timers = MINT_STEPS.map((s, i) =>
      setTimeout(() => setShown(i + 1), s.delay),
    )
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center px-5"
      style={{ background: 'rgba(10,15,26,0.85)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="relative w-full max-w-md p-8"
        style={{
          background: 'rgba(17,24,39,0.95)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 20,
        }}
      >
        <div className="flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'linear' }}
            className="relative w-20 h-20 rounded-2xl flex items-center justify-center"
            style={{
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.3)',
              boxShadow: '0 0 40px -10px rgba(59,130,246,0.5)',
            }}
          >
            <Shield className="w-10 h-10 text-primary" />
          </motion.div>
        </div>
        <div className="mt-5 text-center">
          <div className="font-inter font-bold text-white text-lg">
            Minting your drone NFT
          </div>
          <div className="mt-1 text-sm text-white/55">
            This usually takes a few seconds.
          </div>
        </div>
        <ul className="mt-6 space-y-2.5">
          {MINT_STEPS.map((s, i) => {
            const visible = shown > i
            const done = i < MINT_STEPS.length - 1 && shown > i + 1
            const isCurrent = visible && !done && i === shown - 1
            return (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: visible ? 1 : 0.25, x: visible ? 0 : -4 }}
                transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
                className="flex items-center gap-2.5 text-sm"
                style={{
                  color: done
                    ? 'rgba(16,185,129,0.95)'
                    : isCurrent
                      ? '#fff'
                      : 'rgba(255,255,255,0.55)',
                }}
              >
                {done ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : isCurrent ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                ) : (
                  <span className="text-base leading-none">{s.icon}</span>
                )}
                <span>{s.body}</span>
              </motion.li>
            )
          })}
        </ul>
      </div>
    </motion.div>
  )
}

function Confetti({ count = 70 }: { count?: number }) {
  const pieces = useMemo(() => {
    const palette = ['#3B82F6', '#10B981', '#F59E0B', '#A855F7', '#ffffff']
    return Array.from({ length: count }).map((_, i) => ({
      left: Math.random() * 100,
      dx: (Math.random() - 0.5) * 240,
      delay: Math.random() * 0.8,
      duration: 2.6 + Math.random() * 2.4,
      color: palette[i % palette.length],
      rotate: Math.random() * 360,
    }))
  }, [count])
  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-[1]" aria-hidden>
      <style>{`
        @keyframes drone-confetti {
          0% { transform: translate3d(0, -20vh, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate3d(var(--dx), 120vh, 0) rotate(720deg); opacity: 0.9; }
        }
      `}</style>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            top: '-10px',
            left: `${p.left}%`,
            width: 8,
            height: 14,
            borderRadius: 2,
            background: p.color,
            ['--dx' as string]: `${p.dx}px`,
            animation: `drone-confetti ${p.duration}s linear forwards`,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  )
}

function SuccessScreen({
  droneId,
  txHash,
  blockNumber,
  formData,
  prefersReducedMotion,
  onDashboard,
  onAnother,
}: {
  droneId: string
  txHash: string
  blockNumber: number
  formData: FormData
  prefersReducedMotion: boolean
  onDashboard: () => void
  onAnother: () => void
}) {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-bg text-white flex items-center justify-center px-5 py-16">
      <div className="pointer-events-none absolute inset-0 grid-bg radial-fade opacity-30" />
      {!prefersReducedMotion && <Confetti />}

      <div className="relative w-full max-w-xl text-center">
        <motion.div
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
          className="mx-auto w-24 h-24 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(16,185,129,0.12)',
            border: '2px solid rgba(16,185,129,0.5)',
            boxShadow: '0 0 0 10px rgba(16,185,129,0.06), 0 30px 60px -20px rgba(16,185,129,0.6)',
          }}
        >
          <span className="absolute -inset-2 rounded-full pulse-ring" style={{ background: 'rgba(16,185,129,0.4)' }} />
          <svg viewBox="0 0 64 64" className="w-12 h-12 relative" fill="none">
            <motion.path
              d="M14 32 L28 46 L52 22"
              stroke="#10B981"
              strokeWidth="5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.7, delay: 0.35, ease: EASE_OUT_EXPO }}
            />
          </svg>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.5, ease: EASE_OUT_EXPO }}
          className="mt-8 font-inter font-black text-white tracking-tight"
          style={{ fontSize: 'clamp(1.875rem, 4vw, 2.625rem)', lineHeight: 1.05 }}
        >
          Drone Registered Successfully 🎉
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.58, ease: EASE_OUT_EXPO }}
          className="mt-3 text-white/60"
        >
          Minted on Solana and stored on IPFS.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.7, ease: EASE_OUT_EXPO }}
          className="mt-8 text-left relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(17,24,39,0.95) 55%, rgba(59,130,246,0.08) 100%)',
            border: '1px solid rgba(16,185,129,0.35)',
            borderRadius: 18,
            padding: 24,
            boxShadow: '0 30px 60px -30px rgba(16,185,129,0.4)',
          }}
        >
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px"
            style={{ background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.7), transparent)' }}
          />
          <div className="text-xs uppercase tracking-[0.25em] text-success font-semibold inline-flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" />
            On-chain registration
          </div>
          <dl className="mt-5 grid gap-3 text-sm">
            <SuccessRow label="Drone ID" value={droneId} mono />
            <SuccessRow label="Transaction" value={txHash} mono />
            <SuccessRow label="Network" value="Solana Devnet" />
            <SuccessRow
              label="Status"
              value={
                <span className="inline-flex items-center gap-1.5 text-success">
                  <CheckCircle className="w-3.5 h-3.5" /> Confirmed
                </span>
              }
            />
            <SuccessRow label="Block" value={`#${blockNumber.toLocaleString()}`} mono />
          </dl>
          <button
            type="button"
            onClick={() => toast('Explorer link coming soon', { icon: '🔗' })}
            className="mt-5 inline-flex items-center gap-1.5 text-xs text-primary hover:underline underline-offset-4"
          >
            View on Solana Explorer
            <ExternalLink className="w-3 h-3" />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.85, ease: EASE_OUT_EXPO }}
          className="mt-8 grid gap-3 grid-cols-1 sm:grid-cols-3"
        >
          <button
            type="button"
            onClick={() => toast.success('Certificate downloaded')}
            className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white/85 hover:text-white border border-white/15 hover:border-white/30 hover:bg-white/[0.06] transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Certificate
          </button>
          <button
            type="button"
            onClick={onDashboard}
            className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white bg-primary hover:bg-[#2563EB] transition-colors"
            style={{ boxShadow: '0 12px 30px -12px rgba(59,130,246,0.6)' }}
          >
            View My Drones
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onAnother}
            className="inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold text-white/85 hover:text-white border border-white/15 hover:border-white/30 hover:bg-white/[0.06] transition-colors"
          >
            <Repeat className="w-4 h-4" />
            Register Another
          </button>
        </motion.div>

        <div className="mt-6 inline-flex items-center gap-1.5 text-[11px] text-white/40">
          <Receipt className="w-3 h-3" />
          {formData.pilotName ? `Owner · ${formData.pilotName}` : ''}
          {formData.pilotName && ' · '}
          {formData.model || 'Unnamed drone'}
        </div>
      </div>
    </div>
  )
}

function SuccessRow({
  label,
  value,
  mono,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-4 text-sm items-center">
      <dt className="text-white/45 text-xs uppercase tracking-wider">{label}</dt>
      <dd
        className={`text-white/95 font-medium truncate ${mono ? 'font-mono text-[13px] tracking-tight' : ''}`}
      >
        {value}
      </dd>
    </div>
  )
}

function RegistrationStyles() {
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
        font-size: 14.5px;
        line-height: 1.5;
      }
      .reg-input::placeholder { color: rgba(255,255,255,0.35); }
      select.reg-input { appearance: none; cursor: pointer; padding-right: 1.5rem; }
      select.reg-input option { background: #0a0f1a; color: #F9FAFB; }
      .reg-input:-webkit-autofill,
      .reg-input:-webkit-autofill:hover,
      .reg-input:-webkit-autofill:focus {
        -webkit-box-shadow: 0 0 0 30px #1a2235 inset !important;
        -webkit-text-fill-color: #F9FAFB !important;
        caret-color: #F9FAFB !important;
        transition: background-color 5000s ease-in-out 0s !important;
      }

      .reg-slider {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 6px;
        border-radius: 999px;
        background: linear-gradient(to right, #3B82F6 0%, #3B82F6 var(--val, 0%), rgba(255,255,255,0.1) var(--val, 0%), rgba(255,255,255,0.1) 100%);
        outline: none;
        cursor: pointer;
      }
      .reg-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #fff;
        border: 3px solid #3B82F6;
        box-shadow: 0 6px 18px -4px rgba(59,130,246,0.6);
        cursor: grab;
        transition: transform 200ms cubic-bezier(0.16,1,0.3,1);
      }
      .reg-slider::-webkit-slider-thumb:active { transform: scale(1.1); cursor: grabbing; }
      .reg-slider::-moz-range-thumb {
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #fff;
        border: 3px solid #3B82F6;
        box-shadow: 0 6px 18px -4px rgba(59,130,246,0.6);
        cursor: grab;
      }
    `}</style>
  )
}
