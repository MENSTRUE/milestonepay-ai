$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
Write-Host 'Checking React / TypeScript build...'
& npx tsc --noEmit
if ($LASTEXITCODE -ne 0) { throw 'tsc failed' }
& npm run build
if ($LASTEXITCODE -ne 0) { throw 'Vite build failed' }
Write-Host 'Running FastAPI tests...'
Set-Location (Join-Path $root 'backend')
& .\.venv\Scripts\python.exe -m pytest -v
if ($LASTEXITCODE -ne 0) { throw 'pytest failed' }
Write-Host 'All local checks passed.'
