# MilestonePay AI — Agentic Freelance Commerce MVP

**PayPal AI Hackathon 2026 | Open-source demo | Local AI + real PayPal Sandbox API**

MilestonePay helps test personas Ahmad (client, internal id `jordan`) and Fulan (freelancer, internal id `alex`) coordinate scope, proposals, bilateral agreement, milestone evidence review and PayPal Sandbox invoicing. The new React MVP defaults to **one persistent backend workflow** and supports Indonesian/English. No simulated revenue is inserted into the dashboard.

> **Safety:** Local development prototype only. `X-Demo-Actor` is a **persona selector, NOT authentication**. Do not expose FastAPI publicly or connect PayPal Live credentials. All shown payments are **virtual Sandbox funds**, not cash income or escrow. AI recommendations require human review; evidence text is not the same as independently inspected files. Audit SHA-256 chaining is off-chain, not a blockchain transaction.

## What works

- React/Vite dashboard reading project/invoice history from FastAPI + SQLite.
- Project request → proposal/negotiation → agreement → milestone submission/review → client approval.
- Qwen2.5 via **Ollama local** for AI planning and evidence review (no paid API key).
- **PayPal Invoicing v2 Sandbox** via server-side OAuth: create/send/sync; status is PayPal-authoritative.
- Bilingual dashboard, tutorial, invoice analytics with search and CSV export.
- Tamper-evident off-chain audit hash chain, Solidity proof-of-concept contract optional.
- Optional AG Grid Community sponsor component in `sponsors/ag-grid` (not enabled until installation).

## Installation — Windows PowerShell

```powershell
cd "D:\porto\00.paypal hackathon"
npm install
cd backend
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
notepad .env
```

Set environment variables (do not commit `.env`):

```dotenv
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:3b
PAYPAL_CLIENT_ID=YOUR_SANDBOX_CLIENT_ID
PAYPAL_CLIENT_SECRET=YOUR_SANDBOX_SECRET
PAYPAL_MERCHANT_EMAIL=YOUR_BUSINESS_SANDBOX_EMAIL
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
```

Start Ollama separately (`ollama pull qwen2.5:3b` once). Then:

```powershell
# terminal 1, from backend folder
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000 --env-file .env

# terminal 2, from project root
npm run dev
```

Frontend http://localhost:5173 ; backend Swagger http://127.0.0.1:8000/docs . **The `.env` must be read by the backend process; restart after credential changes.**

## Testing

```powershell
cd "D:\porto\00.paypal hackathon"
npx tsc --noEmit
npm run build
cd backend
.\.venv\Scripts\python.exe -m pytest -v
```

Automated tests use mocks for external PayPal and AI providers. Actual end-to-end Sandbox success must be separately demonstrated. Never submit secrets in logs/screenshots.

## Prize categories and demo plan

See [sponsor readiness](docs/SPONSOR_TARGETS.md) and [English demo script](docs/DEMO_SCRIPT_EN.md). Do not claim use of AG Grid, APIMatic, Bryntum, Channel3 or Render unless actually installed and demonstrated. Details may change; verify the competition rules.

## License

MIT — see `LICENSE`.
