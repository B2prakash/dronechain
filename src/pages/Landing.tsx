import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, useInView, useReducedMotion } from 'motion/react'
import {
  Shield,
  Radio,
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Globe,
  Zap,
  Lock,
  Eye,
} from 'lucide-react'
import { MOCK_STATS } from '../data/mockDrones'

const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const
const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

function useCountUp(target: number, duration = 1800, start = true) {
  const [value, setValue] = useState(0)
  const prefersReducedMotion = useReducedMotion()

  useEffect(() => {
    if (!start) return
    if (prefersReducedMotion) {
      setValue(target)
      return
    }
    let raf = 0
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 4)
      setValue(eased * target)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration, start, prefersReducedMotion])

  return value
}

function formatNumber(n: number, decimals = 0) {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

function StatCard({
  value,
  decimals = 0,
  suffix = '',
  label,
  accent,
  delay = 0,
}: {
  value: number
  decimals?: number
  suffix?: string
  label: string
  accent: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-80px' })
  const count = useCountUp(value, 1800, inView)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: EASE_OUT_QUART }}
      className="relative group"
    >
      <div className="relative px-6 py-7 text-center">
        <div
          className="font-inter font-black text-white tracking-tight leading-none"
          style={{ fontSize: 'clamp(2rem, 4vw, 3rem)' }}
        >
          {formatNumber(count, decimals)}
          {suffix}
        </div>
        <div className="mt-2 text-sm text-white/60 tracking-wide">{label}</div>
        <motion.div
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: 1 } : {}}
          transition={{ duration: 1.2, delay: delay + 0.3, ease: EASE_OUT_EXPO }}
          className="absolute bottom-0 left-6 right-6 h-[2px] origin-left rounded-full"
          style={{ background: accent }}
        />
      </div>
    </motion.div>
  )
}

const features = [
  {
    icon: Eye,
    title: 'Drone Identity',
    emoji: '🔍',
    body:
      'Unique blockchain-verified ID for every registered drone. Tamper-proof and permanently stored on Solana.',
    accent: '#3B82F6',
  },
  {
    icon: Radio,
    title: 'Real-time Location',
    emoji: '📡',
    body:
      'GPS coordinates, altitude, speed and heading broadcast every second. Authorities can track any drone live.',
    accent: '#10B981',
  },
  {
    icon: Users,
    title: 'Pilot Identification',
    emoji: '👤',
    body:
      'Verified pilot credentials and ground control station location linked to every active flight on-chain.',
    accent: '#F59E0B',
  },
]

const compliance = [
  { flag: '🇺🇸', name: 'FAA Part 89', region: 'United States' },
  { flag: '🇮🇳', name: 'DGCA 2021', region: 'India' },
  { flag: '🇪🇺', name: 'EASA U-space', region: 'European Union' },
  { flag: '🇬🇧', name: 'CAA', region: 'United Kingdom' },
]

const steps = [
  {
    emoji: '📝',
    title: 'Register Drone',
    body: 'Fill details and mint your drone as an NFT on Solana.',
  },
  {
    emoji: '📡',
    title: 'Activate Remote ID',
    body: 'Enable real-time broadcasting of location and identity data.',
  },
  {
    emoji: '🛫',
    title: 'Fly and Log',
    body: 'Every flight automatically recorded on blockchain.',
  },
  {
    emoji: '✅',
    title: 'Stay Compliant',
    body: 'Authorities verify instantly. No paperwork needed.',
  },
]

const whyBlockchain = [
  {
    icon: Lock,
    emoji: '🔒',
    title: 'Tamper-proof Records',
    body:
      'Unlike centralized databases, blockchain records cannot be altered or deleted by anyone.',
  },
  {
    icon: Globe,
    emoji: '🌐',
    title: 'Global Verification',
    body:
      'Any authority worldwide can verify a drone registration and compliance instantly.',
  },
  {
    icon: Zap,
    emoji: '⚡',
    title: 'Instant Transfer',
    body:
      'Sell or transfer drone ownership securely using smart contracts with full history preserved.',
  },
]

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'Monitor', path: '/monitor' },
  { label: 'Register', path: '/register' },
  { label: 'Explorer', path: '/explorer' },
  { label: 'Analytics', path: '/analytics' },
] as const

