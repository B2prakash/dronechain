import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'motion/react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Activity,
  ArrowLeft,
  Globe,
  Shield,
  TrendingUp,
  Trophy,
} from 'lucide-react'

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

type RangeKey = '7d' | '30d' | '3m' | '1y'

const monthlyData = [
  { month: 'Nov', registrations: 45, flights: 234, violations: 3, compliance: 99.4 },
  { month: 'Dec', registrations: 67, flights: 312, violations: 5, compliance: 99.0 },
  { month: 'Jan', registrations: 89, flights: 445, violations: 2, compliance: 99.6 },
  { month: 'Feb', registrations: 123, flights: 567, violations: 8, compliance: 98.7 },
  { month: 'Mar', registrations: 156, flights: 678, violations: 4, compliance: 99.5 },
  { month: 'Apr', registrations: 198, flights: 789, violations: 3, compliance: 99.8 },
]

const stateData = [
  { state: 'Maharashtra', drones: 234 },
  { state: 'Delhi', drones: 189 },
  { state: 'Karnataka', drones: 167 },
  { state: 'Punjab', drones: 145 },
  { state: 'Tamil Nadu', drones: 123 },
  { state: 'Gujarat', drones: 98 },
]

const modelData = [
  { name: 'DJI Mavic', value: 423, color: '#3B82F6' },
  { name: 'DJI Mini', value: 312, color: '#10B981' },
  { name: 'DJI Phantom', value: 234, color: '#F59E0B' },
  { name: 'Parrot', value: 156, color: '#8B5CF6' },
  { name: 'Others', value: 122, color: '#6B7280' },
]

const purposeData = [
  { name: 'Photography', value: 445, color: '#3B82F6' },
  { name: 'Survey', value: 234, color: '#10B981' },
  { name: 'Delivery', value: 123, color: '#F59E0B' },
  { name: 'Agriculture', value: 89, color: '#8B5CF6' },
  { name: 'Hobby', value: 356, color: '#EF4444' },
]

const leaderboard = [
  { rank: 1, owner: 'Sneha Gupta', drones: 2, flights: 67, compliance: 100 },
  { rank: 2, owner: 'Rahul Sharma', drones: 1, flights: 123, compliance: 100 },
  { rank: 3, owner: 'Vedprakash Singh', drones: 3, flights: 47, compliance: 98 },
  { rank: 4, owner: 'Priya Patel', drones: 1, flights: 31, compliance: 92 },
  { rank: 5, owner: 'Amit Kumar', drones: 1, flights: 8, compliance: 45 },
]

const RANGES: { key: RangeKey; label: string }[] = [
  { key: '7d', label: '7 days' },
  { key: '30d', label: '30 days' },
  { key: '3m', label: '3 months' },
  { key: '1y', label: '1 year' },
]

function useCountUp(target: number, durationMs = 900) {
  const [v, setV] = useState(0)
  useEffect(() => {
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 4)
      setV(Math.round(target * eased))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])
  return v
}

const TOOLTIP_STYLE = {
  background: '#111827',
  border: '1px solid rgba(255,255,255,0.08)',
  borderRadius: 12,
  color: '#F9FAFB',
  fontSize: 12,
  padding: '8px 10px',
}

