"""MilestonePay AI MVP — local development API with persistent SQLite workflow.

Integrations are mounted from app.commerce: Ollama AI, PayPal Sandbox Invoicing,
and off-chain audit. X-Demo-Actor is persona selection, NOT authentication.
Do not deploy publicly or connect PayPal Live credentials.
"""
from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal
from uuid import uuid4

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field, model_validator

DB_PATH = Path(os.environ.get("MILESTONEPAY_DB", str(Path(__file__).resolve().parents[1] / "milestonepay.db")))
app = FastAPI(title="MilestonePay AI Demo API", version="0.3.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-Demo-Actor"],
)


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def fresh_id() -> str:
    return str(uuid4())


@contextmanager
def db():
    """Open one SQLite transaction per request, rolling back on failures."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys=ON")
    try:
        # Preserve the original requests table and existing rows.
        connection.execute("""CREATE TABLE IF NOT EXISTS requests (
            id TEXT PRIMARY KEY, client_id TEXT NOT NULL, freelancer_id TEXT NOT NULL,
            title TEXT NOT NULL, description TEXT NOT NULL, budget_cents INTEGER NOT NULL,
            currency TEXT NOT NULL, status TEXT NOT NULL
        )""")
        connection.execute("""CREATE TABLE IF NOT EXISTS proposals (
            id TEXT PRIMARY KEY, request_id TEXT NOT NULL UNIQUE REFERENCES requests(id),
            freelancer_id TEXT NOT NULL, scope TEXT NOT NULL, amount_cents INTEGER NOT NULL,
            currency TEXT NOT NULL, timeline TEXT NOT NULL, assumptions TEXT NOT NULL,
            revisions TEXT NOT NULL, status TEXT NOT NULL, version INTEGER NOT NULL,
            created_at TEXT NOT NULL, updated_at TEXT NOT NULL
        )""")
        connection.execute("""CREATE TABLE IF NOT EXISTS milestones (
            id TEXT PRIMARY KEY, proposal_id TEXT NOT NULL REFERENCES proposals(id),
            title TEXT NOT NULL, amount_cents INTEGER NOT NULL, acceptance_criteria TEXT NOT NULL,
            due_date TEXT NOT NULL, position INTEGER NOT NULL, status TEXT NOT NULL,
            evidence TEXT NOT NULL DEFAULT '', feedback TEXT NOT NULL DEFAULT ''
        )""")
        connection.execute("""CREATE TABLE IF NOT EXISTS negotiations (
            id TEXT PRIMARY KEY, request_id TEXT NOT NULL REFERENCES requests(id),
            author TEXT NOT NULL, message TEXT NOT NULL, proposed_amount_cents INTEGER,
            created_at TEXT NOT NULL
        )""")
        connection.execute("""CREATE TABLE IF NOT EXISTS agreements (
            id TEXT PRIMARY KEY, request_id TEXT NOT NULL UNIQUE REFERENCES requests(id),
            proposal_id TEXT NOT NULL REFERENCES proposals(id), version INTEGER NOT NULL,
            client_confirmed INTEGER NOT NULL DEFAULT 0,
            freelancer_confirmed INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        )""")
        connection.execute("""CREATE TABLE IF NOT EXISTS paypal_invoices (
            id TEXT PRIMARY KEY, request_id TEXT NOT NULL REFERENCES requests(id),
            milestone_id TEXT NOT NULL UNIQUE REFERENCES milestones(id),
            amount_cents INTEGER NOT NULL, payer_email TEXT NOT NULL,
            paypal_id TEXT NOT NULL UNIQUE, status TEXT NOT NULL, created_at TEXT NOT NULL
        )""")
        connection.execute("""CREATE TABLE IF NOT EXISTS audit_events (
            id TEXT PRIMARY KEY, request_id TEXT NOT NULL REFERENCES requests(id),
            actor TEXT NOT NULL, action TEXT NOT NULL, payload TEXT NOT NULL,
            created_at TEXT NOT NULL, previous_hash TEXT NOT NULL, digest TEXT NOT NULL
        )""")
        connection.commit()
        yield connection
        connection.commit()
    except Exception:
        connection.rollback()
        raise
    finally:
        connection.close()


class Strict(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)


class RequestCreate(Strict):
    title: str = Field(min_length=3, max_length=120)
    description: str = Field(min_length=10, max_length=5000)
    budget_cents: int = Field(ge=1, le=100_000_000)
    currency: Literal["USD"]
    freelancer_id: Literal["alex"]


class RequestOut(RequestCreate):
    id: str
    client_id: str
    status: str


class MilestoneInput(Strict):
    title: str = Field(min_length=3, max_length=120)
    amount_cents: int = Field(ge=1, le=100_000_000)
    acceptance_criteria: str = Field(min_length=10, max_length=2000)
    due_date: str = Field(pattern=r"^\d{4}-\d{2}-\d{2}$")


class ProposalCreate(Strict):
    scope: str = Field(min_length=10, max_length=5000)
    amount_cents: int = Field(ge=1, le=100_000_000)
    currency: Literal["USD"] = "USD"
    timeline: str = Field(min_length=3, max_length=200)
    assumptions: str = Field(min_length=3, max_length=2000)
    revisions: str = Field(min_length=3, max_length=2000)
    milestones: list[MilestoneInput] = Field(min_length=1, max_length=12)

    @model_validator(mode="after")
    def validate_milestone_totals(self):
        if sum(m.amount_cents for m in self.milestones) != self.amount_cents:
            raise ValueError("Milestone amounts must equal proposal amount exactly")
        for m in self.milestones:
            try:
                datetime.strptime(m.due_date, "%Y-%m-%d")
            except ValueError as exc:
                raise ValueError("Milestone due_date must be a real YYYY-MM-DD date") from exc
        return self


class MilestoneOut(MilestoneInput):
    proposal_id: str
    id: str
    position: int
    status: str
    evidence: str
    feedback: str


class ProposalOut(Strict):
    id: str
    request_id: str
    freelancer_id: str
    scope: str
    amount_cents: int
    currency: str
    timeline: str
    assumptions: str
    revisions: str
    status: str
    version: int
    milestones: list[MilestoneOut]
    created_at: str
    updated_at: str


class NegotiationCreate(Strict):
    message: str = Field(min_length=3, max_length=2000)
    proposed_amount_cents: int | None = Field(default=None, ge=1, le=100_000_000)


class NegotiationOut(NegotiationCreate):
    id: str
    request_id: str
    author: str
    created_at: str


class AgreementOut(Strict):
    id: str
    request_id: str
    proposal_id: str
    version: int
    client_confirmed: bool
    freelancer_confirmed: bool
    active: bool
    created_at: str


class EvidenceInput(Strict):
    evidence: str = Field(min_length=10, max_length=5000)


class ReviewInput(Strict):
    approve: bool
    feedback: str = Field(min_length=3, max_length=2000)


def actor_id(value: str | None) -> str:
    if value not in {"alex", "jordan"}:
        raise HTTPException(status_code=400, detail="Demo requires X-Demo-Actor: alex or jordan")
    return value


def request_row(conn: sqlite3.Connection, request_id: str) -> sqlite3.Row:
    row = conn.execute("SELECT * FROM requests WHERE id=?", (request_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Request not found")
    return row


def member(row: sqlite3.Row, actor: str):
    if actor not in (row["client_id"], row["freelancer_id"]):
        raise HTTPException(403, "Not a participant in this project")


def proposal_row(conn: sqlite3.Connection, request_id: str) -> sqlite3.Row:
    row = conn.execute("SELECT * FROM proposals WHERE request_id=?", (request_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Proposal not found")
    return row


def proposal_result(conn: sqlite3.Connection, row: sqlite3.Row) -> dict:
    milestones = conn.execute("SELECT * FROM milestones WHERE proposal_id=? ORDER BY position", (row["id"],)).fetchall()
    return {**dict(row), "milestones": [dict(m) for m in milestones]}


def agreement_result(row: sqlite3.Row) -> dict:
    record = dict(row)
    record["client_confirmed"] = bool(record["client_confirmed"])
    record["freelancer_confirmed"] = bool(record["freelancer_confirmed"])
    record["active"] = record["client_confirmed"] and record["freelancer_confirmed"]
    return record


def agreement_row(conn: sqlite3.Connection, request_id: str) -> sqlite3.Row:
    row = conn.execute("SELECT * FROM agreements WHERE request_id=?", (request_id,)).fetchone()
    if not row:
        raise HTTPException(404, "Agreement not found")
    return row


@app.get("/api/v1/health")
def health():
    from . import ai_service, paypal
    return {"status": "ok", "mode": "demo", "paypal_connected": paypal.configured(), "ai_connected": ai_service.available(),
            "notice": "Configured means credentials supplied, not that provider calls have succeeded"}


@app.post("/api/v1/requests", response_model=RequestOut, status_code=201)
def create_request(body: RequestCreate, x_demo_actor: str | None = Header(default=None)):
    actor = actor_id(x_demo_actor)
    if actor != "jordan":
        raise HTTPException(403, "Only demo client Jordan may create requests")
    record = {**body.model_dump(), "id": fresh_id(), "client_id": actor, "status": "Draft"}
    with db() as conn:
        conn.execute("""INSERT INTO requests(id,client_id,freelancer_id,title,description,budget_cents,currency,status)
                        VALUES (:id,:client_id,:freelancer_id,:title,:description,:budget_cents,:currency,:status)""", record)
    return record


@app.get("/api/v1/requests", response_model=list[RequestOut])
def list_requests(x_demo_actor: str | None = Header(default=None)):
    actor = actor_id(x_demo_actor)
    with db() as conn:
        rows = conn.execute("""SELECT * FROM requests WHERE (client_id=? OR freelancer_id=?)
                               AND (client_id=? OR status <> 'Draft') ORDER BY rowid DESC""", (actor, actor, actor)).fetchall()
        return [dict(r) for r in rows]


@app.post("/api/v1/requests/{request_id}/send", response_model=RequestOut)
def send_request(request_id: str, x_demo_actor: str | None = Header(default=None)):
    actor = actor_id(x_demo_actor)
    with db() as conn:
        row = request_row(conn, request_id)
        if actor != row["client_id"]:
            raise HTTPException(403, "Only request owner can send")
        if row["status"] != "Draft":
            raise HTTPException(409, "Only draft requests can be sent")
        conn.execute("UPDATE requests SET status='Sent' WHERE id=?", (request_id,))
        return {**dict(row), "status": "Sent"}


@app.post("/api/v1/requests/{request_id}/proposals", response_model=ProposalOut, status_code=201)
def create_proposal(request_id: str, body: ProposalCreate, x_demo_actor: str | None = Header(default=None)):
    actor = actor_id(x_demo_actor)
    with db() as conn:
        req = request_row(conn, request_id)
        if actor != req["freelancer_id"]:
            raise HTTPException(403, "Only the assigned freelancer may propose")
        if req["status"] not in ("Sent", "Under Review"):
            raise HTTPException(409, "Request is not ready for a proposal")
        if conn.execute("SELECT 1 FROM proposals WHERE request_id=?", (request_id,)).fetchone():
            raise HTTPException(409, "Proposal already exists; use revision endpoint")
        pid, stamp = fresh_id(), now()
        row = dict(id=pid, request_id=request_id, freelancer_id=actor,
                   scope=body.scope, amount_cents=body.amount_cents, currency=body.currency,
                   timeline=body.timeline, assumptions=body.assumptions,
                   revisions=body.revisions, status="Submitted", version=1,
                   created_at=stamp, updated_at=stamp)
        conn.execute("""INSERT INTO proposals(id,request_id,freelancer_id,scope,amount_cents,currency,timeline,assumptions,revisions,status,version,created_at,updated_at)
                        VALUES (:id,:request_id,:freelancer_id,:scope,:amount_cents,:currency,:timeline,:assumptions,:revisions,:status,:version,:created_at,:updated_at)""", row)
        for i, m in enumerate(body.milestones):
            conn.execute("""INSERT INTO milestones(id,proposal_id,title,amount_cents,acceptance_criteria,due_date,position,status,evidence,feedback)
                            VALUES (?,?,?,?,?,?,?,?,?,?)""", (fresh_id(), pid, m.title, m.amount_cents, m.acceptance_criteria, m.due_date, i+1, "Upcoming", "", ""))
        conn.execute("UPDATE requests SET status='Proposal Received' WHERE id=?", (request_id,))
        return proposal_result(conn, conn.execute("SELECT * FROM proposals WHERE id=?", (pid,)).fetchone())


@app.get("/api/v1/requests/{request_id}/proposals", response_model=ProposalOut)
def get_proposal(request_id: str, x_demo_actor: str | None = Header(default=None)):
    actor = actor_id(x_demo_actor)
    with db() as conn:
        req = request_row(conn, request_id)
        member(req, actor)
        if req["status"] == "Draft" and actor != req["client_id"]:
            raise HTTPException(404, "Request not found")
        return proposal_result(conn, proposal_row(conn, request_id))


@app.post("/api/v1/requests/{request_id}/proposals/revise", response_model=ProposalOut)
def revise_proposal(request_id: str, body: ProposalCreate, x_demo_actor: str | None = Header(default=None)):
    actor = actor_id(x_demo_actor)
    with db() as conn:
        req = request_row(conn, request_id)
        if actor != req["freelancer_id"]:
            raise HTTPException(403, "Only assigned freelancer can revise")
        prop = proposal_row(conn, request_id)
        if prop["status"] not in ("Submitted", "Revision Requested", "Declined"):
            raise HTTPException(409, "Proposal is no longer revisable")
        if conn.execute("SELECT 1 FROM agreements WHERE request_id=?", (request_id,)).fetchone():
            raise HTTPException(409, "Agreement has already been created")
        conn.execute("""UPDATE proposals SET scope=?,amount_cents=?,currency=?,timeline=?,assumptions=?,revisions=?,status='Submitted',version=version+1,updated_at=? WHERE id=?""",
                     (body.scope, body.amount_cents, body.currency, body.timeline, body.assumptions, body.revisions, now(), prop["id"]))
        conn.execute("DELETE FROM milestones WHERE proposal_id=?", (prop["id"],))
        for i, m in enumerate(body.milestones):
            conn.execute("""INSERT INTO milestones(id,proposal_id,title,amount_cents,acceptance_criteria,due_date,position,status,evidence,feedback) VALUES (?,?,?,?,?,?,?,?,?,?)""",
                         (fresh_id(), prop["id"], m.title, m.amount_cents, m.acceptance_criteria, m.due_date, i+1, "Upcoming", "", ""))
        conn.execute("UPDATE requests SET status='Proposal Received' WHERE id=?", (request_id,))
        return proposal_result(conn, conn.execute("SELECT * FROM proposals WHERE id=?", (prop["id"],)).fetchone())


@app.post("/api/v1/requests/{request_id}/negotiations", response_model=NegotiationOut, status_code=201)
def create_negotiation(request_id: str, body: NegotiationCreate, x_demo_actor: str | None = Header(default=None)):
    actor = actor_id(x_demo_actor)
    with db() as conn:
        req = request_row(conn, request_id)
        member(req, actor)
        if req["status"] in ("Draft", "Accepted", "Rejected"):
            raise HTTPException(409, "Request is not negotiable")
        record = dict(id=fresh_id(), request_id=request_id, author=actor,
                      message=body.message, proposed_amount_cents=body.proposed_amount_cents, created_at=now())
        conn.execute("""INSERT INTO negotiations(id,request_id,author,message,proposed_amount_cents,created_at)
                        VALUES (:id,:request_id,:author,:message,:proposed_amount_cents,:created_at)""", record)
        return record


@app.get("/api/v1/requests/{request_id}/negotiations", response_model=list[NegotiationOut])
def list_negotiations(request_id: str, x_demo_actor: str | None = Header(default=None)):
    actor = actor_id(x_demo_actor)
    with db() as conn:
        req = request_row(conn, request_id)
        member(req, actor)
        if req["status"] == "Draft" and actor != req["client_id"]:
            raise HTTPException(404, "Request not found")
        return [dict(r) for r in conn.execute("SELECT * FROM negotiations WHERE request_id=? ORDER BY rowid", (request_id,)).fetchall()]


@app.post("/api/v1/requests/{request_id}/proposals/request-revision", response_model=ProposalOut)
def request_revision(request_id: str, x_demo_actor: str | None = Header(default=None)):
    actor = actor_id(x_demo_actor)
    with db() as conn:
        req = request_row(conn, request_id)
        if actor != req["client_id"]:
            raise HTTPException(403, "Only client may request revision")
        prop = proposal_row(conn, request_id)
        if prop["status"] != "Submitted":
            raise HTTPException(409, "Only submitted proposals can be revised")
        conn.execute("UPDATE proposals SET status='Revision Requested',updated_at=? WHERE id=?", (now(), prop["id"]))
        return proposal_result(conn, conn.execute("SELECT * FROM proposals WHERE id=?", (prop["id"],)).fetchone())


@app.post("/api/v1/requests/{request_id}/proposals/accept", response_model=AgreementOut, status_code=201)
def accept_proposal(request_id: str, x_demo_actor: str | None = Header(default=None)):
    actor = actor_id(x_demo_actor)
    with db() as conn:
        req = request_row(conn, request_id)
        if actor != req["client_id"]:
            raise HTTPException(403, "Only client may accept proposal")
        prop = proposal_row(conn, request_id)
        if prop["status"] != "Submitted" or req["status"] != "Proposal Received":
            raise HTTPException(409, "Proposal must be submitted and awaiting acceptance")
        aid = fresh_id()
        row = dict(id=aid, request_id=request_id, proposal_id=prop["id"],
                   version=prop["version"], client_confirmed=1, freelancer_confirmed=0, created_at=now())
        conn.execute("""INSERT INTO agreements(id,request_id,proposal_id,version,client_confirmed,freelancer_confirmed,created_at)
                        VALUES (:id,:request_id,:proposal_id,:version,:client_confirmed,:freelancer_confirmed,:created_at)""", row)
        conn.execute("UPDATE proposals SET status='Accepted',updated_at=? WHERE id=?", (now(), prop["id"]))
        conn.execute("UPDATE requests SET status='Accepted' WHERE id=?", (request_id,))
        return agreement_result(conn.execute("SELECT * FROM agreements WHERE id=?", (aid,)).fetchone())


@app.get("/api/v1/requests/{request_id}/agreement", response_model=AgreementOut)
def get_agreement(request_id: str, x_demo_actor: str | None = Header(default=None)):
    actor = actor_id(x_demo_actor)
    with db() as conn:
        req = request_row(conn, request_id)
        member(req, actor)
        return agreement_result(agreement_row(conn, request_id))


@app.post("/api/v1/requests/{request_id}/agreement/confirm", response_model=AgreementOut)
def confirm_agreement(request_id: str, x_demo_actor: str | None = Header(default=None)):
    actor = actor_id(x_demo_actor)
    with db() as conn:
        req = request_row(conn, request_id)
        member(req, actor)
        agreement = agreement_row(conn, request_id)
        column = "client_confirmed" if actor == req["client_id"] else "freelancer_confirmed"
        if agreement[column]:
            raise HTTPException(409, "This participant has already confirmed")
        conn.execute(f"UPDATE agreements SET {column}=1 WHERE id=?", (agreement["id"],))
        return agreement_result(conn.execute("SELECT * FROM agreements WHERE id=?", (agreement["id"],)).fetchone())


@app.get("/api/v1/requests/{request_id}/milestones", response_model=list[MilestoneOut])
def get_milestones(request_id: str, x_demo_actor: str | None = Header(default=None)):
    actor = actor_id(x_demo_actor)
    with db() as conn:
        req = request_row(conn, request_id)
        member(req, actor)
        prop = proposal_row(conn, request_id)
        return [dict(row) for row in conn.execute("SELECT * FROM milestones WHERE proposal_id=? ORDER BY position", (prop["id"],)).fetchall()]


def active_agreement(conn: sqlite3.Connection, request_id: str):
    agreement = agreement_row(conn, request_id)
    if not (agreement["client_confirmed"] and agreement["freelancer_confirmed"]):
        raise HTTPException(409, "Both parties must confirm the agreement first")
    return agreement


def milestone_row(conn: sqlite3.Connection, request_id: str, milestone_id: str) -> sqlite3.Row:
    row = conn.execute("""SELECT m.* FROM milestones m JOIN proposals p ON p.id=m.proposal_id
                          WHERE p.request_id=? AND m.id=?""", (request_id, milestone_id)).fetchone()
    if not row:
        raise HTTPException(404, "Milestone not found")
    return row


@app.post("/api/v1/requests/{request_id}/milestones/{milestone_id}/submit", response_model=MilestoneOut)
def submit_evidence(request_id: str, milestone_id: str, body: EvidenceInput, x_demo_actor: str | None = Header(default=None)):
    actor = actor_id(x_demo_actor)
    with db() as conn:
        req = request_row(conn, request_id)
        if actor != req["freelancer_id"]:
            raise HTTPException(403, "Only assigned freelancer may submit evidence")
        active_agreement(conn, request_id)
        row = milestone_row(conn, request_id, milestone_id)
        if row["status"] not in ("Upcoming", "In progress", "Changes requested"):
            raise HTTPException(409, "Milestone cannot be submitted in current state")
        conn.execute("UPDATE milestones SET status='In review',evidence=?,feedback='' WHERE id=?", (body.evidence, milestone_id))
        return dict(milestone_row(conn, request_id, milestone_id))


@app.post("/api/v1/requests/{request_id}/milestones/{milestone_id}/review", response_model=MilestoneOut)
def review_milestone(request_id: str, milestone_id: str, body: ReviewInput, x_demo_actor: str | None = Header(default=None)):
    actor = actor_id(x_demo_actor)
    with db() as conn:
        req = request_row(conn, request_id)
        if actor != req["client_id"]:
            raise HTTPException(403, "Only client may review deliverables")
        active_agreement(conn, request_id)
        row = milestone_row(conn, request_id, milestone_id)
        if row["status"] != "In review":
            raise HTTPException(409, "Milestone must be submitted before review")
        status = "Approved" if body.approve else "Changes requested"
        conn.execute("UPDATE milestones SET status=?,feedback=? WHERE id=?", (status, body.feedback, milestone_id))
        return dict(milestone_row(conn, request_id, milestone_id))


# Additive commerce endpoints. Existing request/proposal/milestone routes unchanged.
import sys
from . import commerce
commerce.setup(sys.modules[__name__])
app.include_router(commerce.router)
