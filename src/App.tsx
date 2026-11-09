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
  const [lang, setLang] = useState<Lang>(() => {try{return localStorage.getItem('mp-lang') === 'en' ? 'en' : 'id'} catch {return 'id'}})
  const login = () => {try {sessionStorage.setItem('mp-demo-persona', selected)} catch { /* session memory only */ } setActor(selected)}
  const logout = () => {try {sessionStorage.removeItem('mp-demo-persona')} catch {} setActor(null)}
  if (actor) return <MilestonePayWorkspace key={actor} actor={actor} onSwitch={a => {setSelected(a);try{sessionStorage.setItem('mp-demo-persona',a)}catch{}setActor(a)}} onLogout={logout} />
  const id = lang === 'id'
  return <main className="mp-auth-page">
    <div className="mp-auth-ambient mp-auth-ambient-one"/><div className="mp-auth-ambient mp-auth-ambient-two"/>
    <header className="mp-auth-top"><div className="mp-auth-brand"><Logo/><span>AMANAH STUDIO <b>·</b> MILESTONEPAY AI</span></div><button type="button" className="mp-lang-button" onClick={()=>{const next=lang==='id'?'en':'id';setLang(next);try{localStorage.setItem('mp-lang',next)}catch{}}}>{id?'🇬🇧 English':'🇮🇩 Indonesia'}</button></header>
    <div className="mp-auth-layout">
      <section className="mp-auth-story"><div className="mp-auth-kicker">✦ &nbsp; HUMAN-FIRST AGENTIC COMMERCE</div><h1>{id ? <>Setiap pekerjaan,<br/><em>lebih jelas.</em><br/>Setiap pembayaran,<br/><em>lebih terpercaya.</em></> : <>Clear milestones.<br/><em>Stronger trust.</em><br/>Confident<br/><em>collaboration.</em></>}</h1><p>{id?'Kelola proyek, tinjau bukti dengan AI lokal, dan verifikasi pembayaran lewat PayPal Sandbox. Semua dalam satu ruang kerja.':'Manage projects, review evidence with local AI, and verify payments with PayPal Sandbox in one connected workspace.'}</p><div className="mp-auth-benefits"><span>✧ &nbsp; Ollama AI lokal</span><span>◈ &nbsp; PayPal Sandbox</span><span>◇ &nbsp; Human approval</span></div><div className="mp-auth-story-note">{id?'Lingkungan pengujian: tidak menggunakan uang asli.':'Testing environment: no real funds are used.'}</div></section>
      <section className="mp-login-card" aria-labelledby="login-title"><div className="mp-login-topline"><span className="mp-auth-pill">● SANDBOX ACCESS</span><span className="mp-login-step">01 / 02</span></div><div className="mp-login-icon">✧</div><h2 id="login-title">{id?'Masuk ke workspace':'Enter your workspace'}</h2><p className="mp-login-subtitle">{id?'Pilih persona untuk mencoba alur nyata FastAPI dan PayPal Sandbox.':'Choose a test persona to use the connected FastAPI and PayPal Sandbox workflow.'}</p>
      <div className="mp-login-choice-label">{id?'PILIH PERAN':'CHOOSE YOUR ROLE'}</div>
      <div className="mp-login-options" role="group" aria-label={id?'Pilih persona':'Choose persona'}>
        <button type="button" aria-pressed={selected==='jordan'} className={`mp-login-option ${selected==='jordan'?'selected':''}`} onClick={()=>setSelected('jordan')}><span className="mp-login-avatar">A</span><span><strong>Ahmad</strong><small>{id?'Klien · Pemilik proyek':'Client · Project owner'}</small></span><span className="mp-radio-dot"/></button>
        <button type="button" aria-pressed={selected==='alex'} className={`mp-login-option ${selected==='alex'?'selected':''}`} onClick={()=>setSelected('alex')}><span className="mp-login-avatar other">F</span><span><strong>Fulan</strong><small>{id?'Freelancer · Pelaksana':'Freelancer · Creator'}</small></span><span className="mp-radio-dot"/></button>
      </div><button type="button" className="mp-login-submit" onClick={login}>{id?'Masuk ke ruang kerja':'Open workspace'} <span>→</span></button><div className="mp-login-disclaimer"><span>ⓘ</span><p>{id?'Ini akses persona untuk demo, BUKAN login yang terautentikasi. Jangan gunakan data pribadi/uang asli.':'This is a demo persona gateway, NOT authenticated login. Do not use personal information or real funds.'}</p></div></section>
    </div><footer className="mp-auth-footer">© 2026 MilestonePay AI <span>·</span> Prototype with PayPal Sandbox <span>·</span> No escrow claims</footer>
  </main>
}
