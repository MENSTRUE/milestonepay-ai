"""MilestonePay AI submission readiness audit — read-only and standard-library-only.

Run from repository root: python scripts/final_readiness.py
Never prints API keys, account emails, bearer tokens, or private evidence.
"""
from __future__ import annotations

import json
import os
import sqlite3
import subprocess
import sys
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
WARNINGS: list[str] = []
FAILURES: list[str] = []


def line(kind: str, msg: str) -> None:
    print(f"[{kind}] {msg}")
    if kind == "FAIL":
        FAILURES.append(msg)
    elif kind == "WARN":
        WARNINGS.append(msg)


def git_tracked() -> set[str] | None:
    try:
        result = subprocess.run(
            ["git", "ls-files", "-z"], cwd=ROOT, check=True, capture_output=True
        )
        return {p.decode("utf-8", errors="replace").replace("\\", "/")
                for p in result.stdout.split(b"\0") if p}
    except (OSError, subprocess.CalledProcessError):
        line("WARN", "Git not available; tracked-file secret check skipped")
        return None


def inspect_secrets() -> None:
    tracked = git_tracked()
    if tracked is None:
        line("WARN", "Cannot confirm whether secrets are tracked; run audit in Git checkout")
        return
    forbidden = [p for p in tracked if
                 p == ".env" or p.endswith("/.env") or
                 (p.endswith((".db", ".sqlite", ".sqlite3", ".pem", ".key")) and
                  not p.endswith(".example"))]
    if forbidden:
        line("FAIL", "Sensitive/config or database files tracked by Git: " + ", ".join(sorted(forbidden)))
    else:
        line("PASS", "No environment secrets or SQLite database files found in Git tracking")
    if not (ROOT / "backend" / ".env").exists():
        line("WARN", "backend/.env missing; live Ollama and Sandbox integrations may be unavailable")


def inspect_sources() -> None:
    expected = [
        "src/App.tsx", "src/Workspace.tsx", "src/CommerceLab.tsx",
        "backend/app/main.py", "backend/app/commerce.py", "backend/app/paypal.py",
        "backend/app/ai_service.py", "LICENSE", "README.md",
    ]
    missing = [p for p in expected if not (ROOT / p).is_file()]
    if missing:
        line("FAIL", "Required project files missing: " + ", ".join(missing))
    else:
        line("PASS", "Required frontend, backend, license and README files present")
    app = (ROOT / "src" / "App.tsx")
    if app.exists():
        text = app.read_text(encoding="utf-8")
        if "sessionStorage" not in text or "login" not in text.lower():
            line("WARN", "Login-gated demo persona flow needs manual inspection")
        else:
            line("PASS", "Session-scoped demo login code found (NOT production authentication)")


def inspect_db() -> None:
    db_path = ROOT / "backend" / "milestonepay.db"
    if not db_path.exists():
        line("WARN", "No local SQLite database at backend/milestonepay.db; cannot audit PAID invoice")
        return
    try:
        con = sqlite3.connect(f"file:{db_path.as_posix()}?mode=ro", uri=True, timeout=5)
        try:
            tables = {r[0] for r in con.execute("SELECT name FROM sqlite_master WHERE type='table'")}
            if "paypal_invoices" not in tables:
                line("WARN", "paypal_invoices table absent; invoice history not yet established")
                return
            rows = con.execute(
                "SELECT status, COUNT(*), COALESCE(SUM(amount_cents), 0) "
                "FROM paypal_invoices GROUP BY status"
            ).fetchall()
            print("[INFO] SQLite invoice history (local snapshot only; no PayPal API call):")
            for status, count, cents in sorted(rows):
                print(f"       {status}: {count} invoice(s); USD {cents / 100:,.2f}")
            paid_count = sum(r[1] for r in rows if r[0] == "PAID")
            if paid_count:
                line("PASS", f"SQLite has {paid_count} Sandbox PAID invoice(s) recorded")
            else:
                line("WARN", "No PAID invoice stored locally; use PayPal sync in UI if an invoice was paid")
        finally:
            con.close()
    except (sqlite3.Error, OSError) as exc:
        line("FAIL", f"SQLite cannot be read ({type(exc).__name__})")


def inspect_local_api() -> None:
    uri = "http://127.0.0.1:8000/api/v1/health"
    try:
        with urlopen(Request(uri, headers={"Accept": "application/json"}), timeout=4) as response:
            body = json.load(response)
            if response.status == 200 and body.get("status") == "ok":
                line("PASS", "FastAPI /health is running locally")
                line("INFO", f"AI configured: {bool(body.get('ai_connected'))}; PayPal configured: {bool(body.get('paypal_connected'))} (not proof of connectivity)")
            else:
                line("WARN", "FastAPI health response unexpected")
    except (HTTPError, URLError, TimeoutError, OSError, ValueError):
        line("WARN", "FastAPI is offline (start uvicorn before live demo)")
    try:
        with urlopen("http://127.0.0.1:11434/api/version", timeout=4) as response:
            data = json.load(response)
            line("PASS", "Ollama responds locally (version " + str(data.get("version", "unknown")) + ")")
    except (HTTPError, URLError, TimeoutError, OSError, ValueError):
        line("WARN", "Ollama not reachable at 127.0.0.1:11434")


def main() -> int:
    print("MilestonePay AI — local submission readiness check (read-only)\n")
    inspect_sources()
    inspect_secrets()
    inspect_db()
    inspect_local_api()
    print(f"\nSummary: {len(FAILURES)} failure(s), {len(WARNINGS)} warning(s).")
    if FAILURES:
        print("Fix failures before submission.")
        return 1
    print("Static checks passed; manual UI, real Ollama and PayPal Sandbox demos still required.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
