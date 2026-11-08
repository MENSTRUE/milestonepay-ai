# MilestonePay AI

**Local-AI assisted freelancer milestones with verified PayPal Sandbox invoicing.**

## What is real vs simulated?

| Component | Behavior |
| --- | --- |
| **Live AI + PayPal** | FastAPI + SQLite workflows, Ollama `qwen2.5:3b` inference, and PayPal **Sandbox** Invoicing v2 API. Real provider API responses, but **virtual money**. |
| **Classic Workspace** | Original Figma-inspired React walkthrough with **simulated** AI and payment states (session-only). |
| **Personas** | Ahmad (client) and Fulan (freelancer) are **fictional display names**. Internal API IDs remain `jordan` and `alex` to preserve existing data. |
| **Blockchain** | Tamper-evident off-chain SHA-256 audit chain. Solidity sample is optional, **not deployed**; no escrow or on-chain settlement. |

## Local development

Frontend:

```powershell
npm install
npm run dev
```

Backend (Python 3.11 recommended):

```powershell
cd backend
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000 --env-file .env
```

Run local Ollama with `qwen2.5:3b`, and configure `backend/.env` (do **not** commit secrets):

```dotenv
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen2.5:3b
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MERCHANT_EMAIL=
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
```

Use **only** PayPal **Sandbox Business** as the invoicer and **Sandbox Personal** as payer. No live credentials, cards, crypto, or real payments are required for the demonstration.

Tests:

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -v
```

```powershell
npx tsc --noEmit
npm run build
```

## Live journey

Ahmad creates/sends a request → Fulan submits a proposal → Ahmad accepts → each confirms the agreement → Fulan provides evidence → Ollama generates an **advisory** review → Ahmad decides → Fulan creates/sends a PayPal Sandbox invoice → Sandbox Personal account pays virtual funds → PayPal API reports `PAID` → invoice history and audit available on reload.

AI results **never** authorize payment or approval. The *human client* decides. Text evidence is not automatically proof of visual assets.

## Security and limitations

**Local development only.** `X-Demo-Actor` selects a demo persona; it is **not authentication**. This backend must not be publicly deployed to handle real money without a real identity system, authorization, CSRF/CORS hardening, replay protection, webhooks, and security review. Do not expose local Ollama to the internet.

The public README describes testable capabilities; it does not claim the demo is production-ready. For the hackathon, provide a concise video showing the **Sandbox** experience and clearly label all virtual funds.

MIT License; see `LICENSE`.
