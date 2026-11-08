import { useEffect, useRef, useState } from "react"
import CommerceLab from "./CommerceLab"
import { createProjectRequest, getProjectRequests, sendProjectRequest, dollarsToCents } from "./api/client"
import type { ProjectRequestResponse } from "./api/client"
import type { ReactNode } from "react"
import { Badge, Button, Card, Icon, Logo, SectionTitle } from "./ui"
import {
  activeProject,
  can,
  createInitialState,
  displayDate,
  money,
  sampleMilestones,
  transition,
} from "./model"
import type {
  Action,
  Milestone,
  ProjectRequest,
  Proposal,
  Role,
  State,
  UserId,
} from "./model"

type Page = "Overview" | "Requests" | "Proposals" | "Projects" | "AI Workspace" | "Milestones" | "Approvals" | "Invoices" | "Activity" | "Settings" | "Live Commerce"
type Confirm = {
  title: string
  text: string
  label: string
  action: Action
}
const initials = (name: string) =>
  name
    .split(" ")
    .map((n) => n[0])
    .join("")
const time = (at: string) =>
  new Date(at).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }) + " UTC"

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: ReactNode
  hint?: string
}) {
  return (
    <label className="field-label">
      {label}
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}
function Empty({
  title,
  text,
  action,
}: {
  title: string
  text: string
  action?: ReactNode
}) {
  return (
    <div className="empty-state">
      <span className="icon-tile">
        <Icon name="folder" />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  )
}
function History({ events }: { events: State["events"] }) {
  return (
    <div className="history-list">
      {events.map((e) => (
        <div className="history-event" key={e.id}>
          <span className="history-dot" />
          <div>
            <strong>{e.actor}</strong>
            <p>{e.text}</p>
            <time>{time(e.at)} · Demo clock</time>
          </div>
        </div>
      ))}
    </div>
  )
}
function MilestoneEditor({
  proposal,
  setProposal,
  disabled,
}: {
  proposal: Proposal
  setProposal: (p: Proposal) => void
  disabled: boolean
}) {
  function edit(index: number, values: Partial<Milestone>) {
    setProposal({
      ...proposal,
      milestones: proposal.milestones.map((m, i) =>
        i === index ? { ...m, ...values } : m,
      ),
    })
  }
  return (
    <div className="proposal-milestones">
      {proposal.milestones.map((m, i) => (
        <div className="proposal-milestone" key={m.id}>
          <div className="section-title">
            <h3>Milestone 0{i + 1}</h3>
            <Badge>Editable proposal</Badge>
          </div>
          <div className="form-grid">
            <div className="full-span">
              <Field label="Milestone name">
                <input
                  disabled={disabled}
                  value={m.name}
                  onChange={(e) => edit(i, { name: e.target.value })}
                />
              </Field>
            </div>
            <Field label="Amount · USD">
              <input
                disabled={disabled}
                type="number"
                min="1"
                value={m.amount}
                onChange={(e) => edit(i, { amount: Number(e.target.value) })}
              />
            </Field>
            <Field label="Due date">
              <input
                disabled={disabled}
                type="date"
                min="2026-10-12"
                max="2026-11-30"
                value={m.date}
                onChange={(e) => edit(i, { date: e.target.value })}
              />
            </Field>
            <div className="full-span">
              <Field label="Acceptance criteria">
                <textarea
                  disabled={disabled}
                  rows={2}
                  value={m.criteria}
                  onChange={(e) => edit(i, { criteria: e.target.value })}
                />
              </Field>
            </div>
          </div>
        </div>
      ))}
      <div className="invoice-total">
        <span>Milestone total / proposed total</span>
        <strong
          className={
            proposal.milestones.reduce((t, m) => t + m.amount, 0) !==
            proposal.amount
              ? "error-text"
              : ""
          }
        >
          {money(proposal.milestones.reduce((t, m) => t + m.amount, 0))} /{" "}
          {money(proposal.amount)}
        </strong>
      </div>
    </div>
  )
}
const findings = [
  {
    finding: "Clarify the meaning of “responsive”",
    evidence: "The sample scope calls for a responsive e-commerce website.",
    explanation:
      "Device widths and browser coverage are not fully specified by this phrase.",
    action: "Ask: which breakpoints and browsers must be supported?",
    limitation:
      "Fixed sample finding; no semantic analysis of your text was performed.",
  },
  {
    finding: "Define acceptance before delivery",
    evidence: "The sample agreement includes three separate deliverables.",
    explanation:
      "A documented checklist gives both parties the same definition of done.",
    action:
      "Review each milestone’s acceptance criteria and confirm them together.",
    limitation: "Cannot assess legal sufficiency or guarantee completeness.",
  },
  {
    finding: "Keep milestone values tied to scope",
    evidence: "Sample split: $300 + $450 + $750 = $1,500 USD.",
    explanation:
      "Discovery, design, and implementation each have a clear budget and deadline.",
    action:
      "Use the editable proposal to revise scope or estimates before acceptance.",
    limitation: "These fixed recommendations are not a market valuation.",
  },
]

export function MilestonePayWorkspace({ onHome }: { onHome: () => void }) {
  const [s, setState] = useState(createInitialState)
  const [page, setPage] = useState<Page>("Overview")
  const [mobile, setMobile] = useState(false)
  const [toast, setToast] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState("")
  const [confirm, setConfirm] = useState<Confirm | null>(null)
  const [accountDialog, setAccountDialog] = useState(false)
  const [notifications, setNotifications] = useState(false)
  const [requestDraft, setRequestDraft] = useState<ProjectRequest>(s.request)
  const [proposalDraft, setProposalDraft] = useState<Proposal>(s.proposal)
  const [message, setMessage] = useState("")
  const [counter, setCounter] = useState(1500)
  const [projectTab, setProjectTab] = useState("Milestones")
  const [milestoneId, setMilestoneId] = useState("m1")
  const [evidence, setEvidence] = useState("")
  const [feedback, setFeedback] = useState("")
  const [invoiceId, setInvoiceId] = useState("")
  const [invoiceMilestone, setInvoiceMilestone] = useState("m1")
  const [due, setDue] = useState("2026-11-20")
  const [invoiceNote, setInvoiceNote] = useState(
    "Invoice for the approved project milestone. Thank you for the collaboration.",
  )
  // Only request creation/listing/sending are persisted by backend v0.1.
  // The proposal, agreement, deliverable, and invoice flows remain demo-only.
  const [apiRequests, setApiRequests] = useState<ProjectRequestResponse[]>([])
  const [apiState, setApiState] = useState<"loading" | "connected" | "offline">("loading")
  const [apiBusy, setApiBusy] = useState(false)
  const activeRequestId = useRef<string | null>(null)
  const syncGeneration = useRef(0)
  const [analysis, setAnalysis] = useState(false)
  const [analysisText, setAnalysisText] = useState(s.proposal.scope)
  const stateRef = useRef(s)
  const modalRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  stateRef.current = s
  const user = s.users[s.account]
  const clientView = s.role === "Client"
  const ownedClient = can(s, "request")
  const ownedFreelancer = can(s, "propose")
  const projectActive = activeProject(s)
  const milestone = s.milestones.find((m) => m.id === milestoneId)!
  const invoice =
    s.invoices.find((i) => i.id === invoiceId) ?? s.invoices.at(-1)
  const total = s.agreement?.amount ?? s.proposal.amount
  const paid = s.invoices
    .filter((i) => i.status === "Paid")
    .reduce((t, i) => t + i.amount, 0)
  const eligible = s.milestones.filter(
    (m) =>
      m.status === "Approved" &&
      !s.invoices.some(
        (i) => i.milestoneId === m.id && i.status !== "Cancelled",
      ),
  )
  const submitted = s.milestones.filter((m) => m.status === "In review")
  const complete = s.milestones.filter((m) =>
    ["Approved", "Paid"].includes(m.status),
  ).length
  const requestVisible =
    ownedClient || (ownedFreelancer && s.request.status !== "Draft")
  const pendingInvoices = s.invoices.filter((i) =>
    ["Sent", "Payment Pending", "Payment Failed"].includes(i.status),
  )
  const editableProposal =
    ownedFreelancer &&
    ["Under Review", "Proposal Received"].includes(s.request.status) &&
    ["Draft", "Revision Requested", "Declined"].includes(s.proposal.status)
  // Clients see submitted terms, not the freelancer's saved, unsent revisions.
  const proposalView = ownedFreelancer
    ? proposalDraft
    : (s.proposalHistory.at(-1)?.proposal ?? s.proposal)

  const requestSignature = JSON.stringify(s.request)
  const proposalSignature = JSON.stringify(s.proposal)
  useEffect(() => {
    setRequestDraft(s.request)
  }, [requestSignature, s.account])
  // Re-read persisted requests on mount and demo-account changes. The backend
  // currently stores only title, description, budget, actors and status.
  // Fields such as deadline and requirements are still demo state.
  useEffect(() => {
    const generation = ++syncGeneration.current
    const actor = s.account
    setApiState("loading")
    getProjectRequests(actor)
      .then((records) => {
        if (syncGeneration.current !== generation) return
        setApiRequests(records)
        setApiState("connected")
        const record = records[0]
        if (!record) return
        activeRequestId.current = record.id
        setState((previous) => {
          // Don't roll back progress made in the local proposal/approval demo.
          if (previous.agreement || previous.proposalHistory.length > 0 ||
              !["Draft", "Sent"].includes(previous.request.status)) return previous
          const nextRequest: ProjectRequest = {
            ...previous.request,
            title: record.title,
            description: record.description,
            budget: record.budget_cents / 100,
            status: record.status === "Sent" ? "Sent" : "Draft",
          }
          if (JSON.stringify(previous.request) === JSON.stringify(nextRequest)) return previous
          return { ...previous, request: nextRequest }
        })
      })
      .catch(() => {
        if (syncGeneration.current === generation) setApiState("offline")
      })
    return () => { syncGeneration.current++ }
  }, [s.account])
  useEffect(() => {
    setProposalDraft(s.proposal)
  }, [proposalSignature, s.account])
  useEffect(() => {
    setEvidence(milestone.evidence)
    setFeedback("")
  }, [milestoneId, s.account])
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(""), 5000)
    return () => clearTimeout(t)
  }, [toast])
  useEffect(() => {
    if (!mobile) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobile(false)
        document.querySelector<HTMLButtonElement>(".mobile-menu")?.focus()
      }
    }
    document.addEventListener("keydown", closeOnEscape)
    return () => document.removeEventListener("keydown", closeOnEscape)
  }, [mobile])
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    },
    [],
  )
  const modalOpen = Boolean(confirm || accountDialog)
  useEffect(() => {
    if (!modalOpen) return
    triggerRef.current = (document.activeElement as HTMLElement)
    const root = modalRef.current
    const selectors =
      'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]'
    const first = root?.querySelector<HTMLElement>(selectors)
    first?.focus()
    function keys(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setConfirm(null)
        setAccountDialog(false)
      }
      if (e.key === "Tab") {
        const elements = Array.from(
          root?.querySelectorAll<HTMLElement>(selectors) ?? [],
        )
        const start = elements[0],
          end = elements.at(-1)
        if (e.shiftKey && document.activeElement === start) {
          e.preventDefault()
          end?.focus()
        }
        if (!e.shiftKey && document.activeElement === end) {
          e.preventDefault()
          start?.focus()
        }
      }
    }
    document.addEventListener("keydown", keys)
    return () => {
      document.removeEventListener("keydown", keys)
      triggerRef.current?.focus()
    }
  }, [modalOpen])

  function act(action: Action, success?: string) {
    try {
      const next = transition(stateRef.current, action)
      stateRef.current = next
      setState(next)
      setError("")
      if (success) setToast(success)
      return true
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to perform this action.",
      )
      return false
    }
  }
  function go(next: Page) {
    setPage(next)
    setMobile(false)
    setError("")
    setNotifications(false)
    window.scrollTo(0, 0)
  }
  function delayed(label: string, work: () => void) {
    if (busy) return
    setBusy(label)
    timerRef.current = setTimeout(() => {
      work()
      setBusy("")
      timerRef.current = null
    }, 500)
  }
  function switchAccount(id: UserId) {
    if (timerRef.current) clearTimeout(timerRef.current)
    setBusy("")
    act({ type: "switch", account: id })
    setAccountDialog(false)
    setConfirm(null)
    go("Overview")
    setMessage("")
    setEvidence("")
    setFeedback("")
    setToast(
      `Demo account changed to ${s.users[id].name}. Ownership is unchanged.`,
    )
  }
  async function saveRequest(send: boolean) {
    if (apiBusy || busy) return
    setError("")
    if (s.account !== "jordan") {
      setError("Only Ahmad can save or send this request.")
      return
    }
    if (apiState !== "connected") {
      setError("FastAPI is not connected. Start the backend on port 8000 and retry.")
      return
    }
    // Confirm the same business validations before touching SQLite.
    try {
      transition(stateRef.current, {
        type: "request-save", request: requestDraft, send,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid request.")
      return
    }
    // Backend v0.1 has NO PATCH endpoint: never claim revisions are saved.
    if (activeRequestId.current && stateRef.current.request.status !== "Draft") {
      setError("This backend version cannot save request revisions yet. Existing request is unchanged in SQLite.")
      return
    }
    if (activeRequestId.current && !send) {
      setError("Draft already exists in SQLite. Editing it requires a PATCH endpoint, which is not implemented yet.")
      return
    }
    const persisted = apiRequests.find((r) => r.id === activeRequestId.current)
    if (send && persisted && (
      persisted.title !== requestDraft.title.trim() ||
      persisted.description !== requestDraft.description.trim() ||
      persisted.budget_cents !== dollarsToCents(requestDraft.budget)
    )) {
      setError("Your unsaved edits differ from the SQLite draft. Backend v0.1 cannot edit drafts yet. Reload the saved request before sending.")
      return
    }
    setApiBusy(true)
    try {
      let id = activeRequestId.current
      if (!id) {
        const created = await createProjectRequest({
          title: requestDraft.title.trim(),
          description: requestDraft.description.trim(),
          budget_cents: dollarsToCents(requestDraft.budget),
          currency: "USD",
          freelancer_id: "alex",
        }, "jordan")
        id = created.id
        activeRequestId.current = id
      }
      if (send) {
        await sendProjectRequest(id, "jordan")
      }
      // A successful API response is required before updating local demo state.
      act({ type: "request-save", request: requestDraft, send },
        send ? "Request sent and saved in SQLite. Switch to Fulan to view it." :
               "Draft created in SQLite. Backend v0.1 cannot edit it yet.")
      const records = await getProjectRequests("jordan")
      setApiRequests(records)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Backend request failed.")
    } finally {
      setApiBusy(false)
    }
  }
  function submitProposal(submit: boolean) {
    delayed(submit ? "Submitting proposal…" : "Saving proposal…", () =>
      act(
        { type: "proposal-save", proposal: proposalDraft, submit },
        submit
          ? "Proposal submitted. Ahmad can now review it."
          : "Proposal draft saved.",
      ),
    )
  }
  function ask(title: string, text: string, label: string, action: Action) {
    setError("")
    setConfirm({ title, text, label, action })
  }
  function reset() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setBusy("")
    act({ type: "reset" })
    setRequestDraft(createInitialState().request)
    setProposalDraft(createInitialState().proposal)
    setAnalysis(false)
    setAnalysisText(createInitialState().proposal.scope)
    setInvoiceId("")
    setInvoiceMilestone("m1")
    setMilestoneId("m1")
    setEvidence("")
    setFeedback("")
    setMessage("")
    setCounter(1500)
    setProjectTab("Milestones")
    setDue("2026-11-20")
    setInvoiceNote(
      "Invoice for the approved project milestone. Thank you for the collaboration.",
    )
    go("Overview")
    setToast("Local demo reset only. Persisted SQLite requests remain; refresh to view them.")
  }
  const nav: {
    page: Page
    label: string
    icon: string
  }[] = [
    { page: "Overview", label: "Overview", icon: "grid" },
    {
      page: "Requests",
      label: clientView ? "My Requests" : "Project Requests",
      icon: "folder",
    },
    { page: "Proposals", label: "Proposals", icon: "invoice" },
    { page: "Projects", label: "Projects", icon: "folder" },
    ...(!clientView
      ? [
          {
            page: "AI Workspace" as Page,
            label: "AI Workspace",
            icon: "spark",
          },
          { page: "Milestones" as Page, label: "Milestones", icon: "clock" },
        ]
      : [{ page: "Approvals" as Page, label: "Approvals", icon: "check" }]),
    {
      page: "Invoices",
      label: clientView ? "Payments" : "Invoices",
      icon: "wallet",
    },
    { page: "Activity", label: "Activity", icon: "clock" },
    { page: "Live Commerce", label: "Live AI + PayPal", icon: "spark" },
    { page: "Settings", label: "Settings", icon: "grid" },
  ]
  const journey = [
    {
      label: "Create Request",
      done: s.request.status !== "Draft",
      page: "Requests" as Page,
      persona: "jordan" as UserId,
    },
    {
      label: "Submit Proposal",
      done: s.proposalHistory.length > 0,
      page: "Proposals" as Page,
      persona: "alex" as UserId,
    },
    {
      label: "Accept Agreement",
      done: projectActive,
      page: "Proposals" as Page,
      persona: (s.proposal.status === "Accepted" && !s.agreement
        ? "alex"
        : s.agreement && !s.confirmations.includes("alex")
          ? "alex"
          : "jordan") as UserId,
    },
    {
      label: "Review Milestone",
      done: complete > 0,
      page: (submitted.length ? "Approvals" : "Milestones") as Page,
      persona: (submitted.length ? "jordan" : "alex") as UserId,
    },
    {
      label: "Create Invoice",
      done: s.invoices.length > 0,
      page: "Invoices" as Page,
      persona: "alex" as UserId,
    },
    {
      label: "Simulate Payment",
      done: paid > 0,
      page: "Invoices" as Page,
      persona: "jordan" as UserId,
    },
  ]
  const nextStep = journey.find((j) => !j.done)
  const milestonesView = (
    <>
      <div className="milestone-list">
        {s.milestones.map((m, i) => (
          <div className="milestone-row" key={m.id}>
            <span
              className={`step-dot ${
                ["Approved", "Paid"].includes(m.status)
                  ? "complete"
                  : m.status === "In review"
                    ? "current"
                    : ""
              }`}
            >
              {["Approved", "Paid"].includes(m.status) ? (
                <Icon name="check" size={14} />
              ) : (
                i + 1
              )}
            </span>
            <div className="milestone-info">
              <strong>{m.name}</strong>
              <span>{displayDate(m.date)}</span>
            </div>
            <span className="milestone-price">{money(m.amount)}</span>
            <Badge>{m.status}</Badge>
          </div>
        ))}
      </div>
      <div className="card-bottom">
        <strong>
          Total {money(s.milestones.reduce((t, m) => t + m.amount, 0))} USD
        </strong>
        <span>{complete} of 3 approved</span>
      </div>
    </>
  )
  const agreementView = s.agreement ? (
    <>
      <div className="agreement-version">
        <Badge>Confirmed agreement v{s.agreement.version}</Badge>
        <span>{time(s.agreement.timestamp)}</span>
      </div>
      <div className="detail-grid">
        <div>
          <span>Client / workspace member</span>
          <strong>Ahmad · ahmad@demo.invalid</strong>
        </div>
        <div>
          <span>Freelancer / project owner</span>
          <strong>Fulan · fulan@demo.invalid</strong>
        </div>
        <div>
          <span>Agreed total</span>
          <strong>{money(s.agreement.amount)} USD</strong>
        </div>
        <div>
          <span>Final deadline</span>
          <strong>{displayDate(s.agreement.deadline)}</strong>
        </div>
      </div>
      <p className="agreement-text">{s.agreement.scope}</p>
      {s.agreement.milestones.map((m) => (
        <div className="agreement-milestone" key={m.id}>
          <strong>
            {m.name} · {money(m.amount)} · {displayDate(m.date)}
          </strong>
          <p>{m.criteria}</p>
        </div>
      ))}
      <p className="fine-print">
        Fictional agreement confirmed by both demo parties. Not a legal
        signature service.
      </p>
    </>
  ) : (
    <Empty
      title="No confirmed agreement yet"
      text="Ahmad must accept Fulan’s proposal, then Fulan confirms the agreement."
      action={
        <Button onClick={() => go("Proposals")}>
          Go to proposals <Icon name="arrow" size={16} />
        </Button>
      }
    />
  )
  const confirmMilestones = s.agreement && (
    <Card className="mt-card">
      <SectionTitle
        title="Confirm the milestones together"
        subtitle="AI can recommend. Only the assigned people can confirm."
        action={<Badge>{s.confirmations.length}/2 confirmations</Badge>}
      />
      {!s.suggested ? (
        <>
          <p className="body-copy">
            Display the fixed AI suggestion alongside the human-agreed plan.
            This does not edit or finalize any milestones.
          </p>
          <Button
            onClick={() =>
              delayed("Preparing sample recommendations…", () =>
                act(
                  { type: "suggest" },
                  "Sample recommendations ready. Review the agreed plan before confirming.",
                ),
              )
            }
            disabled={!!busy}
          >
            <Icon name="spark" size={16} /> Show simulated AI breakdown
          </Button>
        </>
      ) : (
        <>
          <div className="change-note">
            Simulated recommendation: keep the three agreed stages, with
            explicit evidence and acceptance criteria. The confirmed agreement
            is unchanged.
          </div>
          {milestonesView}
          <div className="confirmation-parties">
            {(["jordan", "alex"] as UserId[]).map((id) => (
              <span key={id}>
                <Icon
                  name={s.confirmations.includes(id) ? "check" : "clock"}
                  size={15}
                />
                {s.users[id].name}:{" "}
                {s.confirmations.includes(id) ? "Confirmed" : "Pending"}
              </span>
            ))}
          </div>
          <Button
            disabled={
              s.confirmations.includes(s.account) ||
              !(can(s, "accept") || can(s, "confirm"))
            }
            onClick={() =>
              ask(
                "Confirm milestone plan?",
                "Review the amounts, deadlines, and acceptance criteria. This confirms the existing human-agreed plan, not an AI decision.",
                "Confirm milestones",
                { type: "milestones-confirm" },
              )
            }
          >
            {s.confirmations.includes(s.account)
              ? "Your confirmation recorded"
              : "Confirm agreed milestones"}
          </Button>
          <p className="fine-print">
            Switch Demo Account to obtain the other party’s independent
            confirmation.
          </p>
        </>
      )}
    </Card>
  )

  return (
    <div className="app-shell upgraded">
      {mobile && (
        <div className="sidebar-overlay" onClick={() => setMobile(false)} />
      )}
      <aside
        className={`sidebar ${mobile ? "open" : ""}`}
        aria-label="Workspace navigation"
      >
        <button
          className="brand-button"
          onClick={onHome}
          aria-label="MilestonePay home"
        >
          <Logo />
        </button>
        <div className="workspace-selector">
          <span className="workspace-avatar">NS</span>
          <div>
            <strong>Amanah collaboration</strong>
            <span>Shared demo workspace</span>
          </div>
          <Badge>Demo</Badge>
        </div>
        <div className="nav-label">{s.role.toUpperCase()} WORKSPACE</div>
        <nav className="side-nav">
          {nav.map((n) => (
            <button
              key={n.page}
              aria-current={page === n.page ? "page" : undefined}
              className={page === n.page ? "active" : ""}
              onClick={() => go(n.page)}
            >
              <Icon name={n.icon} size={19} />
              <span>{n.label}</span>
              {n.page === "Requests" && (
                <span className="nav-count">{requestVisible ? 1 : 0}</span>
              )}
              {n.page === "Approvals" && submitted.length > 0 && (
                <span className="nav-count">{submitted.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="demo-card">
            <span className="demo-symbol">
              <Icon name="spark" size={18} />
            </span>
            <strong>One project. Two perspectives.</strong>
            <p>Explore the complete collaboration with Fulan and Ahmad.</p>
            <button onClick={() => setAccountDialog(true)}>
              Switch Demo Account <Icon name="arrow" size={14} />
            </button>
          </div>
          <button className="profile" onClick={() => go("Settings")}>
            <span className="avatar">{initials(user.name)}</span>
            <div>
              <strong>{user.name}</strong>
              <span>{s.role} · Demo account</span>
            </div>
            <Icon name="down" size={15} />
          </button>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMobile(true)}
            >
              <Icon name="menu" />
            </button>
            <span>Workspace</span>
            <span className="slash">/</span>
            <strong>{nav.find((n) => n.page === page)?.label ?? page}</strong>
          </div>
          <div className="topbar-actions">
            <span className="demo-pill">
              <span /> {page === "Live Commerce" ? "Sandbox API" : "Demo Mode"}
            </span>
            <button
              className="account-control"
              onClick={() => setAccountDialog(true)}
            >
              <span className="avatar small">{initials(user.name)}</span>
              <span>Switch Demo Account</span>
              <Icon name="down" size={14} />
            </button>
            <button
              className="notification-button"
              aria-label="Open latest activity"
              aria-expanded={notifications}
              onClick={() => setNotifications(!notifications)}
            >
              <Icon name="bell" />
            </button>
            {notifications && (
              <div className="notification-popover">
                <strong>Latest workspace update</strong>
                <p>{s.events.at(-1)?.text}</p>
                <button onClick={() => go("Activity")}>View activity →</button>
              </div>
            )}
          </div>
        </header>
        <main className="main-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {page === "Overview"
                  ? `${s.role.toUpperCase()} OVERVIEW · SAMPLE WORKSPACE`
                  : "AMANAH STUDIO / COLLABORATION"}
              </div>
              <h1>
                {page === "Overview"
                  ? `Good morning, ${user.name.split(" ")[0]}`
                  : {
                      Requests: clientView
                        ? "Great work starts with a clear brief."
                        : "Your next collaboration starts here.",
                      Proposals: "Find the right way forward.",
                      Projects: "Every milestone, in focus.",
                      "AI Workspace": "A little clarity. A better decision.",
                      Milestones: "Make progress tangible.",
                      Approvals: "Great work. Your final say.",
                      Invoices: clientView
                        ? "A clear view of what’s due."
                        : "From approved to paid.",
                      Activity: "Every step, in one place.",
                      "Live Commerce": "Real agent, real sandbox API.",
                      Settings: "Your identity. Your workspace.",
                    }[page]}
              </h1>
              <p>
                {page === "Overview"
                  ? clientView
                    ? "Shape the scope, review the work, and keep your project moving."
                    : "Turn incoming opportunities into clear agreements and meaningful progress."
                  : page === "Live Commerce"
                    ? "Persistent FastAPI + SQLite, local Ollama AI and PayPal Sandbox invoicing. Payments use virtual funds; personas are demo-only."
                    : "Fictional October–November 2026 scenario. The classic workspace below is a local UI simulation."}
              </p>
            </div>
            <div className="heading-actions">
              {page === "Overview" && (
                <Button onClick={() => go(nextStep?.page ?? "Projects")}>
                  {nextStep?.label ?? "View project"}
                  <Icon name="arrow" size={16} />
                </Button>
              )}
              {page === "Requests" &&
                ownedClient &&
                s.request.status === "Draft" && (
                  <Badge>New Project Request</Badge>
                )}
            </div>
          </div>
          {page !== "Live Commerce" && <section className="journey" aria-label="Demo Journey">
            <div className="journey-heading">
              <strong>
                <Icon name="spark" size={16} /> Demo Journey
              </strong>
              <span>
                {nextStep
                  ? `Next: ${s.users[nextStep.persona].name} · ${nextStep.label}`
                  : "First milestone journey complete. Continue with the remaining milestones."}
              </span>
              <button
                onClick={() =>
                  ask(
                    "Reset the demo?",
                    "This clears local demo progress only. Requests already stored in SQLite will remain in the database.",
                    "Reset Demo",
                    { type: "reset" },
                  )
                }
              >
                Reset Demo
              </button>
            </div>
            <div className="journey-steps">
              {journey.map((j, i) => (
                <button
                  key={j.label}
                  className={`${j.done ? "done" : ""} ${
                    nextStep === j ? "next" : ""
                  }`}
                  onClick={() => {
                    go(j.page)
                    if (s.account !== j.persona)
                      setToast(
                        `This step belongs to ${s.users[j.persona].name}. Use Switch Demo Account; your identity is not changed automatically.`,
                      )
                  }}
                >
                  <span>
                    {j.done ? <Icon name="check" size={13} /> : i + 1}
                  </span>
                  {j.label}
                </button>
              ))}
            </div>
          </section>}
          {error && (
            <div className="error-banner" role="alert">
              <Icon name="help" size={18} />
              <span>{error}</span>
              <button onClick={() => setError("")} aria-label="Dismiss error">
                ×
              </button>
            </div>
          )}
          {busy && (
            <div className="loading-banner" role="status">
              <span className="loading-dot" />
              {busy} <span>Local demo simulation</span>
            </div>
          )}

          {page === "Overview" && (
            <>
              <div className="stats-grid">
                {(clientView
                  ? [
                      {
                        label: "Submitted requests",
                        value:
                          ownedClient && s.request.status !== "Draft"
                            ? "01"
                            : "00",
                        detail: s.request.status,
                        icon: "folder",
                      },
                      {
                        label: "Received proposals",
                        value: ownedClient
                          ? String(s.proposalHistory.length).padStart(2, "0")
                          : "00",
                        detail: s.proposalHistory.length
                          ? s.proposal.status
                          : "Waiting for Fulan",
                        icon: "invoice",
                      },
                      {
                        label: "Deliverables to review",
                        value: ownedClient
                          ? String(submitted.length).padStart(2, "0")
                          : "00",
                        detail: "Your approval is required",
                        icon: "check",
                        className: "pink",
                      },
                      {
                        label: "Pending invoices",
                        value: ownedClient
                          ? money(
                              pendingInvoices.reduce((t, i) => t + i.amount, 0),
                            )
                          : "$0",
                        detail: "USD · Demo amounts",
                        icon: "wallet",
                        className: "green",
                      },
                    ]
                  : [
                      {
                        label: "Incoming requests",
                        value:
                          ownedFreelancer &&
                          ["Sent", "Under Review"].includes(s.request.status)
                            ? "01"
                            : "00",
                        detail: "Assigned to your identity",
                        icon: "folder",
                      },
                      {
                        label: "Pending proposals",
                        value:
                          ownedFreelancer &&
                          ["Submitted", "Revision Requested"].includes(
                            s.proposal.status,
                          )
                            ? "01"
                            : "00",
                        detail: s.proposalHistory.length
                          ? s.proposal.status
                          : "No submitted proposals",
                        icon: "invoice",
                      },
                      {
                        label: "Awaiting client review",
                        value: ownedFreelancer
                          ? String(submitted.length).padStart(2, "0")
                          : "00",
                        detail: "Submitted deliverables",
                        icon: "clock",
                        className: "pink",
                      },
                      {
                        label: "Outstanding invoices",
                        value: ownedFreelancer
                          ? money(
                              pendingInvoices.reduce((t, i) => t + i.amount, 0),
                            )
                          : "$0",
                        detail: "USD · Demo amounts",
                        icon: "wallet",
                        className: "green",
                      },
                    ]
                ).map((c) => (
                  <Card
                    key={c.label}
                    className={`stat-card ${c.className ?? ""}`}
                  >
                    <div className="stat-top">
                      <span>{c.label}</span>
                      <Icon name={c.icon} size={18} />
                    </div>
                    <div className="stat-value">{c.value}</div>
                    <p>{c.detail}</p>
                  </Card>
                ))}
              </div>
              <div className="dashboard-grid">
                <div className="dashboard-left">
                  <Card>
                    <SectionTitle
                      title={
                        projectActive
                          ? "Active project"
                          : clientView
                            ? "Your collaboration"
                            : "Your project pipeline"
                      }
                      subtitle="One clear plan. A shared way forward."
                      action={
                        <Badge>
                          {s.agreement
                            ? projectActive
                              ? "In progress"
                              : "Pending milestones"
                            : "Pre-project"}
                        </Badge>
                      }
                    />
                    {requestVisible ? (
                      <div className="project-inner">
                        <div className="project-heading">
                          <span className="project-icon">
                            <Icon name="folder" size={24} />
                          </span>
                          <div>
                            <h3>{s.request.title}</h3>
                            <p>
                              Ahmad · Amanah Studio{" "}
                              <span className="dot-sep">·</span> Fulan
                            </p>
                          </div>
                        </div>
                        <div className="project-metrics">
                          <div>
                            <span>
                              {s.agreement
                                ? "Agreed value"
                                : "Estimated budget"}
                            </span>
                            <strong>
                              {money(s.agreement?.amount ?? s.request.budget)}{" "}
                              <small>USD</small>
                            </strong>
                          </div>
                          <div>
                            <span>Active projects</span>
                            <strong>{projectActive ? "1" : "0"}</strong>
                          </div>
                          <div>
                            <span>Target completion</span>
                            <strong>
                              {displayDate(
                                s.agreement?.deadline ?? s.request.deadline,
                              )}
                            </strong>
                          </div>
                        </div>
                        <div className="progress-label">
                          <span>Milestones approved</span>
                          <strong>{complete}/3</strong>
                        </div>
                        <div className="progress-track">
                          <span style={{ width: `${(complete / 3) * 100}%` }} />
                        </div>
                        <div className="project-footer">
                          <span className="subtle-label">
                            {s.agreement
                              ? `Agreement v${s.agreement.version}`
                              : `Request ${s.request.status.toLowerCase()}`}
                          </span>
                          <button
                            className="text-link"
                            onClick={() =>
                              go(s.agreement ? "Projects" : "Requests")
                            }
                          >
                            Open workspace <Icon name="arrow" size={16} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <Empty
                        title="No assigned projects in this role"
                        text="Activating another role does not transfer this project. Switch to your assigned profile or use the separate demo account."
                        action={
                          <Button secondary onClick={() => go("Settings")}>
                            Account Settings
                          </Button>
                        }
                      />
                    )}
                  </Card>
                  <Card>
                    <SectionTitle
                      title={
                        clientView
                          ? "Pending agreements & review"
                          : "Milestones in progress"
                      }
                      action={
                        <button
                          className="text-link"
                          onClick={() => go("Projects")}
                        >
                          View project <Icon name="arrow" size={15} />
                        </button>
                      }
                    />
                    {s.agreement ? (
                      milestonesView
                    ) : (
                      <Empty
                        title={
                          s.proposal.status === "Accepted"
                            ? "Waiting for freelancer confirmation"
                            : "Your agreement is ahead"
                        }
                        text={
                          s.proposal.status === "Accepted"
                            ? "Fulan must confirm Ahmad’s accepted proposal, then both people confirm milestones."
                            : "Send the request and agree on a proposal before starting project work."
                        }
                      />
                    )}
                  </Card>
                  <Card>
                    <SectionTitle
                      title="Recent activity"
                      action={
                        <button
                          className="text-link"
                          onClick={() => go("Activity")}
                        >
                          All activity <Icon name="arrow" size={15} />
                        </button>
                      }
                    />
                    <History events={s.events.slice(-3).reverse()} />
                  </Card>
                </div>
                <div className="dashboard-right">
                  <section className="ai-insight">
                    <div className="insight-label">
                      <Icon name="spark" size={19} />
                      <span>YOUR NEXT CLEAR STEP</span>
                      <span className="ai-tag">DEMO</span>
                    </div>
                    <h2>
                      {clientView
                        ? "A shared vision.\nA stronger outcome."
                        : "Less guesswork.\nMore moving forward."}
                    </h2>
                    <p>
                      {nextStep
                        ? `${nextStep.label} is the next step in this guided sample. ${s.users[nextStep.persona].name} owns this action.`
                        : "Your first payment journey is complete. The remaining milestones are ready when you are."}
                    </p>
                    <Button
                      secondary
                      onClick={() => go(nextStep?.page ?? "Milestones")}
                    >
                      Continue the journey <Icon name="arrow" size={17} />
                    </Button>
                    <span className="ai-disclaimer">
                      AI assists. People approve. No real funds move.
                    </span>
                  </section>
                  <Card className="invoice-summary">
                    <SectionTitle
                      title={
                        clientView ? "Payment history" : "Invoice overview"
                      }
                    />
                    <div className="invoice-line">
                      <span>Simulated paid</span>
                      <strong>{money(paid)}</strong>
                    </div>
                    <div className="invoice-line">
                      <span>Outstanding</span>
                      <strong>
                        {money(
                          pendingInvoices.reduce((t, i) => t + i.amount, 0),
                        )}
                      </strong>
                    </div>
                    <div className="invoice-line">
                      <span>Agreement value</span>
                      <strong>
                        {s.agreement ? money(total) : "Not yet agreed"}
                      </strong>
                    </div>
                    <p className="fine-print">
                      All amounts in USD. No verified transactions.
                    </p>
                    <button
                      className="text-link"
                      onClick={() => go("Invoices")}
                    >
                      {clientView ? "View payments" : "Manage invoices"}{" "}
                      <Icon name="arrow" size={16} />
                    </button>
                    <div className="sandbox-note">
                      <Icon name="link" size={14} /> This classic Overview shows sample values.
                      PayPal Sandbox verification is available in Live AI + PayPal.
                    </div>
                  </Card>
                  <div className="confidence-note">
                    <span className="confidence-mark">
                      <Icon name="check" size={19} />
                    </span>
                    <div>
                      <strong>Identity stays with the person.</strong>
                      <p>
                        Demo role checks are not real security.
                        <br />
                        Project ownership never follows a selector.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {page === "Live Commerce" && <CommerceLab actor={s.account} />}
          {page === "Requests" && (
            <>
            <Card>
              <div className="section-title">
                <h3>Live FastAPI requests</h3>
                <Badge>{apiState === "connected" ? "SQLite connected" : apiState === "loading" ? "Connecting" : "Backend offline"}</Badge>
              </div>
              <p className="fine-print">
                Create / Send / List use FastAPI. Proposal, agreement, AI and invoice actions below are local demo simulations.
                Edit existing requests is not implemented in this page; use Live AI + PayPal for the persistent proposal, milestone, AI and invoice flow.
              </p>
              {apiState === "connected" && (
                <div className="history-list">
                  {apiRequests.length === 0 ? <p className="fine-print">No persisted requests are visible to this account.</p> :
                    apiRequests.map((r) => (
                      <div className="history-event" key={r.id}>
                        <span className="history-dot" />
                        <div>
                          <strong>{r.title} · {r.status}</strong>
                          <p>{money(r.budget_cents / 100)} · {r.client_id} → {r.freelancer_id}</p>
                          <p className="fine-print">Database ID: {r.id}</p>
                        </div>
                      </div>
                    ))}
                </div>
              )}
              <div className="button-row">
                <Button secondary disabled={apiBusy} onClick={async () => {
                  setApiState("loading")
                  try {
                    const rows = await getProjectRequests(s.account)
                    setApiRequests(rows)
                    setApiState("connected")
                  } catch (e) {
                    setApiState("offline")
                    setError(e instanceof Error ? e.message : "Refresh failed.")
                  }
                }}>Refresh API list</Button>
              </div>
            </Card>
            <div className="two-column">
              <Card>
                <SectionTitle
                  title={
                    ownedClient ? "New Project Request" : "Assigned request"
                  }
                  subtitle={
                    ownedClient
                      ? "A complete brief helps Fulan prepare a thoughtful proposal."
                      : "Only requests invited to your demo identity are shown."
                  }
                  action={
                    <Badge>
                      {requestVisible ? s.request.status : "No requests"}
                    </Badge>
                  }
                />
                {!requestVisible ? (
                  <Empty
                    title="No incoming requests"
                    text={
                      s.request.status === "Draft"
                        ? "Ahmad’s draft has not been sent. Switch Demo Account to Ahmad and send it first."
                        : "This role has no assigned requests."
                    }
                  />
                ) : ownedClient ? (
                  <>
                    <fieldset
                      disabled={
                        !!busy ||
                        !["Draft", "Sent", "Under Review"].includes(
                          s.request.status,
                        ) ||
                        s.proposalHistory.length > 0
                      }
                    >
                      <div className="form-grid">
                        <div className="full-span">
                          <Field label="Project title *">
                            <input
                              required
                              value={requestDraft.title}
                              onChange={(e) =>
                                setRequestDraft({
                                  ...requestDraft,
                                  title: e.target.value,
                                })
                              }
                            />
                          </Field>
                        </div>
                        <div className="full-span">
                          <Field label="Description *">
                            <textarea
                              rows={4}
                              value={requestDraft.description}
                              onChange={(e) =>
                                setRequestDraft({
                                  ...requestDraft,
                                  description: e.target.value,
                                })
                              }
                            />
                          </Field>
                        </div>
                        <div className="full-span">
                          <Field label="Category *">
                            <select
                              value={requestDraft.category}
                              onChange={(e) =>
                                setRequestDraft({
                                  ...requestDraft,
                                  category: e.target.value,
                                })
                              }
                            >
                              <option>Web design & development</option>
                              <option>UX & product design</option>
                              <option>Frontend development</option>
                            </select>
                          </Field>
                        </div>
                        <Field label="Estimated budget *">
                          <input
                            type="number"
                            min="1"
                            value={requestDraft.budget}
                            onChange={(e) =>
                              setRequestDraft({
                                ...requestDraft,
                                budget: Number(e.target.value),
                              })
                            }
                          />
                        </Field>
                        <Field label="Currency">
                          <select value="USD" disabled>
                            <option>USD</option>
                          </select>
                        </Field>
                        <div className="full-span">
                          <Field
                            label="Expected deadline *"
                            hint="October–November 2026 · demo scenario"
                          >
                            <input
                              type="date"
                              min="2026-10-18"
                              max="2026-11-30"
                              value={requestDraft.deadline}
                              onChange={(e) =>
                                setRequestDraft({
                                  ...requestDraft,
                                  deadline: e.target.value,
                                })
                              }
                            />
                          </Field>
                        </div>
                        <div className="full-span">
                          <Field label="Requirements *">
                            <textarea
                              rows={3}
                              value={requestDraft.requirements}
                              onChange={(e) =>
                                setRequestDraft({
                                  ...requestDraft,
                                  requirements: e.target.value,
                                })
                              }
                            />
                          </Field>
                        </div>
                        <div className="full-span">
                          <Field
                            label="Optional attachments"
                            hint="Filenames only, kept locally. Files are not uploaded or analyzed."
                          >
                            <input
                              type="file"
                              multiple
                              onChange={(e) =>
                                setRequestDraft({
                                  ...requestDraft,
                                  attachments: Array.from(
                                    e.target.files ?? [],
                                  ).map((f) => f.name),
                                })
                              }
                            />
                          </Field>
                          {requestDraft.attachments.length > 0 && (
                            <p className="fine-print">
                              {requestDraft.attachments.join(", ")}
                            </p>
                          )}
                        </div>
                        <div className="full-span">
                          <Field label="Invited freelancer">
                            <select value="alex" disabled>
                              <option value="alex">
                                Fulan · fulan@demo.invalid
                              </option>
                            </select>
                          </Field>
                        </div>
                      </div>
                    </fieldset>
                    <div className="button-row">
                      <Button
                        secondary
                        disabled={
                          !!busy || apiBusy ||
                          !["Draft", "Sent", "Under Review"].includes(
                            s.request.status,
                          ) ||
                          s.proposalHistory.length > 0
                        }
                        onClick={() => saveRequest(false)}
                      >
                        {s.request.status === "Draft"
                          ? "Save draft"
                          : "Save tracked revision"}
                      </Button>
                      {s.request.status === "Draft" && (
                        <Button
                          disabled={!!busy || apiBusy}
                          onClick={() => saveRequest(true)}
                        >
                          Send project request <Icon name="arrow" size={16} />
                        </Button>
                      )}
                    </div>
                    {s.proposalHistory.length > 0 && (
                      <div className="change-note">
                        A proposal has been received. Use the proposal
                        conversation to track scope or budget changes.
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <h2 className="large-card-title">{s.request.title}</h2>
                    <p className="body-copy">{s.request.description}</p>
                    <div className="detail-grid">
                      <div>
                        <span>Client</span>
                        <strong>Ahmad · Amanah Studio</strong>
                      </div>
                      <div>
                        <span>Estimated budget</span>
                        <strong>{money(s.request.budget)} USD</strong>
                      </div>
                      <div>
                        <span>Deadline</span>
                        <strong>{displayDate(s.request.deadline)}</strong>
                      </div>
                      <div>
                        <span>Category</span>
                        <strong>{s.request.category}</strong>
                      </div>
                    </div>
                    <h3>Requirements</h3>
                    <p className="body-copy">{s.request.requirements}</p>
                    <p className="fine-print">
                      Attachments:{" "}
                      {s.request.attachments.join(", ") || "None supplied"}
                    </p>
                    <div className="button-row">
                      {s.request.status === "Sent" && (
                        <Button
                          onClick={() =>
                            act(
                              { type: "request-review" },
                              "Request is under review. Build your proposal next.",
                            )
                          }
                        >
                          Review request
                        </Button>
                      )}
                      {["Sent", "Under Review"].includes(s.request.status) && (
                        <Button
                          secondary
                          onClick={() =>
                            ask(
                              "Decline this request?",
                              "Ahmad will see that this request was rejected. No agreement is created.",
                              "Decline request",
                              { type: "request-reject" },
                            )
                          }
                        >
                          Decline
                        </Button>
                      )}
                      {s.request.status === "Under Review" && (
                        <Button onClick={() => go("Proposals")}>
                          Build proposal <Icon name="arrow" size={16} />
                        </Button>
                      )}
                      {s.request.status === "Proposal Received" && (
                        <Button onClick={() => go("Proposals")}>
                          View proposal
                        </Button>
                      )}
                    </div>
                  </>
                )}
              </Card>
              <div>
                <Card>
                  <SectionTitle
                    title="Request progress"
                    subtitle={`Request v${s.request.version} · Changes after sending are tracked.`}
                  />
                  <ol className="status-timeline">
                    {[
                      "Draft",
                      "Sent",
                      "Under Review",
                      "Proposal Received",
                      "Accepted",
                    ].map((status, i) => (
                      <li key={status}>
                        <span
                          className={`step-dot ${
                            [
                              "Draft",
                              "Sent",
                              "Under Review",
                              "Proposal Received",
                              "Accepted",
                            ].indexOf(s.request.status) >= i
                              ? "complete"
                              : ""
                          }`}
                        >
                          {i + 1}
                        </span>
                        <span>{status}</span>
                        {s.request.status === status && <Badge>Current</Badge>}
                      </li>
                    ))}
                  </ol>
                  {s.request.status === "Rejected" && <Badge>Rejected</Badge>}
                  <div className="limitation">
                    <p>
                      Only Ahmad can edit this brief. Only Fulan can review the
                      assigned request. Activating an extra role does not change
                      these assignments.
                    </p>
                  </div>
                </Card>
                <Card className="mt-card">
                  <SectionTitle title="Request history" />
                  {s.requestHistory.map((snapshot) => (
                    <details className="snapshot" key={snapshot.version}>
                      <summary>Request v{snapshot.version} · {snapshot.request.status} · {time(snapshot.at)}</summary>
                      <p><strong>{snapshot.request.title}</strong></p>
                      <p>{snapshot.request.description}</p>
                      <p>{snapshot.request.requirements}</p>
                      <p>{snapshot.request.category} · {money(snapshot.request.budget)} USD · {displayDate(snapshot.request.deadline)}</p>
                      <p>Attachments: {snapshot.request.attachments.join(", ") || "None"}</p>
                      <p>Invited: {s.users[snapshot.request.freelancerId].name}</p>
                    </details>
                  ))}
                  <History
                    events={s.events
                      .filter((e) => /request/i.test(e.text))
                      .slice(-5)}
                  />
                </Card>
              </div>
            </div>
            </>
          )}

          {page === "Proposals" && (
            <>
              <div className="two-column">
                <div>
                  <Card>
                    <SectionTitle
                      title={
                        editableProposal
                          ? "Proposal Builder"
                          : "Project proposal"
                      }
                      subtitle="Human-authored terms, with optional sample AI assistance."
                      action={<Badge>{s.proposal.status}</Badge>}
                    />
                    {!requestVisible ||
                    (!ownedFreelancer && !s.proposalHistory.length) ||
                    (["Draft", "Sent", "Rejected"].includes(s.request.status) &&
                      !s.proposalHistory.length) ? (
                      <Empty
                        title="Start with an assigned request"
                        text="Ahmad sends the request, then Fulan opens it for review before building a proposal."
                        action={
                          <Button onClick={() => go("Requests")}>
                            View requests <Icon name="arrow" size={16} />
                          </Button>
                        }
                      />
                    ) : (
                      <>
                        <fieldset disabled={!editableProposal || !!busy}>
                          <div className="form-grid">
                            <div className="full-span">
                              <Field label="Scope of work *">
                                <textarea
                                  rows={4}
                                  value={proposalView.scope}
                                  onChange={(e) =>
                                    setProposalDraft({
                                      ...proposalDraft,
                                      scope: e.target.value,
                                    })
                                  }
                                />
                              </Field>
                            </div>
                            <div className="full-span">
                              <Field label="Deliverables *">
                                <textarea
                                  rows={3}
                                  value={proposalView.deliverables}
                                  onChange={(e) =>
                                    setProposalDraft({
                                      ...proposalDraft,
                                      deliverables: e.target.value,
                                    })
                                  }
                                />
                              </Field>
                            </div>
                            <Field label="Proposed timeline *">
                              <input
                                type="date"
                                value={proposalView.timeline}
                                min="2026-10-18"
                                max="2026-11-30"
                                onChange={(e) =>
                                  setProposalDraft({
                                    ...proposalDraft,
                                    timeline: e.target.value,
                                  })
                                }
                              />
                            </Field>
                            <Field label="Proposed amount · USD *">
                              <input
                                type="number"
                                min="1"
                                value={proposalView.amount}
                                onChange={(e) =>
                                  setProposalDraft({
                                    ...proposalDraft,
                                    amount: Number(e.target.value),
                                  })
                                }
                              />
                            </Field>
                            <div className="full-span">
                              <Field label="Project assumptions *">
                                <textarea
                                  rows={3}
                                  value={proposalView.assumptions}
                                  onChange={(e) =>
                                    setProposalDraft({
                                      ...proposalDraft,
                                      assumptions: e.target.value,
                                    })
                                  }
                                />
                              </Field>
                            </div>
                            <div className="full-span">
                              <Field label="Revision policy *">
                                <textarea
                                  rows={3}
                                  value={proposalView.revisions}
                                  onChange={(e) =>
                                    setProposalDraft({
                                      ...proposalDraft,
                                      revisions: e.target.value,
                                    })
                                  }
                                />
                              </Field>
                            </div>
                          </div>
                        </fieldset>
                        <div className="section-title mt-card">
                          <h3>Milestone proposal</h3>
                          {editableProposal && (
                            <Button
                              secondary
                              disabled={!!busy}
                              onClick={() =>
                                delayed(
                                  "Preparing fixed sample proposal…",
                                  () => {
                                    setProposalDraft((p) => ({
                                      ...p,
                                      milestones:
                                        structuredClone(sampleMilestones),
                                    }))
                                    setToast(
                                      "Sample $1,500 structure inserted into your draft only. Edit and review before submitting.",
                                    )
                                  },
                                )
                              }
                            >
                              <Icon name="spark" size={15} /> Suggest with AI
                            </Button>
                          )}
                        </div>
                        <MilestoneEditor
                          proposal={proposalView}
                          setProposal={setProposalDraft}
                          disabled={!editableProposal || !!busy}
                        />
                        {editableProposal && (
                          <div className="button-row">
                            <Button
                              secondary
                              disabled={!!busy}
                              onClick={() => submitProposal(false)}
                            >
                              Save draft
                            </Button>
                            <Button
                              disabled={
                                !!busy || s.counteroffer?.status === "Open"
                              }
                              onClick={() => submitProposal(true)}
                            >
                              Submit proposal <Icon name="arrow" size={16} />
                            </Button>
                          </div>
                        )}
                        <p className="fine-print">
                          Proposal v{s.proposal.version} · AI suggestions are
                          simulated and never submit or accept terms for you.
                        </p>
                      </>
                    )}
                  </Card>
                  {s.proposalHistory.length > 0 && (
                    <Card className="mt-card">
                      <SectionTitle
                        title="Proposal history"
                        subtitle="Submitted terms are preserved as read-only snapshots."
                      />
                      {s.proposalHistory.map((snapshot) => (
                        <details key={snapshot.version} className="snapshot">
                          <summary>
                            Proposal v{snapshot.version} ·{" "}
                            {money(snapshot.proposal.amount)} USD ·{" "}
                            {time(snapshot.at)}
                          </summary>
                          <p>{snapshot.proposal.scope}</p>
                          <p>
                            <strong>Deliverables:</strong>{" "}
                            {snapshot.proposal.deliverables}
                          </p>
                          <p>
                            <strong>Assumptions:</strong>{" "}
                            {snapshot.proposal.assumptions}
                          </p>
                          <p>
                            <strong>Revision policy:</strong>{" "}
                            {snapshot.proposal.revisions}
                          </p>
                          <p>
                            <strong>Deadline:</strong>{" "}
                            {displayDate(snapshot.proposal.timeline)}
                          </p>
                          {snapshot.proposal.milestones.map((m) => (
                            <p key={m.id}>
                              {m.name} · {money(m.amount)} ·{" "}
                              {displayDate(m.date)}
                              <br />
                              {m.criteria}
                            </p>
                          ))}
                        </details>
                      ))}
                    </Card>
                  )}
                </div>
                <div>
                  <Card>
                    <SectionTitle
                      title="Agree on a clear path"
                      subtitle="Neither person can accept on behalf of the other."
                    />
                    {s.proposal.status === "Submitted" && ownedClient ? (
                      <>
                        <p className="body-copy">
                          Review Fulan’s proposed scope, milestone amounts,
                          timeline, and revision policy. Acceptance still
                          requires Fulan’s final confirmation.
                        </p>
                        <Button
                          className="full-width"
                          onClick={() =>
                            ask(
                              "Accept Fulan’s proposal?",
                              `Accept proposal v${s.proposal.version} for ${money(s.proposal.amount)} USD. Fulan must independently confirm before an agreement exists.`,
                              "Accept proposal",
                              { type: "proposal-decision", accept: true },
                            )
                          }
                        >
                          Accept proposal
                        </Button>
                        <Button
                          secondary
                          className="full-width mt-button"
                          onClick={() =>
                            ask(
                              "Decline this proposal?",
                              "This ends the current proposal without creating an agreement.",
                              "Decline proposal",
                              { type: "proposal-decision", accept: false },
                            )
                          }
                        >
                          Decline proposal
                        </Button>
                      </>
                    ) : s.proposal.status === "Accepted" && !s.agreement ? (
                      <>
                        <p className="body-copy">
                          Ahmad accepted proposal v{s.proposal.version}. Fulan
                          must confirm the same terms to create the agreement.
                        </p>
                        <Button
                          disabled={!can(s, "confirm")}
                          onClick={() =>
                            ask(
                              "Confirm the accepted agreement?",
                              "Confirm the parties, scope, total, milestone deadlines, and acceptance criteria shown in the proposal. No AI decision is involved.",
                              "Confirm agreement",
                              { type: "agreement-confirm" },
                            )
                          }
                        >
                          Confirm agreement as Fulan
                        </Button>
                      </>
                    ) : (
                      <p className="body-copy">
                        {s.agreement
                          ? "Both parties agreed on the proposal. Review the confirmed agreement below."
                          : s.proposal.status === "Revision Requested"
                            ? "Fulan can revise and resubmit the proposal. Any open counteroffer must be answered first."
                            : "Send a proposal to unlock client decisions. Additional roles never grant authority over the other person’s project."}
                      </p>
                    )}
                    {s.agreement && (
                      <Button secondary onClick={() => go("Projects")}>
                        Open confirmed project <Icon name="arrow" size={16} />
                      </Button>
                    )}
                  </Card>
                  <Card className="mt-card">
                    <SectionTitle
                      title="Negotiation & clarifications"
                      subtitle="Chronological discussion. All changes remain visible."
                    />
                    <History
                      events={s.events
                        .filter((e) => e.actor !== "Demo workspace")
                        .slice(-8)}
                    />
                    {s.request.status !== "Draft" && (
                      <>
                        <Field label="Question, scope change, or estimate explanation">
                          <textarea
                            rows={3}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Keep your feedback specific and actionable…"
                          />
                        </Field>
                        <div className="button-row">
                          <Button
                            secondary
                            disabled={!message.trim() || !!busy}
                            onClick={() => {
                              if (
                                act(
                                  { type: "message", text: message },
                                  "Message added to the conversation.",
                                )
                              )
                                setMessage("")
                            }}
                          >
                            Post message
                          </Button>
                          {ownedClient && s.proposal.status === "Submitted" && (
                            <Button
                              disabled={!message.trim()}
                              onClick={() => {
                                if (
                                  act(
                                    { type: "revision", text: message },
                                    "Revision requested. Fulan can now revise the proposal.",
                                  )
                                )
                                  setMessage("")
                              }}
                            >
                              Request scope changes
                            </Button>
                          )}
                        </div>
                        {ownedClient && s.proposal.status === "Submitted" && (
                          <div className="counteroffer-form">
                            <Field label="Alternative budget · USD">
                              <input
                                type="number"
                                min="1"
                                value={counter}
                                onChange={(e) =>
                                  setCounter(Number(e.target.value))
                                }
                              />
                            </Field>
                            <Button
                              secondary
                              disabled={!message.trim()}
                              onClick={() => {
                                if (
                                  act(
                                    {
                                      type: "counteroffer",
                                      amount: counter,
                                      text: message,
                                    },
                                    "Counteroffer sent to Fulan.",
                                  )
                                )
                                  setMessage("")
                              }}
                            >
                              Propose alternative budget
                            </Button>
                            <p className="fine-print">
                              Explain the budget change in the message above. A
                              counteroffer does not change the agreed total
                              automatically.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                    {s.counteroffer && (
                      <div className="change-note">
                        <strong>
                          Counteroffer: {money(s.counteroffer.amount)} USD ·{" "}
                          {s.counteroffer.status}
                        </strong>
                        {s.counteroffer.status === "Open" &&
                          ownedFreelancer && (
                            <div className="button-row">
                              <Button
                                secondary
                                onClick={() =>
                                  act(
                                    { type: "counter-decision", accept: false },
                                    "Counteroffer rejected. Explain your estimate and revise the proposal.",
                                  )
                                }
                              >
                                Reject
                              </Button>
                              <Button
                                onClick={() => {
                                  if (
                                    act(
                                      {
                                        type: "counter-decision",
                                        accept: true,
                                      },
                                      "Counteroffer acknowledged. Adjust the draft milestone split and resubmit.",
                                    )
                                  )
                                    setProposalDraft((p) => ({
                                      ...p,
                                      amount: s.counteroffer!.amount,
                                    }))
                                }}
                              >
                                Accept for revision
                              </Button>
                            </div>
                          )}
                      </div>
                    )}
                  </Card>
                  {confirmMilestones}
                </div>
              </div>
              {s.agreement && (
                <Card className="mt-card">
                  <SectionTitle title="Confirmed project agreement" />
                  {agreementView}
                </Card>
              )}
            </>
          )}

          {page === "Projects" && (
            <>
              <Card className="workspace-summary">
                <div>
                  <Badge>
                    {projectActive
                      ? "In progress"
                      : s.agreement
                        ? "Pending milestone confirmation"
                        : "Pre-project"}
                  </Badge>
                  <h2>{s.request.title}</h2>
                  <p>
                    Ahmad · Amanah Studio / Fulan · Freelance
                    partner
                  </p>
                </div>
                <div>
                  <span>
                    {s.agreement ? "Agreed project value" : "Estimated budget"}
                  </span>
                  <h2>{money(s.agreement?.amount ?? s.request.budget)}</h2>
                  <span>USD · Fictional scenario</span>
                </div>
              </Card>
              <div className="tabs" role="tablist" aria-label="Project details">
                {["Milestones", "Agreement", "Deliverables"].map((t) => (
                  <button
                    key={t}
                    role="tab"
                    aria-selected={projectTab === t}
                    className={projectTab === t ? "selected" : ""}
                    onClick={() => setProjectTab(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <Card>
                {projectTab === "Agreement" ? (
                  <>
                    <SectionTitle title="The shared agreement" />
                    {agreementView}
                  </>
                ) : projectTab === "Milestones" ? (
                  <>
                    <SectionTitle
                      title="Your milestone timeline"
                      subtitle="Confirmed terms stay locked. Proposal changes happen before acceptance."
                      action={
                        <Button secondary onClick={() => go("Proposals")}>
                          View proposal
                        </Button>
                      }
                    />
                    {milestonesView}
                  </>
                ) : (
                  <>
                    <SectionTitle
                      title="Deliverable evidence"
                      subtitle="Submissions stay linked to their milestone."
                    />
                    {s.milestones.some((m) => m.evidence) ? (
                      s.milestones
                        .filter((m) => m.evidence)
                        .map((m) => (
                          <div className="evidence" key={m.id}>
                            <Icon name="folder" />
                            <div>
                              <strong>{m.name}</strong>
                              <p>{m.evidence}</p>
                            </div>
                            <Badge>{m.status}</Badge>
                          </div>
                        ))
                    ) : (
                      <Empty
                        title="No deliverables submitted"
                        text="After both parties confirm milestones, Fulan can submit the first milestone’s evidence."
                      />
                    )}
                    <Button
                      onClick={() =>
                        go(clientView ? "Approvals" : "Milestones")
                      }
                    >
                      {clientView
                        ? "Review deliverables"
                        : "Submit deliverables"}{" "}
                      <Icon name="arrow" size={16} />
                    </Button>
                  </>
                )}
              </Card>
              {confirmMilestones}
            </>
          )}

          {page === "AI Workspace" && (
            <div className="two-column">
              <div>
                <Card>
                  <SectionTitle
                    title="Agreement analysis"
                    subtitle="Use a structured checklist to support your own review."
                    action={<Badge>Simulated AI</Badge>}
                  />
                  <Field
                    label="Working text for review"
                    hint="Local scratchpad only. Editing this text does not change any agreement."
                  >
                    <textarea
                      rows={7}
                      value={analysisText}
                      onChange={(e) => {
                        setAnalysisText(e.target.value)
                        setAnalysis(false)
                      }}
                    />
                  </Field>
                  <Button
                    disabled={!analysisText.trim() || !!busy}
                    onClick={() =>
                      delayed("Preparing simulated findings…", () => {
                        setAnalysis(true)
                        setToast(
                          "Fixed sample findings displayed. Your text was not analyzed by an AI service.",
                        )
                      })
                    }
                  >
                    <Icon name="spark" size={16} />
                    {analysis
                      ? "Run sample review again"
                      : "Show sample scope review"}
                  </Button>
                  <p className="fine-print">
                    No API request, file analysis, accuracy score, or automated
                    decision.
                  </p>
                </Card>
                <Card className="mt-card">
                  <SectionTitle title="Milestone recommendations" />
                  {milestonesView}
                  <Button
                    secondary
                    onClick={() => go(s.agreement ? "Projects" : "Proposals")}
                  >
                    {s.agreement
                      ? "Review human-agreed milestones"
                      : "Edit proposal milestones"}{" "}
                    <Icon name="arrow" size={16} />
                  </Button>
                </Card>
              </div>
              <div>
                {analysis ? (
                  findings.map((f) => (
                    <Card className="finding-card" key={f.finding}>
                      <SectionTitle
                        title={f.finding}
                        action={<Badge>Sample finding</Badge>}
                      />
                      <dl>
                        <dt>Supporting evidence</dt>
                        <dd>{f.evidence}</dd>
                        <dt>Explanation</dt>
                        <dd>{f.explanation}</dd>
                        <dt>Suggested action</dt>
                        <dd>{f.action}</dd>
                        <dt>Limitations</dt>
                        <dd>{f.limitation}</dd>
                      </dl>
                    </Card>
                  ))
                ) : (
                  <Card>
                    <Empty
                      title="Human judgment, better supported"
                      text="Run the sample scope review to explore ambiguity detection, acceptance criteria, and suggested clarification questions."
                    />
                  </Card>
                )}
                <div className="limitation">
                  <Icon name="help" size={19} />
                  <p>
                    <strong>Human review required.</strong> These are fixed mock
                    findings, not analysis of your edited content. They cannot
                    approve milestones, verify evidence, finalize agreements, or
                    authorize payment.
                  </p>
                </div>
                <Button secondary onClick={() => go("Milestones")}>
                  Review submitted evidence <Icon name="arrow" size={16} />
                </Button>
              </div>
            </div>
          )}

          {(page === "Milestones" || page === "Approvals") && (
            <div className="two-column">
              <div>
                <Card>
                  <SectionTitle
                    title={
                      page === "Approvals"
                        ? "Review milestone"
                        : "Deliverable workspace"
                    }
                    subtitle="Evidence, criteria, and decisions stay connected."
                  />
                  <Field label="Project milestone">
                    <select
                      value={milestoneId}
                      onChange={(e) => setMilestoneId(e.target.value)}
                    >
                      {s.milestones.map((m, i) => (
                        <option key={m.id} value={m.id}>
                          {i + 1}. {m.name} · {m.status}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <h2 className="large-card-title">{milestone.name}</h2>
                  <div className="approval-meta">
                    <div>
                      <span>Milestone amount</span>
                      <strong>{money(milestone.amount)} USD</strong>
                    </div>
                    <div>
                      <span>Deadline</span>
                      <strong>{displayDate(milestone.date)}</strong>
                    </div>
                  </div>
                  <h3>Acceptance criteria</h3>
                  <p className="body-copy">{milestone.criteria}</p>
                  <Badge>{milestone.status}</Badge>
                  {!projectActive && (
                    <div className="change-note">
                      Both parties must confirm the agreement’s milestones
                      before work can be submitted.
                      <button
                        className="text-link"
                        onClick={() => go("Projects")}
                      >
                        Review project →
                      </button>
                    </div>
                  )}
                  {milestone.feedback && (
                    <div className="change-note">
                      <strong>Client feedback</strong>
                      <p>{milestone.feedback}</p>
                    </div>
                  )}
                  <div className="mt-card">
                    <h3>Submitted evidence</h3>
                    {milestone.evidence ? (
                      <p className="evidence-content">{milestone.evidence}</p>
                    ) : (
                      <p className="body-copy">
                        No evidence submitted. Fulan must provide a delivery note
                        or evidence reference.
                      </p>
                    )}
                  </div>
                  {can(s, "deliver") && (
                    <>
                      <Field
                        label="Delivery notes & evidence reference *"
                        hint="Use a descriptive delivery note or sample filename. No files are uploaded."
                      >
                        <textarea
                          rows={4}
                          value={evidence}
                          onChange={(e) => setEvidence(e.target.value)}
                          placeholder="For example: Discovery report v1 and sitemap. Covers all agreed shopping flows…"
                        />
                      </Field>
                      <Button
                        secondary
                        onClick={() =>
                          setEvidence(
                            `${milestone.name} — sample delivery package. ${milestone.criteria} Prepared by Fulan for Ahmad; illustrative evidence only.`,
                          )
                        }
                      >
                        Use sample evidence
                      </Button>
                      <Button
                        className="full-width mt-button"
                        disabled={
                          !projectActive ||
                          !evidence.trim() ||
                          ![
                            "Upcoming",
                            "In progress",
                            "Changes requested",
                          ].includes(milestone.status) ||
                          !!busy
                        }
                        onClick={() =>
                          delayed("Submitting sample deliverables…", () =>
                            act(
                              { type: "deliver", id: milestone.id, evidence },
                              "Evidence submitted. Ahmad can now review the milestone.",
                            ),
                          )
                        }
                      >
                        Submit deliverables for client review{" "}
                        <Icon name="arrow" size={16} />
                      </Button>
                    </>
                  )}
                </Card>
              </div>
              <div>
                <Card>
                  <SectionTitle
                    title="AI-assisted evidence review"
                    action={<Badge>Simulated</Badge>}
                  />
                  {milestone.reviewed ? (
                    <dl className="structured-finding">
                      <dt>Finding</dt>
                      <dd>
                        Sample delivery note appears ready for a human checklist
                        review.
                      </dd>
                      <dt>Supporting evidence</dt>
                      <dd>{milestone.evidence}</dd>
                      <dt>Explanation</dt>
                      <dd>
                        The submitted note can be compared with the agreed
                        criteria: {milestone.criteria}
                      </dd>
                      <dt>Suggested action</dt>
                      <dd>
                        Open the actual deliverables independently. Check
                        completeness and request specific changes if needed.
                      </dd>
                      <dt>Limitations</dt>
                      <dd>
                        No files or links were accessed. This fixed result does
                        not prove quality, completion, originality, or
                        accessibility.
                      </dd>
                    </dl>
                  ) : (
                    <>
                      <p className="body-copy">
                        Run a sample review only after evidence has been
                        submitted. It does not approve the work.
                      </p>
                      <Button
                        secondary
                        disabled={milestone.status !== "In review" || !!busy}
                        onClick={() =>
                          delayed(
                            "Preparing simulated evidence findings…",
                            () =>
                              act(
                                { type: "review", id: milestone.id },
                                "Simulated review ready. Human approval is still required.",
                              ),
                          )
                        }
                      >
                        <Icon name="spark" size={16} /> Run simulated evidence
                        review
                      </Button>
                    </>
                  )}
                  <p className="fine-print">
                    A human may decide independently of AI. No real AI analysis
                    has occurred.
                  </p>
                </Card>
                <Card className="mt-card">
                  <SectionTitle
                    title="Client decision"
                    subtitle="Only Ahmad, the assigned client, can approve Fulan’s work."
                  />
                  {can(s, "approve") ? (
                    <>
                      <Field label="Review notes / requested changes">
                        <textarea
                          rows={3}
                          value={feedback}
                          onChange={(e) => setFeedback(e.target.value)}
                          placeholder="Required when requesting changes…"
                        />
                      </Field>
                      <Button
                        className="full-width"
                        disabled={milestone.status !== "In review"}
                        onClick={() =>
                          ask(
                            "Approve this milestone?",
                            "Confirm you have personally reviewed the deliverables against the acceptance criteria. This records a demo approval and does not initiate payment.",
                            "Confirm approval",
                            {
                              type: "approval",
                              id: milestone.id,
                              approve: true,
                              feedback,
                            },
                          )
                        }
                      >
                        <Icon name="check" size={16} /> Approve milestone
                      </Button>
                      <Button
                        secondary
                        className="full-width mt-button"
                        disabled={
                          milestone.status !== "In review" || !feedback.trim()
                        }
                        onClick={() =>
                          ask(
                            "Request changes?",
                            "Your specific feedback will be recorded for Fulan. Fulan may revise and resubmit evidence.",
                            "Request changes",
                            {
                              type: "approval",
                              id: milestone.id,
                              approve: false,
                              feedback,
                            },
                          )
                        }
                      >
                        Request changes
                      </Button>
                    </>
                  ) : (
                    <div className="change-note">
                      You are {user.name}. Only the assigned client identity can
                      review or approve. Activating the Client role for Fulan
                      does not grant Ahmad’s permissions.
                    </div>
                  )}
                  {["Approved", "Paid"].includes(milestone.status) && (
                    <div className="success-panel">
                      <Icon name="check" />
                      <h3>Approved by Ahmad</h3>
                      <p>
                        {milestone.status === "Paid"
                          ? "Payment is marked paid in the simulation only, not verified."
                          : "Fulan may now create a sample invoice linked to this milestone."}
                      </p>
                      <Button onClick={() => go("Invoices")}>
                        Open invoice workspace
                      </Button>
                    </div>
                  )}
                </Card>
              </div>
            </div>
          )}

          {page === "Invoices" && (
            <>
              <div className="two-column">
                <div>
                  <Card>
                    <SectionTitle
                      title={
                        can(s, "invoice")
                          ? "Invoice Workspace"
                          : "Client payment workspace"
                      }
                      subtitle="An invoice is not a payment. Each step has a separate owner."
                      action={<Badge>Demo only</Badge>}
                    />
                    {can(s, "invoice") && (
                      <>
                        <h3>Create an eligible milestone invoice</h3>
                        <p className="body-copy">
                          Only approved, uninvoiced milestones can be selected.
                          Currency and amount come from the confirmed agreement.
                        </p>
                        {eligible.length ? (
                          <>
                            <div className="form-grid">
                              <div className="full-span">
                                <Field label="Related milestone">
                                  <select
                                    value={
                                      eligible.some(
                                        (m) => m.id === invoiceMilestone,
                                      )
                                        ? invoiceMilestone
                                        : eligible[0].id
                                    }
                                    onChange={(e) =>
                                      setInvoiceMilestone(e.target.value)
                                    }
                                  >
                                    {eligible.map((m) => (
                                      <option key={m.id} value={m.id}>
                                        {m.name} · {money(m.amount)} USD
                                      </option>
                                    ))}
                                  </select>
                                </Field>
                              </div>
                              <Field label="Currency">
                                <input readOnly value="USD" />
                              </Field>
                              <Field label="Due date">
                                <input
                                  type="date"
                                  min={
                                    eligible.find(
                                      (m) => m.id === invoiceMilestone,
                                    )?.date ?? eligible[0].date
                                  }
                                  max="2026-11-30"
                                  value={due}
                                  onChange={(e) => setDue(e.target.value)}
                                />
                              </Field>
                              <div className="full-span">
                                <Field label="Invoice note">
                                  <textarea
                                    rows={3}
                                    value={invoiceNote}
                                    onChange={(e) =>
                                      setInvoiceNote(e.target.value)
                                    }
                                  />
                                </Field>
                              </div>
                            </div>
                            <div className="invoice-total">
                              <span>Invoice amount · sample</span>
                              <strong>
                                {money(
                                  (
                                    eligible.find(
                                      (m) => m.id === invoiceMilestone,
                                    ) ?? eligible[0]
                                  ).amount,
                                )}{" "}
                                USD
                              </strong>
                            </div>
                            <Button
                              onClick={() => {
                                if (
                                  act(
                                    {
                                      type: "invoice-create",
                                      id: (
                                        eligible.find(
                                          (m) => m.id === invoiceMilestone,
                                        ) ?? eligible[0]
                                      ).id,
                                      due,
                                      note: invoiceNote,
                                    },
                                    "Draft invoice created. Review and send it separately.",
                                  )
                                )
                                  setInvoiceId(
                                    stateRef.current.invoices.at(-1)!.id,
                                  )
                              }}
                            >
                              Create draft invoice{" "}
                              <Icon name="plus" size={16} />
                            </Button>
                          </>
                        ) : (
                          <Empty
                            title="No eligible milestones"
                            text="Ahmad must approve a milestone before Fulan can invoice it. Existing non-cancelled invoices cannot be duplicated."
                            action={
                              <Button
                                secondary
                                onClick={() => go("Milestones")}
                              >
                                View milestones
                              </Button>
                            }
                          />
                        )}
                      </>
                    )}
                    {!can(s, "invoice") && !s.invoices.length && (
                      <Empty
                        title="No invoices to pay"
                        text="After you approve a milestone, Fulan can create and send its invoice. Draft invoices are not payable."
                      />
                    )}
                    {s.invoices.length > 0 && (
                      <div className="mt-card">
                        <Field label="Invoice reference">
                          <select
                            value={invoice?.id ?? ""}
                            onChange={(e) => setInvoiceId(e.target.value)}
                          >
                            {s.invoices.map((i) => (
                              <option key={i.id} value={i.id}>
                                {i.id} · {money(i.amount)} · {i.status}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>
                    )}
                    {invoice && (
                      <>
                        <div className="section-title mt-card">
                          <h2>{invoice.id}</h2>
                          <Badge>{invoice.status}</Badge>
                        </div>
                        <div className="detail-grid">
                          <div>
                            <span>Related project</span>
                            <strong>{invoice.project}</strong>
                          </div>
                          <div>
                            <span>Milestone</span>
                            <strong>
                              {
                                s.milestones.find(
                                  (m) => m.id === invoice.milestoneId,
                                )?.name
                              }
                            </strong>
                          </div>
                          <div>
                            <span>Payer</span>
                            <strong>
                              {s.users[invoice.payer].name}
                              <small>{s.users[invoice.payer].email}</small>
                            </strong>
                          </div>
                          <div>
                            <span>Payee</span>
                            <strong>
                              {s.users[invoice.payee].name}
                              <small>{s.users[invoice.payee].email}</small>
                            </strong>
                          </div>
                          <div>
                            <span>Due date</span>
                            <strong>{displayDate(invoice.due)}</strong>
                          </div>
                          <div>
                            <span>Amount</span>
                            <strong>
                              {money(invoice.amount)} {invoice.currency}
                            </strong>
                          </div>
                        </div>
                        <p className="body-copy">{invoice.note}</p>
                        {can(s, "invoice") && (
                          <div className="button-row">
                            {["Draft", "Sent", "Payment Failed"].includes(
                              invoice.status,
                            ) && (
                              <Button
                                secondary
                                onClick={() =>
                                  ask(
                                    "Cancel this sample invoice?",
                                    "This preserves its history and allows a replacement invoice for the same approved milestone. No real payment is affected.",
                                    "Cancel invoice",
                                    {
                                      type: "invoice-status",
                                      id: invoice.id,
                                      status: "Cancelled",
                                    },
                                  )
                                }
                              >
                                Cancel invoice
                              </Button>
                            )}
                            {invoice.status === "Draft" && (
                              <Button
                                onClick={() =>
                                  ask(
                                    "Send this sample invoice?",
                                    "The invoice will become payable in the local demo. No email, PayPal request, or real charge will be created.",
                                    "Mark as sent",
                                    {
                                      type: "invoice-status",
                                      id: invoice.id,
                                      status: "Sent",
                                    },
                                  )
                                }
                              >
                                Send sample invoice{" "}
                                <Icon name="arrow" size={16} />
                              </Button>
                            )}
                          </div>
                        )}
                        {invoice.status === "Paid" && (
                          <div className="change-note">
                            <strong>Paid · simulated, not verified</strong>
                            <p>
                              No funds were transferred. This is not
                              confirmation from PayPal or a financial
                              institution.
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </Card>
                </div>
                <div>
                  <Card>
                    <SectionTitle
                      title="Payment integration"
                      action={<Badge>Sandbox pending</Badge>}
                    />
                    <div className="integration-placeholder">
                      <span className="icon-tile">
                        <Icon name="link" size={24} />
                      </span>
                      <h3>PayPal integration area</h3>
                      <p>
                        Future integration will use official PayPal APIs. There
                        is no PayPal login, SDK, checkout, or payment
                        verification in this prototype.
                      </p>
                      <span className="connection-status">
                        <span />
                        Sandbox integration pending — demo simulation.
                      </span>
                    </div>
                    {invoice && can(s, "pay") ? (
                      <>
                        {["Sent", "Payment Failed"].includes(
                          invoice.status,
                        ) && (
                          <Button
                            className="full-width"
                            onClick={() =>
                              ask(
                                "Start a simulated payment?",
                                `Record a demo payment attempt of ${money(invoice.amount)} USD from Ahmad to Fulan. No real account or funds will be accessed.`,
                                "Start demo payment",
                                {
                                  type: "invoice-status",
                                  id: invoice.id,
                                  status: "Payment Pending",
                                },
                              )
                            }
                          >
                            {invoice.status === "Payment Failed"
                              ? "Retry simulated payment"
                              : "Simulate payment"}
                          </Button>
                        )}
                        {invoice.status === "Payment Pending" && (
                          <>
                            <p className="body-copy">
                              Demo attempt in progress. Choose a simulated
                              outcome; neither result is verified by PayPal.
                            </p>
                            <Button
                              className="full-width"
                              onClick={() =>
                                act(
                                  {
                                    type: "invoice-status",
                                    id: invoice.id,
                                    status: "Paid",
                                  },
                                  "Simulated paid outcome recorded. No funds transferred or payment verified.",
                                )
                              }
                            >
                              Simulate success · not verified
                            </Button>
                            <Button
                              secondary
                              className="full-width mt-button"
                              onClick={() =>
                                act(
                                  {
                                    type: "invoice-status",
                                    id: invoice.id,
                                    status: "Payment Failed",
                                  },
                                  "Simulated failure recorded. The invoice remains unpaid and can be retried.",
                                )
                              }
                            >
                              Simulate failure
                            </Button>
                          </>
                        )}
                        {["Draft", "Cancelled"].includes(invoice.status) && (
                          <p className="fine-print">
                            This invoice cannot be paid. Fulan must send an
                            active draft first.
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="fine-print">
                        Only Ahmad, the invoice payer, can start a demo
                        payment. Fulan cannot mark their own invoice paid.
                      </p>
                    )}
                  </Card>
                  <Card className="mt-card">
                    <SectionTitle title="Invoice status history" />
                    {invoice ? (
                      <History events={invoice.history} />
                    ) : (
                      <Empty
                        title="No payment activity"
                        text="Invoice events will appear here as the demo progresses."
                      />
                    )}
                  </Card>
                  <div className="limitation">
                    <Icon name="help" size={19} />
                    <p>
                      <strong>No verified transactions.</strong> All amounts,
                      events, invoice statuses, and payment outcomes are local
                      sample data. Real payment verification requires a trusted
                      backend and official provider events.
                    </p>
                  </div>
                </div>
              </div>
              {s.invoices.length > 0 && (
                <Card className="mt-card">
                  <SectionTitle title="All milestone invoices" />
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Reference</th>
                          <th>Milestone</th>
                          <th>Amount · USD</th>
                          <th>Status</th>
                          <th>Due</th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.invoices.map((i) => (
                          <tr key={i.id}>
                            <td>
                              <button
                                className="text-link"
                                onClick={() => {
                                  setInvoiceId(i.id)
                                  window.scrollTo(0, 0)
                                }}
                              >
                                {i.id}
                              </button>
                            </td>
                            <td>
                              {
                                s.milestones.find((m) => m.id === i.milestoneId)
                                  ?.name
                              }
                            </td>
                            <td>{money(i.amount)}</td>
                            <td>
                              <Badge>
                                {i.status === "Paid"
                                  ? "Paid · simulated"
                                  : i.status}
                              </Badge>
                            </td>
                            <td>{displayDate(i.due)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </>
          )}

          {page === "Activity" && (
            <Card>
              <SectionTitle
                title="Workspace activity & revision history"
                subtitle="Chronological, attributed events. Fixed 2026 demo clock, not live financial records."
              />
              <History events={s.events} />
            </Card>
          )}
          {page === "Settings" && (
            <div className="two-column">
              <div>
                <Card>
                  <SectionTitle
                    title="Account Settings"
                    subtitle="Your identity is separate from the roles you activate."
                  />
                  <div className="account-profile">
                    <span className="avatar">{initials(user.name)}</span>
                    <div>
                      <h2>{user.name}</h2>
                      <p>{user.email}</p>
                    </div>
                    <Badge>Demo identity</Badge>
                  </div>
                  <div className="detail-grid">
                    <div>
                      <span>Unique user ID</span>
                      <strong>demo-user-{user.id}</strong>
                    </div>
                    <div>
                      <span>Primary profile</span>
                      <strong>{user.primary}</strong>
                    </div>
                    <div>
                      <span>Workspace membership</span>
                      <strong>northstar-demo · Member</strong>
                    </div>
                    <div>
                      <span>Project assignment</span>
                      <strong>
                        {s.account === s.request.clientId
                          ? "Client / payer"
                          : "Freelancer / project owner"}
                      </strong>
                    </div>
                  </div>
                  <h3>Activated roles</h3>
                  {(["Freelancer", "Client"] as Role[]).map((role) => (
                    <div className="role-setting" key={role}>
                      <div>
                        <strong>{role}</strong>
                        <p>
                          {user.roles.includes(role)
                            ? "Activated for this identity"
                            : "Not activated"}
                        </p>
                      </div>
                      {user.roles.includes(role) ? (
                        <Button
                          secondary
                          disabled={s.role === role}
                          onClick={() => {
                            act({ type: "role", role })
                            go("Overview")
                          }}
                        >
                          {s.role === role
                            ? "Current workspace role"
                            : `Use ${role} workspace`}
                        </Button>
                      ) : (
                        <Button
                          secondary
                          onClick={() =>
                            ask(
                              `Activate the ${role} role?`,
                              "This adds a capability to your current account. It does not change your identity, transfer projects, or grant the other party’s permissions.",
                              "Activate role",
                              { type: "activate", role },
                            )
                          }
                        >
                          Activate additional role
                        </Button>
                      )}
                    </div>
                  ))}
                  <div className="change-note">
                    A second role does not change who you are. Fulan cannot
                    approve this project or pay as Ahmad, even after activating
                    Client.
                  </div>
                </Card>
                <Card className="mt-card">
                  <SectionTitle title="Demo controls" />
                  <Button onClick={() => setAccountDialog(true)}>
                    Switch Demo Account <Icon name="arrow" size={16} />
                  </Button>
                  <Button
                    secondary
                    className="mt-button full-width"
                    onClick={() =>
                      ask(
                        "Reset Demo?",
                        "Restore the original $1,500 project, both demo identities, and all draft data. All session progress will be cleared.",
                        "Reset Demo",
                        { type: "reset" },
                      )
                    }
                  >
                    Reset Demo
                  </Button>
                </Card>
              </div>
              <Card>
                <SectionTitle
                  title="Simulated permission checks"
                  subtitle="Checks apply to both the activated role and project membership."
                />
                {([
                  "request",
                  "propose",
                  "accept",
                  "confirm",
                  "deliver",
                  "approve",
                  "invoice",
                  "pay",
                ] as const).map((p) => (
                  <div className="permission-row" key={p}>
                    <span>
                      {
                        {
                          request: "Create / edit project request",
                          propose: "Submit / revise proposal",
                          accept: "Accept proposal as client",
                          confirm: "Confirm as freelancer",
                          deliver: "Submit own deliverables",
                          approve: "Approve submitted work",
                          invoice: "Create / send eligible invoices",
                          pay: "Simulate payer actions",
                        }[p]
                      }
                    </span>
                    <Badge>{can(s, p) ? "Allowed" : "Not allowed"}</Badge>
                  </div>
                ))}
                <div className="limitation">
                  <Icon name="help" size={19} />
                  <p>
                    <strong>Frontend checks are not real security.</strong> This
                    demo has no authentication or backend. Production
                    authorization must be enforced server-side. Data is shared
                    only within this running tab and resets on refresh.
                  </p>
                </div>
              </Card>
            </div>
          )}
          <footer className="app-footer">
            <span>
              <span className="live-dot" /> A little more clarity. Every step of
              the way.
            </span>
            <span>
              {page === "Live Commerce" ? (
                <>Sandbox API <b>·</b> Ollama lokal <b>·</b> Data SQLite</>
              ) : (
                <>Demo klasik <b>·</b> Simulasi UI <b>·</b> Session-only data</>
              )}
            </span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={18} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            ×
          </button>
        </div>
      )}
      {modalOpen && (
        <div
          className="modal-backdrop"
          onClick={() => {
            setConfirm(null)
            setAccountDialog(false)
          }}
        >
          <div
            ref={modalRef}
            className="modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="dialog-title"
            onClick={(e) => e.stopPropagation()}
          >
            {accountDialog ? (
              <>
                <span className="icon-tile">
                  <Icon name="grid" />
                </span>
                <h2 id="dialog-title">Switch Demo Account</h2>
                <p>
                  Choose a different fictional person. This is not role
                  switching, authentication, or a security boundary. Project
                  assignments remain unchanged.
                </p>
                {(["jordan", "alex"] as UserId[]).map((id) => (
                  <button
                    className={`persona-option ${
                      s.account === id ? "selected-persona" : ""
                    }`}
                    key={id}
                    onClick={() => switchAccount(id)}
                  >
                    <span className="avatar">{initials(s.users[id].name)}</span>
                    <span>
                      <strong>{s.users[id].name}</strong>
                      <small>{s.users[id].email}</small>
                      <small>
                        {s.users[id].primary} · Amanah demo member
                      </small>
                    </span>
                    {s.account === id ? (
                      <Badge>Current</Badge>
                    ) : (
                      <Icon name="arrow" size={18} />
                    )}
                  </button>
                ))}
                <Button
                  secondary
                  className="full-width mt-button"
                  onClick={() => setAccountDialog(false)}
                >
                  Cancel
                </Button>
              </>
            ) : (
              confirm && (
                <>
                  <span className="icon-tile">
                    <Icon
                      name={confirm.action.type === "reset" ? "clock" : "check"}
                    />
                  </span>
                  <h2 id="dialog-title">{confirm.title}</h2>
                  <p>{confirm.text}</p>
                  {error && <div className="error-banner" role="alert">{error}</div>}
                  <div className="button-row">
                    <Button secondary onClick={() => setConfirm(null)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (confirm.action.type === "reset") {
                          reset()
                          setConfirm(null)
                        } else if (
                          act(
                            confirm.action,
                            "Demo action recorded. See the workspace activity for details.",
                          )
                        )
                          setConfirm(null)
                      }}
                    >
                      {confirm.label}
                    </Button>
                  </div>
                </>
              )
            )}
          </div>
        </div>
      )}
    </div>
  )
}
