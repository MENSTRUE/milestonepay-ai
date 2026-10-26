export type Role = "Freelancer" | "Client"
export type UserId = "alex" | "jordan"
export type Permission = "request" | "propose" | "accept" | "confirm" | "deliver" | "approve" | "invoice" | "pay"
export type User = {
  id: UserId
  name: string
  email: string
  primary: Role
  roles: Role[]
  workspace: string
}
export const personas: Record<UserId, User> = {
  alex: {
    id: "alex",
    name: "Alex Morgan",
    email: "alex@example.test",
    primary: "Freelancer",
    roles: ["Freelancer"],
    workspace: "northstar-demo",
  },
  jordan: {
    id: "jordan",
    name: "Jordan Lee",
    email: "jordan@example.test",
    primary: "Client",
    roles: ["Client"],
    workspace: "northstar-demo",
  },
}
export const rolePermissions: Record<Role, Permission[]> = {
  Freelancer: ["propose", "confirm", "deliver", "invoice"],
  Client: ["request", "accept", "approve", "pay"],
}
export type RequestStatus = "Draft" | "Sent" | "Under Review" | "Proposal Received" | "Accepted" | "Rejected"
export type ProposalStatus = "Draft" | "Submitted" | "Revision Requested" | "Accepted" | "Declined"
export type MilestoneStatus = "Upcoming" | "In progress" | "In review" | "Changes requested" | "Approved" | "Paid"
export type InvoiceStatus = "Draft" | "Sent" | "Payment Pending" | "Payment Failed" | "Paid" | "Cancelled"
export type Milestone = {
  id: string
  name: string
  amount: number
  date: string
  criteria: string
  status: MilestoneStatus
  evidence: string
  reviewed: boolean
  feedback: string
}
export const sampleMilestones: Milestone[] = [
  {
    id: "m1",
    name: "Discovery & UX Planning",
    amount: 300,
    date: "2026-10-18",
    criteria:
      "Discovery report, approved sitemap, and documented shopping user flows.",
    status: "Upcoming",
    evidence: "",
    reviewed: false,
    feedback: "",
  },
  {
    id: "m2",
    name: "UI Design & Prototype",
    amount: 450,
    date: "2026-10-25",
    criteria:
      "High-fidelity desktop and mobile screens, shopping flows, and clickable prototype.",
    status: "Upcoming",
    evidence: "",
    reviewed: false,
    feedback: "",
  },
  {
    id: "m3",
    name: "Frontend Implementation",
    amount: 750,
    date: "2026-11-08",
    criteria:
      "Responsive frontend, browser checks, accessibility checklist, and source handover.",
    status: "Upcoming",
    evidence: "",
    reviewed: false,
    feedback: "",
  },
]
export const money = (n: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n)
export const displayDate = (date: string) =>
  new Date(date + "T12:00:00Z").toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    timeZone: "UTC",
  })
export type ProjectRequest = {
  title: string
  description: string
  category: string
  budget: number
  currency: "USD"
  deadline: string
  requirements: string
  attachments: string[]
  clientId: UserId
  freelancerId: UserId
  status: RequestStatus
  version: number
}
export type Proposal = {
  scope: string
  deliverables: string
  timeline: string
  amount: number
  assumptions: string
  revisions: string
  milestones: Milestone[]
  status: ProposalStatus
  version: number
}
export type Event = {
  id: number
  actor: string
  text: string
  at: string
}
export type ProposalSnapshot = {
  version: number
  proposal: Proposal
  at: string
}
export type RequestSnapshot = {
  version: number
  request: ProjectRequest
  at: string
}
export type Invoice = {
  id: string
  milestoneId: string
  project: string
  payer: UserId
  payee: UserId
  amount: number
  currency: "USD"
  due: string
  note: string
  status: InvoiceStatus
  history: Event[]
}
export type Agreement = {
  version: number
  timestamp: string
  clientId: UserId
  freelancerId: UserId
  scope: string
  amount: number
  deadline: string
  milestones: Milestone[]
}
export type State = {
  demo: true
  users: Record<UserId, User>
  account: UserId
  role: Role
  request: ProjectRequest
  requestHistory: RequestSnapshot[]
  proposal: Proposal
  proposalHistory: ProposalSnapshot[]
  agreement: Agreement | null
  suggested: boolean
  confirmations: UserId[]
  milestones: Milestone[]
  invoices: Invoice[]
  events: Event[]
  counteroffer: {
    amount: number
    status: "Open" | "Accepted" | "Rejected"
    author: UserId
  } | null
}
const scope =
  "Redesign and develop a responsive e-commerce website for Northstar Studio, including UX discovery, high-fidelity UI design, and frontend implementation."
