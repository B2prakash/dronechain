import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Clock,
  Loader2,
  Radio,
  Shield,
  ShieldCheck,
  Upload,
  X,
  Landmark,
  Download,
  ExternalLink,
  Sparkles,
} from 'lucide-react'

const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const

type DocKey =
  | 'governmentId'
  | 'pilotLicense'
  | 'addressProof'
  | 'droneInsurance'
  | 'profilePhoto'

type StoredUser = {
  name?: string
  email?: string
  role?: string
  verified?: boolean
  avatar?: string
}

type DocumentConfig = {
  key: DocKey
  icon: string
  title: string
  subtitle: string
  requiredFor: ('owner' | 'pilot' | 'authority')[] | 'all'
}

const DOCUMENT_CONFIG: DocumentConfig[] = [
  {
    key: 'governmentId',
    icon: '🪪',
    title: 'Government ID',
    subtitle: 'Aadhaar, Passport or Driving License',
    requiredFor: 'all',
  },
  {
    key: 'pilotLicense',
    icon: '✈️',
    title: 'Pilot License',
    subtitle: 'DGCA issued UAS pilot certificate',
    requiredFor: ['owner', 'pilot'],
  },
  {
    key: 'addressProof',
    icon: '🏠',
    title: 'Address Proof',
    subtitle: 'Utility bill or bank statement',
    requiredFor: 'all',
  },
  {
    key: 'droneInsurance',
    icon: '🛡️',
    title: 'Drone Insurance Certificate',
    subtitle: 'Valid insurance for your drone',
    requiredFor: ['owner'],
  },
  {
    key: 'profilePhoto',
    icon: '📷',
    title: 'Profile Photo',
    subtitle: 'Clear photo of your face',
    requiredFor: 'all',
  },
]

const STEP_LABELS = ['Submit Documents', 'Under Review', 'Authority Check', 'Verified'] as const

function isDocRequired(doc: DocumentConfig, role: string) {
  if (doc.requiredFor === 'all') return true
  return doc.requiredFor.includes(role as 'owner' | 'pilot' | 'authority')
}

function readUser(): StoredUser {
  try {
    return JSON.parse(localStorage.getItem('dronechain_user') || '{}')
  } catch {
    return {}
  }
}

