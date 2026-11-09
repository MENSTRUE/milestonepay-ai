# MilestonePay AI: full local release gate / audit rilis lokal
# No invoice creation, PayPal payment, database mutation or external hosting.
# Safe to re-run. Generated reports are kept outside the repository by default.
param(
    [string]$ReportDir = (Join-Path $HOME 'MilestonePay-Audit-Reports'),
    [switch]$SkipExistingAudit
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$py = Join-Path $root 'backend\.venv\Scripts\python.exe'
if (-not (Test-Path $py)) { throw 'Missing backend venv: backend\.venv\Scripts\python.exe' }

Push-Location $root
try {
    Write-Host '[1/5] TypeScript static typecheck...' -ForegroundColor Cyan
    & npx tsc --noEmit
    if ($LASTEXITCODE -ne 0) { throw 'TypeScript failed' }

    Write-Host '[2/5] Vite production build...' -ForegroundColor Cyan
    & npm run build
    if ($LASTEXITCODE -ne 0) { throw 'Frontend build failed' }

    Write-Host '[3/5] Pytest regression suite (mocked external services)...' -ForegroundColor Cyan
    Push-Location (Join-Path $root 'backend')
    try {
        & $py -m pytest -v
        if ($LASTEXITCODE -ne 0) { throw 'Pytest regression failed' }
    } finally { Pop-Location }

    Write-Host '[4/5] Existing local safety + service + SQLite audit...' -ForegroundColor Cyan
    if (-not $SkipExistingAudit) {
        & $py (Join-Path $root 'scripts\final_readiness.py')
        if ($LASTEXITCODE -ne 0) { throw 'final_readiness.py failed' }
    } else { Write-Host 'Skipped on request; this reduces coverage.' -ForegroundColor Yellow }

    Write-Host '[5/5] Documentation, security and release contract audit...' -ForegroundColor Cyan
    & $py (Join-Path $root 'scripts\release_source_audit.py') --output $ReportDir
    if ($LASTEXITCODE -ne 0) { throw 'release_source_audit.py failed' }

    Write-Host ''
    Write-Host 'ALL AUTOMATED LOCAL CHECKS PASSED' -ForegroundColor Green
    Write-Host "Report: $ReportDir\release_source_audit.md"
    Write-Host 'MANUAL STILL REQUIRED: browser test, Ollama inference, PayPal Sandbox sync, YouTube and Devpost.' -ForegroundColor Yellow
} finally { Pop-Location }
