/** MilestonePay MVP shell: one persistent backend workflow, no local fake checkout. */
import { useEffect, useState } from 'react'
import CommerceLab from './CommerceLab'
import LiveOverview from './LiveOverview'
import InvoiceAnalytics from './InvoiceAnalytics'
import type { Actor } from './api/commerce'
import { Logo } from './ui'

type Lang = 'id' | 'en'
type View = 'overview' | 'workflow' | 'analytics' | 'guide' | 'about'
const translations = {
  id: {
    overview:'Dashboard', workflow:'Proyek & AI', analytics:'Analitik & Invoice', guide:'Tutorial', about:'Tentang & Keamanan',
    client:'Ahmad · Klien', freelancer:'Fulan · Freelancer', role:'Mode pengujian', language:'Bahasa',
    subtitle:'Alur kerja freelancer dengan AI lokal dan PayPal Sandbox',
    heading:'Kerja jelas. Persetujuan manusia. Pembayaran terverifikasi.',
    status:'MVP • Sandbox', connected:'FastAPI · SQLite · Ollama · PayPal Sandbox',
    disclosure:'Mode pengujian: Ahmad dan Fulan adalah persona simulasi; pemilih persona bukan autentikasi. Semua pembayaran memakai dana virtual Sandbox. AI menyarankan, manusia memutuskan.',
    next:'Mulai dari Dashboard → Proyek & AI → Analitik & Invoice.',
    guideTitle:'Petunjuk penggunaan MVP',
    steps:[
      ['1. Ahmad membuat proyek','Pilih Ahmad, buka Proyek & AI, isi permintaan dan kirim ke Fulan.'],
      ['2. Fulan mengajukan proposal','Pilih Fulan; pilih request yang diterima, tentukan scope, anggaran, dan milestone.'],
      ['3. Persetujuan dua pihak','Ahmad menerima proposal; kedua pihak mengonfirmasi agreement.'],
      ['4. Evidence dan AI','Fulan mengunggah deskripsi bukti; Ollama memberi laporan, bukan verifikasi lampiran otomatis.'],
      ['5. Keputusan klien','Ahmad menyetujui pekerjaan atau meminta revisi. Hanya milestone Approved bisa ditagih.'],
      ['6. PayPal Sandbox','Fulan membuat invoice untuk email Personal Sandbox Ahmad, mengirimnya, lalu status diverifikasi dari PayPal.'],
      ['7. Cek pembayaran','Gunakan Dashboard atau Analitik & Invoice untuk membaca status invoice dari SQLite dan menyinkronkan ulang ke PayPal.'],
    ],
    aboutTitle:'Apa yang benar-benar berjalan?',
    aboutText:'Frontend React menggunakan API FastAPI. Data proyek dan invoice disimpan di SQLite. LLM Qwen2.5 dipanggil lewat Ollama lokal. OAuth dan Invoicing v2 menggunakan PayPal Sandbox dengan dana virtual. Riwayat audit SHA-256 disimpan off-chain; bukan escrow blockchain.',
    important:'Batas keamanan: X-Demo-Actor hanya memilih persona, bukan login. Jangan deploy API ini ke internet atau pakai kredensial Live sebelum membangun autentikasi dan kontrol akses produksi.',
    sponsor:'Integrasi sponsor: analitik CSV/penyaringan aktif; implementasi AG Grid tersedia sebagai modul opsional. APIMatic, Bryntum, Channel3, dan Render tidak diklaim terintegrasi tanpa setup/izin sesungguhnya.',
    switch:'Beralih persona',home:'Beranda',offline:'Akses semua alur melalui tab Proyek & AI.',
  },
  en: {
    overview:'Dashboard', workflow:'Projects & AI', analytics:'Analytics & Invoices', guide:'Tutorial', about:'About & Security',
    client:'Ahmad · Client', freelancer:'Fulan · Freelancer', role:'Test persona', language:'Language',
    subtitle:'Freelance workflow with local AI and PayPal Sandbox',
    heading:'Clear work. Human approval. Verified payment status.',
    status:'MVP • Sandbox', connected:'FastAPI · SQLite · Ollama · PayPal Sandbox',
    disclosure:'Testing only: Ahmad and Fulan are demo personas, not authenticated users. All payments use virtual Sandbox funds. AI advises; people decide.',
    next:'Start with Dashboard → Projects & AI → Analytics & Invoices.',
    guideTitle:'MVP walkthrough',
    steps:[
      ['1. Ahmad creates a project','Choose Ahmad, open Projects & AI, write a request and send it to Fulan.'],
      ['2. Fulan proposes','Choose Fulan, select the sent request, then define scope, budget and milestones.'],
      ['3. Bilateral agreement','Ahmad accepts the proposal; both parties confirm the agreement.'],
      ['4. Evidence & AI','Fulan submits evidence text. Ollama makes a recommendation, not a verified file inspection.'],
      ['5. Client decision','Ahmad approves or requests changes. Only approved milestones can be invoiced.'],
      ['6. PayPal Sandbox','Fulan creates an invoice to Ahmad’s Personal Sandbox address, sends it and verifies PayPal status.'],
      ['7. Payment tracking','Review invoices in Dashboard and Analytics; sync latest status directly with PayPal.'],
    ],
    aboutTitle:'What actually works?',
    aboutText:'React uses FastAPI, persistent SQLite project/invoice records, a local Ollama Qwen2.5 AI model, and actual PayPal Sandbox OAuth/Invoicing v2. SHA-256 audit records are off-chain; no blockchain escrow.',
    important:'Security limitation: X-Demo-Actor is a persona selector, not authentication. Do not expose the API publicly or use Live credentials without production-grade auth and authorization.',
    sponsor:'Sponsor features: searchable/exportable analytics are live; an optional AG Grid module is supplied. APIMatic, Bryntum, Channel3 and Render are not claimed as integrated before real setup and permission.',
    switch:'Switch persona',home:'Home',offline:'Use Projects & AI for the complete workflow.',
  }
} as const
const navKeys: View[] = ['overview','workflow','analytics','guide','about']
const tokens: Record<View,string> = {overview:'▦',workflow:'✧',analytics:'▤',guide:'?',about:'ⓘ'}
const focusStyle = {outlineOffset:3}
export function MilestonePayWorkspace({onHome}:{onHome:()=>void}) {
  const [lang,setLang] = useState<Lang>(()=>{try{return localStorage.getItem('mp-lang')==='en'?'en':'id'}catch{return 'id'}})
  const [actor,setActor] = useState<Actor>('jordan')
  const [view,setView] = useState<View>('overview')
  const t = translations[lang]
  useEffect(()=>{try{localStorage.setItem('mp-lang',lang)}catch{/* private mode */}},[lang])
  useEffect(()=>{document.documentElement.lang=lang;},[lang])
  const go=(v:View)=>{setView(v); window.scrollTo({top:0,behavior:'smooth'})}
  return <div className="mp-mvp">
    <aside className="mp-sidebar" aria-label="Main navigation">
      <button className="mp-logo" onClick={onHome} title={t.home}><Logo /></button>
      <div className="mp-brand"><span className="mp-mark">✧</span><div><strong>Amanah Studio</strong><small>MilestonePay AI · {t.status}</small></div></div>
      <div className="mp-navcaption">{lang==='id'?'MENU UTAMA':'MAIN MENU'}</div>
      <nav>{navKeys.map(key=><button style={focusStyle} key={key} className={view===key?'mp-nav mp-active':'mp-nav'} aria-current={view===key?'page':undefined} onClick={()=>go(key)}><span aria-hidden="true">{tokens[key]}</span>{t[key]}</button>)}</nav>
      <div className="mp-sidefoot"><strong>{t.role}</strong><div>{actor==='jordan'?t.client:t.freelancer}</div><small>{t.disclosure}</small></div>
    </aside>
    <div className="mp-body">
      <header className="mp-topbar"><div><span className="mp-title-mini">MilestonePay AI</span><span className="mp-dot">·</span><span>{t[view]}</span></div>
        <div className="mp-controls">
          <span className="mp-sandbox-label">{t.status}</span>
          <label className="mp-control-label">{t.language}<select aria-label={t.language} value={lang} onChange={e=>setLang(e.target.value as Lang)}><option value="id">🇮🇩 Indonesia</option><option value="en">🇬🇧 English</option></select></label>
          <label className="mp-control-label">{t.switch}<select aria-label={t.switch} value={actor} onChange={e=>setActor(e.target.value as Actor)}><option value="jordan">{t.client}</option><option value="alex">{t.freelancer}</option></select></label>
        </div>
      </header>
      <main className="mp-content">
        <div className="mp-heading"><div className="mp-eyebrow">{t.connected}</div><h1>{view==='overview'?t.heading:t[view]}</h1><p>{view==='overview'?t.subtitle:t.next}</p></div>
        {view==='overview'&&<LiveOverview key={actor} actor={actor} lang={lang} onOpenLive={()=>go('workflow')}/>}
        {view==='workflow'&&<CommerceLab key={actor} actor={actor} lang={lang}/>}
        {view==='analytics'&&<InvoiceAnalytics key={actor} actor={actor} lang={lang}/>}
        {view==='guide'&&<section className="mp-card"><h2>{t.guideTitle}</h2><div className="mp-steps">{t.steps.map(([head,desc])=><article key={head}><h3>{head}</h3><p>{desc}</p></article>)}</div><button className="mp-primary" onClick={()=>go('workflow')}>{t.workflow} →</button></section>}
        {view==='about'&&<section className="mp-card"><h2>{t.aboutTitle}</h2><p>{t.aboutText}</p><div className="mp-warning">{t.important}</div><p>{t.sponsor}</p><button className="mp-primary" onClick={()=>go('overview')}>{t.overview} →</button></section>}
        <footer className="mp-footer">{t.disclosure}</footer>
      </main>
    </div>
  </div>
}
