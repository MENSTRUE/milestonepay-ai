"""MilestonePay bilingual dashboard update for current v0.3 repo.

Patches existing TSX by exact anchors and creates backups before touching files.
Run from repo root: backend/.venv/Scripts/python.exe scripts/apply_dashboard_update.py
"""
from pathlib import Path
from datetime import datetime
import os
import shutil
import sys

root = Path(__file__).resolve().parents[1]
ws = root / 'src' / 'Workspace.tsx'
co = root / 'src' / 'CommerceLab.tsx'
new = root / 'src' / 'LiveOverview.tsx'

if not all(p.is_file() for p in (ws, co, new)):
    raise SystemExit('[STOP] src/Workspace.tsx, src/CommerceLab.tsx, or src/LiveOverview.tsx missing. Extract ZIP into repository ROOT.')

workspace = ws.read_text('utf-8')
commerce = co.read_text('utf-8')

if 'import LiveOverview from "./LiveOverview"' in workspace:
    raise SystemExit('[STOP] This update is already installed. No files changed.')

def one(text, old, replacement, purpose):
    count = text.count(old)
    if count != 1:
        raise ValueError(f'{purpose}: expected one anchor, got {count}. No files updated.')
    return text.replace(old, replacement, 1)

# Workspace: make Overview a real backend dashboard (legacy demo remains on its other pages).
workspace = one(workspace,
    'import CommerceLab from "./CommerceLab"',
    'import CommerceLab from "./CommerceLab"\nimport LiveOverview from "./LiveOverview"', 'workspace import')
workspace = one(workspace,
    '  const [page, setPage] = useState<Page>("Overview")',
    '''  const [page, setPage] = useState<Page>("Overview")
  const [lang, setLang] = useState<"id" | "en">(() => {
    try { return window.localStorage.getItem("milestonepay-language") === "en" ? "en" : "id" }
    catch { return "id" }
  })
  const toggleLang = () => setLang(previous => {
    const next = previous === "id" ? "en" : "id"
    try { window.localStorage.setItem("milestonepay-language", next) } catch { /* optional */ }
    return next
  })''', 'language state')

# Translation of the main navigation only; internal Page values must remain English.
start = workspace.index('  const nav: {')
end = workspace.index('  const journey = [', start)
nav = workspace[start:end]
nav = nav.replace('label: "Overview"', 'label: lang === "id" ? "Beranda" : "Overview"')
nav = nav.replace('label: clientView ? "My Requests" : "Project Requests"', 'label: lang === "id" ? "Permintaan Proyek" : (clientView ? "My Requests" : "Project Requests")')
for old, translated in [
    ('Proposals','Proposal'), ('Projects','Proyek'), ('AI Workspace','Ruang AI'),
    ('Milestones','Milestone'), ('Approvals','Persetujuan'), ('Activity','Aktivitas'),
    ('Settings','Pengaturan')]:
    nav = nav.replace(f'label: "{old}"', f'label: lang === "id" ? "{translated}" : "{old}"')
nav = nav.replace('label: clientView ? "Payments" : "Invoices"', 'label: lang === "id" ? "Pembayaran" : (clientView ? "Payments" : "Invoices")')
nav = nav.replace('label: "Live AI + PayPal"', 'label: lang === "id" ? "AI + PayPal Langsung" : "Live AI + PayPal"')
workspace = workspace[:start] + nav + workspace[end:]

workspace = one(workspace,
    '          <div className="topbar-actions">',
    '''          <div className="topbar-actions">
            <button type="button" onClick={toggleLang} title="Change language / Ganti bahasa"
              aria-label={lang === "id" ? "Switch to English" : "Ganti ke Bahasa Indonesia"}
              style={{background:'#eaf0f9',color:'#24466c',border:'1px solid #c7d6e9',borderRadius:9,padding:'8px 12px',fontWeight:700,cursor:'pointer',whiteSpace:'nowrap'}}>
              {lang === "id" ? "🇮🇩 ID · EN" : "🇬🇧 EN · ID"}
            </button>''', 'language button')
workspace = one(workspace,
    '<span /> {page === "Live Commerce" ? "Sandbox API" : "Demo Mode"}',
    '<span /> {page === "Live Commerce" || page === "Overview" ? "Sandbox API" : (lang === "id" ? "Simulasi" : "Demo Mode")}', 'status badge')
workspace = one(workspace,
    '<span>Switch Demo Account</span>',
    '<span>{lang === "id" ? "Ganti Akun Demo" : "Switch Demo Account"}</span>', 'switch label')
workspace = one(workspace,
    '? `${s.role.toUpperCase()} OVERVIEW · SAMPLE WORKSPACE`',
    '? (lang === "id" ? "DASHBOARD DATA · SANDBOX" : "LIVE OVERVIEW · SANDBOX")', 'overview eyebrow')
workspace = one(workspace,
    '? `Good morning, ${user.name.split(" ")[0]}`',
    '? (lang === "id" ? `Selamat datang, ${user.name.split(" ")[0]}` : `Welcome, ${user.name.split(" ")[0]}`)', 'overview title')
workspace = one(workspace,
    '''? clientView
                    ? "Shape the scope, review the work, and keep your project moving."
                    : "Turn incoming opportunities into clear agreements and meaningful progress."''',
    '''? (lang === "id" ? "Ringkasan proyek dan pembayaran Sandbox dari database yang tersimpan." : "Persistent projects and Sandbox payments from your database.")''', 'overview description')
workspace = one(workspace,
    '''              {page === "Overview" && (
                <Button onClick={() => go(nextStep?.page ?? "Projects")}>
                  {nextStep?.label ?? "View project"}''',
    '''              {page === "Overview" && (
                <Button onClick={() => go("Live Commerce")}>
                  {lang === "id" ? "Buka Proyek Langsung" : "Open Live Workspace"}''', 'overview top action')
