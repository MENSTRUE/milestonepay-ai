# MilestonePay AI — API Reference / Referensi API

**Local base:** `http://127.0.0.1:8000/api/v1`  
**Interactive OpenAPI:** `http://127.0.0.1:8000/docs`  
**Actor header (DEMO ONLY):** `X-Demo-Actor: jordan` (Ahmad/client) or `X-Demo-Actor: alex` (Fulan/freelancer). **Not a secure auth token.**

Endpoint inventory derived from `backend/app/main.py` and `backend/app/commerce.py`. For exact request/response schemas and required fields, use the running OpenAPI page. The table describes what routes exist, not the permission outcome for every actor/state.

## Core workflow / Alur utama

| Method | Endpoint | Purpose / Tujuan |
|---|---|---|
| GET | `/health` | Service status and configuration booleans / status layanan |
| POST | `/requests` | Create draft request / membuat draft proyek |
| GET | `/requests` | List projects visible to persona / daftar proyek persona |
| POST | `/requests/{request_id}/send` | Send request to freelancer / kirim permintaan |
| GET | `/requests/{request_id}/proposals` | Read active proposal / baca proposal |
| POST | `/requests/{request_id}/proposals` | Submit proposal / ajukan proposal |
| POST | `/requests/{request_id}/proposals/revise` | Revise proposal / revisi |
| GET | `/requests/{request_id}/negotiations` | Negotiation history / riwayat negosiasi |
| POST | `/requests/{request_id}/negotiations` | Add negotiation / pesan negosiasi |
| POST | `/requests/{request_id}/proposals/request-revision` | Request changes / minta revisi |
| POST | `/requests/{request_id}/proposals/accept` | Accept proposal / terima proposal |
| GET | `/requests/{request_id}/agreement` | Read agreement / lihat kesepakatan |
| POST | `/requests/{request_id}/agreement/confirm` | Confirm as actor / konfirmasi pihak |
| GET | `/requests/{request_id}/milestones` | List milestone / daftar tahap kerja |
| POST | `/requests/{request_id}/milestones/{milestone_id}/submit` | Submit evidence / kirim bukti |
| POST | `/requests/{request_id}/milestones/{milestone_id}/review` | Client accept/reject / keputusan klien |

## AI and commerce / AI dan pembayaran

| Method | Endpoint | Purpose / Tujuan |
|---|---|---|
| POST | `/agent/plan` | Generate proposed milestone plan using local AI / saran perencanaan |
| POST | `/agent/review` | Review written evidence against acceptance criteria / evaluasi bukti teks |
| POST | `/paypal/invoices` | Create invoice via PayPal **Sandbox** / buat invoice virtual |
| POST | `/paypal/invoices/{invoice_id}/send` | Send invoice / kirim invoice |
| GET | `/paypal/invoices/{invoice_id}/sync` | Ask provider for current status / sinkronkan status |
| GET | `/requests/{request_id}/invoices` | Read persisted invoice history / riwayat invoice |
| GET | `/requests/{request_id}/audit` | Read and verify off-chain chain / jejak audit |

## Example (PowerShell) / Contoh

```powershell
$base = "http://127.0.0.1:8000/api/v1"
$h = @{ "X-Demo-Actor" = "jordan" }

# Safe GET: never charges or creates an invoice
Invoke-RestMethod -Method Get -Uri "$base/health" -Headers $h
Invoke-RestMethod -Method Get -Uri "$base/requests" -Headers $h

# Draft creation only; creates data in your LOCAL SQLite, so execute deliberately
# $payload = @{ title="Website redesign"; description="Responsive e-commerce UI"; budget_cents=45000; currency="USD"; freelancer_id="alex" } | ConvertTo-Json
# Invoke-RestMethod -Method Post -Uri "$base/requests" -Headers $h -Body $payload -ContentType "application/json"
```

## Status interpretation / Arti status

- A successful invoice **creation** does not mean the invoice has been sent or paid.
- A successful invoice **send** does not mean the client paid.
- **PAID** must be provider-reported and persisted after a sync; the database may be stale before that.
- AI findings are advisory, and milestone decisions must be made by a human client.

## Error categories / Kategori error

- `400`: invalid/missing demo actor or invalid request inputs (context-dependent).
- `403`: demo persona lacks permission for the specific action.
- `404`: missing resource or resource not visible in current state.
- `409`: workflow conflict/state mismatch (where applicable).
- `502/503`: upstream PayPal or Ollama connectivity/configuration failures.

See `/docs` for exact FastAPI behavior, Pydantic schemas and validated HTTP responses.
