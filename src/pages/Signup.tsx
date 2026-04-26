import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  FileText,
  Building,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  MapPin,
  Briefcase,
  BadgeCheck,
  Clock,
  AlertTriangle,
  Plane,
  Landmark,
  Rocket,
} from 'lucide-react'

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const

type Role = 'owner' | 'pilot' | 'authority'

type FormData = {
  name: string
  email: string
  password: string
  confirmPassword: string
  phone: string
  licenseNumber: string
  organization: string
  badgeId: string
  state: string
  city: string
  experience: string
  droneModel: string
  purpose: string
  orgType: string
  jurisdiction: string
  licenseExpiry: string
  friaCertified: string
  yearsExperience: string
  flightHours: string
}

const EMPTY_FORM: FormData = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  licenseNumber: '',
  organization: '',
  badgeId: '',
  state: '',
  city: '',
  experience: '',
  droneModel: '',
  purpose: '',
  orgType: '',
  jurisdiction: '',
  licenseExpiry: '',
  friaCertified: '',
  yearsExperience: '',
  flightHours: '',
}

const STEP_LABELS = ['Role', 'Details', 'Info', 'Review'] as const

const ROLES: {
  id: Role
  emoji: string
  icon: typeof Plane
  title: string
  description: string
  color: string
  features: string[]
}[] = [
  {
    id: 'owner',
    emoji: '🚁',
    icon: Rocket,
    title: 'Drone Owner',
    description:
      'Register and manage your drones. Log flights and track compliance. Transfer ownership securely.',
    color: '#3B82F6',
    features: [
      'Register unlimited drones',
      'Flight logging',
      'NFT ownership proof',
      'Compliance tracking',
    ],
  },
  {
    id: 'pilot',
    emoji: '✈️',
    icon: Plane,
    title: 'Certified Pilot',
    description:
      'Manage your pilot license. Log flight hours and routes. Maintain compliance records.',
    color: '#F59E0B',
    features: [
      'License management',
      'Flight hour tracking',
      'Route planning',
      'Compliance reports',
    ],
  },
  {
    id: 'authority',
    emoji: '🏛️',
    icon: Landmark,
    title: 'Authority Official',
    description:
      'For DGCA, Police, Airport and aviation authority personnel. Monitor and enforce regulations.',
    color: '#10B981',
    features: [
      'Real-time monitoring',
      'Violation enforcement',
      'No-fly zone management',
      'Compliance reports',
    ],
  },
]

const DRONE_MODELS = [
  'DJI Mavic 3 Pro',
  'DJI Phantom 4',
  'DJI Mini 3',
  'Parrot Anafi',
  'Autel EVO II',
  'Other',
]

const PURPOSES = [
  'Commercial Photography',
  'Survey and Mapping',
  'Delivery',
  'Hobby',
  'Agriculture',
  'Other',
]

const ORG_TYPES = [
  'DGCA India',
  'Airport Authority of India',
  'State Police',
  'Central Police',
  'Military',
  'Other',
]

const EXPERIENCE_LEVELS = ['Beginner', 'Intermediate', 'Expert'] as const

function passwordStrength(p: string) {
  if (!p) return { score: 0, label: '', color: '#4B5563' }
  let score = 0
  if (p.length >= 8) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p) && p.length >= 10) score++
  if (p.length >= 14) score++
  const tiers = [
    { label: 'Weak', color: '#EF4444' },
    { label: 'Weak', color: '#EF4444' },
    { label: 'Fair', color: '#F59E0B' },
    { label: 'Strong', color: '#3B82F6' },
    { label: 'Very Strong', color: '#10B981' },
    { label: 'Very Strong', color: '#10B981' },
  ]
  const t = tiers[Math.min(score, tiers.length - 1)]
  return { score: Math.min(score, 4), label: t.label, color: t.color }
}

function randomAccountId() {
  return `DRC-${Math.floor(100000 + Math.random() * 900000)}`
}

