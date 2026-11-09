"""Read-only source/documentation release-contract audit for MilestonePay AI.

No PayPal requests, no SQLite mutation, no printing of secret contents.
Writes a private JSON and Markdown report outside the repository by default.
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = [
    'README.md', 'LICENSE', 'package.json', 'src/App.tsx', 'src/Workspace.tsx',
    'src/CommerceLab.tsx', 'src/InvoiceAnalytics.tsx', 'src/api/commerce.ts',
    'backend/app/main.py', 'backend/app/commerce.py', 'backend/app/ai_service.py',
    'backend/app/paypal.py', 'backend/.env.example', 'backend/tests/test_api.py',
    'backend/tests/test_commerce.py', 'backend/tests/test_final_safety.py',
    'docs/ARCHITECTURE.md', 'docs/API_REFERENCE.md', 'docs/SECURITY.md',
    'docs/RELEASE_READINESS.md', 'docs/FINAL_QA_CHECKLIST.md',
    'docs/DEVPOST_SUBMISSION_EN.md', 'docs/VIDEO_DEMO_SCRIPT_EN_FINAL.md',
    'scripts/final_check.ps1', 'scripts/final_readiness.py',
]


def tracked_files() -> set[str] | None:
    try:
        p = subprocess.run(['git', 'ls-files', '-z'], cwd=ROOT,
                           capture_output=True, check=True)
        return {s.decode('utf-8', errors='replace').replace('\\', '/')
                for s in p.stdout.split(b'\0') if s}
    except (OSError, subprocess.CalledProcessError):
        return None


def source(path: str) -> str:
    p = ROOT / path
    return p.read_text(encoding='utf-8', errors='replace') if p.exists() else ''


def report(outdir: Path) -> int:
    checks: list[dict] = []

    def check(cid: str, ok: bool, why: str, severity: str = 'FAIL') -> None:
        checks.append({'id': cid, 'ok': ok, 'severity': severity, 'detail': why})
        print(f"[{'PASS' if ok else severity}] {cid}: {why}")

    missing = [p for p in REQUIRED if not (ROOT / p).is_file()]
    check('required_sources', not missing, 'All required source/docs present' if not missing
          else 'Missing: ' + ', '.join(missing))

    readme = source('README.md')
    check('bilingual_readme', '## English' in readme and '## Bahasa Indonesia' in readme,
          'README contains English + Bahasa Indonesia sections')
    check('license', 'MIT License' in source('LICENSE'), 'Open-source MIT license present')

    app = source('src/App.tsx')
    check('login_gate', all(x in app for x in ['returnToLogin', "setView('login')", "sessionStorage.removeItem('mp-demo-persona')"]),
          'Account switch clears client persona and opens sign-in page')
    check('demo_warning', 'X-Demo-Actor' in readme and ('not authentication' in readme.lower()),
          'README discloses demo persona header is not real authentication')

    payment = source('backend/app/paypal.py')
    check('sandbox_only', 'api-m.sandbox.paypal.com' in payment and
          not re.search(r'(?<!sandbox\.)api-m\.paypal\.com', payment),
          'Payment adapter uses Sandbox host and not Live base URL')
    check('payment_disclosure', 'virtual' in readme.lower() and 'escrow' in readme.lower(),
          'README accurately describes virtual payments and no escrow')

    frontend = source('src/api/commerce.ts')
    check('invoice_sync_client', 'invoiceSync' in frontend and 'invoices' in frontend,
          'Typed API client exposes invoice sync and history')
    commerce = source('backend/app/commerce.py')
    check('invoice_sync_backend', '/paypal/invoices/{invoice_id}/sync' in commerce and
          '/requests/{request_id}/invoices' in commerce,
          'Server exposes provider status sync and persistent invoice history')
    check('ai_human_gate', 'requires_human_approval' in commerce or
          'requires_human_approval' in source('backend/app/ai_service.py'),
          'AI API documents explicit human approval requirement')

    tracked = tracked_files()
    if tracked is None:
        check('git_check', False, 'Git unavailable: cannot verify tracked secrets', 'WARN')
    else:
        bad = [p for p in tracked if
               p in ('.env', 'backend/.env') or p.endswith('/.env') or
               p.endswith(('.db', '.sqlite', '.sqlite3', '.pem', '.p12', '.pfx'))]
        check('tracked_secrets', not bad, 'No tracked local secrets/databases' if not bad
              else 'Disallowed tracked paths: ' + ', '.join(bad))
        check('documentation_staged', all(p in tracked for p in
              ['README.md', 'docs/ARCHITECTURE.md', 'docs/SECURITY.md']),
              'Documentation has been committed to Git' if all(p in tracked for p in
              ['README.md', 'docs/ARCHITECTURE.md', 'docs/SECURITY.md'])
              else 'Docs not yet committed; expected on first run after ZIP extraction', 'WARN')

    check('public_video', False, 'Public YouTube video must be verified manually', 'MANUAL')
    check('manual_browser', False, 'Full real-browser two-persona journey must be verified manually', 'MANUAL')
    check('devpost_submit', False, 'Devpost submission must be confirmed manually', 'MANUAL')
    check('actual_paypal', False, 'Live Sandbox API sync must be verified manually; no payment requests executed', 'MANUAL')
    check('actual_ollama', False, 'Real-model prompt review must be inspected manually; no generation executed', 'MANUAL')

    # This is a contract/static audit, not an estimate of winning chances.
    status = 'FAIL' if any(not c['ok'] and c['severity'] == 'FAIL' for c in checks) else 'PASS'
    counts = {name: sum(1 for c in checks if not c['ok'] and c['severity'] == name)
              for name in ('FAIL', 'WARN', 'MANUAL')}
    results = {'project': 'MilestonePay AI', 'generated_utc': datetime.now(timezone.utc).isoformat(),
               'source_root': str(ROOT), 'static_audit': status,
               'unverified_items': counts, 'checks': checks,
               'disclaimer': 'Not production certification, PayPal verification, or win probability.'}
    outdir.mkdir(parents=True, exist_ok=True)
    (outdir / 'release_source_audit.json').write_text(
        json.dumps(results, indent=2, ensure_ascii=False), encoding='utf-8')
    md = ['# MilestonePay — Local Release Audit', '',
          f'Generated (UTC): {results["generated_utc"]}', '',
          f'**Static audit: {status}** — {counts["FAIL"]} failures, '
          f'{counts["WARN"]} warnings, {counts["MANUAL"]} manual evidence items.', '',
          'This is **not** a probability of winning or proof of real payments.', '',
          '| Status | Check | Detail |', '|---|---|---|']
    md += [f'| {"PASS" if c["ok"] else c["severity"]} | `{c["id"]}` | {c["detail"]} |'
           for c in checks]
    (outdir / 'release_source_audit.md').write_text('\n'.join(md) + '\n', encoding='utf-8')
    print(f'\nReports: {outdir}\nStatic audit: {status}. Manual checks are NOT automated.')
    return 1 if status == 'FAIL' else 0


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--output', type=Path,
                        default=Path.home() / 'MilestonePay-Audit-Reports')
    ns = parser.parse_args()
    sys.exit(report(ns.output))