function Navbar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 transition-[background,border,backdrop-filter] duration-300"
      style={{
        background: scrolled ? 'rgba(10,15,26,0.82)' : 'rgba(10,15,26,0.55)',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        borderBottom: `1px solid ${scrolled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)'}`,
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5 group"
          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <span className="text-2xl" aria-hidden>🚁</span>
          <span
            className="font-inter font-extrabold tracking-tight text-lg"
            style={{ color: '#3B82F6' }}
          >
            DroneChain
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((l) => {
            const active = location.pathname === l.path
            return (
              <button
                key={l.path}
                type="button"
                onClick={() => navigate(l.path)}
                className="relative text-sm transition-colors duration-200 group/link"
                style={{
                  color: active ? '#3B82F6' : 'rgba(255,255,255,0.75)',
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                {l.label}
                <span
                  className="absolute left-0 -bottom-1 h-[1.5px] rounded-full transition-[width] duration-300 group-hover/link:w-full"
                  style={{
                    width: active ? '100%' : 0,
                    background: '#3B82F6',
                    transitionTimingFunction: 'cubic-bezier(0.16,1,0.3,1)',
                  }}
                />
              </button>
            )
          })}
        </nav>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <button
            onClick={() => navigate('/login')}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.3)',
              color: '#F9FAFB',
              padding: '8px 20px',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              lineHeight: '1.5',
            }}
          >
            Login
          </button>

          <button
            onClick={() => navigate('/signup')}
            style={{
              background: '#3B82F6',
              border: '1px solid #3B82F6',
              color: '#ffffff',
              padding: '8px 20px',
              borderRadius: '9999px',
              fontSize: '14px',
              fontWeight: 500,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              lineHeight: '1.5',
            }}
          >
            Sign Up
          </button>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  const prefersReducedMotion = useReducedMotion()
  const navigate = useNavigate()

  const stagger = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.09, delayChildren: 0.1 },
    },
  }
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: EASE_OUT_EXPO } },
  }

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-24 pb-16">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 grid-bg radial-fade opacity-70" />
        <div
          className="absolute left-1/2 top-[18%] -translate-x-1/2 w-[720px] h-[720px] rounded-full blur-3xl opacity-40 pointer-events-none"
          style={{ background: 'radial-gradient(closest-side, rgba(59,130,246,0.45), transparent 70%)' }}
        />
        <div
          className="absolute right-[-10%] bottom-[-10%] w-[520px] h-[520px] rounded-full blur-3xl opacity-25 pointer-events-none"
          style={{ background: 'radial-gradient(closest-side, rgba(16,185,129,0.35), transparent 70%)' }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 w-full">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="flex flex-col items-center text-center"
        >
          <motion.div variants={item}>
            <div
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-medium"
              style={{
                background: 'rgba(59,130,246,0.1)',
                border: '1px solid rgba(59,130,246,0.3)',
                color: '#3B82F6',
              }}
            >
              <span className="relative inline-flex w-2 h-2">
                <span
                  className="absolute inset-0 rounded-full"
                  style={{ background: '#EF4444' }}
                />
                <span
                  className="absolute -inset-1 rounded-full pulse-ring"
                  style={{ background: 'rgba(239,68,68,0.45)' }}
                />
              </span>
              Live · FAA Part 89 & DGCA 2021 Compliant
            </div>
          </motion.div>

          <motion.h1
            variants={item}
            className="mt-8 font-inter font-black leading-[0.95] tracking-tight text-balance"
            style={{ fontSize: 'clamp(2.75rem, 7.5vw, 4.75rem)' }}
          >
            <span className="block text-white">Secure Drone Identity</span>
            <span className="block" style={{ color: '#3B82F6' }}>
              on Solana Blockchain
            </span>
          </motion.h1>

          <motion.p
            variants={item}
            className="mt-6 max-w-2xl text-white/65 text-balance"
            style={{ fontSize: 'clamp(1rem, 1.5vw, 1.25rem)', lineHeight: 1.55 }}
          >
            Real-time Remote ID broadcasting, immutable flight logs, and instant
            compliance verification for every drone in your airspace.
          </motion.p>

          <motion.div
            variants={item}
            className="relative mt-14 w-full max-w-3xl h-28 flex items-center justify-center"
            aria-hidden
          >
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at center, rgba(59,130,246,0.35), transparent 55%)',
                filter: 'blur(12px)',
              }}
            />
            <div className="relative">
              <div
                className={`text-6xl sm:text-7xl drone-glow ${prefersReducedMotion ? '' : 'animate-drift animate-float'}`}
                style={{ display: 'inline-block' }}
              >
                🚁
              </div>
              <div
                className="absolute left-1/2 -translate-x-1/2 -bottom-4 w-40 h-2 rounded-full blur-md opacity-60"
                style={{ background: 'rgba(59,130,246,0.55)' }}
              />
            </div>
          </motion.div>

          <motion.div variants={item} className="mt-10 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="group inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm sm:text-base font-semibold text-white bg-primary hover:bg-[#2563EB] transition-[background,transform,box-shadow] duration-200 active:scale-[0.98] shadow-[0_10px_40px_-10px_rgba(59,130,246,0.6)] hover:shadow-[0_16px_48px_-8px_rgba(59,130,246,0.7)]"
            >
              <span aria-hidden>🚁</span>
              Register Your Drone
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <button
              type="button"
              onClick={() => navigate('/monitor')}
              className="group inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm sm:text-base font-semibold text-white/90 hover:text-white border border-white/15 hover:border-white/30 hover:bg-white/[0.06] transition-colors duration-200"
            >
              <span aria-hidden>📡</span>
              View Live Monitor
            </button>
          </motion.div>

          <motion.ul
            variants={item}
            className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs sm:text-sm text-white/55"
          >
            {['Solana Blockchain', 'DGCA Verified', 'FAA Compliant', 'Open Source'].map((t) => (
              <li key={t} className="inline-flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" style={{ color: '#10B981' }} />
                {t}
              </li>
            ))}
          </motion.ul>
        </motion.div>
      </div>
    </section>
  )
}

