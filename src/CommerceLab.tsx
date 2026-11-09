import { useCallback, useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { commerce } from './api/commerce'
import type { Actor, RequestRecord, ProposalRecord, AgreementRecord, MilestoneRecord, PlanResult, ReviewResult, InvoiceResult, AuditResult, NegotiationRecord } from './api/commerce'

const money = (n:number) => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n/100)
const panel:CSSProperties = {background:'#fff',border:'1px solid #dce4ee',boxShadow:'0 8px 28px #1c355015',borderRadius:18,padding:22,marginBottom:18}
const field:CSSProperties = {padding:'11px 13px',border:'1px solid #cad6e4',borderRadius:9,background:'#f9fbfe',color:'#24334a',width:'100%',font:'inherit'}
const button:CSSProperties = {border:0,borderRadius:10,padding:'11px 17px',fontWeight:650,cursor:'pointer',background:'#24466c',color:'white'}
const muted:CSSProperties={fontSize:13,color:'#61738c',lineHeight:1.55}
const label:CSSProperties={display:'block',fontSize:12,fontWeight:700,color:'#516582',marginBottom:6}
const row:CSSProperties={display:'flex',flexWrap:'wrap',gap:10,alignItems:'center'}
const title:CSSProperties={fontSize:17,fontWeight:750,color:'#223d5f',marginBottom:12}
function Action({children,onClick,disabled,secondary=false}:{children:ReactNode;onClick:()=>void;disabled?:boolean;secondary?:boolean}){
  return <button type="button" disabled={disabled} onClick={onClick} style={{...button, ...(secondary?{background:'#e9eff7',color:'#294868'}:{}),opacity:disabled ? 0.55 : 1}}>{children}</button>
}
function Info({children}:{children:ReactNode}){return <div style={muted}>{children}</div>}
const uiID: Record<string,string> = {
  'Connected commerce workspace · Dev-only':'Ruang kerja terhubung · Khusus pengujian',
  'Agentic AI × PayPal Sandbox':'AI Agentik × PayPal Sandbox',
  '1. Create & select project request':'1. Buat & pilih permintaan proyek',
  '2. AI planning & freelancer proposal':'2. Perencanaan AI & proposal freelancer',
  '3. Agreement & milestone review':'3. Kesepakatan & tinjauan milestone',
  '4. Real PayPal Sandbox invoice':'4. Faktur PayPal Sandbox',
  '5. Audit proof & optional blockchain':'5. Bukti audit & blockchain opsional',
  'Create persistent draft':'Buat draft tersimpan', 'Reload list':'Muat ulang daftar',
  'Project title':'Judul proyek', 'Budget USD':'Anggaran USD', 'Project brief':'Deskripsi proyek',
  'Send to Alex':'Kirim ke Fulan', 'Generate AI milestone plan':'Buat rencana milestone AI',
  'Proposal scope':'Cakupan proposal', 'Submit proposal':'Kirim proposal', 'Revise proposal':'Revisi proposal',
  'Negotiation history':'Riwayat negosiasi', 'Message / clarification':'Pesan / klarifikasi',
  'Post negotiation':'Kirim negosiasi', 'Accept proposal':'Terima proposal',
  'Request revision':'Minta revisi', 'Agreement:':'Kesepakatan:',
  'Submit evidence':'Kirim bukti pekerjaan', 'Evidence (plain text)':'Bukti pekerjaan (teks)',
  'Run AI evidence review':'Jalankan peninjauan AI', 'Human decision note':'Catatan keputusan manusia',
  'Approve milestone':'Setujui milestone', 'Request changes':'Minta perbaikan',
  'Payer sandbox email':'Email pembayar Sandbox', 'Create PayPal invoice':'Buat faktur PayPal',
  'Send invoice':'Kirim faktur', 'Verify status with PayPal':'Periksa status di PayPal',
  'Refresh audit proof':'Perbarui bukti audit', 'Refresh':'Segarkan',
  'Choose saved request':'Pilih proyek tersimpan', 'AI summary:':'Ringkasan AI:',
  'AI findings:':'Temuan AI:', 'PAID (verified)':'LUNAS (terverifikasi)',
}
export default function CommerceLab({actor,lang='id'}:{actor:Actor;lang?:'id'|'en'}){
  const t = (key:string) => lang === 'id' ? (uiID[key] ?? key) : key
  const [requests,setRequests]=useState<RequestRecord[]>([])
  const [rid,setRid]=useState('')
  const [proposal,setProposal]=useState<ProposalRecord|null>(null)
  const [agreement,setAgreement]=useState<AgreementRecord|null>(null)
  const [milestones,setMilestones]=useState<MilestoneRecord[]>([])
  const [plan,setPlan]=useState<PlanResult|null>(null)
  const [review,setReview]=useState<ReviewResult|null>(null)
  const [audit,setAudit]=useState<AuditResult|null>(null)
  const [invoice,setInvoice]=useState<InvoiceResult|null>(null)
  const [savedInvoices,setSavedInvoices]=useState<InvoiceResult[]>([])
  const [negotiations,setNegotiations]=useState<NegotiationRecord[]>([])
  const [negotiationMessage,setNegotiationMessage]=useState('Please clarify responsive browser coverage.')
  const [counterAmount,setCounterAmount]=useState('')
  const [health,setHealth]=useState<{status:string;ai_connected:boolean;paypal_connected:boolean}|null>(null)
  const [busy,setBusy]=useState(false)
  const [message,setMessage]=useState('')
  const [error,setError]=useState('')
  const [projectTitle,setProjectTitle]=useState('E-commerce Website Redesign')
  const [projectDescription,setProjectDescription]=useState('Build a responsive ecommerce storefront with accessible navigation, user flows and a production-ready frontend.')
  const [budget,setBudget]=useState('1500')
  const [evidence,setEvidence]=useState('The attached design report describes mobile and desktop screenshots, but tablet testing is not included.')
  const [feedback,setFeedback]=useState('Reviewed the submitted evidence and acceptance criteria.')
  const [payer,setPayer]=useState('')
  const [scope,setScope]=useState('Design and develop a responsive e-commerce website with accessible user flows.')
  const [selectedMilestone,setSelectedMilestone]=useState('')

  const doAction=async (label:string,work:()=>Promise<unknown>)=>{
    if(busy)return
    setBusy(true);setError('');setMessage('')
    try { await work();setMessage(`${label} completed.`) }
    catch(e){setError(e instanceof Error?e.message:'Unexpected error')}
    finally{setBusy(false)}
  }
  const reload=useCallback(async()=>{
    const items=await commerce.list(actor);setRequests(items)
    const status=await commerce.health(actor);setHealth(status)
  },[actor])
  const loadProject=useCallback(async(requestId:string)=>{
    setRid(requestId);setPlan(null);setReview(null);setInvoice(null)
    const results=await Promise.allSettled([commerce.proposal(actor,requestId),commerce.agreement(actor,requestId),commerce.milestones(actor,requestId),commerce.audit(actor,requestId),commerce.negotiations(actor,requestId),commerce.invoices(actor,requestId)])
    setProposal(results[0].status==='fulfilled'?results[0].value:null)
    setAgreement(results[1].status==='fulfilled'?results[1].value:null)
    const ms=results[2].status==='fulfilled'?results[2].value:[]
    setMilestones(ms);setSelectedMilestone(ms[0]?.id??'')
    setAudit(results[3].status==='fulfilled'?results[3].value:null)
    setNegotiations(results[4].status==='fulfilled'?results[4].value:[])
    const existingInvoices=results[5].status==='fulfilled'?results[5].value:[]
    setSavedInvoices(existingInvoices)
    setInvoice(existingInvoices[0]??null)
  },[actor])
  useEffect(()=>{reload().catch(()=>setHealth(null))},[reload])
  useEffect(()=>{if(!rid&&requests.length) void loadProject(requests[0].id)},[rid,requests,loadProject])
  useEffect(()=>{setRid('');setProposal(null);setAgreement(null);setMilestones([]);setPlan(null);setReview(null);setInvoice(null);setSavedInvoices([]);setNegotiations([])},[actor])
  const selected=requests.find(r=>r.id===rid)
  const current=milestones.find(m=>m.id===selectedMilestone)
  const proposalPayload=()=>{
    const total=selected?.budget_cents??Math.round(Number(budget)*100)
    const parts=plan?.plan.milestones ?? [
      {title:'Discovery & Design',amount_cents:Math.round(total*.3),acceptance_criteria:'Provide approved user flows and high fidelity desktop/mobile screens.',due_date:'2026-11-10'},
      {title:'Frontend Implementation',amount_cents:total-Math.round(total*.3),acceptance_criteria:'Provide a working responsive frontend and browser testing evidence.',due_date:'2026-11-12'},
    ]
    return {scope:scope.trim(),amount_cents:total,currency:'USD',timeline:'November 2026',assumptions:'Client supplies branding and content.',revisions:'Two revision rounds.',milestones:parts}
  }
  return <div className="mp-connected-flow" style={{maxWidth:1180,margin:'0 auto',color:'#223a59'}}>
    <div style={{...panel,background:'linear-gradient(125deg,#1c3658,#3c6696)',color:'white'}}>
      <div style={{fontSize:11,letterSpacing:2,textTransform:'uppercase',opacity:.8}}>{t("Connected commerce workspace · Dev-only")}</div>
      <h2 style={{fontSize:27,fontWeight:800,margin:'10px 0'}}>{t("Agentic AI × PayPal Sandbox")}</h2>
      <p style={{color:'#dbe8f7',maxWidth:700}}>Persistent FastAPI + SQLite workflow. Ollama runs locally; invoices and payment statuses come from PayPal Sandbox (virtual funds). Persona switching uses X-Demo-Actor, NOT production authentication. Never use Live credentials here.</p>
      <div style={row}><span>{lang === "id" ? "Persona" : "Persona"}: <strong>{actor==='alex'?(lang === "id" ? 'Fulan / Pekerja Lepas' : 'Fulan / Freelancer'):(lang === "id" ? 'Ahmad / Klien' : 'Ahmad / Client')}</strong></span><span>AI: <strong>{health?.ai_connected?'Ollama configured':'Not configured'}</strong></span><span>PayPal: <strong>{health?.paypal_connected?'Configured':'Not configured'}</strong></span><Action secondary onClick={()=>void doAction('Refresh',reload)} disabled={busy}>{t("Refresh")}</Action></div>
    </div>
    {error&&<div role="alert" style={{...panel,background:'#fff1f1',color:'#9d3636'}}>{error}</div>}
    {message&&<div role="status" style={{...panel,background:'#edf5ff'}}>{message}</div>}
    <section data-part="requests" style={panel}>
      <h3 style={title}>{t("1. Create & select project request")}</h3>
      {actor==='jordan'&&<div className="mp-request-create-form" style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(250px,1fr))',gap:12,marginBottom:14}}>
        <div><label style={label}>{t("Project title")}</label><input style={field} value={projectTitle} onChange={e=>setProjectTitle(e.target.value)}/></div>
        <div><label style={label}>{t("Budget USD")}</label><input style={field} type="number" min="1" value={budget} onChange={e=>setBudget(e.target.value)}/></div>
        <div style={{gridColumn:'1/-1'}}><label style={label}>{t("Project brief")}</label><textarea style={field} rows={3} value={projectDescription} onChange={e=>setProjectDescription(e.target.value)}/></div>
        <div><Action disabled={busy} onClick={()=>void doAction('Create draft',async()=>{const result=await commerce.create(actor,{title:projectTitle,description:projectDescription,budget_cents:Math.round(Number(budget)*100),currency:'USD',freelancer_id:'alex'});await reload();await loadProject(result.id)})}>{t("Create persistent draft")}</Action></div>
      </div>}
      <div style={{...row,marginBottom:10}}><select aria-label="Select saved request" style={{...field,maxWidth:450}} value={rid} onChange={e=>void doAction('Load project',async()=>{if(e.target.value)await loadProject(e.target.value)})}><option value="">Choose saved request</option>{requests.map(r=><option key={r.id} value={r.id}>{r.title} · {r.status} · {money(r.budget_cents)}</option>)}</select><Action secondary disabled={busy} onClick={()=>void doAction('Reload',reload)}>{t("Reload list")}</Action></div>
      {selected&&<div style={row}><span><strong>{selected.title}</strong> · {money(selected.budget_cents)} · {selected.status}</span>{actor==='jordan'&&selected.status==='Draft'&&<Action disabled={busy} onClick={()=>void doAction('Send request',async()=>{await commerce.send(actor,rid);await reload()})}>Send to Fulan</Action>}</div>}
      <Info>{lang==='id'?'Fulan hanya melihat permintaan setelah Ahmad mengirimnya. Data disimpan di SQLite; persona bukan autentikasi.':'Fulan can only see requests after Ahmad sends them. Records are stored in SQLite; personas are not authentication.'}</Info>
    </section>
    {selected&&<>
      <section data-part="proposals" style={panel}>
        <h3 style={title}>{t("2. AI planning & freelancer proposal")}</h3>
        <div style={row}><Action secondary disabled={busy} onClick={()=>void doAction('AI plan',async()=>setPlan(await commerce.plan(actor,rid)))}>{t("Generate AI milestone plan")}</Action><Info>Uses local Ollama (qwen2.5:3b), no paid API credits. Suggestions never auto-approve.</Info></div>
        {plan&&<div style={{background:'#f2f6fd',padding:14,borderRadius:12,margin:'12px 0'}}><strong>{t("AI summary:")}</strong> {plan.plan.summary}<ul>{plan.plan.ambiguities.map((x,i)=><li key={i}>{x}</li>)}</ul>{plan.plan.milestones.map((m,i)=><div key={i}>{m.title} — {money(m.amount_cents)}</div>)}</div>}
        {actor==='alex'&&<div style={{marginTop:12}}><label style={label}>{t("Proposal scope")}</label><textarea style={field} rows={2} value={scope} onChange={e=>setScope(e.target.value)}/><div style={{marginTop:10,...row}}><Action disabled={busy} onClick={()=>void doAction('Submit proposal',async()=>{await commerce.proposalCreate(actor,rid,proposalPayload());await loadProject(rid);await reload()})}>{t("Submit proposal")}</Action>{proposal&&<Action secondary disabled={busy} onClick={()=>void doAction('Revise proposal',async()=>{await commerce.proposalRevise(actor,rid,proposalPayload());await loadProject(rid)})}>{t("Revise proposal")}</Action>}</div></div>}
        {selected.status !== 'Draft'&&<div style={{marginTop:16,padding:14,borderRadius:12,background:'#f5f8fc'}}><strong>{t("Negotiation history")}</strong><div style={{marginTop:8}}>{negotiations.map(n=><div key={n.id} style={{...muted,marginBottom:6}}><strong>{n.author==='alex'?'Fulan':n.author==='jordan'?'Ahmad':n.author}</strong>: {n.message} {n.proposed_amount_cents?`(${money(n.proposed_amount_cents)})`:''}</div>)}</div><label style={label}>{t("Message / clarification")}</label><textarea style={field} rows={2} value={negotiationMessage} onChange={e=>setNegotiationMessage(e.target.value)}/><div style={{...row,margin:'9px 0'}}><input aria-label="Optional counteroffer amount in USD" type="number" placeholder="Optional USD counteroffer" style={{...field,maxWidth:260}} value={counterAmount} onChange={e=>setCounterAmount(e.target.value)}/><Action disabled={busy} onClick={()=>void doAction('Negotiation saved',async()=>{await commerce.negotiate(actor,rid,negotiationMessage,counterAmount?Math.round(Number(counterAmount)*100):null);await loadProject(rid)})}>{t("Post negotiation")}</Action></div><Info>Counteroffers are discussion records only; freelancer must revise the proposal to change its agreed budget.</Info></div>}
        {proposal&&<div style={{marginTop:14}}><Info>Proposal v{proposal.version} · {proposal.status} · {money(proposal.amount_cents)}</Info>{actor==='jordan'&&proposal.status==='Submitted'&&<div style={{...row,marginTop:10}}><Action disabled={busy} onClick={()=>void doAction('Accept proposal',async()=>{await commerce.accept(actor,rid);await loadProject(rid)})}>{t("Accept proposal")}</Action><Action secondary disabled={busy} onClick={()=>void doAction('Request revision',async()=>{await commerce.revision(actor,rid);await loadProject(rid)})}>{t("Request revision")}</Action></div>}</div>}
      </section>
      <section data-part="milestones" style={panel}>
        <h3 style={title}>{t("3. Agreement & milestone review")}</h3>
        {agreement?<div style={{...row,marginBottom:12}}><span>Agreement: <strong>{agreement.active?'Active':'Awaiting confirmation'}</strong> · Ahmad {agreement.client_confirmed?'✓':'○'} · Fulan {agreement.freelancer_confirmed?'✓':'○'}</span><Action secondary disabled={busy||agreement.active||(actor==='alex'?agreement.freelancer_confirmed:agreement.client_confirmed)} onClick={()=>void doAction('Confirm agreement',async()=>{await commerce.confirm(actor,rid);await loadProject(rid)})}>Confirm as {actor}</Action></div>:<Info>Client must accept a proposal before an agreement exists.</Info>}
        {milestones.length>0&&<><div style={{...row,marginBottom:12}}><select aria-label="Select milestone" style={{...field,maxWidth:420}} value={selectedMilestone} onChange={e=>setSelectedMilestone(e.target.value)}>{milestones.map(m=><option key={m.id} value={m.id}>{m.title} · {m.status} · {money(m.amount_cents)}</option>)}</select></div>{current&&<><p>{current.acceptance_criteria}</p><Info>Status: {current.status} · {money(current.amount_cents)}</Info>{actor==='alex'&&agreement?.active&&['Upcoming','In progress','Changes requested'].includes(current.status)&&<><label style={label}>{t("Evidence (plain text)")}</label><textarea style={field} rows={3} value={evidence} onChange={e=>setEvidence(e.target.value)}/><Action disabled={busy} onClick={()=>void doAction('Submit evidence',async()=>{await commerce.submit(actor,rid,current.id,evidence);await loadProject(rid)})}>{t("Submit evidence")}</Action></>}{current.status==='In review'&&<div style={{marginTop:12}}><Action secondary disabled={busy} onClick={()=>void doAction('AI review',async()=>setReview(await commerce.review(actor,rid,current.id)))}>{t("Run AI evidence review")}</Action>{actor==='jordan'&&<div style={{marginTop:12}}><label style={label}>{t("Human decision note")}</label><textarea style={field} rows={2} value={feedback} onChange={e=>setFeedback(e.target.value)}/><div style={row}><Action disabled={busy} onClick={()=>void doAction('Approve milestone',async()=>{await commerce.approve(actor,rid,current.id,true,feedback);await loadProject(rid)})}>{t("Approve milestone")}</Action><Action secondary disabled={busy} onClick={()=>void doAction('Request changes',async()=>{await commerce.approve(actor,rid,current.id,false,feedback);await loadProject(rid)})}>{t("Request changes")}</Action></div></div>}</div>}</>}{review&&<div style={{padding:14,background:'#f0f5fc',borderRadius:12,marginTop:12}}><strong>{t("AI findings:")}</strong> {review.report.summary}{review.report.findings.map((f,i)=><p key={i}><strong>{f.result}:</strong> {f.explanation}</p>)}<Info>AI does not decide whether work is approved.</Info></div>}</>}
      </section>
      <section data-part="payments" style={panel}>
        <h3 style={title}>{t("4. Real PayPal Sandbox invoice")}</h3>
        <Info>Only approved milestones are eligible. A sandbox invoice is not a cash payout, and sending does not imply paid.</Info>
        {actor==='alex'&&current?.status==='Approved'&&<div style={{marginTop:10}}><label style={label}>{t("Payer sandbox email")}</label><input style={{...field,maxWidth:350}} type="email" placeholder="Email akun Personal Sandbox (bukan akun asli)" value={payer} onChange={e=>setPayer(e.target.value)}/><div style={{marginTop:10}}><Action disabled={busy||!payer.trim()||savedInvoices.some(i=>i.milestone_id===current.id)} onClick={()=>void doAction('Create PayPal invoice',async()=>{const created=await commerce.invoice(actor,rid,current.id,payer);setInvoice(created);await loadProject(rid)})}>{t("Create PayPal invoice")}</Action></div></div>}
        {savedInvoices.length>0&&<div style={{...row,marginTop:12}}><label style={label}>Saved PayPal Sandbox invoice</label><select aria-label="Select saved PayPal invoice" style={{...field,maxWidth:430}} value={invoice?.paypal_id??''} onChange={e=>setInvoice(savedInvoices.find(i=>i.paypal_id===e.target.value)??null)}>{savedInvoices.map(i=><option key={i.paypal_id} value={i.paypal_id}>{i.paypal_id} · {i.status} · {money(i.amount_cents??0)}</option>)}</select></div>}
        {invoice&&<div style={{...row,marginTop:12}}><strong>{invoice.paypal_id} — {invoice.status}</strong>{actor==='alex'&&invoice.status==='DRAFT'&&<Action disabled={busy} onClick={()=>void doAction('Send invoice',async()=>{const updated=await commerce.invoiceSend(actor,invoice.paypal_id);setInvoice(updated);setSavedInvoices(previous=>previous.map(i=>i.paypal_id===updated.paypal_id?{...i,...updated}:i))})}>{t("Send invoice")}</Action>}<Action secondary disabled={busy} onClick={()=>void doAction('Sync PayPal status',async()=>{const updated=await commerce.invoiceSync(actor,invoice.paypal_id);setInvoice(updated);setSavedInvoices(previous=>previous.map(i=>i.paypal_id===updated.paypal_id?{...i,...updated}:i))})}>{t("Verify status with PayPal")}</Action>{invoice.paid&&<strong>{t("PAID (verified)")}</strong>}</div>}
        <Info>Invoices are saved in SQLite and reloaded when you select a project. The status shown is the last recorded Sandbox status; click Verify to request the latest status from PayPal.</Info>
      </section>
      <section data-part="audit" style={panel}>
        <h3 style={title}>{t("5. Audit proof & optional blockchain")}</h3>
        <Action secondary disabled={busy} onClick={()=>void doAction('Verify hash chain',async()=>setAudit(await commerce.audit(actor,rid)))}>{t("Refresh audit proof")}</Action>
        {audit&&<><p><strong>Off-chain hash chain:</strong> {audit.verified_hash_chain?'VALID':'INVALID'} · Events: {audit.events.length}</p><div style={{...muted,wordBreak:'break-all'}}>Latest SHA-256: {audit.latest_hash}</div><Info>On-chain anchored: {audit.blockchain_anchored?'Yes':'No'}. Optional Solidity testnet proof only. No blockchain-based payment or escrow.</Info></>}
      </section>
    </>}
  </div>
}
