# MilestonePay AI final release gate — Windows PowerShell 5.1+
# Read-only data audit: does not create, send, or pay any PayPal invoice.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
$py = Join-Path $root 'backend\.venv\Scripts\python.exe'
if (-not (Test-Path $py)) { throw 'Python virtualenv missing: backend\.venv\Scripts\python.exe' }

Write-Host '[1/4] TypeScript check...' -ForegroundColor Cyan
& npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { throw 'TypeScript validation failed' }

Write-Host '[2/4] Production frontend build...' -ForegroundColor Cyan
& npm run build
if ($LASTEXITCODE -ne 0) { throw 'Vite build failed' }

Write-Host '[3/4] Backend regression tests...' -ForegroundColor Cyan
Push-Location (Join-Path $root 'backend')
try {
    & $py -m pytest -v
    if ($LASTEXITCODE -ne 0) { throw 'Pytest regression failed' }
} finally { Pop-Location }

Write-Host '[4/4] Secrets, database, local services audit...' -ForegroundColor Cyan
& $py (Join-Path $root 'scripts\final_readiness.py')
if ($LASTEXITCODE -ne 0) { throw 'Submission readiness audit failed' }

Write-Host 'ALL AUTOMATED LOCAL CHECKS PASSED' -ForegroundColor Green
Write-Host 'Now perform the manual browser journey in docs/FINAL_QA_CHECKLIST.md' -ForegroundColor Yellow