function formatTimestamp(d: Date) {
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function randomHex(len: number) {
  const chars = 'abcdef0123456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export default function Verification() {
  const navigate = useNavigate()
  const prefersReducedMotion = useReducedMotion()
  const [user, setUser] = useState<StoredUser>(() => readUser())
  const role = user.role ?? 'owner'

  const [step, setStep] = useState(1)
  const [documents, setDocuments] = useState<Record<DocKey, string | null>>({
    governmentId: null,
    pilotLicense: null,
    addressProof: null,
    droneInsurance: null,
    profilePhoto: null,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submittedAt, setSubmittedAt] = useState<Date | null>(null)
  const [approving, setApproving] = useState(false)
  const [certificateId] = useState(
    `DRC-VER-${Math.floor(100000 + Math.random() * 900000)}`,
  )
  const [txHash] = useState(
    `${randomHex(4)}${randomHex(2)}...${randomHex(4)}${randomHex(2)}`,
  )

  const requiredDocs = useMemo(
    () => DOCUMENT_CONFIG.filter((d) => isDocRequired(d, role)),
    [role],
  )
  const allRequiredUploaded = requiredDocs.every((d) => documents[d.key])

  function setDocument(key: DocKey, filename: string | null) {
    setDocuments((prev) => ({ ...prev, [key]: filename }))
  }

  async function handleSubmit() {
    if (!allRequiredUploaded || submitting) return
    setSubmitting(true)
    await new Promise((r) => setTimeout(r, 2000))
    setSubmittedAt(new Date())
    setSubmitting(false)
    setStep(2)
  }

  async function handleApprove() {
    if (approving) return
    setApproving(true)
    await new Promise((r) => setTimeout(r, 3000))
    const currentUser = readUser()
    const updated = { ...currentUser, verified: true, verifiedAt: new Date().toISOString() }
    localStorage.setItem('dronechain_user', JSON.stringify(updated))
    setUser(updated)
    setApproving(false)
    setStep(4)
  }

  const statusMeta = useMemo(() => {
    if (step === 1)
      return {
        dot: '🟡',
        title: 'Verification Pending',
        body: 'Submit your documents to begin.',
        color: '#F59E0B',
      }
    if (step === 2)
      return {
        dot: '🔵',
        title: 'Documents Submitted',
        body: 'Under review by authorities.',
        color: '#3B82F6',
      }
    if (step === 3)
      return {
        dot: '🟠',
        title: 'Under Authority Review',
        body: 'DGCA officials are reviewing your application.',
        color: '#F59E0B',
      }
    return {
      dot: '🟢',
      title: 'Fully Verified',
      body: 'You have full access.',
      color: '#10B981',
    }
  }, [step])

  return (
    <div className="relative min-h-screen bg-bg text-white overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 grid-bg radial-fade opacity-30" />
      <div
        className="pointer-events-none absolute top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full blur-3xl opacity-25"
        style={{
          background: `radial-gradient(closest-side, ${statusMeta.color}44, transparent 70%)`,
          transition: 'background 500ms ease',
        }}
      />

      <div className="relative z-10 flex items-center justify-between px-5 sm:px-8 pt-6">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="group inline-flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
          Dashboard
        </button>
        <div className="flex items-center gap-2">
          <span className="text-xl" aria-hidden>🚁</span>
          <span className="font-inter font-extrabold tracking-tight text-primary text-[15px]">
            DroneChain
          </span>
        </div>
        <div className="text-xs text-white/45 tabular-nums min-w-[70px] text-right">
          Step {Math.min(step, 4)} of 4
        </div>
      </div>

      <main className="relative max-w-5xl mx-auto px-5 sm:px-8 pt-10 pb-24">
        <header className="text-center max-w-2xl mx-auto">
          <h1
            className="font-inter font-black text-white tracking-tight text-balance"
            style={{ fontSize: 'clamp(2rem, 4vw, 2.75rem)', lineHeight: 1.05 }}
          >
            Account Verification
          </h1>
          <p className="mt-3 text-white/55 text-balance">
            Complete verification to unlock full access to DroneChain.
          </p>
        </header>

        <Stepper step={step} color={statusMeta.color} />
        <StatusCard meta={statusMeta} />

        <AnimatePresence mode="wait">
          {step === 1 && (
            <UploadStep
              key="s1"
              role={role}
              documents={documents}
              setDocument={setDocument}
              allRequiredUploaded={allRequiredUploaded}
              submitting={submitting}
              onSubmit={handleSubmit}
            />
          )}
          {step === 2 && (
            <ReviewTimeline
              key="s2"
              submittedAt={submittedAt}
              onAdvance={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <AuthorityReview
              key="s3"
              documents={documents}
              requiredDocs={requiredDocs}
              approving={approving}
              onApprove={handleApprove}
            />
          )}
          {step === 4 && (
            <VerifiedSuccess
              key="s4"
              user={user}
              certificateId={certificateId}
              txHash={txHash}
              role={role}
              prefersReducedMotion={!!prefersReducedMotion}
              onDashboard={() => navigate('/dashboard')}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}

function Stepper({ step, color }: { step: number; color: string }) {
  return (
    <div className="mt-10 max-w-3xl mx-auto">
      <div className="h-[3px] bg-white/[0.06] overflow-hidden rounded-full">
        <motion.div
          className="h-full origin-left rounded-full"
          style={{
            background: `linear-gradient(90deg, ${color}, ${color}dd)`,
            boxShadow: `0 0 16px ${color}99`,
          }}
          initial={false}
          animate={{ width: `${(Math.min(step, 4) / 4) * 100}%` }}
          transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
        />
      </div>
      <ol className="mt-5 grid grid-cols-4 gap-3 sm:gap-6">
        {STEP_LABELS.map((label, i) => {
          const n = i + 1
          const isDone = step > n
          const isActive = step === n
          const activeColor = isActive ? color : isDone ? '#10B981' : 'rgba(255,255,255,0.35)'
          return (
            <li key={label} className="flex flex-col items-center text-center">
              <div
                className="relative w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-semibold transition-[background,border-color,color,transform] duration-300"
                style={{
                  background: isActive
                    ? color
                    : isDone
                      ? 'rgba(16,185,129,0.15)'
                      : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isActive ? color : isDone ? 'rgba(16,185,129,0.5)' : 'rgba(255,255,255,0.1)'}`,
                  color: isActive ? '#fff' : activeColor,
                  transform: isActive ? 'scale(1.08)' : 'scale(1)',
                  boxShadow: isActive ? `0 0 0 4px ${color}26` : 'none',
                }}
              >
                {isDone ? <CheckCircle className="w-4 h-4" /> : n}
              </div>
              <div
                className="mt-2 text-[11px] sm:text-xs tracking-wide"
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

function StatusCard({
  meta,
}: {
  meta: { dot: string; title: string; body: string; color: string }
}) {
  return (
    <motion.div
      initial={false}
      animate={{ borderColor: `${meta.color}55` }}
      transition={{ duration: 0.4 }}
      className="mt-10 glass-strong p-5 sm:p-6 flex items-center gap-4"
      style={{ borderColor: `${meta.color}55` }}
    >
      <div
        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
        style={{
          background: `${meta.color}14`,
          border: `1px solid ${meta.color}33`,
        }}
        aria-hidden
      >
        {meta.dot}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-inter font-bold text-white text-[17px]">{meta.title}</div>
        <div className="mt-0.5 text-sm text-white/60">{meta.body}</div>
      </div>
      <div
        className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium uppercase tracking-wider"
        style={{
          background: `${meta.color}14`,
          border: `1px solid ${meta.color}33`,
          color: meta.color,
        }}
      >
        <span className="w-1.5 h-1.5 rounded-full pulse-dot" style={{ background: meta.color }} />
        Live
      </div>
    </motion.div>
  )
}

function UploadStep({
  role,
  documents,
  setDocument,
  allRequiredUploaded,
  submitting,
  onSubmit,
}: {
  role: string
  documents: Record<DocKey, string | null>
  setDocument: (key: DocKey, filename: string | null) => void
  allRequiredUploaded: boolean
  submitting: boolean
  onSubmit: () => void
}) {
  const visibleDocs = useMemo(
    () =>
      DOCUMENT_CONFIG.filter(
        (d) => d.requiredFor === 'all' || d.requiredFor.includes(role as 'owner' | 'pilot' | 'authority'),
      ),
    [role],
  )

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
      className="mt-10"
    >
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-inter font-bold text-white text-xl tracking-tight">
            Upload required documents
          </h2>
          <p className="mt-1 text-sm text-white/55">
            All documents are encrypted and stored securely.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 text-xs text-white/45">
          <Shield className="w-3.5 h-3.5" />
          End-to-end encrypted
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {visibleDocs.map((doc, i) => (
          <UploadBox
            key={doc.key}
            doc={doc}
            filename={documents[doc.key]}
            onUpload={(name) => setDocument(doc.key, name)}
            onRemove={() => setDocument(doc.key, null)}
            delay={i * 0.05}
          />
        ))}
      </div>

      <div className="mt-8 flex items-center justify-between gap-4 flex-wrap">
        <div className="text-xs text-white/45">
          {allRequiredUploaded
            ? 'All required documents uploaded.'
            : 'Upload all required documents to submit for verification.'}
        </div>
        <button
          type="button"
          onClick={onSubmit}
          disabled={!allRequiredUploaded || submitting}
          className="group inline-flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold text-white bg-primary hover:bg-[#2563EB] transition-[background,transform,box-shadow] duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ boxShadow: '0 10px 30px -12px rgba(59,130,246,0.6)' }}
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              Submit for Verification
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>
      </div>
    </motion.section>
  )
}

function UploadBox({
  doc,
  filename,
  onUpload,
  onRemove,
  delay,
}: {
  doc: DocumentConfig
  filename: string | null
  onUpload: (name: string) => void
  onRemove: () => void
  delay: number
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const uploaded = !!filename

  function triggerPick() {
    inputRef.current?.click()
  }

  function onFiles(files: FileList | null) {
    const f = files?.[0]
    if (!f) return
    onUpload(f.name)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay, ease: EASE_OUT_EXPO }}
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        onFiles(e.dataTransfer.files)
      }}
      className="relative transition-[border-color,background] duration-200"
      style={{
        background: uploaded ? 'rgba(16,185,129,0.05)' : 'rgba(255,255,255,0.03)',
        border: `2px dashed ${uploaded ? 'rgba(16,185,129,0.5)' : dragOver ? '#3B82F6' : 'rgba(255,255,255,0.12)'}`,
        borderRadius: '16px',
        padding: '22px',
        cursor: uploaded ? 'default' : 'pointer',
      }}
      onClick={uploaded ? undefined : triggerPick}
      onMouseEnter={(e) => {
        if (!uploaded) e.currentTarget.style.borderColor = 'rgba(59,130,246,0.5)'
      }}
      onMouseLeave={(e) => {
        if (!uploaded && !dragOver)
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="sr-only"
        onChange={(e) => onFiles(e.target.files)}
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
          {doc.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-inter font-semibold text-white text-[15px]">{doc.title}</div>
            {doc.requiredFor !== 'all' && (
              <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded text-white/55 border border-white/10">
                {Array.isArray(doc.requiredFor) ? doc.requiredFor.join(' + ') : ''}
              </span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-white/55 leading-relaxed">{doc.subtitle}</div>

          {!uploaded ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                triggerPick()
              }}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4"
            >
              <Upload className="w-4 h-4" />
              Upload Document
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
              className="mt-4 flex items-center gap-3"
            >
              <div className="flex items-center gap-1.5 text-sm text-success min-w-0">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span className="truncate text-white/85 font-medium">{filename}</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onRemove()
                }}
                className="inline-flex items-center gap-1 text-xs text-white/50 hover:text-danger transition-colors"
              >
                <X className="w-3 h-3" />
                Remove
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

type TimelineState = 'submitted' | 'initial' | 'authority' | 'final'

function ReviewTimeline({
  submittedAt,
  onAdvance,
}: {
  submittedAt: Date | null
  onAdvance: () => void
}) {
  const [phase, setPhase] = useState<TimelineState>('initial')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('authority'), 5000)
    const t2 = setTimeout(() => setPhase('final'), 10000)
    const t3 = setTimeout(() => onAdvance(), 15000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [onAdvance])

  const items: {
    state: 'done' | 'active' | 'pending'
    icon: React.ReactNode
    title: string
    body: string
    progress?: boolean
  }[] = [
    {
      state: 'done',
      icon: <CheckCircle className="w-4 h-4 text-success" />,
      title: 'Documents Submitted',
      body: submittedAt ? formatTimestamp(submittedAt) : 'Just now',
    },
    {
      state: phase === 'initial' ? 'active' : 'done',
      icon:
        phase === 'initial' ? (
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        ) : (
          <CheckCircle className="w-4 h-4 text-success" />
        ),
      title: 'Initial Document Check',
      body: phase === 'initial' ? 'Automated verification in progress...' : 'Integrity checks passed.',
      progress: phase === 'initial',
    },
    {
      state: phase === 'authority' ? 'active' : phase === 'final' ? 'done' : 'pending',
      icon:
        phase === 'authority' ? (
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        ) : phase === 'final' ? (
          <CheckCircle className="w-4 h-4 text-success" />
        ) : (
          <Clock className="w-4 h-4 text-white/35" />
        ),
      title: 'Authority Review Pending',
      body:
        phase === 'authority'
          ? 'Assigning a DGCA official...'
          : phase === 'final'
            ? 'Reviewer assigned.'
            : 'Waiting for DGCA official.',
      progress: phase === 'authority',
    },
    {
      state: phase === 'final' ? 'active' : 'pending',
      icon:
        phase === 'final' ? (
          <Loader2 className="w-4 h-4 text-primary animate-spin" />
        ) : (
          <Clock className="w-4 h-4 text-white/35" />
        ),
      title: 'Final Approval',
      body: phase === 'final' ? 'Opening review session...' : 'Pending.',
      progress: phase === 'final',
    },
  ]

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
      className="mt-10"
    >
      <div className="glass-strong p-6 sm:p-7">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="font-inter font-bold text-white text-lg">Verification Timeline</h2>
            <p className="mt-1 text-sm text-white/55">
              Live updates on your verification progress.
            </p>
          </div>
          <div
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
            style={{
              background: 'rgba(59,130,246,0.1)',
              border: '1px solid rgba(59,130,246,0.3)',
              color: '#3B82F6',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-primary pulse-dot" />
            Live review
          </div>
        </div>

        <ol className="mt-6 relative">
          <div
            className="absolute left-[15px] top-2 bottom-2 w-px"
            style={{ background: 'rgba(255,255,255,0.08)' }}
          />
          {items.map((item, i) => (
            <motion.li
              key={item.title}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: i * 0.05, ease: EASE_OUT_EXPO }}
              className="relative flex gap-4 py-4 first:pt-0 last:pb-0"
            >
              <div
                className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: 'rgba(17,24,39,0.95)',
                  border: `1px solid ${item.state === 'active' ? 'rgba(59,130,246,0.5)' : item.state === 'done' ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.12)'}`,
                  boxShadow: item.state === 'active' ? '0 0 0 4px rgba(59,130,246,0.12)' : 'none',
                }}
              >
                {item.icon}
              </div>
              <div className="flex-1 min-w-0 pt-0.5">
                <div
                  className="font-inter font-semibold text-[15px]"
                  style={{
                    color:
                      item.state === 'pending' ? 'rgba(255,255,255,0.55)' : '#fff',
                  }}
                >
                  {item.title}
                </div>
                <div className="mt-0.5 text-sm text-white/55">{item.body}</div>
                {item.progress && <ProgressStripe />}
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </motion.section>
  )
}

function ProgressStripe() {
  return (
    <div className="mt-2 h-1 rounded-full bg-white/[0.05] overflow-hidden">
      <motion.div
        className="h-full"
        style={{
          background:
            'linear-gradient(90deg, rgba(59,130,246,0.2), rgba(59,130,246,0.95), rgba(59,130,246,0.2))',
          backgroundSize: '200% 100%',
        }}
        animate={{ backgroundPositionX: ['0%', '200%'] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}

type DocState = 'pending' | 'reviewing' | 'verified'

function AuthorityReview({
  documents,
  requiredDocs,
  approving,
  onApprove,
}: {
  documents: Record<DocKey, string | null>
  requiredDocs: DocumentConfig[]
  approving: boolean
  onApprove: () => void
}) {
  const uploadedDocs = useMemo(
    () => requiredDocs.filter((d) => documents[d.key]),
    [requiredDocs, documents],
  )
  const [docStates, setDocStates] = useState<Record<string, DocState>>(() => {
    const obj: Record<string, DocState> = {}
    uploadedDocs.forEach((d, i) => (obj[d.key] = i === 0 ? 'reviewing' : 'pending'))
    return obj
  })

  const [comments, setComments] = useState<
    { id: number; time: Date; body: string }[]
  >([])
  const commentIdRef = useRef(0)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    uploadedDocs.forEach((d, i) => {
      const completeAt = 2200 + i * 3000
      const nextReviewAt = completeAt + 200
      timers.push(
        setTimeout(() => {
          setDocStates((prev) => ({ ...prev, [d.key]: 'verified' }))
        }, completeAt),
      )
      if (i < uploadedDocs.length - 1) {
        timers.push(
          setTimeout(() => {
            setDocStates((prev) => ({ ...prev, [uploadedDocs[i + 1].key]: 'reviewing' }))
          }, nextReviewAt),
        )
      }
    })
    return () => timers.forEach(clearTimeout)
  }, [uploadedDocs])

  useEffect(() => {
    const addComment = (body: string) => {
      commentIdRef.current += 1
      setComments((prev) => [
        ...prev,
        { id: commentIdRef.current, time: new Date(), body },
      ])
    }
    const t1 = setTimeout(
      () => addComment('Documents received. Starting verification.'),
      1500,
    )
    const t2 = setTimeout(
      () =>
        addComment(
          'Government ID verified successfully. Pilot license looks authentic.',
        ),
      8000,
    )
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  const totalDocs = uploadedDocs.length
  const verifiedCount = uploadedDocs.filter((d) => docStates[d.key] === 'verified').length
  const reviewingIndex = uploadedDocs.findIndex((d) => docStates[d.key] === 'reviewing')
  const allVerified = verifiedCount === totalDocs

  return (
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
      className="mt-10"
    >
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h2 className="font-inter font-bold text-white text-xl tracking-tight">
            Authority Review
          </h2>
          <p className="mt-1 text-sm text-white/55">
            A DGCA official is reviewing your application.
          </p>
        </div>
        <div
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium"
          style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            color: '#EF4444',
          }}
        >
          <span className="relative inline-flex w-1.5 h-1.5">
            <span className="absolute inset-0 rounded-full bg-danger" />
            <span className="absolute -inset-1 rounded-full pulse-ring" style={{ background: 'rgba(239,68,68,0.45)' }} />
          </span>
          Live · reviewing document{' '}
          {allVerified
            ? `${totalDocs} of ${totalDocs}`
            : `${Math.max(reviewingIndex + 1, 1)} of ${totalDocs}`}
        </div>
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <DocReviewCard
            docs={uploadedDocs}
            docStates={docStates}
            verifiedCount={verifiedCount}
            totalDocs={totalDocs}
          />
          <CommentsCard comments={comments} />
        </div>

        <div className="space-y-5">
          <ReviewerCard />
          {allVerified && (
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT_EXPO }}
              className="glass-strong p-6"
              style={{ borderColor: 'rgba(16,185,129,0.35)' }}
            >
              <div className="text-xs uppercase tracking-[0.2em] text-success/80">
                Ready for final approval
              </div>
              <div className="mt-2 font-inter font-bold text-white text-lg">
                All documents verified
              </div>
              <p className="mt-1 text-sm text-white/55">
                The authority can now issue your verification certificate on Solana.
              </p>
              <button
                type="button"
                onClick={onApprove}
                disabled={approving}
                className="mt-5 group w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-[background,transform,box-shadow] duration-200 active:scale-[0.98] disabled:opacity-80"
                style={{
                  background: approving ? '#0d7c54' : '#10B981',
                  boxShadow: '0 12px 30px -12px rgba(16,185,129,0.65)',
                }}
                onMouseEnter={(e) => {
                  if (!approving) e.currentTarget.style.background = '#0ea573'
                }}
                onMouseLeave={(e) => {
                  if (!approving) e.currentTarget.style.background = '#10B981'
                }}
              >
                {approving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Issuing certificate...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    Approve and Verify Account
                  </>
                )}
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.section>
  )
}

function DocReviewCard({
  docs,
  docStates,
  verifiedCount,
  totalDocs,
}: {
  docs: DocumentConfig[]
  docStates: Record<string, DocState>
  verifiedCount: number
  totalDocs: number
}) {
  return (
    <div className="glass-strong p-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="font-inter font-bold text-white text-[15px]">Document review</div>
          <div className="mt-0.5 text-xs text-white/50">
            Each document is being authenticated against registry records.
          </div>
        </div>
        <div className="text-xs text-white/60 tabular-nums">
          {verifiedCount} / {totalDocs} verified
        </div>
      </div>
      <ul className="mt-5 space-y-3">
        {docs.map((d) => {
          const state = docStates[d.key] ?? 'pending'
          return (
            <li
              key={d.key}
              className="flex items-center gap-3 p-3 rounded-[12px]"
              style={{
                background:
                  state === 'verified'
                    ? 'rgba(16,185,129,0.06)'
                    : state === 'reviewing'
                      ? 'rgba(59,130,246,0.06)'
                      : 'rgba(255,255,255,0.02)',
                border: `1px solid ${state === 'verified' ? 'rgba(16,185,129,0.25)' : state === 'reviewing' ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.06)'}`,
              }}
            >
              <div
                className="w-9 h-9 shrink-0 rounded-lg flex items-center justify-center text-lg"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
                aria-hidden
              >
                {d.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-inter font-semibold text-white text-sm">{d.title}</div>
                <div className="mt-0.5 text-xs text-white/55">
                  {state === 'verified' && d.key === 'addressProof'
                    ? 'Document authentic'
                    : state === 'verified' && d.key === 'profilePhoto'
                      ? 'Identity confirmed'
                      : state === 'verified'
                        ? 'Verified against registry'
                        : state === 'reviewing'
                          ? 'Reviewing...'
                          : 'Waiting for review'}
                </div>
                {state === 'reviewing' && <ProgressStripe />}
              </div>
              <div className="shrink-0">
                {state === 'verified' ? (
                  <span className="inline-flex items-center gap-1 text-xs text-success">
                    <CheckCircle className="w-4 h-4" />
                    Verified
                  </span>
                ) : state === 'reviewing' ? (
                  <span className="inline-flex items-center gap-1 text-xs text-primary">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Reviewing
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs text-white/45">
                    <Clock className="w-3.5 h-3.5" />
                    Pending
                  </span>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function CommentsCard({
  comments,
}: {
  comments: { id: number; time: Date; body: string }[]
}) {
  if (comments.length === 0) {
    return (
      <div className="glass-strong p-6">
        <div className="font-inter font-bold text-white text-[15px]">Authority comments</div>
        <div className="mt-3 text-sm text-white/50">Awaiting first note...</div>
      </div>
    )
  }
  return (
    <div className="glass-strong p-6">
      <div className="font-inter font-bold text-white text-[15px]">Authority comments</div>
      <ul className="mt-4 space-y-4">
        <AnimatePresence initial={false}>
          {comments.map((c) => (
            <motion.li
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE_OUT_EXPO }}
              className="flex gap-3"
            >
              <div
                className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: '#10B981', color: '#0a0f1a' }}
              >
                RA
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-inter font-semibold text-white text-sm">
                    Rajesh Agarwal
                  </span>
                  <span className="text-[11px] text-success/80 uppercase tracking-wider">
                    DGCA Inspector
                  </span>
                </div>
                <div className="mt-1 text-sm text-white/80 leading-relaxed">{c.body}</div>
                <div className="mt-1 text-[11px] text-white/40">
                  {relativeTime(c.time)}
                </div>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  )
}

function relativeTime(d: Date) {
  const diff = Math.floor((Date.now() - d.getTime()) / 1000)
  if (diff < 5) return 'Just now'
  if (diff < 60) return `${diff}s ago`
  const m = Math.floor(diff / 60)
  return `${m} min${m === 1 ? '' : 's'} ago`
}

function ReviewerCard() {
  return (
    <div className="glass-strong p-6">
      <div className="text-xs uppercase tracking-[0.2em] text-white/40">
        Assigned reviewer
      </div>
      <div className="mt-4 flex items-start gap-3">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold relative"
          style={{ background: '#10B981', color: '#0a0f1a' }}
        >
          RA
          <span
            className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2"
            style={{ background: '#10B981', borderColor: '#111827' }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-inter font-bold text-white">Rajesh Agarwal</div>
          <div className="text-xs text-white/60">Senior Inspector, DGCA India</div>
          <div className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-white/50">
            <Landmark className="w-3 h-3" />
            Badge: DGCA-INS-2024-047
          </div>
          <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] text-success">
            <span className="w-1.5 h-1.5 rounded-full bg-success pulse-dot" />
            Online now
          </div>
        </div>
      </div>
      <div
        className="mt-5 p-3 rounded-[10px] text-sm text-white/75 italic"
        style={{
          background: 'rgba(16,185,129,0.06)',
          border: '1px solid rgba(16,185,129,0.2)',
        }}
      >
        “Reviewing your application...”
      </div>
    </div>
  )
}

function Confetti({ count = 70, accent }: { count?: number; accent: string }) {
  const pieces = useMemo(() => {
    const palette = [accent, '#3B82F6', '#10B981', '#F59E0B', '#ffffff']
    return Array.from({ length: count }).map((_, i) => {
      const c = palette[i % palette.length]
      return {
        left: Math.random() * 100,
        dx: (Math.random() - 0.5) * 240,
        delay: Math.random() * 0.8,
        duration: 2.6 + Math.random() * 2.4,
        color: c,
        rotate: Math.random() * 360,
      }
    })
  }, [count, accent])

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden z-[1]" aria-hidden>
      <style>{`
        @keyframes verif-confetti {
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
            width: '8px',
            height: '14px',
            borderRadius: '2px',
            background: p.color,
            ['--dx' as string]: `${p.dx}px`,
            animation: `verif-confetti ${p.duration}s linear forwards`,
            animationDelay: `${p.delay}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  )
}

function VerifiedSuccess({
  user,
  certificateId,
  txHash,
  role,
  prefersReducedMotion,
  onDashboard,
}: {
  user: StoredUser
  certificateId: string
  txHash: string
  role: string
  prefersReducedMotion: boolean
  onDashboard: () => void
}) {
  const roleLabel =
    role === 'owner' ? 'Drone Owner' : role === 'pilot' ? 'Certified Pilot' : 'Authority Official'
  const now = new Date()

  function handleDownload() {
    toast.success('Certificate download coming soon', { icon: '📄' })
  }

  return (
    <motion.section
      key="verified"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="relative mt-12 mx-auto max-w-xl text-center"
    >
      {!prefersReducedMotion && <Confetti accent="#10B981" />}

      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.7, ease: EASE_OUT_EXPO }}
        className="relative mx-auto w-24 h-24 rounded-full flex items-center justify-center"
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
        Account Fully Verified 🎉
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
        transition={{ duration: 0.7, delay: 0.7, ease: EASE_OUT_EXPO }}
        className="mt-8 relative overflow-hidden text-left"
        style={{
          background:
            'linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(17,24,39,0.95) 55%, rgba(59,130,246,0.08) 100%)',
          border: '1px solid rgba(16,185,129,0.35)',
          borderRadius: '18px',
          padding: '24px',
          boxShadow: '0 30px 60px -30px rgba(16,185,129,0.4)',
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{
            background:
              'linear-gradient(90deg, transparent, rgba(16,185,129,0.7), transparent)',
          }}
        />
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-success font-semibold">
            <ShieldCheck className="w-4 h-4" />
            Verified Drone Operator
          </div>
          <Sparkles className="w-4 h-4 text-success/70" />
        </div>
        <dl className="mt-5 grid gap-3 text-sm">
          <CertRow label="Name" value={user.name ?? '—'} />
          <CertRow label="Role" value={roleLabel} />
          <CertRow label="Verified by" value="DGCA India" />
          <CertRow label="Date" value={formatTimestamp(now)} />
          <CertRow label="Certificate" value={certificateId} mono />
        </dl>
        <div className="mt-5 pt-5 border-t border-white/5">
          <div className="text-[11px] uppercase tracking-[0.2em] text-white/40">
            On-chain proof
          </div>
          <div className="mt-2 flex items-center gap-2 text-sm">
            <Radio className="w-4 h-4 text-success" />
            <span className="text-white/70">Stored on Solana:</span>
            <span className="font-mono text-white/90">{txHash}</span>
          </div>
          <button
            type="button"
            onClick={() =>
              toast('Explorer link coming soon', { icon: '🔗' })
            }
            className="mt-3 inline-flex items-center gap-1.5 text-xs text-primary hover:underline underline-offset-4"
          >
            View on Solana Explorer
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.9, ease: EASE_OUT_EXPO }}
        className="mt-8 flex flex-wrap items-center justify-center gap-3"
      >
        <button
          type="button"
          onClick={onDashboard}
          className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white bg-primary hover:bg-[#2563EB] transition-colors"
          style={{ boxShadow: '0 12px 30px -12px rgba(59,130,246,0.65)' }}
        >
          Go to Dashboard
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold text-white/85 hover:text-white border border-white/15 hover:border-white/30 hover:bg-white/[0.06] transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Certificate
        </button>
      </motion.div>
    </motion.section>
  )
}

function CertRow({
  label,
  value,
  mono,
}: {
  label: string
  value: string
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