export default function Analytics() {
  const navigate = useNavigate()
  const [range, setRange] = useState<RangeKey>('30d')

  const ranged = useMemo(() => {
    const slice =
      range === '7d'
        ? monthlyData.slice(-2)
        : range === '30d'
          ? monthlyData.slice(-3)
          : range === '3m'
            ? monthlyData.slice(-3)
            : monthlyData
    return slice
  }, [range])

  const totalRegistered = useCountUp(1247)
  const totalFlights = useCountUp(47832)
  const compliance = useCountUp(998)
  const activeToday = useCountUp(234)

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-bg text-white">
      <div className="pointer-events-none absolute inset-0 grid-bg radial-fade opacity-25" />

      <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Header navigate={navigate} />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <TopStat
            icon={<TrendingUp className="w-4 h-4" />}
            label="Total registered"
            value={totalRegistered.toLocaleString()}
            color="#3B82F6"
          />
          <TopStat
            icon={<Activity className="w-4 h-4" />}
            label="Total flights"
            value={totalFlights.toLocaleString()}
            color="#10B981"
          />
          <TopStat
            icon={<Shield className="w-4 h-4" />}
            label="Compliance rate"
            value={`${(compliance / 10).toFixed(1)}%`}
            color="#10B981"
          />
          <TopStat
            icon={<TrendingUp className="w-4 h-4" />}
            label="Active today"
            value={activeToday.toLocaleString()}
            color="#3B82F6"
          />
        </div>

        <div className="mt-5 flex items-center gap-1.5 flex-wrap">
          {RANGES.map((r) => {
            const active = r.key === range
            return (
              <button
                key={r.key}
                type="button"
                onClick={() => setRange(r.key)}
                className="inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-[12.5px] font-semibold transition-colors"
                style={{
                  background: active ? 'rgba(59,130,246,0.18)' : 'rgba(17,24,39,0.6)',
                  border: `1px solid ${active ? 'rgba(59,130,246,0.55)' : 'rgba(255,255,255,0.08)'}`,
                  color: active ? '#FFFFFF' : 'rgba(255,255,255,0.65)',
                }}
              >
                {r.label}
              </button>
            )
          })}
        </div>

        <ChartCard title="Monthly drone registrations" icon={<TrendingUp className="w-4 h-4" />}>
          <div className="h-[260px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ranged} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.45)" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.45)" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} width={36} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: 'rgba(59,130,246,0.4)', strokeWidth: 1 }} />
                <Line
                  type="monotone"
                  dataKey="registrations"
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  dot={{ fill: '#3B82F6', r: 4, strokeWidth: 0 }}
                  activeDot={{ fill: '#3B82F6', r: 6, stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="mt-5 grid lg:grid-cols-2 gap-5">
          <ChartCard title="Drones by state" icon={<Globe className="w-4 h-4" />}>
            <div className="h-[260px] -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stateData} layout="vertical" margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" stroke="rgba(255,255,255,0.45)" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
                  <YAxis dataKey="state" type="category" stroke="rgba(255,255,255,0.45)" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} width={92} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: 'rgba(59,130,246,0.08)' }} />
                  <Bar dataKey="drones" fill="#3B82F6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ChartCard>

          <ChartCard title="Popular drone models" icon={<TrendingUp className="w-4 h-4" />}>
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={modelData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {modelData.map((m) => (
                      <Cell key={m.name} fill={m.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid gap-1.5">
                {modelData.map((m) => {
                  const total = modelData.reduce((a, b) => a + b.value, 0)
                  const pct = ((m.value / total) * 100).toFixed(0)
                  return (
                    <div key={m.name} className="flex items-center gap-2 text-[12px] text-white/75">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: m.color }} />
                      <span className="flex-1 truncate">{m.name}</span>
                      <span className="text-white/55 tabular-nums">{m.value}</span>
                      <span className="text-white/40 tabular-nums w-9 text-right">{pct}%</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </ChartCard>
        </div>

        <ChartCard title="Daily flight activity" icon={<Activity className="w-4 h-4" />}>
          <div className="h-[260px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ranged} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.45)" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.45)" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} width={36} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: 'rgba(16,185,129,0.4)', strokeWidth: 1 }} />
                <Line
                  type="monotone"
                  dataKey="flights"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ fill: '#10B981', r: 4, strokeWidth: 0 }}
                  activeDot={{ fill: '#10B981', r: 6, stroke: '#fff', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Compliance rate trend" icon={<Shield className="w-4 h-4 text-success" />}>
          <div className="h-[240px] -mx-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ranged} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="comp-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="month" stroke="rgba(255,255,255,0.45)" tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.45)" domain={[97, 100]} tick={{ fill: 'rgba(255,255,255,0.55)', fontSize: 11 }} axisLine={{ stroke: 'rgba(255,255,255,0.08)' }} tickLine={false} width={36} tickFormatter={(v) => `${v}%`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ stroke: 'rgba(16,185,129,0.4)', strokeWidth: 1 }} formatter={(v) => `${v}%`} />
                <Area
                  type="monotone"
                  dataKey="compliance"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fill="url(#comp-fill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <div className="mt-5 grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-5">
          <ChartCard title="Most compliant operators" icon={<Trophy className="w-4 h-4 text-warning" />}>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-[13px] text-left">
                <thead>
                  <tr className="text-white/45 text-[10.5px] uppercase tracking-[0.14em]">
                    <th className="px-2 py-2 font-semibold">Rank</th>
                    <th className="px-2 py-2 font-semibold">Operator</th>
                    <th className="px-2 py-2 font-semibold text-right">Drones</th>
                    <th className="px-2 py-2 font-semibold text-right">Flights</th>
                    <th className="px-2 py-2 font-semibold text-right">Compliance</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((r) => {
                    const c = r.compliance >= 90 ? '#10B981' : r.compliance >= 70 ? '#F59E0B' : '#EF4444'
                    const medal = r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : ''
                    return (
                      <tr key={r.rank} className="border-t border-white/[0.05] text-white/85">
                        <td className="px-2 py-2.5 font-bold tabular-nums">
                          <span className="inline-flex items-center gap-2">
                            <span className="text-base" aria-hidden>
                              {medal || `#${r.rank}`}
                            </span>
                          </span>
                        </td>
                        <td className="px-2 py-2.5">{r.owner}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums">{r.drones}</td>
                        <td className="px-2 py-2.5 text-right tabular-nums">{r.flights}</td>
                        <td className="px-2 py-2.5 text-right">
                          <span
                            className="inline-flex items-center gap-1 text-[12px] font-semibold px-2 py-0.5 rounded-full"
                            style={{
                              background: `${c}1f`,
                              color: c,
                              border: `1px solid ${c}55`,
                            }}
                          >
                            {r.compliance}%
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </ChartCard>

          <ChartCard title="Global stats" icon={<Globe className="w-4 h-4 text-primary" />}>
            <div className="grid gap-2.5">
              <GlobalRow label="Countries using DroneChain" value="47" />
              <GlobalRow label="Total blockchain records" value="48,291" />
              <GlobalRow label="Average compliance" value="99.8%" />
              <GlobalRow label="Violations prevented" value="1,247" />
            </div>
          </ChartCard>
        </div>

        <PurposesCard />
      </div>
    </div>
  )
}

function PurposesCard() {
  return (
    <div className="mt-5">
      <ChartCard title="Flight purpose distribution" icon={<Activity className="w-4 h-4" />}>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-2 h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={purposeData}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={3}
                stroke="none"
              >
                {purposeData.map((p) => (
                  <Cell key={p.name} fill={p.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid gap-1.5">
            {purposeData.map((p) => {
              const total = purposeData.reduce((a, b) => a + b.value, 0)
              const pct = ((p.value / total) * 100).toFixed(0)
              return (
                <div key={p.name} className="flex items-center gap-2 text-[12px] text-white/75">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: p.color }} />
                  <span className="flex-1 truncate">{p.name}</span>
                  <span className="text-white/55 tabular-nums">{p.value}</span>
                  <span className="text-white/40 tabular-nums w-9 text-right">{pct}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </ChartCard>
    </div>
  )
}

function Header({ navigate }: { navigate: ReturnType<typeof useNavigate> }) {
  return (
    <header className="mb-6">
      <button
        type="button"
        onClick={() => navigate('/')}
        className="group inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors mb-3"
      >
        <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
        Home
      </button>
      <h1 className="font-inter font-black tracking-tight text-[28px] sm:text-[32px] leading-tight">
        <span aria-hidden>📊 </span>DroneChain Analytics
      </h1>
      <p className="text-[13.5px] text-white/55 mt-1">
        Real-time blockchain drone statistics, sliced by time, geography, and use case.
      </p>
    </header>
  )
}

function TopStat({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  color: string
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
      className="glass-strong p-4 flex items-center gap-3"
    >
      <span
        className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
        style={{ background: `${color}1f`, color, border: `1px solid ${color}55` }}
      >
        {icon}
      </span>
      <div className="min-w-0">
        <div className="text-[10.5px] uppercase tracking-[0.16em] text-white/45 font-semibold">
          {label}
        </div>
        <div
          className="font-inter font-black tabular-nums tracking-tight"
          style={{ fontSize: '1.5rem', lineHeight: 1.05, color }}
        >
          {value}
        </div>
      </div>
    </motion.div>
  )
}

function ChartCard({
  title,
  icon,
  children,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="mt-5 glass-strong p-5">
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

function GlobalRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
      <span className="text-[12.5px] text-white/65">{label}</span>
      <span className="text-[14px] font-inter font-extrabold text-white tabular-nums tracking-tight">
        {value}
      </span>
    </div>
  )
}
