"""Sandbox-only PayPal Invoicing v2 service. Never exposes credentials to React."""
from __future__ import annotations

import os
from decimal import Decimal
import httpx
from fastapi import HTTPException

BASE = "https://api-m.sandbox.paypal.com"


def configured() -> bool:
    return all(os.getenv(k) for k in ("PAYPAL_CLIENT_ID", "PAYPAL_CLIENT_SECRET", "PAYPAL_MERCHANT_EMAIL"))


def require_config() -> None:
    if not configured():
        raise HTTPException(503, "PayPal Sandbox not configured; set client ID, secret and merchant email")


def paypal_request(method: str, endpoint: str, token: str, **kwargs) -> httpx.Response:
    try:
        response = httpx.request(method, f"{BASE}{endpoint}", headers={
            "Authorization": f"Bearer {token}", "Content-Type": "application/json",
            **kwargs.pop("headers", {}),
        }, timeout=20, **kwargs)
    except httpx.RequestError as exc:
        raise HTTPException(502, "Unable to reach PayPal Sandbox") from exc
    if response.status_code >= 400:
        # Do not leak upstream request/credentials or untrusted error content.
        raise HTTPException(502, f"PayPal Sandbox returned HTTP {response.status_code}")
    return response


def access_token() -> str:
    require_config()
    try:
        r = httpx.post(f"{BASE}/v1/oauth2/token",
                       auth=(os.environ["PAYPAL_CLIENT_ID"], os.environ["PAYPAL_CLIENT_SECRET"]),
                       data={"grant_type": "client_credentials"}, timeout=20)
        r.raise_for_status()
        return r.json()["access_token"]
    except (httpx.HTTPError, KeyError, ValueError) as exc:
        raise HTTPException(502, "PayPal Sandbox OAuth failed") from exc


def create_invoice(*, title: str, amount_cents: int, payer_email: str, reference: str) -> dict:
    token = access_token()
    value = str((Decimal(amount_cents) / Decimal(100)).quantize(Decimal("0.01")))
    payload = {
        "detail": {"currency_code": "USD", "reference": reference,
                   "note": "MilestonePay AI demo invoice - PayPal Sandbox only"},
        "invoicer": {"email_address": os.environ["PAYPAL_MERCHANT_EMAIL"]},
        "primary_recipients": [{"billing_info": {"email_address": payer_email}}],
        "items": [{"name": title[:200], "quantity": "1", "unit_amount": {"currency_code": "USD", "value": value}}],
    }
    r = paypal_request("POST", "/v2/invoicing/invoices", token, json=payload,
                       headers={"PayPal-Request-Id": reference, "Prefer": "return=representation"})
    try:
        result = r.json()
        invoice_id = result["id"]
        if not isinstance(invoice_id, str) or not invoice_id:
            raise ValueError()
    except (KeyError, ValueError, TypeError) as exc:
        raise HTTPException(502, "PayPal invoice response missing ID") from exc
    return {"id": invoice_id, "status": result.get("status", "DRAFT")}


def send_invoice(paypal_id: str) -> None:
    token = access_token()
    paypal_request("POST", f"/v2/invoicing/invoices/{paypal_id}/send", token,
                   json={"send_to_invoicer": False, "send_to_recipient": True})


def get_invoice(paypal_id: str) -> dict:
    token = access_token()
    return paypal_request("GET", f"/v2/invoicing/invoices/{paypal_id}", token).json()
