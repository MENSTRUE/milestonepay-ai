# MilestonePay AI — MVP update instructions (Windows)

## Apply over the existing repo, preserving the PAID Sandbox invoice

1. Stop Vite/FastAPI (Ctrl+C) and close editors that may lock source files.
2. Back up `backend/milestonepay.db` and `backend/.env` *privately* to a safe directory.
3. Extract `MilestonePay_MVP_FullCode_Overlay.zip` into `D:\porto\00.paypal hackathon` with overwrite.
4. Do NOT delete or replace the existing SQLite database or `.env`. The ZIP has no `.env` or database.
5. Test with `npx tsc --noEmit`, `npm run build`, then `cd backend; .\.venv\Scripts\python.exe -m pytest -v`.
6. Restart FastAPI and Vite; open http://localhost:5173.

### PowerShell commands

```powershell
$root = 'D:\porto\00.paypal hackathon'
New-Item -ItemType Directory -Force "$HOME\MilestonePay-PrivateBackup" | Out-Null
Copy-Item "$root\backend\milestonepay.db" "$HOME\MilestonePay-PrivateBackup\milestonepay.db" -ErrorAction SilentlyContinue
Copy-Item "$root\backend\.env" "$HOME\MilestonePay-PrivateBackup\backend.env" -ErrorAction SilentlyContinue
Expand-Archive -LiteralPath "$HOME\Downloads\MilestonePay_MVP_FullCode_Overlay.zip" -DestinationPath $root -Force
cd $root
npx tsc --noEmit
npm run build
cd backend
.\.venv\Scripts\python.exe -m pytest -v
```

Restart servers after passing checks:

```
# backend terminal
cd "D:\porto\00.paypal hackathon\backend"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000 --env-file .env

# frontend terminal
cd "D:\porto\00.paypal hackathon"
npm run dev
```

### What changed?

- The old simulated React workspace is replaced by an MVP shell whose main pages are **Dashboard, Projects & AI, Analytics & Invoices, Tutorial and About & Security**.
- The project request/proposal/evidence/approval/invoice workflow is still in the existing `CommerceLab.tsx`, but now presented as the primary functional experience.
- `LiveOverview.tsx` and `InvoiceAnalytics.tsx` read persisted records from SQLite via FastAPI.
- Existing **PAID Sandbox** invoices are not deleted; use **Refresh** / **Check PayPal** to inspect current data.
- Local personas still use `X-Demo-Actor` (not production authentication).
- English/Indonesian switch changes navigation, dashboard, guide and many workflow labels, not yet every backend error string.
- AG Grid source is optional under `sponsors/ag-grid` and requires separate `npm install` and an explicit UI switch. Do not claim that prize without enabling it.

### Git commit after local tests pass

```powershell
cd 'D:\porto\00.paypal hackathon'
git status --short
git add src/ backend/app/ backend/tests/ backend/.env.example README.md docs/ sponsors/ contracts/
git diff --cached --check
git diff --cached --name-only
git commit -m "feat(mvp): unify persistent workflow and bilingual sandbox analytics"
git push origin main
```

Confirm `backend/.env`, database, personal backups, build artifacts and credentials are **not staged** before committing. For safety, never publish this backend with demo-persona headers as authentication.
