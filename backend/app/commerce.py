"""Additional agentic, invoicing and integrity endpoints for MilestonePay demo."""
from __future__ import annotations

import hashlib
import json
import sqlite3
from datetime import datetime, timezone
from uuid import uuid4

from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from . import ai_service, paypal

router = APIRouter(prefix="/api/v1", tags=["AI, PayPal & Audit"])

# Injected from main.py at startup to reuse the same DB and permission rules.
backend = None


def setup(main_module):
    global backend
    backend = main_module


def db():
    return backend.db()


def actor(value):
    return backend.actor_id(value)


def request(conn, rid, who):
    row = backend.request_row(conn, rid)
    backend.member(row, who)
    return row


def audit(conn, rid: str, who: str, action: str, payload: dict):
    # Tamper-evident hash chain (NOT a blockchain transaction).
    prev = conn.execute("SELECT digest FROM audit_events WHERE request_id=? ORDER BY rowid DESC LIMIT 1", (rid,)).fetchone()
    previous = prev["digest"] if prev else "0" * 64
    record = {"request_id": rid, "actor": who, "action": action, "payload": payload,
              "created_at": datetime.now(timezone.utc).isoformat(), "previous_hash": previous}
    raw = json.dumps(record, sort_keys=True, separators=(",", ":"))
    digest = hashlib.sha256(raw.encode()).hexdigest()
    event_id = str(uuid4())
    conn.execute("INSERT INTO audit_events(id,request_id,actor,action,payload,created_at,previous_hash,digest) VALUES (?,?,?,?,?,?,?,?)",
                 (event_id, rid, who, action, json.dumps(payload, sort_keys=True), record["created_at"], previous, digest))
    return digest


class PlanInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    request_id: str


@router.post("/agent/plan")
def agent_plan(body: PlanInput, x_demo_actor: str | None = Header(default=None)):
    who = actor(x_demo_actor)
    with db() as conn:
        req = request(conn, body.request_id, who)
        description, budget = req["description"], req["budget_cents"]
    # Actual LLM provider call, no fake output when not configured.
    result = ai_service.plan(description, budget).model_dump()
    with db() as conn:
        request(conn, body.request_id, who)
        digest = audit(conn, body.request_id, who, "AI_PLAN_GENERATED", {"plan": result})
    return {"source": "ollama", "requires_human_approval": True, "tools_used": ["read_project_request", "generate_plan"],
            "plan": result, "audit_hash": digest}


class ReviewInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    request_id: str
    milestone_id: str


@router.post("/agent/review")
def agent_review(body: ReviewInput, x_demo_actor: str | None = Header(default=None)):
    who = actor(x_demo_actor)
    with db() as conn:
        req = request(conn, body.request_id, who)
        ms = backend.milestone_row(conn, body.request_id, body.milestone_id)
        backend.active_agreement(conn, body.request_id)
        if ms["status"] != "In review":
            raise HTTPException(409, "Evidence must be submitted before AI review")
        criteria, evidence = ms["acceptance_criteria"], ms["evidence"]
    report = ai_service.review(criteria, evidence).model_dump()
    with db() as conn:
        request(conn, body.request_id, who)
        digest = audit(conn, body.request_id, who, "AI_REVIEW_GENERATED", {"milestone_id": body.milestone_id, "report": report})
    return {"source": "ollama", "requires_human_approval": True,
            "tools_used": ["read_deliverable", "compare_acceptance_criteria"], "report": report, "audit_hash": digest}


class InvoiceInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    request_id: str
    milestone_id: str
    payer_email: str = Field(pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$", max_length=254)


@router.post("/paypal/invoices", status_code=201)
def invoice_create(body: InvoiceInput, x_demo_actor: str | None = Header(default=None)):
    who = actor(x_demo_actor)
    paypal.require_config()
    with db() as conn:
        req = request(conn, body.request_id, who)
        if who != req["freelancer_id"]:
            raise HTTPException(403, "Only freelancer may create invoice")
        backend.active_agreement(conn, body.request_id)
        ms = backend.milestone_row(conn, body.request_id, body.milestone_id)
        if ms["status"] != "Approved":
            raise HTTPException(409, "Client approval is required before invoicing")
        if conn.execute("SELECT 1 FROM paypal_invoices WHERE milestone_id=?", (body.milestone_id,)).fetchone():
            raise HTTPException(409, "Invoice already exists for milestone")
        title, amount = ms["title"], ms["amount_cents"]
        reference = f"MP-{body.milestone_id[:16]}"
    # External call may fail independently. Never save a fabricated invoice ID.
    upstream = paypal.create_invoice(title=title, amount_cents=amount, payer_email=body.payer_email, reference=reference)
    with db() as conn:
        request(conn, body.request_id, who)
        conn.execute("INSERT INTO paypal_invoices(id,request_id,milestone_id,amount_cents,payer_email,paypal_id,status,created_at) VALUES (?,?,?,?,?,?,?,?)",
                     (str(uuid4()), body.request_id, body.milestone_id, amount, body.payer_email, upstream["id"], upstream["status"], datetime.now(timezone.utc).isoformat()))
        audit(conn, body.request_id, who, "PAYPAL_INVOICE_CREATED", {"paypal_id": upstream["id"], "amount_cents": amount})
    return {"paypal_id": upstream["id"], "status": upstream["status"], "currency": "USD", "amount_cents": amount, "sandbox": True}


def invoice_row(conn, invoice_id: str, who: str):
    inv = conn.execute("SELECT * FROM paypal_invoices WHERE paypal_id=?", (invoice_id,)).fetchone()
    if inv is None:
        raise HTTPException(404, "Invoice not found")
    request(conn, inv["request_id"], who)
    return inv


@router.post("/paypal/invoices/{invoice_id}/send")
def invoice_send(invoice_id: str, x_demo_actor: str | None = Header(default=None)):
    who = actor(x_demo_actor)
    with db() as conn:
        inv = invoice_row(conn, invoice_id, who)
        req = request(conn, inv["request_id"], who)
        if who != req["freelancer_id"]:
            raise HTTPException(403, "Only freelancer may send invoice")
        if inv["status"] != "DRAFT":
            raise HTTPException(409, "Only draft invoice can be sent")
        rid = inv["request_id"]
    paypal.send_invoice(invoice_id)
    # PayPal response is authoritative; don't assume send means paid.
    verified = paypal.get_invoice(invoice_id)
    status = verified.get("status", "UNKNOWN")
    with db() as conn:
        invoice_row(conn, invoice_id, who)
        conn.execute("UPDATE paypal_invoices SET status=? WHERE paypal_id=?", (status, invoice_id))
        audit(conn, rid, who, "PAYPAL_INVOICE_SENT", {"paypal_id": invoice_id, "paypal_status": status})
    return {"paypal_id": invoice_id, "status": status, "sandbox": True}


@router.get("/paypal/invoices/{invoice_id}/sync")
def invoice_sync(invoice_id: str, x_demo_actor: str | None = Header(default=None)):
    who = actor(x_demo_actor)
    with db() as conn:
        inv = invoice_row(conn, invoice_id, who)
        rid, old_status = inv["request_id"], inv["status"]
    verified = paypal.get_invoice(invoice_id)
    status = verified.get("status", "UNKNOWN")
    with db() as conn:
        invoice_row(conn, invoice_id, who)
        conn.execute("UPDATE paypal_invoices SET status=? WHERE paypal_id=?", (status, invoice_id))
        if status != old_status:
            audit(conn, rid, who, "PAYPAL_STATUS_SYNC", {"paypal_id": invoice_id, "status": status})
    return {"paypal_id": invoice_id, "status": status, "paid": status == "PAID", "sandbox": True}


@router.get("/requests/{request_id}/audit")
def get_audit(request_id: str, x_demo_actor: str | None = Header(default=None)):
    who = actor(x_demo_actor)
    with db() as conn:
        request(conn, request_id, who)
        records = [dict(r) for r in conn.execute("SELECT * FROM audit_events WHERE request_id=? ORDER BY rowid", (request_id,))]
    previous = "0" * 64
    valid = True
    for row in records:
        canonical = {"request_id": row["request_id"], "actor": row["actor"], "action": row["action"],
                     "payload": json.loads(row["payload"]), "created_at": row["created_at"], "previous_hash": previous}
        digest = hashlib.sha256(json.dumps(canonical, sort_keys=True, separators=(",", ":")).encode()).hexdigest()
        if digest != row["digest"] or row["previous_hash"] != previous:
            valid = False
        previous = row["digest"]
    return {"verified_hash_chain": valid, "latest_hash": previous, "events": records,
            "blockchain_anchored": False,
            "note": "SHA-256 hash chain is off-chain unless explicitly anchored on an external chain"}


@router.get("/requests/{request_id}/invoices")
def list_project_invoices(request_id: str, x_demo_actor: str | None = Header(default=None)):
    """Read recorded Sandbox invoices without contacting PayPal or creating anything."""
    who = actor(x_demo_actor)
    with db() as conn:
        request(conn, request_id, who)
        rows = conn.execute(
            "SELECT paypal_id, milestone_id, amount_cents, payer_email, status "
            "FROM paypal_invoices WHERE request_id=? ORDER BY rowid DESC", (request_id,)
        ).fetchall()
    return [
        {
            "paypal_id": row["paypal_id"], "milestone_id": row["milestone_id"],
            "amount_cents": row["amount_cents"], "payer_email": row["payer_email"],
            "status": row["status"], "paid": row["status"] == "PAID", "sandbox": True,
        }
        for row in rows
    ]
