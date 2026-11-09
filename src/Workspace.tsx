import { useEffect, useState } from 'react'
import type { Actor } from './api/commerce'
import { Logo } from './ui'
import CommerceLab from './CommerceLab'
import LiveOverview from './LiveOverview'
import InvoiceAnalytics from './InvoiceAnalytics'

type Lang = 'id'|'en'
type View = 'dashboard'|'requests'|'proposals'|'agreements'|'milestones'|'ai'|'payments'|'analytics'|'audit'|'guide'|'settings'
const groups: {name:string;items:{view:View;icon:string;id:string;en:string}[]}[] = [
 {name:'MAIN MENU',items:[{view:'dashboard',icon:'▦',id:'Ringkasan',en:'Overview'},{view:'requests',icon:'▤',id:'Permintaan Proyek',en:'Project Requests'},{view:'proposals',icon:'▧',id:'Proposal & Negosiasi',en:'Proposals & Negotiation'},{view:'agreements',icon:'◇',id:'Kesepakatan',en:'Agreements'},{view:'milestones',icon:'✓',id:'Milestone & Persetujuan',en:'Milestones & Approvals'}]},
 {name:'INTELLIGENCE & FINANCE',items:[{view:'ai',icon:'✧',id:'AI Workspace',en:'AI Workspace'},{view:'payments',icon:'▣',id:'Pembayaran PayPal',en:'PayPal Payments'},{view:'analytics',icon:'▥',id:'Analitik & Invoice',en:'Analytics & Invoices'},{view:'audit',icon:'◎',id:'Jejak Audit',en:'Audit Trail'}]},
 {name:'SUPPORT',items:[{view:'guide',icon:'?',id:'Tutorial Penggunaan',en:'How to Use'},{view:'settings',icon:'⚙',id:'Pengaturan',en:'Settings'}]},
]
const steps={id:[
 ['Ahmad membuat permintaan','Buka Permintaan Proyek, isi brief lalu kirim ke Fulan.'],
 ['Fulan menawar','Klik Ganti Akun untuk kembali ke halaman Masuk, pilih Fulan lalu buka Proposal & Negosiasi.'],
 ['Kedua pihak setuju','Ahmad menerima proposal. Ahmad dan Fulan mengonfirmasi agreement.'],
 ['Kirim evidence & tinjau AI','Fulan menyerahkan bukti teks, Ollama memberi saran, Ahmad memutuskan.'],
 ['Bayar dengan PayPal Sandbox','Setelah milestone disetujui, Fulan mengirim invoice ke akun Personal Sandbox.'],
 ['Periksa pembayaran','Cek status dari PayPal dan lihat invoice pada dashboard.']
],en:[
 ['Ahmad creates a request','Open Project Requests, describe the scope and send it to Fulan.'],
 ['Fulan proposes','Return to Login using Change Account, choose Fulan and submit the proposal.'],
 ['Both parties agree','Ahmad accepts and both parties confirm the agreement.'],
 ['Evidence + AI review','Fulan submits evidence, Ollama advises, Ahmad makes the decision.'],
 ['Pay through PayPal Sandbox','Fulan sends an invoice to a Personal Sandbox account after approval.'],
 ['Verify the payment','Sync with PayPal and find the invoice on the dashboard.']
]}
const titleFor=(v:View,lang:Lang)=>groups.flatMap(x=>x.items).find(x=>x.view===v)?.[lang] ?? v
const flowViews=new Set<View>(['requests','proposals','agreements','milestones','ai','payments','audit'])
export function MilestonePayWorkspace({actor,onSwitch,onLogout}:{actor:Actor;onSwitch:()=>void;onLogout:()=>void}) {
 const [lang,setLang]=useState<Lang>(()=>{try{return localStorage.getItem('mp-lang')==='en'?'en':'id'}catch{return 'id'}})
 const [view,setView]=useState<View>('dashboard')
 const [menu,setMenu]=useState(false)
 const [notification,setNotification]=useState(false)
 const id=lang==='id',name=actor==='jordan'?'Ahmad':'Fulan'
 useEffect(()=>{try{localStorage.setItem('mp-lang',lang)}catch{}document.documentElement.lang=lang},[lang])
 const go=(v:View)=>{setView(v);setMenu(false);setNotification(false);window.scrollTo({top:0,behavior:'smooth'})}
 const subtitle=id?'Data proyek dan pembayaran berasal dari FastAPI + SQLite. Dana PayPal hanya virtual.':'Projects and payments are loaded from FastAPI + SQLite. PayPal funds are virtual.'
 return <div className="mp-premium-shell">
  {menu&&<button className="mp-mobile-backdrop" aria-label="Close menu" onClick={()=>setMenu(false)} />}
  <aside className={`mp-premium-sidebar ${menu?'opened':''}`}><div className="mp-side-logo"><Logo/><span className="mp-logo-aura">AI</span></div>
   <div className="mp-organization"><div className="mp-organization-icon">✦</div><div><strong>Amanah Studio</strong><small>{id?'Ruang kolaborasi':'Collaboration workspace'}</small></div><span className="mp-organization-pill">MVP</span></div>
   <nav aria-label="Workspace navigation">{groups.map(group=><div className="mp-nav-group" key={group.name}><div className="mp-nav-section">{group.name}</div>{group.items.map(item=><button key={item.view} type="button" aria-current={view===item.view?'page':undefined} className={`mp-side-link ${view===item.view?'current':''}`} onClick={()=>go(item.view)}><span className="mp-side-icon" aria-hidden="true">{item.icon}</span><span>{item[lang]}</span>{view===item.view&&<span className="mp-side-active-dot"/>}</button>)}</div>)}</nav>
   <div className="mp-sidebar-bottom"><div className="mp-sidebar-hint"><span>✧</span><strong>{id?'Satu proyek, dua perspektif.':'One project, two perspectives.'}</strong><p>{id?'AI membantu analisis. Ahmad & Fulan tetap menentukan keputusan.':'AI gives insights. Ahmad & Fulan stay in control.'}</p><button type="button" onClick={()=>go('guide')}>{id?'Lihat panduan':'Open guide'} →</button></div><button type="button" className="mp-sidebar-profile" onClick={()=>go('settings')}><span className="mp-person-avatar">{name[0]}</span><span><strong>{name}</strong><small>{actor==='jordan'?(id?'Klien':'Client'):'Freelancer'} · Sandbox</small></span><span>⌄</span></button></div>
  </aside>
  <div className="mp-premium-main"><header className="mp-premium-topbar"><div className="mp-premium-breadcrumb"><button type="button" className="mp-mobile-toggle" onClick={()=>setMenu(true)} aria-label="Open menu">☰</button><span>{id?'Workspace':'Workspace'}</span><span className="mp-breadcrumb-separator">/</span><strong>{titleFor(view,lang)}</strong></div><div className="mp-premium-actions"><span className="mp-state-tag"><i/> SANDBOX</span><label className="mp-language-field"><span>{id?'Bahasa':'Language'}</span><select aria-label="Language" value={lang} onChange={e=>setLang(e.target.value as Lang)}><option value="id">🇮🇩 Indonesia</option><option value="en">🇬🇧 English</option></select></label><button type="button" className="mp-profile-switch" onClick={onSwitch} title={id?'Kembali ke halaman masuk untuk mengganti akun':'Return to login to change account'}><span className="mp-person-avatar small">{name[0]}</span><span className="mp-profile-switch-text">{name}</span><span>↪</span></button><button className="mp-notification" type="button" onClick={()=>setNotification(x=>!x)} aria-label="Information" aria-expanded={notification}>♧</button>{notification&&<div className="mp-notification-popup">{id?'Mode Sandbox: tidak ada perpindahan uang asli.':'Sandbox mode: no real money moves.'}</div>}</div></header>
   <main className="mp-premium-content"><div className="mp-premium-heading"><div><div className="mp-heading-kicker">AMANAH STUDIO <span>·</span> {flowViews.has(view)?'CONNECTED WORKFLOW':'MILESTONEPAY AI'}</div><h1>{view==='dashboard'?(id?`Selamat datang, ${name}`:`Welcome back, ${name}`):titleFor(view,lang)}</h1><p>{view==='dashboard'?subtitle:flowViews.has(view)?(id?'Kelola tahap proyek melalui backend yang sama. Data tersimpan dan bisa diperiksa kembali.':'Work through the project using a single persistent backend.'):id?'Seluruh informasi tetap berada dalam lingkungan Sandbox.':'All information remains inside the Sandbox environment.'}</p></div><div className="mp-heading-right"><button type="button" className="mp-main-action" onClick={()=>go('requests')}>{id?'Buka Proyek':'Open projects'} <span>→</span></button></div></div>
    {view==='dashboard'&&<><div className="mp-quick-jump"><span>✧</span><div><strong>{id?'Perjalanan kerja yang nyata':'A real connected journey'}</strong><small>{id?'Request → Proposal → Agreement → AI Review → PayPal Sandbox':'Request → Proposal → Agreement → AI Review → PayPal Sandbox'}</small></div><button type="button" onClick={()=>go('guide')}>{id?'Tutorial':'Guide'} ↗</button></div><LiveOverview actor={actor} lang={lang} onOpenLive={()=>go('requests')}/></>}
    {flowViews.has(view)&&<div className="mp-flow-page" data-workflow-route={view}><div className="mp-flow-guide"><span>✦</span><div><strong>{id?'Data terhubung · bukan simulasi angka':'Connected data · no fabricated amounts'}</strong><p>{id?'Pilih proyek tersimpan di panel pertama. Fitur selanjutnya mengikuti status proyek dan persona.':'Select a saved project in the first panel. Later steps depend on the project status and persona.'}</p></div></div><CommerceLab actor={actor} lang={lang}/></div>}
    {view==='analytics'&&<InvoiceAnalytics actor={actor} lang={lang}/>}
    {view==='guide'&&<div className="mp-premium-panel"><div className="mp-panel-head"><div><span className="mp-panel-eyebrow">ONBOARDING</span><h2>{id?'Panduan 6 langkah':'Six-step walkthrough'}</h2><p>{id?'Ikuti langkah berikut tanpa harus menebak tombol.':'Follow these steps without guessing where to click.'}</p></div></div><div className="mp-guide-grid">{steps[lang].map(([a,b],i)=><article className="mp-guide-step" key={a}><div className="mp-guide-number">{String(i+1).padStart(2,'0')}</div><h3>{a}</h3><p>{b}</p><button type="button" onClick={()=>go((['requests','proposals','agreements','milestones','payments','dashboard'] as View[])[i])}>{id?'Buka fitur':'Open feature'} →</button></article>)}</div></div>}
    {view==='settings'&&<div className="mp-premium-panel mp-settings"><span className="mp-panel-eyebrow">ACCOUNT & SAFETY</span><h2>{id?'Pengaturan ruang kerja':'Workspace settings'}</h2><p>{id?'Untuk ganti akun, kembali ke halaman Masuk dan pilih persona. Login ini hanya simulasi, belum autentikasi produksi.':'To change account, return to Login and select a persona. This is a demo gateway, not production authentication.'}</p><div className="mp-setting-row"><span>{id?'Persona aktif':'Active persona'}</span><strong>{name}</strong><button type="button" onClick={onSwitch}>{id?'Ke halaman masuk':'Go to login'}</button></div><div className="mp-setting-row"><span>{id?'Bahasa':'Language'}</span><select value={lang} onChange={e=>setLang(e.target.value as Lang)}><option value="id">Indonesia</option><option value="en">English</option></select></div><div className="mp-security-note">{id?'Keamanan: X-Demo-Actor hanyalah pemilih persona. Jangan menerapkan API ini ke internet tanpa autentikasi pengguna dan otorisasi yang sesungguhnya.':'Security: X-Demo-Actor is a demo selector. Never expose this API without real authentication and authorization.'}</div><button className="mp-main-action" onClick={onLogout}>{id?'Keluar dari demo':'Exit demo'} →</button></div>}
    <footer className="mp-premium-footer"><span>✦ &nbsp; MilestonePay AI · {id?'Kolaborasi lebih jelas':'Collaboration made clearer'}</span><span>{id?'Sandbox · Ollama Lokal · Data SQLite · Bukan escrow':'Sandbox · Local Ollama · SQLite · Not escrow'}</span></footer>
   </main></div></div>
}