export default function Signup() {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()

  const [step, setStep] = useState(1)
  const [selectedRole, setSelectedRole] = useState<Role | ''>('')
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [agreed, setAgreed] = useState({ terms: false, privacy: false, accurate: false })
  const [accountId] = useState(randomAccountId)

  const set = (k: keyof FormData, v: string) => {
    setFormData((f) => ({ ...f, [k]: v }))
    if (errors[k]) setErrors((e) => ({ ...e, [k]: '' }))
  }

  const progress = step >= 5 ? 100 : (step / 4) * 100

  function validateStep(n: number): boolean {
    const e: Record<string, string> = {}
    if (n === 1 && !selectedRole) e.role = 'Please select a role to continue'
    if (n === 2) {
      if (!formData.name.trim()) e.name = 'Full name is required'
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(formData.email))
        e.email = 'Enter a valid email address'
      if (formData.password.length < 8)
        e.password = 'Password must be at least 8 characters'
      else if (!/[A-Z]/.test(formData.password))
        e.password = 'Password needs at least one uppercase letter'
      else if (!/[0-9]/.test(formData.password))
        e.password = 'Password needs at least one number'
      if (formData.password !== formData.confirmPassword)
        e.confirmPassword = 'Passwords do not match'
    }
    if (n === 3) {
      if (selectedRole === 'pilot' && !formData.licenseNumber.trim())
        e.licenseNumber = 'License number is required'
      if (selectedRole === 'authority') {
        if (!formData.organization.trim()) e.organization = 'Organization is required'
        if (!formData.badgeId.trim()) e.badgeId = 'Badge or employee ID is required'
      }
    }
    if (n === 4) {
      if (!agreed.terms || !agreed.privacy || !agreed.accurate)
        e.terms = 'Please accept all to continue'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function goNext() {
    if (!validateStep(step)) return
    if (step === 4) {
      handleSignup()
      return
    }
    setStep((s) => Math.min(4, s + 1))
  }

  function goBack() {
    setStep((s) => Math.max(1, s - 1))
  }

  async function handleSignup() {
    setLoading(true)
    await new Promise((r) => setTimeout(r, 2000))
    localStorage.setItem(
      'dronechain_user',
      JSON.stringify({
        name: formData.name,
        email: formData.email,
        role: selectedRole,
        verified: false,
        createdAt: new Date().toISOString(),
        avatar: formData.name.slice(0, 2).toUpperCase(),
      }),
    )
    setLoading(false)
    setStep(5)
  }

  const roleColor = useMemo(
    () => ROLES.find((r) => r.id === selectedRole)?.color ?? '#3B82F6',
    [selectedRole],
  )

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-bg text-white">
      <div className="pointer-events-none absolute inset-0 grid-bg radial-fade opacity-40" />
      <div
        className="pointer-events-none absolute top-[-20%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full blur-3xl opacity-30"
        style={{ background: `radial-gradient(closest-side, ${roleColor}4a, transparent 70%)` }}
      />

      <TopBar step={step} onBack={() => navigate('/')} />

      <ProgressBar progress={progress} color={roleColor} />

      {step <= 4 && <StepDots step={step} roleColor={roleColor} />}

      <main className="relative max-w-5xl mx-auto px-5 sm:px-8 pb-24">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <StepPanel key="s1">
              <StepHeading
                title="What best describes you?"
                subtitle="Choose your role to get started."
              />
              <RoleGrid
                selected={selectedRole}
                onSelect={(r) => {
                  setSelectedRole(r)
                  if (errors.role) setErrors((e) => ({ ...e, role: '' }))
                }}
              />
              {errors.role && <FieldError message={errors.role} className="mt-4 text-center" />}
              <StepFooter
                onNext={goNext}
                nextDisabled={!selectedRole}
                nextColor={roleColor}
              />
            </StepPanel>
          )}

          {step === 2 && (
            <StepPanel key="s2">
              <StepHeading
                title="Personal information"
                subtitle="Tell us about yourself."
              />
              <FormCard>
                <Field
                  label="Full Name"
                  icon={<User className="w-4 h-4" />}
                  error={errors.name}
                >
                  <input
                    className="field-input"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={(e) => set('name', e.target.value)}
                    autoComplete="name"
                  />
                </Field>

                <Field
                  label="Email Address"
                  icon={<Mail className="w-4 h-4" />}
                  error={errors.email}
                >
                  <input
                    className="field-input"
                    placeholder="Enter your email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => set('email', e.target.value)}
                    autoComplete="email"
                  />
                </Field>

                <Field
                  label="Phone Number"
                  icon={<Phone className="w-4 h-4" />}
                >
                  <input
                    className="field-input"
                    placeholder="+91 XXXXX XXXXX"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => set('phone', e.target.value)}
                    autoComplete="tel"
                  />
                </Field>

                <div>
                  <Field
                    label="Password"
                    icon={<Lock className="w-4 h-4" />}
                    error={errors.password}
                    trailing={
                      <button
                        type="button"
                        onClick={() => setShowPassword((s) => !s)}
                        className="p-1 text-white/50 hover:text-white/90 transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    }
                  >
                    <input
                      className="field-input"
                      placeholder="Create a password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => set('password', e.target.value)}
                      autoComplete="new-password"
                    />
                  </Field>
                  <PasswordStrength value={formData.password} />
                  <PasswordRules value={formData.password} />
                </div>

                <Field
                  label="Confirm Password"
                  icon={<Lock className="w-4 h-4" />}
                  error={errors.confirmPassword}
                  trailing={
                    formData.confirmPassword &&
                    formData.password === formData.confirmPassword ? (
                      <CheckCircle className="w-4 h-4 text-success" />
                    ) : null
                  }
                >
                  <input
                    className="field-input"
                    placeholder="Confirm your password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => set('confirmPassword', e.target.value)}
                    autoComplete="new-password"
                  />
                </Field>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="State" icon={<MapPin className="w-4 h-4" />}>
                    <input
                      className="field-input"
                      placeholder="e.g. Punjab"
                      value={formData.state}
                      onChange={(e) => set('state', e.target.value)}
                    />
                  </Field>
                  <Field label="City" icon={<MapPin className="w-4 h-4" />}>
                    <input
                      className="field-input"
                      placeholder="e.g. Chandigarh"
                      value={formData.city}
                      onChange={(e) => set('city', e.target.value)}
                    />
                  </Field>
                </div>
              </FormCard>
              <StepFooter onBack={goBack} onNext={goNext} nextColor={roleColor} />
            </StepPanel>
          )}

          {step === 3 && (
            <StepPanel key="s3">
              {selectedRole === 'owner' && (
                <OwnerStep form={formData} set={set} roleColor={roleColor} />
              )}
              {selectedRole === 'pilot' && (
                <PilotStep form={formData} set={set} errors={errors} roleColor={roleColor} />
              )}
              {selectedRole === 'authority' && (
                <AuthorityStep form={formData} set={set} errors={errors} roleColor={roleColor} />
              )}
              <StepFooter onBack={goBack} onNext={goNext} nextColor={roleColor} />
            </StepPanel>
          )}

          {step === 4 && (
            <StepPanel key="s4">
              <StepHeading
                title="Review your details"
                subtitle="Make sure everything is correct before we create your account."
              />
              <ReviewCard
                role={selectedRole as Role}
                form={formData}
                agreed={agreed}
                setAgreed={setAgreed}
                error={errors.terms}
              />
              <StepFooter
                onBack={goBack}
                onNext={goNext}
                loading={loading}
                nextColor={roleColor}
                nextLabel={loading ? 'Creating Account...' : 'Create Account'}
              />
            </StepPanel>
          )}

          {step === 5 && (
            <Success
              key="s5"
              role={selectedRole as Role}
              form={formData}
              accountId={accountId}
              roleColor={roleColor}
              prefersReducedMotion={!!prefersReducedMotion}
              onGoDashboard={() => navigate('/dashboard')}
              onExplore={() => navigate('/')}
            />
          )}
        </AnimatePresence>
      </main>

      <style>{`
        .field-input {
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
        .field-input::placeholder { color: rgba(255,255,255,0.35); }
        select.field-input { cursor: pointer; appearance: none; padding-right: 1.75rem; }
        select.field-input option { background: #0a0f1a; color: #F9FAFB; }
        .field-input:-webkit-autofill,
        .field-input:-webkit-autofill:hover,
        .field-input:-webkit-autofill:focus,
        .field-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #1a2235 inset !important;
          -webkit-text-fill-color: #F9FAFB !important;
          caret-color: #F9FAFB !important;
          transition: background-color 5000s ease-in-out 0s !important;
        }

        @keyframes confetti-fall {
          0% { transform: translate3d(0, -20vh, 0) rotate(0deg); opacity: 1; }
          100% { transform: translate3d(var(--dx), 120vh, 0) rotate(720deg); opacity: 0.9; }
        }
        .confetti-piece {
          position: absolute;
          top: -10px;
          width: 8px;
          height: 14px;
          border-radius: 2px;
          animation: confetti-fall linear forwards;
        }

        @keyframes draw-check {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  )
}

function TopBar({ step, onBack }: { step: number; onBack: () => void }) {
  return (
    <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 pt-6">
      <button
        type="button"
        onClick={onBack}
        className="group inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
        Home
      </button>
      <div className="flex items-center gap-2">
        <span className="text-xl" aria-hidden>🚁</span>
        <span className="font-inter font-extrabold tracking-tight text-primary text-[15px]">
          DroneChain
        </span>
      </div>
      <div className="text-xs text-white/50 tabular-nums min-w-[70px] text-right">
        {step <= 4 ? `Step ${step} of 4` : 'Complete'}
      </div>
    </div>
  )
}

function ProgressBar({ progress, color }: { progress: number; color: string }) {
  return (
    <div className="relative z-10 mt-5 h-[3px] bg-white/[0.06] overflow-hidden">
      <motion.div
        className="h-full origin-left"
        style={{
          background: `linear-gradient(90deg, ${color}, ${color}dd)`,
          boxShadow: `0 0 18px ${color}99`,
        }}
        initial={false}
        animate={{ width: `${progress}%` }}
        transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
      />
    </div>
  )
}

function StepDots({ step, roleColor }: { step: number; roleColor: string }) {
  return (
    <div className="relative z-10 mt-8 max-w-2xl mx-auto px-5">
      <ol className="grid grid-cols-4 gap-3 sm:gap-6">
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
                    ? roleColor
                    : isDone
                      ? 'rgba(16,185,129,0.15)'
                      : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isActive ? roleColor : isDone ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.12)'}`,
                  color: isActive ? '#fff' : isDone ? '#10B981' : 'rgba(255,255,255,0.5)',
                  transform: isActive ? 'scale(1.08)' : 'scale(1)',
                  boxShadow: isActive ? `0 0 0 4px ${roleColor}26` : 'none',
                }}
              >
                {isDone ? <CheckCircle className="w-4 h-4" /> : n}
              </div>
              <div
                className="mt-2 text-[11px] sm:text-xs tracking-wide transition-colors duration-200"
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

