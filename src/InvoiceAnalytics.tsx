/** Backend invoice analytics. No guessed revenue or fake payments. */
import {useCallback,useEffect,useMemo,useState} from 'react'
import {commerce} from './api/commerce'
import type {Actor, InvoiceResult, RequestRecord, MilestoneRecord} from './api/commerce'

type Row={project:RequestRecord,invoice:InvoiceResult,milestone?:MilestoneRecord}
type Lang='id'|'en'
const ui={id:{heading:'Analitik proyek dan invoice',intro:'Data berasal dari SQLite. Status diperbarui dari PayPal hanya jika tombol sinkronisasi ditekan.',search:'Cari proyek, invoice, atau status',refresh:'Muat ulang',export:'Ekspor CSV',verify:'Verifikasi PayPal',total:'Total invoice',paid:'Pembayaran Sandbox PAID',unpaid:'Belum lunas',project:'Proyek',milestone:'Milestone',invoice:'Invoice',status:'Status',amount:'Nominal',action:'Aksi',date:'Data',empty:'Belum ada invoice untuk persona ini.',offline:'Gagal membaca API backend',partial:'Sebagian proyek tidak dapat dibaca; angka bukan total lengkap.',syncError:'Tidak dapat menyinkronkan',foot:'Semua nilai adalah USD Sandbox (uang virtual), bukan pendapatan asli.',csv:'Laporan invoice sandbox'},en:{heading:'Project & invoice analytics',intro:'Records come from SQLite. PayPal status is refreshed only when Sync is used.',search:'Search projects, invoices, status',refresh:'Refresh',export:'Export CSV',verify:'Sync PayPal',total:'Invoices',paid:'PAID Sandbox payments',unpaid:'Unpaid',project:'Project',milestone:'Milestone',invoice:'Invoice',status:'Status',amount:'Amount',action:'Action',date:'Data',empty:'No recorded invoices for this persona.',offline:'Unable to reach backend',partial:'Some projects could not be loaded; totals may be incomplete.',syncError:'Unable to sync',foot:'Amounts are USD virtual Sandbox funds, not real income.',csv:'Sandbox invoice report'}} as const
const dollar=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n/100)
export default function InvoiceAnalytics({actor,lang}:{actor:Actor,lang:Lang}){
 const t=ui[lang]; const [rows,setRows]=useState<Row[]>([]);const [query,setQuery]=useState('');const [loading,setLoading]=useState(true);const [error,setError]=useState('');const [partial,setPartial]=useState(false);const [busy,setBusy]=useState('');const [refreshKey,setRefreshKey]=useState(0)
 const load=useCallback(async()=>{
  setLoading(true);setError('');setPartial(false)
  try{
   const projects=await commerce.list(actor)
   const parts=await Promise.all(projects.map(async project=>{
    const [invoices,milestones]=await Promise.allSettled([commerce.invoices(actor,project.id),commerce.milestones(actor,project.id)])
    return {project, invoices:invoices.status==='fulfilled'?invoices.value:[],milestones:milestones.status==='fulfilled'?milestones.value:[],failed:invoices.status==='rejected'}
   }))
   setPartial(parts.some(p=>p.failed))
   setRows(parts.flatMap(p=>p.invoices.map(invoice=>({project:p.project,invoice,milestone:p.milestones.find(m=>m.id===invoice.milestone_id)}))))
  }catch(e){setError(e instanceof Error?e.message:String(e));setRows([])}finally{setLoading(false)}
 },[actor])
 useEffect(()=>{let active=true;void load().then(()=>{if(!active)return});return()=>{active=false}},[load,refreshKey])
 const visible=useMemo(()=>rows.filter(r=>[r.project.title,r.invoice.paypal_id,r.invoice.status,r.milestone?.title??''].join(' ').toLowerCase().includes(query.toLowerCase())),[rows,query])
 const paid=rows.filter(r=>r.invoice.status==='PAID').reduce((sum,r)=>sum+(r.invoice.amount_cents??0),0)
 const unpaid=rows.filter(r=>!['PAID','CANCELLED','REFUNDED'].includes(r.invoice.status)).length
 const sync=async(id:string)=>{setBusy(id);setError('');try{await commerce.invoiceSync(actor,id);setRefreshKey(v=>v+1)}catch(e){setError(`${t.syncError}: ${e instanceof Error?e.message:String(e)}`)}finally{setBusy('')}}
 const csv=()=>{
  const safe=(s:string)=>{const x=/^[=+\-@\t\r]/.test(s)?`'${s}`:s;return '"'+x.replace(/"/g,'""')+'"'}
  const content=[['Project','Milestone','PayPal Invoice ID','Status','Currency','Amount Cents','Environment'],...visible.map(r=>[r.project.title,r.milestone?.title??'',r.invoice.paypal_id,r.invoice.status,'USD',String(r.invoice.amount_cents??0),'SANDBOX'])].map(row=>row.map(safe).join(',')).join('\r\n')
  const url=URL.createObjectURL(new Blob(['\ufeff'+content],{type:'text/csv;charset=utf-8;'}));const a=document.createElement('a');a.href=url;a.download='milestonepay-sandbox-invoices.csv';a.click();URL.revokeObjectURL(url)
 }
 return <section className="mp-card">
  <h2>{t.heading}</h2><p>{t.intro}</p>
  {error&&<div role="alert" className="mp-warning">{t.offline}: {error}</div>}
  {partial&&<div role="status" className="mp-warning">{t.partial}</div>}
  <div className="mp-metrics"><div className="mp-metric"><small>{t.total}</small><strong>{loading?'…':error?'—':rows.length}</strong></div><div className="mp-metric"><small>{t.paid}</small><strong>{loading?'…':error||partial?'—':dollar(paid)}</strong></div><div className="mp-metric"><small>{t.unpaid}</small><strong>{loading?'…':error||partial?'—':unpaid}</strong></div></div>
  <div className="mp-toolbar"><input className="mp-filter" aria-label={t.search} placeholder={t.search} value={query} onChange={e=>setQuery(e.target.value)}/><div style={{display:'flex',gap:8,flexWrap:'wrap'}}><button className="mp-primary" disabled={loading} onClick={()=>setRefreshKey(x=>x+1)}>{t.refresh}</button><button className="mp-primary" disabled={loading||!!error} onClick={csv}>{t.export}</button></div></div>
  <div className="mp-table-wrap"><table className="mp-table"><thead><tr><th>{t.project}</th><th>{t.milestone}</th><th>{t.invoice}</th><th>{t.status}</th><th>{t.amount}</th><th>{t.action}</th></tr></thead><tbody>{visible.map(r=><tr key={r.invoice.paypal_id}><td>{r.project.title}</td><td>{r.milestone?.title??'—'}</td><td style={{fontSize:12,overflowWrap:'anywhere'}}>{r.invoice.paypal_id}</td><td><span className={r.invoice.status==='PAID'?'mp-tag mp-tag-paid':'mp-tag'}>{r.invoice.status}</span></td><td>{dollar(r.invoice.amount_cents??0)}</td><td><button className="mp-primary" disabled={!!busy} onClick={()=>void sync(r.invoice.paypal_id)}>{busy===r.invoice.paypal_id?'…':t.verify}</button></td></tr>)}</tbody></table>{!loading&&visible.length===0&&<p style={{padding:16}}>{t.empty}</p>}</div>
  <p style={{fontSize:12,marginTop:18}}>{t.foot}</p>
 </section>
}
