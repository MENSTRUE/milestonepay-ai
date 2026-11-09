"""Read-only Playwright smoke test of the latest MilestonePay website.

Requires the developer to have started Vite (5173) and FastAPI (8000).
Does NOT create requests, approve milestones, generate invoices or pay.
Screenshots can include non-secret account data: keep report directory private.
"""
from __future__ import annotations
import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path


def run(url: str, outdir: Path, headless: bool = True) -> int:
    try:
        from playwright.sync_api import sync_playwright
    except ImportError:
        print('[FAIL] Playwright is missing. Run: backend\\.venv\\Scripts\\python.exe -m pip install playwright')
        return 2
    outdir.mkdir(parents=True, exist_ok=True)
    checks = []

    def check(name, fn):
        try:
            fn()
            print(f'[PASS] {name}')
            checks.append({'name': name, 'status': 'PASS'})
        except Exception as exc:
            print(f'[FAIL] {name}: {type(exc).__name__}: {str(exc)[:240]}')
            checks.append({'name': name, 'status': 'FAIL', 'reason': str(exc)[:400]})
            raise

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=headless)
        context = browser.new_context(viewport={'width': 1440, 'height': 900}, locale='id-ID', reduced_motion='reduce')
        page = context.new_page()
        page.set_default_timeout(12000)
        try:
            def landing():
                page.goto(url, wait_until='domcontentloaded')
                page.locator('.mp-public-hero').wait_for()
                assert page.locator('.mp-login-card').count() == 0
                page.screenshot(path=str(outdir / '01-landing.png'), full_page=True)
            check('Fresh browser starts at public landing page', landing)

            def login_ahmad():
                page.locator('.mp-public-signin').click()
                page.locator('.mp-login-card').wait_for()
                page.locator('.mp-login-option').filter(has_text='Ahmad').click()
                page.locator('.mp-login-submit').click()
                page.locator('.mp-premium-shell').wait_for()
                assert page.locator('.mp-sidebar-profile').inner_text().find('Ahmad') >= 0
                assert page.evaluate("sessionStorage.getItem('mp-demo-persona')") == 'jordan'
                page.screenshot(path=str(outdir / '02-ahmad-dashboard.png'), full_page=True)
            check('Ahmad requires explicit login-card selection', login_ahmad)

            def account_switch():
                page.locator('.mp-profile-switch').click()
                page.locator('.mp-login-card').wait_for()
                assert page.locator('.mp-premium-shell').count() == 0
                assert page.evaluate("sessionStorage.getItem('mp-demo-persona')") is None
                page.screenshot(path=str(outdir / '03-switch-requires-login.png'), full_page=True)
            check('Switch account returns to login and clears persona', account_switch)

            def login_fulan():
                page.locator('.mp-login-option').filter(has_text='Fulan').click()
                page.locator('.mp-login-submit').click()
                page.locator('.mp-premium-shell').wait_for()
                assert 'Fulan' in page.locator('.mp-sidebar-profile').inner_text()
                assert page.evaluate("sessionStorage.getItem('mp-demo-persona')") == 'alex'
                page.screenshot(path=str(outdir / '04-fulan-dashboard.png'), full_page=True)
            check('Fulan requires explicit login-card selection', login_fulan)

            def language():
                page.locator('.mp-language-field select').select_option('en')
                assert page.locator('html').get_attribute('lang') == 'en'
                assert 'Overview' in page.locator('nav[aria-label="Workspace navigation"]').inner_text()
                page.locator('.mp-language-field select').select_option('id')
                assert page.locator('html').get_attribute('lang') == 'id'
            check('Bilingual workspace navigation', language)

            def analytics():
                page.locator('nav[aria-label="Workspace navigation"] button').filter(has_text='Analitik & Invoice').click()
                page.locator('input[placeholder]').first.wait_for(timeout=12000)
                assert page.locator('.mp-premium-shell').count() == 1
                page.screenshot(path=str(outdir / '05-invoice-analytics.png'), full_page=True)
            check('Backend-linked invoice analytics opens', analytics)

            def refresh():
                page.reload(wait_until='domcontentloaded')
                page.locator('.mp-premium-shell').wait_for()
                assert page.evaluate("sessionStorage.getItem('mp-demo-persona')") == 'alex'
            check('Reload preserves session persona (without bypassing initial login)', refresh)

            def logout():
                page.locator('nav[aria-label="Workspace navigation"] button').filter(has_text='Pengaturan').click()
                page.get_by_role('button', name='Keluar dari demo').click()
                page.locator('.mp-public-hero').wait_for()
                assert page.evaluate("sessionStorage.getItem('mp-demo-persona')") is None
                page.screenshot(path=str(outdir / '06-logout-landing.png'), full_page=True)
            check('Logout clears persona and returns to landing', logout)
        except Exception:
            pass
        finally:
            browser.close()

    report = {'generated_utc':datetime.now(timezone.utc).isoformat(), 'mode':'read-only browser smoke',
              'checks':checks,'passed':sum(x['status']=='PASS' for x in checks), 'failed':sum(x['status']=='FAIL' for x in checks),
              'disclaimer':'Not authentication verification, production security proof, or payment provider confirmation.'}
    (outdir / 'browser_e2e.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(f"Browser E2E: {report['passed']} PASS; {report['failed']} FAIL. Private evidence: {outdir}")
    return 0 if report['failed']==0 and report['passed']==8 else 1


if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--url', default='http://localhost:5173')
    parser.add_argument('--output', type=Path, default=Path.home()/'MilestonePay-Audit-Reports'/'browser')
    parser.add_argument('--headed', action='store_true')
    args=parser.parse_args()
    sys.exit(run(args.url, args.output, headless=not args.headed))

