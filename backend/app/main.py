"""MilestonePay AI — isolated demo backend. NOT production authentication or payments."""
from __future__ import annotations

import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from uuid import uuid4

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, ConfigDict

DB_PATH = Path(os.environ.get("MILESTONEPAY_DB", str(Path(__file__).resolve().parents[1] / "milestonepay.db")))

app = FastAPI(title="MilestonePay AI Demo API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"], allow_credentials=False, allow_methods=["GET", "POST"], allow_headers=["Content-Type", "X-Demo-Actor"])

@contextmanager
def db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DB_PATH, timeout=10)
    connection.row_factory = sqlite3.Row
    try:
        connection.execute("CREATE TABLE IF NOT EXISTS requests (id TEXT PRIMARY KEY, client_id TEXT NOT NULL, freelancer_id TEXT NOT NULL, title TEXT NOT NULL, description TEXT NOT NULL, budget_cents INTEGER NOT NULL, currency TEXT NOT NULL, status TEXT NOT NULL)")
        connection.commit()
        yield connection
        connection.commit()
    finally:
        connection.close()

class RequestCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=3, max_length=120)
    description: str = Field(min_length=10, max_length=5000)
    budget_cents: int = Field(ge=1, le=100_000_000)
    currency: str = Field(pattern="^USD$")
    freelancer_id: str = Field(pattern="^alex$")

class RequestOut(RequestCreate):
    id: str
    client_id: str
    status: str


def actor_id(value: str | None) -> str:
    # Explicitly a demo persona selector, NEVER authentication.
    if value not in {"alex", "jordan"}:
        raise HTTPException(status_code=400, detail="Demo requires X-Demo-Actor: alex or jordan")
    return value

@app.get("/api/v1/health")
def health():
    return {"status": "ok", "mode": "demo", "paypal_connected": False, "ai_connected": False}

@app.post("/api/v1/requests", response_model=RequestOut, status_code=201)
def create_request(body: RequestCreate, x_demo_actor: str | None = Header(default=None)):
    actor = actor_id(x_demo_actor)
    if actor != "jordan":
        raise HTTPException(status_code=403, detail="Only demo client Jordan may create requests")
    record = {**body.model_dump(), "id": str(uuid4()), "client_id": actor, "status": "Draft"}
    with db() as conn:
        conn.execute("INSERT INTO requests(id,client_id,freelancer_id,title,description,budget_cents,currency,status) VALUES (:id,:client_id,:freelancer_id,:title,:description,:budget_cents,:currency,:status)", record)
    return record

@app.get("/api/v1/requests", response_model=list[RequestOut])
def list_requests(x_demo_actor: str | None = Header(default=None)):
    actor = actor_id(x_demo_actor)
    with db() as conn:
        rows = conn.execute("SELECT * FROM requests WHERE (client_id=? OR freelancer_id=?) AND (client_id=? OR status <> 'Draft') ORDER BY rowid DESC", (actor, actor, actor)).fetchall()
    return [dict(row) for row in rows]

@app.post("/api/v1/requests/{request_id}/send", response_model=RequestOut)
def send_request(request_id: str, x_demo_actor: str | None = Header(default=None)):
    actor = actor_id(x_demo_actor)
    with db() as conn:
        row = conn.execute("SELECT * FROM requests WHERE id=?", (request_id,)).fetchone()
        if row is None:
            raise HTTPException(status_code=404, detail="Request not found")
        if actor != row["client_id"]:
            raise HTTPException(status_code=403, detail="Only request owner can send")
        if row["status"] != "Draft":
            raise HTTPException(status_code=409, detail="Only draft requests can be sent")
        conn.execute("UPDATE requests SET status='Sent' WHERE id=?", (request_id,))
        return {**dict(row), "status": "Sent"}
