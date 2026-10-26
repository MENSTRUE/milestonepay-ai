import { test } from "node:test"
import assert from "node:assert/strict"
import {
  activeProject,
  can,
  createInitialState,
  transition,
} from "../src/model.ts"

function scenario() {
  let state = createInitialState()
  return {
    get state() {
      return state
    },
    act(action) {
      state = transition(state, action)
      return state
    },
    as(account) {
      state = transition(state, { type: "switch", account })
      return state
    },
    sent() {
      this.act({ type: "request-save", request: state.request, send: true })
      return this
    },
    proposed() {
      this.sent()
      this.as("alex")
      this.act({ type: "request-review" })
      this.act({
        type: "proposal-save",
        proposal: state.proposal,
        submit: true,
      })
      return this
    },
    agreed() {
      this.proposed()
      this.as("jordan")
      this.act({ type: "proposal-decision", accept: true })
      this.as("alex")
      this.act({ type: "agreement-confirm" })
      this.act({ type: "suggest" })
      this.act({ type: "milestones-confirm" })
      this.as("jordan")
      this.act({ type: "milestones-confirm" })
      return this
    },
    approved() {
      this.agreed()
      this.as("alex")
      this.act({
        type: "deliver",
        id: "m1",
        evidence: "Sample report and approved sitemap for shopping flows.",
      })
      this.act({ type: "review", id: "m1" })
      this.as("jordan")
      this.act({ type: "approval", id: "m1", approve: true, feedback: "" })
      return this
    },
  }
}

test("full request-to-payment journey keeps identities and amounts consistent", () => {
  const x = scenario().approved()
  assert.equal(activeProject(x.state), true)
  assert.equal(x.state.agreement.amount, 1500)
  assert.equal(
    x.state.milestones.reduce((t, m) => t + m.amount, 0),
    1500,
  )
  x.as("alex")
  x.act({
    type: "invoice-create",
    id: "m1",
    due: "2026-11-20",
    note: "Sample invoice",
  })
  const i = x.state.invoices[0]
  assert.equal(i.amount, 300)
  assert.equal(i.payer, "jordan")
  assert.equal(i.payee, "alex")
  x.act({ type: "invoice-status", id: i.id, status: "Sent" })
  x.as("jordan")
  x.act({ type: "invoice-status", id: i.id, status: "Payment Pending" })
  x.act({ type: "invoice-status", id: i.id, status: "Paid" })
  assert.equal(x.state.milestones[0].status, "Paid")
  assert.match(x.state.invoices[0].history.at(-1).text, /not verified/)
  assert.equal(x.state.agreement.clientId, "jordan")
  assert.equal(x.state.agreement.freelancerId, "alex")
  assert.ok(x.state.events.every((e) => e.at.startsWith("2026-10-")))
})

test("additional roles do not transfer ownership or authorize self-approval/payment", () => {
  const x = scenario().agreed()
  x.as("alex")
  x.act({ type: "activate", role: "Client" })
  x.act({ type: "role", role: "Client" })
  assert.equal(x.state.account, "alex")
  assert.equal(x.state.users.alex.primary, "Freelancer")
  for (const permission of ["accept", "approve", "pay", "request"])
    assert.equal(can(x.state, permission), false)
  assert.throws(
    () => x.act({ type: "approval", id: "m1", approve: true, feedback: "" }),
    /permission/,
  )
  assert.throws(
    () => x.act({ type: "proposal-decision", accept: true }),
    /permission/,
  )
  x.as("jordan")
  x.act({ type: "activate", role: "Freelancer" })
  x.act({ type: "role", role: "Freelancer" })
  assert.equal(can(x.state, "deliver"), false)
  assert.equal(can(x.state, "invoice"), false)
  assert.equal(x.state.request.freelancerId, "alex")
})

test("invalid transitions cannot skip agreement, submission, approval, or payer actions", () => {
  const x = scenario()
  x.as("alex")
  assert.throws(() => x.act({ type: "request-review" }), /sent requests/)
  assert.throws(
    () =>
      x.act({
        type: "proposal-save",
        proposal: x.state.proposal,
        submit: true,
      }),
    /assigned request/,
  )
  assert.throws(() => x.act({ type: "agreement-confirm" }), /accept/)
  assert.throws(
    () => x.act({ type: "deliver", id: "m1", evidence: "sample" }),
    /Confirm milestones/,
  )
  assert.throws(() => x.act({ type: "review", id: "m1" }), /evidence/)
  assert.throws(
    () =>
      x.act({ type: "invoice-create", id: "m1", due: "2026-11-20", note: "" }),
    /approved/,
  )
  x.as("jordan")
  assert.throws(
    () => x.act({ type: "approval", id: "m1", approve: true, feedback: "" }),
    /submitted work/,
  )
})

test("negotiation keeps proposal versions and requires resubmission after a counteroffer", () => {
  const x = scenario().proposed()
  x.as("jordan")
  x.act({
    type: "counteroffer",
    amount: 1500,
    text: "Keep the budget; clarify the revision policy.",
  })
  assert.throws(
    () => x.act({ type: "proposal-decision", accept: true }),
    /submitted proposal/,
  )
  x.as("alex")
  assert.throws(
    () =>
      x.act({
        type: "proposal-save",
        proposal: x.state.proposal,
        submit: true,
      }),
    /counteroffer/,
  )
  x.act({ type: "counter-decision", accept: true })
  x.act({
    type: "proposal-save",
    proposal: { ...x.state.proposal, revisions: "Two consolidated rounds." },
    submit: true,
  })
  assert.equal(x.state.proposal.version, 2)
  assert.equal(x.state.proposalHistory.length, 2)
  x.as("jordan")
  x.act({ type: "proposal-decision", accept: true })
  assert.equal(x.state.agreement, null)
  x.as("alex")
  x.act({ type: "agreement-confirm" })
  assert.equal(x.state.agreement.amount, 1500)
})

