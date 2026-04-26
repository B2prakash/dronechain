import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, useInView, useReducedMotion } from 'motion/react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Building,
  CheckCircle,
  ClipboardList,
  Compass,
  Download,
  ExternalLink,
  FileText,
  Home,
  LogOut,
  Map as MapIcon,
  Plus,
  Radio,
  Repeat,
  Search,
  Settings,
  Shield,
  Siren,
  Sparkles,
} from 'lucide-react'

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const

type StoredUser = {
  name?: string
  email?: string
  role?: 'owner' | 'pilot' | 'authority' | string
  verified?: boolean
  avatar?: string
}

const ROLE_META: Record<
  string,
  { label: string; color: string; emoji: string }
> = {
  owner: { label: 'Drone Owner', color: '#3B82F6', emoji: '🚁' },
  pilot: { label: 'Certified Pilot', color: '#F59E0B', emoji: '✈️' },
  authority: { label: 'Authority Official', color: '#10B981', emoji: '🏛️' },
}

function readUser(): StoredUser {
  try {
    return JSON.parse(localStorage.getItem('dronechain_user') || '{}')
  } catch {
    return {}
  }
}

function getInitials(name?: string) {
  if (!name) return 'DC'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function timeOfDay(d = new Date()) {
  const h = d.getHours()
  if (h < 5) return 'Good evening'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Good night'
}

function formatDate(d = new Date()) {
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState<StoredUser>(() => readUser())

  useEffect(() => {
    if (!user.email) navigate('/login', { replace: true })
  }, [user.email, navigate])

  useEffect(() => {
    const refresh = () => setUser(readUser())
    window.addEventListener('storage', refresh)
    window.addEventListener('focus', refresh)
    return () => {
      window.removeEventListener('storage', refresh)
      window.removeEventListener('focus', refresh)
    }
  }, [])

  if (!user.email) return null

  const role = (user.role as 'owner' | 'pilot' | 'authority') || 'owner'
  const meta = ROLE_META[role] ?? ROLE_META.owner
  const initials = user.avatar ?? getInitials(user.name)

  function handleLogout() {
    localStorage.removeItem('dronechain_user')
    navigate('/login')
  }

  return (
    <div className="relative min-h-screen bg-bg text-white">
      <DashboardNavbar
        name={user.name ?? 'Operator'}
        meta={meta}
        verified={!!user.verified}
        initials={initials}
        onLogout={handleLogout}
      />

      <div className="flex pt-[64px]">
        <Sidebar
          role={role}
          name={user.name ?? 'Operator'}
          email={user.email ?? ''}
          meta={meta}
          initials={initials}
          onLogout={handleLogout}
        />

        <main className="flex-1 min-w-0 lg:pl-[240px]">
          <div className="max-w-[1400px] mx-auto px-5 sm:px-8 pb-24 pt-8">
            {!user.verified && (
              <VerificationBanner onClick={() => navigate('/verification')} />
            )}

            <WelcomeHeader name={user.name ?? 'Operator'} role={role} />

            {role === 'authority' ? (
              <AuthorityView navigate={navigate} />
            ) : role === 'pilot' ? (
              <PilotView name={user.name ?? 'Operator'} navigate={navigate} />
            ) : (
              <OwnerView navigate={navigate} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

function DashboardNavbar({
  name,
  meta,
  verified,
  initials,
  onLogout,
}: {
  name: string
  meta: { label: string; color: string }
  verified: boolean
  initials: string
  onLogout: () => void
}) {
  const navigate = useNavigate()
  return (
    <header
      className="fixed top-0 inset-x-0 z-40 h-[64px]"
      style={{
        background: 'rgba(10,15,26,0.85)',
        backdropFilter: 'blur(20px) saturate(140%)',
        WebkitBackdropFilter: 'blur(20px) saturate(140%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      <div className="h-full max-w-[1600px] mx-auto px-5 sm:px-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="flex items-center gap-2.5"
          style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }}
        >
          <span className="text-xl" aria-hidden>🚁</span>
          <span className="font-inter font-extrabold tracking-tight text-[15px] text-primary">
            DroneChain
          </span>
        </button>

        <div className="flex items-center gap-3">
          {verified ? (
            <span
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
              style={{
                background: 'rgba(16,185,129,0.12)',
                border: '1px solid rgba(16,185,129,0.35)',
                color: '#10B981',
              }}
            >
              <BadgeCheck className="w-3.5 h-3.5" />
              Verified
            </span>
          ) : (
            <span
              className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
              style={{
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.3)',
                color: '#F59E0B',
              }}
            >
              <Shield className="w-3.5 h-3.5" />
              Unverified
            </span>
          )}

          <div className="flex items-center gap-2.5 pl-2 pr-1 py-1 rounded-full border border-white/10">
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold tracking-wide text-white"
              style={{ background: meta.color }}
              aria-hidden
            >
              {initials}
            </span>
            <div className="hidden sm:block leading-tight pr-1">
              <div className="text-sm text-white/90 truncate max-w-[160px]">{name}</div>
              <div
                className="text-[10px] uppercase tracking-wider"
                style={{ color: meta.color }}
              >
                {meta.label}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-white/80 hover:text-white border border-white/10 hover:border-white/25 hover:bg-white/[0.05] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  )
}

type NavItem = {
  to: string
  label: string
  emoji: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
}

function navItemsFor(role: string): { primary: NavItem[]; secondary: NavItem[] } {
  const primary: NavItem[] = [
    { to: '/dashboard', label: 'Dashboard', emoji: '🏠', icon: Home },
    { to: '/monitor', label: 'Live Monitor', emoji: '📡', icon: Radio },
    { to: '/explorer', label: 'Explorer', emoji: '🔍', icon: Search },
    { to: '/analytics', label: 'Analytics', emoji: '📊', icon: BarChart3 },
  ]
  let secondary: NavItem[] = []
  if (role === 'owner') {
    secondary = [
      { to: '/register', label: 'My Drones', emoji: '🚁', icon: Compass },
      { to: '/flights', label: 'Log Flight', emoji: '🛫', icon: Activity },
      { to: '/transfer', label: 'Transfer', emoji: '🔄', icon: Repeat },
    ]
  } else if (role === 'pilot') {
    secondary = [
      { to: '/flights', label: 'My Flights', emoji: '🛫', icon: Activity },
      { to: '/license', label: 'My License', emoji: '📜', icon: FileText },
    ]
  } else if (role === 'authority') {
    secondary = [
      { to: '/authority', label: 'Command Center', emoji: '🏛️', icon: Building },
      { to: '/violations', label: 'Violations', emoji: '⚠️', icon: Siren },
      { to: '/reports', label: 'Reports', emoji: '📋', icon: ClipboardList },
    ]
  }
  return { primary, secondary }
}

function Sidebar({
  role,
  name,
  email,
  meta,
  initials,
  onLogout,
}: {
  role: string
  name: string
  email: string
  meta: { label: string; color: string; emoji: string }
  initials: string
  onLogout: () => void
}) {
  const location = useLocation()
  const { primary, secondary } = navItemsFor(role)
  const navigate = useNavigate()

  return (
    <aside
      className="hidden lg:flex flex-col fixed left-0 top-[64px] bottom-0 z-30"
      style={{
        width: '240px',
        background: '#111827',
        borderRight: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div className="flex-1 overflow-y-auto px-3 py-6">
        <SidebarSection>
          {primary.map((item) => (
            <SidebarLink
              key={item.to}
              item={item}
              active={location.pathname === item.to}
              roleColor={meta.color}
              onClick={() => navigate(item.to)}
            />
          ))}
        </SidebarSection>

        {secondary.length > 0 && (
          <>
            <SidebarHeading>{meta.label}</SidebarHeading>
            <SidebarSection>
              {secondary.map((item) => (
                <SidebarLink
                  key={item.to}
                  item={item}
                  active={location.pathname === item.to}
                  roleColor={meta.color}
                  onClick={() => navigate(item.to)}
                />
              ))}
            </SidebarSection>
          </>
        )}
      </div>

      <div className="px-3 pb-4 pt-3 border-t border-white/5">
        <div
          className="rounded-xl p-3"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div className="flex items-center gap-3">
            <span
              className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold tracking-wide text-white"
              style={{ background: meta.color }}
              aria-hidden
            >
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-inter font-semibold text-white text-[13px] truncate">
                {name}
              </div>
              <div className="text-[11px] text-white/45 truncate">{email}</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-white/75 hover:text-white hover:bg-white/[0.05] transition-colors"
            >
              <Settings className="w-3.5 h-3.5" />
              Settings
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-white/75 hover:text-danger hover:bg-danger/[0.08] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </aside>
  )
}

function SidebarSection({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-0.5">{children}</ul>
}

function SidebarHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 mb-2 px-3 text-[10px] uppercase tracking-[0.2em] text-white/35 font-semibold">
      {children}
    </div>
  )
}

function SidebarLink({
  item,
  active,
  roleColor,
  onClick,
}: {
  item: NavItem
  active: boolean
  roleColor: string
  onClick: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="group relative w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-[background,color] duration-150"
        style={{
          color: active ? '#fff' : 'rgba(255,255,255,0.7)',
          background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
          if (!active) e.currentTarget.style.color = '#fff'
        }}
        onMouseLeave={(e) => {
          if (!active) e.currentTarget.style.background = 'transparent'
          if (!active) e.currentTarget.style.color = 'rgba(255,255,255,0.7)'
        }}
      >
        {active && (
          <span
            className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
            style={{ background: roleColor }}
          />
        )}
        <span className="text-[15px] w-5 text-center" aria-hidden>
          {item.emoji}
        </span>
        <span className="flex-1 text-left">{item.label}</span>
      </button>
    </li>
  )
}

function VerificationBanner({ onClick }: { onClick: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
      role="alert"
      className="mb-6 flex items-start sm:items-center justify-between gap-4 flex-col sm:flex-row"
      style={{
        background: 'rgba(245,158,11,0.1)',
        border: '1px solid rgba(245,158,11,0.3)',
        borderRadius: '12px',
        padding: '16px 24px',
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5"
          style={{
            background: 'rgba(245,158,11,0.15)',
            border: '1px solid rgba(245,158,11,0.35)',
          }}
          aria-hidden
        >
          <AlertTriangle className="w-4 h-4 text-warning" />
        </div>
        <div>
          <div className="font-inter font-semibold text-white">
            Your account is pending verification
          </div>
          <div className="mt-0.5 text-sm text-white/65">
            Complete verification to unlock full access.
          </div>
        </div>
      </div>
      <button
        type="button"
        onClick={onClick}
        className="group shrink-0 inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-[background,transform] duration-200 active:scale-[0.98]"
        style={{ background: '#F59E0B', color: '#0a0f1a' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#FBBF24')}
        onMouseLeave={(e) => (e.currentTarget.style.background = '#F59E0B')}
      >
        Complete Verification
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
      </button>
    </motion.div>
  )
}

function WelcomeHeader({ name, role }: { name: string; role: string }) {
  const greeting = useMemo(() => timeOfDay(), [])
  const date = useMemo(() => formatDate(), [])
  const meta = ROLE_META[role] ?? ROLE_META.owner
  const firstName = name.split(' ')[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
      className="flex items-end justify-between gap-4 flex-wrap"
    >
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-white/40">
          {meta.emoji} {meta.label}
        </div>
        <h1
          className="mt-1.5 font-inter font-black text-white tracking-tight text-balance"
          style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)', lineHeight: 1.05 }}
        >
          {greeting}, {firstName} 👋
        </h1>
        <p className="mt-1 text-white/55">
          Here&apos;s your DroneChain overview.
        </p>
      </div>
      <div className="text-sm text-white/45 tabular-nums">{date}</div>
    </motion.div>
  )
}

function useCountUp(target: number, duration = 1400, start = true) {
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

function StatCard({
  emoji,
  icon: Icon,
  label,
  value,
  decimals = 0,
  suffix = '',
  accent,
  delay = 0,
  pulse,
  hint,
}: {
  emoji: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  label: string
  value: number
  decimals?: number
  suffix?: string
  accent: string
  delay?: number
  pulse?: boolean
  hint?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const count = useCountUp(value, 1400, inView)

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 14 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: EASE_OUT_EXPO }}
      whileHover={{ y: -4 }}
      className="relative glass p-5 group transition-[border-color,box-shadow] duration-300 hover:shadow-[0_24px_60px_-24px_rgba(0,0,0,0.6)]"
      style={{ borderColor: 'rgba(255,255,255,0.08)' }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}99, transparent)`,
        }}
      />
      <div className="flex items-start justify-between gap-2">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
          style={{
            background: `${accent}14`,
            border: `1px solid ${accent}33`,
          }}
          aria-hidden
        >
          {emoji}
        </div>
        <Icon className="w-4 h-4" style={{ color: accent }} />
      </div>
      <div className="mt-5 flex items-baseline gap-1">
        <span
          className="font-inter font-black text-white tracking-tight tabular-nums"
          style={{ fontSize: 'clamp(1.75rem, 2.4vw, 2.25rem)', lineHeight: 1 }}
        >
          {count.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          })}
        </span>
        {suffix && (
          <span className="font-inter font-bold text-white/65 text-lg">{suffix}</span>
        )}
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs text-white/55">
        {pulse && (
          <span className="relative inline-flex w-1.5 h-1.5">
            <span
              className="absolute inset-0 rounded-full"
              style={{ background: accent }}
            />
            <span
              className="absolute -inset-1 rounded-full pulse-ring"
              style={{ background: `${accent}66` }}
            />
          </span>
        )}
        <span>{label}</span>
      </div>
      {hint && <div className="mt-1 text-[11px] text-white/35">{hint}</div>}
    </motion.div>
  )
}

function StatGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-8 grid gap-4 grid-cols-2 lg:grid-cols-4">{children}</div>
  )
}

function SectionHeader({
  title,
  action,
  hint,
}: {
  title: string
  action?: React.ReactNode
  hint?: string
}) {
  return (
    <div className="flex items-end justify-between gap-3 flex-wrap">
      <div>
        <h2 className="font-inter font-bold text-white text-lg tracking-tight">
          {title}
        </h2>
        {hint && <p className="mt-0.5 text-sm text-white/50">{hint}</p>}
      </div>
      {action}
    </div>
  )
}

type QuickAction = {
  emoji: string
  title: string
  to: string
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>
  primary?: boolean
}

function QuickActions({
  actions,
  navigate,
}: {
  actions: QuickAction[]
  navigate: (to: string) => void
}) {
  return (
    <div className="mt-4 grid gap-3 grid-cols-2 lg:grid-cols-4">
      {actions.map((a, i) => (
        <motion.button
          key={a.to + a.title}
          type="button"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.05, ease: EASE_OUT_EXPO }}
          whileHover={{ y: -3 }}
          onClick={() => navigate(a.to)}
          className="group text-left p-4 rounded-2xl flex items-center gap-3 transition-[border-color,background] duration-200"
          style={{
            background: a.primary
              ? 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)'
              : 'rgba(17,24,39,0.85)',
            border: `1px solid ${a.primary ? 'rgba(59,130,246,0.6)' : 'rgba(255,255,255,0.08)'}`,
            boxShadow: a.primary
              ? '0 14px 30px -16px rgba(59,130,246,0.6)'
              : 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => {
            if (!a.primary)
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'
          }}
          onMouseLeave={(e) => {
            if (!a.primary)
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{
              background: a.primary
                ? 'rgba(255,255,255,0.16)'
                : 'rgba(255,255,255,0.04)',
              border: `1px solid ${a.primary ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}`,
            }}
            aria-hidden
          >
            {a.emoji}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-inter font-semibold text-white text-sm">{a.title}</div>
          </div>
          <ArrowUpRight
            className="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
            style={{ color: a.primary ? '#fff' : 'rgba(255,255,255,0.45)' }}
          />
        </motion.button>
      ))}
    </div>
  )
}

const STATUS_META: Record<
  string,
  { label: string; color: string; dot: string }
> = {
  active: { label: 'Active', color: '#10B981', dot: '🟢' },
  grounded: { label: 'Grounded', color: '#9CA3AF', dot: '⚫' },
  violation: { label: 'Violation', color: '#EF4444', dot: '🔴' },
}

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? STATUS_META.grounded
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{
        background: `${m.color}14`,
        border: `1px solid ${m.color}33`,
        color: m.color,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ background: m.color }}
      />
      {m.label}
    </span>
  )
}

function ComplianceMeter({ value }: { value: number }) {
  const color = value >= 95 ? '#10B981' : value >= 80 ? '#F59E0B' : '#EF4444'
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 1.1, ease: EASE_OUT_QUART }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <span className="text-xs tabular-nums text-white/80 w-10 text-right">{value}%</span>
    </div>
  )
}

function OwnerView({ navigate }: { navigate: (to: string) => void }) {
  const drones = OWNER_DRONES
  const flights = OWNER_FLIGHTS

  return (
    <>
      <StatGrid>
        <StatCard
          emoji="🚁"
          icon={Compass}
          value={3}
          label="Registered Drones"
          accent="#3B82F6"
          delay={0}
        />
        <StatCard
          emoji="📡"
          icon={Radio}
          value={1}
          label="Currently Flying"
          accent="#10B981"
          delay={0.06}
          pulse
          hint="Live broadcast"
        />
        <StatCard
          emoji="🛫"
          icon={Activity}
          value={47}
          label="Flights Logged"
          accent="#A855F7"
          delay={0.12}
        />
        <StatCard
          emoji="✅"
          icon={CheckCircle}
          value={98}
          suffix="%"
          label="Compliance Rate"
          accent="#10B981"
          delay={0.18}
          hint="Last 30 days"
        />
      </StatGrid>

      <section className="mt-12">
        <SectionHeader title="Quick actions" hint="Jump into common workflows." />
        <QuickActions
          navigate={navigate}
          actions={[
            { emoji: '🚁', title: 'Register New Drone', to: '/register', icon: Plus, primary: true },
            { emoji: '📡', title: 'View Live Monitor', to: '/monitor', icon: Radio },
            { emoji: '🛫', title: 'Log a Flight', to: '/flights', icon: Activity },
            { emoji: '📊', title: 'View Analytics', to: '/analytics', icon: BarChart3 },
          ]}
        />
      </section>

      <section className="mt-12">
        <SectionHeader
          title="My registered drones"
          action={
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="group inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white bg-primary hover:bg-[#2563EB] transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add New
            </button>
          }
        />
        <DronesTable drones={drones} />
      </section>

      <section className="mt-12">
        <SectionHeader title="Recent flight activity" hint="Last 5 flights logged on-chain." />
        <FlightsList flights={flights} />
      </section>
    </>
  )
}

const OWNER_DRONES = [
  {
    id: 'DRN-2026-001',
    model: 'DJI Mavic 3 Pro',
    emoji: '🚁',
    status: 'active',
    compliance: 98,
    lastFlight: 'Today',
  },
  {
    id: 'DRN-2026-002',
    model: 'DJI Mini 3',
    emoji: '🚁',
    status: 'active',
    compliance: 100,
    lastFlight: 'Yesterday',
  },
  {
    id: 'DRN-2026-003',
    model: 'Parrot Anafi',
    emoji: '🛸',
    status: 'grounded',
    compliance: 92,
    lastFlight: '3 days ago',
  },
] as const

const OWNER_FLIGHTS = [
  {
    drone: 'DRN-2026-001',
    location: 'Chandigarh, Punjab',
    duration: '45 min',
    compliant: true,
    when: 'Today, 2:30 PM',
  },
  {
    drone: 'DRN-2026-002',
    location: 'Sukhna Lake',
    duration: '22 min',
    compliant: true,
    when: 'Yesterday, 6:10 PM',
  },
  {
    drone: 'DRN-2026-001',
    location: 'Rock Garden',
    duration: '38 min',
    compliant: true,
    when: 'Apr 23, 4:15 PM',
  },
  {
    drone: 'DRN-2026-003',
    location: 'Sector 17',
    duration: '12 min',
    compliant: false,
    when: 'Apr 22, 11:00 AM',
  },
  {
    drone: 'DRN-2026-001',
    location: 'Elante Mall',
    duration: '54 min',
    compliant: true,
    when: 'Apr 21, 9:45 AM',
  },
]

function DronesTable({ drones }: { drones: readonly typeof OWNER_DRONES[number][] }) {
  return (
    <div className="mt-4 glass overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.15em] text-white/40 border-b border-white/[0.06]">
              <th className="font-medium px-5 py-3">Drone ID</th>
              <th className="font-medium px-5 py-3">Model</th>
              <th className="font-medium px-5 py-3">Status</th>
              <th className="font-medium px-5 py-3">Compliance</th>
              <th className="font-medium px-5 py-3">Last Flight</th>
              <th className="font-medium px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {drones.map((d, i) => (
              <motion.tr
                key={d.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: EASE_OUT_EXPO }}
                className="border-b border-white/[0.04] last:border-0 transition-colors hover:bg-white/[0.025]"
              >
                <td className="px-5 py-4 font-mono text-[13px] text-white/85">{d.id}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="text-base" aria-hidden>{d.emoji}</span>
                    <span className="text-white/90">{d.model}</span>
                  </div>
                </td>
                <td className="px-5 py-4"><StatusBadge status={d.status} /></td>
                <td className="px-5 py-4"><ComplianceMeter value={d.compliance} /></td>
                <td className="px-5 py-4 text-white/65">{d.lastFlight}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2 justify-end">
                    <TableActionButton>View</TableActionButton>
                    <TableActionButton>Track</TableActionButton>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function TableActionButton({
  children,
  onClick,
  tone = 'default',
}: {
  children: React.ReactNode
  onClick?: () => void
  tone?: 'default' | 'danger' | 'primary'
}) {
  const colors =
    tone === 'danger'
      ? { color: '#EF4444', border: 'rgba(239,68,68,0.3)', bg: 'rgba(239,68,68,0.06)' }
      : tone === 'primary'
        ? { color: '#3B82F6', border: 'rgba(59,130,246,0.3)', bg: 'rgba(59,130,246,0.06)' }
        : { color: 'rgba(255,255,255,0.85)', border: 'rgba(255,255,255,0.1)', bg: 'rgba(255,255,255,0.02)' }
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2.5 py-1 rounded-md text-xs font-medium transition-[border-color,background] duration-150"
      style={{ color: colors.color, border: `1px solid ${colors.border}`, background: colors.bg }}
    >
      {children}
    </button>
  )
}

function FlightsList({ flights }: { flights: typeof OWNER_FLIGHTS }) {
  return (
    <ul className="mt-4 glass divide-y divide-white/[0.04] overflow-hidden">
      {flights.map((f, i) => (
        <motion.li
          key={i}
          initial={{ opacity: 0, x: -6 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: i * 0.04, ease: EASE_OUT_EXPO }}
          className="flex items-center gap-3 sm:gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02]"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
            style={{
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.25)',
            }}
            aria-hidden
          >
            🛫
          </div>
          <div className="flex-1 min-w-0 grid sm:grid-cols-[140px_1fr_80px_110px] gap-1 sm:gap-4 items-center">
            <div className="font-mono text-[13px] text-white/90">{f.drone}</div>
            <div className="text-sm text-white/75 truncate">{f.location}</div>
            <div className="text-xs text-white/55 tabular-nums">{f.duration}</div>
            <div>
              {f.compliant ? (
                <span className="inline-flex items-center gap-1 text-xs text-success">
                  <CheckCircle className="w-3.5 h-3.5" /> Compliant
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-danger">
                  <AlertTriangle className="w-3.5 h-3.5" /> Violation
                </span>
              )}
            </div>
          </div>
          <div className="text-xs text-white/45 hidden sm:block">{f.when}</div>
        </motion.li>
      ))}
    </ul>
  )
}

function AuthorityView({ navigate }: { navigate: (to: string) => void }) {
  const violations = AUTHORITY_VIOLATIONS

  return (
    <>
      <StatGrid>
        <StatCard
          emoji="📡"
          icon={Radio}
          value={23}
          label="Active Drones"
          accent="#3B82F6"
          delay={0}
          pulse
          hint="Currently airborne"
        />
        <StatCard
          emoji="⚠️"
          icon={Siren}
          value={3}
          label="Violations Today"
          accent="#EF4444"
          delay={0.06}
          hint="Action required"
        />
        <StatCard
          emoji="📋"
          icon={ClipboardList}
          value={12}
          label="Pending Approvals"
          accent="#F59E0B"
          delay={0.12}
          hint="Reviews queued"
        />
        <StatCard
          emoji="✅"
          icon={CheckCircle}
          value={99.8}
          decimals={1}
          suffix="%"
          label="Compliance Rate"
          accent="#10B981"
          delay={0.18}
        />
      </StatGrid>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25, ease: EASE_OUT_EXPO }}
        className="mt-8 flex items-center justify-between gap-4 flex-wrap"
        style={{
          background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(239,68,68,0.04) 100%)',
          border: '1px solid rgba(239,68,68,0.35)',
          borderRadius: '14px',
          padding: '18px 22px',
        }}
        role="alert"
      >
        <div className="flex items-start gap-3">
          <div
            className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center mt-0.5"
            style={{
              background: 'rgba(239,68,68,0.18)',
              border: '1px solid rgba(239,68,68,0.4)',
            }}
            aria-hidden
          >
            <Siren className="w-4 h-4 text-danger" />
          </div>
          <div>
            <div className="font-inter font-bold text-white">
              3 active violations need attention
            </div>
            <div className="mt-0.5 text-sm text-white/65">
              Two altitude breaches and one missing Remote ID flagged in the last hour.
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => navigate('/violations')}
          className="group inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white bg-danger hover:bg-[#dc2626] transition-colors"
        >
          View Violations
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
      </motion.div>

      <section className="mt-12">
        <SectionHeader title="Quick actions" hint="Authority operations." />
        <QuickActions
          navigate={navigate}
          actions={[
            { emoji: '🗺️', title: 'Open Command Center', to: '/monitor', icon: MapIcon, primary: true },
            { emoji: '⚠️', title: 'View Violations', to: '/violations', icon: Siren },
            { emoji: '✅', title: 'Process Approvals', to: '/approvals', icon: BadgeCheck },
            { emoji: '📊', title: 'Generate Report', to: '/analytics', icon: BarChart3 },
          ]}
        />
      </section>

      <section className="mt-12">
        <SectionHeader title="Recent violations" hint="Last actions taken on-chain." />
        <ViolationsTable violations={violations} />
      </section>
    </>
  )
}

const AUTHORITY_VIOLATIONS = [
  {
    id: 'VIO-2026-001',
    drone: 'DRN-2026-004',
    type: 'Altitude exceeded',
    severity: 'high',
    action: 'Action needed',
    when: '12 min ago',
  },
  {
    id: 'VIO-2026-002',
    drone: 'DRN-2026-003',
    type: 'No Remote ID broadcast',
    severity: 'medium',
    action: 'Fine sent',
    when: '47 min ago',
  },
] as const

function ViolationsTable({
  violations,
}: {
  violations: readonly typeof AUTHORITY_VIOLATIONS[number][]
}) {
  return (
    <div className="mt-4 glass overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.15em] text-white/40 border-b border-white/[0.06]">
              <th className="font-medium px-5 py-3">Violation ID</th>
              <th className="font-medium px-5 py-3">Drone</th>
              <th className="font-medium px-5 py-3">Type</th>
              <th className="font-medium px-5 py-3">Severity</th>
              <th className="font-medium px-5 py-3">Action</th>
              <th className="font-medium px-5 py-3 text-right">Time</th>
            </tr>
          </thead>
          <tbody>
            {violations.map((v, i) => (
              <motion.tr
                key={v.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.05, ease: EASE_OUT_EXPO }}
                className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.025] transition-colors"
              >
                <td className="px-5 py-4 font-mono text-[13px] text-white/85">{v.id}</td>
                <td className="px-5 py-4 font-mono text-[13px] text-white/70">{v.drone}</td>
                <td className="px-5 py-4 text-white/85">{v.type}</td>
                <td className="px-5 py-4">
                  <SeverityBadge severity={v.severity} />
                </td>
                <td className="px-5 py-4">
                  {v.action === 'Action needed' ? (
                    <TableActionButton tone="danger">Action needed</TableActionButton>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-white/65">
                      <CheckCircle className="w-3.5 h-3.5" />
                      {v.action}
                    </span>
                  )}
                </td>
                <td className="px-5 py-4 text-right text-xs text-white/45">{v.when}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function SeverityBadge({ severity }: { severity: string }) {
  const m =
    severity === 'high'
      ? { label: 'High', color: '#EF4444', dot: '🔴' }
      : severity === 'medium'
        ? { label: 'Medium', color: '#F59E0B', dot: '🟡' }
        : { label: 'Low', color: '#10B981', dot: '🟢' }
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium"
      style={{
        background: `${m.color}14`,
        border: `1px solid ${m.color}33`,
        color: m.color,
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: m.color }} />
      {m.label}
    </span>
  )
}

function PilotView({
  name,
  navigate,
}: {
  name: string
  navigate: (to: string) => void
}) {
  return (
    <>
      <StatGrid>
        <StatCard
          emoji="⏱️"
          icon={Activity}
          value={127}
          suffix="h"
          label="Total Flight Hours"
          accent="#F59E0B"
          delay={0}
        />
        <StatCard
          emoji="🛫"
          icon={Compass}
          value={12}
          label="Flights This Month"
          accent="#3B82F6"
          delay={0.06}
        />
        <StatCard
          emoji="📜"
          icon={FileText}
          value={1}
          label="License Status: Valid"
          accent="#10B981"
          delay={0.12}
          hint="Expires Dec 2026"
        />
        <StatCard
          emoji="✅"
          icon={CheckCircle}
          value={100}
          suffix="%"
          label="Compliance"
          accent="#10B981"
          delay={0.18}
        />
      </StatGrid>

      <section className="mt-12 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <SectionHeader title="Recent flights" hint="Last 5 logged on-chain." />
          <FlightsList flights={OWNER_FLIGHTS.slice(0, 5)} />
        </div>
        <div>
          <SectionHeader title="Pilot license" />
          <LicenseCard name={name} navigate={navigate} />
        </div>
      </section>
    </>
  )
}

function LicenseCard({
  name,
  navigate: _navigate,
}: {
  name: string
  navigate: (to: string) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.1, ease: EASE_OUT_EXPO }}
      className="mt-4 relative overflow-hidden"
      style={{
        background:
          'linear-gradient(135deg, rgba(245,158,11,0.12) 0%, rgba(17,24,39,0.95) 55%, rgba(59,130,246,0.08) 100%)',
        border: '1px solid rgba(245,158,11,0.3)',
        borderRadius: '18px',
        padding: '22px',
        boxShadow: '0 30px 60px -30px rgba(245,158,11,0.4)',
      }}
    >
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent, rgba(245,158,11,0.6), transparent)',
        }}
      />
      <div className="flex items-center justify-between">
        <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-warning font-semibold">
          <FileText className="w-4 h-4" />
          Pilot License
        </div>
        <Sparkles className="w-4 h-4 text-warning/70" />
      </div>
      <div className="mt-5">
        <div className="text-xs uppercase tracking-wider text-white/40">Holder</div>
        <div className="mt-1 font-inter font-bold text-white text-lg">{name}</div>
      </div>
      <dl className="mt-5 space-y-2.5 text-sm">
        <LicRow label="Number" value="IND-DGCA-2025-4521" mono />
        <LicRow label="Expiry" value="December 2026" />
        <LicRow
          label="Status"
          value={
            <span className="inline-flex items-center gap-1.5 text-success">
              <CheckCircle className="w-3.5 h-3.5" /> Valid
            </span>
          }
        />
        <LicRow label="Class" value="Small UAS · 250g – 25kg" />
      </dl>
      <button
        type="button"
        onClick={() =>
          window.alert(
            'License download coming soon — this is a demo certificate.',
          )
        }
        className="group mt-6 w-full inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white/90 hover:text-white border border-white/15 hover:border-white/30 hover:bg-white/[0.06] transition-colors"
      >
        <Download className="w-4 h-4" />
        Download License
      </button>
      <button
        type="button"
        onClick={() =>
          window.alert('Verifier link coming soon.')
        }
        className="mt-2 inline-flex items-center gap-1.5 text-xs text-warning hover:underline underline-offset-4"
      >
        Verify on Solana
        <ExternalLink className="w-3 h-3" />
      </button>
    </motion.div>
  )
}

function LicRow({
  label,
  value,
  mono,
}: {
  label: string
  value: React.ReactNode
  mono?: boolean
}) {
  return (
    <div className="grid grid-cols-[90px_1fr] gap-3 items-center">
      <dt className="text-[11px] uppercase tracking-wider text-white/45">{label}</dt>
      <dd
        className={`text-white/95 font-medium ${mono ? 'font-mono text-[13px] tracking-tight' : ''}`}
      >
        {value}
      </dd>
    </div>
  )
}