function LiveStats() {
  return (
    <section className="relative max-w-7xl mx-auto px-6 -mt-8 mb-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.8, ease: EASE_OUT_EXPO }}
        className="glass-strong relative overflow-hidden"
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(59,130,246,0.6), transparent)',
          }}
        />
        <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-white/5">
          <StatCard value={MOCK_STATS.totalDrones} label="Drones Registered" accent="#3B82F6" />
          <StatCard value={MOCK_STATS.activeFlights} label="Active Flights Now" accent="#10B981" delay={0.08} />
          <StatCard value={MOCK_STATS.totalFlights} label="Flights Logged" accent="#F59E0B" delay={0.16} />
          <StatCard value={MOCK_STATS.complianceRate} decimals={1} suffix="%" label="Compliance Rate" accent="#EF4444" delay={0.24} />
        </div>
      </motion.div>
    </section>
  )
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div className="max-w-2xl mx-auto text-center">
      {eyebrow && (
        <div className="text-xs uppercase tracking-[0.2em] text-primary/80 font-medium mb-4">
          {eyebrow}
        </div>
      )}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
        className="font-inter font-black text-white tracking-tight text-balance"
        style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', lineHeight: 1.05 }}
      >
        {title}
      </motion.h2>
      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE_OUT_EXPO }}
          className="mt-4 text-white/60 text-balance"
          style={{ fontSize: 'clamp(0.95rem, 1.2vw, 1.1rem)' }}
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  )
}

function RemoteIdSection() {
  return (
    <section id="remote-id" className="relative max-w-7xl mx-auto px-6 py-24">
      <SectionHeader
        eyebrow="Regulation"
        title="What is Remote ID?"
        subtitle="The FAA and DGCA require all drones to broadcast this data in real-time."
      />
      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((f, i) => {
          const Icon = f.icon
          return (
            <motion.article
              key={f.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: EASE_OUT_EXPO }}
              whileHover={{ y: -6 }}
              className="relative group glass p-7 transition-[border,box-shadow] duration-300 hover:border-primary/40 hover:shadow-[0_20px_60px_-20px_rgba(59,130,246,0.35)]"
            >
              <div
                className="pointer-events-none absolute inset-0 rounded-[16px] opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{
                  background: `radial-gradient(400px circle at 50% 0%, ${f.accent}18, transparent 60%)`,
                }}
              />
              <div className="relative">
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{
                      background: `${f.accent}14`,
                      border: `1px solid ${f.accent}33`,
                    }}
                  >
                    <Icon className="w-5 h-5" style={{ color: f.accent }} />
                  </div>
                  <span className="text-xl" aria-hidden>{f.emoji}</span>
                </div>
                <h3 className="mt-5 font-inter font-bold text-white text-xl tracking-tight">
                  {f.title}
                </h3>
                <p className="mt-2 text-white/60 text-[0.95rem] leading-relaxed">{f.body}</p>
              </div>
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}

