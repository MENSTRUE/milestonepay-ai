# MilestonePay AI — Proof-driven release / Rilis berbasis bukti

## English

### What this upgrade adds

- Real Chromium read-only browser journey tests for public landing, explicit persona login, re-login on account switch, Fulan session, Indonesian/English navigation, invoice analytics, refresh and logout.
- Read-only HTTP API verification for missing/invalid persona rejection, projects by persona, persisted Sandbox invoice labels, and SHA-256 audit chain validity.
- Local artifacts: JSON reports plus six UI screenshots. These files remain **outside Git** in `$HOME/MilestonePay-Audit-Reports` and may contain project/client data. Do not publish raw screenshots without inspection.
- One command combining existing build, regression, security, and new E2E gates.

### Preconditions

1. Start Ollama, FastAPI on `127.0.0.1:8000`, and Vite on `localhost:5173` (three terminals).
2. Install optional browser test dependencies **once** in the existing backend virtualenv:
   ```powershell
   cd 'D:\porto\00.paypal hackathon'
   .\backend\.venv\Scripts\python.exe -m pip install 'playwright>=1.45,<2'
   .\backend\.venv\Scripts\python.exe -m playwright install chromium
   ```
   Chromium download may take network bandwidth. Only run trusted packages. No application dependencies are changed.
3. Run `./scripts/evidence_gate.ps1` from PowerShell. PowerShell syntax: `.\scripts\evidence_gate.ps1`.

### Evidence classes

| Type | What can be verified | What remains unverified |
|---|---|---|
| TypeScript + Vite | Compile/build | Visual quality, browser UX |
| Pytest (mocked providers) | API business logic | Current upstream AI/PayPal responses |
| Browser Playwright | Actual navigation and screen rendering | Authentic identity, production permissions |
| Read-only API probe | Persistent project/invoice read; chain checksum | PayPal upstream freshness, financial settlement |
| Manual PayPal Sandbox checkout | Virtual test invoice `PAID` after sync | Real money/escrow |
| User feedback | Demonstrated need/usability | Real market traction without representative data |
| Video/Devpost | Judges can evaluate | Prize probability |

### Most important remaining proof

1. Show a controlled **real local Ollama inference** with nontrivial criteria and a *Not Demonstrated* finding. AI cannot approve payments by itself.
2. Show the **existing** PayPal Sandbox invoice status refreshed using the PayPal API, not a frontend switch. **Avoid creating a new invoice merely to capture evidence**.
3. Verify screenshots show the final visual version and no secret values, real contact information, tokens or personal payer addresses.
4. Record a public English demo under 3 minutes and submit the final Devpost form before the deadline.
5. Obtain at least 2–3 genuine usability observations and describe them honestly without manufacturing scores or testimonials. Optional if no time remains.

### Honest scoring

**The historical 55/100 was a subjective internal readiness rubric, not 55% chance of winning.** Passing an E2E test improves evidence/coverage. It does not mathematically change the probability of a win. Do not relabel readiness `85/100` unless screen flow, provider responses, video, judge setup and submission evidence are all completed. The scoring and prizes remain judges' decisions.

### Public-demo security

`X-Demo-Actor` is an easily forged persona header. This prototype cannot safely offer real multi-user access on the public internet. If judges need a runnable demo, use documented local Sandbox setup or a deliberately isolated test-only environment with no personal data or live credentials. Never publish your real `.env` file or database.

---

## Bahasa Indonesia

### Apa yang benar-benar ditambahkan?

- Tes browser Chromium untuk Landing → Login Card Ahmad → Ganti Akun wajib kembali ke Login Card → Fulan → Bahasa ID/EN → Analitik Invoice → refresh → logout.
- Pemeriksaan API hanya-baca untuk akses persona, proyek yang tersimpan, label pembayaran Sandbox, dan validitas rantai hash audit.
- Screenshot serta laporan JSON disimpan secara privat di folder pengguna, bukan repository publik.
- Satu perintah PowerShell menggabungkan pemeriksaan lama dengan tes E2E baru.

### Cara menjalankan

Pastikan Ollama, FastAPI (port 8000), dan Vite (port 5173) aktif. Instal Playwright dan Chromium sekali dengan command di bagian Inggris, lalu jalankan:

```powershell
cd 'D:\porto\00.paypal hackathon'
.\scripts\evidence_gate.ps1
```

Jika tidak ingin menginstal browser untuk sementara, gunakan `-SkipBrowser`, **tetapi jangan klaim tes browser sudah lulus**.

### Apa yang masih kurang supaya layak bersaing?

- Bukti AI lokal menilai evidence yang nyata (teks), bukan klaim tanpa tes.
- Bukti invoice yang sama disinkronkan dari PayPal Sandbox dan tetap `PAID`.
- Rekaman video final publik (kurang dari tiga menit), narasi Inggris, dan submission Devpost.
- Bukti masalah pengguna/feedback asli untuk memperkuat klaim dampak.
- Jika ingin production-grade, wajib mengganti persona demo dengan autentikasi server dan otorisasi yang aman.

**Peluang menang tidak bisa dihitung akurat dari hasil tes.** Tambahan E2E membuat proyek lebih dapat dipercaya; tidak mengubah peluang menang menjadi angka yang dapat dijamin.
