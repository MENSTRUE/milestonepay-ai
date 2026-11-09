# MilestonePay AI — release evidence gate
# It never creates/sends/pays PayPal invoices, writes to database or reveals secrets.
param(
  [string]$ReportDir = (Join-Path $HOME 'MilestonePay-Audit-Reports'),
  [switch]$SkipBrowser,
  [switch]$SkipStatic
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$py = Join-Path $root 'backend\.venv\Scripts\python.exe'
if (-not (Test-Path $py)) { throw 'Missing virtualenv: backend\.venv\Scripts\python.exe' }
Push-Location $root
try {
  if (-not $SkipStatic) {
    Write-Host '[1/3] Full existing release audit...' -ForegroundColor Cyan
    & (Join-Path $root 'scripts\release_audit.ps1') -ReportDir $ReportDir
    if ($LASTEXITCODE -ne 0) { throw 'Existing release gate failed' }
  } else {
    Write-Warning 'Skipping source/build tests reduces coverage.'
  }
  Write-Host '[2/3] Read-only API integrity and Sandbox status snapshot...' -ForegroundColor Cyan
  & $py (Join-Path $root 'scripts\api_readonly_e2e.py') --output (Join-Path $ReportDir 'api')
  if ($LASTEXITCODE -ne 0) { throw 'Local API test failed; start FastAPI port 8000' }
  if ($SkipBrowser) {
    Write-Warning 'Browser E2E skipped on request; NOT evidence of browser readiness.'
  } else {
    Write-Host '[3/3] Chromium real browser smoke...' -ForegroundColor Cyan
    & $py (Join-Path $root 'scripts\browser_e2e.py') --output (Join-Path $ReportDir 'browser')
    if ($LASTEXITCODE -ne 0) { throw 'Browser E2E failed; inspect private screenshots/report' }
  }
  Write-Host 'ALL REQUESTED AUTOMATED CHECKS PASSED' -ForegroundColor Green
  Write-Host "Private reports: $ReportDir" -ForegroundColor Cyan
  Write-Warning 'Not proof of authentic login, fresh PayPal sync, real Ollama reasoning, user impact, video or Devpost submission.'
} finally { Pop-Location }