function StepPanel({ children }: { children: React.ReactNode }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
      className="mt-10"
    >
      {children}
    </motion.section>
  )
}

function StepHeading({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="text-center max-w-xl mx-auto">
      <h1
        className="font-inter font-black text-white tracking-tight text-balance"
        style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.375rem)', lineHeight: 1.05 }}
      >
        {title}
      </h1>
      {subtitle && <p className="mt-3 text-white/55">{subtitle}</p>}
    </div>
  )
}

function StepFooter({
  onBack,
  onNext,
  nextDisabled,
  nextLabel = 'Continue',
  nextColor = '#3B82F6',
  loading,
}: {
  onBack?: () => void
  onNext: () => void
  nextDisabled?: boolean
  nextLabel?: string
  nextColor?: string
  loading?: boolean
}) {
  return (
    <div className="mt-10 flex items-center justify-between gap-3 max-w-xl mx-auto">
      {onBack ? (
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
        disabled={nextDisabled || loading}
        className="group ml-auto inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white transition-[background,transform,box-shadow] duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: nextColor,
          boxShadow: `0 10px 30px -12px ${nextColor}99`,
        }}
      >
        {loading && <Spinner />}
        {nextLabel}
        {!loading && (
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        )}
      </button>
    </div>
  )
}

function RoleGrid({
  selected,
  onSelect,
}: {
  selected: Role | ''
  onSelect: (r: Role) => void
}) {
  return (
    <div className="mt-10 grid gap-5 md:grid-cols-3">
      {ROLES.map((r, i) => {
        const Icon = r.icon
        const active = selected === r.id
        return (
          <motion.button
            type="button"
            key={r.id}
            onClick={() => onSelect(r.id)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: i * 0.08, ease: EASE_OUT_EXPO }}
            whileHover={{ y: -4 }}
            className="relative text-left"
            style={{
              background: active ? `${r.color}0F` : 'rgba(17,24,39,0.75)',
              border: `1px solid ${active ? r.color : 'rgba(255,255,255,0.08)'}`,
              borderRadius: '20px',
              padding: '26px',
              transform: active ? 'scale(1.015)' : 'scale(1)',
              transition: 'border-color 220ms var(--ease-out-expo), background 220ms, transform 220ms var(--ease-out-expo), box-shadow 220ms',
              boxShadow: active
                ? `0 0 0 4px ${r.color}1f, 0 20px 60px -20px ${r.color}66`
                : '0 0 0 0 transparent',
              cursor: 'pointer',
              backdropFilter: 'blur(20px)',
            }}
          >
            {active && (
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
                className="absolute top-4 right-4 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: r.color }}
              >
                <CheckCircle className="w-4 h-4 text-white" />
              </motion.div>
            )}

            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{
                  background: `${r.color}14`,
                  border: `1px solid ${r.color}33`,
                }}
                aria-hidden
              >
                {r.emoji}
              </div>
              <Icon className="w-5 h-5" style={{ color: r.color }} aria-hidden />
            </div>

            <h3 className="mt-5 font-inter font-bold text-white text-xl tracking-tight">
              {r.title}
            </h3>
            <p className="mt-2 text-sm text-white/55 leading-relaxed">{r.description}</p>

            <ul className="mt-5 space-y-2">
              {r.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-white/70">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: r.color }} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium transition-colors"
              style={{ color: active ? r.color : 'rgba(255,255,255,0.75)' }}
            >
              {active ? 'Selected' : 'Select This Role'}
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}

function FormCard({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: EASE_OUT_EXPO }}
      className="mt-10 mx-auto glass-strong p-7 sm:p-8 space-y-4"
      style={{ maxWidth: 480 }}
    >
      {children}
    </motion.div>
  )
}

function Field({
  label,
  icon,
  children,
  error,
  trailing,
}: {
  label: string
  icon?: React.ReactNode
  children: React.ReactNode
  error?: string
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
          borderRadius: '12px',
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

function PasswordStrength({ value }: { value: string }) {
  const { score, label, color } = passwordStrength(value)
  if (!value) return null
  return (
    <div className="mt-2">
      <div className="flex gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{
              backgroundColor: i < score ? color : 'rgba(255,255,255,0.08)',
              scaleX: i < score ? 1 : 0.96,
            }}
            transition={{ duration: 0.3, ease: EASE_OUT_QUART }}
            className="h-1 flex-1 rounded-full origin-left"
            style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
          />
        ))}
      </div>
      <div className="mt-1 text-[11px] font-medium" style={{ color }}>
        {label}
      </div>
    </div>
  )
}

