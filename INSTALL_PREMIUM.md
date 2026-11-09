# MilestonePay AI — Premium Workspace Restore

## Scope (5 full replacement files)

- `src/App.tsx` — premium persona gateway / login card. **Not real authentication.**
- `src/Workspace.tsx` — restored detailed sidebar: Overview, Requests, Proposals, Agreements, Milestones, AI, PayPal, Analytics, Audit, Tutorial, Settings.
- `src/CommerceLab.tsx` — keeps the existing FastAPI / Ollama / PayPal workflow and labels each step for focused navigation. Automatically opens the newest accessible saved project.
- `src/main.tsx` — imports the premium stylesheet.
- `src/mvp-premium.css` — complete style system with responsive mobile menu.

This update deliberately does **not** modify `backend/`, `src/api/commerce.ts`, `src/LiveOverview.tsx`, `src/InvoiceAnalytics.tsx`, `.env`, SQLite databases, or PayPal records.

## Installation on Windows PowerShell

1. Stop Vite (`Ctrl+C`). Backend and Ollama may stay running.
2. Download the overlay ZIP.
3. From PowerShell:

```powershell
$root = 'D:\porto\00.paypal hackathon'
$zip = "$HOME\Downloads\MilestonePay_Premium_Restore_Login.zip"
$backup = "$HOME\MilestonePay-premium-backup"
New-Item -ItemType Directory -Force $backup | Out-Null
Copy-Item "$root\src\App.tsx" "$backup\App.tsx" -Force
Copy-Item "$root\src\Workspace.tsx" "$backup\Workspace.tsx" -Force
Copy-Item "$root\src\CommerceLab.tsx" "$backup\CommerceLab.tsx" -Force
Copy-Item "$root\src\main.tsx" "$backup\main.tsx" -Force
Expand-Archive -LiteralPath $zip -DestinationPath $root -Force
cd $root
npx tsc --noEmit
npm run build
```

4. Launch Vite with `npm run dev`, then go to `http://localhost:5173`. The login card will let you enter as Ahmad or Fulan.
5. If you need to return to login, open **Settings** > **Exit demo**.
6. **Login is a demo persona chooser**, not identity verification. Never publish backend `X-Demo-Actor` as a secure public API.

## What is preserved

- Live PayPal Sandbox invoices and SQLite records (no changes to database)
- AI planning and evidence review with local Ollama
- Bilateral agreements, proposals, negotiation, milestone reviews
- Analytics/CSV and audit trail
- Language selection and quick guide

## Validation and commit

```powershell
cd 'D:\porto\00.paypal hackathon'
npx tsc --noEmit
npm run build
cd backend
.\.venv\Scripts\python.exe -m pytest -v
cd ..
git status --short
git diff --check
git add src/App.tsx src/Workspace.tsx src/CommerceLab.tsx src/main.tsx src/mvp-premium.css
git commit -m "feat(ui): restore premium workspace and add demo persona login"
git push origin main
```

Do not stage `.env`, `.db` or private credentials.

## Rollback

```powershell
$root = 'D:\porto\00.paypal hackathon'
$backup = "$HOME\MilestonePay-premium-backup"
Copy-Item "$backup\App.tsx" "$root\src\App.tsx" -Force
Copy-Item "$backup\Workspace.tsx" "$root\src\Workspace.tsx" -Force
Copy-Item "$backup\CommerceLab.tsx" "$root\src\CommerceLab.tsx" -Force
Copy-Item "$backup\main.tsx" "$root\src\main.tsx" -Force
Remove-Item "$root\src\mvp-premium.css" -ErrorAction SilentlyContinue
```

## Limitations

- Not a production login; building secure account registration, password/reset, permissions, and sessions requires backend design and migration.
- No proof of AG Grid or other sponsor integration is added by this UI update.
- All PayPal payments are *Sandbox virtual funds*, never cash income or escrow.
- Keep current backend running when testing; if offline the app shows connectivity errors, not fabricated results.
