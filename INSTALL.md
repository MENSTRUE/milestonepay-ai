# MilestonePay AI — Live Overview + Bahasa Indonesia / English

## Overview

This update connects the **Overview dashboard** to persistent backend data and introduces a bilingual **Bahasa Indonesia / English (ID/EN)** interface for key areas of MilestonePay AI.

The dashboard reads real records from the local **SQLite-backed API**, rather than relying on frontend-only React demonstration counters. Payment statuses refer to **PayPal Sandbox** (virtual transactions), **not real money**.

## What's included

- Replaces legacy React-only Overview numbers with records from the SQLite API.
- Reads these endpoints:
  - `GET /api/v1/requests`
  - `GET /api/v1/requests/{id}/milestones`
  - `GET /api/v1/requests/{id}/invoices`
- Counts invoices as paid only when their `PAID` status is present in the locally synchronized PayPal Sandbox history.
- Adds **Check PayPal / Periksa PayPal** to verify an individual invoice's latest status.
- Adds an **ID/EN toggle** in the header, plus bilingual Overview guidance, navigation, and key Live AI + PayPal controls.
- Preserves the existing SQLite database, credentials, and paid invoices; the update is not intended to overwrite them.

> **Translation scope:** Legacy simulation sections may still contain English text.

## Requirements

- Windows PowerShell
- Local MilestonePay AI repository at `D:\porto\00.paypal hackathon`
- Update archive: `MilestonePay_Live_Dashboard_ID_EN.zip` in the Downloads folder
- Existing frontend dependencies, backend virtual environment, and backend configuration
- PayPal Sandbox credentials configured for functionality that checks PayPal
- Ollama available if the AI functionality requires it

## Installation (Windows PowerShell)

**Before applying:** Stop the frontend development server. Keep the backend and Ollama available for runtime verification as needed. Back up or commit any uncommitted changes to files that might be overwritten by extraction.

From the repository root, extract the ZIP while preserving its `src` and `scripts` directories. Alternatively, execute:

```powershell
$root = 'D:\porto\00.paypal hackathon'
$zip = "$HOME\Downloads\MilestonePay_Live_Dashboard_ID_EN.zip"

if (-not (Test-Path -LiteralPath $zip)) {
    throw "Update ZIP not found: $zip"
}

Set-Location $root
Expand-Archive -LiteralPath $zip -DestinationPath $root -Force

& '.\backend\.venv\Scripts\python.exe' 'scripts\apply_dashboard_update.py'
if ($LASTEXITCODE -ne 0) {
    throw 'Dashboard update script failed.'
}
```

**Important:** `Expand-Archive -Force` can overwrite matching source files. The update should **not** overwrite `.env`, credentials, SQLite databases, or existing invoices. Check the archive's contents before extraction if you are unsure what it contains.

## Validation

Run the following from the repository root:

```powershell
Set-Location 'D:\porto\00.paypal hackathon'

npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { throw 'TypeScript validation failed.' }

npm run build
if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed.' }

& '.\backend\.venv\Scripts\python.exe' -m pytest -v backend\tests
if ($LASTEXITCODE -ne 0) { throw 'Backend tests failed.' }

Write-Host 'All automated checks passed.' -ForegroundColor Green
```

If your tests are located somewhere other than `backend/tests`, adjust that path for your repository. Passing automated checks does not replace manual PayPal Sandbox verification.

## Manual verification

1. Start the backend using its existing `.env` configuration, and start the frontend.
2. Open **Overview** and confirm its counters match the records returned by the backend.
3. Verify requests, milestones, and invoices load from the API.
4. Confirm previously synchronized **PAID** Sandbox invoices appear after a refresh or server restart.
5. Click **Check PayPal / Periksa PayPal** on individual invoices to request a fresh status check.
6. Switch **ID/EN** and verify the header, Overview tutorial, navigation, and key Live AI + PayPal controls.
7. Verify that existing backend AI/Ollama functionality still works.

### Acceptance criteria

| Area | Expected behavior |
| --- | --- |
| Overview | Displays API-backed totals, not hardcoded simulation counts |
| Persistence | Data remains after restarting the application |
| Milestones | Matches the selected request's stored milestones |
| Paid invoices | Only locally synchronized, verified `PAID` Sandbox records are shown as paid |
| Check PayPal | Retrieves or refreshes invoice status from PayPal Sandbox |
| ID/EN | Switches translated UI elements within the stated scope |
| AI/Ollama | Existing AI integration remains functional |

## Git commit and push

**Commit only the intended code files after validation.** Review the staged diff before committing.

```powershell
Set-Location 'D:\porto\00.paypal hackathon'

git status --short

git add src/LiveOverview.tsx src/Workspace.tsx src/CommerceLab.tsx scripts/apply_dashboard_update.py

git diff --cached --check
if ($LASTEXITCODE -ne 0) { throw 'Staged diff check failed.' }

git diff --cached --stat

git commit -m "feat(dashboard): show persistent sandbox payments and bilingual guide"
if ($LASTEXITCODE -ne 0) { throw 'Git commit failed.' }

git push origin main
if ($LASTEXITCODE -ne 0) { throw 'Git push failed.' }
```

Do **not** stage `.env`, secrets, API credentials, or SQLite database files.

## Security and payment limitations

- **`X-Demo-Actor` is an insecure persona selector** appropriate only for local demonstrations. It is not production authentication or authorization.
- **PayPal Sandbox uses virtual money.** A `PAID` Sandbox invoice is not real revenue.
- The application should never trust a frontend-submitted `PAID` flag as proof of payment.
- For a fresh status, use **Check PayPal / Periksa PayPal** and verify against the backend's PayPal Sandbox integration.
- Do not deploy this demo as a public payment service without production-grade authentication, authorization, server-side verification, secret management, and security review.

## Status

**Update instructions prepared; installation and runtime checks have not been independently verified in this document.**
