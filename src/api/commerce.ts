/** MilestonePay AI — real backend commerce API. X-Demo-Actor is NOT authentication. */
const base = (import.meta.env.VITE_API_BASE_URL ?? 'http://127.0.0.1:8000').replace(/\/+$/, '') + '/api/v1'
export type Actor = 'alex' | 'jordan'
export type RequestRecord = { id: string; title: string; description: string; budget_cents: number; client_id: string; freelancer_id: string; currency: string; status: string }
export type MilestoneRecord = { id: string; title: string; amount_cents: number; acceptance_criteria: string; due_date: string; status: string; evidence: string; feedback: string }
export type ProposalRecord = { id: string; status: string; amount_cents: number; version: number; scope: string; milestones: MilestoneRecord[] }
export type AgreementRecord = { id: string; active: boolean; client_confirmed: boolean; freelancer_confirmed: boolean }
export type NegotiationRecord = {id:string;author:string;message:string;proposed_amount_cents:number|null;created_at:string}
export type InvoiceResult = { paypal_id: string; status: string; sandbox: boolean; paid?: boolean }
export type PlanResult = { source: string; requires_human_approval: boolean; audit_hash: string; plan: { summary: string; ambiguities: string[]; suggestions: string[]; milestones: {title: string; amount_cents: number; acceptance_criteria: string; due_date: string}[] } }
export type ReviewResult = { source: string; requires_human_approval: boolean; audit_hash: string; report: {summary:string; findings: {criterion:string; result:string; evidence_reference:string; explanation:string;next_action:string}[];limitations:string[]} }
export type AuditResult = { verified_hash_chain: boolean; latest_hash: string; blockchain_anchored: boolean; events: {id:string;action:string;actor:string;created_at:string;digest:string}[] }

export async function callAPI<T>(path: string, actor: Actor, method: 'GET' | 'POST' = 'GET', data?: unknown): Promise<T> {
  const res = await fetch(base + path, {
    method,
    headers: { 'X-Demo-Actor': actor, 'Accept': 'application/json', ...(data === undefined ? {} : { 'Content-Type': 'application/json' }) },
    body: data === undefined ? undefined : JSON.stringify(data),
    signal: AbortSignal.timeout(35000),
  })
  const result: unknown = await res.json().catch(() => null)
  if (!res.ok) {
    const detail = result && typeof result === 'object' && 'detail' in result ? (result as {detail:unknown}).detail : undefined
    throw new Error(typeof detail === 'string' ? detail : `Backend error ${res.status}. Check Swagger for details.`)
  }
  return result as T
}

export const commerce = {
  health: (a:Actor)=>callAPI<{status:string;ai_connected:boolean;paypal_connected:boolean}>('/health',a),
  list: (a:Actor)=>callAPI<RequestRecord[]>('/requests',a),
  create: (a:Actor,data:{title:string;description:string;budget_cents:number;currency:'USD';freelancer_id:'alex'})=>callAPI<RequestRecord>('/requests',a,'POST',data),
  send: (a:Actor,r:string)=>callAPI<RequestRecord>(`/requests/${encodeURIComponent(r)}/send`,a,'POST'),
  proposal: (a:Actor,r:string)=>callAPI<ProposalRecord>(`/requests/${encodeURIComponent(r)}/proposals`,a),
  proposalCreate: (a:Actor,r:string,data:unknown)=>callAPI<ProposalRecord>(`/requests/${encodeURIComponent(r)}/proposals`,a,'POST',data),
  proposalRevise: (a:Actor,r:string,data:unknown)=>callAPI<ProposalRecord>(`/requests/${encodeURIComponent(r)}/proposals/revise`,a,'POST',data),
  negotiations: (a:Actor,r:string)=>callAPI<NegotiationRecord[]>(`/requests/${encodeURIComponent(r)}/negotiations`,a),
  negotiate: (a:Actor,r:string,message:string,proposed_amount_cents:number|null)=>callAPI<NegotiationRecord>(`/requests/${encodeURIComponent(r)}/negotiations`,a,'POST',{message,proposed_amount_cents}),
  revision: (a:Actor,r:string)=>callAPI<ProposalRecord>(`/requests/${encodeURIComponent(r)}/proposals/request-revision`,a,'POST'),
  accept: (a:Actor,r:string)=>callAPI<AgreementRecord>(`/requests/${encodeURIComponent(r)}/proposals/accept`,a,'POST'),
  agreement: (a:Actor,r:string)=>callAPI<AgreementRecord>(`/requests/${encodeURIComponent(r)}/agreement`,a),
  confirm: (a:Actor,r:string)=>callAPI<AgreementRecord>(`/requests/${encodeURIComponent(r)}/agreement/confirm`,a,'POST'),
  milestones: (a:Actor,r:string)=>callAPI<MilestoneRecord[]>(`/requests/${encodeURIComponent(r)}/milestones`,a),
  submit: (a:Actor,r:string,m:string,evidence:string)=>callAPI<MilestoneRecord>(`/requests/${encodeURIComponent(r)}/milestones/${encodeURIComponent(m)}/submit`,a,'POST',{evidence}),
  approve: (a:Actor,r:string,m:string,approve:boolean,feedback:string)=>callAPI<MilestoneRecord>(`/requests/${encodeURIComponent(r)}/milestones/${encodeURIComponent(m)}/review`,a,'POST',{approve,feedback}),
  plan: (a:Actor,r:string)=>callAPI<PlanResult>('/agent/plan',a,'POST',{request_id:r}),
  review: (a:Actor,r:string,m:string)=>callAPI<ReviewResult>('/agent/review',a,'POST',{request_id:r,milestone_id:m}),
  invoice: (a:Actor,r:string,m:string,payer_email:string)=>callAPI<InvoiceResult>('/paypal/invoices',a,'POST',{request_id:r,milestone_id:m,payer_email}),
  invoiceSend: (a:Actor,p:string)=>callAPI<InvoiceResult>(`/paypal/invoices/${encodeURIComponent(p)}/send`,a,'POST'),
  invoiceSync: (a:Actor,p:string)=>callAPI<InvoiceResult>(`/paypal/invoices/${encodeURIComponent(p)}/sync`,a),
  audit: (a:Actor,r:string)=>callAPI<AuditResult>(`/requests/${encodeURIComponent(r)}/audit`,a),
}