function PasswordRules({ value }: { value: string }) {
  const rules = [
    { ok: value.length >= 8, text: 'At least 8 characters' },
    { ok: /[A-Z]/.test(value), text: 'One uppercase letter' },
    { ok: /[0-9]/.test(value), text: 'One number' },
  ]
  return (
    <ul className="mt-2 space-y-1">
      {rules.map((r) => (
        <li key={r.text} className="flex items-center gap-1.5 text-[11px] text-white/50">
          <CheckCircle
            className="w-3 h-3 transition-colors"
            style={{ color: r.ok ? '#10B981' : 'rgba(255,255,255,0.25)' }}
          />
          <span style={{ color: r.ok ? 'rgba(255,255,255,0.75)' : 'rgba(255,255,255,0.45)' }}>
            {r.text}
          </span>
        </li>
      ))}
    </ul>
  )
}

function OwnerStep({
  form,
  set,
  roleColor,
}: {
  form: FormData
  set: (k: keyof FormData, v: string) => void
  roleColor: string
}) {
  return (
    <>
      <StepHeading title="Drone owner details" subtitle="Optional but helpful for tailored features." />
      <FormCard>
        <Field label="Primary Drone Model" icon={<FileText className="w-4 h-4" />}>
          <select
            className="field-input"
            value={form.droneModel}
            onChange={(e) => set('droneModel', e.target.value)}
          >
            <option value="">Select a model</option>
            {DRONE_MODELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </Field>

        <Field label="Purpose of Flying" icon={<Briefcase className="w-4 h-4" />}>
          <select
            className="field-input"
            value={form.purpose}
            onChange={(e) => set('purpose', e.target.value)}
          >
            <option value="">Select a purpose</option>
            {PURPOSES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </Field>

        <div>
          <div className="mb-2 text-xs font-medium text-white/60 tracking-wide">
            Experience Level
          </div>
          <div className="grid grid-cols-3 gap-2">
            {EXPERIENCE_LEVELS.map((lvl) => {
              const active = form.experience === lvl
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => set('experience', lvl)}
                  className="py-2.5 rounded-[10px] text-sm font-medium transition-[border-color,background,color] duration-200"
                  style={{
                    background: active ? `${roleColor}1a` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? roleColor : 'rgba(255,255,255,0.1)'}`,
                    color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {lvl}
                </button>
              )
            })}
          </div>
        </div>
      </FormCard>
    </>
  )
}

function PilotStep({
  form,
  set,
  errors,
  roleColor,
}: {
  form: FormData
  set: (k: keyof FormData, v: string) => void
  errors: Record<string, string>
  roleColor: string
}) {
  const fria = form.friaCertified
  return (
    <>
      <StepHeading title="Pilot license details" subtitle="Verify your credentials with the authorities." />
      <FormCard>
        <Field
          label="Pilot License Number"
          icon={<BadgeCheck className="w-4 h-4" />}
          error={errors.licenseNumber}
        >
          <input
            className="field-input"
            placeholder="IND-DGCA-XXXX-XXXX"
            value={form.licenseNumber}
            onChange={(e) => set('licenseNumber', e.target.value.toUpperCase())}
          />
        </Field>

        <Field label="License Expiry Date" icon={<Clock className="w-4 h-4" />}>
          <input
            className="field-input"
            type="date"
            value={form.licenseExpiry}
            onChange={(e) => set('licenseExpiry', e.target.value)}
          />
        </Field>

        <div>
          <div className="mb-2 text-xs font-medium text-white/60 tracking-wide">
            FRIA Certified
          </div>
          <div className="grid grid-cols-2 gap-2">
            {['Yes', 'No'].map((v) => {
              const active = fria === v
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => set('friaCertified', v)}
                  className="py-2.5 rounded-[10px] text-sm font-medium transition-[border-color,background,color] duration-200"
                  style={{
                    background: active ? `${roleColor}1a` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${active ? roleColor : 'rgba(255,255,255,0.1)'}`,
                    color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                  }}
                >
                  {v}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Years of Experience" icon={<Clock className="w-4 h-4" />}>
            <input
              className="field-input"
              type="number"
              min="0"
              placeholder="0"
              value={form.yearsExperience}
              onChange={(e) => set('yearsExperience', e.target.value)}
            />
          </Field>
          <Field label="Total Flight Hours" icon={<Plane className="w-4 h-4" />}>
            <input
              className="field-input"
              type="number"
              min="0"
              placeholder="0"
              value={form.flightHours}
              onChange={(e) => set('flightHours', e.target.value)}
            />
          </Field>
        </div>
      </FormCard>
    </>
  )
}

function AuthorityStep({
  form,
  set,
  errors,
  roleColor: _roleColor,
}: {
  form: FormData
  set: (k: keyof FormData, v: string) => void
  errors: Record<string, string>
  roleColor: string
}) {
  const officialEmail =
    !form.email ||
    /\.gov(\.in|\.us|\.uk)?$/i.test(form.email) ||
    /@[^@\s]+\.(gov|mil|police|airport)\b/i.test(form.email)
  return (
    <>
      <StepHeading
        title="Authority credentials"
        subtitle="Manual verification within 24 hours after submission."
      />
      <FormCard>
        <Field
          label="Organization Name"
          icon={<Building className="w-4 h-4" />}
          error={errors.organization}
        >
          <input
            className="field-input"
            placeholder="DGCA / Airport Authority / Police"
            value={form.organization}
            onChange={(e) => set('organization', e.target.value)}
          />
        </Field>

        <Field label="Organization Type" icon={<Briefcase className="w-4 h-4" />}>
          <select
            className="field-input"
            value={form.orgType}
            onChange={(e) => set('orgType', e.target.value)}
          >
            <option value="">Select organization type</option>
            {ORG_TYPES.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </Field>

        <Field
          label="Official Badge ID"
          icon={<BadgeCheck className="w-4 h-4" />}
          error={errors.badgeId}
        >
          <input
            className="field-input"
            placeholder="Badge or Employee ID"
            value={form.badgeId}
            onChange={(e) => set('badgeId', e.target.value)}
          />
        </Field>

        <Field label="Jurisdiction Area" icon={<MapPin className="w-4 h-4" />}>
          <input
            className="field-input"
            placeholder="State or Region"
            value={form.jurisdiction}
            onChange={(e) => set('jurisdiction', e.target.value)}
          />
        </Field>

        {!officialEmail && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex items-start gap-2 p-3 rounded-[10px] text-xs"
            style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.25)',
              color: '#F59E0B',
            }}
          >
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Best to use an official email (<code className="text-warning/90">.gov.in</code>,
              <code className="text-warning/90"> .mil</code>). Others slow verification.
            </span>
          </motion.div>
        )}
      </FormCard>
    </>
  )
}

