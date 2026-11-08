# MilestonePay AI v0.3 — apply-to-existing-repo overlay

This ZIP contains **only new/updated files**, not a replacement project. Existing React, CSS, API client (`src/api/client.ts`), tests and configuration remain intact.

## Before installing

```powershell
cd "D:\porto\00.paypal hackathon"
git status
Copy-Item "backend\app\main.py" "backend\app\main.py.bak"
Copy-Item "src\Workspace.tsx" "src\Workspace.tsx.bak"
```

Extract archive into `D:\porto\00.paypal hackathon` with overwrite enabled. Files must land directly under `backend/`, `src/`, `contracts/`, `docs/`; no extra nesting.

## Backend

```powershell
cd "D:\porto\00.paypal hackathon\backend"
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
Copy-Item .env.example .env
# Edit backend/.env; NEVER commit keys or email secrets.
.\.venv\Scripts\python.exe -m pytest -v
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000 --env-file .env
```

When you have no credentials, leave the environment variables blank. AI endpoints will return 503 instead of pretending an LLM ran; PayPal invoice endpoints will return 503 instead of inventing a sandbox ID. Normal workflows remain testable without either provider.

**PayPal prerequisites:** create a PayPal Developer Sandbox REST app, get client ID/secret, set up a sandbox Business merchant with Invoicing enabled, and use a sandbox payer email different from the merchant. Live PayPal is intentionally unavailable.

## Frontend (second terminal)

```powershell
cd "D:\porto\00.paypal hackathon"
npx tsc --noEmit
npm run build
npm run dev
```

Open `http://localhost:5173`. Switch Demo Account between Jordan and Alex; choose **Live AI + PayPal** in sidebar. On this page, all actions use FastAPI/SQLite, unlike the original local Figma demo workflow.

## End-to-end local workflow

1. Jordan creates request, sends it.
2. Alex selects it and creates proposal; optional AI plan needs API key.
3. Jordan selects request and accepts; Alex confirms agreement.
4. Alex submits deliverable evidence; Jordan approves. AI review needs API key but human retains decision.
5. Alex creates PayPal Sandbox invoice for an approved milestone and sends. Refresh status to confirm PayPal state. `UNPAID` is not `PAID`.
6. Check audit proof. Blockchain anchor is **optional** and must be performed separately using `contracts/MilestoneProof.sol`; no on-chain operation is implied by local audit hash.

## Security & known limitations

- **Local demo only.** `X-Demo-Actor` is trivially spoofed, **not login authentication**. Never deploy this backend as a public payment service or accept real funds with it.
- No file upload validation or persistent external media store; evidence is text only.
- Frontend's original Figma demo state and the new Live Commerce panel are separate. Other existing dashboard counters remain mock data.
- Sandbox invoicing credentials must be valid and merchant Invoicing enabled. Actual provider integration cannot be verified without your sandbox accounts.
- No webhook processor is included; invoice status is fetched directly from PayPal. Sync is manual via the UI.
- External service timeouts could create an orphan PayPal draft. Reconcile in Sandbox before retrying if a provider timeout occurs.
- No training from scratch, no autonomous disbursement, no escrow, and no production auth.

## Commit after tests

```powershell
git add backend/app/main.py backend/app/commerce.py backend/app/ai_service.py backend/app/paypal.py backend/requirements.txt backend/.env.example backend/tests/test_commerce.py src/Workspace.tsx src/CommerceLab.tsx src/api/commerce.ts contracts/MilestoneProof.sol docs/INSTALL_V03.md docs/BLOCKCHAIN.md

git commit -m "feat(mvp): add agentic AI PayPal sandbox and optional audit proof"
git push origin main
```

Do not include `backend/.env` or the `.db` file in Git.