test("proposal revisions preserve original terms and acceptance is client-only", () => {
  const x = scenario().proposed()
  const first = structuredClone(x.state.proposalHistory[0])
  assert.throws(
    () => x.act({ type: "proposal-decision", accept: true }),
    /permission/,
  )
  x.as("jordan")
  x.act({
    type: "revision",
    text: "Specify two consolidated rounds of feedback.",
  })
  x.as("alex")
  x.act({
    type: "proposal-save",
    proposal: {
      ...x.state.proposal,
      revisions: "Two consolidated rounds, one week each.",
    },
    submit: true,
  })
  assert.equal(x.state.proposalHistory.length, 2)
  assert.deepEqual(x.state.proposalHistory[0], first)
  assert.equal(x.state.proposal.version, 2)
})

test("milestone review supports changes, resubmission, and independent human approval", () => {
  const x = scenario().agreed()
  x.as("alex")
  assert.throws(
    () => x.act({ type: "deliver", id: "m2", evidence: "Sample design" }),
    /prior work/,
  )
  x.act({ type: "deliver", id: "m1", evidence: "Sitemap v1" })
  x.as("jordan")
  assert.throws(
    () => x.act({ type: "approval", id: "m1", approve: false, feedback: "" }),
    /feedback/,
  )
  x.act({
    type: "approval",
    id: "m1",
    approve: false,
    feedback: "Add the checkout flow.",
  })
  x.as("alex")
  x.act({
    type: "deliver",
    id: "m1",
    evidence: "Sitemap v2 with checkout flow",
  })
  assert.equal(x.state.milestones[0].reviewed, false)
  x.as("jordan")
  x.act({
    type: "approval",
    id: "m1",
    approve: true,
    feedback: "Human review complete.",
  })
  assert.equal(x.state.milestones[0].status, "Approved")
})

test("duplicate invoices, self-payment, and fake verified status are prevented", () => {
  const x = scenario().approved()
  x.as("alex")
  x.act({ type: "invoice-create", id: "m1", due: "2026-11-20", note: "" })
  const id = x.state.invoices[0].id
  assert.throws(
    () =>
      x.act({ type: "invoice-create", id: "m1", due: "2026-11-20", note: "" }),
    /uninvoiced/,
  )
  assert.throws(
    () => x.act({ type: "invoice-status", id, status: "Paid" }),
    /permission/,
  )
  x.act({ type: "invoice-status", id, status: "Sent" })
  x.as("jordan")
  assert.throws(
    () => x.act({ type: "invoice-status", id, status: "Paid" }),
    /Start a demo payment/,
  )
  x.act({ type: "invoice-status", id, status: "Payment Pending" })
  x.act({ type: "invoice-status", id, status: "Payment Failed" })
  x.act({ type: "invoice-status", id, status: "Payment Pending" })
  x.act({ type: "invoice-status", id, status: "Paid" })
  assert.throws(
    () => x.act({ type: "invoice-status", id, status: "Payment Pending" }),
    /Start a demo payment/,
  )
})

test("cancellation preserves invoice history and allows a replacement only while unpaid", () => {
  const x = scenario().approved()
  x.as("alex")
  x.act({ type: "invoice-create", id: "m1", due: "2026-11-20", note: "" })
  const id = x.state.invoices[0].id
  x.act({ type: "invoice-status", id, status: "Cancelled" })
  x.act({
    type: "invoice-create",
    id: "m1",
    due: "2026-11-20",
    note: "Replacement",
  })
  assert.equal(x.state.invoices.length, 2)
  assert.equal(x.state.invoices[0].history.length, 2)
  assert.notEqual(x.state.invoices[1].id, id)
})

test("request edits after sending are tracked and proposal totals validated", () => {
  const x = scenario().sent()
  x.act({
    type: "request-save",
    request: { ...x.state.request, description: "Updated scope" },
    send: false,
  })
  assert.equal(x.state.request.version, 2)
  assert.equal(
    x.state.requestHistory[0].request.description.includes("Redesign"),
    true,
  )
  assert.equal(x.state.requestHistory[1].request.description, "Updated scope")
  x.as("alex")
  x.act({ type: "request-review" })
  assert.throws(
    () =>
      x.act({
        type: "proposal-save",
        proposal: { ...x.state.proposal, amount: 2000 },
        submit: true,
      }),
    /total/,
  )
  assert.throws(
    () =>
      x.act({
        type: "proposal-save",
        proposal: { ...x.state.proposal, timeline: "2024-10-01" },
        submit: true,
      }),
    /deadline/,
  )
})

test("reset restores both original identities and every sample amount", () => {
  const x = scenario().approved()
  x.act({ type: "activate", role: "Freelancer" })
  x.act({ type: "reset" })
  assert.deepEqual(x.state, createInitialState())
})