function ComplianceSection() {
  return (
    <section id="compliance" className="relative max-w-7xl mx-auto px-6 py-24">
      <SectionHeader
        eyebrow="Worldwide"
        title="Compliant with Global Standards"
        subtitle="Built to satisfy the authorities that govern your airspace."
      />
      <div className="mt-14 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {compliance.map((c, i) => (
          <motion.div
            key={c.name}
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.6, delay: i * 0.07, ease: EASE_OUT_EXPO }}
            whileHover={{ y: -4 }}
            className="relative group glass px-5 py-6 text-center transition-[border,box-shadow] duration-300 hover:border-success/40 hover:shadow-[0_20px_50px_-20px_rgba(16,185,129,0.35)]"
          >
            <div className="text-4xl" aria-hidden>{c.flag}</div>
            <div className="mt-3 font-inter font-bold text-white text-sm sm:text-base">{c.name}</div>
            <div className="mt-1 text-xs text-white/50">{c.region}</div>
            <div className="mt-4 inline-flex items-center gap-1.5 text-xs text-success">
              <CheckCircle className="w-3.5 h-3.5" />
              Verified
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section id="how" className="relative max-w-7xl mx-auto px-6 py-24">
      <SectionHeader
        eyebrow="Workflow"
        title="How DroneChain Works"
        subtitle="Simple 4 step process from registration to takeoff."
      />
      <div className="mt-14 relative">
        <div
          className="hidden lg:block absolute left-0 right-0 top-[34px] h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(59,130,246,0.25), rgba(59,130,246,0.25), transparent)',
          }}
        />
        <ol className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 relative">
          {steps.map((s, i) => (
            <motion.li
              key={s.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: i * 0.1, ease: EASE_OUT_EXPO }}
              className="relative"
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className="relative z-10 w-[68px] h-[68px] rounded-2xl flex items-center justify-center text-3xl"
                  style={{
                    background: 'rgba(17,24,39,0.95)',
                    border: '1px solid rgba(59,130,246,0.35)',
                    boxShadow: '0 12px 40px -16px rgba(59,130,246,0.6)',
                  }}
                >
                  <span aria-hidden>{s.emoji}</span>
                  <span
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full text-[11px] font-inter font-bold flex items-center justify-center"
                    style={{ background: '#3B82F6', color: 'white' }}
                  >
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 font-inter font-bold text-white text-lg">{s.title}</h3>
                <p className="mt-2 text-white/60 text-sm max-w-[220px]">{s.body}</p>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight
                  className="hidden lg:block absolute top-[26px] -right-3 w-5 h-5 text-primary/60"
                  aria-hidden
                />
              )}
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function WhyBlockchain() {
  return (
    <section id="why" className="relative max-w-7xl mx-auto px-6 py-24">
      <SectionHeader
        eyebrow="Principles"
        title="Why Blockchain for Drones?"
        subtitle="Paper registries lose records. Central databases get hacked. Blockchain does neither."
      />
      <div className="mt-14 grid gap-5 md:grid-cols-3">
        {whyBlockchain.map((f, i) => {
          const Icon = f.icon
          return (
            <motion.article
              key={f.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-60px' }}
              transition={{ duration: 0.7, delay: i * 0.08, ease: EASE_OUT_EXPO }}
              whileHover={{ y: -6 }}
              className="relative glass p-7 group transition-[border,box-shadow] duration-300 hover:border-primary/40 hover:shadow-[0_24px_60px_-24px_rgba(59,130,246,0.45)]"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'rgba(59,130,246,0.12)',
                    border: '1px solid rgba(59,130,246,0.3)',
                  }}
                >
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xl" aria-hidden>{f.emoji}</span>
              </div>
              <h3 className="mt-5 font-inter font-bold text-white text-xl tracking-tight">
                {f.title}
              </h3>
              <p className="mt-2 text-white/60 text-[0.95rem] leading-relaxed">{f.body}</p>
            </motion.article>
          )
        })}
      </div>
    </section>
  )
}