workspace = one(workspace,
    '{page !== "Live Commerce" && <section className="journey"',
    '{page !== "Live Commerce" && page !== "Overview" && <section className="journey"', 'legacy journey')

# Replace ONLY the old Overview JSX block. Keep all other pages unchanged.
old_start = '          {page === "Overview" && (\n            <>\n              <div className="stats-grid">'
old_end = '          {page === "Live Commerce" && <CommerceLab actor={s.account} />}'
a = workspace.index(old_start)
b = workspace.index(old_end, a)
workspace = workspace[:a] + '''          {page === "Overview" && <LiveOverview actor={s.account} lang={lang} onOpenLive={() => go("Live Commerce")} />}

          {page === "Live Commerce" && <CommerceLab actor={s.account} lang={lang} />}
''' + workspace[b + len(old_end):]
workspace = one(workspace,
    '{page === "Live Commerce" ? (\n                <>Sandbox API',
    '{page === "Live Commerce" || page === "Overview" ? (\n                <>Sandbox API', 'footer status')

# CommerceLab: bilingual live flow. All statuses/IDs/DB payloads remain unchanged.
commerce = one(commerce,
    'export default function CommerceLab({actor}:{actor:Actor}){',
    '''const uiID: Record<string,string> = {
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
  const t = (key:string) => lang === 'id' ? (uiID[key] ?? key) : key''', 'commerce localization')

# Preserve TSX attributes, only replace static UI content in specific matching slots.
labels = [
'1. Create & select project request','2. AI planning & freelancer proposal',
'3. Agreement & milestone review','4. Real PayPal Sandbox invoice',
'5. Audit proof & optional blockchain','Project title','Budget USD','Project brief',
'Proposal scope','Negotiation history','Message / clarification','Evidence (plain text)',
'Human decision note','Payer sandbox email']
for label in labels:
    # h3, label, or strong tags
    for prefix in ['<h3 style={title}>','<label style={label}>','<strong>']:
        commerce = commerce.replace(prefix + label, prefix + '{t("' + label + '")}')
buttons = ['Refresh','Create persistent draft','Reload list','Send to Alex','Generate AI milestone plan',
'Submit proposal','Revise proposal','Post negotiation','Accept proposal','Request revision',
'Submit evidence','Run AI evidence review','Approve milestone','Request changes',
'Create PayPal invoice','Send invoice','Verify status with PayPal','Refresh audit proof']
for label in buttons:
    # replace only Action visible label, avoiding JS string labels in doAction
    commerce = commerce.replace('>' + label + '</Action>', '>{t("' + label + '")}</Action>')
commerce = commerce.replace('>AI summary:</strong>', '>{t("AI summary:")}</strong>')
commerce = commerce.replace('>AI findings:</strong>', '>{t("AI findings:")}</strong>')
commerce = commerce.replace('<strong>PAID (verified)</strong>', '<strong>{t("PAID (verified)")}</strong>')
commerce = one(commerce,
    '<h2 style={{fontSize:27,fontWeight:800,margin:\'10px 0\'}}>Agentic AI × PayPal Sandbox</h2>',
    '<h2 style={{fontSize:27,fontWeight:800,margin:\'10px 0\'}}>{t("Agentic AI × PayPal Sandbox")}</h2>', 'commerce title')
commerce = one(commerce,
    '<div style={{fontSize:11,letterSpacing:2,textTransform:\'uppercase\',opacity:.8}}>Connected commerce workspace · Dev-only</div>',
    '<div style={{fontSize:11,letterSpacing:2,textTransform:\'uppercase\',opacity:.8}}>{t("Connected commerce workspace · Dev-only")}</div>', 'commerce eyebrow')
commerce = one(commerce,
    'Persona: <strong>{actor===\'alex\'?\'Fulan / Freelancer\':\'Ahmad / Client\'}</strong>',
    '{lang === "id" ? "Persona" : "Persona"}: <strong>{actor===\'alex\'?(lang === "id" ? \'Fulan / Pekerja Lepas\' : \'Fulan / Freelancer\'):(lang === "id" ? \'Ahmad / Klien\' : \'Ahmad / Client\')}</strong>', 'commerce persona')

# Ensure new code remains a clear SOURCE vs SIMULATION separation.
commerce = commerce.replace(
    'Persistent workflow backed by FastAPI. This is an isolated demo with identity selected by X-Demo-Actor—not production authentication. Only actual provider responses count as AI or PayPal integration.',
    '{lang === "id" ? "Proyek tersimpan di FastAPI + SQLite. AI menggunakan Ollama lokal dan pembayaran menggunakan uang virtual PayPal Sandbox. Ahmad/Fulan hanya persona demo, BUKAN autentikasi produksi." : "Persistent FastAPI + SQLite workflow. AI uses local Ollama and payment uses PayPal Sandbox virtual funds. Ahmad/Fulan are demo personas, NOT production authentication."}'
)

# Write only after all replacements have been validated. Backup outside repository.
backup_base = Path(os.environ.get('LOCALAPPDATA', str(Path.home()))) / 'MilestonePay-Backups' / ('dashboard-' + datetime.now().strftime('%Y%m%d-%H%M%S'))
backup_base.mkdir(parents=True, exist_ok=True)
for target, content in [(ws,workspace),(co,commerce)]:
    shutil.copy2(target, backup_base / target.name)
    target.write_text(content, encoding='utf-8')
    print('[UPDATED]', target.relative_to(root))
print('[ADDED] src/LiveOverview.tsx')
print('[BACKUP]', backup_base)
print('Run: npx tsc --noEmit ; npm run build ; cd backend ; .\\.venv\\Scripts\\python.exe -m pytest -v')
