<div align="center">

# MilestonePay AI

### Human-accountable AI for milestone-based freelance commerce

**A bilingual (English / Bahasa Indonesia) PayPal Sandbox + local AI MVP**

[English](#english) · [Bahasa Indonesia](#bahasa-indonesia) · [Architecture](docs/ARCHITECTURE.md) · [API reference](docs/API_REFERENCE.md) · [Security](docs/SECURITY.md) · [Release checklist](docs/RELEASE_READINESS.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE) ![React](https://img.shields.io/badge/Frontend-React%2019-64748b) ![Backend](https://img.shields.io/badge/Backend-FastAPI-64748b) ![Payments](https://img.shields.io/badge/Payments-PayPal%20Sandbox-2563eb) ![AI](https://img.shields.io/badge/AI-Ollama%20%2F%20Qwen2.5-64748b)

**[GitHub Repository](https://github.com/MENSTRUE/milestonepay-ai)** · **[Hackathon Rules](https://paypalaihackathon.devpost.com/rules)**

</div>

> [!IMPORTANT]
> **Development and judging demo only.** Ahmad and Fulan are locally selected test personas (`jordan` and `alex` in the API). `X-Demo-Actor` is **not authentication**. The PayPal integration is **Sandbox-only**: invoice totals and `PAID` status represent virtual test funds, not real earnings or escrow. Never deploy the existing demo backend publicly or use PayPal Live credentials.

---

<a id="english"></a>
## English

### 1. Overview

MilestonePay AI is an experimental collaborative workspace for clients and freelancers working under milestone-based contracts. It consolidates project requests, proposals and negotiation, mutual agreements, evidence submissions, AI-assisted evidence review, human approval, PayPal Sandbox invoicing and a tamper-evident off-chain audit trail. The dashboard reads persistent data from **FastAPI + SQLite** rather than inventing transactions in the frontend.

**Core design principle:** an AI recommendation must never silently approve a deliverable or mark an invoice paid. The client makes the acceptance decision; **PayPal is the authority for Sandbox payment status**.

### 2. Problem and intended audience

Scope ambiguity, subjective completion criteria and disconnected payment updates create friction in freelance projects. The intended audiences are individual clients, freelancers and evaluators exploring transparent milestone workflows. This is **not yet a validated commercial product**; user research, production authentication, fraud controls and payment compliance remain future work.

### 3. Capabilities and implementation status

| Capability | Current implementation | Important boundary |
|---|---|---|
| Public landing + sign-in card | Implemented | Persona selection only, not real user identity |
| Switch account | Requires returning to sign-in card | Does not establish server-side session security |
| Project request, send, proposal, revisions and negotiation | FastAPI/SQLite | Two fixed demo personas |
| Agreement and two-sided confirmation | FastAPI/SQLite | Not a legally reviewed digital-signature system |
| Milestone evidence + client approval/rejection | FastAPI/SQLite | Evidence currently text; no independent file attestation |
| AI milestone planning and evidence analysis | Local Ollama / Qwen2.5 | Advisory JSON output validated against schemas, with human review |
| Invoice create, send and sync | PayPal Invoicing v2 Sandbox | Virtual money; no escrow or real cash |
| Dashboard, invoice history, CSV analytics | Backend-backed frontend | Offline/stale status should not be interpreted as a live API check |
| Audit events | Off-chain SHA-256 hash chaining | Not blockchain anchoring, not immutable external storage |
| Interface localization | Indonesian and English on key screens | Some underlying API/error messages may remain English |
| AG Grid sponsor integration | Optional component under `sponsors/ag-grid` | **Not active** unless installed, wired and demonstrated |
| Bryntum / APIMatic / Render / Channel3 | Not shipped as proven integrations | Do not claim sponsor eligibility without real implementation |

### 4. Technology stack

- **Web:** React 19, TypeScript, Vite 8, CSS.
- **Service:** Python, FastAPI, Pydantic, SQLite.
- **AI:** Ollama running `qwen2.5:3b` on loopback. No paid LLM endpoint is required.
- **Payment:** PayPal REST OAuth and PayPal Invoicing v2 **Sandbox**. All secrets remain server-side.
- **Quality:** Pytest, TypeScript type checking, production Vite build, read-only local release audits.

### 5. Architecture and trust boundaries

```text
Browser (localhost:5173)
  ├─ Landing → sign-in card → Ahmad / Fulan test workspace
  ├─ Projects, AI, invoices, analytics, audit
  └─ HTTP JSON requests + X-Demo-Actor (DEMO ONLY)
                  │
                  ▼
FastAPI (127.0.0.1:8000)
  ├─ Workflow and deterministic business rules ── SQLite database
  ├─ AI service ── Ollama local (127.0.0.1:11434)
  ├─ Payment service ── PayPal Sandbox Invoicing REST API
  └─ Audit trail ── SHA-256 hash chain in SQLite
```

The frontend is **not** trusted for authentication or payment status. The current test header must be replaced with secure server-side identities and authorization before a public release. See [architecture](docs/ARCHITECTURE.md) and [security](docs/SECURITY.md).

### 6. Quick start (Windows PowerShell)

**Prerequisites:** Git, Node.js/npm compatible with Vite 8, Python with an existing compatible virtual environment (the verified local run used Python 3.11), and [Ollama](https://ollama.com/) for live AI. PayPal Sandbox credentials are needed only for invoice operations. Vite 8 requires a compatible recent Node.js runtime; check your installed Vite's engine requirements.

```powershell
# Clone or open the existing repository
git clone https://github.com/MENSTRUE/milestonepay-ai.git
cd milestonepay-ai

# Install frontend packages
npm install

# Create backend virtual environment and install server dependencies
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
# Edit backend/.env locally: do NOT commit real secrets.
cd ..

# Separate terminal: install / run local AI
ollama pull qwen2.5:3b
ollama serve

# Separate terminal: backend
cd backend
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000 --env-file .env

# Separate terminal: frontend (from repository root)
npm run dev
```

Open `http://localhost:5173`; API docs are served at `http://127.0.0.1:8000/docs`. If Ollama is already running, don't start a second server. Make sure your Python executable and virtualenv paths match your system. For PayPal, configure a **Sandbox Business** REST app and test payer; never share real secret values in issues, videos or screenshots.

### 7. User journey: client and freelancer

1. Visit the public landing page, then select **Sign in**. Select **Ahmad / Client** and enter the workspace.
2. Ahmad creates and sends a request with clear scope and budget.
3. Choose **Switch Account**: the current persona is cleared and the **sign-in card must appear**. Sign in as **Fulan / Freelancer**.
4. Fulan reviews the request, negotiates if needed, and submits a proposal with milestones, amounts, deadlines and acceptance criteria.
5. Ahmad accepts the proposal; both participants confirm the agreement.
6. Fulan submits textual completion evidence against a milestone. Ollama can return structured findings such as `Supported`, `Partially Supported` or `Not Demonstrated`.
7. **Ahmad reviews and decides** to approve or request changes; AI cannot approve automatically.
8. For an eligible approved milestone, the freelancer creates and sends a **PayPal Sandbox** invoice. Use the sandbox payer account for a virtual payment.
9. Sync the invoice via the PayPal API. The UI may display `PAID` **only if the provider-reported status and persisted record support it**.
10. Review the persisted invoice history, dashboard, CSV export and audit trail. Log out to return to the public landing page.

> The project's previously tested local database contained one Sandbox invoice for **USD 450.00** marked `PAID` after provider sync. This is an example of a completed **test transaction**, not a seeded value or a guarantee that every cloned checkout will contain it.

### 8. Configuration

Use `backend/.env.example` as the canonical reference. Supported development fields include:

```dotenv
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:3b
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MERCHANT_EMAIL=
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
```

Never commit `backend/.env`, tokens, database snapshots, email addresses of real users, or the local `.venv`. Do not set the payment base URL to a Live domain. SQLite is stored locally under `backend/` by default; the backend also supports an override via `MILESTONEPAY_DB`.

### 9. Tests and local release gate

```powershell
# From repo root; full automated suite and report
.\scripts\release_audit.ps1

# Or existing minimal gate
.\scripts\final_check.ps1

# Manual browser tests still required
# Follow docs/FINAL_QA_CHECKLIST.md
```

`release_audit.ps1` is **read-only with respect to live services**: it does not create invoices, send payments, modify the actual PayPal account or migrate the existing SQLite database. The pytest suite uses mocked dependencies and temporary test databases. It generates a local audit report and an actionable release checklist; a passing build **does not prove** the browser experience, real Ollama inference or end-to-end PayPal connectivity.

### 10. API and documentation

- [API_REFERENCE.md](docs/API_REFERENCE.md): documented request/proposal/agreement/milestone/AI/PayPal/audit endpoints.
- [ARCHITECTURE.md](docs/ARCHITECTURE.md): components, data flow, state and trust boundaries.
- [SECURITY.md](docs/SECURITY.md): threat model, safety claims and production blockers.
- [RELEASE_READINESS.md](docs/RELEASE_READINESS.md): evidence-based readiness rubric and prize-track gaps.
- [FINAL_QA_CHECKLIST.md](docs/FINAL_QA_CHECKLIST.md): manual browser path and anti-overclaim checklist.
- [DEVPOST_SUBMISSION_EN.md](docs/DEVPOST_SUBMISSION_EN.md): submission draft; replace all placeholders.
- [VIDEO_DEMO_SCRIPT_EN_FINAL.md](docs/VIDEO_DEMO_SCRIPT_EN_FINAL.md): video narration outline.
- [Sponsor status](docs/SPONSOR_TARGETS.md): current verified vs optional integrations.

### 11. Important limitations and roadmap

**Before production:** real identity and backend authorization, secure session management, true multi-tenancy, database migrations, upload/storage authorization, webhook and idempotent PayPal reconciliation, rate limiting, abuse/fraud controls, observability, privacy/data retention, tests in CI, a deployed sandbox experience accessible to judges, and domain-specific legal review where applicable. Do not present this project as a production-ready financial escrow system.

### 12. Hackathon submission

- The official deadline is **November 12, 2026 at 12:00 PM PST**, equivalent to **November 13, 2026 at 03:00 WIB**.
- The competition requires meaningful PayPal + AI, a functional demo (hosted or reproducible from the repo), a public licensed code repository and a **public YouTube demo under 3 minutes**.
- Five judging dimensions have **equal weight**: implementation, design, impact, innovation and presentation.
- No prize or finalist position is implied by this repository or its tests.

Official references: [Devpost rules](https://paypalaihackathon.devpost.com/rules) · [Hackathon page](https://paypalaihackathon.devpost.com/)

### 13. Contributing and license

Contributions should follow the existing architecture; open an issue describing expected and actual results, include redacted logs and regression tests, and never publish secrets. The source is released under the [MIT License](LICENSE). PayPal, Ollama and sponsor product names are trademarks of their respective owners; usage does not imply endorsement.

---

<a id="bahasa-indonesia"></a>
## Bahasa Indonesia

### 1. Ringkasan proyek

**MilestonePay AI** adalah MVP *agentic freelance commerce* yang menggabungkan permintaan proyek, proposal dan negosiasi, persetujuan dua pihak, pengiriman bukti milestone, tinjauan AI, keputusan manusia, invoice PayPal Sandbox, serta jejak audit. Sistem menggunakan **React + FastAPI + SQLite** untuk menyimpan dan menampilkan data yang persisten, bukan statistik transaksi buatan di frontend.

**Prinsip utamanya:** AI memberikan rekomendasi, tetapi tidak boleh langsung menyetujui pekerjaan atau menandai pembayaran lunas. **Klien memutuskan penerimaan hasil pekerjaan**, sedangkan **PayPal Sandbox menjadi sumber status pembayaran**.

### 2. Masalah dan sasaran pengguna

Pekerjaan freelance sering menghadapi ketidakjelasan ruang lingkup, kriteria selesai yang subjektif, dan status pembayaran yang tersebar. Aplikasi ini menyatukannya dalam alur milestone yang dapat dilacak. Pengguna sasaran: klien, freelancer dan penguji hackathon. Dampak pasar dan kebutuhan pengguna **belum divalidasi secara luas**.

### 3. Fitur utama dan batasannya

| Fitur | Implementasi saat ini | Batasan |
|---|---|---|
| Landing page dan login card | Tersedia | Memilih persona uji, **bukan autentikasi sungguhan** |
| Ganti akun | Wajib kembali ke login card | Header `X-Demo-Actor` belum aman untuk produksi |
| Permintaan proyek sampai negosiasi | FastAPI + SQLite | Dua persona tetap |
| Agreement dua pihak | Konfirmasi di backend | Bukan e-signature dengan kajian hukum |
| Evidence dan persetujuan milestone | Disimpan di backend | Fokus pada teks, belum pembuktian berkas mandiri |
| AI planner dan evidence review | Ollama + Qwen2.5 lokal | Rekomendasi saja; tetap memerlukan keputusan manusia |
| Pembuatan, pengiriman dan sinkronisasi invoice | PayPal Invoicing v2 Sandbox | Dana **virtual**, bukan escrow atau pendapatan nyata |
| Dashboard dan analitik CSV | Membaca database | Sinkronisasi PayPal tidak selalu real-time otomatis |
| Audit SHA-256 | Hash chain off-chain | **Bukan** blockchain publik |
| Bahasa Indonesia / English | Halaman utama dan tutorial | Sebagian pesan teknis dapat tetap Inggris |
| AG Grid dan sponsor lain | Sebagian hanya kode opsional | Tidak boleh diklaim aktif tanpa pengujian |

### 4. Teknologi

- **Frontend:** React 19, TypeScript, Vite 8.
- **Backend:** FastAPI, Pydantic, SQLite.
- **AI:** Ollama lokal menggunakan `qwen2.5:3b`.
- **Pembayaran:** API OAuth + Invoicing v2 PayPal **Sandbox**.
- **Pengujian:** Pytest, TypeScript, build Vite, dan audit otomatis PowerShell/Python.

### 5. Cara instalasi cepat di Windows

Jalankan dari PowerShell (pastikan Git, Node/npm, Python, dan Ollama telah tersedia):

```powershell
git clone https://github.com/MENSTRUE/milestonepay-ai.git
cd milestonepay-ai
npm install
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
# Isi kredensial PayPal SANDBOX hanya di backend/.env jika ingin menguji invoice.
cd ..
```

Jalankan **Ollama, FastAPI, dan Vite di tiga terminal terpisah**. Perintah lengkap ada pada bagian [English — Quick start](#6-quick-start-windows-powershell). Buka `http://localhost:5173`; dokumentasi FastAPI tersedia di `http://127.0.0.1:8000/docs`.

### 6. Alur aplikasi

1. Pengunjung membuka landing page, lalu menekan **Masuk**.
2. Pilih **Ahmad (Client)**, buat permintaan pekerjaan dan kirim ke Fulan.
3. Tekan **Ganti Akun**; aplikasi harus kembali ke **login card**. Pilih **Fulan (Freelancer)** dan masuk.
4. Fulan membuat proposal berisi ruang lingkup, harga, milestone dan kriteria penerimaan; kedua pihak dapat bernegosiasi.
5. Ahmad menerima proposal, lalu kedua pihak mengonfirmasi agreement.
6. Fulan mengirim bukti pekerjaan; AI menganalisis teks terhadap kriteria dan menampilkan keterbatasannya.
7. Ahmad **secara manual** menyetujui atau menolak milestone.
8. Invoice Sandbox dibuat dan dikirim untuk milestone yang memenuhi syarat; akun pembayar Sandbox menyelesaikan transaksi virtual.
9. Status dibaca ulang dari PayPal; invoice `PAID` muncul jika benar-benar terverifikasi oleh API.
10. Pantau dashboard, analitik, CSV, dan audit, lalu **Keluar** ke landing page.

### 7. Konfigurasi dan keamanan

Gunakan `backend/.env.example`, buat `backend/.env` secara lokal, lalu isi kredensial **Sandbox saja**. Jangan mengunggah `.env`, basis data lokal, token, atau kunci rahasia. Aplikasi ini hanya untuk pengujian lokal. Login card **tidak** melindungi endpoint backend; akses publik wajib menunggu implementasi autentikasi yang benar. Status `PAID` mengacu pada **uang virtual PayPal Sandbox**.

### 8. Pengujian satu perintah

```powershell
cd "D:\porto\00.paypal hackathon"
.\scripts\release_audit.ps1
```

Perintah ini menjalankan typecheck, build, tes Python, audit file berisiko, dan menghasilkan laporan kesiapan. Pemeriksaan browser dan transaksi Sandbox nyata tetap dilakukan secara manual sesuai [FINAL_QA_CHECKLIST.md](docs/FINAL_QA_CHECKLIST.md). **Lulus otomatis bukan berarti seluruh sistem siap produksi atau pasti menang.**

### 9. Dokumentasi lengkap

- [ARCHITECTURE.md](docs/ARCHITECTURE.md): struktur, alur data, dan batas kepercayaan.
- [API_REFERENCE.md](docs/API_REFERENCE.md): endpoint yang tersedia.
- [SECURITY.md](docs/SECURITY.md): ancaman, proteksi, dan pekerjaan keamanan tersisa.
- [RELEASE_READINESS.md](docs/RELEASE_READINESS.md): penilaian kesiapan dan kekurangan untuk kompetisi.
- [FINAL_QA_CHECKLIST.md](docs/FINAL_QA_CHECKLIST.md): pengujian manual.
- [DEVPOST_SUBMISSION_EN.md](docs/DEVPOST_SUBMISSION_EN.md): teks submission Inggris.
- [VIDEO_DEMO_SCRIPT_EN_FINAL.md](docs/VIDEO_DEMO_SCRIPT_EN_FINAL.md): skrip video.

### 10. Pengembangan lanjutan dan lisensi

Sebelum rilis publik, perlu autentikasi dan otorisasi, perlindungan berkas/evidence, webhook dan idempotensi pembayaran, multi-tenancy, deployment yang aman, observability, privasi, uji pengguna, dan kesiapan operasional. Jangan mengklaim platform sebagai escrow atau pemroses pembayaran uang nyata. Proyek menggunakan [lisensi MIT](LICENSE), dan tidak berafiliasi resmi dengan PayPal.

**Deadline submission:** Jumat, **13 November 2026 pukul 03.00 WIB**. Targetnya MVP yang berfungsi, video publik di YouTube berdurasi **kurang dari 3 menit**, repository publik berlisensi, serta instruksi yang memungkinkan juri menjalankan aplikasi.
