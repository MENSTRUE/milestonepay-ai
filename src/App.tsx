import { useState } from 'react'
import { MilestonePayWorkspace } from './Workspace'
import { Logo } from './ui'
import type { Actor } from './api/commerce'

type Lang = 'id' | 'en'
function readSession(): Actor | null {
  try { const v = sessionStorage.getItem('mp-demo-persona'); return v === 'jordan' || v === 'alex' ? v : null } catch { return null }
}
export default function App() {
  const [actor, setActor] = useState<Actor | null>(readSession)
  const [selected, setSelected] = useState<Actor>('jordan')
  const [view, setView] = useState<'landing' | 'login'>('landing')
  const [lang, setLang] = useState<Lang>(() => {try{return localStorage.getItem('mp-lang') === 'en' ? 'en' : 'id'} catch {return 'id'}})
  const login = () => {try {sessionStorage.setItem('mp-demo-persona', selected)} catch { /* session memory only */ } setActor(selected)}
  // A persona change always ends the current session and goes through the login card.
  // Never change an active actor directly from within the workspace.
  const returnToLogin = () => {
    try { sessionStorage.removeItem('mp-demo-persona') } catch {}
    setActor(null)
    setView('login')
    window.scrollTo(0, 0)
  }
  const logout = () => {
    try { sessionStorage.removeItem('mp-demo-persona') } catch {}
    setActor(null)
    setView('landing')
    window.scrollTo(0, 0)
  }
  if (actor) return <MilestonePayWorkspace key={actor} actor={actor} onSwitch={returnToLogin} onLogout={logout} />
  const id = lang === 'id'
  const changeLang = () => {const next=lang==='id'?'en':'id';setLang(next);try{localStorage.setItem('mp-lang',next)}catch{}}
  if (view === 'landing') return <div className="mp-public">
    <header className="mp-public-header">
      <button type="button" className="mp-public-brand" onClick={() => window.scrollTo({top:0,behavior:'smooth'})} aria-label="MilestonePay home"><Logo/></button>
      <nav className="mp-public-nav" aria-label="Main navigation">
        <a href="#features">{id?'Fitur':'Features'}</a><a href="#process">{id?'Cara Kerja':'How it works'}</a><a href="#trust">{id?'Keamanan':'Trust & Safety'}</a>
      </nav>
      <div className="mp-public-actions"><button type="button" className="mp-public-language" onClick={changeLang}>{id?'🇮🇩 ID':'🇬🇧 EN'}</button><button type="button" className="mp-public-signin" onClick={()=>setView('login')}>{id?'Masuk':'Sign in'}</button><button type="button" className="mp-public-cta small" onClick={()=>setView('login')}>{id?'Mulai Sekarang':'Get started'} <span>↗</span></button></div>
    </header>
    <main>
      <section className="mp-public-hero">
        <div className="mp-public-copy"><div className="mp-public-tag"><span/> {id?'KOLABORASI CERDAS, PEMBAYARAN TRANSPARAN':'SMART COLLABORATION, CLEAR PAYMENTS'}</div>
          <h1>{id?<>Kerja lebih terarah.<br/><em>Bayar lebih yakin.</em></>:<>Clearer milestones.<br/><em>Better collaboration.</em></>}</h1>
          <p>{id?'Dari penawaran hingga persetujuan hasil kerja, MilestonePay AI menghubungkan manajemen proyek, peninjauan bukti dengan AI, dan invoice PayPal dalam satu alur.':'From proposal to approval, MilestonePay AI brings project planning, AI-assisted evidence review, and PayPal invoicing into one transparent workflow.'}</p>
          <div className="mp-public-hero-buttons"><button type="button" className="mp-public-cta" onClick={()=>setView('login')}>{id?'Coba Workspace':'Explore the workspace'} <span>→</span></button><a className="mp-public-learn" href="#process">{id?'Lihat cara kerja':'See how it works'} ↓</a></div>
          <div className="mp-public-fineprint">✦ {id?'Prototipe hackathon · AI lokal · pembayaran virtual PayPal Sandbox':'Hackathon prototype · local AI · PayPal Sandbox virtual payments'}</div>
        </div>
        <div className="mp-public-preview" aria-label="Product preview"><div className="mp-public-preview-top"><span className="mp-public-mark">✧</span><div><strong>{id?'Ruang kerja proyek':'Project workspace'}</strong><small>Amanah Studio · MilestonePay AI</small></div><span className="mp-public-status">● SANDBOX</span></div>
          <div className="mp-public-preview-stat"><div><small>{id?'Nilai proyek contoh':'Sample project value'}</small><strong>$1,500</strong></div><div><small>{id?'Milestone':'Milestones'}</small><strong>3</strong></div><div><small>{id?'Peran':'Roles'}</small><strong>2</strong></div></div>
          <div className="mp-public-preview-flow"><div><span className="mp-public-step done">✓</span><div><strong>{id?'Permintaan & kesepakatan':'Request & agreement'}</strong><small>Ahmad ↔ Fulan</small></div><span className="mp-public-flow-state">{id?'Disetujui':'Approved'}</span></div><div><span className="mp-public-step done">✓</span><div><strong>{id?'Peninjauan evidence oleh AI':'AI-assisted evidence review'}</strong><small>Ollama · Human approval</small></div><span className="mp-public-flow-state">{id?'Direview':'Reviewed'}</span></div><div><span className="mp-public-step">$</span><div><strong>PayPal Sandbox</strong><small>{id?'Invoice virtual · verifikasi API':'Virtual invoice · API verification'}</small></div><span className="mp-public-flow-state">API</span></div></div>
          <div className="mp-public-preview-foot">{id?'Pratinjau ilustratif, bukan status transaksi pengguna.':'Illustrative preview; not the status of any user transaction.'}</div>
        </div>
      </section>
      <section className="mp-public-section" id="features"><div className="mp-public-section-head"><span>01 / {id?'FITUR UNGGULAN':'KEY FEATURES'}</span><h2>{id?'Semua tahapan, satu tempat.':'One place for every milestone.'}</h2></div><div className="mp-public-features"><article><span>✧</span><h3>{id?'Perencanaan berbantuan AI':'AI-assisted planning'}</h3><p>{id?'Rancang milestone dan tinjau bukti secara terstruktur. Keputusan akhir tetap pada manusia.':'Plan milestones and review text evidence, while human decisions remain in control.'}</p></article><article><span>▣</span><h3>{id?'Kolaborasi jelas':'Clear collaboration'}</h3><p>{id?'Request, proposal, agreement, revisi, dan persetujuan tercatat dalam workflow.':'Requests, proposals, agreements, revisions, and approvals in one workflow.'}</p></article><article><span>◇</span><h3>PayPal Sandbox</h3><p>{id?'Invoice API dan verifikasi status pembayaran simulasi menggunakan dana virtual.':'API-powered invoices and verified test-payment statuses with virtual funds.'}</p></article></div></section>
      <section className="mp-public-section mp-public-process" id="process"><div className="mp-public-section-head"><span>02 / {id?'CARA KERJA':'HOW IT WORKS'}</span><h2>{id?'Mulai dari kesepakatan, sampai invoice.':'From agreement to verified invoice.'}</h2></div><div className="mp-public-process-grid">{(id?['Ahmad membuat permintaan proyek','Fulan mengirim proposal dan milestones','Kedua pihak menyetujui agreement','Fulan mengirim evidence, AI membantu review','Ahmad memutuskan approval atau revisi','Invoice PayPal Sandbox dikirim dan diverifikasi']:['Ahmad creates the project request','Fulan submits a proposal and milestones','Both parties confirm the agreement','Fulan submits evidence for AI-assisted review','Ahmad approves or requests changes','PayPal Sandbox invoice is sent and verified']).map((step,i)=><div key={i}><span>{String(i+1).padStart(2,'0')}</span><p>{step}</p></div>)}</div></section>
      <section className="mp-public-trust" id="trust"><div><span>03 / {id?'TRANSPARANSI':'TRANSPARENCY'}</span><h2>{id?'Dibangun untuk diuji secara bertanggung jawab.':'Built for responsible testing.'}</h2><p>{id?'Persona Ahmad dan Fulan adalah akun demonstrasi, bukan autentikasi produksi. Semua pembayaran menggunakan dana virtual di PayPal Sandbox. MilestonePay bukan layanan escrow.':'Ahmad and Fulan are demo personas, not production authentication. All payments use virtual funds in PayPal Sandbox. MilestonePay is not an escrow service.'}</p></div><button type="button" className="mp-public-cta" onClick={()=>setView('login')}>{id?'Jelajahi MVP':'Explore MVP'} →</button></section>
    </main><footer className="mp-public-footer"><Logo/><span>© 2026 MilestonePay AI · {id?'MVP untuk pengujian':'Testing MVP'} · PayPal Sandbox</span></footer>
  </div>
  return <main className="mp-auth-page">
    <div className="mp-auth-ambient mp-auth-ambient-one"/><div className="mp-auth-ambient mp-auth-ambient-two"/>
    <header className="mp-auth-top"><div className="mp-auth-brand"><button type="button" onClick={()=>setView('landing')} className="mp-auth-back" aria-label="Back to homepage">←</button><Logo/><span>AMANAH STUDIO <b>·</b> MILESTONEPAY AI</span></div><button type="button" className="mp-lang-button" onClick={changeLang}>{id?'🇬🇧 English':'🇮🇩 Indonesia'}</button></header>
    <div className="mp-auth-layout">
      <section className="mp-auth-story"><div className="mp-auth-kicker">✦ &nbsp; HUMAN-FIRST AGENTIC COMMERCE</div><h1>{id ? <>Setiap pekerjaan,<br/><em>lebih jelas.</em><br/>Setiap pembayaran,<br/><em>lebih terpercaya.</em></> : <>Clear milestones.<br/><em>Stronger trust.</em><br/>Confident<br/><em>collaboration.</em></>}</h1><p>{id?'Kelola proyek, tinjau bukti dengan AI lokal, dan verifikasi pembayaran lewat PayPal Sandbox. Semua dalam satu ruang kerja.':'Manage projects, review evidence with local AI, and verify payments with PayPal Sandbox in one connected workspace.'}</p><div className="mp-auth-benefits"><span>✧ &nbsp; Ollama AI lokal</span><span>◈ &nbsp; PayPal Sandbox</span><span>◇ &nbsp; Human approval</span></div><div className="mp-auth-story-note">{id?'Lingkungan pengujian: tidak menggunakan uang asli.':'Testing environment: no real funds are used.'}</div></section>
      <section className="mp-login-card" aria-labelledby="login-title"><div className="mp-login-topline"><span className="mp-auth-pill">● SANDBOX ACCESS</span><button type="button" className="mp-auth-back-text" onClick={()=>setView('landing')}>{id?'← Kembali':'← Back'}</button></div><div className="mp-login-icon">✧</div><h2 id="login-title">{id?'Masuk ke workspace':'Enter your workspace'}</h2><p className="mp-login-subtitle">{id?'Pilih persona untuk mencoba alur nyata FastAPI dan PayPal Sandbox.':'Choose a test persona to use the connected FastAPI and PayPal Sandbox workflow.'}</p>
      <div className="mp-login-choice-label">{id?'PILIH PERAN':'CHOOSE YOUR ROLE'}</div>
      <div className="mp-login-options" role="group" aria-label={id?'Pilih persona':'Choose persona'}>
        <button type="button" aria-pressed={selected==='jordan'} className={`mp-login-option ${selected==='jordan'?'selected':''}`} onClick={()=>setSelected('jordan')}><span className="mp-login-avatar">A</span><span><strong>Ahmad</strong><small>{id?'Klien · Pemilik proyek':'Client · Project owner'}</small></span><span className="mp-radio-dot"/></button>
        <button type="button" aria-pressed={selected==='alex'} className={`mp-login-option ${selected==='alex'?'selected':''}`} onClick={()=>setSelected('alex')}><span className="mp-login-avatar other">F</span><span><strong>Fulan</strong><small>{id?'Freelancer · Pelaksana':'Freelancer · Creator'}</small></span><span className="mp-radio-dot"/></button>
      </div><button type="button" className="mp-login-submit" onClick={login}>{id?'Masuk ke ruang kerja':'Open workspace'} <span>→</span></button><div className="mp-login-disclaimer"><span>ⓘ</span><p>{id?'Ini akses persona untuk demo, BUKAN login yang terautentikasi. Jangan gunakan data pribadi/uang asli.':'This is a demo persona gateway, NOT authenticated login. Do not use personal information or real funds.'}</p></div></section>
    </div><footer className="mp-auth-footer">© 2026 MilestonePay AI <span>·</span> Prototype with PayPal Sandbox <span>·</span> No escrow claims</footer>
  </main>
}
