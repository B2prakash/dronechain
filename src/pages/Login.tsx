import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'motion/react'
import toast from 'react-hot-toast'
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Wallet,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  Globe,
  Radio,
} from 'lucide-react'

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const

const DEMO_ACCOUNTS = [
  {
    label: 'Drone Owner',
    email: 'ved@dronechain.io',
    password: 'password123',
    role: 'owner',
    icon: '🚁',
    color: '#3B82F6',
    subtitle: 'Register and monitor your fleet',
  },
  {
    label: 'DGCA Authority',
    email: 'authority@dgca.gov.in',
    password: 'password123',
    role: 'authority',
    icon: '🏛️',
    color: '#10B981',
    subtitle: 'Verify operators and enforce compliance',
  },
  {
    label: 'Certified Pilot',
    email: 'rahul@pilot.in',
    password: 'password123',
    role: 'pilot',
    icon: '✈️',
    color: '#F59E0B',
    subtitle: 'Broadcast Remote ID on every flight',
  },
]

export default function Login() {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [shakeKey, setShakeKey] = useState(0)

  const signInBtnRef = useRef<HTMLButtonElement>(null)

  async function handleLogin(e?: React.FormEvent) {
    e?.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')
    await new Promise((r) => setTimeout(r, 1500))
    const found = DEMO_ACCOUNTS.find(
      (a) => a.email === email && a.password === password,
    )
    if (found) {
      localStorage.setItem(
        'dronechain_user',
        JSON.stringify({
          name: found.label,
          email: found.email,
          role: found.role,
        }),
      )
      toast.success(`Welcome, ${found.label}`)
      navigate('/dashboard')
    } else {
      setError('Invalid email or password. Try a demo account below.')
      setShakeKey((k) => k + 1)
    }
    setLoading(false)
  }

  function useDemoAccount(account: typeof DEMO_ACCOUNTS[number]) {
    setEmail(account.email)
    setPassword(account.password)
    setError('')
    requestAnimationFrame(() => signInBtnRef.current?.focus())
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-bg">
      <BackLink onClick={() => navigate('/')} />

      <div className="relative grid min-h-screen lg:grid-cols-[1.5fr_1fr] xl:grid-cols-[3fr_2fr]">
        <BrandPanel prefersReducedMotion={!!prefersReducedMotion} />

        <motion.div
          initial={{ opacity: 0, x: prefersReducedMotion ? 0 : 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
          className="relative flex items-center justify-center px-5 sm:px-8 py-20 lg:py-10 lg:pr-10"
        >
          <div className="w-full max-w-[460px]">
            <div
              className="relative overflow-hidden"
              style={{
                background: 'rgba(17,24,39,0.95)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '24px',
                padding: 'clamp(28px, 4vw, 48px)',
                boxShadow:
                  '0 30px 80px -30px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.02) inset',
              }}
            >
              <div
                className="pointer-events-none absolute inset-x-0 top-0 h-px"
                style={{
                  background:
                    'linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)',
                }}
              />

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: EASE_OUT_EXPO }}
                className="flex items-center gap-2"
              >
                <span className="text-xl" aria-hidden>🚁</span>
                <span className="font-inter font-extrabold tracking-tight text-sm text-primary">
                  DroneChain
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.28, ease: EASE_OUT_EXPO }}
                className="mt-6 font-inter font-black text-white tracking-tight"
                style={{ fontSize: 'clamp(1.75rem, 3vw, 2.125rem)', lineHeight: 1.1 }}
              >
                Welcome back
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.34, ease: EASE_OUT_EXPO }}
                className="mt-2 text-[0.95rem] text-white/55"
              >
                Sign in to your account
              </motion.p>

              <motion.form
                key={shakeKey}
                onSubmit={handleLogin}
                className="mt-7 space-y-4"
                animate={error && shakeKey ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <FieldReveal delay={0.4}>
                  <Field
                    label="Email Address"
                    icon={<Mail className="w-4 h-4" />}
                    input={
                      <input
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        disabled={loading}
                        className="field-input"
                      />
                    }
                  />
                </FieldReveal>

                <FieldReveal delay={0.46}>
                  <Field
                    label="Password"
                    icon={<Lock className="w-4 h-4" />}
                    input={
                      <input
                        type={showPassword ? 'text' : 'password'}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        disabled={loading}
                        className="field-input"
                      />
                    }
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
                  />
                </FieldReveal>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: EASE_OUT_QUART }}
                    role="alert"
                    className="flex items-start gap-2 text-sm text-danger"
                  >
                    <span
                      className="mt-0.5 inline-block w-1.5 h-1.5 rounded-full"
                      style={{ background: '#EF4444' }}
                    />
                    <span className="leading-snug">{error}</span>
                  </motion.div>
                )}

                <FieldReveal delay={0.54}>
                  <button
                    ref={signInBtnRef}
                    type="submit"
                    disabled={loading}
                    className="group relative w-full overflow-hidden rounded-[12px] py-3.5 font-semibold text-white transition-[background,transform,box-shadow] duration-200 active:scale-[0.99] disabled:opacity-80 disabled:cursor-not-allowed"
                    style={{
                      background: loading ? '#2563EB' : '#3B82F6',
                      boxShadow: '0 10px 30px -12px rgba(59,130,246,0.6)',
                    }}
                    onMouseEnter={(e) => {
                      if (!loading) e.currentTarget.style.background = '#2563EB'
                    }}
                    onMouseLeave={(e) => {
                      if (!loading) e.currentTarget.style.background = '#3B82F6'
                    }}
                  >
                    <span className="relative inline-flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <Spinner />
                          Signing in...
                        </>
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                        </>
                      )}
                    </span>
                  </button>
                </FieldReveal>
              </motion.form>

              <FieldReveal delay={0.62}>
                <div className="mt-6 flex items-center gap-3 text-xs text-white/40">
                  <span className="flex-1 h-px bg-white/10" />
                  <span>or continue with</span>
                  <span className="flex-1 h-px bg-white/10" />
                </div>
              </FieldReveal>

              <FieldReveal delay={0.66}>
                <button
                  type="button"
                  onClick={() => toast('Wallet connect coming soon', { icon: '🔗' })}
                  className="mt-4 group w-full inline-flex items-center justify-center gap-2 rounded-[12px] py-3 text-sm font-medium text-white/90 hover:text-white transition-colors"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  <Wallet className="w-4 h-4" />
                  Connect Solana Wallet
                </button>
              </FieldReveal>

              <FieldReveal delay={0.72}>
                <p className="mt-6 text-center text-sm text-white/55">
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/signup')}
                    className="text-primary font-medium hover:underline underline-offset-4"
                  >
                    Sign Up
                  </button>
                </p>
              </FieldReveal>
            </div>

            <DemoAccounts onSelect={useDemoAccount} />
          </div>
        </motion.div>
      </div>

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
        .field-input:disabled { cursor: not-allowed; }
        .field-input:-webkit-autofill,
        .field-input:-webkit-autofill:hover,
        .field-input:-webkit-autofill:focus,
        .field-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 30px #1a2235 inset !important;
          -webkit-text-fill-color: #F9FAFB !important;
          caret-color: #F9FAFB !important;
          transition: background-color 5000s ease-in-out 0s !important;
        }
      `}</style>
    </div>
  )
}

function FieldReveal({
  children,
  delay = 0,
}: {
  children: React.ReactNode
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: EASE_OUT_EXPO }}
    >
      {children}
    </motion.div>
  )
}

function Field({
  label,
  icon,
  input,
  trailing,
}: {
  label: string
  icon: React.ReactNode
  input: React.ReactNode
  trailing?: React.ReactNode
}) {
  const [focused, setFocused] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const input = el.querySelector('input')
    if (!input) return
    const onFocus = () => setFocused(true)
    const onBlur = () => setFocused(false)
    input.addEventListener('focus', onFocus)
    input.addEventListener('blur', onBlur)
    return () => {
      input.removeEventListener('focus', onFocus)
      input.removeEventListener('blur', onBlur)
    }
  }, [])

  return (
    <label className="block">
      <div className="mb-1.5 text-xs font-medium text-white/60 tracking-wide">
        {label}
      </div>
      <div
        ref={wrapRef}
        className="flex items-center gap-0 transition-[border-color,box-shadow] duration-200"
        style={{
          background: 'rgba(255,255,255,0.05)',
          border: `1px solid ${focused ? '#3B82F6' : 'rgba(255,255,255,0.1)'}`,
          borderRadius: '12px',
          padding: '12px 16px 12px 44px',
          position: 'relative',
          boxShadow: focused ? '0 0 0 4px rgba(59,130,246,0.12)' : 'none',
        }}
      >
        <span
          className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-200"
          style={{ color: focused ? '#3B82F6' : 'rgba(255,255,255,0.4)' }}
        >
          {icon}
        </span>
        <div className="flex-1 min-w-0">{input}</div>
        {trailing && <div className="pl-2">{trailing}</div>}
      </div>
    </label>
  )
}

function Spinner() {
  return (
    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path
        d="M22 12a10 10 0 0 1-10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  )
}

function BackLink({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group absolute top-5 left-5 sm:top-6 sm:left-6 z-20 inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
    >
      <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
      <span>Back home</span>
    </button>
  )
}

function BrandPanel({ prefersReducedMotion }: { prefersReducedMotion: boolean }) {
  const highlights = [
    {
      icon: CheckCircle,
      emoji: '✅',
      title: 'Remote ID Compliant',
      body: 'FAA Part 89 and DGCA 2021 verified.',
    },
    {
      icon: Shield,
      emoji: '🔒',
      title: 'Blockchain Secured',
      body: 'Immutable records on Solana.',
    },
    {
      icon: Globe,
      emoji: '🌐',
      title: 'Global Standards',
      body: 'Recognized by aviation authorities worldwide.',
    },
  ]

  return (
    <motion.aside
      initial={{ opacity: 0, x: prefersReducedMotion ? 0 : -40 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
      className="relative hidden lg:flex flex-col justify-between overflow-hidden"
      style={{
        background:
          'linear-gradient(140deg, #0a0f1a 0%, #0c1628 40%, #0d1b2e 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <div
        className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full blur-3xl opacity-40 pointer-events-none"
        style={{
          background:
            'radial-gradient(closest-side, rgba(59,130,246,0.45), transparent 70%)',
        }}
      />
      <div
        className="absolute -bottom-40 -right-40 w-[520px] h-[520px] rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{
          background:
            'radial-gradient(closest-side, rgba(16,185,129,0.4), transparent 70%)',
        }}
      />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={`text-[clamp(9rem,18vw,16rem)] opacity-[0.08] ${prefersReducedMotion ? '' : 'animate-drift animate-float'}`}
          aria-hidden
          style={{ filter: 'drop-shadow(0 0 60px rgba(59,130,246,0.45))' }}
        >
          🚁
        </div>
      </div>

      <div className="relative z-10 p-10 xl:p-14 flex items-center gap-2.5">
        <span className="text-2xl" aria-hidden>🚁</span>
        <span className="font-inter font-extrabold tracking-tight text-lg text-primary">
          DroneChain
        </span>
      </div>

      <div className="relative z-10 px-10 xl:px-14">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.2, ease: EASE_OUT_EXPO }}
          className="font-inter font-black text-white tracking-tight text-balance"
          style={{ fontSize: 'clamp(2rem, 3.6vw, 3.25rem)', lineHeight: 1.05 }}
        >
          Secure. Compliant. <span className="text-primary">Blockchain-verified.</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.32, ease: EASE_OUT_EXPO }}
          className="mt-4 max-w-lg text-white/60"
          style={{ fontSize: 'clamp(0.95rem, 1.2vw, 1.05rem)' }}
        >
          The future of drone identity management.
        </motion.p>

        <ul className="mt-10 space-y-4 max-w-md">
          {highlights.map((h, i) => {
            const Icon = h.icon
            return (
              <motion.li
                key={h.title}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7, delay: 0.42 + i * 0.08, ease: EASE_OUT_EXPO }}
                className="flex items-start gap-3.5"
              >
                <div
                  className="mt-0.5 w-9 h-9 shrink-0 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'rgba(59,130,246,0.1)',
                    border: '1px solid rgba(59,130,246,0.25)',
                  }}
                >
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="font-inter font-semibold text-white text-[15px] flex items-center gap-1.5">
                    <span aria-hidden className="text-base">{h.emoji}</span>
                    {h.title}
                  </div>
                  <div className="mt-0.5 text-sm text-white/55 leading-snug">{h.body}</div>
                </div>
              </motion.li>
            )
          })}
        </ul>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8, ease: EASE_OUT_EXPO }}
        className="relative z-10 p-10 xl:p-14 flex items-center gap-3"
      >
        <div
          className="inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs text-white/75"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <span className="relative inline-flex w-2 h-2">
            <span className="absolute inset-0 rounded-full bg-success" />
            <span className="absolute -inset-1 rounded-full pulse-ring" style={{ background: 'rgba(16,185,129,0.45)' }} />
          </span>
          Trusted by <span className="text-white font-semibold">1,247</span> drone operators
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs text-white/45">
          <Radio className="w-3.5 h-3.5" />
          Live on Solana
        </div>
      </motion.div>
    </motion.aside>
  )
}

function DemoAccounts({
  onSelect,
}: {
  onSelect: (account: typeof DEMO_ACCOUNTS[number]) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.8, ease: EASE_OUT_EXPO }}
      className="mt-6"
    >
      <div className="flex items-baseline justify-between">
        <div>
          <div className="font-inter font-bold text-white text-sm">Quick Demo Access</div>
          <div className="text-xs text-white/45 mt-0.5">Click any account to auto-fill</div>
        </div>
        <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">
          password123
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {DEMO_ACCOUNTS.map((a, i) => (
          <motion.button
            key={a.role}
            type="button"
            onClick={() => onSelect(a)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.88 + i * 0.06, ease: EASE_OUT_EXPO }}
            whileHover={{ x: 2 }}
            className="w-full group flex items-center gap-3 text-left transition-[border-color,background] duration-200"
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              padding: '14px 16px',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `${a.color}66`
              e.currentTarget.style.background = `${a.color}0F`
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
            }}
          >
            <div
              className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center text-lg"
              style={{
                background: `${a.color}14`,
                border: `1px solid ${a.color}33`,
              }}
              aria-hidden
            >
              {a.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-inter font-semibold text-white text-sm">
                  {a.label} Demo
                </span>
                <span
                  className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded"
                  style={{
                    color: a.color,
                    background: `${a.color}14`,
                    border: `1px solid ${a.color}2e`,
                  }}
                >
                  {a.role}
                </span>
              </div>
              <div className="mt-0.5 text-xs text-white/55 truncate">{a.email}</div>
            </div>
            <div
              className="shrink-0 inline-flex items-center gap-1 text-xs font-medium opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-[opacity,transform] duration-200"
              style={{ color: a.color }}
            >
              Use
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
