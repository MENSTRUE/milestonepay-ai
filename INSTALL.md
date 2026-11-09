# MilestonePay AI — Live Overview + Bahasa Indonesia/English

## What this update does

- Replaces the **Overview** numbers from the old React-only demo with **actual SQLite API data**.
- Reads `/api/v1/requests`, `/api/v1/requests/{id}/milestones`, and `/api/v1/requests/{id}/invoices`.
- Only records invoices that are `PAID` in the local synchronized PayPal Sandbox history as paid.
- Adds a **Check PayPal / Periksa PayPal** action for individual invoice status verification.
- Adds an **ID/EN language toggle** in the header, bilingual Overview tutorial, navigation, and key Live AI + PayPal controls. The old legacy simulation sections may still contain English text.
- Does **not** overwrite the SQLite database, credentials, or existing paid invoices.

## Apply (Windows PowerShell)

1. Stop the frontend server. Leave backend/Ollama available for runtime verification.
2. From repository root `D:\porto\00.paypal hackathon`, extract `MilestonePay_Live_Dashboard_ID_EN.zip` with **Extract Here** (preserve `src` and `scripts` folders), or:

```powershell
$root = 'D:\porto\00.paypal hackathon'
Expand-Archive -LiteralPath "$HOME\Downloads\MilestonePay_Live_Dashboard_ID_EN.zip" -DestinationPath $root -Force
cd $root
.\backend\.venv\Scripts\python.exe scripts\apply_dashboard_update.py
```

3. Check:

```powershell
npx tsc --noEmit
npm run build
cd backend
.\.venv\Scripts\python.exe -m pytest -v
```

4. If all pass, start backend with `.env`, start frontend, and open **Overview**. Click **Periksa PayPal** for each invoice to verify fresh status. Previous PAID status should also display immediately from SQLite.

5. Commit only code files:

```powershell
cd 'D:\porto\00.paypal hackathon'
git add src/LiveOverview.tsx src/Workspace.tsx src/CommerceLab.tsx scripts/apply_dashboard_update.py
git diff --cached --check
git commit -m "feat(dashboard): show persistent sandbox payments and bilingual guide"
git push origin main
```

**Security:** `X-Demo-Actor` is an insecure persona selector for local demos; don't deploy as a public payment service. Sandbox money is virtual. `PAID` is never a claim of real income. For status fresh from PayPal, use the Check PayPal button.
