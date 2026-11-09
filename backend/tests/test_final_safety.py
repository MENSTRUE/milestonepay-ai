"""Safety and persistence regression checks for hackathon demo.

No network calls, no PayPal charges, no production authentication claims.
"""
from pathlib import Path
from tempfile import TemporaryDirectory
from unittest.mock import patch

from fastapi.testclient import TestClient
from app import main

J = {"X-Demo-Actor": "jordan"}
A = {"X-Demo-Actor": "alex"}
BODY = {"title": "Checkout Experience", "description": "Build a responsive checkout experience with tests", "budget_cents": 45000, "currency": "USD", "freelancer_id": "alex"}


def test_unauthorized_persona_and_draft_visibility():
    with TemporaryDirectory() as directory:
        with patch.object(main, "DB_PATH", Path(directory) / "demo.sqlite"):
            with TestClient(main.app) as client:
                assert client.get("/api/v1/requests").status_code == 400
                assert client.get("/api/v1/requests", headers={"X-Demo-Actor": "unknown"}).status_code == 400
                request = client.post("/api/v1/requests", headers=J, json=BODY)
                assert request.status_code == 201
                rid = request.json()["id"]
                assert client.get("/api/v1/requests", headers=A).json() == []
                assert client.post(f"/api/v1/requests/{rid}/send", headers=A).status_code == 403
                assert client.post(f"/api/v1/requests/{rid}/send", headers=J).status_code == 200
                assert len(client.get("/api/v1/requests", headers=A).json()) == 1


def test_invoice_create_requires_real_paypal_and_approved_milestone():
    with TemporaryDirectory() as directory:
        with patch.object(main, "DB_PATH", Path(directory) / "demo.sqlite"):
            with TestClient(main.app) as client:
                request = client.post("/api/v1/requests", headers=J, json=BODY)
                rid = request.json()["id"]
                # Even with a configured provider, a project without approved milestones
                # may not call PayPal to create an invoice.
                with patch("app.paypal.require_config") as config, patch("app.paypal.create_invoice") as create:
                    response = client.post(
                        "/api/v1/paypal/invoices", headers=A,
                        json={"request_id": rid, "milestone_id": "not-a-real-milestone", "payer_email": "buyer@example.test"}
                    )
                    assert response.status_code in (404, 409)
                    assert create.call_count == 0
                    assert config.call_count == 1


def test_no_live_paypal_base_url_in_code():
    from app import paypal
    assert paypal.BASE == "https://api-m.sandbox.paypal.com"
