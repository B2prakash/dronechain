import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'motion/react'
import toast from 'react-hot-toast'
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Copy,
  Download,
  Loader2,
  Lock,
  Plane,
  Repeat,
  Shield,
  Wallet,
} from 'lucide-react'
import { MOCK_DRONES } from '../data/mockDrones'

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const
const EASE_OUT_QUART = [0.25, 1, 0.5, 1] as const

type StepKey = 1 | 2 | 3 | 4

const SIGN_STEPS = [
  'Creating escrow…',
  'Waiting for signatures…',
  'Executing transfer…',
  'Confirming on Solana…',
] as const

function readUser(): { name?: string; email?: string; role?: string } {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem('dronechain_user') || '{}')
  } catch {
    return {}
  }
}

function generateTxHash() {
  const hex = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 44 }, () => hex[Math.floor(Math.random() * hex.length)]).join('')
}

function generateTransferId() {
  return `TRF-2026-${String(Math.floor(Math.random() * 900) + 100)}`
}

export default function OwnershipTransfer() {
  const navigate = useNavigate()
  const user = useMemo(readUser, [])
  const userDrones = useMemo(() => MOCK_DRONES.slice(0, 3), [])

  const [step, setStep] = useState<StepKey>(1)
  const [formData, setFormData] = useState({
    droneId: '',
    buyerWallet: '',
    price: '',
    notes: '',
  })
  const [agreements, setAgreements] = useState({
    walletConfirmed: false,
    irreversible: false,
    terms: false,
  })
  const [signing, setSigning] = useState(false)
  const [signStep, setSignStep] = useState(0)
  const [receipt, setReceipt] = useState<{
    transferId: string
    txHash: string
    block: number
    at: Date
  } | null>(null)

  const selectedDrone = useMemo(
    () => MOCK_DRONES.find((d) => d.id === formData.droneId) ?? null,
    [formData.droneId],
  )

  const set = <K extends keyof typeof formData>(k: K, v: (typeof formData)[K]) =>
    setFormData((f) => ({ ...f, [k]: v }))

  const allAgreed = agreements.walletConfirmed && agreements.irreversible && agreements.terms

  const goNext = () => setStep((s) => Math.min(4, s + 1) as StepKey)
  const goBack = () => setStep((s) => Math.max(1, s - 1) as StepKey)

  const handleSign = async () => {
    if (signing || !allAgreed) return
    setSigning(true)
    for (let i = 0; i < SIGN_STEPS.length; i++) {
      setSignStep(i)
      await new Promise((r) => setTimeout(r, 1000))
    }
    setReceipt({
      transferId: generateTransferId(),
      txHash: generateTxHash(),
      block: 48_291_000 + Math.floor(Math.random() * 1000),
      at: new Date(),
    })
    setSigning(false)
    setStep(4)
    toast.success('Ownership transferred')
  }

  const reset = () => {
    setStep(1)
    setFormData({ droneId: '', buyerWallet: '', price: '', notes: '' })
    setAgreements({ walletConfirmed: false, irreversible: false, terms: false })
    setSigning(false)
    setSignStep(0)
    setReceipt(null)
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

      <div className="relative max-w-[760px] mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <Header navigate={navigate} />
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
              <SelectStep
                drones={userDrones}
                selectedId={formData.droneId}
                onSelect={(id) => set('droneId', id)}
                onContinue={goNext}
              />
            )}
            {step === 2 && selectedDrone && (
              <DetailsStep
                drone={selectedDrone}
                formData={formData}
                set={set}
                onBack={goBack}
                onContinue={goNext}
              />
            )}
            {step === 3 && selectedDrone && (
              <ConfirmStep
                drone={selectedDrone}
                user={user}
                formData={formData}
                agreements={agreements}
                setAgreements={setAgreements}
                signing={signing}
                signStep={signStep}
                onBack={goBack}
                onSign={handleSign}
              />
            )}
            {step === 4 && selectedDrone && receipt && (
              <CompleteStep
                drone={selectedDrone}
                user={user}
                formData={formData}
                receipt={receipt}
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
        <span aria-hidden>🔄 </span>Ownership Transfer
      </h1>
      <p className="text-[13.5px] text-white/55 mt-1">
        Transfer drone ownership via Solana smart contract.
      </p>
    </header>
  )
}

