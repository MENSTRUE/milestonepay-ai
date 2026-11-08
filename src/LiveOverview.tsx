/** MilestonePay AI — real backend overview, bilingual ID/EN.
 * Only SQLite-recorded Sandbox invoices count towards payment totals.
 * No made-up demo money is included in the KPIs.
 */
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import { commerce } from './api/commerce'
import type { Actor, RequestRecord, InvoiceResult, MilestoneRecord } from './api/commerce'

type Lang = 'id' | 'en'
type ProjectData = {
  request: RequestRecord
  invoices: InvoiceResult[]
  milestones: MilestoneRecord[]
  invoicesError: boolean
  milestonesError: boolean
}
type Snapshot = { projects: ProjectData[]; loadedAt: Date; partial: boolean }
const dollars = (cents: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
const panel: CSSProperties = { background: '#fff', border: '1px solid #dae4f0', borderRadius: 18, padding: 22, boxShadow: '0 7px 24px rgba(22,51,83,.045)' }
const soft: CSSProperties = { fontSize: 13, color: '#60728c', lineHeight: 1.6 }
const action: CSSProperties = { background: '#24456c', color: '#fff', border: 0, borderRadius: 9, fontWeight: 700, padding: '11px 16px', cursor: 'pointer' }
const secondary: CSSProperties = { ...action, color: '#24456c', background: '#e9f0f8' }
const copy = {
  id: {
    title: 'Ringkasan data proyek sebenarnya', intro: 'Angka ini dibaca dari FastAPI + SQLite, bukan dari simulasi dashboard lama.',
    refresh: 'Muat ulang data', loading: 'Mengambil data dari backend…', offline: 'Backend tidak dapat dihubungi. Tidak menampilkan angka palsu.',
    projects: 'Proyek tercatat', active: 'Milestone disetujui', paid: 'Pembayaran Sandbox terverifikasi', pending: 'Invoice belum dibayar',
    history: 'Proyek & riwayat pembayaran', none: 'Belum ada proyek di database untuk akun demo ini.',
    invoice: 'Invoice Sandbox', noInvoice: 'Belum ada invoice tercatat', source: 'Sumber: SQLite; nilai PAID berasal dari sinkronisasi status PayPal Sandbox sebelumnya.',
    refreshNote: 'Klik "Periksa PayPal" untuk memperbarui status satu invoice secara langsung dari PayPal.',
    verify: 'Periksa PayPal', verifying: 'Memeriksa…', current: 'Terakhir diperbarui', partial: 'Sebagian data gagal diambil. Angka yang belum pasti tidak ditampilkan.',
    tutorial: 'Panduan cepat MilestonePay', tutorialIntro: 'Ikuti alur sebagai Ahmad dan Fulan. Gunakan menu Live AI + PayPal untuk bekerja dengan data yang tersimpan.',
    steps: [
      ['Ahmad membuat permintaan', 'Pilih Ahmad → Live AI + PayPal → buat dan kirim request ke Fulan.'],
      ['Fulan mengirim proposal', 'Ganti ke Fulan → pilih request → kirim proposal.'],
      ['Kedua pihak menyetujui', 'Ahmad menerima proposal; Ahmad dan Fulan mengonfirmasi agreement.'],
      ['AI mengevaluasi bukti', 'Fulan mengirim evidence → jalankan AI Review → Ahmad memutuskan. Ollama hanya memberi saran.'],
      ['Invoice PayPal Sandbox', 'Jika milestone disetujui, Fulan membuat dan mengirim invoice. Ahmad membayar memakai akun Personal Sandbox.'],
      ['Periksa pembayaran', 'Klik Periksa PayPal untuk membaca status terbaru. Hanya status PAID yang terverifikasi masuk total pembayaran.'],
    ],
    open: 'Buka Live AI + PayPal', explain: 'Tentang angka & keamanan',
    explainText: 'Ini adalah prototipe pengembangan. Ahmad/Fulan merupakan persona demo (bukan login aman). Pembayaran di sini adalah uang virtual PayPal Sandbox, bukan pendapatan nyata. Audit hash disimpan off-chain, bukan escrow atau transfer blockchain. Halaman klasik lainnya masih merupakan simulasi UI.',
    status: 'Status', amount: 'Nominal', noMilestone: 'Belum ada milestone', demo: 'SANDBOX · UANG VIRTUAL', paidLabel: 'Dibayar (Sandbox)', noData: '—',
    unknown: 'Belum diketahui', invoiceIssue: 'Riwayat invoice belum tersedia untuk proyek ini', noPaid: 'Belum ada pembayaran terverifikasi',
  },
  en: {
    title: 'Live project overview', intro: 'These numbers come from FastAPI + SQLite, not the old simulated dashboard.',
    refresh: 'Refresh data', loading: 'Loading backend data…', offline: 'Cannot reach backend. No fabricated numbers will be shown.',
    projects: 'Recorded projects', active: 'Approved milestones', paid: 'Verified Sandbox payments', pending: 'Unpaid invoices',
    history: 'Projects & payment history', none: 'No projects in the database for this demo persona.',
    invoice: 'Sandbox invoice', noInvoice: 'No recorded invoices', source: 'Source: SQLite; PAID values reflect the last PayPal Sandbox status sync.',
    refreshNote: 'Use "Check PayPal" to refresh an invoice status directly from PayPal.',
    verify: 'Check PayPal', verifying: 'Checking…', current: 'Last updated', partial: 'Some data could not be loaded. Unknown totals are hidden.',
    tutorial: 'MilestonePay quick guide', tutorialIntro: 'Follow both personas. Use Live AI + PayPal to work with persistent records.',
    steps: [
      ['Ahmad creates a request', 'Choose Ahmad → Live AI + PayPal → create and send the request to Fulan.'],
      ['Fulan proposes', 'Switch to Fulan → select the request → submit a proposal.'],
      ['Both parties agree', 'Ahmad accepts the proposal; Ahmad and Fulan confirm the agreement.'],
      ['AI reviews evidence', 'Fulan submits evidence → run AI review → Ahmad makes the final decision. Ollama only advises.'],
      ['PayPal Sandbox invoice', 'After approval, Fulan creates and sends the invoice. Ahmad pays with a Personal Sandbox account.'],
      ['Verify payment', 'Check PayPal to read its current status. Only verified PAID invoices count as paid.'],
    ],
    open: 'Open Live AI + PayPal', explain: 'About the numbers & security',
    explainText: 'This is a development prototype. Ahmad/Fulan are demo personas, not secure authentication. Sandbox payments use virtual money, not real income. Audit hashes are off-chain, not blockchain escrow or on-chain transfers. Other legacy workspace pages remain UI simulations.',
    status: 'Status', amount: 'Amount', noMilestone: 'No milestones yet', demo: 'SANDBOX · VIRTUAL FUNDS', paidLabel: 'Paid (Sandbox)', noData: '—',
    unknown: 'Unknown', invoiceIssue: 'Invoice history unavailable for this project', noPaid: 'No verified payments yet',
  },
} as const

export default function LiveOverview({ actor, lang, onOpenLive }: { actor: Actor; lang: Lang; onOpenLive: () => void }) {
  const t = copy[lang]
  const [data, setData] = useState<Snapshot | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [checking, setChecking] = useState<string | null>(null)
  const [openGuide, setOpenGuide] = useState(true)
  const load = useCallback(async (cancelled: () => boolean) => {
    setLoading(true); setError(''); setData(null)
    try {
      const requests = await commerce.list(actor)
      const results = await Promise.all(requests.map(async request => {
        const [inv, ms] = await Promise.allSettled([commerce.invoices(actor, request.id), commerce.milestones(actor, request.id)])
        return { request, invoices: inv.status === 'fulfilled' ? inv.value : [], milestones: ms.status === 'fulfilled' ? ms.value : [], invoicesError: inv.status !== 'fulfilled', milestonesError: ms.status !== 'fulfilled' && ['Accepted','Proposal Received'].includes(request.status) }
      }))
      if (!cancelled()) setData({projects: results, loadedAt: new Date(), partial: results.some(x => x.invoicesError || x.milestonesError)})
    } catch (e) {
      if (!cancelled()) setError(e instanceof Error ? e.message : 'Connection failed')
    } finally { if (!cancelled()) setLoading(false) }
  }, [actor])
  useEffect(() => { let ignored = false; void load(() => ignored); return () => { ignored = true } }, [load, refreshKey])
  const totals = useMemo(() => {
    const projects = data?.projects ?? []
    let paidCents = 0, pendingCents = 0, pendingCount = 0, approved = 0
    for (const p of projects) {
      for (const m of p.milestones) if (m.status === 'Approved' || m.status === 'Paid') approved++
      for (const inv of p.invoices) {
        if (inv.status === 'PAID' || inv.paid) paidCents += inv.amount_cents ?? 0
        else if (!['CANCELLED', 'REFUNDED', 'MARKED_AS_REFUNDED'].includes(inv.status)) { pendingCents += inv.amount_cents ?? 0; pendingCount++ }
      }
    }
    return { projects: projects.length, approved, paidCents, pendingCents, pendingCount }
  }, [data])
  const verify = async (id: string) => {
    setChecking(id); setError('')
    try { await commerce.invoiceSync(actor, id); setRefreshKey(v => v + 1) }
    catch(e) { setError(e instanceof Error ? e.message : 'PayPal verification failed') }
    finally { setChecking(null) }
  }
  const showNumber = !loading && !!data && !data.partial
  const cards = [
    {label:t.projects, value: data ? String(totals.projects).padStart(2,'0') : t.noData, hint:'FastAPI · SQLite'},
    {label:t.active, value: showNumber ? String(totals.approved).padStart(2,'0') : t.noData, hint:'SQLite · milestones'},
    {label:t.paid, value: showNumber ? dollars(totals.paidCents) : t.noData, hint:t.demo},
    {label:t.pending, value: showNumber ? `${totals.pendingCount} · ${dollars(totals.pendingCents)}` : t.noData, hint:t.demo},
  ]
  return <div style={{display:'grid',gap:18,color:'#243a57'}}>
    <div style={{...panel,background:'linear-gradient(115deg,#1f3b60,#386697)',color:'#fff',display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:14}}>
      <div>
        <div style={{fontSize:11,fontWeight:700,letterSpacing:2,opacity:.8}}>FASTAPI · SQLITE · OLLAMA · PAYPAL SANDBOX</div>
        <h2 style={{fontSize:24,margin:'8px 0'}}>{t.title}</h2>
        <div style={{color:'#dbe8f5',fontSize:14}}>{t.intro}</div>
      </div>
      <button style={{...action,background:'#f5f9ff',color:'#24456c'}} onClick={()=>setRefreshKey(k=>k+1)} disabled={loading}>{loading?t.loading:t.refresh}</button>
    </div>
    {error && <div role="alert" style={{...panel,background:'#fff2f2',color:'#9b3131'}}>{t.offline} {error}</div>}
    {data?.partial && <div role="status" style={{...panel,background:'#fff6e7',color:'#76500b'}}>{t.partial}</div>}
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(195px,1fr))',gap:14}}>
      {cards.map(c=><div key={c.label} style={panel}><div style={{...soft,fontWeight:700}}>{c.label}</div><div style={{fontSize:27,fontWeight:800,margin:'12px 0',color:'#213d60'}}>{loading?'…':c.value}</div><div style={{fontSize:11,color:'#7b8ba2'}}>{c.hint}</div></div>)}
    </div>
    <section style={panel}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12,marginBottom:12}}><h3 style={{fontSize:18,margin:0}}>{t.history}</h3><span style={{...soft,fontSize:12}}>{data ? `${t.current}: ${data.loadedAt.toLocaleTimeString(lang === 'id' ? 'id-ID':'en-US')}` : t.loading}</span></div>
      {data?.projects.length === 0 && <p style={soft}>{t.none}</p>}
      {data?.projects.map(p=><div key={p.request.id} style={{padding:'16px 0',borderTop:'1px solid #e4ebf3'}}>
        <div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap',marginBottom:9}}><div><strong>{p.request.title}</strong><div style={soft}>{t.status}: {p.request.status} · {dollars(p.request.budget_cents)}</div></div><span style={{background:'#edf3fb',color:'#31567d',padding:'6px 10px',borderRadius:8,fontSize:12,fontWeight:700}}>{p.milestones.length} milestones</span></div>
        {p.invoicesError ? <p style={soft}>{t.invoiceIssue}</p> : p.invoices.length === 0 ? <p style={soft}>{t.noInvoice}</p> : p.invoices.map(inv=><div key={inv.paypal_id} style={{padding:'10px 12px',marginTop:8,background:'#f4f7fb',borderRadius:10,display:'flex',gap:10,alignItems:'center',justifyContent:'space-between',flexWrap:'wrap'}}>
          <div style={{minWidth:0}}><div style={{fontSize:12,fontWeight:700,overflowWrap:'anywhere'}}>{inv.paypal_id}</div><div style={{...soft,fontSize:12}}>{dollars(inv.amount_cents ?? 0)} · <strong style={{color:inv.status==='PAID'?'#207451':'#7a5d20'}}>{inv.status==='PAID'?t.paidLabel:inv.status}</strong></div></div>
          <button style={secondary} disabled={checking!==null} onClick={()=>void verify(inv.paypal_id)}>{checking===inv.paypal_id?t.verifying:t.verify}</button>
        </div>)}
      </div>)}
      <p style={{...soft,fontSize:12,marginTop:14}}>{t.source} {t.refreshNote}</p>
    </section>
    <section style={panel}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:10,flexWrap:'wrap'}}><h3 style={{fontSize:18,margin:0}}>{t.tutorial}</h3><button style={secondary} onClick={()=>setOpenGuide(v=>!v)} aria-expanded={openGuide}>{openGuide?'−':'+'}</button></div>
      {openGuide && <><p style={soft}>{t.tutorialIntro}</p><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))',gap:12}}>{t.steps.map(([head,description],i)=><div key={head} style={{padding:14,background:'#f5f8fc',borderRadius:11,border:'1px solid #e5ecf5'}}><strong style={{fontSize:14}}>{i+1}. {head}</strong><p style={{...soft,marginBottom:0}}>{description}</p></div>)}</div><div style={{marginTop:17}}><button style={action} onClick={onOpenLive}>{t.open} →</button></div></>}
    </section>
    <details style={panel}><summary style={{cursor:'pointer',fontWeight:700}}>{t.explain}</summary><p style={soft}>{t.explainText}</p></details>
  </div>
}
