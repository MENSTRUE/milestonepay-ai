# MilestonePay AI — Demo Backend v0.1

A small **isolated demo API**, not a production payments or authentication service. It persists client project requests in SQLite. It does **not** process real payments, verify identity, or run AI.

## Run (Windows PowerShell)

From repository root:

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000
```

Open http://127.0.0.1:8000/docs.

## Demo workflow

1. `POST /api/v1/requests` with header `X-Demo-Actor: jordan` and JSON:

```json
{"title":"E-commerce Website Redesign","description":"Redesign a responsive e-commerce storefront.","budget_cents":150000,"currency":"USD","freelancer_id":"alex"}
```

2. `POST /api/v1/requests/{id}/send` with `X-Demo-Actor: jordan`.
3. `GET /api/v1/requests` with `X-Demo-Actor: alex` to see the sent request.

Amounts are integer cents to avoid float rounding.

## Test

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

## Security caveats

`X-Demo-Actor` is only a local demo persona selector: anyone can forge it. Never deploy this API publicly with this mechanism. Replace it with real authenticated sessions, authorization, CSRF protection where appropriate, rate limiting, and database migrations before production. PayPal credentials must stay server-side. Payment status must come from verified PayPal data, never a frontend toggle.

## Next

Wire the frontend's request operations to the backend API, then add proposal and milestone transitions. Only after server-side authorization is established should a separate PayPal Sandbox integration be added.