function ReviewCard({
  role,
  form,
  agreed,
  setAgreed,
  error,
}: {
  role: Role
  form: FormData
  agreed: { terms: boolean; privacy: boolean; accurate: boolean }
  setAgreed: (a: { terms: boolean; privacy: boolean; accurate: boolean }) => void
  error?: string
}) {
  const meta = ROLES.find((r) => r.id === role)!
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1, ease: EASE_OUT_EXPO }}
      className="mt-10 mx-auto glass-strong p-7 sm:p-8"
      style={{ maxWidth: 560 }}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl"
            style={{ background: `${meta.color}14`, border: `1px solid ${meta.color}33` }}
            aria-hidden
          >
            {meta.emoji}
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-white/40">Role</div>
            <div className="font-inter font-bold text-white text-lg">{meta.title}</div>
          </div>
        </div>
        <span
          className="px-2.5 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider"
          style={{ background: `${meta.color}14`, border: `1px solid ${meta.color}33`, color: meta.color }}
        >
          {role}
        </span>
      </div>

      <ReviewSection title="Personal Info">
        <ReviewRow label="Name" value={form.name} />
        <ReviewRow label="Email" value={form.email} />
        {form.phone && <ReviewRow label="Phone" value={form.phone} />}
        {(form.state || form.city) && (
          <ReviewRow
            label="Location"
            value={[form.city, form.state].filter(Boolean).join(', ')}
          />
        )}
      </ReviewSection>

      {role === 'owner' && (form.droneModel || form.purpose || form.experience) && (
        <ReviewSection title="Owner Details">
          {form.droneModel && <ReviewRow label="Primary Drone" value={form.droneModel} />}
          {form.purpose && <ReviewRow label="Purpose" value={form.purpose} />}
          {form.experience && <ReviewRow label="Experience" value={form.experience} />}
        </ReviewSection>
      )}

      {role === 'pilot' && (
        <ReviewSection title="Pilot Details">
          <ReviewRow label="License" value={form.licenseNumber} />
          {form.licenseExpiry && <ReviewRow label="Expires" value={form.licenseExpiry} />}
          {form.friaCertified && <ReviewRow label="FRIA Certified" value={form.friaCertified} />}
          {form.yearsExperience && <ReviewRow label="Years Experience" value={form.yearsExperience} />}
          {form.flightHours && <ReviewRow label="Flight Hours" value={form.flightHours} />}
        </ReviewSection>
      )}

      {role === 'authority' && (
        <ReviewSection title="Authority Details">
          <ReviewRow label="Organization" value={form.organization} />
          {form.orgType && <ReviewRow label="Type" value={form.orgType} />}
          <ReviewRow label="Badge ID" value={form.badgeId} />
          {form.jurisdiction && <ReviewRow label="Jurisdiction" value={form.jurisdiction} />}
        </ReviewSection>
      )}

      <div className="mt-7 pt-6 border-t border-white/5 space-y-3">
        <Checkbox
          checked={agreed.terms}
          onChange={(v) => setAgreed({ ...agreed, terms: v })}
          label={<>I agree to the <span className="text-primary">Terms of Service</span></>}
        />
        <Checkbox
          checked={agreed.privacy}
          onChange={(v) => setAgreed({ ...agreed, privacy: v })}
          label={<>I accept the <span className="text-primary">Privacy Policy</span></>}
        />
        <Checkbox
          checked={agreed.accurate}
          onChange={(v) => setAgreed({ ...agreed, accurate: v })}
          label="I confirm all details are accurate"
        />
        {error && <FieldError message={error} />}
      </div>
    </motion.div>
  )
}

function ReviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 pt-5 border-t border-white/5">
      <div className="text-[11px] uppercase tracking-[0.2em] text-white/40 mb-3">{title}</div>
      <dl className="grid gap-2">{children}</dl>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-4 text-sm">
      <dt className="text-white/45">{label}</dt>
      <dd className="text-white/90 font-medium truncate">{value || '—'}</dd>
    </div>
  )
}

function Checkbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: React.ReactNode
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none group">
      <span
        className="mt-0.5 w-[18px] h-[18px] rounded-[5px] flex items-center justify-center shrink-0 transition-[background,border-color] duration-200"
        style={{
          background: checked ? '#3B82F6' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${checked ? '#3B82F6' : 'rgba(255,255,255,0.2)'}`,
        }}
      >
        {checked && (
          <svg viewBox="0 0 16 16" className="w-3 h-3 text-white" fill="none">
            <motion.path
              d="M3 8.5 L6.5 12 L13 4.5"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.25, ease: EASE_OUT_QUART }}
            />
          </svg>
        )}
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span className="text-sm text-white/75 group-hover:text-white/90 transition-colors leading-snug">
        {label}
      </span>
    </label>
  )
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

function Confetti({ count = 60, color }: { count?: number; color: string }) {
  const pieces = useMemo(() => {
    const palette = [color, '#3B82F6', '#10B981', '#F59E0B', '#ffffff']
    return Array.from({ length: count }).map((_, i) => {
      const c = palette[i % palette.length]
      return {
        left: Math.random() * 100,
        dx: (Math.random() - 0.5) * 220,
        delay: Math.random() * 0.8,
        duration: 2.4 + Math.random() * 2.4,
        color: c,
        rotate: Math.random() * 360,
      }
    })
  }, [count, color])

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-[1]" aria-hidden>
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            ['--dx' as string]: `${p.dx}px`,
            background: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  )
}

function Success({
  role,
  form,
  accountId,
  roleColor,
  prefersReducedMotion,
  onGoDashboard,
  onExplore,
}: {
  role: Role
  form: FormData
  accountId: string
  roleColor: string
  prefersReducedMotion: boolean
  onGoDashboard: () => void
  onExplore: () => void
}) {
  const meta = ROLES.find((r) => r.id === role)!

  return (
    <motion.section
      key="success"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative mt-16 mx-auto max-w-xl text-center"
    >
      {!prefersReducedMotion && <Confetti count={70} color={roleColor} />}

      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
        className="relative mx-auto w-24 h-24 rounded-full flex items-center justify-center"
        style={{
          background: 'rgba(16,185,129,0.12)',
          border: '2px solid rgba(16,185,129,0.45)',
          boxShadow: '0 0 0 8px rgba(16,185,129,0.08), 0 20px 60px -20px rgba(16,185,129,0.6)',
        }}
      >
        <span className="absolute -inset-2 rounded-full pulse-ring" style={{ background: 'rgba(16,185,129,0.35)' }} />
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
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.5, ease: EASE_OUT_EXPO }}
        className="mt-8 font-inter font-black text-white tracking-tight"
        style={{ fontSize: 'clamp(1.875rem, 4vw, 2.625rem)', lineHeight: 1.05 }}
      >
        Account Created 🎉
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.58, ease: EASE_OUT_EXPO }}
        className="mt-3 text-white/60"
      >
        Welcome to DroneChain.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.68, ease: EASE_OUT_EXPO }}
        className="mt-8 glass-strong p-6 text-left"
      >
        <dl className="grid gap-3 text-sm">
          <ReviewRow label="Role" value={meta.title} />
          <ReviewRow label="Email" value={form.email} />
          <div className="grid grid-cols-[110px_1fr] gap-4 text-sm items-center">
            <dt className="text-white/45">Status</dt>
            <dd>
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
                style={{
                  background: 'rgba(245,158,11,0.1)',
                  border: '1px solid rgba(245,158,11,0.3)',
                  color: '#F59E0B',
                }}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-warning pulse-dot" />
                Pending Verification
              </span>
            </dd>
          </div>
          <div className="grid grid-cols-[110px_1fr] gap-4 text-sm items-center">
            <dt className="text-white/45">Account ID</dt>
            <dd className="font-mono text-white/90 text-[13px] tracking-tight">{accountId}</dd>
          </div>
        </dl>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.78, ease: EASE_OUT_EXPO }}
        className="mt-4 p-4 rounded-[14px] text-left text-sm"
        style={{
          background: role === 'authority' ? 'rgba(245,158,11,0.08)' : 'rgba(59,130,246,0.08)',
          border: `1px solid ${role === 'authority' ? 'rgba(245,158,11,0.25)' : 'rgba(59,130,246,0.25)'}`,
          color: 'rgba(255,255,255,0.8)',
        }}
      >
        {role === 'authority' ? (
          <div className="flex items-start gap-2.5">
            <Shield className="w-4 h-4 mt-0.5 shrink-0 text-warning" />
            <div>
              <div className="font-semibold text-white">Manual verification required</div>
              <div className="mt-1 text-white/65">
                Authority accounts are reviewed by our team. You will be notified within 24 hours.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
            <div>
              <div className="font-semibold text-white">You can start using DroneChain now</div>
              <div className="mt-1 text-white/65">
                Account is pending verification, access is limited until complete.
              </div>
            </div>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.88, ease: EASE_OUT_EXPO }}
        className="mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        <button
          type="button"
          onClick={onGoDashboard}
          className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white bg-primary hover:bg-[#2563EB] transition-[background,transform,box-shadow] duration-200 active:scale-[0.98]"
          style={{ boxShadow: '0 10px 30px -12px rgba(59,130,246,0.6)' }}
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
        </button>
        <button
          type="button"
          onClick={onExplore}
          className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white/85 hover:text-white border border-white/15 hover:border-white/30 hover:bg-white/[0.06] transition-colors"
        >
          Explore DroneChain
        </button>
      </motion.div>
    </motion.section>
  )
}