function Stepper({ step }: { step: StepKey }) {
  const labels = ['Select', 'Details', 'Confirm', 'Complete']
  return (
    <div className="grid grid-cols-4 gap-2">
      {labels.map((label, idx) => {
        const i = (idx + 1) as StepKey
        const done = i < step
        const active = i === step
        const color = done ? '#10B981' : active ? '#3B82F6' : 'rgba(255,255,255,0.18)'
        return (
          <div key={label} className="flex flex-col items-start">
            <div className="flex items-center w-full gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0"
                style={{
                  background: done ? color : active ? `${color}1f` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${color}`,
                  color: done ? '#0a0f1a' : color,
                }}
              >
                {done ? <CheckCircle className="w-3.5 h-3.5" /> : i}
              </div>
              {idx < 3 && (
                <div
                  className="flex-1 h-px"
                  style={{ background: i < step ? '#10B981' : 'rgba(255,255,255,0.08)' }}
                />
              )}
            </div>
            <div
              className="mt-1.5 text-[12px] font-semibold"
              style={{ color: active ? '#FFFFFF' : done ? '#10B981' : 'rgba(255,255,255,0.5)' }}
            >
              {label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

type Drone = (typeof MOCK_DRONES)[number]

function SelectStep({
  drones,
  selectedId,
  onSelect,
  onContinue,
}: {
  drones: Drone[]
  selectedId: string
  onSelect: (id: string) => void
  onContinue: () => void
}) {
  return (
    <div className="grid gap-5">
      <Card title="Select drone to transfer" icon={<Plane className="w-4 h-4 text-primary" />}>
        <div className="grid sm:grid-cols-2 gap-3">
          {drones.map((d) => {
            const active = d.id === selectedId
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onSelect(d.id)}
                className="relative rounded-2xl p-4 text-left transition-all"
                style={{
                  background: active ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${active ? 'rgba(59,130,246,0.55)' : 'rgba(255,255,255,0.08)'}`,
                  boxShadow: active ? '0 14px 32px -16px rgba(59,130,246,0.5)' : 'none',
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="font-mono text-[12px] text-white/55">{d.id}</span>
                  {active && <CheckCircle className="w-4 h-4 text-primary" />}
                </div>
                <div className="font-inter font-bold text-[15px] text-white truncate">
                  {d.model}
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 text-[11.5px] text-white/65">
                  <div>
                    <span className="text-white/40">Flights:</span> {d.totalFlights}
                  </div>
                  <div>
                    <span className="text-white/40">Compliance:</span> {d.compliance}%
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <div className="flex items-center justify-between gap-3">
        <div className="text-[12.5px] text-white/55">
          {selectedId ? 'Ready when you are.' : 'Pick the drone whose NFT you want to transfer.'}
        </div>
        <button
          type="button"
          onClick={onContinue}
          disabled={!selectedId}
          className="inline-flex items-center gap-2 h-12 px-6 rounded-full font-semibold text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: selectedId
              ? 'linear-gradient(135deg, rgba(59,130,246,0.95), rgba(99,102,241,0.95))'
              : 'rgba(255,255,255,0.06)',
            boxShadow: selectedId ? '0 12px 32px -10px rgba(59,130,246,0.5)' : 'none',
          }}
        >
          Continue
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function DetailsStep({
  drone,
  formData,
  set,
  onBack,
  onContinue,
}: {
  drone: Drone
  formData: { droneId: string; buyerWallet: string; price: string; notes: string }
  set: <K extends keyof typeof formData>(k: K, v: (typeof formData)[K]) => void
  onBack: () => void
  onContinue: () => void
}) {
  const ready = formData.buyerWallet.trim().length >= 4

  return (
    <div className="grid gap-5">
      <DroneSummary drone={drone} />

      <Card title="Transfer details" icon={<Wallet className="w-4 h-4 text-primary" />}>
        <Field label="Buyer's Solana wallet" hint="Double-check the address — transfers are final.">
          <input
            type="text"
            value={formData.buyerWallet}
            onChange={(e) => set('buyerWallet', e.target.value)}
            placeholder="Enter buyer wallet address"
            className="reg-input"
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3 mt-3">
          <Field label="Sale price (SOL)" hint="Set 0 for a free transfer.">
            <input
              type="number"
              value={formData.price}
              onChange={(e) => set('price', e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="reg-input"
            />
          </Field>
          <Field label="Transfer notes">
            <input
              type="text"
              value={formData.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Anything the buyer should know…"
              className="reg-input"
            />
          </Field>
        </div>
      </Card>

      <div
        className="rounded-2xl p-4 flex items-start gap-3"
        style={{
          background: 'rgba(245,158,11,0.08)',
          border: '1px solid rgba(245,158,11,0.4)',
        }}
      >
        <AlertTriangle className="w-5 h-5 text-warning mt-0.5 shrink-0" />
        <div>
          <div className="font-semibold text-warning text-[13.5px]">
            This action is irreversible
          </div>
          <div className="text-[12.5px] text-white/65 mt-0.5">
            Once confirmed and signed, the drone NFT transfers permanently to the
            buyer’s wallet. There is no undo on chain.
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-full font-semibold text-sm text-white/85 border border-white/15 hover:border-white/35 hover:bg-white/[0.05] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!ready}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-full font-semibold text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: ready
              ? 'linear-gradient(135deg, rgba(59,130,246,0.95), rgba(99,102,241,0.95))'
              : 'rgba(255,255,255,0.06)',
            boxShadow: ready ? '0 12px 32px -10px rgba(59,130,246,0.5)' : 'none',
          }}
        >
          Review transfer
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      <FormStyles />
    </div>
  )
}

function DroneSummary({ drone }: { drone: Drone }) {
  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-3"
      style={{
        background: 'rgba(59,130,246,0.07)',
        border: '1px solid rgba(59,130,246,0.3)',
      }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: 'rgba(59,130,246,0.18)', border: '1px solid rgba(59,130,246,0.4)' }}
      >
        <span className="text-2xl" aria-hidden>
          🚁
        </span>
      </div>
      <div className="min-w-0">
        <div className="font-mono text-[12px] text-primary">{drone.id}</div>
        <div className="font-inter font-bold text-[15px] text-white truncate">{drone.model}</div>
      </div>
    </div>
  )
}

function ConfirmStep({
  drone,
  user,
  formData,
  agreements,
  setAgreements,
  signing,
  signStep,
  onBack,
  onSign,
}: {
  drone: Drone
  user: { name?: string }
  formData: { droneId: string; buyerWallet: string; price: string; notes: string }
  agreements: { walletConfirmed: boolean; irreversible: boolean; terms: boolean }
  setAgreements: (a: { walletConfirmed: boolean; irreversible: boolean; terms: boolean }) => void
  signing: boolean
  signStep: number
  onBack: () => void
  onSign: () => void
}) {
  const allAgreed = agreements.walletConfirmed && agreements.irreversible && agreements.terms

  return (
    <div className="grid gap-5">
      <Card title="Review &amp; confirm transfer" icon={<Shield className="w-4 h-4 text-primary" />}>
        <div
          className="rounded-2xl p-4 grid gap-3"
          style={{
            background: 'rgba(59,130,246,0.05)',
            border: '1px solid rgba(59,130,246,0.3)',
          }}
        >
          <Party label="From" name={user.name ?? 'Your wallet'} wallet={drone.walletAddress} />
          <div className="flex items-center justify-center text-white/45">
            <ArrowRight className="w-5 h-5 rotate-90" />
          </div>
          <Party label="To" name="Buyer" wallet={formData.buyerWallet} />
        </div>

        <div className="my-4 h-px bg-white/[0.06]" />

        <div className="grid gap-1.5">
          <Row label="Drone" value={drone.id} mono />
          <Row label="Model" value={drone.model} />
          <Row label="Price" value={`${formData.price || '0'} SOL`} mono />
          <Row label="Network fee" value="0.000005 SOL" mono />
        </div>
      </Card>

      <div
        className="rounded-2xl p-4 text-[12.5px] text-white/70 grid gap-2"
        style={{
          background: 'rgba(17,24,39,0.85)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="flex items-center gap-2 font-semibold text-white">
          <Lock className="w-4 h-4 text-primary" />
          Escrow smart contract
        </div>
        <ul className="grid gap-1 pl-6 text-[12.5px] text-white/65 list-decimal">
          <li>Locks the drone NFT in escrow.</li>
          <li>Requires a buyer signature.</li>
          <li>Transfers payment to seller.</li>
          <li>Releases the NFT to the buyer.</li>
        </ul>
        <div className="text-[11.5px] text-white/45">All steps execute atomically.</div>
      </div>

      <Card title="Final agreements" icon={<CheckCircle className="w-4 h-4 text-primary" />}>
        <div className="grid gap-2">
          <Checkbox
            label="I confirm the buyer wallet is correct"
            checked={agreements.walletConfirmed}
            onChange={(v) => setAgreements({ ...agreements, walletConfirmed: v })}
          />
          <Checkbox
            label="I understand this transfer is irreversible"
            checked={agreements.irreversible}
            onChange={(v) => setAgreements({ ...agreements, irreversible: v })}
          />
          <Checkbox
            label="I agree to the transfer terms and DGCA registry rules"
            checked={agreements.terms}
            onChange={(v) => setAgreements({ ...agreements, terms: v })}
          />
        </div>
      </Card>

      {signing && (
        <div className="grid gap-2">
          {SIGN_STEPS.map((label, i) => {
            const done = i < signStep
            const active = i === signStep
            return (
              <div
                key={label}
                className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl border"
                style={{
                  background: active ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.02)',
                  borderColor: done
                    ? 'rgba(16,185,129,0.45)'
                    : active
                      ? 'rgba(59,130,246,0.45)'
                      : 'rgba(255,255,255,0.08)',
                }}
              >
                {done ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : active ? (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                ) : (
                  <span className="w-4 h-4 rounded-full border border-white/20" />
                )}
                <span
                  className="text-[13px]"
                  style={{
                    color: done
                      ? 'rgba(16,185,129,0.95)'
                      : active
                        ? '#FFFFFF'
                        : 'rgba(255,255,255,0.45)',
                  }}
                >
                  {label}
                </span>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={signing}
          className="inline-flex items-center gap-2 h-11 px-5 rounded-full font-semibold text-sm text-white/85 border border-white/15 hover:border-white/35 hover:bg-white/[0.05] transition-colors disabled:opacity-50"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <button
          type="button"
          onClick={onSign}
          disabled={!allAgreed || signing}
          className="inline-flex items-center gap-2 h-12 px-6 rounded-full font-semibold text-sm text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background: allAgreed
              ? 'linear-gradient(135deg, rgba(59,130,246,0.95), rgba(99,102,241,0.95))'
              : 'rgba(255,255,255,0.06)',
            boxShadow: allAgreed ? '0 14px 32px -10px rgba(59,130,246,0.6)' : 'none',
          }}
        >
          {signing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing…
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Sign &amp; transfer
            </>
          )}
        </button>
      </div>
    </div>
  )
}

function Party({
  label,
  name,
  wallet,
}: {
  label: string
  name: string
  wallet: string
}) {
  return (
    <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
      <Wallet className="w-4 h-4 text-primary shrink-0" />
      <div className="min-w-0 flex-1">
        <div className="text-[10px] uppercase tracking-[0.16em] text-white/45 font-semibold">
          {label}
        </div>
        <div className="text-[13px] font-semibold text-white truncate">{name}</div>
        <div className="text-[11.5px] font-mono text-white/55 truncate">{wallet}</div>
      </div>
    </div>
  )
}

function Row({
  label,
  value,
  mono,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg bg-white/[0.02] border border-white/[0.04]">
      <span className="text-[12px] text-white/55">{label}</span>
      <span
        className={`text-[13px] font-semibold text-white truncate ${mono ? 'font-mono tabular-nums' : ''}`}
      >
        {value}
      </span>
    </div>
  )
}

function Checkbox({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
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
      <span className="text-[13px] text-white">{label}</span>
    </button>
  )
}

function CompleteStep({
  drone,
  user,
  formData,
  receipt,
  onAnother,
  onDashboard,
}: {
  drone: Drone
  user: { name?: string }
  formData: { droneId: string; buyerWallet: string; price: string; notes: string }
  receipt: { transferId: string; txHash: string; block: number; at: Date }
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
      <div
        className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl pointer-events-none"
        style={{ background: 'radial-gradient(closest-side, rgba(16,185,129,0.3), transparent 70%)' }}
      />

      <div className="relative flex flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.1 }}
          className="w-20 h-20 rounded-full flex items-center justify-center mb-3"
          style={{
            background: 'rgba(16,185,129,0.18)',
            border: '2px solid rgba(16,185,129,0.55)',
          }}
        >
          <CheckCircle className="w-10 h-10 text-success" />
        </motion.div>
        <div className="text-[10.5px] uppercase tracking-[0.18em] text-success font-semibold">
          On chain
        </div>
        <h2 className="font-inter font-black tracking-tight text-[26px] text-white mt-1">
          Transfer complete 🎉
        </h2>
        <p className="text-[13px] text-white/55 mt-1 max-w-[420px]">
          Drone NFT has been transferred and the Remote ID registry updated automatically.
        </p>
      </div>

      <div className="relative mt-6 grid gap-2">
        <Receipt label="Transfer ID" value={receipt.transferId} mono />
        <Receipt label="Drone" value={`${drone.id} · ${drone.model}`} />
        <Receipt label="From" value={`${user.name ?? 'Seller'} · ${drone.walletAddress}`} mono />
        <Receipt label="To" value={formData.buyerWallet} mono copy />
        <Receipt label="Price" value={`${formData.price || '0'} SOL`} mono />
        <Receipt label="Tx hash" value={`${receipt.txHash.slice(0, 10)}…${receipt.txHash.slice(-6)}`} mono copy={receipt.txHash} />
        <Receipt label="Block" value={`#${receipt.block.toLocaleString()}`} mono />
        <Receipt label="Time" value={receipt.at.toLocaleString()} />
        <Receipt label="Status" value="Confirmed" status />
      </div>

      <div className="relative mt-5 flex flex-wrap gap-2 justify-center">
        <button
          type="button"
          onClick={() => toast.success('Receipt downloaded')}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-full font-semibold text-sm text-white"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.95), rgba(5,150,105,0.95))',
          }}
        >
          <Download className="w-4 h-4" />
          Download receipt
        </button>
        <button
          type="button"
          onClick={onAnother}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-full font-semibold text-sm text-white border border-white/15 hover:border-white/35 hover:bg-white/[0.05] transition-colors"
        >
          <Repeat className="w-4 h-4" />
          Transfer another drone
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

function Receipt({
  label,
  value,
  mono,
  status,
  copy,
}: {
  label: string
  value: string
  mono?: boolean
  status?: boolean
  copy?: string | boolean
}) {
  const handleCopy = () => {
    const text = typeof copy === 'string' ? copy : value
    navigator.clipboard?.writeText(text).then(() => toast.success(`${label} copied`))
  }
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-white/[0.06] bg-white/[0.02]">
      <span className="text-[12px] text-white/55">{label}</span>
      <div className="flex items-center gap-1.5 min-w-0">
        {status ? (
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-success">
            <CheckCircle className="w-3.5 h-3.5" />
            {value}
          </span>
        ) : (
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
            <Copy className="w-3 h-3" />
          </button>
        )}
      </div>
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
  hint,
  children,
}: {
  label: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <div className="text-[10.5px] uppercase tracking-[0.14em] text-white/45 font-semibold mb-1.5">
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
      {hint && <div className="text-[11px] text-white/45 mt-1">{hint}</div>}
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
    `}</style>
  )
}