function CtaBanner() {
  const navigate = useNavigate()
  return (
    <section className="relative max-w-7xl mx-auto px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.9, ease: EASE_OUT_EXPO }}
        className="relative overflow-hidden rounded-3xl"
        style={{
          background:
            'linear-gradient(135deg, #0b1a3d 0%, #0a0f1a 45%, #0b1a3d 100%)',
          border: '1px solid rgba(59,130,246,0.25)',
        }}
      >
        <div className="absolute inset-0 grid-bg opacity-30 pointer-events-none" />
        <div
          className="absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl opacity-40 pointer-events-none"
          style={{ background: 'radial-gradient(closest-side, rgba(59,130,246,0.6), transparent 70%)' }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ background: 'radial-gradient(closest-side, rgba(16,185,129,0.5), transparent 70%)' }}
        />

        <div className="relative px-8 sm:px-14 py-16 sm:py-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs text-primary/90" style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <Shield className="w-3.5 h-3.5" />
            Free during public beta
          </div>
          <h2
            className="mt-6 font-inter font-black text-white tracking-tight text-balance"
            style={{ fontSize: 'clamp(1.875rem, 4vw, 2.75rem)', lineHeight: 1.05 }}
          >
            Ready to Register Your Drone?
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-white/65">
            Join {MOCK_STATS.totalDrones.toLocaleString()} drone operators already
            compliant on DroneChain.
          </p>
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="group mt-8 inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm sm:text-base font-semibold text-white bg-primary hover:bg-[#2563EB] transition-[background,transform,box-shadow] duration-200 active:scale-[0.98] shadow-[0_10px_40px_-10px_rgba(59,130,246,0.6)] hover:shadow-[0_16px_48px_-8px_rgba(59,130,246,0.7)]"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </button>
        </div>
      </motion.div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="relative border-t border-white/5 bg-[#070b14]">
      <div className="max-w-7xl mx-auto px-6 py-14 grid gap-10 md:grid-cols-[1.3fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-2xl" aria-hidden>🚁</span>
            <span className="font-inter font-extrabold tracking-tight text-lg text-primary">
              DroneChain
            </span>
          </div>
          <p className="mt-3 text-sm text-white/50 max-w-xs">
            Blockchain-verified drone identity and Remote ID broadcasting for
            compliant operators worldwide.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-white/40">
            <span className="w-1.5 h-1.5 rounded-full bg-success pulse-dot" />
            Built on Solana Blockchain
          </div>
        </div>

        <FooterCol
          title="Product"
          links={[
            { label: 'Monitor', to: '/monitor' },
            { label: 'Register', to: '/register' },
            { label: 'Explorer', to: '/explorer' },
          ]}
        />
        <FooterCol
          title="Company"
          links={[
            { label: 'About', to: '#' },
            { label: 'Contact', to: '#' },
            { label: 'Docs', to: '#' },
          ]}
        />
        <FooterCol
          title="Standards"
          links={[
            { label: 'FAA Part 89', to: '#' },
            { label: 'DGCA 2021', to: '#' },
            { label: 'EASA U-space', to: '#' },
          ]}
        />
      </div>
      <div className="border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-3 text-xs text-white/40">
          <div>© 2026 DroneChain. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white/70 transition-colors">Privacy</a>
            <a href="#" className="hover:text-white/70 transition-colors">Terms</a>
            <a href="#" className="hover:text-white/70 transition-colors">Security</a>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({
  title,
  links,
}: {
  title: string
  links: { label: string; to: string }[]
}) {
  const navigate = useNavigate()
  return (
    <div>
      <div className="text-xs uppercase tracking-[0.2em] text-white/40 font-medium">{title}</div>
      <ul className="mt-4 space-y-2.5">
        {links.map((l) => (
          <li key={l.label}>
            <button
              type="button"
              onClick={() => l.to.startsWith('/') && navigate(l.to)}
              className="text-sm text-white/70 hover:text-white transition-colors"
              style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
            >
              {l.label}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ViolationTicker() {
  if (MOCK_STATS.violations === 0) return null
  return (
    <div className="relative max-w-7xl mx-auto px-6 mt-2">
      <div
        className="glass flex items-center gap-3 px-4 py-2.5 text-sm"
        style={{ borderColor: 'rgba(245,158,11,0.25)' }}
      >
        <AlertTriangle className="w-4 h-4 text-warning" />
        <span className="text-white/75">
          <span className="text-warning font-semibold">{MOCK_STATS.violations} active violations</span>
          <span className="text-white/45"> — authorities are currently investigating</span>
        </span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-white/45">
          <MapPin className="w-3.5 h-3.5" /> live
        </span>
      </div>
    </div>
  )
}

export default function Landing() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <Navbar />
      <Hero />
      <LiveStats />
      <ViolationTicker />
      <RemoteIdSection />
      <ComplianceSection />
      <HowItWorks />
      <WhyBlockchain />
      <CtaBanner />
      <Footer />
    </div>
  )
}