export function createInitialState(): State {
  return {
    demo: true,
    users: structuredClone(personas),
    account: "jordan",
    role: "Client",
    request: {
      title: "E-commerce Website Redesign",
      description: scope,
      category: "Web design & development",
      budget: 1500,
      currency: "USD",
      deadline: "2026-11-08",
      requirements:
        "Responsive desktop and mobile layouts, clear shopping flows, an interactive prototype, and accessible frontend handover.",
      attachments: [],
      clientId: "jordan",
      freelancerId: "alex",
      status: "Draft",
      version: 1,
    },
    proposal: {
      scope,
      deliverables:
        "Discovery report and sitemap; desktop and mobile UI screens; interactive prototype; responsive frontend and source handover.",
      timeline: "2026-11-08",
      amount: 1500,
      assumptions:
        "Client supplies branding, product content, and feedback within two working days. Hosting and third-party fees are excluded.",
      revisions:
        "Two consolidated revision rounds per design milestone. Scope changes require a revised proposal.",
      milestones: structuredClone(sampleMilestones),
      status: "Draft",
      version: 1,
    },
    requestHistory: [],
    proposalHistory: [],
    agreement: null,
    suggested: false,
    confirmations: [],
    milestones: structuredClone(sampleMilestones),
    invoices: [],
    events: [
      {
        id: 1,
        actor: "Demo workspace",
        text: "Sample request prepared. Jordan can edit and send it to Alex.",
        at: "2026-10-12T09:00:00Z",
      },
    ],
    counteroffer: null,
  }
}
export function can(s: State, permission: Permission): boolean {
  const u = s.users[s.account]
  if (
    u.workspace !== "northstar-demo" ||
    !u.roles.includes(s.role) ||
    !rolePermissions[s.role].includes(permission)
  )
    return false
  const clientAction = ["request", "accept", "approve", "pay"].includes(
    permission,
  )
  return clientAction
    ? s.account === s.request.clientId
    : s.account === s.request.freelancerId
}
export function activeProject(s: State) {
  return (
    Boolean(s.agreement) &&
    s.confirmations.includes(s.request.clientId) &&
    s.confirmations.includes(s.request.freelancerId)
  )
}
function validAmount(amount: number) {
  return Number.isFinite(amount) && amount > 0 && Math.abs(amount * 100 - Math.round(amount * 100)) < 0.00001
}
export function validMilestones(ms: Milestone[], amount: number) {
  return (
    ms.length === 3 &&
    ms.every(
      (m, i) =>
        m.id === `m${i + 1}` &&
        m.name.trim() &&
        m.criteria.trim() &&
        validAmount(m.amount) &&
        m.date >= "2026-10-12" &&
        m.date <= "2026-11-30" &&
        (i === 0 || m.date >= ms[i - 1].date),
    ) &&
    Math.abs(ms.reduce((t, m) => t + m.amount, 0) - amount) < 0.001
  )
}
export type Action = {
  type: "switch"
  account: UserId
} | {
  type: "activate"
  role: Role
} | {
  type: "role"
  role: Role
} | {
  type: "request-save"
  request: ProjectRequest
  send: boolean
} | { type: "request-review" } | { type: "request-reject" } | {
  type: "proposal-save"
  proposal: Proposal
  submit: boolean
} | {
  type: "message"
  text: string
} | {
  type: "counteroffer"
  amount: number
  text: string
} | {
  type: "counter-decision"
  accept: boolean
} | {
  type: "revision"
  text: string
} | {
  type: "proposal-decision"
  accept: boolean
} | {
  type: "agreement-confirm"
} | { type: "suggest" } | { type: "milestones-confirm" } | {
  type: "deliver"
  id: string
  evidence: string
} | {
  type: "review"
  id: string
} | {
  type: "approval"
  id: string
  approve: boolean
  feedback: string
} | {
  type: "invoice-create"
  id: string
  due: string
  note: string
} | {
  type: "invoice-status"
  id: string
  status: InvoiceStatus
} | { type: "reset" }
export function transition(current: State, action: Action): State {
  if (action.type === "reset") return createInitialState()
  const s = structuredClone(current)
  const fail = (text: string): never => {
    throw new Error(text)
  }
  const requirePermission = (p: Permission) => {
    if (!can(s, p))
      fail(
        "This account does not have permission for that action in this project.",
      )
  }
  // Fixed 2026 demo clock keeps the fictional scenario internally consistent.
  const stamp = () =>
    new Date(Date.UTC(2026, 9, 12, 9, s.events.length)).toISOString()
  const log = (text: string) => {
    s.events.push({
      id: s.events.length + 1,
      actor: s.users[s.account].name,
      text,
      at: stamp(),
    })
  }
  const member = () => {
    if (
      s.users[s.account].workspace !== "northstar-demo" ||
      ![s.request.clientId, s.request.freelancerId].includes(s.account)
    )
      fail("Workspace membership required.")
  }
  const milestone = (id: string) =>
    s.milestones.find((m) => m.id === id) ?? fail("Milestone not found.")
  switch (action.type) {
    case "switch":
      s.account = action.account
      s.role = s.users[action.account].primary
      return s
    case "activate":
      if (!s.users[s.account].roles.includes(action.role)) {
        s.users[s.account].roles.push(action.role)
        log(
          `${action.role} role activated. Project ownership and memberships are unchanged.`,
        )
      }
      return s
    case "role":
      if (!s.users[s.account].roles.includes(action.role))
        fail("Activate this role in Account Settings first.")
      s.role = action.role
      return s
    case "request-save": {
      requirePermission("request")
      if (
        !["Draft", "Sent", "Under Review"].includes(s.request.status) ||
        s.proposalHistory.length
      )
        fail(
          "Proposal received. Negotiate scope changes through the proposal conversation.",
        )
      const r = action.request
      if (
        !r.title.trim() ||
        !r.description.trim() ||
        !r.requirements.trim() ||
        !r.category ||
        !validAmount(r.budget) ||
        r.deadline < "2026-10-18" ||
        r.deadline > "2026-11-30"
      )
        fail(
          "Complete all required fields, a positive budget, and an October–November 2026 deadline.",
        )
      if (r.freelancerId !== "alex" || r.currency !== "USD")
        fail("This demo supports Alex Morgan and USD only.")
      const wasSent = s.request.status !== "Draft"
      s.request = {
        ...r,
        clientId: s.request.clientId,
        freelancerId: s.request.freelancerId,
        status: action.send ? "Sent" : s.request.status,
        version: s.request.version + (wasSent ? 1 : 0),
      }
      if (action.send || wasSent)
        s.requestHistory.push({
          version: s.request.version,
          request: structuredClone(s.request),
          at: stamp(),
        })
      log(
        wasSent
          ? `Request revision v${s.request.version} tracked: ${r.description} Requirements: ${r.requirements}; budget ${money(r.budget)}; deadline ${r.deadline}.`
          : action.send
            ? "Project request sent to Alex Morgan."
            : "Request draft saved.",
      )
      return s
    }
    case "request-review":
      requirePermission("propose")
      if (s.request.status !== "Sent")
        fail("Only sent requests can enter review.")
      s.request.status = "Under Review"
      log("Alex opened the request for review.")
      return s
    case "request-reject":
      requirePermission("propose")
      if (!["Sent", "Under Review"].includes(s.request.status))
        fail("This request cannot be declined now.")
      s.request.status = "Rejected"
      log("Project request declined by Alex.")
      return s
    case "proposal-save": {
      requirePermission("propose")
      if (
        !["Under Review", "Proposal Received"].includes(s.request.status) ||
        !["Draft", "Revision Requested", "Declined"].includes(s.proposal.status)
      )
        fail(
          "Open an assigned request for review, or wait for a revision request.",
        )
      if (action.submit && s.counteroffer?.status === "Open")
        fail("Respond to the open counteroffer before resubmitting.")
      const p = action.proposal
      if (
        ![p.scope, p.deliverables, p.assumptions, p.revisions].every((t) =>
          t.trim(),
        ) ||
        !validAmount(p.amount) ||
        !validMilestones(p.milestones, p.amount) ||
        p.timeline < "2026-10-18" ||
        p.timeline > "2026-11-30" ||
        p.milestones.some((m) => m.date > p.timeline)
      )
        fail(
          "Complete proposal fields. Three positive milestones must total the proposed amount and finish by the proposed deadline.",
        )
      s.proposal = {
        ...p,
        status: action.submit ? "Submitted" : "Draft",
        version: s.proposalHistory.length + 1,
      }
      if (action.submit) {
        s.proposalHistory.push({
          version: s.proposal.version,
          proposal: structuredClone(s.proposal),
          at: stamp(),
        })
        s.request.status = "Proposal Received"
      }
      log(
        action.submit
          ? `Proposal v${s.proposal.version} submitted for ${money(p.amount)}. Human client acceptance required.`
          : "Proposal draft saved.",
      )
      return s
    }
    case "message":
      member()
      if (!action.text.trim() || s.request.status === "Draft")
        fail("Send a request before starting the conversation.")
      log(action.text.trim())
      return s
    case "counteroffer":
      requirePermission("accept")
      if (
        s.proposal.status !== "Submitted" ||
        s.agreement ||
        !validAmount(action.amount) ||
        !action.text.trim()
      )
        fail(
          "A submitted proposal, positive budget, and explanation are required.",
        )
      s.counteroffer = {
        amount: action.amount,
        status: "Open",
        author: s.account,
      }
      s.proposal.status = "Revision Requested"
      log(`Counteroffer: ${money(action.amount)}. ${action.text}`)
      return s
    case "counter-decision":
      requirePermission("propose")
      if (s.counteroffer?.status !== "Open" || s.agreement)
        fail("No open counteroffer.")
      s.counteroffer!.status = action.accept ? "Accepted" : "Rejected"
      log(
        `Counteroffer ${
          action.accept
            ? "accepted for revision; a revised proposal is still required"
            : "rejected; clarify the scope before resubmitting"
        }.`,
      )
      return s
    case "revision":
      requirePermission("accept")
      if (
        s.proposal.status !== "Submitted" ||
        !action.text.trim() ||
        s.agreement
      )
        fail("Add feedback to a submitted proposal.")
      s.proposal.status = "Revision Requested"
      log(`Scope revision requested: ${action.text}`)
      return s
    case "proposal-decision":
      requirePermission("accept")
      if (
        s.proposal.status !== "Submitted" ||
        s.agreement ||
        s.counteroffer?.status === "Open"
      )
        fail(
          "Only a submitted proposal without an unresolved counteroffer can be accepted.",
        )
      s.proposal.status = action.accept ? "Accepted" : "Declined"
      s.request.status = action.accept ? "Accepted" : "Rejected"
      log(
        action.accept
          ? `Jordan accepted proposal v${s.proposal.version}. Awaiting Alex’s agreement confirmation.`
          : "Jordan declined the proposal.",
      )
      return s
    case "agreement-confirm":
      requirePermission("confirm")
      if (s.proposal.status !== "Accepted" || s.agreement)
        fail("The client must accept the proposal first.")
      s.milestones = structuredClone(s.proposal.milestones).map((m) => ({
        ...m,
        status: "Upcoming",
        evidence: "",
        reviewed: false,
        feedback: "",
      }))
      s.agreement = {
        version: s.proposal.version,
        timestamp: stamp(),
        clientId: s.request.clientId,
        freelancerId: s.request.freelancerId,
        scope: s.proposal.scope,
        amount: s.proposal.amount,
        deadline: s.proposal.timeline,
        milestones: structuredClone(s.milestones),
      }
      log(
        "Alex confirmed the agreement. Both parties must now confirm its milestones.",
      )
      return s
    case "suggest":
      member()
      if (!s.agreement) fail("Confirm a human-approved agreement first.")
      s.suggested = true
      log(
        "Fixed sample AI milestone recommendations displayed. No agreement or approval was changed.",
      )
      return s
    case "milestones-confirm":
      member()
      if (
        !s.agreement ||
        !s.suggested ||
        s.confirmations.includes(s.account) ||
        !can(s, s.account === s.request.clientId ? "accept" : "confirm")
      )
        fail(
          "Review the milestone recommendations in your assigned project role first.",
        )
      s.confirmations.push(s.account)
      if (activeProject(s)) s.milestones[0].status = "In progress"
      log(
        `${s.users[s.account].name} confirmed the agreed milestone amounts, deadlines, and acceptance criteria.`,
      )
      return s
    case "deliver": {
      requirePermission("deliver")
      const m = milestone(action.id)
      const index = s.milestones.indexOf(m)
      if (
        !activeProject(s) ||
        !["Upcoming", "In progress", "Changes requested"].includes(m.status) ||
        !action.evidence.trim() ||
        s.milestones
          .slice(0, index)
          .some((x) => !["Approved", "Paid"].includes(x.status))
      )
        fail(
          "Confirm milestones, complete prior work, and provide evidence before submitting.",
        )
      m.evidence = action.evidence.trim()
      m.status = "In review"
      m.reviewed = false
      log(`Deliverables submitted: ${m.name}. Evidence: ${m.evidence}`)
      return s
    }
    case "review": {
      member()
      const m = milestone(action.id)
      if (m.status !== "In review" || !m.evidence)
        fail("Submit deliverable evidence before running the simulated review.")
      m.reviewed = true
      log(
        `Simulated evidence review for ${m.name}. Human review remains required.`,
      )
      return s
    }
    case "approval": {
      requirePermission("approve")
      const m = milestone(action.id)
      if (
        !activeProject(s) ||
        m.status !== "In review" ||
        !m.evidence ||
        (!action.approve && !action.feedback.trim())
      )
        fail(
          "Only submitted work may be reviewed. Change requests need specific feedback.",
        )
      m.status = action.approve ? "Approved" : "Changes requested"
      m.feedback = action.feedback
      log(
        `${m.name}: ${
          action.approve
            ? "approved by Jordan; no payment initiated"
            : `changes requested — ${action.feedback}`
        }.`,
      )
      return s
    }
    case "invoice-create": {
      requirePermission("invoice")
      const m = milestone(action.id)
      if (
        !activeProject(s) ||
        m.status !== "Approved" ||
        s.invoices.some(
          (i) => i.milestoneId === m.id && i.status !== "Cancelled",
        ) ||
        action.due < m.date ||
        action.due > "2026-11-30"
      )
        fail(
          "Choose an approved, uninvoiced milestone and a due date on/after its deadline, in October–November 2026.",
        )
      const id = `INV-2026-${String(s.invoices.length + 1).padStart(3, "0")}`
      const event = {
        id: 1,
        actor: s.users[s.account].name,
        text: "Draft created · demo",
        at: stamp(),
      }
      s.invoices.push({
        id,
        milestoneId: m.id,
        project: s.request.title,
        payer: s.request.clientId,
        payee: s.request.freelancerId,
        amount: m.amount,
        currency: "USD",
        due: action.due,
        note: action.note,
        status: "Draft",
        history: [event],
      })
      log(`${id} created for ${m.name}: ${money(m.amount)}. Sample invoice.`)
      return s
    }
    case "invoice-status": {
      const i =
        s.invoices.find((i) => i.id === action.id) ?? fail("Invoice not found.")
      const target = action.status
      if (target === "Sent" || target === "Cancelled") {
        requirePermission("invoice")
        if (
          i.payee !== s.account ||
          (target === "Sent"
            ? i.status !== "Draft"
            : !["Draft", "Sent", "Payment Failed"].includes(i.status))
        )
          fail("Invalid invoice transition.")
      } else {
        requirePermission("pay")
        if (
          !s.demo ||
          i.payer !== s.account ||
          (target === "Payment Pending"
            ? !["Sent", "Payment Failed"].includes(i.status)
            : !["Paid", "Payment Failed"].includes(target) ||
              i.status !== "Payment Pending")
        )
          fail("Start a demo payment before recording its simulated outcome.")
      }
      i.status = target
      i.history.push({
        id: i.history.length + 1,
        actor: s.users[s.account].name,
        text: `${target} · ${
          target === "Paid"
            ? "simulated, not verified; no funds transferred"
            : "demo event"
        }`,
        at: stamp(),
      })
      if (target === "Paid") milestone(i.milestoneId).status = "Paid"
      log(`${i.id}: ${target} (simulation only).`)
      return s
    }
  }
}
